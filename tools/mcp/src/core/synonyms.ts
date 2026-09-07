/**
 * `search_tokens` の日本語同義語表。値はトークンのパス（完全一致か接頭辞）。
 * **20 語まで**（plan 008 の維持メモ）。増やしたくなったら guidelines の見出しを整える方を選ぶ。
 */
export const SYNONYMS: Readonly<Record<string, string>> = {
  本文: 'color.text.default',
  文字: 'color.text.default',
  薄い文字: 'color.text.muted',
  背景: 'color.surface.default',
  浮いた面: 'color.surface.raised',
  枠線: 'color.border.default',
  境界: 'color.border.default',
  強調: 'color.accent',
  アクセント: 'color.accent',
  危険: 'color.danger',
  エラー: 'color.danger',
  警告: 'color.warning',
  成功: 'color.success',
  情報: 'color.info',
  フォーカス: 'color.focus',
  余白: 'space',
  間隔: 'space',
  角丸: 'radius',
  影: 'shadow',
  動き: 'motion',
}
