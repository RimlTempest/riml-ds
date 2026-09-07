---
'@rimltempest/riml-ds-css': minor
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- css: `patterns.css` に窓 `.rd-window` / `.rd-window-title` / `.rd-window-body` を追加（帯 + 丸 3 つ、`data-tone`）。`hr` を点線に、見出しを display スタックに
- elements: ボタンをピル・太字・枠なしに（hover / active を追加）。入力・チェックボックス・スイッチ・開閉・ダイアログ・トーストを「まど」の形に
- elements: `rd-meter`（experimental、ティア A）を追加。`<meter>` / `<progress>` を包み `--rd-meter-fill` を書く
- wrappers: `RdMeter` を生成
