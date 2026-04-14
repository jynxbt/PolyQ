# Helm

Vite for Solana. Framework-agnostic DX tooling — polyfills, IDL sync, codegen, and workspace orchestration.

Works with **React, Next.js, Svelte, SvelteKit, Remix, Nuxt**, or any Vite/webpack project.

## Install

```bash
npm install solana-helm
```

## Quick Start

### React / Vite

```ts
// vite.config.ts
import { helmVite } from 'solana-helm/vite'

export default defineConfig({
  plugins: [helmVite()],
})
```

### Next.js

```ts
// next.config.ts
import { withHelm } from 'solana-helm/next'

const nextConfig = { /* ... */ }
export default withHelm(nextConfig)
```

### SvelteKit

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite'
import { helmSvelteKit } from 'solana-helm/sveltekit'

export default defineConfig({
  plugins: [sveltekit(), ...helmSvelteKit()],
})
```

### Remix

```ts
// vite.config.ts
import { vitePlugin as remix } from '@remix-run/dev'
import { helmRemix } from 'solana-helm/remix'

export default defineConfig({
  plugins: [remix(), ...helmRemix()],
})
```

### Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['solana-helm/nuxt'],
  helm: {
    polyfills: { buffer: true },
    idlSync: {
      mapping: { my_program: ['packages/sdk/src/idl.json'] },
    },
  },
})
```

### Raw Webpack

```ts
// webpack.config.js
import { helmWebpack } from 'solana-helm/webpack'

const applyHelm = helmWebpack()

export default applyHelm({
  entry: './src/index.ts',
  // ...
})
```

## Features

### Automatic Polyfills

Zero-config. Detects Solana dependencies and auto-configures:
- `global` → `globalThis`
- `buffer` alias → npm `buffer` package
- `optimizeDeps` (Vite) / `resolve.fallback` + `ProvidePlugin` (webpack)

SSR-aware — polyfills only apply to client builds.

### IDL Sync + HMR

Watch `target/idl/` and auto-sync to your frontend on every `anchor build`:

```ts
// Any Vite-based framework
helmVite({
  idlSync: {
    watchDir: 'target/idl',
    mapping: {
      my_program: ['packages/sdk/src/idl.json'],
    },
  },
})
```

No manual copying, no page refresh. The Vite dev server picks up IDL changes via HMR.

### Codegen

Generate TypeScript clients from Anchor IDLs:

```bash
helm codegen                          # All IDLs in target/idl/
helm codegen --idl target/idl/my_program.json --out generated/
helm codegen --watch                  # Watch + regenerate
```

Generates:
- **Types** — TypeScript interfaces from IDL type definitions
- **PDAs** — `deriveFoo()` functions from IDL seed definitions
- **Instructions** — `createFooInstruction()` builders with typed accounts/args
- **Accounts** — Discriminator constants and fetch stubs
- **Errors** — Error enum and lookup function

### Smart Workspace (CLI)

Stage-based dev environment orchestration with proper health check polling:

```bash
helm dev              # Docker → Validator → Build → Deploy → Init → DB → Dev Server
helm dev --quick      # Skip program builds
helm dev --reset      # Drop DB, clear ledger, full rebuild
helm stop             # Stop services
helm stop --all       # Also stop Docker
helm status           # Show what's running
helm build            # Build programs
helm build --features local --parallel
```

Replaces hundreds of lines of shell scripts with a single config:

```ts
// helm.config.ts
import { defineHelmConfig } from 'solana-helm'

export default defineHelmConfig({
  workspace: {
    buildFeatures: ['local'],
    docker: { services: ['postgres'] },
    validator: { rpcUrl: 'http://127.0.0.1:8899' },
    init: { script: 'scripts/init.ts' },
    database: {
      url: 'postgresql://dev:dev@localhost:5433/myapp',
      migrationsDir: 'migrations',
      seed: { script: 'seed:dev' },
    },
    devServer: { command: 'bun run dev' },
  },
})
```

## Framework Support Matrix

| Feature | Vite (React, Svelte, etc.) | Next.js | SvelteKit | Remix | Nuxt |
|---|---|---|---|---|---|
| Auto Polyfills | `helmVite()` | `withHelm()` | `helmSvelteKit()` | `helmRemix()` | module |
| IDL Sync + HMR | yes | — | yes | yes | yes |
| Codegen (CLI) | yes | yes | yes | yes | yes |
| Smart Workspace | yes | yes | yes | yes | yes |

IDL Sync requires Vite's dev server for HMR. Next.js projects get polyfills + codegen + workspace, but not hot IDL reload.

## License

MIT
