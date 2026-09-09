/**
 * `rd-calendar` の純関数。DOM を触らない。`*.element.ts` はここを呼ぶだけ（ADR-0005）。
 *
 * 日付は `YYYY-MM-DD` の文字列（`IsoDate`）か `{ year, month }` で持ち、`Date` は
 * **`Date.UTC` の往復にだけ**使う。ローカル時刻で年月日から作る `Date`（引数が数値のもの、
 * 時刻付きの文字列）は実行環境のタイムゾーンで日がずれるので作らない。
 *
 * 新しい日付 API は Safari に無く、週の始まりを返す `Intl` の拡張は TS 7 の lib にも
 * Firefox にも無いので、どちらも使わない（週の始まりは `week-start` 属性で受ける。docs/baseline.md）。
 */

/** `YYYY-MM-DD`。実在する日かどうかは `parseIsoDate` が確かめる */
export type IsoDate = string

/** `month` は 1–12（`Date` の 0 始まりではない） */
export type YearMonth = { readonly year: number; readonly month: number }

const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/u

const WEEK_LENGTH = 7

const WEEKS_SHOWN = 6

const MONTHS_IN_YEAR = 12

/** 曜日の並びを作るための基準週。2026-01-04 は日曜 */
const WEEK_BASE = { year: 2026, month: 1, sunday: 4 } as const

const pad = (value: number, width: number): string => String(value).padStart(width, '0')

/** `month` は 1–12。`day` が 0 や月の日数を超えていても `Date` が繰り上げ／繰り下げる */
const utc = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month - 1, day))

export const formatIsoDate = (date: Date): IsoDate =>
  `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}`

export const monthOf = (iso: IsoDate): YearMonth => ({
  year: Number(iso.slice(0, 4)),
  month: Number(iso.slice(5, 7)),
})

const dayOf = (iso: IsoDate): number => Number(iso.slice(8, 10))

const dateOf = (iso: IsoDate): Date => utc(monthOf(iso).year, monthOf(iso).month, dayOf(iso))

/**
 * 形が合い、`Date.UTC` の往復で同じ文字列に戻るものだけを通す。
 * `2026-02-30` は `2026-03-02` に繰り上がるので `undefined`。
 */
export const parseIsoDate = (value: string | null | undefined): IsoDate | undefined => {
  const text = value ?? ''
  const round = ISO_PATTERN.test(text) ? formatIsoDate(dateOf(text)) : ''
  return text !== '' && round === text ? text : undefined
}

export const addMonths = (ym: YearMonth, delta: number): YearMonth => {
  const total = ym.year * MONTHS_IN_YEAR + (ym.month - 1) + delta
  return {
    year: Math.floor(total / MONTHS_IN_YEAR),
    month: (((total % MONTHS_IN_YEAR) + MONTHS_IN_YEAR) % MONTHS_IN_YEAR) + 1,
  }
}

/** 「次の月の 0 日目」＝ その月の末日 */
export const daysInMonth = (ym: YearMonth): number => utc(ym.year, ym.month + 1, 0).getUTCDate()

export const isoOf = (ym: YearMonth, day: number): IsoDate =>
  formatIsoDate(utc(ym.year, ym.month, day))

/** 表示月を移した先の同じ日。移した先に無ければ末日（2026-01-31 → 2026-02-28） */
export const sameDayIn = (iso: IsoDate, ym: YearMonth): IsoDate =>
  isoOf(ym, Math.min(dayOf(iso), daysInMonth(ym)))

export const addDays = (iso: IsoDate, delta: number): IsoDate =>
  isoOf(monthOf(iso), dayOf(iso) + delta)

/** `'0'`（日曜）〜 `'6'`。それ以外は 0 に倒す */
export const parseWeekStart = (value: string | null | undefined): number =>
  /^[0-6]$/u.test(value ?? '') ? Number(value) : 0

/** `IsoDate` は固定長なので、範囲の比較は文字列のままで正しい */
export const inRange = (
  iso: IsoDate,
  min: IsoDate | undefined,
  max: IsoDate | undefined,
): boolean => (min === undefined || iso >= min) && (max === undefined || iso <= max)

