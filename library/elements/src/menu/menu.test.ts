import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { markup as selectMarkup } from '../select/select.contract.js'
// rd-menu / rd-select を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import '../select/select.define.js'
import { markup, menuItemMarkup } from './menu.contract.js'
// oxlint-disable-next-line import/no-unassigned-import
import './menu.define.js'
import { RdMenu } from './menu.element.js'

const FIXTURE = markup({
  id: 'row-actions',
  label: '操作',
  items:
    // テストの中ではページ内リンクにする（実パスだとブラウザが本当に遷移してしまう）
    menuItemMarkup({ label: '複製', href: '#duplicate' })
    + menuItemMarkup({ label: '削除', separated: true })
    + menuItemMarkup({ label: '書き出し', disabled: true }),
})

const itemsOf = (el: RdMenu): readonly HTMLElement[] =>
  [...el.querySelectorAll('[popover] > :is(a[href], button, [aria-disabled])')].filter(
    (node) => node instanceof HTMLElement,
  )

const triggerOf = (el: RdMenu): HTMLElement | undefined => {
  const button = el.querySelector('[slot=trigger] button')
  return button instanceof HTMLElement ? button : undefined
}

const listOf = (el: RdMenu): HTMLElement | undefined => {
  const list = el.querySelector('[popover]')
  return list instanceof HTMLElement ? list : undefined
}

const open = async (el: RdMenu): Promise<void> => {
  triggerOf(el)?.click()
  await vi.waitFor(() => {
    expect(el.matches(':state(open)')).toBe(true)
  })
  await el.updateComplete
}

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/menu/menu.css')
})

afterEach(() => {
  cleanupFixtures()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(RdMenu, FIXTURE)
  expect(el.matches(':state(malformed)')).toBe(false)
})

it('[popover] 自身が menu で、項目は menuitem として直接ぶら下がる', async () => {
  const el = await fixtureOf(RdMenu, FIXTURE)
  const list = listOf(el)
  expect(list?.getAttribute('role')).toBe('menu')
  expect(list?.getAttribute('aria-labelledby')).toBe(triggerOf(el)?.id)
  expect(triggerOf(el)?.id).not.toBe('')
  const items = itemsOf(el)
  expect(items.map((item) => item.getAttribute('role'))).toEqual([
    'menuitem',
    'menuitem',
    'menuitem',
  ])
  expect(items.map((item) => item.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1'])
  // <li> を挟まない（role="menu" は menuitem を直接持つ必要がある）
  expect(el.querySelectorAll('li')).toHaveLength(0)
})

it('トリガーは aria-haspopup="menu" と aria-expanded を持つ', async () => {
  const el = await fixtureOf(RdMenu, FIXTURE)
  expect(triggerOf(el)?.getAttribute('aria-haspopup')).toBe('menu')
  expect(triggerOf(el)?.getAttribute('aria-expanded')).toBe('false')
  await open(el)
  expect(triggerOf(el)?.getAttribute('aria-expanded')).toBe('true')
})

it('popovertarget（HTML だけ）で開き、最初の項目にフォーカスが移る', async () => {
  const el = await fixtureOf(RdMenu, FIXTURE)
  await open(el)
  expect(listOf(el)?.matches(':popover-open')).toBe(true)
  expect(document.activeElement).toBe(itemsOf(el)[0])
})

it('↓ で次の項目へ、Home で先頭へ（roving tabindex）', async () => {
  const el = await fixtureOf(RdMenu, FIXTURE)
  await open(el)
  const items = itemsOf(el)
  items[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
  expect(document.activeElement).toBe(items[1])
  items[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
  expect(document.activeElement).toBe(items[0])
})

it('閉じるとトリガーへフォーカスが戻る', async () => {
  const el = await fixtureOf(RdMenu, FIXTURE)
  await open(el)
  listOf(el)?.hidePopover()
  await vi.waitFor(() => {
    expect(el.matches(':state(open)')).toBe(false)
  })
  expect(document.activeElement).toBe(triggerOf(el))
})

it('項目を押すと閉じて rd-select が出る（リンクは preventDefault しない）', async () => {
  const el = await fixtureOf(RdMenu, FIXTURE)
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-select', listener)
  await open(el)
  const clicked = itemsOf(el)[0]
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  clicked?.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
  expect(listener).toHaveBeenCalledWith(
    expect.objectContaining({ detail: { index: 0, href: '#duplicate' } }),
  )
  await vi.waitFor(() => {
    expect(el.matches(':state(open)')).toBe(false)
  })
})

it('aria-disabled の項目は押しても rd-select を出さない（フォーカスは残る）', async () => {
  const el = await fixtureOf(RdMenu, FIXTURE)
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-select', listener)
  await open(el)
  const disabled = itemsOf(el)[2]
  expect(disabled?.getAttribute('aria-disabled')).toBe('true')
  expect(disabled?.hasAttribute('disabled')).toBe(false)
  disabled?.click()
  expect(listener).not.toHaveBeenCalled()
})

it('イベント名 rd-select は rd-select 要素の change と衝突しない', async () => {
  const el = await fixtureOf(RdMenu, FIXTURE)
  const host = document.createElement('div')
  host.innerHTML = selectMarkup({
    id: 'country',
    label: '国',
    name: 'country',
    children: '<option value="jp">日本</option><option value="us">アメリカ</option>',
  })
  document.body.append(host)
  const listener = vi.fn<(event: Event) => void>()
  document.addEventListener('rd-select', listener)
  // <rd-select> が出すのはネイティブの change（透過）。同名の CustomEvent は出さない
  host.querySelector('select')?.dispatchEvent(new Event('change', { bubbles: true }))
  expect(listener).not.toHaveBeenCalled()
  await open(el)
  itemsOf(el)[0]?.click()
  expect(listener).toHaveBeenCalledTimes(1)
  document.removeEventListener('rd-select', listener)
})

it('label が無いと unlabeled と console.error', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdMenu,
    markup({ id: 'm', label: '', items: menuItemMarkup({ label: '削除' }) }),
  )
  expect(el.matches(':state(unlabeled)')).toBe(true)
  expect(error).toHaveBeenCalled()
  error.mockRestore()
})

it('[popover] が無ければ malformed と console.error', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdMenu,
    '<rd-menu label="操作"><rd-button slot="trigger"><button type="button">操作</button></rd-button></rd-menu>',
  )
  expect(el.matches(':state(malformed)')).toBe(true)
  expect(error).toHaveBeenCalled()
  error.mockRestore()
})

it('項目の当たり判定が 44px 以上ある', async () => {
  const el = await fixtureOf(RdMenu, FIXTURE)
  await open(el)
  expect(itemsOf(el)[0]?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
})
