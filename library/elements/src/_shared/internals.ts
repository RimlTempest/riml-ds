/**
 * `ElementInternals.states` の差分適用。部品は `:state(x)` だけを公開 API にする（ADR-0008 §3）。
 * `formAssociated` には使わない（ティア A の form 参加者はネイティブ要素。ADR-0012）。
 */

/** `next` に無い状態を消し、足りない状態を足す。例外は握らない */
export const syncStates = (internals: ElementInternals, next: ReadonlySet<string>): void => {
  // Set は反復中の delete が安全（訪問済みの要素を消すだけ）
  for (const current of internals.states) {
    if (!next.has(current)) {
      internals.states.delete(current)
    }
  }
  for (const state of next) {
    internals.states.add(state)
  }
}
