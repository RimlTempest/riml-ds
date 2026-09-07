import { describe, expect, it } from 'vitest'
import {
  computeStates,
  DEFAULT_DURATION,
  nextToast,
  politenessFor,
  shouldRunTimer,
} from './toast.logic.js'

describe('nextToast', () => {
  it('tone と duration を既定で埋める', () => {
    expect(nextToast(1, { message: '保存しました' })).toEqual({
      id: 1,
      message: '保存しました',
      tone: 'info',
      duration: DEFAULT_DURATION,
    })
  })

  it('空（空白だけ）の文言は無視する', () => {
    expect(nextToast(1, { message: '   ' })).toBeUndefined()
  })

  it('duration: 0 は自動で消さない指定として残す', () => {
    expect(nextToast(2, { message: '削除しました', tone: 'danger', duration: 0 })?.duration).toBe(0)
  })
})

describe('politenessFor', () => {
  it('danger だけ割り込んで読み上げる（ADR-0008 §6）', () => {
    expect(politenessFor('danger')).toBe('assertive')
    expect(politenessFor('info')).toBe('polite')
    expect(politenessFor('success')).toBe('polite')
  })
})

describe('shouldRunTimer', () => {
  it('開いていて、止まっておらず、duration があるときだけ走らせる（WCAG 2.2.1）', () => {
    expect(shouldRunTimer({ open: true, paused: false, duration: 1000 })).toBe(true)
    expect(shouldRunTimer({ open: true, paused: true, duration: 1000 })).toBe(false)
    expect(shouldRunTimer({ open: false, paused: false, duration: 1000 })).toBe(false)
    expect(shouldRunTimer({ open: true, paused: false, duration: 0 })).toBe(false)
  })
})

describe('computeStates', () => {
  it('open と tone を :state() にする', () => {
    expect([...computeStates({ open: true, tone: 'success' })].toSorted()).toEqual([
      'open',
      'success',
    ])
    expect([...computeStates({ open: false, tone: 'success' })]).toEqual([])
  })
})
