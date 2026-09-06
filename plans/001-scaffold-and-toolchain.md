# Plan 001: 足場・ツールチェーン・lint プラグインを入れ、`bun run check` が通る空の monorepo にする

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0014780..HEAD -- package.json bunfig.toml mise.toml tsconfig.base.json tsconfig.json .oxlintrc.json .oxfmtrc.json lefthook.yml vitest.config.ts .markuplintrc.json .gitignore .npmrc tools/lint tools/markuplint scripts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED（TypeScript 7 + oxlint JS プラグイン + Vitest 4 の組み合わせは noter で実績があるが、
  Bun workspaces の glob が 5 つになる点と stylelint 17 の `postcss-lit` 連携は初）
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `0014780`, 2026-09-07

## Why this matters

riml-ds は 10 個近いパッケージを 1 つの Bun monorepo で育てる。最初に「どの言語機能を禁止するか」
「どのコマンドで検査するか」「フックで何が走るか」を固定しないと、後続の plan（トークン・部品・
Storybook・公開）がそれぞれ独自の設定を持ち込み、`bun run check` が意味を失う。この plan の成果物は
**中身が空でも `bun run check` と `bun run test` が exit 0 になる monorepo** と、コーディング規約を
機械的に落とす **oxlint プラグイン `riml-ds/*`** である。qrcc / noter で確立した設定を移植し、
Web Components 向けに必要な差分（`class` の例外、`dom` lib、`.js` 拡張子 import、ESM 出力）だけを足す。

## Current state

- リポジトリ `RimlTempest/riml-ds`（ローカル `/Users/riml/orca/projects/riml-ds`）。`main` に
  文書・skill・`scripts/wt.sh`・`scripts/lanes.tsv` だけがあり、**`package.json` が無い**。
  `bun install` はまだ実行できない。
- 現在のトップレベル：`AGENTS.md CLAUDE.md DESIGN.md README.md docs/ plans/ scripts/ skills/ system/guidelines/ .claude/ .agents/ skills-lock.json .gitignore`。
- `scripts/wt.sh`（worktree 補助、既存。触らない）と `scripts/lanes.tsv`（レーン定義、既存。触らない）。
- **仕様の正**（実装前に読む）：
  - `docs/adr/0006-toolchain.md` — TypeScript 7（tsgo）/ oxlint / oxfmt / stylelint 17 / markuplint（TS6 隔離）。
    oxlint `riml-ds/*` ルール：`no-any`（builtin `typescript/no-explicit-any`）、`no-type-assertion`
    （`as const` は許可）、`no-non-null-assertion`、`no-enum`、`no-class`（`*.element.ts` だけ免除）、
    `import/no-default-export`（`*.stories.ts` と設定ファイルだけ免除）。
  - `docs/adr/0005-class-exception-for-elements.md` §影響 —
    「oxlint プラグイン `tools/lint/oxlint-plugin/index.js`：`no-class` は `filename.endsWith('.element.ts')` で免除」。
  - `docs/architecture.md` §1 — ディレクトリ配置。`tools/lint/ @riml-ds/lint`、`tools/markuplint/ (private)`。
  - `docs/testing.md` — 「Vitest は**ルートの `vitest.config.ts` 1 つ**で `projects` を分ける
    （`node` / `browser` / `storybook`）。パッケージごとに config を持たない。」
  - `CLAUDE.md` §絶対に守ること（移植元 qrcc と同文）：`any` / `as` / `!` / `class` / `enum` を書かない、
    ドメイン層で `throw` しない、依存は引数、feature 間は公開サブパス経由、失敗するテストを先に書く。
- **移植元**（読める。書き込まない）：
  - `/Users/riml/orca/projects/noter/package.json` — root scripts / devDependencies の形
  - `/Users/riml/orca/projects/noter/.oxlintrc.json` — ルール一覧（本 plan の Step 5 に必要部分を転記済み）
  - `/Users/riml/orca/projects/noter/tools/oxlint-plugin-noter/index.js` — プラグインの骨格
    （`noClass` / `noTypeAssertion` / `noEnum` / `noThrowInDomain` の 4 ルール、`export default { meta: { name }, rules }`）
  - `/Users/riml/orca/projects/noter/.oxfmtrc.json`、`bunfig.toml`、`mise.toml`、`tsconfig.base.json`、
    `lefthook.yml`、`.markuplintrc.json`、`tools/markuplint/package.json`
