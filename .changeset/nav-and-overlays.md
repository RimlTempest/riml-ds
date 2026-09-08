---
'@rimltempest/riml-ds-css': minor
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-tabs`（experimental、ティア B）を追加。JS が無ければページ内リンクの列として動き、パネルはすべて見える。JS が来たら tablist / tab / tabpanel と roving tabindex・自動活性化を足す。`variant="line" | "browser"`、`orientation`、`selected`、`rd-change`
- elements: `rd-tooltip`（experimental、ティア C）を追加。`for` の相手に `aria-describedby` を足し、ホバーだけに頼らずフォーカスでも出す。Esc で閉じ、吹き出し自身に乗っても消えない（WCAG 1.4.13）。`--rd-tooltip-delay`
- css: `navigation.css` を追加（`.rd-breadcrumb` / `.rd-pagination` / `.rd-nav-rail` / `.rd-menubar` / `.rd-sidebar`）。ARIA は利用側の HTML が持ち、現在地は太さ・面・位置で示す
- wrappers: `RdTabs` を生成（React のみ正しく出る。Vue / Svelte / Astro は既定 slot を 2 回描くため要修正）
