import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdButton } from './button.element.js'
// rd-button を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './button.define.js'

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/button/button.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(RdButton, '<rd-button><button type="button">保存</button></rd-button>')
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(el.querySelector('button')?.textContent).toBe('保存')
})

it('<button> も <a href> も無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(RdButton, '<rd-button>保存</rd-button>')
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('子の click で rd-press が上がる', async () => {
  const el = await fixtureOf(RdButton, '<rd-button><button type="button">保存</button></rd-button>')
  const listener = vi.fn<() => void>()
  el.addEventListener('rd-press', listener)
  el.querySelector('button')?.click()
  expect(listener).toHaveBeenCalledOnce()
})

it('loading 中は click を止め、子に aria-busy を付ける', async () => {
  const el = await fixtureOf(
    RdButton,
    '<rd-button loading><button type="button">保存</button></rd-button>',
  )
  const control = el.querySelector('button')
  expect(control?.getAttribute('aria-busy')).toBe('true')
  expect(control?.hasAttribute('disabled')).toBe(false)
  expect(el.matches(':state(loading)')).toBe(true)

  const listener = vi.fn<() => void>()
  el.addEventListener('rd-press', listener)
  control?.click()
  expect(listener).not.toHaveBeenCalled()

  el.loading = false
  await el.updateComplete
  expect(control?.hasAttribute('aria-busy')).toBe(false)
})

it('<form> の中の type=submit はネイティブに送信される', async () => {
  const form = await fixtureOf(
    HTMLFormElement,
    '<form><rd-button><button type="submit">送信</button></rd-button></form>',
  )
  const submitted = vi.fn<(event: Event) => void>((event) => {
    event.preventDefault()
  })
  form.addEventListener('submit', submitted)
  form.querySelector('button')?.click()
  expect(submitted).toHaveBeenCalledOnce()
})

it('variant が :state() に同期する', async () => {
  const el = await fixtureOf(RdButton, '<rd-button><button type="button">保存</button></rd-button>')
  expect(el.matches(':state(primary)')).toBe(true)
  el.variant = 'danger'
  await el.updateComplete
  expect(el.matches(':state(danger)')).toBe(true)
  expect(el.matches(':state(primary)')).toBe(false)
})

it('style.css が当たり、タッチターゲットが 44px 以上になる', async () => {
  const el = await fixtureOf(RdButton, '<rd-button><button type="button">保存</button></rd-button>')
  const control = el.querySelector('button')
  expect(control).not.toBeNull()
  const box = control?.getBoundingClientRect()
  expect(box?.height).toBeGreaterThanOrEqual(44)
  expect(box?.width).toBeGreaterThanOrEqual(44)
})
