import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { usesJapaneseCopy } from '../_shared/field.js'
import { syncAttribute, syncStates } from '../_shared/internals.js'
import type { Binding, Listeners } from '../_shared/native-control.js'
import { bindListeners, readAttrs, setControlValue } from '../_shared/native-control.js'
import { contract, type SliderOrientation } from './slider.contract.js'
import { computeSliderView, type SliderView } from './slider.logic.js'

/** ネイティブが値を持つ属性。変わったら塗りを描き直す（rd-meter と同じ仕組み） */
const OBSERVED = ['value', 'min', 'max', 'step']

/**
 * 連続値を 1 つ。`<label for>` と `<input type="range">`（任意で `<output for>`）を包む（ティア A、
 * ADR-0012）。値・範囲・刻み・キーボード操作はネイティブが持ち、部品がするのは塗りの割合を
 * `--rd-slider-fill` に写すことと `<output>` に現在値を書くことだけ。
 * @summary 連続値を 1 つ。<label for> と <input type=range> は利用側が書く
 * @status experimental
 * @pe A
 * @csspart track - 塗りのトラック（装飾。aria-hidden）
 * @csspart fill - トラックの塗り
 * @csspart hint - 補足文言
 * @csspart error - エラー文言
 * @cssprop --rd-slider-fill - 塗りの割合（0–1）。部品が書く。読む側は上書きしない
 * @cssprop --rd-slider-block-size - 縦向きのときの長さ。既定 10rem
 * @state vertical - orientation="vertical"
 * @state invalid - 検証に通っていない（操作後、または error 属性がある）
 * @state errored - error 属性で文言を強制表示している
 * @state hinted - hint がある
 * @state filled - 値がある（range は常に値を持つ）
 * @state malformed - 契約の子が無い
 */
export class RdSlider extends LitElement {
  static override properties: PropertyDeclarations = {
    hint: {},
    error: {},
    unit: {},
    orientation: { reflect: true },
  }
  declare hint: string
  declare error: string
  declare unit: string
  declare orientation: SliderOrientation
  #internals = this.attachInternals()
  #control: HTMLInputElement | undefined = undefined
  #contractOk = false
  #touched = false
  #binding: Binding | undefined = undefined
  #observer: MutationObserver | undefined = undefined

  constructor() {
    super()
    this.hint = ''
    this.error = ''
    this.unit = ''
    this.orientation = 'horizontal'
  }

  override createRenderRoot(): HTMLElement {
    return this
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#binding?.detach()
    this.#observer?.disconnect()
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      console.error(`[rd-slider] <label for> と range が必要（不足: ${result.roles.join(', ')}）`)
    }
    this.#contractOk = result.kind === 'ok'
    const found = result.kind === 'ok' ? result.found['control'] : undefined
    this.#control = found instanceof HTMLInputElement ? found : undefined
    this.#binding = bindListeners(this.#control, this.#listeners)
    this.#observer = new MutationObserver(this.#redraw)
    this.#observer.observe(this, { attributes: true, attributeFilter: OBSERVED, subtree: true })
  }

  override updated(): void {
    const view = this.#view()
    this.style.setProperty('--rd-slider-fill', String(view.fill))
    syncStates(this.#internals, view.states)
    syncAttribute(this.#control, 'aria-describedby', view.describedBy)
    syncAttribute(this.#control, 'aria-invalid', view.ariaInvalid)
    this.querySelector(contract.roles.output)?.replaceChildren(view.outputText)
  }

  override render(): TemplateResult {
    const view = this.#view()
    return html`${this.hint === '' ? nothing : html`<p part="hint" id=${view.hintId}>${this.hint}</p>`}${
        view.message === '' ? nothing : html`<p part="error" id=${view.errorId}>${view.message}</p>`
      }<span part="track" aria-hidden="true"><span part="fill"></span></span>`
  }

  /** 値はネイティブ要素が持つ。部品は委譲するだけ */
  get value(): string {
    return this.#control?.value ?? ''
  }

  set value(next: string) {
    setControlValue(this.#control, next)
    this.requestUpdate()
  }

  get valueAsNumber(): number {
    return this.#control?.valueAsNumber ?? Number.NaN
  }

  #redraw = (): void => this.requestUpdate()

  #setTouched = (): void => {
    this.#touched = true
    this.requestUpdate()
  }

  #listeners: Listeners = {
    input: this.#redraw,
    change: this.#setTouched,
    blur: this.#setTouched,
    invalid: (event) => {
      event.preventDefault()
      this.#setTouched()
    },
  }

  #view = (): SliderView =>
    computeSliderView({
      controlId: this.#control?.id ?? this.querySelector(contract.roles.control)?.id ?? '',
      error: this.error,
      validity: this.#control?.validity ?? {},
      validationMessage: this.#control?.validationMessage ?? '',
      attrs: readAttrs(this.#control, ['min', 'max', 'step']),
      japanese: usesJapaneseCopy(this),
      malformed: !this.#contractOk,
      invalid: this.#control?.validity.valid === false,
      touched: this.#touched,
      hasHint: this.hint !== '',
      hasError: this.error !== '',
      filled: true,
      orientation: this.orientation,
      value: this.#control?.value ?? '',
      min: this.#control?.getAttribute('min') ?? '',
      max: this.#control?.getAttribute('max') ?? '',
      unit: this.unit,
    })
}
