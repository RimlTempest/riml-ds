---
'@rimltempest/riml-ds-css': minor
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-radio-group`（experimental、ティア A）を追加。`<fieldset>` / `<legend>` と `<label>` が包む `<input type="radio">` に状態と文言を足す。`segmented` 属性は見た目だけをピルの区画に変え、役割・送信・矢印キーは radio のまま（JS も `:has()` も無ければ普通の radio に見える）。`radioOptionMarkup()` で選択肢を組む
- elements: `rd-slider`（experimental、ティア A）を追加。`<input type="range">` を包み、塗りの割合を `--rd-slider-fill` に写して `<output>` に現在値を書く。`orientation="vertical"` は `writing-mode: vertical-lr` で上が最大
- css: `patterns.css` に `.rd-input-group`（入力とボタンを 1 つのピルの枕にまとめる）を追加。JS が要らないので部品にしない（ADR-0012 §6）
- wrappers: `RdRadioGroup` / `RdSlider` を生成
