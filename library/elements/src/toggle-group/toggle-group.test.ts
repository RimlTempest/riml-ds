import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdToggleGroup } from './toggle-group.element.js'
// rd-toggle-group を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './toggle-group.define.js'

const ITEM = (label: string, value: string, extra = ''): string =>
  `<button type="button" value="${value}" aria-pressed="false" ${extra}>${label}</button>`

const group = (
  hostAttrs = '',
  items = `${ITEM('太字', 'bold')}${ITEM('斜体', 'italic')}`,
): string =>
  `<rd-toggle-group ${hostAttrs}><fieldset><legend>書式</legend>`
  + `<div part="options">${items}</div></fieldset></rd-toggle-group>`

const buttons = (el: RdToggleGroup): readonly HTMLButtonElement[] =>
  [...el.querySelectorAll('button')].flatMap((node) =>
    node instanceof HTMLButtonElement ? [node] : [],
  )

const at = (el: RdToggleGroup, index: number): HTMLButtonElement => {
  const button = buttons(el)[index]
  if (button === undefined) {
    throw new Error(`${index} 番目の <button> が無い`)
  }
  return button
}

const press = (el: RdToggleGroup, index: number): string | null => {
  at(el, index).click()
  return at(el, index).getAttribute('aria-pressed')
}

const arrow = async (el: RdToggleGroup, index: number, key: string): Promise<KeyboardEvent> => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  at(el, index).dispatchEvent(event)
  await el.updateComplete
  return event
}

beforeAll(async () => {
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/toggle-group/toggle-group.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子なら malformed にならず、既定は outline / multiple / horizontal', async () => {
  const el = await fixtureOf(RdToggleGroup, group())
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(el.matches(':state(outline)')).toBe(true)
  expect(el.matches(':state(multiple)')).toBe(true)
  expect(el.matches(':state(horizontal)')).toBe(true)
})

it('契約の子が欠けると console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(RdToggleGroup, '<rd-toggle-group><span>書式</span></rd-toggle-group>')
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('mode / orientation / variant は :state() になる', async () => {
  const el = await fixtureOf(
    RdToggleGroup,
    group('mode="single" orientation="vertical" variant="ghost"'),
  )
  expect(el.matches(':state(single)')).toBe(true)
  expect(el.matches(':state(vertical)')).toBe(true)
  expect(el.matches(':state(ghost)')).toBe(true)
  expect(el.matches(':state(multiple)')).toBe(false)
})

it('multiple では 2 個とも押せる', async () => {
  const el = await fixtureOf(RdToggleGroup, group())
  expect(press(el, 0)).toBe('true')
  expect(press(el, 1)).toBe('true')
  await el.updateComplete
  expect(el.values).toEqual(['bold', 'italic'])
})

it('single で 2 個目を押すと 1 個目が false に戻る', async () => {
  const el = await fixtureOf(RdToggleGroup, group('mode="single"'))
  press(el, 0)
  press(el, 1)
  await el.updateComplete
  expect(at(el, 0).getAttribute('aria-pressed')).toBe('false')
  expect(at(el, 1).getAttribute('aria-pressed')).toBe('true')
  expect(el.values).toEqual(['italic'])
})

it('single で押されている項目を押すと解除される（0 個も許す）', async () => {
  const el = await fixtureOf(RdToggleGroup, group('mode="single"'))
  press(el, 0)
  press(el, 0)
  await el.updateComplete
  expect(el.values).toEqual([])
})

it('押すたびに rd-change を出す（detail.values は DOM 順）', async () => {
  const el = await fixtureOf(RdToggleGroup, group())
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-change', listener)
  press(el, 1)
  await el.updateComplete
  expect(listener).toHaveBeenCalledWith(
    expect.objectContaining({ detail: { values: ['italic'] }, bubbles: true, composed: true }),
  )
})

it('disabled な項目を押しても変わらず rd-change も出ない', async () => {
  const el = await fixtureOf(
    RdToggleGroup,
    group('', `${ITEM('太字', 'bold')}${ITEM('斜体', 'italic', 'disabled')}`),
  )
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-change', listener)
  at(el, 1).click()
  await el.updateComplete
  expect(listener).not.toHaveBeenCalled()
  expect(el.values).toEqual([])
})

it('tabindex は 1 個だけが辿れる（roving tabindex）', async () => {
  const el = await fixtureOf(RdToggleGroup, group())
  expect(at(el, 0).hasAttribute('tabindex')).toBe(false)
  expect(at(el, 1).getAttribute('tabindex')).toBe('-1')
  press(el, 1)
  await el.updateComplete
  expect(at(el, 0).getAttribute('tabindex')).toBe('-1')
  expect(at(el, 1).hasAttribute('tabindex')).toBe(false)
})

it('→ で次へ、End で末尾へフォーカスが動く（押さない）', async () => {
  const el = await fixtureOf(RdToggleGroup, group())
  at(el, 0).focus()
  const right = await arrow(el, 0, 'ArrowRight')
  expect(right.defaultPrevented).toBe(true)
  expect(document.activeElement).toBe(at(el, 1))
  expect(el.values).toEqual([])
  await arrow(el, 1, 'Home')
  expect(document.activeElement).toBe(at(el, 0))
  await arrow(el, 0, 'End')
  expect(document.activeElement).toBe(at(el, 1))
})

it('horizontal では ↓ を扱わない（ページのスクロールを奪わない）', async () => {
  const el = await fixtureOf(RdToggleGroup, group())
  at(el, 0).focus()
  const down = await arrow(el, 0, 'ArrowDown')
  expect(down.defaultPrevented).toBe(false)
  expect(document.activeElement).toBe(at(el, 0))
})

it('外から aria-pressed を書き換えると values が追随する', async () => {
  const el = await fixtureOf(RdToggleGroup, group())
  at(el, 1).setAttribute('aria-pressed', 'true')
  await expect.poll(() => el.values).toEqual(['italic'])
})

it('values setter は aria-pressed を書き換え、イベントは出さない', async () => {
  const el = await fixtureOf(RdToggleGroup, group())
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-change', listener)
  el.values = ['bold']
  await el.updateComplete
  expect(at(el, 0).getAttribute('aria-pressed')).toBe('true')
  expect(at(el, 1).getAttribute('aria-pressed')).toBe('false')
  expect(listener).not.toHaveBeenCalled()
})

it('single の values setter は先頭だけを採る', async () => {
  const el = await fixtureOf(RdToggleGroup, group('mode="single"'))
  el.values = ['italic', 'bold']
  await el.updateComplete
  expect(el.values).toEqual(['italic'])
})

it('項目は 44px のタップ標的になる', async () => {
  const el = await fixtureOf(RdToggleGroup, group())
  expect(at(el, 0).getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
})

it('prefers-reduced-motion: reduce ではアニメーションが無い', async () => {
  const el = await fixtureOf(RdToggleGroup, group())
  press(el, 0)
  await el.updateComplete
  expect(el.getAnimations({ subtree: true })).toEqual([])
})
