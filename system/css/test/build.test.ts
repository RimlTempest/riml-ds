import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'postcss'
import type { AtRule, Declaration, Root, Rule } from 'postcss'
import { beforeAll, describe, expect, it } from 'vitest'

const pkgDir = fileURLToPath(new URL('..', import.meta.url))
const srcFile = (name: string): string => fileURLToPath(new URL(`../src/${name}`, import.meta.url))
const distIndex = fileURLToPath(new URL('../dist/index.css', import.meta.url))
const tokensCss = fileURLToPath(new URL('../../tokens/dist/tokens.css', import.meta.url))

const LAYER_ORDER = 'rd.reset, rd.tokens, rd.base, rd.components, rd.utilities, rd.overrides'
const SOURCES = ['reset.css', 'base.css', 'utilities.css', 'print.css', 'forced-colors.css']
const MOTION_PROPS = new Set([
  'transition',
  'transition-property',
  'transition-duration',
  'animation',
  'animation-name',
  'animation-duration',
])

const read = (path: string): string => readFileSync(path, 'utf8')

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

  it('使っている var(--rd-*) がすべて tokens.css に定義されている', () => {
    const used = new Set(
      [...read(distIndex).matchAll(/var\((--rd-[a-z0-9-]+)/g)].flatMap((match) =>
        match[1] === undefined ? [] : [match[1]],
      ),
    )
    const defined = new Set(
      [...read(tokensCss).matchAll(/^\s*(--rd-[a-z0-9-]+)\s*:/gm)].flatMap((match) =>
        match[1] === undefined ? [] : [match[1]],
      ),
    )
    expect(used.size).toBeGreaterThan(0)
    expect([...used].filter((name) => !defined.has(name))).toEqual([])
  })

  it('a の下線は text-underline-offset をトークンで指定する（plan 003 の見送りを回収）', () => {
    const base = read(srcFile('base.css'))
    expect(base).toMatch(
      /a\s*\{[^}]*text-underline-offset:\s*var\(--rd-type-link-underline-offset\)/,
    )
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
})
