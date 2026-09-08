import { describe, expect, it } from 'vitest'
import {
  computeMenuView,
  contextPosition,
  menuItemAttributes,
  triggerAttributes,
} from './menu.logic.js'

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

describe('contextPosition', () => {
  const popover = { width: 200, height: 120 }
  const viewport = { width: 1000, height: 800 }

  it('ポインタの右下に出る', () => {
    expect(contextPosition({ x: 300, y: 200 }, popover, viewport)).toEqual({ top: 200, left: 300 })
  })

  it('下に入らなければ上へ倒れる', () => {
    expect(contextPosition({ x: 300, y: 760 }, popover, viewport)).toEqual({ top: 640, left: 300 })
  })

  it('右端では画面の中に収まるまで左へ寄る', () => {
    expect(contextPosition({ x: 950, y: 200 }, popover, viewport).left).toBe(800)
  })

  it('画面より大きい重ね物でも負の位置には出さない', () => {
    expect(contextPosition({ x: 10, y: 10 }, { width: 1200, height: 60 }, viewport).left).toBe(0)
  })
})
