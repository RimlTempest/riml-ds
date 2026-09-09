/**
 * `rd-calendar` が light DOM を読み書きするための層。判断は `calendar.logic.ts`（純関数）が持ち、
 * ここにあるのは「読む・書く・型で絞る・木を作る」だけ——`*.element.ts` を 150 行に収める
 * （ADR-0005）ための置き場でもある。
 *
 * 月表も **light DOM** に描く（ティア A、ADR-0012）。`<label for>` と `<input type="date">` は
 * 利用側が書いたものをそのまま使い、部品は消さない。
 */
import { html, nothing, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { usesJapaneseCopy } from '../_shared/lang.js'
import { bindListeners, setControlValue } from '../_shared/native-control.js'
import { contract } from './calendar.contract.js'
import {
  type CalendarAction,
  type CalendarView,
  type Cell,
  cellLabel,
  decideClick,
  decideKey,
  formatIsoDate,
  inRange,
  type IsoDate,
  monthTitle,
  type NavCopy,
  navCopy,
  parseIsoDate,
  type WeekdayName,
  weekdayNames,
} from './calendar.logic.js'

/**
 * 契約の子と、そこに配ったリスナ・観測。`ok` が false なら `malformed`
 * （部品は自分で `<input>` を作らない）。
 */
export type Attached = {
  readonly ok: boolean
  readonly control: HTMLInputElement | undefined
  /** grid を `aria-labelledby` で結ぶ先。`<label>` に id が無ければ部品が付ける */
  readonly labelId: string
  readonly detach: () => void
}

export const NOT_ATTACHED: Attached = {
  ok: false,
  control: undefined,
  labelId: '',
  detach: () => {},
}

/** `<input>` から読める日付。**値の真実はここ**（部品は自分で値を持たない） */
export type CalendarDates = {
  readonly selected: IsoDate | undefined
  readonly today: IsoDate
  readonly min: IsoDate | undefined
  readonly max: IsoDate | undefined
}

/** 描くときに要る表示用の文字列。`Intl` の呼び出しは 1 回の更新にまとめる */
export type CalendarNames = {
  readonly title: string
  readonly weekdays: readonly WeekdayName[]
  readonly nav: NavCopy
  readonly locale: string
}

/** 木の中で参照する id */
export type CalendarIds = { readonly labelId: string }

const asInput = (element: Element | undefined): HTMLInputElement | undefined =>
  element instanceof HTMLInputElement ? element : undefined

/** 空の `id` にだけ既定値を入れる。利用側が書いていればそのまま尊重する */
const ensureLabelId = (label: Element | undefined, fallback: string): string => {
  const target = label instanceof HTMLElement ? label : undefined
  if (target === undefined) {
    return ''
  }
  target.id = target.id === '' ? fallback : target.id
  return target.id
}

/**
 * 契約を見て子を掴む。`<label for>` はネイティブの結び付きなのでそのままにし、
 * grid 側は同じ light DOM の `<label>` を `aria-labelledby` で指す（shadow 境界をまたがない）。
 */
export const attach = (host: HTMLElement, onChange: () => void): Attached => {
  const result = checkContract(host, contract)
  if (result.kind === 'missing') {
    const missing = result.roles.join(', ')
    console.error(`[rd-calendar] <label> と <input type="date"> が必要（不足: ${missing}）`)
    return NOT_ATTACHED
  }
  const control = asInput(result.found['control'])
  const labelId = ensureLabelId(result.found['label'], `${control?.id ?? 'rd-calendar'}-label`)
  const binding = bindListeners(control, { input: onChange })
  // `min` / `max` の書き換えにだけ追随する（`value` プロパティは属性を動かさないので見ない）
  const observer = new MutationObserver(onChange)
  observer.observe(control ?? host, { attributes: true, attributeFilter: ['min', 'max'] })
  return {
    ok: control !== undefined,
    control,
    labelId,
    detach: () => {
      binding.detach()
      observer.disconnect()
    },
  }
}

/** 「今日」を実時刻から決めるのはここ 1 箇所だけ（`today` 属性があればそちらが勝つ） */
export const readDates = (control: HTMLInputElement | undefined, today: string): CalendarDates => ({
  selected: parseIsoDate(control?.value),
  today: parseIsoDate(today) ?? formatIsoDate(new Date()),
  min: parseIsoDate(control?.min),
  max: parseIsoDate(control?.max),
})

/** `value` setter 用。`YYYY-MM-DD` でなければ空にする。イベントは出さない */
export const writeValue = (control: HTMLInputElement | undefined, next: string): void => {
  setControlValue(control, parseIsoDate(next) ?? '')
}

/**
 * 選んだ日を `<input>` に書き、ネイティブと同じ形で知らせてから `rd-change` を出す。
 * 自分が投げた `input` で部品自身の追随が走るのは正しい（`selected` が同じ値になるだけ）。
 */
export const commitDate = (
  host: HTMLElement,
  control: HTMLInputElement | undefined,
  iso: IsoDate,
): void => {
  setControlValue(control, iso)
  control?.dispatchEvent(new Event('input', { bubbles: true }))
  control?.dispatchEvent(new Event('change', { bubbles: true }))
  host.dispatchEvent(
    new CustomEvent('rd-change', { bubbles: true, composed: true, detail: { value: iso } }),
  )
}

/** 月名・曜日名はページの言語で。文言（前の月 / 次の月）は `usesJapaneseCopy` で選ぶ */
export const namesOf = (
  view: CalendarView,
  weekStart: number,
  host: HTMLElement,
): CalendarNames => {
  const japanese = usesJapaneseCopy(host)
  const locale = japanese ? 'ja' : (host.closest('[lang]')?.getAttribute('lang') ?? 'en')
  return {
    title: monthTitle(view.month, locale),
    weekdays: weekdayNames(weekStart, locale),
    nav: navCopy(japanese),
    locale,
  }
}

/** 押された升目の日。`<input>` や余白から上がってきた event は `undefined` */
const readCell = (event: Event): IsoDate | undefined =>
  (event.target instanceof Element
    ? event.target.closest('[data-iso]')?.getAttribute('data-iso')
    : null) ?? undefined

/** 押された月送り。`prev` は -1、`next` は +1 か月 */
const readNav = (event: Event): number | undefined => {
  const part = event.target instanceof Element ? event.target.closest('[part]') : null
  const name = part?.getAttribute('part') ?? ''
  return name === 'prev' ? -1 : name === 'next' ? 1 : undefined
}

const keyOf = (event: Event): { readonly key: string; readonly shift: boolean } =>
  event instanceof KeyboardEvent
    ? { key: event.key, shift: event.shiftKey }
    : { key: '', shift: false }

/** click と keydown の 1 本道。「何をするか」は純関数（`decideKey` / `decideClick`）が決める */
export const actionOf = (event: Event, view: CalendarView, weekStart: number): CalendarAction => {
  const cell = readCell(event)
  return event.type === 'keydown'
    ? decideKey({ ...keyOf(event), cell, focused: view.focused, weekStart })
    : decideClick({
        cell,
        nav: readNav(event),
        month: view.month,
        focused: view.focused,
        states: view.states,
      })
}

/** 月をまたいだ再描画のあとで焦点を取り戻す。`iso` が無いときは何もしない */
export const focusCell = (host: HTMLElement, iso: IsoDate | undefined): void => {
  const cell = iso === undefined ? null : host.querySelector(`[data-iso="${iso}"]`)
  if (cell instanceof HTMLElement) {
    cell.focus()
  }
}

/**
 * gridcell は `<td>` 自身が focusable（APG「Date Picker Dialog」と同じ。`<button>` は入れない
 * ——`aria-selected` は gridcell に置く必要がある）。月の外は空欄にして読み上げから外す。
 * `role="gridcell"` は**書かない**——`<table role="grid">` の中では `<td>` の暗黙の役割が
 * gridcell なので、書くと markuplint の `wai-aria`（暗黙の役割の明示）に落ちる（032 の `<li>` と同じ判断）。
 */
const cellTemplate = (cell: Cell, view: CalendarView, locale: string): TemplateResult => {
  if (cell === undefined) {
    return html`<td aria-hidden="true"></td>`
  }
  const outside = !inRange(cell.iso, view.min, view.max)
  return html`<td
    data-iso=${cell.iso}
    tabindex=${cell.iso === view.focused ? 0 : -1}
    aria-label=${cellLabel(cell.iso, locale)}
    aria-selected=${cell.iso === view.selected ? 'true' : nothing}
    aria-current=${cell.iso === view.today ? 'date' : nothing}
    aria-disabled=${outside ? 'true' : nothing}
  >
    ${cell.day}
  </td>`
}

/** 月送りのボタン。行き止まりでも `disabled` にしない（Tab で止まって理由が分かる） */
const navTemplate = (part: string, copy: string, glyph: string, blocked: boolean): TemplateResult =>
  html`<button
    type="button"
    part=${part}
    aria-label=${copy}
    aria-disabled=${blocked ? 'true' : nothing}
  >
    <span aria-hidden="true">${glyph}</span>
  </button>`

/**
 * 強化ノード。Lit は既存の子（`<label>` / `<input>`）を消さず、その**後ろ**に描く。
 * 契約が欠けているときは何も足さない（JS 無しと同じ姿に留める）。
 */
export const calendarTemplate = (
  view: CalendarView,
  names: CalendarNames,
  ids: CalendarIds,
): TemplateResult =>
  view.states.has('malformed')
    ? html``
    : html`<div part="header">
          ${navTemplate('prev', names.nav.prev, '‹', view.states.has('at-min'))}
          <p part="title" aria-live="polite">${names.title}</p>
          ${navTemplate('next', names.nav.next, '›', view.states.has('at-max'))}
        </div>
        <table part="grid" role="grid" aria-labelledby=${ids.labelId}>
          <thead>
            <tr>
              ${names.weekdays.map((name) => html`<th scope="col" abbr=${name.long}>${name.short}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${view.rows.map(
              (row) =>
                html`<tr>
                  ${row.map((cell) => cellTemplate(cell, view, names.locale))}
                </tr>`,
            )}
          </tbody>
        </table>`
