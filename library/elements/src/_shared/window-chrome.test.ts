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
      expect(glyph).toContain("stroke-width='2'")
      expect(glyph).toContain("stroke-linecap='round'")
    }
  })

  it('丸のグラデーション装飾はもう無い', () => {
    expect(windowChrome.cssText).not.toContain(DECORATION)
    expect(patternsCss()).not.toContain(DECORATION)
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
