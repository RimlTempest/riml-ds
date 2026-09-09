/**
 * `rd-number-field` の純関数。DOM を触らない（`*.element.ts` と `*.dom.ts` はここを呼ぶだけ）。
 * ヒント・エラー文言・共通の `:state()` は `_shared/field.ts`。ここに足すのは
 * **刻みの判断だけ**——開始値・丸め・境界での無効化。
 *
 * ネイティブの `stepUp()` / `stepDown()` は呼ばない（`step="any"` で例外を投げ、空欄からの
 * 開始値がブラウザごとに違い、浮動小数の誤差が値に残る）。例外は投げない（ドメイン層）。
 */
import {
  type computeStates,
  computeView,
  type FieldView,
  type ViewInput,
} from '../_shared/field.js'

export type StepAttrs = {
  /** `input.value`（空欄は `''`） */
  readonly value: string
  readonly min?: string | undefined
  readonly max?: string | undefined
  readonly step?: string | undefined
}

export type StepDirection = -1 | 1

/** 刻み。無い・`any`・0 以下・数値でない → 1 */
export const parseStep = (step: string | undefined): number => {
  const parsed = Number(step ?? '')
  return step === undefined || step.trim() === '' || !Number.isFinite(parsed) || parsed <= 0
    ? 1
    : parsed
}

/** 小数点以下の桁数。`'0.1'` → 1、`'1'` → 0、`'0.25'` → 2、指数表記は 0 に落とす */
export const decimalsOf = (text: string): number => {
  if (text.includes('e') || text.includes('E')) {
    return 0
  }
  const fraction = text.split('.')[1]
  return fraction === undefined ? 0 : fraction.length
}

/** 読めない値（空欄・`'abc'`）は 0 から刻む。`min` があれば clamp がそこまで引き上げる */
const toBase = (value: string): number => {
  const parsed = Number(value)
  return value.trim() === '' || !Number.isFinite(parsed) ? 0 : parsed
}

/** 属性が無いときは境界も無い（`Number.NaN` は比較で必ず false になる） */
const bound = (raw: string | undefined): number => {
  const parsed = Number(raw ?? '')
  return raw === undefined || raw.trim() === '' ? Number.NaN : parsed
}

const clamp = (value: number, min: number, max: number): number => {
  const lowered = Number.isFinite(max) && value > max ? max : value
  return Number.isFinite(min) && lowered < min ? min : lowered
}

/**
 * 次の値。空欄・読めない値は 0 から刻み、`min` / `max` で止める（clamp）。
 * `step` と現在値の桁数の**大きい方**で丸めるので `0.2 + 0.1` は `'0.3'` になる。
 * 返り値はそのまま `input.value` に入れる文字列。
 */
export const stepValue = (attrs: StepAttrs, direction: StepDirection): string => {
  const step = parseStep(attrs.step)
  const next = toBase(attrs.value) + direction * step
  const bounded = clamp(next, bound(attrs.min), bound(attrs.max))
  const decimals = Math.max(decimalsOf(String(step)), decimalsOf(attrs.value))
  return String(Number(bounded.toFixed(decimals)))
}

/**
 * ボタンを押せるか。値が `max` 以上なら + を、`min` 以下なら − を無効にする。
 * 空欄・読めない値はどちらも押せる（そこから刻み始められる）。
 */
export const canStep = (attrs: StepAttrs, direction: StepDirection): boolean => {
  const value = Number(attrs.value)
  if (attrs.value.trim() === '' || !Number.isFinite(value)) {
    return true
  }
  const edge = bound(direction === 1 ? attrs.max : attrs.min)
  if (!Number.isFinite(edge)) {
    return true
  }
  return direction === 1 ? value < edge : value > edge
}

export type NumberFieldStateInput = Parameters<typeof computeStates>[0]

export type NumberFieldViewInput = ViewInput & StepAttrs & { readonly disabled: boolean }

export type NumberFieldView = FieldView & {
  readonly canDecrement: boolean
  readonly canIncrement: boolean
  readonly decrementLabel: string
  readonly incrementLabel: string
}

/** 部品が 1 回の更新で必要とするものを全部まとめて出す。`*.element.ts` は反映するだけ */
export const computeNumberFieldView = (input: NumberFieldViewInput): NumberFieldView => ({
  ...computeView(input),
  canDecrement: !input.disabled && canStep(input, -1),
  canIncrement: !input.disabled && canStep(input, 1),
  decrementLabel: input.japanese ? '減らす' : 'Decrease',
  incrementLabel: input.japanese ? '増やす' : 'Increase',
})
