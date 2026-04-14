---
title: Architecture
description: How Polyq is structured internally.
---

# Architecture

## Package Structure

```
src/
  adapters/           Framework-specific integrations
    vite/             Vite plugin (polyfills + IDL sync)
    webpack/          Webpack plugin (polyfills)
    nuxt/             Nuxt module
    next/             Next.js adapter (webpack + Turbopack)
    sveltekit/        SvelteKit helper
    remix/            Remix helper

  chains/             Chain-specific implementations
    types.ts          ChainProvider interface
    index.ts          Registry + auto-detection
    svm/              Solana: detection, config, codegen, validator, programs
    evm/              Ethereum: detection, config, codegen, validator, programs

  cli/                CLI entry point + commands
    commands/         dev, build, codegen, init, stop, status

  codegen/            Chain-agnostic codegen dispatcher
  config/             Config types, loader, resolver
  core/               Shared detection utilities
  workspace/          Stage-based orchestrator
    stages/           Docker, validator, programs, init, database, devserver
    health.ts         Polling-based health checks
    process.ts        Process management utilities

  index.ts            Main entry — re-exports everything
```

## Chain Provider Pattern

The central abstraction. Each chain (SVM, EVM) implements one `ChainProvider` interface. Generic code dispatches to the provider — no `if (chain === 'svm')` scattered across the codebase.

```
detectChain(root)  →  getChainProvider(chain)  →  provider.codegen(...)
                                                   provider.createValidatorStage(...)
                                                   provider.detectPrograms(...)
```

Original files (`codegen/generate.ts`, `workspace/stages/validator.ts`, etc.) are thin dispatchers that call the chain provider. All existing imports keep working.

## Config Resolution Flow

```
polyq.config.ts  (or auto-detection)
       ↓
  loadConfig()           Load via jiti
       ↓
  resolveConfig()        Detect chain, find root, discover programs
       ↓
  ResolvedPolyqConfig     Ready for use by CLI, adapters, orchestrator
```

The `resolveConfig` function:
1. Finds project root (walks up looking for `Anchor.toml`, `foundry.toml`, etc.)
2. Detects chain family
3. Auto-discovers programs via the chain provider
4. Merges `idlSync` → `schemaSync` and `idl` → `schema` for backwards compat
5. Sets default `schemaSync.watchDir` from the chain provider

## Workspace Orchestrator

```
buildStages(config, options)
       ↓
  [Docker, Validator, Build, Deploy, Init, Database, DevServer]
       ↓
  runStages(stages)      Sequential execution, skip-if-ready
       ↓
  stopStages(stages)     Reverse-order shutdown on SIGINT or failure
```

Each stage implements `{ check(), start(), stop() }`. The orchestrator:
- Skips stages that are already running (`check()` returns true)
- Uses health check polling instead of hardcoded sleeps
- Cleans up on failure or SIGINT
- Supports `--quick` (skip build/deploy) and `--reset` (nuclear option)

## Adapter Pattern

Framework adapters compose the underlying Vite/webpack plugins:

```
polyqVite()          →  [polyqPolyfills(), polyqIdlSync()]
withPolyq()          →  turbopack config + webpack config
polyqSvelteKit()     →  [polyqPolyfills(), polyqIdlSync()]
polyqRemix()         →  [polyqPolyfills(), polyqIdlSync()]
nuxt module         →  addVitePlugin() + vite:extendConfig hook
```

All adapters are thin — the real logic lives in `adapters/vite/polyfills.ts` and `adapters/vite/idl-sync.ts`.

## Codegen Pipeline

```
generateFromSchema(path, outDir, config, chain)
       ↓
  detectChain()  →  getChainProvider()
       ↓
  provider.generateClient(path, outDir, config)
       ↓
  SVM: parse IDL → types + PDAs + instructions (Borsh) + accounts (Borsh) + errors
  EVM: parse ABI → contract (const) + types (args + returns) + events + errors
```

SVM codegen:
- Topological sort for nested type layouts (handles circular refs via 3-color DFS)
- Borsh serialization for instruction args (`@coral-xyz/borsh`)
- Borsh deserialization for account fetchers
- Enum support via `borsh.rustEnum()`

EVM codegen:
- ABI type mapping (`address` → `` `0x${string}` ``, `uint256` → `bigint`)
- Function return types alongside input args
- Array types handled correctly (`bytes[]` → `` `0x${string}`[] ``)
- No runtime dependency — exports ABI as `const`
