---
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-calendar`（experimental、ティア A）を追加。`<label for>` + `<input type="date">` を包み、JS が無ければ入力欄がそのまま送信され、モバイルでは OS のピッカーが出る。JS が来たときだけ同じ light DOM の末尾に `role="grid"` の月表（APG「Date Picker Dialog」の Grid）を足す。**`<input>` は隠さない**——入力欄と月表の 2 つが同じ値を指す
- elements: 値・範囲・必須は `<input>` の属性（`value` / `min` / `max` / `required`）。ネイティブの検証がそのまま働くので JS 無しでも制約が生きる。ホスト属性は `today`（`YYYY-MM-DD`）と `week-start`（`0`（日曜、既定）〜 `6`）の 2 つだけで、どちらも見え方しか決めない
- elements: キーボードは APG の Grid（← → ±1 日、↑ ↓ ±7 日、Home / End は週の始め・終わり、PageUp / PageDown ±1 か月、Shift 付きで ±1 年、Enter / Space で選ぶ）。gridcell は `<td>` 自身が focusable で、`tabindex="0"` は焦点のある 1 つだけ。範囲の外へフォーカスは動けるが選べない（`aria-disabled`）
- elements: 日を選ぶと `<input>` に `input` / `change` を投げ、host から `rd-change`（`detail: { value }`）を出す。`:state()` は `selected` / `empty` / `at-min` / `at-max` / `malformed`。`--rd-calendar-cell-size` で日のタイルの一辺を変えられる（既定 `--rd-sizing-target-min`）
- elements: 日付の計算は `Date.UTC` の往復だけで書き、タイムゾーンに依存しない。`Temporal` と週情報の `Intl` 拡張（Baseline 外）は使わない。「今日」は `today` 属性で注入できる
- wrappers: `RdCalendar` を生成（react / vue / svelte / astro）