- **確定済みのバージョン**（2026-09-07 に npm で確認。これに固定する。`^` を付けない）：

  | パッケージ                            | 版         | 備考                                                    |
  | ------------------------------------- | ---------- | ------------------------------------------------------- |
  | typescript                            | 7.0.2      | tsgo。`tsc` バイナリ名のまま                            |
  | oxlint                                | 1.81.0     | `jsPlugins` 対応                                        |
  | oxlint-tsgolint                       | 7.0.2001   | `--type-aware` に必要                                   |
  | oxfmt                                 | 0.66.0     |                                                         |
  | lefthook                              | 2.1.12     |                                                         |
  | @types/bun                            | 1.4.0      | ローカル bun 1.4.0 に合わせる                           |
  | vitest                                | 4.1.11     | **5.0.0 は使わない**（Storybook addon-vitest の peer が `^3 || ^4`） |
  | stylelint                             | 17.15.0    |                                                         |
  | stylelint-config-standard             | 40.0.0     |                                                         |
  | stylelint-declaration-strict-value    | 1.12.1     | peer `stylelint >=16 <=17`                               |
  | postcss-lit                           | 1.4.1      | `css\`\`` タグ内の CSS を stylelint に渡す              |
  | sherif                                | 1.13.0     | workspace 依存の不整合検査                              |
  | knip                                  | 6.34.0     | plan 007 で有効化。ここでは入れない                     |
  | markuplint / @markuplint/html-parser  | 4.18.3     | `tools/markuplint` 隔離ワークスペース                   |
  | typescript（markuplint 用）           | 6.0.3      | 隔離ワークスペースのみ                                  |

- ツールチェーン：`mise` で node 26.8.1 / bun 1.4.0（ローカルで確認済み）。
- **標準デコレータの emit 確認済み**（advisor が TS 7.0.2 で spike）：`@property() accessor x = …` は
  `erasableSyntaxOnly: true` でもエラーにならず、`__esDecorate` / `__runInitializers` ヘルパを含む
  ESM を出力する。ヘルパは**ファイルごとにインライン**されるので、部品パッケージでは
  `importHelpers: true` + `tslib` で共有する（plan 004 が決める。ここでは base に入れない）。

## Commands you will need

| Purpose            | Command                                              | Expected on success                          |
| ------------------ | ---------------------------------------------------- | -------------------------------------------- |
| ツール             | `mise install`                                       | node 26.8.1 / bun 1.4.0                       |
| Install            | `bun install`                                        | exit 0、`bun.lock` 生成                       |
| Format             | `bun run fmt:check`                                  | exit 0                                        |
| Lint               | `bun run lint`                                       | `Found 0 warnings and 0 errors`               |
| CSS lint           | `bun run lint:css`                                   | exit 0（対象なしでも `--allow-empty-input`）  |
| Typecheck          | `bun run typecheck`                                  | exit 0                                        |
| Tests              | `bun run test`                                       | vitest `node` project、all pass               |
| 総合               | `bun run check`                                      | exit 0                                        |
| Hooks              | `bunx lefthook install && bunx lefthook run pre-commit` | exit 0                                     |
| Workspace 整合     | `bunx sherif`                                        | exit 0                                        |

## Suggested executor toolkit

- `.claude/skills/riml-ds-typescript/SKILL.md` — 禁止構文と `Result` の形。プラグインのテスト fixture に使う
- `.claude/skills/riml-ds-architecture/SKILL.md` — 置き場所の判断
- `.claude/skills/riml-ds-tdd/SKILL.md` — プラグインのルールは fixture → 期待エラー → 実装の順
- `docs/adr/0006-toolchain.md`、`docs/testing.md`

## Scope

**In scope** (the only files you should create or modify):

- `package.json`、`bun.lock`、`bunfig.toml`、`mise.toml`、`.npmrc`
- `tsconfig.base.json`、`tsconfig.json`
- `.oxlintrc.json`、`.oxfmtrc.json`、`lefthook.yml`、`vitest.config.ts`、`.markuplintrc.json`
- `.gitignore`（追記のみ）
- `tools/lint/**`（`package.json`、`oxlint-plugin/index.js`、`stylelint.config.js`、`browserslist`、
  `test/**/*.test.ts`、`test/fixtures/**`、`tsconfig.json`、`README.md`）
- `tools/markuplint/**`（`package.json`、`README.md`）
- `scripts/guard.sh`（新規。CI から呼ぶ不変条件の検査。plan 010 が CI に配線する）
- `scripts/affected.sh`（新規。変更パッケージの判定。plan 010 が使う）
- `plans/README.md`（自分の行だけ）

**Out of scope** (do NOT touch, even though they look related):

- `system/tokens`、`system/css`、`library/**`、`apps/**`、`e2e/**` — 後続 plan のレーン。
  **空ディレクトリも作らない**（Bun の workspaces glob は存在しないディレクトリを無視する）
- `.github/**` — plan 010（`chore/devops` レーン）
- `scripts/wt.sh`、`scripts/lanes.tsv` — 既存。変更しない
- `docs/**`、`DESIGN.md`、`README.md`、`AGENTS.md`、`CLAUDE.md`、`.claude/**`、`.agents/**`、`skills/**` — 文書と skill は advisor が管理
- `/Users/riml/orca/projects/noter`、`/Users/riml/orca/projects/qrcc2` — 読むだけ。**書き込み・git 操作をしない**

## Git workflow

