import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { markup } from './splitter.contract.js'
// rd-splitter を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './splitter.define.js'
import { RdSplitter } from './splitter.element.js'

const FIXTURE = markup({
  label: 'サイドバーの幅',
  start: '<p>一覧</p>',
  end: '<p>本文</p>',
})

/** ドラッグの % は host の矩形から出るので、面積を持たせてから測る */
const sized = async (html: string): Promise<RdSplitter> => {
  const el = await fixtureOf(RdSplitter, html)
  el.style.setProperty('inline-size', '400px')
  el.style.setProperty('block-size', '200px')
  await el.updateComplete
  return el
}

const handleOf = (el: RdSplitter): HTMLElement => {
  const handle = el.shadowRoot?.querySelector('[part=handle]')
  if (!(handle instanceof HTMLElement)) {
    throw new Error('[part=handle] が無い')
  }
  return handle
}

/** 割合（0–1）をポインタの座標に直す。縦並びは clientY を使う */
const pointerAt = (el: RdSplitter, ratio: number): { clientX: number; clientY: number } => {
  const rect = el.getBoundingClientRect()
  return {
    clientX: rect.left + rect.width * ratio,
    clientY: rect.top + rect.height * ratio,
  }
}

const pointer = (handle: HTMLElement, type: string, init: PointerEventInit = {}): void => {
  handle.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, ...init }),
  )
}

const key = (handle: HTMLElement, init: KeyboardEventInit): void => {
  handle.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }))
}

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/splitter/splitter.css')
})

afterEach(() => {
  cleanupFixtures()
})

it('契約どおりの子とラベルがあれば malformed にならない', async () => {
  const el = await fixtureOf(RdSplitter, FIXTURE)
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(el.position).toBe(50)
  expect(el.style.getPropertyValue('--rd-splitter-position')).toBe('50%')
})

it('slot が欠けているか label が空なら malformed になる', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const el = await fixtureOf(RdSplitter, '<rd-splitter><div slot="start">一覧</div></rd-splitter>')
  expect(el.matches(':state(malformed)')).toBe(true)
  expect(error).toHaveBeenCalled()
  error.mockRestore()
})

it('つまみは separator で、aria-orientation は面の並びと逆になる', async () => {
  const el = await fixtureOf(RdSplitter, FIXTURE)
  const handle = handleOf(el)
  expect(handle.getAttribute('role')).toBe('separator')
  expect(handle.getAttribute('tabindex')).toBe('0')
  expect(handle.getAttribute('aria-label')).toBe('サイドバーの幅')
  expect(handle.getAttribute('aria-orientation')).toBe('vertical')
  expect(handle.getAttribute('aria-valuenow')).toBe('50')
  expect(handle.getAttribute('aria-valuemin')).toBe('20')
  expect(handle.getAttribute('aria-valuemax')).toBe('80')
})

it('direction="vertical" で aria-orientation が horizontal になり :state(vertical) が付く', async () => {
  const el = await fixtureOf(
    RdSplitter,
    markup({ label: '高さ', start: 'a', end: 'b', direction: 'vertical' }),
  )
  expect(handleOf(el).getAttribute('aria-orientation')).toBe('horizontal')
  expect(el.matches(':state(vertical)')).toBe(true)
})

it('pointerdown → pointermove で position と --rd-splitter-position が変わり rd-resize が出る', async () => {
  const el = await sized(FIXTURE)
  const resize = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-resize', resize)
  const handle = handleOf(el)
  pointer(handle, 'pointerdown')
  await el.updateComplete
  expect(el.matches(':state(dragging)')).toBe(true)
  pointer(handle, 'pointermove', pointerAt(el, 0.3))
  await el.updateComplete
  expect(el.position).toBe(30)
  expect(el.style.getPropertyValue('--rd-splitter-position')).toBe('30%')
  expect(handleOf(el).getAttribute('aria-valuenow')).toBe('30')
  expect(resize).toHaveBeenCalledWith(expect.objectContaining({ detail: { position: 30 } }))
  pointer(handle, 'pointerup')
  await el.updateComplete
  expect(el.matches(':state(dragging)')).toBe(false)
})

it('ドラッグしていないあいだの pointermove は無視する', async () => {
  const el = await sized(FIXTURE)
  const resize = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-resize', resize)
  pointer(handleOf(el), 'pointermove', pointerAt(el, 0.3))
  await el.updateComplete
  expect(el.position).toBe(50)
  expect(resize).not.toHaveBeenCalled()
})

it('JS から position を書いても rd-resize は出ない（min..max には丸める）', async () => {
  const el = await sized(FIXTURE)
  const resize = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-resize', resize)
  el.position = 95
  await el.updateComplete
  await el.updateComplete
  expect(el.position).toBe(80)
  expect(el.style.getPropertyValue('--rd-splitter-position')).toBe('80%')
  expect(resize).not.toHaveBeenCalled()
})

it('矢印キーで 1%、Shift で 10% 動き、Home / End で端まで行く', async () => {
  const el = await sized(FIXTURE)
  const resize = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-resize', resize)
  const handle = handleOf(el)
  key(handle, { key: 'ArrowRight' })
  await el.updateComplete
  expect(el.position).toBe(51)
  key(handle, { key: 'ArrowRight', shiftKey: true })
  await el.updateComplete
  expect(el.position).toBe(61)
  key(handleOf(el), { key: 'End' })
  await el.updateComplete
  expect(el.position).toBe(80)
  key(handleOf(el), { key: 'Home' })
  await el.updateComplete
  expect(el.position).toBe(20)
  expect(resize).toHaveBeenCalledTimes(4)
})

it('扱わないキーは横取りしない（既定を止めない）', async () => {
  const el = await sized(FIXTURE)
  const handle = handleOf(el)
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
  handle.dispatchEvent(event)
  await el.updateComplete
  expect(event.defaultPrevented).toBe(false)
  expect(el.position).toBe(50)
})

it('RTL の横並びでは → で position が減る', async () => {
  const el = await sized(FIXTURE)
  el.dir = 'rtl'
  await el.updateComplete
  key(handleOf(el), { key: 'ArrowRight' })
  await el.updateComplete
  expect(el.position).toBe(49)
  pointer(handleOf(el), 'pointerdown')
  pointer(handleOf(el), 'pointermove', pointerAt(el, 0.3))
  await el.updateComplete
  expect(el.position).toBe(70)
})

it('つまみの当たり領域は 44px 以上ある（WCAG 2.5.5 AAA）', async () => {
  const el = await sized(FIXTURE)
  const target = globalThis.getComputedStyle(handleOf(el), '::before')
  expect(Number.parseFloat(target.width)).toBeGreaterThanOrEqual(44)
  expect(Number.parseFloat(target.height)).toBeGreaterThanOrEqual(44)
})

it('既定ではアニメーションが動いていない（prefers-reduced-motion 既定オフ）', async () => {
  const el = await sized(FIXTURE)
  expect(handleOf(el).getAnimations()).toHaveLength(0)
})
