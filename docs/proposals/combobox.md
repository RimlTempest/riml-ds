# 提案: `rd-combobox`（experimental）

## 目的

「打つと候補が絞られ、矢印で選び、Enter で確定する」入力欄（shadcn の Combobox / Autocomplete に
当たるもの）が無い。`rd-select` は `<select>` を包むので候補が多いと探せず、自由入力もできない。

`rd-combobox` は `<input list>` + `<datalist>` を包むティア A（ADR-0012）で、**JS が無ければ
ネイティブの `<datalist>` がそのまま候補を出す**。部品は見た目と操作を整えるだけで、値・送信・検証は
ネイティブが持つ。候補は利用側が `<option>` で書く（`rd-select` と同じで、部品は候補を生成しない）。

## API

- ティア A。契約は `rd-combobox > label`（必須）、`> input[list]`（必須）、`> datalist`（必須）。
  候補は `comboboxOptionMarkup({ value, label })` で組む
- 属性: `hint`、`error`、`filter`（`contains`（既定）/ `prefix` / `none`）
- **定義後は `list` 属性を外し**、APG「Combobox with List Autocomplete」の形に置き換える
  （`<input>` に `role="combobox"` `aria-autocomplete="list"` `aria-expanded` `aria-controls`
  `aria-activedescendant`、候補は `<div part="list" role="listbox" popover="manual">` に写す）。
  外さないとネイティブの吹き出しと部品のリストが二重に出る。`<datalist>` は候補の**唯一の出どころ**として
  残し、`MutationObserver` で `<option>` の増減に追随する
- 絞り込みは `NFKC` + `toLocaleLowerCase()` で正規化して比べる（`ｶﾅ` と `カナ`、`AB` と `ＡＢ`）。
  表示名と値のどちらかが当たれば候補。`query` が空なら全件（Alt+↓ で全候補を見られる）
- **自由入力を許す**。候補に無い値も送れる。候補限定にしたいときは利用側が `pattern` / `required` を書く
  （ネイティブ検証。文言は `_shared/field.ts` が出す）
- キーボード（APG）: ↓ / ↑ で候補を移動（フォーカスは `<input>` に留め `aria-activedescendant` で示す）、
  Enter は**候補が選ばれているときだけ**確定（それ以外はフォーム送信を妨げない）、Esc で閉じる（値は消さない）、
  Alt+↓ で開く、Tab で閉じる（確定しない）。**Home / End は横取りしない**（入力欄のカーソル移動）
- ポインタでも同じ: `option` の `pointerdown` で `preventDefault`（入力欄のフォーカスを奪わない）→ `click` で確定
- イベント: `rd-select`（`detail: { value, index }`）。候補で確定したときだけ。
  自由入力の `input` / `change` はネイティブがそのまま出す
- `:state()`: `invalid` / `errored` / `hinted` / `filled` / `malformed` / `open` / `empty`
- 0 件のときは**閉じる**（空のリストボックスを見せない。`:state(empty)` だけを出す）

## a11y

- 名前はネイティブの `<label for>`。候補リストも同じラベルを `aria-labelledby` で指す
- 読み上げは `aria-activedescendant` に任せ、**候補数の案内は出さない**（ADR-0008 §6。数の案内は騒がしい）
- 当たっている候補は面の色と**左の縦罫**で示す（色だけに頼らない。`menu.css` と同じ見せ方）。
  強制配色では内側の `outline: Highlight`（フォーカスリングは `<input>` にあるので競合しない）
- `[popover="manual"]` を使う（light dismiss ではなく部品が閉じる）。入力欄がフォーカスを持ったまま
  候補を出すため、light dismiss だと打つたびに閉じてしまう
- `hint` / `error` は `<input>` の `aria-describedby` で結ぶ（`rd-text-field` / `rd-select` と同じ）

## 代替案

- **候補限定なら `rd-select`**: 選べる値が決まっていて数が少ないなら `<select>` のほうが良い。
  ネイティブの選択 UI（モバイルのホイールなど）が使えて、部品が要らない
- **複数選択（タグ入力）は作らない**: `rd-checkbox-group` か、将来の `rd-multi-select` に分ける。
  値の型が `string` から配列に変わるので 1 つの部品に混ぜない
- **`rd-command`（コマンドパレット）**: 028 で `filterCandidates` を再利用する。
  2 つ目の利用者が出たときに `_shared/` へ移す（それまでは `combobox.logic.ts` に置いたまま）
- **Home / End を候補の先頭 / 末尾に割り当てる**: `_shared/roving-focus.ts` の `nextIndex` は
  Home / End も返すが、combobox では**呼ばない**。入力欄にはカーソルがあり、行頭 / 行末への移動を
  奪うとテキスト編集が壊れる（APG も combobox では横取りしないと書いている）
- **候補の非同期読み込みを部品が持つ**: 持たない。利用側が `<option>` を書き換えれば
  `MutationObserver` が拾う。`fetch` を部品に入れると依存注入と中止処理が要る（ADR-0012 の範囲外）