- Branch: `chore/scaffold`（`scripts/lanes.tsv` の 1 行目。`bun run wt` は package.json ができるまで
  使えないので `git worktree add ../riml-ds-scaffold -b chore/scaffold` で作る）
- Conventional Commits。1 Step ごとにコミット。例：`chore(scaffold): add bun workspaces and mise pins`、
  `feat(lint): add oxlint plugin riml-ds/no-class with element exemption`
- push しない。PR を開かない。

## Steps

### Step 1: ツールチェーンの固定（`mise.toml` / `bunfig.toml` / `.npmrc`）

`mise.toml`：

```toml
# riml-ds toolchain (reproducible across worktrees / CI)
[tools]
node = "26.8.1"
bun = "1.4.0"

[env]
# Homebrew may put an older lefthook first on PATH; git hooks must use the
# version pinned in package.json so every machine and CI behave identically.
LEFTHOOK_BIN = "{{config_root}}/node_modules/lefthook-darwin-arm64/bin/lefthook"

[settings]
experimental = true
```

`bunfig.toml`：

```toml
[install]
exact = true
linkWorkspacePackages = true
# markuplint など、自分自身の位置から parser を解決するツールが isolated
# レイアウトだと解決に失敗するため hoisted を明示する。
linker = "hoisted"
```

（noter の `[test]` 節は入れない。テストランナーは Vitest。）

`.npmrc`：

```
# 公開は release.yml の Trusted Publishing（OIDC）だけ。トークンをここに書かない。
provenance=true
```

**Verify**: `mise install && bun --version && node --version` → `1.4.0` / `v26.8.1`

### Step 2: root `package.json` と `.gitignore`

```jsonc
{
  "name": "riml-ds",
  "private": true,
  "type": "module",
  "workspaces": ["system/*", "library/*", "tools/*", "apps/*", "e2e"],
  "scripts": {
    // 後続 plan が増やす。無いパッケージを参照する script はまだ書かない。
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --build",
    "lint": "oxlint --type-aware",
    "lint:fix": "oxlint --type-aware --fix",
    "lint:css": "stylelint --config tools/lint/stylelint.config.js --allow-empty-input 'system/css/src/**/*.css' 'library/elements/src/**/*.styles.ts' 'apps/storybook/**/*.css'",
    "fmt": "oxfmt .",
    "fmt:check": "oxfmt --check .",
    "check": "bun run fmt:check && bun run lint && bun run lint:css && bun run typecheck && bunx sherif",
    "guard": "./scripts/guard.sh",
    "wt": "./scripts/wt.sh",
    "prepare": "lefthook install",
    "postinstall": "bun install --cwd tools/markuplint --frozen-lockfile || bun install --cwd tools/markuplint",
    "clean": "find . -maxdepth 3 -name node_modules -type d -prune -exec rm -rf {} + && bun install"
  },
  "devDependencies": {
    "@types/bun": "1.4.0",
    "lefthook": "2.1.12",
    "oxfmt": "0.66.0",
    "oxlint": "1.81.0",
    "oxlint-tsgolint": "7.0.2001",
    "postcss-lit": "1.4.1",
    "sherif": "1.13.0",
    "stylelint": "17.15.0",
    "stylelint-config-standard": "40.0.0",
    "stylelint-declaration-strict-value": "1.12.1",
    "typescript": "7.0.2",
    "vitest": "4.1.11"
  },
  "engines": { "bun": ">=1.4.0", "node": ">=26" },
  "packageManager": "bun@1.4.0"
}
```

`.gitignore` に追記（既存行は残す）：

```
node_modules/
dist/
*.tsbuildinfo
.vitest/
coverage/
tools/markuplint/node_modules/
```

**Verify**: `bun install` → exit 0、`bun.lock` が生成される。`command ls tools/markuplint` はまだ無いので
`postinstall` は失敗するはず → **Step 4 の後にもう一度 `bun install` して exit 0 を確認する**。
ここでは `bun install --ignore-scripts` で通す。

### Step 3: TypeScript 設定

