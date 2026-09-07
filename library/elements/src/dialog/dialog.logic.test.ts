import { describe, expect, it } from 'vitest'
import {
  computeStates,
  decideClose,
  decideDialogAction,
  focusReturnTarget,
} from './dialog.logic.js'

describe('decideClose', () => {
  it('dismissible なら理由つきで閉じる', () => {
    expect(decideClose({ dismissible: true, reason: 'esc' })).toEqual({
      kind: 'close',
      reason: 'esc',
    })
    expect(decideClose({ dismissible: true, reason: 'backdrop' })).toEqual({
      kind: 'close',
      reason: 'backdrop',
    })
  })

  it('dismissible でなければ esc も backdrop も止める', () => {
    expect(decideClose({ dismissible: false, reason: 'esc' })).toEqual({ kind: 'blocked' })
    expect(decideClose({ dismissible: false, reason: 'backdrop' })).toEqual({ kind: 'blocked' })
  })

  it('api（show/close メソッド）は dismissible に関係なく閉じる', () => {
    expect(decideClose({ dismissible: false, reason: 'api' })).toEqual({
      kind: 'close',
      reason: 'api',
    })
  })
})

describe('computeStates', () => {
  it('open と malformed を :state() にする', () => {
    expect([...computeStates({ open: true, malformed: false })]).toEqual(['open'])
    expect([...computeStates({ open: true, malformed: true })]).toEqual(['malformed'])
    expect([...computeStates({ open: false, malformed: false })]).toEqual([])
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
