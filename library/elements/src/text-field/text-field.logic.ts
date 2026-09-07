/**
 * `rd-text-field` の純関数。ヒント・エラー文言・`:state()` の計算は他のティア A のフォーム部品
 * （`rd-select` など）と同じなので `_shared/field.ts` に置き、ここから re-export する。
 * text-field 固有の判断が要るようになったらこのファイルに足す。
 */
export {
  computeDescribedBy,
  computeMessage,
  computeStates,
  computeView,
  usesJapaneseCopy,
} from '../_shared/field.js'
export type { FieldView } from '../_shared/field.js'
