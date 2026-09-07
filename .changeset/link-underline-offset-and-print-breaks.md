---
'@rimltempest/riml-ds-tokens': minor
'@rimltempest/riml-ds-css': patch
---

- tokens: `type.link.underline-offset`（`--rd-type-link-underline-offset`、0.15em）を追加
- css: `a` の下線を `text-underline-offset` でディセンダーから離した。`print.css` に見出し直後（`break-after: avoid`）と
  表・図・コード・リスト項目の途中（`break-inside: avoid`）で改ページしない指定を足した
