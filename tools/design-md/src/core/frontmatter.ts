import type { Result } from './result.js'
import { err, isRecord, ok } from './result.js'

/** `@google/design.md` の schema に合わせたフロントマター。 */
export type DesignMdFrontmatter = {
  readonly version: string
  readonly name: string
  readonly description: string
  readonly colors: Record<string, string>
  readonly typography: Record<string, Record<string, string | number>>
  readonly spacing: Record<string, string>
  readonly rounded: Record<string, string>
  readonly sizing: Record<string, string>
  readonly motion: Record<string, string>
}

export type MapError =
  | { readonly kind: 'not-a-document'; readonly received: string }
  | { readonly kind: 'missing-token'; readonly id: string }
  | { readonly kind: 'unsupported-value'; readonly id: string }

export type BuildOptions = {
  readonly name: string
  readonly description: string
  readonly theme?: string | undefined
}

type Leaf = {
  readonly id: string
  readonly $type: string
  readonly $value: unknown
  readonly modes: Record<string, unknown>
}

const RIML_DS = 'riml-ds'

const flatten = (node: unknown, path: readonly string[]): readonly Leaf[] => {
  if (!isRecord(node)) {
    return []
  }
  if ('$value' in node) {
    const extensions = node['$extensions']
    const riml = isRecord(extensions) && isRecord(extensions[RIML_DS]) ? extensions[RIML_DS] : {}
    const modes = isRecord(riml['modes']) ? riml['modes'] : {}
    const type = node['$type']
    return [
      {
        id: path.join('.'),
        $type: typeof type === 'string' ? type : '',
        $value: node['$value'],
        modes,
      },
    ]
  }
  return Object.entries(node).flatMap(([key, child]) =>
    key.startsWith('$') ? [] : flatten(child, [...path, key]),
  )
}

const valueOf = (leaf: Leaf, theme: string | undefined): unknown =>
  theme === undefined ? leaf.$value : (leaf.modes[`theme-${theme}`] ?? leaf.$value)

const colorString = (value: unknown): string | undefined => {
  if (!isRecord(value)) {
    return undefined
  }
  const components = value['components']
  if (!Array.isArray(components) || !components.every((entry) => typeof entry === 'number')) {
    return undefined
  }
  const alpha = value['alpha']
  const suffix = typeof alpha === 'number' && alpha < 1 ? ` / ${alpha}` : ''
  return `oklch(${components.join(' ')}${suffix})`
}

const dimensionString = (value: unknown): string | undefined => {
  if (!isRecord(value)) {
    return undefined
  }
  const amount = value['value']
  const unit = value['unit']
  return typeof amount === 'number' && typeof unit === 'string' ? `${amount}${unit}` : undefined
}

const fontFamilyString = (value: unknown): string | undefined => {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
    return undefined
  }
  return value.map((entry) => (entry.includes(' ') ? `'${entry}'` : entry)).join(', ')
}

/** `color.palette.<hue>.<step>` → DESIGN.md の `<hue>-<step>`。 */
const paletteKey = (id: string): string | undefined => {
  const rest = id.startsWith('color.palette.') ? id.slice('color.palette.'.length) : undefined
  return rest === undefined ? undefined : rest.replace('.', '-')
}

const SEMANTIC_COLORS: readonly (readonly [string, string])[] = [
  ['surface', 'color.surface.default'],
  ['surface-raised', 'color.surface.raised'],
  ['text', 'color.text.default'],
  ['text-muted', 'color.text.muted'],
  ['border', 'color.border.default'],
  ['focus', 'color.focus.ring'],
]

const TYPOGRAPHY: readonly (readonly [string, string])[] = [
  ['body', 'type.body'],
  ['heading-1', 'type.heading.1'],
  ['heading-2', 'type.heading.2'],
  ['small', 'type.small'],
  ['mono', 'type.mono'],
]

const SPACING_STEPS = ['1', '2', '3', '4', '6', '8', '12', '16'] as const
const ROUNDED = ['sm', 'md', 'lg', 'full'] as const

const SIZING: readonly (readonly [string, string])[] = [
  ['target-min', 'sizing.target-min'],
  ['focus-ring-width', 'focus.ring.width'],
  ['focus-ring-offset', 'focus.ring.offset'],
  ['measure-max', 'sizing.measure-max'],
]

const MOTION: readonly (readonly [string, string])[] = [
  ['duration-fast', 'motion.duration.fast'],
  ['duration-base', 'motion.duration.base'],
]

