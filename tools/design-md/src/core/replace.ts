import type { Result } from './result.js'
import { err, ok } from './result.js'

export type ReplaceError =
  | { readonly kind: 'no-frontmatter' }
  | { readonly kind: 'unterminated-frontmatter' }

const FENCE = '---'

/**
 * 先頭の `---` … `---` だけを差し替える。本文は 1 バイトも変えない。
 * 純関数。ファイルは読み書きしない。
 */
export const replaceFrontmatter = (
  markdown: string,
  frontmatter: string,
): Result<string, ReplaceError> => {
  const lines = markdown.split('\n')
  if (lines[0] !== FENCE) {
    return err({ kind: 'no-frontmatter' })
  }
  const closing = lines.findIndex((line, index) => index > 0 && line === FENCE)
  if (closing === -1) {
    return err({ kind: 'unterminated-frontmatter' })
  }
  const body = lines.slice(closing + 1).join('\n')
  const normalized = frontmatter.endsWith('\n') ? frontmatter.slice(0, -1) : frontmatter
  return ok([FENCE, normalized, FENCE, body].join('\n'))
}

/** 本文（フロントマターより後ろ）だけを取り出す。差分の検査に使う。 */
export const bodyOf = (markdown: string): Result<string, ReplaceError> => {
  const lines = markdown.split('\n')
  if (lines[0] !== FENCE) {
    return err({ kind: 'no-frontmatter' })
  }
  const closing = lines.findIndex((line, index) => index > 0 && line === FENCE)
  return closing === -1
    ? err({ kind: 'unterminated-frontmatter' })
    : ok(lines.slice(closing + 1).join('\n'))
}
