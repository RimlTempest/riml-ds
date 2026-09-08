/**
 * `rd-popover` が light DOM を読み書きするための薄い層。判断は `popover.logic.ts`（純関数）、
 * 位置決めは `_shared/popover-anchor.ts` が持つ。ここにあるのは「読む・書く」だけで、
 * `*.element.ts` を 150 行に収める（ADR-0005）ための置き場でもある。
 */

import { hoverTimings, shouldCloseOnLeave } from './popover.logic.js'

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

/** `rd-popover` の `hover` が読み書きする窓口。element の private を外に出さないための入口 */
export type HoverParts = {
  /** 初期化時にだけ読む。後から属性を切り替えても購読は変わらない */
  readonly enabled: () => boolean
  readonly panel: () => HTMLElement | undefined
  readonly trigger: () => HTMLElement | undefined
  /** hover で開いたことを element に知らせる（開いた先へフォーカスを移さないため） */
  readonly markHover: () => void
}

export type HoverController = { readonly wire: () => void; readonly dispose: () => void }

/** `relatedTarget` は `EventTarget`。`contains` に渡せる形だけを取り出す */
const relatedNode = (event: FocusEvent): Node | null =>
  event.relatedTarget instanceof Node ? event.relatedTarget : null

/**
 * Hover Card（`rd-popover hover`）の購読と待ち時間。**押して開く経路（`popovertarget`）は
 * 触らない**——ホバーは近道で、キーボード・タッチ・JS 無しでは今までどおりボタンが働く。
 * トリガーと面の両方に付けるのは、あいだをポインタが渡るときに閉じないため（WCAG 1.4.13）。
 * タッチでは `pointerenter` が来ないか押下と同時に来る——どちらでも押して開く経路が残る。
 */
export const hoverController = (parts: HoverParts): HoverController => {
  let timer: ReturnType<typeof setTimeout> | undefined = undefined
  const later = (run: () => void, delay: number): void => {
    clearTimeout(timer)
    timer = setTimeout(run, delay)
  }
  const openNow = (): void => {
    clearTimeout(timer)
    const panel = parts.panel()
    if (panel === undefined || panel.matches(':popover-open')) {
      return
    }
    parts.markHover()
    panel.showPopover()
  }
  const closeNow = (): void => {
    const panel = parts.panel()
    if (panel?.matches(':popover-open') === true) {
      panel.hidePopover()
    }
  }
  const leave = (): void => later(closeNow, hoverTimings.close)
  const onFocusOut = (event: FocusEvent): void => {
    if (shouldCloseOnLeave(relatedNode(event), parts.panel(), parts.trigger())) {
      leave()
    }
  }
  return {
    wire: (): void => {
      const trigger = parts.trigger()
      const panel = parts.panel()
      if (!parts.enabled() || trigger === undefined || panel === undefined) {
        return
      }
      for (const target of [trigger, panel]) {
        target.addEventListener('pointerenter', () => later(openNow, hoverTimings.open))
        target.addEventListener('pointerleave', leave)
        target.addEventListener('focusout', onFocusOut)
      }
      trigger.addEventListener('focusin', openNow)
    },
    dispose: (): void => clearTimeout(timer),
  }
}
