/**
 * `rd-splitter` の純関数。DOM を触らない（ADR-0005）。ポインタとキーの「読み書き」は
 * `splitter.dom.ts`、ここにあるのは「いくつになるか」の判断だけ。
 *
 * **`direction`（面の並び）と `aria-orientation`（仕切り線の向き）は逆**になる。
 * 横に並ぶ 2 面のあいだの仕切りは縦線なので `aria-orientation="vertical"`（APG の separator）。
 * 混乱の元なので `ariaOrientation()` の 1 か所に閉じ、テストで固定する。
 */
import type { SplitterDirection } from './splitter.contract.js'

/** `position` が動ける範囲（%） */
export type Bounds = { readonly min: number; readonly max: number }

/** host の矩形のうち、`direction` に沿った 1 軸だけ（左端か上端と、その長さ） */
export type Axis = { readonly start: number; readonly size: number }

export const parseDirection = (raw: string | null): SplitterDirection =>
  raw === 'vertical' ? 'vertical' : 'horizontal'

/** 整数の % にして `min`..`max` に収める。`min > max` の指定は `min` を勝たせる */
export const clampPosition = (value: number, min: number, max: number): number => {
  if (min > max) {
    return min
  }
  const rounded = Number.isFinite(value) ? Math.round(value) : min
  return Math.min(max, Math.max(min, rounded))
}

/**
 * ポインタの座標を % にする。`point` は横なら `clientX`、縦なら `clientY`。
 * `rtl` は**横並びのときだけ** true になりうる（縦の積み方は書字方向で変わらない）。
 */
export const positionFromPointer = (
  point: number,
  rect: Axis,
  rtl: boolean,
  bounds: Bounds,
): number => {
  const ratio = rect.size <= 0 ? 0 : (point - rect.start) / rect.size
  return clampPosition((rtl ? 1 - ratio : ratio) * 100, bounds.min, bounds.max)
}

/** 面の並びごとに「増える向き」の矢印を持つ表。ここに無いキーは横取りしない */
const STEPS: Readonly<Record<SplitterDirection, Readonly<Record<string, number>>>> = {
  horizontal: { ArrowRight: 1, ArrowLeft: -1 },
  vertical: { ArrowDown: 1, ArrowUp: -1 },
}

const ENDS: Readonly<Record<string, keyof Bounds>> = { Home: 'min', End: 'max' }

/**
 * APG「Window Splitter」のキー操作。矢印で 1%、Shift で 10%、Home / End で端まで。
 * 扱わないキーは `undefined`（呼び側は `preventDefault()` しない）。
 * Enter の折り畳みは持たない（スコープ外。`docs/proposals/splitter.md`）。
 */
export const decideKey = (
  key: string,
  shift: boolean,
  direction: SplitterDirection,
  rtl: boolean,
  current: number,
  bounds: Bounds,
): number | undefined => {
  const end = ENDS[key]
  if (end !== undefined) {
    return clampPosition(bounds[end], bounds.min, bounds.max)
  }
  const step = STEPS[direction][key]
  if (step === undefined) {
    return undefined
  }
  const sign = rtl && direction === 'horizontal' ? -1 : 1
  return clampPosition(current + step * sign * (shift ? 10 : 1), bounds.min, bounds.max)
}

/** 面の並びと仕切り線の向きは逆（APG の separator）。この 1 か所だけが反転を知っている */
export const ariaOrientation = (direction: SplitterDirection): SplitterDirection =>
  direction === 'horizontal' ? 'vertical' : 'horizontal'

export type SplitterStateInput = {
  readonly dragging: boolean
  readonly direction: SplitterDirection
  readonly malformed: boolean
}

/** 属性と契約の状態を `:state()` の集合にする */
export const computeStates = (input: SplitterStateInput): ReadonlySet<string> =>
  new Set([
    ...(input.dragging ? ['dragging'] : []),
    ...(input.direction === 'vertical' ? ['vertical'] : []),
    ...(input.malformed ? ['malformed'] : []),
  ])
