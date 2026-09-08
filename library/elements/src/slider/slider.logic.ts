/**
 * `rd-slider` の純関数。ヒント・エラー文言・共通の `:state()` は `_shared/field.ts`。
 * ここには slider 固有の判断（塗りの割合・`<output>` の文言・向き）だけを足す。DOM を触らない。
 */
import { computeStates, computeView, type FieldView, type ViewInput } from '../_shared/field.js'
import type { SliderOrientation } from './slider.contract.js'

export type SliderInput = {
  readonly orientation: SliderOrientation
  /** ネイティブ要素の現在値と範囲。属性はすべて文字列 */
  readonly value: string
  readonly min: string
  readonly max: string
  /** `<output>` に値の後ろへ書く文字列（例 ' GB'）。空なら値だけ */
  readonly unit: string
}

/** HTML の `<input type="range">` の既定は min 0 / max 100 */
const toNumber = (raw: string, fallback: number): number =>
  raw.trim() === '' ? fallback : Number(raw)

/**
 * min..max のあいだの割合を 0–1 で返す。読めない値・幅ゼロの範囲は 0
 * （`rd-meter` の `computeFill` と同じ意味論だが、部品をまたいで共有しない。ADR-0012 §6）。
 */
export const computeSliderFill = (input: {
  readonly value: string
  readonly min: string
  readonly max: string
}): number => {
  const value = toNumber(input.value, 0)
  const min = toNumber(input.min, 0)
  const max = toNumber(input.max, 100)
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return 0
  }
  return Math.min(1, Math.max(0, (value - min) / (max - min)))
}

export type SliderStateInput = Parameters<typeof computeStates>[0] & {
  readonly orientation: SliderOrientation
}

/** 共通のフォーム状態に vertical を足す */
export const computeSliderStates = (input: SliderStateInput): ReadonlySet<string> => {
  const base = computeStates(input)
  if (input.malformed) {
    return base
  }
  return new Set([...base, ...(input.orientation === 'vertical' ? ['vertical'] : [])])
}

export type SliderViewInput = ViewInput & SliderInput

export type SliderView = FieldView & {
  /** `--rd-slider-fill`（0–1） */
  readonly fill: number
  /** `<output>` の文言。値 + 単位 */
  readonly outputText: string
}

/** 部品が 1 回の更新で必要とするものを全部まとめて出す。`*.element.ts` は反映するだけ */
export const computeSliderView = (input: SliderViewInput): SliderView => ({
  ...computeView(input),
  states: computeSliderStates(input),
  fill: input.malformed ? 0 : computeSliderFill(input),
  outputText: `${input.value}${input.unit}`,
})
