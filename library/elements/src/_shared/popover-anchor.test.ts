import { describe, expect, it } from 'vitest'
import { computeAnchorStyle } from './popover-anchor.js'

const viewport = { width: 1000, height: 800 }
/** 画面の左上あたりに置いたトリガー（下にも上にも余白がある） */
const trigger = { top: 100, left: 200, width: 120, height: 40 }
const popover = { width: 200, height: 300 }

describe('computeAnchorStyle', () => {
  it('下に入るならトリガーの下端に置く', () => {
    const style = computeAnchorStyle({ trigger, popover, viewport })
    expect(style.top).toBe(140)
    expect(style.left).toBe(200)
  })

  it('下に入らなければトリガーの上に置く', () => {
    const low = { ...trigger, top: 700 }
    expect(computeAnchorStyle({ trigger: low, popover, viewport }).top).toBe(400)
  })

  it('上にも下にも入らないときは下のまま（画面内に丸める）', () => {
    const tall = { width: 200, height: 900 }
    const style = computeAnchorStyle({ trigger, popover: tall, viewport })
    expect(style.top).toBe(140)
  })

  it("placement: 'end' はトリガーの終端に右端を揃える", () => {
    const style = computeAnchorStyle({ trigger, popover, viewport, placement: 'end' })
    expect(style.left).toBe(120)
  })

  it('画面からはみ出す left は 0 に丸める', () => {
    const edge = { top: 100, left: 10, width: 40, height: 40 }
    const style = computeAnchorStyle({ trigger: edge, popover, viewport, placement: 'end' })
    expect(style.left).toBe(0)
  })

  it('画面の右にはみ出す left は右端に寄せる', () => {
    const edge = { top: 100, left: 950, width: 40, height: 40 }
    const style = computeAnchorStyle({ trigger: edge, popover, viewport })
    expect(style.left).toBe(800)
  })

  it("side: 'block-start' は上を先に試す（tooltip の既定）", () => {
    const small = { width: 200, height: 60 }
    expect(computeAnchorStyle({ trigger, popover: small, viewport, side: 'block-start' }).top).toBe(
      40,
    )
  })

  it("side: 'block-start' でも上に入らなければ下へ落ちる", () => {
    expect(computeAnchorStyle({ trigger, popover, viewport, side: 'block-start' }).top).toBe(140)
  })
})
