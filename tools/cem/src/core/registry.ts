/**
 * `custom-elements.json`（CEM）→ `registry.json` の純関数。docs / MCP / ラッパー生成器が引く索引。
 * CEM は外から来るデータなので、riml-ds 独自のフィールド（`pe` / `status` / `dependsOn`）は
 * `unknown` として読み、型を確かめてから載せる。失敗しても throw しない（該当部品を飛ばす）。
 */
import type { Package } from 'custom-elements-manifest/schema'

export type PeTier = 'A' | 'B' | 'C'

export type RegistryEntry = {
  readonly name: string
  readonly tag: string
  readonly pe: PeTier
  readonly status: string
  readonly summary: string
  /** 利用側が読むファイル。`.css` はティア A/B だけ */
  readonly files: readonly string[]
  readonly dependsOn: readonly string[]
}

export type Registry = readonly RegistryEntry[]

const TAG_PREFIX = 'rd-'

const prop = (source: unknown, key: string): unknown =>
  typeof source === 'object' && source !== null && key in source
    ? Reflect.get(source, key)
    : undefined

const readString = (source: unknown, key: string): string => {
  const value = prop(source, key)
  return typeof value === 'string' ? value : ''
}

const readStrings = (source: unknown, key: string): readonly string[] => {
  const value = prop(source, key)
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []
}

const isPeTier = (value: unknown): value is PeTier =>
  value === 'A' || value === 'B' || value === 'C'

/** `rd-text-field` → `text-field`。プレフィックスが無ければタグ名をそのまま使う */
const componentName = (tag: string): string =>
  tag.startsWith(TAG_PREFIX) ? tag.slice(TAG_PREFIX.length) : tag

const filesFor = (name: string, pe: PeTier): readonly string[] => {
  const base = [`${name}/index.js`, `${name}/${name}.define.js`]
  return pe === 'C' ? base : [...base, `${name}/${name}.css`]
}

export const buildRegistry = (manifest: Package): Registry =>
  manifest.modules.flatMap((module) =>
    (module.declarations ?? []).flatMap((declaration): readonly RegistryEntry[] => {
      const tag = readString(declaration, 'tagName')
      const pe = prop(declaration, 'pe')
      if (prop(declaration, 'customElement') !== true || tag === '' || !isPeTier(pe)) {
        return []
      }
      const name = componentName(tag)
      return [
        {
          name,
          tag,
          pe,
          status: readString(declaration, 'status'),
          summary: readString(declaration, 'summary'),
          files: filesFor(name, pe),
          dependsOn: readStrings(declaration, 'dependsOn'),
        },
      ]
    }),
  )
