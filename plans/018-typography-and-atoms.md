# 018: Typography（`typography.css` + 文字トークンの補完）と静的パターン集 `atoms.css`

**優先度**: P1　**規模**: M　**依存**: 016（マージ済み）。017 と**並行**（レーンが重ならない）
**レーン**: `feat/typography-atoms`　**計画時の main**: `b501378`

> **Drift check（最初に実行）**:
> `test -f system/css/src/typography.css -o -f system/css/src/atoms.css && echo EXISTS` が何も出ないこと。出たら STOP。
> `grep -c '"3"' system/tokens/src/semantic/typography.tokens.json` が 0 であること（`type.heading.3` が未定義 = 前提）。
> `git diff --stat b501378..HEAD -- system/tokens system/css` に差分があれば読む。

## なぜ

オーナーの要望: 「基礎のコンポーネントが少ない。shadcn/ui の一覧を参考に複数作る。typography も用意する」。
shadcn の一覧のうち **JS が要らないもの**（Typography / Badge / Avatar / Separator / Skeleton / Kbd / Table / Alert / Aspect Ratio 相当）は
ADR-0012 §6 の原則どおり **部品（Lit）にせず CSS のクラス**で出す。これが `@rimltempest/riml-ds-css` の `typography.css` と `atoms.css`。
JS が要るもの（tabs / menu / tooltip / radio-group / slider …）は 019 / 020 で部品にする。

見た目の言語は **`docs/brand.md`**（§6 文字、§7 まど）。参考画面から借りるのは「大きな見出し + 字間の広い小さなキャプション」
「丸いアバター」「点線の区切り」「インクの角丸タイル」「選択行が沈む一覧」「区分メーターの凡例」という**構図だけ**。絵・アイコン・文言は写さない。

守る不変条件:

