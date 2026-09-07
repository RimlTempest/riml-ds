import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncAttribute, syncStates } from '../_shared/internals.js'
import type { Binding, Listeners, NativeControl } from '../_shared/native-control.js'
import {
  asNativeControl,
  bindListeners,
  readAttrs,
  setControlValue,
} from '../_shared/native-control.js'
import { contract } from './text-field.contract.js'
import { computeView, type FieldView, usesJapaneseCopy } from './text-field.logic.js'

/**
 * 1 行テキスト入力。子の `<label for>` と `<input>` / `<textarea>` を包む（ティア A、ADR-0012）。
 * 送信・検証・ラベル付けはブラウザが素で行い、JS が無ければネイティブの吹き出しが出る（退行しない）。
 *
 * @summary 1 行テキスト入力。ラベルと入力欄は利用側が書く
 * @status stable
 * @pe A
 *
 * @cssprop --rd-text-field-gap - ラベル・入力欄・文言の間隔。既定 var(--rd-space-1)
 * @state invalid - 検証に通っていない（blur 後、または error 属性がある）
 * @state errored - error 属性で文言を強制表示している
 * @state hinted - hint がある
 * @state filled - 値が入っている
 * @state malformed - 契約の子（<label for> と <input>）が無い
 */
export class RdTextField extends LitElement {
  static override properties: PropertyDeclarations = { hint: {}, error: {} }

  declare hint: string
  declare error: string

  #internals = this.attachInternals()
  #control: NativeControl | undefined = undefined
  #contractOk = false
  #touched = false
  #bindings: readonly Binding[] = []

  constructor() {
    super()
    this.hint = ''
    this.error = ''
  }

  /** light DOM に描く。既存の子は消さず、文言だけを末尾に足す */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.#bind()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#bindings.forEach((binding) => {
      binding.detach()
    })
    this.#bindings = []
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      console.error(
        `[rd-text-field] <label for> と <input> が必要（不足: ${result.roles.join(', ')}）`,
      )
    }
    this.#contractOk = result.kind === 'ok'
    this.#control = asNativeControl(result.kind === 'ok' ? result.found['control'] : undefined)
    this.#bind()
  }

  override updated(): void {
    const view = this.#view()
    syncStates(this.#internals, view.states)
    syncAttribute(this.#control, 'aria-describedby', view.describedBy)
    syncAttribute(this.#control, 'aria-invalid', view.ariaInvalid)
  }

  /** 強化ノード。`aria-live` は付けない（ADR-0008 §6。読み上げは aria-describedby に任せる） */
  override render(): TemplateResult {
    const view = this.#view()
    return html`${this.hint === '' ? nothing : html`<p part="hint" id=${view.hintId}>${this.hint}</p>`}${
      view.message === '' ? nothing : html`<p part="error" id=${view.errorId}>${view.message}</p>`
    }`
  }

  /** 値はネイティブ要素が持つ。部品は委譲するだけ */
  get value(): string {
    return this.#control?.value ?? ''
  }

  set value(next: string) {
    setControlValue(this.#control, next)
  }

  checkValidity(): boolean {
    return this.#control?.checkValidity() ?? true
  }

  reportValidity(): boolean {
    return this.#control?.reportValidity() ?? true
  }

  #listeners: Listeners = {
    input: () => this.requestUpdate(),
    blur: () => this.#setTouched(true),
    invalid: (event) => {
      event.preventDefault()
      this.#setTouched(true)
    },
  }

  #formListeners: Listeners = { reset: () => this.#setTouched(false) }

  #bind = (): void => {
    this.#bindings = [
      bindListeners(this.#control, this.#listeners),
      bindListeners(this.closest('form'), this.#formListeners),
    ]
  }

  #setTouched = (next: boolean): void => {
    this.#touched = next
    this.requestUpdate()
  }

  #view = (): FieldView => {
    const control = this.#control
    return computeView({
      controlId: control?.id ?? this.querySelector(contract.roles.control)?.id ?? '',
      error: this.error,
      validity: control?.validity ?? {},
      validationMessage: control?.validationMessage ?? '',
      attrs: readAttrs(control, ['type', 'minlength', 'maxlength', 'min', 'max', 'step', 'title']),
      japanese: usesJapaneseCopy(this),
      malformed: !this.#contractOk,
      invalid: control?.validity.valid === false,
      touched: this.#touched,
      hasHint: this.hint !== '',
      hasError: this.error !== '',
      filled: (control?.value ?? '') !== '',
    })
  }
}
