import { describe, expect, it } from 'vitest'
import { emptyQueue, nextAnnouncement } from './live-region.logic.js'

const NBSP = '\u00a0'

describe('nextAnnouncement', () => {
  it('空文字は無視する（同じキューをそのまま返す）', () => {
    expect(nextAnnouncement(emptyQueue, '', 'polite')).toBe(emptyQueue)
    expect(nextAnnouncement(emptyQueue, '   ', 'assertive')).toBe(emptyQueue)
  })

  it('politeness ごとに別のノードへ入れる', () => {
    const polite = nextAnnouncement(emptyQueue, '保存しました', 'polite')
    expect(polite).toEqual({ polite: '保存しました', assertive: '' })
    expect(nextAnnouncement(polite, '保存できません', 'assertive')).toEqual({
      polite: '保存しました',
      assertive: '保存できません',
    })
  })

  it('同じ文言が続いたら末尾の nbsp を交互に付け外しして読み直させる', () => {
    const first = nextAnnouncement(emptyQueue, '保存しました', 'polite')
    const second = nextAnnouncement(first, '保存しました', 'polite')
    expect(second.polite).toBe(`保存しました${NBSP}`)
    const third = nextAnnouncement(second, '保存しました', 'polite')
    expect(third.polite).toBe('保存しました')
  })

  it('違う文言はそのまま置き換える', () => {
    const first = nextAnnouncement(emptyQueue, '保存しました', 'polite')
    expect(nextAnnouncement(first, '削除しました', 'polite').polite).toBe('削除しました')
  })
})
