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
  // plan 022（面と待ち）。Card / Empty / Spinner / Accordion / Carousel / Scroll Area
  '.rd-card',
  '.rd-card-media',
  '.rd-card-body',
  '.rd-card-title',
  '.rd-card-footer',
  '.rd-empty',
  '.rd-empty-icon',
  '.rd-empty-title',
  '.rd-empty-actions',
  '.rd-spinner',
  '.rd-accordion',
  '.rd-carousel',
  '.rd-carousel-track',
  '.rd-carousel-item',
  '.rd-scroll-area',
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

  it('@keyframes は prefers-reduced-motion: no-preference の中だけ', () => {
    const css = read(srcAtoms)
    const all = atRulesOf(css, 'keyframes').map((atRule) => atRule.params)
    expect(all).toEqual(['rd-skeleton-pulse', 'rd-spin'])
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

  it('build の ORDER は typography → atoms → navigation → patterns（後ろが前を上書きできる）', () => {
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

/** 指定したセレクタの規則が持つ `prop:value` を全部集める（plan 022 の面と待ちの検査用） */
const declsOf = (pattern: RegExp): readonly string[] => {
  const found: string[] = []
  parse(read(srcAtoms)).walkRules(pattern, (rule: Rule) => {
    rule.walkDecls((decl) => {
      found.push(`${decl.prop}:${decl.value}`)
    })
  })
  return found
}

/** `@media (prefers-reduced-motion: no-preference)` の中に在る宣言の `prop:value` */
const declsUnderNoPreference = (): readonly string[] => {
  const found: string[] = []
  parse(read(srcAtoms)).walkAtRules('media', (media: AtRule) => {
    if (!/prefers-reduced-motion\s*:\s*no-preference/.test(media.params)) return
    media.walkDecls((decl) => {
      found.push(`${decl.prop}:${decl.value}`)
    })
  })
  return found
}

/** 動き（回転・滑らかな転がり）の宣言だけを拾う */
const isMotion = (decl: string): boolean =>
  decl.startsWith('animation') || decl.startsWith('scroll-behavior')

/** ファイル全体の動きの宣言。`declsUnderNoPreference()` と一致すれば「外に 1 つも無い」 */
const allMotionDecls = (): readonly string[] => {
  const found: string[] = []
  parse(read(srcAtoms)).walkDecls((decl) => {
    found.push(`${decl.prop}:${decl.value}`)
  })
  return found.filter((decl) => isMotion(decl))
}

describe('atoms.css の面と待ち（plan 022）', () => {
  it('カードは面・硬い影・点線の区切りで組む（brand.md §7.6）', () => {
    expect(declsOf(/^\.rd-card$/)).toContain('box-shadow:var(--rd-shadow-raised)')
    expect(declsOf(/^\.rd-card$/)).toContain('background:var(--rd-color-surface-raised)')
    expect(declsOf(/^\.rd-card-footer$/).join('\n')).toContain('dashed')
  })

  it('リンクカードは擬似要素でカード全面を押せるようにする', () => {
    expect(declsOf(/^\.rd-card-link::after$/)).toContain('inset:0')
    expect(declsOf(/^\.rd-card$/)).toContain('position:relative')
  })

  it('spinner は罫線の輪で、回転は reduced-motion の外に 1 つも無い', () => {
    const spinner = declsOf(/^\.rd-spinner$/)
    expect(spinner).toContain('border-radius:var(--rd-radius-full)')
    expect(spinner.some((decl) => decl.startsWith('border-width:'))).toBe(true)
    expect(spinner).toContain('border-block-start-color:var(--rd-color-accent-default)')
    // 動きの宣言はファイル全体で no-preference の中にしか無い（spinner の回転もそこ）
    expect(allMotionDecls()).toEqual(declsUnderNoPreference().filter((decl) => isMotion(decl)))
    expect(declsUnderNoPreference()).toContain('animation-name:rd-spin')
  })

  it('グラデーションを 1 つも描かない（spinner の輪も罫線。brand.md §9）', () => {
    expect(read(srcAtoms)).not.toMatch(/gradient\(/)
  })

  it('carousel は CSS scroll snap で動く（前後ボタンの JS を持たない）', () => {
    expect(declsOf(/^\.rd-carousel$/)).toContain('scroll-snap-type:x mandatory')
    expect(declsOf(/^\.rd-carousel-item$/)).toContain('scroll-snap-align:start')
    expect(declsUnderNoPreference()).toContain('scroll-behavior:smooth')
  })

  it('scroll-area は細いスクロールバーを持ち、強制配色では既定に戻す', () => {
    const all = read(srcAtoms)
    expect(all).toContain('scrollbar-width: thin')
    const forced = all.slice(all.indexOf('@media (forced-colors: active)'))
    expect(forced).toContain('scrollbar-color: auto')
  })

  it('accordion は入れ物だけで、rd-disclosure の中身に触らない', () => {
    const inner = selectorsOf(read(srcAtoms)).filter(
      (selector) => selector.includes('rd-disclosure') && /summary|details/.test(selector),
    )
    expect(inner).toEqual([])
  })
})

describe('atoms.css の表（plan 035）', () => {
  it('表の見出しは折り返さない（td は折り返す）', () => {
    expect(declsOf(/\.rd-table :where\(th\)/)).toContain('white-space:nowrap')
    expect(declsOf(/\.rd-table :where\(td\)/)).not.toContain('white-space:nowrap')
  })
})
