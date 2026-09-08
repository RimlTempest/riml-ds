/**
 * `rd-tabs` のマークアップ契約（ティア B、ADR-0012）。
 * 枠だけが shadow にあり、タブの列（`slot="tabs"`）もパネルも light DOM。
 * 既定の木は `<div slot="tabs">` にリンクを直接並べる（`<ul><li>` でも契約は満たす）。
 *
 * JS が無いときは **ただのページ内リンクの列**として動く（`<a href="#panel">` → パネルへ移動）。
 * すべてのパネルが見えているのが正しい姿で、`tabs.css` の `:not(:defined)` がその見た目を持つ。
 */
import type { Contract } from '../_shared/contract.js'
import { escapeHtml, renderMarkup } from '../_shared/markup.js'

export const contract = {
  pe: 'B',
  roles: {
    list: ':scope > [slot="tabs"]',
    tabs: ':scope > [slot="tabs"] a[href^="#"]',
    panels: ':scope > [id]',
  },
  required: ['list', 'tabs'],
  tree: {
    tag: 'rd-tabs',
    attrs: {
      variant: '$variant',
      label: '$label',
      orientation: '$orientation',
      selected: '$selected',
    },
    children: [
      // tabs / panels は生 HTML。利用側が tabMarkup() / panelMarkup() で組み立てた断片を渡す
      { tag: 'div', slot: 'tabs', children: [{ raw: '$tabs' }] },
      { raw: '$panels' },
    ],
  },
} as const satisfies Contract

export type TabsMarkupProps = {
  /** タブの列のアクセシブル名（`role="tablist"` の `aria-label`）。省略すると `:state(unlabeled)` */
  readonly label?: string
  /** `tabMarkup()` を並べた断片。**エスケープされない** */
  readonly tabs: string
  /** `panelMarkup()` を並べた断片。**エスケープされない** */
  readonly panels: string
  /** `line`（既定・下線）か `browser`（帯から生える窓のタブ） */
  readonly variant?: 'line' | 'browser'
  /** `vertical` で ↑ ↓ 操作の縦並びになる */
  readonly orientation?: 'horizontal' | 'vertical'
  /** 最初に開くタブの断片（`#usage`）。`location.hash` のほうが強い */
  readonly selected?: string
}

/** `#` が無ければ足す（`panelMarkup` の `id` をそのまま渡せるように） */
const fragment = (href: string): string => (href.startsWith('#') ? href : `#${href}`)

/**
 * タブ 1 つ。JS が無ければただのページ内リンク。
 *
 * **`<li>` で包まない。** `role="tablist"` は `role="tab"` を**直接**持つ必要があり、
 * `<li role="presentation">` を挟むと markuplint の `wai-aria` が落ちる。
 * 利用側が `<ul><li>` の形を選んだときは element が `<li>` に `role="presentation"` を足す。
 */
export const tabMarkup = (props: { readonly href: string; readonly label: string }): string =>
  `<a href="${escapeHtml(fragment(props.href))}">${escapeHtml(props.label)}</a>`

/**
 * パネル 1 つ。`id` が `tabMarkup` の `href` の飛び先になる。
 *
 * **`<section>` にしない。** JS が `aria-labelledby` を足すと `<section>` は名前付きの
 * region ランドマークとして数えられ、markuplint の `landmark-roles` が「名前が一意でない」と
 * 警告する。`tabpanel` はランドマークではないので `<div>` が正しい（WAI-ARIA APG も div）。
 */
export const panelMarkup = (props: { readonly id: string; readonly children: string }): string =>
  `<div id="${escapeHtml(props.id)}">${props.children}</div>`

export const markup = (props: TabsMarkupProps): string => renderMarkup(contract.tree, props)
