# Plan 004: `@rimltempest/riml-ds-elements` の基盤と最初の 5 部品（button / text-field / live-region / skip-link / dialog）

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat <plan-003 のマージコミット>..HEAD -- library/elements tools/cem vitest.config.ts tsconfig.json package.json .oxlintrc.json tools/lint`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P0
- **Effort**: L
- **Risk**: MEDIUM（TC39 デコレータの emit と tslib、Vitest browser の初回セットアップ、CEM analyzer のプラグイン API）
- **Depends on**: 003
- **Category**: direction
- **Planned at**: commit `0014780`, 2026-09-07（plan 003 のマージ後に着手する）

## Why this matters

このリポジトリの「実装」側の核。ここで決まる部品の骨格（logic / element / styles / define の分割、
`ElementInternals`、`:state()`、JSDoc → CEM）が以降のすべての部品と、React / Vue / Svelte / Astro
ラッパー（plan 006）の入力になる。最初の 5 部品は qrcc / noter の移行（`docs/migration.md` §3）で
最初に置き換える共通部品であり、a11y の型（ボタン・テキスト入力・ライブリージョン・スキップリンク・
モーダル）を 1 つずつ代表する。

## Current state

- plan 003 完了。`system/tokens/dist/tokens.css` と `system/css/dist/*.css` がある。
  `--rd-*` 変数名は `grep '^\s*--rd-' system/tokens/dist/tokens.css` で確認する。
- `library/`、`tools/cem/` は**存在しない**。
- `vitest.config.ts`（plan 001）は `projects: [ { test: { name: 'node', … } } ]` の 1 project。**この plan で `browser` を足す**。
- `tsconfig.base.json`（plan 001）：`module`/`moduleResolution: nodenext`、`erasableSyntaxOnly: true`、
  `verbatimModuleSyntax: true`、`strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`。
  **`experimentalDecorators` は無い**（標準デコレータで書く）。`useDefineForClassFields` は既定（`true`）。
  Lit 3 の標準デコレータは **`accessor` キーワード必須**（`@property() accessor variant = 'primary'`）。
- `.oxlintrc.json`（plan 001）：`riml-ds/no-class` は `*.element.ts` を免除、`riml-ds/no-throw-in-domain` の
  override に `library/elements/src/**/*.logic.ts` が既にある。
- デコレータ emit の検証（plan 着手前の spike、2026-09-07）：TS 7.0.2 + `erasableSyntaxOnly` + `"type":"module"` で
  標準デコレータは問題なく emit される。ヘルパ `__esDecorate` / `__runInitializers` が**ファイルごとにインライン**される
  （1 ファイル約 2.5 KB 非圧縮）。対策は `importHelpers: true` + 依存 `tslib`（Step 2 で計測して決める）。
- **仕様の正**（必読）：
  - `.claude/skills/riml-ds-element/SKILL.md` — ファイル構成、命名、`*.element.ts` の骨格（`RdButton` 例）、
    a11y 必須実装、story 8 種、完了条件
  - `.claude/skills/riml-ds-css/SKILL.md` §3 `styles.ts` テンプレート（`:host`、`[part='control']`、
    `@supports selector(:state(x))` フォールバック、forced-colors、reduced-motion）
  - `docs/adr/0002`（Lit 唯一のソース、`index.ts` は define しない、`exports` は部品ごと）、
    `docs/adr/0005`（`class` は `*.element.ts` だけ。目安 ≤150 行、`if` ≤5）、
    `docs/adr/0008`（AAA、`ElementInternals`、`:state()`、`labelledBy: Element[]`、`delegatesFocus`、
    ライブリージョン集約、virtual-screen-reader）
  - `system/guidelines/accessibility.md`、`system/guidelines/writing.md`（文言）
  - `docs/testing.md`：`fixture()` は `library/elements/test/fixture.ts` に 1 つ、テスト名は日本語、
    `*.logic.test.ts` → `*.logic.ts` → `*.test.ts` → `*.element.ts` の順
  - `docs/publishing.md` §サイズ予算：`@rimltempest/riml-ds-elements/button/define`（lit 込み）**12 KB brotli**、`dialog/define` 14 KB
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
| CEM 生成           | `bun run gen`（root → `bun run --filter @rimltempest/riml-ds-elements gen`） | `library/elements/custom-elements.json`    |
| ビルド             | `bun run --filter @rimltempest/riml-ds-elements build`                      | `library/elements/dist/**/*.js` + `.d.ts`  |
| サイズ             | `bunx size-limit`                                               | 予算内                                     |
| 総合               | `bun run check && bun run test`                                 | exit 0                                     |

## Suggested executor toolkit

- skill：`riml-ds-element`（必読）、`riml-ds-css`、`riml-ds-typescript`、`riml-ds-tdd`
- Context7：`/lit/lit`（`@property` 標準デコレータ、`static shadowRootOptions`、`ElementInternals`）、
  `/open-wc/custom-elements-manifest`（analyzer の `plugins`、`@status` などカスタムタグの拾い方）、
  `/vitest-dev/vitest`（browser mode 4.x：`browser.provider: playwright()`、`instances`）、
  `/guidepup/virtual-screen-reader`
- `bunx modern-web-guidance@latest search "form-associated custom element"`、`"dialog showModal focus return"`

## Scope

**In scope**:

- `library/elements/**`（`package.json`、`tsconfig.json`、`custom-elements.config.js`、`src/**`、`test/fixture.ts`、`README.md`）
- `tools/cem/**`（`package.json`、`tsconfig.json`、`src/plugins/status-tag.js`、`src/core/**`、`src/registry.ts`、`test/**`）
  — **`tools/cem/src/wrappers/**` は plan 006 のレーン。作らない**
- root：`vitest.config.ts`（`browser` project 追加）、`tsconfig.json`（references 追加）、`package.json`
  （`gen` スクリプト、devDeps 追加）、`.size-limit.json`（**新規。plan 007 が引き継ぐ。ここでは elements の 2 行だけ**）
- `plans/README.md`（自分の行だけ）

**Out of scope**:

- `system/**`（トークン・CSS が足りなければ STOP）
- `library/{react,vue,svelte,astro}/**`、`apps/**`、`e2e/**`、`.github/**`
- `*.stories.ts` の**中身**：この plan では **story ファイルを作らない**（Storybook は plan 005。
  ただし `index.ts` と JSDoc は plan 005 が argTypes を生成する前提で完全に書く）
- `docs/**`、`.claude/skills/**`、`skills/**`

## Git workflow

- Branch: `feat/elements`（`bun run wt add feat/elements`）
- コミット単位：基盤 → fixture → 部品 1 つずつ（logic → element）→ CEM → size-limit
- 例：`feat(elements): add package skeleton and vitest browser project`、`feat(elements): add rd-button`、
  `feat(cem): add analyzer config and @status plugin`
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
  "sideEffects": ["./dist/**/define.js"],
  "exports": {
    "./button": { "types": "./dist/button/index.d.ts", "default": "./dist/button/index.js" },
    "./button/define": { "types": "./dist/button/button.define.d.ts", "default": "./dist/button/button.define.js" },
    "./text-field": …, "./text-field/define": …,
    "./live-region": …, "./live-region/define": …,
    "./skip-link": …, "./skip-link/define": …,
    "./dialog": …, "./dialog/define": …,
    "./custom-elements.json": "./custom-elements.json",
    "./package.json": "./package.json"
  },
  "files": ["dist", "custom-elements.json", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "gen": "cem analyze --config custom-elements.config.js",
    "test": "vitest run --project browser --project node --dir library/elements"
  },
  "dependencies": { "lit": "3.3.3", "tslib": "2.8.1" },
  "peerDependencies": { "@rimltempest/riml-ds-tokens": "workspace:*" },
  "publishConfig": { "access": "public", "provenance": true }
}
```

`.` エントリは**作らない**（全部品を 1 import で引く経路を用意しない。ADR-0002）。`exports` の各部品は
Step 4 以降で部品を足すたびに追加する。

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
    include: ['library/elements/src/**/*.test.ts'],
    exclude: ['**/*.logic.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),          // import { playwright } from '@vitest/browser-playwright'
      instances: [{ browser: 'chromium' }],
    },
  },
},
```

