---
title: Smart Workspace
description: Orchestrate your local development environment with a single command.
---

# Smart Workspace

Polyq's workspace orchestrator replaces hundreds of lines of shell scripts with a stage-based pipeline that uses proper health check polling instead of hardcoded sleeps.

## Commands

```bash
polyq dev              # Start everything
polyq dev --quick      # Skip program builds (fast restart)
polyq dev --reset      # Drop DB, clear ledger, full rebuild
polyq dev --only validator,docker  # Start specific stages
polyq stop             # Stop validator + dev server
polyq stop --all       # Also stop Docker services
polyq status           # Show what's running
polyq build            # Build programs only
polyq build --features local --parallel
```

## Stages

`polyq dev` runs these stages sequentially:

| # | Stage | What it does |
|---|---|---|
| 1 | Docker | `docker compose up -d` for configured services |
| 2 | Validator | Start local node (`solana-test-validator` or `anvil`) |
| 3 | Build | `anchor build` / `forge build` (parallel when possible) |
| 4 | Deploy | `anchor deploy` / deploy script |
| 5 | Init | Post-deploy initialization (PDA setup, wallet funding) |
| 6 | Database | Extensions, migrations, seeding |
| 7 | Dev Server | Start your web app (foreground) |

Each stage has three methods:
- `check()` — Is it already running? Skip if yes.
- `start()` — Start with health check polling.
- `stop()` — Clean shutdown.

## Configuration

```ts
// polyq.config.ts
export default definePolyqConfig({
  workspace: {
    // SVM: passed to anchor build
    buildFeatures: ['local'],

    docker: {
      compose: 'docker-compose.yml',
      services: ['postgres', 'redis'],
      healthCheckPort: 5432,
    },

    validator: {
      tool: 'solana-test-validator', // or 'anvil', 'hardhat'
      rpcUrl: 'http://127.0.0.1:8899',
      flags: ['--quiet'],
    },

    init: {
      script: 'scripts/init-localnet.ts',
      runner: 'bun',
    },

    database: {
      url: 'postgresql://dev:dev@localhost:5432/myapp',
      extensions: ['pgcrypto', 'timescaledb'],
      migrationsDir: 'migrations',
      seed: { script: 'seed:local', runner: 'bun' },
    },

    devServer: {
      command: 'bun run dev',
      cwd: 'web',
    },
  },
})
```

## Health Check Polling

Unlike hardcoded `sleep 2` commands, Polyq polls services until they're ready:

- **Docker**: TCP port check on configured `healthCheckPort`
- **Validator**: HTTP health check on RPC URL (`/health` for SVM, JSON-RPC `eth_blockNumber` for EVM)
- **Database**: SQL connection test

Default: 500ms intervals, 30s timeout. Configurable per stage.

## Graceful Shutdown

`Ctrl+C` during `polyq dev` stops all running stages in reverse order. If a stage fails mid-pipeline, already-started stages are cleaned up automatically.

## Reset Mode

`polyq dev --reset` performs a full environment reset:

1. Stop validator, kill ports
2. Delete ledger (`test-ledger/`)
3. Drop and recreate database
4. Rebuild all programs
5. Redeploy, reinitialize, reseed
6. Start dev server
