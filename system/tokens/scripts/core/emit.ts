import { cssVarName } from './fluid-typography.js'
import type { Result } from './result.js'
import { err, isRecord, ok } from './result.js'
import type { ResolvedToken, TokenSet } from './token-set.js'
import { colorToHex, formatValue } from './token-set.js'

/** モード名 → そのモードで解決したトークン。 */
export type Modes = ReadonlyMap<string, TokenSet>

export type EmitError = { readonly kind: 'empty-token-set' }

const RIML_DS = 'riml-ds'

const sortedIds = (tokens: TokenSet): readonly string[] =>
  [...tokens.keys()].toSorted((a, b) => a.localeCompare(b, 'en-us', { numeric: true }))

/** `color.text.default` → `tokens.color.text.default` になる入れ子を組む。 */
type Tree = Map<string, Tree | string>

const buildTree = (ids: readonly string[]): Tree => {
  const root: Tree = new Map()
  for (const id of ids) {
    const segments = id.split('.')
    let node = root
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        node.set(segment, `var(${cssVarName(id)})`)
        return
      }
      const next = node.get(segment)
      if (next instanceof Map) {
        node = next
        return
      }
      const created: Tree = new Map()
      node.set(segment, created)
      node = created
    })
  }
  return root
}

const key = (segment: string): string =>
  /^[A-Za-z_$][\w$]*$/.test(segment) ? segment : JSON.stringify(segment)

const renderTree = (
  tree: Tree,
  indent: string,
  leaf: (value: string) => string,
  keyPrefix: string,
): string => {
  const lines = [...tree].map(([segment, value]) =>
    value instanceof Map
      ? `${indent}  ${keyPrefix}${key(segment)}: {\n${renderTree(value, `${indent}  `, leaf, keyPrefix)}\n${indent}  },`
      : `${indent}  ${keyPrefix}${key(segment)}: ${leaf(value)},`,
  )
  return lines.join('\n')
}

const HEADER = `/* riml-ds のトークン。system/tokens/src から生成される。手で編集しない。 */`

/**
 * `dist/tokens.js` と `dist/tokens.d.ts` を作る。
 * 値ではなく `var(--rd-…)` を配る（モードの切替に追従させるため。docs/tokens.md）。
 */
export const emitTs = (
  tokens: TokenSet,
): Result<{ readonly js: string; readonly dts: string }, EmitError> => {
  const ids = sortedIds(tokens)
  if (ids.length === 0) {
    return err({ kind: 'empty-token-set' })
  }
  const tree = buildTree(ids)
  const js = [
    HEADER,
    'export const tokens = {',
    renderTree(tree, '', (value) => JSON.stringify(value), ''),
    '}',
    '',
    `export const TOKEN_PATHS = [${ids.map((id) => JSON.stringify(id)).join(', ')}]`,
    '',
    'export const cssVar = (path) => `var(--rd-${path.replaceAll(".", "-")})`',
    '',
  ].join('\n')
  const dts = [
    HEADER,
    'export declare const tokens: {',
    renderTree(tree, '', (value) => JSON.stringify(value), 'readonly '),
    '}',
    '',
    `export type TokenPath =\n${ids.map((id) => `  | ${JSON.stringify(id)}`).join('\n')}`,
    '',
    'export declare const TOKEN_PATHS: readonly TokenPath[]',
    '',
    'export declare const cssVar: (path: TokenPath) => `var(--rd-${string})`',
    '',
  ].join('\n')
  return ok({ js, dts })
}

const withRimlExtensions = (
  id: string,
  token: ResolvedToken,
  modes: Modes,
): Record<string, unknown> => {
  const existing = isRecord(token.$extensions?.[RIML_DS]) ? token.$extensions[RIML_DS] : {}
  const modeValues: Record<string, unknown> = {}
  for (const [mode, set] of modes) {
    const other = set.get(id)
    if (other !== undefined && JSON.stringify(other.$value) !== JSON.stringify(token.$value)) {
      modeValues[mode] = other.$value
    }
  }
  const riml: Record<string, unknown> = { ...existing, cssVar: cssVarName(id) }
  if (Object.keys(modeValues).length > 0) {
    riml['modes'] = modeValues
  }
  return { ...token.$extensions, [RIML_DS]: riml }
}

const valueWithHex = (token: ResolvedToken): unknown => {
  if (token.$type !== 'color' || !isRecord(token.$value)) {
    return token.$value
  }
  const hex = colorToHex(token.$value)
  return hex === undefined ? token.$value : { ...token.$value, hex }
}

/** 解決済み DTCG（`dist/tokens.json`）。モードごとの値と CSS 変数名を `$extensions` に足す。 */
export const emitJson = (tokens: TokenSet, modes: Modes): Result<string, EmitError> => {
  const ids = sortedIds(tokens)
  if (ids.length === 0) {
    return err({ kind: 'empty-token-set' })
  }
  const document: Record<string, unknown> = {}
  for (const id of ids) {
    const token = tokens.get(id)
    if (token === undefined) {
      continue
    }
    const segments = id.split('.')
    let node = document
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        node[segment] = {
          $type: token.$type,
          ...(token.$description === undefined ? {} : { $description: token.$description }),
          $value: valueWithHex(token),
          $extensions: withRimlExtensions(id, token, modes),
        }
        return
      }
      const next = node[segment]
      if (isRecord(next)) {
        node = next
        return
      }
      const created: Record<string, unknown> = {}
      node[segment] = created
      node = created
    })
  }
  return ok(`${JSON.stringify(document, undefined, 2)}\n`)
}

const escapeCell = (text: string): string => text.replaceAll('|', '\\|')

/** Storybook Docs が読む一覧表（`dist/tokens.md`）。 */
export const emitMd = (tokens: TokenSet, dark: TokenSet): Result<string, EmitError> => {
  const ids = sortedIds(tokens)
  if (ids.length === 0) {
    return err({ kind: 'empty-token-set' })
  }
  const rows = ids.map((id) => {
    const token = tokens.get(id)
    if (token === undefined) {
      return ''
    }
    const light = formatValue(token)
    const darkToken = dark.get(id)
    const darkValue = darkToken === undefined ? '' : formatValue(darkToken)
    return `| \`${id}\` | \`${cssVarName(id)}\` | \`${escapeCell(light)}\` | ${darkValue === light || darkValue === '' ? '—' : `\`${escapeCell(darkValue)}\``} | ${escapeCell(token.$description ?? '')} |`
  })
  return ok(
    [
      '# トークン一覧',
      '',
      '`system/tokens/src/**/*.tokens.json` から生成。手で編集しない。',
      '',
      '| 名前 | CSS 変数 | light | dark | 説明 |',
      '| ---- | -------- | ----- | ---- | ---- |',
      ...rows,
      '',
    ].join('\n'),
  )
}