`node` project の `include` に `library/elements/src/**/*.logic.test.ts`、`tools/cem/test/**/*.test.ts` を追加。
root devDeps：`@vitest/browser-playwright@4.1.11`、`playwright@1.63.0`、`@guidepup/virtual-screen-reader@0.32.1`。
`bunx playwright install chromium`（ローカル。**CI ではやらない**。docs/testing.md）。

`library/elements/test/fixture.ts`（`as` / `!` を使わずに書く）：

```ts
/** define 済みのタグを含む HTML を body に挿し、Lit の初回描画を待って返す */
export async function fixtureOf<T extends HTMLElement>(
  ctor: new () => T,
  html: string,
): Promise<T> {
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
```

呼び側：`const el = await fixtureOf(RdButton, '<rd-button>OK</rd-button>')`（`RdButton` 型で返る）。
`afterEach` で `document.body.replaceChildren()`。

`library/elements/test/fixture.test.ts`（browser）：`fixtureOf` が define 済み要素を返し、`updateComplete` 後である。

**Verify**: `bun run test -- --project browser` → Chromium が起き fixture テスト 1 件 pass。`bun run typecheck` exit 0

### Step 2: デコレータ emit の計測と `importHelpers` の決定

`src/_spike/probe.element.ts`（**一時ファイル**。`@property() accessor a = 1` を 3 つ持つ最小 class）を作り
`bun run --filter @rimltempest/riml-ds-elements build`。`dist/_spike/probe.element.js` を確認：

