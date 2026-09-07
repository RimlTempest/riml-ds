import type { Result } from './result.js'
import { err, isRecord, ok } from './result.js'

/** `a11y/min-contrast` に渡す 1 対。 */
export type ContrastPair = {
  readonly foreground: string
  readonly background: string
}

/** `$extensions["riml-ds"]` のうち、コントラスト検査に関わる部分。 */
export type ContrastMeta = {
  readonly id: string
  readonly against: readonly string[]
  readonly nonText: boolean
}

export type ContrastPairsError =
  | { readonly kind: 'not-a-document'; readonly received: string }
  | { readonly kind: 'invalid-contrast-against'; readonly id: string }

const RIML_DS = 'riml-ds'

const readAgainst = (value: unknown): readonly string[] | undefined => {
  if (typeof value === 'string') {
    return [value]
  }
  if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
    return value
  }
  return undefined
}

const isTokenNode = (node: Record<string, unknown>): boolean => '$value' in node

/**
 * DTCG の文書を歩き、`$extensions["riml-ds"].contrastAgainst` を持つトークンを集める。
 * 純関数。ファイルは読まない（呼び出し側が読んで渡す）。
 */
export const collectContrastMeta = (
  document: unknown,
): Result<readonly ContrastMeta[], ContrastPairsError> => {
  if (!isRecord(document)) {
    return err({ kind: 'not-a-document', received: typeof document })
  }
  const found: ContrastMeta[] = []
  const walk = (
    node: Record<string, unknown>,
    path: readonly string[],
  ): ContrastPairsError | undefined => {
    if (isTokenNode(node)) {
      const extensions = node['$extensions']
      const riml = isRecord(extensions) ? extensions[RIML_DS] : undefined
      if (isRecord(riml) && 'contrastAgainst' in riml) {
        const against = readAgainst(riml['contrastAgainst'])
        if (against === undefined) {
          return { kind: 'invalid-contrast-against', id: path.join('.') }
        }
        found.push({ id: path.join('.'), against, nonText: riml['nonText'] === true })
      }
      return undefined
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$') || !isRecord(child)) {
        continue
      }
      const failure = walk(child, [...path, key])
      if (failure !== undefined) {
        return failure
      }
    }
    return undefined
  }
  const failure = walk(document, [])
  return failure === undefined ? ok(found) : err(failure)
}

/**
 * テキスト系（`nonText` でない）トークンだけを `a11y/min-contrast` の pairs に変換する。
 * 非テキストの 3:1 は Terrazzo の AAA lint では表せないので `test/contrast.test.ts` が見る。
 */
export const contrastPairs = (
  document: unknown,
): Result<readonly ContrastPair[], ContrastPairsError> => {
  const meta = collectContrastMeta(document)
  if (!meta.ok) {
    return meta
  }
  const pairs = meta.value
    .filter((entry) => !entry.nonText)
    .flatMap((entry) => entry.against.map((background) => ({ foreground: entry.id, background })))
  return ok(pairs)
}
