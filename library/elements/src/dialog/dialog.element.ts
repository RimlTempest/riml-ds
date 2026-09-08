import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncStates } from '../_shared/internals.js'
import { asFocusable } from '../_shared/native-control.js'
import { dialogBar, windowControlLabels } from '../_shared/window-chrome.js'
import { contract } from './dialog.contract.js'
import {
  computeStates,
  decideClose,
  decideDialogAction,
  type DialogPlacement,
  type DismissReason,
  focusReturnTarget,
} from './dialog.logic.js'
import { styles } from './dialog.styles.js'

const SHADOW_OPTIONS = { ...LitElement.shadowRootOptions, delegatesFocus: true, serializable: true }

/**
 * モーダル。ネイティブ `<dialog>` を枠にし内容はすべて slot（ティア B、ADR-0012）。
 * JS が無いときは `:not(:defined)` の CSS が受け、内容が inline のセクションとして読める。
 * 開くと `showModal()` が最初のフォーカス可能要素（＝帯の ×）にフォーカスを置く。主ボタンから
 * 始めるなら、利用側が `slot="actions"` のボタンに `autofocus` を付ける。
 *
 * @summary モーダル。見出しは slot="label" に必ず置く
 * @status stable
 * @pe B
 *
 * @slot - 本文
 * @slot label - 見出し。省略不可（aria-labelledby で結ばれる）
 * @slot actions - 確定・取消などのボタン
 * @csspart control - 内側の <dialog>。帯の × にも付く（`close` と両方）
 * @csspart bar - 窓の帯（× と見出しの入れ物）
 * @csspart controls - × の入れ物。persistent では描かれない
 * @csspart close - 帯の左端の ×（閉じる）
 * @csspart label - 見出しの入れ物
 * @csspart body - 本文とアクションの入れ物
 * @event {CustomEvent<{ reason: 'esc' | 'backdrop' | 'button' | 'api' }>} rd-dismiss - 閉じたときに発火
 * @state open - 開いている
 * @state malformed - slot="label" の子が無い
 * @state start - placement="start"（行頭側に着く帯 = Sheet）
 * @state end - placement="end"（行末側に着く帯 = Sheet）
 * @state bottom - placement="bottom"（下端に着く帯 = Drawer）
 */
export class RdDialog extends LitElement {
  static override styles = styles

  static override shadowRootOptions = SHADOW_OPTIONS

  static override properties: PropertyDeclarations = {
    alert: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
    persistent: { type: Boolean, reflect: true },
    placement: { reflect: true },
  }

  declare alert: boolean
  declare open: boolean
  declare persistent: boolean
  declare placement: DialogPlacement

  #internals = this.attachInternals()
  #contractOk = false
  #opener: HTMLElement | null = null
  #reason: DismissReason = 'api'

  constructor() {
    super()
    this.alert = false
    this.open = false
    this.persistent = false
    this.placement = 'center'
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      console.error(`[rd-dialog] slot="label" の子が必要（不足: ${result.roles.join(', ')}）`)
    }
    this.#contractOk = result.kind === 'ok'
  }

  override updated(): void {
    const { open, placement } = this
    const states = computeStates({ open, placement, malformed: !this.#contractOk })
    syncStates(this.#internals, states)
    this.#applyOpen()
  }

  override render(): TemplateResult {
    return html`<dialog
      part="control"
      role=${this.alert ? 'alertdialog' : nothing}
      aria-labelledby="rd-dialog-label"
      @cancel=${this.#dismiss}
      @click=${this.#dismiss}
      @close=${this.#onClose}
    >
      ${dialogBar(this.persistent, windowControlLabels(this).close, this.#closeByButton)}
      <div part="body"><slot></slot><slot name="actions"></slot></div>
    </dialog>`
  }

  /** 開く。閉じたときにフォーカスを戻す先として、いま focus のある要素を覚える */
  show(): void {
    const root = this.getRootNode()
    this.#opener = asFocusable(root instanceof Document ? document.activeElement : null)
    this.open = true
  }

  close(reason: DismissReason = 'api'): void {
    this.#reason = reason
    this.open = false
  }

  #closeByButton = (): void => this.close('button')

  #dialog = (): HTMLDialogElement | null => this.renderRoot.querySelector('dialog')

  #applyOpen = (): void => {
    const dialog = this.#dialog()
    const actions = {
      open: () => dialog?.showModal(),
      close: () => dialog?.close(),
      none: () => undefined,
    }
    actions[decideDialogAction({ wanted: this.open, actual: dialog?.open ?? false })]()
  }

  /** Esc と背面クリックの共通の出口。`<dialog>` 自身が click の対象なら背面を押している */
  #dismiss = (event: Event): void => {
    const dialog = this.#dialog()
    if (event.type === 'click' && event.target !== dialog) return
    const reason = event.type === 'cancel' ? 'esc' : 'backdrop'
    const decision = decideClose({ persistent: this.persistent, alert: this.alert, reason })
    if (decision.kind === 'blocked') return event.preventDefault()
    this.#reason = decision.reason
    if (event.type === 'click') dialog?.close()
  }

  #onClose = (): void => {
    this.open = false
    focusReturnTarget(this.#opener, this).focus()
    const detail = { reason: this.#reason }
    this.dispatchEvent(new CustomEvent('rd-dismiss', { bubbles: true, composed: true, detail }))
    this.#reason = 'api'
  }
}
