import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'postcss'
import type { AtRule, Declaration, Root, Rule } from 'postcss'
import { beforeAll, describe, expect, it } from 'vitest'

const pkgDir = fileURLToPath(new URL('..', import.meta.url))
const srcFile = (name: string): string => fileURLToPath(new URL(`../src/${name}`, import.meta.url))
const distIndex = fileURLToPath(new URL('../dist/index.css', import.meta.url))
const distFile = (name: string): string =>
  fileURLToPath(new URL(`../dist/${name}`, import.meta.url))
const tokensCss = fileURLToPath(new URL('../../tokens/dist/tokens.css', import.meta.url))

const LAYER_ORDER = 'rd.reset, rd.tokens, rd.base, rd.components, rd.utilities, rd.overrides'
const SOURCES = [
  'reset.css',
  'base.css',
  'typography.css',
  'atoms.css',
  'navigation.css',
  'patterns.css',
  'utilities.css',
  'print.css',
  'forced-colors.css',
]
/**
 * トークンではなく「利用側が渡すつまみ」。`var(--rd-…, 既定値)` の形で使い、
 * tokens.css には定義が無いのが正しい（typography.css / atoms.css のコメントが契約）。
 */
const KNOBS = new Set([
  '--rd-clamp-lines',
  '--rd-avatar-size',
  '--rd-tile-size',
  '--rd-skeleton-width',
  '--rd-alert-tone',
  '--rd-legend-swatch',
  '--rd-sidebar-inline-size',
])

/** plan 018 の 2 表 + plan 020 の navigation。dist に出ていることだけをここで押さえる */
const PUBLIC_CLASSES = [
  '.rd-display',
  '.rd-heading-1',
  '.rd-heading-4',
  '.rd-body',
  '.rd-caption',
  '.rd-truncate',
  '.rd-clamp',
  '.rd-prose',
  '.rd-badge',
  '.rd-avatar',
  '.rd-separator',
  '.rd-skeleton',
  '.rd-kbd',
  '.rd-tile',
  '.rd-icon-button',
  '.rd-toolbar',
  '.rd-list-row',
  '.rd-table',
  '.rd-alert',
  '.rd-legend-item',
  '.rd-breadcrumb',
  '.rd-pagination',
  '.rd-nav-rail',
  '.rd-menubar',
  '.rd-sidebar',
] as const

const MOTION_PROPS = new Set([
  'transition',
  'transition-property',
  'transition-duration',
  'animation',
  'animation-name',
  'animation-duration',
])

const read = (path: string): string => readFileSync(path, 'utf8')

/** その CSS が自分で定義している `--rd-*` の名前 */
const declared = (css: string): readonly string[] =>
  [...css.matchAll(/^\s*(--rd-[a-z0-9-]+)\s*:/gm)].flatMap((match) =>
    match[1] === undefined ? [] : [match[1]],
  )

/** `@media (prefers-reduced-motion: no-preference)` の中にある宣言を集める */
const declsUnderNoPreference = (root: Root): ReadonlySet<Declaration> => {
  const allowed = new Set<Declaration>()
  root.walkAtRules('media', (atRule) => {
    if (!/prefers-reduced-motion\s*:\s*no-preference/.test(atRule.params)) return
    atRule.walkDecls((decl) => {
      allowed.add(decl)
    })
  })
  return allowed
}

