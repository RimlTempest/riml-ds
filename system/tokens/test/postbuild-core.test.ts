import { describe, expect, it } from 'vitest'
import { collectContrastMeta, contrastPairs } from '../scripts/core/contrast-pairs.js'
import { emitJson, emitMd, emitTs } from '../scripts/core/emit.js'
import { collectFluid, fluidTypography } from '../scripts/core/fluid-typography.js'
import { foldLightDark } from '../scripts/core/fold-light-dark.js'
import { splitThemes } from '../scripts/core/split-themes.js'
import { parseTokenSet } from '../scripts/core/token-set.js'

const raw = (body: string): string => `/* header */\n${body}`

const FULL = raw(`
:root {
  --rd-a: 1rem;
  --rd-b: red;
}
@media (prefers-color-scheme: dark) {
:root {
  --rd-a: 1rem;
  --rd-b: blue;
}
}
@media (prefers-contrast: more) {
:root {
  --rd-a: 1rem;
  --rd-b: darkred;
}
}
@media (prefers-contrast: more) and (prefers-color-scheme: dark) {
:root {
  --rd-a: 1rem;
  --rd-b: lightblue;
}
}
[data-density="compact"] {
  --rd-a: 0.75rem;
  --rd-b: red;
}
/* rd:theme qrcc */
:root {
  --rd-a: 1rem;
  --rd-b: green;
}
`)

describe('foldLightDark', () => {
  it('light と dark の差を light-dark() に畳み、同じ値はそのまま残す', () => {
    const result = foldLightDark(FULL)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value).toContain('color-scheme: light dark;')
    expect(result.value).toContain('--rd-b: light-dark(red, blue);')
    expect(result.value).toContain('--rd-a: 1rem;')
    expect(result.value.startsWith('@layer rd.tokens {')).toBe(true)
  })

  it('高コントラストと密度は差分だけを出し、テーマは含めない', () => {
    const result = foldLightDark(FULL)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value).toContain('@media (prefers-contrast: more) {')
    expect(result.value).toContain('--rd-b: light-dark(darkred, lightblue);')
    expect(result.value).toContain('[data-density="compact"] {')
    expect(result.value).toContain('--rd-a: 0.75rem;')
    expect(result.value).not.toContain('green')
  })

  it('ダークにしか無い変数は err（dark-only）になる', () => {
    const result = foldLightDark(FULL.replace('  --rd-a: 1rem;\n  --rd-b: red;', '  --rd-a: 1rem;'))
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error).toEqual({ kind: 'dark-only', name: '--rd-b' })
  })

  it('知らないセレクタは err（unknown-prelude）になる', () => {
    const result = foldLightDark(raw(':root {\n  --rd-a: 1rem;\n}\n.stray {\n  --rd-a: 2rem;\n}\n'))
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error).toEqual({ kind: 'unknown-prelude', prelude: '.stray' })
  })
})

describe('fluidTypography', () => {
  const document = {
    type: {
      body: {
        $value: { fontSize: { value: 1, unit: 'rem' } },
        $extensions: {
          'riml-ds': { fluid: { min: '1rem', preferred: '0.96rem + 0.2vw', max: '1.125rem' } },
        },
      },
      small: { $value: { fontSize: { value: 0.875, unit: 'rem' } } },
    },
  }

  it('fluid を持つトークンだけ clamp() に置き換える', () => {
    const clamps = collectFluid(document)
    expect(clamps.ok).toBe(true)
    if (!clamps.ok) {
      return
    }
    const css = fluidTypography(
      '--rd-type-body-font-size: 1rem;\n--rd-type-small-font-size: 0.875rem;',
      clamps.value,
    )
    expect(css).toContain('--rd-type-body-font-size: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);')
    expect(css).toContain('--rd-type-small-font-size: 0.875rem;')
  })

  it('fluid の 3 値が揃っていなければ err', () => {
    const broken = {
      type: { body: { $value: {}, $extensions: { 'riml-ds': { fluid: { min: '1rem' } } } } },
    }
    const result = collectFluid(broken)
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error).toEqual({ kind: 'invalid-fluid', id: 'type.body' })
  })
})

describe('splitThemes', () => {
  it('テーマごとに基準との差分だけを切り出す', () => {
    const result = splitThemes(FULL)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value.map((theme) => theme.name)).toEqual(['qrcc'])
    expect(result.value[0]?.css).toContain('--rd-b: green;')
    expect(result.value[0]?.css).not.toContain('--rd-a')
  })

  it('差分が無いテーマは注記だけの CSS になる', () => {
    const same = FULL.replace('  --rd-b: green;', '  --rd-b: red;')
    const result = splitThemes(same)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value[0]?.css).toContain('移行時にここへブランド差分が入る')
  })

  it('テーマのライト差分とダーク差分を light-dark() に畳む', () => {
    // FULL: light は --rd-a: 1rem / --rd-b: red、dark は --rd-b: blue、
    // theme qrcc(light) は --rd-b: green。
    const css = `${FULL}
/* rd:theme qrcc dark */
:root {
  --rd-a: 1rem;
  --rd-b: green;
}
`
    const result = splitThemes(css)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    // --rd-a: テーマはライト・ダークとも基準と同じ → 出ない
    expect(result.value[0]?.css).not.toContain('--rd-a')
    // --rd-b: ライト green / ダーク green（基準は red / blue）→ 同じ値なので畳まない
    expect(result.value[0]?.css).toContain('--rd-b: green;')
  })

  it('ライトとダークで違う値はテーマ CSS でも light-dark() になる', () => {
    const css = `${FULL}
/* rd:theme qrcc dark */
:root {
  --rd-a: 1rem;
  --rd-b: lime;
}
`
    const result = splitThemes(css)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value[0]?.css).toContain('--rd-b: light-dark(green, lime);')
  })
})

