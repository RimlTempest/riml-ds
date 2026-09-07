/**
 * `system/tokens/dist/tokens.json`（解決済み DTCG）を引くための索引。純関数。
 * 値の意味は触らない。生成物をそのまま読むだけ（ADR-0010）。
 */
import type { Result } from './result.js'
import { err, isRecord, ok, stringOr } from './result.js'
import { SYNONYMS } from './synonyms.js'

export type TokenLeaf = {
  readonly path: string
  readonly type: string
  readonly description: string
  readonly value: unknown
  /** `dark` / `more-dark` / `compact` / `theme-<brand>` … モード別の値 */
  readonly modes: Readonly<Record<string, unknown>>
  readonly cssVar: string | undefined
}

export type TokenIndex = {
  readonly leaves: readonly TokenLeaf[]
  readonly byPath: ReadonlyMap<string, TokenLeaf>
}

export type TokenError = { readonly kind: 'not-a-document'; readonly received: string }

export type TokenHit = {
  readonly path: string
  readonly cssVar: string | undefined
  readonly description: string
  readonly score: number
}

const RIML_DS = 'riml-ds'

const flatten = (node: unknown, path: readonly string[]): readonly TokenLeaf[] => {
  if (!isRecord(node)) {
    return []
  }
  if ('$value' in node) {
    const extensions = node['$extensions']
    const riml = isRecord(extensions) && isRecord(extensions[RIML_DS]) ? extensions[RIML_DS] : {}
    const modes = isRecord(riml['modes']) ? riml['modes'] : {}
    const cssVar = riml['cssVar']
    return [
      {
        path: path.join('.'),
        type: stringOr(node['$type'], ''),
        description: stringOr(node['$description'], ''),
        value: node['$value'],
        modes,
        cssVar: typeof cssVar === 'string' ? cssVar : undefined,
      },
    ]
  }
  return Object.entries(node).flatMap(([key, child]) =>
    key.startsWith('$') ? [] : flatten(child, [...path, key]),
  )
}

export const loadTokens = (document: unknown): Result<TokenIndex, TokenError> => {
  if (!isRecord(document)) {
    return err({ kind: 'not-a-document', received: typeof document })
  }
  const leaves = flatten(document, [])
  return ok({ leaves, byPath: new Map(leaves.map((leaf) => [leaf.path, leaf])) })
}

export const getToken = (index: TokenIndex, path: string): TokenLeaf | undefined =>
  index.byPath.get(path)

/** モード別の値。無ければ既定値（light）に落ちる */
export const valueForMode = (leaf: TokenLeaf, mode: string | undefined): unknown =>
  mode === undefined ? leaf.value : (leaf.modes[mode] ?? leaf.value)

const underSynonym = (leaf: TokenLeaf, target: string): boolean =>
  leaf.path === target || leaf.path.startsWith(`${target}.`)

const scoreOf = (leaf: TokenLeaf, query: string, targets: readonly string[]): number => {
  const lower = query.toLowerCase()
  let score = 0
  if (targets.some((target) => underSynonym(leaf, target))) {
    score += 100
  }
  if (leaf.path.toLowerCase().includes(lower)) {
    score += 50
  }
  if (leaf.cssVar !== undefined && leaf.cssVar.toLowerCase().includes(lower)) {
    score += 30
  }
  if (leaf.description.includes(query)) {
    score += 20
  }
  return score
}

/**
 * 名前・CSS 変数名・説明の部分一致と、日本語の同義語表（`synonyms.ts`）で引く。
 * LLM は使わない。同点はパスの辞書順で安定させる。
 */
export const searchTokens = (index: TokenIndex, query: string, limit = 20): readonly TokenHit[] => {
  const trimmed = query.trim()
  if (trimmed === '') {
    return []
  }
  const targets = Object.entries(SYNONYMS)
    .filter(([word]) => trimmed.includes(word))
    .map(([, target]) => target)

  return index.leaves
    .map((leaf) => ({
      path: leaf.path,
      cssVar: leaf.cssVar,
      description: leaf.description,
      score: scoreOf(leaf, trimmed, targets),
    }))
    .filter((hit) => hit.score > 0)
    .toSorted((left, right) => right.score - left.score || left.path.localeCompare(right.path))
    .slice(0, limit)
}
