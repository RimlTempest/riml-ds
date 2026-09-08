import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdSlider } from './slider.element.js'
// rd-slider を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './slider.define.js'

const slider = (hostAttrs = '', inputAttrs = 'min="0" max="10" value="3"'): string =>
  `<rd-slider ${hostAttrs}><label for="volume">音量</label>`
  + `<input type="range" id="volume" name="volume" ${inputAttrs}>`
  + '<output for="volume">3</output></rd-slider>'

const range = (el: RdSlider): HTMLInputElement => {
  const input = el.querySelector('input')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('input[type=range] が無い')
  }
  return input
}

const fillOf = (el: RdSlider): string => el.style.getPropertyValue('--rd-slider-fill')

beforeAll(async () => {
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/slider/slider.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子なら malformed にならず、初期の塗りを書く', async () => {
  const el = await fixtureOf(RdSlider, slider())
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(fillOf(el)).toBe('0.3')
})

it('<input type="range"> が無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(RdSlider, '<rd-slider><label for="a">音量</label></rd-slider>')
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('input イベントで塗りと <output> の文言が変わる', async () => {
  const el = await fixtureOf(RdSlider, slider('unit=" GB"'))
  expect(el.querySelector('output')?.textContent).toBe('3 GB')
  const input = range(el)
  input.value = '8'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await el.updateComplete
  expect(fillOf(el)).toBe('0.8')
  expect(el.querySelector('output')?.textContent).toBe('8 GB')
})

it('max 属性の変更に MutationObserver で追随する', async () => {
  const el = await fixtureOf(RdSlider, slider())
  range(el).setAttribute('max', '6')
  await expect.poll(() => fillOf(el)).toBe('0.5')
})

it('value / valueAsNumber はネイティブ要素へ委譲する', async () => {
  const el = await fixtureOf(RdSlider, slider())
  expect(el.value).toBe('3')
  expect(el.valueAsNumber).toBe(3)
  el.value = '9'
  await el.updateComplete
  expect(range(el).value).toBe('9')
  expect(fillOf(el)).toBe('0.9')
})

it('塗りのトラックは読み上げから外す（値はネイティブの range が持つ）', async () => {
  const el = await fixtureOf(RdSlider, slider())
  const track = el.querySelector('[part=track]')
  expect(track?.getAttribute('aria-hidden')).toBe('true')
  expect(track?.querySelector('[part=fill]')).not.toBeNull()
})

it('orientation="vertical" で :state(vertical) が付く', async () => {
  const el = await fixtureOf(RdSlider, slider('orientation="vertical"'))
  expect(el.matches(':state(vertical)')).toBe(true)
  el.orientation = 'horizontal'
  await el.updateComplete
  expect(el.matches(':state(vertical)')).toBe(false)
})

it('error 属性の文言をそのまま出して invalid になる', async () => {
  // range は UA が値を範囲に丸めるので、ネイティブの検証には落ちない。
  // 業務上の「選べない値」は利用側が error 属性で伝える
  const el = await fixtureOf(RdSlider, slider('error="この帯域は選べません。"'))
  expect(el.querySelector('[part=error]')?.textContent).toBe('この帯域は選べません。')
  expect(el.matches(':state(invalid)')).toBe(true)
  expect(range(el).getAttribute('aria-invalid')).toBe('true')
})

it('hint と error が aria-describedby に載る', async () => {
  const el = await fixtureOf(RdSlider, slider('hint="0 から 10 まで" error="選び直してください。"'))
  const hint = el.querySelector('[part=hint]')
  const error = el.querySelector('[part=error]')
  expect(range(el).getAttribute('aria-describedby')).toBe(`${hint?.id ?? ''} ${error?.id ?? ''}`)
  expect(el.matches(':state(errored)')).toBe(true)
})

it('つまみは 24px 以上の標的になる（WCAG 2.5.8）', async () => {
  const el = await fixtureOf(RdSlider, slider())
  expect(range(el).getBoundingClientRect().height).toBeGreaterThanOrEqual(24)
})
