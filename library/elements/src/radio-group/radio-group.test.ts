import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdRadioGroup } from './radio-group.element.js'
// rd-radio-group を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './radio-group.define.js'

const option = (value: string, label: string, extra = ''): string =>
  `<label><input type="radio" id="plan-${value}" name="plan" value="${value}" ${extra}>${label}</label>`

const group = (hostAttrs = '', firstExtra = ''): string =>
  `<rd-radio-group ${hostAttrs}><fieldset><legend>プラン</legend><div part="options">`
  + `${option('free', '無料', firstExtra)}${option('pro', '有料')}${option('team', 'チーム')}`
  + '</div></fieldset></rd-radio-group>'

const radios = (el: RdRadioGroup): readonly HTMLInputElement[] =>
  [...el.querySelectorAll('input[type=radio]')].flatMap((node) =>
    node instanceof HTMLInputElement ? [node] : [],
  )

beforeAll(async () => {
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/radio-group/radio-group.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子（fieldset > legend と radio）なら malformed にならない', async () => {
  const el = await fixtureOf(RdRadioGroup, group())
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(radios(el)).toHaveLength(3)
})

it('<legend> が無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdRadioGroup,
    '<rd-radio-group><fieldset><label><input type="radio" name="p" value="a">A</label>'
      + '</fieldset></rd-radio-group>',
  )
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('value は選ばれている radio の値を返し、setter で切り替わる', async () => {
  const el = await fixtureOf(RdRadioGroup, group('', 'checked'))
  expect(el.value).toBe('free')
  el.value = 'team'
  await el.updateComplete
  expect(el.value).toBe('team')
  expect(radios(el)[2]?.checked).toBe(true)
  expect(el.matches(':state(filled)')).toBe(true)
})

it('未知の値を書いても選択は変わらない', async () => {
  const el = await fixtureOf(RdRadioGroup, group('', 'checked'))
  el.value = 'nope'
  await el.updateComplete
  expect(el.value).toBe('free')
})

it('選んだ値がネイティブの FormData に載る', async () => {
  const form = await fixtureOf(HTMLFormElement, `<form>${group('', 'checked')}</form>`)
  expect(new FormData(form).get('plan')).toBe('free')
})

it('required が未選択なら invalid のあとに日本語の文言が出る', async () => {
  const el = await fixtureOf(RdRadioGroup, group('', 'required'))
  expect(el.checkValidity()).toBe(false)
  expect(el.querySelector('[part=error]')).toBeNull()
  radios(el)[0]?.dispatchEvent(new Event('invalid', { cancelable: true }))
  await el.updateComplete
  expect(el.querySelector('[part=error]')?.textContent).toBe('未入力です。入力してください。')
  // fieldset に aria-invalid は効かないので、最初の radio に付ける
  expect(radios(el)[0]?.getAttribute('aria-invalid')).toBe('true')
  expect(el.querySelector('fieldset')?.hasAttribute('aria-invalid')).toBe(false)
})

it('hint と error は fieldset の aria-describedby に載る', async () => {
  const el = await fixtureOf(
    RdRadioGroup,
    group('hint="あとで変更できます" error="選んでください。"'),
  )
  const hint = el.querySelector('[part=hint]')
  const error = el.querySelector('[part=error]')
  expect(hint?.textContent).toBe('あとで変更できます')
  expect(error?.textContent).toBe('選んでください。')
  expect(el.querySelector('fieldset')?.getAttribute('aria-describedby')).toBe(
    `${hint?.id ?? ''} ${error?.id ?? ''}`,
  )
  expect(el.matches(':state(hinted)')).toBe(true)
  expect(el.matches(':state(errored)')).toBe(true)
})

it('segmented 属性で :state(segmented) が付き、外すと消える', async () => {
  const el = await fixtureOf(RdRadioGroup, group('segmented'))
  expect(el.matches(':state(segmented)')).toBe(true)
  el.segmented = false
  await el.updateComplete
  expect(el.matches(':state(segmented)')).toBe(false)
})

it('選択肢は文言まで含めて 44px のタップ標的になる', async () => {
  const el = await fixtureOf(RdRadioGroup, group())
  const label = el.querySelector('label')
  expect(label?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
})
