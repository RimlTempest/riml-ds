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

## CI とリポジトリ設定

PR ごとのゲートは `.github/workflows/ci.yml`（plan 010）。ジョブは `guard` / `fmt-lint` / `typecheck` / `test-node` /
`test-browser` / `markuplint` / `a11y-vrt-pe` / `frameworks` / `release-check` / `agent-surface`。ブラウザを使うジョブは
Playwright の公式イメージを `container:` にし、ブラウザをダウンロードしない（ADR-0011）。手元で同じものを回すのは
`bun run ci:local`（ゲートを足すときは両方に足す）。main へのマージで `pages.yml` が Storybook / `r/registry.json` / `DESIGN.md` を
GitHub Pages に出す。

GitHub の UI でだけ設定できるもの（一人運用なので強制はしないが、既定にしておく）：

- **Branch protection（`main`）**: 上の 10 ジョブを required status checks に。`Require linear history` は **off**
  （レーンごとの履歴を残す `--no-ff` マージ運用）。squash / rebase マージは無効にし、merge commit だけを許す。
- **Actions → Workflow permissions**: Read and write + 「Allow GitHub Actions to create and approve pull requests」
  （`release.yml` の Version PR に要る。`docs/publishing.md`）。
- **Pages**: Source は GitHub Actions。公開リポジトリでないと無料で使えない。
- **Dependabot**: `.github/dependabot.yml`（`bun` エコシステム、週 1、ツールチェーンごとに group）。Playwright の更新は
  `e2e/Dockerfile` のタグ・`ci.yml` の `container:`・`@playwright/test` を**同じ PR で**揃える。`tools/markuplint` は
  lockfile を持たないので対象外（手で上げる）。
- CodeQL は公開後に default setup を有効にする（ワークフローは足さない）。

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
