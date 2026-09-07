# `@rimltempest/riml-ds-css`

riml-ds の基盤 CSS。`@layer` の順序宣言・リセット・ベース・ユーティリティ・印刷・強制配色。
プレーン CSS で、前処理は無い（配るのは書いたままの `.css`）。規約は
[ADR-0004](../../docs/adr/0004-plain-css-layers-baseline.md) と
[`.claude/skills/riml-ds-css/SKILL.md`](../../.claude/skills/riml-ds-css/SKILL.md) にある
（ここでは繰り返さない）。

## 入れる

```bash
bun add @rimltempest/riml-ds-css @rimltempest/riml-ds-tokens
```

読み込み順（`skills/riml-ds/SKILL.md` §1 と同じ）：

```css
@import '@rimltempest/riml-ds-css/layers.css'; /* @layer の順序宣言。必ず最初 */
@import '@rimltempest/riml-ds-tokens/tokens.css'; /* --rd-*（light-dark 込み） */
@import '@rimltempest/riml-ds-css'; /* reset + base + utilities + print + forced-colors */
/* ブランドテーマがあれば */
@import '@rimltempest/riml-ds-tokens/themes/qrcc.css';
```

**`index.css` に `tokens.css` は入っていない。** テーマの差し替えをトークン側で完結させるため、
変数の供給は `@rimltempest/riml-ds-tokens` の責務にしてある。`index.css` の先頭には
`layers.css` が入っているので、1 行目の `layers.css` を省いて `index.css` だけにしてもよい
（トークンより先に読む場合に限る）。

個別に読むなら `layers.css` → `tokens.css` → `reset.css` → `base.css` → `typography.css` →
`atoms.css` → `patterns.css` → `print.css` → `forced-colors.css` の順。バンドラを持つ利用側はこちらでよい（`index.css` を
結合で作っているのは HTTP リクエスト数のため）。

`@rimltempest/riml-ds-tokens` は `peerDependenciesMeta` で optional にしてある。npm に出ていない
tokens を `file:` / `workspace:` で取り込む利用側が 404 で止まらないようにするためで、
**変数の供給が要らなくなるわけではない**（読み込まないと色も寸法も出ない）。

## ファイル

| ファイル            | レイヤー        | 中身                                                                              |
| ------------------- | --------------- | --------------------------------------------------------------------------------- |
| `layers.css`        | （宣言のみ）    | `@layer rd.reset, rd.tokens, rd.base, rd.components, rd.utilities, rd.overrides;` |
| `reset.css`         | `rd.reset`      | `box-sizing`、`margin: 0`、メディア要素、フォームの `font: inherit`               |
| `base.css`          | `rd.base`       | `body`・見出し・行長・`hr`（点線）・リンク・`:focus-visible`・等幅                |
| `typography.css`    | `rd.components` | 文字のクラス（`.rd-display` … `.rd-prose`）                                       |
| `patterns.css`      | `rd.components` | 窓（`.rd-window` / `.rd-window-title` / `.rd-window-body`）                       |
| `utilities.css`     | `rd.utilities`  | `.rd-visually-hidden`、`.rd-skip-link`、`.rd-stack`、`.rd-cluster`、`[hidden]`    |
| `print.css`         | `rd.base`       | `@media print`（リンク先の URL、ナビを消す、システム色）                          |
| `forced-colors.css` | `rd.base`       | `@media (forced-colors: active)`（リンク・フォーカス・ボタンの境界）              |

ダークと高コントラストと密度はここに書かない（トークンが `light-dark()` と
`prefers-contrast` / `[data-density]` で持つ）。

## 文字（`typography.css`）

見た目のクラスで、**見出しレベルとは独立**。構造は要素（`h1`..`h6`）が、大きさはクラスが決める。
素の `h1`..`h6` は `base.css` が持ち、ここでは触らない。判断は
[`system/guidelines/typography.md`](../guidelines/typography.md)。

| クラス                            | 使うところ                                                             |
| --------------------------------- | ---------------------------------------------------------------------- |
| `.rd-display`                     | ヒーローと数字 1 つの窓。1 画面に 1 つ                                 |
| `.rd-heading-1` … `.rd-heading-4` | 見出しの大きさ（`<h2 class="rd-heading-3">` のように選ぶ）             |
| `.rd-body` / `.rd-small`          | 本文と補助テキスト                                                     |
| `.rd-caption`                     | 補助文。`letter.spacing.wide` の広い字間と `text.muted`                |
| `.rd-label`                       | 太字の小さいラベル                                                     |
| `.rd-mono` / `.rd-numeric`        | 等幅・桁揃え（`tabular-nums`）                                         |
| `.rd-truncate` / `.rd-clamp`      | 1 行省略・行数省略（行数は `--rd-clamp-lines`、既定 3）                |
| `.rd-prose`                       | 流し込み本文の入れ物。中の要素は `:where()` なので利用側のクラスが勝つ |

```html
<article class="rd-prose">
  <h1 class="rd-display">まど</h1>
  <p class="rd-caption">2026-09-08</p>
  <p>本文。<code>--rd-*</code> だけで組んである。</p>
</article>
```

## 窓（`.rd-window`）

視覚言語「まど」の骨格（[docs/brand.md](../../docs/brand.md) §7.1）。帯・丸 3 つ・硬い影は CSS だけで描く。
JS が要らないので部品にしない（[ADR-0012](../../docs/adr/0012-progressive-enhancement-tiers.md) §6）。

```html
<section class="rd-window">
  <h2 class="rd-window-title"><span>設定</span></h2>
  <div class="rd-window-body">…</div>
</section>
```

帯は**見出し要素そのもの**（文書構造と見た目が一致する）。左端の丸 3 つは `::before` の
`radial-gradient` なので DOM に無く、読み上げられず、押せない。帯の色は
`data-tone="accent" | "warning" | "danger"` で変わり、文字色は対応する `on-*` が付く。
タイトルを 1 行で切りたいときは `<span>` などの要素で包む（素のテキストは匿名グリッド項目になり
`text-overflow` が効かない）。`forced-colors: active` では帯が `Canvas` / `CanvasText` の
1px 罫線に置き換わり、丸は消える。

## ユーティリティ

```html
<a class="rd-skip-link" href="#main">本文へ</a>
<h1>見出し <span class="rd-visually-hidden">（詳細）</span></h1>
```

`.rd-skip-link` は `<body>` 直下に置く。フォーカスされるまでは隠れる。スキップリンクを部品に
しないのは、JS 無しで動くのが `<a href="#main">` そのものだから（[ADR-0012](../../docs/adr/0012-progressive-enhancement-tiers.md) §6）。

ユーティリティはこの 5 つで打ち止め。ユーティリティ CSS フレームワークにしない。

## 上書き

`rd.overrides` は**空**にしてある。利用側はここに書くか、`layers.css` の後に自分のレイヤーを
宣言する（後に宣言したレイヤーが必ず勝つ。詳細度で殴らない）。

```css
@layer rd.overrides {
  .rd-skip-link {
    background: var(--rd-color-surface-raised);
  }
}
```

```css
@layer app {
  /* rd.overrides より後に宣言されるので必ず勝つ */
}
```

## 直す

`src/*.css` が正。`dist/` は `bun run build`（`scripts/build.ts`）が作る生成物なので編集しない。
`bun run lint:css` が生値・物理プロパティ・裸のモーション・Baseline Newly の裸使いを落とす。
