---
'@rimltempest/riml-ds-mcp': minor
---

エージェント向けの面として `@rimltempest/riml-ds-mcp` を追加した。

- MCP サーバ（stdio、`bunx @rimltempest/riml-ds-mcp`）：resource 6 種（`riml-ds://tokens`、
  `riml-ds://tokens/{path}`、`riml-ds://elements`、`riml-ds://elements/{tag}`、
  `riml-ds://guidelines/{topic}`、`riml-ds://design-md`）と tool 5 種（`search_tokens` /
  `get_element` / `check_contrast` / `suggest_component` / `lint_css`）。生成物を読むだけで、
  実行時にネットワークへ出ない（ADR-0010）
- `design-md` サブコマンド：`tokens.json` + `themes/<brand>` の差分から利用側の `DESIGN.md` を作る
