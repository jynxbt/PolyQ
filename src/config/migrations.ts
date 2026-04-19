import consola from 'consola'

/**
 * Entry in the removed/deprecated-keys table. Each entry covers one
 * rename from a legacy name to the current one.
 *
 * - `path` — dot-path of the old key. Top-level keys are length-1
 *   (`['idlSync']`); nested entries use the full path
 *   (`['workspace', 'validator', 'oldField']`). Use `'*'` as a segment
 *   to iterate over record-style keys, e.g.
 *   `['programs', '*', 'idl']` matches every program's `idl` field.
 * - `replacement` — the new key name (leaf only, sits at `path[:-1]`).
 * - `since` — the polyq version where the change landed.
 * - `severity` — `'removed'` throws, `'deprecated'` logs a warning and
 *   auto-renames via `migrateConfig()`.
 */
export interface MigrationEntry {
  path: [string, ...string[]]
  replacement: string
  since: string
  severity: 'removed' | 'deprecated'
}

export interface MigrationChange {
  entry: MigrationEntry
  /** Rendered dot-path like `workspace.validator.oldField`. */
  fromPath: string
  /** Concrete segments the wildcard expanded to. Empty when the entry has no `*`. */
  expandedPath: string[]
  /** The value that was at the old path. Preserved verbatim at the new path. */
  value: unknown
}

const logger = consola.withTag('polyq:config')

/**
 * Known-removed/deprecated config keys. Keep this small and targeted —
 * arbitrary typos should still fall through to valibot's strict-object
 * path.
 */
export const MIGRATIONS: MigrationEntry[] = [
  { path: ['idlSync'], replacement: 'schemaSync', since: '0.4.0', severity: 'removed' },
  {
    path: ['programs', '*', 'idl'],
    replacement: 'schema',
    since: '0.4.0',
    severity: 'removed',
  },
]

/**
 * Scan `raw` for any migration entries present in the input. Returns
 * the list of hits without mutating anything. Wildcard entries expand:
 * one hit per matching record key.
 */
export function findMigrationHits(raw: unknown): MigrationChange[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  const hits: MigrationChange[] = []
  for (const entry of MIGRATIONS) {
    for (const expanded of walk(raw as Record<string, unknown>, entry.path)) {
      hits.push({
        entry,
        expandedPath: expanded,
        fromPath: expanded.join('.'),
        value: getAtPath(raw as Record<string, unknown>, expanded),
      })
    }
  }
  return hits
}

/**
 * Return a non-mutating copy of `raw` with every *deprecated* migration
 * applied (old key → new key, value preserved) and a list of the changes
 * made. `removed` entries are surfaced in `changes` but not auto-applied
 * — the caller should throw on those; doing it here would silently
 * paper over a breaking rename.
 */
export function migrateConfig<T>(raw: T): { migrated: T; changes: MigrationChange[] } {
  const changes = findMigrationHits(raw)
  if (changes.length === 0) return { migrated: raw, changes }

  const migrated = structuredClone(raw) as unknown as Record<string, unknown>
  for (const change of changes) {
    if (change.entry.severity !== 'deprecated') continue
    const parentPath = change.expandedPath.slice(0, -1)
    const parent = parentPath.length === 0 ? migrated : getAtPath(migrated, parentPath)
    if (!parent || typeof parent !== 'object') continue
    const oldKey = change.expandedPath[change.expandedPath.length - 1]!
    const p = parent as Record<string, unknown>
    p[change.entry.replacement] = p[oldKey]
    delete p[oldKey]
  }
  return { migrated: migrated as unknown as T, changes }
}

/**
 * Emit a `consola.warn` line per deprecated hit. Removed-severity hits
 * are the caller's responsibility to throw on — we don't warn because
 * that would imply "it's fine, we migrated."
 */
export function warnDeprecations(changes: MigrationChange[]): void {
  for (const change of changes) {
    if (change.entry.severity !== 'deprecated') continue
    logger.warn(
      `\`${change.fromPath}\` is deprecated since polyq ${change.entry.since} — ` +
        `use \`${change.entry.replacement}\` instead. Auto-migrating for this load.`,
    )
  }
}

/**
 * Walk `obj` along `pattern`, expanding `*` segments to every record key
 * that exists at that level. Yields the fully-resolved concrete path for
 * each match; the value is not yielded here — callers use `getAtPath`.
 */
function* walk(
  obj: Record<string, unknown>,
  pattern: string[],
  prefix: string[] = [],
): Generator<string[]> {
  if (pattern.length === 0) {
    yield prefix
    return
  }
  const [head, ...rest] = pattern as [string, ...string[]]
  if (head === '*') {
    // Wildcard: iterate every key at the current level and recurse.
    for (const [key, value] of Object.entries(obj)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue
      yield* walk(value as Record<string, unknown>, rest, [...prefix, key])
    }
    return
  }
  const value = obj[head]
  if (value === undefined) return
  if (rest.length === 0) {
    // Leaf match — yield only if the key is actually present.
    yield [...prefix, head]
    return
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  yield* walk(value as Record<string, unknown>, rest, [...prefix, head])
}

function getAtPath(obj: Record<string, unknown>, path: string[]): unknown {
  let cur: unknown = obj
  for (const seg of path) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return undefined
    cur = (cur as Record<string, unknown>)[seg]
  }
  return cur
}
