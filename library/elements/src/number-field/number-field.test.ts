import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdNumberField } from './number-field.element.js'
// rd-number-field を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './number-field.define.js'

const field = (hostAttrs = '', inputAttrs = 'min="0" max="99" value="1"'): string =>
  `<rd-number-field ${hostAttrs}><label for="copies">枚数</label>`
  + `<input type="number" id="copies" name="copies" ${inputAttrs}></rd-number-field>`

const control = (el: RdNumberField): HTMLInputElement => {
  const input = el.querySelector('input')
  expect(input).toBeInstanceOf(HTMLInputElement)
  return input instanceof HTMLInputElement ? input : document.createElement('input')
}

const buttonOf = (el: RdNumberField, part: string): HTMLButtonElement => {
  const button = el.querySelector(`[part=${part}]`)
  expect(button).toBeInstanceOf(HTMLButtonElement)
  return button instanceof HTMLButtonElement ? button : document.createElement('button')
}

beforeAll(async () => {
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/number-field/number-field.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子なら malformed にならず、− / + を足す', async () => {
  const el = await fixtureOf(RdNumberField, field())
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(buttonOf(el, 'decrement').getAttribute('aria-label')).toBe('減らす')
  expect(buttonOf(el, 'increment').getAttribute('aria-label')).toBe('増やす')
})

it('<input type="number"> が無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdNumberField,
    '<rd-number-field><label for="a">枚数</label></rd-number-field>',
  )
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('+ を押すと値が刻まれ、<input> から input → change の順に上がる', async () => {
  const el = await fixtureOf(RdNumberField, field())
  const input = control(el)
  const seen: string[] = []
  input.addEventListener('input', () => seen.push('input'))
  input.addEventListener('change', () => seen.push('change'))
  buttonOf(el, 'increment').click()
  await el.updateComplete
  expect(input.value).toBe('2')
  expect(seen).toEqual(['input', 'change'])
})

it('− で戻る', async () => {
  const el = await fixtureOf(RdNumberField, field())
  buttonOf(el, 'increment').click()
  buttonOf(el, 'decrement').click()
  await el.updateComplete
  expect(control(el).value).toBe('1')
})

it('max に達すると + が無効になり、max を書き換えると追随する', async () => {
  const el = await fixtureOf(RdNumberField, field('', 'min="0" max="3" value="3"'))
  expect(buttonOf(el, 'increment').disabled).toBe(true)
  expect(buttonOf(el, 'decrement').disabled).toBe(false)
  control(el).setAttribute('max', '9')
  await expect.poll(() => buttonOf(el, 'increment').disabled).toBe(false)
})

it('<input disabled> では両方のボタンが無効になる', async () => {
  const el = await fixtureOf(RdNumberField, field('', 'min="0" max="99" value="1" disabled'))
  expect(buttonOf(el, 'increment').disabled).toBe(true)
  expect(buttonOf(el, 'decrement').disabled).toBe(true)
})

it('stepUp() / stepDown() は step の桁で丸める（浮動小数の誤差を残さない）', async () => {
  const el = await fixtureOf(RdNumberField, field('', 'step="0.1" value="0.2"'))
  el.stepUp()
  await el.updateComplete
  expect(control(el).value).toBe('0.3')
  el.stepDown()
  await el.updateComplete
  expect(control(el).value).toBe('0.2')
})

it('value / valueAsNumber はネイティブ要素へ委譲する', async () => {
  const el = await fixtureOf(RdNumberField, field())
  expect(el.value).toBe('1')
  expect(el.valueAsNumber).toBe(1)
  el.value = '7'
  await el.updateComplete
  expect(control(el).value).toBe('7')
})

it('hint と error が aria-describedby に載る', async () => {
  const el = await fixtureOf(
    RdNumberField,
    field('hint="1 から 99 まで" error="在庫が足りません。"'),
  )
  const hint = el.querySelector('[part=hint]')
  const error = el.querySelector('[part=error]')
  expect(control(el).getAttribute('aria-describedby')).toBe(`${hint?.id ?? ''} ${error?.id ?? ''}`)
  expect(el.matches(':state(errored)')).toBe(true)
  expect(control(el).getAttribute('aria-invalid')).toBe('true')
})

it('invalid イベントで :state(invalid) が付く（ネイティブの吹き出しは止める）', async () => {
  const el = await fixtureOf(RdNumberField, field('', 'min="5" value="1"'))
  const event = new Event('invalid', { cancelable: true })
  control(el).dispatchEvent(event)
  await el.updateComplete
  expect(event.defaultPrevented).toBe(true)
  expect(el.matches(':state(invalid)')).toBe(true)
  expect(el.querySelector('[part=error]')?.textContent).toBe(
    '小さすぎます。5 以上で入力してください。',
  )
})

it('form.reset() で文言が消える', async () => {
  const form = await fixtureOf(HTMLFormElement, `<form>${field('', 'min="5" value="1"')}</form>`)
  const el = form.querySelector('rd-number-field')
  expect(el).toBeInstanceOf(RdNumberField)
  const numberField = el instanceof RdNumberField ? el : undefined
  numberField?.querySelector('input')?.dispatchEvent(new Event('invalid', { cancelable: true }))
  await numberField?.updateComplete
  expect(numberField?.querySelector('[part=error]')).not.toBeNull()
  form.reset()
  await numberField?.updateComplete
  expect(numberField?.querySelector('[part=error]')).toBeNull()
})

it('刻みのボタンは 44 × 44px 以上で、Tab 順には入らない', async () => {
  const el = await fixtureOf(RdNumberField, field())
  const plus = buttonOf(el, 'increment')
  const box = plus.getBoundingClientRect()
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(plus.tabIndex).toBe(-1)
  expect(buttonOf(el, 'decrement').tabIndex).toBe(-1)
})

it('prefers-reduced-motion: reduce ではアニメーションが無い', async () => {
  const el = await fixtureOf(RdNumberField, field())
  buttonOf(el, 'increment').click()
  await el.updateComplete
  expect(el.getAnimations({ subtree: true })).toEqual([])
})
