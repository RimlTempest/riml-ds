import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkContrast } from '../../src/core/contrast.js'
import type { TokenIndex } from '../../src/core/tokens.js'
import { loadTokens } from '../../src/core/tokens.js'

const document: unknown = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../../../system/tokens/dist/tokens.json', import.meta.url)),
    'utf8',
  ),
)

const loaded = loadTokens(document)
const index: TokenIndex = loaded.ok ? loaded.value : { leaves: [], byPath: new Map() }

describe('checkContrast', () => {
  // terrazzo の a11y/min-contrast と同じ contrastWCAG21 を使う。ここが割れたら
  // トークン側のゲート（bun run lint:tokens）と MCP の答えがずれている。
  it('本文 × 背景は AAA（7:1 以上）', () => {
    const result = checkContrast(index, 'color.text.default', 'color.surface.default')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value.ratio).toBeGreaterThanOrEqual(7)
    expect(result.value.aaa).toBe(true)
    expect(result.value.aa).toBe(true)
    expect(result.value.resolved.fg).toContain('oklch')
  })

  it('mode: dark ではモード別の値（$extensions["riml-ds"].modes.dark）を使う', () => {
    const light = checkContrast(index, 'color.text.default', 'color.surface.default')
    const dark = checkContrast(index, 'color.text.default', 'color.surface.default', {
      mode: 'dark',
    })
    expect(light.ok && dark.ok).toBe(true)
    if (!light.ok || !dark.ok) {
      return
    }
    expect(dark.value.ratio).not.toBe(light.value.ratio)
    expect(dark.value.aaa).toBe(true)
  })

  it('トークン名でなく生の色も受ける', () => {
    const result = checkContrast(index, '#000000', '#ffffff')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(Math.round(result.value.ratio)).toBe(21)
  })

  it('読めない色は unparsable-color で返す（throw しない）', () => {
    expect(checkContrast(index, 'color.text.nope', '#ffffff')).toEqual({
      ok: false,
      error: { kind: 'unparsable-color', value: 'color.text.nope' },
    })
  })
})
