---
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
---

- elements: `rd-toggle`（experimental、ティア A）を追加。`<button type="button" aria-pressed>` を包み、押下で属性を反転して `rd-toggle` イベントを出す。押下の真実は `aria-pressed` 属性だけで、`pressed` プロパティはネイティブに委譲する（外から属性を書き換えても `:state(pressed)` が追随する）。`variant` は `outline`（既定）/ `ghost`。無効化はネイティブの `<button disabled>` に任せる
- elements: `rd-menu` の閉じたメニューが定義後も見えていたのを修正。`display: grid` を `rd-menu [popover]:popover-open` の側に移し、閉じているあいだは UA の `[popover]:not(:popover-open) { display: none }` に任せる
- wrappers: `RdToggle` を生成
