/**
 * `patterns.css` の窓の帯（ADR-0014 / docs/brand.md §7.1）。
 * 帯 ⊃ 見出しで、左端の丸は装飾ではなく `<button>`。記号は mask の data URI（幾何だけ）。
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'postcss'
import type { Declaration, Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

const srcFile = fileURLToPath(new URL('../src/patterns.css', import.meta.url))

const css = (): string => readFileSync(srcFile, 'utf8')

const selectors = (): readonly string[] => {
  const found: string[] = []
  parse(css()).walkRules((rule: Rule) => {
    found.push(rule.selector)
  })
  return found
}

/** 指定したセレクタを持つ規則の `prop:value` を全部集める */
const declsOf = (pattern: RegExp): readonly string[] => {
  const found: string[] = []
  parse(css()).walkRules(pattern, (rule: Rule) => {
    rule.walkDecls((decl: Declaration) => {
      found.push(`${decl.prop}:${decl.value}`)
    })
  })
  return found
}

describe('patterns.css の窓の帯（ADR-0014）', () => {
  it('丸は radial-gradient の装飾ではない', () => {
    expect(css()).not.toContain('radial-gradient')
  })

  it('帯・操作の入れ物・3 つの操作ボタンの規則がある', () => {
    const all = selectors().join('\n')
    expect(all).toContain('.rd-window-bar')
    expect(all).toContain('.rd-window-controls')
    expect(all).toContain(".rd-window-control[data-action='close']")
    expect(all).toContain(".rd-window-control[data-action='expand']")
    expect(all).toContain(".rd-window-control[data-action='collapse']")
  })

  it('帯の色は帯（bar）に付ける。見出しは背景を持たない', () => {
    expect(selectors().join('\n')).toContain(".rd-window-bar[data-tone='accent']")
    expect(declsOf(/^\.rd-window-title$/)).not.toContain(
      'background:var(--rd-color-chrome-default)',
    )
  })

  it('記号は mask の data URI が 3 つ（× / □ / −）', () => {
    expect([...css().matchAll(/url\("data:image\/svg\+xml/g)]).toHaveLength(3)
    expect(declsOf(/\.rd-window-control::after/).some((decl) => decl.startsWith('mask:'))).toBe(
      true,
    )
  })

  it('強制配色でも丸は消えず ButtonFace / ButtonText で描かれる', () => {
    const forced = css().slice(css().indexOf('@media (forced-colors: active)'))
    expect(forced).toContain('ButtonFace')
    expect(forced).toContain('ButtonText')
    expect(forced).not.toContain('display: none')
  })
})

describe('patterns.css の入力とボタンの枕（.rd-input-group）', () => {
  it('枕・中の入力・末尾のボタンの規則がある', () => {
    const all = selectors().join('\n')
    expect(all).toContain('.rd-input-group')
    expect(all).toContain('.rd-input-group > input')
  })

  it('フォーカスの輪は枕ごと出す（`:has(:focus-visible)`）', () => {
    expect(selectors().join('\n')).toContain('.rd-input-group:has(:focus-visible)')
  })

  it('入力エラーは `:has(:user-invalid)` で枕に出す', () => {
    expect(selectors().join('\n')).toContain('.rd-input-group:has(:user-invalid)')
  })

  it('枕はピル（radius.full）で、塗りはグラデーションを使わない', () => {
    expect(declsOf(/^\.rd-input-group$/)).toContain('border-radius:var(--rd-radius-full)')
    expect(css()).not.toContain('linear-gradient')
  })

  it('強制配色では枕と入力に CanvasText の罫線を引く', () => {
    const forced = css().slice(css().indexOf('@media (forced-colors: active)'))
    expect(forced).toContain('.rd-input-group')
    expect(forced).toContain('CanvasText')
  })
})