/**
 * `dist/tokens.json` を DESIGN.md のフロントマターに写す。純関数。
 *
 * - 色は palette を実値（oklch）で、semantic を `{colors.<palette>}` の参照で置く
 * - `typography.*.fontSize` は clamp の最小値（`@google/design.md` は clamp() を dimension と認めない）
 */
export const buildFrontmatter = (
  document: unknown,
  options: BuildOptions,
): Result<DesignMdFrontmatter, MapError> => {
  if (!isRecord(document)) {
    return err({ kind: 'not-a-document', received: typeof document })
  }
  const leaves = flatten(document, [])
  const byId = new Map(leaves.map((leaf) => [leaf.id, leaf]))
  const theme = options.theme

  const requireToken = (id: string): Result<Leaf, MapError> => {
    const leaf = byId.get(id)
    return leaf === undefined ? err({ kind: 'missing-token', id }) : ok(leaf)
  }

  const colors: Record<string, string> = {}
  const paletteByValue = new Map<string, string>()
  for (const leaf of leaves) {
    const key = paletteKey(leaf.id)
    if (key === undefined) {
      continue
    }
    const css = colorString(valueOf(leaf, theme))
    if (css === undefined) {
      return err({ kind: 'unsupported-value', id: leaf.id })
    }
    colors[key] = css
    paletteByValue.set(css, key)
  }
  for (const [key, id] of SEMANTIC_COLORS) {
    const leaf = requireToken(id)
    if (!leaf.ok) {
      return leaf
    }
    const css = colorString(valueOf(leaf.value, theme))
    if (css === undefined) {
      return err({ kind: 'unsupported-value', id })
    }
    const reference = paletteByValue.get(css)
    colors[key] = reference === undefined ? css : `{colors.${reference}}`
  }

  const typography: Record<string, Record<string, string | number>> = {}
  let bodyFamily: string | undefined
  for (const [key, id] of TYPOGRAPHY) {
    const leaf = requireToken(id)
    if (!leaf.ok) {
      return leaf
    }
    const value = valueOf(leaf.value, theme)
    if (!isRecord(value)) {
      return err({ kind: 'unsupported-value', id })
    }
    const family = fontFamilyString(value['fontFamily'])
    const size = dimensionString(value['fontSize'])
    const weight = value['fontWeight']
    const lineHeight = value['lineHeight']
    if (
      family === undefined
      || size === undefined
      || typeof weight !== 'number'
      || typeof lineHeight !== 'number'
    ) {
      return err({ kind: 'unsupported-value', id })
    }
    bodyFamily = bodyFamily ?? family
    typography[key] = {
      fontFamily: key !== 'body' && family === bodyFamily ? '{typography.body.fontFamily}' : family,
      fontSize: size,
      fontWeight: weight,
      lineHeight,
    }
  }

  const scalar = (
    entries: readonly (readonly [string, string])[],
    format: (value: unknown) => string | undefined,
  ): Result<Record<string, string>, MapError> => {
    const output: Record<string, string> = {}
    for (const [key, id] of entries) {
      const leaf = requireToken(id)
      if (!leaf.ok) {
        return leaf
      }
      const formatted = format(valueOf(leaf.value, theme))
      if (formatted === undefined) {
        return err({ kind: 'unsupported-value', id })
      }
      output[key] = formatted
    }
    return ok(output)
  }

  const spacing = scalar(
    SPACING_STEPS.map((step) => [step, `space.${step}`] as const),
    dimensionString,
  )
  if (!spacing.ok) {
    return spacing
  }
  const rounded = scalar(
    ROUNDED.map((size) => [size, `radius.${size}`] as const),
    dimensionString,
  )
  if (!rounded.ok) {
    return rounded
  }
  const sizing = scalar(SIZING, dimensionString)
  if (!sizing.ok) {
    return sizing
  }
  const motion = scalar(MOTION, dimensionString)
  if (!motion.ok) {
    return motion
  }
  const easing = requireToken('motion.easing.standard')
  if (!easing.ok) {
    return easing
  }
  const points = valueOf(easing.value, theme)
  if (!Array.isArray(points) || !points.every((entry) => typeof entry === 'number')) {
    return err({ kind: 'unsupported-value', id: 'motion.easing.standard' })
  }

  return ok({
    version: '1.0',
    name: options.name,
    description: options.description,
    colors,
    typography,
    spacing: spacing.value,
    rounded: rounded.value,
    sizing: sizing.value,
    motion: { ...motion.value, 'easing-standard': `cubic-bezier(${points.join(', ')})` },
  })
}
