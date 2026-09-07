# Plan 004: `@rimltempest/riml-ds-elements` の基盤と最初の 4 部品（button / text-field / dialog / live-region）+ マークアップ契約

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat <plan-003 のマージコミット>..HEAD -- library/elements tools/cem vitest.config.ts tsconfig.json package.json .oxlintrc.json tools/lint scripts/guard.sh`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P0
- **Effort**: L
- **Risk**: MEDIUM（TC39 デコレータの emit と tslib、Vitest browser の初回セットアップ、CEM analyzer のプラグイン API、
  Lit の light DOM 描画で既存の子が保持されるかの確認）
- **Depends on**: 003
- **Category**: direction
- **Planned at**: commit `0014780`（ADR-0012 反映で `50516ae` に改訂）、2026-09-07（plan 003 のマージ後に着手する）

## Why this matters

このリポジトリの「実装」側の核。ここで決まる部品の骨格（contract / logic / element / css|styles / define の分割、
PE ティア、`:state()`、JSDoc → CEM）が以降のすべての部品と、React / Vue / Svelte / Astro ラッパー
（plan 006）の入力になる。最初の 4 部品は qrcc / noter の移行（`docs/migration.md` §3）で最初に置き換える
共通部品で、PE の 3 ティアをすべて 1 つ以上含む：**A** = button, text-field、**B** = dialog、**C** = live-region。
スキップリンクは JS 不要なので部品にしない（plan 003 の `.rd-skip-link`）。

## Current state

- plan 003 完了。`system/tokens/dist/tokens.css` と `system/css/dist/*.css`（`.rd-skip-link` 含む）がある。
  `--rd-*` 変数名は `grep '^\s*--rd-' system/tokens/dist/tokens.css` で確認する。
- `library/`、`tools/cem/` は**存在しない**。
- `vitest.config.ts`（plan 001）は `projects: [ { test: { name: 'node', … } } ]` の 1 project。**この plan で `browser` を足す**。
- `tsconfig.base.json`（plan 001）：`module`/`moduleResolution: nodenext`、`erasableSyntaxOnly: true`、
  `verbatimModuleSyntax: true`、`strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`。
  **`experimentalDecorators` は無い**（標準デコレータで書く）。`useDefineForClassFields` は既定（`true`）。
  Lit 3 の標準デコレータは **`accessor` キーワード必須**（`@property() accessor variant = 'primary'`）。
- `.oxlintrc.json`（plan 001）：`riml-ds/no-class` は `*.element.ts` を免除、`riml-ds/no-throw-in-domain` の
  override に `library/elements/src/**/*.logic.ts` が既にある。**`*.contract.ts` と `src/_shared/**` も同じ override に足す**。
- デコレータ emit の検証（着手前の spike、2026-09-07）：TS 7.0.2 + `erasableSyntaxOnly` + `"type":"module"` で
  標準デコレータは問題なく emit される。ヘルパ `__esDecorate` / `__runInitializers` が**ファイルごとにインライン**される
  （1 ファイル約 2.5 KB 非圧縮）。対策は `importHelpers: true` + 依存 `tslib`（Step 2 で計測して決める）。
- **仕様の正**（必読）：
  - `docs/adr/0012-progressive-enhancement-tiers.md` — ティア A/B/C の定義、ティア A の作り方
    （light DOM、`createRenderRoot() { return this }`、`.css`、マークアップ契約、`formAssociated` を使わない）、
    ティア B（内容は slot、`:not(:defined)`）、guard の 3 検査
  - `.claude/skills/riml-ds-element/SKILL.md` — ティア表、ファイル構成、ティア A の `*.element.ts` で守ること、命名、
    ティア C の骨格（`RdButton` 例は**旧設計**なので構造だけ参考にし、button 自体はティア A で作る）、a11y 必須実装、完了条件
  - `.claude/skills/riml-ds-css/SKILL.md` §3 ティア別の CSS 置き場、§3.1 shadow の `styles.ts` テンプレート
  - `docs/adr/0002`（Lit 唯一のソース、`index.ts` は define しない、`exports` は部品ごと）、
    `docs/adr/0005`（`class` は `*.element.ts` だけ。目安 ≤150 行、`if` ≤5）、
    `docs/adr/0008`（AAA、`:state()`、`delegatesFocus`（B/C）、ライブリージョン集約、virtual-screen-reader）
  - `system/guidelines/accessibility.md`、`system/guidelines/writing.md`（文言）
  - `docs/testing.md`：`fixture()` は `library/elements/test/fixture.ts` に 1 つ、テスト名は日本語、
    `*.logic.test.ts` → `*.logic.ts` → `*.test.ts` → `*.element.ts` の順
  - `docs/publishing.md` §サイズ予算：`…-elements/button/define`（lit 込み）**12 KB brotli**、`dialog/define` 14 KB
- バージョン（2026-09-07 に `npm view` で確認）：`lit` 3.3.3、`tslib` 2.8.1、
  `@custom-elements-manifest/analyzer` 0.11.0、`@vitest/browser-playwright` 4.1.11（vitest 4.1.11 と同版）、
  `playwright` 1.63.0、`@guidepup/virtual-screen-reader` 0.32.1、`size-limit` 13.0.3 + `@size-limit/esbuild` 13.0.3
  （brotli 計測。lit 込みの実測に esbuild を計測専用で使う）。
  着手時に `npm view <pkg> version` で再確認し、違えば新しい方を使ってこの plan の記述を更新する（マイナー差は可）。

## Commands you will need

| Purpose            | Command                                                         | Expected on success                        |
| ------------------ | --------------------------------------------------------------- | ------------------------------------------ |
| 依存追加           | `bun add -D <pkg>@<ver>`（root）/ `bun add <pkg>@<ver>`（elements） | `bun.lock` 更新                        |
| 型検査             | `bun run typecheck`                                             | exit 0                                     |
| node テスト        | `bun run test -- --project node`                                | pass                                       |
| browser テスト     | `bun run test -- --project browser`                             | pass（Chromium 起動）                      |
| Playwright 導入    | `bunx playwright install chromium`（ローカルのみ。CI は Docker）| 1 回                                       |
| CEM 生成           | `bun run gen`（root → `bun run --filter @rimltempest/riml-ds-elements gen` + registry） | `library/elements/custom-elements.json` |
| ビルド             | `bun run --filter @rimltempest/riml-ds-elements build`          | `dist/**/*.js` + `.d.ts` + `.css`          |
| サイズ             | `bunx size-limit`                                               | 予算内                                     |
| 総合               | `bun run check && bun run test && bun run guard`                | exit 0                                     |

## Suggested executor toolkit

- skill：`riml-ds-element`（必読）、`riml-ds-css`、`riml-ds-typescript`、`riml-ds-tdd`
- Context7：`/lit/lit`（`@property` 標準デコレータ、`createRenderRoot`、`static shadowRootOptions`、`ElementInternals`；
  **light DOM 描画で既存の子が残るか**を「render into light DOM」の項で確認）、
  `/open-wc/custom-elements-manifest`（analyzer の `plugins`、`analyzePhase`、カスタム JSDoc タグ）、
  `/vitest-dev/vitest`（browser mode 4.x：`browser.provider: playwright()`、`instances`）、`/guidepup/virtual-screen-reader`
- `bunx modern-web-guidance@latest search "dialog showModal focus return"`、`"form validation user-invalid"`

## Scope

**In scope**:

- `library/elements/**`（`package.json`、`tsconfig*.json`、`custom-elements.config.js`、`src/**`、`test/fixture.ts`、`README.md`）
- `tools/cem/**`（`package.json`、`tsconfig.json`、`src/plugins/jsdoc-tags.js`、`src/core/**`、`src/registry.ts`、`test/**`）
  — **`tools/cem/src/wrappers/**` は plan 006 のレーン。作らない**
- root：`vitest.config.ts`（`browser` project 追加）、`tsconfig.json`（references 追加）、`package.json`
  （`gen` スクリプト、devDeps 追加）、`.oxlintrc.json`（`no-throw-in-domain` override に 2 パス追加のみ）、
  `.size-limit.json`（**新規。plan 007 が引き継ぐ。ここでは elements の 2 行だけ**）
- `scripts/guard.sh`（ADR-0012 §影響の 3 検査を追加。`chore/scaffold` 所有だが ADR が要求。コミットメッセージに `guard:`）
- `plans/README.md`（自分の行だけ）

**Out of scope**:

- `system/**`（トークン・CSS が足りなければ STOP）
- `library/{react,vue,svelte,astro}/**`、`apps/**`、`e2e/**`、`.github/**`
- `*.stories.ts` の**中身**：この plan では **story ファイルを作らない**（Storybook は plan 005。
  ただし `index.ts`・JSDoc・`contract.ts` は plan 005 が argTypes / story render を生成する前提で完全に書く）
- `docs/**`、`.claude/skills/**`、`skills/**`

## Git workflow

- Branch: `feat/elements`（`bun run wt new feat/elements`）
- コミット単位：基盤 → fixture → `_shared/markup` → 部品 1 つずつ（contract → logic → element）→ CEM → guard → size-limit
- 例：`feat(elements): add package skeleton and vitest browser project`、`feat(elements): add markup tree renderer`、
  `feat(elements): add rd-button (tier A)`、`feat(cem): add analyzer config and jsdoc tag plugin`、`chore(guard): enforce pe tiers`
- push しない

## Steps

### Step 1: パッケージ骨格・Vitest browser・fixture

`library/elements/package.json`：

```json
{
  "name": "@rimltempest/riml-ds-elements",
  "version": "0.0.0",
  "description": "riml-ds の Web Components（Lit）。唯一のソース",
  "type": "module",
  "license": "MIT",
  "customElements": "custom-elements.json",
  "sideEffects": ["./dist/**/*.define.js", "./dist/**/*.css"],
  "exports": {
    "./button": { "types": "./dist/button/index.d.ts", "default": "./dist/button/index.js" },
    "./button/define": { "types": "./dist/button/button.define.d.ts", "default": "./dist/button/button.define.js" },
    "./button/style.css": "./dist/button/button.css",
    "./text-field": …, "./text-field/define": …, "./text-field/style.css": …,
    "./dialog": …, "./dialog/define": …, "./dialog/style.css": …,
    "./live-region": …, "./live-region/define": …,
    "./styles.css": "./dist/styles.css",
    "./custom-elements.json": "./custom-elements.json",
    "./package.json": "./package.json"
  },
  "files": ["dist", "custom-elements.json", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json && bun run scripts/copy-css.ts",
    "gen": "cem analyze --config custom-elements.config.js",
    "test": "vitest run --project browser --project node --dir library/elements"
  },
  "dependencies": { "lit": "3.3.3", "tslib": "2.8.1" },
  "peerDependencies": { "@rimltempest/riml-ds-tokens": "workspace:*" },
  "devDependencies": { "@custom-elements-manifest/analyzer": "0.11.0" },
  "publishConfig": { "access": "public", "provenance": true }
}
```

`.` エントリは**作らない**（全部品を 1 import で引く経路を用意しない。ADR-0002）。`exports` は部品を足すたびに追加する。
`scripts/copy-css.ts`：`src/**/<name>.css` を `dist/<name>/` にコピーし、`dist/styles.css` を**結合**で作る（`@import` を使わない。
plan 003 と同じ方針）。ティア C（`live-region`）に `.css` は無い（guard で検査）。

`library/elements/tsconfig.json`（`extends: ../../tsconfig.base.json`。`compilerOptions`: `rootDir: src`、`outDir: dist`、
`declaration: true`、`declarationMap: true`、`sourceMap: true`、`importHelpers: true`、`lib: ["ES2024","DOM","DOM.Iterable"]`、
`types: []`）。`include: ["src"]`、`exclude: ["src/**/*.test.ts", "src/**/*.stories.ts"]`。テスト用は
`tsconfig.test.json` で `include: ["src", "test"]`、`types: ["@vitest/browser-playwright/matchers"]`（型名は Context7 で確認）。
`tsconfig.build.json` = `tsconfig.json`（ビルドは test を除く方）。root `tsconfig.json` の references に
`./library/elements`（`tsconfig.test.json` の方。typecheck はテストも通す）。

root `vitest.config.ts` に project を追加：

```ts
{
  extends: true,
  test: {
    name: 'browser',
    include: ['library/elements/src/**/*.test.ts', 'library/elements/test/**/*.test.ts'],
    exclude: ['**/*.logic.test.ts', '**/*.contract.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),          // import { playwright } from '@vitest/browser-playwright'
      instances: [{ browser: 'chromium' }],
    },
  },
},
```

`node` project の `include` に `library/elements/src/**/*.logic.test.ts`、`library/elements/src/**/*.contract.test.ts`、
`library/elements/src/_shared/**/*.test.ts`、`tools/cem/test/**/*.test.ts` を追加。
root devDeps：`@vitest/browser-playwright@4.1.11`、`playwright@1.63.0`、`@guidepup/virtual-screen-reader@0.32.1`。
`bunx playwright install chromium`（ローカル。**CI ではやらない**。docs/testing.md）。

`library/elements/test/fixture.ts`（`as` / `!` を使わずに書く。**ティア A のテストでは `style.css` も読み込む**）：

```ts
/** define 済みのタグを含む HTML を body に挿し、Lit の初回描画を待って返す */
export async function fixtureOf<T extends HTMLElement>(ctor: new () => T, html: string): Promise<T> {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.append(host)
  const el = host.firstElementChild
  if (!(el instanceof ctor)) throw new Error(`fixtureOf: ${ctor.name} が 1 つ必要`) // test/ は domain 外。throw 可
  if (isLitLike(el)) await el.updateComplete
  return el
}
function isLitLike(el: HTMLElement): el is HTMLElement & { updateComplete: Promise<boolean> } {
  return 'updateComplete' in el && el.updateComplete instanceof Promise
}
/** ティア A/B 用：部品の style.css を <link> で 1 回だけ読み込む */
export async function loadStyle(href: string): Promise<void> { … /* 既に同 href の link があれば no-op。load を await */ }
```

呼び側：`const el = await fixtureOf(RdButton, '<rd-button><button type="button">OK</button></rd-button>')`。
`afterEach` で `document.body.replaceChildren()`。`library/elements/test/fixture.test.ts`（browser、2 件）。

**Verify**: `bun run test -- --project browser` → Chromium が起き fixture テスト 2 件 pass。`bun run typecheck` exit 0

### Step 2: デコレータ emit の計測と `importHelpers` の決定（+ light DOM 描画の確認）

`src/_spike/probe.element.ts`（**一時ファイル**。`@property() accessor a = 1` を 3 つ持つ最小 class。`createRenderRoot() { return this }`、
`render() { return html\`<p data-probe>x</p>\` }`）を作り `bun run --filter @rimltempest/riml-ds-elements build`。

（a）`dist/_spike/probe.element.js` に `import { __esDecorate, __runInitializers } from "tslib"` があること（インラインされていない）。
（b）**light DOM 描画で既存の子が残ること**：`src/_spike/probe.test.ts`（browser）で
`<rd-probe><span>keep</span></rd-probe>` → `updateComplete` 後に `span` が残り、`[data-probe]` が**末尾に追加**されている。
**残らない・順序が違うなら STOP**（ティア A の前提が崩れる。`renderBefore` の指定で直せるかを報告に含める）。

計測：root に `.size-limit.json` を作る。lit 込みを測るので `@size-limit/esbuild@13.0.3` を root devDeps に足す（計測専用）：

```json
[
  { "name": "@rimltempest/riml-ds-elements/button/define (lit 込み)", "path": "library/elements/dist/button/button.define.js", "limit": "12 KB", "brotli": true }
]
```

Step 2 時点では `path` を `dist/_spike/probe.element.js` にして一度計測し、`importHelpers` あり／なしの brotli を記録する。
基準：`probe` 単体で `tslib` ありが **+1 KB brotli 未満**なら `importHelpers: true` を採用。計測後 `path` を button に戻し、dialog 行は Step 7 で足す。
決定と数値を `library/elements/README.md` の「ビルド」節に 3 行で書く。`_spike` を削除。

**Verify**: 削除後 `git status` に `_spike` が無い。README に数値がある。(b) の結果を README に 1 行

### Step 3: `_shared`：MarkupTree・states・contract 検証

`src/_shared/markup.ts`（純関数。plan 006 の全ラッパー生成器と Storybook が使う**単一の入力**）：

```ts
export type MarkupNode =
  | { tag: string; attrs?: Record<string, string | boolean>; children?: readonly MarkupNode[]; slot?: string }
  | { text: string }
  | { prop: string }                        // props[prop] をテキストとして差し込む
/** props の値は attrs の値 '$name' / children の { prop } で参照する。未指定の $prop は属性ごと省く */
export type MarkupTree = MarkupNode
export function renderMarkup(tree: MarkupTree, props: Record<string, string | boolean | undefined>): string
export function escapeHtml(s: string): string
```

`renderMarkup` は属性値・テキストを必ずエスケープする。`true` は属性名のみ、`false`/`undefined` は省く。
`src/_shared/markup.test.ts`（node、6 件：エスケープ／boolean 属性／`$prop` 置換／未指定省略／ネスト／slot 属性）。

`src/_shared/contract.ts`：

```ts
export type Contract = {
  readonly pe: 'A' | 'B' | 'C'
  readonly roles: Readonly<Record<string, string>>   // 役割 → 子セレクタ（例 control: ':scope > input, :scope > textarea'）
  readonly required: readonly string[]               // 必須の役割
  readonly tree: MarkupTree                          // 既定のマークアップ
}
export type ContractCheck = { kind: 'ok'; found: Record<string, Element> } | { kind: 'missing'; roles: string[] }
export function checkContract(host: Element, c: Contract): ContractCheck   // DOM を読むだけ。書かない
```

`src/_shared/internals.ts`：`syncStates(internals: ElementInternals, next: ReadonlySet<string>)`（差分適用。`try/catch` で握らない）。
`src/_shared/contract.test.ts`（node、jsdom 不使用 → `checkContract` は `Element` の `querySelector` だけ使うので、
browser project にするか、ダックタイプの引数 `{ querySelector }` にして node で回す。**引数を `{ querySelector(sel: string): Element | null }` にする**。3 件）。

**Verify**: `bun run test -- --project node` → `_shared` 9 件 pass。`bun run lint` exit 0（`_shared` に `throw` が無い）

### Step 4: `tools/cem` — analyzer 設定、JSDoc タグプラグイン、registry

`library/elements/custom-elements.config.js`：

```js
import { jsdocTags } from '../../tools/cem/src/plugins/jsdoc-tags.js'
export default {
  globs: ['src/**/*.element.ts'],
  exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts', 'src/_shared/**'],
  outdir: '.',
  litelement: true,
  packagejson: true,
  plugins: [jsdocTags()],
}
```

`tools/cem/src/plugins/jsdoc-tags.js`（JS。analyzer のプラグインは `analyzePhase({ ts, node, moduleDoc })` で JSDoc タグを読む）：
class 宣言の `@status` → `status`、`@summary` → `summary`、`@pe` → `pe`（`A|B|C` 以外は `console.error` して analyzer を非 0 終了）、
`@state name - desc` → `cssStates: [{ name, description }]`（CEM 拡張。JSDoc に「ラッパー生成器は無視してよい」）、
`@dependency rd-x` → `dependsOn: ['rd-x']`。`@slot` / `@csspart` / `@cssprop` / `@event` は analyzer 標準。

`tools/cem/src/core/registry.ts`（純関数）：`buildRegistry(manifest) → Registry`：各 `customElement` について
`{ name: 'button', tag: 'rd-button', pe: 'A', status, summary, files: ['button/index.js', 'button/button.define.js', 'button/button.css'], dependsOn }`
（`files` の `.css` はティア A/B のみ）。`Manifest` 型は `custom-elements-manifest/schema.d.ts` から import。
`tools/cem/src/registry.ts`（CLI）：`library/elements/custom-elements.json` → `tools/cem/registry.json`（**コミットする**）。
root `package.json`：`"gen": "bun run --filter @rimltempest/riml-ds-elements gen && bun run tools/cem/src/registry.ts"`。

`tools/cem/package.json`（`@rimltempest/riml-ds-cem`、private、`type: module`）。`tools/cem/test/jsdoc-tags.test.ts`（node、4 件：
`status`/`summary`/`pe`/`cssStates`+`dependsOn` が出る、`@pe X` で失敗）、`tools/cem/test/registry.test.ts`（node、2 件）。

**Verify**: Step 5 の部品ができた後に `bun run gen` → `custom-elements.json` に `rd-button`、`"status": "stable"`、`"pe": "A"`

### Step 5: `rd-button`（ティア A）

順序：`button.contract.ts`（+ `.contract.test.ts`）→ `button.logic.test.ts` → `button.logic.ts` → `button.test.ts` →
`button.element.ts` / `button.css` / `button.define.ts` / `index.ts`。

`button.contract.ts`：

```ts
export const contract = {
  pe: 'A',
  roles: { control: ':scope > button, :scope > a[href]' },
  required: ['control'],
  tree: {
    tag: 'rd-button', attrs: { variant: '$variant', loading: '$loading' },
    children: [{ tag: 'button', attrs: { type: '$type' }, children: [{ prop: 'label' }] }],
  },
} as const satisfies Contract
export const markup = (props: ButtonMarkupProps) => renderMarkup(contract.tree, props)
```

`ButtonMarkupProps = { label: string; type?: 'button' | 'submit' | 'reset'; variant?: ButtonVariant; loading?: boolean }`。
`button.contract.test.ts`（node、3 件）：`markup({label:'保存', type:'submit'})` が `<rd-button><button type="submit">保存</button></rd-button>`／
`variant` 指定で属性が出る／`label` はエスケープされる。

`button.logic.ts`：`type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'`、
`computeButtonState({ variant, loading, contractOk }) → { states: ReadonlySet<string>, ariaBusy?: 'true' }`
（`states` に variant 名、`loading`、`malformed`）、`decidePress({ loading }) → { kind: 'blocked' } | { kind: 'press' }`。
**`disabled` は部品の属性にしない**：ネイティブ `<button disabled>` をそのまま使う（ADR-0008 の「aria-disabled でフォーカス可能に留める」は
利用側が `aria-disabled` を子に書く運用。`writing.md` / skill に既述が無ければ **README に 3 行**）。`type=submit` の送信はネイティブ。
`button.logic.test.ts`（node、5 件）。

`button.element.ts`：`createRenderRoot() { return this }`、`@property() accessor variant`、`@property({ type: Boolean, reflect: true }) accessor loading`、
`#internals = this.attachInternals()`（`formAssociated` 無し）、`firstUpdated` で `checkContract` → `missing` なら `console.error('[rd-button] <button> か <a href> が必要')`、
子 `<button>` に `click` リスナ（`loading` 中は `preventDefault` + `stopImmediatePropagation`、そうでなければ `rd-press` を dispatch）、
`loading` 変化で子に `aria-busy` を付け外し。`render()` は `nothing`（強化ノード無し。将来のスピナーは `render()` で末尾に足す）。
`disconnectedCallback` でリスナ解除。行数 ≤150、`if` ≤5。

`button.css`（`@layer rd.components { … }`。stylelint 対象）：`rd-button { display: inline-block; }`、
`rd-button > button, rd-button > a { min-block-size: var(--rd-sizing-target-min); min-inline-size: var(--rd-sizing-target-min); padding-inline: var(--rd-button-padding-inline, var(--rd-space-4)); border-radius: var(--rd-radius-md); border: var(--rd-border-width-default) solid transparent; font: inherit; … }`、
variant は `rd-button[variant='primary'] > button`（属性。`:state()` は `@supports selector(:state(x))` 内で `rd-button:state(primary) > button` を併記）、
`:focus-visible` はリング、`@media (forced-colors: active)` で `border-color: ButtonText`、`rd-button > button:disabled { color: GrayText }`、
`transition` は `prefers-reduced-motion: no-preference` 内。**`rd-button:not(:defined)` でも同じ見た目**（セレクタが `:defined` に依存しないので自動的に満たす）。

`button.test.ts`（browser、`loadStyle` 後、7 件）：契約 OK で `:state(malformed)` でない／子が無いと `console.error` + `:state(malformed)`／
click で `rd-press`／`loading` で click が伝播せず `aria-busy=true`／`<form>` 内 `type=submit` で `submit` イベント（ネイティブ）／
`:state(primary)`／`getComputedStyle(button).minBlockSize` が `2.75rem` 相当（CSS が当たっている）。
`button.sr.test.ts`（browser、2 件）：`button` + label／`busy`。
`button.define.ts` + `HTMLElementTagNameMap`、`index.ts`：`export { RdButton }`、`export { contract as buttonContract, markup as buttonMarkup }`、`export type { ButtonVariant, ButtonMarkupProps }`。

**Verify**: `bun run test` → button 17 件 pass。`bun run lint` / `bun run lint:css` exit 0。`wc -l button.element.ts` ≤ 150、`grep -c '\bif\b'` ≤ 5

### Step 6: `rd-text-field`（ティア A）

`text-field.contract.ts`：`roles: { label: ':scope > label', control: ':scope > input, :scope > textarea' }`、`required: ['label','control']`、
`tree`：`<rd-text-field hint=$hint error=$error><label for=$id>{label}</label><input id=$id name=$name type=$type required=$required autocomplete=$autocomplete value=$defaultValue></rd-text-field>`。
`TextFieldMarkupProps = { id: string; label: string; name: string; type?: 'text'|'email'|'url'|'tel'|'search'|'password'; required?: boolean; autocomplete?: string; defaultValue?: string; hint?: string; error?: string }`。
`id` は**呼び側が渡す**（React は `useId`、Astro は props。部品が生成しない）。`.contract.test.ts` 3 件。

`text-field.logic.ts`：`computeMessage({ validity: ValidityStateFlags, validationMessage, error }) → string`（`error` 属性が最優先。次に
ネイティブ `validationMessage`。`writing.md` の文言表で `valueMissing` / `typeMismatch` を日本語に置換）、
`computeStates({ malformed, invalid, touched, hasHint, hasError, filled })`、`computeDescribedBy({ hintId, errorId, showError })`。
`.logic.test.ts` 8 件。

`text-field.element.ts`：`createRenderRoot() { return this }`、`@property() accessor hint = ''`、`@property() accessor error = ''`、
`firstUpdated` で契約検査 → `<input>` に `input` / `blur` / `invalid` リスナ（`invalid` は `preventDefault` してネイティブ吹き出しを抑え、
インライン文言に置き換える。**JS 無し時はネイティブ吹き出しがそのまま出る = 退行しない**）、`render()` が返す強化ノード：
`<p part="hint" id=…>${hint}</p>` と `<p part="error" id=…>${message}</p>`（`aria-live` は付けない）、`updated()` で `<input>` の `aria-describedby` を
`computeDescribedBy` で更新。エラー表示は `touched`（`blur` 後、または `invalid` 発火後）以降。`value` getter/setter は `<input>` に委譲。
`checkValidity()` / `reportValidity()` も委譲。行数が 150 を超えそうなら `_shared/native-control.ts`（リスナ束ね）へ。

`text-field.css`：`rd-text-field { display: block; }`、`rd-text-field > label { display: block; margin-block-end: var(--rd-space-1); }`、
`rd-text-field > input { min-block-size: var(--rd-sizing-target-min); inline-size: 100%; border: var(--rd-border-width-default) solid var(--rd-color-border-strong); … }`、
`rd-text-field > input:user-invalid { border-color: var(--rd-color-status-danger-default); }`（**JS 無しでも動く検証表示**）、
`rd-text-field:state(invalid) > input`（`@supports selector(:state(invalid))` 内）、`rd-text-field > [part='error'] { color: var(--rd-color-status-danger-text); }`
+ 形（アイコン or 文言）で色以外の手がかり、`@supports (field-sizing: content) { rd-text-field > textarea { field-sizing: content; } }`。

`text-field.test.ts`（browser、10 件）：契約 OK／`<label>` 無しで malformed／入力で `FormData` に載る（ネイティブ）／`required` 空で
`checkValidity()` false と日本語文言／`blur` 前はエラー非表示・後は表示／`invalid` 発火でネイティブ吹き出しが抑止され `[part=error]` に文言／
`error` 属性で強制表示／`hint` が `aria-describedby` に載る／`form.reset()` で文言が消える／`:state(invalid)`。
`text-field.sr.test.ts`（2 件）：`textbox` + label + hint／invalid 時に error 文言。

**Verify**: `bun run test` → text-field 23 件 pass。`wc -l text-field.element.ts` ≤ 150

### Step 7: `rd-dialog`（ティア B）

`dialog.contract.ts`：`pe: 'B'`、`roles: { label: ':scope > [slot="label"]' }`、`required: ['label']`、
`tree`：`<rd-dialog open=$open dismissible=$dismissible><h2 slot="label">{label}</h2>{children}</rd-dialog>`（`children` は `{ prop: 'children' }` を
**生 HTML として**差し込む必要がある → `MarkupNode` に `{ raw: string }` を足す。`renderMarkup` はエスケープしない旨をコメント。**利用側が渡す信頼済み文字列限定**）。

`dialog.logic.ts`：`decideClose({ dismissible, reason })`、`computeStates({ open, malformed })`、`focusReturnTarget(opener, host)`。
`dialog.element.ts`：shadow あり（`static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true, serializable: true }`）、
`<dialog part="control" aria-labelledby="h"><div id="h" part="label"><slot name="label"></slot></div><slot></slot><slot name="actions"></slot></dialog>`。
`open` 属性（reflect）→ `updated()` で `showModal()` / `close()`、`cancel`（Esc）→ `decideClose`、backdrop click、閉じたら opener に `focus()`。
`@event rd-dismiss { reason }`。`show()` / `close(reason?)`。`@pe B`、`@dependency` 無し。

`dialog.styles.ts`（shadow。skill §3.1 の型）：`::backdrop { background: var(--rd-color-overlay-default) }`（**トークンに無ければ STOP**）、
`[part='control'] { max-inline-size: min(90vi, 60ch); border-radius: var(--rd-radius-lg); box-shadow: var(--rd-shadow-overlay); }`、
`@starting-style` は Newly → `@supports` 内、`transition` は reduced-motion 内。
`dialog.css`（light DOM。**定義前の見え方だけ**）：`rd-dialog:not(:defined) { display: block; padding: var(--rd-space-4); border: var(--rd-border-width-default) solid var(--rd-color-border-default); }`、
`rd-dialog:not(:defined) > [slot='label'] { font: var(--rd-type-heading-2-…) }`。JS 無しでは**内容が inline のセクションとして読める**（ADR-0012 ティア B）。

テスト：`.contract.test.ts` 2 件、logic 4 件、browser 8 件（`show()` で `dialog.open`／Esc → `rd-dismiss {reason:'esc'}`／`dismissible=false` で Esc 無効／
backdrop／閉じた後 opener に focus／`aria-labelledby` が slot 経由で読める／`open` 属性同期／`:state(open)`）、sr 2 件。`.size-limit.json` に dialog 行。

**Verify**: `bun run test` → dialog 16 件 pass

### Step 8: `rd-live-region`（ティア C）

ADR-0008 §6：唯一の `aria-live`。`announce(message, { politeness = 'polite' })`。`live-region.logic.ts`：`nextAnnouncement(queue, message, politeness)`
（同文言連続は末尾に nbsp を交互に付けて再読み上げ、politeness ごとに別ノード、空文字は無視）。`live-region.element.ts`：shadow 内に
`<div aria-live="polite" aria-atomic="true">` と `assertive`、`styles.ts` に visually-hidden 相当。`@pe C`、`@event rd-announce`。
**`.contract.ts` と `.css` は作らない**（ティア C。guard が「C に `.css` 無し」を検査）。
テスト：logic 4 件、browser 3 件、sr 1 件（仮想 SR が live region を読むか Context7 で確認。読まないなら `it.skip` + 理由）。

**Verify**: `bun run test` → live-region 8 件 pass

### Step 9: CEM・registry・guard・ビルド・サイズ

`bun run gen` → `custom-elements.json`（4 部品、各 `status` / `pe` / `summary` / `slots` / `cssParts` / `cssProperties` / `events` / `cssStates`）、
`tools/cem/registry.json`（4 行、`pe` 付き）。両方コミット。

`scripts/guard.sh` に ADR-0012 の 3 検査：
（a）`@pe A` の `*.element.ts` に `static styles` / `shadowRootOptions` / `attachShadow` が無く、同ディレクトリに `<name>.css` と `<name>.contract.ts` がある；
（b）`@pe C` のディレクトリに `<name>.css` が無い；
（c）`*.contract.ts` の `roles` に `input|textarea|select|button|a[href]` を含む部品は `@pe A`。
加えて既存の「`library/elements` の依存が `lit` / `tslib` / `@rimltempest/riml-ds-tokens` のみ」を確認。

`bun run --filter @rimltempest/riml-ds-elements build` → `dist/`（`.js` / `.d.ts` / `.css` / `styles.css`）。`bunx size-limit` → button ≤ 12 KB、dialog ≤ 14 KB。
超えたら（1）`importHelpers` の判断を見直す、（2）styles の重複を削る、（3）それでも超えたら **STOP**。

`library/elements/README.md`：使い方（ティア別。`define` と `style.css` の読み込み、`markup()` の使い方）、4 部品 + `.rd-skip-link` の表、
ビルドの決定（Step 2）、`disabled` の運用（Step 5）。

**Verify**: `bun run check` exit 0、`bun run test` exit 0、`bun run guard` exit 0、`bunx size-limit` exit 0、
`jq '[.modules[].declarations[]? | select(.customElement==true)] | length' library/elements/custom-elements.json` = 4

## Test plan

- node：`_shared` 9、`*.contract.test.ts` 3+3+2 = 8、`*.logic.test.ts` 5+8+4+4 = 21、`tools/cem/test` 6 → 44
- browser：fixture 2、`*.test.ts` 7+10+8+3 = 28、`*.sr.test.ts` 2+2+2+1 = 7 → 37
- 実行：`bun run test` → 全 pass（plan 003 までの件数 + 81）。CI の browser project は Docker で回す（plan 010）

## Done criteria

- [ ] `bun run test` exit 0、新規 81 件（`it.skip` は理由コメント付きで最大 1）
- [ ] `bun run check` exit 0（stylelint が `.css` と `styles.ts` の両方を検査している：わざと `color: #fff` を入れて落ちることを各 1 回確認し、戻す）
- [ ] 4 つの `*.element.ts` がそれぞれ ≤150 行、`if` ≤5
- [ ] `custom-elements.json` に 4 部品・`status` / `pe` 付き、`registry.json` に 4 行
- [ ] `package.json` の `exports`：`./<name>` ×4、`./<name>/define` ×4、`./<name>/style.css` ×3（A/B）、`./styles.css`、`./custom-elements.json`、`./package.json`。`.` 無し
- [ ] `bunx size-limit` exit 0
- [ ] `bun run guard` exit 0（ADR-0012 の 3 検査を含む）。**わざと `rd-button` に `static styles` を足して guard が落ちることを 1 回確認し、戻す**
- [ ] `*.stories.ts` が**存在しない**（plan 005）
- [ ] `plans/README.md` の 004 行が更新されている

## STOP conditions

- 標準デコレータの emit が失敗する → エラー全文を報告。`experimentalDecorators` に**逃げない**
- Step 2 (b)：light DOM 描画で既存の子が消える／順序が崩れる → 報告（`renderBefore` での回避可否を添える）
- Vitest browser が Chromium を起動できない（2 回直しても）→ 報告
- CEM analyzer 0.11.0 のプラグイン API が Context7 の記述と違い、`@pe` / `@status` が出ない
- `--rd-*` 変数が不足（`color.overlay.default`、`space.1` など）→ 一覧を報告。`system/tokens` を触らない
- `size-limit` 予算超過が (1)(2) で解消しない
- `*.element.ts` が 150 行 / `if` 5 を **2 割以上**超える設計にしかならない → 分割案を添えて報告
- `@guidepup/virtual-screen-reader` が Vitest browser 内で動かない → 報告
- `writing.md` に検証文言の表が無い → 文言案を添えて報告（勝手に決めない）

## Maintenance notes

- 部品を足す手順は `riml-ds-element` skill の通り。ティア A の exemplar は `rd-text-field`、B は `rd-dialog`、C は `rd-live-region`
- `custom-elements.json` と `registry.json` はコミットする生成物。PR で差分をレビューする。`guard.sh` に
  「`src/**/*.element.ts` が変わったのに `custom-elements.json` が変わっていない」検査を plan 010 で足す
- `MarkupTree` は plan 006 の全生成器の入力。ノード種別を足すときは `renderMarkup` のテストと plan 006 の生成器を同時に更新する
- `_shared/` に UI を置かない（純関数と `internals` 操作だけ）
- `tslib` の判断（Step 2）は部品が 10 を超えたら再計測する
- 見送り：`@lit-labs/ssr`、DSD（ティア A/B には不要。ティア C の SSR は「無くても害が無い」ので不要）、
  scoped custom element registries、`static properties` 記法（退路としてだけ）
