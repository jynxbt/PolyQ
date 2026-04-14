import { defineNuxtModule, addVitePlugin, useNuxt } from '@nuxt/kit'
import consola from 'consola'
import type { PolyqConfig } from '../../config/types'
import { polyqPolyfills } from '../vite/polyfills'
import { polyqIdlSync } from '../vite/idl-sync'
import { OPTIMIZE_DEPS } from '../../core/detect'

/**
 * Nuxt module for Polyq.
 *
 * Usage:
 * ```ts
 * // nuxt.config.ts — zero-config (auto-detects everything)
 * export default defineNuxtConfig({
 *   modules: ['polyq/nuxt'],
 * })
 *
 * // With inline options
 * export default defineNuxtConfig({
 *   modules: ['polyq/nuxt'],
 *   polyq: {
 *     polyfills: { buffer: true },
 *     schemaSync: {
 *       mapping: { my_program: ['packages/sdk/src/idl.json'] },
 *     },
 *   },
 * })
 * ```
 */
export default defineNuxtModule<PolyqConfig>({
  meta: {
    name: 'polyq',
    configKey: 'polyq',
  },
  defaults: {},
  async setup(options: PolyqConfig) {
    const nuxt = useNuxt()

    // Merge schemaSync and idlSync (schemaSync takes precedence)
    const sync = options.schemaSync ?? options.idlSync

    // If no inline options, try loading polyq.config.ts
    if (!options.polyfills && !sync) {
      try {
        const { loadConfig } = await import('../../config/loader')
        const config = await loadConfig(nuxt.options.rootDir)
        if (config.polyfills) options.polyfills = config.polyfills
        if (config.schemaSync ?? config.idlSync) {
          const loaded = config.schemaSync ?? config.idlSync
          if (loaded && !sync) {
            addVitePlugin(polyqIdlSync(loaded))
          }
        }
      } catch (e: any) {
        // Missing config file is fine — but syntax errors should be visible
        if (e?.code !== 'MODULE_NOT_FOUND' && e?.code !== 'ERR_MODULE_NOT_FOUND') {
          consola.warn(`Failed to load polyq.config.ts: ${e?.message ?? e}`)
        }
      }
    }

    // Add polyfill plugin
    addVitePlugin(polyqPolyfills(options.polyfills))

    // Add schema/IDL sync if configured inline
    if (sync) {
      addVitePlugin(polyqIdlSync(sync))
    }

    // Directly merge optimizeDeps via hook — ensures pre-bundling works
    // in dev mode regardless of plugin config hook timing
    nuxt.hook('vite:extendConfig', (config: any) => {
      if (!config.optimizeDeps) config.optimizeDeps = {}
      if (!config.optimizeDeps.include) config.optimizeDeps.include = []

      for (const dep of OPTIMIZE_DEPS) {
        if (!config.optimizeDeps.include.includes(dep)) {
          config.optimizeDeps.include.push(dep)
        }
      }
    })
  },
})
