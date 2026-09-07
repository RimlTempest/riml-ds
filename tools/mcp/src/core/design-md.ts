/**
 * 利用側リポジトリに置く `DESIGN.md` を作る（Google の design.md 形式、ADR-0010）。
 * フロントマターは `tools/design-md` の純関数を**再利用**する（写像の正はあちら 1 つ）。
 * 本文は riml-ds の DESIGN.md をそのまま継ぐ。純関数：ファイルは読み書きしない。
 */
import { buildFrontmatter } from '@rimltempest/riml-ds-design-md/src/core/frontmatter.js'
import { replaceFrontmatter } from '@rimltempest/riml-ds-design-md/src/core/replace.js'
import { parse, stringify } from 'yaml'
import type { Result } from './result.js'
import { err, isRecord, ok, stringOr } from './result.js'

export type DesignMdOptions = {
  /** ブランド。`themes/<brand>` の差分（`$extensions["riml-ds"].modes["theme-<brand>"]`）を当てる */
  readonly theme?: string | undefined
}

export type DesignMdError =
  | { readonly kind: 'no-frontmatter' }
  | { readonly kind: 'unmappable-tokens'; readonly detail: string }
  | { readonly kind: 'unwritable-yaml'; readonly detail: string }

const FENCE = '---'

/** 継ぐ本文の name / description を読む。テーマ指定時は name に `/<brand>` を足す */
const metaOf = (
  template: string,
): { readonly name: string; readonly description: string } | undefined => {
  const lines = template.split('\n')
  if (lines[0] !== FENCE) {
    return undefined
  }
  const closing = lines.findIndex((line, index) => index > 0 && line === FENCE)
  if (closing === -1) {
    return undefined
  }
  const head: unknown = parse(lines.slice(1, closing).join('\n'))
  if (!isRecord(head)) {
    return undefined
  }
  return { name: stringOr(head['name'], 'riml-ds'), description: stringOr(head['description'], '') }
}

/**
 * `tokens.json` と riml-ds の `DESIGN.md` から利用側の `DESIGN.md` を作る。
 * 本文は 1 バイトも変えない（`replaceFrontmatter` がフロントマターだけを差し替える）。
 */
export const buildDesignMd = (
  tokens: unknown,
  template: string,
  options: DesignMdOptions,
): Result<string, DesignMdError> => {
  const meta = metaOf(template)
  if (meta === undefined) {
    return err({ kind: 'no-frontmatter' })
  }
  const theme = options.theme
  const frontmatter = buildFrontmatter(tokens, {
    name: theme === undefined ? meta.name : `${meta.name}/${theme}`,
    description: meta.description,
    theme,
  })
  if (!frontmatter.ok) {
    return err({ kind: 'unmappable-tokens', detail: JSON.stringify(frontmatter.error) })
  }
  try {
    const yaml = stringify(frontmatter.value, {
      lineWidth: 0,
      defaultStringType: 'QUOTE_DOUBLE',
      defaultKeyType: 'PLAIN',
    })
    const replaced = replaceFrontmatter(template, yaml)
    return replaced.ok ? ok(replaced.value) : err({ kind: 'no-frontmatter' })
  } catch (error: unknown) {
    return err({
      kind: 'unwritable-yaml',
      detail: error instanceof Error ? error.message : String(error),
    })
  }
}
