---
title: Introduction
description: What Polyq is and why it exists.
---

# Introduction

Polyq is a DX toolkit for blockchain developers. It handles the repetitive, error-prone parts of building dApps — polyfills, schema syncing, type generation, and local environment orchestration — so you can focus on your product.

## The Problem

Every blockchain frontend project hits the same walls:

- **Polyfill hell** — `Buffer is not defined`, `global is not defined`, `crypto` errors. Solana libraries need Node.js globals that browsers don't have. You end up copy-pasting Vite/webpack config from Stack Overflow.
- **Manual schema syncing** — After every `anchor build` or `forge build`, you manually copy IDL/ABI files to your frontend. Forget once, and your types are stale.
- **Hand-written clients** — You write hundreds of lines of instruction builders, PDA derivers, and account fetchers by hand, then maintain them every time the contract changes.
- **Fragile dev scripts** — Your `localnet.sh` is 500+ lines of hardcoded sleeps, sequential builds, and no error handling.

## The Solution

Polyq replaces all of that with a single library:

```bash
npm install polyq
```

- **Zero-config polyfills** — Detects your blockchain dependencies and configures Vite/webpack automatically.
- **Schema sync + HMR** — Watches `target/idl/` or `out/`, copies to your frontend, triggers hot reload.
- **Codegen** — Generates typed TypeScript clients from Anchor IDLs or Solidity ABIs. Full Borsh serialization for Solana, typed ABI exports for EVM.
- **Smart workspace** — Stage-based orchestration with health check polling. `polyq dev` replaces your shell scripts.

## Chain Support

Polyq supports both ecosystems:

| | SVM (Solana) | EVM (Ethereum) |
|---|---|---|
| Detection | `Anchor.toml` | `foundry.toml`, `hardhat.config.ts` |
| Codegen | Anchor IDL → types, instructions, PDAs, accounts, errors | Solidity ABI → types, contract, events, errors |
| Validator | `solana-test-validator` | `anvil`, `hardhat node`, `ganache` |
| Build | `anchor build`, `cargo build-sbf` | `forge build`, `hardhat compile` |

Auto-detected from your project files — no manual configuration needed.

## Framework Support

Works with any frontend framework:

| Framework | Import | Bundler |
|---|---|---|
| React / Vite | `polyq/vite` | Vite |
| Next.js | `polyq/next` | webpack + Turbopack |
| SvelteKit | `polyq/sveltekit` | Vite |
| Remix | `polyq/remix` | Vite |
| Nuxt | `polyq/nuxt` | Vite |
| Raw webpack | `polyq/webpack` | webpack |
