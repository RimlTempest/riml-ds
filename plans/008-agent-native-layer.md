# Plan 008: エージェント向けの面（`@rimltempest/riml-ds-mcp`・`design-md` CLI・registry 配布・skills の仕上げ）

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat <plan-007 のマージコミット>..HEAD -- tools/mcp skills AGENTS.md tools/cem/registry.json library/elements/custom-elements.json system/tokens/dist tools/design-md/src/core docs/agent-integration.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW〜MEDIUM（MCP SDK の API 追従、stdio サーバのテスト方法、`tools/design-md` の core を他レーンから再利用する境界）
- **Depends on**: 007（公開パッケージの形・changesets が決まってから。`tools/mcp` も公開パッケージ）
- **Category**: direction
- **Planned at**: commit `7bf04e8`, 2026-09-07

## Why this matters

「AI Native」の中身。利用側（qrcc / noter やそれ以外）のエージェントが、riml-ds の**正**（`tokens.json`、`custom-elements.json`、
guidelines）をネットワーク無しで引けるようにする（ADR-0010）。MCP は生成物を読むだけの薄い層なので保守コストが小さく、
部品やトークンを足せば自動で配られる。`design-md` CLI は利用側リポジトリに `DESIGN.md` を置く導線（Google の design.md 形式）。

## Current state

- plan 001〜007 完了。`system/tokens/dist/tokens.json`（解決済み DTCG、モード別値を含む）、`library/elements/custom-elements.json`
  （`pe` / `status` / `summary` / `cssStates` / `dependsOn`）、`tools/cem/registry.json`、`system/guidelines/*.md`、`DESIGN.md`（フロントマター生成済み）。
- `tools/design-md/src/core/`（plan 002。純関数 `buildFrontmatter(tokens, opts)` など。**private パッケージ**、`bin` 無し）。
- `tools/mcp/` は**無い**。`skills/riml-ds/SKILL.md` はある（対応バージョン欄は未記入）。`AGENTS.md` はある（MCP の起動コマンドを書いてある）。
- 仕様の正：
  - `docs/adr/0010-agent-native-surface.md` §決定 3（MCP：stdio、依存は MCP SDK だけ、生成物を読むだけ）、5（registry.json、shadcn 互換の形）、8（llms.txt は作らない）
  - `docs/agent-integration.md`：**resource / tool の一覧表がそのまま仕様**（`riml-ds://tokens`、`riml-ds://tokens/{path}`、`riml-ds://elements`、
    `riml-ds://elements/{tag}`、`riml-ds://guidelines/{topic}`、`riml-ds://design-md`；tool `search_tokens` / `get_element` / `check_contrast` /
    `suggest_component` / `lint_css`）。`design-md --theme <brand>` サブコマンド。CI の `agent-surface` ジョブの中身（plan 010 が配線）
  - `docs/adr/0012`：`get_element` の使用例はティア別（A は契約の `markup()` 出力をそのまま HTML 例にする）
  - `docs/publishing.md`：`tools/mcp` は **tsdown でバンドル**（ADR-0009 §パッケージ形態「tsdown は `tools/mcp`（CLI）だけ」）。`bunx` で起動されるので依存は少なく
  - `skills/riml-ds/SKILL.md`：利用側 skill。**このレーンが所有**。内容は既に書かれている → 「対応バージョン」「MCP の tool 名」「`design-md` の使い方」を実装に合わせて仕上げる
- バージョン（着手時に `npm view` で確定）：`@modelcontextprotocol/sdk`（1.x。`McpServer` + `StdioServerTransport`、`registerResource` / `registerTool`、
  `ResourceTemplate`）、`zod`（SDK の peer）、`tsdown`、`@google/design.md` 0.4.0（lint 用 devDep）、`stylelint` 17.15.0（`lint_css` 用。`@rimltempest/riml-ds-lint` の設定を読む）。
- **MCP のテスト**：SDK の `Client` + `InMemoryTransport`（`createLinkedPair()`）でサーバをプロセス内から叩く（Context7 で API 名を確認）。stdio を spawn しない。

## Commands you will need

