/**
 * `rd-toggle` の純関数。DOM を触らない。`*.element.ts` はここを呼ぶだけ（ADR-0005）。
 * `disabled` は部品の属性にしない：ネイティブ `<button disabled>` をそのまま使う。
 */

export const ToggleVariant = {
  outline: 'outline',
  ghost: 'ghost',
} as const

export type ToggleVariant = (typeof ToggleVariant)[keyof typeof ToggleVariant]

const isToggleVariant = (value: string): value is ToggleVariant =>
  Object.hasOwn(ToggleVariant, value)

/** 属性から来た文字列を variant に正規化する。知らない値は outline */
export const toToggleVariant = (value: string): ToggleVariant =>
  isToggleVariant(value) ? value : ToggleVariant.outline

/** 押下は反転するだけ。真実は `aria-pressed` 属性が持つ */
export const nextPressed = (current: boolean): boolean => !current

export type ToggleViewInput = {
  readonly pressed: boolean
  readonly variant: string
  readonly malformed: boolean
}

export type ToggleView = {
  readonly states: ReadonlySet<string>
}

/**
 * `aria-pressed` に書く文字列。**属性を消さない**（消すと toggle ではなくただのボタンになる）。
 * 部品はこの値だけを書き、`:state(pressed)` は属性を読み直して決める。
 */
export const toAriaPressed = (pressed: boolean): 'true' | 'false' => (pressed ? 'true' : 'false')

/** 部品が 1 回の更新で必要とするものを全部まとめて出す。`*.element.ts` は反映するだけ */
export const computeToggleView = (input: ToggleViewInput): ToggleView => ({
  states: input.malformed
    ? new Set(['malformed'])
    : new Set([toToggleVariant(input.variant), ...(input.pressed ? ['pressed'] : [])]),
})
