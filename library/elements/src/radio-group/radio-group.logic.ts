/**
 * `rd-radio-group` の純関数。ヒント・エラー文言・共通の `:state()` は `_shared/field.ts`。
 * ここには radio-group 固有の判断（segmented）だけを足す。DOM を触らない。
 */
import { computeStates, computeView, type FieldView, type ViewInput } from '../_shared/field.js'

export type RadioGroupInput = {
  /** 見た目だけを区画にする。役割・送信・キーボードは radio のまま */
  readonly segmented: boolean
}

export type RadioGroupStateInput = Parameters<typeof computeStates>[0] & RadioGroupInput

/** 共通のフォーム状態に segmented を足す */
export const computeRadioGroupStates = (input: RadioGroupStateInput): ReadonlySet<string> => {
  const base = computeStates(input)
  if (input.malformed) {
    return base
  }
  return new Set([...base, ...(input.segmented ? ['segmented'] : [])])
}

export type RadioGroupViewInput = ViewInput & RadioGroupInput

export type RadioGroupView = FieldView

/** 部品が 1 回の更新で必要とするものを全部まとめて出す。`*.element.ts` は反映するだけ */
export const computeRadioGroupView = (input: RadioGroupViewInput): RadioGroupView => ({
  ...computeView(input),
  states: computeRadioGroupStates(input),
})
