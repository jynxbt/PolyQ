---
title: Configuration
description: Configure Polyq for your project.
---

# Configuration

Polyq auto-detects most settings from your project files (`Anchor.toml`, `foundry.toml`, `package.json`). The config file is optional — use it to customize behavior.

## Config File

Create `polyq.config.ts` in your project root:

```ts
import { definePolyqConfig } from 'polyq'

export default definePolyqConfig({
  // All fields are optional — auto-detected when omitted
})
```

Or generate one automatically:

```bash
npx polyq init
```

## Full Config Reference

```ts
import { definePolyqConfig } from 'polyq'

export default definePolyqConfig({
  // Explicit chain override (auto-detected from project files)
  chain: 'svm', // 'svm' | 'evm'

  // Program/contract definitions (auto-detected from Anchor.toml / foundry.toml)
  programs: {
    myProgram: {
      type: 'anchor',           // 'anchor' | 'native' | 'hardhat' | 'foundry'
      path: 'programs/my-program',
      schema: 'target/idl/my_program.json',
      programId: {
        localnet: '11111111111111111111111111111111',
        devnet: '22222222222222222222222222222222',
      },
    },
  },

  // Schema/IDL file sync configuration
  schemaSync: {
    watchDir: 'target/idl',     // Directory to watch (auto-detected)
    mapping: {
      // IDL/ABI name → destination paths
      my_program: ['packages/sdk/src/idl.json'],
    },
  },

  // TypeScript codegen settings
  codegen: {
    outDir: 'generated',
    programs: ['myProgram'],    // Generate for specific programs only
    features: {
      types: true,              // TypeScript interfaces
      instructions: true,       // Instruction builders (SVM) / function types (EVM)
      accounts: true,           // Account fetchers (SVM only)
      pda: true,                // PDA derivers (SVM only)
      errors: true,             // Error enum
      events: true,             // Event types
    },
  },

  // Polyfill behavior
  polyfills: {
    mode: 'auto',               // 'auto' | 'manual'
    buffer: true,
    global: true,
    process: false,
    crypto: false,
  },

  // Workspace orchestration (for `polyq dev`)
  workspace: {
    buildFeatures: ['local'],

    docker: {
      enabled: true,
      compose: 'docker-compose.yml',
      services: ['postgres'],
      healthCheckPort: 5432,
    },

    validator: {
      tool: 'solana-test-validator',  // or 'anvil', 'hardhat'
      rpcUrl: 'http://127.0.0.1:8899',
      flags: ['--quiet'],
      logFile: '/tmp/polyq-validator.log',
    },

    init: {
      script: 'scripts/init.ts',
      runner: 'bun',
    },

    database: {
      url: 'postgresql://dev:dev@localhost:5432/myapp',
      extensions: ['pgcrypto'],
      migrationsDir: 'migrations',
      seed: { script: 'seed:dev', runner: 'bun' },
    },

    devServer: {
      command: 'bun run dev',
      cwd: 'web',
    },
  },
})
```

## Auto-Detection

When fields are omitted, Polyq auto-detects:

| Field | SVM Detection | EVM Detection |
|---|---|---|
| `chain` | `Anchor.toml` exists | `foundry.toml` or `hardhat.config.ts` exists |
| `programs` | Parsed from `Anchor.toml` `[programs.*]` sections | Solidity files in `src/` or `contracts/` |
| `schemaSync.watchDir` | `target/idl` | `out` (Foundry) or `artifacts` (Hardhat) |
| `validator.tool` | `solana-test-validator` | `anvil` (Foundry) or `hardhat` |
| `validator.rpcUrl` | `http://127.0.0.1:8899` | `http://127.0.0.1:8545` |

## Backwards Compatibility

Deprecated fields still work:

| Deprecated | Replacement |
|---|---|
| `idlSync` | `schemaSync` |
| `ProgramConfig.idl` | `ProgramConfig.schema` |
| `config._chain` | `config.resolvedChain` |
