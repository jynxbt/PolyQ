---
title: Polyfills
description: How Polyq handles Node.js polyfills for blockchain libraries.
---

# Polyfills

Blockchain libraries (Anchor, web3.js, ethers) import Node.js built-ins that browsers don't have. Polyq detects these dependencies and configures your bundler automatically.

## How It Works

1. Polyq scans your `package.json` for known blockchain packages
2. If SVM packages are found (`@solana/web3.js`, `@coral-xyz/anchor`, etc.), it applies:
   - `global` → `globalThis`
   - `buffer` → npm `buffer/` package
   - `optimizeDeps.include` for Vite pre-bundling
3. SSR builds are skipped — Node.js already has these globals

EVM packages (`ethers`, `viem`, `wagmi`) are detected but don't need Buffer/global polyfills.

## Zero Config

For most projects, just add the plugin — no configuration needed:

```ts
// Vite
import { polyqVite } from 'polyq/vite'
export default defineConfig({ plugins: [polyqVite()] })
```

```ts
// Next.js (webpack + Turbopack)
import { withPolyq } from 'polyq/next'
export default withPolyq(nextConfig)
```

```ts
// Nuxt
export default defineNuxtConfig({ modules: ['polyq/nuxt'] })
```

## Manual Mode

Override auto-detection when you need explicit control:

```ts
polyqVite({
  polyfills: {
    mode: 'manual',
    buffer: true,
    global: true,
    crypto: false,
    process: false,
  },
})
```

## Next.js and Turbopack

Next.js 15+ uses Turbopack by default. Polyq's `withPolyq()` handles both bundlers:

- **Turbopack**: Adds `turbopack.resolveAlias` entries for `fs`, `net`, `tls` (browser stubs) and `buffer`
- **Webpack**: Adds `resolve.fallback` + `ProvidePlugin` for Buffer/global injection

Existing Turbopack config is preserved — Polyq only adds entries for modules not already aliased.

```ts
// before: manual turbopack config
turbopack: {
  resolveAlias: {
    fs: { browser: './lib/empty.ts' },
    net: { browser: './lib/empty.ts' },
    tls: { browser: './lib/empty.ts' },
  },
}

// after: Polyq handles it
import { withPolyq } from 'polyq/next'
export default withPolyq(nextConfig)
```

## What Gets Polyfilled

| Package | Polyfill | Why |
|---|---|---|
| `buffer` | `buffer/` npm package | Anchor/web3.js use `Buffer` for keypairs, transactions |
| `global` | `globalThis` | Node.js `global` object referenced by Solana libs |
| `fs`, `net`, `tls` | Empty stubs (Next.js only) | Transitive imports from Anchor that aren't used in browser |
