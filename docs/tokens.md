# トークン

正は `system/tokens/src/**/*.tokens.json`（DTCG 2025.10）。ビルドは Terrazzo（ADR-0003）。

## ディレクトリ

```
system/tokens/
  src/
    base/
      color.tokens.json        原色スケール（oklch）。公開 API ではない
      dimension.tokens.json    4px スケール、radius、border、sizing
      typography.tokens.json   フォント族・サイズ（clamp）・太さ・行間
      motion.tokens.json       duration / easing
      layer.tokens.json        z-index
    semantic/
      color.tokens.json        color.surface.* / color.text.* / color.border.* / color.accent.* / color.status.*
      space.tokens.json        space.inset.* / space.stack.* / space.inline.*
      typography.tokens.json   type.body / type.heading.1 … / type.small / type.mono
      shape.tokens.json        radius.* / border.*
      focus.tokens.json        focus.ring.width / offset / color
      elevation.tokens.json    shadow.raised / shadow.overlay / layer.*
    modes/
      dark.tokens.json         semantic の色だけ上書き
      high-contrast.tokens.json
      compact.tokens.json      space / sizing を 0.75 倍
    themes/
      qrcc/color.tokens.json   ブランド差分（移行用）。color.palette.* だけを上書きする
      noter/color.tokens.json
    component/                 必要になった部品だけ（例: button.tokens.json）
  terrazzo.config.ts
  dist/                        生成物（.gitignore）
```

## 書き方

```json
{
  "color": {
    "text": {
      "default": {
        "$type": "color",
        "$value": "{color.palette.neutral.800}",
        "$description": "本文の既定色。surface.default に対して 7:1 以上"
      },
      "muted": {
        "$type": "color",
        "$value": "{color.palette.neutral.600}",
        "$description": "補助テキスト。surface.default に対して 7:1 以上を保つ",
        "$extensions": { "riml-ds": { "contrastAgainst": "color.surface.default" } }
      }
    }
  }
}
```

- 色は `{ "colorSpace": "oklch", "components": [0.25, 0.02, 200], "hex": "#..." }` の形。
  `hex` は Terrazzo が補完する（手書き不要）。
- 寸法は `{ "value": 1, "unit": "rem" }`。`px` は `1px` の罫線と focus ring だけ。
- `$description` は**用途**を書く。必須（`core/descriptions`）。
- `$extensions["riml-ds"]`：
  - `contrastAgainst`: コントラスト検査の相手（`a11y/min-contrast` に渡す対）
  - `nonText: true`: 非テキスト（3:1 で検査、AAA 7:1 から除外）
  - `status`: `experimental` | `stable` | `deprecated`
- `$deprecated: "代替は color.text.subtle。v3 で削除"` の形で書く。

## 命名

`<category>.<role>.<variant>`。CSS 変数は `--rd-` + `.` → `-`。

| DTCG                        | CSS                              | TS（`tokens.ts`）              |
| --------------------------- | -------------------------------- | ------------------------------ |
| `color.text.default`        | `--rd-color-text-default`        | `tokens.color.text.default`    |
| `space.4`                   | `--rd-space-4`                   | `tokens.space[4]`              |
| `type.heading.1.fontSize`   | `--rd-type-heading-1-font-size`  | `tokens.type.heading[1].fontSize` |

`tokens.ts` は**値ではなく変数参照**（`"var(--rd-color-text-default)"`）を配る。値をコピーすると
モードの切替に追従しない。値が要る稀な用途（canvas 描画）は `tokens.json` を読む。

## 出力

| ファイル      | 中身                                                                       | 消費者                    |
| ------------- | -------------------------------------------------------------------------- | ------------------------- |
| `tokens.css`  | `@layer rd.tokens { :root { color-scheme: light dark; --rd-…: light-dark(…, …) } }` + `@media (prefers-contrast: more)` + `[data-density="compact"]` | すべて |
| `themes/<brand>.css` | palette の上書きだけ（light / dark を `light-dark()` に畳む）      | 移行中のアプリ            |
| `tokens.ts`   | `as const` のリテラル型                                                    | TS 利用側、部品           |
| `tokens.json` | 解決済み DTCG（alias 展開、モードごとの値を `$extensions.riml-ds.modes` に）| DESIGN.md 生成、MCP       |
| `tokens.md`   | 表                                                                         | Storybook Docs            |

### ライト/ダーク

```css
--rd-color-surface-default: light-dark(var(--rd-color-palette-neutral-0), var(--rd-color-palette-neutral-900));
```

