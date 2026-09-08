import { describe, expect, it } from 'vitest'
import { computeMenuView, menuItemAttributes, triggerAttributes } from './menu.logic.js'

const base = { open: false, disabled: [false, false], label: '操作', malformed: false } as const

describe('computeMenuView', () => {
  it('閉じているときは aria-expanded="false" で :state(open) を持たない', () => {
    const view = computeMenuView(base)
    expect(view.expanded).toBe('false')
    expect([...view.states]).toEqual([])
  })

  it('開いていれば aria-expanded="true" と :state(open)', () => {
    const view = computeMenuView({ ...base, open: true })
    expect(view.expanded).toBe('true')
    expect([...view.states]).toEqual(['open'])
  })

  it('項目はすべて menuitem で tabindex="-1"（Tab では列に入らない）', () => {
    const view = computeMenuView(base)
    expect(view.items.map((item) => item.role)).toEqual(['menuitem', 'menuitem'])
    expect(view.items.map((item) => item.tabIndex)).toEqual([-1, -1])
  })

  it('disabled は aria-disabled="true"。他の項目には属性を出さない', () => {
    const view = computeMenuView({ ...base, disabled: [true, false] })
    expect(view.items.map((item) => item.ariaDisabled)).toEqual(['true', undefined])
  })

  it('label が無ければ unlabeled、契約を満たさなければ malformed', () => {
    expect([...computeMenuView({ ...base, label: '' }).states]).toEqual(['unlabeled'])
    expect([...computeMenuView({ ...base, malformed: true }).states]).toEqual(['malformed'])
  })
})

describe('menuItemAttributes', () => {
  it('undefined の aria-disabled は属性に出さない（syncAttribute が消す）', () => {
    const [enabled, disabled] = computeMenuView({ ...base, disabled: [false, true] }).items
    expect(menuItemAttributes(enabled)).toEqual({ role: 'menuitem', tabindex: '-1' })
    expect(menuItemAttributes(disabled)).toEqual({
      role: 'menuitem',
      tabindex: '-1',
      'aria-disabled': 'true',
    })
  })
})

describe('triggerAttributes', () => {
  it('トリガーは menu を持つことと開閉を伝える', () => {
    expect(triggerAttributes(computeMenuView({ ...base, open: true }))).toEqual({
      'aria-haspopup': 'menu',
      'aria-expanded': 'true',
    })
  })
})
