---
title: Installation
description: Install Polyq and set up your first project.
---

# Installation

## Install

```bash
npm install polyq
# or
bun add polyq
# or
yarn add polyq
```

## Peer Dependencies

Polyq's peer dependencies are all optional — install only what your stack needs:

| Peer Dependency | When to install |
|---|---|
| `vite` | React/Svelte/SvelteKit/Remix projects |
| `webpack` | Next.js (webpack mode) or CRA projects |
| `@nuxt/kit` | Nuxt projects |
| `@coral-xyz/borsh` | If using SVM codegen (generated code imports it) |

## Quick Setup

### 1. Add to your bundler

**Vite (React, Svelte, etc.):**
```ts
// vite.config.ts
import { polyqVite } from 'polyq/vite'

export default defineConfig({
  plugins: [polyqVite()],
})
```

**Next.js:**
```ts
// next.config.ts
import { withPolyq } from 'polyq/next'

export default withPolyq({
  // your existing Next.js config
})
```

**Nuxt:**
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['polyq/nuxt'],
})
```

**SvelteKit:**
```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite'
import { polyqSvelteKit } from 'polyq/sveltekit'

export default defineConfig({
  plugins: [sveltekit(), ...polyqSvelteKit()],
})
```

**Remix:**
```ts
// vite.config.ts
import { vitePlugin as remix } from '@remix-run/dev'
import { polyqRemix } from 'polyq/remix'

export default defineConfig({
  plugins: [remix(), ...polyqRemix()],
})
```

### 2. Generate a config (optional)

```bash
npx polyq init
```

Creates a `polyq.config.ts` with auto-detected programs and chain-appropriate defaults.

### 3. Generate typed clients

```bash
npx polyq codegen
```

Generates TypeScript clients in `generated/` from your IDLs or ABIs.
