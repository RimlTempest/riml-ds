/**
 * 打った文字で候補を絞る純関数。DOM を触らない。
 *
 * `rd-combobox`（plan 025）と `rd-command`（plan 028）の 2 部品が使う——
 * 025 の保守メモ「2 つ目の利用者が出たら `_shared/` に移す」に従ってここへ移した。
 * 比較規則（NFKC + `toLocaleLowerCase`）を変えると**両方の絞り込みが変わる**。
 */

/** 絞り込みの対象 1 つ。`label` は表示名、`value` は値（どちらでも引ける） */
export type Candidate = { readonly value: string; readonly label: string }

/** 絞り込みの仕方。`none` は「呼び側が絞る」（サーバー側検索）向け */
export type FilterMode = 'contains' | 'prefix' | 'none'

const MODES: ReadonlySet<string> = new Set<FilterMode>(['contains', 'prefix', 'none'])

const isFilterMode = (value: string): value is FilterMode => MODES.has(value)

/**
 * 比較用にそろえる。`NFKC` で全角・半角（`ｶﾅ` と `カナ`、`ＡＢ` と `AB`）を同じにし、
 * 大文字小文字と前後の空白を無視する。
 */
export const normalize = (text: string): string => text.normalize('NFKC').toLocaleLowerCase().trim()

/** 知らない値・未指定は `contains`（既定） */
export const parseFilterMode = (raw: string | null | undefined): FilterMode => {
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
 * （サーバー側で絞る利用側は候補そのものを書き換える）。
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
