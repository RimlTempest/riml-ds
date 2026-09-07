# Plan 010: CI・GitHub Pages・Dependabot・PR テンプレ・不変条件ガードの配線（リポジトリ公開の切替を含む）

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat <plan-008 のマージコミット>..HEAD -- .github scripts/guard.sh scripts/affected.sh package.json e2e/Dockerfile scripts/vrt.sh tools/cem/registry.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MEDIUM（GitHub Actions は手元で完全には検証できない。Docker ジョブの時間。**リポジトリの public 化は不可逆に近い操作でユーザーが行う**）
- **Depends on**: 001（`guard.sh` / `affected.sh`）。ジョブの中身は 002〜008 の script に依存するが、**無い script はジョブを `if: hashFiles(...)` で
  スキップして先に配線できる**。Pages は 005（Storybook）と 008（registry / DESIGN.md）の後
- **Category**: direction
- **Planned at**: commit `7bf04e8`, 2026-09-07

## Why this matters

ここまでの plan が作ったゲート（check / test / guard / a11y / vrt / pe / markuplint / release:check / agent-surface）を **PR ごとに自動で**回し、
main マージで Storybook・`registry.json`・`DESIGN.md` を GitHub Pages に出す（ADR-0011）。無料で運用するための制約
（Actions の時間、Docker イメージからブラウザを取る、変更のあったパッケージだけ回す）もここで固定する。

## Current state

- `.github/` には `workflows/release.yml`（plan 007）だけ。`ci.yml` / `pages.yml` / `dependabot.yml` / `PULL_REQUEST_TEMPLATE.md` は**無い**。
- `scripts/guard.sh`（plan 001 の 7 検査 + 004 / 005 / 007 が足した検査）、`scripts/affected.sh`（変更パッケージ判定。`ALL` を返すことがある）。
- root scripts：`check`（fmt + lint + lint:css + typecheck + sherif）、`test`（vitest projects：node / browser / react / storybook）、`gen`、`build`、`guard`、
  `render` + `lint:html`（plan 005）、`vrt` / `vrt:update` / `a11y` / `pe`（Docker、`scripts/vrt.sh`）、`e2e:frameworks`（plan 006）、`release:check`（plan 007）、`design-md`（plan 002）。
- **`bun run test -- --project browser` は Playwright の Chromium が要る**。CI では Docker イメージ `mcr.microsoft.com/playwright:v1.63.0-noble`（`e2e/Dockerfile`）内で回す
  （ADR-0011 §6「ブラウザはダウンロードしない」）。node / react（jsdom）project はホストで回せる。
- リポジトリは **private**（ユーザー決定 2026-09-07。plan 010 の直前まで）。ADR-0011 §1 は「public」 → **public 化はこの plan の最終ステップでユーザーが実行**。
  private の間は Actions 月 2,000 分・Pages 不可。
- モデルにする CI：`/Users/riml/orca/projects/noter/.github/workflows/ci.yml`（**読むだけ。コピーして書き換える。noter を変更しない**）。
  構成：`changes`（`dorny/paths-filter@v3`）→ `guard` / `fmt-lint` / `typecheck` / `test` / `markuplint` / `build-and-a11y`、`concurrency` で同 ref を cancel、
  `permissions: contents: read, pull-requests: read`、`jdx/mise-action@v3`（cache）、`bun install --frozen-lockfile`、失敗時 `actions/upload-artifact@v4` で Playwright レポート。
- 仕様の正：`docs/adr/0011-free-tier-operations.md`（Pages は main マージ時のみ、PR プレビューは artifact、affected で絞る）、
  `docs/agent-integration.md` §CI（`agent-surface` ジョブ：`bun run gen && git diff --exit-code`、`design.md lint`、mcp test）、
  `docs/adr/0007` §影響（VRT は Docker 内でだけ更新、macOS 画像をコミットしない）、`docs/governance.md` §レビュー観点（PR テンプレの中身）、
  `docs/parallel-lanes.md`（レーン所有権。**guard に「PR の変更ファイルがレーンの所有範囲内か」を足す**：`scripts/lanes.tsv` を読む。ブランチ名がレーン名と一致するときだけ）。

## Commands you will need

| Purpose             | Command                                                         | Expected on success                        |
| ------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| YAML 構文           | `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest` | 出力なし exit 0                         |
| ローカルで CI 相当   | `bun run ci:local`（この plan で追加。Docker 内で browser/vrt/pe/a11y も回す） | exit 0                          |
| Pages 成果物         | `bun run pages:build`（この plan で追加）                        | `pages/`（Storybook + `r/` + `DESIGN.md`） |
| guard               | `bun run guard`                                                 | exit 0                                     |
| affected            | `BASE=origin/main bash scripts/affected.sh`                     | パッケージ一覧 or `ALL`                    |
| 公開状態            | `gh repo view RimlTempest/riml-ds --json visibility`            | `private` → 最終ステップ後 `public`        |

