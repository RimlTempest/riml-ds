# 実装計画

`/improve plan` で書いた計画の索引。各計画は**単体で読めば実行できる**ように書いてある
（executor は会話の文脈を持たない前提）。テンプレートは qrcc の
`.claude/skills/improve/references/plan-template.md`。

**Planned at**: 001〜002 は `0014780`、003〜005 は `7bf04e8`（ADR-0012 反映で改訂）、006〜010 は `7bf04e8`（いずれも 2026-09-07）。設計文書（`docs/**`, `docs/adr/**`, `DESIGN.md`,
`system/guidelines/**`, `.claude/skills/riml-ds-*`）が仕様の正で、計画はそれを手順に落としたもの。
矛盾を見つけたら計画側を直すのではなく STOP して advisor に返す。

## ユーザー決定（計画の前提）

- **PE 方針はハイブリッド（ティア A / B / C）** — ADR-0012。フォーム・ナビ部品はネイティブ要素を light DOM に持つ
- **npm scope は `@rimltempest/riml-ds-*`**（ユーザー名 scope。org は作らない）
- **タグ / 変数のプレフィックスは `rd-` / `--rd-`**
- **GitHub リポジトリは plan 010（Pages）の直前まで private**。ADR-0011 決定 1 の注記を参照。public 化はユーザーが行う
- リポジトリ名 `riml-ds`、npm は public、完全に新しいブランド、Figma は持たない（コードが唯一の正）

## 実行順序と依存

```
001 scaffold ──┬── 002 tokens ── 003 css ── 004 elements ──┬── 005 storybook/a11y/VRT/pe ──┬── 007 release ── 008 agent
               │                                           └── 006 frameworks ─────────────┤                      │
               │                                                                           └── 009 components+    │
               └── 010 devops(ci/pages) ── 配線は 001 直後、Pages は 008 の後 ─────────────────────────────────────┘
```

- 001 は単独で先に終わらせる（全計画の前提）。010 の `ci.yml` 骨格は 001 の直後に並行できる
  （まだ無い script は `hashFiles` でスキップ）。Pages と public 化は 008 の後
- 002 → 003 → 004 は直列（下の層が上の層の入力）
- 005 と 006 は 004 の後に並行できる（`e2e/pe` は 005、`e2e/<fw>` は 006）
- 007 は 005 と 006 の両方をマージしてから。008 は 007 の後
- 009 は 005 と 006 の後（wave 2 の 4 部品。以降は 009a, 009b … と足す）

レーンとの対応は `docs/parallel-lanes.md` / `scripts/lanes.tsv`。

## 状態

| #   | 計画                                                                          | 優先 | 規模 | 依存     | 状態 |
| --- | ----------------------------------------------------------------------------- | ---- | ---- | -------- | ---- |
| 001 | [足場・ツールチェーン・lint プラグイン](001-scaffold-and-toolchain.md)         | P1   | L    | —        | DONE（`a11cb7e`。テスト 25 件、workspaces `e2e*`、fixture は `--ignore-pattern`） |
| 002 | [トークン（DTCG + Terrazzo + AAA lint + DESIGN.md 生成）](002-tokens.md)      | P1   | L    | 001      | DONE（`52e38a3`。89 トークン、テスト 133 件。判断は `docs/tokens.md` §実装で確定した判断） |
| 003 | [基盤 CSS（@rimltempest/riml-ds-css）と stylelint](003-foundation-css.md) | P1 | M | 002 | TODO（`7bf04e8` で改訂） |
| 004 | [Lit 部品の土台と最初の 4 部品（A/A/B/C）](004-elements-infra-and-first-five.md) | P0 | L | 003 | TODO（`7bf04e8` で改訂） |
| 005 | [Storybook・a11y ゲート・VRT・JS 無し検証・addon-mcp](005-storybook-a11y-vrt.md) | P1 | L | 004 | TODO（`7bf04e8` で改訂） |
| 006 | [フレームワーク包装（React/Vue/Svelte/Astro）](006-framework-wrappers.md) | P1 | L | 004 | TODO |
| 007 | [ガバナンスと公開（changesets・api-diff・release.yml）](007-governance-and-release.md) | P1 | M | 005, 006 | TODO |
| 008 | [AI ネイティブ層（@rimltempest/riml-ds-mcp・design-md）](008-agent-native-layer.md) | P1 | M | 007 | TODO |
| 009 | [部品バックログ wave 2（select/checkbox/disclosure/toast）](009-component-backlog.md) | P2 | L | 005, 006 | TODO |
| 010 | [CI・Pages・Dependabot・不変条件ガード・public 化](010-devops-ci-and-guard.md) | P1 | M | 001（Pages は 008） | TODO |

