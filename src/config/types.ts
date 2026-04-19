import type { ChainFamily, ProgramType } from '../chains/types'

export type { ChainFamily, ProgramType }

export interface PolyqConfig {
  /** Chain family — auto-detected if omitted */
  chain?: ChainFamily

  /** Project root directory (auto-detected from config files) */
  root?: string

  /** Program/contract definitions */
  programs?: Record<string, ProgramConfig>

  /** Schema/artifact sync configuration */
  schemaSync?: SchemaSyncConfig

  /** Codegen configuration */
  codegen?: CodegenConfig

  /** Polyfill configuration */
  polyfills?: PolyfillConfig

  /** Workspace orchestration (for `polyq dev`) */
  workspace?: WorkspaceConfig
}

export interface ProgramConfig {
  /** Program/contract type — determines build/deploy toolchain */
  type: ProgramType

  /** Path to the program/contract directory (relative to root) */
  path: string

  /** Path to the schema file (IDL for SVM, ABI for EVM) */
  schema?: string

  /** Program/contract identifiers per network */
  programId?: Record<string, string>

  /** Deployment config */
  deploy?: {
    keypair?: string
    binary?: string
    script?: string
  }
}

export interface SchemaSyncConfig {
  /** Directory to watch for schema changes */
  watchDir?: string

  /** Map schema name → destination paths */
  mapping?: Record<string, string[]>
}

export interface CodegenConfig {
  /** Output directory for generated TypeScript */
  outDir: string

  /**
   * Codegen output flavor.
   *
   * - `'legacy'` (default) emits hand-rolled helpers against `@coral-xyz/borsh` +
   *   `@solana/web3.js` v1 for SVM and bare ABI constants for EVM.
   * - `'kit'` (SVM only) delegates to Codama to emit `@solana/kit`-flavored clients.
   *   Requires `codama`, `@codama/nodes-from-anchor`, and `@codama/renderers-js`
   *   to be installed as peer deps.
   * - `'viem'` (EVM only) emits `as const`-asserted ABIs wrapped for `viem`'s
   *   `getContract`. Requires `viem` as a peer dep in consumer projects.
   */
  mode?: 'legacy' | 'kit' | 'viem'

  /**
   * SPDX license identifier to write at the top of every generated file.
   * Default: `'MIT'`. Set to any SPDX string (e.g. `'Apache-2.0'`,
   * `'UNLICENSED'`) or `false` to omit the header entirely.
   */
  license?: string | false

  /** Which programs to generate clients for */
  programs?: string[]

  /** What to generate */
  features?: {
    types?: boolean
    instructions?: boolean
    accounts?: boolean
    pda?: boolean
    errors?: boolean
    events?: boolean
    abi?: boolean
  }
}

export interface PolyfillConfig {
  /** Detection mode: 'auto' scans package.json, 'manual' uses explicit flags */
  mode?: 'auto' | 'manual'

  /** Explicit polyfill toggles (used when mode is 'manual') */
  buffer?: boolean
  global?: boolean
  process?: boolean
  crypto?: boolean
}

export interface WorkspaceConfig {
  /** Build features (e.g., ['local'] for Solana) */
  buildFeatures?: string[]

  /** Docker compose configuration */
  docker?: {
    enabled?: boolean
    compose?: string
    services?: string[]
    /** Port to health-check for readiness (default: 5432) */
    healthCheckPort?: number
  }

  /** Local node/validator settings */
  validator?: {
    /**
     * Built-in tool name. SVM: `solana-test-validator`. EVM: `anvil`, `hardhat`, `ganache`.
     * For anything else, leave this as any string and set `command` to the executable.
     */
    tool?: string
    /** RPC URL. The port is parsed and used for cleanup / health checks. */
    rpcUrl?: string
    /** Extra CLI flags passed to the validator binary */
    flags?: string[]
    /** Log file for the detached validator process */
    logFile?: string
    /**
     * Override the executable command (EVM only, for custom tools).
     * If omitted, falls back to the built-in map for known `tool` values.
     */
    command?: string
    /**
     * Process name used by `isProcessRunning` / `killByPattern`. Defaults to `tool`.
     * Set this when `command` is an indirect runner (e.g. `npx`, `bun`) so cleanup
     * targets the real process.
     */
    processName?: string
    /**
     * Ports to kill before start and after stop. When omitted, defaults are
     * derived from `rpcUrl` and the chain family.
     */
    ports?: number[]
  }

  /** Post-deploy initialization script */
  init?: {
    script: string
    runner?: string
  }

  /** Database configuration */
  database?: {
    url?: string
    /** PostgreSQL extensions to enable (default: none) */
    extensions?: string[]
    migrationsDir?: string
    seed?: {
      script: string
      runner?: string
    }
  }

  /** Dev server to start after orchestration */
  devServer?: {
    command: string
    cwd?: string
  }

  /** Health check tuning */
  healthChecks?: HealthCheckTuning
}

/**
 * Tune how polyq polls stages for readiness.
 * All fields are optional and fall back to per-stage defaults.
 */
export interface HealthCheckTuning {
  /** ms between polls (default: 1000) */
  pollInterval?: number
  /** ms before a stage times out (default: 30000) */
  maxWait?: number
  /** ms per individual HTTP/TCP probe (default: 2000) */
  requestTimeout?: number
}

export type ResolvedPolyqConfig = Required<Pick<PolyqConfig, 'root'>> &
  PolyqConfig & {
    /** Resolved chain family. Always set by resolveConfig(). */
    resolvedChain: ChainFamily
  }

export function definePolyqConfig(config: PolyqConfig): PolyqConfig {
  return config
}
