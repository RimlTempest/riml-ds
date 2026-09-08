import { LitElement, type PropertyDeclarations, type TemplateResult } from 'lit'
import type { Binding, Listeners } from '../_shared/native-control.js'
import { bindListeners, setControlValue } from '../_shared/native-control.js'
import type { ComboboxFilter } from './combobox.contract.js'
import * as dom from './combobox.dom.js'
import type { Candidate, ComboboxState } from './combobox.logic.js'
import { decideKey, reduceKey } from './combobox.logic.js'

const CLOSED: ComboboxState = { open: false, active: -1 }
let sequence = 0

/**
 * 候補から選びながら打てる入力欄。子の `<label for>`・`<input list>`・`<datalist>` を包む
 * （ティア A、ADR-0012）。JS が無ければネイティブの `<datalist>` が候補を出し、定義後は
 * APG「Combobox with List Autocomplete」の形に置き換える。値・送信・検証はネイティブが持つ。
 *
 * @summary 候補から選びながら打てる入力欄。<input list> と <datalist> は利用側が書く
 * @status experimental
 * @pe A
 *
 * @csspart hint - 補足文言
 * @csspart error - エラー文言
 * @csspart list - 候補の listbox（`popover="manual"`）
 * @cssprop --rd-combobox-gap - ラベル・入力欄・文言の間隔。既定 var(--rd-space-1)
 * @event {CustomEvent<{ value: string; index: number }>} rd-select - 候補で確定したとき
 * @state invalid - 検証に通っていない（操作後、または error 属性がある）
 * @state errored - error 属性で文言を強制表示している
 * @state hinted - hint がある
 * @state filled - 値が入っている
 * @state open - 候補が出ている
 * @state empty - 絞った結果が 0 件
 * @state malformed - 契約の子（<label for> と <input list> と <datalist>）が無い
 */
export class RdCombobox extends LitElement {
  static override properties: PropertyDeclarations = { hint: {}, error: {}, filter: {} }

  declare hint: string
  declare error: string
  /** 絞り込みの仕方。`none` は候補をサーバー側で絞る利用側向け */
  declare filter: ComboboxFilter
  #internals = this.attachInternals()
  #wiring = dom.NO_WIRING
  #touched = false
  #state: ComboboxState = CLOSED
  #name = `rd-combobox-${(sequence += 1)}`
  #binding: Binding | undefined = undefined
  #observer: MutationObserver | undefined = undefined

  constructor() {
    super()
    this.hint = ''
    this.error = ''
    this.filter = 'contains'
  }

  /** light DOM に描く。既存の子は消さず、文言と候補リストを末尾に足す */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#binding?.detach()
    this.#observer?.disconnect()
  }

  /** 契約は `list` を外す前に 1 回だけ見る（`dom.wire`）。描く前に掴むので描き直しが要らない */
  override willUpdate(): void {
    if (this.hasUpdated) {
      return
    }
    this.#wiring = dom.wire(this, this.#name)
    this.#binding = bindListeners(this.#wiring.control, this.#listeners)
    this.#observer = dom.observeOptions(this.#wiring.datalist, () => this.requestUpdate())
  }

  override updated(): void {
    dom.applyUpdate(this.#internals, this.#snapshot())
  }

  /** 強化ノード。候補は `<datalist>` から写すだけで `aria-live` は付けない（ADR-0008 §6） */
  override render(): TemplateResult {
    return dom.renderField(this.#snapshot())
  }

  get value(): string {
    return this.#wiring.control?.value ?? ''
  }
  set value(next: string) {
    setControlValue(this.#wiring.control, next)
  }
  checkValidity(): boolean {
    return this.#wiring.control?.checkValidity() ?? true
  }
  reportValidity(): boolean {
    return this.#wiring.control?.reportValidity() ?? true
  }

  #snapshot = (): dom.Snapshot => ({
    wiring: this.#wiring,
    name: this.#name,
    state: this.#state,
    hint: this.hint,
    error: this.error,
    touched: this.#touched,
    candidates: this.#matches(),
    list: this.#list(),
    host: this,
    onClick: this.#onClick,
  })

  #list = (): HTMLElement | undefined => dom.asElement(this.querySelector(':scope > [part="list"]'))
  #matches = (): readonly Candidate[] => dom.matchesOf(this.#wiring, this.value, this.filter)

  #listeners: Listeners = dom.listenersFor({
    input: () => this.#set({ open: this.#matches().length > 0, active: -1 }),
    keydown: (event) => this.#onKeydown(event),
    // ポインタで候補を押している途中は閉じない（pointerdown を止めているので普通は起きない）
    blur: (event) => this.#set(dom.movedInto(event, this.#list()) ? this.#state : CLOSED, true),
    touched: () => this.#set(this.#state, true),
  })

  #set = (next: ComboboxState, touched = this.#touched): void => {
    this.#state = next
    this.#touched = touched
    this.requestUpdate()
  }

  /** 確定が先。値を書くと `input` が飛んで開き直すので、そのあとに閉じた状態を書く */
  #onKeydown = (event: Event): void => {
    const action = decideKey({ ...this.#state, ...dom.keyOf(event), count: this.#matches().length })
    this.#commit(action.kind === 'commit' ? action.active : -1)
    this.#set(reduceKey(action, this.#state))
    if (action.prevent) {
      event.preventDefault()
    }
  }

  #onClick = (event: Event): void => {
    this.#commit(dom.optionIndexOf(event))
    this.#set(CLOSED)
  }

  #commit = (index: number): void =>
    dom.commitCandidate(this, this.#wiring.control, this.#matches()[index], index)
}
