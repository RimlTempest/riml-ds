# 実装計画

`/improve plan` で書いた計画の索引。各計画は**単体で読めば実行できる**ように書いてある
（executor は会話の文脈を持たない前提）。テンプレートは qrcc の
`.claude/skills/improve/references/plan-template.md`。

**Planned at**: 001〜002 は `0014780`、003〜005 は `7bf04e8`（ADR-0012 反映で改訂）、006〜010 は `7bf04e8`（いずれも 2026-09-07）、014〜016 は `3d85de1`（2026-09-08。ブランド = `docs/brand.md` / ADR-0013）、017〜018 は `b501378`（2026-09-08。窓の丸はボタン = ADR-0014）、019〜020 は `da4200a`（2026-09-08。017・018 マージ後）、021〜022 は `9cfed6d`（2026-09-08。019 マージ後。020 と並行）、023 は `c661a96`（2026-09-08。022 マージ後。021 と並行）、024・027 は `b61ee24`（2026-09-08。023 マージ後。並行）、025・026 は `7684d09`（2026-09-08。024・027 マージ後。並行）。028・029・030 は `fa1835c`（2026-09-08。025・026 マージ後。並行）。031・032・033 は `28f2c5e`（2026-09-09。028・029・030 マージ後。並行）。035 は `0428da0`（2026-09-09。031〜033 と並行。034 は 033 マージ後に書く）。設計文書（`docs/**`, `docs/adr/**`, `DESIGN.md`,
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
- 011 は 009 と 010 の後（009 が生んだラッパー生成器の欠陥の追随。experimental を `./experimental` に隔離）

- 014 → 015 → 016 は直列（ブランドの色 → 部品の形 → ショーケース）。014 のあと qrcc2 側の取り込み（`file:` tarball → npm）は
  npm 初回 publish（ユーザー作業）を待つ
- 017 と 018 は 016 の後に**並行**できる（017 = `patterns.css` + `library/elements`、018 = `typography.css` / `atoms.css` + 文字トークン。
  `e2e/__screenshots__` は別ファイル）。qrcc2 への適用（qrcc2 plan 013）は両方のマージ後
- 019 と 020 は 017・018 の**両方のマージ後**に並行できる（019 = `radio-group` / `slider` / `patterns.css`、020 = `tabs` / `menu` / `popover` / `tooltip` / `navigation.css`。
  `e2e/pe/build-pages.ts`・`e2e/frameworks/shared.ts`・`.size-limit.json`・`library/elements/package.json` は両方が追記する → 後にマージする側で advisor が解決）
- 021（`feat/form-wave4`）と 022（`feat/surfaces`）は 019 マージ後に **020 と 3 本並行**できる（021 = `toggle` / `checkbox-group` / `input-otp` / `patterns.css`、
  022 = `atoms.css` / `utilities.css` / `dialog`）。共有ファイル（生成物・`examples.ts`・`build-pages.ts`・`markup.test.tsx`・`.size-limit.json`）の
  union 型の衝突は advisor が解決する。トークンの追随（`neutral.950` と dark の `surface.sunken`、astro の experimental export、
  vue/svelte の boolean 属性）は 017〜019 のメモで「021」と書いたが **023 以降**に繰り下げた

レーンとの対応は `docs/parallel-lanes.md` / `scripts/lanes.tsv`。

## 状態

