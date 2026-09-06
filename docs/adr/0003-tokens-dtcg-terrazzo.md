# 0003: トークンは DTCG 2025.10、ビルドは Terrazzo、Figma は持たない

- 状態: Accepted
- 日付: 2026-09-07
- 関連: ADR-0001, ADR-0004, ADR-0008, [tokens.md](../tokens.md)

## 文脈

W3C Design Tokens Community Group の Format Module は 2025-10 に初の Stable 版になった
（Color Module / Resolver Module も同時）。`$type` に color（`colorSpace` / `components` /
`alpha` / `hex`）、dimension（`value` / `unit`）、typography 等の複合型、`{alias}` 参照、
`$deprecated`、`$extensions` がある。拡張子は `.tokens.json`。

ビルドツールは Terrazzo（DTCG ネイティブ、`terrazzo check` に lint がある：命名・重複・説明必須・
**WCAG2 コントラスト**・最小フォントサイズ）と Style Dictionary v4/v5（変換器が多いが DTCG は
後付け）。theo はアーカイブ。

ユーザー決定：**Figma は持たない。コードが唯一の正。**

## 決定

1. トークンのソースは **`system/tokens/src/**/*.tokens.json`（DTCG 2025.10）だけ**。
   TypeScript や CSS で「トークンを定義」しない。生成物（`tokens.css` / `tokens.ts` /
   `tokens.json` / `tokens.md`）は手で編集しない。
2. ビルドと lint は **Terrazzo**。`terrazzo check` を pre-commit と CI に置く。
   lint は `core/consistent-naming`（kebab-case）、`core/duplicate-values`、`core/descriptions`
   （全トークンに `$description` 必須）、`a11y/min-contrast`（**AAA**、text/background の対で 7:1）、
   `a11y/min-font-size` を有効化。
3. 階層は **base → semantic → component**。部品は semantic だけを参照し、base を直接参照しない。
4. **モードは差分ファイル。** `modes/dark.tokens.json` は変わる semantic だけを上書きする。
   CSS 出力ではライトとダークを **1 つの `light-dark()`** に畳み、`prefers-contrast: more` と
   `[data-density]` は `@media` / 属性セレクタの上書きにする。
5. **ブランドテーマ**（qrcc / noter …）は `themes/<brand>/*.tokens.json` として semantic の差分
   だけを持つ。生成物は `@rimltempest/riml-ds-tokens/themes/<brand>.css`。
6. 色は **oklch** で書く（`colorSpace: "oklch"`）。出力時に `hex` フォールバックを併記する。

## 理由

- 標準形式なら、Terrazzo が消えても Style Dictionary へ移れる。Figma 連携（Tokens Studio 等）
  も DTCG 入力を受ける。**形式に賭けて、ツールに賭けない。**
- `terrazzo check` の AAA lint は「色を変えたら CI で落ちる」を **PR ごとに** 保証する。
  axe による検査は描画後にしか分からず、部品の網羅にも限界がある。
- 差分ファイルにすると「ダークで何が変わるか」が diff で読める。全量コピーは同期が壊れる。
- `light-dark()` は Baseline Widely。1 宣言に畳むと CSS 変数の数が半分になり、
  切り替えは `color-scheme` を書き換えるだけ（JS 不要、`<meta name="color-scheme">` で SSR も同じ）。
- oklch は知覚的に均一。「同じ明度で色相だけ変える」がそのまま書ける。

## 捨てた選択肢

- **Style Dictionary** — DTCG 対応が後付けで、AAA lint を自作する必要。
- **Figma を正にする** — ユーザー決定。一人運用で二重管理は破綻する。
- **CSS 変数を直接ソースにする** — 型が無く、エージェントが値の意味を読めない。DESIGN.md も
  MCP も作れない。
- **Tailwind の `theme` を正にする** — 利用側のスタックを縛る。Tailwind 出力は Terrazzo の
  プラグインで**生成側**として提供するだけ。
- **ライト/ダークを別ファイルの `:root` 上書きで出す** — 変数が 2 倍、`@media` と `[data-theme]`
  の二重保守。

## 影響

- `system/tokens/terrazzo.config.ts` が唯一の設定。出力先は `dist/`。
- 命名：`<category>.<role>.<variant>`（例 `color.text.default`、`space.4`、`radius.md`）。
  CSS 変数は `--rd-color-text-default`。
- `$description` は日本語で書いてよいが、**用途**を書く（「主要な本文色」）。値の言い直しは不可。
- 部品 CSS が base トークン（`color.palette.*`）を参照したら stylelint で落とす（ADR-0004）。
- コントラスト AAA を満たせない色は**入れない**。装飾用（非テキスト）は `$extensions["riml-ds"].nonText: true`
  を付け、lint 対象から外す（3:1 は別途 e2e の axe で確認）。
