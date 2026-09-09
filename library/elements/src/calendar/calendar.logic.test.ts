import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  cellLabel,
  clampToRange,
  computeView,
  daysInMonth,
  decideClick,
  decideKey,
  formatIsoDate,
  inRange,
  monthGrid,
  monthOf,
  monthTitle,
  moveDate,
  navCopy,
  parseIsoDate,
  parseWeekStart,
  sameDayIn,
  selectable,
  toggleCopy,
  weekdayNames,
} from './calendar.logic.js'

describe('parseIsoDate', () => {
  it('YYYY-MM-DD の実在する日だけを通す', () => {
    expect(parseIsoDate('2026-09-09')).toBe('2026-09-09')
    expect(parseIsoDate('2028-02-29')).toBe('2028-02-29')
  })

  it('実在しない日・形の違う文字列・空は undefined', () => {
    expect(parseIsoDate('2026-02-30')).toBeUndefined()
    expect(parseIsoDate('2026-13-01')).toBeUndefined()
    expect(parseIsoDate('2026-9-9')).toBeUndefined()
    expect(parseIsoDate('2026-09-09T00:00:00Z')).toBeUndefined()
    expect(parseIsoDate('')).toBeUndefined()
    expect(parseIsoDate(null)).toBeUndefined()
    expect(parseIsoDate(undefined)).toBeUndefined()
  })
})

describe('formatIsoDate', () => {
  it('UTC の年月日から作る（ローカル時刻を見ない）', () => {
    expect(formatIsoDate(new Date(Date.UTC(2026, 8, 9)))).toBe('2026-09-09')
    expect(formatIsoDate(new Date(Date.UTC(2026, 0, 1)))).toBe('2026-01-01')
  })
})

describe('monthOf / addMonths / daysInMonth / sameDayIn', () => {
  it('月を取り出す', () => {
    expect(monthOf('2026-09-15')).toEqual({ year: 2026, month: 9 })
  })

  it('年をまたいで足し引きできる', () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 })
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 })
    expect(addMonths({ year: 2026, month: 9 }, 12)).toEqual({ year: 2027, month: 9 })
  })

  it('月の日数（閏年を含む）', () => {
    expect(daysInMonth({ year: 2026, month: 9 })).toBe(30)
    expect(daysInMonth({ year: 2026, month: 2 })).toBe(28)
    expect(daysInMonth({ year: 2028, month: 2 })).toBe(29)
  })

  it('移した先に日が無ければ末日に寄せる（2026-01-31 → 2026-02-28）', () => {
    expect(sameDayIn('2026-01-31', { year: 2026, month: 2 })).toBe('2026-02-28')
    expect(sameDayIn('2026-01-31', { year: 2028, month: 2 })).toBe('2028-02-29')
    expect(sameDayIn('2026-09-15', { year: 2026, month: 10 })).toBe('2026-10-15')
  })
})