状態: `TODO` / `IN PROGRESS` / `DONE（マージ SHA）` / `BLOCKED(理由)` / `STALE`。
executor は完了時にこの表の自分の行だけを書き換える（reviewer が索引を管理すると言った場合は触らない）。

## 検討して見送ったもの

- **Figma / Tokens Studio を正にする**: コードが唯一の正（ユーザー決定）。デザインツールとの同期は
  `tokens.json` を読む側に任せる（ADR-0003）
- **Style Dictionary**: DTCG 2025.10 の `$extensions` / モードの扱いが後追い。Terrazzo は
  `terrazzo check`（コントラスト lint）を持ち、この repo の「AAA を lint で落とす」に合う（ADR-0003）
- **Chromatic / Lost Pixel クラウド**: 無料枠が「部品 × story × 4 条件 × PR」で早期に枯れる。
  VRT は Playwright + Docker 固定イメージ + コミットしたベースライン（ADR-0007 / 0011）
- **フレームワークごとの手書きコンポーネント**: 5 フレームワーク × N 部品の保守は破綻する。
  Lit を唯一のソースにし、CEM から生成する（ADR-0002）
- **`@lit-labs/ssr` を前提にした SSR**: まだ Labs。Declarative Shadow DOM + クライアント側 fallback で
  進め、安定したら ADR で足す（ADR-0002）
- **Scoped Custom Element Registries / Reference Target**: Baseline 未到達。`docs/baseline.md` の
  Wait 表に置き、四半期ごとに見直す（ADR-0004）
- **`[data-theme="dark"]` トグル**: `color-scheme` + `light-dark()` に一本化。`data-theme` は持たない
  （`docs/tokens.md`）。利用側が強制したい場合は `color-scheme` を書く
- **Tailwind / CSS-in-JS**: プレーン CSS + `@layer` + トークン変数。利用側のビルドを要求しない（ADR-0004）
- **llms.txt**: 3 つの正（DESIGN.md / CEM / tokens.json）と MCP があれば冗長（ADR-0010）
- **Vitest 5.0.0**: 2026-09-05 公開。`@storybook/addon-vitest@10.6.0` の peer は `^3 || ^4`。
  `4.1.11` に固定する（plan 001）。5 系は Storybook が追従したら Dependabot で上げる
- **`@wc-toolkit/svelte-types` 相当**: 存在しない。Svelte 5 は CEM から `svelte/elements` の
  `SvelteHTMLElements` 拡張 `.d.ts` を **`tools/cem` 内の自前ジェネレータ**で出す（plan 006）
- **Vue 版・Svelte 版の Storybook**: WC の Storybook を唯一のショーケースに。各フレームワークは
  `e2e/<fw>` の最小アプリで「描画・属性・イベント・フォーム送信」だけを固定する（ADR-0007）
- **PR ごとの Storybook プレビュー**: GitHub Pages は 1 環境。main のみ配信（ADR-0011）
- **npm トークンを GitHub Secrets に置く**: Trusted Publishing（OIDC）。初回 publish だけユーザーが
  手元で行う（`docs/publishing.md`）
- **ティア A / B の SSR に Declarative Shadow DOM / `@lit-labs/ssr` を使う**: ティア A は light DOM の
  HTML そのものが SSR 出力。ティア B は `:not(:defined)` の CSS fallback で足りる（ADR-0012）
- **全部品を light DOM にする**: 包含が要る部品（dialog / toast / tooltip）は shadow のほうが安全。
  ティア C を残す（ADR-0012）
- **npm org（`@riml-ds`）**: ユーザー名 scope `@rimltempest/riml-ds-*` で足りる。org は管理対象が増える
- **`@wc-toolkit/*` の生成器を使う**: React（`@lit/react`）以外は入力（CEM）から自前で出すほうが
  RSC 用の markup コンポーネントとティア情報を扱いやすい（plan 006）
- **Customizable `<select>`（`appearance: base-select`）**: Baseline 未到達。rd-select はネイティブ
  `<select>` を包むティア A（plan 009）
- **semantic-release**: コミットメッセージから版を決めると `0.x` の破壊的変更を意図的に扱えない。
  changesets（plan 007）
- **Renovate**: Dependabot の groups で足りる。設定を 1 つ増やさない（plan 010）
- **MCP の HTTP トランスポート**: stdio だけ。ホストしない = 費用ゼロ（ADR-0011 / plan 008）
- **PR ごとの Pages プレビュー・Chromatic・CodeQL 手動設定**: Pages は 1 環境。CodeQL は public 化後に
  default setup（plan 010）