- `importHelpers: true` で `import { __esDecorate, __runInitializers } from "tslib"` になっていること（インラインされていない）
- `tslib` は `dependencies`（ESM 解決で `tslib/tslib.es6.mjs` が選ばれる。`node -e "import('tslib').then(m=>console.log(Object.keys(m).length))"`）

計測：root に `.size-limit.json` を作る。lit 込みを測るので `@size-limit/file` ではなく
`@size-limit/esbuild@13.0.3` を root devDeps に足す（esbuild は**計測にだけ**使う。配布はバンドルしない）：

```json
[
  { "name": "@rimltempest/riml-ds-elements/button/define (lit 込み)", "path": "library/elements/dist/button/button.define.js", "limit": "12 KB", "brotli": true }
]
```

Step 2 の時点では button が無いので、`path` を `dist/_spike/probe.element.js` にして一度計測し、`importHelpers` あり／なしの
brotli サイズを記録する。判断基準：`probe` 単体で `tslib` ありが **+1 KB brotli 未満**なら `importHelpers: true` を採用
（2 部品以上を同時に読む利用側では `tslib` 共有の方が小さくなる）。計測後 `path` を button に戻し、dialog 行は Step 8 で足す。
決定と数値を `library/elements/README.md` の「ビルド」節に 3 行で書く。`_spike` を削除。

**Verify**: 削除後 `git status` に `_spike` が無い。README に数値がある

### Step 3: `tools/cem` — analyzer 設定と `@status` プラグイン、registry

`tools/cem/package.json`（`@rimltempest/riml-ds-cem`、private、`type: module`、devDeps `@custom-elements-manifest/analyzer@0.11.0`）。
`bin` は作らない（`cem` は elements 側の devDeps として直接呼ぶ方が単純 → **`library/elements` の devDeps に
`@custom-elements-manifest/analyzer@0.11.0` を置き**、`tools/cem` はプラグインと registry 生成器だけ持つ）。

`library/elements/custom-elements.config.js`：

```js
import { statusTag } from '../../tools/cem/src/plugins/status-tag.js'
export default {
  globs: ['src/**/*.element.ts'],
  exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts'],
  outdir: '.',
  litelement: true,
  packagejson: true,
  plugins: [statusTag()],
}
```

`tools/cem/src/plugins/status-tag.js`（JS。analyzer のプラグインは `analyzePhase({ ts, node, moduleDoc })` で
JSDoc タグを読む。**`@status` / `@summary` / `@state` を class 宣言に `status` / `summary` / `cssStates` として付ける**。
`@state` は CEM 標準に無いので `cssStates: [{ name, description }]` として独自拡張し、JSDoc に「CEM 拡張。ラッパー生成器は
無視してよい」）。`@slot` / `@csspart` / `@cssprop` / `@event` は analyzer 標準。

