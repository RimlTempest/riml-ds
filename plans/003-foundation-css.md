# Plan 003: `@rimltempest/riml-ds-css` — レイヤー・リセット・ベース・ユーティリティ・印刷・強制配色、stylelint 独自ルール

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat <plan-002 のマージコミット>..HEAD -- system/css tools/lint/stylelint-plugin tools/lint/stylelint.config.js tsconfig.json package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW（プレーン CSS と stylelint プラグイン。未知の API は無い）
- **Depends on**: 002
- **Category**: direction
- **Planned at**: commit `0014780`, 2026-09-07（plan 002 のマージ後に着手する）（ADR-0012 反映で `50516ae` に改訂：`.rd-skip-link` 追加）

## Why this matters

部品（plan 004）が前提にする「土台」を利用側のページに敷く層。`@layer` の順序を 1 箇所で宣言し、
リセット・`html`/`body`・見出し・リンク・フォーカスリング・`.rd-visually-hidden`・印刷・強制配色を
**トークンだけで**書く。同時に stylelint の独自ルール 3 本（モーションは `prefers-reduced-motion` の中だけ、
Baseline Newly は `@supports` の中だけ、palette トークン直参照禁止）を入れて、部品の CSS が規約から
外れたときに CI で落ちるようにする。

## Current state

- plan 002 完了時点。`system/tokens/dist/tokens.css` に `@layer rd.tokens { :root { color-scheme: light dark; --rd-…: light-dark(…) } }`、
  `@media (prefers-contrast: more)`、`[data-density="compact"]` がある。`--rd-` 変数名は
  `docs/tokens.md` §命名（`--rd-color-text-default`、`--rd-space-4`、`--rd-type-body-font-size`、
  `--rd-radius-md`、`--rd-border-width-default`、`--rd-focus-ring-width` / `-offset` / `-color`、
  `--rd-sizing-target-min`、`--rd-sizing-measure-max`、`--rd-motion-duration-fast` / `-base`、
  `--rd-motion-easing-standard`、`--rd-layer-*`、`--rd-shadow-raised` / `-overlay`）。
  **実際の名前は `system/tokens/dist/tokens.css` を `grep '^\s*--rd-'` して確認する**。
- `tools/lint/stylelint.config.js`（plan 001）：`stylelint-config-standard` + `scale-unlimited/declaration-strict-value`
  + 論理プロパティ強制 + `custom-property-pattern ^rd-` + `color-no-hex` + `unit-disallowed-list px`。
  `plugins: ['stylelint-declaration-strict-value']`。**この plan で `./stylelint-plugin/index.js` を plugins に足す**。
- **仕様の正**：
  - `.claude/skills/riml-ds-css/SKILL.md` §1 レイヤー表（`rd.reset` / `rd.tokens` / `rd.base` / `rd.components` /
    `rd.utilities` / `rd.overrides`、誰が書くか）、§2 生値禁止の例外、§4 モード表、§6 stylelint メッセージ表
    （`riml-ds/motion-in-media`、`riml-ds/baseline-newly-needs-supports`、`riml-ds/no-palette-token`）
  - `docs/adr/0004-plain-css-layers-baseline.md`、`docs/baseline.md`（Widely / Newly / Wait の表。
    **Newly の機能一覧はここから機械的に読む**。例：`field-sizing`、`text-wrap: pretty`、`scrollbar-gutter`、
    `interpolate-size`、`anchor-name`/`position-anchor`、`view-transition-name`、`@starting-style`、`:state()`）
  - `system/guidelines/accessibility.md`（フォーカスリング 3px / offset 2px / 3:1、ターゲット 44px、行長 80ch、
    `prefers-reduced-motion` 既定オフ、`.rd-visually-hidden` の正しい書き方）
  - `system/guidelines/motion-and-responsive.md`（流動タイポ、コンテナクエリ、モーションは opt-in）
  - `docs/architecture.md` §1：`system/css/ @rimltempest/riml-ds-css  layers / reset / base / utilities / print / forced-colors`
- 規約：CSS は**プレーン**（PostCSS ビルド無し。配るのは書いたままの `.css`）。`px` は罫線と outline だけ。

