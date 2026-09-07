import { wcagContrast, parse } from 'culori'
import { describe, expect, it } from 'vitest'
import type { Mode } from './tokens-json.js'
import { byId, contrastAgainstOf, tokensJson, toCss, valueIn } from './tokens-json.js'

// Terrazzo の a11y/min-contrast は既定（light）でしか走らない。
// モードごとの検査はここで固定する（plan 002 STOP conditions の但し書き）。
const CHECKED_MODES: readonly Mode[] = [
  'light',
  'dark',
  'more',
  'more-dark',
  'theme-qrcc',
  'theme-qrcc-dark',
  'theme-noter',
  'theme-noter-dark',
]

/** qrcc 取り込みの前提を固定する（既定より落ちないこと）。 */
const QRCC_MODES: readonly Mode[] = ['theme-qrcc', 'theme-qrcc-dark']

const ratio = (foreground: string, background: string): number => {
  const a = parse(foreground)
  const b = parse(background)
  if (a === undefined || b === undefined) {
    return 0
  }
  return wcagContrast(a, b)
}

type Case = {
  readonly foreground: string
  readonly background: string
  readonly mode: Mode
  readonly minimum: number
}

const cases: readonly Case[] = tokensJson.flatMap((leaf) =>
  contrastAgainstOf(leaf).flatMap((background) =>
    CHECKED_MODES.map((mode) => ({
      foreground: leaf.id,
      background,
      mode,
      minimum: leaf.riml['nonText'] === true ? 3 : 7,
    })),
  ),
)

describe('コントラスト（WCAG 2.2 AAA）', () => {
  it('contrastAgainst を持つトークンが 12 個ある（テキスト 10 + 非テキスト 2）', () => {
    expect(new Set(cases.map((entry) => entry.foreground)).size).toBe(12)
  })

  it('qrcc テーマの本文と面はライト・ダークとも 7:1 以上（移行時に既定より落ちない）', () => {
    const text = byId.get('color.text.default')
    const surface = byId.get('color.surface.default')
    expect(text).toBeDefined()
    expect(surface).toBeDefined()
    if (text === undefined || surface === undefined) {
      return
    }
    const ratios = QRCC_MODES.map((mode) => ({
      mode,
      enough: ratio(toCss(valueIn(text, mode)), toCss(valueIn(surface, mode))) >= 7,
    }))
    expect(ratios).toEqual(QRCC_MODES.map((mode) => ({ mode, enough: true })))
  })

  it.each(cases)(
    '$foreground は $background に対して $mode で $minimum:1 以上',
    ({ foreground, background, mode, minimum }) => {
      const fg = byId.get(foreground)
      const bg = byId.get(background)
      expect(fg, `${foreground} が dist/tokens.json に無い`).toBeDefined()
      expect(bg, `${background} が dist/tokens.json に無い`).toBeDefined()
      if (fg === undefined || bg === undefined) {
        return
      }
      expect(ratio(toCss(valueIn(fg, mode)), toCss(valueIn(bg, mode)))).toBeGreaterThanOrEqual(
        minimum,
      )
    },
  )
})