`tsconfig.base.json`（noter から移植。差分：`lib` に `dom`、`module`/`moduleResolution` を `nodenext`、
`allowImportingTsExtensions` を**外す**、`types` を**外す**、`emitDeclarationOnly` を**外す**）：

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "es2024",
    "lib": ["es2024", "dom", "dom.iterable"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "moduleDetection": "force",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "useUnknownInCatchVariables": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "erasableSyntaxOnly": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true
  }
}
```

理由（`tools/lint/README.md` にも書く）：

- `nodenext` — 公開パッケージはバンドルせず ESM で配る（ADR-0009）。`attw` が通る解決方式。
  相対 import は **`.js` 拡張子を書く**（`./button.element.js`）。`allowImportingTsExtensions` は
  emit と両立しないので使わない。
- `dom` — Web Components。Bun の型が要るパッケージ（`tools/*` の CLI）は自分の tsconfig で `"types": ["bun"]`。
- emit するかは各パッケージが決める（`outDir: dist`、`rootDir: src`）。テストだけの
  プロジェクトは `"noEmit": false` のまま `"emitDeclarationOnly": true` で参照グラフに入れる。

`tsconfig.json`（root。参照は後続 plan が足す）：

```json
{
  "files": [],
  "references": [{ "path": "./tools/lint" }]
}
```

**Verify**: Step 4 の後にまとめて `bun run typecheck` → exit 0

### Step 4: `tools/lint`（`@riml-ds/lint`）— oxlint プラグイン・stylelint 設定・browserslist

`tools/lint/package.json`：

```json
{
  "name": "@riml-ds/lint",
  "version": "0.0.0",
  "description": "riml-ds の共有 lint 設定（oxlint プラグイン / stylelint / browserslist）",
  "type": "module",
  "license": "MIT",
  "exports": {
    "./oxlint-plugin": "./oxlint-plugin/index.js",
    "./stylelint": "./stylelint.config.js",
    "./browserslist": "./browserslist"
  },
  "files": ["oxlint-plugin", "stylelint.config.js", "browserslist", "README.md"],
  "scripts": { "test": "vitest run --project node --dir tools/lint" },
  "peerDependencies": { "oxlint": ">=1.80", "stylelint": ">=17" },
  "publishConfig": { "access": "public", "provenance": true }
}
```

`tools/lint/browserslist`（ADR-0004。ビルドツールと stylelint が読む）：

```
baseline widely available
```

`tools/lint/oxlint-plugin/index.js` — noter の `tools/oxlint-plugin-noter/index.js` を移植し、
名前を `riml-ds` に、`no-class` に **ファイル名免除**を足す：

```js
const noClass = {
  meta: { /* noter と同じ docs / messages */ },
  create(context) {
    // ADR-0005: Custom Elements は class でしか定義できない。*.element.ts だけ許す。
    if (context.filename.endsWith('.element.ts')) return {}
    const report = (node) => context.report({ node, messageId: 'noClass' })
    return { ClassDeclaration: report, ClassExpression: report, TSAbstractClassDeclaration: report }
  },
}
// noTypeAssertion / noEnum / noThrowInDomain は noter と同じ本文
export default {
  meta: { name: 'riml-ds' },
  rules: {
    'no-class': noClass,
    'no-type-assertion': noTypeAssertion,
    'no-enum': noEnum,
    'no-throw-in-domain': noThrowInDomain,
  },
}
```

`context.filename` が undefined を返す oxlint 版なら `context.getFilename()` に切り替える
（両方に対応するヘルパ `const fileOf = (ctx) => ctx.filename ?? ctx.getFilename()` を置く）。

`tools/lint/stylelint.config.js`（ADR-0004 / `riml-ds-css` skill §stylelint）：

```js
/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value'],
  overrides: [
    { files: ['**/*.ts'], customSyntax: 'postcss-lit' },
  ],
  rules: {
    // 生値禁止。色・寸法・字・影・時間・角丸は var(--rd-*) だけ（ADR-0004）
    'scale-unlimited/declaration-strict-value': [
      [
        '/color$/', 'fill', 'stroke', 'background', 'background-color', 'border', 'border-color',
        'outline-color', 'box-shadow', 'font-family', 'font-size', 'font-weight', 'line-height',
        'border-radius', 'z-index', 'transition-duration', 'animation-duration',
        'transition-timing-function', 'animation-timing-function',
        '/^(padding|margin|gap|inset|top|right|bottom|left)/', 'width', 'height',
        'min-width', 'min-height', 'max-width', 'max-height',
      ],
      {
        ignoreValues: {
          '': ['inherit', 'initial', 'unset', 'revert', 'revert-layer', 'currentColor',
               'transparent', 'none', 'auto', '0', '100%', 'fit-content', 'max-content',
               'min-content', '1px', '-1px'],
          // 強制配色モード（@media (forced-colors: active)）ではシステム色だけを使う
          '/color$/': ['inherit', 'currentColor', 'transparent', 'Canvas', 'CanvasText', 'LinkText',
            'VisitedText', 'ActiveText', 'ButtonFace', 'ButtonText', 'ButtonBorder', 'Field', 'FieldText',
            'Highlight', 'HighlightText', 'SelectedItem', 'SelectedItemText', 'Mark', 'MarkText',
            'GrayText', 'AccentColor', 'AccentColorText'],
          'font-weight': ['inherit', 'bolder', 'lighter'],
          'z-index': ['auto', '-1', '0', '1'],
          'line-height': ['normal', 'inherit', '1'],
          '/^(padding|margin|gap|inset|top|right|bottom|left)/': ['auto', '0', 'inherit'],
          '/^(min-|max-)?(width|height)$/': ['auto', '0', '100%', '100vw', '100dvh', 'fit-content',
            'max-content', 'min-content', 'inherit', '100cqi', '100cqb'],
        },
        ignoreFunctions: true, // var() / light-dark() / clamp() / calc() を許す
        expandShorthand: true,
      },
    ],
    // 物理プロパティ禁止 → 論理プロパティ（RTL、ADR-0004）。width/height は inline-size/block-size に寄せる
    'property-disallowed-list': [
      'margin-left', 'margin-right', 'padding-left', 'padding-right',
      'border-left', 'border-right', 'left', 'right', 'text-align', 'float', 'width', 'height',
      'min-width', 'min-height', 'max-width', 'max-height',
    ],
    'unit-disallowed-list': [['px'], { ignoreProperties: { px: ['outline-width', 'border-width', 'outline-offset', 'border', 'outline'] } }],
    'selector-max-id': 0,
    'selector-max-specificity': '0,3,0',
    'declaration-no-important': true,
    'media-feature-range-notation': 'context',
    'color-function-notation': 'modern',
    'color-no-hex': true,
    'custom-property-pattern': ['^rd-[a-z0-9-]+$', { message: 'CSS 変数は --rd- で始める' }],
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'import-notation': 'string',
  },
  ignoreFiles: ['**/dist/**', '**/node_modules/**', '**/*.d.ts'],
}
```

`stylelint-declaration-strict-value` のルール名は **`scale-unlimited/declaration-strict-value`**（プラグインが
登録する名前。`riml-ds/` ではない）。
Step 6 のテストで「`padding-left: 4px` は落ちる」「`padding-inline: var(--rd-space-4)` は通る」を固定する。

`tools/lint/tsconfig.json`（テストだけ。emit しない）：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "emitDeclarationOnly": true, "outDir": "dist", "rootDir": ".", "types": ["bun"] },
  "include": ["test/**/*.ts"]
}
```