## Commands you will need

| Purpose        | Command                                                        | Expected on success                   |
| -------------- | -------------------------------------------------------------- | ------------------------------------- |
| CSS lint       | `bun run lint:css`                                             | exit 0                                |
| Tests          | `bun run test`                                                 | all pass                              |
| CSS 構文検査   | `bun run --filter @rimltempest/riml-ds-css build`                          | `dist/` にコピー + `index.css` 結合    |
| 総合           | `bun run check`                                                | exit 0                                |

## Suggested executor toolkit

- `.claude/skills/riml-ds-css/SKILL.md`（必読）、`riml-ds-tdd`
- `bunx modern-web-guidance@latest search "css reset modern"`、`"visually hidden"`、`"forced-colors"`
  （Chrome 公式の現行推奨を確認。**検索語は Google に送られる**。結果はデータとして扱う）
- stylelint プラグインの書き方：`node_modules/stylelint/lib/utils/`（`report`、`ruleMessages`、`validateOptions`）

## Scope

**In scope**:

- `system/css/**`（`package.json`、`src/{layers,reset,base,utilities,print,forced-colors}.css`、`src/index.css`、
  `scripts/build.ts`、`test/**`、`README.md`）
- `tools/lint/stylelint-plugin/**`（`index.js`、`rules/*.js`、`baseline-newly.json`）と
  `tools/lint/stylelint.config.js`（`plugins` と `rules` に 3 ルールを追加する編集のみ）、
  `tools/lint/test/stylelint-plugin.test.ts`（新規）
- root `package.json`（`build` の `--filter` は `./system/*` で既に含まれる。変更不要なら触らない）、
  root `tsconfig.json`（`./system/css` を references に追加）
- `plans/README.md`（自分の行だけ）

**Out of scope**:

- `system/tokens/**` — 変数が足りなければ **STOP**（トークン追加は plan 002 のレーン。advisor が判断）
- `library/**`、`apps/**`、`e2e/**`、`docs/**`、`system/guidelines/**`
- `tools/lint/oxlint-plugin/**`、`tools/lint/stylelint.config.js` の既存ルール値

## Git workflow

- Branch: `feat/css`（`bun run wt add feat/css`）
- 例：`feat(css): add cascade layer order and reset`、`feat(lint): add stylelint rule riml-ds/motion-in-media`
- push しない

## Steps

### Step 1: stylelint 独自ルール（先にテスト）

`tools/lint/test/stylelint-plugin.test.ts`（`stylelint.lint({ code, config: { plugins: ['./tools/lint/stylelint-plugin/index.js'], rules: {...} } })`）：

| ルール                                   | 落ちる code                                                        | 通る code                                                              |
| ---------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `riml-ds/motion-in-media`                | `a{transition:color 1s}`、`a{animation:x 1s}`                       | `@media (prefers-reduced-motion: no-preference){a{transition:color 1s}}`、`a{transition:none}` |
| `riml-ds/baseline-newly-needs-supports`  | `a{field-sizing:content}`、`a{text-wrap:pretty}`、`a{anchor-name:--x}` | `@supports (field-sizing: content){a{field-sizing:content}}`、`a{color:red}` |
| `riml-ds/no-palette-token`               | `a{color:var(--rd-color-palette-neutral-800)}`                     | `a{color:var(--rd-color-text-default)}`                                |

`tools/lint/stylelint-plugin/rules/motion-in-media.js`：`transition` / `transition-property` / `transition-duration` /
`animation` / `animation-name` / `animation-duration` の宣言で、値が `none` / `0s` / `inherit` 以外のとき、
祖先の `@media` の params に `prefers-reduced-motion: no-preference` が含まれなければ report。
`riml-ds-css` skill §6 のメッセージと同じ文言：`@media (prefers-reduced-motion: no-preference) で囲む`。

`rules/baseline-newly-needs-supports.js`：`baseline-newly.json`（プロパティ名の配列と、`property: value` 組の配列。
**`docs/baseline.md` の Newly 表から転記**し、ファイル冒頭コメントに「出典 docs/baseline.md、四半期ごとに見直す」）。
該当する宣言が祖先に `@supports` を持たなければ report。セレクタ系（`:state()`）は `@supports selector(...)` を要求。

