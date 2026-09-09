import { virtual } from '@guidepup/virtual-screen-reader'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf } from '../../test/fixture.js'
import { markup } from './calendar.contract.js'
// rd-calendar を登録するための副作用 import
// oxlint-disable-next-line import/no-unassigned-import
import './calendar.define.js'
import { RdCalendar } from './calendar.element.js'

const FIXTURE = markup({
  id: 'due',
  label: '期限',
  name: 'due',
  today: '2026-09-09',
  defaultValue: '2026-09-15',
})

/** 3 週目の 15 日まで読み切るのに要る歩数（升目 1 つにつき「入る・数字・出る」の 3 歩） */
const STEPS = 80

/** 読み上げに現れた語をぜんぶ集める（仮想 SR の移動は逐次なので再帰で書く） */
const spokenAll = async (
  steps: number,
  seen: readonly string[] = [],
): Promise<readonly string[]> => {
  const spoken = [...seen, await virtual.lastSpokenPhrase()]
  if (steps <= 1) {
    return spoken
  }
  await virtual.next()
  return spokenAll(steps - 1, spoken)
}

const readAll = async (el: RdCalendar): Promise<readonly string[]> => {
  await virtual.start({ container: el })
  return spokenAll(STEPS)
}

/** 最初に見つかった位置（無ければ -1）。読み上げの順番を比べるのに使う */
const at = (spoken: readonly string[], text: string): number =>
  spoken.findIndex((phrase) => phrase.includes(text))

beforeAll(() => {
  document.documentElement.lang = 'ja'
})

afterEach(async () => {
  await virtual.stop()
  cleanupFixtures()
})

it('入力欄 → 前の月 → 名前の付いた grid → 選ばれている日 の順に読まれる', async () => {
  const el = await fixtureOf(RdCalendar, FIXTURE)
  const spoken = await readAll(el)
  const control = at(spoken, '期限, 2026-09-15')
  const prev = at(spoken, 'button, 前の月')
  const grid = at(spoken, 'grid, 期限')
  const day = at(spoken, 'gridcell, 2026年9月15日火曜日')
  expect(control).toBeGreaterThanOrEqual(0)
  expect(prev).toBeGreaterThan(control)
  expect(grid).toBeGreaterThan(prev)
  expect(day).toBeGreaterThan(grid)
})

it('選ばれている日と今日は、日付の読みに状態を添えて読まれる', async () => {
  const el = await fixtureOf(RdCalendar, FIXTURE)
  const spoken = await readAll(el)
  expect(spoken).toContain('gridcell, 2026年9月15日火曜日, selected')
  expect(spoken).toContain('gridcell, 2026年9月9日水曜日, current date')
})

it('月の外の空欄は読み上げに現れない（1 週目は 1 日から 5 日までの 5 マス）', async () => {
  const el = await fixtureOf(RdCalendar, FIXTURE)
  const spoken = await readAll(el)
  const firstWeek = spoken.find((phrase) => phrase.startsWith('row, 2026年9月1日')) ?? ''
  expect(firstWeek).toBe(
    'row, 2026年9月1日火曜日 2026年9月2日水曜日 2026年9月3日木曜日 2026年9月4日金曜日 2026年9月5日土曜日',
  )
})

/** `picker`（plan 034）。月表は `[popover]` の中なので、開くまで読み上げに現れない */
const PICKER = markup({
  id: 'due',
  label: '期限',
  name: 'due',
  today: '2026-09-09',
  defaultValue: '2026-09-15',
  picker: true,
})

const openPicker = async (el: RdCalendar): Promise<void> => {
  el.querySelector<HTMLElement>('[part="toggle"]')?.click()
  await vi.waitFor(() => {
    expect(el.matches(':state(open)')).toBe(true)
  })
  await el.updateComplete
}

it('picker の開くボタンは「暦を開く」という名前の button として読まれる', async () => {
  const el = await fixtureOf(RdCalendar, PICKER)
  await virtual.start({ container: el })
  const spoken = await spokenAll(12)
  expect(at(spoken, 'button, 暦を開く')).toBeGreaterThanOrEqual(0)
})

it('lang が日本語でなければ開くボタンの名前は Open calendar', async () => {
  const el = await fixtureOf(
    RdCalendar,
    '<rd-calendar lang="en-US" picker today="2026-09-09"><label for="due">Due</label>'
      + '<input id="due" name="due" type="date" value="2026-09-15"></rd-calendar>',
  )
  await virtual.start({ container: el })
  const spoken = await spokenAll(12)
  expect(at(spoken, 'button, Open calendar')).toBeGreaterThanOrEqual(0)
})

it('開いた月表は <label> の名前を借りた dialog の中に入る', async () => {
  const el = await fixtureOf(RdCalendar, PICKER)
  await openPicker(el)
  const spoken = await readAll(el)
  const dialog = at(spoken, 'dialog, 期限')
  const grid = at(spoken, 'grid, 期限')
  expect(dialog).toBeGreaterThanOrEqual(0)
  expect(grid).toBeGreaterThan(dialog)
})