describe('addDays', () => {
  it('月と年をまたぐ', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('parseWeekStart', () => {
  it("'0'〜'6' だけを受け、それ以外は 0（日曜）", () => {
    expect(parseWeekStart('1')).toBe(1)
    expect(parseWeekStart('6')).toBe(6)
    expect(parseWeekStart('7')).toBe(0)
    expect(parseWeekStart('')).toBe(0)
    expect(parseWeekStart(' ')).toBe(0)
    expect(parseWeekStart(null)).toBe(0)
  })
})

describe('inRange / clampToRange / selectable', () => {
  it('min / max の内側かを見る（どちらも省略できる）', () => {
    expect(inRange('2026-09-09', '2026-09-05', '2026-09-25')).toBe(true)
    expect(inRange('2026-09-01', '2026-09-05', '2026-09-25')).toBe(false)
    expect(inRange('2026-09-26', '2026-09-05', '2026-09-25')).toBe(false)
    expect(inRange('1900-01-01', undefined, undefined)).toBe(true)
  })

  it('範囲の外は端に寄せる', () => {
    expect(clampToRange('2026-09-01', '2026-09-05', '2026-09-25')).toBe('2026-09-05')
    expect(clampToRange('2026-09-30', '2026-09-05', '2026-09-25')).toBe('2026-09-25')
    expect(clampToRange('2026-09-09', undefined, undefined)).toBe('2026-09-09')
  })

  it('選べる日だけを返す（範囲外と undefined は undefined）', () => {
    expect(selectable('2026-09-09', '2026-09-05', undefined)).toBe('2026-09-09')
    expect(selectable('2026-09-01', '2026-09-05', undefined)).toBeUndefined()
    expect(selectable(undefined, undefined, undefined)).toBeUndefined()
  })
})

describe('monthGrid', () => {
  it('常に 6 週 × 7 日を返す', () => {
    const rows = monthGrid({ year: 2026, month: 9 }, 0)
    expect(rows).toHaveLength(6)
    expect(rows.every((row) => row.length === 7)).toBe(true)
  })

  it('日曜始まりの 2026-09 は 1 日が 3 列目（火曜）に来る', () => {
    const rows = monthGrid({ year: 2026, month: 9 }, 0)
    expect(rows[0]?.[0]).toBeUndefined()
    expect(rows[0]?.[1]).toBeUndefined()
    expect(rows[0]?.[2]).toEqual({ iso: '2026-09-01', day: 1 })
    expect(rows[4]?.[2]).toEqual({ iso: '2026-09-29', day: 29 })
    // 月の外は空欄
    expect(rows[5]?.[0]).toBeUndefined()
  })

  it('月曜始まり（week-start="1"）では 1 日が 2 列目に来る', () => {
    const rows = monthGrid({ year: 2026, month: 9 }, 1)
    expect(rows[0]?.[0]).toBeUndefined()
    expect(rows[0]?.[1]).toEqual({ iso: '2026-09-01', day: 1 })
  })

  it('月の日はすべて 1 度だけ現れる', () => {
    const days = monthGrid({ year: 2026, month: 2 }, 0)
      .flat()
      .flatMap((cell) => (cell === undefined ? [] : [cell.iso]))
    expect(days).toHaveLength(28)
    expect(new Set(days).size).toBe(28)
  })
})

describe('moveDate', () => {
  it('← → は ±1 日、↑ ↓ は ±7 日（月をまたいでもそのまま返す）', () => {
    expect(moveDate('2026-09-09', 'ArrowLeft', false, 0)).toBe('2026-09-08')
    expect(moveDate('2026-09-09', 'ArrowRight', false, 0)).toBe('2026-09-10')
    expect(moveDate('2026-09-09', 'ArrowUp', false, 0)).toBe('2026-09-02')
    expect(moveDate('2026-09-09', 'ArrowDown', false, 0)).toBe('2026-09-16')
    expect(moveDate('2026-09-30', 'ArrowRight', false, 0)).toBe('2026-10-01')
    expect(moveDate('2026-09-01', 'ArrowLeft', false, 0)).toBe('2026-08-31')
  })

  it('Home / End は週の始め・終わり（weekStart 基準）', () => {
    // 2026-09-09 は水曜。日曜始まりなら 6 日、月曜始まりなら 7 日が週の始め
    expect(moveDate('2026-09-09', 'Home', false, 0)).toBe('2026-09-06')
    expect(moveDate('2026-09-09', 'End', false, 0)).toBe('2026-09-12')
    expect(moveDate('2026-09-09', 'Home', false, 1)).toBe('2026-09-07')
    expect(moveDate('2026-09-09', 'End', false, 1)).toBe('2026-09-13')
  })

  it('PageUp / PageDown は ±1 か月。日が無ければ末日に寄せる', () => {
    expect(moveDate('2026-09-15', 'PageUp', false, 0)).toBe('2026-08-15')
    expect(moveDate('2026-09-15', 'PageDown', false, 0)).toBe('2026-10-15')
    expect(moveDate('2026-01-31', 'PageDown', false, 0)).toBe('2026-02-28')
    expect(moveDate('2026-03-31', 'PageUp', false, 0)).toBe('2026-02-28')
  })

  it('Shift+PageUp / Shift+PageDown は ±1 年（閏日は末日に寄る）', () => {
    expect(moveDate('2026-09-09', 'PageUp', true, 0)).toBe('2025-09-09')
    expect(moveDate('2026-09-09', 'PageDown', true, 0)).toBe('2027-09-09')
    expect(moveDate('2028-02-29', 'PageDown', true, 0)).toBe('2029-02-28')
    expect(moveDate('2028-02-29', 'PageUp', true, 0)).toBe('2027-02-28')
  })

  it('扱わないキーは undefined（範囲は見ない——外へも動ける）', () => {
    expect(moveDate('2026-09-09', 'Enter', false, 0)).toBeUndefined()
    expect(moveDate('2026-09-09', 'a', false, 0)).toBeUndefined()
    expect(moveDate('2026-09-09', 'Tab', false, 0)).toBeUndefined()
  })
})

describe('computeView', () => {
  const base = {
    month: { year: 2026, month: 9 },
    focused: '2026-09-09',
    selected: undefined,
    today: '2026-09-09',
    weekStart: 0,
    min: undefined,
    max: undefined,
    malformed: false,
    picker: false,
    open: false,
  } as const

  it('契約が欠けていれば malformed だけを立てる', () => {
    const view = computeView({ ...base, selected: '2026-09-15', malformed: true })
    expect([...view.states]).toEqual(['malformed'])
  })

  it('選ばれていれば selected、いなければ empty', () => {
    expect([...computeView(base).states]).toEqual(['empty'])
    expect([...computeView({ ...base, selected: '2026-09-15' }).states]).toEqual(['selected'])
  })

  it('前の月がまるごと min より前なら at-min', () => {
    expect([...computeView({ ...base, min: '2026-09-01' }).states]).toEqual(['empty', 'at-min'])
    expect([...computeView({ ...base, min: '2026-08-31' }).states]).toEqual(['empty'])
  })

  it('次の月がまるごと max より後なら at-max', () => {
    expect([...computeView({ ...base, max: '2026-09-30' }).states]).toEqual(['empty', 'at-max'])
    expect([...computeView({ ...base, max: '2026-10-01' }).states]).toEqual(['empty'])
  })

  it('表示月の升目と、渡された焦点・今日をそのまま持つ', () => {
    const view = computeView({ ...base, selected: '2026-09-15' })
    expect(view.month).toEqual({ year: 2026, month: 9 })
    expect(view.rows).toHaveLength(6)
    expect(view.focused).toBe('2026-09-09')
    expect(view.selected).toBe('2026-09-15')
    expect(view.today).toBe('2026-09-09')
  })

  it('選べる範囲をそのまま持つ（升目ごとの aria-disabled を描く側が読む）', () => {
    const view = computeView({ ...base, min: '2026-09-05', max: '2026-09-25' })
    expect(view.min).toBe('2026-09-05')
    expect(view.max).toBe('2026-09-25')
  })

  it('picker で popover が開いていれば open を足す', () => {
    expect([...computeView({ ...base, picker: true, open: true }).states]).toEqual([
      'empty',
      'open',
    ])
  })

  it('picker でなければ open は立たない（月表が常設で popover が無い）', () => {
    expect([...computeView({ ...base, picker: false, open: true }).states]).toEqual(['empty'])
    expect([...computeView({ ...base, picker: true, open: false }).states]).toEqual(['empty'])
  })

  it('malformed なら open も立たない', () => {
    const view = computeView({ ...base, picker: true, open: true, malformed: true })
    expect([...view.states]).toEqual(['malformed'])
  })

  it('picker と open は描く側が読めるようにそのまま持つ', () => {
    const view = computeView({ ...base, picker: true, open: true })
    expect(view.picker).toBe(true)
    expect(view.open).toBe(true)
  })
})

describe('表示用の名前（すべて UTC）', () => {
  it('月の見出しはページの言語で書く', () => {
    expect(monthTitle({ year: 2026, month: 9 }, 'ja')).toBe('2026年9月')
    expect(monthTitle({ year: 2026, month: 9 }, 'en-US')).toBe('September 2026')
  })

  it('曜日は weekStart から 7 つ並ぶ', () => {
    const sunday = weekdayNames(0, 'ja')
    expect(sunday).toHaveLength(7)
    expect(sunday.map((name) => name.short)).toEqual(['日', '月', '火', '水', '木', '金', '土'])
    expect(sunday[0]?.long).toBe('日曜日')
    expect(weekdayNames(1, 'ja').map((name) => name.short)).toEqual([
      '月',
      '火',
      '水',
      '木',
      '金',
      '土',
      '日',
    ])
    expect(weekdayNames(0, 'en-US').map((name) => name.short)).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ])
  })

  it('日の読みは曜日まで含む', () => {
    expect(cellLabel('2026-09-15', 'ja')).toContain('2026年9月15日')
    expect(cellLabel('2026-09-15', 'ja')).toContain('火曜日')
    expect(cellLabel('2026-09-15', 'en-US')).toBe('Tuesday, September 15, 2026')
  })

  it('前後の月の文言は日本語と英語の 2 つ', () => {
    expect(navCopy(true)).toEqual({ prev: '前の月', next: '次の月' })
    expect(navCopy(false)).toEqual({ prev: 'Previous month', next: 'Next month' })
  })

  it('月表を開くボタンの文言も日本語と英語の 2 つ', () => {
    expect(toggleCopy(true)).toBe('暦を開く')
    expect(toggleCopy(false)).toBe('Open calendar')
  })
})

describe('decideKey', () => {
  const base = { cell: '2026-09-15', focused: '2026-09-15', shift: false, weekStart: 0 } as const

  it('升目の上でなければ何もしない（<input> の矢印はネイティブに任せる）', () => {
    expect(decideKey({ ...base, cell: undefined, key: 'ArrowRight' })).toEqual({ kind: 'none' })
  })

  it('Enter と Space は焦点のある日を選ぶ', () => {
    expect(decideKey({ ...base, key: 'Enter' })).toEqual({ kind: 'select', iso: '2026-09-15' })
    expect(decideKey({ ...base, key: ' ' })).toEqual({ kind: 'select', iso: '2026-09-15' })
  })

  it('矢印・PageDown は焦点を動かし、描き直したあとに升目へ戻す', () => {
    expect(decideKey({ ...base, key: 'ArrowRight' })).toEqual({
      kind: 'move',
      iso: '2026-09-16',
      focus: true,
    })
    expect(decideKey({ ...base, key: 'PageDown' })).toEqual({
      kind: 'move',
      iso: '2026-10-15',
      focus: true,
    })
  })

  it('扱わないキーは何もしない', () => {
    expect(decideKey({ ...base, key: 'a' })).toEqual({ kind: 'none' })
  })
})

describe('decideClick', () => {
  const base = {
    cell: undefined,
    nav: undefined,
    month: { year: 2026, month: 9 },
    focused: '2026-09-15',
    states: new Set<string>(),
  } as const

  it('升目を押したら選ぶ', () => {
    expect(decideClick({ ...base, cell: '2026-09-20' })).toEqual({
      kind: 'select',
      iso: '2026-09-20',
    })
  })

  it('前後の月ボタンを押したら表示月を送る（フォーカスは動かさない）', () => {
    expect(decideClick({ ...base, nav: 1 })).toEqual({
      kind: 'move',
      iso: '2026-10-15',
      focus: false,
    })
    expect(decideClick({ ...base, nav: -1 })).toEqual({
      kind: 'move',
      iso: '2026-08-15',
      focus: false,
    })
  })

  it('末日の無い月へ送るときは末日に寄せる', () => {
    expect(decideClick({ ...base, nav: -7, focused: '2026-09-30' })).toEqual({
      kind: 'move',
      iso: '2026-02-28',
      focus: false,
    })
  })

  it('行き止まりの向きへは動かさない', () => {
    expect(decideClick({ ...base, nav: -1, states: new Set(['at-min']) })).toEqual({ kind: 'none' })
    expect(decideClick({ ...base, nav: 1, states: new Set(['at-max']) })).toEqual({ kind: 'none' })
  })

  it('どちらでもなければ何もしない', () => {
    expect(decideClick(base)).toEqual({ kind: 'none' })
  })
})