`tools/lint/README.md`：何を守るか、ルールごとの根拠（ADR 番号）、無効化の手順（無効化は PR で理由必須）。

**Verify**: `bun install` → exit 0（`postinstall` は Step 5 で `tools/markuplint` を作ってから通る。
ここでは `bun install --ignore-scripts`）。`node -e "import('./tools/lint/oxlint-plugin/index.js').then(m=>console.log(Object.keys(m.default.rules)))"`
→ `[ 'no-class', 'no-type-assertion', 'no-enum', 'no-throw-in-domain' ]`

### Step 5: `tools/markuplint`（TS6 隔離ランナー）と `.markuplintrc.json`

`tools/markuplint/package.json`：

```json
{
  "name": "@riml-ds/markuplint-runner",
  "version": "0.0.0",
  "private": true,
  "description": "markuplint を TypeScript 6 に固定して動かす隔離ワークスペース（ADR-0006）。riml-ds では JSX ではなく Storybook が描画した HTML（getHTML({serializableShadowRoots:true}) の出力）を検査する。",
  "type": "module",
  "scripts": {
    "lint": "markuplint --config ../../.markuplintrc.json '../../apps/storybook/rendered/**/*.html' --allow-empty-input"
  },
  "dependencies": {
    "@markuplint/html-parser": "4.18.3",
    "markuplint": "4.18.3",
    "typescript": "6.0.3"
  }
}
```

この package は **root の workspaces に含めない**（`tools/*` glob に入るので、root `package.json` の
`workspaces` を `["system/*", "library/*", "tools/*", "apps/*", "e2e", "!tools/markuplint"]` にする。
Bun が `!` 除外を受け付けない場合は STOP して報告：代替は `tools/markuplint` → `.markuplint/` への移動）。
`postinstall` が `--cwd tools/markuplint` で独立にインストールする（noter と同じ方式）。

`.markuplintrc.json`（noter から移植。JSX 関連を外し HTML のみ。`rules` は noter と同じ集合：
`require-accessible-name`、`wai-aria`（checkingValue / checkingDeprecatedProps）、`landmark-roles`、
`heading-levels`、`no-refer-to-non-existent-id`、`label-has-control`、`use-list`、`no-empty-palpable-content`、
`attr-duplication`、`permitted-contents`、`invalid-attr`（`accesskey` 禁止、`tabindex` は `-1|0`）、
`nodeRules`（`img` に `alt`、`video/audio` に `track`）。`required-h1` は **false**（story の描画断片には h1 が無い）。
`extends` は `["markuplint:recommended"]`。`excludeFiles` に `**/node_modules/**`、`**/dist/**`）。

`tools/markuplint/README.md`：なぜ隔離するか（ADR-0006）、`bun run lint:html` は plan 005 が root に足す。

**Verify**: `bun install` → exit 0（`postinstall` を含めて）。
`node tools/markuplint/node_modules/markuplint/bin/markuplint.mjs --version` → `4.18.3`

### Step 6: oxlint / oxfmt 設定

`.oxlintrc.json`（noter から移植。差分：プラグイン名、React 系プラグイン・ルールを**外す**、
`overrides` を riml-ds の配置に合わせる）：