describe('contrastPairs', () => {
  const document = {
    color: {
      text: {
        default: {
          $value: '{x}',
          $extensions: { 'riml-ds': { contrastAgainst: 'color.surface.default' } },
        },
        'on-status': { $value: '{x}', $extensions: { 'riml-ds': { contrastAgainst: ['a', 'b'] } } },
      },
      border: {
        default: {
          $value: '{x}',
          $extensions: { 'riml-ds': { contrastAgainst: 'c', nonText: true } },
        },
      },
    },
  }

  it('contrastAgainst を持つトークンを集め、配列は 1 対ずつに展開する', () => {
    const meta = collectContrastMeta(document)
    expect(meta.ok).toBe(true)
    if (!meta.ok) {
      return
    }
    expect(meta.value.map((entry) => entry.id)).toEqual([
      'color.text.default',
      'color.text.on-status',
      'color.border.default',
    ])
  })

  it('非テキストは AAA の pairs に入れない（3:1 は自前テストが見る）', () => {
    const pairs = contrastPairs(document)
    expect(pairs.ok).toBe(true)
    if (!pairs.ok) {
      return
    }
    expect(pairs.value).toEqual([
      { foreground: 'color.text.default', background: 'color.surface.default' },
      { foreground: 'color.text.on-status', background: 'a' },
      { foreground: 'color.text.on-status', background: 'b' },
    ])
  })

  it('contrastAgainst が文字列でも配列でもなければ err', () => {
    const broken = {
      color: { text: { a: { $value: '{x}', $extensions: { 'riml-ds': { contrastAgainst: 1 } } } } },
    }
    const result = contrastPairs(broken)
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error).toEqual({ kind: 'invalid-contrast-against', id: 'color.text.a' })
  })
})

describe('emit', () => {
  const set = parseTokenSet({
    'color.text.default': {
      $type: 'color',
      $description: '本文',
      $value: { colorSpace: 'oklch', components: [0.25, 0.02, 200], alpha: 1 },
    },
    'space.4': {
      $type: 'dimension',
      $description: '標準の間隔',
      $value: { value: 1, unit: 'rem' },
    },
  })
  const dark = parseTokenSet({
    'color.text.default': {
      $type: 'color',
      $description: '本文',
      $value: { colorSpace: 'oklch', components: [0.99, 0.005, 200], alpha: 1 },
    },
    'space.4': {
      $type: 'dimension',
      $description: '標準の間隔',
      $value: { value: 1, unit: 'rem' },
    },
  })

  it('tokens.js は var() 参照、tokens.d.ts はリテラル型を配る', () => {
    expect(set.ok).toBe(true)
    if (!set.ok) {
      return
    }
    const result = emitTs(set.value)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value.js).toContain('default: "var(--rd-color-text-default)"')
    expect(result.value.js).toContain('"4": "var(--rd-space-4)"')
    expect(result.value.dts).toContain('| "color.text.default"')
    expect(result.value.js).not.toContain('oklch')
  })

  it('tokens.json は hex とモード差分を $extensions に足す', () => {
    expect(set.ok && dark.ok).toBe(true)
    if (!set.ok || !dark.ok) {
      return
    }
    const result = emitJson(set.value, new Map([['dark', dark.value]]))
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    const parsed: unknown = JSON.parse(result.value)
    expect(JSON.stringify(parsed)).toContain('"hex":"#162525"')
    expect(JSON.stringify(parsed)).toContain('"cssVar":"--rd-color-text-default"')
    expect(JSON.stringify(parsed)).toContain('"modes"')
  })

  it('tokens.md は light と dark を並べた表になる', () => {
    expect(set.ok && dark.ok).toBe(true)
    if (!set.ok || !dark.ok) {
      return
    }
    const result = emitMd(set.value, dark.value)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.value).toContain('| 名前 | CSS 変数 | light | dark | 説明 |')
    expect(result.value).toContain('`oklch(0.25 0.02 200)`')
    expect(result.value).toContain('`oklch(0.99 0.005 200)`')
  })

  it('空のトークン集合は err', () => {
    const empty = parseTokenSet({})
    expect(empty.ok).toBe(true)
    if (!empty.ok) {
      return
    }
    expect(emitTs(empty.value).ok).toBe(false)
  })
})
