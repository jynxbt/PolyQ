// Polyq — DX toolkit for Solana and EVM
// Polyfills, schema sync, codegen, and workspace orchestration

// Vite plugin (React, Svelte, SvelteKit, Remix, Nuxt, etc.)
export { polyqVite } from './adapters/vite/index'
export { polyqPolyfills } from './adapters/vite/polyfills'
export { polyqSchemaSync } from './adapters/vite/schema-sync'
// Webpack plugin (Next.js, CRA, etc.)
export { polyqWebpack } from './adapters/webpack/polyfills'
// Chain detection
export { detectChain, findProjectRoot, getChainProvider } from './chains'
export type { ChainDetectionResult, ChainProvider } from './chains/types'
// Codegen
export { generateFromSchema } from './codegen/generate'
// Config
export { loadConfig } from './config/loader'
export type {
  ChainFamily,
  CodegenConfig,
  PolyfillConfig,
  PolyqConfig,
  ProgramConfig,
  ProgramType,
  SchemaSyncConfig,
  WorkspaceConfig,
} from './config/types'
export { definePolyqConfig } from './config/types'
// Core (shared detection)
export {
  detectChainPackages,
  detectSolanaPackages,
  OPTIMIZE_DEPS,
  resolvePolyfillNeeds,
  SOLANA_PACKAGES,
} from './core/detect'

// Workspace
export { buildStages, checkStages, runStages, stopStages } from './workspace/orchestrator'
