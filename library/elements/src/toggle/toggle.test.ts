import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdToggle } from './toggle.element.js'
// rd-toggle を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './toggle.define.js'

const toggle = (hostAttrs = '', buttonAttrs = 'aria-pressed="false"'): string =>
  `<rd-toggle ${hostAttrs}><button type="button" ${buttonAttrs}>一覧</button></rd-toggle>`

const control = (el: RdToggle): HTMLButtonElement => {
  const button = el.querySelector('button')
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('button が無い')
  }
  return button
}

beforeAll(async () => {
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/toggle/toggle.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子（<button>）なら malformed にならない', async () => {
  const el = await fixtureOf(RdToggle, toggle())
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(el.matches(':state(outline)')).toBe(true)
})

it('<button> が無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(RdToggle, '<rd-toggle><span>一覧</span></rd-toggle>')
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('押すと aria-pressed が反転し :state(pressed) が付く', async () => {
  const el = await fixtureOf(RdToggle, toggle())
  control(el).click()
  await el.updateComplete
  expect(control(el).getAttribute('aria-pressed')).toBe('true')
  expect(el.matches(':state(pressed)')).toBe(true)
  control(el).click()
  await el.updateComplete
  expect(control(el).getAttribute('aria-pressed')).toBe('false')
  expect(el.matches(':state(pressed)')).toBe(false)
})

it('押すたびに rd-toggle を出す（detail に押下後の状態）', async () => {
  const el = await fixtureOf(RdToggle, toggle())
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-toggle', listener)
  control(el).click()
  await el.updateComplete
  expect(listener).toHaveBeenCalledWith(
    expect.objectContaining({ detail: { pressed: true }, bubbles: true, composed: true }),
  )
})

it('disabled な <button> は押しても変わらない（ネイティブが click を出さない）', async () => {
  const el = await fixtureOf(RdToggle, toggle('', 'aria-pressed="false" disabled'))
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-toggle', listener)
  control(el).click()
  await el.updateComplete
  expect(listener).not.toHaveBeenCalled()
  expect(el.pressed).toBe(false)
})

it('pressed は getter / setter でネイティブの aria-pressed に委譲する', async () => {
  const el = await fixtureOf(RdToggle, toggle())
  expect(el.pressed).toBe(false)
  el.pressed = true
  await el.updateComplete
  expect(control(el).getAttribute('aria-pressed')).toBe('true')
  expect(el.matches(':state(pressed)')).toBe(true)
})

it('外から aria-pressed を書き換えても :state(pressed) が追随する', async () => {
  const el = await fixtureOf(RdToggle, toggle())
  control(el).setAttribute('aria-pressed', 'true')
  await expect.poll(() => el.matches(':state(pressed)')).toBe(true)
})

it('variant は :state() になる', async () => {
  const el = await fixtureOf(RdToggle, toggle('variant="ghost"'))
  expect(el.matches(':state(ghost)')).toBe(true)
  expect(el.matches(':state(outline)')).toBe(false)
})

it('ピルは 44px のタップ標的になる', async () => {
  const el = await fixtureOf(RdToggle, toggle())
  expect(control(el).getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
})
