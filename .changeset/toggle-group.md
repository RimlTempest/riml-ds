---
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-toggle-group`（experimental、ティア A）を追加。`<fieldset>` / `<legend>` と `<button aria-pressed>` の列を包み、**送信には載せない**押下ボタンの列（書式ツールバーの B / I / U、表示切替の「一覧 / カード」）にする。部品がするのは 3 つだけ：`mode="single"` のとき他の `aria-pressed` を `false` に戻す、矢印 / Home / End で列の中を移動する（roving tabindex。APG「Toolbar」。`disabled` は飛ばし、扱わないキーでは `preventDefault()` しない）、`rd-change`（`detail: { values }`）を投げる。`single` でも押されている項目をもう一度押せば解除できる（0 個を許す）
- elements: 押下の真実は各 `<button>` の `aria-pressed` 属性で、`values` プロパティは getter / setter がそこへ委譲するだけ。`values` setter と外からの属性書き換えでは `rd-change` を出さない（ユーザー操作だけ）。`toggleGroupMarkup()` / `toggleItemMarkup()` でマークアップを組む（`aria-pressed` は省略時 `"false"`）。属性は `mode`（`multiple` 既定 / `single`）、`orientation`（`horizontal` 既定 / `vertical`）、`variant`（`outline` 既定 / `ghost`。`rd-toggle` と同じ名前）。無効化はネイティブの `<button disabled>` に任せる
- elements: JS が無いときは「押しても変わらない普通のボタンの列」に縮退する（`tabindex` は JS が付けるので全部 Tab で辿れる）。**送信に載せる値には使わない** —— `rd-radio-group segmented`（単一）/ `rd-checkbox-group segmented`（複数）を使う
- wrappers: `RdToggleGroup` を生成（`mode` / `orientation` / `variant`）
