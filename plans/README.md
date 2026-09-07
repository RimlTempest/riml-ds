# 実装計画

`/improve plan` で書いた計画の索引。各計画は**単体で読めば実行できる**ように書いてある
（executor は会話の文脈を持たない前提）。テンプレートは qrcc の
`.claude/skills/improve/references/plan-template.md`。

**Planned at**: 001〜002 は `0014780`、003〜005 は `7bf04e8`（ADR-0012 反映で改訂）、006〜010 は `7bf04e8`（いずれも 2026-09-07）、014〜016 は `3d85de1`（2026-09-08。ブランド = `docs/brand.md` / ADR-0013）。設計文書（`docs/**`, `docs/adr/**`, `DESIGN.md`,
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
| 016 | [Storybook のブランド切替と Foundations Brand / Mado](016-brand-showcase.md) | P2 | S | 015 | TODO |

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
