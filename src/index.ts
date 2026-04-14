// Helm — Vite for Solana
// Framework-agnostic Solana DX: polyfills, IDL sync, codegen, workspace orchestration

export { defineHelmConfig } from './config/types'
export type {
  HelmConfig,
  ProgramConfig,
  IdlSyncConfig,
  CodegenConfig,
  PolyfillConfig,
  WorkspaceConfig,
} from './config/types'

// Core (shared across Vite + webpack)
export { detectSolanaPackages, resolvePolyfillNeeds, SOLANA_PACKAGES, OPTIMIZE_DEPS } from './core/detect'

// Vite plugin (React, Svelte, SvelteKit, Remix, Nuxt, etc.)
export { helmVite } from './vite/index'
export { helmPolyfills } from './vite/polyfills'
export { helmIdlSync } from './vite/idl-sync'

// Webpack plugin (Next.js, CRA, etc.)
export { helmWebpack } from './webpack/polyfills'

// Codegen
export { generateFromIdl } from './codegen/generate'

// Config
export { loadConfig } from './config/loader'

// Workspace
export { buildStages, runStages, stopStages, checkStages } from './workspace/orchestrator'
