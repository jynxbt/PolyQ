---
title: Next.js Adapter
description: API reference for the Next.js adapter (webpack + Turbopack).
---

# Next.js Adapter

`polyq/next` — Supports both webpack and Turbopack bundlers.

## `withPolyq(nextConfig, options?)`

Wraps your Next.js config with blockchain polyfills for both bundlers.

```ts
import { withPolyq } from 'polyq/next'

const nextConfig = {
  // your existing config
}

export default withPolyq(nextConfig)
```

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `nextConfig` | `NextConfig` | Your existing Next.js configuration |
| `options` | `PolyqNextOptions` | Optional polyfill and sync settings |

**Returns:** `NextConfig`

### What It Does

**Turbopack** (Next.js 15+):
- Adds `turbopack.resolveAlias` entries for `fs`, `net`, `tls` (browser stubs)
- Adds `buffer` alias to `buffer/` npm package
- Preserves existing `resolveAlias` entries — won't overwrite your custom aliases

**Webpack** (fallback):
- Adds `resolve.fallback` for `buffer` (and optionally `crypto`, `stream`)
- Injects `ProvidePlugin` for `Buffer` global
- Only applies to client-side builds (skips server and edge runtime gets polyfills too)

### With Options

```ts
export default withPolyq(nextConfig, {
  polyfills: {
    mode: 'manual',
    buffer: true,
    crypto: true,
  },
})
```

### Preserving Existing Config

`withPolyq` spreads your config and chains the webpack function:

```ts
// Your existing webpack customization is preserved
const nextConfig = {
  turbopack: {
    root: path.join(__dirname, '..'),
    resolveAlias: {
      // Your custom aliases are kept
      '@/lib': './src/lib',
    },
  },
  webpack(config, context) {
    // Your custom webpack config still runs
    config.externals.push('some-package')
    return config
  },
}

export default withPolyq(nextConfig) // Both turbopack + webpack preserved
```
