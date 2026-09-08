import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdInputOtp } from './input-otp.element.js'
// rd-input-otp を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './input-otp.define.js'

const cell = (index: number): string =>
  `<input type="text" inputmode="numeric" pattern="[0-9]" maxlength="1" id="code-${index}" `
  + `name="code-${index}" aria-label="${index} 桁目" required>`

const otp = (hostAttrs = '', length = 4): string =>
  `<rd-input-otp ${hostAttrs}><fieldset><legend>確認コード</legend><div part="cells">`
  + Array.from({ length }, (_, index) => cell(index + 1)).join('')
  + '</div></fieldset></rd-input-otp>'

const cells = (el: RdInputOtp): readonly HTMLInputElement[] =>
  [...el.querySelectorAll('input')].flatMap((node) =>
    node instanceof HTMLInputElement ? [node] : [],
  )

const type = (input: HTMLInputElement, value: string): void => {
  input.focus()
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

beforeAll(async () => {
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/input-otp/input-otp.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子（fieldset > legend と桁）なら malformed にならない', async () => {
  const el = await fixtureOf(RdInputOtp, otp())
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(cells(el)).toHaveLength(4)
})

it('<legend> が無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdInputOtp,
    '<rd-input-otp><fieldset><input id="a" name="a"></fieldset></rd-input-otp>',
  )
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('1 文字入れると次の桁へ焦点が進む', async () => {
  const el = await fixtureOf(RdInputOtp, otp())
  type(cells(el)[0] ?? new HTMLInputElement(), '1')
  await el.updateComplete
  expect(document.activeElement).toBe(cells(el)[1])
})

it('最後の桁では進まない', async () => {
  const el = await fixtureOf(RdInputOtp, otp())
  type(cells(el)[3] ?? new HTMLInputElement(), '9')
  await el.updateComplete
  expect(document.activeElement).toBe(cells(el)[3])
})

it('空の桁で Backspace を押すと前の桁へ戻る', async () => {
  const el = await fixtureOf(RdInputOtp, otp())
  const second = cells(el)[1]
  second?.focus()
  second?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
  await el.updateComplete
  expect(document.activeElement).toBe(cells(el)[0])
})

it('値が入っている桁の Backspace では戻らない（ネイティブの削除に任せる）', async () => {
  const el = await fixtureOf(RdInputOtp, otp())
  const second = cells(el)[1]
  type(second ?? new HTMLInputElement(), '2')
  second?.focus()
  second?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
  await el.updateComplete
  expect(document.activeElement).toBe(second)
})

it('矢印キーで桁を行き来できる', async () => {
  const el = await fixtureOf(RdInputOtp, otp())
  const first = cells(el)[0]
  first?.focus()
  first?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  await el.updateComplete
  expect(document.activeElement).toBe(cells(el)[1])
  cells(el)[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
  await el.updateComplete
  expect(document.activeElement).toBe(cells(el)[0])
})

it('貼り付けると桁に分配され、末尾へ焦点が移る', async () => {
  const el = await fixtureOf(RdInputOtp, otp())
  const data = new DataTransfer()
  data.setData('text', '12-34')
  cells(el)[0]?.focus()
  cells(el)[0]?.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
  )
  await el.updateComplete
  expect(el.value).toBe('1234')
  expect(document.activeElement).toBe(cells(el)[3])
  expect(el.matches(':state(filled)')).toBe(true)
})

it('value は連結した文字列で、setter は桁に分配する', async () => {
  const el = await fixtureOf(RdInputOtp, otp())
  expect(el.value).toBe('')
  el.value = '5678'
  await el.updateComplete
  expect(cells(el).map((input) => input.value)).toEqual(['5', '6', '7', '8'])
  expect(el.value).toBe('5678')
})

it('全桁埋まるまで checkValidity は通らない', async () => {
  const el = await fixtureOf(RdInputOtp, otp())
  expect(el.checkValidity()).toBe(false)
  el.value = '1234'
  await el.updateComplete
  expect(el.checkValidity()).toBe(true)
})

it('桁から桁へ移っただけでは怒らない（入力中に :state(invalid) にしない）', async () => {
  const el = await fixtureOf(RdInputOtp, otp())
  const [first, second] = cells(el)
  type(first ?? new HTMLInputElement(), '1')
  first?.dispatchEvent(new FocusEvent('blur', { relatedTarget: second ?? null }))
  await el.updateComplete
  expect(el.matches(':state(invalid)')).toBe(false)
})

it('部品の外へ焦点が出たら invalid になる', async () => {
  const el = await fixtureOf(RdInputOtp, otp())
  cells(el)[0]?.dispatchEvent(new FocusEvent('blur', { relatedTarget: document.body }))
  await el.updateComplete
  expect(el.matches(':state(invalid)')).toBe(true)
})

it('未入力のまま invalid が出ると日本語の文言が各桁の aria-describedby に載る', async () => {
  const el = await fixtureOf(RdInputOtp, otp())
  cells(el)[0]?.dispatchEvent(new Event('invalid', { cancelable: true }))
  await el.updateComplete
  const error = el.querySelector('[part=error]')
  expect(error?.textContent).toBe('未入力です。入力してください。')
  expect(cells(el).map((input) => input.getAttribute('aria-describedby'))).toEqual(
    Array.from({ length: 4 }, () => error?.id),
  )
})

it('hint は各桁の aria-describedby に載る（fieldset には付けない）', async () => {
  const el = await fixtureOf(RdInputOtp, otp('hint="6 桁の数字"'))
  const hint = el.querySelector('[part=hint]')
  expect(hint?.textContent).toBe('6 桁の数字')
  expect(cells(el)[0]?.getAttribute('aria-describedby')).toBe(hint?.id)
  expect(el.querySelector('fieldset')?.hasAttribute('aria-describedby')).toBe(false)
  expect(el.matches(':state(hinted)')).toBe(true)
})

it('桁は 44px のタップ標的になる', async () => {
  const el = await fixtureOf(RdInputOtp, otp())
  expect(cells(el)[0]?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
})
