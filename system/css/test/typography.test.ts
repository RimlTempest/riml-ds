import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'postcss'
import type { AtRule, Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

const srcTypography = fileURLToPath(new URL('../src/typography.css', import.meta.url))

const read = (path: string): string => readFileSync(path, 'utf8')

/** plan 018 の表がそのまま仕様。クラスは「見た目」で、見出しレベル（h1..h6）とは独立 */
const CLASSES = [
  '.rd-display',
  '.rd-heading-1',
  '.rd-heading-2',
  '.rd-heading-3',
  '.rd-heading-4',
  '.rd-body',
  '.rd-small',
  '.rd-caption',
  '.rd-label',
  '.rd-mono',
  '.rd-numeric',
  '.rd-truncate',
  '.rd-clamp',
  '.rd-prose',
] as const

const selectorsOf = (css: string): readonly string[] => {
  const found: string[] = []
  parse(css).walkRules((rule: Rule) => {
    found.push(rule.selector)
  })
  return found
}

/** グループセレクタを 1 本ずつに割る（`:where(a, b)` の中のカンマでは割らない） */
const parts = (selectors: readonly string[]): readonly string[] =>
  selectors
    .flatMap((selector) => selector.replace(/:where\([^)]*\)/g, ':where()').split(','))
    .map((part) => part.trim())

/** `:where(…)` の中身を消して、詳細度を持つ部分だけを残す */
const outsideWhere = (selector: string): string => selector.replace(/:where\([^)]*\)/g, '')

const declsOf = (css: string, pattern: RegExp): readonly string[] => {
  const found: string[] = []
  parse(css).walkRules(pattern, (rule) => {
    for (const node of rule.nodes) {
      if (node.type === 'decl') found.push(`${node.prop}:${node.value}`)
    }
  })
  return found
}

describe('typography.css', () => {
  it('@layer rd.components を 1 つだけ持つ', () => {
    const layers: AtRule[] = []
    parse(read(srcTypography)).walkAtRules('layer', (atRule) => {
      layers.push(atRule)
    })
    expect(layers).toHaveLength(1)
    expect(layers[0]?.params).toBe('rd.components')
  })

  it('表のクラスがすべて出る', () => {
    const selectors = selectorsOf(read(srcTypography))
    const missing = CLASSES.filter((name) => !selectors.some((selector) => selector.includes(name)))
    expect(missing).toEqual([])
  })

  it('.rd-caption は字間を letter.spacing.wide にし、補助色で出す', () => {
    const decls = declsOf(read(srcTypography), /^\.rd-caption$/)
    expect(decls).toContain('letter-spacing:var(--rd-letter-spacing-wide)')
    expect(decls).toContain('color:var(--rd-color-text-muted)')
  })

  it('text-transform: uppercase は書かない（日本語に効かない・利用側の選択）', () => {
    expect(read(srcTypography)).not.toContain('uppercase')
  })

  it('.rd-prose の要素セレクタは :where() で詳細度 0（利用側のクラスが勝てる）', () => {
    const bare = parts(selectorsOf(read(srcTypography)))
      .filter((part) => part.includes('.rd-prose'))
      .filter((part) => /[a-z]/.test(outsideWhere(part).replaceAll('.rd-prose', '')))
    expect(bare).toEqual([])
  })

  it('素の h1..h6 には触らない（base.css の責務。plan 018 の保守メモ）', () => {
    const bareHeadings = parts(selectorsOf(read(srcTypography))).filter((part) =>
      /(^|[\s>+~])h[1-6]\b/.test(outsideWhere(part)),
    )
    expect(bareHeadings).toEqual([])
  })

  it('グラデーションとぼかしを使わない（brand.md §8）', () => {
    const css = read(srcTypography)
    expect(css).not.toMatch(/linear-gradient|radial-gradient|filter:/)
  })

  it('パレットトークンを直接使わない', () => {
    expect(read(srcTypography)).not.toContain('--rd-color-palette-')
  })

  it('build の ORDER は base の次が typography（patterns より前）', () => {
    const build = read(fileURLToPath(new URL('../scripts/build.ts', import.meta.url)))
    const order = /const ORDER = \[([\s\S]*?)\]/.exec(build)?.[1] ?? ''
    const names = [...order.matchAll(/'([a-z-]+)'/g)].map((match) => match[1])
    expect(names.indexOf('typography')).toBe(names.indexOf('base') + 1)
    expect(names.indexOf('typography')).toBeLessThan(names.indexOf('patterns'))
  })

  it('package.json が typography.css を export し、tokens を optional peer にする', () => {
    const pkg: unknown = JSON.parse(
      read(fileURLToPath(new URL('../package.json', import.meta.url))),
    )
    const exportsField =
      typeof pkg === 'object' && pkg !== null && 'exports' in pkg ? pkg.exports : {}
    const keys =
      typeof exportsField === 'object' && exportsField !== null ? Object.keys(exportsField) : []
    expect(keys).toContain('./typography.css')

    const meta =
      typeof pkg === 'object' && pkg !== null && 'peerDependenciesMeta' in pkg
        ? pkg.peerDependenciesMeta
        : undefined
    expect(meta).toEqual({ '@rimltempest/riml-ds-tokens': { optional: true } })
  })
})
