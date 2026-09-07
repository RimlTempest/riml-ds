import type { Package } from 'custom-elements-manifest/schema'
import { describe, expect, it } from 'vitest'
import { diffManifests, missingChangeset } from '../src/core/api-diff.js'

/**
 * `CustomElementDeclaration`（schema v1.0.0）は `customElement` / `tagName` / riml-ds 独自の
 * `pe` / `status` を持たないので、registry.test.ts と同じくレコードとして組み立てる。
 */
type Decl = Readonly<Record<string, unknown>> & { readonly kind: 'class'; readonly name: string }

const declaration = (tagName: string, extra: Readonly<Record<string, unknown>>): Decl => ({
  kind: 'class',
  name: 'Rd',
  customElement: true,
  tagName,
  status: 'stable',
  pe: 'A',
  ...extra,
})

const manifest = (declarations: readonly Decl[]): Package => ({
  schemaVersion: '1.0.0',
  modules: declarations.map((declared) => ({
    kind: 'javascript-module',
    path: `src/${String(declared['tagName'])}/element.js`,
    declarations: [declared],
  })),
})

const button = (extra: Readonly<Record<string, unknown>> = {}): Package =>
  manifest([declaration('rd-button', extra)])

describe('diffManifests', () => {
  it('要素の削除は element-removed', () => {
    const base = manifest([declaration('rd-button', {}), declaration('rd-dialog', {})])
    const head = manifest([declaration('rd-button', {})])
    expect(diffManifests(base, head).breaking).toEqual([
      { kind: 'element-removed', tag: 'rd-dialog' },
    ])
  })

  it('属性の削除は member-removed、追加は addition', () => {
    const base = button({ attributes: [{ name: 'variant' }, { name: 'size' }] })
    const head = button({ attributes: [{ name: 'variant' }] })
    expect(diffManifests(base, head).breaking).toEqual([
      { kind: 'member-removed', tag: 'rd-button', member: 'attribute', name: 'size' },
    ])
    expect(diffManifests(head, base)).toEqual({
      breaking: [],
      additions: ['rd-button: attribute "size" を追加'],
    })
  })

  it('slot / part / CSS 変数 / 状態 / メソッドの削除も member-removed', () => {
    const base = button({
      slots: [{ name: 'label' }],
      cssParts: [{ name: 'control' }],
      cssProperties: [{ name: '--rd-button-padding-inline' }],
      cssStates: [{ name: 'loading' }],
      members: [{ kind: 'method', name: 'focus', privacy: 'public' }],
    })
    const head = button({})
    expect(diffManifests(base, head).breaking).toEqual([
      { kind: 'member-removed', tag: 'rd-button', member: 'slot', name: 'label' },
      { kind: 'member-removed', tag: 'rd-button', member: 'cssPart', name: 'control' },
      {
        kind: 'member-removed',
        tag: 'rd-button',
        member: 'cssProperty',
        name: '--rd-button-padding-inline',
      },
      { kind: 'member-removed', tag: 'rd-button', member: 'cssState', name: 'loading' },
      { kind: 'member-removed', tag: 'rd-button', member: 'method', name: 'focus' },
    ])
  })

  it('union の狭めは attribute-type-narrowed', () => {
    const base = button({ attributes: [{ name: 'variant', type: { text: "'a' | 'b' | 'c'" } }] })
    const head = button({ attributes: [{ name: 'variant', type: { text: "'a' | 'b'" } }] })
    expect(diffManifests(base, head).breaking).toEqual([
      {
        kind: 'attribute-type-narrowed',
        tag: 'rd-button',
        name: 'variant',
        from: "'a' | 'b' | 'c'",
        to: "'a' | 'b'",
      },
    ])
  })

  it('union の広げは breaking ではなく addition', () => {
    const base = button({ attributes: [{ name: 'variant', type: { text: "'a' | 'b'" } }] })
    const head = button({ attributes: [{ name: 'variant', type: { text: "'a' | 'b' | 'c'" } }] })
    expect(diffManifests(base, head)).toEqual({
      breaking: [],
      additions: ["rd-button: attribute \"variant\" の型を 'a' | 'b' | 'c' に広げた"],
    })
  })

  it('属性の既定値の変更は attribute-default-changed', () => {
    const base = button({ attributes: [{ name: 'variant', default: "'primary'" }] })
    const head = button({ attributes: [{ name: 'variant', default: "'secondary'" }] })
    expect(diffManifests(base, head).breaking).toEqual([
      {
        kind: 'attribute-default-changed',
        tag: 'rd-button',
        name: 'variant',
        from: "'primary'",
        to: "'secondary'",
      },
    ])
  })

  it('イベント detail のフィールド削除は event-detail-changed、追加は addition', () => {
    const base = button({
      events: [{ name: 'rd-press', type: { text: 'CustomEvent<{ x: number; y: number }>' } }],
    })
    const head = button({
      events: [{ name: 'rd-press', type: { text: 'CustomEvent<{ x: number }>' } }],
    })
    expect(diffManifests(base, head).breaking).toEqual([
      {
        kind: 'event-detail-changed',
        tag: 'rd-button',
        name: 'rd-press',
        from: 'CustomEvent<{ x: number; y: number }>',
        to: 'CustomEvent<{ x: number }>',
      },
    ])
    expect(diffManifests(head, base)).toEqual({
      breaking: [],
      additions: ['rd-button: event "rd-press" の detail にフィールドを追加'],
    })
  })

  it('stable → experimental は status-regressed、stable → deprecated は breaking ではない', () => {
    const base = button({ status: 'stable' })
    expect(diffManifests(base, button({ status: 'experimental' })).breaking).toEqual([
      { kind: 'status-regressed', tag: 'rd-button', from: 'stable', to: 'experimental' },
    ])
    expect(diffManifests(base, button({ status: 'deprecated' })).breaking).toEqual([])
  })

  it('PE ティアの後退（A → B）は pe-tier-changed、強化（B → A）は addition', () => {
    expect(diffManifests(button({ pe: 'A' }), button({ pe: 'B' })).breaking).toEqual([
      { kind: 'pe-tier-changed', tag: 'rd-button', from: 'A', to: 'B' },
    ])
    expect(diffManifests(button({ pe: 'B' }), button({ pe: 'A' }))).toEqual({
      breaking: [],
      additions: ['rd-button: PE ティアを B から A に強化'],
    })
  })

  it('base が experimental の部品は semver の対象外（削除しても breaking にしない）', () => {
    const base = manifest([declaration('rd-sparkline', { status: 'experimental' })])
    const head = manifest([])
    expect(diffManifests(base, head)).toEqual({ breaking: [], additions: [] })
  })
})

describe('missingChangeset', () => {
  const breaking = [{ kind: 'element-removed', tag: 'rd-dialog' }] as const

  it('major があれば通り、無ければ落ちる。0.x の間は minor でも通る（ADR-0009）', () => {
    expect(missingChangeset({ breaking, bumps: [{ level: 'major' }], zeroMajor: false })).toBe(
      false,
    )
    expect(missingChangeset({ breaking, bumps: [{ level: 'minor' }], zeroMajor: false })).toBe(true)
    expect(missingChangeset({ breaking, bumps: [{ level: 'minor' }], zeroMajor: true })).toBe(false)
    expect(missingChangeset({ breaking, bumps: [{ level: 'patch' }], zeroMajor: true })).toBe(true)
    expect(missingChangeset({ breaking: [], bumps: [], zeroMajor: false })).toBe(false)
  })
})
