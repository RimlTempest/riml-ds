import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { carouselItemMarkup, carouselMarkup, RdCarousel } from './index.js'
// rd-carousel を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './carousel.define.js'

const slides = (count: number): string =>
  Array.from({ length: count }, (_, i) => carouselItemMarkup({ children: `<p>${i + 1}</p>` })).join(
    '',
  )

const trackOf = (el: RdCarousel): HTMLElement => {
  const track = el.querySelector('ul')
  if (!(track instanceof HTMLElement)) {
    throw new Error('<ul> が無い')
  }
  return track
}

const partOf = (el: RdCarousel, part: string): HTMLElement => {
  const node = el.querySelector(`[part='${part}']`)
  if (!(node instanceof HTMLElement)) {
    throw new Error(`[part='${part}'] が無い`)
  }
  return node
}

/**
 * 1 枚ぴったりの幅にして、枚の移動を数えられるようにする。
 * **転がりは瞬時に固定する**——`scroll-behavior: smooth` のままだと `IntersectionObserver` が
 * 移動の**途中**を拾い、どの枚が見えているかが時間に依存する。滑らかさそのものは
 * 下の CSSOM のテストと VRT（`Reduced Motion` の story）が見る。
 */
const mounted = async (count: number, loop = false): Promise<RdCarousel> => {
  const el = await fixtureOf(
    RdCarousel,
    carouselMarkup({ label: 'おすすめ', children: slides(count), ...(loop ? { loop } : {}) }),
  )
  el.style.setProperty('inline-size', '20rem')
  el.style.setProperty('--rd-carousel-item', '100%')
  trackOf(el).style.setProperty('scroll-behavior', 'auto')
  await el.updateComplete
  return el
}

beforeAll(async () => {
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/carousel/carousel.css')
})

afterEach(() => {
  vi.restoreAllMocks()
  cleanupFixtures()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await mounted(3)
  expect(el.matches(':state(malformed)')).toBe(false)
})

it('<li> が 1 枚も無ければ malformed になり、強化ノードを足さない', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdCarousel,
    '<rd-carousel label="おすすめ"><ul tabindex="0"></ul></rd-carousel>',
  )
  expect(el.matches(':state(malformed)')).toBe(true)
  expect(el.querySelector("[part='controls']")).toBeNull()
  expect(error).toHaveBeenCalled()
})

it('label が無ければ unlabeled になり、console.error で知らせる', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdCarousel,
    `<rd-carousel><ul tabindex="0">${slides(2)}</ul></rd-carousel>`,
  )
  expect(el.matches(':state(unlabeled)')).toBe(true)
  expect(error).toHaveBeenCalledWith('[rd-carousel] label が必要')
})

it('名前と役割は ElementInternals が持ち、利用側の HTML を汚さない', async () => {
  const el = await mounted(3)
  expect(el.matches(':state(unlabeled)')).toBe(false)
  expect(el.hasAttribute('role')).toBe(false)
  expect(el.hasAttribute('aria-label')).toBe(false)
})

it('<ul> は Tab で届く（契約が tabindex を持つ。element は足しも消しもしない）', async () => {
  const el = await mounted(3)
  expect(trackOf(el).getAttribute('tabindex')).toBe('0')
})

it('各 <li> は「n / N」の名前とスライドの役割説明を持ち、role は書かれない', async () => {
  const el = await mounted(5)
  const items = [...el.querySelectorAll('li')]
  expect(items).toHaveLength(5)
  expect(items[0]?.getAttribute('aria-label')).toBe('1 / 5')
  expect(items[4]?.getAttribute('aria-label')).toBe('5 / 5')
  expect(items[0]?.getAttribute('aria-roledescription')).toBe('slide')
  // `<ul>` の子は暗黙の `listitem` のまま（axe `list` / `aria-allowed-role`）
  expect(items.every((item) => !item.hasAttribute('role'))).toBe(true)
  // 枚の中身は触らない
  expect(items[0]?.textContent).toBe('1')
})

