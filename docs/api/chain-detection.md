---
title: Chain Detection
description: How Polyq auto-detects your project's blockchain ecosystem.
---

# Chain Detection

Polyq auto-detects whether your project targets SVM (Solana) or EVM (Ethereum) based on project files and dependencies.

## `detectChain(root)`

Returns the detected chain family for a project directory.

```ts
import { detectChain } from 'polyq'

const chain = detectChain('.')  // 'svm' | 'evm'
```

**Detection priority:**

1. **Config file markers** (definite):
   - `Anchor.toml` → `'svm'`
   - `foundry.toml` → `'evm'`
   - `hardhat.config.ts` / `.js` / `.cjs` / `.mjs` → `'evm'`

2. **Package.json dependencies** (likely):
   - SVM: `@solana/web3.js`, `@coral-xyz/anchor`, `bs58`, etc.
   - EVM: `ethers`, `viem`, `wagmi`, `hardhat`, etc.

3. **Fallback**: `'svm'`

If multiple chains are detected (e.g., a monorepo with both `Anchor.toml` and `foundry.toml`), Polyq warns and picks the first match. Set `chain` explicitly in `polyq.config.ts` to silence the warning.

## `getChainProvider(chain)`

Returns the chain provider for a given chain family.

```ts
import { getChainProvider } from 'polyq'

const provider = getChainProvider('svm')
provider.detectPrograms('.')     // Parse Anchor.toml
provider.findSchemaFiles('.')    // Find IDL files
provider.generateClient(...)     // Codegen
```

## `findProjectRoot(cwd)`

Walks up from `cwd` looking for any chain's root marker file.

```ts
import { findProjectRoot } from 'polyq'

const root = findProjectRoot('/path/to/subdir')
// Returns the directory containing Anchor.toml, foundry.toml, etc.
```

## `ChainProvider` Interface

Each chain implements this interface:

```ts
interface ChainProvider {
  chain: 'svm' | 'evm'
  programTypes: ProgramType[]
  rootMarkers: string[]
  defaultArtifactDir: string
  optimizeDeps: string[]

  detectProject(root: string): ChainDetectionResult | null
  detectPackages(root: string): string[]
  detectPrograms(root: string): Record<string, ProgramConfig> | undefined
  generateClient(schemaPath, outDir, config?): CodegenOutput
  findSchemaFiles(root: string): string[]
  createValidatorStage(options): Stage
  createValidatorResetStage(options): Stage
  createBuildStage(options): Stage
  createDeployStage(options): Stage
}
```

## Importing Chain-Specific Code

For tree-shaking, import chain providers directly:

```ts
// Only loads SVM code
import { svmProvider } from 'polyq/chains/svm'

// Only loads EVM code
import { evmProvider } from 'polyq/chains/evm'
```
