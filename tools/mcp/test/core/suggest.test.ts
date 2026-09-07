import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { suggestComponent } from '../../src/core/suggest.js'

const repoFile = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../../${name}`, import.meta.url)), 'utf8')

const manifest: unknown = JSON.parse(repoFile('library/elements/custom-elements.json'))

const guidelines = {
  accessibility: repoFile('system/guidelines/accessibility.md'),
  'color-and-theming': repoFile('system/guidelines/color-and-theming.md'),
  'motion-and-responsive': repoFile('system/guidelines/motion-and-responsive.md'),
  writing: repoFile('system/guidelines/writing.md'),
}

const outcomeFor = (intent: string) => {
  const result = suggestComponent(manifest, guidelines, intent)
  return result.ok ? result.value : undefined
}

describe('suggestComponent', () => {
  it('「保存ボタン」には rd-button を第一候補にする', () => {
    const outcome = outcomeFor('保存ボタン')
    expect(outcome?.kind).toBe('hits')
    const suggestions = outcome?.kind === 'hits' ? outcome.suggestions : []
    expect(suggestions[0]?.tag).toBe('rd-button')
    expect(suggestions[0]?.reason).not.toBe('')
  })

  it('読み上げの用途には rd-live-region を挙げる', () => {
    const outcome = outcomeFor('保存しましたと読み上げたい')
    const suggestions = outcome?.kind === 'hits' ? outcome.suggestions : []
    expect(suggestions.map((hit) => hit.tag)).toContain('rd-live-region')
  })

  it('当てはまる部品が無ければ「アプリ内に作る」を返す', () => {
    const outcome = outcomeFor('売上グラフを描画したい')
    expect(outcome?.kind).toBe('none')
    expect(outcome?.kind === 'none' ? outcome.advice : '').toContain('アプリ')
  })
})
