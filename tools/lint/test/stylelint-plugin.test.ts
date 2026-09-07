import { fileURLToPath } from 'node:url'
import stylelint from 'stylelint'
import type { Config } from 'stylelint'
import { describe, expect, it } from 'vitest'

// riml-ds 独自の stylelint ルール 3 本を Node API で直接呼ぶ。
// 規約の出典は .claude/skills/riml-ds-css/SKILL.md §6 と docs/baseline.md。
const plugin = fileURLToPath(new URL('../stylelint-plugin/index.js', import.meta.url))

const lint = async (
  code: string,
  rules: NonNullable<Config['rules']>,
): Promise<readonly string[]> => {
  const result = await stylelint.lint({ code, config: { plugins: [plugin], rules } })
  const first = result.results[0]
  return first === undefined ? [] : first.warnings.map((warning) => warning.rule)
}

const motion = (code: string): Promise<readonly string[]> =>
  lint(code, { 'riml-ds/motion-in-media': true })

const baseline = (code: string): Promise<readonly string[]> =>
  lint(code, { 'riml-ds/baseline-newly-needs-supports': true })

const palette = (code: string): Promise<readonly string[]> =>
  lint(code, { 'riml-ds/no-palette-token': true })

describe('riml-ds/motion-in-media', () => {
  it('無条件の transition を落とす', async () => {
    expect(await motion('a { transition: color 1s; }')).toEqual(['riml-ds/motion-in-media'])
  })

  it('無条件の animation を落とす', async () => {
    expect(await motion('a { animation: x 1s; }')).toEqual(['riml-ds/motion-in-media'])
  })

  it('no-preference の中と transition: none は通す', async () => {
    expect(
      await motion(
        '@media (prefers-reduced-motion: no-preference) { a { transition: color 1s; } }',
      ),
    ).toEqual([])
    expect(await motion('a { transition: none; }')).toEqual([])
  })
})

describe('riml-ds/baseline-newly-needs-supports', () => {
  it('裸の field-sizing を落とす', async () => {
    expect(await baseline('a { field-sizing: content; }')).toEqual([
      'riml-ds/baseline-newly-needs-supports',
    ])
  })

  it('裸の text-wrap: pretty と anchor-name と :state() を落とす', async () => {
    expect(await baseline('a { text-wrap: pretty; }')).toEqual([
      'riml-ds/baseline-newly-needs-supports',
    ])
    expect(await baseline('a { anchor-name: --x; }')).toEqual([
      'riml-ds/baseline-newly-needs-supports',
    ])
    expect(await baseline('a:state(open) { color: red; }')).toEqual([
      'riml-ds/baseline-newly-needs-supports',
    ])
  })

  it('@supports の中と Widely な宣言は通す', async () => {
    expect(
      await baseline('@supports (field-sizing: content) { a { field-sizing: content; } }'),
    ).toEqual([])
    expect(
      await baseline('@supports selector(:state(open)) { a:state(open) { color: red; } }'),
    ).toEqual([])
    expect(await baseline('a { color: red; }')).toEqual([])
  })
})

describe('riml-ds/no-palette-token', () => {
  it('palette トークンの直参照を落とす', async () => {
    expect(await palette('a { color: var(--rd-color-palette-neutral-800); }')).toEqual([
      'riml-ds/no-palette-token',
    ])
  })

  it('semantic トークンは通す', async () => {
    expect(await palette('a { color: var(--rd-color-text-default); }')).toEqual([])
  })

  it('color 以外のプロパティでも落とし、直し方をメッセージに書く', async () => {
    const result = await stylelint.lint({
      code: 'a { box-shadow: 0 0 0 var(--rd-color-palette-accent-600); }',
      config: { plugins: [plugin], rules: { 'riml-ds/no-palette-token': true } },
    })
    const warnings = result.results[0]?.warnings ?? []
    expect(warnings).toHaveLength(1)
    expect(warnings[0]?.text).toContain('--rd-color-palette-')
  })
})
