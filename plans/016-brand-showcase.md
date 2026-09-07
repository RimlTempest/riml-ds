# 016: Storybook にブランド切替と Foundations（Brand / Mado）を足す

**優先度**: P2　**規模**: S　**依存**: 015（マージ済み。`.rd-window` と `rd-meter` が在ること）　**レーン**: `feat/brand-showcase`
**計画時の main**: `3d85de1`（015 マージ後の SHA は Drift check で確認）

> **Drift check（最初に実行）**:
> `grep -c 'rd-window' system/css/dist/patterns.css`（`bun run build` 後）が 1 以上、`command ls system/tokens/dist/themes/` に `qrcc.css` `noter.css`。
> どちらか欠けたら STOP。`git diff --stat 3d85de1..HEAD -- apps/storybook e2e/vrt` に差分があれば読む。

## なぜ

014 / 015 で riml が既定になり、qrcc / noter はテーマになった。しかし Storybook にはテーマを切り替える手段が無く、
「テーマを当てても部品が壊れない」ことを目で確かめられない。また、ブランドと「まど」の**説明**（何色を何に使うか、窓の構造）が
Storybook に無いので、利用側（qrcc2 / noter）の開発者やエージェントが `docs/brand.md` を読まないと分からない。

このプランで **ツールバーに `theme` を足し**、Foundations に `Brand`（パレット・意味色・使ってよい場所）と `Mado`（窓・ピル・メーター・点線の
組み合わせ見本）の story を置く。Foundations の story は既存の VRT プロジェクト（light / dark × 360 / 1024）で自動的に撮られるので、
**テーマ × スキームの見た目の回帰も同時に固定される**。

## リポジトリの決まり（守る）

- `any` / `as` / `!` / `enum` / `class` を書かない。`Reflect.get` と型ガードで読む（`e2e/stories.ts` の書き方に倣う）
- story は `apps/storybook/stories/Foundations/`（部品の story は `library/elements/src` — 触らない）
- a11y は全 story で AAA タグ込み（`preview.ts`）。除外するなら `reason:` 必須
- 触ってよいパス（`scripts/lanes.tsv` の `feat/brand-showcase`）: `apps/storybook/**`、`e2e/vrt/**`、`e2e/stories.ts`、`e2e/playwright.config.ts`、
  `e2e/__screenshots__/**`、`.changeset/`。
  **触らない**: `system/**`、`library/**`、`docs/**`、`DESIGN.md`、`plans/README.md`、`skills/**`、`.claude/**`
- Storybook の CSS 読み込み順は layers → tokens → css（`preview.ts` の先頭コメント）。テーマは tokens の**後**に来ればよい
  （同じ `@layer rd.tokens` の `:root` なので、後に読んだ方が勝つ）

## 現状のコード（抜粋）

`apps/storybook/.storybook/modes.ts` — `withModes` decorator が `globals` を `documentElement` に落とす（`scheme` → `style.colorScheme`、
`density` → `data-density`、`dir`）。`modeGlobalTypes` / `initialModeGlobals` がツールバーの定義。

`system/tokens/dist/themes/qrcc.css`（`:root` に palette の上書きだけ。`light-dark()` に畳まれている）:

```css
@layer rd.tokens {
  :root {
    --rd-color-palette-accent-300: oklch(88.49% 0.0628 240);
    ...
```

`system/tokens/package.json:22` — `"./themes/*.css": "./dist/themes/*.css"`。

`apps/storybook/stories/Foundations/` — `Layers.mdx`、`Tokens.mdx`、`skip-link.stories.ts`（Foundations の story の既存例）。

`e2e/stories.ts` — `storybook-static/index.json` から story 一覧を作る。`no-vrt` タグで除外。

## Step 0 — 失敗するテスト（red）

`apps/storybook` にテストが無ければ `apps/storybook/.storybook/modes.test.ts`（vitest `node` project。`vitest.config.ts` の include に
入るか確認。入らなければ `e2e` 側ではなく `apps/storybook/package.json` の `test` を足す）:

- `themeStyle('qrcc')` が `qrcc.css` の文字列を返し、`themeStyle('riml')` が空文字を返す（純関数。CSS の文字列は引数で受ける）
- `modeGlobalTypes.theme.toolbar.items` が `['riml', 'qrcc', 'noter']`

## Step 1 — `theme` のツールバーと decorator

`modes.ts`:

```ts
import qrccCss from '@rimltempest/riml-ds-tokens/themes/qrcc.css?raw'
import noterCss from '@rimltempest/riml-ds-tokens/themes/noter.css?raw'

const THEME_CSS: Readonly<Record<string, string>> = { qrcc: qrccCss, noter: noterCss }

/** テーマ CSS の文字列。riml（既定）は空 */
export const themeStyle = (theme: unknown, table: Readonly<Record<string, string>> = THEME_CSS): string =>
  typeof theme === 'string' ? (table[theme] ?? '') : ''

const applyTheme = (root: HTMLElement, theme: unknown): void => {
  const doc = root.ownerDocument
  const existing = doc.getElementById('rd-theme')
  const css = themeStyle(theme)
  if (css === '') { existing?.remove(); return }
  const style = existing ?? doc.createElement('style')
  style.id = 'rd-theme'
  style.textContent = css
  if (existing === null) doc.head.append(style)
}
```

