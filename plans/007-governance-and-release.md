# Plan 007: ガバナンスとリリース（changesets fixed・Trusted Publishing・publint / attw / size-limit / knip / api-diff）

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat <plan-006 のマージコミット>..HEAD -- package.json .size-limit.json tools/cem/src/core scripts/guard.sh library/*/package.json system/*/package.json tools/*/package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW（すべて設定と純関数。**publish は絶対に実行しない**。Trusted Publishing の登録はユーザーが npm の UI で行う）
- **Depends on**: 005, 006（全パッケージが揃ってから。`release.yml` が全パッケージを対象にするため）
- **Category**: direction
- **Planned at**: commit `7bf04e8`, 2026-09-07

## Why this matters

「壊さずに出し続ける」仕組み。ADR-0009 の決定（fixed バージョン、CEM が公開 API、Trusted Publishing、publish 前ゲート）を
機械に落とす。特に **`api-diff`**（CEM の差分から破壊的変更を検出し、major の changeset を要求する）は
このリポジトリ固有のゲートで、レビューに頼らず後方互換を守る。

## Current state

- plan 001〜006 完了。パッケージ：`@rimltempest/riml-ds-{tokens,css,elements,react,vue,svelte,astro,lint}`（公開）、
  `@rimltempest/riml-ds-{cem,markuplint,design-md,e2e,storybook}`（private）。`tools/mcp` は plan 008（後）。
- `.size-limit.json` は plan 004 / 006 が作った（elements 2 行 + react 1 行）。**tokens / css の行が無い**（この plan で足す）。
- `bunx sherif` は plan 001 から `check` に入っている。`knip` は**未導入**（plan 001 が「007 で」と留保）。
- `.changeset/` は**無い**。`release.yml` は無い。`.github/` は plan 010 まで無い（`release.yml` は**このレーン**の所有：`scripts/lanes.tsv`）。
- 仕様の正：
  - `docs/adr/0009-publishing-and-versioning.md`：公開 API の定義表、`@status` 4 段階、fixed バージョン、`0.x` は minor を major 扱い、
    publish 前ゲート、`api-diff` ジョブ、初回 publish はユーザー
  - `docs/publishing.md`：初回手順、以後の流れ、ゲート一覧、サイズ予算表（**tokens.css 6 KB、css 8 KB、button/define 12 KB、dialog/define 14 KB、react(button) 13 KB**）
  - `.claude/skills/riml-ds-release/SKILL.md`：semver 判定表、changeset の書式、ゲートが落ちたときの直し方（**この表の行名 `api-diff` / `gen-diff` / `publint` / `attw` / `size-limit` / `knip` / `sherif` をジョブ名・スクリプト名に使う**）
  - `docs/governance.md`：レビュー観点（PR テンプレは plan 010）
  - `docs/adr/0011`：**リポジトリは plan 010 の直前まで private**（ユーザー決定 2026-09-07）。private の間は Actions の無料分が月 2,000 分 →
    `release.yml` は **手動実行（`workflow_dispatch`）と Version PR のマージ時だけ**動く形にし、PR ごとには動かさない
- バージョン（2026-09-07 `npm view`）：`@changesets/cli` 2.29.x、`@changesets/changelog-github` 0.5.x、`publint` 0.3.x、
  `@arethetypeswrong/cli` 0.18.x、`knip` 6.34.0、`sherif` 1.13.0、`size-limit` 13.0.3。`changesets/action` v1（GitHub Action）。
  着手時に再確認して固定する。

## Commands you will need

| Purpose            | Command                                                                     | Expected on success                 |
| ------------------ | --------------------------------------------------------------------------- | ----------------------------------- |
| changeset 作成     | `bunx changeset`（対話。CI では `bunx changeset status`）                    | `.changeset/*.md`                   |
| 版の試算           | `bunx changeset version --snapshot test`（**コミットしない**。`git checkout -- .` で戻す） | `package.json` の version が上がる |
| ゲート一括         | `bun run release:check`（この plan で追加）                                  | exit 0                              |
| publint            | `bun run --filter './system/*' --filter './library/*' publint`               | 各 exit 0                           |
| attw               | `bunx attw --pack <dir> --profile esm-only`                                 | 各 exit 0                           |
| size               | `bunx size-limit`                                                           | 全行が予算内                        |
| knip               | `bunx knip`                                                                 | exit 0                              |
| api-diff           | `bun run tools/cem/src/api-diff.ts <base.json> <head.json>`                  | 破壊的変更の一覧（無ければ exit 0） |

**実行しないコマンド**：`npm publish`、`changeset publish`、`npm login`、`gh secret`、`gh workflow run`。`.claude/settings.json` の deny に入っている前提。

## Suggested executor toolkit

- skill：`riml-ds-release`（必読）、`riml-ds-typescript`、`riml-ds-tdd`
- Context7：`/changesets/changesets`（`fixed`、`changelog`、`changesets/action` の `publish` 入力、`version` の `--snapshot`）、
  `/webpro-nl/knip`（workspace 設定、`ignore`、`entry`）、`/arethetypeswrong/arethetypeswrong.github.io`（`--profile`）、`/publint/publint`
- npm Trusted Publishing のドキュメント（docs.npmjs.com「Trusted publishing for npm packages」）：ワークフロー名の一致条件、`id-token: write`、
  `npm` 11.5+ が必要（`mise.toml` の node に同梱される npm の版を確認。古ければ `release.yml` で `npm i -g npm@latest`）

## Scope

**In scope**:

- `.changeset/config.json`、`.changeset/README.md`
- `.github/workflows/release.yml`（**このレーンの所有**。`ci.yml` は plan 010）
- `.size-limit.json`（tokens / css の行を追加。既存行は触らない）、`knip.json`
- `tools/cem/src/core/api-diff.ts` + `tools/cem/src/api-diff.ts`（CLI）+ `tools/cem/test/api-diff.test.ts`
- root `package.json`（scripts `release:check` / `changeset` / `api-diff`、devDeps）、各公開パッケージの `package.json`（`publint` / `attw` のために
  `exports` の `types` 先頭化・`files` の整理が要る場合のみ。**API は変えない**）
- `scripts/guard.sh`（1 検査追加：公開パッケージすべてが `publishConfig.provenance: true` と `access: public` を持つ。コミットメッセージに `guard:`）
- `plans/README.md`（自分の行だけ）

**Out of scope**:

- `.github/workflows/ci.yml` / `pages.yml`、`.github/dependabot.yml`、PR テンプレ（plan 010）
- `library/**` / `system/**` / `tools/**` のソース（`publint` が落ちたら `package.json` だけ直す。ソースの export を変えない）
- `docs/**`、`.claude/skills/**`、`skills/**`
- **publish の実行、npm の設定、GitHub Secrets**。ユーザーの作業（`docs/publishing.md` §初回）

## Git workflow

- Branch: `feat/release`（`bun run wt add feat/release`）
- 例：`chore(release): add changesets with fixed versioning`、`feat(cem): add api-diff for breaking change detection`、
  `ci(release): add trusted publishing workflow`、`chore(release): add knip and size budgets`
- push しない。**タグを打たない**

## Steps

### Step 1: changesets（fixed）

`bun add -D @changesets/cli@<ver> @changesets/changelog-github@<ver>`。`bunx changeset init` → `.changeset/config.json` を書き換え：

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "RimlTempest/riml-ds" }],
  "commit": false,
  "fixed": [["@rimltempest/riml-ds-*"]],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@rimltempest/riml-ds-cem", "@rimltempest/riml-ds-markuplint", "@rimltempest/riml-ds-design-md", "@rimltempest/riml-ds-e2e", "@rimltempest/riml-ds-storybook", "e2e-*"],
  "privatePackages": { "version": false, "tag": false }
}
```

（`fixed` のグロブが効くか Context7 で確認。効かなければ公開 8 パッケージを列挙）。`.changeset/README.md` は skill §2 の書式へのリンク 3 行。
root scripts：`"changeset": "changeset"`。`bunx changeset status` が「No changesets present」以外のエラーを出さないこと。

初期版：全公開パッケージの `version` を **`0.1.0`** に揃える（`0.x` の間は minor = major 扱い、ADR-0009）。private は `0.0.0` のまま。

**Verify**: `bunx changeset status` exit 0。`bunx changeset version --snapshot t && git diff --stat && git checkout -- . && git clean -fd .changeset` で
公開 8 パッケージだけが同じ版に上がることを確認（試算後に必ず戻す）

### Step 2: `api-diff`（CEM の破壊的変更検出。純関数 + CLI）

`tools/cem/src/core/api-diff.ts`：

```ts
export type Breaking =
  | { kind: 'element-removed'; tag: string }
  | { kind: 'member-removed'; tag: string; member: 'attribute' | 'event' | 'slot' | 'cssPart' | 'cssProperty' | 'cssState' | 'method'; name: string }
  | { kind: 'attribute-type-narrowed'; tag: string; name: string; from: string; to: string }
  | { kind: 'attribute-default-changed'; tag: string; name: string; from: string; to: string }
  | { kind: 'event-detail-changed'; tag: string; name: string; from: string; to: string }
  | { kind: 'status-regressed'; tag: string; from: string; to: string }          // stable → experimental
  | { kind: 'pe-tier-changed'; tag: string; from: string; to: string }          // A → B/C は JS 無しで壊れる
export function diffManifests(base: Manifest, head: Manifest): { breaking: Breaking[]; additions: string[] }
```

ADR-0009 の表をそのまま写す。`@status experimental` の部品は**対象外**（semver 外）。`deprecated` への変更は breaking ではない（minor）。
型の「狭め」は union の集合比較（`'a'|'b'|'c'` → `'a'|'b'` は narrowed）。

`tools/cem/src/api-diff.ts`（CLI）：`bun run tools/cem/src/api-diff.ts <base.json> <head.json> [--changesets .changeset]`。
`breaking` があるのに `.changeset/*.md` に対象パッケージの `major` が無ければ exit 1 と一覧（`::error::` 形式で GitHub Actions に載る）。
**`0.x` の間は `minor` でも通す**（`package.json` の version が `0.` で始まるときだけ。ADR-0009）。
root scripts：`"api-diff": "bun run tools/cem/src/api-diff.ts"`。

`tools/cem/test/api-diff.test.ts`（node、10 件）：要素削除／属性削除／union 狭め／union 広げは addition／既定値変更／event detail／status 後退／
pe 変更／experimental は無視／changeset 判定（major あり → 0、無し → 1、`0.x` の minor → 0）。

**Verify**: `bun run test -- --project node --dir tools/cem` → 10 件 pass。`bun run api-diff library/elements/custom-elements.json library/elements/custom-elements.json` → exit 0

### Step 3: publint / attw / size-limit / knip / sherif

- `publint`：各公開パッケージの `package.json` に `"publint": "publint --strict"` を足すか、root から `bunx publint --strict <dir>` を回す小さな
  `scripts/release-check.sh`（`set -euo pipefail`、公開パッケージは `bun pm ls` ではなく `find system library tools -name package.json -maxdepth 2` + `jq -e '.private != true'` で列挙）。
  `exports` の条件オブジェクトは **`types` を先頭**に（attw の要求）。`files` に `dist` / `README.md` / 必要な生成物だけ。
- `attw`：`bunx attw --pack <dir> --profile esm-only`（ESM のみなので `node10` / `node16-cjs` は除外）。Svelte（`.svelte` を配る）と Astro（`.astro`）は
  `--ignore-rules` が要る可能性 → 必要なら理由コメントと共に `release-check.sh` に書く。
- `size-limit`：`.size-limit.json` に追加：`{ "name": "@rimltempest/riml-ds-tokens/tokens.css", "path": "system/tokens/dist/tokens.css", "limit": "6 KB", "brotli": true }`、
  `{ "name": "@rimltempest/riml-ds-css", "path": "system/css/dist/index.css", "limit": "8 KB", "brotli": true }`（CSS は `@size-limit/file`。
  `@size-limit/esbuild` と併用できるか README で確認。できなければ CSS は `brotli -c file | wc -c` を `release-check.sh` で比較）。
- `knip`：`bun add -D knip@6.34.0`。`knip.json`：workspaces ごとの `entry`（`src/index.ts`、`src/*/index.ts`、`src/*/*.define.ts`、`src/*/*.stories.ts`、
  `scripts/*.ts`、`test/**`）、`ignore` に `**/generated/**`、`ignoreDependencies` に `tslib`（`importHelpers` 経由）と Storybook のアドオン。
  **落ちる項目を `ignore` で黙らせない**：未使用 export は消す。消せない（将来用）なら STOP ではなく報告に列挙して `ignore` に理由コメント。
- `sherif`：既に `check` にある。`catalog:` を使う場合は `bunfig.toml` / root `package.json` の `workspaces.catalog` に寄せる（Bun の catalog 対応版を確認）。

root scripts：`"release:check": "bun run build && bun run gen && git diff --exit-code -- library/elements/custom-elements.json tools/cem/registry.json DESIGN.md && bash scripts/release-check.sh && bunx size-limit && bunx knip && bunx sherif"`
（`gen-diff` = `git diff --exit-code` の部分。**`DESIGN.md` のフロントマター生成が plan 002 で入っている前提**。無ければそのパスを外して報告）。

**Verify**: `bun run release:check` exit 0（ローカル。ネットワーク不要）

### Step 4: `release.yml`（Trusted Publishing）

`.github/workflows/release.yml`：

```yaml
name: Release
on:
  push:
    branches: [main]
    paths: ['.changeset/**', 'package.json', '**/package.json', 'CHANGELOG.md', '**/CHANGELOG.md']
  workflow_dispatch:
concurrency: { group: release, cancel-in-progress: false }
permissions:
  contents: write        # Version PR の作成・タグ
  pull-requests: write
  id-token: write        # npm Trusted Publishing（OIDC）
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with: { fetch-depth: 0 }
      - uses: jdx/mise-action@v3
        with: { cache: true }
      - run: bun install --frozen-lockfile
      - run: npm install -g npm@latest          # Trusted Publishing は npm 11.5+
      - run: bun run release:check
      - uses: changesets/action@v1
        with:
          version: bunx changeset version
          publish: bunx changeset publish
          commit: 'chore(release): version packages'
          title: 'chore(release): version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # NPM_TOKEN は置かない。OIDC で publish する（ADR-0009）
```

- `paths` で **changeset か version の変更があるときだけ**走らせる（private リポジトリの Actions 分を節約。ADR-0011 の改訂事項）。
- `changesets/action` の `publish` は Version PR がマージされた push でだけ実際に publish する（changeset が残っていれば Version PR を作る／更新する）。
- **`npm publish` にトークンは無い**。初回 publish（ユーザーが手元で）と npm 側の Trusted Publisher 登録（`RimlTempest/riml-ds` / `release.yml`）が済むまで
  publish ステップは 404 / 403 で落ちる。**これは想定**。`docs/publishing.md` §初回の手順を README に再掲し、ユーザー作業として報告に書く。
- `provenance` は各 `package.json` の `publishConfig.provenance: true` で付く（`--provenance` フラグ不要）。
- `actionlint`（`bunx actionlint` は無いので `docker run --rm -v "$PWD":/repo rhysd/actionlint:latest`、または `gh` 拡張）で構文確認。Docker が無ければ
  `yq . .github/workflows/release.yml` で YAML の妥当性だけ確認し、報告に書く。

`scripts/guard.sh` に 1 検査：公開（`private != true`）パッケージの `package.json` すべてに `publishConfig.access == "public"` と `publishConfig.provenance == true`、
`name` が `@rimltempest/riml-ds-` で始まる（`jq`）。

**Verify**: `actionlint`（または `yq`）exit 0。`bun run guard` exit 0。**`gh workflow run` は実行しない**

### Step 5: 文書（パッケージ README と root README の「リリース」節）

各公開パッケージ README の末尾に「バージョン方針：全パッケージ fixed。`0.x` の間は minor に破壊的変更が入り得る」2 行。
root `README.md` はこのレーンの所有ではない → **触らず**、報告に「README にリリース節を足す提案」を書く。

**Verify**: `git diff --stat -- README.md docs` が空

## Test plan

- node：`tools/cem/test/api-diff.test.ts` 10 件
- 実行：`bun run test` → 全 pass。`bun run release:check` exit 0。`actionlint` exit 0

## Done criteria

- [ ] `.changeset/config.json` が fixed + `changelog-github`、公開 8 パッケージが `0.1.0`
- [ ] `bun run api-diff a b` が動き、テスト 10 件 pass。`.changeset` 判定が `0.x` ルールを含む
- [ ] `bun run release:check` exit 0（publint / attw / size-limit / knip / sherif / gen-diff）
- [ ] `.size-limit.json` に 5 行（tokens / css / button / dialog / react）
- [ ] `.github/workflows/release.yml` が `id-token: write`、`NPM_TOKEN` を**含まない**（`grep -c NPM_TOKEN` = 0）、`paths` フィルタ付き
- [ ] `bun run guard` exit 0（provenance / access / 名前の検査を含む）
- [ ] `git tag` が増えていない、`npm publish` が実行されていない（`npm view @rimltempest/riml-ds-tokens` が 404 のまま）
- [ ] `bun run check` exit 0、`plans/README.md` の 007 行更新

## STOP conditions

- `fixed` のグロブが効かず列挙もできない（パッケージ名が揃っていない）→ 報告
- `attw` が Svelte / Astro パッケージで解消できないエラー → `--ignore-rules` の候補と理由を添えて報告（黙らせて進めない）
- `knip` の未使用 export が**ソースの削除**を要する → 削除せず一覧を報告（他レーンの所有）
- `size-limit` 予算超過（tokens / css）→ 数値を報告。予算を上げない
- `gen-diff` が落ちる（生成物が古い）→ `bun run gen` の結果をコミット**せず**報告（生成物は他レーンの所有）
- `mise.toml` の node が npm 11.5 未満で、`npm install -g npm@latest` を CI に書くのが嫌われる場合 → node の版更新を提案して STOP

## Maintenance notes

- 破壊的変更の定義を変えるときは ADR-0009 の表 → `api-diff.ts` → `riml-ds-release` skill の順で同時に更新
- `changesets/action` のメジャー更新は Trusted Publishing の挙動（`provenance`）を再確認
- サイズ予算を上げる PR は `docs/publishing.md` の表と `.size-limit.json` を同時に。理由を changeset に
- `1.0.0` にするとき：`api-diff` の `0.x` 例外が自動で外れる。`skills/riml-ds/SKILL.md` の対応バージョンも更新
- 見送り：`semantic-release`（changesets の方が monorepo fixed に向く）、npm org（ユーザー決定）、Renovate（Dependabot で足りる。plan 010）
