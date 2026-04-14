import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'pathe'
import consola from 'consola'
import type { Stage } from '../stage'
import { run, runSync } from '../process'

const logger = consola.withTag('helm:database')

export interface DatabaseStageOptions {
  /** PostgreSQL connection URL */
  url: string
  /** Path to migrations directory (relative to root) */
  migrationsDir?: string
  /** PostgreSQL extensions to enable */
  extensions?: string[]
  /** Seed script and runner */
  seed?: {
    script: string
    runner?: string
  }
  /** Project root */
  root: string
}

export function createDatabaseStage(options: DatabaseStageOptions): Stage {
  const migrationsDir = options.migrationsDir
    ? resolve(options.root, options.migrationsDir)
    : undefined
  const extensions = options.extensions ?? []

  return {
    name: 'Database',

    async check() {
      // Check if we can connect and if a known table exists
      const { ok } = runSync(
        `psql "${options.url}" -c "SELECT 1 FROM zenids LIMIT 0" 2>/dev/null`,
        { timeout: 5000 },
      )
      return ok
    },

    async start() {
      // Enable extensions
      for (const ext of extensions) {
        logger.info(`Enabling extension: ${ext}`)
        const { ok } = runSync(
          `psql "${options.url}" -c "CREATE EXTENSION IF NOT EXISTS ${ext}"`,
          { timeout: 10_000 },
        )
        if (!ok) {
          logger.warn(`Failed to enable extension: ${ext}`)
        }
      }

      // Run migrations
      if (migrationsDir && existsSync(migrationsDir)) {
        const files = readdirSync(migrationsDir)
          .filter(f => f.endsWith('.sql'))
          .sort()

        if (files.length > 0) {
          logger.info(`Running ${files.length} migrations...`)
          for (const file of files) {
            const filePath = resolve(migrationsDir, file)
            const { ok, output } = runSync(
              `psql -v ON_ERROR_STOP=1 "${options.url}" -f "${filePath}"`,
              { timeout: 30_000 },
            )
            if (!ok) {
              // Some migrations may fail if already applied — warn but continue
              logger.debug(`Migration ${file}: ${output}`)
            }
          }
          logger.success('Migrations complete')
        }
      }

      // Run seed script
      if (options.seed) {
        const runner = options.seed.runner ?? 'bun'
        const script = options.seed.script

        // Check if already seeded
        const { ok: seeded } = runSync(
          `psql "${options.url}" -c "SELECT 1 FROM zenids WHERE handle LIKE 'local_%' LIMIT 1" 2>/dev/null`,
          { timeout: 5000 },
        )

        if (!seeded) {
          logger.info('Seeding data...')
          const result = await run(runner, ['run', script], {
            cwd: options.root,
            label: 'seed',
          })
          if (result.exitCode !== 0) {
            logger.warn(`Seeding failed (exit ${result.exitCode}) — non-critical`)
          } else {
            logger.success('Seeding complete')
          }
        } else {
          logger.info('Database already seeded')
        }
      }
    },

    async stop() {
      // Nothing to stop — database persists
    },
  }
}

/**
 * Hard reset: drop and recreate the database, then run migrations and seed.
 */
export function createDatabaseResetStage(options: DatabaseStageOptions): Stage {
  const baseStage = createDatabaseStage(options)

  return {
    name: 'Database (reset)',
    check: baseStage.check,

    async start() {
      const url = new URL(options.url)
      const dbName = url.pathname.replace('/', '')

      // Connect to maintenance database
      url.pathname = '/postgres'
      const maintenanceUrl = url.toString()

      logger.info(`Dropping database: ${dbName}`)

      // Terminate existing connections
      runSync(
        `psql "${maintenanceUrl}" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid()"`,
        { timeout: 10_000 },
      )

      // Drop and recreate
      runSync(`psql "${maintenanceUrl}" -c "DROP DATABASE IF EXISTS ${dbName}"`, { timeout: 10_000 })
      runSync(`psql "${maintenanceUrl}" -c "CREATE DATABASE ${dbName}"`, { timeout: 10_000 })

      logger.success(`Database ${dbName} recreated`)

      // Now run base stage (extensions, migrations, seed)
      await baseStage.start()
    },

    stop: baseStage.stop,
  }
}
