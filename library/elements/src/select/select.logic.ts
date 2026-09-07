/**
 * `rd-select` の純関数。ヒント・エラー文言・`:state()` の計算はティア A のフォーム部品で共通なので
 * `_shared/field.ts` にある。ここには `<select>` 固有の判断だけを置く。DOM を触らない。
 */

/** 空でない選択肢を選んでいるか。placeholder（`<option value="">`）の間は「未選択」 */
export const isSelected = (value: string): boolean => value !== ''

/** `value` 属性（初期選択）。空なら触らない（HTML の `selected` を壊さない） */
export const initialSelection = (defaultValue: string): string | undefined =>
  defaultValue === '' ? undefined : defaultValue
