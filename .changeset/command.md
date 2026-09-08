---
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-command`（experimental、ティア A）を追加。`<label for>` + `<input type="search">` + リンクとボタンの `<ul>` を包むコマンドパレット。**JS が無くても一覧はそのまま辿れる**（入力欄が飾りになるだけ）。項目は利用側が `commandGroupMarkup()` / `commandItemMarkup()` で書く（部品は生成しない）
- elements: 項目は**本物のリンク／ボタンのまま**で、`aria-activedescendant` ではなくフォーカスを移す（roving）。リンクの「Enter で飛ぶ」「⌘クリックで新しいタブ」がネイティブに残る。入力欄では ↓ ↑ で項目へ、Enter で 1 件目、Esc で入力を空に。項目では ↓ ↑ Home End で移動し、**印字キーで入力欄に戻って打ち続けられる**
- elements: 絞り込みは `filter` 属性（`contains`（既定）/ `prefix` / `none`）。検索文字列は表示テキスト + `data-keywords`（空白区切りの別名）。隠すのは `<li hidden>` で、項目が全部隠れた `<ul>` も隠す。0 件のときだけ `[part="empty"]`（`role="status"`、文言は `empty-text`）を見せる。押された項目は `rd-select`（`detail: { value, label }`）で知らせ、既定動作は妨げない
- elements: 絞り込みの純関数を `_shared/text-filter.ts` に移し、`rd-combobox` と `rd-command` で共有する（`combobox.logic.ts` は再エクスポートするだけで挙動は変わらない）
- wrappers: `RdCommand` を生成（react / vue / svelte / astro）