**実行しないコマンド**：`gh repo edit --visibility`（ユーザーが行う）、`gh workflow run`、`gh secret`、`git push`。

## Suggested executor toolkit

- skill：`riml-ds-worktree`、`riml-ds-release`
- Context7：`/actions/deploy-pages`（`actions/upload-pages-artifact` + `actions/deploy-pages`、`permissions: pages: write, id-token: write`、`environment: github-pages`）、
  `/dorny/paths-filter`、`/dependabot/dependabot-core`（`groups`、`bun` エコシステム対応の有無 → 無ければ `npm` で `bun.lock` を扱えるか確認）
- GitHub Docs「Configuring a publishing source for your GitHub Pages site」（Actions からのデプロイ）、「Usage limits, billing」（private の分）

## Scope

**In scope**:

- `.github/workflows/ci.yml`、`.github/workflows/pages.yml`、`.github/dependabot.yml`、`.github/PULL_REQUEST_TEMPLATE.md`
- `scripts/guard.sh`（レーン所有権検査 + 「`*.element.ts` が変わったのに `custom-elements.json` が変わっていない」検査。plan 004 Maintenance）、`scripts/ci-local.sh`、`scripts/pages-build.sh`
- root `package.json`（`ci:local` / `pages:build`）、`e2e/Dockerfile`（CI で `bun run test -- --project browser` も回すためのレイヤ追加が要る場合のみ）
- `plans/README.md`（自分の行だけ）

**Out of scope**:

- `.github/workflows/release.yml`（plan 007。**触らない**）
- すべてのソース・docs・skills。CI が落ちる原因がソースにあれば**直さず報告**
- リポジトリ設定（visibility、branch protection、Pages の有効化、Secrets）→ ユーザー作業として報告に列挙

## Git workflow

- Branch: `chore/devops`（`bun run wt new chore/devops`）
- 例：`ci: add ci workflow with affected-based jobs`、`ci(pages): publish storybook registry and design.md`、`chore(guard): check lane ownership`、`chore: add dependabot and pr template`
- push しない

## Steps

### Step 1: `ci.yml`

noter の構成を写して書き換える。ジョブ：

| job | 条件（`changes` の出力） | 中身 | 実行環境 |
| --- | --- | --- | --- |
| `changes` | 常に | `dorny/paths-filter@v3`：`ts`（`system/** library/** tools/** scripts/** apps/** e2e/** tsconfig*.json .oxlintrc.json package.json bun.lock`）、`css`（`**/*.css **/*.styles.ts system/tokens/**`）、`elements`（`library/elements/**`）、`stories`（`**/*.stories.ts apps/storybook/**`）、`e2e`（`e2e/** library/** system/**`）、`agent`（`system/tokens/** library/elements/** system/guidelines/** DESIGN.md tools/**`） | ubuntu |
| `guard` | 常に | `bun run guard`（`bun install` 不要な検査だけなら checkout のみ。`jq` は ubuntu にある） | ubuntu |
| `fmt-lint` | 常に | `bun run fmt:check && bun run lint && bun run lint:css` | ubuntu + mise |
| `typecheck` | `ts` | `bun run typecheck` | ubuntu + mise |
| `test-node` | `ts` | `bun run test -- --project node --project react` | ubuntu + mise |
| `test-browser` | `ts` | `bun run build`（elements） → `bun run test -- --project browser --project storybook` | **`container: mcr.microsoft.com/playwright:v1.63.0-noble`** + Bun を `mise-action` で（イメージ内で mise が動くか確認。動かなければ `oven-sh/setup-bun@v2` を **`mise.toml` の版で**） |
| `markuplint` | `stories` | `bun run storybook:build && bun run render && bun run lint:html` | container（render は Playwright） |
| `a11y-vrt-pe` | `e2e` | `bun run storybook:build && bunx playwright test -c e2e/playwright.config.ts`（Docker 内なので `vrt.sh` を経由しない。`--project` 指定なし = vrt / forced / reduced / a11y / pe 全部） | container |
| `frameworks` | `e2e` かつ `library/**` の変更 | `bunx playwright test -c e2e/playwright.frameworks.config.ts` | container |
| `release-check` | `ts` | `bun run release:check` | ubuntu + mise |
| `agent-surface` | `agent` | `bun run gen && git diff --exit-code && bunx @google/design.md lint DESIGN.md && bun run test -- --project node --dir tools/mcp` | ubuntu + mise |

