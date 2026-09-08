/**
 * `rd-window` の純関数。DOM を触らない。`*.element.ts` はここを呼ぶだけ（ADR-0005）。
 * 帯のボタンの並びと、たたむ / 広げるの状態遷移だけを持つ（ADR-0014）。
 */
import type { WindowAction } from '../_shared/window-chrome.js'

export type ControlsInput = {
  readonly closable: boolean
  readonly expandable: boolean
  readonly collapsible: boolean
}

/** 左から 閉じる（×）・広げる（□）・たたむ（−）。この順は brand.md §7.1 で決まっている */
const ORDER: readonly WindowAction[] = ['close', 'expand', 'collapse']

const ENABLED: Readonly<Record<WindowAction, (input: ControlsInput) => boolean>> = {
  close: (input) => input.closable,
  expand: (input) => input.expandable,
  collapse: (input) => input.collapsible,
}

/** 使う操作の丸だけを並びどおりに返す。押せない丸は置かない（ADR-0014 決定 1） */
export const controlsFor = (input: ControlsInput): readonly WindowAction[] =>
  ORDER.filter((action) => ENABLED[action](input))

export type WindowState = { readonly collapsed: boolean; readonly expanded: boolean }

/**
 * `force` を渡さなければ反転、渡せばその値に倒す（`toggleCollapsed(true)` を冪等にするため）。
 * `esc` は「広げた」状態だけを戻す。たたむ状態は Esc で動かさない（brand.md §7.1）。
 */
export type WindowEvent =
  | { readonly kind: 'collapse'; readonly force?: boolean | undefined }
  | { readonly kind: 'expand'; readonly force?: boolean | undefined }
  | { readonly kind: 'esc' }

export const nextState = (state: WindowState, event: WindowEvent): WindowState => {
  switch (event.kind) {
    case 'collapse':
      return { ...state, collapsed: event.force ?? !state.collapsed }
    case 'expand':
      return { ...state, expanded: event.force ?? !state.expanded }
    case 'esc':
      return { ...state, expanded: false }
  }
}

export type StateInput = WindowState & { readonly malformed: boolean }

/** `:state()` は見えている状態をそのまま出す（`malformed` は他と同時に立ってよい） */
export const computeStates = (input: StateInput): ReadonlySet<string> =>
  new Set(
    [
      input.malformed ? 'malformed' : '',
      input.collapsed ? 'collapsed' : '',
      input.expanded ? 'expanded' : '',
    ].filter((state) => state !== ''),
  )
