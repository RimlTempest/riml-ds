---
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-splitter`（experimental、ティア B）を追加。`slot="start"` と `slot="end"` の 2 面のあいだに WAI-ARIA APG「Window Splitter」の `role="separator"` のつまみを 1 つ置き、つまみを動かすと 2 面の割合が変わる。JS が無いあいだは 2 面が縦に積まれて両方読め、つまみは 1 つも現れない（`:not(:defined)`）
- elements: `direction`（`horizontal`（既定。面が横に並ぶ）/ `vertical`）・`position`（%。既定 50。反映される属性）・`min`（20）・`max`（80）・`label`（つまみの名前。必須）。**`aria-orientation` は `direction` と逆になる**（横に並ぶ 2 面のあいだの仕切りは縦線。`docs/proposals/splitter.md`）
- elements: キーは APG のとおり ← → / ↑ ↓ で 1%、Shift で 10%、Home → `min`、End → `max`（RTL の横並びは ← → を反転）。扱わないキーは横取りしない。ドラッグは `setPointerCapture` を取るので面の外へ出ても追従する
- elements: 利用者の操作で割合が変わったときだけ `rd-resize`（`detail: { position }`）を出す。JS からの `position` 書き換えでは出さない。`pointermove` ごとに出るので、間引きが要るなら利用側で間引く
- elements: つまみの標的は 44px（WCAG 2.5.5 AAA）。見える太さは `--rd-splitter-size`（既定 `var(--rd-space-2)`）のままで、透明な当たり領域だけを `var(--rd-sizing-target-min)` に広げる
- wrappers: `RdSplitter` を生成（react / vue / svelte / astro）
