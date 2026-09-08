import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { usesJapaneseCopy } from '../_shared/field.js'
import { syncAttribute, syncStates } from '../_shared/internals.js'
import type { Binding, Listeners } from '../_shared/native-control.js'
import { bindListeners } from '../_shared/native-control.js'
import { contract } from './input-otp.contract.js'
import { cellsOf, insideBlur, moveFocus, pasteInto, setCells, valueOf } from './input-otp.cells.js'
import { computeOtpView, type OtpView } from './input-otp.logic.js'

/**
 * ワンタイムコード。桁ごとの `<input inputmode="numeric" maxlength="1">` に状態と文言を足す
 * （ティア A、ADR-0012）。JS 無しでも Tab で入力して送信でき（`name-1..N` の N フィールド）、
 * JS があるときだけ自動前進・`Backspace` で戻る・貼り付けで分配する。
 *
 * @summary ワンタイムコード。<fieldset><legend> と桁の <input> は利用側が書く
 * @status experimental
 * @pe A
 *
 * @csspart cells - 桁の入れ物
 * @cssprop --rd-input-otp-gap - 桁の間隔。既定 var(--rd-space-2)
 * @csspart hint - 補足文言
 * @csspart error - エラー文言
 * @state invalid - 検証に通っていない（操作後、または error 属性がある）
 * @state errored - error 属性で文言を強制表示している
 * @state hinted - hint がある
 * @state filled - 全桁が埋まっている
 * @state malformed - 契約の子が無い
 */
export class RdInputOtp extends LitElement {
  static override properties: PropertyDeclarations = { hint: {}, error: {} }

  declare hint: string
  declare error: string
  #internals = this.attachInternals()
  #contractOk = false
  #touched = false
  #bindings: readonly Binding[] = []

  constructor() {
    super()
    this.hint = ''
    this.error = ''
  }

  /** light DOM に描く。既存の子は消さない */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#bindings.forEach((binding) => binding.detach())
    this.#bindings = []
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      const missing = result.roles.join(', ')
      console.error(`[rd-input-otp] <fieldset><legend> と桁の <input> が必要（不足: ${missing}）`)
    }
    this.#contractOk = result.kind === 'ok'
    this.#bindings = this.#cells().map((cell) => bindListeners(cell, this.#listeners))
  }

  /** hint / error は**各桁**の `aria-describedby` で結ぶ（`<fieldset>` には付けない） */
  override updated(): void {
    const view = this.#view()
    syncStates(this.#internals, view.states)
    this.#cells().forEach((cell) => {
      syncAttribute(cell, 'aria-describedby', view.describedBy)
    })
  }

  /** 強化ノード（ADR-0008 §6: `aria-live` は付けない） */
  override render(): TemplateResult {
    const view = this.#view()
    return html`${this.hint === '' ? nothing : html`<p part="hint" id=${view.hintId}>${this.hint}</p>`}${
      view.message === '' ? nothing : html`<p part="error" id=${view.errorId}>${view.message}</p>`
    }`
  }

  /** 値はネイティブの桁が持つ。部品は連結・分配するだけ */
  get value(): string {
    return this.#values().join('')
  }

  set value(next: string) {
    setCells(this.#cells(), next)
    this.requestUpdate()
  }

  checkValidity(): boolean {
    return this.#cells().every((cell) => cell.checkValidity())
  }

  #cells = (): readonly HTMLInputElement[] => cellsOf(this, contract.roles.control)
  #values = (): readonly string[] => this.#cells().map((cell) => cell.value)

  #setTouched = (): void => {
    this.#touched = true
    this.requestUpdate()
  }

  /** 1 文字入ったら次へ。Backspace は**空のときだけ**戻る（値があればネイティブの削除に任せる） */
  #listeners: Listeners = {
    input: (event) => {
      moveFocus(this.#cells(), event.target, valueOf(event.target) === '' ? '' : 'input')
      this.requestUpdate()
    },
    keydown: (event) => {
      const key = event instanceof KeyboardEvent ? event.key : ''
      const stay = key === 'Backspace' && valueOf(event.target) !== ''
      moveFocus(this.#cells(), event.target, stay ? '' : key)
    },
    paste: (event) => {
      event.preventDefault()
      pasteInto(this.#cells(), event)
      this.#setTouched()
    },
    blur: (event) => {
      if (!insideBlur(this.#cells(), event)) {
        this.#setTouched()
      }
    },
    invalid: (event) => {
      event.preventDefault()
      this.#setTouched()
    },
  }

  #view = (): OtpView => {
    const first = this.#cells()[0]
    return computeOtpView({
      controlId: first?.id ?? '',
      error: this.error,
      validity: first?.validity ?? {},
      validationMessage: first?.validationMessage ?? '',
      attrs: {},
      japanese: usesJapaneseCopy(this),
      malformed: !this.#contractOk,
      invalid: this.#cells().some((cell) => !cell.validity.valid),
      touched: this.#touched,
      hasHint: this.hint !== '',
      hasError: this.error !== '',
      values: this.#values(),
    })
  }
}
