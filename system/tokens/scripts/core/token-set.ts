import { formatHex, parse } from 'culori'
import type { Result } from './result.js'
import { err, isRecord, ok } from './result.js'

/** Terrazzo が解決したトークン 1 つ（`dist/tokens.raw.js` の PERMUTATIONS の要素）。 */
export type ResolvedToken = {
  readonly $type: string
  readonly $description: string | undefined
  readonly $value: unknown
  readonly $extensions: Record<string, unknown> | undefined
}

/** id → トークン。id は `color.text.default` の形。 */
export type TokenSet = ReadonlyMap<string, ResolvedToken>

export type TokenSetError =
  | { readonly kind: 'not-a-token-set'; readonly received: string }
  | { readonly kind: 'not-a-token'; readonly id: string }

/** `unknown` を TokenSet に絞り込む。 */
export const parseTokenSet = (input: unknown): Result<TokenSet, TokenSetError> => {
  if (!isRecord(input)) {
    return err({ kind: 'not-a-token-set', received: typeof input })
  }
  const tokens = new Map<string, ResolvedToken>()
  for (const [id, value] of Object.entries(input)) {
    if (!isRecord(value) || !('$value' in value) || typeof value['$type'] !== 'string') {
      return err({ kind: 'not-a-token', id })
    }
    const description = value['$description']
    const extensions = value['$extensions']
    tokens.set(id, {
      $type: value['$type'],
      $description: typeof description === 'string' ? description : undefined,
      $value: value['$value'],
      $extensions: isRecord(extensions) ? extensions : undefined,
    })
  }
  return ok(tokens)
}

const numbers = (value: unknown): readonly number[] | undefined =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'number') ? value : undefined

/** oklch の成分を CSS の色文字列にする。色でなければ undefined。 */
export const colorToCss = (value: unknown): string | undefined => {
  if (!isRecord(value)) {
    return undefined
  }
  const components = numbers(value['components'])
  const space = value['colorSpace']
  if (components === undefined || typeof space !== 'string') {
    return undefined
  }
  const alpha = value['alpha']
  const body = components.join(' ')
  const suffix = typeof alpha === 'number' && alpha < 1 ? ` / ${alpha}` : ''
  return space === 'oklch' ? `oklch(${body}${suffix})` : `color(${space} ${body}${suffix})`
}

/** 色の hex フォールバック。sRGB 外の色はクランプされる。 */
export const colorToHex = (value: unknown): string | undefined => {
  const css = colorToCss(value)
  if (css === undefined) {
    return undefined
  }
  const parsed = parse(css)
  return parsed === undefined ? undefined : formatHex(parsed)
}

const dimensionToCss = (value: unknown): string | undefined => {
  if (!isRecord(value)) {
    return undefined
  }
  const amount = value['value']
  const unit = value['unit']
  return typeof amount === 'number' && typeof unit === 'string' ? `${amount}${unit}` : undefined
}

/** 表示用の 1 行。複合型は JSON を返す。 */
export const formatValue = (token: ResolvedToken): string => {
  switch (token.$type) {
    case 'color': {
      return colorToCss(token.$value) ?? JSON.stringify(token.$value)
    }
    case 'dimension':
    case 'duration': {
      return dimensionToCss(token.$value) ?? JSON.stringify(token.$value)
    }
    case 'number':
    case 'fontWeight': {
      return typeof token.$value === 'number' ? String(token.$value) : JSON.stringify(token.$value)
    }
    case 'cubicBezier': {
      const points = numbers(token.$value)
      return points === undefined
        ? JSON.stringify(token.$value)
        : `cubic-bezier(${points.join(', ')})`
    }
    case 'fontFamily': {
      return Array.isArray(token.$value) ? token.$value.join(', ') : String(token.$value)
    }
    case 'typography': {
      return isRecord(token.$value) ? (dimensionToCss(token.$value['fontSize']) ?? '—') : '—'
    }
    default: {
      return JSON.stringify(token.$value)
    }
  }
}
