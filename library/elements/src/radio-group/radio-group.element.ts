import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { usesJapaneseCopy } from '../_shared/field.js'
import { syncAttribute, syncStates } from '../_shared/internals.js'
import type { Binding, Listeners } from '../_shared/native-control.js'
import { bindListeners } from '../_shared/native-control.js'
import { contract } from './radio-group.contract.js'
import { computeRadioGroupView, type RadioGroupView } from './radio-group.logic.js'

const asRadio = (element: Element): readonly HTMLInputElement[] =>
  element instanceof HTMLInputElement ? [element] : []

/**
 * 択一。`<legend>` と `<label>` が包む `<input type="radio">` に状態と文言を足す（ティア A、
 * ADR-0012）。送信・検証・矢印キーはブラウザが素で行う。`segmented` は見た目だけを区画に変え、
 * 無効化は `<fieldset disabled>` をそのまま使う。
 * @summary 択一。<fieldset><legend> と <input type=radio> は利用側が書く
 * @status experimental
 * @pe A
 *
 * @csspart options - 選択肢の入れ物
 * @csspart hint - 補足文言
 * @csspart error - エラー文言
 * @cssprop --rd-radio-group-gap - 選択肢の間隔。既定 var(--rd-space-2)
 * @state segmented - segmented 属性が付いている（見た目だけ区画になる）
 * @state invalid - 検証に通っていない（操作後、または error 属性がある）
 * @state errored - error 属性で文言を強制表示している
 * @state hinted - hint がある
 * @state filled - どれかを選んでいる
 * @state malformed - 契約の子が無い
 */
export class RdRadioGroup extends LitElement {
  static override properties: PropertyDeclarations = {
    hint: {},
    error: {},
    segmented: { type: Boolean, reflect: true },
  }

  declare hint: string
  declare error: string
  declare segmented: boolean
  #internals = this.attachInternals()
  #contractOk = false
  #touched = false
  #bindings: readonly Binding[] = []

  constructor() {
    super()
    this.hint = ''
    this.error = ''
    this.segmented = false
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
      console.error(`[rd-radio-group] <fieldset><legend> と radio が必要（不足: ${missing}）`)
    }
    this.#contractOk = result.kind === 'ok'
    this.#bindings = this.#radios().map((radio) => bindListeners(radio, this.#listeners))
  }

  /** hint / error は**各 radio** の `aria-describedby` で結ぶ（`<fieldset>` には付けない）。
   * `aria-invalid` は ARIA 1.2 で `role="radio"` では非推奨なので使わず、不正は `:state(invalid)` で伝える */
  override updated(): void {
    const view = this.#view()
    syncStates(this.#internals, view.states)
    this.#radios().forEach((radio) => {
      syncAttribute(radio, 'aria-describedby', view.describedBy)
    })
  }

  /** 強化ノード（ADR-0008 §6: `aria-live` は付けない） */
  override render(): TemplateResult {
    const view = this.#view()
    return html`${this.hint === '' ? nothing : html`<p part="hint" id=${view.hintId}>${this.hint}</p>`}${
      view.message === '' ? nothing : html`<p part="error" id=${view.errorId}>${view.message}</p>`
    }`
  }

  /** 選択はネイティブ要素が持つ。部品は委譲するだけ */
  get value(): string {
    return this.#radios().find((radio) => radio.checked)?.value ?? ''
  }

  set value(next: string) {
    const match = this.#radios().find((radio) => radio.value === next)
    if (match !== undefined) {
      match.checked = true
      this.requestUpdate()
    }
  }

  checkValidity(): boolean {
    return this.#anchor()?.checkValidity() ?? true
  }

  #radios = (): readonly HTMLInputElement[] =>
    [...this.querySelectorAll(contract.roles.control)].flatMap(asRadio)

  /** 検証と文言の基準にする radio。`required` は group のどれか 1 つに付いていればよい */
  #anchor = (): HTMLInputElement | undefined =>
    this.#radios().find((radio) => radio.required) ?? this.#radios()[0]

  #setTouched = (): void => {
    this.#touched = true
    this.requestUpdate()
  }

  #listeners: Listeners = {
    change: this.#setTouched,
    blur: this.#setTouched,
    invalid: (event) => {
      event.preventDefault()
      this.#setTouched()
    },
  }

  #view = (): RadioGroupView => {
    const anchor = this.#anchor()
    return computeRadioGroupView({
      controlId: anchor?.id ?? '',
      error: this.error,
      validity: anchor?.validity ?? {},
      validationMessage: anchor?.validationMessage ?? '',
      attrs: {},
      japanese: usesJapaneseCopy(this),
      malformed: !this.#contractOk,
      invalid: anchor?.validity.valid === false,
      touched: this.#touched,
      hasHint: this.hint !== '',
      hasError: this.error !== '',
      filled: this.value !== '',
      segmented: this.segmented,
    })
  }
}
