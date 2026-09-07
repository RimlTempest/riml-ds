import { describe, expect, it } from 'vitest'
import { initialSelection, isSelected } from './select.logic.js'

describe('isSelected', () => {
  it('placeholder（value="")を選んでいる間は未選択とみなす', () => {
    expect(isSelected('')).toBe(false)
    expect(isSelected('jp')).toBe(true)
  })
})

describe('initialSelection', () => {
  it('value 属性が空なら何もしない（HTML の selected を壊さない）', () => {
    expect(initialSelection('')).toBeUndefined()
    expect(initialSelection('jp')).toBe('jp')
  })
})