| Purpose            | Command                                                        | Expected on success                                  |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------- |
| ビルド             | `bun run --filter @rimltempest/riml-ds-mcp build`              | `tools/mcp/dist/cli.js`（単一ファイル + 同梱データ） |
| 起動（手動確認）   | `echo '{"jsonrpc":"2.0","id":1,"method":"initialize",…}' \| bun tools/mcp/dist/cli.js` | JSON-RPC 応答            |
| design-md          | `bun tools/mcp/dist/cli.js design-md --theme qrcc`             | stdout に DESIGN.md                                  |
| テスト             | `bun run test -- --project node --dir tools/mcp`               | pass                                                 |
| Inspector（任意）  | `bunx @modelcontextprotocol/inspector bun tools/mcp/dist/cli.js` | ブラウザで resource / tool 一覧                   |
| 総合               | `bun run check && bun run test && bun run guard`               | exit 0                                               |

## Suggested executor toolkit

- skill：`riml-ds-typescript`、`riml-ds-tdd`、`riml-ds-architecture`、`riml-ds-tokens`（コントラスト計算の既存関数がどこにあるか）
- Context7：`/modelcontextprotocol/typescript-sdk`（`McpServer`、`registerResource` with `ResourceTemplate`、`registerTool` with zod、
  `StdioServerTransport`、`InMemoryTransport`）、`/rolldown/tsdown`（`bin` 出力、`shims`、外部化しない設定）、`/stylelint/stylelint`（`stylelint.lint({ code, config })`）
- `docs/tokens.md` §コントラスト（plan 002 で `system/tokens` に `contrastRatio(fg, bg)` があるはず。**無ければ MCP 側に実装せず STOP**：正は tokens 側）

## Scope

**In scope**:

- `tools/mcp/**`（`package.json`、`tsconfig.json`、`tsdown.config.ts`、`src/core/**`（純関数）、`src/server.ts`、`src/cli.ts`、`src/design-md.ts`、`test/**`、`README.md`）
- `skills/riml-ds/SKILL.md`（対応バージョン・MCP tool 名・`design-md` の使い方の**仕上げのみ**。構成や方針は変えない）
- `AGENTS.md`（MCP の起動コマンドと `design-md` の 1 行が実装と一致するかの確認・修正のみ）
- root `package.json`（`tools/mcp` を `build` の filter に含める、devDeps）、`tsconfig.json`（reference）、`.size-limit.json`（**足さない**。CLI はサイズ予算外）
- `plans/README.md`（自分の行だけ）

**Out of scope**:

- `tools/design-md/**`（core を **import して再利用**する。足りない関数があれば STOP）、`system/**`、`library/**`、`tools/cem/**`
- `.github/**`（`agent-surface` ジョブと Pages は plan 010）、`docs/**`、`.claude/skills/**`、`DESIGN.md`、`CLAUDE.md`

## Git workflow

- Branch: `feat/agent`（`bun run wt new feat/agent`）
- 例：`feat(mcp): add token and element resources`、`feat(mcp): add search_tokens and get_element tools`、`feat(mcp): add design-md subcommand`、
  `docs(skills): finalize consumer skill for 0.1`
- push しない

## Steps

### Step 1: パッケージと同梱データ

`tools/mcp/package.json`：`@rimltempest/riml-ds-mcp`、`type: module`、`bin: { "riml-ds-mcp": "./dist/cli.js" }`、`exports` は **`.` 無し**（CLI 専用。`./package.json` のみ）、
`files: ["dist", "README.md"]`、`dependencies`：`@modelcontextprotocol/sdk`、`zod`、`stylelint`、`@rimltempest/riml-ds-lint`（`lint_css` の設定）、
`@rimltempest/riml-ds-tokens`（`tokens.json` と `contrastRatio`）、`@rimltempest/riml-ds-elements`（`custom-elements.json` と `contract`）。
**guidelines と DESIGN.md はパッケージに無い** → `tsdown` のビルドで `system/guidelines/*.md` と `DESIGN.md` を `dist/data/` にコピーして同梱
（`tsdown.config.ts` の `copy` / `onSuccess`。Context7 で確認）。**ネットワークに出ない**（ADR-0010）。
`publishConfig.access: public`、`provenance: true`（plan 007 の guard が要求）。

`tsdown.config.ts`：`entry: ['src/cli.ts']`、`format: 'esm'`、`platform: 'node'`、`shims: true`、`dts: false`、依存は**バンドルしない**（`bunx` が解決する）。
ビルド後 `dist/cli.js` の先頭が `#!/usr/bin/env node`（`banner` で付ける。Bun でも Node でも動く）。

**Verify**: `bun run --filter @rimltempest/riml-ds-mcp build` → `dist/cli.js`、`dist/data/guidelines/*.md`、`dist/data/DESIGN.md`。`head -1 dist/cli.js` が shebang

### Step 2: core（純関数。resource / tool の中身）

