# Plan 005: Storybook 10・addon-vitest / a11y（AAA）・描画後 HTML の markuplint・Playwright VRT / JS 無し検証・addon-mcp

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat <plan-004 のマージコミット>..HEAD -- apps/storybook e2e library/elements/src vitest.config.ts package.json .mcp.json tools/markuplint tools/cem`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P0
- **Effort**: L
- **Risk**: MEDIUM（Storybook 10 + Vitest 4 の addon-vitest 連携、Docker 上の VRT、shadow DOM の HTML 直列化、JS 無しの静的ページ生成）
- **Depends on**: 004（`chore/devops`（010）とは独立。CI への組み込みは 010 が行う）
- **Category**: direction
- **Planned at**: commit `0014780`, 2026-09-07（plan 004 のマージ後に着手する。ADR-0012 反映で `50516ae` に改訂：4 部品、`markup()` から描く、`e2e/pe`）

## Why this matters

「story = テストケース = ドキュメント = エージェントの参照面」を 1 つにする。ここで
axe（AAA タグ）・markuplint（描画後 DOM）・VRT（ライト/ダーク × 2 幅）・**JS 無し（ティア A/B、ADR-0012）**が story ごとに回るようになると、
以降の部品追加は story を書くだけで品質ゲートに乗る。addon-mcp は開発中のエージェントに
「いまある story と docs」を配る面（ADR-0010）。

## Current state

- plan 004 完了：`library/elements/src/{button,text-field,dialog,live-region}/` に部品があり（ティア A / A / B / C）、
  `*.stories.ts` は**存在しない**。ティア A/B には `<name>.contract.ts`（`markup(props)` → HTML 文字列）と `<name>.css` がある。
  `system/css/dist/index.css` に `.rd-skip-link` がある。`library/elements/custom-elements.json` と `tools/cem/registry.json` がコミット済み。
- root `vitest.config.ts` に `node` / `browser` の 2 project。**この plan で `storybook` project を足す**。
- `tools/markuplint/`（plan 001）：TS 6.0.3 隔離 workspace。`package.json` の `lint` は
  `markuplint "../../apps/storybook/rendered/**/*.html"`、`.markuplintrc.json` は root。**`apps/storybook/rendered/` を作るのがこの plan**。
- 仕様の正：
  - `docs/adr/0007-storybook-and-vrt.md` §決定 1–6 と §影響（`a11y` 除外は `reason` 必須、除外合計 ≤ 部品数、
    VRT 更新は Docker 内だけ、macOS で撮った画像はコミット禁止）
  - `docs/adr/0006-toolchain.md`：描画後 DOM を `getHTML({ serializableShadowRoots: true })` で出力 → markuplint
  - `.claude/skills/riml-ds-element/SKILL.md` §5 story 8 種（`Default`、`Variants`、`Disabled`、`Invalid`/`Loading`、`Dark`、
    `ForcedColors`、`ReducedMotion`、`RTL`、`Dense`）、`argTypes` は CEM 生成を spread
  - `docs/testing.md`：Storybook 層は `**/*.stories.ts`、`play` + `userEvent`、`parameters.vrt: false` は理由コメント必須
  - `docs/agent-integration.md` §Storybook MCP（`.mcp.json` の形）
  - `docs/adr/0012-progressive-enhancement-tiers.md` §7 検証：`e2e/pe/` で `javaScriptEnabled: false`。ティア A は送信・クリックが動き axe AAA を通る、ティア B は内容が読める
- バージョン（2026-09-07 `npm view`）：`storybook` / `@storybook/web-components-vite` / `@storybook/addon-vitest` /
  `@storybook/addon-a11y` / `@storybook/addon-docs` **10.6.0**、`@storybook/addon-mcp` 最新（`npm view @storybook/addon-mcp version`）、
  `vitest` 4.1.11（**5.x に上げない**：addon-vitest の peer は `^3 || ^4`）、`@vitest/browser-playwright` 4.1.11、
  `playwright` / `@playwright/test` 1.63.0、`@axe-core/playwright` 4.13.0、`http-server` 14.1.1、`vite` 8.2.2。
  Docker イメージ `mcr.microsoft.com/playwright:v1.63.0-noble`（Playwright と**同じ版**にすること）。

## Commands you will need

| Purpose              | Command                                                     | Expected on success                                  |
| -------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| Storybook dev        | `bun run storybook`（→ `apps/storybook`、port 6006）        | ブラウザで 4 部品 × 8 story + Foundations            |
| JS 無し検証（Docker）| `bun run pe`                                                | `e2e/pe` pass                                        |
| Storybook build      | `bun run storybook:build`                                   | `apps/storybook/storybook-static/`                   |
| story テスト（a11y） | `bun run test -- --project storybook`                       | 全 story pass、axe 違反 0                            |
| 描画 HTML 出力       | `bun run render`                                            | `apps/storybook/rendered/*.html`                     |
| markuplint           | `bun run lint:html`（root → `tools/markuplint`）            | exit 0                                               |
| VRT（Docker）        | `bun run vrt`                                               | 全 story × 4 枚一致                                  |
| VRT 更新（Docker）   | `bun run vrt:update`                                        | `e2e/vrt/__screenshots__/` 更新                      |
| a11y e2e             | `bun run a11y`                                              | axe + キーボード導線 pass                            |
| 総合                 | `bun run check && bun run test`                             | exit 0                                               |

## Suggested executor toolkit

- skill：`riml-ds-element`（story 8 種）、`riml-ds-tdd`
- Context7：`/storybookjs/storybook`（10.x：`addon-vitest` の `storybookTest()` プラグイン、`addon-a11y` の `parameters.a11y.test`、
  web-components の CSF3 型 `Meta<Args>`）、`/storybookjs/addon-mcp`、`/microsoft/playwright`（`toHaveScreenshot`、`colorScheme`、`forcedColors`、
  `reducedMotion` の `use` オプション）、`/dequelabs/axe-core-npm`（`@axe-core/playwright` の `withTags`）
- `bunx modern-web-guidance@latest search "getHTML serializableShadowRoots"`

## Scope

**In scope**:

- `apps/storybook/**`（`package.json`、`.storybook/{main,preview,modes,theme}.ts`、`.storybook/preview-head.html`、`stories/Foundations/*.mdx`、
  `scripts/render.ts`、`rendered/`（**gitignore**）、`storybook-static/`（gitignore）、`README.md`）
- `library/elements/src/*/*.stories.ts`（4 部品 × 1 ファイル。**story ファイルだけ**。部品本体は触らない）
- `tools/cem/src/argtypes.ts` + `tools/cem/src/core/argtypes.ts`（CEM → Storybook `argTypes`。**`tools/cem/src/wrappers/` は plan 006**）
- `e2e/vrt/**`、`e2e/a11y/**`、`e2e/pe/**`、`e2e/Dockerfile`、`e2e/package.json`、`e2e/playwright.config.ts`、`scripts/vrt.sh`（新規）
- root：`.mcp.json`、`package.json`（scripts `storybook` / `storybook:build` / `render` / `lint:html` / `vrt` / `vrt:update` / `a11y` / `pe`、devDeps）、
  `vitest.config.ts`（`storybook` project）、`.gitignore`（`rendered/`、`storybook-static/`、`test-results/`）
- `scripts/guard.sh`（**1 検査だけ追加**：a11y 除外数 ≤ 部品数、VRT 画像のファイル名に `-darwin` が無い。`chore/scaffold` レーンの所有だが
  ADR-0007 §影響が要求。**コミットメッセージに `guard:` を含めて差分を目立たせる**）
- `plans/README.md`（自分の行だけ）

**Out of scope**:

- `library/elements/src/**`（`*.stories.ts` 以外）。story を書く途中で部品のバグを見つけたら **`plans/README.md` に書かず、報告に含める**
- `.github/**`（CI は plan 010）、`system/**`、`docs/**`、`tools/markuplint/**`（既に `rendered/**` を見る設定。変更不要）
- `e2e/{react,vue,svelte,astro}/`（plan 006）

## Git workflow

- Branch: `feat/storybook`（`bun run wt add feat/storybook`）
- 例：`feat(storybook): add storybook 10 with a11y and vitest addons`、`feat(storybook): add rd-button stories`、
  `feat(e2e): add playwright vrt in docker`、`chore(guard): cap a11y exclusions`
- push しない

## Steps

### Step 1: Storybook 骨格と modes decorator

`apps/storybook/package.json`（`@rimltempest/riml-ds-storybook`、private、scripts `dev: storybook dev -p 6006 --no-open`、`build: storybook build`、
`render: bun run scripts/render.ts`）。devDeps：`storybook`、`@storybook/web-components-vite`、`@storybook/addon-docs`、`@storybook/addon-a11y`、
`@storybook/addon-vitest`、`@storybook/addon-mcp`、`vite`、`lit`（story の `html`）。

`.storybook/main.ts`：

```ts
import type { StorybookConfig } from '@storybook/web-components-vite'
const config: StorybookConfig = {
  framework: '@storybook/web-components-vite',
  stories: ['../../../library/elements/src/**/*.stories.ts', '../stories/**/*.mdx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest', '@storybook/addon-mcp'],
  core: { disableTelemetry: true },
  docs: { defaultName: 'Docs' },
}
export default config
```

`.storybook/preview.ts`：`import '@rimltempest/riml-ds-css/layers.css'`、`import '@rimltempest/riml-ds-tokens/tokens.css'`、`import '@rimltempest/riml-ds-css'`（**この順**。
`skills/riml-ds/SKILL.md` §import order と一致させる）、4 部品の `define` を import（ティア A/B の `style.css` は各 story が import する。preview では読まない）、`parameters.a11y = { test: 'error', options: { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag2aaa','wcag21a','wcag21aa','wcag22aa','best-practice'] } } }`、
`decorators: [withModes]`、`globalTypes`（`scheme: light|dark`、`contrast: no-preference|more`、`density: default|compact`、`dir: ltr|rtl`、`motion: reduce|no-preference`）。

`.storybook/modes.ts`：`withModes` decorator は `document.documentElement` に `style="color-scheme: light"`（または dark）、`data-density`、`dir` を当てる。
`prefers-contrast` / `prefers-reduced-motion` / `forced-colors` は CSS メディアなので JS で偽装できない → **story 側の `parameters.chromatic` 相当は使わず**、
`ForcedColors` / `ReducedMotion` story は **VRT（Playwright の `forcedColors: 'active'` / `reducedMotion: 'reduce'`）でだけ検証**し、
Storybook 上では `parameters.docs.description.story` に「Playwright の emulation で検証。ここでは見た目が変わらない」と明記。
`Dark` story は `globals: { scheme: 'dark' }`、`Dense` は `density: 'compact'`、`RTL` は `dir: 'rtl'`。
`.storybook/preview-head.html`：`<meta name="color-scheme" content="light dark">`。

`stories/Foundations/Tokens.mdx`：`@rimltempest/riml-ds-tokens/tokens.md` を `?raw` で import して表示、`Layers.mdx`（`@rimltempest/riml-ds-css` の役割）。

root `package.json`：`"storybook": "bun run --filter @rimltempest/riml-ds-storybook dev"`、`"storybook:build": "bun run --filter @rimltempest/riml-ds-storybook build"`。

**Verify**: `bun run storybook:build` → `apps/storybook/storybook-static/index.html` 生成（story はまだ Foundations のみ）

### Step 2: CEM → `argTypes` 生成器

`tools/cem/src/core/argtypes.ts`（純関数）：`argTypesFor(manifest, tagName) → Record<string, ArgType>`。`attributes` → `control`
（`boolean` → `boolean`、union 文字列リテラル → `select` + `options`、その他 `text`）、`description` を JSDoc から、`table.defaultValue`。
`events` → `argTypes[name] = { action: name, table: { category: 'events' } }`。`slots` / `cssParts` / `cssProperties` / `cssStates` は
`table.category` 付きの読み取り専用行（`control: false`）。

`tools/cem/src/argtypes.ts`（CLI）：`custom-elements.json` → `apps/storybook/.storybook/generated/argtypes.ts`（gitignore。`bun run gen` に追加）。
story は `import { argTypes } from '../../../../apps/storybook/.storybook/generated/argtypes.js'` ではなく、**`apps/storybook` の
`vite.config`/`main.ts` の `viteFinal` で alias `@rd-argtypes` → 生成ファイル**にする（elements 側から apps への相対 import を避ける）。

`tools/cem/test/argtypes.test.ts`（node、5 件）：boolean → `boolean` control／union → `select`／event → `action`／slot は `control: false`／
存在しないタグ → 空オブジェクト。

**Verify**: `bun run gen` → `apps/storybook/.storybook/generated/argtypes.ts` に 4 タグ分。テスト 5 件 pass

### Step 3: 4 部品の story（8 種）— ティア A/B は `markup()` から描く

ティア A/B の story は **HTML を手書きせず**、`<name>.contract.ts` の `markup(props)` から描く（ADR-0012 §5）。
これで「Storybook で見えるもの = SSR / RSC / Astro が出すもの = e2e/pe が JS 無しで検証するもの」が同一文字列になる。
Lit の `html` に文字列を渡すには `unsafeHTML`（`lit/directives/unsafe-html.js`）を使う。**`markup()` の出力は自分のコードが
エスケープ済みなので story 内に限って可**（利用側の推奨ではない。story 冒頭にコメント）。

`library/elements/src/button/button.stories.ts`：

```ts
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { expect, fn, userEvent, within } from 'storybook/test'
import { argTypes } from '@rd-argtypes'
import { buttonMarkup, type ButtonMarkupProps } from './index.js'
import './button.define.js'
import './button.css'            // ティア A の見た目。preview.ts ではなく story が読む（部品ごとに独立させる）

type Args = ButtonMarkupProps & { 'rd-press': () => void }
const meta = {
  title: 'Components/Button',
  component: 'rd-button',
  tags: ['autodocs'],
  argTypes: { ...argTypes['rd-button'] },
  args: { label: '保存', type: 'button', variant: 'primary', 'rd-press': fn() },
  render: (args) => html`<div @rd-press=${args['rd-press']}>${unsafeHTML(buttonMarkup(args))}</div>`,
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const btn = within(canvasElement).getByRole('button', { name: '保存' })   // light DOM なので shadow をまたがない
    await userEvent.click(btn)
    await expect(args['rd-press']).toHaveBeenCalledTimes(1)
  },
}
export const Variants: Story = { render: () => html`${['primary','secondary','ghost','danger'].map((v) => unsafeHTML(buttonMarkup({ label: v, variant: v })))}` }
export const Disabled: Story = { render: () => html`<rd-button><button type="button" disabled>保存</button></rd-button>` /* ネイティブ disabled。契約外の属性は手書き */ }
export const Loading: Story = { args: { loading: true }, play: … /* click しても rd-press が呼ばれず aria-busy */ }
export const Dark: Story = { globals: { scheme: 'dark' } }
export const Dense: Story = { globals: { density: 'compact' } }
export const RTL: Story = { globals: { dir: 'rtl' } }
export const ForcedColors: Story = { parameters: { docs: { description: { story: 'VRT（forcedColors: active）で検証' } } } }
export const ReducedMotion: Story = { parameters: { docs: { description: { story: 'VRT（reducedMotion: reduce）で検証' } } } }
```

`Variants` の `v` は `ButtonVariant` 型で配列を書く（`satisfies readonly ButtonVariant[]`。`as` 禁止）。
`Meta<Args>` の正確な import と `render` の型は Context7 で確認。
**`within` は light DOM を見るので shadow 越しの query は不要**（ティア A の利点）。ティア B/C（dialog / live-region）で shadow 内を見る必要があるときだけ
`apps/storybook/.storybook/shadow.ts` に `queryShadow(root, selector)` を 1 つ置き、alias `@rd-shadow` で import（`?.` を使い、`!` は使わない）。

他 3 部品：
- `text-field`（ティア A）：`render` は `textFieldMarkup({ id: 'sb-email', label: 'メール', name: 'email', type: 'email', ...args })`。
  `Invalid`：`required` + `play` で `userEvent.click` → `userEvent.tab`（blur）→ `[part=error]` に文言。`Default` の `play` で `userEvent.type` →
  `new FormData(form).get('email')` が入力値（story を `<form>` で包む）。`WithHint`（`hint` あり。`aria-describedby` を assert）を **`Variants` の位置に**。
- `dialog`（ティア B）：`render` は `dialogMarkup({ label: '確認', children: '<p>保存しますか？</p>', ...args })` + `<button>` opener。
  `Default` の `play` で opener click → `show()` → `dialog.open`、Esc → 閉じる + opener focus。`NoJS`（`parameters.vrt: true` のみ、
  JS で `define` を読まない story は Storybook では作れないので **`:not(:defined)` の見た目は e2e/pe が担う**。story 名としては置かない）。
- `live-region`（ティア C）：`Default` の `play` で `announce('保存しました')` → shadow 内テキスト。`Variants` は `polite` / `assertive` の 2 つ。

**すべての story で `parameters.a11y` 除外を書かない**。違反が出たら部品のバグとして報告（STOP ではなく報告して継続。story は残す）。

**Verify**: `bun run storybook:build` exit 0。story 数 ≥ 4 × 8（`jq '[.entries[] | select(.type=="story")] | length' apps/storybook/storybook-static/index.json` ≥ 32）

### Step 4: addon-vitest（`storybook` project）

root `vitest.config.ts` に：

```ts
{
  extends: true,
  plugins: [storybookTest({ configDir: 'apps/storybook/.storybook' })],   // import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
  test: {
    name: 'storybook',
    browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
    setupFiles: ['apps/storybook/.storybook/vitest.setup.ts'],
  },
},
```

`vitest.setup.ts`：`setProjectAnnotations(previewAnnotations)`（addon-vitest の手順。Context7）。`parameters.a11y.test: 'error'` により
axe 違反で test が落ちる。

**Verify**: `bun run test -- --project storybook` → 40+ story pass、a11y 違反 0。**違反があれば部品の修正が必要 → 報告に列挙**（この plan で部品は直さない）

### Step 5: 描画後 HTML の出力と markuplint

`apps/storybook/scripts/render.ts`（Playwright ライブラリ API。`storybook-static` を `http-server -p 6007 -s` で配信）：`index.json` の story ごとに
`iframe.html?id=<id>&viewMode=story` を開き、`#storybook-root` の `getHTML({ serializableShadowRoots: true })` を
`rendered/<id>.html` に `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>${id}</title></head><body>…</body></html>` で包んで書く。
**`serializableShadowRoots` は shadow root が `serializable: true` で attach されている必要がある** → Lit の `static shadowRootOptions = { …, serializable: true }`
が全部品に必要。plan 004 の部品にあるか確認し、**無ければ STOP**（`library/elements/src` はこの plan の scope 外）。
`<template shadowrootmode="open">` を含む HTML を markuplint が解釈できるか確認：markuplint は `template` 内も解析する。`.markuplintrc.json`（root、plan 001）に
`"nodeRules": [{ "selector": "template[shadowrootmode]", "rules": { "required-h1": false } }]` が必要なら **`.markuplintrc.json` は `chore/scaffold` 所有 → 報告して advisor 判断**。

root `package.json`：`"render": "bun run storybook:build && bun run --filter @rimltempest/riml-ds-storybook render"`、`"lint:html": "bun run --cwd tools/markuplint lint"`。

**Verify**: `bun run render` → `apps/storybook/rendered/*.html` 40+ ファイル。`bun run lint:html` exit 0（違反は部品のバグとして報告）

### Step 6: Playwright VRT（Docker）と a11y e2e

`e2e/package.json`（`@rimltempest/riml-ds-e2e`、private、devDeps `@playwright/test@1.63.0`、`@axe-core/playwright@4.13.0`、`http-server@14.1.1`）。
`e2e/playwright.config.ts`：`testDir: '.'`、`projects`：`vrt-light-360` / `vrt-light-1024` / `vrt-dark-360` / `vrt-dark-1024`（`use: { colorScheme, viewport }`）、
`forced-colors`（`use: { forcedColors: 'active' }`、`testMatch: 'vrt/forced.spec.ts'`）、`reduced-motion`（`reducedMotion: 'reduce'`）、`a11y`（`testDir: 'a11y'`）、
`pe`（`testDir: 'pe'`、`use: { javaScriptEnabled: false }`。Step 6b）。
`webServer: { command: 'bunx http-server ../apps/storybook/storybook-static -p 6007 -s', port: 6007, reuseExistingServer: true }`。
`expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: 'disabled' } }`、`snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}'`
（**OS 名を含めない** → Docker 以外で撮ると同名で上書きされる。guard で `-darwin` を検出する既定名と両立させるため、`snapshotPathTemplate` を使う場合は
guard 側を「`e2e/vrt/__screenshots__` の変更コミットが `CI` または `vrt:update` 由来か」を判定できないので、**`scripts/vrt.sh` が Docker 内でだけ
`--update-snapshots` を通す**方式にする：`vrt:update` はホストからは `docker run` を呼ぶだけで、直接 `playwright test --update-snapshots` を叩く
npm script を**用意しない**）。

`e2e/vrt/stories.spec.ts`：`index.json` を読み、`parameters.vrt !== false` の story ごとに `page.goto('/iframe.html?id=…')` → `await page.locator('#storybook-root').waitFor()` →
`expect(page).toHaveScreenshot(`${id}.png`)`。`e2e/vrt/forced.spec.ts` / `reduced.spec.ts`：`ForcedColors` / `ReducedMotion` story のみ。
`e2e/a11y/keyboard.spec.ts`：`Default` story ごとに `new AxeBuilder({ page }).withTags([...ADR-0007 のタグ]).analyze()` → `violations` 空、
dialog はキーボード導線（opener に Tab → Enter → dialog 内に focus → Esc → opener に戻る）、`Foundations/SkipLink` story（`.rd-skip-link` を置いた最小ページ。
`apps/storybook/stories/Foundations/skip-link.stories.ts`）で Tab → 表示、Enter → `#main` に focus。

`e2e/Dockerfile`：`FROM mcr.microsoft.com/playwright:v1.63.0-noble`、`RUN curl -fsSL https://bun.sh/install | bash`（**Bun の版は `mise.toml` と同じに固定**。
`BUN_INSTALL` と `PATH`）、`WORKDIR /work`。`scripts/vrt.sh`：`docker build -t riml-ds-e2e -f e2e/Dockerfile e2e && docker run --rm -v "$PWD":/work -w /work riml-ds-e2e bash -c "bun install --frozen-lockfile && bunx playwright test -c e2e/playwright.config.ts ${*}"`。
root scripts：`"vrt": "bash scripts/vrt.sh --project 'vrt-*' --project forced-colors --project reduced-motion"`、`"vrt:update": "bash scripts/vrt.sh --update-snapshots …"`、
`"a11y": "bash scripts/vrt.sh --project a11y"`、`"pe": "bash scripts/vrt.sh --project pe"`。`scripts/` は `chore/scaffold` 所有だが `vrt.sh` は新規ファイル → **`scripts/lanes.tsv` の `feat/storybook` に `scripts/vrt.sh` を足す**
（lanes.tsv も新規行の追記は許容。`guard` が所有権を検査するなら先に追記）。

初回ベースライン：`bun run vrt:update` → `e2e/vrt/__screenshots__/**/*.png`（4 部品 × 8 story × 4 + Foundations + forced + reduced ≈ 150 枚。**1 枚 ≤ 100 KB を目安**、
合計 ≤ 15 MB。超えたら `viewport` を 360×640 / 1024×768 に絞る）をコミット。Docker が無い環境なら **STOP**（ベースライン無しでマージしない）。

**Verify**: `bun run vrt` exit 0（2 回目は差分 0）、`bun run a11y` exit 0

### Step 6b: JS 無し検証（`e2e/pe`、ADR-0012 §7）

Storybook は JS 無しで動かないので、**`markup()` の出力を静的 HTML に書き出して**検証する。

`e2e/pe/build-pages.ts`（Playwright の `globalSetup` から呼ぶ。Bun で実行）：`library/elements/src/*/*.contract.ts` を import し、
`e2e/pe/pages/<name>.html`（gitignore）を生成する。各ページは
`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/css/tokens.css"><link rel="stylesheet" href="/css/index.css"><link rel="stylesheet" href="/css/<name>.css"></head><body><a class="rd-skip-link" href="#main">本文へ</a><main id="main"><form method="get" action="/pe/pages/echo.html">${markup(props)}<rd-button><button type="submit">送信</button></rd-button></form></main></body></html>`
で、**`<script>` を一切含まない**（生成器に `expect(html).not.toContain('<script')` を入れる）。`/css/*` は `system/tokens/dist`、`system/css/dist`、
`library/elements/dist/*/*.css` を `e2e/pe/pages/css/` にコピーして配る（`http-server` の `-p 6008`、`webServer` を 1 つ足す）。
`echo.html` は `<h1>送信済み</h1>` の静的ページ（クエリ文字列は Playwright が `page.url()` で読む）。

`e2e/pe/tier-a.spec.ts`（`javaScriptEnabled: false`）：
- `button`：`getByRole('button', { name: '送信' })` が見え、click で `echo.html` に遷移する（フォーム送信がネイティブで動く）
- `text-field`：`getByLabel('メール')` に入力 → 送信 → `page.url()` に `email=…`；`required` 空で送信 → 遷移しない（ネイティブ検証。`:user-invalid` で枠色が変わるのは VRT に委ねる）
- 各ページで `new AxeBuilder({ page }).withTags([...]).analyze()` の `violations` が空（**JS 無しで AAA**）
- `getComputedStyle` で `rd-button > button` の `min-block-size` が `2.75rem` 相当（`style.css` が JS 無しで効く）
- `.rd-skip-link`：Tab で表示され、Enter で `#main` へ移動する（URL の hash）

`e2e/pe/tier-b.spec.ts`（`javaScriptEnabled: false`）：`dialog`：`getByRole('heading', { name: '確認' })` と本文 `<p>` が**見える**（`:not(:defined)` の CSS で
inline セクションとして描かれる）、axe の `violations` 空。**内容が隠れていたら fail**（ADR-0012 ティア B の要件）。

`e2e/pe/tier-c.spec.ts`：`live-region` は JS 無しで**何も出ない**ことを確認（`rd-live-region` の `textContent` が空、axe 違反 0）。1 件。

**Verify**: `bun run pe` exit 0。`grep -c '<script' e2e/pe/pages/*.html` がすべて 0

### Step 7: addon-mcp と `.mcp.json`、guard

`.mcp.json`（root）：

```json
{ "mcpServers": { "storybook": { "type": "http", "url": "http://localhost:6006/mcp" } } }
```

（`docs/agent-integration.md` §Storybook MCP の形に合わせる。キー名が違えば docs に従う）。`apps/storybook/README.md`：起動・story 追加・
a11y 除外の書き方（`reason` 必須）・VRT 更新（Docker のみ）・MCP の使い方。

`scripts/guard.sh` に 3 検査追加：（c）`e2e/pe/pages/` がコミットされていない（`git ls-files e2e/pe/pages | wc -l` = 0。生成物）、（a）`grep -rl "a11y:.*rules" library/elements/src/**/*.stories.ts` 中の `reason` の数 ≤ `custom-elements.json` の部品数、
`reason` 無し除外は即 fail、（b）`git ls-files e2e/vrt/__screenshots__ | grep -E -- '-(darwin|win32)'` が空。

**Verify**: `bun run guard` exit 0。`bun run storybook` を起こして `curl -s localhost:6006/mcp` が 200/406（MCP の initialize 前応答）を返す

## Test plan

- `tools/cem/test/argtypes.test.ts` 5 件（node）
- `storybook` project：32+ story（addon-vitest。各 story が a11y チェック込みで 1 テスト）
- `e2e/vrt`：story × 4 + forced + reduced（Docker）、`e2e/a11y`：4 Default × axe + 2 導線
- `e2e/pe`（Docker、JS 無し）：tier-a 6 + tier-b 2 + tier-c 1 = 9 件
- `bun run lint:html`：32+ HTML

## Done criteria

- [ ] `bun run test` exit 0（`storybook` project 含む）、`bun run test -- --project storybook` で 32+ pass、a11y 違反 0
- [ ] `bun run render && bun run lint:html` exit 0
- [ ] `bun run vrt` exit 0、`e2e/vrt/__screenshots__/` がコミット済み、合計 ≤ 15 MB
- [ ] `bun run a11y` exit 0
- [ ] `bun run pe` exit 0（JS 無しでティア A が送信でき、ティア B の内容が見え、axe AAA 違反 0）
- [ ] 4 部品すべてに 8 story、`parameters.a11y` 除外 0。ティア A/B の story が `markup()` から描かれている（`grep -L 'Markup(' library/elements/src/{button,text-field,dialog}/*.stories.ts` が空）
- [ ] `.mcp.json` があり、`bun run storybook` 中に `/mcp` が応答する
- [ ] `bun run check` exit 0、`bun run guard` exit 0
- [ ] `plans/README.md` の 005 行が更新されている

## STOP conditions

- addon-vitest が vitest 4.1.11 と噛み合わない（`storybookTest` が読み込めない、peer 警告が error）→ 版の組み合わせを報告。vitest を 5 に上げない
- 部品の `shadowRootOptions` に `serializable: true` が無く、`getHTML` が shadow を含まない → 報告（plan 004 の追補が必要）
- Docker が使えない環境（`docker version` 失敗）→ VRT ベースラインを macOS で撮ってコミット**しない**。報告
- axe（AAA）違反・markuplint 違反が部品側にある → **STOP ではない**。story は書き切り、違反一覧を報告に付けて Done criteria の該当項目を未達として残す
- `storybook-static` の VRT で `animations: 'disabled'` でも差分が 0.001 を超えて安定しない（フォント読み込み等）→ 原因と再現条件を報告
- `e2e/pe` でティア A の送信が動かない、またはティア B の内容が JS 無しで隠れる → **部品側の欠陥**。plan 004 への追補として報告（story は書き切る）

## Maintenance notes

- Storybook のメジャー更新は addon-vitest / vitest の peer を**先に**確認する（plans/README「見送り」：Vitest 5）
- Playwright を上げるときは `e2e/Dockerfile` のタグと `@playwright/test` を**同じ PR で**同じ版に。ベースラインは全更新になる
- story の a11y 除外は増やさない。増えるなら部品を直す。上限は guard が見る
- `render.ts` は `index.json` の形式（Storybook の内部形式）に依存する。10.x 内で変わったら `render.ts` だけ直す
- 部品を足したら `e2e/pe/build-pages.ts` の一覧にも足す（ティア A/B のみ）。plan 006 以降は `registry.json` の `pe` から自動列挙に置き換える
- 見送り：Chromatic（有料化リスク）、PR プレビュー Pages（1 環境しかない）、フレームワーク別 Storybook（ADR-0007）
