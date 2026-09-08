import { describe, expect, it } from 'vitest'
import { nextIndex } from './roving-focus.js'

describe('nextIndex', () => {
  it('横並びは ← → で 1 つずつ動く', () => {
    expect(nextIndex(2, 5, 'ArrowRight', 'horizontal')).toBe(3)
    expect(nextIndex(2, 5, 'ArrowLeft', 'horizontal')).toBe(1)
  })

  it('端で折り返す（最後の次は先頭、先頭の前は最後）', () => {
    expect(nextIndex(4, 5, 'ArrowRight', 'horizontal')).toBe(0)
    expect(nextIndex(0, 5, 'ArrowLeft', 'horizontal')).toBe(4)
  })

  it('Home は先頭、End は末尾（向きによらない）', () => {
    expect(nextIndex(2, 5, 'Home', 'horizontal')).toBe(0)
    expect(nextIndex(2, 5, 'End', 'horizontal')).toBe(4)
    expect(nextIndex(2, 5, 'Home', 'vertical')).toBe(0)
    expect(nextIndex(2, 5, 'End', 'vertical')).toBe(4)
  })

  it('縦並びは ↑ ↓ で動き、← → は効かない', () => {
    expect(nextIndex(2, 5, 'ArrowDown', 'vertical')).toBe(3)
    expect(nextIndex(2, 5, 'ArrowUp', 'vertical')).toBe(1)
    expect(nextIndex(2, 5, 'ArrowRight', 'vertical')).toBeUndefined()
    expect(nextIndex(2, 5, 'ArrowLeft', 'vertical')).toBeUndefined()
  })

  it('横並びで ↑ ↓ は効かない（ページのスクロールを奪わない）', () => {
    expect(nextIndex(2, 5, 'ArrowDown', 'horizontal')).toBeUndefined()
    expect(nextIndex(2, 5, 'ArrowUp', 'horizontal')).toBeUndefined()
  })

  it('関係ないキーは undefined（呼び側は preventDefault しない）', () => {
    expect(nextIndex(2, 5, 'Enter', 'horizontal')).toBeUndefined()
    expect(nextIndex(2, 5, 'a', 'vertical')).toBeUndefined()
  })

  it('項目が無いときは動かない', () => {
    expect(nextIndex(0, 0, 'ArrowRight', 'horizontal')).toBeUndefined()
    expect(nextIndex(0, 0, 'Home', 'vertical')).toBeUndefined()
  })

  it('どこにも居ない（範囲外）なら最初の矢印で先頭に入る', () => {
    expect(nextIndex(-1, 3, 'ArrowRight', 'horizontal')).toBe(0)
    expect(nextIndex(-1, 3, 'ArrowLeft', 'horizontal')).toBe(0)
    expect(nextIndex(9, 3, 'ArrowRight', 'horizontal')).toBe(0)
  })
})
