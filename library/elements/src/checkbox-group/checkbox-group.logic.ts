/**
 * `rd-checkbox-group` の純関数。ヒント・エラー文言・共通の `:state()` は `_shared/field.ts`。
 * ここには checkbox-group 固有の判断（segmented と `min`）だけを足す。DOM を触らない。
 *
 * `min` 未満はネイティブの検証には出ない（`required` は checkbox 1 個ずつにしか効かない）ので、
 * **`valueMissing` を立てたことにして `computeMessage` を呼ぶ**。新しい文言は足さない
 * （`system/guidelines/writing.md` が正）。
 */
import { computeStates, computeView, type FieldView, type ViewInput } from '../_shared/field.js'

export type CheckboxGroupInput = {
  /** 見た目だけを区画にする。役割・送信・読み上げは checkbox のまま */
  readonly segmented: boolean
  /** チェックが付いている数 */
  readonly checkedCount: number
  /** 最低いくつ選ぶか。0 なら下限を見ない */
  readonly min: number
}

/** `filled` は `checkedCount` から出すので、呼び側は渡さない */
export type CheckboxGroupViewInput = Omit<ViewInput, 'filled'> & CheckboxGroupInput

export type CheckboxGroupView = FieldView

const isShort = (input: CheckboxGroupInput): boolean =>
  input.min > 0 && input.checkedCount < input.min

/** 共通のフォーム状態に segmented を足す */
export const computeCheckboxGroupStates = (
  input: Parameters<typeof computeStates>[0] & { readonly segmented: boolean },
): ReadonlySet<string> => {
  const base = computeStates(input)
  if (input.malformed) {
    return base
  }
  return new Set([...base, ...(input.segmented ? ['segmented'] : [])])
}

/** 部品が 1 回の更新で必要とするものを全部まとめて出す。`*.element.ts` は反映するだけ */
export const computeCheckboxGroupView = (input: CheckboxGroupViewInput): CheckboxGroupView => {
  const short = isShort(input)
  const resolved = {
    ...input,
    filled: input.checkedCount > 0,
    invalid: input.invalid || short,
    validity: short ? { ...input.validity, valueMissing: true } : input.validity,
  }
  return { ...computeView(resolved), states: computeCheckboxGroupStates(resolved) }
}
