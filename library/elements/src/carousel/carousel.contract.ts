/**
 * `rd-carousel` のマークアップ契約（ティア A、ADR-0012）。
 * 列（`<ul>`）と枚（`<li>`）は**利用側が light DOM に書く**。部品は生成しない——
 * JS が無くても `.rd-carousel` と同じ「横スクロールできる列」として動く。
 */
import type { Contract } from '../_shared/contract.js'
import { type MarkupTree, renderMarkup } from '../_shared/markup.js'

/** 枚。`checkContract` は最初の 1 個で「1 枚以上あるか」を判定する */
export const ITEM_SELECTOR = ':scope > ul > li'

export const contract = {
  pe: 'A',
  roles: {
    track: ':scope > ul',
    // 1 枚以上。`checkContract` は最初の 1 個で判定する
    item: ITEM_SELECTOR,
  },
  required: ['track', 'item'],
  tree: {
    tag: 'rd-carousel',
    attrs: { label: '$label', loop: '$loop' },
    children: [
      // スライドは生 HTML。利用側が `<li>…</li>` を並べて渡す（`itemMarkup` で組める）
      // 横に転がる箱はキーボードで届く必要がある（axe scrollable-region-focusable）。
      // JS 無しでも効くので契約が持ち、element は `tabindex` を足しも消しもしない
      { tag: 'ul', attrs: { tabindex: '0' }, children: [{ raw: '$children' }] },
    ],
  },
} as const satisfies Contract

/** 枚 1 つ分の木。列とは別に組めるようにしてある（`itemMarkup`） */
const itemTree = { tag: 'li', children: [{ raw: '$children' }] } as const satisfies MarkupTree

export type CarouselMarkupProps = {
  /** 列のアクセシブル名。省略すると `:state(unlabeled)` と `console.error` */
  readonly label: string
  /** 枚の列。**エスケープされない**ので信頼済みの HTML 断片だけを渡す */
  readonly children: string
  /** 端で折り返す。無ければ端でボタンが `aria-disabled` */
  readonly loop?: boolean
}

export type CarouselItemMarkupProps = {
  /** 1 枚の中身。**エスケープされない**ので信頼済みの HTML 断片だけを渡す */
  readonly children: string
}

export const markup = (props: CarouselMarkupProps): string => renderMarkup(contract.tree, props)

/** 1 枚を `<li>` で包む。`.rd-card` などをそのまま入れる */
export const itemMarkup = (props: CarouselItemMarkupProps): string => renderMarkup(itemTree, props)
