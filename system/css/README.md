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

| ファイル            | レイヤー        | 中身                                                                                         |
| ------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| `layers.css`        | （宣言のみ）    | `@layer rd.reset, rd.tokens, rd.base, rd.components, rd.utilities, rd.overrides;`            |
| `reset.css`         | `rd.reset`      | `box-sizing`、`margin: 0`、メディア要素、フォームの `font: inherit`                          |
| `base.css`          | `rd.base`       | `body`・見出し・行長・`hr`（点線）・リンク・`:focus-visible`・等幅                           |
| `typography.css`    | `rd.components` | 文字のクラス（`.rd-display` … `.rd-prose`）                                                  |
| `atoms.css`         | `rd.components` | JS が要らない小さなパターン（`.rd-badge` … `.rd-scroll-area`）                               |
| `patterns.css`      | `rd.components` | 窓（`.rd-window` / `.rd-window-title` / `.rd-window-body`）                                  |
| `utilities.css`     | `rd.utilities`  | `.rd-visually-hidden`、`.rd-skip-link`、`.rd-stack`、`.rd-cluster`、`.rd-aspect`、`[hidden]` |
| `print.css`         | `rd.base`       | `@media print`（リンク先の URL、ナビを消す、システム色）                                     |
| `forced-colors.css` | `rd.base`       | `@media (forced-colors: active)`（リンク・フォーカス・ボタンの境界）                         |

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

## 小さなパターン（`atoms.css`）

JS が要らないもの（バッジ・アバター・区切り・表・注意書き…）は部品にせず CSS のクラスで出す
（[ADR-0012](../../docs/adr/0012-progressive-enhancement-tiers.md) §6）。**想定マークアップは
`src/atoms.css` の各クラスの直前のコメントが持つ**（読み上げに要る `aria-label` / `aria-hidden` /
`role` / `scope` もそこに書いてある）。色だけで意味を伝えるクラスは 1 つも無い。

| クラス                                             | 使うところ                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `.rd-badge`                                        | 数や状態のピル。`data-tone="accent \| success \| warning \| danger \| info"`          |
| `.rd-dot` / `.rd-has-dot`                          | 通知の点。件数と意味は文字で別に出す                                                  |
| `.rd-avatar` / `.rd-avatar-group`                  | 丸いアバターと重ね並べ。大きさは `--rd-avatar-size`                                   |
| `.rd-separator`                                    | 点線の区切り。`aria-orientation="vertical"` で縦線                                    |
| `.rd-skeleton`                                     | 読み込み中の骨組み。幅は `--rd-skeleton-width`、`data-shape="circle \| block"`        |
| `.rd-kbd`                                          | キーキャップ                                                                          |
| `.rd-tile`                                         | インクの角丸タイル。大きさは `--rd-tile-size`、`data-tone="accent"`                   |
| `.rd-icon-button`                                  | アイコンだけのボタン（44px の当たり判定）。`aria-label` 必須                          |
| `.rd-toolbar`                                      | 押せるものを並べる帯。`data-position="top"` で罫線が上下入れ替わる                    |
| `.rd-list` / `.rd-list-row` / `.rd-list-meta`      | 一覧。選択は `aria-current` / `aria-selected` が持つ                                  |
| `.rd-table` / `.rd-table-scroll`                   | 表と横スクロールの入れ物。`data-numeric` で桁揃え、`data-sticky` で見出し固定         |
| `.rd-alert` / `.rd-alert-title` / `.rd-alert-icon` | 注意書き。`data-tone` で左の帯の色。`role` は利用側が付ける                           |
| `.rd-legend` / `.rd-legend-item`                   | 区分メーターの凡例。`data-series="1".."4"` の色は `rd-meter` と同じ順                 |
| `.rd-card` ほか 4 つ                               | 面のカード（`-media` / `-body` / `-title` / `-footer`）。`.rd-card-link` で全面リンク |
| `.rd-empty` ほか 3 つ                              | 空の知らせ（`-icon` / `-title` / `-actions`）。次の行動を必ず置く                     |
| `.rd-spinner`                                      | 罫線で描く待ちの輪。大きさは `--rd-spinner-size`。文言は利用側が書く                  |
| `.rd-accordion`                                    | `rd-disclosure` を積む入れ物。排他は `<details name>` が持つ                          |
| `.rd-carousel` ほか 2 つ                           | scroll snap の横帯（`-track` / `-item`）。1 枚の幅は `--rd-carousel-item`             |
| `.rd-scroll-area`                                  | 転がる入れ物。高さは `--rd-scroll-area-max`、`data-axis="x"` で横だけ                 |

```html
<div class="rd-alert" data-tone="warning" role="status">
  <span class="rd-alert-icon" aria-hidden="true"></span>
  <div>
    <p class="rd-alert-title">保存できません</p>
    <p>接続を確かめてください。</p>
  </div>
</div>
```

つまみ（`--rd-avatar-size` / `--rd-tile-size` / `--rd-skeleton-width` / `--rd-legend-swatch` /
`--rd-clamp-lines` / `--rd-spinner-size` / `--rd-carousel-item` / `--rd-scroll-area-max`）は
**トークンではない**。`tokens.css` に定義は無く、利用側が
`style="--rd-skeleton-width: 12ch"` のように渡す。

`prefers-reduced-motion: no-preference` の中でだけ `.rd-skeleton` が明滅し、`.rd-spinner` が
回り、`.rd-carousel` / `.rd-scroll-area` が滑らかに転がり、`.rd-icon-button` が押し込まれる。
`forced-colors: active` では面に輪郭が付き、選択行が `Highlight` になり、細いスクロールバーの
色指定（`scrollbar-color`）は `auto` に戻る。

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

`.rd-aspect` は比を固定した入れ物で、中の `img` / `video` / `iframe` を切り抜いて埋める。
比は `--rd-aspect`（既定 `16 / 9`）。`data-ratio="1"` と `data-ratio="4-3"` だけ用意してあり、
それ以外は `style="--rd-aspect: 21 / 9"` のように渡す。

```html
<div class="rd-aspect" data-ratio="1"><img src="cover.avif" alt="" /></div>
```

ユーティリティはこの 6 つで打ち止め。ユーティリティ CSS フレームワークにしない。

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
