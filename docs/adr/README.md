# ADR（Architecture Decision Records）

決めたこと・なぜそう決めたか・捨てた選択肢を残す。番号は増えるだけで、取り消すときは新しい ADR で
`Superseded by` を書く。

| #    | タイトル                                                                                   | 状態     |
| ---- | ------------------------------------------------------------------------------------------ | -------- |
| 0001 | [デザインシステムとコンポーネントライブラリを分ける](0001-system-and-library-split.md)     | Accepted |
| 0002 | [Lit を唯一のソースにし、各フレームワーク向けは CEM から生成する](0002-lit-elements-and-generated-wrappers.md) | Accepted |
| 0003 | [トークンは DTCG 2025.10、ビルドは Terrazzo、Figma は持たない](0003-tokens-dtcg-terrazzo.md) | Accepted |
| 0004 | [プレーン CSS + `@layer` + Baseline、生値は lint で落とす](0004-plain-css-layers-baseline.md) | Accepted |
| 0005 | [`class` は `*.element.ts` に限って許す](0005-class-exception-for-elements.md)             | Accepted |
| 0006 | [TypeScript 7 + oxc、CSS は stylelint 17、HTML は markuplint](0006-toolchain.md)           | Accepted |
| 0007 | [Storybook 10 を唯一のショーケースにし、VRT は Playwright で無料に収める](0007-storybook-and-vrt.md) | Accepted |
| 0008 | [AAA を既定にし、`ElementInternals` を第一の手段にする](0008-aaa-and-element-internals.md) | Accepted |
| 0009 | [公開 API の定義・semver・ライフサイクル・Trusted Publishing](0009-publishing-and-versioning.md) | Accepted |
| 0010 | [エージェント向けの面（DESIGN.md / CEM / MCP / skills）](0010-agent-native-surface.md)     | Accepted |
| 0011 | [無料枠で運用する（GitHub Pages、有料 SaaS なし）](0011-free-tier-operations.md)          | Accepted |
| 0012 | [Progressive Enhancement を 3 ティアで規約化し、フォーム・ナビ部品は light DOM でネイティブ要素を包む](0012-progressive-enhancement-tiers.md) | Accepted |
| 0012 | [Progressive Enhancement を 3 ティアで規約化し、フォーム・ナビ部品は light DOM でネイティブ要素を包む](0012-progressive-enhancement-tiers.md) | Accepted |

## 書式

```
# NNNN: タイトル
状態 / 日付 / 関連
## 文脈
## 決定
## 理由
## 捨てた選択肢
## 影響（守るべき不変条件、lint や CI でどう固定するか）
```
