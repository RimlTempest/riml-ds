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

/** `value` が `undefined` なら属性を消し、そうでなければその値にする */
export const syncAttribute = (
  element: Element | undefined,
  name: string,
  value: string | undefined,
): void => {
  if (element === undefined) {
    return
  }
  if (value === undefined) {
    element.removeAttribute(name)
  } else {
    element.setAttribute(name, value)
  }
}

/** `ariaLabelledByElements` はまだ全エンジンに無い。あるときだけ使う */
type LabelLinkable = { ariaLabelledByElements: readonly Element[] | null }

const canLinkLabel = (internals: ElementInternals): internals is ElementInternals & LabelLinkable =>
  'ariaLabelledByElements' in internals

/**
 * slot 先の要素をホストの名前にする（ID 文字列の `aria-labelledby` は shadow を越えられない）。
 * 未対応のエンジンでは何もしない——利用側がホストに `aria-labelledby` を書ける（ADR-0008 §4）。
 */
export const linkLabelledBy = (internals: ElementInternals, element: Element | undefined): void => {
  if (element !== undefined && canLinkLabel(internals)) {
    internals.ariaLabelledByElements = [element]
  }
}
