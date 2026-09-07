import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { computeView, type FieldView, usesJapaneseCopy } from '../_shared/field.js'
import { syncAttribute, syncStates } from '../_shared/internals.js'
import type { Binding, Listeners } from '../_shared/native-control.js'
import { bindListeners } from '../_shared/native-control.js'
import { contract } from './select.contract.js'
import { initialSelection, isSelected } from './select.logic.js'

/** 契約の子を絞る（`_shared/native-control.ts` の `NativeControl` は input / textarea だけ） */
const asSelect = (element: Element | undefined): HTMLSelectElement | undefined =>
  element instanceof HTMLSelectElement ? element : undefined

/**
 * 1 つ選ぶ。子の `<label for>` と `<select>` を包む（ティア A、ADR-0012）。
 * 送信・検証・ラベル付けはブラウザが素で行い、JS が無ければネイティブの吹き出しが出る（退行しない）。
 * 見た目はネイティブのまま（customizable `<select>` は Baseline 外。docs/baseline.md）。
 *
 * @summary 1 つ選ぶ。ラベルと <select> は利用側が書く
 * @status experimental
 * @pe A
 *
 * @csspart hint - 補足文言
 * @csspart error - エラー文言
 * @cssprop --rd-select-gap - ラベル・選択欄・文言の間隔。既定 var(--rd-space-1)
 * @state invalid - 検証に通っていない（操作後、または error 属性がある）
 * @state errored - error 属性で文言を強制表示している
 * @state hinted - hint がある
 * @state filled - 空でない選択肢を選んでいる
 * @state malformed - 契約の子（<label for> と <select>）が無い
 */
export class RdSelect extends LitElement {
  static override properties: PropertyDeclarations = {
    hint: {},
    error: {},
    defaultValue: { attribute: 'value' },
  }

  declare hint: string
  declare error: string
  declare defaultValue: string

  #internals = this.attachInternals()
  #control: HTMLSelectElement | undefined = undefined
  #contractOk = false
  #touched = false
  #binding: Binding | undefined = undefined

  constructor() {
    super()
    this.hint = ''
    this.error = ''
    this.defaultValue = ''
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
        `[rd-select] <label for> と <select> が必要（不足: ${result.roles.join(', ')}）`,
      )
    }
    this.#contractOk = result.kind === 'ok'
    this.#control = asSelect(result.kind === 'ok' ? result.found['control'] : undefined)
    // `value` 属性は初期選択（`<input value>` と同じ意味論）
    this.#write(initialSelection(this.defaultValue))
    this.#binding = bindListeners(this.#control, this.#listeners)
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

  /** 値はネイティブ要素が持つ。部品は委譲するだけ（`value` 属性は初期選択） */
  get value(): string {
    return this.#control?.value ?? ''
  }

  set value(next: string) {
    this.#write(next)
  }

  checkValidity(): boolean {
    return this.#control?.checkValidity() ?? true
  }

  reportValidity(): boolean {
    return this.#control?.reportValidity() ?? true
  }

  #listeners: Listeners = {
    change: () => this.#setTouched(true),
    blur: () => this.#setTouched(true),
    invalid: (event) => {
      event.preventDefault()
      this.#setTouched(true)
    },
  }

  #write = (next: string | undefined): void => {
    const control = this.#control
    if (control !== undefined && next !== undefined) {
      control.value = next
    }
  }

  #setTouched = (next: boolean): void => {
    this.#touched = next
    this.requestUpdate()
  }

  #view = (): FieldView =>
    computeView({
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
      filled: isSelected(this.#control?.value ?? ''),
    })
}
