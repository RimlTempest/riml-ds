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
      qrcc/color.tokens.json   ブランド差分（移行用）
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
| `themes/<brand>.css` | semantic の上書きだけ                                              | 移行中のアプリ            |
| `tokens.ts`   | `as const` のリテラル型                                                    | TS 利用側、部品           |
| `tokens.json` | 解決済み DTCG（alias 展開、モードごとの値を `$extensions.riml-ds.modes` に）| DESIGN.md 生成、MCP       |
| `tokens.md`   | 表                                                                         | Storybook Docs            |

### ライト/ダーク

```css
--rd-color-surface-default: light-dark(oklch(0.99 0.005 200), oklch(0.16 0.01 200));
```

切替は `color-scheme`。強制する場合は `<html style="color-scheme: dark">` か
`<meta name="color-scheme" content="dark">`。JS のトグルは `document.documentElement.style.colorScheme`
を書くだけ。`[data-theme]` は使わない。

## Lint（`terrazzo check`）

| ルール                    | 設定                                                   |
| ------------------------- | ------------------------------------------------------ |
| `core/consistent-naming`  | kebab-case                                             |
| `core/duplicate-values`   | error（base 層のみ。semantic の別名は許容）            |
| `core/descriptions`       | error                                                  |
| `a11y/min-contrast`       | `level: "AAA"`、対は `contrastAgainst` から生成         |
| `a11y/min-font-size`      | `16px`（`type.small` を除外、14px 最小）                |

ダーク・高コントラストも同じ lint を通す（モードごとに解決して検査）。

## 変更手順

1. `src/` を編集
2. `bun run --filter @riml-ds/tokens check`（lint）と `build`
3. `bun run design-md`（DESIGN.md のフロントマター再生成）
4. Storybook で `Tokens` docs と 6 条件の story を見る
5. VRT の差分を確認（値の変更は必ず差分が出る。意図どおりか見る）
6. `.changeset` を書く。semantic の**名前**を変えたら major