`tools/cem/src/core/registry.ts`（純関数）：`buildRegistry(manifest: Manifest): Registry` — 各 `customElement` について
`{ name: 'button', tag: 'rd-button', status, summary, files: ['button/index.js','button/button.define.js'], dependsOn: [] }`。
`dependsOn` は JSDoc `@dependency rd-live-region` タグから（dialog → live-region。**このタグも status-tag.js で拾う**）。
`Manifest` 型は `custom-elements-manifest/schema.d.ts`（analyzer の依存 `custom-elements-manifest` パッケージ）から import。
`tools/cem/src/registry.ts`（CLI）：`library/elements/custom-elements.json` → `tools/cem/registry.json`（**コミットする**。
plan 008 の MCP / Pages が配る）。root `package.json`：`"gen": "bun run --filter @rimltempest/riml-ds-elements gen && bun run tools/cem/src/registry.ts"`。

`tools/cem/test/status-tag.test.ts`（node）：最小 `.element.ts` を `tmpdir` に書き analyzer の `create()` API で解析 →
`status`、`summary`、`cssStates`、`dependsOn` が出る（3 件）。`tools/cem/test/registry.test.ts`：手書き manifest → registry（2 件）。

**Verify**: Step 4 の部品ができた後に `bun run gen` → `library/elements/custom-elements.json` に `rd-button` と `"status": "stable"`

### Step 4: `rd-button`

順序（docs/testing.md）：`button.logic.test.ts` → `button.logic.ts` → `button.test.ts` → `button.element.ts` / `button.styles.ts` / `button.define.ts` / `index.ts`。

`button.logic.ts`（純関数のみ。`throw` 禁止）：

- `type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'`
- `computeButtonState({ variant, loading, disabled, hasLabel }) → { states: ReadonlySet<string>, ariaDisabled?: 'true', ariaBusy?: 'true' }`
  （`states` に `variant` 名、`loading`、`disabled`、`unlabeled`）
- `decidePress({ loading, disabled, type }) → { kind: 'blocked' } | { kind: 'press' } | { kind: 'submit' } | { kind: 'reset' }`
- `syncStates(internals: ElementInternals, next: ReadonlySet<string>)` は `src/_shared/internals.ts`（`states.add/delete` の差分適用。
  `internals.states` 未対応ブラウザは `docs/baseline.md` で Widely → フォールバック不要。**`try/catch` で握らない**）

`button.logic.test.ts`（node、7 件）：variant が state に出る／loading で `ariaBusy` と `blocked`／disabled で `ariaDisabled` と `blocked`／
`type=submit` で `submit`／label 無しで `unlabeled`／`decidePress` の 4 分岐。

`button.element.ts`：skill §3 の骨格をそのまま。加えて `firstUpdated` でスロットの `assignedNodes({flatten:true})` の
テキストが空なら `console.error('[rd-button] accessible name is required')`（`hasLabel` は `slotchange` で再計算）。
`aria-disabled` のとき `<button>` に `disabled` を**付けない**（フォーカス可能のまま。ADR-0008）。`formAssociated = true` で
`type=submit` は `this.#internals.form?.requestSubmit()`、`reset` は `form?.reset()`。行数 ≤150、`if` ≤5（`decidePress` に寄せる）。

`button.styles.ts`：`riml-ds-css` skill §3 テンプレート。`:host { display: inline-block; }`、`[part='control']`：
`min-block-size: var(--rd-sizing-target-min); min-inline-size: var(--rd-sizing-target-min); padding-inline: var(--rd-button-padding-inline, var(--rd-space-4)); border-radius: var(--rd-radius-md); border: var(--rd-border-width-default) solid transparent; font: inherit; color: …; background: …`。
variant は `:host(:state(primary)) [part='control']`（`@supports selector(:state(x))` の外は `:host([variant='primary'])`）。
`:focus-visible` は `outline: var(--rd-focus-ring-width) solid var(--rd-focus-ring-color); outline-offset: var(--rd-focus-ring-offset)`。
`@media (forced-colors: active)` で `border-color: ButtonText`、`:state(disabled)` は `color: GrayText`。
`transition` は `@media (prefers-reduced-motion: no-preference)` 内のみ。**stylelint（postcss-lit）が `.ts` 内の `css\`\`` を検査する**。

`button.test.ts`（browser、8 件）：描画されて `role=button` の内側要素がある／`el.focus()` で内側に focus（delegatesFocus）／
click で `rd-press`／loading 中は click しても `rd-press` が出ず `aria-busy=true`／disabled で `aria-disabled=true` かつ `tabIndex` で
フォーカス可能／`:state(loading)` が `el.matches(':state(loading)')` で true／`<form>` 内 `type=submit` で `submit` イベント／
ラベル無しで `console.error` が呼ばれ `:state(unlabeled)`（`vi.spyOn(console,'error')`）。

