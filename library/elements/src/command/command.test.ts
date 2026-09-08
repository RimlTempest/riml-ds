import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { commandGroupMarkup, commandItemMarkup, markup } from './command.contract.js'
// rd-command を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './command.define.js'
import { RdCommand } from './command.element.js'

/** リンクは fragment にする（実 DOM のテストでページを移動させない） */
const GROUPS =
  commandGroupMarkup({
    label: 'ページ',
    items:
      commandItemMarkup({ label: 'ホーム', href: '#home' })
      + commandItemMarkup({ label: '設定', href: '#settings', keywords: 'せってい preferences' }),
  })
  + commandGroupMarkup({
    label: '操作',
    items: commandItemMarkup({ label: '新しいノート', value: 'new', shortcut: '⌘N' }),
  })

const palette = (props: Partial<Parameters<typeof markup>[0]> = {}): string =>
  markup({ id: 'q', label: 'コマンド', groups: GROUPS, ...props })

const input = (el: RdCommand): HTMLInputElement | null => el.querySelector('input')

const items = (el: RdCommand): readonly HTMLElement[] => [
  ...el.querySelectorAll<HTMLElement>('li > :is(a, button)'),
]

const shown = (el: RdCommand): readonly string[] =>
  items(el)
    .filter((item) => item.closest('li')?.hidden === false)
    .map((item) => item.textContent ?? '')

const empty = (el: RdCommand): HTMLElement | null => el.querySelector('[part=empty]')

const press = async (
  el: RdCommand,
  target: EventTarget | null | undefined,
  key: string,
): Promise<void> => {
  target?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await el.updateComplete
}

const type = async (el: RdCommand, value: string): Promise<void> => {
  const control = input(el)
  if (control !== null) {
    control.value = value
    control.dispatchEvent(new Event('input', { bubbles: true }))
  }
  await el.updateComplete
}

beforeAll(async () => {
  document.documentElement.lang = 'ja'
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/command/command.css')
})

afterEach(() => {
  cleanupFixtures()
  vi.restoreAllMocks()
})

it('契約どおりの子があれば malformed にならず、入力欄が一覧を指す', async () => {
  const el = await fixtureOf(RdCommand, palette())
  const lists = [...el.querySelectorAll(':scope > ul')]
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(input(el)?.getAttribute('aria-controls')).toBe(lists.map((ul) => ul.id).join(' '))
  expect(lists.every((ul) => ul.id !== '')).toBe(true)
  // 項目はリンクとボタンのまま（role を書き換えない）
  expect(items(el)).toHaveLength(3)
  expect(el.querySelectorAll('[role=option]')).toHaveLength(0)
})

it('打つと当たらない <li> が隠れ、項目が全部隠れた <ul> も隠れる', async () => {
  const el = await fixtureOf(RdCommand, palette())
  await type(el, 'ノート')
  expect(shown(el)).toEqual(['新しいノート⌘N'])
  expect(el.querySelectorAll<HTMLElement>(':scope > ul')[0]?.hidden).toBe(true)
  expect(el.querySelectorAll<HTMLElement>(':scope > ul')[1]?.hidden).toBe(false)
  expect(el.matches(':state(filtering)')).toBe(true)
})

it('data-keywords でも当たる', async () => {
  const el = await fixtureOf(RdCommand, palette())
  await type(el, 'preferences')
  expect(shown(el)).toEqual(['設定'])
})

it('0 件なら [part=empty] を見せて :state(empty) になる', async () => {
  const el = await fixtureOf(RdCommand, palette())
  expect(empty(el)?.hidden).toBe(true)
  await type(el, 'みつからない')
  expect(shown(el)).toEqual([])
  expect(empty(el)?.hidden).toBe(false)
  expect(empty(el)?.getAttribute('role')).toBe('status')
  expect(empty(el)?.textContent).toBe('見つかりません')
  expect(el.matches(':state(empty)')).toBe(true)
})

it('empty-text で 0 件の文言を差し替えられる', async () => {
  const el = await fixtureOf(RdCommand, palette({ emptyText: '該当なし' }))
  await type(el, 'zzz')
  expect(empty(el)?.textContent).toBe('該当なし')
})

it('入力欄の ↓ で見えている 1 件目、↑ で最後の項目にフォーカスする', async () => {
  const el = await fixtureOf(RdCommand, palette())
  await press(el, input(el), 'ArrowDown')
  expect(document.activeElement).toBe(items(el)[0])
  await press(el, input(el), 'ArrowUp')
  expect(document.activeElement).toBe(items(el)[2])
})