共通：`concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`、`permissions: { contents: read, pull-requests: read }`、`workflow_dispatch` で全ジョブ強制、
`actions/checkout@v5`（`fetch-depth: 0` は `affected.sh` を使うジョブだけ）、`jdx/mise-action@v3` `cache: true`、`bun install --frozen-lockfile`。
失敗時：`actions/upload-artifact@v4` で `e2e/test-results/`、`e2e/playwright-report/`、VRT の差分画像（`**/*-diff.png`）を 7 日保持（ADR-0011 §7 の「PR プレビューは artifact」）。
`timeout-minutes` を全ジョブに（container 系 20、他 10）。**ジョブがまだ存在しない script を呼ぶ場合**（plan の順序次第）は
`if: hashFiles('e2e/playwright.frameworks.config.ts') != ''` で守る。

`scripts/ci-local.sh`：上の表を手元で再現（ホスト部分をそのまま、container 部分を `docker run … mcr.microsoft.com/playwright:v1.63.0-noble` で）。root `ci:local`。

**Verify**: `actionlint` exit 0。`bun run ci:local` exit 0（Docker あり。無ければホスト部分だけ回し、報告に書く）

### Step 2: `guard.sh` の追加検査

（a）**レーン所有権**：`GITHUB_HEAD_REF`（PR）またはカレントブランチ名が `scripts/lanes.tsv` の `branch` 列にあるとき、`git diff --name-only origin/main...HEAD` の各ファイルが
その行の `owned_paths`（カンマ区切り、前方一致）か `plans/README.md` / `.changeset/` / `scripts/lanes.tsv`（追記のみ許容）に含まれる。外れたら `::error file=<f>::owned by <lane>` + exit 1。
一致するレーン名が無ければスキップ（`main` や `dependabot/*`）。
（b）**CEM の鮮度**：差分に `library/elements/src/**/*.element.ts` か `*.contract.ts` が含まれるのに `library/elements/custom-elements.json` と `tools/cem/registry.json` が含まれない → error。
（c）**ADR 索引**（plan 001 の 7 番）が引き続き通ること。
`scripts/guard.test.ts`（plan 001 の枠に追加。偽リポジトリで (a) 越境 → exit 1、範囲内 → 0、(b) → 各 1 件。4 件）。

**Verify**: `bun run test -- --project node scripts` → guard 4 件追加 pass。`bun run guard` exit 0

### Step 3: `pages.yml` と `pages:build`

`scripts/pages-build.sh`：`bun run build && bun run gen && bun run storybook:build` → `pages/`：
`pages/index.html`（Storybook の `storybook-static/` をそのまま root に）、`pages/r/registry.json`（`tools/cem/registry.json`）、
`pages/r/<name>.json`（registry の各行を 1 ファイルに。shadcn 互換の形は ADR-0010 §5。`files` の中身（`dist/<name>/*.js|css` の内容）を埋め込む）、
`pages/DESIGN.md`、`pages/custom-elements.json`、`pages/tokens.json`、`pages/.nojekyll`。合計 ≤ 50 MB（Pages 上限 1 GB、1 サイト 10 ビルド/時）。

`.github/workflows/pages.yml`：`on: push: branches: [main]` + `workflow_dispatch`、`permissions: { contents: read, pages: write, id-token: write }`、
`concurrency: { group: pages, cancel-in-progress: false }`、jobs `build`（mise + `bun run pages:build` → `actions/upload-pages-artifact@v3 with path: pages`）→
`deploy`（`environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }`、`actions/deploy-pages@v4`）。
**Storybook の `base` は `/riml-ds/`**（`https://rimltempest.github.io/riml-ds/`。`apps/storybook` の `viteFinal` で `base` を env `STORYBOOK_BASE` から受ける。
`apps/storybook` は feat/storybook 所有 → **`viteFinal` の変更が要るなら STOP して報告**。既に env 対応済みなら不要）。

**Verify**: `bun run pages:build` → `pages/index.html`、`pages/r/registry.json`、`pages/r/button.json`、`pages/DESIGN.md` が存在。`dust -s pages`（`du` は無い）≤ 50 MB。`actionlint` exit 0

### Step 4: Dependabot と PR テンプレ

`.github/dependabot.yml`：`package-ecosystem: npm`（Bun の lockfile 対応を確認。未対応なら `bun` エコシステム名、それも無ければ **`github-actions` だけ入れて npm は報告**）、
`schedule.interval: weekly`、`groups`：`storybook`（`storybook*`、`@storybook/*`）、`vitest`（`vitest`、`@vitest/*`）、`playwright`（`playwright`、`@playwright/*`。
**Docker タグと同時更新が必要 → PR 本文テンプレで注意書き**）、`lit`、`lint`（`oxlint`、`oxfmt`、`stylelint*`、`markuplint*`）、`minor-and-patch`（残り）。
`ignore`：`vitest` の major（addon-vitest の peer。plans/README「見送り」）、`typescript`（mise / tsgo 側で管理）。`open-pull-requests-limit: 5`。
`github-actions` エコシステムも weekly。

