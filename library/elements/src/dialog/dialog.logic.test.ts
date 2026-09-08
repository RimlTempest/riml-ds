import { describe, expect, it } from 'vitest'
import {
  computeStates,
  decideClose,
  decideDialogAction,
  focusReturnTarget,
} from './dialog.logic.js'

describe('decideClose', () => {
  it('既定（persistent でない）なら理由つきで閉じる', () => {
    expect(decideClose({ persistent: false, alert: false, reason: 'esc' })).toEqual({
      kind: 'close',
      reason: 'esc',
    })
    expect(decideClose({ persistent: false, alert: false, reason: 'backdrop' })).toEqual({
      kind: 'close',
      reason: 'backdrop',
    })
  })

  it('persistent なら esc も backdrop も止める', () => {
    expect(decideClose({ persistent: true, alert: false, reason: 'esc' })).toEqual({
      kind: 'blocked',
    })
    expect(decideClose({ persistent: true, alert: false, reason: 'backdrop' })).toEqual({
      kind: 'blocked',
    })
  })

  it('button（帯の ×）は常に閉じる。persistent では × 自体を描かない（ADR-0014 決定 4）', () => {
    expect(decideClose({ persistent: false, alert: false, reason: 'button' })).toEqual({
      kind: 'close',
      reason: 'button',
    })
    expect(decideClose({ persistent: true, alert: false, reason: 'button' })).toEqual({
      kind: 'close',
      reason: 'button',
    })
  })

  it('api（show/close メソッド）は persistent でも閉じる', () => {
    expect(decideClose({ persistent: true, alert: false, reason: 'api' })).toEqual({
      kind: 'close',
      reason: 'api',
    })
  })

  /** WAI-APG の Alert Dialog は外側のクリックで閉じない（返事を求めるため）。Esc は閉じる */
  it('alert は背面クリックだけを止める（Esc・× ・api は効く）', () => {
    expect(decideClose({ persistent: false, alert: true, reason: 'backdrop' })).toEqual({
      kind: 'blocked',
    })
    expect(decideClose({ persistent: false, alert: true, reason: 'esc' })).toEqual({
      kind: 'close',
      reason: 'esc',
    })
    expect(decideClose({ persistent: false, alert: true, reason: 'button' })).toEqual({
      kind: 'close',
      reason: 'button',
    })
    expect(decideClose({ persistent: false, alert: true, reason: 'api' })).toEqual({
      kind: 'close',
      reason: 'api',
    })
  })

  it('alert と persistent を重ねると Esc も止まる', () => {
    expect(decideClose({ persistent: true, alert: true, reason: 'esc' })).toEqual({
      kind: 'blocked',
    })
  })
})

describe('computeStates', () => {
  it('center 以外の placement を :state() に足す（open と共存する）', () => {
    expect([...computeStates({ open: true, malformed: false, placement: 'end' })]).toEqual([
      'open',
      'end',
    ])
    expect([...computeStates({ open: false, malformed: false, placement: 'bottom' })]).toEqual([
      'bottom',
    ])
    expect([...computeStates({ open: true, malformed: false, placement: 'start' })]).toEqual([
      'open',
      'start',
    ])
  })

  it('center は state を足さない（既定なので名前を持たない）', () => {
    expect([...computeStates({ open: true, malformed: false, placement: 'center' })]).toEqual([
      'open',
    ])
  })

  it('malformed は他をすべて置き換える（まず契約を直させる）', () => {
    expect([...computeStates({ open: true, malformed: true, placement: 'end' })]).toEqual([
      'malformed',
    ])
  })

  it('open と malformed を :state() にする', () => {
    expect([...computeStates({ open: true, malformed: false, placement: 'center' })]).toEqual([
      'open',
    ])
    expect([...computeStates({ open: true, malformed: true, placement: 'center' })]).toEqual([
      'malformed',
    ])
    expect([...computeStates({ open: false, malformed: false, placement: 'center' })]).toEqual([])
  })
})

describe('focusReturnTarget', () => {
  it('開いた要素が繋がっていればそこへ、切れていればホストへ戻す', () => {
    const host = { focus: () => {}, isConnected: true }
    const opener = { focus: () => {}, isConnected: true }
    const detached = { focus: () => {}, isConnected: false }
    expect(focusReturnTarget(opener, host)).toBe(opener)
    expect(focusReturnTarget(detached, host)).toBe(host)
    expect(focusReturnTarget(null, host)).toBe(host)
  })
})

describe('decideDialogAction', () => {
  it('属性と <dialog> の実状態が食い違うときだけ操作する', () => {
    expect(decideDialogAction({ wanted: true, actual: false })).toBe('open')
    expect(decideDialogAction({ wanted: false, actual: true })).toBe('close')
    expect(decideDialogAction({ wanted: true, actual: true })).toBe('none')
    expect(decideDialogAction({ wanted: false, actual: false })).toBe('none')
  })
})