`tools/mcp/src/core/`（**すべて `Result` を返し `throw` しない**。`.oxlintrc.json` の `no-throw-in-domain` override に `tools/mcp/src/core/**` を足すのは
plan 001 のレーン → **足せないので、`core/` は `throw` を書かない自制で守り、報告に override 追加を提案**）：

- `tokens.ts`：`loadTokens(json) → TokenIndex`、`getToken(index, path) → { value, modes, cssVar, description } | undefined`、
  `searchTokens(index, query) → Hit[]`（名前・説明の部分一致 + 日本語の同義語表 `{ 本文: 'text.default', 背景: 'surface', 強調: 'accent', … }` は `core/synonyms.ts` に 20 語まで）
- `elements.ts`：`listElements(manifest) → { tag, name, status, pe, summary }[]`、`getElement(manifest, contracts, tag) → ElementDoc | undefined`
  （属性・イベント・slot・parts・CSS 変数・`cssStates`・**使用例**：ティア A/B は `contract.markup(既定 props)` の HTML、ティア C は `<rd-x></rd-x>`；
  フレームワーク別の例は `docs/agent-integration.md` の `get_element` 行の通り 4 つ（React は既定 / `client` の両方））
- `contrast.ts`：`checkContrast(index, fg, bg) → { ratio, aaa: boolean, aa: boolean, resolved: { fg, bg } }`（トークン名か生の色。計算は `@rimltempest/riml-ds-tokens` の関数を呼ぶ）
- `suggest.ts`：`suggestComponent(manifest, guidelines, intent) → { tag, reason }[]`（CEM の `@summary` と `system/guidelines/*.md` の見出し語との
  単純一致スコア。**LLM を使わない**。候補 0 なら「アプリ内に作る」（skill §5）を返す）
- `lint.ts`：`lintCss(source) → Promise<{ warnings: { rule, text, line }[] }>`（`stylelint.lint({ code, config: <@rimltempest/riml-ds-lint の設定> })`。I/O なのでここだけ非純）

`tools/mcp/test/core/*.test.ts`（node、fixture は**実際の生成物**を `import` して使う：`tokens.json` / `custom-elements.json`）：tokens 5、elements 5、contrast 3、suggest 3、lint 2 = 18 件。

**Verify**: `bun run test -- --project node --dir tools/mcp` → 18 件 pass

### Step 3: サーバ（`src/server.ts`）と CLI（`src/cli.ts`）

`server.ts`：`createServer(deps) → McpServer`。`deps = { tokens, manifest, contracts, guidelines: Record<topic, string>, designMd: string }`（**引数で受ける**。
ファイル読みは `cli.ts`）。`registerResource` ×6（`docs/agent-integration.md` の URI そのまま。`{path}` / `{tag}` / `{topic}` は `ResourceTemplate` + `list` コールバックで
一覧を返す）、`registerTool` ×5（zod スキーマ、`description` は日本語 + 英語 1 行ずつ）。返却は `text`（JSON は `JSON.stringify(_, null, 2)`）。
`cli.ts`：引数なし → stdio サーバ起動。`design-md [--theme <brand>] [--out <file>]` → Step 4。`--help`。

`tools/mcp/test/server.test.ts`（node、`InMemoryTransport.createLinkedPair()` で `Client` から叩く。8 件：`listResources` に 6 種、`readResource('riml-ds://elements/rd-button')` に
`pe: 'A'` と HTML 例、`riml-ds://tokens/color.text.default` に `--rd-color-text-default`、`callTool('search_tokens', { query: '本文' })` が `color.text.default` を含む、
`get_element` の React 例に `'use client'` の有無 2 種、`check_contrast` の AAA 判定、`suggest_component('保存ボタン')` → `rd-button`、`lint_css('a{color:#fff}')` が警告 1）。

**Verify**: `bun run test -- --project node --dir tools/mcp` → 26 件 pass。`bunx @modelcontextprotocol/inspector bun tools/mcp/dist/cli.js` で一覧が見える（任意）

### Step 4: `design-md` サブコマンド

`src/design-md.ts`：`tools/design-md/src/core` の `buildFrontmatter(tokens, { theme })` を **import して**使う（`workspace:*` 依存。private パッケージだが
tsdown が**バンドルに取り込む**ので配布物には含まれる。`external` から外す）。本文は同梱 `dist/data/DESIGN.md` の本文部分（フロントマター以降）。
`--theme qrcc` は `tokens.json` の `themes.qrcc` 差分（plan 002 の出力形）を当ててから生成。出力は stdout（`--out` でファイル）。
生成結果は `bunx @google/design.md lint -` を通す（テストで `design.md lint` を実行。devDep）。

