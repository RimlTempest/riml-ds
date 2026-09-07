/**
 * WCAG 2.1 のコントラスト比。計算は `colorjs.io/fn` の `contrastWCAG21`。
 * これは `terrazzo check` の `a11y/min-contrast` が内部で使っているのと同じ関数なので、
 * トークン側のゲート（`bun run lint:tokens`）と MCP の答えがずれない。
 */
import { ColorSpace, contrastWCAG21, OKLCH, parse, serialize, sRGB } from 'colorjs.io/fn'
import type { Result } from './result.js'
import { err, isRecord, ok } from './result.js'
import type { TokenIndex } from './tokens.js'
import { getToken, valueForMode } from './tokens.js'

// `fn` API は使う色空間を自分で登録する（tree-shaking のため）
ColorSpace.register(sRGB)
ColorSpace.register(OKLCH)

export type ContrastMode = 'light' | 'dark'

export type ContrastReport = {
  readonly ratio: number
  readonly aaa: boolean
  readonly aa: boolean
  readonly mode: ContrastMode
  readonly resolved: { readonly fg: string; readonly bg: string }
}

export type ContrastError = { readonly kind: 'unparsable-color'; readonly value: string }

/** colorjs の色（`Color` でも `{ space, coords, alpha }` でも受ける型）。関数側から引く */
type ColorInput = Parameters<typeof contrastWCAG21>[0]

type Resolved = { readonly color: ColorInput; readonly css: string }

/** DTCG の色（`{ colorSpace, components, alpha }`）。riml-ds のトークンは oklch だけ */
const fromToken = (value: unknown): Resolved | undefined => {
  if (!isRecord(value) || value['colorSpace'] !== 'oklch') {
    return undefined
  }
  const components = value['components']
  if (!Array.isArray(components) || !components.every((part) => typeof part === 'number')) {
    return undefined
  }
  const [lightness, chroma, hue] = components
  if (lightness === undefined || chroma === undefined || hue === undefined) {
    return undefined
  }
  const alpha = value['alpha']
  const coords: [number, number, number] = [lightness, chroma, hue]
  const color = { space: OKLCH, coords, alpha: typeof alpha === 'number' ? alpha : 1 }
  return { color, css: serialize(color) }
}

const resolve = (index: TokenIndex, value: string, mode: ContrastMode): Resolved | undefined => {
  const leaf = getToken(index, value)
  if (leaf !== undefined) {
    return fromToken(valueForMode(leaf, mode === 'dark' ? 'dark' : undefined))
  }
  try {
    const parsed = parse(value)
    return { color: parsed, css: serialize(parsed) }
  } catch {
    // 生の色として読めない（トークン名の打ち間違いを含む）。失敗は値で返す
    return undefined
  }
}

/**
 * トークン名（`color.text.default`）でも生の色（`#000`、`oklch(…)`）でも受ける。
 * `mode: 'dark'` は `$extensions["riml-ds"].modes.dark` を使う。
 */
export const checkContrast = (
  index: TokenIndex,
  fg: string,
  bg: string,
  options: { readonly mode?: ContrastMode } = {},
): Result<ContrastReport, ContrastError> => {
  const mode = options.mode ?? 'light'
  const foreground = resolve(index, fg, mode)
  if (foreground === undefined) {
    return err({ kind: 'unparsable-color', value: fg })
  }
  const background = resolve(index, bg, mode)
  if (background === undefined) {
    return err({ kind: 'unparsable-color', value: bg })
  }
  const ratio = contrastWCAG21(foreground.color, background.color)
  return ok({
    ratio,
    aaa: ratio >= 7,
    aa: ratio >= 4.5,
    mode,
    resolved: { fg: foreground.css, bg: background.css },
  })
}
