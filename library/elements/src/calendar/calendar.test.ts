import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { type CalendarMarkupProps, markup } from './calendar.contract.js'
import { RdCalendar } from './calendar.element.js'
// rd-calendar を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './calendar.define.js'

/** 「今日」は必ず固定する（時計を属性で受ける規則の element 版） */
const TODAY = '2026-09-09'

const calendar = (props: Partial<CalendarMarkupProps> = {}): string =>
  markup({ id: 'due', label: '期限', name: 'due', today: TODAY, ...props })

const controlOf = (el: RdCalendar): HTMLInputElement | null => el.querySelector('input')

const cellOf = (el: RdCalendar, iso: string): HTMLElement | null =>
  el.querySelector(`[data-iso="${iso}"]`)

const titleOf = (el: RdCalendar): string =>
  el.querySelector('[part="title"]')?.textContent?.trim() ?? ''

const focusable = (el: RdCalendar): readonly Element[] => [
  ...el.querySelectorAll('[data-iso][tabindex="0"]'),
]

const toggleOf = (el: RdCalendar): HTMLElement | null =>
  el.querySelector<HTMLElement>('[part="toggle"]')

const popoverOf = (el: RdCalendar): HTMLElement | null =>
  el.querySelector<HTMLElement>('[part="popover"]')

/** `popovertarget` の click は UA が開く。`toggle` は task で飛ぶので状態が追いつくまで待つ */
const openPicker = async (el: RdCalendar): Promise<void> => {
  toggleOf(el)?.click()
  await vi.waitFor(() => {
    expect(el.matches(':state(open)')).toBe(true)
  })
  await el.updateComplete
}

const press = (target: Element | null, key: string, shiftKey = false): void => {
  target?.dispatchEvent(
    new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
  )
}

const typeInto = (control: HTMLInputElement | null, value: string): void => {
  if (control !== null) {
    control.value = value
    control.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

beforeAll(async () => {
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/calendar/calendar.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子（<label> と <input type="date">）なら malformed にならない', async () => {
  const el = await fixtureOf(RdCalendar, calendar())
  expect(el.matches(':state(malformed)')).toBe(false)
})

it('<input type="date"> が無いと console.error して malformed になり、月表を描かない', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdCalendar,
    '<rd-calendar today="2026-09-09"><label for="due">期限</label></rd-calendar>',
  )
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
  expect(el.querySelector('[part="grid"]')).toBeNull()
})

it('ティア A なので shadowRoot を持たない', async () => {
  const el = await fixtureOf(RdCalendar, calendar())
  expect(el.shadowRoot).toBeNull()
})

it('月表は <input> の後ろに描かれ、<label> の id を aria-labelledby で指す', async () => {
  const el = await fixtureOf(RdCalendar, calendar())
  const control = controlOf(el)
  const grid = el.querySelector('[part="grid"]')
  expect(grid).toBeInstanceOf(HTMLTableElement)
  const position = control?.compareDocumentPosition(grid ?? el) ?? 0
  expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  const labelId = el.querySelector('label')?.id
  expect(labelId).toBe('due-label')
  expect(grid?.getAttribute('aria-labelledby')).toBe(labelId)
})

it('値が無ければ「今日」に、あればその日に tabindex="0" が 1 個だけ付く', async () => {
  const empty = await fixtureOf(RdCalendar, calendar())
  expect(focusable(empty)).toEqual([cellOf(empty, TODAY)])

  const filled = await fixtureOf(RdCalendar, calendar({ defaultValue: '2026-09-15' }))
  expect(focusable(filled)).toEqual([cellOf(filled, '2026-09-15')])
  expect(cellOf(filled, '2026-09-15')?.getAttribute('aria-selected')).toBe('true')
})

it('→ で翌日、↓ で翌週へ焦点が動く', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ defaultValue: '2026-09-15' }))
  press(cellOf(el, '2026-09-15'), 'ArrowRight')
  await el.updateComplete
  expect(focusable(el)).toEqual([cellOf(el, '2026-09-16')])
  press(cellOf(el, '2026-09-16'), 'ArrowDown')
  await el.updateComplete
  expect(focusable(el)).toEqual([cellOf(el, '2026-09-23')])
})

