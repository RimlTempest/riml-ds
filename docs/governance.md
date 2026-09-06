# ガバナンス

## 部品の追加

1. **提案**：`docs/proposals/<name>.md`（1 ページ）。用途、既存部品で足りない理由、API 案
   （属性 / イベント / slot / parts / CSS 変数）、a11y の論点、qrcc / noter での利用箇所。
2. **experimental** で実装（`library/elements/src/experimental/<name>/`）。plan を書き executor に渡す。
3. **stable 昇格**の条件（ADR-0009）：story 8 種、AAA 自動検査、Vitest browser、2 フレームワーク以上の
   e2e、ガイドライン、CEM に `@status stable`。
4. **deprecated**：`@deprecated` に代替と削除バージョン。1 メジャー保持。
5. **removed**：`docs/migration.md` に ast-grep ルール。

## トークンの追加・変更

- semantic の追加は minor。名前変更・削除は major。値の変更は minor（VRT 差分を PR に添付）。
- base の追加は「semantic から参照される」ことが条件。使われない base は knip 相当の
  `terrazzo check`（未参照）で落とす。
- ブランドテーマは semantic の差分のみ。

## レビュー観点（PR テンプレ）

- [ ] 失敗するテストから書いたか（コミット順で分かる）
- [ ] `*.element.ts` は薄いか（150 行 / if 5 以下）
- [ ] 生値ゼロ（stylelint が通る）
- [ ] 6 条件の story（Dark / HighContrast / ForcedColors / ReducedMotion / RTL / Dense）
- [ ] a11y 例外の理由は妥当か
- [ ] CEM の diff に破壊的変更があるなら `.changeset` は major か
- [ ] DESIGN.md / guidelines の該当節を更新したか
- [ ] レーンの所有範囲内か（`scripts/lanes.tsv`）

## 定期作業

| 周期     | 作業                                                     |
| -------- | -------------------------------------------------------- |
| 週       | Dependabot の PR をまとめてマージ（CI が通れば）          |
| 四半期   | `docs/baseline.md` の見直し（Newly → Widely の `@supports` 除去） |
| 四半期   | axe / Storybook / Lit / Terrazzo のメジャー追従           |
| リリース | 手動 a11y 一巡（VoiceOver / NVDA）                       |
| 年       | major は 1 回まで                                        |

## 意思決定

一人運用。判断は ADR に残す。エージェントが判断に迷ったら STOP して ADR の追加を提案する。