`test/design-md.test.ts`（3 件：theme なし＝リポジトリの `DESIGN.md` と一致、`--theme qrcc` でフロントマターの色が差し替わる、lint が通る）。

**Verify**: `bun tools/mcp/dist/cli.js design-md | bunx @google/design.md lint -` exit 0（stdin 非対応なら一時ファイル）

### Step 5: skills / AGENTS.md の仕上げ、README

`skills/riml-ds/SKILL.md`：（a）先頭近くに「対応バージョン：`@rimltempest/riml-ds-* 0.1.x`」、（b）§MCP の tool 名・resource URI を実装と突き合わせ、
（c）`design-md` の使い方 3 行（`bunx @rimltempest/riml-ds-mcp design-md --theme qrcc > DESIGN.md`）。**他の節は変えない**（差分は 30 行以内）。
`AGENTS.md`：起動コマンドが `bunx @rimltempest/riml-ds-mcp` で一致することを確認（変更不要なら触らない）。
`tools/mcp/README.md`：登録方法（`.mcp.json` の形）、resource / tool 一覧（`docs/agent-integration.md` の表を**参照**、コピーしない）、`design-md`、
「ネットワークに出ない・同梱データは publish 時点のスナップショット」。

**Verify**: `git diff --stat skills AGENTS.md` が小さい（≤ 40 行）。`bunx @google/design.md lint DESIGN.md` exit 0（リポジトリの DESIGN.md は変えていない）

## Test plan

- node：core 18 + server 8 + design-md 3 = 29
- 実行：`bun run test` → 全 pass

## Done criteria

- [ ] `bun run --filter @rimltempest/riml-ds-mcp build` で `dist/cli.js`（shebang）と `dist/data/**`
- [ ] `bun run test` exit 0（新規 29 件）
- [ ] `readResource` 6 種 / `callTool` 5 種が `docs/agent-integration.md` の表と**名前・URI が一致**（テストで固定）
- [ ] `get_element('rd-button')` の HTML 例が `buttonMarkup(既定)` と同一文字列
- [ ] `design-md` の出力が `design.md lint` を通る。`--theme qrcc` で差し替わる
- [ ] `tools/mcp/src/core/**` に `throw` が無い（`grep -rn 'throw ' tools/mcp/src/core` が空）、`any` / `as` / `!` 無し（oxlint）
- [ ] `bunx publint --strict tools/mcp` exit 0、`bun run release:check` exit 0（plan 007 のゲートに乗る）
- [ ] `skills/riml-ds/SKILL.md` に対応バージョン、MCP tool 名が一致
- [ ] `bun run check` / `bun run guard` exit 0、`plans/README.md` の 008 行更新

## STOP conditions

- `@modelcontextprotocol/sdk` の API（`registerResource` / `ResourceTemplate` / `InMemoryTransport`）が Context7 の記述と違い、resource の一覧が返せない → 報告
- `@rimltempest/riml-ds-tokens` に `contrastRatio` 相当が無い → MCP 側に実装せず報告
- `tools/design-md/src/core` の関数がテーマ差分を受け取れない → 報告（他レーン）
- tsdown が `workspace:*` の private 依存を取り込めない → 代替（`tools/design-md` を公開パッケージ化）を提案して STOP
- `stylelint.lint` が `@rimltempest/riml-ds-lint` の設定（`postcss-lit` など）を CLI 実行環境で解決できない → `lint_css` を外さず報告
- `docs/agent-integration.md` の表と実装の間で名前を変えたくなった → docs を直さず STOP

## Maintenance notes

- 部品・トークンを足しても MCP のコードは変えない。`bun run build` で同梱データが更新される。**publish しなければ利用側の MCP は古いまま**
  → リリース手順（`riml-ds-release` skill §6）に「MCP の再 publish は fixed バージョンで自動」と書いてあることを確認
- 同義語表（`core/synonyms.ts`）は増やしすぎない（20 語）。増えるなら guidelines の見出しを整える方を選ぶ
- MCP SDK のメジャー更新時は `server.test.ts` が最初に落ちる。resource URI は**公開 API**（変えるなら ADR-0010 の改訂）
- 見送り：HTTP トランスポート（利用側は stdio で足りる。Pages は静的配信のみ）、LLM を使う `suggest_component`、llms.txt（ADR-0010 §8）、
  Storybook addon-mcp との統合（開発時と利用時で面が違う）