```jsonc
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "jsPlugins": ["./tools/lint/oxlint-plugin/index.js"],
  "plugins": ["typescript", "unicorn", "oxc", "import", "promise", "vitest"],
  "categories": { "correctness": "error", "suspicious": "error", "perf": "error", "pedantic": "off", "style": "off" },
  "env": { "browser": true, "es2024": true },
  "rules": {
    "riml-ds/no-class": "error",
    "riml-ds/no-type-assertion": "error",
    "riml-ds/no-enum": "error",
    // typescript/* と eslint/* / unicorn/* / promise/* / import/* は noter の .oxlintrc.json §rules を
    // そのまま転記（react / react-perf / jsx-a11y の行は除く）
    "import/no-default-export": "error"
  },
  "overrides": [
    {
      // 純関数・ドメイン層では throw しない。失敗は Result で返す
      "files": ["library/elements/src/**/*.logic.ts", "system/tokens/src/**/*.ts", "tools/*/src/core/**/*.ts"],
      "rules": { "riml-ds/no-throw-in-domain": "error" }
    },
    {
      "files": ["**/*.test.ts", "**/*.spec.ts", "**/test/**", "**/e2e/**"],
      "rules": { "typescript/no-explicit-any": "off", "eslint/no-console": "off", "import/no-default-export": "off", "riml-ds/no-throw-in-domain": "off" }
    },
    {
      // CSF3 の story、設定ファイル、Storybook 設定、oxlint プラグインは default export が規約
      "files": ["**/*.stories.ts", "**/*.config.ts", "**/*.config.js", "**/.storybook/**", "tools/lint/**/*.js", "**/terrazzo.config.ts", "**/playwright.config.ts"],
      "rules": { "import/no-default-export": "off" }
    },
    { "files": ["scripts/**/*.ts", "tools/*/src/cli.ts"], "rules": { "eslint/no-console": "off" } }
  ],
  "ignorePatterns": ["**/dist/**", "**/*.d.ts", "**/node_modules/**", "**/src/generated/**", "**/storybook-static/**", ".agents/skills/**", ".claude/skills/**"]
}
```

`.oxfmtrc.json`：noter と同じ（`printWidth: 100`、`semi: false`、`singleQuote: true`、`trailingComma: "all"`、
`arrowParens: "always"`、`experimentalOperatorPosition: "start"`）。`ignorePatterns` は
`**/dist/**`、`**/src/generated/**`、`**/storybook-static/**`、`**/custom-elements.json`、`.agents/skills/**`、
`.claude/skills/**`、`skills-lock.json`、`e2e/__screenshots__/**`。

**Verify**: `bun run lint` → `Found 0 warnings and 0 errors`（対象が tools/lint/test だけでも exit 0）。
`bun run fmt:check` → exit 0（先に `bun run fmt` で既存 md を整形してよいが、`docs/**` と
`DESIGN.md` の**内容**は変えない。整形差分が大きければ `.oxfmtrc.json` の `ignorePatterns` に
`docs/**`、`DESIGN.md`、`plans/**`、`system/guidelines/**` を足して回避する。判断は「Markdown の
整形が意味を変えないか」。表の桁揃えだけなら適用してよい）

### Step 7: Vitest（root 1 つ、`projects`）

`vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config'

// docs/testing.md: ルート 1 つで projects を分ける。browser / storybook は plan 004 / 005 が足す。
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'tools/**/*.test.ts',
            'scripts/**/*.test.ts',
            'system/**/*.test.ts',
            'library/**/*.logic.test.ts',
          ],
          exclude: ['**/node_modules/**', '**/dist/**'],
        },
      },
    ],
    passWithNoTests: false,
  },
})
```

**Verify**: Step 8 のテストを書いた後に `bun run test` → all pass

### Step 8: プラグインと stylelint 設定のテスト（TDD：先に fixture と期待を書く）

`tools/lint/test/fixtures/` に最小ファイルを置き、**oxlint / stylelint を子プロセスで実行して
出力を検査する**（ルール実装の単体テストより、設定ファイル込みで壊れていないことを固定できる）。

`tools/lint/test/oxlint-plugin.test.ts`（`node:child_process` の `spawnSync` で
`bunx oxlint --config .oxlintrc.json --format json <fixture>` を root cwd で実行し JSON を読む）：

| fixture                                          | 期待                                                           |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `class-in-plain.ts`（`class Foo {}`）            | `riml-ds/no-class` が 1 件                                     |
| `foo.element.ts`（`export class RdFoo extends HTMLElement {}`） | `riml-ds/no-class` が **0 件**                      |
| `as-cast.ts`（`const a = x as string`）          | `riml-ds/no-type-assertion` 1 件                               |
| `as-const.ts`（`const a = ['x'] as const`）      | 0 件                                                           |
| `non-null.ts`（`a!.b`）                          | `riml-ds/no-type-assertion` 1 件（messageId noNonNull）        |
| `enum.ts`                                        | `riml-ds/no-enum` 1 件                                         |
| `library/elements/src/x/x.logic.ts` 相当の throw | **override のパスにある時だけ** `riml-ds/no-throw-in-domain`。fixture は `test/fixtures/` 配下なので `--config` を一時 JSON にして overrides の files を fixture パスに向けるか、fixture を `tools/lint/test/fixtures/library/elements/src/x/x.logic.ts` に置き root からの相対で照合する（後者を推奨） |
| `default-export.ts`                              | `import/no-default-export` 1 件                                |
| `x.stories.ts`（default export）                 | 0 件                                                           |

