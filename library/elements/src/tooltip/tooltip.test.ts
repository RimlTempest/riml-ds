import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdTooltip } from './tooltip.element.js'
// rd-tooltip を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './tooltip.define.js'

const FIXTURE =
  '<div><button id="save" type="button" title="保存（⌘S）">保存</button>'
  + '<rd-tooltip for="save">保存（⌘S）</rd-tooltip></div>'

const mount = async (html = FIXTURE): Promise<{ host: HTMLDivElement; tip: RdTooltip }> => {
  const host = await fixtureOf(HTMLDivElement, html)
  const tip = host.querySelector('rd-tooltip')
  if (!(tip instanceof RdTooltip)) {
    throw new Error('rd-tooltip が要る')
  }
  await tip.updateComplete
  return { host, tip }
}

const target = (host: HTMLElement): HTMLElement => {
  const button = host.querySelector('button')
  if (!(button instanceof HTMLElement)) {
    throw new Error('対象が要る')
  }
  return button
}

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
})

afterEach(() => {
  vi.useRealTimers()
  cleanupFixtures()
})

it('対象に aria-describedby を足す（既存があれば残す）', async () => {
  const { host, tip } = await mount()
  expect(target(host).getAttribute('aria-describedby')).toContain(tip.id)
})

it('既存の aria-describedby に追記する', async () => {
  const { host, tip } = await mount(
    '<div><p id="hint">補足</p><button id="save" type="button" title="保存" aria-describedby="hint">保存</button>'
      + '<rd-tooltip for="save">保存（⌘S）</rd-tooltip></div>',
  )
  expect(target(host).getAttribute('aria-describedby')).toBe(`hint ${tip.id}`)
})

it('フォーカスで開き、フォーカスが外れると閉じる（ホバーだけに頼らない）', async () => {
  const { host, tip } = await mount()
  target(host).dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
  await tip.updateComplete
  expect(tip.matches(':state(open)')).toBe(true)
  target(host).dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  await tip.updateComplete
  expect(tip.matches(':state(open)')).toBe(false)
})

it('ポインタは遅れてから開く（--rd-tooltip-delay）', async () => {
  vi.useFakeTimers()
  const { host, tip } = await mount()
  target(host).dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
  await tip.updateComplete
  expect(tip.matches(':state(open)')).toBe(false)
  vi.advanceTimersByTime(1000)
  await tip.updateComplete
  expect(tip.matches(':state(open)')).toBe(true)
})

it('吹き出し自身にポインタが乗っても閉じない（WCAG 1.4.13）', async () => {
  const { host, tip } = await mount()
  target(host).dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
  await tip.updateComplete
  target(host).dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
  tip.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
  await tip.updateComplete
  expect(tip.matches(':state(open)')).toBe(true)
})

it('Esc で閉じる（WCAG 1.4.13）', async () => {
  const { host, tip } = await mount()
  target(host).dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
  await tip.updateComplete
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await tip.updateComplete
  expect(tip.matches(':state(open)')).toBe(false)
})

it('shadow の箱は role="tooltip"', async () => {
  const { tip } = await mount()
  expect(tip.shadowRoot?.querySelector('[part=control]')?.getAttribute('role')).toBe('tooltip')
})

it('for の先が無ければ orphan と console.warn。開かない', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const { tip } = await mount('<div><rd-tooltip for="missing">説明</rd-tooltip></div>')
  expect(tip.matches(':state(orphan)')).toBe(true)
  expect(warn).toHaveBeenCalled()
  warn.mockRestore()
})

it('対象に title が無ければ console.warn（JS 無しの代替が消えるため）', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  await mount(
    '<div><button id="save" type="button">保存</button>'
      + '<rd-tooltip for="save">説明</rd-tooltip></div>',
  )
  expect(warn).toHaveBeenCalled()
  warn.mockRestore()
})

it('aria-live を持たない（読み上げは aria-describedby に任せる。ADR-0008 §6）', async () => {
  const { tip } = await mount()
  expect(tip.shadowRoot?.innerHTML).not.toContain('aria-live')
})
