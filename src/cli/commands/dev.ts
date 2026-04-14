import { defineCommand } from 'citty'
import consola from 'consola'
import { loadConfig } from '../../config/loader'
import { buildStages, runStages, stopStages } from '../../workspace/orchestrator'

export default defineCommand({
  meta: {
    name: 'dev',
    description: 'Start development environment',
  },
  args: {
    quick: {
      type: 'boolean',
      description: 'Skip program builds',
      default: false,
    },
    reset: {
      type: 'boolean',
      description: 'Full reset before starting (drop DB, restart validator, rebuild)',
      default: false,
    },
    only: {
      type: 'string',
      description: 'Run only specific stages (comma-separated: docker,validator,programs,database)',
    },
  },
  async run({ args }) {
    const config = await loadConfig()

    if (!config.workspace) {
      consola.error('No workspace config found. Add a `workspace` section to polyq.config.ts')
      consola.info('Run `polyq init` to generate a config file')
      process.exit(1)
    }

    const stages = buildStages(config, {
      quick: args.quick,
      reset: args.reset,
      only: args.only?.split(',').map(s => s.trim()),
    })

    if (stages.length === 0) {
      consola.warn('No stages to run')
      return
    }

    consola.box(`Polyq Dev${args.quick ? ' (quick)' : ''}${args.reset ? ' (reset)' : ''}`)

    // Handle graceful shutdown — stop all running stages before exit
    let shuttingDown = false
    const cleanup = async () => {
      if (shuttingDown) return
      shuttingDown = true
      consola.info('\nShutting down services...')
      await stopStages(stages)
      process.exit(0)
    }
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)

    try {
      await runStages(stages)
    } catch (err: any) {
      consola.error(`Failed: ${err.message}`)
      // Clean up stages that already started
      consola.info('Stopping started services...')
      await stopStages(stages)
      process.exit(1)
    }
  },
})
