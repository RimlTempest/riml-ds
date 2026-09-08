---
'@rimltempest/riml-ds-tokens': minor
---

- tokens: palette に `color.palette.neutral.750`（`[0.31, 0.035, 270.31]`）と `neutral.950`（`[0.17, 0.025, 270.31]`）を追加（riml / qrcc / noter の 3 テーマ）。どちらも `status: internal` なので CSS から直接引かない
- tokens: ダークの `color.surface.sunken` を `neutral.950`、`color.surface.hover` を `neutral.750` に付け替えた。ダークは 950 / 900 / 800 / 750 の 4 素材で `sunken` / `default` / `raised` / `hover` の 4 役になり、入力欄・溝・リスト見出しが既定面に溶けず、窓（raised）の中の行も hover で動く（ライトの値は変えていない）
- tokens: ダークの `shadow.raised` / `shadow.overlay` を黒 alpha 0.5 / 0.6 にした（寸法はライトと同じ）。インク色の影はダークの面の上では見えなかった
- tokens: `color.text.muted` は `surface.hover` の上でも 7:1 を満たす（`contrastAgainst` が 4 面になった）。ダークの実測は riml 7.06 / qrcc 7.55 / noter 7.28
- tokens: `postbuild` の `light-dark()` 畳み込みが「共通の接頭辞 + 末尾の色」なら色だけを包むようになった（`--rd-shadow-raised: 0.25rem 0.25rem 0rem 0rem light-dark(…, …)`）。色トークンの出力は変わらない
