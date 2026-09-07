---
'@rimltempest/riml-ds-tokens': minor
---

- テーマがダークも解決するようになった。`themes/<brand>.css` はライトとダークの差分を `light-dark()` に畳む
- テーマが上書きできるのは `color.palette.*` だけ（テストで固定）。semantic と `modes/*` は palette を参照する
- `color.surface.hover` / `color.status.danger.hover`（と `palette.danger.300/700`）を追加
- `themes/qrcc` に qrcc（青 / hue 255）の palette を入れた。`tokens.json` の `$extensions.riml-ds.modes` に
  `theme-<brand>` / `theme-<brand>-dark` が出る
