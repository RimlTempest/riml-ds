import { describe, expect, it } from 'vitest'
import {
  computePopoverView,
  hoverTimings,
  panelAttributes,
  shouldCloseOnLeave,
  triggerAttributes,
} from './popover.logic.js'

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

describe('hoverTimings', () => {
  it('開くほうが閉じるより長く待つ（通り過ぎただけでは開かない）', () => {
    expect(hoverTimings.open).toBeGreaterThan(hoverTimings.close)
    expect(hoverTimings.close).toBeGreaterThan(0)
  })
})

// `contains` だけを見る純関数なので、実 DOM が無くても行き先を文字列で表せる
const boxOf = (...members: readonly string[]) => ({
  contains: (node: string | undefined) => node !== undefined && members.includes(node),
})

describe('shouldCloseOnLeave', () => {
  const panel = boxOf('panel', 'link-in-panel')
  const trigger = boxOf('trigger')

  it('行き先が面の中なら閉じない（トリガーから面へ渡る途中）', () => {
    expect(shouldCloseOnLeave('link-in-panel', panel, trigger)).toBe(false)
    expect(shouldCloseOnLeave('panel', panel, trigger)).toBe(false)
  })

  it('行き先がトリガーなら閉じない（面からトリガーへ戻る途中）', () => {
    expect(shouldCloseOnLeave('trigger', panel, trigger)).toBe(false)
  })

  it('行き先が外なら閉じる', () => {
    expect(shouldCloseOnLeave('elsewhere', panel, trigger)).toBe(true)
  })

  it('行き先が無ければ（ページの外へ抜けた）閉じる', () => {
    expect(shouldCloseOnLeave(undefined, panel, trigger)).toBe(true)
  })

  it('契約を満たさず面もトリガーも無ければ閉じる', () => {
    expect(shouldCloseOnLeave('link-in-panel', undefined, undefined)).toBe(true)
  })
})
