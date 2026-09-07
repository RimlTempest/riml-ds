import { describe, expect, test } from 'vitest'
import { modeGlobalTypes, themeStyle } from './modes.js'

/** 差し替え可能な表（本物のテーマ CSS を読まずに純関数だけを見る） */
const TABLE = { qrcc: '/* qrcc */', noter: '/* noter */' } as const

describe('themeStyle', () => {
  test('テーマ名に対応する CSS 文字列を返す', () => {
    expect(themeStyle('qrcc', TABLE)).toBe('/* qrcc */')
    expect(themeStyle('noter', TABLE)).toBe('/* noter */')
  })

  test('既定の riml は空文字（tokens.css そのまま）', () => {
    expect(themeStyle('riml', TABLE)).toBe('')
  })

  test('未知の値・文字列でない値も空文字', () => {
    expect(themeStyle('unknown', TABLE)).toBe('')
    expect(themeStyle(undefined, TABLE)).toBe('')
  })
})

test('ツールバーの「ブランド」は riml / qrcc / noter の 3 つ', () => {
  expect(modeGlobalTypes.theme.toolbar.items).toEqual(['riml', 'qrcc', 'noter'])
})
