import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdSelect } from './select.element.js'
// rd-select を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './select.define.js'

const OPTIONS =
  '<option value="">選択してください</option>'
  + '<option value="jp">日本</option><option value="us">アメリカ</option>'

const field = (attrs = '', selectAttrs = ''): string =>
  `<rd-select ${attrs}><label for="country">国</label>`
  + `<select id="country" name="country" ${selectAttrs}>${OPTIONS}</select></rd-select>`

const errorText = (el: RdSelect): string => el.querySelector('[part=error]')?.textContent ?? ''

beforeAll(async () => {
  // 利用側は日本語ページ。文言表を使う分岐（writing.md「フォーム検証の文言」）に合わせる
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/select/select.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(RdSelect, field())
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(el.querySelector('select')?.id).toBe('country')
})

it('<label> が無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdSelect,
    `<rd-select><select id="a" name="a">${OPTIONS}</select></rd-select>`,
  )
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('選んだ値がネイティブの FormData に載る', async () => {
  const form = await fixtureOf(HTMLFormElement, `<form>${field()}</form>`)
  const select = form.querySelector('select')
  if (select !== null) {
    select.value = 'jp'
  }
  expect(new FormData(form).get('country')).toBe('jp')
})

it('value 属性が初期選択になり :state(filled) が付く', async () => {
  const el = await fixtureOf(RdSelect, field('value="us"'))
  expect(el.value).toBe('us')
  expect(el.matches(':state(filled)')).toBe(true)
})

it('required で未選択なら checkValidity() が false で日本語の文言が出る', async () => {
  const el = await fixtureOf(RdSelect, field('', 'required'))
  expect(el.checkValidity()).toBe(false)
  el.querySelector('select')?.dispatchEvent(new Event('change'))
  await el.updateComplete
  expect(errorText(el)).toBe('未入力です。入力してください。')
})

it('触るまでエラーを出さない', async () => {
  const el = await fixtureOf(RdSelect, field('', 'required'))
  expect(el.querySelector('[part=error]')).toBeNull()
  el.querySelector('select')?.dispatchEvent(new FocusEvent('blur'))
  await el.updateComplete
  expect(el.querySelector('[part=error]')).not.toBeNull()
})

it('invalid のネイティブ吹き出しを抑え、インライン文言に置き換える', async () => {
  const el = await fixtureOf(RdSelect, field('', 'required'))
  const select = el.querySelector('select')
  const seen = vi.fn<(event: Event) => void>()
  select?.addEventListener('invalid', seen)
  expect(select?.reportValidity()).toBe(false)
  expect(seen).toHaveBeenCalledOnce()
  expect(seen.mock.calls[0]?.[0].defaultPrevented).toBe(true)
  await el.updateComplete
  expect(errorText(el)).toBe('未入力です。入力してください。')
})

it('error 属性は触る前でも強制的に表示し hint を aria-describedby に載せる', async () => {
  const el = await fixtureOf(
    RdSelect,
    field('hint="請求先の国" error="その国には配送できません。"'),
  )
  expect(errorText(el)).toBe('その国には配送できません。')
  expect(el.matches(':state(errored)')).toBe(true)
  const hint = el.querySelector('[part=hint]')
  expect(hint?.textContent).toBe('請求先の国')
  expect(el.querySelector('select')?.getAttribute('aria-describedby')).toContain(hint?.id ?? '')
})