it('PageDown で表示月が翌月になり、フォーカスは新しい日に残る', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ defaultValue: '2026-09-15' }))
  const start = cellOf(el, '2026-09-15')
  start?.focus()
  press(start, 'PageDown')
  await el.updateComplete
  expect(titleOf(el)).toBe('2026年10月')
  expect(document.activeElement).toBe(cellOf(el, '2026-10-15'))
})

it('Shift+PageUp で 1 年前へ移る', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ defaultValue: '2026-09-15' }))
  press(cellOf(el, '2026-09-15'), 'PageUp', true)
  await el.updateComplete
  expect(titleOf(el)).toBe('2025年9月')
})

it('Enter で <input> の値が変わり、同じ ISO の rd-change が出る', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ defaultValue: '2026-09-15' }))
  const listener = vi.fn<() => void>()
  el.addEventListener('rd-change', listener)
  press(cellOf(el, '2026-09-15'), 'ArrowRight')
  await el.updateComplete
  press(cellOf(el, '2026-09-16'), 'Enter')
  await el.updateComplete
  expect(controlOf(el)?.value).toBe('2026-09-16')
  expect(listener).toHaveBeenCalledWith(
    expect.objectContaining({ detail: { value: '2026-09-16' } }),
  )
})

it('<input min max> の外の日は aria-disabled で、Enter しても値が変わらない', async () => {
  const el = await fixtureOf(
    RdCalendar,
    calendar({ defaultValue: '2026-09-25', min: '2026-09-05', max: '2026-09-25' }),
  )
  press(cellOf(el, '2026-09-25'), 'ArrowRight')
  await el.updateComplete
  const outside = cellOf(el, '2026-09-26')
  expect(outside?.getAttribute('aria-disabled')).toBe('true')
  press(outside, 'Enter')
  await el.updateComplete
  expect(controlOf(el)?.value).toBe('2026-09-25')
})

it('前の月がまるごと min より前なら at-min になり、前の月ボタンが aria-disabled になる', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ min: '2026-09-01' }))
  expect(el.matches(':state(at-min)')).toBe(true)
  const prev = el.querySelector('[part="prev"]')
  expect(prev?.getAttribute('aria-disabled')).toBe('true')
  prev?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await el.updateComplete
  expect(titleOf(el)).toBe('2026年9月')
})

it('次の月ボタンで表示月が進み、同じ日に焦点が残る', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ defaultValue: '2026-09-15' }))
  el.querySelector('[part="next"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await el.updateComplete
  expect(titleOf(el)).toBe('2026年10月')
  expect(focusable(el)).toEqual([cellOf(el, '2026-10-15')])
})

it('lang が日本語でなければ英語の文言になる', async () => {
  const el = await fixtureOf(
    RdCalendar,
    '<rd-calendar lang="en-US" today="2026-09-09"><label for="due">Due</label>'
      + '<input id="due" name="due" type="date"></rd-calendar>',
  )
  expect(el.querySelector('[part="prev"]')?.getAttribute('aria-label')).toBe('Previous month')
  expect(titleOf(el)).toBe('September 2026')
})

it('value setter で <input> と表示月が動き、イベントは出ない', async () => {
  const el = await fixtureOf(RdCalendar, calendar())
  const listener = vi.fn<() => void>()
  el.addEventListener('rd-change', listener)
  el.value = '2026-12-25'
  await el.updateComplete
  expect(el.value).toBe('2026-12-25')
  expect(titleOf(el)).toBe('2026年12月')
  expect(listener).not.toHaveBeenCalled()
})

it('<input> に打ち込むと（input イベント）選択と表示月が追随する', async () => {
  const el = await fixtureOf(RdCalendar, calendar())
  typeInto(controlOf(el), '2026-11-03')
  await el.updateComplete
  expect(titleOf(el)).toBe('2026年11月')
  expect(cellOf(el, '2026-11-03')?.getAttribute('aria-selected')).toBe('true')
})

it('<input> の上の矢印キーは月表を動かさない（ネイティブの入力に任せる）', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ defaultValue: '2026-09-15' }))
  press(controlOf(el), 'ArrowRight')
  await el.updateComplete
  expect(focusable(el)).toEqual([cellOf(el, '2026-09-15')])
})

it('required で空なら checkValidity() が false（検証はネイティブに委譲する）', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ required: true }))
  expect(el.checkValidity()).toBe(false)
  el.value = '2026-09-15'
  expect(el.checkValidity()).toBe(true)
})