`button.sr.test.ts`（browser、`@guidepup/virtual-screen-reader`、2 件）：`virtual.start({ container })` → `virtual.next()` の
`lastSpokenPhrase()` に `button` と label が含まれる／loading で `busy` が含まれる。

`button.define.ts`：`import { RdButton } from './button.element.js'; customElements.define('rd-button', RdButton)`
＋ `declare global { interface HTMLElementTagNameMap { 'rd-button': RdButton } }`。`index.ts`：`export { RdButton } from './button.element.js'; export type { ButtonVariant } from './button.logic.js'`。

**Verify**: `bun run test` → button 17 件 pass。`bun run lint` / `bun run lint:css` exit 0。`wc -l button.element.ts` ≤ 150、
`grep -c '\bif\b' button.element.ts` ≤ 5

### Step 5: `rd-live-region`

ADR-0008 §6：唯一の `aria-live`。API：`announce(message: string, { politeness?: 'polite' | 'assertive' } = {})`。
`live-region.logic.ts`：`nextAnnouncement(queue, message, politeness, now)` — 同じ文言の連続は末尾に ` ` を交互に付けて
再読み上げさせる（SR が同一テキストを無視する対策）、`politeness` ごとに別ノード。`live-region.element.ts`：shadow 内に
`<div aria-live="polite" aria-atomic="true">` と `assertive` の 2 つ、`:host { position: absolute; … }` は `.rd-visually-hidden` 相当を
`styles.ts` に持つ（light DOM のクラスに依存しない）。**モジュールスコープのシングルトンは作らない**（利用側が 1 つ置く）。
`@event rd-announce`（`detail: { message, politeness }`。テスト・ログ用）。

テスト：logic 4 件（交互 nbsp、politeness 振り分け、空文字は無視、連続でない同文言は付けない）、browser 3 件
（`announce` でノードのテキストが変わる／assertive が別ノード／`rd-announce` 発火）、sr 1 件（`announce('保存しました')` 後に
`lastSpokenPhrase()` に含まれる — 仮想 SR が live region を読むか Context7 で確認。読まないなら sr テストは `it.skip` に理由コメント）。

**Verify**: `bun run test` → live-region 8 件 pass

### Step 6: `rd-skip-link`

`href`（必須。`#main` 既定）、`label` 既定 slot（既定文言 `本文へ移動` を `writing.md` から）。`skip-link.logic.ts`：
`resolveTarget(document, href) → { kind: 'found', el } | { kind: 'missing' }`（`document` は引数で受ける）、
`focusTarget(el)`：`tabindex="-1"` が無ければ付けて `focus({ preventScroll: false })`。`element.ts`：`<a part="control" href=…>`、
click で `resolveTarget` → `missing` なら `console.error('[rd-skip-link] target not found: #main')`。styles：既定は
`.rd-visually-hidden` 相当、`[part='control']:focus-visible` で `position: fixed; inset-block-start: var(--rd-space-2); inset-inline-start: var(--rd-space-2); z-index: var(--rd-layer-skip-link)`（`layer.*` に無ければ `--rd-layer-toast` 等の最上位。**無ければ STOP**）。

テスト：logic 3 件、browser 3 件（Tab で見える／click で target に focus／missing で `console.error`）、sr 1 件（`link` + 文言）。

**Verify**: `bun run test` → skip-link 7 件 pass

### Step 7: `rd-text-field`

form-associated の代表。属性：`label`（必須）、`name`、`value`、`type`（`text | email | url | tel | search | password`）、
`required`、`disabled`、`readonly`、`help-text`、`error-text`（外部から強制するエラー）、`autocomplete`、`placeholder`（非推奨。JSDoc で注記）。
`text-field.logic.ts`：`computeValidity({ value, required, type, errorText, patternResult }) → { flags: ValidityStateFlags, message: string }`
（`type=email` の形式は `<input type=email>` の `validity` を**そのまま使う**。logic は `required` と `errorText` の合成だけ）、
`computeDescribedBy({ hasHelp, hasError, invalid })`、`computeStates(...)`（`invalid`、`disabled`、`readonly`、`unlabeled`、`filled`）。

