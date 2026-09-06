# 0004: プレーン CSS + `@layer` + Baseline、生値は lint で落とす

- 状態: Accepted
- 日付: 2026-09-07
- 関連: ADR-0003, ADR-0006, [baseline.md](../baseline.md), [responsive-and-motion.md](../responsive-and-motion.md)

## 文脈

qrcc / noter はプレーン CSS + 独自トークン（ADR: qrcc 0006 相当）。Tailwind・CSS-in-JS・
Sass は使っていない。2026 年の Baseline Widely には `@layer`、ネスト、`@container`（size）、
`:has()`、`oklch`、`color-mix()`、`subgrid`、`light-dark()`（2024-05 Newly → 現在 Widely 相当）、
`adoptedStyleSheets`、Declarative Shadow DOM が入っている。`@scope`、`@property`、
`@starting-style`、`field-sizing`、anchor positioning、`text-box-trim`、`:state()` は Newly。

## 決定

1. **CSS はプレーン。前処理なし。** Lit の `css\`\`` タグと `.css` ファイルの 2 形態だけ。
2. **カスケードレイヤーを固定順で宣言する**（`@rimltempest/riml-ds-css/layers.css`）：
   ```css
   @layer rd.reset, rd.tokens, rd.base, rd.components, rd.utilities, rd.overrides;
   ```
   利用側は `rd.overrides` より後に自分のレイヤーを置けば必ず勝つ。詳細度で殴らない。
3. **Baseline Widely の機能は無条件に使う。Newly は `@supports` で囲み、無い場合の見た目を決める。
   Wait（Baseline 外）は使わない。** 判断表は [baseline.md](../baseline.md)。
   `browserslist` は `baseline widely available`。
4. **生値を禁止する。** 色・寸法（余白/サイズ/radius/border）・時間・フォントサイズ・
   z-index・影は `--rd-*` トークン経由のみ。`stylelint-declaration-strict-value` で落とす。
   例外は `0`、`1px`（罫線の最小幅）、`100%` / `auto` / `inherit` 系のキーワード、
   `currentColor`、`transparent`。
5. **論理プロパティのみ**（`margin-inline-start`、`inset-block`）。物理プロパティは stylelint の
   `property-disallowed-list` で落とす（`top/right/bottom/left/width/height` は例外リストで許す）。
6. **単位**：長さは `rem`。`px` は `1px` の罫線と `@media` の幅だけ。
   フォントサイズは Utopia 型の `clamp()` をトークンとして持つ。
7. **色はトークン、色相操作は `color-mix()`**。`oklch()` を部品 CSS に直接書かない。
8. **モーション**は `prefers-reduced-motion: no-preference` の中だけで有効。既定は動かない。
9. **`forced-colors: active`** では枠線を `CanvasText` などのシステム色で描き直す。

## 理由

- ビルドを挟まないので、利用側のどのバンドラでも同じ CSS が届く。デバッグでソースマップの
  往復もない。
- `@layer` により、Shadow DOM の外（`@rimltempest/riml-ds-css`）と中（部品）で優先順位を宣言的に揃えられる。
- 生値禁止は「トークンを守らせる唯一の実効手段」。レビューで見つけるのは不可能で、
  ここを lint に任せるとエージェントの出力も自動で矯正される。
- Baseline を線引きにすると、「動くか」を個別に調べる時間が消える。MDN のバッジという
  第三者の判断を借りる。

## 捨てた選択肢

- **Tailwind** — 利用側のビルドに依存し、Shadow DOM の中で使えない。トークン出力としてのみ提供。
- **CSS-in-JS（Emotion / vanilla-extract）** — WC の `adoptedStyleSheets` と相性が悪く、
  React 以外で使えない。
- **Sass / PostCSS** — ネスト・変数・`color-mix()` が標準にあるので不要。
- **物理プロパティ許容** — RTL で壊れる。最初から論理で書けば移行コストはゼロ。
- **`@scope` を使った部品スコープ** — Newly（2026-03）。Shadow DOM があるので不要。

## 影響

- `tools/lint/stylelint.config.js` が唯一の stylelint 設定。`.css` と `*.styles.ts`（`postcss-lit`
  でタグ内を抽出）の両方を対象にする。
- 生値の例外を増やすときは `stylelint.config.js` の `ignoreValues` に**理由のコメント付き**で足す。
- `docs/baseline.md` の表は四半期ごとに見直す（`plans/` の保守計画）。Newly → Widely に上がった
  ものは `@supports` を外してよい。
