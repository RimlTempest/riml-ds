import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { syncAttribute, syncStates } from '../_shared/internals.js'
import type { Listeners } from '../_shared/native-control.js'
import { setControlValue } from '../_shared/native-control.js'
import * as dom from './number-field.dom.js'
import type { NumberFieldView, StepDirection } from './number-field.logic.js'

/**
 * 数値を 1 つ。子の `<label for>` と `<input type="number">` を包む（ティア A、ADR-0012）。
 * 送信・検証（`min` / `max` / `step`）・↑↓ キーの刻みはブラウザが素で行い、部品が足すのは
 * **44px の − / + ボタン**と刻みの丸めだけ。押すと `<input>` から `input` → `change` が上がる
 * （独自イベントは出さない）。JS が無いときは「ボタンの無い普通の数値入力」に縮退する。
 *
 * @summary 数値を 1 つ。<label for> と <input type=number> は利用側が書く。− / + の 44px ボタンと丸めだけ部品が足す
 * @status experimental
 * @pe A
 *
 * @slot - <label for> と <input type="number">（省略不可）
 * @csspart stepper - − / + を載せる枕
 * @csspart decrement - 減らすボタン
 * @csspart increment - 増やすボタン
 * @csspart hint - 補足文言
 * @csspart error - エラー文言
 * @cssprop --rd-number-field-gap - ラベル・入力欄・文言の間隔。既定 var(--rd-space-1)
 * @state invalid - 検証に通っていない（操作後、または error 属性がある）
 * @state errored - error 属性で文言を強制表示している
 * @state hinted - hint がある
 * @state filled - 値が入っている
 * @state malformed - 契約の子（<label for> と <input type="number">）が無い
 */
export class RdNumberField extends LitElement {
  static override properties: PropertyDeclarations = { hint: {}, error: {} }

  declare hint: string
  declare error: string

  #internals = this.attachInternals()
  #attached = dom.NOT_ATTACHED
  #touched = false

  constructor() {
    super()
    this.hint = ''
    this.error = ''
  }

  /** light DOM に描く。既存の子は消さず、文言と刻みのボタンだけを末尾に足す */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#attached.detach()
    this.#attached = dom.NOT_ATTACHED
  }

  /** 描く前に契約の子を掴む（初回の描画から − / + が出る。calendar と同じ形） */
  override willUpdate(): void {
    this.#attached = this.hasUpdated
      ? this.#attached
      : dom.attach(this, this.#listeners, this.#formListeners, this.#redraw)
  }

  override updated(): void {
    const view = this.#view()
    syncStates(this.#internals, view.states)
    syncAttribute(this.#attached.control, 'aria-describedby', view.describedBy)
    syncAttribute(this.#attached.control, 'aria-invalid', view.ariaInvalid)
  }

  /** 強化ノード。`aria-live` は付けない（ADR-0008 §6。値の読み上げはネイティブに任せる） */
  override render(): TemplateResult {
    const view = this.#view()
    return html`${this.hint === '' ? nothing : html`<p part="hint" id=${view.hintId}>${this.hint}</p>`}${
      view.message === '' ? nothing : html`<p part="error" id=${view.errorId}>${view.message}</p>`
    }${dom.stepperTemplate(view, this.#step)}`
  }

  /** 値はネイティブ要素が持つ。部品は委譲するだけ */
  get value(): string {
    return this.#attached.control?.value ?? ''
  }

  set value(next: string) {
    setControlValue(this.#attached.control, next)
    this.requestUpdate()
  }

  get valueAsNumber(): number {
    return this.#attached.control?.valueAsNumber ?? Number.NaN
  }

  /** ネイティブの同名メソッドと違い、空欄・`any`・丸めを純関数で扱い例外を投げない */
  stepUp(): void {
    this.#step(1)
  }

  stepDown(): void {
    this.#step(-1)
  }

  #step = (direction: StepDirection): void => {
    dom.applyStep(this.#attached.control, direction)
    this.requestUpdate()
  }

  #redraw = (): void => this.requestUpdate()

  #setTouched = (next: boolean): void => {
    this.#touched = next
    this.requestUpdate()
  }

  #listeners: Listeners = {
    input: this.#redraw,
    change: () => this.#setTouched(true),
    blur: () => this.#setTouched(true),
    invalid: (event) => {
      event.preventDefault()
      this.#setTouched(true)
    },
  }

  #formListeners: Listeners = { reset: () => this.#setTouched(false) }

  #view = (): NumberFieldView =>
    dom.viewOf(this, this.#attached, {
      hint: this.hint,
      error: this.error,
      touched: this.#touched,
    })
}
