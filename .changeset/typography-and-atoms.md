---
'@rimltempest/riml-ds-tokens': minor
'@rimltempest/riml-ds-css': minor
---

- tokens: `type.display` / `type.heading.3` / `type.heading.4`（display は流体、heading.4 は固定）、`line.height.display`、`letter.spacing.{normal,wide}` を追加
- css: `typography.css` を追加。`.rd-display` / `.rd-heading-1..4` / `.rd-body` / `.rd-small` / `.rd-caption` / `.rd-label` / `.rd-mono` / `.rd-numeric` / `.rd-truncate` / `.rd-clamp` / `.rd-prose`。見出しレベル（`h1`..`h6`）とは独立した「見た目のクラス」
- css: `atoms.css` を追加。JS が要らない静的パターン（`.rd-badge` / `.rd-dot` / `.rd-avatar` / `.rd-separator` / `.rd-skeleton` / `.rd-kbd` / `.rd-tile` / `.rd-icon-button` / `.rd-toolbar` / `.rd-list` / `.rd-table` / `.rd-alert` / `.rd-legend`）
- css: `exports` に `./typography.css` と `./atoms.css` を追加。`@rimltempest/riml-ds-tokens` を `peerDependenciesMeta` で optional にし、npm 未公開の tokens を `file:` で取り込む利用側が 404 で止まらないようにした
- guidelines: `system/guidelines/typography.md`（MCP の `riml-ds://guidelines/typography`）
