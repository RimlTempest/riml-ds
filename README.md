# riml-ds

riml のプロダクト群（qrcc・noter …）が共有するデザインシステムとコンポーネントライブラリ。

| 領域       | パッケージ                                                     | 中身                                           |
| ---------- | -------------------------------------------------------------- | ---------------------------------------------- |
| システム   | `@rimltempest/riml-ds-tokens`, `@rimltempest/riml-ds-css`                              | DTCG トークン、基礎 CSS、ガイドライン、DESIGN.md |
| ライブラリ | `@rimltempest/riml-ds-elements`, `@rimltempest/riml-ds-react`, `@rimltempest/riml-ds-vue`, `@rimltempest/riml-ds-svelte`, `@rimltempest/riml-ds-astro` | Lit Web Components と生成ラッパー |
| ツール     | `@rimltempest/riml-ds-lint`, `@rimltempest/riml-ds-mcp`                                | 利用側で使う lint 設定と MCP サーバ            |

- 使い方: `skills/riml-ds/SKILL.md`（エージェント向け）/ Storybook（GitHub Pages）
- 設計: `docs/architecture.md`、`docs/adr/`、`DESIGN.md`
- 開発: `CLAUDE.md`

## リリース

changesets で版と CHANGELOG を管理する。公開パッケージは **fixed**（全部同じ版で上がる）。
`0.x` の間は minor に破壊的変更が入り得る（ADR-0009）。

1. 変更する PR に `bun run changeset` で `.changeset/*.md` を足す
2. main へのマージで `release.yml` が Version PR を作る
3. Version PR のマージで npm へ publish（Trusted Publishing、トークン無し）

詳細は `docs/publishing.md`。

## ライセンス

MIT
