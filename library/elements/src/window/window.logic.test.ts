import { describe, expect, it } from 'vitest'
import { computeStates, controlsFor, nextState } from './window.logic.js'

describe('controlsFor', () => {
  it('並びは左から 閉じる → 広げる → たたむ（brand.md §7.1）', () => {
    expect(controlsFor({ closable: true, expandable: true, collapsible: true })).toEqual([
      'close',
      'expand',
      'collapse',
    ])
  })

  it('使わない操作の丸は返さない（押せない丸を置かない。ADR-0014 決定 1）', () => {
    expect(controlsFor({ closable: true, expandable: false, collapsible: false })).toEqual([
      'close',
    ])
    expect(controlsFor({ closable: false, expandable: false, collapsible: true })).toEqual([
      'collapse',
    ])
    expect(controlsFor({ closable: false, expandable: false, collapsible: false })).toEqual([])
  })
})

describe('nextState', () => {
  const shut = { collapsed: false, expanded: false }

  it('たたむは押すたびに反転する', () => {
    expect(nextState(shut, { kind: 'collapse' })).toEqual({ collapsed: true, expanded: false })
    expect(nextState({ collapsed: true, expanded: false }, { kind: 'collapse' })).toEqual(shut)
  })

  it('広げるも押すたびに反転する', () => {
    expect(nextState(shut, { kind: 'expand' })).toEqual({ collapsed: false, expanded: true })
    expect(nextState({ collapsed: false, expanded: true }, { kind: 'expand' })).toEqual(shut)
  })

  it('force を渡したらその値に倒す（冪等）', () => {
    expect(nextState(shut, { kind: 'collapse', force: false })).toEqual(shut)
    expect(nextState(shut, { kind: 'expand', force: true }).expanded).toBe(true)
  })

  it('Esc は広げているときだけ戻す。たたむ状態は動かさない', () => {
    expect(nextState({ collapsed: true, expanded: true }, { kind: 'esc' })).toEqual({
      collapsed: true,
      expanded: false,
    })
    expect(nextState({ collapsed: true, expanded: false }, { kind: 'esc' })).toEqual({
      collapsed: true,
      expanded: false,
    })
  })
})

describe('computeStates', () => {
  it('collapsed / expanded / malformed をそのまま :state() にする', () => {
    expect([...computeStates({ collapsed: false, expanded: false, malformed: false })]).toEqual([])
    expect([...computeStates({ collapsed: true, expanded: true, malformed: false })]).toEqual([
      'collapsed',
      'expanded',
    ])
    expect([...computeStates({ collapsed: false, expanded: false, malformed: true })]).toEqual([
      'malformed',
    ])
  })
})
