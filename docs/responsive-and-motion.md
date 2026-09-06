# レスポンシブとモーション

判断は [system/guidelines/motion-and-responsive.md](../system/guidelines/motion-and-responsive.md)。
検査の配線：

- VRT は 幅 360 / 1024 × ライト / ダーク（ADR-0007）。
- e2e に `zoom: 2`（200%）と `viewport 320` のリフロー検査。
- story `ReducedMotion` は `prefers-reduced-motion: reduce` をエミュレートし、`getAnimations()` が
  空であることを interaction test で確認する。
- stylelint：`transition` / `animation` 宣言が `@media (prefers-reduced-motion: no-preference)` の
  外にあれば落とす（`tools/lint/stylelint-plugin/motion-in-media.js`）。
