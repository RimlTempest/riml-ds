/**
 * `rd-popover` が light DOM を読み書きするための薄い層。判断は `popover.logic.ts`（純関数）、
 * 位置決めは `_shared/popover-anchor.ts` が持つ。ここにあるのは「読む・書く」だけで、
 * `*.element.ts` を 150 行に収める（ADR-0005）ための置き場でもある。
 */

/** 中身が自由なので、最初に入る先はここで探す。順は DOM の並びそのもの */
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** `undefined` に強い `setAttribute`。属性を消す必要があるものは `syncAttribute` を使う */
export const applyAttrs = (
  el: Element | undefined,
  attrs: Readonly<Record<string, string>>,
): void => Object.entries(attrs).forEach(([name, value]) => el?.setAttribute(name, value))

/** `toggle` の `newState`。型に無いエンジンでも読めるように存在で見る */
export const opened = (event: Event): boolean =>
  'newState' in event && typeof event.newState === 'string' && event.newState === 'open'

export const asElement = (node: Element | null | undefined): HTMLElement | undefined =>
  node instanceof HTMLElement ? node : undefined

/** 開いた先の最初の行き先。押せるものが 1 つも無ければ器そのもの（`tabindex="-1"`） */
export const entryPoint = (panel: HTMLElement | undefined): HTMLElement | undefined =>
  asElement(panel?.querySelector(FOCUSABLE)) ?? panel