`element.ts`：`static formAssociated = true`、`#internals`、shadow 内 `<label for="c">` + `<input id="c" part="control">` +
`<p id="help" part="hint">` + `<p id="error" part="error" aria-live は付けない>`。`input` イベントで `setFormValue(value)` と
`setValidity(flags, message, this.#input)`。`formResetCallback` で `value = defaultValue`、`formDisabledCallback(d)` で `disabled = d`。
`labelledBy: Element[]` プロパティ → `#internals.ariaLabelledByElements`（`label` 属性が空でも `labelledBy` があれば unlabeled にしない）。
`checkValidity()` / `reportValidity()` / `validationMessage` を `#internals` に委譲する getter/メソッド。エラー表示は
`:host(:state(invalid)) [part='error']` を `:user-invalid` 相当のタイミング（`blur` 後または `form` の送信試行後）でのみ出す
（`touched` state）。行数が 150 を超えそうなら、`#internals` 周りを `src/_shared/form-control.ts`（純関数 + `internals` を引数）へ。

styles：`[part='control']` に `min-block-size: var(--rd-sizing-target-min)`、`border: var(--rd-border-width-default) solid var(--rd-color-border-strong)`、
invalid で `border-color: var(--rd-color-status-danger-default)` **かつ** エラー文言（色だけにしない）。`field-sizing: content` は
Newly → `@supports (field-sizing: content)` の中。

テスト：logic 8 件、browser 10 件（label 描画と `for`／value 入力で `form` の `FormData` に載る／`required` 空で `checkValidity()` false と
`validationMessage`／`form.reset()` で戻る／`fieldset[disabled]` で `formDisabledCallback`／`error-text` で invalid／`blur` 前はエラー非表示、
後は表示／`labelledBy` で `ariaLabelledByElements`／`help-text` が `aria-describedby` に載る／`:state(invalid)`）、sr 2 件（`textbox` + label + help／
invalid 時に error 文言）。

**Verify**: `bun run test` → text-field 20 件 pass。`wc -l text-field.element.ts` ≤ 150

### Step 8: `rd-dialog`

ネイティブ `<dialog>` を包む（ADR-0008 §「ダイアログ」）。属性：`open`（reflect）、`label`（見出し。必須）、`dismissible`（Esc / 背景で閉じる。既定 true）。
メソッド：`show()`（`showModal()`）、`close(reason?: string)`。slot：既定、`actions`。`@event rd-dismiss`（`detail: { reason: 'esc' | 'backdrop' | 'close' | string }`）。
`dialog.logic.ts`：`decideClose({ dismissible, reason })`、`computeStates({ open })`、`rememberOpener(activeElement)` → 閉じたときに
`opener.focus()`。`element.ts`：`<dialog part="control" aria-labelledby="h"><h2 id="h" part="label">…</h2><slot></slot><slot name="actions"></slot></dialog>`。
`cancel` イベント（Esc）→ `decideClose`、`click` の `target === dialog` で backdrop。`open` 属性の変更 → `updated()` で `showModal()`/`close()`。
`@dependency rd-live-region` は**付けない**（dialog は自分でアナウンスしない）。
styles：`::backdrop { background: var(--rd-color-overlay-default, …) }`（トークンに無ければ **`--rd-shadow-overlay` ではなく色トークンが必要 → STOP**）、
`@starting-style` は Newly → `@supports` 内、`transition` は reduced-motion 内。`max-inline-size: min(90vi, 60ch)`。

テスト：logic 4 件、browser 8 件（`show()` で `dialog.open`／Esc で閉じて `rd-dismiss {reason:'esc'}`／`dismissible=false` で Esc 無効／
backdrop click／閉じた後 opener に focus／`label` が `aria-labelledby` で読める／`open` 属性同期／`:state(open)`）、sr 2 件（`dialog` + label／
閉じた後に opener が読まれる）。

`.size-limit.json` に dialog 行を追加。

**Verify**: `bun run test` → dialog 14 件 pass

### Step 9: CEM・registry・ビルド・サイズ