fixture が `.oxlintrc.json` の `ignorePatterns` に当たらないよう `**/test/**` は ignore に入れない
（上の `overrides` で test を緩めているのはそのため）。`tools/lint/test/fixtures/**` は
`tsconfig` の `include` に入れない（型エラーで typecheck を落とさない）。

`tools/lint/test/stylelint-config.test.ts`（`stylelint.lint({ code, config, codeFilename })` を
Node API で呼ぶ）：

| code                                                       | 期待                                             |
| ---------------------------------------------------------- | ------------------------------------------------ |
| `a{color:#fff}`                                            | `color-no-hex` または strict-value で error       |
| `a{color:var(--rd-color-text-default)}`                    | error 0                                          |
| `a{padding-left:4px}`                                      | `property-disallowed-list` で error              |
| `a{padding-inline:var(--rd-space-4)}`                      | error 0                                          |
| `a{--foo:1px}`                                             | `custom-property-pattern` で error               |
| `a{width:10px}`                                            | `property-disallowed-list` で error              |
| `a{inline-size:100%}`                                      | error 0                                          |
| `@media (forced-colors: active){a{border-color:ButtonText}}` | error 0（システム色は許可）                     |
| `` css`:host{color:var(--rd-color-text-default)}` `` を `x.styles.ts` として | error 0（postcss-lit が効いている） |
| `` css`:host{color:red}` `` を `x.styles.ts` として        | error ≥ 1                                        |

**Verify**: `bun run test` → 2 ファイル、全件 pass（件数はテーブル通り 9 + 10）

### Step 9: lefthook

`lefthook.yml`（noter から移植。`markuplint` ジョブは外す（対象が描画後 HTML で、コミット時には無い）。
`stylelint` ジョブを足す。`secrets` の正規表現は riml-ds 向けに `npm_[A-Za-z0-9]{36}`、
`ghp_[A-Za-z0-9]{36}`、`gho_…`、`sk-…`、`BEGIN [A-Z ]*PRIVATE KEY` に）：

```yaml
pre-commit:
  parallel: true
  jobs:
    - name: oxfmt
      glob: '*.{js,jsx,ts,tsx,mjs,cjs,json,jsonc,css,md,yaml,yml}'
      run: bunx oxfmt {staged_files}
      stage_fixed: true
    - name: oxlint
      glob: '*.{js,ts,mjs,cjs}'
      run: bunx oxlint --type-aware --deny-warnings {staged_files}
    - name: stylelint
      glob: '{system/css/**/*.css,library/elements/**/*.styles.ts,apps/storybook/**/*.css}'
      run: bunx stylelint --config tools/lint/stylelint.config.js {staged_files}
    - name: secrets
      run: |
        if git diff --cached -U0 -- ':!*.example' | grep -nE '^\+.*(BEGIN [A-Z ]*PRIVATE KEY|npm_[A-Za-z0-9]{36}|ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,})'; then
          echo "Refusing to commit what looks like a secret." >&2; exit 1
        fi
pre-push:
  parallel: false
  jobs:
    - name: typecheck
      run: bun run typecheck
    - name: test
      run: bun run test
commit-msg:
  jobs:
    - name: conventional-commit
      run: |
        head -1 "{1}" | grep -qE '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9/-]+\))?!?: .{1,}' || {
          echo "Commit message must be Conventional Commits, e.g. 'feat(elements): add rd-button'" >&2
          exit 1
        }
```

**Verify**: `bunx lefthook install && bunx lefthook run pre-commit` → exit 0。
`git commit --allow-empty -m "bad message"` → 拒否される（確認後 `git reset` 不要、コミットされていない）

### Step 10: `scripts/guard.sh` と `scripts/affected.sh`

`scripts/guard.sh`（`set -euo pipefail`。CI と手元で同じものを走らせる。各検査は
`::error file=…::` 形式で 1 行出して `exit 1`）。**この plan の時点で通る**検査だけ有効化し、
後続 plan の検査はコメントで場所を予約する：

1. `class` は `library/elements/src/**/*.element.ts` 以外に無い
   （`grep -rlE '^\s*(export\s+)?(abstract\s+)?class\s' --include='*.ts' --exclude='*.d.ts' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=generated system library tools scripts apps e2e 2>/dev/null | grep -v '\.element\.ts$'` が空）