| #   | 計画                                                                          | 優先 | 規模 | 依存     | 状態 |
| --- | ----------------------------------------------------------------------------- | ---- | ---- | -------- | ---- |
| 001 | [足場・ツールチェーン・lint プラグイン](001-scaffold-and-toolchain.md)         | P1   | L    | —        | DONE（`a11cb7e`。テスト 25 件、workspaces `e2e*`、fixture は `--ignore-pattern`） |
| 002 | [トークン（DTCG + Terrazzo + AAA lint + DESIGN.md 生成）](002-tokens.md)      | P1   | L    | 001      | DONE（`52e38a3`。89 トークン、テスト 133 件。判断は `docs/tokens.md` §実装で確定した判断） |
| 003 | [基盤 CSS（@rimltempest/riml-ds-css）と stylelint](003-foundation-css.md) | P1 | M | 002 | DONE（`bb5ff0c`。6 レイヤーファイル + stylelint 独自ルール 3 本、テスト +15） |
| 004 | [Lit 部品の土台と最初の 4 部品（A/A/B/C）](004-elements-infra-and-first-five.md) | P0 | L | 003 | DONE（`db95768`。標準デコレータ→`static properties`（ADR-0005 §4 追記）、`color.overlay.default` 追加、`custom-elements.json` はコミットする、live-region の sr テストは仮想 SR が shadow を読まないため skip 1） |
| 005 | [Storybook・a11y ゲート・VRT・JS 無し検証・addon-mcp](005-storybook-a11y-vrt.md) | P1 | L | 004 | DONE（`82f59e1`。story 39、a11y 除外 0、VRT 165 枚 1.21 MB（Docker）、pe 12 / a11y 8、markuplint 39/39（shadow 平坦化の例外 2 つ）。VRT 除外はタグ `no-vrt`、`pe-axe` project 追加。部品側の欠陥 2 件は 009 Step 0 へ） |
| 006 | [フレームワーク包装（React/Vue/Svelte/Astro）](006-framework-wrappers.md) | P1 | L | 004 | DONE（`dd880ae`。テスト +37、e2e 17 件。`@lit/react` は不使用（ref + addEventListener で統一、複雑なプロパティを渡す部品が出たら切替）、`id` は `name` フォールバック、未指定 props は属性ごと落とす。申し送り: CEM の modules 順が非決定（009 で修正）、`define` はハイドレーション後に読む） |
| 007 | [ガバナンスと公開（changesets・api-diff・release.yml）](007-governance-and-release.md) | P1 | M | 005, 006 | DONE（`f31f7e7`。公開 8 パッケージ `0.1.0`・fixed。`@changesets/cli` 3.x（private は既定で version 対象外、`ignore` 空）。`changesets/action` は **v2 サブアクション**（select-mode で version / publish を排他、1 ジョブ）。api-diff 11 テスト（`0.x` は minor で通る）。`release:check` = build → gen → design-md → gen-diff → publint/attw → size-limit → knip → sherif。guard 検査 13（publishConfig）。`files` に `!dist/types`（テスト d.ts が publish に混ざっていた）。申し送り: `CONTROL_ID`（wrappers/core/common.ts）が未使用 → 009 で削除。初回 publish + Trusted Publisher はユーザー作業（`docs/publishing.md`）） |
| 008 | [AI ネイティブ層（@rimltempest/riml-ds-mcp・design-md）](008-agent-native-layer.md) | P1 | M | 007 | DONE（マージ `#plan-008`。`tools/mcp`: resource 6 / tool 5（`docs/agent-integration.md` と一致をテストで固定）、`design-md --theme`、tsdown 単一ファイル 36.6 kB + 同梱 guidelines/DESIGN.md、テスト +34（377）。`check_contrast` は `colorjs.io` の `contrastWCAG21`（Terrazzo lint と同じ）。副産物: `@rimltempest/riml-ds-lint` の publish 形の欠陥（`stylelint-plugin/` 未同梱・依存未宣言）を修正。申し送り: mcp は elements 経由で lit を実行時依存に持つ → elements に契約専用サブパス（`./<name>/contract`）を足せば外せる（009 以降）） |
| 009 | [部品バックログ wave 2（select/checkbox/disclosure/toast）](009-component-backlog.md) | P2 | L | 005, 006 | DONE（マージ `#plan-009`。CEM 4 → 8（既存 4 の差分は Step 0 の 2 点だけ）、テスト 377 → 471、story +37、e2e:frameworks 17 → 21、pe 20 / vrt 321 / a11y 12（Docker）。`dismissible` → `persistent` 反転、live-region `serializable`、`_shared/field.ts`、`scaffold:element`（10/11/9 ファイル）、`CONTROL_ID` 削除。契約側の回避: `{ raw: 'children' }` に統一（Svelte 生成器は raw 名を見ない）、checkbox の prop は `asSwitch`（`switch` は予約語）、select / checkbox は `defaultValue`（React 生成器の分割代入に合わせた）。申し送り: Vue 生成器の `v-model` が `<select>` で発火しない（`HTMLInputElement` しか見ない）、ラッパーは experimental を区別しない、`lint:html` 未実行、`::details-content` / `position-area` は Baseline 表に無いので未使用） |
| 010 | [CI・Pages・Dependabot・不変条件ガード・public 化](010-devops-ci-and-guard.md) | P1 | M | 001（Pages は 008） | DONE（マージ `#plan-010`。`ci.yml` 11 ジョブ（ブラウザ系は Playwright イメージの `container:` + `fonts-noto-cjk`、`playwright install` 0 件）、`pages.yml`（`deploy-pages@v4`、`pages/` 8.2 MiB、Storybook は相対パスなので `base` 変更不要）、guard 14（レーン所有権）/ 15（CEM 鮮度）+ テスト 4、`ci:local` 4m04s exit 0、Dependabot は初回実行で `bun` が lockfileVersion 2 非対応と判明し `github-actions` のみに縮小。初回 push の CI は typecheck/test-node の build 不足とコンテナ内 `lefthook install` の dubious ownership で失敗 → hotfix（typecheck / test-node / agent-surface に `bun run build`、コンテナ 4 ジョブに `safe.directory`）→ `workflow_dispatch` で **11 ジョブ全部緑**を確認。markuplint の `input[type=checkbox][role=switch]` に `aria-checked` を求めるのは偽陽性（HTML-AAM）なので `.markuplintrc.json` の nodeRule で外した。**Step 5（public 化・Pages 有効化）はユーザー作業、未実施**。残リスク: `mise-action` が Playwright コンテナ内で動くかは実 CI で確認） |
| 011 | [ラッパー生成器の追随（experimental 分離・select v-model・契約サブパス）](011-wrappers-experimental-and-contract-subpath.md) | P2 | M | 009, 010 | DONE（マージ `#plan-011`。`WrapperSpec` に `status`/`subpath`、experimental は react `./experimental` + `./client/experimental`・vue `./experimental`（`rdExperimentalComponents`、プラグインと `GlobalComponents` は stable のみ）・svelte `./experimental`・astro `./experimental/<name>.astro`。Vue `onInput` が select/textarea でも emit。elements に `./<name>/contract`（6 部品）、mcp は contract から例を作り `lit` 非依存（`LitElement` 0 件、bundle 44 kB）、experimental の例は `./experimental` から import。テスト 474→486、e2e 21→22。逸脱: Vue e2e は `vue.spec.ts` に置いた、`bun.lock` は変更不要（frozen で no changes）。follow-up: `LitElement` 0 件を release-check に入れるか） |
| 012 | [小さな追随（mcp の lit 混入ゲート・underline-offset トークン・印刷の改ページ）](012-small-follow-ups.md) | P3 | S | 011 | DONE |
| 013 | [テーマ × スキームの解決と themes/qrcc に qrcc の実色を入れる](013-theme-scheme-and-qrcc-palette.md) | P1 | M | 012 | DONE |
| 014 | [既定ブランドを riml の色にし「まど」の形・影・文字をトークンへ](014-riml-brand-tokens.md) | P1 | M | 013 | DONE（`0c941c3`。palette 26 段（+neutral.700 / accent.500 / signature.400・500）、`brand.*` / `chrome.*` / `font.family.display`、radius 8/12/16、硬い影。contrastAgainst 15、葉 104、テスト 568 → 594、8 モード AAA を L 調整なしで通過。noter は旧既定 26 段。VRT 319/321 更新） |
| 015 | [「まど」を部品に当てる（.rd-window・ピルのボタン・rd-meter）](015-mado-components.md) | P1 | L | 014 | DONE（`9d2e26a`: patterns.css の `.rd-window`、tier A ピル化、dialog/toast 窓化、`rd-meter` 実験、VRT 359 枚撮り直し） |
| 016 | [Storybook のブランド切替と Foundations Brand / Mado](016-brand-showcase.md) | P2 | S | 015 | DONE |
| 017 | [窓の左端の丸を本物のボタンにする（rd-window・.rd-window-bar・dialog の ×）](017-window-controls.md) | P1 | L | 016 | DONE（`da4200a`） |
| 018 | [Typography（typography.css）と静的パターン集 atoms.css](018-typography-and-atoms.md) | P1 | M | 016 | DONE（`6275931`） |
| 019 | [フォーム第 3 波（rd-radio-group・rd-slider・.rd-input-group）](019-form-wave3.md) | P1 | L | 017, 018 | DONE（`d1cf0c2`） |
| 020 | [ナビゲーションと重ね窓（rd-tabs・rd-menu・rd-popover・rd-tooltip・navigation.css）](020-navigation-and-overlays.md) | P1 | XL | 017, 018 | DONE（`4ebf45e`） |
| 021 | [フォーム第 4 波（rd-toggle・rd-checkbox-group・rd-input-otp・.rd-button-group）](021-form-wave4.md) | P1 | L | 019 | DONE（`5588b47`。rd-toggle は STOP → 024） |
| 022 | [面と待ち（.rd-card / .rd-empty / .rd-spinner / .rd-accordion / .rd-carousel / .rd-scroll-area / .rd-aspect、rd-dialog の alert / placement）](022-surfaces-and-feedback.md) | P1 | L | 017, 018 | DONE（`4f9b19e`） |
| 023 | [ラッパー生成器の追随（名前つき raw → 名前つき slot、astro exports 生成、frameworks e2e に tabs / menu / popover）](023-wrappers-named-slots.md) | P1 | M | 020 | DONE（`887beb1`） |
| 024 | [rd-toggle（021 の STOP 分）、rd-menu の閉じたメニューが見えるバグ、frameworks e2e の穴埋め](024-toggle-and-menu-fix.md) | P1 | M | 023 | DONE（`fb0c2c2`） |
| 027 | [ダークの面を 4 段にする（neutral.750 / 950、ダークでも見える影）](027-tokens-dark-surfaces.md) | P1 | M | 014 | DONE（`631000d`） |
| 025 | [rd-combobox（`<input list>` + `<datalist>` を包むティア A の候補つき入力欄）](025-combobox.md) | P1 | L | 024 | DONE（`0d566a3`） |
| 026 | [Hover Card（rd-popover hover）・Context Menu（rd-menu context）・Navigation Menu（.rd-nav-menu + Patterns/Navigation story）](026-hover-card-context-menu-nav-menu.md) | P1 | M | 024 | DONE（`fa1835c`） |
| 028 | [rd-command（検索欄 + グループ化された項目のコマンドパレット。`_shared/text-filter.ts` へ絞り込みを共通化）](028-command.md) | P1 | M | 025 | DONE（`f3c7bbc`） |
| 029 | [rd-data-table（`<table class="rd-table">` を包み `th[data-sort]` でクライアント並べ替え）](029-data-table-sort.md) | P1 | M | 022 | DONE（`1bff5b7`） |
| 030 | [rd-splitter（`role="separator"` のハンドルで 2 面をドラッグ・キーボードで分割するティア B）](030-splitter.md) | P2 | M | 020 | DONE（`855b4d2`） |
| 031 | [rd-toggle-group（`<fieldset>` + `<button aria-pressed>` の列。単一／複数選択と roving focus）](031-toggle-group.md) | P1 | M | 024 | DONE（c138e37） |
| 032 | [rd-carousel（`<ul><li>` を包み「前へ／次へ」と枚数を足す。scroll-snap + IntersectionObserver）](032-carousel.md) | P2 | M | 020 | TODO |
| 033 | [rd-calendar（`<label>` + `<input type="date">` を包み、JS で light DOM に `role="grid"` の月表を描くティア A）](033-calendar.md) | P1 | L | 023 | TODO |
| 035 | [小さな追随 2（command の空表示幅・splitter の溢れた面に tabindex・menu の Variants story・.rd-table th の nowrap・splitter proposal の入れ子メモ）](035-small-follow-ups-2.md) | P2 | S | 028, 030 | TODO |

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
- **Chart（shadcn）**: 図表ライブラリの選定はデザインシステムの外。トークン（色・字）を渡す口だけ `DESIGN.md` に書く
- **Progress / Switch / Textarea / Sheet / Drawer を別部品にする**: それぞれ `rd-meter`（`<progress>`）/ `rd-checkbox switch` /
  `rd-text-field`（`<textarea>`）/ `rd-dialog placement` が既に受けている。名前を増やさない