`bun run gen` → `library/elements/custom-elements.json`（5 部品、各 `status`、`summary`、`slots`、`cssParts`、`cssProperties`、
`events`、`cssStates`）。`tools/cem/registry.json`（5 行）。両方コミット（**`custom-elements.json` はコミットする**：ラッパー生成・MCP・
Storybook の入力。`docs/architecture.md` §3 の「生成物の未コミット」ガードは `library/*/src/generated/` の話）。
`bun run --filter @rimltempest/riml-ds-elements build` → `dist/`。`bunx size-limit` → button ≤ 12 KB、dialog ≤ 14 KB。超えたら
（1）`importHelpers` の判断を見直す、（2）styles の重複を削る、（3）それでも超えたら **STOP**（予算は docs/publishing.md の合意事項）。

`library/elements/README.md`：使い方（`import '@rimltempest/riml-ds-elements/button/define'` と `tokens.css` + `css` の読み込み）、
5 部品の一覧表（`registry.json` から手で転記。plan 008 で自動化）、ビルドの決定（Step 2）。

**Verify**: `bun run check` exit 0、`bun run test` exit 0、`bun run guard` exit 0、`bunx size-limit` exit 0、
`jq '.modules | length' library/elements/custom-elements.json` = 5

## Test plan

- node：`*.logic.test.ts` 7+4+3+8+4 = 26、`tools/cem/test` 5
- browser：`*.test.ts` 1（fixture）+8+3+3+10+8 = 33、`*.sr.test.ts` 2+1+1+2+2 = 8
- 実行：`bun run test` → 全 pass（plan 003 までの件数 + 72）。CI の browser project は Docker で回す（plan 010）

## Done criteria

- [ ] `bun run test` exit 0、新規 72 件（`it.skip` は理由コメント付きで最大 1）
- [ ] `bun run check` exit 0（oxlint `riml-ds/no-class` が `*.element.ts` 以外で class を検出しない、stylelint が `css\`\`` を検査している：
      わざと `color: #fff` を styles.ts に入れて落ちることを 1 回確認し、戻す）
- [ ] 5 つの `*.element.ts` がそれぞれ ≤150 行、`if` ≤5
- [ ] `library/elements/custom-elements.json` に 5 部品・`status` 付き、`tools/cem/registry.json` に 5 行
- [ ] `library/elements/package.json` の `exports` に 10 サブパス + `custom-elements.json` + `package.json`、`.` 無し
- [ ] `bunx size-limit` exit 0（button ≤12 KB、dialog ≤14 KB brotli）
- [ ] `bun run guard` exit 0（`library/elements` が `lit` / `tslib` / `@rimltempest/riml-ds-tokens` 以外に依存していない）
- [ ] `*.stories.ts` が**存在しない**（plan 005）
- [ ] `plans/README.md` の 004 行が更新されている

## STOP conditions

- 標準デコレータの emit が失敗する（TS7 エラー、または実行時に `accessor` 未対応）→ エラー全文を報告。`experimentalDecorators` に**逃げない**
- Vitest browser が Chromium を起動できない（2 回直しても）→ 報告（`playwright install` の有無、エラー全文）
- CEM analyzer 0.11.0 のプラグイン API（`analyzePhase` の引数形）が Context7 の記述と違い、`@status` が出ない
- `--rd-*` 変数が不足（overlay 色、skip-link の layer など）→ 一覧を報告。`system/tokens` を触らない
- `size-limit` 予算超過が (1)(2) で解消しない
- `*.element.ts` が 150 行 / `if` 5 を **2 割以上**超える設計にしかならない → 分割案を添えて報告
- `@guidepup/virtual-screen-reader` が Vitest browser 内で動かない → sr テストを `it.skip` にせず報告

## Maintenance notes

- 部品を足す手順は `riml-ds-element` skill の通り。この plan の Step 4 が exemplar（`rd-button` を見て真似る）
- `custom-elements.json` と `registry.json` はコミットする生成物。PR で差分をレビューする（API 変更の可視化）。
  `guard.sh` に「`src/**/*.element.ts` が変わったのに `custom-elements.json` が変わっていない」検査を plan 010 で足す
- `_shared/` は部品間の共有コード。**ここに UI を置かない**（純関数と `internals` 操作だけ）
- `tslib` の判断（Step 2）は部品が 10 を超えたら再計測する
- 見送り：`@lit-labs/ssr`（plans/README）、scoped custom element registries、`static properties` 記法（デコレータが使えなくなった時の退路としてだけ）
