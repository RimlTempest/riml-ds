import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { usesJapaneseCopy } from '../_shared/field.js'
import { syncAttribute, syncStates } from '../_shared/internals.js'
import type { Binding, Listeners } from '../_shared/native-control.js'
import { bindListeners } from '../_shared/native-control.js'
import { contract } from './checkbox-group.contract.js'
import { type CheckboxGroupView, computeCheckboxGroupView } from './checkbox-group.logic.js'

/**
 * 複数選択。`<legend>` と `<label>` が包む `<input type="checkbox">` に状態と文言を足す
 * （ティア A、ADR-0012）。送信・検証はブラウザが素で行い、`segmented` は見た目だけを区画に変える。
 * 無効化は `<fieldset disabled>`。`min`（1 つ以上）は**JS が無いと効かない**。
 *
 * @summary 複数選択。<fieldset><legend> と <input type=checkbox> は利用側が書く
 * @status experimental
 * @pe A
 *
 * @csspart options - 選択肢の入れ物
 * @csspart hint - 補足文言
 * @csspart error - エラー文言
 * @cssprop --rd-checkbox-group-gap - 選択肢の間隔。既定 var(--rd-space-2)
 * @state segmented - segmented 属性が付いている（見た目だけ区画になる）
 * @state invalid - 検証に通っていない（操作後、または error 属性がある）
 * @state errored - error 属性で文言を強制表示している
 * @state hinted - hint がある
 * @state filled - 1 つ以上選んでいる
 * @state malformed - 契約の子が無い
 */
export class RdCheckboxGroup extends LitElement {
  static override properties: PropertyDeclarations = {
    hint: {},
    error: {},
    segmented: { type: Boolean, reflect: true },
    min: { type: Number, reflect: true },
  }

  declare hint: string
  declare error: string
  declare segmented: boolean
  declare min: number
  #internals = this.attachInternals()
  #contractOk = false
  #touched = false
  #bindings: readonly Binding[] = []

  constructor() {
    super()
    this.hint = ''
    this.error = ''
    this.segmented = false
    this.min = 0
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
      console.error(`[rd-checkbox-group] <fieldset><legend> と checkbox が必要（不足: ${missing}）`)
    }
    this.#contractOk = result.kind === 'ok'
    this.#bindings = this.#boxes().map((box) => bindListeners(box, this.#listeners))
  }

  /** hint / error は**各 checkbox** の `aria-describedby` で結ぶ（`<fieldset>` には付けない）。
   * `aria-invalid` は使わず `:state(invalid)` で伝える（radio-group と同じ判断） */
  override updated(): void {
    const view = this.#view()
    syncStates(this.#internals, view.states)
    this.#boxes().forEach((box) => {
      syncAttribute(box, 'aria-describedby', view.describedBy)
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
  get value(): readonly string[] {
    return this.#boxes().flatMap((box) => (box.checked ? [box.value] : []))
  }

  set value(next: readonly string[]) {
    const wanted = new Set(next)
    this.#boxes().forEach((box) => {
      box.checked = wanted.has(box.value)
    })
    this.requestUpdate()
  }

  /** ネイティブの検証に加えて `min` を見る（`min` は素の `invalid` を出さない） */
  checkValidity(): boolean {
    return this.#boxes().every((box) => box.checkValidity()) && this.value.length >= this.min
  }

  #boxes = (): readonly HTMLInputElement[] =>
    [...this.querySelectorAll(contract.roles.control)].flatMap((node) =>
      node instanceof HTMLInputElement ? [node] : [],
    )

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

  #view = (): CheckboxGroupView => {
    const first = this.#boxes()[0]
    return computeCheckboxGroupView({
      controlId: first?.id ?? '',
      error: this.error,
      validity: first?.validity ?? {},
      validationMessage: first?.validationMessage ?? '',
      attrs: {},
      japanese: usesJapaneseCopy(this),
      malformed: !this.#contractOk,
      invalid: this.#boxes().some((box) => !box.validity.valid),
      touched: this.#touched,
      hasHint: this.hint !== '',
      hasError: this.error !== '',
      segmented: this.segmented,
      checkedCount: this.value.length,
      min: this.min,
    })
  }
}
