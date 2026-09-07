# 色とテーマ

## 構造

```
base（palette）  →  semantic（役割）  →  component（部品固有、必要時のみ）
color.palette.neutral.800  →  color.text.default  →  (button.color.text)
```

部品は **semantic だけ**を参照する。base を直接参照したら stylelint で落ちる。

## モード

| モード         | 切替                              | 変わるもの                                 |
| -------------- | --------------------------------- | ------------------------------------------ |
| ライト / ダーク| `color-scheme`（`light-dark()`）  | semantic の色。彩度をダークで少し落とす    |
| 高コントラスト | `prefers-contrast: more`          | `text.muted → text.default`、`border → text` |
| 強制配色       | `forced-colors: active`           | すべてシステム色。独自色を出さない         |
| 密度           | `[data-density="compact"]`        | space / sizing のみ。色は変わらない        |
| 低モーション   | `prefers-reduced-motion`          | 色は変わらない                             |

モードは**組み合わさる**（ダーク × 高コントラスト × compact）。story の `Matrix` で全組合せを描く。

## ブランドテーマ

`themes/<brand>/` は semantic の**差分だけ**。base を足してよいが、semantic の名前は足さない
（名前を足すと部品が参照できず、ブランドで部品の見た目が変わらない）。

qrcc / noter のテーマは移行のためだけに存在する（[migration.md](../../docs/migration.md)）。

## ルール

- 表面（surface）の階層は明度差で作る：`surface.default` → `surface.raised`（+0.03）→ `surface.overlay`。
  ダークでは逆に明るくする（浮いているものほど明るい）。
- テキストは 2 段（`text.default` / `text.muted`）+ 意味色。3 段目（`subtle`）を作らない。
- アクセントは**1 色**。「セカンダリカラー」は作らない。強調の階層は太さ・サイズ・余白で作る。
- 意味色は 4 つ（danger / warning / success / info）。それぞれ `text` / `surface` / `border` の 3 役割。
- hover は **hover トークン**（`color.accent.hover` / `color.status.*.hover` / `color.surface.hover`）を使う。
  トークンに無い面の hover が要るなら `color-mix(in oklch, var(--rd-color-accent-default), transparent 8%)` の形で
  作ってよいが、引数はトークンだけ。pressed は色ではなく `translate: 0 0.0625rem`（影の方向に沈む）で示す。
- 影は**硬い**（ぼかし 0、右下に 0.25rem / 0.5rem のオフセット）。色は `color.shadow`（インク色 `neutral.900` 系の
  16% / 24%）。黒（`#000`）を使わない。値は [brand.md §5](../../docs/brand.md) が正。
- **`color.brand.*`（primary / signature）は装飾専用**。文字色・アイコン色に使わない（AAA を満たさない）。
  帯（chrome）の上の文字は `color.chrome.text` だけ。
- グラデーションは、タイトル帯の 3 つの丸（`radial-gradient` の塗り）以外に置かない。
