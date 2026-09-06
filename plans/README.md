# 実装計画

`/improve plan` で書いた計画の索引。各計画は**単体で読めば実行できる**ように書いてある
（executor は会話の文脈を持たない前提）。テンプレートは qrcc の
`.claude/skills/improve/references/plan-template.md`。

**Planned at**: `0014780`（2026-09-07）。設計文書（`docs/**`, `docs/adr/**`, `DESIGN.md`,
`system/guidelines/**`, `.claude/skills/riml-ds-*`）が仕様の正で、計画はそれを手順に落としたもの。
矛盾を見つけたら計画側を直すのではなく STOP して advisor に返す。

## 実行順序と依存

```
001 scaffold ──┬── 002 tokens ── 003 css ── 004 elements ──┬── 005 storybook/a11y/VRT ──┐
               │                                           └── 006 frameworks ──────────┼── 007 release ── 008 agent ── 009 components+
               └── 010 devops(ci/pages) ───────────────────────────────────────────────┘
```

- 001 は単独で先に終わらせる（全計画の前提）。010 は 001 の直後に並行できる
- 002 → 003 → 004 は直列（下の層が上の層の入力）
- 005 と 006 は 004 の後に並行できる
- 007 は 005 と 006 の両方をマージしてから。008 は 007 の後
- 009 は 008 の後、部品ごとに小さな plan に割って回す（この索引に 009a, 009b … と足す）

レーンとの対応は `docs/parallel-lanes.md` / `scripts/lanes.tsv`。

## 状態

| #   | 計画                                                                          | 優先 | 規模 | 依存     | 状態 |
| --- | ----------------------------------------------------------------------------- | ---- | ---- | -------- | ---- |
| 001 | [足場・ツールチェーン・lint プラグイン](001-scaffold-and-toolchain.md)         | P1   | L    | —        | TODO |
| 002 | [トークン（DTCG + Terrazzo + AAA lint + DESIGN.md 生成）](002-tokens.md)      | P1   | L    | 001      | TODO |
| 003 | [基盤 CSS（@riml-ds/css）と stylelint](003-foundation-css.md)                 | P1   | M    | 002      | TODO |
| 004 | [Lit 部品の土台と最初の 5 部品](004-elements-infra-and-first-five.md)         | P1   | L    | 003      | TODO |
| 005 | [Storybook・a11y ゲート・VRT・addon-mcp](005-storybook-a11y-vrt.md)           | P1   | L    | 004      | TODO |
| 006 | [フレームワーク包装（React/Vue/Svelte/Astro）](006-framework-wrappers.md)     | P1   | L    | 004      | TODO |
| 007 | [ガバナンスと公開（changesets・release.yml・予算）](007-governance-and-release.md) | P1 | M    | 005, 006 | TODO |
| 008 | [AI ネイティブ層（@riml-ds/mcp・registry.json・Pages）](008-agent-native-layer.md) | P1 | M   | 007      | TODO |
| 009 | [部品バックログ（追加部品の進め方）](009-component-backlog.md)                 | P2   | —    | 008      | TODO |
| 010 | [CI・Pages・Dependabot・不変条件ガード](010-devops-ci-and-guard.md)            | P1   | M    | 001      | TODO |

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
