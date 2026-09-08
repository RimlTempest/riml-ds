---
'@rimltempest/riml-ds-css': minor
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-tabs`（experimental、ティア B）を追加。JS が無ければページ内リンクの列として動き、パネルはすべて見える。JS が来たら tablist / tab / tabpanel と roving tabindex・自動活性化を足す。`variant="line" | "browser"`、`orientation`、`selected`、`rd-change`
- elements: `rd-menu`（experimental、ティア B）を追加。`popovertarget` + `[popover]` で **JS 無しでも開閉する**。JS が来たら `role="menu"` / `menuitem`、`aria-haspopup` / `aria-expanded`、↑ ↓ / Home / End の roving tabindex、開いたら最初の項目・閉じたらトリガーへのフォーカス移動を足す。`label`、`placement="start" | "end"`、`rd-select` `{ index, href }`
- elements: `rd-popover`（experimental、ティア B）を追加。`rd-menu` と同じ骨格で中身は自由。**非モーダル**の `role="dialog"` で、見出し（`[slot="label"]`）が名前になる。開いたら中の最初の行き先へ、閉じたらトリガーへフォーカスが戻る。`placement`、`rd-toggle` `{ open }`
- elements: `rd-tooltip`（experimental、ティア C）を追加。`for` の相手に `aria-describedby` を足し、ホバーだけに頼らずフォーカスでも出す。Esc で閉じ、吹き出し自身に乗っても消えない（WCAG 1.4.13）。`--rd-tooltip-delay`
- css: `navigation.css` を追加（`.rd-breadcrumb` / `.rd-pagination` / `.rd-nav-rail` / `.rd-menubar` / `.rd-sidebar`）。ARIA は利用側の HTML が持ち、現在地は太さ・面・位置で示す
- wrappers: `RdTabs` / `RdMenu` / `RdPopover` を生成（React のみ正しく出る。Vue / Svelte / Astro は生 HTML の差し込みを既定 slot として 2 回描くため要修正）
