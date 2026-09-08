import { describe, expect, it } from 'vitest'
import { computePopoverView, panelAttributes, triggerAttributes } from './popover.logic.js'

const base = { open: false, labeled: true, malformed: false } as const

describe('computePopoverView', () => {
  it('閉じているときは aria-expanded="false" で状態を持たない', () => {
    const view = computePopoverView(base)
    expect(view.expanded).toBe('false')
    expect([...view.states]).toEqual([])
  })

  it('開いていれば aria-expanded="true" と :state(open)', () => {
    expect([...computePopoverView({ ...base, open: true }).states]).toEqual(['open'])
  })

  it('見出しが無ければ unlabeled、契約を満たさなければ malformed', () => {
    expect([...computePopoverView({ ...base, labeled: false }).states]).toEqual(['unlabeled'])
    expect([...computePopoverView({ ...base, malformed: true }).states]).toEqual(['malformed'])
  })
})

describe('panelAttributes', () => {
  it('非モーダルの dialog。見出しを名前にし、中身が空でも入れるよう tabindex を持つ', () => {
    expect(panelAttributes('rd-popover-1-label')).toEqual({
      role: 'dialog',
      'aria-labelledby': 'rd-popover-1-label',
      tabindex: '-1',
    })
  })

  it('見出しが無ければ aria-labelledby を出さない（存在しない id を指さない）', () => {
    expect(panelAttributes('')).toEqual({ role: 'dialog', tabindex: '-1' })
  })
})

describe('triggerAttributes', () => {
  it('トリガーは dialog を持つことと開閉を伝える', () => {
    expect(triggerAttributes(computePopoverView({ ...base, open: true }))).toEqual({
      'aria-haspopup': 'dialog',
      'aria-expanded': 'true',
    })
  })
})
