# Plan 011: ラッパー生成器の追随 — experimental の分離・`<select>` の `v-model`・契約専用サブパス（mcp から lit を外す）

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8dc6b72..HEAD -- tools/cem/src/wrappers tools/cem/test/wrappers library/react library/vue library/svelte library/astro library/elements/package.json tools/mcp/src e2e/frameworks e2e/react e2e/vue e2e/svelte e2e/astro`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW（生成器の変更は `bun run gen` の出力 diff で全部見える。公開 API は 0.x で minor）
- **Depends on**: 009（experimental の 4 部品が CEM にある）、010（CI が PR で `gen` の鮮度を見る）
- **Category**: correctness / architecture
- **Planned at**: commit `8dc6b72`, 2026-09-07

## Why this matters

plan 009 が experimental の部品（`rd-select` / `rd-checkbox` / `rd-disclosure` / `rd-toast`）を足したとき、
ラッパー生成器（`tools/cem/src/wrappers`）は `@status` を見ていなかったので、3 つの欠陥が生まれた：

1. **experimental が隔離されていない。** `@rimltempest/riml-ds-elements` は `./experimental/<name>` からしか export しない（ADR-0009
   「`experimental` は `@rimltempest/riml-ds-elements/experimental/*` からのみ export、semver の対象外」）のに、
   `@rimltempest/riml-ds-{react,vue,svelte}` は root の index から `RdSelect` などを stable と同じ顔で export し、astro は `./select.astro` で配る。
   利用側が experimental を使っていることに気づけず、semver 対象外の変更で壊れる。
2. **生成器が `import type … from '@rimltempest/riml-ds-elements/${name}'` を決め打ち**している。experimental 部品に名前付き型
   （`ButtonVariant` のようなもの）が付いた瞬間、存在しないサブパス `…/select` を import して型エラーになる（今は 4 部品に名前付き型が無いので偶然通っている）。
3. **Vue の `v-model` が `<select>` で効かない。** 生成する `onInput` が `event.target instanceof HTMLInputElement` のときだけ `update:modelValue` を emit する。

加えて plan 008 の申し送り：`@rimltempest/riml-ds-mcp` は使用例を作るために `@rimltempest/riml-ds-elements/button` などを import しており、
その index が Lit の class を re-export するので **mcp の単一ファイルバンドルに lit が丸ごと入る**。契約（`markup()`）だけを export する
サブパス `./<name>/contract` を elements に足せば、mcp はマークアップだけを持てる。

## Current state

`tools/cem/src/wrappers/core/common.ts`（`toWrapperSpecs`、L289–）。`status` を読んでいない：

```ts
export type WrapperSpec = {
  readonly tag: string
  readonly name: string
  readonly pascal: string
  readonly pe: PeTier
  …
  /** `@rimltempest/riml-ds-elements/<name>` から import type する名前 */
  readonly namedTypes: readonly string[]
}
…
        const tag = readString(declaration, 'tagName')
        const pe = prop(declaration, 'pe')
        if (prop(declaration, 'customElement') !== true || tag === '' || !isPeTier(pe)) {
          return []
        }
        const name = componentName(tag)