it('日のタイルは 44px のタップ標的になる（WCAG 2.5.5 AAA）', async () => {
  const el = await fixtureOf(RdCalendar, calendar())
  const box = cellOf(el, TODAY)?.getBoundingClientRect()
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
})

it('既定ではアニメーションが動いていない（prefers-reduced-motion 既定オフ）', async () => {
  const el = await fixtureOf(RdCalendar, calendar())
  expect(el.getAnimations({ subtree: true })).toHaveLength(0)
})

/**
 * `picker`（plan 034）。月表を `[popover]` に入れ、`<input>` の右のボタン 1 つで開く。
 * 開くのは `popovertarget`（UA）、閉じるのも Escape / light dismiss は UA に任せる。
 */
it('picker が無ければ開くボタンも popover も描かない（月表は常設のまま）', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ defaultValue: '2026-09-15' }))
  expect(el.querySelectorAll('[part="toggle"]')).toHaveLength(0)
  expect(el.querySelectorAll('[part="popover"]')).toHaveLength(0)
  expect(el.querySelector('[part="grid"]')?.parentElement).toBe(el)
})

it('picker なら月表が [popover] の中に入り、閉じたまま描かれる', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ defaultValue: '2026-09-15', picker: true }))
  const toggle = toggleOf(el)
  const popover = popoverOf(el)
  expect(el.querySelectorAll('button[part="toggle"][popovertarget]')).toHaveLength(1)
  expect(el.querySelectorAll('[part="popover"][popover][role="dialog"]')).toHaveLength(1)
  expect(toggle?.getAttribute('popovertarget')).toBe(popover?.id)
  expect(el.querySelector('[part="grid"]')?.parentElement).toBe(popover)
  expect(el.querySelector('[part="header"]')?.parentElement).toBe(popover)
  expect(popover?.matches(':popover-open')).toBe(false)
  expect(toggle?.getAttribute('aria-expanded')).toBe('false')
  expect(el.matches(':state(open)')).toBe(false)
})

it('開くボタンを押すと popover が開き、焦点のある升目にフォーカスが移る', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ defaultValue: '2026-09-15', picker: true }))
  await openPicker(el)
  expect(popoverOf(el)?.matches(':popover-open')).toBe(true)
  expect(toggleOf(el)?.getAttribute('aria-expanded')).toBe('true')
  expect(document.activeElement).toBe(cellOf(el, '2026-09-15'))
  expect(focusable(el)).toEqual([cellOf(el, '2026-09-15')])
})

it('開いた月表で日を選ぶと <input> が変わり、popover が閉じる', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ defaultValue: '2026-09-15', picker: true }))
  const listener = vi.fn<() => void>()
  el.addEventListener('rd-change', listener)
  await openPicker(el)
  press(cellOf(el, '2026-09-15'), 'Enter')
  await vi.waitFor(() => {
    expect(el.matches(':state(open)')).toBe(false)
  })
  await el.updateComplete
  expect(controlOf(el)?.value).toBe('2026-09-15')
  expect(listener).toHaveBeenCalledOnce()
  expect(popoverOf(el)?.matches(':popover-open')).toBe(false)
  expect(toggleOf(el)?.getAttribute('aria-expanded')).toBe('false')
})

it('popover を直接閉じても aria-expanded と :state(open) が追随する（toggle を聞いている）', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ defaultValue: '2026-09-15', picker: true }))
  await openPicker(el)
  popoverOf(el)?.hidePopover()
  await vi.waitFor(() => {
    expect(el.matches(':state(open)')).toBe(false)
  })
  await el.updateComplete
  expect(toggleOf(el)?.getAttribute('aria-expanded')).toBe('false')
})

it('picker でも value setter で表示月が動く（popover の中の月表も追随する）', async () => {
  const el = await fixtureOf(RdCalendar, calendar({ picker: true }))
  el.value = '2026-12-25'
  await el.updateComplete
  expect(titleOf(el)).toBe('2026年12月')
  expect(popoverOf(el)?.querySelector('[data-iso="2026-12-25"]')).not.toBeNull()
})

it('picker でも契約の子が無ければ malformed で、開くボタンも popover も描かない', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdCalendar,
    '<rd-calendar picker today="2026-09-09"><label for="due">期限</label></rd-calendar>',
  )
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
  expect(el.querySelectorAll('[part="toggle"]')).toHaveLength(0)
  expect(el.querySelectorAll('[part="popover"]')).toHaveLength(0)
})