export const clampToRange = (
  iso: IsoDate,
  min: IsoDate | undefined,
  max: IsoDate | undefined,
): IsoDate => (min !== undefined && iso < min ? min : max !== undefined && iso > max ? max : iso)

/** 選べる日だけを返す。範囲の外と未指定は `undefined`（部品はこれを見て値を書く） */
export const selectable = (
  iso: IsoDate | undefined,
  min: IsoDate | undefined,
  max: IsoDate | undefined,
): IsoDate | undefined => (iso !== undefined && inRange(iso, min, max) ? iso : undefined)

/** `undefined` は月の外（空欄） */
export type Cell = { readonly iso: IsoDate; readonly day: number } | undefined

/** 常に 6 週 × 7 日。先頭の列は `weekStart` の曜日 */
export const monthGrid = (ym: YearMonth, weekStart: number): readonly (readonly Cell[])[] => {
  const offset = (utc(ym.year, ym.month, 1).getUTCDay() - weekStart + WEEK_LENGTH) % WEEK_LENGTH
  const total = daysInMonth(ym)
  return Array.from({ length: WEEKS_SHOWN }, (_row, week) =>
    Array.from({ length: WEEK_LENGTH }, (_cell, column): Cell => {
      const day = week * WEEK_LENGTH + column - offset + 1
      return day >= 1 && day <= total ? { iso: isoOf(ym, day), day } : undefined
    }),
  )
}

/**
 * APG「Date Picker Dialog」の Grid のキー表。扱わないキーは `undefined`。
 * **`min` / `max` は見ない**——範囲の外へフォーカスは動けるが選べない（`aria-disabled`）。
 * 月をまたいだ結果もそのまま返す（表示月を切り替えるかは呼び側が `monthOf` で決める）。
 */
export const moveDate = (
  iso: IsoDate,
  key: string,
  shift: boolean,
  weekStart: number,
): IsoDate | undefined => {
  const column = (dateOf(iso).getUTCDay() - weekStart + WEEK_LENGTH) % WEEK_LENGTH
  const months = shift ? MONTHS_IN_YEAR : 1
  switch (key) {
    case 'ArrowLeft':
      return addDays(iso, -1)
    case 'ArrowRight':
      return addDays(iso, 1)
    case 'ArrowUp':
      return addDays(iso, -WEEK_LENGTH)
    case 'ArrowDown':
      return addDays(iso, WEEK_LENGTH)
    case 'Home':
      return addDays(iso, -column)
    case 'End':
      return addDays(iso, WEEK_LENGTH - 1 - column)
    case 'PageUp':
      return sameDayIn(iso, addMonths(monthOf(iso), -months))
    case 'PageDown':
      return sameDayIn(iso, addMonths(monthOf(iso), months))
    default:
      return undefined
  }
}

export type CalendarView = {
  readonly month: YearMonth
  readonly rows: readonly (readonly Cell[])[]
  readonly focused: IsoDate
  readonly selected: IsoDate | undefined
  readonly today: IsoDate
  /** 選べる範囲（`<input min max>` そのまま）。升目ごとの `aria-disabled` はここから決まる */
  readonly min: IsoDate | undefined
  readonly max: IsoDate | undefined
  readonly states: ReadonlySet<string>
}

export type CalendarViewInput = {
  readonly month: YearMonth
  readonly focused: IsoDate
  readonly selected: IsoDate | undefined
  readonly today: IsoDate
  readonly weekStart: number
  readonly min: IsoDate | undefined
  readonly max: IsoDate | undefined
  readonly malformed: boolean
}

/** 前の月がまるごと `min` より前／次の月がまるごと `max` より後なら、その向きへは進めない */
const navStates = (input: CalendarViewInput): readonly string[] => {
  const previous = addMonths(input.month, -1)
  const next = addMonths(input.month, 1)
  const atMin = input.min !== undefined && isoOf(previous, daysInMonth(previous)) < input.min
  const atMax = input.max !== undefined && isoOf(next, 1) > input.max
  return [...(atMin ? ['at-min'] : []), ...(atMax ? ['at-max'] : [])]
}

