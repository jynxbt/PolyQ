---
title: Nuxt Module
description: API reference for the Polyq Nuxt module.
---

# Nuxt Module

`polyq/nuxt` — Adds polyfills, schema sync, and optimizeDeps to your Nuxt app.

## Usage

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['polyq/nuxt'],
})
```

### With Inline Options

```ts
export default defineNuxtConfig({
  modules: ['polyq/nuxt'],
  polyq: {
    polyfills: { buffer: true },
    schemaSync: {
      mapping: {
        my_program: ['packages/sdk/src/idl.json'],
      },
    },
  },
})
```

## Auto-Config Loading

When no inline options are provided, the Nuxt module automatically tries to load `polyq.config.ts` from your project root. This means you can keep all Polyq config in one place:

```ts
// nuxt.config.ts — zero config
export default defineNuxtConfig({
  modules: ['polyq/nuxt'],
})

// polyq.config.ts — all settings here
export default definePolyqConfig({
  schemaSync: { mapping: { ... } },
  polyfills: { buffer: true },
})
```

## What It Does

1. **Adds polyfill Vite plugin** — `polyqPolyfills()` with your options
2. **Adds schema sync plugin** — `polyqIdlSync()` if configured
3. **Merges optimizeDeps** — Directly injects `buffer`, `@coral-xyz/anchor`, `bn.js`, `@solana/web3.js`, `bs58` into Vite's `optimizeDeps.include` via the `vite:extendConfig` hook

## Config Key

The module uses `polyq` as its config key:

```ts
export default defineNuxtConfig({
  polyq: {
    // PolyqConfig options
  },
})
```