describe('@rimltempest/riml-ds-css の build', () => {
  beforeAll(() => {
    const result = spawnSync('bun', ['run', 'build'], { cwd: pkgDir, encoding: 'utf8' })
    if (result.status !== 0) {
      throw new Error(`build failed (${result.status}):\n${result.stdout}\n${result.stderr}`)
    }
  }, 120_000)

  it('index.css の最初の非コメント行がレイヤー順の宣言', () => {
    const root = parse(read(distIndex))
    const first = root.nodes.find((node) => node.type !== 'comment')
    expect(first?.type).toBe('atrule')
    const atRule: AtRule | undefined = first?.type === 'atrule' ? first : undefined
    expect(atRule?.name).toBe('layer')
    expect(atRule?.params).toBe(LAYER_ORDER)
  })

  it('index.css に important 宣言・16 進数の色・@import が無い', () => {
    const css = read(distIndex)
    const root = parse(css)
    const importants: string[] = []
    root.walkDecls((decl) => {
      if (decl.important) importants.push(decl.prop)
    })
    expect(importants).toEqual([])
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}/)
    expect(root.nodes.some((node) => node.type === 'atrule' && node.name === 'import')).toBe(false)
  })

  it('index.css のモーションはすべて prefers-reduced-motion: no-preference の中', () => {
    const root = parse(read(distIndex))
    const allowed = declsUnderNoPreference(root)
    const bare: string[] = []
    root.walkDecls((decl: Declaration) => {
      if (!MOTION_PROPS.has(decl.prop)) return
      if (decl.value.trim() === 'none') return
      if (allowed.has(decl)) return
      bare.push(`${decl.prop}: ${decl.value}`)
    })
    expect(bare).toEqual([])
  })

  it('layers.css 以外の src は @layer rd.<name> を 1 つだけ持つ', () => {
    for (const name of SOURCES) {
      const root = parse(read(srcFile(name)))
      const layers: AtRule[] = []
      root.walkAtRules('layer', (atRule) => {
        layers.push(atRule)
      })
      expect(layers).toHaveLength(1)
      expect(layers[0]?.params).toMatch(/^rd\.[a-z]+$/)
    }
  })

  it('使っている var(--rd-*) がすべて tokens.css か index.css 自身に定義されている', () => {
    const used = new Set(
      [...read(distIndex).matchAll(/var\((--rd-[a-z0-9-]+)/g)].flatMap((match) =>
        match[1] === undefined ? [] : [match[1]],
      ),
    )
    // トークンでない局所変数（例: `--rd-window-glyph`）は index.css 自身が定義する。
    // 定義せずに使えばここで落ちる（plan 017 / ADR-0014）
    const defined = new Set([...declared(read(tokensCss)), ...declared(read(distIndex))])
    expect(used.size).toBeGreaterThan(0)
    expect([...used].filter((name) => !defined.has(name) && !KNOBS.has(name))).toEqual([])
  })

  it('typography / atoms / navigation のクラスが dist/index.css に出る（plan 018 / 020 の完了条件）', () => {
    const selectors: string[] = []
    parse(read(distIndex)).walkRules((rule) => {
      selectors.push(rule.selector)
    })
    const missing = PUBLIC_CLASSES.filter(
      (name) => !selectors.some((selector) => selector.includes(name)),
    )
    expect(missing).toEqual([])
  })

  it('a の下線は text-underline-offset をトークンで指定する（plan 003 の見送りを回収）', () => {
    const base = read(srcFile('base.css'))
    expect(base).toMatch(
      /a\s*\{[^}]*text-underline-offset:\s*var\(--rd-type-link-underline-offset\)/,
    )
  })

  it('print.css は見出し直後と表・図・コードの途中で改ページしない', () => {
    const print = read(srcFile('print.css'))
    expect(print).toMatch(/break-after:\s*avoid/)
    expect(print).toMatch(/break-inside:\s*avoid/)
  })

  it('.rd-skip-link はフォーカスされるまで隠れる（ADR-0012 §6）', () => {
    const root = parse(read(distIndex))
    const rules: Rule[] = []
    root.walkRules(/\.rd-skip-link/, (rule) => {
      rules.push(rule)
    })
    expect(rules.length).toBeGreaterThanOrEqual(2)

    const hidden = rules.find((rule) => rule.selector.includes(':not(:focus'))
    expect(hidden).toBeDefined()
    const props = (hidden?.nodes ?? []).flatMap((node) => (node.type === 'decl' ? [node.prop] : []))
    expect(props).toContain('clip-path')
    expect(props).toContain('position')
  })

  it('patterns.css の窓は @layer rd.components の中にある（brand.md §7.1）', () => {
    const root = parse(read(srcFile('patterns.css')))
    const layers: AtRule[] = []
    root.walkAtRules('layer', (atRule) => {
      layers.push(atRule)
    })
    expect(layers).toHaveLength(1)
    expect(layers[0]?.params).toBe('rd.components')

    const selectors: string[] = []
    layers[0]?.walkRules((rule) => {
      selectors.push(rule.selector)
    })
    expect(selectors.some((selector) => selector.includes('.rd-window-title'))).toBe(true)
    expect(selectors.some((selector) => selector.includes('.rd-window-body'))).toBe(true)
    expect(read(distFile('patterns.css'))).toContain('.rd-window')
  })

  it('帯の丸は装飾ではなく <button>（ADR-0014 決定 1）', () => {
    const patterns = read(srcFile('patterns.css'))
    expect(patterns).not.toContain('radial-gradient')

    const root = parse(patterns)
    const control: Rule[] = []
    root.walkRules(/^\.rd-window-control$/, (rule) => {
      control.push(rule)
    })
    expect(control).toHaveLength(1)
    const decls = control.flatMap((rule) =>
      rule.nodes.flatMap((node) => (node.type === 'decl' ? [`${node.prop}:${node.value}`] : [])),
    )
    // 当たり判定は sizing.target-min 四方。丸の見た目は ::before が描く
    expect(decls).toContain('inline-size:var(--rd-sizing-target-min)')
    expect(decls).toContain('block-size:var(--rd-sizing-target-min)')
  })

  it('h1 / h2 は display スタックの font-family を参照する（brand.md §6）', () => {
    const base = read(srcFile('base.css'))
    expect(base).toMatch(/h1\s*\{[^}]*font-family:\s*var\(--rd-type-heading-1-font-family\)/)
    expect(base).toMatch(/h2\s*\{[^}]*font-family:\s*var\(--rd-type-heading-2-font-family\)/)
  })

  it('hr は点線の区切り（brand.md §7.6）', () => {
    const root = parse(read(srcFile('base.css')))
    const rules: Rule[] = []
    root.walkRules(/^hr$/, (rule) => {
      rules.push(rule)
    })
    expect(rules).toHaveLength(1)
    const decls = (rules[0]?.nodes ?? []).flatMap((node) =>
      node.type === 'decl' ? [`${node.prop}:${node.value}`] : [],
    )
    expect(decls.some((decl) => decl.includes('dotted'))).toBe(true)
  })
})
