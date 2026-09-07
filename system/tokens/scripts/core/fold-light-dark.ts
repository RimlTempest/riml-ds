import type { Section, SectionsError } from './sections.js'
import { findSection, Gamut, parseSections, Scope } from './sections.js'
import type { Result } from './result.js'
import { err, ok } from './result.js'

export type FoldError =
  | SectionsError
  | { readonly kind: 'missing-section'; readonly scope: Scope; readonly gamut: Gamut }
  | { readonly kind: 'dark-only'; readonly name: string }

const EMPTY: ReadonlyMap<string, string> = new Map()

const merge = (
  base: ReadonlyMap<string, string>,
  over: ReadonlyMap<string, string>,
): ReadonlyMap<string, string> => new Map([...base, ...over])

const sectionMap = (
  sections: readonly Section[],
  scope: Scope,
  gamut: Gamut,
): ReadonlyMap<string, string> => findSection(sections, scope, gamut)?.declarations ?? EMPTY

/** light と dark の同名変数を `light-dark()` に畳む。同じ値なら畳まない。 */
const fold = (
  names: readonly string[],
  light: ReadonlyMap<string, string>,
  dark: ReadonlyMap<string, string>,
): Result<ReadonlyMap<string, string>, FoldError> => {
  const folded = new Map<string, string>()
  for (const name of names) {
    const lightValue = light.get(name)
    const darkValue = dark.get(name)
    if (lightValue === undefined) {
      return err({ kind: 'dark-only', name })
    }
    folded.set(
      name,
      darkValue === undefined || darkValue === lightValue
        ? lightValue
        : `light-dark(${lightValue}, ${darkValue})`,
    )
  }
  return ok(folded)
}

const sortedUnion = (...maps: readonly ReadonlyMap<string, string>[]): readonly string[] =>
  [...new Set(maps.flatMap((map) => Array.from(map.keys())))].toSorted((a, b) =>
    a.localeCompare(b, 'en-us'),
  )

/** 基準の値と同じ宣言を落として、差分だけを残す。 */
const deltaOf = (
  candidate: ReadonlyMap<string, string>,
  baseline: ReadonlyMap<string, string>,
): ReadonlyMap<string, string> =>
  new Map([...candidate].filter(([name, value]) => baseline.get(name) !== value))

const render = (declarations: ReadonlyMap<string, string>, indent: string): string =>
  [...declarations].map(([name, value]) => `${indent}${name}: ${value};`).join('\n')

const rootBlock = (
  declarations: ReadonlyMap<string, string>,
  indent: string,
  extra?: string,
): string =>
  [
    `${indent}:root {`,
    ...(extra === undefined ? [] : [`${indent}  ${extra}`]),
    render(declarations, `${indent}  `),
    `${indent}}`,
  ]
    .filter((line) => line !== '')
    .join('\n')

const GAMUTS: readonly Gamut[] = [Gamut.p3, Gamut.rec2020]

type Folded = {
  readonly srgb: ReadonlyMap<string, string>
  readonly byGamut: ReadonlyMap<Gamut, ReadonlyMap<string, string>>
}

const foldScope = (
  sections: readonly Section[],
  lightScope: Scope,
  darkScope: Scope,
): Result<Folded, FoldError> => {
  const lightSrgb = sectionMap(sections, lightScope, Gamut.srgb)
  const darkSrgb = sectionMap(sections, darkScope, Gamut.srgb)
  if (lightSrgb.size === 0) {
    return err({ kind: 'missing-section', scope: lightScope, gamut: Gamut.srgb })
  }
  const srgb = fold(sortedUnion(lightSrgb, darkSrgb), lightSrgb, darkSrgb)
  if (!srgb.ok) {
    return srgb
  }
  const byGamut = new Map<Gamut, ReadonlyMap<string, string>>()
  for (const gamut of GAMUTS) {
    const lightWide = sectionMap(sections, lightScope, gamut)
    const darkWide = sectionMap(sections, darkScope, gamut)
    if (lightWide.size === 0 && darkWide.size === 0) {
      continue
    }
    const wide = fold(
      sortedUnion(lightWide, darkWide),
      merge(lightSrgb, lightWide),
      merge(darkSrgb, darkWide),
    )
    if (!wide.ok) {
      return wide
    }
    byGamut.set(gamut, wide.value)
  }
  return ok({ srgb: srgb.value, byGamut })
}

/**
 * Terrazzo の生 CSS を `@layer rd.tokens` の 1 枚に畳む。
 *
 * - `:root` に `color-scheme: light dark` と `light-dark()` に畳んだ全変数
 * - `@media (prefers-contrast: more)` は「畳んだうえで基準との差分だけ」
 * - `[data-density="compact"]` も差分だけ
 * - `/* rd:theme … *\/` のブロックは含めない（`splitThemes` が別ファイルにする）
 */
export const foldLightDark = (rawCss: string): Result<string, FoldError> => {
  const parsed = parseSections(rawCss)
  if (!parsed.ok) {
    return parsed
  }
  const sections = parsed.value
  const base = foldScope(sections, Scope.light, Scope.dark)
  if (!base.ok) {
    return base
  }
  const more = foldScope(sections, Scope.moreLight, Scope.moreDark)
  if (!more.ok) {
    return more
  }
  const compact = sectionMap(sections, Scope.compact, Gamut.srgb)

  const lines: string[] = [
    '@layer rd.tokens {',
    rootBlock(base.value.srgb, '  ', 'color-scheme: light dark;'),
  ]
  const baseGamutDeltas = new Map<Gamut, ReadonlyMap<string, string>>()
  for (const gamut of GAMUTS) {
    const delta = deltaOf(base.value.byGamut.get(gamut) ?? EMPTY, base.value.srgb)
    baseGamutDeltas.set(gamut, delta)
    if (delta.size > 0) {
      lines.push(`  @media (color-gamut: ${gamut}) {`, rootBlock(delta, '    '), '  }')
    }
  }

  const moreDelta = deltaOf(more.value.srgb, base.value.srgb)
  const moreGamutDeltas = GAMUTS.flatMap((gamut) => {
    const wide = more.value.byGamut.get(gamut)
    if (wide === undefined) {
      return []
    }
    const baseline = merge(
      merge(base.value.srgb, base.value.byGamut.get(gamut) ?? EMPTY),
      moreDelta,
    )
    const delta = deltaOf(wide, baseline)
    return delta.size === 0 ? [] : [{ gamut, delta }]
  })
  if (moreDelta.size > 0 || moreGamutDeltas.length > 0) {
    lines.push('  @media (prefers-contrast: more) {')
    if (moreDelta.size > 0) {
      lines.push(rootBlock(moreDelta, '    '))
    }
    for (const { gamut, delta } of moreGamutDeltas) {
      lines.push(`    @media (color-gamut: ${gamut}) {`, rootBlock(delta, '      '), '    }')
    }
    lines.push('  }')
  }

  // compact は色を変えない。畳んだ値と比べると全色が差分になるので light と比べる。
  const compactDelta = deltaOf(compact, sectionMap(sections, Scope.light, Gamut.srgb))
  if (compactDelta.size > 0) {
    lines.push('  [data-density="compact"] {', render(compactDelta, '    '), '  }')
  }
  lines.push('}', '')
  return ok(lines.join('\n'))
}
