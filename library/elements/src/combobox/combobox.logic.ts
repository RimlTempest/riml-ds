/**
 * `rd-combobox` の純関数。DOM を触らない（`*.element.ts` はここを呼ぶだけ。ADR-0005）。
 * 候補の読み書きは `combobox.dom.ts`、ヒント・エラー文言・共通の `:state()` は `_shared/field.ts`。
 *
 * 絞り込み（`normalize` / `filterCandidates`）は `rd-command`（plan 028）と共有するので
 * `_shared/text-filter.ts` に移した。ここは**再エクスポートするだけ**で挙動は変えない。
 */
import type { FieldView } from '../_shared/field.js'
import { nextIndex } from '../_shared/roving-focus.js'
import {
  filterCandidates,
  normalize,
  parseFilterMode,
  type Candidate,
} from '../_shared/text-filter.js'
import type { ComboboxFilter } from './combobox.contract.js'

export { filterCandidates, normalize }
/** `<option>` 1 つ。`label` は表示名（`<option>` のテキスト。無ければ `value`） */
export type { Candidate }

/** 契約の `filter` 属性と同じ 3 つ（契約が正） */
export type FilterMode = ComboboxFilter

/** 知らない値・未指定は `contains`（既定） */
export const parseFilter = (raw: string | null | undefined): FilterMode => parseFilterMode(raw)

/**
 * 候補の移動先。**↓ と ↑ だけ**を `nextIndex` に委ねる——Home / End は
 * 入力欄のカーソル移動なので横取りしない（APG「Combobox with List Autocomplete」）。
 */
export const nextActive = (current: number, count: number, key: string): number | undefined =>
  key === 'ArrowDown' || key === 'ArrowUp' ? nextIndex(current, count, key, 'vertical') : undefined

/** `aria-activedescendant` が指す option の id */
export const optionId = (name: string, index: number): string => `${name}-option-${index}`

export type ComboboxViewInput = {
  readonly open: boolean
  /** 当たっている候補の番号。どこにも居なければ負 */
  readonly active: number
  /** 絞ったあとの候補数 */
  readonly count: number
  /** いま入力欄にある文字（`empty` を「絞った結果 0 件」に限るために要る） */
  readonly query: string
  /** 候補リストの id 兼アンカー名（`rd-combobox-1`） */
  readonly name: string
  readonly field: FieldView
}

export type ComboboxView = {
  readonly states: ReadonlySet<string>
  readonly inputAttrs: Readonly<Record<string, string>>
  readonly activeId: string | undefined
}

/** 契約に合わない子のときは他の状態を出さない（`_shared/field.ts` の `computeStates` に合わせる） */
const statesOf = (input: ComboboxViewInput): ReadonlySet<string> =>
  input.field.states.has('malformed')
    ? input.field.states
    : new Set([
        ...input.field.states,
        ...(input.open ? ['open'] : []),
        ...(input.count === 0 && normalize(input.query) !== '' ? ['empty'] : []),
      ])

const activeIdOf = (input: ComboboxViewInput): string | undefined =>
  input.open && Number.isInteger(input.active) && input.active >= 0 && input.active < input.count
    ? optionId(input.name, input.active)
    : undefined

/** 1 回の更新で `<input>` に反映するものを全部まとめて出す。element は書くだけ */
export const computeComboboxView = (input: ComboboxViewInput): ComboboxView => ({
  states: statesOf(input),
  inputAttrs: {
    role: 'combobox',
    'aria-autocomplete': 'list',
    'aria-expanded': String(input.open),
    'aria-controls': input.name,
  },
  activeId: activeIdOf(input),
})

/** キー 1 打の意味。`prevent` はそのキーの既定動作を止めるかどうか */
export type KeyAction =
  | { readonly kind: 'move'; readonly active: number; readonly prevent: true }
  | { readonly kind: 'open'; readonly prevent: true }
  | { readonly kind: 'close'; readonly prevent: true }
  /** Tab: 閉じるが横取りしない（次の項目へ進ませる） */
  | { readonly kind: 'dismiss'; readonly prevent: false }
  | { readonly kind: 'commit'; readonly active: number; readonly prevent: true }
  | { readonly kind: 'none'; readonly prevent: false }

export type KeyInput = {
  readonly key: string
  readonly altKey: boolean
  readonly open: boolean
  readonly active: number
  readonly count: number
}

const NONE: KeyAction = { kind: 'none', prevent: false }

/**
 * APG「Combobox with List Autocomplete」のキー操作。**Home / End は横取りしない**
 * （入力欄のカーソル移動）。Enter は候補が選ばれているときだけ確定し、
 * それ以外はフォーム送信を妨げない。
 */
export const decideKey = (input: KeyInput): KeyAction => {
  if (input.key === 'Escape') {
    return input.open ? { kind: 'close', prevent: true } : NONE
  }
  if (input.key === 'Tab') {
    return input.open ? { kind: 'dismiss', prevent: false } : NONE
  }
  if (input.key === 'Enter') {
    const chosen = input.open && input.active >= 0 && input.active < input.count
    return chosen ? { kind: 'commit', active: input.active, prevent: true } : NONE
  }
  if (input.altKey) {
    return input.key === 'ArrowDown' && input.count > 0 ? { kind: 'open', prevent: true } : NONE
  }
  const moved = nextActive(input.active, input.count, input.key)
  return moved === undefined ? NONE : { kind: 'move', active: moved, prevent: true }
}

/** 部品が持つ唯一の可変状態（開閉と、当たっている候補の番号） */
export type ComboboxState = { readonly open: boolean; readonly active: number }

/** キー 1 打のあとの状態。確定（`commit`）は値を書くのとは別に「閉じる」だけを意味する */
export const reduceKey = (action: KeyAction, state: ComboboxState): ComboboxState => {
  switch (action.kind) {
    case 'move':
      return { open: true, active: action.active }
    case 'open':
      return { open: true, active: state.active }
    case 'close':
    case 'dismiss':
    case 'commit':
      return { open: false, active: -1 }
    case 'none':
      return state
  }
}
