# アーキテクチャ

riml-ds は「デザインシステム」と「コンポーネントライブラリ」を **同じリポジトリの別領域**として持つ。
前者は判断（何をどう見せるか、なぜか）、後者はその実装（どう動くか）。
片方だけ差し替えられること（例: qrcc が既存の React 実装のままトークンだけ乗り換える）を
設計の前提にする（[ADR-0001](adr/0001-system-and-library-split.md)）。

## 1. 全体像

構成図は [archify](https://github.com/tt-a1i/archify) で
[`architecture/riml-ds.architecture.json`](architecture/riml-ds.architecture.json) から生成し、README に表示している
（対話版は [`architecture/riml-ds-architecture.html`](architecture/riml-ds-architecture.html)）。
構成を変えたら仕様 JSON を直して `bun run archify` で作り直す。以下は同じ内容のテキスト版。

```
system/                      デザインシステム（判断）
  tokens/     @rimltempest/riml-ds-tokens   DTCG 2025.10 JSON → tokens.css / tokens.ts / tokens.json / tokens.md
  css/        @rimltempest/riml-ds-css      layers / reset / base / utilities / print / forced-colors
  guidelines/ (非パッケージ)    a11y・モーション・レスポンシブ・文言。DESIGN.md の本文の出典
library/                     コンポーネントライブラリ（実装）
  elements/   @rimltempest/riml-ds-elements Lit Web Components（唯一のソース）+ custom-elements.json
  react/      @rimltempest/riml-ds-react    CEM から生成した React ラッパーと型
  vue/        @rimltempest/riml-ds-vue      CEM から生成した Vue 型 + プラグイン
  svelte/     @rimltempest/riml-ds-svelte   CEM から生成した Svelte 型
  astro/      @rimltempest/riml-ds-astro    Astro integration（CSS 注入と define の読み込み）
tools/                       ビルド・検査・エージェント連携
  lint/       @rimltempest/riml-ds-lint     stylelint / oxlint プラグイン / markuplint / browserslist の共有設定
  cem/        @rimltempest/riml-ds-cem      CEM analyzer 設定と生成器（ラッパー・docs・registry.json）
  design-md/  (private)         tokens.json → DESIGN.md フロントマター
  mcp/        @rimltempest/riml-ds-mcp      tokens.json + custom-elements.json を配る MCP サーバ（stdio）
  markuplint/ (private)         TypeScript 6 に固定した markuplint の隔離ランナー（ADR-0006）
apps/
  storybook/  (private)         Storybook 10（web-components-vite）。docs / a11y / story tests / MCP
e2e/          (private)         Playwright: axe AAA・キーボード・スクリーンショット比較
skills/       利用側のエージェントに配る skill（`npx skills add RimlTempest/riml-ds`）
.claude/skills/                保守側の skill（riml-ds-*）
docs/ plans/ scripts/
```

### 依存の向き

```
system/tokens ──▶ system/css ──▶ library/elements ──▶ library/{react,vue,svelte,astro}
       │                                │
       └──────▶ tools/design-md         └──▶ tools/cem ──▶ tools/mcp, apps/storybook
```

- `system/*` は `library/*` を知らない。
- `library/elements` の依存は `lit` と `@rimltempest/riml-ds-tokens`（CSS 変数名）だけ。
- ラッパーは `library/elements` の `custom-elements.json` **だけ**を入力にする。
  ソースを読まない（ソースを読むと「生成物が正」でなくなる）。
- `tools/*` はどこからも import されない（CLI として呼ばれる）。

## 2. データの流れ

### トークン（[ADR-0003](adr/0003-tokens-dtcg-terrazzo.md)）

```
system/tokens/src/**/*.tokens.json  ─ terrazzo build ─▶  dist/tokens.css   （:root, light-dark(), @media (prefers-contrast)）
                                                          dist/tokens.ts    （リテラル型の定数。値ではなく変数名を配る）
                                                          dist/tokens.json  （解決済み DTCG。エージェント・MCP・DESIGN.md の入力）
                                                          dist/tokens.md    （人向け一覧。Storybook の Docs に埋め込む）
                                    ─ terrazzo check ─▶  DTCG 準拠・命名・重複・説明必須・**コントラスト AAA** の lint
tools/design-md                     ─ generate ────────▶  DESIGN.md のフロントマター（本文は手書きのまま）
```

- 階層は `base`（原色・寸法の素材）→ `semantic`（`color.text.default` のような役割）→ `component`（必要なときだけ）。
- モードは **差分ファイル**で書く。`modes/dark`、`modes/high-contrast`、`modes/compact`。
  ライト／ダークは 1 つの `light-dark()` 宣言に畳み、切替は `color-scheme` で行う。
- ブランド（qrcc、noter …）は `themes/<brand>/` に semantic の差分だけを置く。

### コンポーネント（[ADR-0002](adr/0002-lit-elements-and-generated-wrappers.md)）

```
library/elements/src/<name>/<name>.element.ts   Lit の class（薄い殻。ADR-0005）
                          <name>.contract.ts    ティア A/B：マークアップ契約（必要な子・MarkupTree・markup()）
                          <name>.logic.ts       純関数（状態遷移・値の検証・ARIA 属性の計算）
                          <name>.css            ティア A/B：light DOM のスタイル（@layer rd.components）
                          <name>.styles.ts      ティア B/C：css`` タグ（shadow）。--rd-* のみ参照
                          <name>.define.ts      customElements.define('rd-<name>', ...) だけ
                          <name>.stories.ts     Storybook（docs + a11y + interaction）
                          <name>.test.ts        Vitest browser（実 DOM）
                          <name>.logic.test.ts  Vitest node（純関数）
              ─ cem analyze ─▶ custom-elements.json （JSDoc の @slot/@csspart/@cssprop/@event/@status を含む）
              ─ tools/cem ───▶ library/react/src/generated/*.ts, library/vue/src/generated/*.d.ts, …
                               tools/cem/registry.json（インストール可能な部品の索引）
                               apps/storybook の args / docs 表
```

- 部品は PE ティア（A / B / C）を JSDoc `@pe` で宣言する（ADR-0012）。ティア A はネイティブ要素を
  light DOM の子として包み、JS 無しで動く。RSC / SSR はこの HTML をそのまま出す。
- 1 コンポーネント = 1 ディレクトリ。`index.ts` は class を re-export するだけで **define しない**。
  利用側は `@rimltempest/riml-ds-elements/button` （class のみ）か `@rimltempest/riml-ds-elements/button/define`（登録込み）を選ぶ。
- ティア B/C のスタイルはコンストラクタブル・スタイルシートで全インスタンス共有。ティア A は `.css` ファイル。トークンは light DOM の
  `tokens.css` を参照するだけで、shadow 内にトークン値をコピーしない。
- 状態は `class` の付け替えではなく `ElementInternals.states`（`:state(open)` など）。
- フォーム部品はティア A。ネイティブ要素が form に参加し、部品は `:state()` と文言を足す（`formAssociated` は使わない）。

### エージェント連携（[ADR-0010](adr/0010-agent-native-surface.md)）

| 面                    | 中身                                                   | 生成元                              |
| --------------------- | ------------------------------------------------------ | ----------------------------------- |
| `DESIGN.md`           | 見た目の正。フロントマター = トークン、本文 = 判断      | フロントマターは `tools/design-md`  |
| `custom-elements.json`| コンポーネント API の正                                 | `cem analyze`                       |
| `tokens.json`         | トークンの正（解決済み DTCG）                           | `terrazzo build`                    |
| `registry.json`       | 部品の索引（名前・状態・依存・ファイル）                | `tools/cem`                         |
| `@rimltempest/riml-ds-mcp`        | 上 3 つを MCP のリソース／ツールとして配る              | 手書き（小さい）                    |
| `skills/riml-ds`      | 利用側エージェントの手順（導入・禁止・レビュー観点）    | 手書き                              |
| Storybook `/mcp`      | 開発中の story 一覧・docs・テスト実行                   | `@storybook/addon-mcp`              |

## 3. 品質ゲート

| ゲート                 | 何を守るか                                           | どこで                               |
| ---------------------- | ---------------------------------------------------- | ------------------------------------ |
| oxlint（`riml-ds/*`）  | any/as/!/enum、class の場所、default export           | lefthook / CI                        |
| stylelint 17           | 生値禁止（strict-value）、論理プロパティ、Baseline    | lefthook / CI                        |
| markuplint             | story 描画結果の HTML（ラベル・ロール・見出し）        | CI（Storybook の静的出力に対して）   |
| `terrazzo check`       | DTCG 準拠、命名、重複、説明、**コントラスト 7:1**      | lefthook / CI                        |
| Vitest browser         | 実 DOM の振る舞い・キーボード・`:state()`             | CI                                   |
| addon-vitest + a11y    | 全 story を実ブラウザで描画し axe（AAA タグ）で検査    | CI                                   |
| Playwright             | キーボード導線・フォーカス順・スクリーンショット比較・**JS 無し（ティア A/B）** | CI（Docker イメージ固定）  |
| publint / attw / size-limit | exports・型解決・サイズ予算                      | CI（publish 前）                     |
| knip / sherif          | 未使用 export・依存の不整合                           | CI                                   |
| CI `guard`             | 不変条件（依存の向き、routes 無し、生成物の未コミット）| CI                                   |

## 4. 配布

- ESM のみ。バンドルしない・minify しない（Lit の公開ガイド）。`exports` は部品ごと。
- `sideEffects` は `*/define.js` と `*.css` だけ true。ティア A/B は `<name>/style.css` も配る。
- `package.json` の `customElements` フィールドが `custom-elements.json` を指す。
  `library/elements/custom-elements.json` と `tools/cem/registry.json` は **コミットする**
  （ラッパー生成・MCP・skills の入力を git 上で diff できるようにするため）。
  `bun run gen` は決定的（モジュール順を安定ソート）で、実行後に `git status` が汚れたら
  ソースと生成物がずれている印。`library/*/src/generated/` は生成物なのでコミットしない。
- changesets でバージョンと CHANGELOG。npm は Trusted Publishing（OIDC）で publish し、
  provenance は自動付与（[ADR-0009](adr/0009-publishing-and-versioning.md)）。
- Storybook の静的出力は GitHub Pages（[ADR-0011](adr/0011-free-tier-operations.md)）。

## 5. qrcc / noter の移行方針

段階的に。詳細は [migration.md](migration.md)。

1. `@rimltempest/riml-ds-tokens` + `@rimltempest/riml-ds-css` を導入し、`--qrcc-*` / `--noter-*` を `--rd-*` の別名にする
2. `themes/qrcc` / `themes/noter` で現在の色味を再現し、視覚差分ゼロで切り替える
3. 共通コンポーネント（button / field / live-region / dialog。スキップリンクは `.rd-skip-link` の CSS）を `@rimltempest/riml-ds-react` に置き換える
4. アプリ固有の部品はアプリに残す。汎用化できるものだけ `library/elements` に昇格させる