it('「次へ」を押すと counter が進み、rd-change が出る', async () => {
  const el = await mounted(5)
  const changed = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-change', changed)
  expect(partOf(el, 'counter').textContent).toBe('1 / 5')
  partOf(el, 'next').click()
  await el.updateComplete
  expect(partOf(el, 'counter').textContent).toBe('2 / 5')
  expect(el.index).toBe(1)
  expect(changed).toHaveBeenCalledWith(expect.objectContaining({ detail: { index: 1 } }))
})

it('loop が無ければ端のボタンが aria-disabled になる（フォーカスは可能なまま）', async () => {
  const el = await mounted(3)
  expect(el.matches(':state(at-start)')).toBe(true)
  expect(partOf(el, 'prev').getAttribute('aria-disabled')).toBe('true')
  expect(partOf(el, 'prev').hasAttribute('disabled')).toBe(false)
  expect(partOf(el, 'next').hasAttribute('aria-disabled')).toBe(false)
  partOf(el, 'next').click()
  await el.updateComplete
  partOf(el, 'next').click()
  await el.updateComplete
  expect(el.matches(':state(at-end)')).toBe(true)
  expect(partOf(el, 'next').getAttribute('aria-disabled')).toBe('true')
})

it('loop なら先頭で「前へ」を押すと末尾へ折り返す', async () => {
  const el = await mounted(3, true)
  expect(partOf(el, 'prev').hasAttribute('aria-disabled')).toBe(false)
  partOf(el, 'prev').click()
  await el.updateComplete
  expect(el.index).toBe(2)
  expect(partOf(el, 'counter').textContent).toBe('3 / 3')
})

it('1 枚しか無ければ single になり、操作は隠れる', async () => {
  const el = await mounted(1)
  expect(el.matches(':state(single)')).toBe(true)
  expect(getComputedStyle(partOf(el, 'controls')).display).toBe('none')
})

it('index への代入では rd-change を出さない（プログラムからの移動）', async () => {
  const el = await mounted(5)
  const changed = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-change', changed)
  el.index = 2
  await el.updateComplete
  expect(el.index).toBe(2)
  expect(partOf(el, 'counter').textContent).toBe('3 / 5')
  expect(changed).not.toHaveBeenCalled()
})

it('前へ／次へのタップ標的は 44px 以上ある（WCAG 2.5.5 AAA）', async () => {
  const el = await mounted(5)
  const box = partOf(el, 'next').getBoundingClientRect()
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
})

/**
 * `prefers-reduced-motion` は vitest browser から切り替えられない（Playwright の project 設定）。
 * `toggle.test.ts` と同じく CSSOM を読み、**滑らかさが `no-preference` のブロックの中にしか
 * 無い**ことを見る——`reduce` のときは `scroll-behavior` が初期値の `auto` に戻る。
 */
it('滑らかな転がりは prefers-reduced-motion: no-preference の中にだけある', async () => {
  const sheet = [...document.styleSheets].find((candidate) =>
    (candidate.href ?? '').includes('/carousel/carousel.css'),
  )
  if (sheet === undefined) {
    throw new Error('carousel.css が読み込まれていない')
  }
  const rules = [...sheet.cssRules].flatMap((rule) =>
    rule instanceof CSSLayerBlockRule ? Array.from(rule.cssRules) : [rule],
  )
  const motion = rules.find(
    (rule) => rule instanceof CSSMediaRule && rule.conditionText.includes('prefers-reduced-motion'),
  )
  expect(motion).toBeInstanceOf(CSSMediaRule)
  expect(motion instanceof CSSMediaRule ? motion.conditionText : '').toContain('no-preference')
  expect(motion instanceof CSSMediaRule ? motion.cssText : '').toContain('smooth')
  // `no-preference` のブロックの外に `scroll-behavior` は無い（JS は `behavior: 'auto'` で呼ぶ）
  const outside = rules.filter(
    (rule) => rule instanceof CSSStyleRule && rule.style.getPropertyValue('scroll-behavior') !== '',
  )
  expect(outside).toHaveLength(0)
})
