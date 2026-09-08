---
'@rimltempest/riml-ds-css': minor
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-checkbox-group`（experimental、ティア A）を追加。`<fieldset>` / `<legend>` と `<label>` が包む `<input type="checkbox">` に状態と文言を足す。`segmented` は `rd-radio-group` と同じピルの区画（見た目だけ）、`min` は「1 つ以上」を部品が見る（ネイティブの検証に無い判定なので **JS が無いと効かない**。サーバ側の検証を省く理由にしない）。`value` は checked の値の配列。`checkboxOptionMarkup()` で選択肢を組む
- elements: `rd-input-otp`（experimental、ティア A）を追加。桁ごとの `<input inputmode="numeric" maxlength="1">` を `<fieldset>` に並べ、JS 無しでも Tab で 1 桁ずつ入力して送信できる（`name-1` … `name-N` の N フィールド）。JS があるときだけ自動前進・`Backspace` で戻る・貼り付けで分配する。`otpCellsMarkup()` で桁を組む
- css: `patterns.css` に `.rd-button-group`（ボタンの列を 1 つの沈んだ枕にまとめる）を追加。JS が要らないので部品にしない（ADR-0012 §6）。`data-orientation="vertical"` で縦並び。枕が沈んだ面なので中に `ghost` は入れない（AAA の 7:1 に届かない）
- wrappers: `RdCheckboxGroup` / `RdInputOtp` を生成