- **`Intl.Locale.prototype.getWeekInfo` で週の始まりを決める**: TS 7 の lib に型が無く Firefox も未実装。`rd-calendar` は
  `week-start` 属性で受ける（plan 033）
- **`Temporal`**: Safari 未対応。日付は `Date.UTC` の往復だけで扱う（plan 033）
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

### 012 の実行メモ（2026-09-07）

- `bundle.test.ts` の「index から import すると lit が戻る」という前提は成立しなかった。`library/elements` の
  `sideEffects` が `*.define.js` / `*.css` に限られるので、rolldown は未使用の `RdButton` を落とす。実際に lit が入るのは
  `…/button/define` のような副作用 import で、テストはそれを捕まえる（executor が変異で確認済み）
- `bun run design-md` は dimension の葉をフロントマターに載せないので、`type.link.underline-offset` を足しても DESIGN.md は変わらない
- `tools/mcp/test/core/tokens.test.ts` がトークンの葉の数（90 → 91）を固定している。**トークンを増減する plan はこのファイルを
  レーンに入れる**（013 に反映）
- VRT 321 枚、差分ゼロ。テスト 486 → 490

### 013 の実行メモ（2026-09-07）

- `themes/<brand>.css` は light / dark の 2 permutation を畳んだ `light-dark()`。テーマのダーク区画が無い
  場合はダークの情報が無いので捏造しない（`d = l`、旧挙動）。実出力では常に両区画が出る
- Terrazzo は oklch を sRGB にガマットマップして出力する。src `[0.44, 0.16, 255]` は dist で
  `oklch(44.29% 0.1571 257)` になる。ビルド出力の値を期待するテストは dist の値で書く
- `tools/design-md/test/frontmatter.test.ts` は「qrcc テーマは既定と同値のプレースホルダ」を前提にしていた。
  テーマの実色を入れる plan はこのファイルもレーンに含める（013 は途中で広げた）
- `tokens.json` の各トークンは `modes` を持つようになったので、テストの検体は文字列注入ではなく実在する
  `"theme-<brand>":{…}` の値を置換して作る
- 全体テスト 490 → 568（tokens 89 → 167）。VRT 321 差分ゼロ

### 014 の実行メモ（2026-09-08）

- **VRT はこの規模の色変更を検知しなかった。** `bun run vrt` は旧ベースラインのまま 321 枚 pass し、`vrt:update` も 1 枚も書き換えなかった
  （Playwright 既定の `threshold` 0.2（YIQ）に収まる）。`--update-snapshots=all` で撮り直した。**016 で `toHaveScreenshot` の
  `threshold` / `maxDiffPixelRatio` を絞る**（016 Step 1.5 に追加）
- `splitThemes` は既定と同値の変数を書かないので `themes/<brand>.css` の行数は「段数 − 同値の段」。Done criteria に行数を書くなら
  同値を差し引く（014 の「27 以上」は誤り。正しくは 24）
- `core/duplicate-values` は base 層だけ見る。テーマ内の同値（qrcc の `neutral.700` = `800`）は通る
- design-md のフロントマターは `text: "{colors.neutral-700}"`、見出しの `fontFamily` は display スタックの実値
- `bun.lock` の workspace version が 0.1.0 のままだった（`chore(release)` が lock を更新していなかった）→ main で同期

### 015 の実行メモ（2026-09-08）

- **レーン外の 1 行**: `library/react/test/markup.test.tsx` の experimental export 一覧に `RdMeter` を足す必要があり、
  レビュアーが merge 前に branch 上で直した。要素を足す計画は、この一覧テストを **Done criteria と所有パスに含める**こと
- `.rd-window-title` は `text-align` が stylelint で禁止のため `place-items: center`。素のテキストは匿名グリッド項目になり
  `text-overflow` が効かない → 1 行で切りたいタイトルは `<span>` で包む（`system/css/README.md`）
- `data-tone` は **`.rd-window-title`（見出し）に付ける**（`.rd-window` ではない）。qrcc2 plan 011 の `<Window>` もこれに合わせる
- `rd-meter` の tone は `tone` 属性（`data-tone` ではない）。ラッパー生成器がハイフン付き JSX prop を出せない
- Chromium は `appearance: none` でも `<meter>` の内側を描く → `::-webkit-meter-inner-element` / `::-webkit-progress-bar` を消す
  （ベンダ接頭辞の唯一の例外）。強制配色ではネイティブ表示に戻す
- **未解決（016 か次の小計画で）**: (a) 狭いダイアログで題と丸 3 つの間隔が 3px（`components-dialog--open.png`）→ 帯グリッドに
  `column-gap` を足す; (b) meter の塗りの右端が角丸でない（グラデーションの限界。内側要素で描くか検討）;
  (c) toast の影が `shadow.raised`、`docs/brand.md` §5 の表は `overlay` → brand.md 側を「小さな窓は raised」に直す;
  (d) `e2e/frameworks` に meter が無い（4 アプリへの手組み込みが要る）
- `Result` 型が `meter.logic.ts` にローカル定義。2 つ目の要素が必要になったら `_shared/result.ts` に出す

### 016 の実行メモ（2026-09-08）

- マージ `6e97ae9`。Storybook ツールバーに `theme`（riml / qrcc / noter）が付き、`<style id="rd-theme">` で `themes/*.css` を差し込む
  （`apps/storybook/.storybook/modes.ts`）。Foundations に Brand（5 story）/ Mado（6 story）。VRT は 359 → 403 枚
- VRT の閾値は `threshold: 0.05, maxDiffPixelRatio: 0.001`。R チャンネル delta 40 の改変を旧設定は見逃し新設定は落とすことを実測で確認。既存 359 枚は撮り直し無し
- **レーン外の修正を 1 つ入れた**（`3be706f`、guard が期待どおり警告）: noter テーマの `neutral.600` を L 0.44 → 0.38。
  ライトの `text.muted` が窓の本体（`surface.raised`、6.87:1）と入力欄（`surface.sunken`、5.73:1）で AAA を割っていたため。
  あわせて `semantic/color.tokens.json` の `text.default` / `text.muted` の `contrastAgainst` を 3 面（default / raised / sunken）に広げた
