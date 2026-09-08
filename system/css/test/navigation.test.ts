import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'postcss'
import type { AtRule, Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

const srcNavigation = fileURLToPath(new URL('../src/navigation.css', import.meta.url))
const read = (path: string): string => readFileSync(path, 'utf8')

/** plan 020 の表がそのまま仕様。JS が要らないので部品にしない（ADR-0012 §6） */
const CLASSES = [
  '.rd-breadcrumb',
  '.rd-pagination',
  '.rd-nav-rail',
  '.rd-menubar',
  '.rd-sidebar',
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

describe('navigation.css', () => {
  it('@layer rd.components を 1 つだけ持つ', () => {
    const layers = atRulesOf(read(srcNavigation), 'layer')
    expect(layers).toHaveLength(1)
    expect(layers[0]?.params).toBe('rd.components')
  })

  it('表のクラスがすべて出る', () => {
    const selectors = selectorsOf(read(srcNavigation))
    const missing = CLASSES.filter(
      (name) => !selectors.some((selector) => new RegExp(`\\${name}(?![a-z-])`).test(selector)),
    )
    expect(missing).toEqual([])
  })

  it('各クラスの想定マークアップがコメントで書いてある（CSS 版の契約）', () => {
    const css = read(srcNavigation)
    const documented = CLASSES.filter((name) =>
      new RegExp(`class="[^"]*${name.slice(1)}(?![a-z-])`).test(css),
    )
    expect(documented).toEqual([...CLASSES])
  })

  it('ARIA は利用側が書く（CSS は aria-current / aria-label を読むだけで作らない）', () => {
    const selectors = selectorsOf(read(srcNavigation))
    expect(selectors.some((selector) => selector.includes('[aria-current='))).toBe(true)
  })

  it('パンくずの区切りは生成コンテンツで、代替テキストを空にする', () => {
    expect(read(srcNavigation)).toMatch(/content:\s*'\/'\s*\/\s*''/)
  })

  it('グラデーションとぼかしを使わない（brand.md §8）', () => {
    expect(read(srcNavigation)).not.toMatch(/linear-gradient|radial-gradient|filter:/)
  })

  it('パレットトークンを直接使わない', () => {
    expect(read(srcNavigation)).not.toContain('--rd-color-palette-')
  })

  it('forced-colors のブロックがあり、現在地を Highlight の輪郭で示す', () => {
    const forced = atRulesOf(read(srcNavigation), 'media').filter((atRule) =>
      /forced-colors\s*:\s*active/.test(atRule.params),
    )
    expect(forced.length).toBeGreaterThanOrEqual(1)
    const current: Rule[] = []
    for (const atRule of forced) {
      atRule.walkRules(/\[aria-current/, (rule) => {
        // ::before は点（文字を載せない目印）なので地に Highlight を敷いてよい
        if (!rule.selector.includes('::before')) {
          current.push(rule)
        }
      })
    }
    expect(current.length).toBeGreaterThanOrEqual(1)
    const decls = current.flatMap((rule) =>
      rule.nodes.flatMap((node) => (node.type === 'decl' ? [`${node.prop}: ${node.value}`] : [])),
    )
    expect(decls.some((decl) => /^outline: .*Highlight/.test(decl))).toBe(true)
    // 文字を載せる面に Highlight を敷かない（Chromium のバックプレートで読めなくなる）
    expect(decls).not.toContain('background: Highlight')
  })

  it('build の ORDER で navigation は atoms の直後（patterns より前）', () => {
    const build = read(fileURLToPath(new URL('../scripts/build.ts', import.meta.url)))
    const order = /const ORDER = \[([\s\S]*?)\]/.exec(build)?.[1] ?? ''
    const names = [...order.matchAll(/'([a-z-]+)'/g)].map((match) => match[1])
    expect(names).toEqual([
      'layers',
      'reset',
      'base',
      'typography',
      'atoms',
      'navigation',
      'patterns',
      'utilities',
      'print',
      'forced-colors',
    ])
  })

  it('package.json が navigation.css を export する', () => {
    const pkg: unknown = JSON.parse(
      read(fileURLToPath(new URL('../package.json', import.meta.url))),
    )
    const exportsField =
      typeof pkg === 'object' && pkg !== null && 'exports' in pkg ? pkg.exports : {}
    const keys =
      typeof exportsField === 'object' && exportsField !== null ? Object.keys(exportsField) : []
    expect(keys).toContain('./navigation.css')
  })

  // dist/index.css に出ることは build.test.ts が（自分で build してから）押さえる
})
