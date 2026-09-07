/**
 * `rd-checkbox` の純関数。ヒント・エラー文言・共通の `:state()` は `_shared/field.ts`。
 * ここには checkbox 固有の判断（checked / indeterminate / switch）だけを足す。DOM を触らない。
 */
import { computeStates, computeView, type FieldView, type ViewInput } from '../_shared/field.js'

export type CheckboxInput = {
  readonly checked: boolean
  readonly indeterminate: boolean
  readonly asSwitch: boolean
}

export type CheckboxStateInput = Parameters<typeof computeStates>[0] & CheckboxInput

/** 共通のフォーム状態に checked / indeterminate / switch を足す */
export const computeCheckboxStates = (input: CheckboxStateInput): ReadonlySet<string> => {
  const base = computeStates(input)
  if (input.malformed) {
    return base
  }
  return new Set([
    ...base,
    ...(input.checked ? ['checked'] : []),
    ...(input.indeterminate ? ['indeterminate'] : []),
    ...(input.asSwitch ? ['switch'] : []),
  ])
}

/**
 * `switch` 属性のときだけ `role="switch"` を付ける。JS が無ければチェックボックスのままで、
 * 送信も検証もそのまま動く（退行しない。ADR-0012）。
 */
export const switchRole = (asSwitch: boolean): string | undefined =>
  asSwitch ? 'switch' : undefined

export type CheckboxView = FieldView & { readonly role: string | undefined }

/** 部品が 1 回の更新で必要とするものを全部まとめて出す。`*.element.ts` は反映するだけ */
export const computeCheckboxView = (input: ViewInput & CheckboxInput): CheckboxView => ({
  ...computeView(input),
  states: computeCheckboxStates(input),
  role: switchRole(input.asSwitch),
})
