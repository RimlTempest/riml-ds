<!--
観点は docs/governance.md §レビュー観点。チェックが埋まらない項目は
「なぜ不要か」を書く（空のまま出さない）。CI のゲートは .github/workflows/ci.yml。
-->

## 何を・なぜ

<!-- 1〜3 行。関連する plan / ADR / issue へのリンク -->

## レビュー観点（docs/governance.md）

- [ ] 失敗するテストから書いたか（コミット順で分かる）
- [ ] `*.element.ts` は薄いか（150 行 / if 5 以下）
- [ ] 生値ゼロ（stylelint が通る）
- [ ] 6 条件の story（Dark / HighContrast / ForcedColors / ReducedMotion / RTL / Dense）
- [ ] a11y 例外の理由は妥当か
- [ ] CEM の diff に破壊的変更があるなら `.changeset` は major か
- [ ] DESIGN.md / guidelines の該当節を更新したか
- [ ] レーンの所有範囲内か（`scripts/lanes.tsv`）

## この PR の申告

- [ ] レーン：`feat/…`（`scripts/lanes.tsv` の行。所有パスの外を触っていない）
- [ ] `.changeset`：あり ／ 不要（理由：）
- [ ] PE ティア（部品を足した場合）：A ／ B ／ C（理由：）
- [ ] VRT 差分：あり（差分画像を添付）／ なし

## 依存の更新（Dependabot の PR のとき）

- [ ] Playwright を上げたなら `e2e/Dockerfile` のタグ・`@playwright/test`・`.github/workflows/ci.yml` の `container:` を**同じ PR で**揃えた
