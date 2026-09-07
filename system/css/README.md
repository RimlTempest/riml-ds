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

個別に読むなら `layers.css` → `tokens.css` → `reset.css` → `base.css` → `utilities.css` →
`print.css` → `forced-colors.css` の順。バンドラを持つ利用側はこちらでよい（`index.css` を
結合で作っているのは HTTP リクエスト数のため）。

## ファイル

| ファイル            | レイヤー       | 中身                                                                              |
| ------------------- | -------------- | --------------------------------------------------------------------------------- |
| `layers.css`        | （宣言のみ）   | `@layer rd.reset, rd.tokens, rd.base, rd.components, rd.utilities, rd.overrides;` |
| `reset.css`         | `rd.reset`     | `box-sizing`、`margin: 0`、メディア要素、フォームの `font: inherit`               |
| `base.css`          | `rd.base`      | `body`・見出し・行長・リンク・`:focus-visible`・等幅                              |
| `utilities.css`     | `rd.utilities` | `.rd-visually-hidden`、`.rd-skip-link`、`.rd-stack`、`.rd-cluster`、`[hidden]`    |
| `print.css`         | `rd.base`      | `@media print`（リンク先の URL、ナビを消す、システム色）                          |
| `forced-colors.css` | `rd.base`      | `@media (forced-colors: active)`（リンク・フォーカス・ボタンの境界）              |

ダークと高コントラストと密度はここに書かない（トークンが `light-dark()` と
`prefers-contrast` / `[data-density]` で持つ）。

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
