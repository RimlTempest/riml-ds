# @rimltempest/riml-ds-tokens

## 0.2.0

### Minor Changes

- [`ff7952b`](https://github.com/RimlTempest/riml-ds/commit/ff7952b2ce090ea157ca1cdeb032789380f1c3ba) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - tokens: `type.link.underline-offset`（`--rd-type-link-underline-offset`、0.15em）を追加
  - css: `a` の下線を `text-underline-offset` でディセンダーから離した。`print.css` に見出し直後（`break-after: avoid`）と
    表・図・コード・リスト項目の途中（`break-inside: avoid`）で改ページしない指定を足した

- [`5fa23c6`](https://github.com/RimlTempest/riml-ds/commit/5fa23c6a90de82a6f46a6a83d97d1de5142d1234) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - テーマがダークも解決するようになった。`themes/<brand>.css` はライトとダークの差分を `light-dark()` に畳む
  - テーマが上書きできるのは `color.palette.*` だけ（テストで固定）。semantic と `modes/*` は palette を参照する
  - `color.surface.hover` / `color.status.danger.hover`（と `palette.danger.300/700`）を追加
  - `themes/qrcc` に qrcc（青 / hue 255）の palette を入れた。`tokens.json` の `$extensions.riml-ds.modes` に
    `theme-<brand>` / `theme-<brand>-dark` が出る