- **検査の穴（未解決）**: `bun run lint:tokens`（terrazzo check）は**テーマ（qrcc / noter）の値を見ていない**。noter を 0.44 に戻しても緑だった。
  テーマごとに解決した値で `contrastAgainst` を検査する仕組みが要る（tokens レーン、次の小 plan）。`docs/brand.md` §3 の検査表にも `muted / raised` を足す
- `apps/storybook/.storybook/modes.test.ts` はルートの `vitest.config.ts` に載っておらず、CI でも走らない（`apps/storybook` の `test:unit` だけ）。
  `vitest.config.ts` の node project に `apps/**/*.test.ts` を足すのが恒久対応（`chore/scaffold` レーン）
- ブランドの色見本は空 `<span aria-hidden>` だと markuplint `no-empty-palpable-content` に落ちるので `::before` + `style="--rd-sb-swatch: …"`
- 気づき: ダークでは `shadow.raised` / `shadow.overlay` がほぼ見えない（影色がインクの alpha）。トークン側の設計判断が要る
- 気づき（ユーザー指摘 2026-09-08）: **タイトル帯の 3 つの丸は装飾ではなくボタン**（閉じる / 最大化 / 最小化）。`patterns.css` の `::before` と
  brand.md §7 の記述は誤り。plan 017 系で作り直す

### 018 の実行メモ（2026-09-08）

- マージ `6275931`。`typography.css`（`.rd-display` / `.rd-heading-1..4` / `.rd-body` / `.rd-small` / `.rd-caption` / `.rd-label` / `.rd-mono` / `.rd-numeric` /
  `.rd-truncate` / `.rd-clamp` / `.rd-prose`）と `atoms.css`（badge / dot / avatar / separator / skeleton / kbd / tile / icon-button / toolbar / list / table /
  alert / legend）。トークンは `type.display`（流体）/ `type.heading.3-4` / `letter.spacing.{normal,wide}`。VRT 403 → 542 枚
- 計画から変えたもの: `type.caption` は作らない（terrazzo `a11y/min-font-size` が 0.75rem を落とす。`.rd-caption` = `type.small` + 字間 + muted）。
  縦の区切りは `<hr class="rd-separator" aria-orientation="vertical">`（markuplint が `role="separator"` に `aria-valuenow` を要求）。
  装飾の空要素（`.rd-dot` / `.rd-skeleton`）は HTML コメントを 1 つ入れる（`no-empty-palpable-content` 対策）。
  `.rd-table` の `text-align: start/end` は `stylelint-disable-next-line` 3 行（論理値なので RTL に追随する）
- レビューで直したもの: 強制配色の選択行を `Highlight` 塗りから **`Highlight` の罫線（outline）**に（Chromium のバックプレートで白地に白になるため）
- **`system/css/package.json` に `peerDependenciesMeta.optional`** が入った。qrcc2 の `scripts/vendor-riml-ds.sh` の詰め直しは不要になる（qrcc2 plan 013 で確認）
- 気づき（未解決 → 次の小 plan）: **ダークでは `surface.sunken` = `surface.default`（どちらも `neutral.900`）**なので、ページ地に直置きした
  `.rd-alert` / `.rd-badge` / `.rd-kbd` / `.rd-skeleton` / 選択行が見えない（`vrt-dark-1024/patterns-atoms--dark.png`）。`neutral.950` を足してダークの
  sunken に当てるのが筋（前景は全部明るい側なので比は上がるだけ）。016 の影の件と一緒に tokens レーンで
- `docs/agent-integration.md` に guidelines の topic 一覧は無い（テンプレート行だけ）ので追記なし。`DESIGN.md` は typography トークンを載せていないため差分なし

### 017 の実行メモ（2026-09-08）

- マージ `da4200a`。`patterns.css` の `.rd-window-bar` / `.rd-window-controls` / `.rd-window-control[data-action]`（`::before` 丸 + `::after` マスクの記号、
  `--rd-window-control-size: 1.25rem` / `--rd-window-glyph-size: 0.75rem`）、`_shared/window-chrome.ts`（記号 SVG・ja/en ラベル・`windowControls` / `dialogBar`）、
  `rd-window`（experimental。close / expand / collapse、`rd-dismiss` / `rd-toggle` / `rd-expand`）、`rd-dialog` の帯に ×（`persistent` で消える、`reason: 'button'`）、
  `rd-meter` の塗り端を丸める。`docs/migration.md`「0.2 → 0.3: 窓の帯」。VRT 493 枚（撮り直し込み）
- レビューで直したもの: **フォーカスの輪が二重**になっていた。`outline-width: 0` で UA の輪を消したつもりが、Chromium は `outline-style: auto` のとき幅を無視して
  自前の輪を描く。**輪はボタン自身の outline を負の `outline-offset` で丸のすぐ外に置く**形に（`window-chrome.ts` / `patterns.css` 同形、forced-colors は `Highlight`）。
  回帰テストは node（`outline-width: 0` / `outline: none` が無い）と browser（`userEvent.tab()` 後の computed outline）の 2 本。
  → `riml-ds-css` skill に「`outline: none` / `0` を書かない。置き換える」を足す（advisor 宿題）
- 計画から変えたもの: `tone` は `'chrome' | 'accent' | 'warning' | 'danger'` の 4 値で既定 `'chrome'`（CEM の wrapper 生成が `'a' | 'b' | undefined` を読み違える）。
  lanes.tsv の `feat/window-controls` に `library/react/test` を足した（`markup.test.tsx` が帯の DOM を検証しているため）。
  `docs/proposals/dialog.md` は存在しない
- 注意点: `::part(control)` は `<dialog>` と ×（`part="control close"`）の両方に当たる。開いたダイアログの初期フォーカスは帯の ×（`showModal()` の既定）→ 主ボタンから
  始めたいなら `slot="actions"` に `autofocus`。guidepup は shadow 内の名前を読めないので `.sr.test.ts` は light DOM の投影で確認
- 見つけた穴（未解決 → 021 候補）: astro に `experimental/meter.astro` / `window.astro` の export が無く、frameworks e2e から astro を外している。
  vue / svelte の wrapper 生成が boolean 属性を `="true"` で出す（`reflect` する Boolean プロパティと噛み合わない）。`vitest.config.ts` の include に `apps/**/*.test.ts` が無い

### 019 の実行メモ（2026-09-08）

- マージ `d1cf0c2`。`rd-radio-group`（experimental、ティア A。`segmented` は見た目だけ、無効化は `<fieldset disabled>`）、`rd-slider`（experimental、ティア A。
  塗りは `--rd-slider-fill` を `[part='fill']` に写す。縦向きは `@supports selector(:state(vertical))` の中、未対応なら横）、`.rd-input-group`（`patterns.css`）、
  text-field の `Types` story。VRT 新規 96 枚・既存の変更 0。size-limit: radio-group 7.03 kB / slider 7.29 kB（予算 12 kB）
- 計画から変えたもの: `--rd-elevation-1` / `--rd-type-label` は無い → `--rd-shadow-raised` / `--rd-type-body` + 太字。`.rd-input-group` は入力自身が輪を描き
  枕は `:has(:focus-visible)` で面の色を変える（`outline: none` を使わない方針を優先）。slider の `checkValidity()` は無し（150 行制限）。rangeOverflow は
  UA が丸めるので logic 側だけで固定。astro には置かない（`library/astro/package.json` の exports が別レーン → 021 候補のまま）
