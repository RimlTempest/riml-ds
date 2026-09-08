import { afterEach, expect, it, vi } from 'vitest'
import { cleanupFixtures } from '../../test/fixture.js'
import { applyMenuAttrs, focusNextItem, reportMissing, resolveItem, wireIds } from './menu.dom.js'
import { computeMenuView } from './menu.logic.js'

/** `[popover]` の中に押せる項目を並べた素の DOM（element を通さず dom.ts だけを見る） */
const scaffold = (): {
  readonly list: HTMLElement
  readonly trigger: HTMLElement
  readonly items: readonly HTMLElement[]
} => {
  const host = document.createElement('div')
  host.innerHTML =
    '<button type="button">操作</button>'
    + '<div popover><a href="#a"><span>複製</span></a><button type="button">削除</button>'
    + '<span aria-disabled="true">書き出し</span></div>'
  document.body.append(host)
  const trigger = host.querySelector('button')
  const list = host.querySelector('[popover]')
  if (!(trigger instanceof HTMLElement) || !(list instanceof HTMLElement)) {
    throw new Error('scaffold: trigger と [popover] が必要')
  }
  // 閉じた `[popover]` は display: none でフォーカスを受け取れないので開いておく
  list.showPopover()
  const items = [...list.children].filter((node) => node instanceof HTMLElement)
  return { list, trigger, items }
}

afterEach(() => {
  cleanupFixtures()
})

it('wireIds は空の id を埋め、popovertarget をリストに向ける', () => {
  const { list, trigger } = scaffold()
  wireIds(list, trigger, 'rd-menu-9')
  expect(list.id).toBe('rd-menu-9')
  expect(trigger.id).toBe('rd-menu-9-trigger')
  expect(trigger.getAttribute('popovertarget')).toBe('rd-menu-9')
})

it('wireIds は利用側が書いた id と popovertarget をそのまま尊重する', () => {
  const { list, trigger } = scaffold()
  list.id = 'mine'
  trigger.id = 'my-trigger'
  trigger.setAttribute('popovertarget', 'mine')
  wireIds(list, trigger, 'rd-menu-9')
  expect(list.id).toBe('mine')
  expect(trigger.id).toBe('my-trigger')
  expect(trigger.getAttribute('popovertarget')).toBe('mine')
})

it('resolveItem は押せる祖先をたどって項目の番号を返す', () => {
  const { items } = scaffold()
  const inner = items[0]?.querySelector('span')
  const event = new MouseEvent('click', { bubbles: true })
  inner?.dispatchEvent(event)
  expect(resolveItem(event, items)).toBe(0)
})

it('resolveItem は aria-disabled の項目も番号で返す（押せるかは呼び側が決める）', () => {
  const { items } = scaffold()
  const event = new MouseEvent('click', { bubbles: true })
  items[2]?.dispatchEvent(event)
  expect(resolveItem(event, items)).toBe(2)
})

it('resolveItem は項目の外を押したとき -1 を返す', () => {
  const { list, items } = scaffold()
  const event = new MouseEvent('click', { bubbles: true })
  list.dispatchEvent(event)
  expect(resolveItem(event, items)).toBe(-1)
})

it('focusNextItem は ↓ で次へ移し、既定を止める', () => {
  const { items } = scaffold()
  const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })
  items[0]?.dispatchEvent(event)
  focusNextItem(event, items)
  expect(document.activeElement).toBe(items[1])
  expect(event.defaultPrevented).toBe(true)
})

it('focusNextItem は Home で先頭へ移す', () => {
  const { items } = scaffold()
  const event = new KeyboardEvent('keydown', { key: 'Home', cancelable: true })
  items[1]?.dispatchEvent(event)
  focusNextItem(event, items)
  expect(document.activeElement).toBe(items[0])
})

it('focusNextItem は扱わないキーでは何もしない（既定を止めない）', () => {
  const { items } = scaffold()
  items[0]?.focus()
  const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
  items[0]?.dispatchEvent(event)
  focusNextItem(event, items)
  expect(document.activeElement).toBe(items[0])
  expect(event.defaultPrevented).toBe(false)
})

it('applyMenuAttrs は role / aria-labelledby / 各項目の menuitem を書き写す', () => {
  const { list, trigger, items } = scaffold()
  trigger.id = 'my-trigger'
  const view = computeMenuView({
    open: true,
    disabled: [false, false, true],
    label: '操作',
    malformed: false,
  })
  applyMenuAttrs({ trigger, list, items }, view)
  expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  expect(list.getAttribute('role')).toBe('menu')
  expect(list.getAttribute('aria-labelledby')).toBe('my-trigger')
  expect(items.map((item) => item.getAttribute('role'))).toEqual([
    'menuitem',
    'menuitem',
    'menuitem',
  ])
  expect(items[2]?.getAttribute('aria-disabled')).toBe('true')
})

it('reportMissing は契約と label の不足を 1 つの console.error にまとめる', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  reportMissing({ kind: 'missing', roles: ['list'] }, '')
  expect(error).toHaveBeenCalledTimes(1)
  expect(String(error.mock.calls[0]?.[0])).toContain('label')
  error.mockRestore()
})

it('reportMissing は揃っていれば何も言わない', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  reportMissing({ kind: 'ok', found: {} }, '操作')
  expect(error).not.toHaveBeenCalled()
  error.mockRestore()
})
