import { html } from 'lit'
import noterCss from '@rimltempest/riml-ds-tokens/themes/noter.css?raw'
import qrccCss from '@rimltempest/riml-ds-tokens/themes/qrcc.css?raw'
import type { Decorator } from '@storybook/web-components-vite'

/**
 * story の `globals` を「ドキュメント側の状態」に落とす decorator。
 *
 * JS で偽装できるのは `color-scheme` / `[data-density]` / `dir` の 3 つだけ。
 * `prefers-contrast` / `prefers-reduced-motion` / `forced-colors` は CSS のメディア特性で、
 * ページの JS からは切り替えられない → `ForcedColors` / `ReducedMotion` story は
 * Playwright のエミュレーション（`e2e/vrt/forced.spec.ts` / `reduced.spec.ts`）でだけ検証する。
 * Storybook 上では見た目が変わらないので、各 story の docs にその旨を書く。
 */
const applyScheme = (root: HTMLElement, scheme: unknown): void => {
  root.style.colorScheme = scheme === 'dark' ? 'dark' : 'light'
}

/**
 * ブランド（テーマ）の CSS。riml は既定なので表に持たない（`tokens.css` がそのまま riml）。
 * テーマは `color.palette.*` だけを上書きする（docs/brand.md §10）。
 * テーマを足したらここと `modeGlobalTypes.theme.toolbar.items` に 1 行ずつ足す。
 */
const THEME_CSS: Readonly<Record<string, string>> = { qrcc: qrccCss, noter: noterCss }

/** テーマ CSS の文字列。riml（既定）と未知の値は空文字 */
export const themeStyle = (
  theme: unknown,
  table: Readonly<Record<string, string>> = THEME_CSS,
): string => (typeof theme === 'string' ? (table[theme] ?? '') : '')

/**
 * テーマ CSS を `<style id="rd-theme">` として `<head>` の末尾に置く。
 * テーマも `tokens.css` も同じ `@layer rd.tokens` の `:root` なので、後に読んだ方が勝つ
 * （preview.ts の import 順は layers → tokens → css。テーマはその後）。
 */
const applyTheme = (root: HTMLElement, theme: unknown): void => {
  const doc = root.ownerDocument
  const existing = doc.getElementById('rd-theme')
  const css = themeStyle(theme)
  if (css === '') {
    existing?.remove()
    return
  }
  const style = existing ?? doc.createElement('style')
  style.id = 'rd-theme'
  style.textContent = css
  if (existing === null) {
    doc.head.append(style)
  }
}

const applyDensity = (root: HTMLElement, density: unknown): void => {
  if (density === 'compact') {
    root.dataset['density'] = 'compact'
  } else {
    root.removeAttribute('data-density')
  }
}

const applyDir = (root: HTMLElement, dir: unknown): void => {
  root.setAttribute('dir', dir === 'rtl' ? 'rtl' : 'ltr')
}

/** riml-ds の既定 UI 言語。`rd-text-field` の検証文言（日本語の表）もこれで決まる */
const applyLang = (root: HTMLElement): void => {
  root.lang = 'ja'
}

/**
 * story は必ずランドマークの中に描く。axe の `region`（best-practice）と markuplint の
 * `landmark-roles` は「ページの内容はランドマークに入っている」ことを要求するので、
 * 部品ごとに `<main>` を書かせるのではなく decorator が 1 つだけ与える。
 * 自分でランドマークを持つ story は `parameters.landmark: false` で外す。
 */
export const withModes: Decorator = (story, context) => {
  const root = context.canvasElement.ownerDocument.documentElement
  applyScheme(root, context.globals['scheme'])
  applyTheme(root, context.globals['theme'])
  applyDensity(root, context.globals['density'])
  applyDir(root, context.globals['dir'])
  applyLang(root)
  const inner = story()
  return context.parameters['landmark'] === false ? inner : html`<main>${inner}</main>`
}

/** ツールバーに出すモード。`initialGlobals` と対で使う */
export const modeGlobalTypes = {
  theme: {
    description: 'ブランド（テーマ）。riml が既定、qrcc / noter は palette だけ差し替える',
    toolbar: {
      title: 'ブランド',
      icon: 'paintbrush',
      items: ['riml', 'qrcc', 'noter'],
      dynamicTitle: true,
    },
  },
  scheme: {
    description: '配色（color-scheme）',
    toolbar: { title: '配色', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
  },
  density: {
    description: '密度（[data-density]）',
    toolbar: {
      title: '密度',
      icon: 'component',
      items: ['default', 'compact'],
      dynamicTitle: true,
    },
  },
  dir: {
    description: '書字方向',
    toolbar: { title: '方向', icon: 'transfer', items: ['ltr', 'rtl'], dynamicTitle: true },
  },
  contrast: {
    description: 'prefers-contrast。JS では偽装できないので VRT でだけ効く（表示は変わらない）',
    toolbar: {
      title: 'コントラスト',
      icon: 'contrast',
      items: ['no-preference', 'more'],
      dynamicTitle: true,
    },
  },
  motion: {
    description:
      'prefers-reduced-motion。JS では偽装できないので VRT でだけ効く（表示は変わらない）',
    toolbar: {
      title: 'モーション',
      icon: 'play',
      items: ['no-preference', 'reduce'],
      dynamicTitle: true,
    },
  },
} as const

export const initialModeGlobals = {
  theme: 'riml',
  scheme: 'light',
  density: 'default',
  dir: 'ltr',
  contrast: 'no-preference',
  motion: 'no-preference',
} as const
