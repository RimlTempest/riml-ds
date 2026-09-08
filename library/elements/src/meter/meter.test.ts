import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdMeter } from './meter.element.js'
// rd-meter を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './meter.define.js'

const METER =
  '<rd-meter><label for="m">使用量</label>'
  + '<meter id="m" value="3.2" max="10">3.2 GB / 10 GB</meter></rd-meter>'

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/meter/meter.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(RdMeter, METER)
  expect(el.matches(':state(malformed)')).toBe(false)
})

it('<meter> も <progress> も無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(RdMeter, '<rd-meter><label for="m">使用量</label></rd-meter>')
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})

it('属性から --rd-meter-fill を書く', async () => {
  const el = await fixtureOf(RdMeter, METER)
  expect(el.style.getPropertyValue('--rd-meter-fill')).toBe('0.32')
})

it('MutationObserver で value の変更に追随する', async () => {
  const el = await fixtureOf(RdMeter, METER)
  el.querySelector('meter')?.setAttribute('value', '10')
  await expect.poll(() => el.style.getPropertyValue('--rd-meter-fill')).toBe('1')
})

it('value 無しの <progress> は indeterminate（fill は 0）', async () => {
  const el = await fixtureOf(
    RdMeter,
    '<rd-meter><label for="p">読み込み中</label><progress id="p"></progress></rd-meter>',
  )
  expect(el.matches(':state(indeterminate)')).toBe(true)
  expect(el.style.getPropertyValue('--rd-meter-fill')).toBe('0')
})

it('壊れた範囲でも例外を投げず 0 のままにする', async () => {
  const el = await fixtureOf(
    RdMeter,
    '<rd-meter><label for="m">使用量</label><meter id="m" value="5" min="10" max="2"></meter></rd-meter>',
  )
  expect(el.style.getPropertyValue('--rd-meter-fill')).toBe('0')
})

it('JS が無くても読める形のまま、太いピルとして描かれる', async () => {
  const el = await fixtureOf(RdMeter, METER)
  const control = el.querySelector('meter')
  const style = control === null ? undefined : getComputedStyle(control)
  // --rd-radius-full: 9999px、--rd-space-4: 1rem
  expect(style?.borderRadius).toBe('9999px')
  expect(style?.height).toBe('16px')
  // ネイティブの内側（緑・黄・赤の棒）を消していることは VRT が見る
  //（getComputedStyle は UA shadow の擬似要素に作者スタイルを返さない）
})

it('塗りの端も丸い（トラックだけでなく。plan 015 の積み残し）', async () => {
  const el = await fixtureOf(RdMeter, METER)
  const fill = getComputedStyle(el, '::after')
  // --rd-radius-full: 9999px、--rd-space-4: 1rem
  expect(fill.content).not.toBe('none')
  expect(fill.borderRadius).toBe('9999px')
  expect(fill.height).toBe('16px')
  // 幅は --rd-meter-fill（0.32）× トラック
  expect(fill.width).not.toBe('0px')
})

it('ラベルは太字のインク（brand.md §7.3）', async () => {
  const el = await fixtureOf(RdMeter, METER)
  const label = el.querySelector('label')
  const style = label === null ? undefined : getComputedStyle(label)
  expect(style?.fontWeight).toBe('700')
})
