import { LitElement, type PropertyDeclarations, type TemplateResult } from 'lit'
import { syncStates } from '../_shared/internals.js'
import { type Binding, bindListeners } from '../_shared/native-control.js'
import * as dom from './calendar.dom.js'
import * as logic from './calendar.logic.js'

/**
 * 月の暦。子の `<label for>` と `<input type="date">` を包む（ティア A、ADR-0012）。**JS 無しでも動く**
 * ——入力欄がそのまま送信され、モバイルでは OS のピッカーが出る。JS が来たら同じ light DOM の末尾に
 * `role="grid"` の月表を足す。**値の真実は `<input>`**（`min` / `max` / `required` も `<input>` の属性）。
 *
 * @summary 月の暦。<label> と <input type="date"> は利用側が書き、JS があるときだけその下に月表が付く
 * @status experimental
 * @pe A
 *
 * @slot - <label for> と <input type="date">（省略不可）
 * @attr today - 「今日」（YYYY-MM-DD）。省略すると実時刻から決める。テスト・story は必ず書く
 * @attr week-start - 週の始まり。0（日曜、既定）〜 6
 * @csspart header - 月の見出しと前後の月ボタン
 * @csspart title - 表示している年月
 * @csspart prev - 前の月へ送るボタン
 * @csspart next - 次の月へ送るボタン
 * @csspart grid - 月表（<table role="grid">）
 * @cssprop --rd-calendar-cell-size - 日のタイルの一辺。既定 var(--rd-sizing-target-min)
 * @event {CustomEvent<{ value: string }>} rd-change - 日を選んだときに発火（value は YYYY-MM-DD）
 * @state selected - 日が選ばれている
 * @state empty - まだ選ばれていない
 * @state at-min - 前の月がまるごと min より前
 * @state at-max - 次の月がまるごと max より後
 * @state malformed - 契約の子（<label> と <input type="date">）が無い
 */
export class RdCalendar extends LitElement {
  static override properties: PropertyDeclarations = {
    today: {},
    weekStart: { attribute: 'week-start' },
  }

  declare today: string
  declare weekStart: string
  #internals = this.attachInternals()
  #attached = dom.NOT_ATTACHED
  #month: logic.YearMonth = { year: 1970, month: 1 }
  #focused: logic.IsoDate = '1970-01-01'
  #pendingFocus = false
  #hostBinding: Binding | undefined = undefined

  constructor() {
    super()
    this.today = ''
    this.weekStart = ''
    this.#hostBinding = bindListeners(this, { click: this.#onEvent, keydown: this.#onEvent })
  }

  /** light DOM に描く。既存の子は消さず、月表だけを末尾に足す（ADR-0012） */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#attached.detach()
    this.#hostBinding?.detach()
  }

  /** 描く前に契約の子を掴む（初回の描画から月表が出る） */
  override willUpdate(): void {
    this.#setup()
  }

  override updated(): void {
    syncStates(this.#internals, this.#view().states)
    dom.focusCell(this, this.#pendingFocus ? this.#focused : undefined)
    this.#pendingFocus = false
  }

  override render(): TemplateResult {
    const view = this.#view()
    const names = dom.namesOf(view, logic.parseWeekStart(this.weekStart), this)
    return dom.calendarTemplate(view, names, { labelId: this.#attached.labelId })
  }

  /** 値はネイティブの `<input>` が持つ。部品は委譲するだけ */
  get value(): string {
    return this.#attached.control?.value ?? ''
  }

  set value(next: string) {
    dom.writeValue(this.#attached.control, next)
    this.#follow()
  }

  checkValidity(): boolean {
    return this.#attached.control?.checkValidity() ?? true
  }

  reportValidity(): boolean {
    return this.#attached.control?.reportValidity() ?? true
  }

  /** 初回だけ。契約を見て子を掴み、`<input>` の書き換えに追随する道を作る */
  #setup = (): void => {
    if (this.hasUpdated) {
      return
    }
    this.#attached = dom.attach(this, this.#follow)
    this.#follow()
  }

  /** `<input>` の値・範囲に月表を合わせる（打ち込みにも `value` setter にも同じ道） */
  #follow = (): void => {
    const dates = this.#read()
    this.#focused = dates.selected ?? logic.clampToRange(dates.today, dates.min, dates.max)
    this.#month = logic.monthOf(this.#focused)
    this.requestUpdate()
  }

  /** click も keydown も 1 本道。`<input>` の上のキーは `decideKey` が `none` に落とす */
  #onEvent = (event: Event): void => {
    this.#run(dom.actionOf(event, this.#view(), logic.parseWeekStart(this.weekStart)), event)
  }

  /** 範囲の外へ焦点は動けるが選べない（`aria-disabled`。APG と同じ） */
  #run = (action: logic.CalendarAction, event: Event): void => {
    const dates = this.#read()
    if (action.kind === 'none') {
      return
    }
    event.preventDefault()
    if (action.kind === 'move') {
      this.#focused = action.iso
      this.#month = logic.monthOf(action.iso)
      this.#pendingFocus = action.focus
      this.requestUpdate()
      return
    }
    if (logic.inRange(action.iso, dates.min, dates.max)) {
      dom.commitDate(this, this.#attached.control, action.iso)
    }
  }

  #read = (): dom.CalendarDates => dom.readDates(this.#attached.control, this.today)
  #view = (): logic.CalendarView =>
    logic.computeView({
      ...this.#read(),
      month: this.#month,
      focused: this.#focused,
      weekStart: logic.parseWeekStart(this.weekStart),
      malformed: !this.#attached.ok,
    })
}
