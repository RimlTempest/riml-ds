---
'@rimltempest/riml-ds-css': minor
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- css: `atoms.css` に `.rd-card` / `.rd-empty` / `.rd-spinner` / `.rd-accordion` / `.rd-carousel` / `.rd-scroll-area` を追加。JS が要らないので部品にしない（ADR-0012 §6）。待ちの輪は罫線で描き、回転は `prefers-reduced-motion: no-preference` の中だけ。転がる入れ物の細いスクロールバーは `@supports (scrollbar-width: thin)` の中で、強制配色では既定に戻す
- css: `utilities.css` に `.rd-aspect`（比を固定した入れ物。比は `--rd-aspect`、`data-ratio="1" | "4-3"`）を追加
- elements: `rd-dialog` に `alert` と `placement` を追加。`alert` は `role="alertdialog"` にして背面クリックだけを止める（Esc と帯の × は効く）。`placement="start" | "end" | "bottom"` は窓を画面の端に着ける帯（Sheet / Drawer）で、`:state(start|end|bottom)` が付く。既定（`center`）の見た目と既存の API（`open` / `persistent` / `show()` / `close()` / `rd-dismiss`）は変わらない
- wrappers: `RdDialog` に `alert` / `placement` の props を生成
