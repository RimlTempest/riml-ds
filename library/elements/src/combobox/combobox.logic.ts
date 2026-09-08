/**
 * `rd-combobox` の純関数。DOM を触らない（`*.element.ts` はここを呼ぶだけ。ADR-0005）。
 * 候補の読み書きは `combobox.dom.ts`、ヒント・エラー文言・共通の `:state()` は `_shared/field.ts`。
 *
 * `filterCandidates` は `rd-command`（コマンドパレット。plan 028）が再利用する前提だが、
 * **2 つ目の利用者が出るまで `_shared/` には移さない**（保守メモ）。
 */
import type { FieldView } from '../_shared/field.js'
import { nextIndex } from '../_shared/roving-focus.js'
import type { ComboboxFilter } from './combobox.contract.js'

/** `<option>` 1 つ。`label` は表示名（`<option>` のテキスト。無ければ `value`） */
export type Candidate = { readonly value: string; readonly label: string }

/** 契約の `filter` 属性と同じ 3 つ（契約が正） */
export type FilterMode = ComboboxFilter

const MODES: ReadonlySet<string> = new Set<FilterMode>(['contains', 'prefix', 'none'])

const isFilterMode = (value: string): value is FilterMode => MODES.has(value)

/**
 * 比較用にそろえる。`NFKC` で全角・半角（`ｶﾅ` と `カナ`、`ＡＢ` と `AB`）を同じにし、
 * 大文字小文字と前後の空白を無視する。
 */
export const normalize = (text: string): string => text.normalize('NFKC').toLocaleLowerCase().trim()

/** 知らない値・未指定は `contains`（既定） */
export const parseFilter = (raw: string | null | undefined): FilterMode => {
  const value = raw ?? ''
  return isFilterMode(value) ? value : 'contains'
}

/** 表示名と値のどちらかが当たれば候補（`<option value="jp">日本</option>` は両方で引ける） */
const hit = (candidate: Candidate, needle: string, mode: FilterMode): boolean =>
  [candidate.label, candidate.value]
    .map(normalize)
    .some((text) => (mode === 'prefix' ? text.startsWith(needle) : text.includes(needle)))

/**
 * 絞り込み。`query` が空なら**全件**（Alt+↓ で全候補を見られる）、`none` も全件
 * （サーバー側で絞る利用側は `<option>` を書き換える）。
 */
export const filterCandidates = (
  all: readonly Candidate[],
  query: string,
  mode: FilterMode,
): readonly Candidate[] => {
  const needle = normalize(query)
  return mode === 'none' || needle === ''
    ? all
    : all.filter((candidate) => hit(candidate, needle, mode))
}

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