it('項目の ↓ ↑ は端で折り返し、Home / End で先頭・末尾へ移る', async () => {
  const el = await fixtureOf(RdCommand, palette())
  await press(el, items(el)[0], 'ArrowDown')
  expect(document.activeElement).toBe(items(el)[1])
  await press(el, items(el)[2], 'ArrowDown')
  expect(document.activeElement).toBe(items(el)[0])
  await press(el, items(el)[0], 'End')
  expect(document.activeElement).toBe(items(el)[2])
  await press(el, items(el)[2], 'Home')
  expect(document.activeElement).toBe(items(el)[0])
})

it('項目で印字キーを押すと入力欄に戻って打ち続けられる', async () => {
  const el = await fixtureOf(RdCommand, palette())
  await type(el, 'ノ')
  await press(el, items(el)[2], 'ー')
  expect(document.activeElement).toBe(input(el))
  expect(input(el)?.value).toBe('ノー')
  await press(el, input(el), 'ArrowDown')
  await press(el, document.activeElement, 'Backspace')
  expect(document.activeElement).toBe(input(el))
  expect(input(el)?.value).toBe('ノ')
})

it('項目の Enter / Space は横取りしない（リンクの既定動作を残す）', async () => {
  const el = await fixtureOf(RdCommand, palette())
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
  items(el)[0]?.dispatchEvent(event)
  await el.updateComplete
  expect(event.defaultPrevented).toBe(false)
})

it('入力欄の Enter は見えている 1 件目を押す', async () => {
  const el = await fixtureOf(RdCommand, palette())
  const seen = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-select', seen)
  await type(el, 'ノート')
  await press(el, input(el), 'Enter')
  expect(seen).toHaveBeenCalledOnce()
  expect(seen.mock.calls[0]?.[0]).toMatchObject({
    detail: { value: 'new', label: '新しいノート⌘N' },
  })
})

it('入力欄の Esc は文字が入っているときだけ空にする', async () => {
  const el = await fixtureOf(RdCommand, palette())
  await type(el, 'ノート')
  await press(el, input(el), 'Escape')
  expect(input(el)?.value).toBe('')
  expect(shown(el)).toHaveLength(3)
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  input(el)?.dispatchEvent(event)
  await el.updateComplete
  // 空なら外側の rd-dialog に渡す
  expect(event.defaultPrevented).toBe(false)
})

it('項目を押すと rd-select が飛び、既定動作は妨げない', async () => {
  const el = await fixtureOf(RdCommand, palette())
  const seen = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-select', seen)
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  items(el)[1]?.dispatchEvent(event)
  await el.updateComplete
  expect(event.defaultPrevented).toBe(false)
  expect(seen.mock.calls[0]?.[0]).toMatchObject({
    detail: { value: '#settings', label: '設定' },
  })
})

it('filter="prefix" は前方一致で絞る', async () => {
  const el = await fixtureOf(RdCommand, palette({ filter: 'prefix' }))
  // data-keywords は 1 つの文字列として比べる（2 つ目の別名は前方一致に出てこない）
  await type(el, 'せって')
  expect(shown(el)).toEqual(['設定'])
  await type(el, 'preferences')
  expect(shown(el)).toEqual([])
})

it('filter="none" は絞らない（サーバー側で絞る利用側向け）', async () => {
  const el = await fixtureOf(RdCommand, palette({ filter: 'none' }))
  await type(el, 'zzz')
  expect(shown(el)).toHaveLength(3)
})

it('<li> を足すと絞り込みに加わる（MutationObserver）', async () => {
  const el = await fixtureOf(RdCommand, palette())
  await type(el, 'ノート')
  el.querySelector('ul')?.insertAdjacentHTML(
    'beforeend',
    commandItemMarkup({ label: 'ノートを探す', href: '#search' }),
  )
  await expect.poll(() => shown(el)).toEqual(['ノートを探す', '新しいノート⌘N'])
})

it('<ul> が無いと console.error して malformed になる', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdCommand,
    '<rd-command><label for="a">コマンド</label><input id="a" type="search"></rd-command>',
  )
  expect(spy).toHaveBeenCalledOnce()
  expect(el.matches(':state(malformed)')).toBe(true)
})
