import type { SectionsError } from './sections.js'
import { findSection, Gamut, parseSections, Scope } from './sections.js'
import type { Result } from './result.js'
import { err, ok } from './result.js'

export type ThemeCss = {
  readonly name: string
  readonly css: string
}

export type SplitThemesError = SectionsError | { readonly kind: 'dark-only'; readonly name: string }

const EMPTY: ReadonlyMap<string, string> = new Map()

/**
 * `/* rd:theme <brand> *\/` のブロックを、ライトの基準との差分だけの CSS に切り出す。
 * ダーク（`/* rd:theme <brand> dark *\/`）があれば、ライトとダークの値を
 * `light-dark()` に畳む（`foldLightDark` と同じ考え方）。
 * 本体 `tokens.css` は `foldLightDark` が別に作る（テーマは含まない）。
 */
export const splitThemes = (rawCss: string): Result<readonly ThemeCss[], SplitThemesError> => {
  const parsed = parseSections(rawCss)
  if (!parsed.ok) {
    return parsed
  }
  const sections = parsed.value
  const baselineLight = findSection(sections, Scope.light, Gamut.srgb)?.declarations ?? EMPTY
  const baselineDark = findSection(sections, Scope.dark, Gamut.srgb)?.declarations ?? EMPTY
  // ダークの基準はライトに dark の差分を重ねたもの（tokens.css の light-dark() の右側）。
  const darkBaseline: ReadonlyMap<string, string> = new Map([...baselineLight, ...baselineDark])
  const names = [
    ...new Set(
      sections
        .filter((s) => s.scope === Scope.theme || s.scope === Scope.themeDark)
        .map((s) => s.theme ?? ''),
    ),
  ].filter((name) => name !== '')

  const themes: ThemeCss[] = []
  for (const name of names) {
    const light = findSection(sections, Scope.theme, Gamut.srgb, name)?.declarations ?? EMPTY
    const darkSection = findSection(sections, Scope.themeDark, Gamut.srgb, name)
    const dark = darkSection?.declarations ?? EMPTY
    const lightDelta = [...light].filter(
      ([variable, value]) => baselineLight.get(variable) !== value,
    )
    const darkDelta = [...dark].filter(([variable, value]) => darkBaseline.get(variable) !== value)
    const variables = [
      ...new Set([...lightDelta, ...darkDelta].map(([variable]) => variable)),
    ].toSorted((a, b) => a.localeCompare(b, 'en-us'))

    const declarations: string[] = []
    for (const variable of variables) {
      const lightValue = light.get(variable) ?? baselineLight.get(variable)
      if (lightValue === undefined) {
        return err({ kind: 'dark-only', name: variable })
      }
      // テーマのダーク区画が無ければダークの情報が無い。捏造せずライトの値だけを出す。
      const darkValue =
        darkSection === undefined ? lightValue : (dark.get(variable) ?? darkBaseline.get(variable))
      declarations.push(
        darkValue === undefined || darkValue === lightValue
          ? `    ${variable}: ${lightValue};`
          : `    ${variable}: light-dark(${lightValue}, ${darkValue});`,
      )
    }

    const body =
      declarations.length === 0
        ? `  /* ${name} は riml-ds の既定値と同じ（移行時にここへブランド差分が入る） */`
        : declarations.join('\n')
    const css =
      declarations.length === 0
        ? `@layer rd.tokens {\n${body}\n}\n`
        : `@layer rd.tokens {\n  :root {\n${body}\n  }\n}\n`
    themes.push({ name, css })
  }
  return ok(themes)
}
