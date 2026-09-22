/**
 * 公開する package.json から、リポジトリの中でしか意味を持たない依存指定を取り除く。
 *
 * `workspace:*` は bun / pnpm の workspace でだけ通じる。changesets の publish は bun を
 * 知らず `npm publish` を使うので、書き換えないまま公開される（0.2.0 / 0.3.0 の react /
 * elements / css / vue / svelte / astro / mcp）。その版はどのパッケージマネージャからも
 * インストールできない。docs/publishing.md「workspace: の書き換え」。
 */

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

export type DependencyField =
  | 'dependencies'
  | 'peerDependencies'
  | 'optionalDependencies'
  | 'devDependencies'

/** 利用側のインストールで解決されるフィールド（devDependencies は入らない） */
const INSTALLED_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies'] as const

const REWRITTEN_FIELDS: readonly DependencyField[] = [...INSTALLED_FIELDS, 'devDependencies']

const WORKSPACE = 'workspace:'

/**
 * `workspace:` 指定を実際の版範囲にする（pnpm / bun publish と同じ規則）。
 * ただし `workspace:*` は peerDependencies に限り `^<版>` にする。完全一致の peer は、
 * 利用側が 1 つ新しい patch を入れただけで peer 不一致になり、重複インストールを招く。
 */
export const resolveWorkspaceSpec = (
  spec: string,
  version: string,
  field: DependencyField,
): Result<string, string> => {
  if (!spec.startsWith(WORKSPACE)) return ok(spec)
  const range = spec.slice(WORKSPACE.length)
  if (range === '') return err(`empty workspace range: ${spec}`)
  if (range === '*') return ok(field === 'peerDependencies' ? `^${version}` : version)
  if (range === '^' || range === '~') return ok(`${range}${version}`)
  return ok(range)
}

export type Manifest = Record<string, unknown>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const stringEntries = (value: unknown): [string, string][] =>
  isRecord(value)
    ? Object.entries(value).flatMap(([name, spec]): [string, string][] =>
        typeof spec === 'string' ? [[name, spec]] : [],
      )
    : []

export type Rewritten = { readonly manifest: Manifest; readonly changes: readonly string[] }

/**
 * package.json（読み込んだ JSON）の `workspace:` 指定を、`versions`（パッケージ名 → 版）で
 * 書き換えた写しを返す。入力は書き換えない。リポジトリに無いパッケージを指していたら失敗。
 */
export const rewriteManifest = (
  manifest: Manifest,
  versions: ReadonlyMap<string, string>,
): Result<Rewritten, string> => {
  const next: Manifest = { ...manifest }
  const changes: string[] = []
  const errors: string[] = []

  for (const field of REWRITTEN_FIELDS) {
    const entries = stringEntries(manifest[field])
    if (entries.length === 0) continue
    const rewritten: Record<string, string> = {}
    for (const [name, spec] of entries) {
      if (!spec.startsWith(WORKSPACE)) {
        rewritten[name] = spec
        continue
      }
      const version = versions.get(name)
      if (version === undefined) {
        errors.push(`${field}.${name}: ${spec} does not point to a package in this repository`)
        continue
      }
      const resolved = resolveWorkspaceSpec(spec, version, field)
      if (!resolved.ok) {
        errors.push(`${field}.${name}: ${resolved.error}`)
        continue
      }
      rewritten[name] = resolved.value
      changes.push(`${field}.${name}: ${spec} -> ${resolved.value}`)
    }
    next[field] = rewritten
  }

  return errors.length > 0 ? err(errors.join('\n')) : ok({ manifest: next, changes })
}

const LOCAL_PROTOCOL = /^(?:workspace|link|file|catalog):/

/** 公開物に残っていてはいけない指定（利用側がインストールするフィールドだけを見る） */
export const findLocalProtocolSpecs = (manifest: Manifest): string[] =>
  INSTALLED_FIELDS.flatMap((field) =>
    stringEntries(manifest[field])
      .filter(([, spec]) => LOCAL_PROTOCOL.test(spec))
      .map(([name, spec]) => `${field}.${name}: ${spec}`),
  )

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/**
 * `npm pack --json` の出力から tarball のファイル名を取る。npm 11 までは配列、
 * npm 12 からはパッケージ名をキーにしたオブジェクトで返る。
 */
export const packedFileName = (stdout: string): string | undefined => {
  const parsed = parseJson(stdout)
  const entries: unknown[] = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed)
      ? Object.values(parsed)
      : []
  const first = entries[0]
  return isRecord(first) && typeof first['filename'] === 'string' ? first['filename'] : undefined
}