`.github/PULL_REQUEST_TEMPLATE.md`：`docs/governance.md` §レビュー観点のチェックリストを**そのまま**（8 項目）+ 「レーン：`feat/…`」「`.changeset`：あり／不要（理由）」
「PE ティア（部品を足した場合）：A / B / C と理由」「VRT 差分：あり（画像を添付）／なし」。

**Verify**: `actionlint` は dependabot.yml を見ないので `yq . .github/dependabot.yml` exit 0。テンプレに governance の 8 項目が含まれる（`grep -c '^- \[ \]'` ≥ 12）

### Step 5: リポジトリ公開の切替（**ユーザー作業**。エージェントは実行しない）

Pages は public リポジトリでしか無料で使えない（ADR-0011）。ここまでのファイルをマージし、CI が緑になったら、**ユーザーが**：

```bash
gh repo view RimlTempest/riml-ds --json visibility          # private を確認
git log --all --oneline | wc -l                              # 履歴に秘密が無いことを確認済みか（guard 6 番 .npmrc、.env 系は .gitignore）
gh repo edit RimlTempest/riml-ds --visibility public --accept-visibility-change-consequences
gh api -X POST repos/RimlTempest/riml-ds/pages -f build_type=workflow   # Pages を Actions ソースで有効化（UI でも可）
gh workflow run pages.yml --ref main
```

公開前チェック（報告に含める）：`git log -p | grep -iE 'token|secret|password' | head`（ヒットが**設定キー名だけ**であること）、`.gitignore` に `.env*` / `*.local`、
`release.yml` に `NPM_TOKEN` 無し（plan 007 guard）。**このステップの結果を Done criteria に含めない**（ユーザーがやるまで未達で良い）。

## Test plan

- `scripts/guard.test.ts` +4（node）
- CI 自体の検証は PR を開いてから（executor は push しない → **レビュー者がマージ後に main の Actions を見る**）
- `bun run ci:local` で表の全ジョブがローカルで通ることを確認

## Done criteria

- [ ] `.github/workflows/ci.yml` が表の 11 ジョブを持ち、`actionlint` exit 0、container ジョブがブラウザをダウンロードしない（`playwright install` を含まない：`grep -c 'playwright install' .github/workflows/*.yml` = 0）
- [ ] `bun run ci:local` exit 0
- [ ] `bun run guard` exit 0、レーン越境の偽リポジトリで exit 1（テスト）
- [ ] `bun run pages:build` が `pages/` を作り ≤ 50 MB、`pages.yml` が `actions/deploy-pages@v4`
- [ ] `dependabot.yml` に groups と `vitest` major の ignore、PR テンプレに governance の 8 項目
- [ ] `release.yml` に diff が無い（`git diff --stat origin/main -- .github/workflows/release.yml` が空）
- [ ] ユーザー作業（Step 5）が報告に手順どおり列挙されている
- [ ] `bun run check` exit 0、`plans/README.md` の 010 行更新

## STOP conditions

- `mise-action` が Playwright コンテナ内で動かず、`setup-bun` でも `mise.toml` と同じ版に固定できない → 報告
- `apps/storybook` の `base` を変えないと Pages で動かない → 変更せず報告（feat/storybook 所有）
- Dependabot が `bun.lock` を扱えず、`npm` エコシステムが `package-lock.json` を要求する → `github-actions` だけ有効化して報告
- `pages/` が 50 MB を超える（VRT 画像を含めてしまった等）→ 内容を報告
- `affected.sh` が `ALL` しか返さない（判定が壊れている）→ 報告（chore/scaffold の所有）
- CI の実行時間見積りが 1 PR あたり 30 分を超える → ジョブ分割案を報告（public 化後は無制限だが、遅い CI は運用上の負債）

## Maintenance notes

- Playwright を上げる = `e2e/Dockerfile` のタグ + `@playwright/test` + `ci.yml` の `container` **3 か所を同じ PR で**（Dependabot の PR に手で足す）
- 新しいゲートを足すときは `ci.yml` と `scripts/ci-local.sh` の**両方**（手元で再現できない CI を作らない）
- Pages の内容を増やすときは `pages-build.sh` だけ。`r/<name>.json` の形は ADR-0010 §5（shadcn 互換）を崩さない
- リポジトリ設定（branch protection：`ci.yml` の全ジョブを required、squash マージ禁止 = `--no-ff` 運用）はユーザーが UI で。設定内容を `docs/governance.md` に書く提案を報告に含める
- 見送り：Turborepo / Nx（`affected.sh` で足りる）、self-hosted runner、Chromatic、PR ごとの Pages プレビュー（環境が 1 つ）、CodeQL（public 化後に `github/codeql-action` を足す小 PR で。default setup で十分）
