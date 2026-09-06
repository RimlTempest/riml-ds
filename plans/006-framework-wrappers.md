# Plan 006: フレームワークラッパー（React / Vue / Svelte / Astro）を CEM + マークアップ契約から生成する

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat <plan-004 のマージコミット>..HEAD -- library/elements/src/_shared library/elements/src/*/*.contract.ts library/elements/custom-elements.json tools/cem package.json vitest.config.ts tsconfig.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MEDIUM（4 フレームワークの型生成、React 19 のカスタム要素対応の実挙動、controlled の再同期、
  各フレームワークの e2e 起動コスト）
- **Depends on**: 004（005 とは独立。同時に走ってよい）
- **Category**: direction
- **Planned at**: commit `7bf04e8`, 2026-09-07

## Why this matters

qrcc / noter は React 19（TanStack Start）で、移行の入口は `@rimltempest/riml-ds-react`（`docs/migration.md` §3）。
Vue / Svelte / Astro は予定（ADR-0002 §文脈）。ラッパーを**手で書かない**ことがこのリポジトリの保守性の核で、
部品を足すたびに 4 フレームワーク分の型と部品が `bun run gen` で揃う。ADR-0012 により、ティア A/B の
ラッパーは「マークアップ契約（`MarkupTree`）を各フレームワークのテンプレートに写す」だけの純粋な変換になり、
RSC / SSR / JS 無しで同じ HTML が出る。

## Current state

- plan 004 完了：`library/elements/dist/` に 4 部品、`library/elements/custom-elements.json`（`pe` / `status` / `cssStates` 付き）、
  `tools/cem/registry.json`。各ティア A/B 部品の `index.ts` が `contract`（`Contract` 型：`pe` / `roles` / `required` / `tree`）と
  `markup(props)` を export している。`MarkupNode` は `{ tag, attrs?, children?, slot? } | { text } | { prop } | { raw }`
  （`library/elements/src/_shared/markup.ts`。**`{ raw }` は dialog の `children` 用**）。
- `tools/cem/src/` には `plugins/jsdoc-tags.js`、`core/registry.ts`、`registry.ts`、（plan 005 が先なら）`core/argtypes.ts`、`argtypes.ts` がある。
  **`tools/cem/src/wrappers/` は無い**（このレーンの所有）。
- `library/{react,vue,svelte,astro}/` は**存在しない**。
- root `vitest.config.ts` は `node` / `browser`（/ `storybook`）project。
- 仕様の正：
  - `docs/adr/0002-lit-elements-and-generated-wrappers.md`：CEM が API の正。生成物は `library/<fw>/src/generated/` に出し**コミットしない**。
    手書きは「生成物に乗らない部分だけ」（React の `use client` 境界、Vue プラグイン、Astro integration、e2e）。
    **入力は CEM だけ**と書いてあるが、ADR-0012 でマークアップ契約が加わった：**契約は `library/elements/dist/<name>/index.js` から import する
    （ビルド済み = 生成物側）。`src/` を読まない**。
  - `docs/adr/0012-progressive-enhancement-tiers.md` §5（ラッパー）：React 既定 export は RSC-safe な純 HTML 部品、`/client` に `'use client'`、
    controlled は親が拒否したら再同期、`defaultValue` は uncontrolled。
  - `skills/riml-ds/SKILL.md` §3：**利用側に約束している API**。`<RdTextField label="メール" name="email" type="email" required hint="…" />`、
    `<RdButton type="submit">保存</RdButton>`（children = ラベル）、`/client` の `onRdPress` / `onInput` / `value` / `defaultValue`、
    Vue の `<rd-text-field :label v-model>`、Svelte の `svelteHTML` 型 + `onrd-press`、Astro integration が `tokens.css` と `layers.css` を注入。
    **この skill の記述と食い違う API を作らない**（食い違うなら STOP）。
  - `docs/publishing.md` §サイズ予算：`@rimltempest/riml-ds-react`（button のみ import）**13 KB brotli**。`exports` は明示、ワイルドカード禁止（ADR-0009）。
  - `docs/testing.md`：e2e は Playwright、フレームワーク別アプリは `e2e/<fw>/`。
- React 19 のカスタム要素対応（react.dev、2026-09-07 確認）：クライアントでは「プリミティブ値は属性、それ以外・`in` で存在するプロパティは
  プロパティとして設定」、`onXxx` ではなく**イベント名そのまま**（`onrd-press` ではなく JSX で `onrdPress` は不可 → `addEventListener` で付ける）。
  サーバー（RSC / SSR）ではプロパティは**属性として直列化**、関数は落とす。**Context7 `/facebook/react` で「custom elements」を再確認し、
  違えばこの記述より Context7 を優先して README に差分を書く**。
- バージョン（2026-09-07 `npm view`）：`react` / `react-dom` 19.2.x、`@lit/react` 1.0.x、`vue` 3.5.x、`svelte` 5.x、`astro` 5.x、
  `@playwright/test` 1.63.0（e2e は plan 005 の Docker と同じ版）。着手時に `npm view` で確定し、e2e アプリの `package.json` に固定する。

## Commands you will need

| Purpose            | Command                                                   | Expected on success                         |
| ------------------ | --------------------------------------------------------- | ------------------------------------------- |
| 生成               | `bun run gen`                                             | `library/*/src/generated/**` が更新される   |
| ビルド             | `bun run build`                                           | 各 `library/*/dist/`                        |
| 生成器テスト       | `bun run test -- --project node --dir tools/cem`          | pass                                        |
| React 単体テスト   | `bun run test -- --project react`（この plan で追加）      | pass（jsdom）                               |
| e2e（全 fw）       | `bun run e2e:frameworks`（この plan で追加。Docker）       | pass                                        |
| サイズ             | `bunx size-limit`                                         | react 行が予算内                            |
| 総合               | `bun run check && bun run test && bun run guard`          | exit 0                                      |

## Suggested executor toolkit

- skill：`riml-ds-typescript`、`riml-ds-tdd`、`riml-ds-architecture`
- Context7：`/facebook/react`（custom elements、`useLayoutEffect`、RSC の `'use client'`）、`/lit/lit`（`@lit/react` `createComponent`）、
  `/vuejs/core`（`isCustomElement`、`defineComponent` + `h()`、`v-model` on custom element = `modelValue`/`update:modelValue` **ではなく**
  `value` / `input` の対応をプラグインで）、`/sveltejs/svelte`（`svelteHTML` 名前空間拡張、Svelte 5 runes、custom element events）、
  `/withastro/astro`（integration API `astro:config:setup` の `injectScript`、`.astro` 部品の props）
- `bunx modern-web-guidance@latest search "custom elements react"`

## Scope

**In scope**:

- `tools/cem/src/wrappers/**`（`core/{react,vue,svelte,astro}.ts` 純関数 + `index.ts` CLI）、`tools/cem/test/wrappers/*.test.ts`
- `library/react/**`、`library/vue/**`、`library/svelte/**`、`library/astro/**`
- `e2e/react/**`、`e2e/vue/**`、`e2e/svelte/**`、`e2e/astro/**`、`e2e/playwright.frameworks.config.ts`（新規。plan 005 の `e2e/playwright.config.ts` は触らない）
- root：`package.json`（`gen` に wrappers を追加、`e2e:frameworks` script、devDeps）、`vitest.config.ts`（`react` project）、`tsconfig.json`（references）、
  `.gitignore`（`library/*/src/generated/`）、`.size-limit.json`（react 行 1 つ追加）
- `plans/README.md`（自分の行だけ）

**Out of scope**:

- `library/elements/**`（契約が足りなければ STOP。**`MarkupNode` に種類を足さない**）
- `tools/cem/src/{plugins,core/registry.ts,core/argtypes.ts,registry.ts,argtypes.ts}`
- `apps/**`、`e2e/{vrt,a11y,pe}/**`、`e2e/Dockerfile`、`scripts/vrt.sh`、`.github/**`、`docs/**`、`skills/**`

## Git workflow

- Branch: `feat/frameworks`（`bun run wt add feat/frameworks`）
- 例：`feat(cem): add markup-tree to jsx transformer`、`feat(react): add generated markup components and client wrappers`、
  `feat(vue): add plugin and generated types`、`test(e2e): add react app exercising controlled resync`
- push しない

## Steps

### Step 1: 生成器の共通部（`tools/cem/src/wrappers/core/common.ts`）

CEM と契約を読み、フレームワーク非依存の中間表現にする（純関数。テストは node）：

```ts
export type WrapperSpec = {
  tag: string                 // 'rd-button'
  name: string                // 'button'
  pascal: string              // 'RdButton'
  pe: 'A' | 'B' | 'C'
  attrs: { name: string; type: 'string' | 'boolean' | 'number' | { union: string[] }; optional: boolean; description: string }[]  // CEM attributes
  events: { name: string; detail: string; description: string }[]           // 'rd-press' → onRdPress
  slots: { name: string }[]
  contract: Contract | undefined                                             // A/B のみ
  markupProps: { name: string; type: string; optional: boolean }[]          // contract.tree から $prop / {prop} / {raw} を集める
}
export function toWrapperSpecs(manifest: Manifest, contracts: Record<string, Contract>): WrapperSpec[]
export function toPascal(tag: string): string                               // 'rd-text-field' → 'RdTextField'
export function eventProp(name: string): string                             // 'rd-press' → 'onRdPress'
```

`markupProps` の型は `attrs` の CEM 型を優先し、無ければ `string`（`{ raw }` は `string`、`{ prop }` は `string`、boolean 属性は `boolean`）。
`tools/cem/test/wrappers/common.test.ts`（6 件）。契約の読み込みは CLI 側（Step 6）で `await import('../../../library/elements/dist/<name>/index.js')`。

**Verify**: `bun run test -- --project node --dir tools/cem` → common 6 件 pass

### Step 2: React 生成器（`core/react.ts`）

出力 2 系統（ADR-0012 §5）：

（a）`library/react/src/generated/<name>.tsx`（**`'use client'` 無し**。RSC で描ける）：

```tsx
// generated by tools/cem — do not edit
import type { ReactNode } from 'react'
export type RdButtonProps = { label?: ReactNode; type?: 'button' | 'submit' | 'reset'; variant?: ButtonVariant; loading?: boolean; children?: ReactNode; className?: string }
export function RdButton({ children, label, type = 'button', variant, loading, className }: RdButtonProps) {
  return (
    <rd-button variant={variant} loading={loading ? '' : undefined} class={className}>
      <button type={type}>{children ?? label}</button>
    </rd-button>
  )
}
```

`MarkupTree` → JSX の写像：`{ tag }` → 要素、`attrs` の `'$x'` → `{x}`（boolean は `x ? '' : undefined`）、`{ prop: 'label' }` → `{label}`、
`{ raw: 'children' }` → `{children}`（React では **`dangerouslySetInnerHTML` を使わず** `children` を ReactNode として受ける。
契約の `raw` 名が `children` 以外なら STOP）。**`children` があれば `label` より優先**（skill の `<RdButton type="submit">保存</RdButton>`）。
カスタム要素の JSX 型：`library/react/src/jsx.d.ts` で `React.JSX.IntrinsicElements` に `'rd-button': RdButtonElementAttrs` を拡張（生成）。
React 19 は `class` 属性を認識する（Context7 で確認。`className` を渡すべきなら差し替え）。

（b）`library/react/src/generated/client/<name>.tsx`（先頭に `'use client'`）：

```tsx
'use client'
export type RdTextFieldClientProps = RdTextFieldProps & {
  value?: string; defaultValue?: string
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void
  onRdChange?: (e: CustomEvent<…>) => void            // CEM の events から
  ref?: React.Ref<HTMLElement>
}
export function RdTextField(props) {
  const host = useRef<HTMLElement>(null)
  const { value, defaultValue, onInput, onRdChange, ...rest } = props
  useLayoutEffect(() => {                              // controlled 再同期（ADR-0012 §5）
    const input = host.current?.querySelector('input')
    if (value !== undefined && input && input.value !== value) input.value = value
  })
  useEffect(() => { … host.current?.addEventListener('rd-change', onRdChange) … }, [onRdChange])   // rd-* イベントは addEventListener
  return <RdTextFieldMarkup ref={host} defaultValue={value ?? defaultValue} {...rest} onInput={onInput} />
}
```

ティア A の controlled は **`<input>` の `value` を効果で戻す**（親が state を更新しなければ `useLayoutEffect` が描画直後に戻すので、
ネイティブと同じ意味論になる）。`onInput` はネイティブ `input` イベントが light DOM をバブルするので、markup 部品側の**内側の `<input>`** に付ける
（生成器は `roles.control` に一致するノードに `onInput` / `onChange` / `onBlur` を配る）。ティア B/C（shadow）は `@lit/react` の `createComponent` を
`client/<name>.tsx` に生成（`events: { onRdDismiss: 'rd-dismiss' }`）。ティア C は (a) を**生成しない**（JS 無しで意味が無い）→ 既定 export に載らない。

`library/react/src/index.ts`（生成）：`export { RdButton, RdTextField, RdDialog } from './generated/…'`、`client.ts`：`export { RdButton, … } from './generated/client/…'`。
`tools/cem/test/wrappers/react.test.ts`（node、8 件：JSX 文字列のスナップショット 3、`'use client'` の有無、`children` 優先、boolean 属性、ティア C が既定に無い、`jsx.d.ts`）。

**Verify**: `bun run test -- --project node --dir tools/cem` → react 8 件 pass

### Step 3: Vue / Svelte / Astro 生成器

- **Vue**（`core/vue.ts`）：`library/vue/src/generated/<name>.ts`：`defineComponent` + `h()` で `MarkupTree` を描く（SFC を使わない → ビルドが `tsgo` だけで済む）。
  `props` は `markupProps` から、`v-model` は **`value` / `input`** 対応（`model: { prop: 'value', event: 'input' }` 相当。Vue 3.5 の
  `defineModel` の形は Context7 で確認）。`library/vue/src/generated/elements.d.ts`：`GlobalComponents` と `IntrinsicElementAttributes`（Vue 3.3+）に
  `rd-*` を拡張。`library/vue/src/plugin.ts`（手書き）：`app.component('RdButton', …)` を全部品に。`isCustomElement` は利用側設定（skill 通り）。
- **Svelte**（`core/svelte.ts`）：`library/svelte/src/generated/<name>.svelte`（Svelte 5、`$props()`。`{@html}` は `raw` にだけ）+
  `library/svelte/src/generated/elements.d.ts`（`svelteHTML.IntrinsicElements` に `'rd-button': { variant?: …; 'onrd-press'?: (e: CustomEvent) => void }`）。
  `.svelte` はビルドしない（**そのまま配る**。`svelte` フィールドで `src` を指す。Svelte パッケージの慣行を Context7 で確認）。
- **Astro**（`core/astro.ts`）：`library/astro/src/generated/<name>.astro`（`MarkupTree` はほぼそのまま HTML。`{ raw }` → `<slot />`、`{ prop }` → `{label}`）。
  `library/astro/src/integration.ts`（手書き）：`astro:config:setup` で `injectScript('page-ssr', 'import "@rimltempest/riml-ds-css/layers.css"; import "@rimltempest/riml-ds-tokens/tokens.css"; import "@rimltempest/riml-ds-css";')`
  と、オプション `define: string[]` で `injectScript('page', 'import "@rimltempest/riml-ds-elements/<name>/define"; import "@rimltempest/riml-ds-elements/<name>/style.css"')`。
  ティア A/B の `style.css` は **`.astro` 部品の `<style is:global>` ではなく** integration が注入する（重複を避ける）。

各生成器のテスト（node、各 4 件：スナップショット 2、`raw` の扱い、ティア C の扱い）。

**Verify**: `bun run test -- --project node --dir tools/cem` → 12 件 pass

### Step 4: パッケージ 4 つ

`library/react/package.json`（`@rimltempest/riml-ds-react`、`exports`：`.`、`./client`、`./package.json`。`peerDependencies`：`react ^19`、`react-dom ^19`、
`@rimltempest/riml-ds-elements workspace:*`。`dependencies`：`@lit/react`（B/C 用）。`sideEffects: false`。**`define` を import しない**：
利用側が `@rimltempest/riml-ds-elements/<name>/define` を読む。README に明記）。`library/react/src/generated/` は `.gitignore`。
`tsconfig.json`：`jsx: react-jsx`、`lib` に DOM。**ラッパー内で `any` / `as` / `!` を書かない**（生成コードも oxlint 対象。`.oxlintrc.json` の
`ignorePatterns` に `generated` を**入れない**）。

`library/vue/package.json`（`@rimltempest/riml-ds-vue`、`exports`：`.`（プラグイン + 部品）、`./types`（`.d.ts` のみ））、
`library/svelte/package.json`（`@rimltempest/riml-ds-svelte`、`svelte: "./src/index.js"`、`exports` に `.` と `./types`、`files` に `src/generated`）、
`library/astro/package.json`（`@rimltempest/riml-ds-astro`、`exports`：`.`（integration）、`./components`（`.astro` 群。`files` に `src/generated/*.astro`））。
すべて `publishConfig.access: public` + `provenance: true`。root `tsconfig.json` references に 4 つ追加。

`library/react/test/`（vitest `react` project、`environment: 'jsdom'`、`@testing-library/react`）：
`markup.test.tsx`（3 件：`renderToString(<RdButton type="submit">保存</RdButton>)` が `buttonMarkup({ label: '保存', type: 'submit' })` と**同じ文字列**
（属性順を正規化して比較）、`RdTextField` も同様、`RdLiveRegion` が既定 export に無い（型レベル `// @ts-expect-error`））、
`client.test.tsx`（4 件：controlled で親が拒否 → `input.value` が戻る／uncontrolled で入力が残る／`onRdPress` が発火／`ref` がホスト要素）。
`define` は `library/elements/dist/**/define.js` を jsdom で import（Lit は jsdom で動く。動かなければ browser project に移す）。

**Verify**: `bun run gen && bun run build` exit 0。`bun run test -- --project react` → 7 件 pass。`bunx publint --strict` を 4 パッケージで exit 0

### Step 5: フレームワーク別 e2e アプリ（`e2e/<fw>/`）

各 fw で**同じ 1 ページ**を作る（フォーム：`RdTextField`（email、required）+ `RdButton`（submit）+ `RdDialog`（送信後に開く）+ live region）。
`e2e/react/`（Vite + React 19、**`renderToString` の SSR 経路も 1 ページ**：`/ssr` を `vite-node` か小さな Node サーバで返す）、
`e2e/vue/`（Vite + Vue 3.5、`isCustomElement`）、`e2e/svelte/`（Vite + Svelte 5）、`e2e/astro/`（Astro 5 + integration）。
各 `package.json` は private、依存は固定版。**ビルド成果を `http-server` で配る**（dev サーバではない）。

`e2e/frameworks/<fw>.spec.ts`（共通の `shared.ts` にシナリオ）：
1. `getByLabel('メール')` に入力 → submit → dialog が開く → Esc → opener に focus
2. **JS 無し**（`javaScriptEnabled: false`、React は `/ssr`、Astro はそのまま）：フォームが送信できる、axe AAA 違反 0
3. React のみ：controlled 再同期（親が `abc` だけ許す input に `abcd` と打つ → 値が `abc` に戻る）
4. 4 fw の初期 HTML（`page.content()` の `<main>` 内）を正規化して **plan 005 の `e2e/pe/pages` と同じ `markup()` 出力に一致**（属性順を正規化）

`e2e/playwright.frameworks.config.ts`：`projects` = 4 fw、`webServer` は fw ごとに `bun run --filter e2e-<fw> build && bunx http-server dist -p 601x`。
root：`"e2e:frameworks": "bash scripts/vrt.sh -c e2e/playwright.frameworks.config.ts"`（Docker。plan 005 の `vrt.sh` が `-c` を透過するか確認。
しなければ `vrt.sh` を直さず**この plan では `bunx playwright test -c e2e/playwright.frameworks.config.ts` を直接**書き、Docker 化は plan 010 に報告）。

**Verify**: `bun run e2e:frameworks` → 4 fw × 4 シナリオ（React は +1）pass

### Step 6: CLI 配線・size-limit・README

`tools/cem/src/wrappers/index.ts`（CLI）：CEM を読み、`library/elements/dist/<name>/index.js` から `contract` を import（ティア A/B のみ）、
4 生成器を回して `library/*/src/generated/` に書く。**冪等**（2 回目は diff ゼロ）。root `gen`：`… && bun run tools/cem/src/wrappers/index.ts`。
`.size-limit.json` に `{ "name": "@rimltempest/riml-ds-react (button)", "path": "library/react/dist/generated/button.js", "import": "{ RdButton }", "limit": "13 KB", "brotli": true }`
（`import` で tree-shake 後を測る。`@size-limit/esbuild` の `import` オプション名は README で確認）。
各 `library/<fw>/README.md`：導入 3 行、ティア別の使い分け、既定 / `client` の違い（React）、`v-model`（Vue）、型の入れ方（Svelte）、integration オプション（Astro）。

**Verify**: `bun run gen && git status --porcelain library/*/src/generated` が空（gitignore）、`bun run gen` 2 回で `library/*/src/generated` の
`find … -newer` が空（冪等）。`bunx size-limit` exit 0

## Test plan

- node：`tools/cem/test/wrappers/` 6 + 8 + 12 = 26
- react（jsdom）：7
- e2e：4 fw × 4 + 1 = 17（Docker）
- 実行：`bun run test` → 全 pass、`bun run e2e:frameworks` → pass

## Done criteria

- [ ] `bun run gen` が 4 fw の `generated/` を作り、冪等。`generated/` はコミットされていない
- [ ] `bun run build` で 4 パッケージの `dist/`（Svelte / Astro は型のみ）
- [ ] `bun run test` exit 0（新規 33 件）、`bun run e2e:frameworks` exit 0（17 件）
- [ ] `renderToString(<RdTextField …/>)` === `textFieldMarkup(…)`（正規化後）— テストで固定
- [ ] React 既定 export に `'use client'` が無く、`/client` にはある（`grep -L "'use client'" library/react/src/generated/*.tsx` が全件、`grep -l` が `client/` 全件）
- [ ] controlled 再同期のテストが通る
- [ ] `bunx publint --strict` 4 パッケージ exit 0、`bunx size-limit` exit 0
- [ ] `skills/riml-ds/SKILL.md` §3 のコード例が**そのまま**型検査を通る（e2e アプリに貼って確認）
- [ ] `bun run check` / `bun run guard` exit 0、`plans/README.md` の 006 行更新

## STOP conditions

- React 19 の実挙動が「Current state」の記述と違い、`class` / boolean 属性 / イベントのどれかが skill §3 の API で実現できない → 差分と代案を報告
- 契約の `raw` が `children` 以外の名前、または `MarkupNode` に足りない種類がある → **`library/elements` を直さず**報告
- `renderToString` の出力と `markup()` の出力が属性順以外で一致しない（React が属性を落とす／足す）→ 差分を報告
- Lit が jsdom で `define` できない → react 単体テストを browser project に移して続行、報告に書く
- Vue 3.5 の `v-model` をカスタム要素の `value`/`input` に結びつける公式手段が無い → プラグインでの回避策を提案して STOP
- `skills/riml-ds/SKILL.md` の記述と生成 API が食い違う → skill を直さず STOP

## Maintenance notes

- 部品を足す = `contract.ts` を書く。ラッパーは `bun run gen` で 4 つ揃う。**手書きラッパーを増やさない**
- `MarkupNode` の種類を足すときは 4 生成器のテストを同時に更新（plan 004 Maintenance と対）
- React のメジャー更新時は `jsx.d.ts` の拡張方法とカスタム要素の属性／プロパティ規則を再確認
- `@lit/react` はティア B/C だけ。ティア A に混ぜない（RSC で壊れる）
- 見送り：wc-toolkit の生成器（契約木という独自入力があるので自作の方が小さい。CEM だけの型生成に戻すなら再検討）、
  Solid / Qwik / Angular（要望が出たら `core/<fw>.ts` を 1 つ足す）
