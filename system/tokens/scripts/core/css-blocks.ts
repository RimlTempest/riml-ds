import type { Result } from './result.js'
import { err, ok } from './result.js'

/** `--name: value` の 1 宣言。 */
export type Declaration = {
  readonly name: string
  readonly value: string
}

/** 最上位のブロック 1 つ。`prelude` は `{` の直前までの文字列。 */
export type CssBlock = {
  readonly prelude: string
  readonly inner: string
}

export type CssParseError = { readonly kind: 'unbalanced-braces'; readonly at: number }

const COMMENT_RE = /\/\*[\s\S]*?\*\//g
const DECLARATION_RE = /(--[a-z0-9-]+)\s*:\s*([^;{}]+);/g

/** prelude からコメントと余分な空白を落とす。 */
export const normalizePrelude = (prelude: string): string =>
  prelude.replaceAll(COMMENT_RE, ' ').replaceAll(/\s+/g, ' ').trim()

/** Terrazzo が出力した CSS を最上位のブロックに分ける。純関数。 */
export const parseBlocks = (css: string): Result<readonly CssBlock[], CssParseError> => {
  const blocks: CssBlock[] = []
  let depth = 0
  let preludeStart = 0
  let innerStart = 0
  for (let i = 0; i < css.length; i += 1) {
    const char = css[i]
    if (char === '{') {
      if (depth === 0) {
        innerStart = i + 1
      }
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth < 0) {
        return err({ kind: 'unbalanced-braces', at: i })
      }
      if (depth === 0) {
        blocks.push({
          prelude: css.slice(preludeStart, innerStart - 1),
          inner: css.slice(innerStart, i),
        })
        preludeStart = i + 1
      }
    }
  }
  return depth === 0 ? ok(blocks) : err({ kind: 'unbalanced-braces', at: css.length })
}

/** ブロックの中身から `--rd-*` の宣言を順に取り出す（入れ子の深さは問わない）。 */
export const parseDeclarations = (inner: string): readonly Declaration[] => {
  const withoutComments = inner.replaceAll(COMMENT_RE, '')
  const found: Declaration[] = []
  for (const match of withoutComments.matchAll(DECLARATION_RE)) {
    const name = match[1]
    const value = match[2]
    if (name !== undefined && value !== undefined) {
      found.push({ name, value: value.trim() })
    }
  }
  return found
}

/** 宣言の並びを「名前 → 値」に畳む（後勝ち）。 */
export const toMap = (declarations: readonly Declaration[]): ReadonlyMap<string, string> => {
  const map = new Map<string, string>()
  for (const declaration of declarations) {
    map.set(declaration.name, declaration.value)
  }
  return map
}
