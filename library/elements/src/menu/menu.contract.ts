/**
 * `rd-menu` のマークアップ契約（ティア B、ADR-0012）。
 * 枠だけが shadow にあり、トリガーも `[popover]` の中身も light DOM。
 *
 * JS が無くても **HTML だけで開閉する**（`popovertarget` + `[popover]`。Baseline Newly）。
 * Popover API が無いブラウザでは属性が無視され、リストがそのまま見える——どちらの道でも
 * 「内容が見える」というティア B の約束を守る（`menu.css` の `:not(:defined)` が見た目を持つ）。
 */
import type { Contract } from '../_shared/contract.js'
import { escapeHtml, renderMarkup } from '../_shared/markup.js'

/**
 * `[popover]` の中の押せる項目。**`roles` には入れない**——`checkContract` は
 * `querySelector` で 1 個目しか見ないので、複数一致する役割は契約で必須にできない。
 * 数と並びが要る element 側が `querySelectorAll` で読む。
 */
export const ITEM_SELECTOR = ':scope > [popover] :is(a[href], button)'

export const contract = {
  pe: 'B',
  roles: {
    trigger: ':scope > [slot="trigger"]',
    list: ':scope > [popover]',
  },
  required: ['trigger', 'list'],
  tree: {
    tag: 'rd-menu',
    attrs: { placement: '$placement', label: '$label' },
    children: [
      // trigger / items は生 HTML。利用側が menuTriggerMarkup() / menuItemMarkup() で組み立てる。
      // トリガーを木のノードにしないのは、ラッパー生成器が `popovertarget` を
      // React の `popoverTarget` に読み替えられないため（生成物が型検査に落ちる）
      { raw: '$trigger' },
      {
        tag: 'div',
        attrs: { popover: '', id: '$id' },
        children: [{ tag: 'ul', children: [{ raw: '$items' }] }],
      },
    ],
  },
} as const satisfies Contract

export type MenuMarkupProps = {
  /** `[popover]` の id。トリガーの `popovertarget` と同じ値になる */
  readonly id: string
  /** トリガーの文言。そのままメニューのアクセシブル名になる */
  readonly label: string
  /** `menuItemMarkup()` / `menuSeparatorMarkup()` を並べた断片。**エスケープされない** */
  readonly items: string
  /** インライン方向の揃え。`end` はトリガーの終端に揃える */
  readonly placement?: 'start' | 'end'
}

export type MenuItemMarkupProps = {
  readonly label: string
  /** 移動する項目はリンクにする（JS 無しでも辿れる。ルーターにも横取りさせる） */
  readonly href?: string
  /** 押せないことを伝えるだけ。**フォーカスは失わない**（見つけられない項目を作らない） */
  readonly disabled?: boolean
}

/** 押せない印。`disabled` 属性ではなく `aria-disabled`（ADR-0008 §5） */
const disabledAttr = (disabled: boolean | undefined): string =>
  disabled === true ? ' aria-disabled="true"' : ''

/**
 * 項目 1 つ。`href` があればリンク、無ければボタン。
 * `<li>` で包むのは `<ul>` の許す子が `<li>` だけだから。JS が来たら `<li>` は
 * `role="presentation"` になり、`role="menu"` が `role="menuitem"` を直接持つ形になる。
 */
export const menuItemMarkup = (props: MenuItemMarkupProps): string => {
  const label = escapeHtml(props.label)
  const inner =
    props.href === undefined
      ? `<button type="button"${disabledAttr(props.disabled)}>${label}</button>`
      : `<a href="${escapeHtml(props.href)}"${disabledAttr(props.disabled)}>${label}</a>`
  return `<li>${inner}</li>`
}

/**
 * 開くボタン。`popovertarget` が `[popover]` の id を指すことが唯一の約束で、
 * これだけで **JS 無しでも開く**（Popover API。`docs/baseline.md`）。
 */
export const menuTriggerMarkup = (props: { readonly id: string; readonly label: string }): string =>
  `<rd-button slot="trigger"><button type="button" popovertarget="${escapeHtml(props.id)}">`
  + `${escapeHtml(props.label)}</button></rd-button>`

/** 区切り。`<hr>` の暗黙の role が `separator` なので role 属性を手で書かない */
export const menuSeparatorMarkup = (): string => '<li><hr></li>'

export const markup = (props: MenuMarkupProps): string =>
  renderMarkup(contract.tree, { ...props, trigger: menuTriggerMarkup(props) })
