---
'@rimltempest/riml-ds-css': minor
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- **破壊的（0.x）**: 窓の帯を「帯 = 見出し」から「帯 ⊃ 見出し」に変えた（ADR-0014）。
  css: `.rd-window-bar` / `.rd-window-controls` / `.rd-window-control[data-action]` を追加し、
  `.rd-window-title::before` の丸（`radial-gradient`）を削除。`data-tone` の付け先が見出しから帯へ移った。
  移行は `docs/migration.md`「0.2 → 0.3: 窓の帯」
- elements: `rd-window`（experimental、ティア B）を追加。閉じる / 広げる / たたむの丸は**本物の `<button>`**で、
  `closable` / `expandable` / `collapsible` / `collapsed` / `expanded` / `tone` と
  `rd-dismiss` / `rd-toggle` / `rd-expand`。見出しは `slot="title"` に利用側が置く
- elements: `rd-dialog` の帯の左端に ×（閉じる）を追加（`persistent` では出さない）。
  `rd-dismiss` の `reason` に `'button'` が増え、part に `bar` / `controls` / `close` が増えた
- elements: `rd-meter` の塗りの端を丸くした（トラックだけでなく塗りもピルになる）
- wrappers: `RdWindow` を生成
