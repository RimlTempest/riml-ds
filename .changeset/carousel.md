---
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-carousel`（experimental、ティア A）を追加。利用側が書いた `<ul tabindex="0"><li>…</li></ul>` を包み、**JS が無ければ `.rd-carousel` の atom と同じ横スクロールできる列**のまま。定義されてはじめて前へ／次へのボタンと `<output part="counter">` の「n / N」が末尾に足され、各 `<li>` に `aria-roledescription="slide"` と `aria-label="n / N"` が付く（`role` は書かない。`<ul>` の子は暗黙の `listitem` のまま — axe `list` / `aria-allowed-role`）
- elements: 列そのものの役割と名前は `ElementInternals`（`role = 'group'` / `ariaRoleDescription = 'carousel'` / `ariaLabel = label`）が持つので、利用側の HTML に属性を書き足さない。`label` が無ければ `:state(unlabeled)` + `console.error`
- elements: 属性は `label`（必須）と `loop`（boolean）。`loop` が無ければ端でボタンが `aria-disabled="true"` になる（`disabled` にはしない。フォーカスは受け取れるまま）。イベントは `rd-change`（`detail: { index }`。0 始まり）で、**ボタンでもユーザーの転がりでも**出るが `index` プロパティへの代入では出さない
- elements: 見えている枚は `IntersectionObserver`（`root` は `<ul>`、`threshold: [0.5, 1]`）で決める。`scrollend` は Safari 26.2 以降だけ、`scrollsnapchange` は Chromium だけなので使わない
- elements: `:state()` は `at-start` / `at-end` / `single`（1 枚以下。操作を隠す）/ `unlabeled` / `malformed`。CSS part は `controls` / `prev` / `next` / `counter`、CSS 変数は `--rd-carousel-item`（既定 `min(100%, 20rem)`）と `--rd-carousel-padding`（既定 0）
- elements: 転がる箱は契約が `tabindex="0"` を持つので **JS 無しでも Tab で届く**（axe `scrollable-region-focusable`）。滑らかさは `@media (prefers-reduced-motion: no-preference)` の `scroll-behavior: smooth` だけが決め、JS は必ず `behavior: 'auto'` で呼ぶ。スクロールバーは隠さない
- elements: **自動再生は作らない**（WCAG 2.2.2 / AAA 2.3.3 / 3.2.5。`docs/proposals/carousel.md`）。`.rd-carousel` の atom はそのまま残す
- wrappers: `RdCarousel` を生成（react / vue / svelte / astro）
