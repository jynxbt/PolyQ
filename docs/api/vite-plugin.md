---
title: Vite Plugin
description: API reference for the Polyq Vite plugin.
---

# Vite Plugin

`polyq/vite` — Works with React, Svelte, SvelteKit, Remix, and any Vite project.

## `polyqVite(config?)`

Returns an array of Vite plugins that handle polyfills and schema sync.

```ts
import { polyqVite } from 'polyq/vite'

export default defineConfig({
  plugins: [polyqVite()],
})
```

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `config` | `PolyqConfig` | Optional. Polyfill and schema sync settings. |

**Returns:** `Plugin[]`

### With Options

```ts
polyqVite({
  polyfills: { mode: 'manual', buffer: true },
  schemaSync: {
    watchDir: 'target/idl',
    mapping: { my_program: ['src/idl.json'] },
  },
})
```

## `polyqPolyfills(options?)`

Standalone polyfill plugin. Auto-detects blockchain dependencies and configures Vite.

```ts
import { polyqPolyfills } from 'polyq/vite'
```

**Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `options.mode` | `'auto' \| 'manual'` | `'auto'` | Auto-detect from package.json or use explicit flags |
| `options.buffer` | `boolean` | `true` (auto) | Alias `buffer` to npm `buffer/` package |
| `options.global` | `boolean` | `true` (auto) | Define `global` as `globalThis` |
| `options.crypto` | `boolean` | `false` | Alias `crypto` to `crypto-browserify` |
| `options.process` | `boolean` | `false` | Alias `process` to `process/browser` |

**Returns:** `Plugin`

## `polyqIdlSync(options?)`

Standalone schema sync plugin with HMR.

```ts
import { polyqIdlSync } from 'polyq/vite'
```

**Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `options.watchDir` | `string` | `'target/idl'` | Directory to watch for changes |
| `options.mapping` | `Record<string, string[]>` | `{}` | Map schema name → destination paths |

**Returns:** `Plugin`
