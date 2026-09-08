import { html, LitElement, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncStates } from '../_shared/internals.js'
import { contract, ITEM_SELECTOR } from './menu.contract.js'
import {
  applyMenuAttrs,
  asElement,
  contextController,
  focusNextItem,
  opened,
  positionMenu,
  reportMissing,
  resolveItem,
  wireIds,
} from './menu.dom.js'
import { computeMenuView } from './menu.logic.js'
import { styles } from './menu.styles.js'

let sequence = 0

/**
 * 押すと項目が開くメニュー。**HTML だけで開閉する**（`popovertarget` + `[popover]`）ので
 * JS が無くても項目に辿り着ける（ティア B、ADR-0012）。項目の `click` は `preventDefault`
 * しない——ルーターに横取りさせる（plan 020 保守メモ）。
 *
 * @summary メニュー。JS 無しでも popovertarget で開く
 * @status experimental
 * @pe B
 *
 * @slot - `[popover]` のリスト。省略不可
 * @slot trigger - 開くボタン（`popovertarget` を持つ）。省略不可
 * @attr context - 中の面で右クリック（contextmenu）するとポインタの位置に開く（Context Menu）。トリガーのボタンは残る
 * @csspart control - shadow の枠
 * @event {CustomEvent<{ index: number; href: string }>} rd-select - 項目を押したとき（リンクでなければ href は空）
 * @state open - 開いている
 * @state unlabeled - label が無い
 * @state malformed - slot="trigger" か [popover] が無い
 */
export class RdMenu extends LitElement {
  static override styles = styles

  // `delegatesFocus` は付けない——トリガーも項目も light DOM の押せる要素
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, serializable: true }

  static override properties: PropertyDeclarations = {
    placement: { reflect: true },
    label: {},
    context: { type: Boolean, reflect: true },
  }

  /** インライン方向の揃え。`end` はトリガーの終端に揃える */
  declare placement: 'start' | 'end'
  declare label: string
  /** 中の面で右クリックするとポインタの位置に開く（Context Menu）。**初期化時にだけ**読む */
  declare context: boolean

  #internals = this.attachInternals()
  #contractOk = false
  #open = false
  #name = `rd-menu-${(sequence += 1)}`
  #context = contextController({
    enabled: () => this.context,
    host: this,
    list: () => this.#list(),
  })

  constructor() {
    super()
    this.placement = 'start'
    this.label = ''
    this.context = false
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    this.#contractOk = result.kind === 'ok'
    reportMissing(result, this.label)
    this.#wire()
    this.#context.wire()
  }

  override updated(): void {
    const items = this.#items()
    const view = computeMenuView({
      open: this.#open,
      disabled: items.map((item) => item.getAttribute('aria-disabled') === 'true'),
      label: this.label,
      malformed: !this.#contractOk,
    })
    syncStates(this.#internals, view.states)
    const trigger = this.#trigger()
    const list = this.#list()
    applyMenuAttrs({ trigger, list, items }, view)
    const point = this.#context.point()
    positionMenu(trigger, list, this.#name, { placement: this.placement, point })
  }

  override render(): TemplateResult {
    return html`<div part="control"><slot name="trigger"></slot><slot></slot></div>`
  }

  /** id と `popovertarget` を結ぶ。利用側が書いていればそのまま尊重する */
  #wire = (): void => {
    const list = this.#list()
    const trigger = this.#trigger()
    if (list === undefined || trigger === undefined) {
      return
    }
    wireIds(list, trigger, this.#name)
    list.addEventListener('toggle', this.#onToggle)
    list.addEventListener('keydown', this.#onKeydown)
    list.addEventListener('click', this.#onSelect)
  }

  #list = (): HTMLElement | undefined => asElement(this.querySelector(contract.roles.list))

  /** 押せるのはトリガーの中のネイティブ要素（`rd-button` に包まれていることが多い） */
  #trigger = (): HTMLElement | undefined => {
    const slotted = this.querySelector(contract.roles.trigger)
    return asElement(slotted?.querySelector('button, a[href]') ?? slotted)
  }

  #items = (): readonly HTMLElement[] =>
    [...this.querySelectorAll(ITEM_SELECTOR)].filter((node) => node instanceof HTMLElement)

  /** 開いたら最初の項目へ、閉じたらトリガーへ（Esc はネイティブが閉じる） */
  #onToggle = (event: Event): void => {
    this.#open = opened(event)
    this.#context.sync(this.#open)
    this.requestUpdate()
    ;(this.#open ? this.#items()[0] : this.#trigger())?.focus()
  }

  #onKeydown = (event: KeyboardEvent): void => focusNextItem(event, this.#items())

  #onSelect = (event: Event): void => {
    const items = this.#items()
    const index = resolveItem(event, items)
    const item = items[index]
    if (item === undefined || item.getAttribute('aria-disabled') === 'true') {
      event.preventDefault()
      return
    }
    this.#list()?.hidePopover()
    const detail = { index, href: item.getAttribute('href') ?? '' }
    this.dispatchEvent(new CustomEvent('rd-select', { bubbles: true, composed: true, detail }))
  }
}
