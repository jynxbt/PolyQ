---
title: CLI Commands
description: Complete reference for the Polyq CLI.
---

# CLI Commands

## `polyq init`

Generate a `polyq.config.ts` with auto-detected settings.

```bash
polyq init
```

- Detects chain from project files (`Anchor.toml`, `foundry.toml`)
- Discovers programs/contracts
- Generates chain-appropriate workspace defaults (validator tool, RPC port)
- Skips if `polyq.config.ts` already exists

## `polyq codegen`

Generate TypeScript clients from contract schemas.

```bash
polyq codegen                          # All schemas, auto-detect chain
polyq codegen --idl path/to/schema.json  # Specific file
polyq codegen --out src/generated      # Custom output directory
polyq codegen --chain evm              # Force chain type
polyq codegen --watch                  # Watch + auto-build + regenerate
```

| Flag | Type | Default | Description |
|---|---|---|---|
| `--idl` | `string` | — | Path to specific schema file |
| `--out` | `string` | `generated` | Output directory |
| `--chain` | `svm \| evm` | auto-detected | Force chain family |
| `--watch` | `boolean` | `false` | Watch source files, auto-build, regenerate |

### Watch Mode

`--watch` monitors two things:
- **Source files** (`.rs` / `.sol`) — triggers `anchor build` or `forge build`, then regenerates
- **Artifact directory** — regenerates immediately on direct schema edits

## `polyq dev`

Start the full development environment.

```bash
polyq dev                              # All stages
polyq dev --quick                      # Skip build + deploy
polyq dev --reset                      # Nuclear reset: drop DB, clear ledger, rebuild
polyq dev --only validator,docker      # Specific stages only
```

| Flag | Type | Default | Description |
|---|---|---|---|
| `--quick` | `boolean` | `false` | Skip program build and deploy stages |
| `--reset` | `boolean` | `false` | Full reset before starting |
| `--only` | `string` | — | Comma-separated stage names to run |

Requires a `workspace` section in `polyq.config.ts`.

## `polyq stop`

Stop running development services.

```bash
polyq stop                             # Stop validator + dev server
polyq stop --all                       # Also stop Docker services
```

| Flag | Type | Default | Description |
|---|---|---|---|
| `--all` | `boolean` | `false` | Include Docker services in shutdown |

## `polyq status`

Show the status of development services.

```bash
polyq status
```

Checks each configured stage and reports running/stopped status.

## `polyq build`

Build programs/contracts.

```bash
polyq build                            # Default build
polyq build --features local           # With feature flags
polyq build --parallel                 # Build in parallel (default: true)
```

| Flag | Type | Default | Description |
|---|---|---|---|
| `--features` | `string` | — | Comma-separated build features |
| `--parallel` | `boolean` | `true` | Build programs in parallel |
