---
title: Code Generation
description: Generate typed TypeScript clients from Anchor IDLs or Solidity ABIs.
---

# Code Generation

Polyq generates TypeScript clients from your contract schemas. Supports both Anchor IDLs (Solana) and Solidity ABIs (EVM).

## Quick Start

```bash
# Auto-detect chain and generate from all schemas
npx polyq codegen

# Specify a single schema
npx polyq codegen --idl target/idl/my_program.json

# Custom output directory
npx polyq codegen --out src/generated

# Watch mode — auto-build and regenerate on source changes
npx polyq codegen --watch
```

## SVM Output (Anchor IDL)

For each Anchor program, Polyq generates:

```
generated/my-program/
  types.ts          # TypeScript interfaces from IDL type definitions
  pda.ts            # PDA derivation helpers (findProgramAddressSync)
  instructions.ts   # Instruction builders with Borsh serialization
  accounts.ts       # Account fetchers with Borsh deserialization
  errors.ts         # Error enum and lookup function
  index.ts          # Barrel export
```

### Types

```ts
// generated/my-program/types.ts
export interface PoolState {
  authority: PublicKey
  tokenMint: PublicKey
  totalDeposits: bigint
  isActive: boolean
}
```

### PDA Helpers

```ts
// generated/my-program/pda.ts
export function derivePoolState(
  tokenMint: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), tokenMint.toBuffer()],
    programId,
  )
}
```

### Instructions (with Borsh Serialization)

```ts
// generated/my-program/instructions.ts
export function createSwapInstruction(
  accounts: SwapAccounts,
  args: SwapArgs,
): TransactionInstruction {
  const keys = [/* typed account metas */]
  const argsLayout = borsh.struct([
    borsh.u64('amountIn'),
    borsh.u64('minimumAmountOut'),
  ])
  const argsBuffer = Buffer.alloc(10240)
  const argsLen = argsLayout.encode(args, argsBuffer)
  const data = Buffer.concat([discriminator, argsBuffer.subarray(0, argsLen)])
  return new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
}
```

### Account Fetchers (with Borsh Deserialization)

```ts
// generated/my-program/accounts.ts
export async function fetchPoolState(
  connection: Connection,
  address: PublicKey,
): Promise<PoolState | null> {
  const accountInfo = await connection.getAccountInfo(address)
  if (!accountInfo) return null
  // Discriminator check + Borsh decode
  return poolStateAccountLayout.decode(accountInfo.data.subarray(8))
}
```

## EVM Output (Solidity ABI)

For each contract, Polyq generates:

```
generated/my-contract/
  contract.ts       # ABI const + typed address map
  types.ts          # Function input args + return types
  events.ts         # Event types
  errors.ts         # Custom error types
  index.ts          # Barrel export
```

### Contract ABI Export

```ts
// generated/my-contract/contract.ts
export const MY_CONTRACT_ABI = [/* full ABI */] as const
export type MyContractAbi = typeof MY_CONTRACT_ABI

export const MY_CONTRACT_ADDRESS: Record<string, `0x${string}`> = {
  // localhost: '0x...',
  // sepolia: '0x...',
}
```

### Typed Function Args + Returns

```ts
// generated/my-contract/types.ts
export interface SwapArgs {
  to: `0x${string}`
  amountIn: bigint
  amountOut: bigint
  route: `0x${string}`
}

export interface BalanceOfReturn {
  value: bigint
}
```

### Event Types

```ts
// generated/my-contract/events.ts
export interface TransferEvent {
  from: `0x${string}`
  to: `0x${string}`
  amount: bigint
}
```

## Watch Mode

`polyq codegen --watch` watches both source files and artifact directories:

**Source files** (`.rs` for Solana, `.sol` for EVM):
1. Detects change in `programs/**/*.rs` or `src/**/*.sol`
2. Runs `anchor build` or `forge build` automatically
3. Regenerates TypeScript after build completes

**Artifact directory** (`target/idl/` or `out/`):
1. Detects direct changes to IDL/ABI JSON files
2. Regenerates TypeScript immediately (no rebuild)

## Programmatic API

```ts
import { generateFromSchema } from 'polyq/codegen'

// Auto-detect chain
generateFromSchema('target/idl/my_program.json', 'generated/')

// Explicit chain
generateFromSchema('out/MyContract.sol/MyContract.json', 'generated/', undefined, 'evm')
```

```ts
// SVM-specific (backwards compatible)
import { generateFromIdl } from 'polyq/codegen'
generateFromIdl('target/idl/my_program.json', 'generated/')
```
