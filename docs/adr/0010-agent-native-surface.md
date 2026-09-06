# 0010: エージェント向けの面（DESIGN.md / CEM / MCP / skills）

- 状態: Accepted
- 日付: 2026-09-07
- 関連: ADR-0002, ADR-0003, ADR-0007, [agent-integration.md](../agent-integration.md)

## 文脈

利用側の開発の大半はコーディングエージェント（Claude Code 等）が行う。エージェントに
「このデザインシステムを正しく使わせる」ためには、人向けのドキュメントとは別の面が要る。

調査（2026-09）：

- **DESIGN.md**（Google Labs `design.md`、Apache-2.0、alpha）：YAML フロントマターにトークン
  （hex / rgb / oklch、typography、dimension、`{path}` 参照）、本文は固定順の節
  （Overview / Colors / Typography / Layout / Elevation & Depth / Shapes / Components /
  Do's and Don'ts）。CLI に `lint` / `diff` / `export`（Tailwind / CSS / DTCG）がある。
- **AGENTS.md**（Linux Foundation）：振る舞い。DESIGN.md：見た目。役割が分かれている。
- **Storybook addon-mcp**：`/mcp` で story 一覧・docs・テスト実行を提供。開発時向け。
- **shadcn registry**（`registry.json` / `registry-item.json`）：部品の索引と取得の事実上の標準。
- **CEM**：部品 API の機械可読形式。IDE / Storybook / ラッパー生成器の共通入力。
- **llms.txt**：効果の根拠が弱い。低優先。
- **WebMCP**（`document.modelContext`、`<form toolname>`）：ページ側の機能。Chrome Origin Trial のみ。
- 既存の skills：anthropic `frontend-design`、vercel `web-design-guidelines`、`ui-skills`、
  `web-quality-skills`。Lit / DS 保守向けは無い。

## 決定

エージェント向けの面を **すべて生成物か薄い手書き**にし、正は 3 つに限定する：

| 正                       | 生成元          | 消費者                                          |
| ------------------------ | --------------- | ----------------------------------------------- |
| `tokens.json`            | Terrazzo        | DESIGN.md フロントマター、MCP、Storybook docs   |
| `custom-elements.json`   | CEM analyzer    | ラッパー、Storybook argTypes、MCP、registry.json|
| `system/guidelines/*.md` | 手書き          | DESIGN.md 本文、skills、Storybook Docs          |

その上に：

1. **`DESIGN.md`** をリポジトリルートに置く。フロントマターは `tools/design-md` が `tokens.json`
   から生成し、本文は Google の節順で手書き。CI で `design.md lint` と「フロントマターが最新か」
   を検証。利用側リポジトリへは `@rimltempest/riml-ds-tokens/DESIGN.md` としても配る（コピーして
   `themes/<brand>` の差分を当てる CLI `riml-ds design-md --theme qrcc`）。
2. **`AGENTS.md`** はルートに 1 つ。CLAUDE.md は AGENTS.md への参照 + Claude 固有の skill 表。
3. **`@rimltempest/riml-ds-mcp`**（stdio、`bunx @rimltempest/riml-ds-mcp`）：リソース `tokens://`、`elements://<name>`、
   `guidelines://<topic>`、ツール `search_tokens`、`get_element`、`check_contrast`、
   `suggest_component`（用途 → 部品名と使い方）。**依存は MCP SDK だけ**、実装は生成物を
   読むだけの薄いもの。
4. **`skills/riml-ds/SKILL.md`**（利用側向け、`npx skills add RimlTempest/riml-ds`）：導入手順、
   禁止（生値・独自ボタン・`aria-live` の自作）、レビュー観点、MCP の登録方法、
   フレームワーク別の落とし穴。**保守側 skill（`.claude/skills/riml-ds-*`）とは分ける。**
5. **`registry.json`**（shadcn 互換の形）を `tools/cem` が生成し、GitHub Pages で配る。
   `npx shadcn add https://…/r/button.json` 相当の導線を将来提供できる形にしておく。
6. **Storybook addon-mcp** を開発時に使う（ADR-0007）。
7. **WebMCP は部品の責務ではない**が、フォーム部品は `name` / `value` / `form` の属性と
   `ElementInternals` によるフォーム参加を保つ（ADR-0008）。これにより利用側の
   `<form toolname>` 宣言型 WebMCP がそのまま動く。
8. **llms.txt は作らない**（DESIGN.md と AGENTS.md で足りる。効果が示されたら再検討）。

## 理由

- 正を 3 つに絞ると、面が増えても同期の問題が起きない。手書きの面は「生成物へのポインタ」
  以上を持たない。
- DESIGN.md は Google の仕様に乗ることで、他のエージェント／ツール（`design.md export`）が
  そのまま読める。独自形式にしない。
- MCP を薄くするのは、SDK の更新に一人で追従できる範囲に留めるため。
- skills を利用側と保守側で分けるのは、利用側に「Lit の書き方」を配っても害しかないから。

## 捨てた選択肢

- **手書きの `docs/components/*.md`** — CEM と乖離する。Storybook autodocs で代替。
- **llms.txt** — 効果不明。保守コストだけ増える。
- **フル機能の MCP（生成・修正まで）** — スコープ過大。まず「読める」を保証する。
- **Figma MCP** — Figma を持たない（ADR-0003）。

## 影響

- CI `agent-surface` ジョブ：`tools/design-md` を実行して DESIGN.md の diff がゼロ、
  `design.md lint` が通る、`custom-elements.json` を再生成して diff がゼロ。
- `system/guidelines/*.md` を変えたら DESIGN.md の対応する節も直す（PR テンプレの項目）。
- `skills/riml-ds/SKILL.md` はリリースごとに「対応バージョン」を更新する。
