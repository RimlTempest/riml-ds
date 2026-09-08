import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { RdCombobox } from './combobox.element.js'
// rd-combobox を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './combobox.define.js'

const OPTIONS =
  '<option value="kana">かな</option>'
  + '<option value="kanji">かんじ</option>'
  + '<option value="katakana">カナ</option>'
  + '<option value="romaji">ローマ字</option>'
  + '<option value="eisuji">英数字</option>'

const field = (attrs = '', inputAttrs = ''): string =>
  `<rd-combobox ${attrs}><label for="reading">読み</label>`
  + `<input id="reading" name="reading" list="reading-list" type="text" autocomplete="off" ${inputAttrs}>`
  + `<datalist id="reading-list">${OPTIONS}</datalist></rd-combobox>`

const input = (el: RdCombobox): HTMLInputElement | null => el.querySelector('input')

const options = (el: RdCombobox): readonly Element[] => [...el.querySelectorAll('[role="option"]')]

const errorText = (el: RdCombobox): string => el.querySelector('[part=error]')?.textContent ?? ''

/** キーは実際の操作と同じく `<input>` から上げる */
const press = async (el: RdCombobox, key: string, altKey = false): Promise<void> => {
  input(el)?.dispatchEvent(new KeyboardEvent('keydown', { key, altKey, bubbles: true }))
  await el.updateComplete
}

const type = async (el: RdCombobox, value: string): Promise<void> => {
  const control = input(el)
  if (control !== null) {
    control.value = value
    control.dispatchEvent(new Event('input', { bubbles: true }))
  }
  await el.updateComplete
}

beforeAll(async () => {
  // 利用側は日本語ページ。文言表を使う分岐（writing.md「フォーム検証の文言」）に合わせる
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/combobox/combobox.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('定義後は list 属性を外し、ARIA の combobox パターンに置き換える', async () => {
  const el = await fixtureOf(RdCombobox, field())
  const control = input(el)
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(control?.hasAttribute('list')).toBe(false)
  expect(control?.getAttribute('role')).toBe('combobox')
  expect(control?.getAttribute('aria-autocomplete')).toBe('list')
  expect(control?.getAttribute('aria-expanded')).toBe('false')
  expect(control?.getAttribute('aria-controls')).toBe(el.querySelector('[part=list]')?.id)
  // 候補の唯一の出どころは <datalist>。定義後も残す
  expect(el.querySelectorAll('datalist > option')).toHaveLength(5)
})

it('↓ で候補が開き、1 つ目が aria-activedescendant になる', async () => {
  const el = await fixtureOf(RdCombobox, field())
  await press(el, 'ArrowDown')
  expect(input(el)?.getAttribute('aria-expanded')).toBe('true')
  expect(el.matches(':state(open)')).toBe(true)
  expect(el.querySelector('[part=list]')?.matches(':popover-open')).toBe(true)
  expect(options(el)).toHaveLength(5)
  expect(input(el)?.getAttribute('aria-activedescendant')).toBe(options(el)[0]?.id)
  expect(options(el)[0]?.getAttribute('aria-selected')).toBe('true')
})

it('Alt+↓ で候補を出すだけ（当たっている候補は作らない）', async () => {
  const el = await fixtureOf(RdCombobox, field())
  await press(el, 'ArrowDown', true)
  expect(input(el)?.getAttribute('aria-expanded')).toBe('true')
  expect(input(el)?.hasAttribute('aria-activedescendant')).toBe(false)
})

it('打つと候補が絞られる', async () => {
  const el = await fixtureOf(RdCombobox, field())
  await type(el, 'か')
  expect(options(el).map((option) => option.textContent)).toEqual(['かな', 'かんじ'])
  expect(input(el)?.getAttribute('aria-expanded')).toBe('true')
})

it('Enter で候補を確定し、値と rd-select を出して閉じる', async () => {
  const el = await fixtureOf(RdCombobox, field())
  const seen = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-select', seen)
  await type(el, 'か')
  await press(el, 'ArrowDown')
  await press(el, 'ArrowDown')
  await press(el, 'Enter')
  expect(el.value).toBe('kanji')
  expect(input(el)?.getAttribute('aria-expanded')).toBe('false')
  expect(seen).toHaveBeenCalledOnce()
  expect(seen.mock.calls[0]?.[0]).toMatchObject({ detail: { value: 'kanji', index: 1 } })
})

it('Esc で閉じるだけ（打った値は消さない）', async () => {
  const el = await fixtureOf(RdCombobox, field())
  await type(el, 'か')
  await press(el, 'Escape')
  expect(input(el)?.getAttribute('aria-expanded')).toBe('false')
  expect(el.value).toBe('か')
})

it('絞った結果が 0 件なら閉じたままにする（空のリストは見せない）', async () => {
  const el = await fixtureOf(RdCombobox, field())
  await type(el, 'ロシア語')
  expect(input(el)?.getAttribute('aria-expanded')).toBe('false')
  expect(el.matches(':state(empty)')).toBe(true)
  expect(options(el)).toHaveLength(0)
})

it('filter="prefix" は前方一致で絞る', async () => {
  const el = await fixtureOf(RdCombobox, field('filter="prefix"'))
  await type(el, 'kana')
  expect(options(el).map((option) => option.textContent)).toEqual(['かな'])
})

it('候補から離れたら閉じる（blur）', async () => {
  const el = await fixtureOf(RdCombobox, field())
  await press(el, 'ArrowDown')
  input(el)?.dispatchEvent(new FocusEvent('blur', { bubbles: false }))
  await el.updateComplete
  expect(input(el)?.getAttribute('aria-expanded')).toBe('false')
})

it('候補を押すと確定する（入力欄のフォーカスは奪わない）', async () => {
  const el = await fixtureOf(RdCombobox, field())
  await press(el, 'ArrowDown')
  const first = options(el)[0]
  const down = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
  first?.dispatchEvent(down)
  expect(down.defaultPrevented).toBe(true)
  first?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await el.updateComplete
  expect(el.value).toBe('kana')
  expect(input(el)?.getAttribute('aria-expanded')).toBe('false')
})

it('<datalist> に <option> を足すと候補が増える（MutationObserver）', async () => {
  const el = await fixtureOf(RdCombobox, field())
  await press(el, 'ArrowDown')
  el.querySelector('datalist')?.insertAdjacentHTML(
    'beforeend',
    '<option value="ainu">アイヌ語</option>',
  )
  await expect.poll(() => options(el).length).toBe(6)
})

it('required で未入力のまま離れると :state(invalid) と日本語の文言が出る', async () => {
  const el = await fixtureOf(RdCombobox, field('', 'required'))
  expect(el.checkValidity()).toBe(false)
  input(el)?.dispatchEvent(new FocusEvent('blur'))
  await el.updateComplete
  expect(el.matches(':state(invalid)')).toBe(true)
  expect(errorText(el)).toBe('未入力です。入力してください。')
})

it('hint と error は describedby で結ばれる', async () => {
  const el = await fixtureOf(RdCombobox, field('hint="候補から選ぶか、そのまま入力できます"'))
  const hint = el.querySelector('[part=hint]')
  expect(hint?.textContent).toBe('候補から選ぶか、そのまま入力できます')
  expect(el.matches(':state(hinted)')).toBe(true)
  expect(input(el)?.getAttribute('aria-describedby')).toContain(hint?.id ?? '')
})

it('<datalist> が無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdCombobox,
    '<rd-combobox><label for="a">読み</label><input id="a" name="a" list="a-list"></rd-combobox>',
  )
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})
