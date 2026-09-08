/**
 * 重ね物（`rd-menu` / `rd-popover` / `rd-tooltip`）の位置決め。
 *
 * CSS anchor positioning（Baseline Newly、`docs/baseline.md`）が使えるならそちらに任せ、
 * 使えないときだけこの純関数が `getBoundingClientRect()` の値から `top` / `left` を決める。
 * **Floating UI は入れない**（`docs/baseline.md`「無ければ Floating UI ではなく下固定」）。
 * `resize` / `scroll` には追随しない——開いている間に画面が動いたら閉じるのが正しい退避。
 *
 * 座標は**ビューポート基準**（`position: fixed` と top layer が使う座標系）。
 */

export type RectLike = {
  readonly top: number
  readonly left: number
  readonly width: number
  readonly height: number
}

export type SizeLike = { readonly width: number; readonly height: number }

/** インライン方向の揃え。`start` はトリガーの始端、`end` は終端に揃える */
export type AnchorPlacement = 'start' | 'end'

/** ブロック方向の第一希望。入らなければもう一方へ倒れる */
export type AnchorSide = 'block-end' | 'block-start'

export type AnchorStyle = { readonly top: number; readonly left: number }

export type AnchorInput = {
  readonly trigger: RectLike
  readonly popover: SizeLike
  readonly viewport: SizeLike
  readonly placement?: AnchorPlacement | undefined
  readonly side?: AnchorSide | undefined
}

const blockStart = (input: AnchorInput): number => input.trigger.top - input.popover.height
const blockEnd = (input: AnchorInput): number => input.trigger.top + input.trigger.height

const fitsBelow = (input: AnchorInput): boolean =>
  blockEnd(input) + input.popover.height <= input.viewport.height

const fitsAbove = (input: AnchorInput): boolean => blockStart(input) >= 0

/**
 * 第一希望に入らなければ反対側へ倒す。**どちらにも入らなければ第一希望のまま**
 * （画面の下に少しはみ出すほうが、上で見出しを隠すより読める）。
 */
const topOf = (input: AnchorInput): number => {
  if (input.side === 'block-start') {
    return fitsAbove(input) || !fitsBelow(input) ? blockStart(input) : blockEnd(input)
  }
  return fitsBelow(input) || !fitsAbove(input) ? blockEnd(input) : blockStart(input)
}

const leftOf = (input: AnchorInput): number => {
  const aligned =
    input.placement === 'end'
      ? input.trigger.left + input.trigger.width - input.popover.width
      : input.trigger.left
  const maxLeft = input.viewport.width - input.popover.width
  return Math.max(0, Math.min(aligned, maxLeft))
}

/** ビューポート基準の `top` / `left`。呼び側は `position: fixed` の要素にそのまま書く */
export const computeAnchorStyle = (input: AnchorInput): AnchorStyle => ({
  top: topOf(input),
  left: leftOf(input),
})

/** CSS anchor positioning が使えるか（使えるなら位置決めは CSS に任せる） */
export const supportsAnchorPositioning = (): boolean =>
  typeof CSS !== 'undefined'
  && typeof CSS.supports === 'function'
  && CSS.supports('anchor-name: --rd-a')
