/**
 * `rd-dialog` の純関数。DOM を触らない（`focus` を持つものはダックタイプで受ける）。
 */

export type DismissReason = 'esc' | 'backdrop' | 'api'

export type CloseDecision =
  | { readonly kind: 'blocked' }
  | { readonly kind: 'close'; readonly reason: DismissReason }

/**
 * `persistent` は Esc と背面クリックだけを止める。`show()`/`close()` は常に効く。
 * 既定 false の名前にしてあるのは、boolean 属性が HTML では「無い = false」しか表せないため。
 * 既定 true の名前だと `markup()` が属性を省くだけで既定に戻ってしまう（plan 009 Step 0 で反転した）。
 */
export const decideClose = (input: {
  readonly persistent: boolean
  readonly reason: DismissReason
}): CloseDecision =>
  input.persistent && input.reason !== 'api'
    ? { kind: 'blocked' }
    : { kind: 'close', reason: input.reason }

export const computeStates = (input: {
  readonly open: boolean
  readonly malformed: boolean
}): ReadonlySet<string> => {
  if (input.malformed) {
    return new Set(['malformed'])
  }
  return input.open ? new Set(['open']) : new Set<string>()
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
