---
title: Schema Sync + HMR
description: Auto-sync IDL and ABI files with hot module replacement.
---

# Schema Sync + HMR

Polyq watches your contract build output and syncs schema files to configured destinations, triggering Vite HMR so your frontend picks up changes without a page refresh.

## Setup

Add schema sync mapping to your bundler config:

```ts
// Vite
polyqVite({
  schemaSync: {
    watchDir: 'target/idl',
    mapping: {
      my_program: ['packages/sdk/src/idl.json'],
    },
  },
})
```

```ts
// Nuxt
export default defineNuxtConfig({
  modules: ['polyq/nuxt'],
  polyq: {
    schemaSync: {
      mapping: {
        my_program: ['packages/sdk/src/idl.json'],
      },
    },
  },
})
```

Or in `polyq.config.ts` (auto-loaded by the Nuxt module):

```ts
export default definePolyqConfig({
  schemaSync: {
    mapping: {
      my_program: ['packages/sdk/src/idl.json'],
    },
  },
})
```

## How It Works

1. You run `anchor build` (or `forge build`)
2. Polyq's file watcher (chokidar) detects the change in `target/idl/my_program.json`
3. The IDL/ABI is copied to all mapped destinations
4. Vite's module graph is invalidated for the destination files
5. HMR update is sent to the browser — your types refresh without a page reload

## Configuration

```ts
interface SchemaSyncConfig {
  // Directory to watch (default: auto-detected from chain)
  watchDir?: string

  // Map schema file name (without extension) → destination paths
  mapping?: Record<string, string[]>
}
```

## Multiple Destinations

A single schema can sync to multiple locations:

```ts
schemaSync: {
  mapping: {
    my_program: [
      'packages/sdk/src/idl.json',
      'web/src/idl/my_program.json',
      'admin/src/idl.json',
    ],
  },
}
```

## Framework Support

| Framework | HMR Support | Notes |
|---|---|---|
| Vite (React, Svelte, etc.) | Full HMR | Module graph invalidation + WebSocket update |
| SvelteKit | Full HMR | Uses Vite under the hood |
| Remix | Full HMR | Uses Vite under the hood |
| Nuxt | Full HMR | Uses Vite under the hood |
| Next.js | No HMR | Next.js/Turbopack doesn't expose HMR hooks. Schema files are still synced, but require a page refresh. |

## Backwards Compatibility

The `idlSync` config key still works as an alias for `schemaSync`:

```ts
// Both are equivalent
polyqVite({ idlSync: { mapping: { ... } } })
polyqVite({ schemaSync: { mapping: { ... } } })
```
