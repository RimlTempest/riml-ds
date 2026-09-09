/**
 * `rd-toggle-group` の純関数。DOM を触らない。`*.element.ts` はここを呼ぶだけ（ADR-0005）。
 * 押下の真実は各 `<button>` の `aria-pressed` 属性で、ここは「読み取った状態 → 次の状態」だけを決める。
 * `disabled` は部品の属性にしない：ネイティブ `<button disabled>` をそのまま使う。
 */
import type { Orientation } from '../_shared/roving-focus.js'
import { nextIndex } from '../_shared/roving-focus.js'
import { type ToggleVariant, toToggleVariant } from '../toggle/toggle.logic.js'

export type ToggleGroupMode = 'single' | 'multiple'

/** `'single'` 以外はすべて `multiple`（既定） */
export const parseMode = (value: string | null): ToggleGroupMode =>
  value === 'single' ? 'single' : 'multiple'

/** `'vertical'` 以外はすべて `horizontal`（既定） */
export const parseOrientation = (value: string | null): Orientation =>
  value === 'vertical' ? 'vertical' : 'horizontal'

/** 見た目は `rd-toggle` と同じ名前。正規化もあちらの純関数を再利用する（知らない値は outline） */
export const parseVariant = (value: string | null): ToggleVariant => toToggleVariant(value ?? '')

/** 1 項目分の読み取り結果。`<button>` から拾える情報だけを持つ */
export type ItemState = {
  readonly value: string
  readonly pressed: boolean
  readonly disabled: boolean
}

/**
 * `index` 番目を押したあとの各項目の `pressed`。
 * `single` なら他を `false` に戻し、押した項目は反転する（既に押されていれば**解除**。
 * shadcn と同じで 0 個も許す）。`disabled` な項目と範囲外は何も変えない。
 */
export const pressAt = (
  items: readonly ItemState[],
  index: number,
  mode: ToggleGroupMode,
): readonly boolean[] => {
  const target = items[index]
  const locked = target === undefined || target.disabled
  return items.map((item, position) => {
    const others = mode === 'single' ? false : item.pressed
    return locked ? item.pressed : position === index ? !item.pressed : others
  })
}

/** `pressed` な項目の `value`（順序は DOM 順） */
export const selectedValues = (items: readonly ItemState[]): readonly string[] =>
  items.flatMap((item) => (item.pressed ? [item.value] : []))

/**
 * roving tabindex を置く 1 個。優先は「最初の pressed で enabled」→「最初の enabled」→
 * `-1`（全部 `disabled`）。`disabled` な項目には tabindex を置かない。
 */
export const tabStopIndex = (items: readonly ItemState[]): number => {
  const pressed = items.findIndex((item) => item.pressed && !item.disabled)
  return pressed === -1 ? items.findIndex((item) => !item.disabled) : pressed
}

/**
 * 矢印 / Home / End の移動先。`disabled` を飛ばす（enabled だけを並べ直して
 * `nextIndex` に掛け、元の index へ戻す）。扱わないキーは `undefined`——
 * 呼び側は `preventDefault()` しない（縦の矢印がページのスクロールを奪わない）。
 */
export const moveIndex = (
  items: readonly ItemState[],
  current: number,
  key: string,
  orientation: Orientation,
): number | undefined => {
  const enabled = items.flatMap((item, index) => (item.disabled ? [] : [index]))
  const moved = nextIndex(enabled.indexOf(current), enabled.length, key, orientation)
  return moved === undefined ? undefined : enabled[moved]
}

export type ToggleGroupStateInput = {
  readonly mode: ToggleGroupMode
  readonly orientation: Orientation
  readonly variant: ToggleVariant
  readonly malformed: boolean
}

/** 属性と契約の状態を `:state()` の集合にする。契約が欠けていれば `malformed` だけ */
export const computeStates = (input: ToggleGroupStateInput): ReadonlySet<string> =>
  input.malformed ? new Set(['malformed']) : new Set([input.variant, input.mode, input.orientation])
