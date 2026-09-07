---
name: riml-ds-tokens
description: riml-ds のデザイントークン規約。system/tokens の *.tokens.json を足す・変える・ブランドテーマを作る前に読む。DTCG 2025.10 の書式、base→semantic→component の階層、モード差分ファイル、$description 必須、AAA コントラスト lint、命名と CSS 変数への変換。「トークンが足りない」「terrazzo check が落ちた」「ダーク用の色をどう足すか」「qrcc の色を再現したい」で発火。
---

# riml-ds トークン規約

根拠は [ADR-0003](../../../docs/adr/0003-tokens-dtcg-terrazzo.md)、配置と出力は
[docs/tokens.md](../../../docs/tokens.md)、色の判断は
[system/guidelines/color-and-theming.md](../../../system/guidelines/color-and-theming.md)。

## 0. まずこれだけ

| やること                                             | やらないこと                                     |
| ---------------------------------------------------- | ------------------------------------------------ |
| `system/tokens/src/**/*.tokens.json` を編集          | `tokens.css` / `tokens.ts` / DESIGN.md フロントマターを手で直す |
| semantic を足す（`color.text.subtle` 等は禁止。役割で）| 部品から base（`color.palette.*`）を参照         |
| モードは `modes/dark.tokens.json` に**差分だけ**     | 全トークンをダーク用にコピー                     |
| `$description` に用途を書く                          | 値の言い直し（「濃い灰色」）                     |
| `oklch` で書く                                       | hex を手で書く（生成器が補完する）               |
| `terrazzo check` を通す（AAA）                       | コントラスト不足の色を「後で直す」で入れる       |

## 1. 書式（DTCG 2025.10）

```json
{
  "color": {
    "$type": "color",
    "surface": {
      "default": {
        "$value": { "colorSpace": "oklch", "components": [0.99, 0.005, 200] },
        "$description": "ページと部品の既定の背景"
      }
    },
    "text": {
      "default": {
        "$value": "{color.palette.neutral.800}",
        "$description": "本文。surface.default に対して 7:1 以上",
        "$extensions": { "riml-ds": { "contrastAgainst": "color.surface.default" } }
      }
    }
  },
  "space": {
    "$type": "dimension",
    "4": { "$value": { "value": 1, "unit": "rem" }, "$description": "部品間の標準の間隔（16px）" }
  }
}
```

- `$type` はグループに書いて継承させる。
- alias は `"{path.to.token}"`。base → semantic の参照だけ。semantic → semantic の alias は
  「同じ値を別の役割で使う」ときに限る（例: `color.border.focus` → `{color.accent.default}`）。
- 複合型（`typography`、`shadow`、`border`）は DTCG の形で 1 トークンにまとめる。
- `$extensions["riml-ds"]`：`contrastAgainst`（テキスト色に必須）、`nonText: true`（3:1 で検査）、
  `status`（`experimental` / `stable` / `deprecated`）。
- `$deprecated`: `"代替は color.text.muted。v3 で削除"`。

## 2. 階層

```
base/       color.palette.<hue>.<step>   space.<n>   radius.<size>   type.size.<step>  … 素材。公開 API ではない
semantic/   color.text.default  color.surface.raised  space.inset.md  radius.control  … 役割。公開 API
component/  button.padding-inline  … 部品固有。semantic を alias するだけ。必要になるまで作らない
```

**semantic の名前は「どこで使うか」ではなく「何の役割か」**。`color.button.background` ではなく
`color.accent.default`。部品名が入る名前は `component/` にだけ置く。

## 3. モード

```
modes/dark.tokens.json            semantic の色だけ上書き（同じ path、値だけ）
modes/high-contrast.tokens.json   text.muted → text.default、border.* → text.default
modes/compact.tokens.json         space.* と sizing.* を 0.75 倍
```

差分ファイルに**新しい名前を足さない**。名前は semantic が正。

ダークの色は「同じ色相・反転した明度・少し落とした彩度」。
`oklch(0.42 0.0911 260.53)`（ライトのアクセント `accent.600`）→ `oklch(0.80 0.082 260.53)`（`accent.400`）。
既定ブランドの値と用途は `docs/brand.md` §2–§3 が正。`brand.*` / `signature.*` は装飾専用で文字を載せない。

## 4. ブランドテーマ

`themes/<brand>/color.tokens.json`。semantic の色だけ。名前を足さない。
qrcc / noter の現在値を再現するときは、既存の `--qrcc-*` の値を oklch に変換して置き、
`terrazzo check` の AAA を通す。通らない色は**そのブランドの色を直す**（DS 側で緩めない）。

## 5. 手順

```bash
cd system/tokens
bun run check          # terrazzo check（DTCG / 命名 / 重複 / description / AAA）
bun run build          # dist/tokens.{css,ts,json,md}
cd ../.. && bun run gen  # DESIGN.md フロントマター
bun run dev            # Storybook の Tokens docs で見る
```

## 6. `terrazzo check` が落ちたら

| ルール                    | 直し方                                                              |
| ------------------------- | ------------------------------------------------------------------- |
| `a11y/min-contrast`       | 明度を動かす（ライトは下げる、ダークは上げる）。相手（`contrastAgainst`）を変えない |
| `core/descriptions`       | 用途を書く                                                          |
| `core/duplicate-values`   | base に同じ値がある。既存を alias する                               |
| `core/consistent-naming`  | kebab-case。数字は `space.4` のように単独                            |
| `riml-ds/no-unused-base`  | semantic から参照されない base。消す                                 |
| `riml-ds/semantic-no-raw` | semantic に生値。base に置いて alias する                            |

## 7. 変更の影響

- 名前の追加 → minor。名前の変更・削除 → major（`$deprecated` を 1 メジャー挟む）。値の変更 → minor + VRT 差分の確認。
- `color.*` を変えたら Storybook の `Matrix` story（6 条件 × 全部品）を見る。
- 変更は `.changeset` に「どのトークンを・なぜ」を書く。
