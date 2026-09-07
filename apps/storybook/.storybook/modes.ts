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

export const withModes: Decorator = (story, context) => {
  const root = context.canvasElement.ownerDocument.documentElement
  applyScheme(root, context.globals['scheme'])
  applyDensity(root, context.globals['density'])
  applyDir(root, context.globals['dir'])
  return story()
}

/** ツールバーに出すモード。`initialGlobals` と対で使う */
export const modeGlobalTypes = {
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
  scheme: 'light',
  density: 'default',
  dir: 'ltr',
  contrast: 'no-preference',
  motion: 'no-preference',
} as const
