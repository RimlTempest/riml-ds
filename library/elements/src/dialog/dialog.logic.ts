/**
 * `rd-dialog` の純関数。DOM を触らない（`focus` を持つものはダックタイプで受ける）。
 */

export type DismissReason = 'esc' | 'backdrop' | 'api'

export type CloseDecision =
  | { readonly kind: 'blocked' }
  | { readonly kind: 'close'; readonly reason: DismissReason }

/** `dismissible=false` は Esc と背面クリックだけを止める。`show()`/`close()` は常に効く */
export const decideClose = (input: {
  readonly dismissible: boolean
  readonly reason: DismissReason
}): CloseDecision =>
  input.dismissible || input.reason === 'api'
    ? { kind: 'close', reason: input.reason }
    : { kind: 'blocked' }

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
