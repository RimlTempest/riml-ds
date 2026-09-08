/**
 * `rd-input-otp` の純関数。ヒント・エラー文言・共通の `:state()` は `_shared/field.ts`。
 * キー処理はここに寄せて、`*.element.ts` は返ってきた index に focus するだけにする。DOM を触らない。
 */
import { computeView, type FieldView, type ViewInput } from '../_shared/field.js'

/** キー（と「1 文字入った」を表す `input`）から桁の移動量を引く。知らないキーは動かさない */
const STEP: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowLeft: -1,
  Backspace: -1,
  input: 1,
}

export type CellMove = {
  readonly index: number
  readonly count: number
  /** `'ArrowRight'` / `'ArrowLeft'` / `'Backspace'` / `'input'`。それ以外は動かない */
  readonly key: string
}

/** 移動先の桁。範囲外は端に留める（桁が無ければ 0） */
export const nextCellIndex = (move: CellMove): number => {
  const next = move.index + (STEP[move.key] ?? 0)
  return Math.min(Math.max(next, 0), Math.max(move.count - 1, 0))
}

/** 貼り付けた文字列から数字だけを取り出し、桁数ぶんに切る（見るのは半角数字だけ） */
export const distributePaste = (input: {
  readonly text: string
  readonly count: number
}): readonly string[] => (input.text.match(/\d/gu) ?? []).slice(0, Math.max(input.count, 0))

/** `filled` は桁の値から出すので、呼び側は渡さない */
export type OtpViewInput = Omit<ViewInput, 'filled'> & { readonly values: readonly string[] }

export type OtpView = FieldView & {
  /** 桁を連結した値 */
  readonly value: string
}

/** 部品が 1 回の更新で必要とするものを全部まとめて出す。`*.element.ts` は反映するだけ */
export const computeOtpView = (input: OtpViewInput): OtpView => ({
  ...computeView({
    ...input,
    filled: input.values.length > 0 && input.values.every((value) => value !== ''),
  }),
  value: input.values.join(''),
})
