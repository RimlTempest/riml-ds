---
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- wrappers: 契約の木の**名前つき `{ raw }`** が既定 slot に潰れて同じ子を 2 回描いていたのを直した。`rd-menu` は `trigger` / `items`、`rd-popover` は `trigger`、`rd-tabs` は `tabs` / `panels` を名前つき slot で受ける（Svelte は `{#snippet trigger()}`、Vue は `<template #trigger>`、Astro は `slot="trigger"`）。`$children` は今までどおり既定 slot で、他の部品の生成物は変わらない
- wrappers: ハイフンを含む属性（`aria-pressed` など）を prop に結んだ木が Vue で構文エラーになっていたのを直し、`button` の `aria-pressed` を `'true' | 'false'` に絞るようにした
- astro: `package.json` の `exports` を `bun run gen` が書くようにし、experimental の `.astro` を 7 個追加で公開（`menu` / `meter` / `popover` / `radio-group` / `slider` / `tabs` / `window`）。これまで手書きで、10 個あるうち 3 個しか import できなかった
