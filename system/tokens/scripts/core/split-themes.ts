import type { SectionsError } from './sections.js'
import { findSection, Gamut, parseSections, Scope } from './sections.js'
import type { Result } from './result.js'
import { ok } from './result.js'

export type ThemeCss = {
  readonly name: string
  readonly css: string
}

export type SplitThemesError = SectionsError

/**
 * `/* rd:theme <brand> *\/` のブロックを、ライトの基準との差分だけの CSS に切り出す。
 * 本体 `tokens.css` は `foldLightDark` が別に作る（テーマは含まない）。
 */
export const splitThemes = (rawCss: string): Result<readonly ThemeCss[], SplitThemesError> => {
  const parsed = parseSections(rawCss)
  if (!parsed.ok) {
    return parsed
  }
  const sections = parsed.value
  const baseline =
    findSection(sections, Scope.light, Gamut.srgb)?.declarations ?? new Map<string, string>()
  const names = [
    ...new Set(sections.filter((s) => s.scope === Scope.theme).map((s) => s.theme ?? '')),
  ].filter((name) => name !== '')
  const themes = names.map((name) => {
    const declarations =
      findSection(sections, Scope.theme, Gamut.srgb, name)?.declarations
      ?? new Map<string, string>()
    const delta = [...declarations].filter(([variable, value]) => baseline.get(variable) !== value)
    const body =
      delta.length === 0
        ? `  /* ${name} は riml-ds の既定値と同じ（移行時にここへブランド差分が入る） */`
        : delta.map(([variable, value]) => `    ${variable}: ${value};`).join('\n')
    const css =
      delta.length === 0
        ? `@layer rd.tokens {\n${body}\n}\n`
        : `@layer rd.tokens {\n  :root {\n${body}\n  }\n}\n`
    return { name, css }
  })
  return ok(themes)
}
