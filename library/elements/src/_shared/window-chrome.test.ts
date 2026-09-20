/**
 * 帯の見た目は部品側（`_shared/window-chrome.ts`）と CSS 側（`patterns.css`）の 2 か所にある
 * （shadow は light DOM のクラスを参照できない）。記号の data URI が**同じ文字列**であることを
 * ここで固定する（ADR-0014 決定 3）。色・寸法は VRT でしか揃わない。
 *
 * 置き場所が `library/elements/test/` ではなく `src/_shared/` なのは、`vitest.config.ts` が
 * `library/elements/test/**` を browser プロジェクトに割り当てているため（node の fs が要る）。
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { WINDOW_GLYPHS, windowChrome, windowControlLabels } from './window-chrome.js'

const cssFile = (relative: string): string =>
  fileURLToPath(new URL(`../../../../system/css/${relative}`, import.meta.url))

/** `bun run build` 後の dist を読む。無ければ src を読む */
const patternsCss = (): string => {
  const dist = cssFile('dist/patterns.css')
  return readFileSync(existsSync(dist) ? dist : cssFile('src/patterns.css'), 'utf8')
}

const glyphs = Object.values(WINDOW_GLYPHS)

/** 検査したい語そのもの。素で書くと plan 017 の完了条件（`grep -rn`）がこの検査自身に当たる */
const DECORATION = ['radial', 'gradient'].join('-')

/** `library/elements/src` の実装ファイル（テストは除く。この検査自身が語を含むため） */
const sourceFiles = (): readonly string[] => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((name) => /\.(ts|css)$/.test(name) && !name.includes('.test.'))
    .map((name) => `${root}${name}`)
}

describe('WINDOW_GLYPHS', () => {
  it('3 つの data URI が patterns.css にそのまま入っている', () => {
    const css = patternsCss()
    for (const glyph of glyphs) {
      expect(css).toContain(glyph)
    }
  })

  it('部品側の共通断片も同じ data URI を使う', () => {
    for (const glyph of glyphs) {
      expect(windowChrome.cssText).toContain(glyph)
    }
  })

  it('記号は幾何だけ（viewBox 0 0 16 16 の線）で、絵もロゴも持ち込まない', () => {
    for (const glyph of glyphs) {
      expect(glyph).toContain('data:image/svg+xml')
      expect(glyph).toContain("viewBox='0 0 16 16'")
      expect(glyph).toContain("stroke-width='2.4'")
      expect(glyph).toContain("stroke-linecap='round'")
    }
  })

  it('riml の筆致で描く（× は傾け、□ の角は大きく丸める。brand.md §7.1）', () => {
    expect(WINDOW_GLYPHS.close).toContain('rotate(8 8 8)')
    expect(WINDOW_GLYPHS.expand).toContain("width='9.6'")
    expect(WINDOW_GLYPHS.expand).toContain("rx='3'")
    expect(WINDOW_GLYPHS.expand).toContain("stroke-linejoin='round'")
    expect(WINDOW_GLYPHS.collapse).toContain("d='M4.6 8 11.4 8'")
  })

  it('丸は操作ごとに別のトークンで塗る（キャラクターの 3 色。brand.md §7.1）', () => {
    const variables = [
      '--rd-color-chrome-control-close',
      '--rd-color-chrome-control-expand',
      '--rd-color-chrome-control-collapse',
    ]
    for (const css of [windowChrome.cssText, patternsCss()]) {
      for (const variable of variables) {
        expect(css).toContain(`var(${variable})`)
      }
      // 丸の色は semantic から引く（base の palette を部品が直接読まない）
      expect(css).not.toContain('--rd-color-palette-')
    }
  })

  it('丸の間隔は --rd-window-control-gap で開ける（2 か所とも同じ既定 0）', () => {
    for (const css of [windowChrome.cssText, patternsCss()]) {
      expect(css).toMatch(/gap:\s*var\(--rd-window-control-gap\)/)
      expect(css).toMatch(/--rd-window-control-gap:\s*0/)
    }
  })

  it('丸のグラデーション装飾はもう無い', () => {
    expect(windowChrome.cssText).not.toContain(DECORATION)
    expect(patternsCss()).not.toContain(DECORATION)
  })

  it('フォーカスリングはボタン自身の outline 1 本（UA 既定を消しにいかない）', () => {
    // outline-style: auto を width 0 で消そうとしても Chromium は自前の輪を描く＝二重になる。
    // 丸の ::before に輪を描くのもやめ、負の offset でボタンの outline を丸のすぐ外へ置く
    for (const css of [windowChrome.cssText, patternsCss()]) {
      expect(css).not.toContain('outline-width: 0')
      expect(css).not.toContain('outline: none')
      expect(css).not.toContain('focus-visible::before')
      expect(css).toContain('outline-offset: calc(')
    }
  })

  it('部品側にも 1 つも残っていない（dialog / toast 含む。ADR-0014 §影響）', () => {
    const offenders = sourceFiles().filter((file) =>
      readFileSync(file, 'utf8').includes(DECORATION),
    )
    expect(offenders).toEqual([])
  })
})

const host = (lang: string | null): Parameters<typeof windowControlLabels>[0] => ({
  closest: () => (lang === null ? null : { getAttribute: () => lang }),
})

describe('windowControlLabels', () => {
  it('最も近い [lang] が無い / ja なら日本語', () => {
    expect(windowControlLabels(host(null)).close).toBe('閉じる')
    expect(windowControlLabels(host('ja-JP')).expand).toBe('広げる')
    expect(windowControlLabels(host('ja')).collapse).toBe('たたむ')
  })

  it('en なら英語', () => {
    expect(windowControlLabels(host('en-US'))).toEqual({
      close: 'Close',
      expand: 'Expand',
      collapse: 'Collapse',
    })
  })
})
