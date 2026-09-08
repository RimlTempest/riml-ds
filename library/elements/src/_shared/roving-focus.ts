/**
 * roving tabindex の移動先を決める純関数（WAI-ARIA APG「Keyboard Interaction」）。
 * `rd-tabs`（タブの列）と `rd-menu`（項目の列）が共有する。DOM を触らない——
 * 呼び側が返ってきた番号の要素に `focus()` するだけ。
 *
 * 返り値が `undefined` のキーは**部品が扱わない**キーなので、呼び側は `preventDefault()` しない
 * （↑ ↓ が横並びのタブでページのスクロールを奪わない）。
 */

export type Orientation = 'horizontal' | 'vertical'

/** その向きで「次へ」「前へ」を意味するキー */
const STEP: Readonly<Record<Orientation, Readonly<Record<string, number>>>> = {
  horizontal: { ArrowRight: 1, ArrowLeft: -1 },
  vertical: { ArrowDown: 1, ArrowUp: -1 },
}

/**
 * `key` に応じた移動先の番号。端では折り返す（APG の既定）。
 * `current` が範囲外（まだどこにも居ない）なら、最初の矢印で先頭に入る。
 */
export const nextIndex = (
  current: number,
  count: number,
  key: string,
  orientation: Orientation,
): number | undefined => {
  if (count <= 0) {
    return undefined
  }
  if (key === 'Home') {
    return 0
  }
  if (key === 'End') {
    return count - 1
  }
  const step = STEP[orientation][key]
  if (step === undefined) {
    return undefined
  }
  if (!Number.isInteger(current) || current < 0 || current >= count) {
    return 0
  }
  return (current + step + count) % count
}
