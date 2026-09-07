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
    expect(result.value.colors['text']).toBe('{colors.neutral-800}')
    expect(result.value.colors['neutral-0']).toBe('oklch(0.99 0.005 200)')
  })

  it('typography は @google/design.md が読める dimension を出す（clamp() ではない）', () => {
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value.typography['body']?.['fontSize']).toBe('1rem')
    expect(result.value.typography['heading-1']?.['fontFamily']).toBe(
      '{typography.body.fontFamily}',
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
    // 現在の qrcc は riml-ds と同値のプレースホルダなので差は出ない
    expect(themed.value.colors).toEqual(result.value.colors)
  })

  it('theme のモード差分があればそれを使う', () => {
    // palette だけにテーマ差分を入れた検体。semantic は差分を持たないので実値のまま残る
    // （テーマは解決済みのトークンごとに記録されるため）。
    const withTheme: unknown = JSON.parse(
      JSON.stringify(tokens).replace(
        '"--rd-color-palette-accent-600"',
        '"--rd-color-palette-accent-600","modes":{"theme-qrcc":{"colorSpace":"oklch","components":[0.5,0.2,300],"alpha":1}}',
      ),
    )
    const themed = buildFrontmatter(withTheme, { ...OPTIONS, theme: 'qrcc' })
    expect(themed.ok).toBe(true)
    if (!themed.ok) {
      return
    }
    expect(themed.value.colors['accent-600']).toBe('oklch(0.5 0.2 300)')
    expect(themed.value.colors['focus']).toBe('oklch(0.42 0.09 175)')
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
