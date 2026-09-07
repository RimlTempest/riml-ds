import { describe, expect, it } from 'vitest'
import { byId, readDist } from './tokens-json.js'

/**
 * plan 018 が足す文字トークン。`type.display` と `type.heading.3` は流体（`clamp()`）、
 * `letter.spacing.*` はキャプションの字間、`line.height.display` は display の行間。
 */
const ADDED = [
  'type.display',
  'type.heading.3',
  'type.heading.4',
  'letter.spacing.normal',
  'letter.spacing.wide',
  'line.height.display',
] as const

const cssVarOf = (name: string): string | undefined => {
  const css = readDist('tokens.css')
  const match = new RegExp(`^\\s*${name}:\\s*(.+);$`, 'm').exec(css)
  return match?.[1]
}

describe('plan 018 の文字トークン', () => {
  it('display / heading.3 / heading.4 / letter.spacing / line.height.display が在る', () => {
    expect(ADDED.filter((id) => !byId.has(id))).toEqual([])
  })

  it('足したトークンはすべて $description を持つ', () => {
    const missing = ADDED.filter((id) => {
      const description = byId.get(id)?.$description
      return description === undefined || description === ''
    })
    expect(missing).toEqual([])
  })

  it('display と heading.3 の font-size は流体（clamp）', () => {
    expect(cssVarOf('--rd-type-display-font-size')).toContain('clamp(')
    expect(cssVarOf('--rd-type-heading-3-font-size')).toContain('clamp(')
  })

  it('heading.4 は流体にしない（窓の中の見出しは幅で暴れない）', () => {
    expect(cssVarOf('--rd-type-heading-4-font-size')).not.toContain('clamp(')
  })

  it('font ショートハンド用の合成変数も出る', () => {
    expect(cssVarOf('--rd-type-display')).toBeDefined()
    expect(cssVarOf('--rd-type-heading-3')).toBeDefined()
    expect(cssVarOf('--rd-type-heading-4')).toBeDefined()
  })

  it('letter-spacing と line-height.display の CSS 変数が出る', () => {
    expect(cssVarOf('--rd-letter-spacing-normal')).toBe('0em')
    expect(cssVarOf('--rd-letter-spacing-wide')).toBe('0.12em')
    expect(cssVarOf('--rd-line-height-display')).toBe('1.1')
  })

  it('display は display スタック（丸ゴシック系）を使う', () => {
    expect(cssVarOf('--rd-type-display-font-family')).toBe('var(--rd-font-family-display)')
  })
})
