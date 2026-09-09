---
'@rimltempest/riml-ds-elements': patch
'@rimltempest/riml-ds-css': patch
---

- elements: `rd-splitter` の面（`[part='start']` / `[part='end']`）が溢れているときだけ `tabindex="0"` を付けるようにした。キーボードだけの人が転がせる（axe `scrollable-region-focusable`）。溢れていない面には付けないので Tab の止まる所は増えない。焦点環は面の**内側**に描く（`overflow: auto` の箱の外に出すと親に切られる）
- elements: `rd-command` の 0 件表示（`[part='empty']`）が 80ch で止まらないようにした（`max-inline-size: none`）。80ch より広いパレットで、中央揃えの文言が左に寄っていた
- css: `.rd-table` の見出しセル（`th`）を折り返さないようにした（`white-space: nowrap`）。短い見出しが 2 行になると行の高さが揃わない。`td` は今までどおり折り返す。横に溢れる表は `.rd-table-scroll` で包む
