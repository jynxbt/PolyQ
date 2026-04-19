import { resolve } from 'pathe'
import { detectChain, findProjectRoot, getChainProvider } from '../chains'
import type { PolyqConfig, ResolvedPolyqConfig } from './types'

/**
 * Resolve a PolyqConfig by auto-detecting chain, root, and programs.
 */
export function resolveConfig(config: PolyqConfig, cwd: string): ResolvedPolyqConfig {
  const root = config.root ? resolve(cwd, config.root) : findProjectRoot(cwd)
  const chain = config.chain ?? detectChain(root)
  const provider = getChainProvider(chain)

  const programs = config.programs ?? provider.detectPrograms(root)

  const schemaSync = config.schemaSync ?? {
    watchDir: resolve(root, provider.defaultArtifactDir),
  }

  return {
    ...config,
    root,
    resolvedChain: chain,
    ...(programs && { programs }),
    schemaSync,
  }
}