切替は `color-scheme`。強制する場合は `<html style="color-scheme: dark">` か
`<meta name="color-scheme" content="dark">`。JS のトグルは `document.documentElement.style.colorScheme`
を書くだけ。`[data-theme]` は使わない。

### テーマ（ブランド）× スキーム

`riml-ds.resolver.json` の解決順は base → semantic → **theme → scheme** → contrast → density。
テーマは `color.palette.*` **だけ**を上書きする（invariants テストが固定する）。semantic は `{color.palette.…}` の
alias なので、palette を差し替えればライトもダークも高コントラストも追随し、テーマ側で 4 モード分の色を
書く必要が無い。`themes/<brand>.css` は light / dark の 2 permutation を畳んだ差分（`light-dark()`）で、
基準（riml-ds 既定）と同じ値は出さない。

新しいブランドを足す手順: `src/themes/<brand>/color.tokens.json` に palette の差分を書く →
`terrazzo.config.ts` の permutation に `{ theme, scheme }` の 2 行を足す → `scripts/postbuild.ts` の
`modes` に `theme-<brand>` / `theme-<brand>-dark` を足す → `test/tokens-json.ts` の `MODES` と
`test/contrast.test.ts` の `CHECKED_MODES` に足す（テーマでも 7:1 / 3:1 を固定する）。

## Lint（`terrazzo check`）

| ルール                    | 設定                                                   |
| ------------------------- | ------------------------------------------------------ |
| `core/consistent-naming`  | kebab-case                                             |
| `core/duplicate-values`   | error（base 層のみ。semantic の別名は許容）            |
| `core/descriptions`       | error                                                  |
| `a11y/min-contrast`       | `level: "AAA"`、対は `contrastAgainst` から生成         |
| `a11y/min-font-size`      | `16px`（`type.small` を除外、14px 最小）                |

`a11y/min-contrast` は Terrazzo の実装上 **既定（light）の解決結果でしか走らない**。ダーク・高コントラスト・
ダーク×高コントラストの 4 モードは `system/tokens/test/contrast.test.ts` が `dist/tokens.json` を読んで
7:1（テキスト）/ 3:1（`nonText: true`）で固定する。lint とテストの両方が通って初めて「AAA」と言える。

## 実装で確定した判断（plan 002、2026-09-07）

- **`color.border.default` は `neutral.500`**（light 4.68:1 / dark 4.03:1）。`neutral.300` は surface に対して
  1.81:1 で WCAG 1.4.11 の非テキスト 3:1 を満たさない。装飾用の薄い区切り線が要るなら
  `color.border.subtle`（3:1 を要求しない、`nonText` なし）を **別名で足す**。default を薄くしない
- **ダークの `color.surface.sunken` は `neutral.900`（= `surface.default`）**。palette に 900 より暗い段が無い。
  段を足すのは DESIGN.md の palette 追加＝デザイン判断
- **`color.surface.hover` と `color.status.danger.hover`**（plan 013）は qrcc の移行で必要になった semantic。
  hover は「1 段だけ動く」（light: neutral.200 / dark: neutral.800、danger は 700 / 300）で、
  `color.text.on-status` は `danger.hover` に対しても 7:1 を要求する（`contrastAgainst`）
- **DESIGN.md の `typography.*.fontSize` は clamp の最小値**（`1rem` など）。`@google/design.md` 0.4.0 が
  `clamp()` を dimension と認めないため。流体の 3 値は `tokens.css` と `tokens.json`
  （`$extensions["riml-ds"].fluid`）にある
- `light-dark()` の畳み込みは `{light, dark} × {contrast: no-preference, more} × 色域` の permutation を
  対で畳み、基準との差分だけを `@media (prefers-contrast: more)` / `(color-gamut: …)` に出す。
  high-contrast モードは生値ではなく alias で書く（dark でも意味が壊れない）
- `core/duplicate-values` の `ignore` は semantic 側を列挙する（Terrazzo は複合型の alias を
  重複扱いするため、`color.palette.**` を ignore すると semantic の別名が全部落ちる）

## 変更手順

1. `src/` を編集
2. `bun run --filter @rimltempest/riml-ds-tokens check`（lint）と `build`
3. `bun run design-md`（DESIGN.md のフロントマター再生成）
4. Storybook で `Tokens` docs と 6 条件の story を見る
5. VRT の差分を確認（値の変更は必ず差分が出る。意図どおりか見る）
6. `.changeset` を書く。semantic の**名前**を変えたら major
