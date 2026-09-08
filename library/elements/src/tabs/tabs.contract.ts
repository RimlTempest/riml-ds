/**
 * `rd-tabs` のマークアップ契約（ティア B、ADR-0012）。
 * 枠だけが shadow にあり、タブの列（`slot="tabs"`）もパネルも light DOM。
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
      { tag: 'ul', slot: 'tabs', children: [{ raw: '$tabs' }] },
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

/** タブ 1 つ。JS が無ければただのページ内リンク */
export const tabMarkup = (props: { readonly href: string; readonly label: string }): string =>
  `<li><a href="${escapeHtml(fragment(props.href))}">${escapeHtml(props.label)}</a></li>`

/** パネル 1 つ。`id` が `tabMarkup` の `href` の飛び先になる */
export const panelMarkup = (props: { readonly id: string; readonly children: string }): string =>
  `<section id="${escapeHtml(props.id)}">${props.children}</section>`

export const markup = (props: TabsMarkupProps): string => renderMarkup(contract.tree, props)