`?raw` の型は `apps/storybook/types/` に `declare module '*.css?raw' { const css: string; export default css }` を足す（`vite/client` が
入っていれば不要。`bun run typecheck` で確認）。

`withModes` で `applyTheme(root, context.globals['theme'])`。`modeGlobalTypes.theme`: `title: 'ブランド'`、`icon: 'paintbrush'`、
`items: ['riml', 'qrcc', 'noter']`、`initialModeGlobals.theme = 'riml'`。

## Step 2 — Foundations / Brand

`apps/storybook/stories/Foundations/brand.stories.ts`（`title: 'Foundations/Brand'`）。描くのは `--rd-*` 変数の**見本**で、値は書かない
（CSS 変数を `background: var(--rd-color-…)` で当てる。名前と用途の文字を並べる）:

- `Palette`: semantic の色を `<dl>` で。行 = `surface.default / raised / sunken`、`text.default / muted`、`accent.default / hover / text`、
  `brand.primary / signature`（「装飾用。文字を載せない」の注記付き）、`chrome.default / text`、`status.*.default`、`border.default / strong`、`focus.ring`
  各行に色見本（`<span aria-hidden="true">` の 2.75rem 角、`border-radius: var(--rd-radius-md)`）と名前・用途（brand.md §3 の 1 行）
- `Type`: `h1` / `h2` / `p` / `small` / `code` を 1 つずつ（display スタックが当たった見出し）
- `ShapeAndShadow`: `radius.sm / md / lg / full` と `shadow.raised / overlay` を箱で
- `Qrcc` / `Noter`: `Palette` と同じ描画で `globals: { theme: 'qrcc' }` / `'noter'` を story に固定（テーマ × VRT の回帰用）

## Step 3 — Foundations / Mado

`apps/storybook/stories/Foundations/mado.stories.ts`（`title: 'Foundations/Mado'`）。**部品の組み合わせ見本**。部品の `define` と `.css` は
`library/elements/src/<name>/<name>.define.js` / `.css` から import（他 story と同じ）:

- `Window`: `.rd-window` に `h2.rd-window-title` + `.rd-window-body`（本文 + `rd-button` 2 つの `rd-cluster`）
- `WindowTones`: `data-tone` 4 種を `rd-stack` で
- `Form`: 窓の中に `rd-text-field` / `rd-select` / `rd-checkbox`（switch 含む）/ `rd-meter` / `hr` / ボタン列
- `Stacked`: 窓 2 枚を少しずらして重ねる（`shadow.raised` の「積み重なった窓」の見え方）
- `QrccWindow` / `NoterWindow`: `Form` を `globals.theme` 付きで
- `parameters.landmark` は既定のまま（decorator の `<main>` に入る）。`h2` を使うので `page-has-heading-one` が出たら
  story のルートに `<h1 class="rd-visually-hidden">見本</h1>` を置く（除外にしない）

`Tokens.mdx` に「ブランドは `docs/brand.md`、切替はツールバーの『ブランド』」の 2 行を足す。

## Step 4 — VRT・changeset

1. `bun run storybook:build` → story 数が 015 時点 + 11 以上
2. `bun run vrt:update`（Docker）→ `bun run vrt` 緑 → screenshots をコミット（Foundations の新規分だけ増える。既存の差分が出たら STOP）
3. `bun run a11y` 緑
4. `.changeset/brand-showcase.md` は **不要**（apps/storybook は private）。ただし `e2e` 等も private なので changeset 無しで可

## Done criteria

- [ ] `bun run test` / `bun run check` 緑。Step 0 のテストが green
- [ ] Storybook のツールバーに「ブランド」があり、`qrcc` を選ぶと `<style id="rd-theme">` が `<head>` に入る（`bun run storybook` で目視、または
      Vitest browser で `applyTheme` を呼んで `document.getElementById('rd-theme')` を確認）
- [ ] `Foundations/Brand` 5 story、`Foundations/Mado` 6 story が `index.json` に載る
- [ ] `bun run vrt` 緑。`e2e/__screenshots__` に `foundations-brand-*` / `foundations-mado-*` が light / dark × 360 / 1024 で在る
- [ ] `bun run a11y` 緑（除外なし）。`bash scripts/guard.sh` 緑

## STOP 条件

- `?raw` import が Storybook（Vite 8 / rolldown）で解決できない（代替: `apps/storybook/scripts` で build 前に themes をコピーする案を報告）
- 既存 story の VRT に差分が出る（このプランは既存の見た目を変えない）
- テーマを当てた story で axe の色コントラストが落ちる（テーマの値の問題 → tokens 側の修正が要るので報告）

## 保守メモ

- テーマを足したら `THEME_CSS` と `items` に 1 行ずつ。将来 `tokens.json` の `modes` から自動で作るなら別プラン
- Foundations の story は VRT の「テーマ × スキーム」の回帰テストでもある。消すときは代わりの検査を用意する
- DESIGN.md 本文・`docs/tokens.md`・`.claude/skills/riml-ds-tokens/SKILL.md` の値の更新は advisor が行う（このプランの範囲外）
