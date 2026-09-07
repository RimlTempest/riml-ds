/**
 * ティア A の部品が包む「ネイティブの操作要素」を扱う小道具（ADR-0012）。
 * `*.element.ts` を薄い殻に保つため、絞り込み・リスナ束ね・属性読みをここに出す。
 */

export type NativeControl = HTMLInputElement | HTMLTextAreaElement

export const asNativeControl = (element: Element | undefined): NativeControl | undefined =>
  element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
    ? element
    : undefined

export type Listeners = Readonly<Record<string, (event: Event) => void>>

export type Binding = { readonly detach: () => void }

/** target が無ければ何もしない束ねを返す。同じ関数を 2 回足しても DOM 側が重複を無視する */
export const bindListeners = (
  target: EventTarget | null | undefined,
  listeners: Listeners,
): Binding => {
  const entries = Object.entries(listeners)
  entries.forEach(([type, listener]) => {
    target?.addEventListener(type, listener)
  })
  return {
    detach: () => {
      entries.forEach(([type, listener]) => {
        target?.removeEventListener(type, listener)
      })
    },
  }
}

export const setControlValue = (control: NativeControl | undefined, value: string): void => {
  if (control !== undefined) {
    control.value = value
  }
}

/** 無い属性は `undefined`（`exactOptionalPropertyTypes` でもそのまま渡せる形） */
export const readAttrs = (
  element: Element | undefined,
  names: readonly string[],
): Readonly<Record<string, string | undefined>> =>
  Object.fromEntries(names.map((name) => [name, element?.getAttribute(name) ?? undefined]))

/** `focus()` を持つ要素にだけ絞る（`document.activeElement` は `Element | null`） */
export const asFocusable = (node: Node | null): HTMLElement | null =>
  node instanceof HTMLElement ? node : null