export const computeView = (input: CalendarViewInput): CalendarView => ({
  month: input.month,
  rows: monthGrid(input.month, input.weekStart),
  focused: input.focused,
  selected: input.selected,
  today: input.today,
  min: input.min,
  max: input.max,
  states: input.malformed
    ? new Set(['malformed'])
    : new Set([input.selected === undefined ? 'empty' : 'selected', ...navStates(input)]),
})

/** 月名・曜日名・日の読みは `Intl` に任せる。**必ず UTC**（ローカル時刻で日がずれない） */
const formatterOf = (locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' })

export const monthTitle = (ym: YearMonth, locale: string): string =>
  formatterOf(locale, { year: 'numeric', month: 'long' }).format(utc(ym.year, ym.month, 1))

export type WeekdayName = { readonly short: string; readonly long: string }

/** `weekStart` から 7 つ。`short` は列見出しの文字、`long` は `<th abbr>` の読み */
export const weekdayNames = (weekStart: number, locale: string): readonly WeekdayName[] => {
  const short = formatterOf(locale, { weekday: 'short' })
  const long = formatterOf(locale, { weekday: 'long' })
  return Array.from({ length: WEEK_LENGTH }, (_name, index) => {
    const date = utc(
      WEEK_BASE.year,
      WEEK_BASE.month,
      WEEK_BASE.sunday + ((weekStart + index) % WEEK_LENGTH),
    )
    return { short: short.format(date), long: long.format(date) }
  })
}

/** gridcell の `aria-label`。表示は日の数字だけなので、読みはここが持つ */
export const cellLabel = (iso: IsoDate, locale: string): string =>
  formatterOf(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(dateOf(iso))

export type NavCopy = { readonly prev: string; readonly next: string }

export const navCopy = (japanese: boolean): NavCopy =>
  japanese ? { prev: '前の月', next: '次の月' } : { prev: 'Previous month', next: 'Next month' }

/**
 * 押されたキー・クリックから「何をするか」だけを決める（DOM を触らない）。
 * `*.element.ts` を薄く保つための表——分岐はここに集める（`command.logic.ts` の `decideKey` と同じ形）。
 */
export type CalendarAction =
  | { readonly kind: 'none' }
  | { readonly kind: 'select'; readonly iso: IsoDate }
  /** `focus` は「描き直したあとに升目へフォーカスを戻すか」（キー操作だけ true） */
  | { readonly kind: 'move'; readonly iso: IsoDate; readonly focus: boolean }

const NONE: CalendarAction = { kind: 'none' }

export type KeyInput = {
  /** キーを受けた升目の日。`<input>` や枠の上で押されたなら `undefined`（何もしない） */
  readonly cell: IsoDate | undefined
  readonly focused: IsoDate
  readonly key: string
  readonly shift: boolean
  readonly weekStart: number
}

export const decideKey = (input: KeyInput): CalendarAction => {
  const commits = input.key === 'Enter' || input.key === ' '
  const next = moveDate(input.focused, input.key, input.shift, input.weekStart)
  if (input.cell === undefined) {
    return NONE
  }
  if (commits) {
    return { kind: 'select', iso: input.focused }
  }
  return next === undefined ? NONE : { kind: 'move', iso: next, focus: true }
}

export type ClickInput = {
  readonly cell: IsoDate | undefined
  /** 前の月なら -1、次の月なら 1。どちらでもなければ `undefined` */
  readonly nav: number | undefined
  readonly month: YearMonth
  readonly focused: IsoDate
  readonly states: ReadonlySet<string>
}

/**
 * 升目を押したら選ぶ。前後の月ボタンを押したら表示月を送る（同じ日が無ければ末日に寄せる）。
 * 行き止まり（`at-min` / `at-max`）の向きへは動かさない——ボタンは `aria-disabled` で見えている。
 */
export const decideClick = (input: ClickInput): CalendarAction => {
  const blocked = input.states.has((input.nav ?? 0) < 0 ? 'at-min' : 'at-max')
  if (input.cell !== undefined) {
    return { kind: 'select', iso: input.cell }
  }
  if (input.nav === undefined || blocked) {
    return NONE
  }
  const month = addMonths(input.month, input.nav)
  return { kind: 'move', iso: sameDayIn(input.focused, month), focus: false }
}