- **AAA**（文字 7:1・非文字 3:1）。色は semantic トークンだけ（`--rd-color-palette-*` は stylelint が落とす）
- **`brand.primary` / `brand.signature` の上に文字を置かない**（brand.md §9）
- 動きは `prefers-reduced-motion: no-preference` の中だけ。`transform` / `opacity` / 背景色だけ（§8）。グラデ・ぼかしは使わない
- **Web フォント 0 バイト**（`font.family.*` は system スタックのまま）
- 新しいトークンは **AAA lint と `bun run design-md` と `tools/mcp/test` を通す**。DESIGN.md は再生成物（手で書かない）
- `px` は罫線・アウトラインだけ。それ以外は `rem` / `em` / `ch` か `--rd-*`

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-css/SKILL.md`（CSS 規約）、`.claude/skills/riml-ds-tokens/SKILL.md`（トークンの足し方・`contrastAgainst`・
  `$description` 必須）、`.claude/skills/riml-ds-tdd/SKILL.md` を読む
- `any` / `as` / `!` / `class` / `enum` を書かない（TS は build script とテストだけ）
- **失敗するテストを先に書く**。CSS は `system/css/test/*.test.ts`（postcss で AST を読んで宣言を assert する既存の形）と VRT で固定
- 触ってよいパス（`scripts/lanes.tsv` の `feat/typography-atoms`）: `system/tokens/src/semantic/typography.tokens.json`、`system/tokens/src/base/typography.tokens.json`、
  `system/tokens/test/**`、`DESIGN.md`（再生成のみ）、`system/css/src/typography.css`（新規）、`system/css/src/atoms.css`（新規）、
  `system/css/scripts/build.ts`、`system/css/package.json`、`system/css/README.md`、`system/css/test/**`、`system/guidelines/typography.md`（新規）、
  `tools/design-md/test/**`、`tools/mcp/test/**`、`docs/agent-integration.md`（guidelines の一覧行だけ）、
  `apps/storybook/stories/Foundations/typography.stories.ts`（新規）、`apps/storybook/stories/Patterns/**`（新規）、`e2e/__screenshots__/**`、
  `e2e/stories.ts`（一覧が手書きなら追記）、`.changeset/`
- **触らない**: `system/css/src/patterns.css`・`library/elements/**`・`apps/storybook/stories/Foundations/mado.*`（017 のレーン）、
  `system/css/src/{layers,reset,base,utilities,print,forced-colors}.css`（必要なら STOP して報告。`forced-colors` の指定は各ファイル内の
  `@media (forced-colors: active)` に書く — `patterns.css` がそうしている）、`system/tokens/src/**/color.*`、`docs/*.md`（agent-integration の 1 行以外）、
  `plans/README.md`、`skills/**`、`.claude/**`
- 隣のレーン `feat/window-controls`（017）が同時に `patterns.css` と `library/elements` を書き換える。`e2e/__screenshots__` は別ファイルなので衝突しない
- コミットは段階ごと。Conventional Commits（`feat(tokens): …` / `feat(css): …` / `docs(guidelines): …` / `test(vrt): …`）

## 現状のコード（抜粋。読んでから触る）

`system/css/scripts/build.ts` 10 行: `const ORDER = ['layers', 'reset', 'base', 'patterns', 'utilities', 'print', 'forced-colors']`。
各 `src/<name>.css` を結合して `dist/index.css` と `dist/<name>.css` を出す。`system/css/package.json` の `exports` にファイルごとの行がある。
`system/css/test/build.test.ts` 15 行: `LAYER_ORDER = 'rd.reset, rd.tokens, rd.base, rd.components, rd.utilities, rd.overrides'`（レイヤーは増やさない）。

`system/css/package.json`: `peerDependencies: { "@rimltempest/riml-ds-tokens": "workspace:*" }` のみ。**`peerDependenciesMeta` が無い**ため、
npm 未公開の tokens を `file:` で取り込む利用側（qrcc2）で 404 になった。`"peerDependenciesMeta": { "@rimltempest/riml-ds-tokens": { "optional": true } }` を足す。

`system/tokens/src/semantic/typography.tokens.json` の葉: `type.body` / `type.heading.1` / `type.heading.2` / `type.small` / `type.mono` /
`type.link.underline-offset`。`type.heading.*` は `$extensions.riml-ds.fluid { min, preferred, max }` を持つ（`clamp()` に変換される）。
`system/tokens/src/base/typography.tokens.json`: `font.family.{sans,display,mono}`、`font.weight.{regular,bold}`、`line.height.{body,heading,heading-2,small}`。
**`letter.spacing.*` は無い。** dimension は `dimension.{1,2,3,4,6,8,12,16}`（→ `--rd-space-*`）。

`system/css/src/utilities.css`（`@layer rd.utilities`）: `.rd-visually-hidden`、`.rd-skip-link`、`.rd-stack`、`.rd-cluster`。**ここに足さない**（レーン外）。

`apps/storybook/stories/Foundations/brand.stories.ts` / `brand.css`: Foundations story の手本（`html` タグ関数、`parameters.a11y`、mode 切替は toolbar）。

`system/tokens/test/contrast.test.ts` 51 行: `foreground` の種類数 `toBe(15)`（色トークンだけ。文字トークンを足しても変わらない）。
`system/tokens/test/invariants.test.ts`: `$description` の無い葉が 0 であること等。**葉の総数を固定しているテストがあれば数を更新する。**

## 設計（決めてある。変えるなら STOP）

### トークン（`system/tokens`）

| 追加 | 値 | 用途 |
| --- | --- | --- |
| `letter.spacing.normal` | `0em` | 既定（明示用） |
| `letter.spacing.wide` | `0.12em` | キャプション・ラベル（参考画面の字間の広い小文字） |
| `line.height.display` | `1.1` | display |
| `type.display` | `fontFamily {font.family.display}`, `fontSize 2.5rem`, `fontWeight {font.weight.bold}`, `lineHeight {line.height.display}`、fluid `{ min: 2.5rem, preferred: 1.6rem + 3vw, max: 4rem }` | ヒーロー・数字 1 つの窓 |
| `type.heading.3` | display 系、`1.125rem`、bold、`{line.height.heading-2}`、fluid `{ min: 1.125rem, preferred: 1.05rem + 0.35vw, max: 1.375rem }` | 小節 |
| `type.heading.4` | display 系、`1rem`、bold、`{line.height.heading-2}`（fluid 無し） | 窓の中の見出し |
| `type.caption` | sans、`0.75rem`、regular、`{line.height.small}` | 補助文。`letter.spacing.wide` と組で使う（typography.css 側） |

`$description` 必須。`bun run build` → `tokens.css` に `--rd-type-display-*` / `--rd-type-heading-3-*` / `--rd-type-heading-4-*` / `--rd-type-caption-*` /
`--rd-letter-spacing-{normal,wide}` / `--rd-line-height-display` が出ること。`bun run design-md` で DESIGN.md を再生成してコミット。
`bun run lint:tokens` green。

### `system/css/src/typography.css`（`@layer rd.components`）

| クラス | 内容 |
| --- | --- |
| `.rd-display` | `font: var(--rd-type-display)`、`letter-spacing: -0.01em`、`text-wrap: balance`、`margin: 0` |
| `.rd-heading-1` … `.rd-heading-4` | `font: var(--rd-type-heading-N)`、`text-wrap: balance`、`margin: 0`。**見出しレベル（h1〜h6）とは独立**（クラスで見た目、要素で構造） |
| `.rd-body` | `font: var(--rd-type-body)`、`text-wrap: pretty` |
| `.rd-small` | `font: var(--rd-type-small)` |
| `.rd-caption` | `font: var(--rd-type-caption)`、`letter-spacing: var(--rd-letter-spacing-wide)`、`color: var(--rd-color-text-muted)`。**`text-transform: uppercase` は付けない**（日本語に効かない・利用側の選択） |
| `.rd-label` | `font: var(--rd-type-small)`、`font-weight: var(--rd-font-weight-bold)` |
| `.rd-mono` | `font: var(--rd-type-mono)`、`font-variant-numeric: tabular-nums` |
| `.rd-numeric` | `font-variant-numeric: tabular-nums`、`font-feature-settings` は書かない |
| `.rd-truncate` | 1 行省略（`overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-inline-size: 100%`） |
| `.rd-clamp` | `--rd-clamp-lines`（既定 3）で `display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: var(--rd-clamp-lines); overflow: hidden`（`line-clamp` は Baseline に無いので接頭辞版。stylelint が落とすなら `/* stylelint-disable-next-line */` に理由を書く） |
| `.rd-prose` | 流し込み本文の入れ物。`max-inline-size: var(--rd-sizing-measure-max)`、`> * + * { margin-block-start: var(--rd-space-4) }`、`h1..h4` に heading 1..4 の `font` と `text-wrap: balance`（`h2 + *` 等の詰めは `--rd-space-2`）、`p { text-wrap: pretty }`、`a { text-underline-offset: var(--rd-type-link-underline-offset) }`、`hr { border: 0; border-block-start: 2px dotted var(--rd-color-border-default) }`、`blockquote { padding-inline-start: var(--rd-space-4); border-inline-start: 2px dotted var(--rd-color-border-default) }`、`code { font: var(--rd-type-mono); padding-inline: var(--rd-space-1); border-radius: var(--rd-radius-sm); background: var(--rd-color-surface-sunken) }`、`pre { padding: var(--rd-space-4); border-radius: var(--rd-radius-md); background: var(--rd-color-surface-sunken); overflow-x: auto }`、`pre code { padding: 0; background: none }`、`ul, ol { padding-inline-start: var(--rd-space-6) }`、`li + li { margin-block-start: var(--rd-space-1) }`、`img, video { max-inline-size: 100%; border-radius: var(--rd-radius-md) }` |

`.rd-prose` の要素セレクタは **`:where()` で包んで詳細度を 0 に**する（`.rd-prose :where(h2)` の形。利用側のクラスが勝てる）。
色は `text.default` / `text.muted` / `accent.text` 以外を使わない。

### `system/css/src/atoms.css`（`@layer rd.components`）

各クラスの先頭に **想定マークアップをコメントで**書く（`patterns.css` の `.rd-window` と同じ流儀。CSS 版の「契約」）。

| クラス | マークアップ | 見た目 |
| --- | --- | --- |
| `.rd-badge` | `<span class="rd-badge" data-tone="success">3 件</span>` | インラインのピル。`display: inline-flex; align-items: center; min-block-size: var(--rd-space-6); padding-inline: var(--rd-space-2); border-radius: full; background: surface.sunken; color: text.default; font: type.small; font-weight: bold; white-space: nowrap`。`[data-tone='accent']` = accent.default + text.on-accent、`success` / `warning` / `danger` / `info` = `status.*.default` + `text.on-status`。**文字を載せるので brand.* は使わない** |
| `.rd-dot` | `<span class="rd-dot" aria-hidden="true"></span>`（通知の点。親に `.rd-has-dot`） | `0.625rem` の丸、`background: status.danger.default`、`outline: 2px solid var(--rd-color-surface-raised)`。`.rd-has-dot { position: relative }`、`.rd-dot { position: absolute; inset-block-start: 0; inset-inline-end: 0 }`。**件数や意味はテキストで別に出す**（コメントに書く） |
| `.rd-avatar` | `<span class="rd-avatar"><img alt="" src…></span>` / `<span class="rd-avatar" aria-hidden="true">RT</span>` | `--rd-avatar-size`（既定 `var(--rd-space-8)`）、`inline-size: var(--rd-avatar-size); aspect-ratio: 1; border-radius: full; overflow: hidden; display: inline-grid; place-items: center; background: surface.sunken; color: text.default; font: type.small; font-weight: bold`。`> img { inline-size: 100%; block-size: 100%; object-fit: cover }`。`.rd-avatar-group { display: inline-flex }` `.rd-avatar-group > * + * { margin-inline-start: calc(var(--rd-space-2) * -1) }` `.rd-avatar-group > * { outline: 2px solid var(--rd-color-surface-raised) }` |
| `.rd-separator` | `<hr class="rd-separator">` / `<div class="rd-separator" role="separator" aria-orientation="vertical"></div>` | 点線。`border: 0; border-block-start: 2px dotted var(--rd-color-border-default); margin-block: var(--rd-space-4)`。`[aria-orientation='vertical']` = `align-self: stretch; inline-size: 0; border-block-start: 0; border-inline-start: 2px dotted …; margin-block: 0; margin-inline: var(--rd-space-3)` |
| `.rd-skeleton` | `<div class="rd-skeleton" aria-hidden="true" style="--rd-skeleton-width: 12ch"></div>`（親に `aria-busy="true"`） | `display: block; inline-size: var(--rd-skeleton-width, 100%); min-block-size: 1em; border-radius: full; background: surface.sunken`。`[data-shape='circle']` = `aspect-ratio: 1; inline-size: var(--rd-skeleton-width, var(--rd-space-8))`、`[data-shape='block']` = `border-radius: md; min-block-size: var(--rd-space-16)`。動き: `@media (prefers-reduced-motion: no-preference)` の中で `animation: rd-skeleton-pulse 1.6s ease-in-out infinite alternate`（`@keyframes` は `opacity 1 → 0.55`。グラデの shimmer は使わない） |
| `.rd-kbd` | `<kbd class="rd-kbd">⌘</kbd>` | `font: type.mono; padding-inline: var(--rd-space-1); border-radius: sm; background: surface.sunken; border-block-end: 2px solid var(--rd-color-border-strong)`（キーキャップ） |
| `.rd-tile` | `<a class="rd-tile" href aria-label="…"><svg aria-hidden…></svg></a>` / `<span class="rd-tile">` | インクの角丸タイル。`--rd-tile-size`（既定 `var(--rd-space-12)`）、`display: inline-grid; place-items: center; inline-size: var(--rd-tile-size); aspect-ratio: 1; border-radius: md; background: chrome.default; color: chrome.text`。`> svg, > img { inline-size: 50%; block-size: 50% }`。`[data-tone='accent']` = accent.default + text.on-accent。`:is(a, button):hover, :focus-visible` = `outline: 2px solid var(--rd-color-focus-ring-color); outline-offset: 2px`（塗りは変えない） |
| `.rd-icon-button` | `<button type="button" class="rd-icon-button" aria-label="…"><svg…></svg></button>` | 正方形の当たり判定 `target-min`、`display: inline-grid; place-items: center; padding: 0; border: 0; border-radius: full; background: transparent; color: text.default`。hover `background: surface.hover`、`:active` `translate: 0 0.0625rem`（reduced-motion 内）、focus はリング（`--rd-focus-ring-*`）。**`aria-label` 必須**（コメント） |
| `.rd-toolbar` | `<div class="rd-toolbar" role="toolbar" aria-label="…">` + `.rd-icon-button` 群 | `display: flex; align-items: center; gap: var(--rd-space-1); padding: var(--rd-space-1) var(--rd-space-2); border-block-start: 2px dotted var(--rd-color-border-default)`。`[data-position='top']` は `border-block-start: 0; border-block-end: 2px dotted …` |
| `.rd-list` / `.rd-list-row` | `<ul class="rd-list"><li class="rd-list-row" aria-current="true"><span class="rd-avatar">…</span><span>名前</span><span class="rd-list-meta">3 分前</span></li>…</ul>` | `.rd-list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--rd-space-1) }`。`.rd-list-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; column-gap: var(--rd-space-3); min-block-size: target-min; padding-inline: var(--rd-space-3); border-radius: md }`。`.rd-list-row:is([aria-selected='true'], [aria-current]) { background: surface.sunken }`。`.rd-list-row:has(> a, > button):hover { background: surface.hover }`。`.rd-list-meta { font: type.small; color: text.muted; justify-self: end }`。行全体をリンクにするなら `> a` に `display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; color: inherit; text-decoration: none`（`subgrid` は Baseline 2023） |
| `.rd-table` | `<div class="rd-table-scroll"><table class="rd-table"><caption>…</caption><thead><tr><th scope="col">…` | `.rd-table-scroll { overflow-x: auto }`。`.rd-table { inline-size: 100%; border-collapse: collapse; font: type.body }`。`:where(th) { text-align: start; font-weight: bold; padding: var(--rd-space-2) var(--rd-space-3); border-block-end: 2px dotted var(--rd-color-border-default) }`。`:where(td) { padding: var(--rd-space-2) var(--rd-space-3); border-block-end: 1px dotted var(--rd-color-border-default) }`。`:where(caption) { text-align: start; font-weight: bold; padding-block: var(--rd-space-2) }`。`[data-numeric] { text-align: end; font-variant-numeric: tabular-nums }`。`.rd-table[data-sticky] thead th { position: sticky; inset-block-start: 0; background: surface.raised }` |
| `.rd-alert` | `<div class="rd-alert" data-tone="warning" role="status"><span class="rd-alert-icon" aria-hidden="true">…</span><div><p class="rd-alert-title">…</p><p>…</p></div></div>` | `display: grid; grid-template-columns: auto 1fr; column-gap: var(--rd-space-3); padding: var(--rd-space-3) var(--rd-space-4); border-radius: md; background: surface.sunken; color: text.default; border-inline-start: var(--rd-space-2) solid var(--rd-color-status-info-default)`（トーストと同じ左の帯、brand §7.7）。`[data-tone='success'|'warning'|'danger']` は帯の色と `.rd-alert-icon` の色を `status.*.default` / `status.*.text` に。`.rd-alert-title { font-weight: bold; margin: 0 }`。`.rd-alert-icon:empty { display: none }`（アイコン無しなら 1 列）。**role は利用側が付ける**（コメントに `status` / `alert` の使い分け） |
| `.rd-legend` | `<ul class="rd-legend"><li class="rd-legend-item" data-series="1">写真 12 GB</li>…</ul>` | `list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--rd-space-2) var(--rd-space-4); font: type.small`。`.rd-legend-item::before { content: ''; display: inline-block; inline-size: 0.75rem; aspect-ratio: 1; border-radius: full; margin-inline-end: var(--rd-space-1); vertical-align: -0.1em; background: var(--rd-legend-swatch) }`。`[data-series='1'..'4']` = `--rd-legend-swatch: brand.primary / status.success.default / status.warning.default / border.strong`（brand §7.5 の区分メーターと同じ順）。**色以外に文字**（コメント） |

`forced-colors: active`: 各ファイル末尾の `@media` ブロックで、点線は `CanvasText`、バッジ/タイルは `border: 1px solid CanvasText`、
選択行は `background: Highlight; color: HighlightText`、skeleton は `background: GrayText`、`.rd-dot` は `background: Highlight`。

`system/css/scripts/build.ts` の ORDER は `['layers', 'reset', 'base', 'typography', 'atoms', 'patterns', 'utilities', 'print', 'forced-colors']`
（typography → atoms → patterns の順。`patterns.css` が atoms を上書きできる）。`package.json` の `exports` に `./typography.css` と `./atoms.css`。
`system/css/README.md` にファイル一覧の 2 行と、クラス一覧（上の 2 表を要約）。

### Storybook

- `apps/storybook/stories/Foundations/typography.stories.ts`（title `Foundations/Typography`）: `Scale`（display → caption を実文で並べる。**サンプル文は自作の日本語と英語**）、
  `Prose`（`.rd-prose` に h2/p/ul/blockquote/code/pre/hr/table）、`Utilities`（truncate / clamp / numeric）、`Dark`、`RTL`、`ForcedColors`、`Dense`
- `apps/storybook/stories/Patterns/atoms.stories.ts`（title `Patterns/Atoms`）: パターンごとに 1 story（`Badge` / `Dot` / `Avatar` / `Separator` / `Skeleton` /
  `Kbd` / `Tile` / `IconButton` / `Toolbar` / `List` / `Table` / `Alert` / `Legend`）+ `Composition`（一覧 + ツールバー + 凡例 + アラートを 1 画面に。
  **窓（`.rd-window`）の中に入れない** — 017 が帯を変えている最中なので、`.rd-window` を使う合成は 017 マージ後の別 story に譲る）
  + `Dark` / `ForcedColors` / `RTL` / `ReducedMotion`（skeleton が止まる）。a11y の除外は 0（`aria-hidden` / `role` / `aria-label` を正しく書けば要らない）
- SVG アイコンは story の中で **自作の幾何（丸・線・四角）** だけ。絵を描かない

### ガイドライン

`system/guidelines/typography.md`: 見出しの階層（要素で構造、クラスで見た目）、`display` の使いどころ（1 画面に 1 つ）、caption は色だけに頼らない、
`text-wrap: balance / pretty` の使い分け、日本語の `letter-spacing` の注意（`wide` は欧数字・かなの短い語向け、本文には使わない）、`measure-max`。
`writing.md` / `accessibility.md` の書き方に合わせる（見出し・表・「やらないこと」節）。`docs/agent-integration.md` の guidelines 一覧に 1 行。
`tools/mcp/test` に resource 数の固定があれば +1。

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

```bash
RIML_DS_BASE_REF=main bash scripts/wt.sh new feat/typography-atoms   # advisor が済ませていれば skip
bun install --frozen-lockfile && bun run build && bun run gen && bun run test
```

### Step 1 — トークン（`feat(tokens): add display / heading 3-4 / caption / letter-spacing`）

red: `system/tokens/test/`（既存の葉テストの形で）`type.display` `type.heading.3` `type.heading.4` `type.caption` `letter.spacing.wide` `line.height.display` が
`tokens.json` に在り、`tokens.css` に `--rd-type-display-font-size` が `clamp(` を含む、を書く → fail。
green: JSON を足し `bun run build` → `bun run lint:tokens` → `bun run design-md` → `bun run test`（tokens / design-md / mcp の数え上げテストを更新）。

### Step 2 — `typography.css`（`feat(css): add typography classes`）

red: `system/css/test/typography.test.ts` — dist に `.rd-display` … `.rd-prose` の各セレクタが在る、`.rd-caption` に `letter-spacing: var(--rd-letter-spacing-wide)`、
`.rd-prose` の要素セレクタが `:where(` で包まれている、`uppercase` を含まない、`build.test.ts` の ORDER / exports の検査を更新 → fail。
green: ファイル作成、`build.ts` ORDER、`package.json` exports + `peerDependenciesMeta`、README。`bun run check`。

### Step 3 — `atoms.css`（`feat(css): add atoms (badge, avatar, separator, skeleton, kbd, tile, toolbar, list, table, alert, legend)`）

red: `system/css/test/atoms.test.ts` — 各クラスが在る、`@keyframes rd-skeleton-pulse` が `prefers-reduced-motion: no-preference` の中にだけ在る、
`background-image: linear-gradient` を含まない、`--rd-color-palette-` を含まない、`forced-colors` ブロックに `Highlight` が在る → fail。
green: ファイル作成。`bun run check`（stylelint）。

### Step 4 — Storybook + VRT + a11y（`feat(storybook): add Foundations/Typography and Patterns/Atoms` / `test(vrt): baselines for typography and atoms`）

```bash
bun run storybook:build
bash scripts/vrt.sh --update-snapshots --grep 'Typography|Atoms'
bash scripts/vrt.sh
bun run a11y
```

新規 story の画像だけが増えること（既存の画像に差分が出たら原因を調べる。`typography.css` が `h1..h4` を**素の要素セレクタで**塗っていないか）。

### Step 5 — ガイドライン（`docs(guidelines): add typography`）

上記。`bun run build`（mcp が guidelines を同梱）→ `tools/mcp/test` green。

### Step 6 — 仕上げ

```bash
bun run check && bun run test && bun run release:check
bash scripts/guard.sh
git diff --name-only main...HEAD
```

changeset（minor、`@rimltempest/riml-ds-tokens` / `@rimltempest/riml-ds-css`）。

## 完了条件（機械で検査できるもの）

- `bun run build` 後 `grep -c 'rd-type-display\|rd-type-heading-3\|rd-type-heading-4\|rd-type-caption\|rd-letter-spacing-wide' system/tokens/dist/tokens.css` ≥ 5
- `bun run lint:tokens` exit 0、`bun run design-md` で DESIGN.md が更新されコミット済み（`git status` clean）
- `system/css/dist/index.css` に `.rd-display` `.rd-prose` `.rd-badge` `.rd-avatar` `.rd-separator` `.rd-skeleton` `.rd-kbd` `.rd-tile` `.rd-icon-button` `.rd-toolbar` `.rd-list-row` `.rd-table` `.rd-alert` `.rd-legend-item` がすべて在る
- `grep -c 'linear-gradient\|radial-gradient\|filter:' system/css/src/typography.css system/css/src/atoms.css` = 0
- `system/css/package.json` に `./typography.css` / `./atoms.css` の exports と `peerDependenciesMeta`
- `bun run test` 全 green（新規 tokens / css テスト含む）、`bun run a11y` 全 green 除外 0、`bash scripts/vrt.sh` 全 green
- `bun run release:check` exit 0（publint が新 exports を通す）
- `system/guidelines/typography.md` が在り、MCP の `riml-ds://guidelines/typography` が返る（`tools/mcp/test`）
- `bash scripts/guard.sh` exit 0、`git diff --name-only main...HEAD` がレーン内

## STOP する条件

- 新トークンが AAA lint に落ちる（文字トークンでは起きないはず。起きたら値でなく lint 側の想定外 → 報告）
- `line-clamp` の接頭辞や `subgrid` が stylelint / markuplint に落とされ、設定変更が要る → **設定は触らず**その項目を省いて報告
- `utilities.css` / `base.css` を変えないと成立しない指定がある → 報告（例: `base.css` が `h1..h4` に `font` を当てていて `.rd-prose` と競合）
- Storybook の a11y で `color-contrast-enhanced` が落ちる → 使ったトークンの組を報告（値は変えない）

## スコープ外

- `.rd-window` の帯・丸（017）、部品（019 / 020）、`rd-toast` / `rd-dialog`
- Web フォントの同梱、`font.family.*` の変更
- qrcc2 / noter への適用（後続 plan）

## 保守メモ

- `typography.css` は **クラスだけ**を出し、素の `h1..h6` には触らない（`base.css` の責務）。`.rd-prose` の中だけ `:where()` で要素に当てる
- `atoms.css` のクラスは「CSS 版の部品」。CEM には出ないので、**MCP / skills から見えるのは README とガイドラインだけ**。
  後続で `tools/cem/registry.json` に `kind: 'css'` のエントリを足す案がある（008 の `suggest_component` が CSS パターンも候補に出せる）
- `data-series` の色順は `rd-meter` の区分と同じ（brand §7.5）。片方を変えたら両方
