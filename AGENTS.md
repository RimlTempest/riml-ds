# AGENTS.md

エージェント向けの入口。振る舞いの規約は `CLAUDE.md` と `.claude/skills/riml-ds-*`、
見た目の正は `DESIGN.md`、判断の理由は `docs/adr/`。

- このリポジトリを**使う側**のエージェントは `skills/riml-ds/SKILL.md` を読む
  （`npx skills add RimlTempest/riml-ds` で導入できる）。
- コンポーネントの API は `library/elements/custom-elements.json`（Custom Elements Manifest）が正。
  `bunx @riml-ds/mcp` で MCP サーバとして同じ情報を引ける。
- トークンは `system/tokens/dist/tokens.json`（DTCG）が正。CSS 変数名は `--rd-<category>-<role>-<variant>`。
