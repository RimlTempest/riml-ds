import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { markup } from './popover.contract.js'
// rd-popover を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './popover.define.js'
import { RdPopover } from './popover.element.js'
import { hoverTimings } from './popover.logic.js'

const FIXTURE = markup({
  id: 'filters',
  label: '絞り込み',
  children: '<p>条件を選ぶ。</p><button type="button" id="apply">適用</button>',
})

const triggerOf = (el: RdPopover): HTMLElement | undefined => {
  const button = el.querySelector('[slot=trigger] button')
  return button instanceof HTMLElement ? button : undefined
}

const panelOf = (el: RdPopover): HTMLElement | undefined => {
  const panel = el.querySelector('[popover]')
  return panel instanceof HTMLElement ? panel : undefined
}

const HOVER_FIXTURE = markup({
  id: 'profile',
  label: 'riml',
  children: '<p>デザインシステムを作っている。</p><a href="#profile">くわしく</a>',
  hover: true,
})

/** ポインタが乗る / 離れる。`pointerenter` / `pointerleave` は伝播しないので直接投げる */
const point = (el: HTMLElement | undefined, type: 'pointerenter' | 'pointerleave'): void => {
  el?.dispatchEvent(new PointerEvent(type))
}

const waitOpen = async (el: RdPopover, open: boolean): Promise<void> => {
  await vi.waitFor(
    () => {
      expect(el.matches(':state(open)')).toBe(open)
    },
    { timeout: hoverTimings.open + 500 },
  )
  await el.updateComplete
}

/** 「開かない」ことを見る唯一の待ち方。開く待ち時間を十分に過ぎるまで置く */
const settle = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, hoverTimings.open + 150))
}

const open = async (el: RdPopover): Promise<void> => {
  triggerOf(el)?.click()
  await vi.waitFor(() => {
    expect(el.matches(':state(open)')).toBe(true)
  })
  await el.updateComplete
}

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/popover/popover.css')
})

afterEach(() => {
  cleanupFixtures()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(el.matches(':state(unlabeled)')).toBe(false)
})

it('[popover] は非モーダルの dialog で、見出しが名前になる', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  const panel = panelOf(el)
  expect(panel?.getAttribute('role')).toBe('dialog')
  const heading = el.querySelector('[slot=label]')
  expect(heading?.id).not.toBe('')
  expect(panel?.getAttribute('aria-labelledby')).toBe(heading?.id)
})

it('トリガーは aria-haspopup="dialog" と aria-expanded を持つ', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  expect(triggerOf(el)?.getAttribute('aria-haspopup')).toBe('dialog')
  expect(triggerOf(el)?.getAttribute('aria-expanded')).toBe('false')
  await open(el)
  expect(triggerOf(el)?.getAttribute('aria-expanded')).toBe('true')
})

it('開くと最初のフォーカス可能な要素へ移る', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  await open(el)
  expect(panelOf(el)?.matches(':popover-open')).toBe(true)
  expect(document.activeElement).toBe(el.querySelector('#apply'))
})

it('押せるものが無ければ [popover] 自身へフォーカスする', async () => {
  const el = await fixtureOf(
    RdPopover,
    markup({ id: 'note', label: '注意', children: '<p>読むだけ。</p>' }),
  )
  await open(el)
  expect(document.activeElement).toBe(panelOf(el))
})

it('閉じるとトリガーへフォーカスが戻る', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  await open(el)
  panelOf(el)?.hidePopover()
  await vi.waitFor(() => {
    expect(el.matches(':state(open)')).toBe(false)
  })
  expect(document.activeElement).toBe(triggerOf(el))
})

it('開閉のたびに rd-toggle が出る', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-toggle', listener)
  await open(el)
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { open: true } }))
  panelOf(el)?.hidePopover()
  await vi.waitFor(() => {
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { open: false } }))
  })
})

it('見出しが無いと unlabeled と console.error', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdPopover,
    '<rd-popover><rd-button slot="trigger"><button type="button" popovertarget="p">開く</button>'
      + '</rd-button><div popover id="p"><p>本文</p></div></rd-popover>',
  )
  expect(el.matches(':state(unlabeled)')).toBe(true)
  expect(error).toHaveBeenCalled()
  error.mockRestore()
})

it('[popover] が無ければ malformed と console.error', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdPopover,
    '<rd-popover><rd-button slot="trigger"><button type="button">開く</button></rd-button></rd-popover>',
  )
  expect(el.matches(':state(malformed)')).toBe(true)
  expect(error).toHaveBeenCalled()
  error.mockRestore()
})

it('hover を付けるとポインタが乗って少ししてから開く', async () => {
  const el = await fixtureOf(RdPopover, HOVER_FIXTURE)
  expect(el.hover).toBe(true)
  point(triggerOf(el), 'pointerenter')
  // すぐには開かない（通り過ぎただけで開かせない）
  expect(el.matches(':state(open)')).toBe(false)
  await waitOpen(el, true)
  expect(panelOf(el)?.matches(':popover-open')).toBe(true)
})

it('hover で開いてもフォーカスはトリガー側に残る（読み中の人から奪わない）', async () => {
  const el = await fixtureOf(RdPopover, HOVER_FIXTURE)
  const before = document.activeElement
  point(triggerOf(el), 'pointerenter')
  await waitOpen(el, true)
  expect(document.activeElement).toBe(before)
  expect(document.activeElement).not.toBe(panelOf(el))
})

it('ポインタが外へ離れると少ししてから閉じる', async () => {
  const el = await fixtureOf(RdPopover, HOVER_FIXTURE)
  point(triggerOf(el), 'pointerenter')
  await waitOpen(el, true)
  triggerOf(el)?.dispatchEvent(new PointerEvent('pointerleave'))
  await waitOpen(el, false)
  expect(panelOf(el)?.matches(':popover-open')).toBe(false)
})

it('トリガーから面へ渡るあいだは閉じない（focusout の行き先が中身なら残す）', async () => {
  const el = await fixtureOf(RdPopover, HOVER_FIXTURE)
  point(triggerOf(el), 'pointerenter')
  await waitOpen(el, true)
  const link = el.querySelector('a[href]')
  triggerOf(el)?.dispatchEvent(new FocusEvent('focusout', { relatedTarget: link }))
  await settle()
  expect(el.matches(':state(open)')).toBe(true)
})

it('hover ではトリガーにフォーカスが入ると待たずに開く', async () => {
  const el = await fixtureOf(RdPopover, HOVER_FIXTURE)
  triggerOf(el)?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
  await vi.waitFor(() => {
    expect(el.matches(':state(open)')).toBe(true)
  })
})

it('hover が無ければポインタが乗っても開かない（既存の挙動を変えない）', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  expect(el.hover).toBe(false)
  point(triggerOf(el), 'pointerenter')
  await settle()
  expect(el.matches(':state(open)')).toBe(false)
})

it('hover を付けても押して開く経路は残り、開いた先へフォーカスが移る', async () => {
  const el = await fixtureOf(RdPopover, HOVER_FIXTURE)
  await open(el)
  expect(panelOf(el)?.matches(':popover-open')).toBe(true)
  expect(document.activeElement).toBe(el.querySelector('a[href]'))
})