- レビューで直したもの: **`aria-invalid` は `role="radio"` では ARIA 1.2 非推奨**（markuplint `wai-aria` エラー）→ 外して hint / error を**各 radio** の
  `aria-describedby` で結ぶ。`<fieldset>` には付けない。slider の `<datalist><option label>` は名前が無いと `require-accessible-name` に落ちる →
  目盛の文言を本文に、`<datalist>` に `aria-label`
- main 側で解決したもの: `library/react/test/markup.test.tsx` は experimental バレルの export 名を固定しているので 019 / 020 のレーンに `library/react/test` を追加。
  `.markuplintrc.json` に `[aria-hidden="true"]` 系の `no-empty-palpable-content` 除外（slider の track / fill）。`docs/baseline.md` に縦向き range の行
- 既知のまま: ダークで `surface.sunken` = `surface.default` なので segmented のピル・slider の未塗り・input-group の枕が見えない（018 メモと同じ → tokens plan）
- check 0 / test 865 / pe 36 / e2e:frameworks 46 / a11y 16 / VRT 704 / lint:html 0 / release:check 0

### 020 の実行メモ（2026-09-08）

- マージ `4ebf45e`。`rd-tabs`（B）/ `rd-menu`（B）/ `rd-popover`（B）/ `rd-tooltip`（C）を experimental に、`navigation.css`（`.rd-breadcrumb` / `.rd-pagination` / `.rd-nav-rail` / `.rd-menubar` / `.rd-sidebar`）を css に。
  `_shared/roving-focus.ts` / `popover-anchor.ts` を新設。テスト 1036、pe 47、e2e:frameworks 46、a11y 20、VRT 887、lint:html 196 story。size: menu 7.23 / popover 6.92 KB
- 計画から変えた点: `rd-menu` の `items` は `contract.roles` に置かず `ITEM_SELECTOR` として別 export（`checkContract` は 1 個目しか見ない。guard 検査 9 が `roles:` 周辺の `button` / `a[href]` を見てティア A を要求する）。
  トリガーは木ではなく `menuTriggerMarkup()` / `popoverTriggerMarkup()` の生 HTML（React ラッパー生成器が `popovertarget` を扱えない）。
  `rd-menu` は `<ul><li>` を使わず `role="menu"` を `[popover]` 自身に付けて項目を直下に置く（markuplint `wai-aria` の Required Owned Elements）。
  区切りは要素にせず `menuItemMarkup({ separated: true })` → `data-separated` の点線。押せない項目は `<span aria-disabled="true">`
- 要素の 150 行制限のため `menu.dom.ts` / `popover.dom.ts`（DOM 読み書きだけの薄い層）を新設。`*.logic.ts` は純関数のまま
- `e2e/frameworks/shared.ts` には tabs / menu / popover を載せていない: **ラッパー生成器が `{ raw }` ノードを Vue / Svelte / Astro で既定 slot として 2 回描く**（`Menu.svelte` が `{@render children()}` を 2 回出す）→ 023 以降（`tools/cem/src/wrappers` のレーン）
- 規約の食い違い: `riml-ds-element` skill §4 の「無効は `aria-disabled`」と markuplint `wai-aria`（`<button>` / `<a href>` の `aria-disabled` を落とす）が矛盾。どちらかを合わせる判断が要る（advisor）
- `rd-menu` / `rd-popover` の `:not(:defined)` は `[popover]` を開いた状態で見せる（ティア B）。定義直前に一瞬開いて見える。実アプリで気になれば `dialog` と一緒に判断
- 存在しないトークンは代用で通した: 太罫 `calc(var(--rd-border-width-default) * 2)`、影 `--rd-shadow-overlay`、反転文字は `chrome.default` / `chrome.text`
- guard 検査 14 は lanes.tsv の `_shared/popover-anchor.ts` が `.test.ts` にプレフィックス一致しなかった → `aed76cd` で拡張子を落とした
- 見直し候補: `.rd-nav-rail` の選択印（pe ページでは括弧状の線に見える）と Storybook `Patterns/Navigation` story（advisor）

### 022 の実行メモ（2026-09-08）

- マージ `4f9b19e`（020 の後。`tier-b.spec.ts` / `css/README.md` / `build.test.ts` の union 衝突は advisor が両取りで解消）。
  `atoms.css` に `.rd-card` / `.rd-empty` / `.rd-spinner` / `.rd-accordion` / `.rd-carousel` / `.rd-scroll-area`、`utilities.css` に `.rd-aspect`、
  `rd-dialog` に `alert`（`alertdialog`。背面クリックだけ止める）と `placement`（`start` / `end` / `bottom` の帯）。既存 Dialog の VRT は 1 枚も変わらず、新規 16 枚
- 検査: check 0、test 1070、pe 53、e2e:frameworks 50、a11y 16、VRT 737（全 project）、lint:html 通過、release:check 0（dialog/define 9.19 KB）。`dialog.element.ts` 148 行 / `if` 4
- 計画から変えた点: spinner の `linear` と強制配色の `scrollbar-color: auto` は `declaration-strict-value` を理由コメント付きで無効化。
  `scrollbar-*` は `@supports` で囲む（`scrollbar-gutter` が baseline-newly のため）。`.rd-card:has(.rd-card-link:focus-visible)` に単純化（詳細度 0,3,0 の上限）。
  `#onCancel` / `#onClick` は `event.type` から理由を導く `#dismiss(event)` に統合。`@starting-style` の placement 規則から `[open]` を外した（詳細度）。
  `e2e/frameworks` の `compareMarkup` は `placement` だけ（boolean `alert` は vue/svelte が `"true"`、react/astro が `""` を書く既知の差）。
  `tools/mcp/src/examples.ts` は 1 タグ 1 例なので dialog の例を `placement="end"` に差し替え。
  `dialog.sr.test.ts` は `alertdialog` を直接見ない（virtual-screen-reader は shadow の `<dialog>` を走査しない）。幾何は `expect.poll`
- guard 検査 15 は「属性追加だけでは `registry.json` が 1 バイトも変わらない」のに差分を要求して `release:check` と矛盾していた → `3e97592` で「新しい `*.element.ts` が増えたときだけ要求」に緩和。生成物の鮮度は CI の「エージェント向けの面」が見る
- 残件: `system/css/README.md` の `.rd-window` 節が古い（丸 3 つは `radial-gradient` ではなく本物の `<button>`。ADR-0014）→ advisor が直す。
  `.rd-card` のリンクカードは中に別の操作要素を置くと `::after` の下に隠れる（`position: relative` を付ける、と `atoms.css` に明記）。
  `dialog.element.ts` は 148 / 150 行でほぼ満杯 — 次に属性を足すなら判断を `dialog.logic.ts` に寄せる

### 021 の実行メモ（2026-09-08）

- マージ `5588b47`（020・022 の後。`build-pages.ts` / `markup.test.tsx` / `examples.ts` / `elements.test.ts` の union 衝突は advisor が両取り。
  `examples.ts` は衝突ブロックの外にあった `} as const` が片側に落ちて構文エラーになった → 手で補った）。
  `rd-checkbox-group`（A、`min` は部品が見る）と `rd-input-otp`（A、`<fieldset>` + N 個の `<input maxlength=1>`、`input-otp.cells.ts` に DOM 操作）を experimental に、
  `.rd-button-group` を `patterns.css` に。検査: check 0、test 1167、pe 62、e2e:frameworks 62、a11y 18、VRT 824、release:check 0（checkbox-group 7.06 / input-otp 7.24 KB）
