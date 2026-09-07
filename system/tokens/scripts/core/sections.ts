import type { CssParseError, Declaration } from './css-blocks.js'
import { normalizePrelude, parseBlocks, parseDeclarations, toMap } from './css-blocks.js'
import type { Result } from './result.js'
import { err, ok } from './result.js'

/** CSS 変数の色域。Terrazzo は広色域の値を `@media (color-gamut: …)` で重ねて出す。 */
export const Gamut = { srgb: 'srgb', p3: 'p3', rec2020: 'rec2020' } as const
export type Gamut = (typeof Gamut)[keyof typeof Gamut]

/** permutation の識別子。`terrazzo.config.ts` の `permutations` と 1:1。 */
export const Scope = {
  light: 'light',
  dark: 'dark',
  moreLight: 'more-light',
  moreDark: 'more-dark',
  compact: 'compact',
  theme: 'theme',
} as const
export type Scope = (typeof Scope)[keyof typeof Scope]

export type Section = {
  readonly scope: Scope
  /** `scope` が `theme` のときだけブランド名が入る。 */
  readonly theme: string | undefined
  readonly gamut: Gamut
  readonly declarations: ReadonlyMap<string, string>
}

export type SectionsError =
  | CssParseError
  | { readonly kind: 'unknown-prelude'; readonly prelude: string }
  | { readonly kind: 'gamut-before-scope'; readonly prelude: string }

const THEME_RE = /rd:theme\s+([a-z0-9-]+)/

const scopeOf = (prelude: string): Scope | undefined => {
  if (prelude === ':root') {
    return Scope.light
  }
  if (prelude === '@media (prefers-color-scheme: dark)') {
    return Scope.dark
  }
  if (prelude === '@media (prefers-contrast: more)') {
    return Scope.moreLight
  }
  if (prelude === '@media (prefers-contrast: more) and (prefers-color-scheme: dark)') {
    return Scope.moreDark
  }
  if (prelude === '[data-density="compact"]') {
    return Scope.compact
  }
  return undefined
}

const gamutOf = (prelude: string): Gamut | undefined => {
  if (prelude === '@media (color-gamut: p3)') {
    return Gamut.p3
  }
  if (prelude === '@media (color-gamut: rec2020)') {
    return Gamut.rec2020
  }
  return undefined
}

/**
 * Terrazzo の生 CSS を「permutation × 色域」の区画に分ける。
 * 色域ブロックは直前の permutation に属する（Terrazzo の出力順に従う）。
 */
export const parseSections = (css: string): Result<readonly Section[], SectionsError> => {
  const blocks = parseBlocks(css)
  if (!blocks.ok) {
    return blocks
  }
  const sections: Section[] = []
  let current: { readonly scope: Scope; readonly theme: string | undefined } | undefined
  for (const block of blocks.value) {
    const prelude = normalizePrelude(block.prelude)
    const declarations: readonly Declaration[] = parseDeclarations(block.inner)
    const gamut = gamutOf(prelude)
    if (gamut !== undefined) {
      if (current === undefined) {
        return err({ kind: 'gamut-before-scope', prelude })
      }
      sections.push({
        scope: current.scope,
        theme: current.theme,
        gamut,
        declarations: toMap(declarations),
      })
      continue
    }
    const themeMatch = THEME_RE.exec(block.prelude)
    const theme = themeMatch?.[1]
    const scope = theme === undefined ? scopeOf(prelude) : Scope.theme
    if (scope === undefined) {
      return err({ kind: 'unknown-prelude', prelude })
    }
    current = { scope, theme }
    sections.push({ scope, theme, gamut: Gamut.srgb, declarations: toMap(declarations) })
  }
  return ok(sections)
}

/** 指定の区画を 1 つ取り出す。 */
export const findSection = (
  sections: readonly Section[],
  scope: Scope,
  gamut: Gamut,
  theme?: string,
): Section | undefined =>
  sections.find(
    (section) =>
      section.scope === scope
      && section.gamut === gamut
      && (theme === undefined || section.theme === theme),
  )
