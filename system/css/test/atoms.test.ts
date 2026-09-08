import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'postcss'
import type { AtRule, Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

const srcAtoms = fileURLToPath(new URL('../src/atoms.css', import.meta.url))

const read = (path: string): string => readFileSync(path, 'utf8')

/** plan 018 の表がそのまま仕様。JS が要らないので部品にしない（ADR-0012 §6） */
const CLASSES = [
  '.rd-badge',
  '.rd-dot',
  '.rd-has-dot',
  '.rd-avatar',
  '.rd-avatar-group',
  '.rd-separator',
  '.rd-skeleton',
  '.rd-kbd',
  '.rd-tile',
  '.rd-icon-button',
  '.rd-toolbar',
  '.rd-list',
  '.rd-list-row',
  '.rd-list-meta',
  '.rd-table',
  '.rd-table-scroll',
  '.rd-alert',
  '.rd-alert-title',
  '.rd-alert-icon',
  '.rd-legend',
  '.rd-legend-item',
] as const

const selectorsOf = (css: string): readonly string[] => {
  const found: string[] = []
  parse(css).walkRules((rule: Rule) => {
    found.push(rule.selector)
  })
  return found
}

const atRulesOf = (css: string, name: string): readonly AtRule[] => {
  const found: AtRule[] = []
  parse(css).walkAtRules(name, (atRule) => {
    found.push(atRule)
  })
  return found
}

/**
 * `@media (prefers-reduced-motion: no-preference)` の中に在る `@keyframes` の名前。
 * 上（root）から降りて集める — 親を遡ると postcss の `Document` が混ざって型が緩む。
 */
const keyframesUnderNoPreference = (css: string): readonly string[] => {
  const found: string[] = []
  parse(css).walkAtRules('media', (media: AtRule) => {
    if (!/prefers-reduced-motion\s*:\s*no-preference/.test(media.params)) return
    media.walkAtRules('keyframes', (keyframes: AtRule) => {
      found.push(keyframes.params)
    })
  })
  return found
}

describe('atoms.css', () => {
  it('@layer rd.components を 1 つだけ持つ', () => {
    const layers = atRulesOf(read(srcAtoms), 'layer')
    expect(layers).toHaveLength(1)
    expect(layers[0]?.params).toBe('rd.components')
  })

  it('表のクラスがすべて出る', () => {
    const selectors = selectorsOf(read(srcAtoms))
    const missing = CLASSES.filter(
      (name) => !selectors.some((selector) => new RegExp(`\\${name}(?![a-z-])`).test(selector)),
    )
    expect(missing).toEqual([])
  })

  it('各クラスの想定マークアップがコメントで書いてある（CSS 版の契約）', () => {
    const css = read(srcAtoms)
    const documented = CLASSES.filter((name) =>
      new RegExp(`class="[^"]*${name.slice(1)}(?![a-z-])`).test(css),
    )
    expect(documented).toEqual([...CLASSES])
  })

  it('@keyframes rd-skeleton-pulse は prefers-reduced-motion: no-preference の中だけ', () => {
    const css = read(srcAtoms)
    const all = atRulesOf(css, 'keyframes').map((atRule) => atRule.params)
    expect(all).toEqual(['rd-skeleton-pulse'])
    expect(keyframesUnderNoPreference(css)).toEqual(all)
  })

  it('グラデーションとぼかしを使わない（skeleton の shimmer もグラデにしない。brand.md §8）', () => {
    const css = read(srcAtoms)
    expect(css).not.toMatch(/linear-gradient|radial-gradient|filter:/)
  })

  it('パレットトークンを直接使わない', () => {
    expect(read(srcAtoms)).not.toContain('--rd-color-palette-')
  })

  it('文字を載せる面に brand.* を使わない（brand.md §9）', () => {
    const withBrand = selectorsOf(read(srcAtoms)).filter((selector) => {
      const rules: string[] = []
      parse(read(srcAtoms)).walkRules((rule) => {
        if (rule.selector !== selector) return
        for (const node of rule.nodes) {
          if (node.type === 'decl' && node.prop === 'color') rules.push(node.value)
        }
      })
      return rules.some((value) => value.includes('--rd-color-brand-'))
    })
    expect(withBrand).toEqual([])
  })

  it('forced-colors のブロックがあり、選択行を Highlight で描く', () => {
    const forced = atRulesOf(read(srcAtoms), 'media').filter((atRule) =>
      /forced-colors\s*:\s*active/.test(atRule.params),
    )
    expect(forced.length).toBeGreaterThanOrEqual(1)
    expect(forced.map((atRule) => atRule.toString()).join('\n')).toContain('Highlight')
  })

  it('build の ORDER は typography → atoms → patterns（patterns が atoms を上書きできる）', () => {
    const build = read(fileURLToPath(new URL('../scripts/build.ts', import.meta.url)))
    const order = /const ORDER = \[([\s\S]*?)\]/.exec(build)?.[1] ?? ''
    const names = [...order.matchAll(/'([a-z-]+)'/g)].map((match) => match[1])
    expect(names).toEqual([
      'layers',
      'reset',
      'base',
      'typography',
      'atoms',
      'patterns',
      'utilities',
      'print',
      'forced-colors',
    ])
  })

  it('package.json が atoms.css を export する', () => {
    const pkg: unknown = JSON.parse(
      read(fileURLToPath(new URL('../package.json', import.meta.url))),
    )
    const exportsField =
      typeof pkg === 'object' && pkg !== null && 'exports' in pkg ? pkg.exports : {}
    const keys =
      typeof exportsField === 'object' && exportsField !== null ? Object.keys(exportsField) : []
    expect(keys).toContain('./atoms.css')
  })
})
