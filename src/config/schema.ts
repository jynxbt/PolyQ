import * as v from 'valibot'
import { findMigrationHits } from './migrations'

const programType = v.picklist(['anchor', 'native', 'hardhat', 'foundry'])

// `strictObject` here ensures removed-in-0.4 fields like `idl` surface as
// an error instead of being silently ignored. The MIGRATIONS table
// translates that error into an actionable rename hint via the
// validateConfig pre-flight.
const programConfigSchema = v.strictObject({
  type: programType,
  path: v.string(),
  schema: v.optional(v.string()),
  programId: v.optional(v.record(v.string(), v.string())),
  deploy: v.optional(
    v.object({
      keypair: v.optional(v.string()),
      binary: v.optional(v.string()),
      script: v.optional(v.string()),
    }),
  ),
})

const schemaSyncSchema = v.object({
  watchDir: v.optional(v.string()),
  mapping: v.optional(v.record(v.string(), v.array(v.string()))),
})

const codegenSchema = v.object({
  outDir: v.string(),
  programs: v.optional(v.array(v.string())),
  features: v.optional(
    v.object({
      types: v.optional(v.boolean()),
      instructions: v.optional(v.boolean()),
      accounts: v.optional(v.boolean()),
      pda: v.optional(v.boolean()),
      errors: v.optional(v.boolean()),
      events: v.optional(v.boolean()),
      abi: v.optional(v.boolean()),
    }),
  ),
})

const polyfillsSchema = v.object({
  mode: v.optional(v.picklist(['auto', 'manual'])),
  buffer: v.optional(v.boolean()),
  global: v.optional(v.boolean()),
  process: v.optional(v.boolean()),
  crypto: v.optional(v.boolean()),
})

const workspaceSchema = v.object({
  buildFeatures: v.optional(v.array(v.string())),
  docker: v.optional(
    v.object({
      enabled: v.optional(v.boolean()),
      compose: v.optional(v.string()),
      services: v.optional(v.array(v.string())),
      healthCheckPort: v.optional(v.number()),
    }),
  ),
  validator: v.optional(
    v.object({
      tool: v.optional(v.string()),
      rpcUrl: v.optional(v.string()),
      flags: v.optional(v.array(v.string())),
      logFile: v.optional(v.string()),
      command: v.optional(v.string()),
      processName: v.optional(v.string()),
      ports: v.optional(v.array(v.number())),
    }),
  ),
  init: v.optional(
    v.object({
      script: v.string(),
      runner: v.optional(v.string()),
    }),
  ),
  database: v.optional(
    v.object({
      url: v.optional(v.string()),
      extensions: v.optional(v.array(v.string())),
      migrationsDir: v.optional(v.string()),
      seed: v.optional(
        v.object({
          script: v.string(),
          runner: v.optional(v.string()),
        }),
      ),
    }),
  ),
  devServer: v.optional(
    v.object({
      command: v.string(),
      cwd: v.optional(v.string()),
    }),
  ),
  healthChecks: v.optional(
    v.object({
      pollInterval: v.optional(v.number()),
      maxWait: v.optional(v.number()),
      requestTimeout: v.optional(v.number()),
    }),
  ),
})

export const polyqConfigSchema = v.strictObject({
  chain: v.optional(v.picklist(['svm', 'evm'])),
  root: v.optional(v.string()),
  programs: v.optional(v.record(v.string(), programConfigSchema)),
  schemaSync: v.optional(schemaSyncSchema),
  codegen: v.optional(codegenSchema),
  polyfills: v.optional(polyfillsSchema),
  workspace: v.optional(workspaceSchema),
})

/**
 * Format a valibot issue into a human-readable error line.
 * Includes the dotted path and a short explanation.
 */
function formatIssue(issue: v.BaseIssue<unknown>): string {
  const pathStr =
    issue.path?.map(p => (typeof p.key === 'number' ? `[${p.key}]` : p.key)).join('.') ?? ''
  const loc = pathStr ? `\`${pathStr}\`` : '(root)'
  return `  ${loc} — ${issue.message}`
}

/**
 * Validate a loaded polyq config object. Throws a multi-line Error listing
 * every problem.
 *
 * Flow:
 *   1. Pre-flight — scan `raw` against the migration table (see
 *      `./migrations`). `removed` hits throw here with a rename hint
 *      more actionable than valibot's generic "unknown key". Deprecated
 *      hits are accepted; callers that want to auto-fix them should
 *      call `migrateConfig()` before `validateConfig()`.
 *   2. Valibot — the strict-object schema catches every other shape
 *      issue (typos, wrong types, missing required fields).
 */
export function validateConfig(raw: unknown, source: string): void {
  const hits = findMigrationHits(raw).filter(h => h.entry.severity === 'removed')
  if (hits.length > 0) {
    throw new Error(
      [
        `Invalid configuration in ${source}:`,
        ...hits.map(
          h =>
            `  \`${h.fromPath}\` was removed in polyq ${h.entry.since} — rename to \`${h.entry.replacement}\`.`,
        ),
        '',
        'See CHANGELOG.md for the full migration.',
      ].join('\n'),
    )
  }

  const result = v.safeParse(polyqConfigSchema, raw)
  if (result.success) return

  const lines = [
    `Invalid configuration in ${source}:`,
    ...result.issues.map(formatIssue),
    '',
    'See https://polyq.jxbt.xyz for the full option reference.',
  ]
  throw new Error(lines.join('\n'))
}