- **`rd-toggle` は STOP**: 契約の木に `aria-pressed: '$pressed'` を置くと、ラッパー生成器が (1) Vue でハイフン付きキーをクォートせず構文エラー、
  (2) `attrTypeFor` が `aria-pressed` を `string` にして React の型に合わない。どちらも `tools/cem/src/wrappers` の修正が要る → **023 の Step 3b に足した**
  （キーのクォート + `HTML_ENUM_ATTRS` に `button.aria-pressed`）。書き上げた toggle 一式は scratchpad に退避 → **024 で入れ直す**
- 計画から変えた点: `.rd-button-group` に `ghost` は載せない（沈んだ枕の上で `accent-text` が 6.65:1 で AAA を割る。選択中 = primary / 非選択 = secondary）。
  `otpCellsMarkup` は `pattern` 付き `<input>` に必須の `title` と、`aria-describedby` 用の `id` も書く。
  `library/elements/package.json` の exports はアルファベット順ではない（checkbox の直後 / disclosure の直後に入れた）
- 見つけた問題: 自動前進のたびに桁間の `blur` で `touched` になり全桁が危険色になっていた → `insideBlur()` で部品内の移動を除外（`447f92c`）。
  **同型の疑いが `rd-radio-group` / `rd-checkbox-group` にもある**（選択肢間の移動で `touched`。実害は小さい）。
  VRT の `maxDiffPixelRatio: 0.001` は 1024 幅だと細い罫線の色変化を拾えない（360 幅では拾った）。
  `bun install --frozen-lockfile` が `bun.lock` に `optionalPeers` 3 行を足す（bun 1.4.0 と lock の生成バージョン差。都度 `git checkout bun.lock`）
- 残件: `.rd-button-group` / `.rd-input-group` / `Patterns/*` の Storybook story（advisor）、`segmented` CSS の重複（3 つ目が出たら `.rd-segmented` へ）

### 023 の実行メモ（2026-09-08）

- マージ `887beb1`（021 の後。`e2e/frameworks/*.spec.ts` / `shared.ts` / `e2e/{react,vue,svelte}/src/{App.*,defines.ts}` の union 衝突は advisor が両取り。
  `shared.ts` は `navigationSuite` の閉じ括弧 3 行が衝突ブロックの外にあって落ちた → 手で補った。executor は指示どおり STOP して `merge --abort` していた）。
  `Dialect.raw(name)`: `children` だけ既定 slot、`trigger` / `items` / `tabs` / `panels` は名前つき slot（Vue `<template #trigger>`、Svelte `{#snippet trigger()}`、Astro `slot="trigger"`）。
  `astroExports()` が `library/astro/package.json` の `exports` を書く（021 の 2 つを含めて experimental 12 個）。
  検査: check 0、test 1179、e2e:frameworks 98（着手時 50）、release:check 0、guard 0。a11y / VRT は story・CSS・要素に触っていないので省略
- **Step 3b（021 の rd-toggle が踏んだ生成器の穴）**: Vue の `objectKey()` がハイフン付きキーを引用、`HTML_ENUM_ATTRS` に `button.aria-pressed: ['true','false']`。
  fixture に `rd-toggle` を足して固定した（既存の生成物は 1 バイトも変わらない）→ 024 で toggle を入れ直せる
- 計画から変えた点: §5 の `canonical` 正規化は不要だった（astro を meter / window / radio / slider の suite に載せても boolean 属性が比較対象に出ない）。
  `navigationSuite` の menu は可視性ではなく `:popover-open` で見る（下の問題のため）
- **見つけた問題**: `library/elements/src/menu/menu.css` の `rd-menu [popover] { display: grid }` が UA の `[popover]:not(:popover-open) { display: none }` を
  上書きしている疑い → 閉じたメニューが可視になる。`rd-popover` は `display` を書いていない。**024 で検証して直す**（`:popover-open` 側に寄せる）
- 残件: `formWave4Suite` の astro 除外コメントが古い（exports は生成されるようになった）→ 024 で astro を載せる。
  `bun run gen` 単体ではクリーンな worktree で生成物が出ない（契約を `library/elements/dist` から読む）→ 計画の Step 0 は `bun run build` を先に書く。
  skill `riml-ds-element` に「raw の名前 = slot 名（`children` は既定）」を追記（advisor）

### 027 の実行メモ（2026-09-08）

- `feat/tokens-dark` を `631000d` で `--no-ff` マージ（7 コミット、72 ファイル、+271/−14）。024 と並行し、コンフリクト無し
- 決めた値: `neutral.750` = riml `[0.31, 0.035, 270.31]` / qrcc `[0.28, 0.013, 265]` / noter `[0.30, 0.02, 200]`（計画の既定値では dark の `text.muted` × `surface.hover` が riml 6.56 / noter 6.77 で 7:1 を割ったため、計画 §1 の指示どおり L を −0.02。riml は許容下限）。`neutral.950` は計画どおり
- 実測（dark）: `text.muted` × `surface.hover` = riml **7.062** / qrcc 7.548 / noter 7.283。riml は AAA まで 0.06 しか余裕が無い。`neutral.300`（dark の muted）を明るくすると余裕が作れる（別件）
- 影: `--rd-shadow-raised: 0.25rem 0.25rem 0rem 0rem light-dark(oklch(22% … / 0.16), oklch(0% 0 0 / 0.5))`。Terrazzo は modes の shadow 上書きを受け付けたので Step 4 の revert は不要だった。`fold()` に `splitTrailingColor` を足し、`light-dark(` は 26 → 28
- 計画からの逸脱: `DESIGN.md` の再生成を Step 2 で実施（`tools/mcp/test/design-md.test.ts` がバイト比較するため Step 2 の緑に必要）。Drift check の `grep -c 'light-dark('` は 3（doc コメント 2 件）で計画の 1 と違ったが、コードの畳み箇所は 1 か所で抜粋一致 → 続行（計画の grep が粗かった）
- **VRT の閾値の問題**: `threshold: 0.05`（YIQ）では dark の sunken `#151a29 → #0b0f1a` / hover `#232839 → #293042` の差が拾えず、面の変更で baseline が更新されなかった（更新されたのは影が出た 58 枚だけ）。面の段差は隣接コントラスト比（sunken↔default 1.103、raised↔hover 1.108）で確認。閾値の見直しは既存の課題（VRT 1024 threshold）と一緒に扱う
- `bunx oxfmt docs/*.md` は Markdown が対象外で動かない（既知）。手で体裁を揃えた
- 検証（worktree）: check 0、test 1201 passed / 1 skipped、a11y 22 passed、vrt 1012 passed、release:check 0（tokens.css 1.66 kB brotli）、guard 0

### 024 の実行メモ（2026-09-08）

