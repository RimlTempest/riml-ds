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

/** ダークの面は 4 段（sunken / default / raised / hover）を持つ。 */
const DARK_MODES: readonly Mode[] = ['dark', 'theme-qrcc-dark', 'theme-noter-dark']

const SURFACE_IDS = [
  'color.surface.default',
  'color.surface.raised',
  'color.surface.sunken',
  'color.surface.hover',
] as const

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
  it('contrastAgainst を持つトークンが 15 個ある（テキスト 11 + 非テキスト 4）', () => {
    expect(new Set(cases.map((entry) => entry.foreground)).size).toBe(15)
  })

  it('ライトの本文色は既定・浮いた面・窪んだ面のどれの上でも 7:1 以上（brand.md §3）', () => {
    // surface.raised / sunken は contrastAgainst に無いので、ここで固定する。
    const text = byId.get('color.text.default')
    expect(text).toBeDefined()
    if (text === undefined) {
      return
    }
    const surfaces = ['color.surface.default', 'color.surface.raised', 'color.surface.sunken']
    const ratios = surfaces.map((id) => {
      const surface = byId.get(id)
      return {
        id,
        enough:
          surface !== undefined
          && ratio(toCss(valueIn(text, 'light')), toCss(valueIn(surface, 'light'))) >= 7,
      }
    })
    expect(ratios).toEqual(surfaces.map((id) => ({ id, enough: true })))
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

  it.each(DARK_MODES.map((mode) => ({ mode })))(
    'ダークの surface.default / raised / sunken / hover は 4 つとも違う色（$mode）',
    ({ mode }) => {
      const colours = SURFACE_IDS.map((id) => {
        const surface = byId.get(id)
        return surface === undefined ? id : toCss(valueIn(surface, mode))
      })
      expect(new Set(colours).size).toBe(4)
    },
  )

  it.each(CHECKED_MODES.map((mode) => ({ mode })))(
    'text.muted は surface.hover の上でも 7:1 以上（$mode）',
    ({ mode }) => {
      const muted = byId.get('color.text.muted')
      const hover = byId.get('color.surface.hover')
      expect(muted).toBeDefined()
      expect(hover).toBeDefined()
      if (muted === undefined || hover === undefined) {
        return
      }
      expect(
        ratio(toCss(valueIn(muted, mode)), toCss(valueIn(hover, mode))),
      ).toBeGreaterThanOrEqual(7)
    },
  )

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