2. `system/**` が `library/**` を import していない（`grep -rn "@riml-ds/\(elements\|react\|vue\|svelte\|astro\)" system/` が空）
3. `library/elements` の依存は `lit` と `@riml-ds/tokens` だけ（`library/elements/package.json` が
   存在するとき、`dependencies` のキーが `lit` / `tslib` / `@riml-ds/tokens` の部分集合。`jq` が無ければ `bun -e` で読む）
4. 生成物がコミットされていない（`git ls-files 'library/*/src/generated/**' '**/dist/**' 'system/tokens/dist/**'` が空）
5. `wrangler.jsonc` が存在しない（このリポジトリは Worker を持たない。誤コピー防止）
6. `.npmrc` に `_authToken` が無い
7. `docs/adr/README.md` の表の行数 = `docs/adr/[0-9]*.md` のファイル数（ADR を足したら索引も更新する）

`scripts/affected.sh`：`git diff --name-only "${BASE:-origin/main}"...HEAD` からトップ 2 階層の
パッケージディレクトリ（`system/tokens` など）を重複なく出力する。`system/tokens` か
`tsconfig.base.json` / `package.json` / `bun.lock` が変わったら `ALL` を出力する（`docs/testing.md`
「`system/tokens` が変わったら全部回す」）。

**Verify**: `bun run guard` → exit 0。`bash scripts/affected.sh` → 空行または `ALL`（main からの差分次第）

### Step 11: 総合確認

**Verify**: `bun run check` → exit 0。`bun run test` → all pass。`git status --porcelain` に
in-scope 外のファイルが無い。`command ls system library tools apps e2e 2>&1` に
`system/guidelines`、`tools/lint`、`tools/markuplint` **以外**が無い。

## Test plan

- `tools/lint/test/oxlint-plugin.test.ts` — 上表 9 件。テスト名は日本語（`it('*.element.ts では class を許す')`）
- `tools/lint/test/stylelint-config.test.ts` — 上表 10 件
- `scripts/guard.test.ts`（node project）— `guard.sh` を一時ディレクトリの偽リポジトリで走らせ、
  「`.element.ts` 以外の class で落ちる」「`_authToken` で落ちる」の 2 件（`spawnSync('bash', …)`）
- 実行：`bun run test` → 3 ファイル 21 件 pass

## Done criteria

- [ ] `mise install && bun install` exit 0（`postinstall` 込み）
- [ ] `bun run check` exit 0
- [ ] `bun run test` exit 0、21 件 pass
- [ ] `bun run guard` exit 0
- [ ] `bunx lefthook run pre-commit` exit 0、`git commit -m "bad"` が拒否される
- [ ] `node -e "import('./tools/lint/oxlint-plugin/index.js').then(m=>console.log(Object.keys(m.default.rules).length))"` → `4`
- [ ] `git ls-files | grep -c node_modules` → `0`
- [ ] `git status --porcelain` に Scope 外のパスが無い
- [ ] `plans/README.md` の 001 行が更新されている

## STOP conditions

Stop and report back (do not improvise) if:

- `oxlint --type-aware` が `oxlint-tsgolint 7.0.2001` と `typescript 7.0.2` の組で起動しない
  （版の組み合わせが噛み合わない）。noter の同じ組で動いているので、環境差を疑って報告する
- `jsPlugins` が `context.filename` も `context.getFilename()` も提供しない
- Bun が `workspaces` の `!tools/markuplint` 除外を解釈しない（代替案を報告：`.markuplint/` へ移動）
- `postcss-lit` が stylelint 17 で動かない（`customSyntax` 読み込みエラー）。代替は
  `postcss-styled-syntax` だが、ADR-0006 の記載変更が要るので advisor に返す
- `oxfmt` が Markdown を整形して `docs/**` の意味（表・コード）を壊す
- Step の検証が 2 回直しても通らない

## Maintenance notes

- 版の更新は Dependabot（plan 010）が PR にする。**`vitest` を 5 系に上げる PR は
  `@storybook/addon-vitest` の peer が `^5` を含むまで閉じる**（`plans/README.md` §見送り）
- `riml-ds/no-class` の免除は `.element.ts` の**ファイル名**だけ。ディレクトリでは判定しない。
  新しい種類の class が要るなら ADR を起こしてから `oxlint-plugin/index.js` と `guard.sh` の両方を直す
- `stylelint.config.js` の `ignoreValues` を増やすときは `test/stylelint-config.test.ts` に「通る」
  ケースを 1 つ足す。緩めた理由をコミット本文に書く
- `.oxlintrc.json` の `overrides.files` は plan 002 以降でパスが増える（`system/tokens/src`、
  `tools/*/src/core`）。該当 plan が編集するが、**ルール本体（`rules`）はここで固定**
- レビュー観点：`tsconfig.base.json` に `experimentalDecorators` / `allowImportingTsExtensions` /
  `types: ["bun"]` が**無い**こと。`package.json` の `devDependencies` に `^` が無いこと
