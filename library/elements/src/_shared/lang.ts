/**
 * UI の言語の見分け。フォーム部品の検証文言（`_shared/field.ts`）だけでなく、
 * 窓の操作ボタンの `aria-label`（`_shared/window-chrome.ts`）も使うので独立させてある。
 */

export type LangHost = {
  readonly closest: (
    selectors: string,
  ) => { readonly getAttribute: (name: string) => string | null } | null
}

/** 最も近い `[lang]` を見る。無い / `ja-*` なら日本語の文言を使う */
export const usesJapaneseCopy = (host: LangHost): boolean => {
  const lang = host.closest('[lang]')?.getAttribute('lang') ?? ''
  const primary = lang.split('-')[0]?.toLowerCase() ?? ''
  return primary === '' || primary === 'ja'
}
