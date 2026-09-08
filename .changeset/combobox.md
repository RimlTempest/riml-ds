---
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-combobox`（experimental、ティア A）を追加。`<label for>` + `<input list>` + `<datalist>` を包み、JS が無ければネイティブの `<datalist>` がそのまま候補を出す。定義後は `list` 属性を外して APG「Combobox with List Autocomplete」の形（`role="combobox"` + `[part='list']` の listbox、`aria-activedescendant`）に置き換える。候補の唯一の出どころは `<datalist>` で、`MutationObserver` が `<option>` の増減に追随する
- elements: 絞り込みは `filter` 属性（`contains`（既定）/ `prefix` / `none`）。`NFKC` + `toLocaleLowerCase()` で正規化して比べるので `ｶﾅ` と `カナ`、`AB` と `ＡＢ` が同じ候補に当たる。0 件のときは閉じたままにして `:state(empty)` を出す
- elements: 自由入力を許す（候補に無い値も送れる）。候補限定にしたいときは `pattern` / `required` をネイティブに書く。候補で確定したときだけ `rd-select`（`detail: { value, index }`）を出す
- wrappers: `RdCombobox` を生成（react / vue / svelte / astro）
