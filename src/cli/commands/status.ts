import { defineCommand } from 'citty'
import consola from 'consola'
import { loadConfig } from '../../config/loader'
import { buildStages, checkStages } from '../../workspace/orchestrator'

export default defineCommand({
  meta: {
    name: 'status',
    description: 'Show status of development services',
  },
  async run() {
    const config = await loadConfig()

    if (!config.workspace) {
      consola.error('No workspace config found')
      process.exit(1)
    }

    const stages = buildStages(config)
    const results = await checkStages(stages)

    consola.log('')
    for (const { name, running } of results) {
      const icon = running ? '\u2705' : '\u274C'
      consola.log(`  ${icon}  ${name}`)
    }
    consola.log('')
  },
})
