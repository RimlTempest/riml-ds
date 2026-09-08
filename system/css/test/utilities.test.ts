/**
 * `utilities.css`（`@layer rd.utilities`）。1 目的のクラスだけを置く場所で、
 * ユーティリティ CSS フレームワークにはしない（system/css/README.md）。
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'postcss'
import type { AtRule, Declaration, Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

const srcUtilities = fileURLToPath(new URL('../src/utilities.css', import.meta.url))

const read = (): string => readFileSync(srcUtilities, 'utf8')

const selectorsOf = (): readonly string[] => {
  const found: string[] = []
  parse(read()).walkRules((rule: Rule) => {
    found.push(rule.selector)
  })
  return found
}

const declsOf = (pattern: RegExp): readonly string[] => {
  const found: string[] = []
  parse(read()).walkRules(pattern, (rule: Rule) => {
    rule.walkDecls((decl: Declaration) => {
      found.push(`${decl.prop}:${decl.value}`)
    })
  })
  return found
}

describe('utilities.css', () => {
  it('@layer rd.utilities を 1 つだけ持つ', () => {
    const layers: AtRule[] = []
    parse(read()).walkAtRules('layer', (atRule) => {
      layers.push(atRule)
    })
    expect(layers).toHaveLength(1)
    expect(layers[0]?.params).toBe('rd.utilities')
  })

  it('既存のユーティリティが残っている', () => {
    const all = selectorsOf().join('\n')
    for (const name of ['.rd-visually-hidden', '.rd-skip-link', '.rd-stack', '.rd-cluster']) {
      expect(all).toContain(name)
    }
  })

  it('.rd-aspect は比を --rd-aspect で受け、中身を切り抜く（plan 022）', () => {
    const aspect = declsOf(/^\.rd-aspect$/)
    expect(aspect).toContain('aspect-ratio:var(--rd-aspect, 16 / 9)')
    expect(aspect).toContain('overflow:clip')
    expect(declsOf(/^\.rd-aspect > :is\(img, video, iframe\)$/)).toContain('object-fit:cover')
  })

  it('.rd-aspect の data-ratio は 2 種だけ（他は style で --rd-aspect を渡す）', () => {
    const ratios = selectorsOf().filter((selector) => selector.includes('data-ratio'))
    expect(ratios).toEqual(["[data-ratio='1']", "[data-ratio='4-3']"].map((s) => `.rd-aspect${s}`))
    expect(declsOf(/data-ratio='1'/)).toContain('--rd-aspect:1')
    expect(declsOf(/data-ratio='4-3'/)).toContain('--rd-aspect:4 / 3')
  })

  it('グラデーションもぼかしも使わない（brand.md §9）', () => {
    expect(read()).not.toMatch(/gradient\(|filter:/)
  })

  it('パレットトークンを直接使わない', () => {
    expect(read()).not.toContain('--rd-color-palette-')
  })
})
