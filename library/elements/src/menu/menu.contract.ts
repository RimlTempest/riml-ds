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
export const ITEM_SELECTOR = ':scope > [popover] > :is(a[href], button, [aria-disabled="true"])'

export const contract = {
  pe: 'B',
  roles: {
    trigger: ':scope > [slot="trigger"]',
    list: ':scope > [popover]',
  },
  required: ['trigger', 'list'],
  tree: {
    tag: 'rd-menu',
    attrs: { placement: '$placement', label: '$label', context: '$context' },
    children: [
      // trigger / items は生 HTML。利用側が menuTriggerMarkup() / menuItemMarkup() で組み立てる。
      // トリガーを木のノードにしないのは、ラッパー生成器が `popovertarget` を
      // React の `popoverTarget` に読み替えられないため（生成物が型検査に落ちる）
      { raw: '$trigger' },
      // 項目は `[popover]` の**直下**に並べる。`role="menu"` が持てるのは `menuitem` 系
      // だけで（WAI-ARIA 1.2 の Required Owned Elements）、`<ul><li>` を挟むと
      // markuplint の `wai-aria` が落ちる（`rd-tabs` の tablist と同じ理由）
      { tag: 'div', attrs: { popover: '', id: '$id' }, children: [{ raw: '$items' }] },
    ],
  },
} as const satisfies Contract

export type MenuMarkupProps = {
  /** `[popover]` の id。トリガーの `popovertarget` と同じ値になる */
  readonly id: string
  /** トリガーの文言。そのままメニューのアクセシブル名になる */
  readonly label: string
  /** `menuItemMarkup()` を並べた断片。**エスケープされない** */
  readonly items: string
  /** インライン方向の揃え。`end` はトリガーの終端に揃える */
  readonly placement?: 'start' | 'end'
  /**
   * 中の面で右クリックするとポインタの位置に開く（Context Menu）。
   * **トリガーのボタンは残る**——右クリックは近道でしかない
   */
  readonly context?: boolean
}

export type MenuItemMarkupProps = {
  readonly label: string
  /** 移動する項目はリンクにする（JS 無しでも辿れる。ルーターにも横取りさせる） */
  readonly href?: string
  /** 押せないことを伝えるだけ。**フォーカスは失わない**（見つけられない項目を作らない） */
  readonly disabled?: boolean
  /**
   * この項目の前に区切り線を引く（見た目だけ。`menu.css` が `<li>` に罫線を描く）。
   *
   * **`<li role="separator">` や `<hr>` を挟まない。** `role="menu"` が持てるのは
   * `menuitem` 系だけで（WAI-ARIA 1.2 の Required Owned Elements）、区切りを要素として
   * 置くと markuplint の `wai-aria` が落ちる。区切りは装飾なので読み上げに出さない。
   */
  readonly separated?: boolean
}

/** 区切りは `<li>` に付く印。要素を挟まないので読み上げの並びは変わらない */
const separatedAttr = (separated: boolean | undefined): string =>
  separated === true ? ' data-separated=""' : ''

/**
 * 項目 1 つ。`href` があればリンク、無ければボタン、押せないなら `<span>`。
 *
 * **`<li>` で包まない。** `role="menu"` は `role="menuitem"` を**直接**持つ必要があり、
 * `<li role="presentation">` を挟むと markuplint の `wai-aria` が落ちる（`rd-tabs` と同じ）。
 * 押せない項目を `<span>` にするのは、`<button>` / `<a href>` に `aria-disabled` を付けると
 * 「ネイティブの `disabled` と矛盾する」と落ちるため。JS が `tabindex="-1"` を足すので
 * **フォーカスは失わない**（見つけられない項目を作らない）。
 */
export const menuItemMarkup = (props: MenuItemMarkupProps): string => {
  const label = escapeHtml(props.label)
  const mark = separatedAttr(props.separated)
  if (props.disabled === true) {
    return `<span${mark} aria-disabled="true">${label}</span>`
  }
  return props.href === undefined
    ? `<button${mark} type="button">${label}</button>`
    : `<a${mark} href="${escapeHtml(props.href)}">${label}</a>`
}

/**
 * 開くボタン。`popovertarget` が `[popover]` の id を指すことが唯一の約束で、
 * これだけで **JS 無しでも開く**（Popover API。`docs/baseline.md`）。
 */
export const menuTriggerMarkup = (props: { readonly id: string; readonly label: string }): string =>
  `<rd-button slot="trigger"><button type="button" popovertarget="${escapeHtml(props.id)}">`
  + `${escapeHtml(props.label)}</button></rd-button>`

export const markup = (props: MenuMarkupProps): string =>
  renderMarkup(contract.tree, { ...props, trigger: menuTriggerMarkup(props) })
