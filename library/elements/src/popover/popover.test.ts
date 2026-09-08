import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanupFixtures, fixtureOf, loadStyle } from '../../test/fixture.js'
import { markup } from './popover.contract.js'
// rd-popover を登録するための副作用 import（package.json の sideEffects に載っている）
// oxlint-disable-next-line import/no-unassigned-import
import './popover.define.js'
import { RdPopover } from './popover.element.js'

const FIXTURE = markup({
  id: 'filters',
  label: '絞り込み',
  children: '<p>条件を選ぶ。</p><button type="button" id="apply">適用</button>',
})

const triggerOf = (el: RdPopover): HTMLElement | undefined => {
  const button = el.querySelector('[slot=trigger] button')
  return button instanceof HTMLElement ? button : undefined
}

const panelOf = (el: RdPopover): HTMLElement | undefined => {
  const panel = el.querySelector('[popover]')
  return panel instanceof HTMLElement ? panel : undefined
}

const open = async (el: RdPopover): Promise<void> => {
  triggerOf(el)?.click()
  await vi.waitFor(() => {
    expect(el.matches(':state(open)')).toBe(true)
  })
  await el.updateComplete
}

beforeAll(async () => {
  await loadStyle('/system/tokens/dist/tokens.css')
  await loadStyle('/library/elements/src/popover/popover.css')
})

afterEach(() => {
  cleanupFixtures()
})

it('契約どおりの子があれば malformed にならない', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  expect(el.matches(':state(malformed)')).toBe(false)
  expect(el.matches(':state(unlabeled)')).toBe(false)
})

it('[popover] は非モーダルの dialog で、見出しが名前になる', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  const panel = panelOf(el)
  expect(panel?.getAttribute('role')).toBe('dialog')
  const heading = el.querySelector('[slot=label]')
  expect(heading?.id).not.toBe('')
  expect(panel?.getAttribute('aria-labelledby')).toBe(heading?.id)
})

it('トリガーは aria-haspopup="dialog" と aria-expanded を持つ', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  expect(triggerOf(el)?.getAttribute('aria-haspopup')).toBe('dialog')
  expect(triggerOf(el)?.getAttribute('aria-expanded')).toBe('false')
  await open(el)
  expect(triggerOf(el)?.getAttribute('aria-expanded')).toBe('true')
})

it('開くと最初のフォーカス可能な要素へ移る', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  await open(el)
  expect(panelOf(el)?.matches(':popover-open')).toBe(true)
  expect(document.activeElement).toBe(el.querySelector('#apply'))
})

it('押せるものが無ければ [popover] 自身へフォーカスする', async () => {
  const el = await fixtureOf(
    RdPopover,
    markup({ id: 'note', label: '注意', children: '<p>読むだけ。</p>' }),
  )
  await open(el)
  expect(document.activeElement).toBe(panelOf(el))
})

it('閉じるとトリガーへフォーカスが戻る', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  await open(el)
  panelOf(el)?.hidePopover()
  await vi.waitFor(() => {
    expect(el.matches(':state(open)')).toBe(false)
  })
  expect(document.activeElement).toBe(triggerOf(el))
})

it('開閉のたびに rd-toggle が出る', async () => {
  const el = await fixtureOf(RdPopover, FIXTURE)
  const listener = vi.fn<(event: Event) => void>()
  el.addEventListener('rd-toggle', listener)
  await open(el)
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { open: true } }))
  panelOf(el)?.hidePopover()
  await vi.waitFor(() => {
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { open: false } }))
  })
})

it('見出しが無いと unlabeled と console.error', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdPopover,
    '<rd-popover><rd-button slot="trigger"><button type="button" popovertarget="p">開く</button>'
      + '</rd-button><div popover id="p"><p>本文</p></div></rd-popover>',
  )
  expect(el.matches(':state(unlabeled)')).toBe(true)
  expect(error).toHaveBeenCalled()
  error.mockRestore()
})

it('[popover] が無ければ malformed と console.error', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const el = await fixtureOf(
    RdPopover,
    '<rd-popover><rd-button slot="trigger"><button type="button">開く</button></rd-button></rd-popover>',
  )
  expect(el.matches(':state(malformed)')).toBe(true)
  expect(error).toHaveBeenCalled()
  error.mockRestore()
})