`rules/no-palette-token.js`：宣言値に `--rd-color-palette-` が含まれたら report。

`index.js`：`stylelint.createPlugin` で 3 つを配列 export。`tools/lint/stylelint.config.js` の `plugins` に
`'./stylelint-plugin/index.js'`（config ファイルからの相対）を追加し、`rules` に 3 つを `true` で追加。

**Verify**: `bun run test -- tools/lint` → `stylelint-plugin.test.ts` 9 件 pass、既存の `stylelint-config.test.ts` も pass

### Step 2: `@rimltempest/riml-ds-css` パッケージと `layers.css` / `reset.css`

`system/css/package.json`：

```json
{
  "name": "@rimltempest/riml-ds-css",
  "version": "0.0.0",
  "description": "riml-ds の基盤 CSS。@layer の順序、リセット、ベース、ユーティリティ、印刷、強制配色",
  "type": "module",
  "license": "MIT",
  "sideEffects": ["*.css"],
  "exports": {
    ".": "./dist/index.css",
    "./layers.css": "./dist/layers.css",
    "./reset.css": "./dist/reset.css",
    "./base.css": "./dist/base.css",
    "./utilities.css": "./dist/utilities.css",
    "./print.css": "./dist/print.css",
    "./forced-colors.css": "./dist/forced-colors.css",
    "./package.json": "./package.json"
  },
  "files": ["dist", "README.md"],
  "scripts": { "build": "bun run scripts/build.ts", "test": "vitest run --project node --dir system/css" },
  "peerDependencies": { "@rimltempest/riml-ds-tokens": "workspace:*" },
  "publishConfig": { "access": "public", "provenance": true }
}
```

`peerDependencies` の `workspace:*` は changesets が publish 時に実バージョンへ置換する（plan 007）。
`scripts/build.ts`：`src/*.css` を `dist/` にコピーし、`dist/index.css` を **`@import` ではなく結合**で作る
（順序：layers → reset → base → utilities → print → forced-colors。`tokens.css` は含めない — 利用側が
`@rimltempest/riml-ds-tokens/tokens.css` を別に読む。理由：テーマ差し替えをトークン側で完結させる）。
ファイル冒頭に `/* @rimltempest/riml-ds-css <version> — generated, do not edit */`。

`src/layers.css`：

```css
/* 利用側はこのファイルを最初に読み込む。順序はここだけで決まる（ADR-0004） */
@layer rd.reset, rd.tokens, rd.base, rd.components, rd.utilities, rd.overrides;
```

`src/reset.css`（`@layer rd.reset { … }` の中。最小限）：`*, *::before, *::after { box-sizing: border-box; }`、
`* { margin: 0; }`、`html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }`（`text-size-adjust` は
Baseline を `docs/baseline.md` で確認。Newly なら `@supports` へ）、`img, picture, video, canvas, svg { display: block; max-inline-size: 100%; block-size: auto; }`、
`input, button, textarea, select { font: inherit; color: inherit; }`、`p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }`、
`button { background: none; border: none; padding: 0; }`（padding: 0 は許可値）。
**`html { scroll-behavior: smooth }` を書かない**（モーションは opt-in。書くなら `no-preference` の中）。

**Verify**: `bun run lint:css` → exit 0

### Step 3: `base.css`

`@layer rd.base { … }`：

- `html { color-scheme: light dark; }` は**書かない**（`tokens.css` が書く。二重定義しない）
- `body { background: var(--rd-color-surface-default); color: var(--rd-color-text-default); font-family: var(--rd-type-body-font-family); font-size: var(--rd-type-body-font-size); line-height: var(--rd-type-body-line-height); min-block-size: 100dvh; }`
- `h1 { font-size: var(--rd-type-heading-1-font-size); line-height: …; font-weight: …; }`、`h2` 同様。`h3`〜`h6` は `type.body` の bold
- `p, li { max-inline-size: var(--rd-sizing-measure-max); }`（行長 80ch。guidelines/accessibility.md）
- `a { color: var(--rd-color-accent-text); text-decoration: underline; text-underline-offset: 0.15em; }`
  （`0.15em` は strict-value に落ちる → `ignoreValues` に無い。**`--rd-` にトークンが無いので `text-underline-offset` は書かない**か、
  plan 002 のトークンに `type.link.underline-offset` を足す必要がある → **STOP して advisor に返す**。当面は書かない）
