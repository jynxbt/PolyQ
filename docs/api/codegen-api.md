---
title: Codegen API
description: Programmatic API for TypeScript code generation.
---

# Codegen API

`polyq/codegen` — Generate TypeScript clients programmatically.

## `generateFromSchema(schemaPath, outDir, config?, chain?)`

Generate TypeScript client from a contract schema file. Auto-detects chain if not specified.

```ts
import { generateFromSchema } from 'polyq/codegen'

const result = generateFromSchema(
  'target/idl/my_program.json',
  'generated/',
)
```

**Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `schemaPath` | `string` | — | Path to IDL or ABI JSON file |
| `outDir` | `string` | — | Output directory for generated files |
| `config` | `Partial<CodegenConfig>` | all features | Feature flags |
| `chain` | `'svm' \| 'evm'` | auto-detected | Force chain type |

**Returns:** `CodegenOutput`

```ts
interface CodegenOutput {
  files: { path: string, content: string }[]
}
```

## `generateFromIdl(idlPath, outDir, config?)`

SVM-specific alias. Calls `generateFromSchema` with `chain: 'svm'`.

```ts
import { generateFromIdl } from 'polyq/codegen'

generateFromIdl('target/idl/my_program.json', 'generated/')
```

## `CodegenConfig`

```ts
interface CodegenConfig {
  outDir: string
  programs?: string[]
  features?: {
    types?: boolean         // TypeScript interfaces
    instructions?: boolean  // Instruction builders (SVM) / function types (EVM)
    accounts?: boolean      // Account fetchers with Borsh deserialization (SVM)
    pda?: boolean          // PDA derivation helpers (SVM)
    errors?: boolean       // Error enum + lookup
    events?: boolean       // Event types
  }
}
```

## SVM Generated Files

| File | Contains |
|---|---|
| `types.ts` | Interfaces for all IDL type definitions (structs + enums) |
| `pda.ts` | `deriveFoo()` functions using `PublicKey.findProgramAddressSync` |
| `instructions.ts` | `createFooInstruction()` with full Borsh serialization via `@coral-xyz/borsh` |
| `accounts.ts` | `fetchFoo()` with discriminator check + Borsh deserialization |
| `errors.ts` | `ProgramError` enum + `getProgramError(code)` lookup |
| `index.ts` | Barrel re-export |

## EVM Generated Files

| File | Contains |
|---|---|
| `contract.ts` | ABI as `const` assertion + typed address map per network |
| `types.ts` | `FooArgs` input interfaces + `FooReturn` output interfaces |
| `events.ts` | `FooEvent` interfaces with indexed fields |
| `errors.ts` | Custom error types (parameterized and empty) |
| `index.ts` | Barrel re-export |

## Type Mapping

### SVM (Anchor IDL → TypeScript)

| IDL Type | TypeScript | Borsh Codec |
|---|---|---|
| `bool` | `boolean` | `borsh.bool()` |
| `u8`, `u16`, `u32` | `number` | `borsh.u8()`, etc. |
| `u64`, `u128`, `u256` | `bigint` | `borsh.u64()`, etc. |
| `i8` – `i256` | `number` / `bigint` | `borsh.i8()`, etc. |
| `string` | `string` | `borsh.str()` |
| `pubkey` | `PublicKey` | `borsh.publicKey()` |
| `bytes` | `Uint8Array` | `borsh.vecU8()` |
| `vec<T>` | `T[]` | `borsh.vec(T)` |
| `option<T>` | `T \| null` | `borsh.option(T)` |
| `defined<Name>` | `Name` (interface) | `NameLayout` (struct) |

### EVM (Solidity ABI → TypeScript)

| ABI Type | TypeScript |
|---|---|
| `address` | `` `0x${string}` `` |
| `bool` | `boolean` |
| `string` | `string` |
| `uint*` / `int*` | `bigint` |
| `bytes` / `bytes32` | `` `0x${string}` `` |
| `T[]` | `T[]` |
| `tuple` | `{ field: Type }` |