```

`tools/cem/src/core/registry.ts` L8–14 には `PeTier` と `status: string` の読み方が既にある（CEM の独自フィールド `pe` / `status` / `dependsOn`）。同じ読み方を使う。

サブパスの決め打ち（5 か所。`grep -n "riml-ds-elements/\${spec.name}" tools/cem/src/wrappers/core/*.ts`）：

```
tools/cem/src/wrappers/core/astro.ts:42    `import type { ${spec.namedTypes.join(', ')} } from '@rimltempest/riml-ds-elements/${spec.name}'`,
tools/cem/src/wrappers/core/svelte.ts:62   ? `import('@rimltempest/riml-ds-elements/${spec.name}').${text}`
tools/cem/src/wrappers/core/vue.ts:164,183 `import type { … } from '@rimltempest/riml-ds-elements/${spec.name}'`,
tools/cem/src/wrappers/core/react.ts:239,443 同上
```

`tools/cem/src/wrappers/core/vue.ts` L134–137：

```ts
        '    const onInput = (event: Event): void => {',
        `      if (event.target instanceof HTMLInputElement) {`,
        `        emit('update:modelValue', event.target.value)`,
        '      }',
```

生成物の index（`library/react/src/generated/index.ts`。`client.ts` も同じ形）は全部品を並べる：

```ts
export { RdButton } from './button.js'
export type { RdButtonProps } from './button.js'
export { RdCheckbox } from './checkbox.js'      // ← experimental が stable と同列
…
```

`library/react/package.json` の exports は `.` / `./client` / `./jsx` / `./package.json`。vue は `.` / `./types`、svelte は `.` / `./types`、
astro は `.` と `./<name>.astro` を列挙（experimental 3 つも `./select.astro` などで並ぶ）。

`library/elements/package.json` の exports は `./<name>`、`./<name>/define`、`./<name>/style.css`（A/B）、`./experimental/<name>{,/define,/style.css}`。
`./<name>` の `index.ts` は class と `markup()` を両方 re-export する（例：`library/elements/src/button/index.ts`）。

`tools/mcp/src/examples.ts` L6–8：

```ts
import { buttonMarkup } from '@rimltempest/riml-ds-elements/button'
import { dialogMarkup } from '@rimltempest/riml-ds-elements/dialog'
import { textFieldMarkup } from '@rimltempest/riml-ds-elements/text-field'
```

`tools/mcp/tsdown.config.ts` は単一ファイル（`dist/cli.js`）に `alwaysBundle: [/^@rimltempest\/riml-ds-design-md\//]`。elements は external
なので **実行時に `lit` が要る**（`tools/mcp/package.json` の `dependencies` に `@rimltempest/riml-ds-elements: workspace:*`）。

e2e の define 読み込み（`e2e/react/src/defines.ts` など）は既に `…/experimental/select/define` を読む。`e2e/frameworks/shared.ts` に select / checkbox のシナリオがある（21 件）。

## Commands you will need

| Purpose       | Command                                                  | Expected                                                |
| ------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| 生成          | `bun run gen && git status --short`                      | 生成物を commit した後は空                              |
| 生成器テスト  | `bun run --filter @rimltempest/riml-ds-cem test`         | `tools/cem/test/wrappers/*.test.ts` が pass             |
| React テスト  | `bun run --filter @rimltempest/riml-ds-react test`       | pass                                                    |
| mcp テスト    | `bun run --filter @rimltempest/riml-ds-mcp test`         | pass（34 + 追加分）                                     |
| mcp バンドル  | `bun run --filter @rimltempest/riml-ds-mcp build && grep -c 'LitElement' tools/mcp/dist/cli.js` | `0`（現状は 0 より大きい） |
| フレームワーク e2e | `bun run e2e:frameworks`                            | 21 件 + 追加分 pass                                      |
| 公開形        | `bun run release:check`                                  | exit 0（publint / attw が新しい exports を検査する）    |
| 全体          | `bun run check && bun run test && bun run guard`         | exit 0                                                  |

## Suggested executor toolkit

- skill：`.claude/skills/riml-ds-worktree/SKILL.md`、`.claude/skills/riml-ds-release/SKILL.md`（changeset の書き方）、`skills/riml-ds/SKILL.md` §3（利用側の見え方）
- 読む：`docs/adr/0009-publishing-and-versioning.md`（ライフサイクル）、`docs/adr/0002-lit-elements-and-generated-wrappers.md`、`tools/cem/test/wrappers/fixtures.ts`（テスト用 CEM の作り方）

## Scope

**In scope**:

- `tools/cem/src/wrappers/**`、`tools/cem/test/wrappers/**`
- `library/react/**`、`library/vue/**`、`library/svelte/**`、`library/astro/**`（`package.json` の exports、`src/index.ts` / `src/client.ts`、生成物）
- `library/elements/package.json`（`./<name>/contract` と `./experimental/<name>/contract` を足すだけ）、
  `library/elements/src/<name>/contract.ts` は**作らない** — 既存の `<name>.contract.ts` を exports が直接指す
- `tools/mcp/src/examples.ts`、`tools/mcp/package.json`、`tools/mcp/tsdown.config.ts`、`tools/mcp/test/**`
- `e2e/frameworks/**`、`e2e/{react,vue,svelte,astro}/**`
- `.changeset/*.md`、`.size-limit.json`（`react（button のみ）` の行はそのまま。必要なら mcp の行を足す）
- `knip.json`（新しい entry を足す必要が出たときだけ）、`plans/README.md`（自分の行だけ）

**Out of scope**:

- `library/elements/src/**`（部品のソース。契約ファイルの中身は変えない）
- `tools/cem/src/core/**`、`tools/cem/src/registry.ts`、`tools/cem/src/api-diff.ts`
- `apps/storybook/**`、`docs/**`、`skills/**`（レビュアーが `skills/riml-ds/SKILL.md` §3 に experimental の import 先を足す）
- `.github/**`

## Git workflow

- Branch: `feat/wrappers-wave2`（`RIML_DS_BASE_REF=main bash scripts/wt.sh new feat/wrappers-wave2`。`scripts/lanes.tsv` の行は既にある）
- コミット例：`fix(cem): read @status and emit experimental subpaths in wrappers`、`feat(react): export experimental components from ./experimental`、
  `fix(vue): emit update:modelValue for select and textarea`、`feat(elements): add ./<name>/contract subpaths`、`refactor(mcp): build examples from contract subpaths`
- push しない

## Steps

### Step 1: `WrapperSpec` に `status` と `subpath` を足す（生成器のテストから）

`tools/cem/test/wrappers/common.test.ts` に **先に**テストを書く：`fixtures.ts` の CEM に `status: 'experimental'` の宣言を 1 つ足し、
`toWrapperSpecs` の結果が `status === 'experimental'`、`subpath === 'experimental/<name>'` を持つこと、stable は `subpath === '<name>'` であること。
`status` が無い／未知の文字列なら `'stable'` 扱い（CEM は外から来るデータ。`registry.ts` と同じ寛容さ）。

実装：`WrapperSpec` に `readonly status: 'experimental' | 'stable' | 'deprecated'` と `readonly subpath: string` を追加。
5 か所の `@rimltempest/riml-ds-elements/${spec.name}` を `…/${spec.subpath}` に置換（`grep` が 0 件になる）。

**Verify**: `bun run --filter @rimltempest/riml-ds-cem test` pass。`bun run gen && git status --short` → 生成物に差分なし
（名前付き型を持つ experimental 部品はまだ無いので、import パスの変更は出力に現れない）。

### Step 2: experimental を別サブパスに出す

各生成器で `specs` を `stable`（+ `deprecated`）と `experimental` に分け、**index を 2 つ**出す：

| fw     | stable                                   | experimental                                             | package.json exports                         |
| ------ | ---------------------------------------- | -------------------------------------------------------- | -------------------------------------------- |
| react  | `generated/index.ts`、`generated/client.ts` | `generated/experimental.ts`、`generated/client/experimental.ts`（`'use client'`） | `./experimental`、`./client/experimental`（`src/experimental.ts` / `src/client-experimental.ts` が re-export。`src/index.ts` / `src/client.ts` と同じ形） |
| vue    | `generated/index.ts`                     | `generated/experimental.ts`                              | `./experimental`。`plugin.ts` は `rdComponents`（`generated/index.ts`）を全部 `app.component()` するので、index を分ければ自動で **stable だけ**になる。experimental は `rdExperimentalComponents` を `./experimental` から出し、利用側が個別に登録する |
| svelte | `generated/index.js`                     | `generated/experimental.js`                              | `./experimental`（`svelte` 条件付き）。`elements.d.ts`（型）は全部品のまま |
| astro  | `./<name>.astro`                         | `./experimental/<name>.astro`（`src/generated/experimental/<name>.astro`） | 列挙を experimental は `./experimental/<name>.astro` に変える。integration の `define` オプションは既に `'experimental/select'` を受ける形 |

`jsx.ts`（React の IntrinsicElements）と svelte / vue の `elements.d.ts` は **全部品**を持ち続ける（型は害が無い。タグを直接書く利用者のため）。

生成器のテスト（`react.test.ts` / `vue.test.ts` / `svelte.test.ts` / `astro.test.ts`）に「experimental 部品は root index に現れず、experimental index に現れる」を各 1 件。

**Verify**: `bun run gen && git status --short` → `library/*/package.json` と `src/{experimental,client-experimental}.ts` 以外に差分なし
（生成物は gitignore）。`bun run build`（library/*）exit 0。`bun run release:check` exit 0（publint / attw が `./experimental` を解決する）。
`node -e "import('@rimltempest/riml-ds-react').then(m => console.log('RdSelect' in m))"` が **false**、`…/experimental` で **true**
（`library/react` の dist で確認。`bun -e` でも良い）。

### Step 3: Vue の `onInput`

`tools/cem/src/wrappers/core/vue.ts` L134–137 を、`HTMLInputElement` / `HTMLSelectElement` / `HTMLTextAreaElement` のどれかなら `value` を emit するように変える
（`instanceof` を 3 回書く。共通の親 `HTMLElement` で `'value' in target` は型が通らないので使わない）。
`vue.test.ts` に「controlTag が `select` のとき生成コードが `HTMLSelectElement` を含む」を 1 件。
`e2e/frameworks/shared.ts` の Vue シナリオに「select を選ぶと `v-model` の値が変わる」を 1 件足す（React / Svelte / Astro は対象外。既存の text-field の `v-model` シナリオを写す）。

**Verify**: `bun run gen`、`bun run e2e:frameworks` → 22 件 pass。

### Step 4: elements に契約専用サブパス、mcp から lit を外す

`library/elements/package.json` の exports に、契約を持つ部品（ティア A/B：button / text-field / dialog / select / checkbox / disclosure）ごとに
`./<name>/contract`（experimental は `./experimental/<name>/contract`）を足す。値は `{ types: './dist/<name>/<name>.contract.d.ts', default: './dist/<name>/<name>.contract.js' }`
の形（既存の `./<name>` の書き方に揃える。experimental のパスは `./experimental/<name>` の値を見て同じディレクトリ構成にする）。
`.contract.ts` は `_shared/markup.ts` / `_shared/contract.ts` と `.logic.ts` の型だけを import し、`lit` を import しない（`grep -L lit library/elements/src/*/*.contract.ts` で確認）。

`tools/mcp/src/examples.ts` の 3 つの import を `…/button/contract` などに変え、**select / checkbox / disclosure の使用例も足す**
（`…/experimental/<name>/contract` から。props は各 `.contract.ts` の型に従う。toast は契約が無いので例は `<rd-toast>` の空タグと `show()` の説明だけ、
`tools/mcp/src/core/elements.ts` のティア C の扱いに合わせる）。
`tools/mcp/tsdown.config.ts` の `alwaysBundle` に `/^@rimltempest\/riml-ds-elements\//` を足し、`tools/mcp/package.json` の `dependencies` から
`@rimltempest/riml-ds-elements` を **`devDependencies` に移す**（バンドルに入るので実行時依存でなくなる）。`lit` が transitively 入っていないことを
`grep -c 'LitElement' tools/mcp/dist/cli.js` = 0 で確認。knip が elements を未使用と言うなら `knip.json` の `tools/mcp` entry を直す。

`tools/mcp/test` に「examples が 7 部品分ある（toast を含む）」「`get_element('rd-select')` の React 例が `RdSelect` を `@rimltempest/riml-ds-react/experimental` から import している」を足す
（`tools/mcp/src/core/elements.ts` の `frameworkExamples` が import 文を組んでいるなら、`status` で import 元を切り替える。組んでいなければ例の文字列だけ直す）。

**Verify**: `bun run --filter @rimltempest/riml-ds-mcp build && grep -c 'LitElement' tools/mcp/dist/cli.js` → `0`。
`bun run --filter @rimltempest/riml-ds-mcp test` pass。`echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"x","version":"0"}}}' | node tools/mcp/dist/cli.js | head -c 300`
が `serverInfo` を返す。`bun run release:check` exit 0。

### Step 5: changeset と仕上げ

`.changeset/wrappers-experimental.md`：`@rimltempest/riml-ds-react` / `-vue` / `-svelte` / `-astro` **minor**（experimental 部品の import 先が
`./experimental` に移る。0.x なので minor で破壊を入れる）。`.changeset/elements-contract-subpath.md`：`@rimltempest/riml-ds-elements` minor。
`.changeset/mcp-no-lit.md`：`@rimltempest/riml-ds-mcp` patch（Vue の `v-model` 修正は react 等と同じ changeset に 1 行）。

**Verify**: `bun run check && bun run test && bun run guard && bun run release:check` すべて exit 0。`bun run gen && git status --short` 空。

## Test plan

- `tools/cem/test/wrappers/common.test.ts` +2、各 fw の test +1（計 +6）、`vue.test.ts` +1
- `tools/mcp/test` +2
- `e2e/frameworks` +1（Vue select `v-model`）
- 既存テスト（470 + 1 skipped）が 1 件も落ちない

## Done criteria

- [ ] `grep -rn "riml-ds-elements/\${spec.name}" tools/cem/src` = 0 件
- [ ] `library/react`：`RdSelect` が `.` から出ず `./experimental` から出る（Step 2 の node ワンライナー）。vue / svelte / astro も同様
- [ ] `bun run e2e:frameworks` 22 件 pass
- [ ] `grep -c 'LitElement' tools/mcp/dist/cli.js` = 0、`tools/mcp/package.json` の `dependencies` に `@rimltempest/riml-ds-elements` が無い
- [ ] `bun run gen && git status --short` 空、`bun run release:check` exit 0、`bun run test` 470 + 追加分 pass
- [ ] changeset 3 件、`plans/README.md` の 011 行更新

## STOP conditions

- `.contract.ts` のどれかが `lit` を import している（`grep -l "from 'lit" library/elements/src/*/*.contract.ts` が非空）→ 契約の中身は out of scope。報告
- attw が `./experimental` や `./<name>/contract` を解決できず、`--exclude-entrypoints` 以外に逃げ道が無い → 報告（`scripts/release-check.sh` は feat/release 所有）
- Vue プラグインの登録対象を stable だけにすると e2e/vue が落ちる（experimental の登録を e2e 側で足しても直らない）→ 報告
- `tsdown` の `alwaysBundle` で elements を取り込むと `lit` も一緒に入ってしまい、契約サブパス経由でも `LitElement` が消えない → 報告（import 経路を貼る）

## Maintenance notes

- 部品を experimental → stable に上げるときは、elements 側の exports を `./<name>` に移すのと同時に **`bun run gen` を回すだけ**でラッパーの index が移る。
  ただし ADR-0009 のとおり experimental のパスを 1 メジャー残すので、elements 側は両方の exports を持つ期間がある（生成器は `status` だけを見る）
- 生成器に新しい import 先を足すときは `spec.subpath` を使う。`spec.name` を直接パスに使わない
- mcp が elements から読むのは契約（`markup()`）だけ。class や `define` を import しないこと（バンドルに lit が戻る）。`grep -c 'LitElement' dist/cli.js` = 0 を release:check に足すかは plan 012 以降で判断
