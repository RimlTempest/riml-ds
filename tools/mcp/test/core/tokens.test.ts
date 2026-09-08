import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { TokenIndex } from '../../src/core/tokens.js'
import { getToken, loadTokens, searchTokens } from '../../src/core/tokens.js'

const document: unknown = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../../../system/tokens/dist/tokens.json', import.meta.url)),
    'utf8',
  ),
)

const loaded = loadTokens(document)
const index: TokenIndex = loaded.ok ? loaded.value : { leaves: [], byPath: new Map() }

describe('loadTokens', () => {
  it('DTCG の入れ子から葉だけを平らにし、生成物の 110 トークンを全部拾う', () => {
    expect(loaded.ok).toBe(true)
    expect(index.leaves).toHaveLength(110)
  })

  it('ドキュメントでないものは not-a-document で返す（throw しない）', () => {
    expect(loadTokens('color.text.default')).toEqual({
      ok: false,
      error: { kind: 'not-a-document', received: 'string' },
    })
  })
})

describe('getToken', () => {
  it('値・説明・CSS 変数名・モード別の値を返す', () => {
    const token = getToken(index, 'color.text.default')
    expect(token?.cssVar).toBe('--rd-color-text-default')
    expect(token?.type).toBe('color')
    expect(token?.description).toContain('文字色')
    expect(Object.keys(token?.modes ?? {})).toContain('dark')
  })

  it('無いパスは undefined', () => {
    expect(getToken(index, 'color.text.nope')).toBeUndefined()
  })
})

describe('searchTokens', () => {
  it('パスの部分一致で引ける', () => {
    expect(searchTokens(index, 'surface').map((hit) => hit.path)).toContain('color.surface.raised')
  })

  it('日本語の同義語（本文）から色のトークンに辿り着ける', () => {
    expect(searchTokens(index, '本文の色')[0]?.path).toBe('color.text.default')
  })
})
