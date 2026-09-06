# エージェント連携

ADR-0010 の配線。正は 3 つ：`tokens.json`、`custom-elements.json`、`system/guidelines/*.md`。

## 利用側リポジトリでの導入

```bash
npx skills add RimlTempest/riml-ds          # skills/riml-ds/SKILL.md を .claude/skills/ に
bun add @rimltempest/riml-ds-tokens @rimltempest/riml-ds-css @rimltempest/riml-ds-react   # フレームワークに合わせて
```

`.mcp.json`：

```json
{
  "mcpServers": {
    "riml-ds": { "command": "bunx", "args": ["@rimltempest/riml-ds-mcp"] }
  }
}
```

`DESIGN.md` を利用側に置く：

```bash
bunx @rimltempest/riml-ds-mcp design-md --theme qrcc > DESIGN.md
```

（`@rimltempest/riml-ds-mcp` は CLI としても動く。`design-md` サブコマンドは `tokens.json` + テーマ差分から
フロントマターを生成し、本文は riml-ds の DESIGN.md を継承する。）

## `@rimltempest/riml-ds-mcp`

| 種別     | 名前                        | 内容                                                                 |
| -------- | --------------------------- | -------------------------------------------------------------------- |
| resource | `riml-ds://tokens`          | `tokens.json`（解決済み）                                            |
| resource | `riml-ds://tokens/{path}`   | 1 トークン（値・説明・モードごとの値・CSS 変数名）                    |
| resource | `riml-ds://elements`        | 部品一覧（名前・status・要約）                                        |
| resource | `riml-ds://elements/{tag}`  | CEM の 1 部品（属性・イベント・slot・parts・CSS 変数・状態・使用例）  |
| resource | `riml-ds://guidelines/{topic}` | `system/guidelines/<topic>.md`                                    |
| resource | `riml-ds://design-md`       | DESIGN.md                                                            |
| tool     | `search_tokens(query)`      | 名前・説明の部分一致。「本文の色」→ `color.text.default`             |
| tool     | `get_element(tag)`          | 上の resource と同じ + フレームワーク別の使用例（React / Vue / Svelte / Astro） |
| tool     | `check_contrast(fg, bg)`    | 2 トークン（または生の色）のコントラスト比と AAA / AA 判定            |
| tool     | `suggest_component(intent)` | 用途文 → 候補部品と理由（CEM の `@summary` と guidelines の対応表から。LLM は使わない） |
| tool     | `lint_css(source)`          | stylelint（`@rimltempest/riml-ds-lint` の設定）を文字列に対して実行              |

実装は生成物を読むだけ。`tokens.json` と `custom-elements.json` はパッケージに同梱し、
ネットワークに出ない。

## Storybook addon-mcp（開発時）

`bun run dev` で `http://localhost:6006/mcp`。`.mcp.json`（このリポジトリ）に登録済み。
エージェントは story 一覧・docs・`run-story-tests` を使える。

## skills

| skill                        | 対象     | 中身                                                         |
| ---------------------------- | -------- | ------------------------------------------------------------ |
| `skills/riml-ds/SKILL.md`    | 利用側   | 導入、禁止事項、レビュー観点、フレームワーク別の落とし穴、MCP |
| `.claude/skills/riml-ds-*`   | 保守側   | architecture / typescript / css / tokens / element / tdd / release / worktree |

## CI での検証（`agent-surface` ジョブ）

```
bun run gen && git diff --exit-code   # CEM / ラッパー / registry.json / DESIGN.md フロントマターが最新
bunx @google/design.md lint DESIGN.md
bun run --filter @rimltempest/riml-ds-mcp test    # resource / tool のスナップショット
```
