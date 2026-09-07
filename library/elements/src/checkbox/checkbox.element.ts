import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { usesJapaneseCopy } from '../_shared/field.js'
import { syncAttribute, syncStates } from '../_shared/internals.js'
import type { Binding, Listeners } from '../_shared/native-control.js'
import { bindListeners } from '../_shared/native-control.js'
import { contract } from './checkbox.contract.js'
import { type CheckboxView, computeCheckboxView } from './checkbox.logic.js'

/**
 * 真偽を 1 つ。`<label>` が包む `<input type="checkbox">` に状態と文言を足す
 * （ティア A、ADR-0012）。送信・検証・ラベル付けはブラウザが素で行う。
 * `switch` 属性は見た目と役割だけを変える。JS が無ければチェックボックスとして動く。
 *
 * @summary 真偽を 1 つ。ラベルと <input type=checkbox> は利用側が書く
 * @status experimental
 * @pe A
 *
 * @csspart hint - 補足文言
 * @csspart error - エラー文言
 * @cssprop --rd-checkbox-gap - 枠と文言の間隔。既定 var(--rd-space-2)
 * @state checked - チェックが入っている
 * @state indeterminate - 中間状態
 * @state switch - switch 属性が付いている
 * @state invalid - 検証に通っていない（操作後、または error 属性がある）
 * @state errored - error 属性で文言を強制表示している
 * @state hinted - hint がある
 * @state malformed - 契約の子（<label> と <input type=checkbox>）が無い
 */
export class RdCheckbox extends LitElement {
  static override properties: PropertyDeclarations = {
    hint: {},
    error: {},
    switch: { type: Boolean, reflect: true },
    indeterminate: { type: Boolean },
  }

  declare hint: string
  declare error: string
  declare switch: boolean
  declare indeterminate: boolean

  #internals = this.attachInternals()
  #control: HTMLInputElement | undefined = undefined
  #contractOk = false
  #touched = false
  #binding: Binding | undefined = undefined

  constructor() {
    super()
    this.hint = ''
    this.error = ''
    this.switch = false
    this.indeterminate = false
  }

  /** light DOM に描く。既存の子は消さず、文言だけを末尾に足す */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#binding?.detach()
    this.#binding = undefined
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      console.error(
        `[rd-checkbox] <label> と <input type="checkbox"> が必要（不足: ${result.roles.join(', ')}）`,
      )
    }
    this.#contractOk = result.kind === 'ok'
    const found = result.kind === 'ok' ? result.found['control'] : undefined
    this.#control = found instanceof HTMLInputElement ? found : undefined
    this.#binding = bindListeners(this.#control, this.#listeners)
  }

  override updated(): void {
    const control = this.#control
    const view = this.#view()
    if (control !== undefined) {
      control.indeterminate = this.indeterminate
    }
    syncStates(this.#internals, view.states)
    syncAttribute(control, 'aria-describedby', view.describedBy)
    syncAttribute(control, 'aria-invalid', view.ariaInvalid)
    syncAttribute(control, 'role', view.role)
  }

  /** 強化ノード。`aria-live` は付けない（ADR-0008 §6） */
  override render(): TemplateResult {
    const view = this.#view()
    return html`${this.hint === '' ? nothing : html`<p part="hint" id=${view.hintId}>${this.hint}</p>`}${
      view.message === '' ? nothing : html`<p part="error" id=${view.errorId}>${view.message}</p>`
    }`
  }

  /** チェック状態はネイティブ要素が持つ。部品は委譲するだけ */
  get checked(): boolean {
    return this.#control?.checked ?? false
  }

  set checked(next: boolean) {
    const control = this.#control
    if (control !== undefined) {
      control.checked = next
      this.requestUpdate()
    }
  }

  checkValidity(): boolean {
    return this.#control?.checkValidity() ?? true
  }

  #listeners: Listeners = {
    change: () => this.#setTouched(true),
    blur: () => this.#setTouched(true),
    invalid: (event) => {
      event.preventDefault()
      this.#setTouched(true)
    },
  }

  #setTouched = (next: boolean): void => {
    this.#touched = next
    this.requestUpdate()
  }

  #view = (): CheckboxView =>
    computeCheckboxView({
      controlId: this.#control?.id ?? this.querySelector(contract.roles.control)?.id ?? '',
      error: this.error,
      validity: this.#control?.validity ?? {},
      validationMessage: this.#control?.validationMessage ?? '',
      attrs: {},
      japanese: usesJapaneseCopy(this),
      malformed: !this.#contractOk,
      invalid: this.#control?.validity.valid === false,
      touched: this.#touched,
      hasHint: this.hint !== '',
      hasError: this.error !== '',
      filled: this.#control?.checked ?? false,
      checked: this.#control?.checked ?? false,
      indeterminate: this.indeterminate,
      asSwitch: this.switch,
    })
}
