import { describe, expect, it } from 'vitest'
import { computeTooltipView, parseDelay } from './tooltip.logic.js'

describe('computeTooltipView', () => {
  it('表示中は open、対象が見つからなければ orphan', () => {
    expect([...computeTooltipView({ open: true, orphan: false }).states]).toEqual(['open'])
    expect([...computeTooltipView({ open: false, orphan: false }).states]).toEqual([])
    expect([...computeTooltipView({ open: false, orphan: true }).states]).toEqual(['orphan'])
  })

  it('対象が無ければ開かない（orphan が open に勝つ）', () => {
    const view = computeTooltipView({ open: true, orphan: true })
    expect([...view.states]).toEqual(['orphan'])
    expect(view.visible).toBe(false)
  })

  it('対象があって開いていれば見える', () => {
    expect(computeTooltipView({ open: true, orphan: false }).visible).toBe(true)
    expect(computeTooltipView({ open: false, orphan: false }).visible).toBe(false)
  })
})

describe('parseDelay', () => {
  it('ms と s の CSS 時間を読む', () => {
    expect(parseDelay('300ms', 400)).toBe(300)
    expect(parseDelay(' 0.25s ', 400)).toBe(250)
    expect(parseDelay('0s', 400)).toBe(0)
  })

  it('空・単位なし・負の値は既定に落とす', () => {
    expect(parseDelay('', 400)).toBe(400)
    expect(parseDelay('300', 400)).toBe(400)
    expect(parseDelay('-1s', 400)).toBe(400)
    expect(parseDelay('とても長い', 400)).toBe(400)
  })
})
