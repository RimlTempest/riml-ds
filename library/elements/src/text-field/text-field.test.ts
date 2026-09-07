import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdTextField } from './text-field.element.js'
// rd-text-field を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './text-field.define.js'

const FIELD =
  '<rd-text-field><label for="email">メール</label>'
  + '<input id="email" name="email" type="email"></rd-text-field>'

const errorText = (el: RdTextField): string => el.querySelector('[part=error]')?.textContent ?? ''

beforeAll(async () => {
  // 利用側は日本語ページ。文言表を使う分岐（writing.md「フォーム検証の文言」）に合わせる
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/text-field/text-field.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(RdTextField, FIELD)
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(el.querySelector('input')?.id).toBe('email')
})

it('<label> が無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(RdTextField, '<rd-text-field><input id="a" name="a"></rd-text-field>')
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('入力した値がネイティブの FormData に載る', async () => {
  const form = await fixtureOf(HTMLFormElement, `<form>${FIELD}</form>`)
  const field = form.querySelector('rd-text-field')
  expect(field).toBeInstanceOf(RdTextField)
  const input = form.querySelector('input')
  expect(input).not.toBeNull()
  input?.setAttribute('value', 'a@example.com')
  if (input !== null) {
    input.value = 'a@example.com'
  }
  expect(new FormData(form).get('email')).toBe('a@example.com')
})

it('required が空なら checkValidity() が false で日本語の文言が出る', async () => {
  const el = await fixtureOf(
    RdTextField,
    '<rd-text-field><label for="n">名前</label><input id="n" name="n" required></rd-text-field>',
  )
  expect(el.checkValidity()).toBe(false)
  el.querySelector('input')?.dispatchEvent(new FocusEvent('blur'))
  await el.updateComplete
  expect(errorText(el)).toBe('未入力です。入力してください。')
})

it('blur するまでエラーを出さない', async () => {
  const el = await fixtureOf(
    RdTextField,
    '<rd-text-field><label for="n">名前</label><input id="n" name="n" required></rd-text-field>',
  )
  expect(el.querySelector('[part=error]')).toBeNull()
  el.querySelector('input')?.dispatchEvent(new FocusEvent('blur'))
  await el.updateComplete
  expect(el.querySelector('[part=error]')).not.toBeNull()
})

it('invalid のネイティブ吹き出しを抑え、インライン文言に置き換える', async () => {
  const el = await fixtureOf(
    RdTextField,
    '<rd-text-field><label for="n">名前</label><input id="n" name="n" required></rd-text-field>',
  )
  const input = el.querySelector('input')
  const seen = vi.fn<(event: Event) => void>()
  input?.addEventListener('invalid', seen)
  expect(input?.reportValidity()).toBe(false)
  expect(seen).toHaveBeenCalledOnce()
  expect(seen.mock.calls[0]?.[0].defaultPrevented).toBe(true)
  await el.updateComplete
  expect(errorText(el)).toBe('未入力です。入力してください。')
})

it('error 属性は blur 前でも強制的に表示する', async () => {
  const el = await fixtureOf(
    RdTextField,
    `<rd-text-field error="既に使われています。別のメールを入力してください。">${FIELD.slice('<rd-text-field>'.length)}`,
  )
  expect(errorText(el)).toBe('既に使われています。別のメールを入力してください。')
  expect(el.matches(':state(errored)')).toBe(true)
})

it('hint が aria-describedby に載る', async () => {
  const el = await fixtureOf(
    RdTextField,
    `<rd-text-field hint="確認メールを送ります">${FIELD.slice('<rd-text-field>'.length)}`,
  )
  const hint = el.querySelector('[part=hint]')
  expect(hint?.textContent).toBe('確認メールを送ります')
  expect(el.querySelector('input')?.getAttribute('aria-describedby')).toBe(hint?.id)
})

it('form.reset() で文言が消える', async () => {
  const form = await fixtureOf(
    HTMLFormElement,
    '<form><rd-text-field><label for="n">名前</label><input id="n" name="n" required></rd-text-field></form>',
  )
  const el = form.querySelector('rd-text-field')
  expect(el).toBeInstanceOf(RdTextField)
  if (!(el instanceof RdTextField)) {
    return
  }
  el.querySelector('input')?.dispatchEvent(new FocusEvent('blur'))
  await el.updateComplete
  expect(el.querySelector('[part=error]')).not.toBeNull()
  form.reset()
  await el.updateComplete
  expect(el.querySelector('[part=error]')).toBeNull()
})

it(':state(invalid) が blur 後に付き、値を入れると外れる', async () => {
  const el = await fixtureOf(
    RdTextField,
    '<rd-text-field><label for="n">名前</label><input id="n" name="n" required></rd-text-field>',
  )
  const input = el.querySelector('input')
  input?.dispatchEvent(new FocusEvent('blur'))
  await el.updateComplete
  expect(el.matches(':state(invalid)')).toBe(true)
  el.value = 'りむる'
  input?.dispatchEvent(new Event('input'))
  await el.updateComplete
  expect(el.matches(':state(invalid)')).toBe(false)
  expect(el.matches(':state(filled)')).toBe(true)
})

it('英語 UI（lang=en）では表を使わずネイティブ文言を出す', async () => {
  const el = await fixtureOf(
    RdTextField,
    '<rd-text-field lang="en"><label for="n">Name</label><input id="n" name="n" required></rd-text-field>',
  )
  el.querySelector('input')?.dispatchEvent(new FocusEvent('blur'))
  await el.updateComplete
  expect(errorText(el)).toBe(el.querySelector('input')?.validationMessage)
  expect(errorText(el)).not.toBe('未入力です。入力してください。')
})
