import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdCheckbox } from './checkbox.element.js'
// rd-checkbox を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './checkbox.define.js'

const box = (hostAttrs = '', inputAttrs = ''): string =>
  `<rd-checkbox ${hostAttrs}><label>`
  + `<input type="checkbox" id="terms" name="terms" ${inputAttrs}>規約に同意する</label></rd-checkbox>`

beforeAll(async () => {
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/checkbox/checkbox.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子（label が input を包む形）なら malformed にならない', async () => {
  const el = await fixtureOf(RdCheckbox, box())
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(el.querySelector('input')?.type).toBe('checkbox')
})

it('<input type="checkbox"> が無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(RdCheckbox, '<rd-checkbox><label>同意</label></rd-checkbox>')
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('checked がネイティブの FormData に載り :state(checked) が同期する', async () => {
  const form = await fixtureOf(HTMLFormElement, `<form>${box('', 'checked value="yes"')}</form>`)
  const el = form.querySelector('rd-checkbox')
  expect(el).toBeInstanceOf(RdCheckbox)
  expect(new FormData(form).get('terms')).toBe('yes')
  if (!(el instanceof RdCheckbox)) {
    return
  }
  expect(el.checked).toBe(true)
  expect(el.matches(':state(checked)')).toBe(true)
})

it('indeterminate はネイティブ要素へ委譲する', async () => {
  const el = await fixtureOf(RdCheckbox, box())
  el.indeterminate = true
  await el.updateComplete
  expect(el.querySelector('input')?.indeterminate).toBe(true)
  expect(el.matches(':state(indeterminate)')).toBe(true)
})

it('switch 属性で role="switch" を付ける（JS 無しはチェックボックスのまま）', async () => {
  const el = await fixtureOf(RdCheckbox, box('switch'))
  expect(el.querySelector('input')?.getAttribute('role')).toBe('switch')
  expect(el.matches(':state(switch)')).toBe(true)
  el.switch = false
  await el.updateComplete
  expect(el.querySelector('input')?.hasAttribute('role')).toBe(false)
})

it('required が未チェックなら操作後に日本語の文言が出る', async () => {
  const el = await fixtureOf(RdCheckbox, box('', 'required'))
  expect(el.checkValidity()).toBe(false)
  expect(el.querySelector('[part=error]')).toBeNull()
  el.querySelector('input')?.dispatchEvent(new FocusEvent('blur'))
  await el.updateComplete
  expect(el.querySelector('[part=error]')?.textContent).toBe('未入力です。入力してください。')
})

it('hint と error が aria-describedby に載る', async () => {
  const el = await fixtureOf(RdCheckbox, box('hint="いつでも解除できます" error="必須です。"'))
  const hint = el.querySelector('[part=hint]')
  const error = el.querySelector('[part=error]')
  expect(hint?.textContent).toBe('いつでも解除できます')
  expect(error?.textContent).toBe('必須です。')
  expect(el.querySelector('input')?.getAttribute('aria-describedby')).toBe(
    `${hint?.id ?? ''} ${error?.id ?? ''}`,
  )
})
