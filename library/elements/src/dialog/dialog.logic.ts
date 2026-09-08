/**
 * `rd-dialog` の純関数。DOM を触らない（`focus` を持つものはダックタイプで受ける）。
 */

export type DismissReason = 'esc' | 'backdrop' | 'button' | 'api'

/**
 * 窓の置き場所。`center` が既定のモーダル、`start` / `end` が縦の帯（Sheet）、
 * `bottom` が下からせり上がる帯（Drawer）。位置は `<dialog>` の `margin` で決まる
 * （top layer は `inset` を無視するため）。
 */
export type DialogPlacement = 'center' | 'start' | 'end' | 'bottom'

export type CloseDecision =
  | { readonly kind: 'blocked' }
  | { readonly kind: 'close'; readonly reason: DismissReason }

/**
 * `persistent` は Esc と背面クリックだけを止める。`alert` は背面クリックだけを止める
 * （WAI-APG の Alert Dialog は外側を押しても閉じない。Esc は閉じる）。
 * `show()`/`close()` と帯の × は常に効く（`persistent` のときは × 自体を描かない。ADR-0014 決定 4）。
 * 既定 false の名前にしてあるのは、boolean 属性が HTML では「無い = false」しか表せないため。
 * 既定 true の名前だと `markup()` が属性を省くだけで既定に戻ってしまう（plan 009 Step 0 で反転した）。
 */
export const decideClose = (input: {
  readonly persistent: boolean
  readonly alert: boolean
  readonly reason: DismissReason
}): CloseDecision => {
  const blockedByPersistent =
    input.persistent && (input.reason === 'esc' || input.reason === 'backdrop')
  return blockedByPersistent || (input.alert && input.reason === 'backdrop')
    ? { kind: 'blocked' }
    : { kind: 'close', reason: input.reason }
}

/** `center` は既定なので名前を持たない（`:state()` が増えると利用側の CSS が読みにくい） */
export const computeStates = (input: {
  readonly open: boolean
  readonly malformed: boolean
  readonly placement: DialogPlacement
}): ReadonlySet<string> => {
  if (input.malformed) {
    return new Set(['malformed'])
  }
  const placed = input.placement === 'center' ? [] : [input.placement]
  return new Set(input.open ? ['open', ...placed] : placed)
}

export type Focusable = { readonly focus: () => void; readonly isConnected: boolean }

/** 閉じたら開いた要素へ戻す。DOM から消えていたらホストへ（フォーカスを消さない。ADR-0008 §5） */
export const focusReturnTarget = <T extends Focusable>(opener: T | null, host: T): T =>
  opener !== null && opener.isConnected ? opener : host

export type DialogAction = 'open' | 'close' | 'none'

/** 属性の `open` と `<dialog>` の実際の状態から、呼ぶべき操作を決める */
export const decideDialogAction = (input: {
  readonly wanted: boolean
  readonly actual: boolean
}): DialogAction => {
  if (input.wanted === input.actual) {
    return 'none'
  }
  return input.wanted ? 'open' : 'close'
}
