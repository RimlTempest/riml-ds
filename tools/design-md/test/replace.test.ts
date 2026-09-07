import { describe, expect, it } from 'vitest'
import { bodyOf, replaceFrontmatter } from '../src/core/replace.js'

const DOC = ['---', 'name: old', '---', '', '# 見出し', '', '本文はそのまま。', ''].join('\n')

describe('replaceFrontmatter', () => {
  it('フロントマターだけを差し替える', () => {
    const result = replaceFrontmatter(DOC, 'name: new\n')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value).toBe(
      ['---', 'name: new', '---', '', '# 見出し', '', '本文はそのまま。', ''].join('\n'),
    )
  })

  it('本文は 1 バイトも変わらない', () => {
    const result = replaceFrontmatter(DOC, 'a: 1\nb: 2\n')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    const before = bodyOf(DOC)
    const after = bodyOf(result.value)
    expect(before.ok && after.ok).toBe(true)
    if (!before.ok || !after.ok) {
      return
    }
    expect(after.value).toBe(before.value)
  })

  it('フロントマターが無ければ err', () => {
    const result = replaceFrontmatter('# 見出し\n', 'a: 1\n')
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error).toEqual({ kind: 'no-frontmatter' })
  })

  it('フロントマターが閉じていなければ err', () => {
    const result = replaceFrontmatter('---\nname: x\n', 'a: 1\n')
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error).toEqual({ kind: 'unterminated-frontmatter' })
  })

  it('bodyOf はフロントマターより後ろだけを返す', () => {
    const result = bodyOf(DOC)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value).toBe(['', '# 見出し', '', '本文はそのまま。', ''].join('\n'))
  })
})
