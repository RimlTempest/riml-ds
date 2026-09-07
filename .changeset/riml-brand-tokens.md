---
'@rimltempest/riml-ds-tokens': minor
---

- 既定ブランドを riml の色にした（blogs の 7 色由来。紙 = cream、インク = navy、主役 = 髪の青、印章 = 赤目）。旧既定の青緑は `themes/noter` へ
- `color.brand.primary` / `color.brand.signature`（装飾用・非文字 3:1）、`color.chrome.default` / `color.chrome.text`（タイトルバー）、
  `font.family.display`（丸ゴシック系スタック、同梱なし）、`color.palette.neutral.700` / `accent.500` / `signature.*` を追加
- `radius.sm/md/lg` を 8/12/16px に、`shadow.*` をぼかし 0 の硬い影に、`type.heading.*` を display スタックに
- `color.text.default`（ライト）の参照先を `neutral.700` に。テーマは既定の palette 段を全部持つ（テストで固定）
