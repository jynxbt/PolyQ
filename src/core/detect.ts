import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'pathe'

/** Known Solana ecosystem packages that require polyfills */
export const SOLANA_PACKAGES = [
  '@solana/web3.js',
  '@coral-xyz/anchor',
  '@coral-xyz/borsh',
  '@solana/spl-token',
  '@solana/kit',
  '@metaplex-foundation/umi',
  'tweetnacl',
  'bs58',
]

/** Packages that benefit from pre-bundling (Vite optimizeDeps) */
export const OPTIMIZE_DEPS = [
  'buffer',
  '@coral-xyz/anchor',
  'bn.js',
  '@solana/web3.js',
  'bs58',
]

/** Node built-ins that Solana libs import but browsers lack */
export const NODE_POLYFILLS = {
  buffer: 'buffer/',
  crypto: 'crypto-browserify',
  stream: 'stream-browserify',
  http: 'stream-http',
  https: 'https-browserify',
  zlib: 'browserify-zlib',
  url: 'url/',
} as const

/**
 * Detect which Solana packages are in a project's dependencies.
 */
export function detectSolanaPackages(root: string): string[] {
  const pkgPath = resolve(root, 'package.json')
  if (!existsSync(pkgPath)) return []

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }
    return SOLANA_PACKAGES.filter(p => p in allDeps)
  } catch {
    return []
  }
}

/**
 * Determine which polyfills are needed based on detected packages.
 * Returns a normalized set of flags.
 */
export interface PolyfillNeeds {
  global: boolean
  buffer: boolean
  crypto: boolean
  process: boolean
}

export function resolvePolyfillNeeds(
  detected: string[],
  overrides?: Partial<PolyfillNeeds>,
): PolyfillNeeds {
  const hasSolana = detected.length > 0

  return {
    global: overrides?.global ?? hasSolana,
    buffer: overrides?.buffer ?? hasSolana,
    crypto: overrides?.crypto ?? false,
    process: overrides?.process ?? false,
  }
}
