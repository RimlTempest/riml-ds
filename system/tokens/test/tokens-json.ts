import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export type Leaf = {
  readonly id: string
  readonly $type: string
  readonly $description: string | undefined
  readonly $value: Record<string, unknown>
  readonly riml: Record<string, unknown>
}

export const MODES = [
  'light',
  'dark',
  'more',
  'more-dark',
  'compact',
  'theme-qrcc',
  'theme-qrcc-dark',
  'theme-noter',
  'theme-noter-dark',
] as const
export type Mode = (typeof MODES)[number]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const readDist = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`../dist/${name}`, import.meta.url)), 'utf8')

export const readSrc = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`../src/${name}`, import.meta.url)), 'utf8')

/** `dist/tokens.json` を id で引ける平坦な一覧にする。 */
export const flatten = (document: unknown, path: readonly string[] = []): readonly Leaf[] => {
  if (!isRecord(document)) {
    return []
  }
  if ('$value' in document) {
    const extensions = document['$extensions']
    const riml =
      isRecord(extensions) && isRecord(extensions['riml-ds']) ? extensions['riml-ds'] : {}
    const description = document['$description']
    const type = document['$type']
    return [
      {
        id: path.join('.'),
        $type: typeof type === 'string' ? type : '',
        $description: typeof description === 'string' ? description : undefined,
        $value: isRecord(document['$value']) ? document['$value'] : {},
        riml,
      },
    ]
  }
  return Object.entries(document).flatMap(([key, child]) =>
    key.startsWith('$') ? [] : flatten(child, [...path, key]),
  )
}

/** モードごとの値。差分が無ければ既定値。 */
export const valueIn = (leaf: Leaf, mode: Mode): Record<string, unknown> => {
  if (mode === 'light') {
    return leaf.$value
  }
  const modes = leaf.riml['modes']
  const value = isRecord(modes) ? modes[mode] : undefined
  return isRecord(value) ? value : leaf.$value
}

/** oklch の成分を CSS 色文字列にする。 */
export const toCss = (value: Record<string, unknown>): string => {
  const components = value['components']
  const alpha = value['alpha']
  const body = Array.isArray(components) ? components.join(' ') : ''
  return typeof alpha === 'number' && alpha < 1 ? `oklch(${body} / ${alpha})` : `oklch(${body})`
}

export const tokensJson: readonly Leaf[] = flatten(JSON.parse(readDist('tokens.json')))

export const byId = new Map(tokensJson.map((leaf) => [leaf.id, leaf]))

export const contrastAgainstOf = (leaf: Leaf): readonly string[] => {
  const against = leaf.riml['contrastAgainst']
  if (typeof against === 'string') {
    return [against]
  }
  return Array.isArray(against) && against.every((entry) => typeof entry === 'string')
    ? against
    : []
}
