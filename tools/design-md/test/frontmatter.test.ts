import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildFrontmatter } from '../src/core/frontmatter.js'

const tokens: unknown = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../../system/tokens/dist/tokens.json', import.meta.url)),
    'utf8',
  ),
)

const OPTIONS = { name: 'riml-ds', description: '説明' }

// plan 002 より前に DESIGN.md が手書きで持っていたキー。生成物がこれを欠いたら退行。
const EXPECTED = {
  colors: [
    'neutral-0',
    'neutral-100',
    'neutral-200',
    'neutral-300',
    'neutral-500',
    'neutral-600',
    'neutral-800',
    'neutral-900',
    'accent-400',
    'accent-600',
    'accent-700',
    'danger-600',
    'warning-600',
    'success-600',
    'info-600',
    'surface',
    'surface-raised',
    'text',
    'text-muted',
    'border',
    'focus',
  ],
  typography: ['body', 'heading-1', 'heading-2', 'small', 'mono'],
  spacing: ['1', '2', '3', '4', '6', '8', '12', '16'],
  rounded: ['sm', 'md', 'lg', 'full'],
  sizing: ['target-min', 'focus-ring-width', 'focus-ring-offset', 'measure-max'],
  motion: ['duration-fast', 'duration-base', 'easing-standard'],
} as const

describe('buildFrontmatter', () => {
  const result = buildFrontmatter(tokens, OPTIONS)

  it('dist/tokens.json から写せる', () => {
    expect(result.ok).toBe(true)
  })

  it.each(Object.entries(EXPECTED))('%s の既存キーをすべて含む', (section, keys) => {
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    const values: Record<string, unknown> = { ...result.value }
    const actual = values[section]
    expect(actual).toBeDefined()
    expect(Object.keys(actual ?? {})).toEqual(expect.arrayContaining([...keys]))
  })

  it('semantic の色は palette への参照で書く', () => {
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value.colors['surface']).toBe('{colors.neutral-0}')
    expect(result.value.colors['text']).toBe('{colors.neutral-700}')
    expect(result.value.colors['neutral-0']).toBe('oklch(0.9701 0.0181 78.24)')
  })

  it('typography は @google/design.md が読める dimension を出す（clamp() ではない）', () => {
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value.typography['body']?.['fontSize']).toBe('1rem')
    // 見出しは丸ゴシック系の display スタック。本文と別 family なので実値が出る
    expect(String(result.value.typography['heading-1']?.['fontFamily'])).toContain(
      "'Zen Maru Gothic'",
    )
    expect(String(result.value.typography['body']?.['fontFamily'])).toContain("'Segoe UI'")
  })

  it('sizing と motion は単位付きの文字列になる', () => {
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value.sizing['target-min']).toBe('2.75rem')
    expect(result.value.sizing['measure-max']).toBe('80ch')
    expect(result.value.motion['duration-fast']).toBe('120ms')
    expect(result.value.motion['easing-standard']).toBe('cubic-bezier(0.2, 0, 0, 1)')
  })

  it('--theme を渡すと $extensions.riml-ds.modes["theme-<名前>"] を優先する', () => {
    const themed = buildFrontmatter(tokens, { ...OPTIONS, theme: 'qrcc' })
    expect(themed.ok).toBe(true)
    if (!themed.ok || !result.ok) {
      return
    }
    // qrcc の accent は青（hue 255）。既定の riml の青（hue 260.53）から差し替わる
    expect(themed.value.colors['accent-600']).toBe('oklch(0.44 0.16 255)')
    expect(result.value.colors['accent-600']).toBe('oklch(0.42 0.0911 260.53)')
    // qrcc の info は青系（hue 240）。既定の青緑（hue 200）から差し替わる
    expect(themed.value.colors['info-600']).toBe('oklch(0.42 0.1 240)')
    expect(result.value.colors['info-600']).toBe('oklch(0.42 0.07 200)')
    // qrcc が既定と同じ値を持つ色（warning）は既定のまま
    expect(themed.value.colors['warning-600']).toBe(result.value.colors['warning-600'])
  })

  it('theme のモード差分があればそれを使う', () => {
    // accent-600 には実物の theme-qrcc がある。"modes" を前に差し込んでも JSON の
    // パースで後ろの実物が勝つので、その theme-qrcc の値だけを差し替えた検体を作る。
    const source = JSON.stringify(tokens)
    const patched = source.replace(
      /("cssVar":"--rd-color-palette-accent-600","modes":\{)"theme-qrcc":\{[^}]*\}/,
      '$1"theme-qrcc":{"colorSpace":"oklch","components":[0.5,0.2,300],"alpha":1}',
    )
    expect(patched).not.toBe(source)
    const withTheme: unknown = JSON.parse(patched)
    const themed = buildFrontmatter(withTheme, { ...OPTIONS, theme: 'qrcc' })
    expect(themed.ok).toBe(true)
    if (!themed.ok) {
      return
    }
    expect(themed.value.colors['accent-600']).toBe('oklch(0.5 0.2 300)')
    // theme-qrcc のモードを持たないトークン（qrcc の warning は既定と同値）は既定のまま
    expect(themed.value.colors['warning-600']).toBe('oklch(0.42 0.09 75)')
    // semantic は palette と値が一致しなくなれば参照ではなく実値で残る
    expect(themed.value.colors['focus']).toBe('oklch(0.44 0.16 255)')
  })

  it('トークンが足りなければ err（missing-token）', () => {
    const result2 = buildFrontmatter({}, OPTIONS)
    expect(result2.ok).toBe(false)
    if (result2.ok) {
      return
    }
    expect(result2.error).toEqual({ kind: 'missing-token', id: 'color.surface.default' })
  })

  it('文書でなければ err（not-a-document）', () => {
    const result2 = buildFrontmatter('nope', OPTIONS)
    expect(result2.ok).toBe(false)
    if (result2.ok) {
      return
    }
    expect(result2.error).toEqual({ kind: 'not-a-document', received: 'string' })
  })
})
