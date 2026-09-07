import { describe, expect, it } from 'vitest'
import { byId, flatten, readDist, readSrc, tokensJson } from './tokens-json.js'

const SRC_FILES = [
  'base/color.tokens.json',
  'base/dimension.tokens.json',
  'base/typography.tokens.json',
  'base/motion.tokens.json',
  'base/layer.tokens.json',
  'semantic/color.tokens.json',
  'semantic/space.tokens.json',
  'semantic/typography.tokens.json',
  'semantic/shape.tokens.json',
  'semantic/focus.tokens.json',
  'semantic/elevation.tokens.json',
] as const

const CSS_VAR = /^--rd-[a-z0-9-]+$/

const BRANDS = ['qrcc', 'noter'] as const

const fontSizeRem = (id: string): number | undefined => {
  const value = byId.get(id)?.$value['fontSize']
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined
  }
  const size: unknown = Object.entries(value).find(([key]) => key === 'value')?.[1]
  return typeof size === 'number' ? size : undefined
}

describe('トークンの不変条件', () => {
  it('公開トークン（color.palette.* 以外）はすべて $description を持つ', () => {
    const missing = tokensJson
      .filter((leaf) => !leaf.id.startsWith('color.palette.'))
      .filter((leaf) => leaf.$description === undefined || leaf.$description === '')
      .map((leaf) => leaf.id)
    expect(missing).toEqual([])
  })

  it('CSS 変数名はすべて --rd- で始まる kebab-case', () => {
    const wrong = tokensJson
      .filter((leaf) => {
        const cssVar = leaf.riml['cssVar']
        return typeof cssVar !== 'string' || !CSS_VAR.test(cssVar)
      })
      .map((leaf) => leaf.id)
    expect(wrong).toEqual([])
  })

  it('tokens.js は値ではなく var(--rd-…) だけを配る', () => {
    const js = readDist('tokens.js')
    const values = [...js.matchAll(/: "([^"]+)"/g)].map((match) => match[1] ?? '')
    expect(values.length).toBeGreaterThan(0)
    expect(values.every((value) => value.startsWith('var(--rd-'))).toBe(true)
    expect(js).not.toContain('oklch')
  })

  it('sizing.target-min は compact でも 2.75rem（AAA 2.5.5 の 44px を縮めない）', () => {
    const target = byId.get('sizing.target-min')
    expect(target?.$value).toEqual({ value: 2.75, unit: 'rem' })
    expect(target?.riml['modes']).toBeUndefined()
  })

  it('type.small は 0.875rem（14px）、type.mono は 0.9375rem、他の本文サイズは 1rem 以上', () => {
    expect(fontSizeRem('type.small')).toBe(0.875)
    expect(fontSizeRem('type.mono')).toBe(0.9375)
    const others = tokensJson
      .filter(
        (leaf) =>
          leaf.$type === 'typography' && leaf.id !== 'type.small' && leaf.id !== 'type.mono',
      )
      .map((leaf) => fontSizeRem(leaf.id) ?? 0)
    expect(others.length).toBeGreaterThan(0)
    expect(others.every((size) => size >= 1)).toBe(true)
  })

  it('surface.hover と status.danger.hover がある（qrcc / noter 移行の前提）', () => {
    expect(byId.has('color.surface.hover')).toBe(true)
    expect(byId.has('color.status.danger.hover')).toBe(true)
  })

  it('テーマ（themes/*/color.tokens.json）は color.palette.* だけを上書きする', () => {
    const themes = BRANDS.map((brand) => {
      const document: unknown = JSON.parse(readSrc(`themes/${brand}/color.tokens.json`))
      const ids = flatten(document).map((leaf) => leaf.id)
      return {
        brand,
        empty: ids.length === 0,
        outside: ids.filter((id) => !id.startsWith('color.palette.')),
      }
    })
    // semantic を直接上書きするテーマはモードの組み合わせごとに値を持つことになり保守できない。
    expect(themes).toEqual(BRANDS.map((brand) => ({ brand, empty: false, outside: [] })))
  })

  it('dist/tokens.json のトークン数は src の葉の数と一致する（取りこぼしが無い）', () => {
    const declared = SRC_FILES.flatMap((file) =>
      flatten(JSON.parse(readSrc(file))).map((leaf) => leaf.id),
    )
    expect(new Set(declared).size).toBe(declared.length)
    expect(tokensJson.map((leaf) => leaf.id).toSorted()).toEqual(declared.toSorted())
  })
})
