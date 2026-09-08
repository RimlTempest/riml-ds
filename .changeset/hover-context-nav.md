---
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-css': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-popover` に `hover` を追加（Hover Card）。トリガーに乗せる / フォーカスすると遅れて開き（開く 300ms / 閉じる 200ms）、離れると遅れて閉じる。**押して開く経路（`popovertarget`）はそのまま残る**ので、キーボード・タッチ・JS 無しでは今までどおりボタンが働く。hover で開いたときは**フォーカスを奪わない**（読み中の人から取り上げない）。`role="dialog"` と見た目は変えていない
- elements: `rd-menu` に `context` を追加（Context Menu）。`[slot="trigger"]` の面で右クリック（長押し・Shift+F10 / Menu キー）するとポインタの位置に開く。**目に見えるボタンは必ず残る**（APG）。キーボードからの `contextmenu` は座標が 0 なのでトリガーに寄せる。閉じると位置を忘れて `anchor-name` に戻る
- elements: `hover` / `context` を付けないときの `rd-popover` / `rd-menu` の挙動は変わらない
- css: `navigation.css` に `.rd-nav-menu` を追加。ページの主要ナビの帯で、面は surface（窓の帯 `.rd-menubar` は chrome のまま）。現在地は `aria-current` を太字 + 下の縦罫で示し、`48rem` 未満では折り返さず横に流れる。強制配色では下線に置き換わる
- wrappers: `RdPopover` に `hover?: boolean`、`RdMenu` に `context?: boolean` が出る