- `feat/form-wave5` を `fb0c2c2` で `--no-ff` マージ（executor 6 コミット + `9084acb chore(merge)`）。027 と並行。main（027）を取り込むときに dark の `components-menu--{closed,variants}` 4 枚がコンフリクト → 024 側（閉じた状態＝バグ修正後）を採用し、その後 `bash scripts/vrt.sh` 1055 passed で差分無しを確認
- `rd-toggle`（experimental、ティア A）: 021 で退避したコードをテスト → 実装の順で入れ直し、`build → gen` で 4 ラッパーが出た（vue の `'aria-pressed'` 引用、react の `'true' | 'false'`、astro の exports は生成器が追加）。`toggle/define` 6.05 kB / 12 kB
- 退避版への手当て: `vi.fn<(event: Event) => void>()`（`vitest/require-mock-type-parameters`）、`:hover:where(:enabled)`（詳細度 0,3,0）、JSDoc「載せたい」→「載せる」（MCP の 2-gram サジェストが `…したい` に誤ヒットして `suggest.test.ts` が落ちた）
- レビュー指摘 1 件を修正（`30a6999`）: 強制配色で押下（内側の細い Highlight の輪）とフォーカスが同じ形になっていた → `:focus-visible` を完全な `outline` 一括指定に。CSSOM を読むテストを追加
- 計画からの逸脱: `Menu/Closed` story は既に存在し（`d5aca33`）、そのベースラインがバグの画（閉じているのにリストが出ている）だった。`Variants` も閉じた story。この 8 枚（light/dark × 360/1024 × 2）だけ変わり、開いた状態の画像は不変 → STOP 条件には当てず続行。**`Menu/Variants` は閉じた 2 つのトリガーだけになり `placement` の違いが画に出ない**（story の見直しは advisor の宿題）
- ラッパーは `pressed` を既定 `'false'` にしない（計画の記述が誤り）。4 アプリで `pressed="false"` を明示
- 検証（main マージ前の worktree、027 込み）: check 0、test 1235 passed / 1 skipped、e2e:frameworks 110 passed（98 → 110）、pe 66、a11y 23、vrt 1055、release:check 0、guard 0
- 宿題（advisor）: `riml-ds-element` skill に「`[popover]` を持つ部品は通常状態に `display` を書かない」「raw の `children` は既定 slot、他は名前つき slot」を追記。`scaffold:element` が `*.contract.test.ts` を作らない（skill の構成と 1 本ずれ）

### 025 の実行メモ（2026-09-08）

- `feat/combobox` を `0d566a3` で `--no-ff` マージ（executor 5 コミット + `0f4290d chore(merge)`）。026 と並行し、コンフリクト無し
- `rd-combobox`（experimental、ティア A、light DOM）: 定義前は `<input list>` + `<datalist>` のネイティブ候補、定義後は `list` を外して `[part=list][popover=manual]` の listbox に写す。`combobox/define` 9 kB / 14 kB
- 計画からの逸脱（すべて受け入れ）: `decideKey` / `reduceKey` の純関数分割と `combobox.dom.ts`（277 行）への DOM 分離、契約検査を `willUpdate` で行う、`<datalist>` に `aria-hidden="true"`（markuplint がアクセシブル名を要求）、候補 0 件では `role="listbox"` を出さない（空の listbox は markuplint が落とす）、
  選択行の縦罫は `border-inline-start`（stylelint の `declaration-strict-value` が `box-shadow: inset …` を落とす）、JS ありの挙動テストは `e2e/a11y/keyboard.spec.ts`（`e2e/pe` は `javaScriptEnabled: false`）、Disabled story は `unsafeHTML`（lit のコメントノードが `<datalist>` の permitted-contents に引っかかる）、`ComboboxFilter` 型を公開
- 025 の保守メモ: `filterCandidates` / `normalize` は 028（`rd-command`）で `_shared/text-filter.ts` に移す
- 検証（main マージ後の worktree）: check 0、test 1297 passed / 1 skipped、guard 0、pe 70、e2e:frameworks 122、vrt 1111（新規 50 枚、既存の変更 0）、a11y 25、release:check 0
- 宿題（advisor）: skill `riml-ds-element` に「ラッパーの props は契約の `tree.attrs` から作られる」「`box-shadow: inset` は書けない → 罫線」「JS ありの e2e は `keyboard.spec.ts`」「`<datalist>` / 空の listbox の markuplint 規則」を追記

### 026 の実行メモ（2026-09-08）

- `feat/hover-context-nav` を `fa1835c` で `--no-ff` マージ（executor 7 コミット + `8f4abe5 chore(merge)`）。025 と並行し、コンフリクト無し。76 ファイル、+1524/−47
- `rd-popover hover`（Hover Card）: `hover` 属性で pointerenter / focusin に開き、pointerleave / focusout で閉じる。開閉の遅延は `popover.logic.ts` の純関数で決め、タイマーは注入。`rd-menu context`（Context Menu）: `contextmenu` を受けて `menu.dom.ts` の `contextController` がポインタ位置に `[popover]` を出す。`.rd-nav-menu`（Navigation Menu）は `system/css/src/navigation.css` の CSS だけ（要素を増やさない）+ `Patterns/Navigation` story
- 先行リファクタ（`821d5ef`）: `rd-menu` の配線と項目解決を `menu.dom.ts` に移し、`menu.element.ts` を 148 行に収めた
- レビュー指摘 2 件を修正（`aee690f`）: (1) 開いている popover に `showPopover()` を再度呼ぶと `InvalidStateError` → `:popover-open` なら `hidePopover()` してから開き直す（テスト 2 本追加）。(2) `.rd-nav-menu a` の下線（`border-block-end`）が `border-radius` で両端で曲がっていた → `border-start-start-radius` / `border-start-end-radius` だけにし、nav の VRT 17 枚を撮り直し（026 の新規 45 枚の内数）
- 計画からの逸脱: 無し（`docs/proposals/hover-card.md` / `context-menu.md` は計画どおり）
- 検証（main マージ後の worktree）: check 0、test 1348 passed / 1 skipped（148 files）、guard 0、pe 79、e2e:frameworks 122、vrt 1167（既存の変更 0）、a11y 27、release:check 0。main 側: build/gen 0、guard 0
- 宿題（advisor、対応済み `71edf37`）: `riml-ds-element` skill に「`showPopover()` の再呼び出しは `InvalidStateError`」「ラッパーの props は契約の `tree.attrs`」「`box-shadow: inset` 不可」「markuplint の落とし穴」を追記、`riml-ds-tdd` に e2e の 2 層（`e2e/pe` JS 無し / `keyboard.spec.ts`）、`riml-ds-css` に stylelint の `box-shadow` 行を追加

### 029 の実行メモ（2026-09-09）

- `feat/table-sort` を `1bff5b7` で `--no-ff` マージ（executor 6 コミット + `980d7f1 chore(merge)`）。028・030 と並行。82 ファイル、+1953
- `rd-data-table`（experimental、ティア A、light DOM）: `<table class="rd-table">`（`caption` / `thead` / `tbody` 必須）を包み、定義後に `th[data-sort]` の中身を `<button part="sort">` に移す。行は `tbody.append` の**移動**で並べ替え（作り直さない）。`text`（`Intl.Collator`、最も近い `[lang]`）/ `number` / `date`、比較キーは `td[data-value]`。`manual` は `aria-sort` + `rd-sort` だけ。`data-table/define` 6.72 kB / 12 kB
- 計画からの逸脱（すべて受け入れ）: `wrapHeader` は子ノードを先に配列へ取ってから包む（計画の順だと `HierarchyRequestError`）、ラッパーの props は CEM の型から `column?: number` / `direction?: SortDirection` / `manual?: boolean` で生成された（計画の「文字列になる」予測は誤り。望ましい形なので proposal に課題として書かず）、`applyOrder` に恒等チェック（`MutationObserver` の再入で鳴き続けないため）
- 検証（main マージ後の worktree）: check 0、test 1412 passed / 1 skipped、guard 0、pe 82、e2e:frameworks 138、a11y 31、vrt 1211（新規 42、既存の変更 0。VRT・pe・a11y は Docker と同時に回すと `page.goto` の 30 秒タイムアウトが出る → 単独で回し直して全通過）、release:check 0
- **事故と対策**（`2b574f0`）: レビュー中に **worktree の中から `git push`** を叩いた → lefthook の pre-push が `scripts/guard.test.ts` を回し、フックが export する `GIT_DIR` を継承した偽リポジトリの `git init` / `commit` が**本物のリポジトリ**に当たった（main の `.git/config` が `core.bare = true` になり、`feat/table-sort` が `base` コミットで上書き、`work` / `feat/tokens` ブランチが生えた）。`core.bare` と `user.*` を戻し、本来の先端 `980d7f1` を直接 main にマージして復旧。`guard.test.ts` の子プロセスに `GIT_*` を渡さないよう修正。**`git push` は必ず main のチェックアウトから叩く**（worktree からは叩かない）
- 宿題（advisor）: 360px でヘッダ「サイズ」が折り返す（許容。`th { white-space: nowrap }` は次の見直しで検討）。executor 報告の `bun run lint:html` が別 worktree の `apps/storybook/rendered/**` を読む件は `tools/markuplint` の設定を確認

