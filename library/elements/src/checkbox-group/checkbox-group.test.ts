import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdCheckboxGroup } from './checkbox-group.element.js'
// rd-checkbox-group を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './checkbox-group.define.js'

const option = (value: string, label: string, extra = ''): string =>
  `<label><input type="checkbox" id="tag-${value}" name="tags" value="${value}" ${extra}>`
  + `${label}</label>`

const group = (hostAttrs = '', firstExtra = ''): string =>
  `<rd-checkbox-group ${hostAttrs}><fieldset><legend>タグ</legend><div part="options">`
  + `${option('a', '仕事', firstExtra)}${option('b', '私用')}${option('c', '旅行')}`
  + '</div></fieldset></rd-checkbox-group>'

const boxes = (el: RdCheckboxGroup): readonly HTMLInputElement[] =>
  [...el.querySelectorAll('input[type=checkbox]')].flatMap((node) =>
    node instanceof HTMLInputElement ? [node] : [],
  )

beforeAll(async () => {
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/checkbox-group/checkbox-group.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子（fieldset > legend と checkbox）なら malformed にならない', async () => {
  const el = await fixtureOf(RdCheckboxGroup, group())
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(boxes(el)).toHaveLength(3)
})

it('<legend> が無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdCheckboxGroup,
    '<rd-checkbox-group><fieldset><label><input type="checkbox" name="t" value="a">A</label>'
      + '</fieldset></rd-checkbox-group>',
  )
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('value は checked の値の配列で、setter で揃う', async () => {
  const el = await fixtureOf(RdCheckboxGroup, group('', 'checked'))
  expect(el.value).toEqual(['a'])
  el.value = ['b', 'c']
  await el.updateComplete
  expect(el.value).toEqual(['b', 'c'])
  expect(boxes(el).map((box) => box.checked)).toEqual([false, true, true])
  expect(el.matches(':state(filled)')).toBe(true)
})

it('チェックした値がネイティブの FormData に載る（同名で複数）', async () => {
  const form = await fixtureOf(HTMLFormElement, `<form>${group('', 'checked')}</form>`)
  const target = form.querySelector('rd-checkbox-group')
  if (target instanceof RdCheckboxGroup) {
    target.value = ['a', 'c']
    await target.updateComplete
  }
  expect(new FormData(form).getAll('tags')).toEqual(['a', 'c'])
})

it('min 未満のまま blur すると日本語の文言が出て invalid になる', async () => {
  const el = await fixtureOf(RdCheckboxGroup, group('min="1"'))
  expect(el.checkValidity()).toBe(false)
  expect(el.querySelector('[part=error]')).toBeNull()
  boxes(el)[0]?.dispatchEvent(new Event('blur'))
  await el.updateComplete
  const error = el.querySelector('[part=error]')
  expect(error?.textContent).toBe('未入力です。入力してください。')
  expect(el.matches(':state(invalid)')).toBe(true)
  // 文言は各 checkbox から aria-describedby で引く
  expect(boxes(el).map((box) => box.getAttribute('aria-describedby'))).toEqual([
    error?.id,
    error?.id,
    error?.id,
  ])
})

it('min を満たすと checkValidity が通り、文言が消える', async () => {
  const el = await fixtureOf(RdCheckboxGroup, group('min="2"'))
  boxes(el)[0]?.dispatchEvent(new Event('blur'))
  await el.updateComplete
  expect(el.matches(':state(invalid)')).toBe(true)
  el.value = ['a', 'b']
  await el.updateComplete
  expect(el.checkValidity()).toBe(true)
  expect(el.querySelector('[part=error]')).toBeNull()
})

it('aria-invalid は使わない（radio-group と同じ判断）', async () => {
  const el = await fixtureOf(RdCheckboxGroup, group('error="選んでください。"'))
  expect(boxes(el).some((box) => box.hasAttribute('aria-invalid'))).toBe(false)
  expect(el.querySelector('fieldset')?.hasAttribute('aria-invalid')).toBe(false)
})

it('hint と error は各 checkbox の aria-describedby に載る（fieldset には付けない）', async () => {
  const el = await fixtureOf(
    RdCheckboxGroup,
    group('hint="いくつでも選べます" error="選んでください。"'),
  )
  const hint = el.querySelector('[part=hint]')
  const error = el.querySelector('[part=error]')
  expect(hint?.textContent).toBe('いくつでも選べます')
  expect(error?.textContent).toBe('選んでください。')
  const expected = `${hint?.id ?? ''} ${error?.id ?? ''}`
  expect(boxes(el).map((box) => box.getAttribute('aria-describedby'))).toEqual([
    expected,
    expected,
    expected,
  ])
  expect(el.querySelector('fieldset')?.hasAttribute('aria-describedby')).toBe(false)
  expect(el.matches(':state(hinted)')).toBe(true)
  expect(el.matches(':state(errored)')).toBe(true)
})

it('segmented 属性で :state(segmented) が付き、外すと消える', async () => {
  const el = await fixtureOf(RdCheckboxGroup, group('segmented'))
  expect(el.matches(':state(segmented)')).toBe(true)
  el.segmented = false
  await el.updateComplete
  expect(el.matches(':state(segmented)')).toBe(false)
})

it('選択肢は文言まで含めて 44px のタップ標的になる', async () => {
  const el = await fixtureOf(RdCheckboxGroup, group())
  const label = el.querySelector('label')
  expect(label?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
})
