# @rimltempest/riml-ds-mcp

riml-ds のエージェント向けの面（ADR-0010）。**生成物を読むだけ**の薄い MCP サーバ（stdio）と、
利用側リポジトリに `DESIGN.md` を置く CLI。

## 登録

`.mcp.json`（利用側リポジトリ）:

```json
{
  "mcpServers": {
    "riml-ds": { "command": "bunx", "args": ["@rimltempest/riml-ds-mcp"] }
  }
}
```

## resource / tool

一覧と意味は [`docs/agent-integration.md`](../../docs/agent-integration.md) の表が仕様（ここには写さない）。
resource の URI と tool 名は**公開 API**なので、変えるには ADR-0010 の改訂が要る。

`riml-ds-mcp --help` でも同じ一覧が出る。

## DESIGN.md を作る

```bash
bunx @rimltempest/riml-ds-mcp design-md --theme qrcc > DESIGN.md
bunx @rimltempest/riml-ds-mcp design-md --out DESIGN.md      # テーマ無し
```

フロントマターは `tokens.json`（+ `themes/<brand>` の差分）から生成し、本文は riml-ds の
`DESIGN.md` を継ぐ。出力は `bunx @google/design.md lint` を通る。

## 同梱しているもの

- `tokens.json` … `@rimltempest/riml-ds-tokens` から読む
- `custom-elements.json` … `@rimltempest/riml-ds-elements` から読む
- 使用例のマークアップ … `@rimltempest/riml-ds-elements/<name>/contract` から生成してバンドルに取り込む（`lit` は実行時依存に無い）
- `system/guidelines/*.md` と `DESIGN.md` … このパッケージの `dist/data/` に同梱

**実行時にネットワークへ出ない。** 同梱データは publish 時点のスナップショットなので、
riml-ds に部品やトークンが増えても、このパッケージを publish するまで利用側には届かない
（fixed バージョンなので release 時に自動で publish される）。

## 開発

```bash
bun run --filter @rimltempest/riml-ds-mcp build   # dist/cli.js（shebang 付き）と dist/data/**
bun run test -- --project node tools/mcp
bunx @modelcontextprotocol/inspector node tools/mcp/dist/cli.js
```

## `stylelint-config-standard` / `stylelint-declaration-strict-value` を直接の依存に持つ理由

stylelint は共有設定の `extends` / `plugins` の文字列を、設定ファイルの場所ではなく**呼び出し側**を
起点に解決することがある。`knip.json` の `tools/mcp` で `ignoreDependencies` にしているのはこのため
（コードからは名前で参照されないので knip には未使用に見える）。