### 028 の実行メモ（2026-09-09）

- `feat/command` を `f3c7bbc` で `--no-ff` マージ（executor 7 コミット + `fd38e40` / `d73f207` の `chore(merge)` + `3e66c4f`）。029・030 と並行。029 とのコンフリクト 22 ファイルは union で解いた
- `rd-command`（experimental、ティア A、light DOM）: `<label for>` + `<input type="search">` + リンク／ボタンの `<ul>` を包む。**項目は本物の `<a>` / `<button>` のまま**（`role="option"` に書き換えない。cmdk と違い ⌘クリック・右クリックのリンク動作が残る）で、`<li hidden>` / `<ul hidden>` で絞る。絞り込みは `_shared/text-filter.ts`（025 の `filterCandidates` / `normalize` を移し、combobox は再エクスポートで従来どおり）。0 件は常に描いた `<p part="empty" role="status">` を `hidden` で切る。`command/define` 7.54 kB / 12 kB
- 計画からの逸脱（すべて受け入れ）: 契約に `<input value="$defaultValue">`（React の client 生成器が `defaultValue` を要る）、`InDialog` story は入力欄へのフォーカス移動を利用側（story）が行う（`showModal()` は帯の × に置くため）、`Wiring.labelId` は不要で落とした、`ITEM_SELECTOR` は `roles` に入れない（`checkContract` は 1 個目しか見ない）
- 検証（main マージ後の worktree）: check 0、test 1480 passed / 1 skipped、guard 0、pe 85、e2e:frameworks 150、a11y 35、vrt 1265（新規 42、既存の変更 0）、release:check 0。main 側: build/gen 0、guard 0
- **union マージの落とし穴（再発）**: `.size-limit.json` で 2 エントリの境目（`"limit": "12 KB"\n  },\n  {`）が両側共通の行として落ち、command のエントリが data-table に**上書きされて消えていた**（JSON としては有効なので `bun run check` は通る。`bunx size-limit --json` で気づいた）。union で解いた JSON / `import {` / `} as const` は**必ず中身を目で確かめる**。`markup.test.tsx` の重複 import（`../src/experimental.js` ×2）も同じ原因
- 宿題（advisor）: `[part='empty']` が 1024px で左寄りに見える（`base.css` の `p { max-inline-size: 65ch }` の中で中央寄せされる）→ `max-inline-size: none` を足す。`riml-ds-worktree` skill に「union マージ後の点検リスト（JSON の境目・import の開き・`as const` の閉じ）」を追記

### 030 の実行メモ（2026-09-09）

- `feat/splitter` を `855b4d2` で `--no-ff` マージ（executor 7 コミット + `0782972 chore(merge)`）。028・029 と並行。83 ファイル、+1818
- `rd-splitter`（experimental、ティア B、shadow）: `slot="start"` / `slot="end"` の 2 面と `role="separator"` のつまみ 1 つ（APG「Window Splitter」）。`position` は 0–100 の整数 %（px は持たない）、`min` 20 / `max` 80、`direction` は面の並び（`aria-orientation` は逆になり、反転は `ariaOrientation()` の 1 か所だけ）。ドラッグは `setPointerCapture`（window を購読しない）、キーは ← → / ↑ ↓ 1%、Shift 10%、Home / End。`rd-resize` は利用者の操作のときだけ、間引かない。定義前は `:not(:defined)` で縦積み。`splitter/define` 8.05 kB / 12 kB
- 計画からの逸脱（すべて受け入れ）: 44px の当たり領域は `::before` ではなく `<span part="grip" aria-hidden="true">`（markuplint の `no-empty-palpable-content` と、`getBoundingClientRect()` で測れる完了条件のため）、遷移は `prefers-reduced-motion: no-preference` の中だけ、`@supports selector(:state(dragging))` で囲む、`splitter.sr.test.ts` を追加、`positionFromKey()` と dragging フラグを `splitter.dom.ts` に置く、ラッパーの props は CEM から数値型で生成
- main 取り込み（028・029 の後）: 14 ファイルが競合し union で解いた。落ちた共通行 5 か所（`e2e/vue/src/App.ts` の `},\n ),`、`keyboard.spec.ts` の `})\n\n/**`、`build-pages.ts` の `})}\`,\n ),`、`shared.ts` の `})\n })\n}`、`markup.test.tsx` の import 重複）を `bunx oxfmt --check` の位置から直した。JSON 3 本は境界を含めて無事、CEM / registry は `bun run gen`
- 検証（main マージ後の worktree）: check 0、test 1528 passed / 1 skipped（164 files）、guard 0、vrt 1314（新規 42、既存の変更 0）、pe 88、e2e:frameworks 166、a11y 39、release:check 0。main 側: build/gen 0、guard 0
- 宿題（advisor）: story の面に余白が無く、文字がつまみに接して見える（利用側の責任だが見本としては `padding` を足したい）。`riml-ds-worktree` skill §7 に reviewer のマージ手順を追記済み（`b9f48ba`）

### 031 の実行メモ（2026-09-09）

- `feat/toggle-group` を `c138e37` で `--no-ff` マージ（executor 5 コミット `4d8f7a9`〜`3739d5b` + `c6b3438 chore(merge)`）。032・033・035 と並行。86 ファイル（新規スクリーンショット 46）
- `rd-toggle-group`（experimental、ティア A、light DOM）: `<fieldset>` / `<legend>` と `<button aria-pressed>` の列を包み、**送信には載せない**押下ボタンの列にする。押下の真実は各 `<button>` の `aria-pressed`（`values` は委譲だけ）、`mode="single"` の排他と解除（0 個を許す）、矢印 / Home / End の roving tabindex（APG「Toolbar」。`tabindex` は JS が付けるので JS 無しでは全部 Tab で辿れる）、`rd-change` はユーザー操作だけ。項目は `<button>` 直書き（`rd-toggle` を中に入れない——押下の所有者が二重になる）。`toggle-group/define` 6.77 kB / 12 kB
- 計画からの逸脱（すべて受け入れ）: `generated/index.ts` の grep は生成器の仕様（experimental は `experimental.ts` に出る）で満たせない → `experimental.ts` で確認、element 150 行を守るため `toggle-group.dom.ts`（103 行）へ描画と MutationObserver を出した、frameworks e2e の項目名を「太字」→「強調」（既存の `rd-toggle` suite と strict-mode で衝突するため）
- 検証（main マージ後の worktree）: check 0、test 1597 passed / 1 skipped（169 files）、guard 0（main を push した後。**規則 14 は `origin/main` と比べる**ので、未 push の main コミットが混ざると「別レーン所有」と出る）、vrt 1367（新規 46、既存の変更 0）、pe 91、e2e:frameworks 178、a11y 43、release:check 0。main 側: build/gen 0、guard 0
- 宿題（advisor）: 見た目は `rd-checkbox-group:state(segmented)` と重複している。**3 つ目が出たら `patterns.css` の `.rd-segmented` に寄せる**（proposal 保守メモ）