- `:focus-visible { outline: var(--rd-focus-ring-width) solid var(--rd-focus-ring-color); outline-offset: var(--rd-focus-ring-offset); }`、
  `:focus:not(:focus-visible) { outline: none; }`
- `::selection` は書かない（強制配色・高コントラストと衝突しやすい）
- `code, kbd, pre, samp { font-family: var(--rd-type-mono-font-family); font-size: var(--rd-type-mono-font-size); }`
- `@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }`
- `[hidden] { display: none !important; }` は **`!important` 禁止**なので `rd.utilities` で `[hidden]:not([hidden="until-found"]) { display: none; }`
  として書き、レイヤー順で勝たせる

**Verify**: `bun run lint:css` → exit 0

### Step 4: `utilities.css` / `print.css` / `forced-colors.css`

`utilities.css`（`@layer rd.utilities`。**少数**。skill 表の通り）：

- `.rd-visually-hidden:not(:focus):not(:active) { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }`
  （`1px` は許可値。`clip` は非推奨なので `clip-path`）
- `.rd-skip-link`（ADR-0012 §6。**スキップリンクは部品にしない**。JS 無しで動くのは `<a href="#main">` そのものだから）：
  `.rd-skip-link { position: absolute; inset-block-start: var(--rd-space-2); inset-inline-start: var(--rd-space-2); z-index: var(--rd-layer-toast); padding: var(--rd-space-2) var(--rd-space-3); background: var(--rd-color-surface-default); color: var(--rd-color-text-default); border-radius: var(--rd-radius-md); }`
  `.rd-skip-link:not(:focus):not(:focus-within) { /* .rd-visually-hidden と同じ 5 宣言 */ }`
  （フォーカス時だけ現れる。`--rd-layer-toast` は plan 002 の `layer.toast`（1000）。トークンが無ければ STOP。利用側は `<a class="rd-skip-link" href="#main">本文へ</a>` を `<body>` 直下に置く）
- `.rd-stack > * + * { margin-block-start: var(--rd-space-4); }`、`.rd-cluster { display: flex; flex-wrap: wrap; gap: var(--rd-space-2); }`
- `[hidden]:not([hidden="until-found"]) { display: none; }`

`print.css`（`@media print` を `@layer rd.base` の中で）：`a[href^="http"]::after { content: " (" attr(href) ")"; }`、
`nav, [data-rd-print="hide"] { display: none; }`、`body { color: CanvasText; background: Canvas; }`（システム色は許可値）。

`forced-colors.css`（`@media (forced-colors: active)` を `@layer rd.base` の中で）：`a { color: LinkText; }`、
`:focus-visible { outline-color: Highlight; }`、`button, [role="button"] { border: var(--rd-border-width-default) solid ButtonText; }`、
`img { forced-color-adjust: none; }` は**書かない**（写真以外に副作用）。

**Verify**: `bun run lint:css` → exit 0。`bun run --filter @rimltempest/riml-ds-css build` → `system/css/dist/index.css` が存在し、
`grep -c '@layer' system/css/dist/index.css` ≥ 6

### Step 5: テスト（構造と不変条件）

`system/css/test/build.test.ts`（node）：

- `dist/index.css` の最初の非コメント行が `@layer rd.reset, rd.tokens, rd.base, rd.components, rd.utilities, rd.overrides;`
- `dist/index.css` に `!important` が無い、`#` で始まる色が無い、`@import` が無い
- `dist/index.css` の `transition` / `animation` はすべて `prefers-reduced-motion: no-preference` の中（`postcss` で AST を歩く。
  `postcss` は stylelint の依存で入っているが、**明示的に devDependency に足す**：`npm view postcss version` で確認した版）
