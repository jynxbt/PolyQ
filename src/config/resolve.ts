import { resolve } from 'pathe'
import type { PolyqConfig, ResolvedPolyqConfig } from './types'
import { detectChain, findProjectRoot, getChainProvider } from '../chains'

/**
 * Resolve a PolyqConfig by auto-detecting chain, root, and programs.
 */
export function resolveConfig(
  config: PolyqConfig,
  cwd: string,
): ResolvedPolyqConfig {
  const root = config.root ? resolve(cwd, config.root) : findProjectRoot(cwd)
  const chain = config.chain ?? detectChain(root)
  const provider = getChainProvider(chain)

  const programs = config.programs ?? provider.detectPrograms(root)

  // Migrate per-program idl → schema for backwards compat
  if (programs) {
    for (const prog of Object.values(programs)) {
      if (!prog.schema && prog.idl) {
        prog.schema = prog.idl
      }
    }
  }

  // Merge idlSync into schemaSync for backwards compat
  const schemaSync = config.schemaSync ?? config.idlSync ?? {
    watchDir: resolve(root, provider.defaultArtifactDir),
  }

  return {
    ...config,
    root,
    resolvedChain: chain,
    _chain: chain,
    programs,
    schemaSync,
    idlSync: schemaSync,
  }
}

/**
 * @deprecated Use detectProgramsFromAnchor from 'polyq/chains/svm'
 */
export { detectProgramsFromAnchor } from '../chains/svm/config'
