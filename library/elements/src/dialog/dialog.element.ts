import { html, LitElement, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncStates } from '../_shared/internals.js'
import { asFocusable } from '../_shared/native-control.js'
import { contract } from './dialog.contract.js'
import {
  computeStates,
  decideClose,
  decideDialogAction,
  type DismissReason,
  focusReturnTarget,
} from './dialog.logic.js'
import { styles } from './dialog.styles.js'

const SHADOW_OPTIONS = { ...LitElement.shadowRootOptions, delegatesFocus: true, serializable: true }

/**
 * モーダル。ネイティブ `<dialog>` を枠にし内容はすべて slot（ティア B、ADR-0012）。
 * JS が無いときは `:not(:defined)` の CSS が受け、内容が inline のセクションとして読める。
 *
 * @summary モーダル。見出しは slot="label" に必ず置く
 * @status stable
 * @pe B
 *
 * @slot - 本文
 * @slot label - 見出し。省略不可（aria-labelledby で結ばれる）
 * @slot actions - 確定・取消などのボタン
 * @csspart control - 内側の <dialog>
 * @csspart label - 見出しの入れ物
 * @event {CustomEvent<{ reason: 'esc' | 'backdrop' | 'api' }>} rd-dismiss - 閉じたときに発火
 * @state open - 開いている
 * @state malformed - slot="label" の子が無い
 */
export class RdDialog extends LitElement {
  static override styles = styles

  static override shadowRootOptions = SHADOW_OPTIONS

  static override properties: PropertyDeclarations = {
    open: { type: Boolean, reflect: true },
    dismissible: { type: Boolean, reflect: true },
  }

  declare open: boolean
  declare dismissible: boolean

  #internals = this.attachInternals()
  #contractOk = false
  #opener: HTMLElement | null = null
  #reason: DismissReason = 'api'

  constructor() {
    super()
    this.open = false
    this.dismissible = true
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      console.error(`[rd-dialog] slot="label" の子が必要（不足: ${result.roles.join(', ')}）`)
    }
    this.#contractOk = result.kind === 'ok'
  }

  override updated(): void {
    syncStates(this.#internals, computeStates({ open: this.open, malformed: !this.#contractOk }))
    this.#applyOpen()
  }

  override render(): TemplateResult {
    return html`<dialog
      part="control"
      aria-labelledby="rd-dialog-label"
      @cancel=${this.#onCancel}
      @click=${this.#onClick}
      @close=${this.#onClose}
    >
      <div id="rd-dialog-label" part="label"><slot name="label"></slot></div>
      <slot></slot>
      <slot name="actions"></slot>
    </dialog>`
  }

  /** 開く。閉じたときにフォーカスを戻す先として、いま focus のある要素を覚える */
  show(): void {
    this.#opener = asFocusable(
      this.getRootNode() instanceof Document ? document.activeElement : null,
    )
    this.open = true
  }

  close(reason: DismissReason = 'api'): void {
    this.#reason = reason
    this.open = false
  }

  #dialog = (): HTMLDialogElement | null => this.renderRoot.querySelector('dialog')

  #applyOpen = (): void => {
    const dialog = this.#dialog()
    switch (decideDialogAction({ wanted: this.open, actual: dialog?.open ?? false })) {
      case 'open':
        dialog?.showModal()
        break
      case 'close':
        dialog?.close()
        break
      case 'none':
        break
    }
  }

  #onCancel = (event: Event): void => {
    const decision = decideClose({ dismissible: this.dismissible, reason: 'esc' })
    switch (decision.kind) {
      case 'blocked':
        event.preventDefault()
        break
      case 'close':
        this.#reason = decision.reason
        break
    }
  }

  /** `<dialog>` 自身が click の対象なら背面（backdrop）を押している */
  #onClick = (event: Event): void => {
    const decision = decideClose({ dismissible: this.dismissible, reason: 'backdrop' })
    const dialog = this.#dialog()
    if (decision.kind === 'close' && event.target === dialog) {
      this.#reason = decision.reason
      dialog?.close()
    }
  }

  #onClose = (): void => {
    this.open = false
    focusReturnTarget(this.#opener, this).focus()
    this.dispatchEvent(
      new CustomEvent('rd-dismiss', {
        bubbles: true,
        composed: true,
        detail: { reason: this.#reason },
      }),
    )
    this.#reason = 'api'
  }
}