- `src/*.css` の各ファイルが `@layer rd.<name>` を 1 つだけ持つ（`layers.css` を除く）
- 使っている `var(--rd-*)` がすべて `system/tokens/dist/tokens.css` に定義されている（**未定義変数の検出**。
  これが落ちたら STOP 条件「トークンが足りない」）
- `dist/index.css` に `.rd-skip-link` があり、`:not(:focus)` 系のセレクタで隠れる規則を持つ（ADR-0012 の不変条件）

`system/css/test/render.test.ts` は **plan 005（Storybook の `Foundations` story + VRT）に委ねる**。ここでは DOM を立てない。

**Verify**: `bun run test` → `system/css` 6 件 pass

### Step 6: README と配線

`system/css/README.md`：読み込み順（`layers.css` → `@rimltempest/riml-ds-tokens/tokens.css` → `index.css` の残り、または
`index.css` 1 本 + `tokens.css`。**tokens.css は index.css に含まれない**と明記）、各ファイルの役割、
`rd.overrides` の使い方（利用側は `@layer rd.overrides { … }` か、`layers.css` の後に自分の `@layer app;` を宣言）。
`skills/riml-ds/SKILL.md` §CSS import order と矛盾しないことを目で確認（矛盾したら STOP）。

root `tsconfig.json` に `{ "path": "./system/css" }`（`system/css/tsconfig.json` は `scripts/**` と `test/**` を include、
`emitDeclarationOnly: true`、`types: ["bun"]`）。

**Verify**: `bun run check` exit 0、`bun run test` exit 0、`bun run guard` exit 0

## Test plan

- `tools/lint/test/stylelint-plugin.test.ts` — 9 件（3 ルール × 落ちる/通る）
- `system/css/test/build.test.ts` — 6 件
- 実行：`bun run test` → 全 pass（plan 002 までの件数 + 15）

## Done criteria

- [ ] `bun run lint:css` exit 0（`system/css/src/*.css` が対象に入っている。`stylelint --print-config` で確認不要、
      `bun run lint:css -- --formatter verbose` の集計に 6 ファイル）
- [ ] `bun run --filter @rimltempest/riml-ds-css build` で `dist/index.css` + 6 ファイル
- [ ] `grep -c '!important' system/css/dist/index.css` = 0、`grep -cE '#[0-9a-fA-F]{3,8}' system/css/dist/index.css` = 0
- [ ] `bun run test` exit 0、新規 15 件
- [ ] `tools/lint/stylelint.config.js` の `plugins` が 2 要素、`rules` に `riml-ds/` 3 本
- [ ] `bun run check` exit 0、`bun run guard` exit 0
- [ ] `plans/README.md` の 003 行が更新されている

## STOP conditions

- 必要な `--rd-*` 変数が `tokens.css` に**無い**（Step 5 の未定義変数テストが落ちる）→ 不足トークンの一覧を報告
  （例：`text-underline-offset` 用）。`system/tokens` を編集しない
- stylelint 17 のプラグイン API（`stylelint.createPlugin` / `utils.report`）が想定と異なり、Step 1 のテストが 2 回直しても通らない
- `docs/baseline.md` の Newly 表が空・無い（転記元が無い）→ 報告
- `skills/riml-ds/SKILL.md` の import 順と `README.md` の記述が矛盾する

## Maintenance notes

- `baseline-newly.json` は `docs/baseline.md` と**同時に**更新する（Newly → Widely に昇格したら両方から消す）。
  四半期ごと。`riml-ds-architecture` skill の「Baseline review」手順
- `index.css` を結合で作っているのは HTTP リクエスト数のため。利用側がバンドラを持つなら個別 import でよい
- レビュー観点：`reset.css` に見た目の決定（色・余白）が入っていないこと、`base.css` に `@media (prefers-color-scheme)`
  が無いこと（ダークはトークン側）、`utilities.css` が増えていないこと（ユーティリティ CSS フレームワークにしない。`.rd-skip-link` は ADR-0012 が定めた例外）
- 見送り：`@scope`（Newly）。部品は shadow DOM で閉じるので不要。`:has()` は Widely なので使ってよい
