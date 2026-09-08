import { html, LitElement, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncStates } from '../_shared/internals.js'
import { anchorPopover } from '../_shared/popover-anchor.js'
import { contract } from './popover.contract.js'
import { applyAttrs, asElement, entryPoint, hoverController, opened } from './popover.dom.js'
import { computePopoverView, panelAttributes, triggerAttributes } from './popover.logic.js'
import { styles } from './popover.styles.js'

let sequence = 0

/**
 * トリガーの脇に開く軽い重ね物。中身は自由（見出し・本文・フォーム）で、**モーダルにしない**
 * ——画面を止めて確定を迫るものは `rd-dialog`（ティア B、ADR-0012）。
 * `popovertarget` + `[popover]` が開閉するので JS が無くても中身に辿り着ける。
 *
 * @summary 非モーダルの重ね物。JS 無しでも popovertarget で開く
 * @status experimental
 * @pe B
 *
 * @slot - `[popover]` の中身（先頭に `[slot="label"]` の見出しを置く）。省略不可
 * @slot trigger - 開くボタン（`popovertarget` を持つ）。省略不可
 * @attr hover - トリガーに乗せる / フォーカスすると遅れて開く（Hover Card）。押して開く経路は残る
 * @csspart control - shadow の枠
 * @event {CustomEvent<{ open: boolean }>} rd-toggle - 開閉したとき（popover の toggle を写す）
 * @state open - 開いている
 * @state unlabeled - [slot="label"] の見出しが無い
 * @state malformed - slot="trigger" か [popover] が無い
 */
export class RdPopover extends LitElement {
  static override styles = styles

  // `delegatesFocus` は付けない——トリガーも中身も light DOM の押せる要素
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, serializable: true }

  static override properties: PropertyDeclarations = {
    placement: { reflect: true },
    hover: { type: Boolean, reflect: true },
  }

  /** インライン方向の揃え。`end` はトリガーの終端に揃える */
  declare placement: 'start' | 'end'
  /** 乗せる / フォーカスすると遅れて開く（Hover Card）。**初期化時にだけ**読む */
  declare hover: boolean

  #internals = this.attachInternals()
  #contractOk = false
  #open = false
  #name = `rd-popover-${(sequence += 1)}`
  /** いま開いている面を hover で開いたか。閉じるまで立ったまま */
  #byHover = false
  #hover = hoverController({
    enabled: () => this.hover,
    panel: () => this.#panel(),
    trigger: () => this.#trigger(),
    markHover: () => {
      this.#byHover = true
    },
  })

  constructor() {
    super()
    this.placement = 'start'
    this.hover = false
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#hover.dispose()
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    this.#contractOk = result.kind === 'ok'
    const missing = [
      result.kind === 'missing' ? `slot="trigger" と [popover]（${result.roles.join(', ')}）` : '',
      this.#label() === undefined ? '[slot="label"] の見出し（重ね物の名前）' : '',
    ].filter((problem) => problem !== '')
    if (missing.length > 0) {
      console.error(`[rd-popover] 必要: ${missing.join(' / ')}`)
    }
    this.#wire()
    this.#hover.wire()
  }

  override updated(): void {
    const label = this.#label()
    const view = computePopoverView({
      open: this.#open,
      labeled: label !== undefined,
      malformed: !this.#contractOk,
    })
    syncStates(this.#internals, view.states)
    const trigger = this.#trigger()
    const panel = this.#panel()
    applyAttrs(trigger, triggerAttributes(view))
    applyAttrs(panel, panelAttributes(label?.id ?? ''))
    anchorPopover(trigger, panel, this.#name, { placement: this.placement })
  }

  override render(): TemplateResult {
    return html`<div part="control"><slot name="trigger"></slot><slot></slot></div>`
  }

  /** id と `popovertarget` を結ぶ。利用側が書いていればそのまま尊重する */
  #wire = (): void => {
    const panel = this.#panel()
    const trigger = this.#trigger()
    const label = this.#label()
    if (label !== undefined) {
      label.id = label.id === '' ? `${this.#name}-label` : label.id
    }
    if (panel === undefined || trigger === undefined) {
      return
    }
    panel.id = panel.id === '' ? this.#name : panel.id
    trigger.setAttribute('popovertarget', trigger.getAttribute('popovertarget') ?? panel.id)
    panel.addEventListener('toggle', this.#onToggle)
  }

  #panel = (): HTMLElement | undefined => asElement(this.querySelector(contract.roles.panel))

  #label = (): HTMLElement | undefined => asElement(this.querySelector(contract.roles.label))

  /** 押せるのはトリガーの中のネイティブ要素（`rd-button` に包まれていることが多い） */
  #trigger = (): HTMLElement | undefined => {
    const slotted = this.querySelector(contract.roles.trigger)
    return asElement(slotted?.querySelector('button, a[href]') ?? slotted)
  }

  /**
   * 開いたら中の最初の行き先へ、閉じたらトリガーへ（Esc はネイティブが閉じる）。
   * **hover で開いた面ではフォーカスを動かさない**——読み中の人から奪わず、
   * 閉じるときも勝手に戻さない（そもそもトリガーに居ない）。
   */
  #onToggle = (event: Event): void => {
    this.#open = opened(event)
    this.requestUpdate()
    if (!this.#byHover) {
      ;(this.#open ? entryPoint(this.#panel()) : this.#trigger())?.focus()
    }
    this.#byHover = this.#open && this.#byHover
    const detail = { open: this.#open }
    this.dispatchEvent(new CustomEvent('rd-toggle', { bubbles: true, composed: true, detail }))
  }
}
