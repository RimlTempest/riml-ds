# 023: ラッパー生成器の追随 — 名前つきの `{ raw }` を Vue / Svelte / Astro の名前つき slot にし、astro の exports を生成し、frameworks e2e に tabs / menu / popover を載せる

**優先度**: P1　**規模**: M　**依存**: 020（マージ済み。`rd-tabs` / `rd-menu` / `rd-popover` が在ること）
**レーン**: `feat/wrappers-wave3`　**計画時の main**: `c661a96`（022 マージ後。021 とは並行 — 021 のファイルには触らない）

> **Drift check（最初に実行）**:
> `grep -c "raw: () =>" tools/cem/src/wrappers/core/svelte.ts tools/cem/src/wrappers/core/astro.ts` がそれぞれ **1** であること。
> `grep -c "slots\['default'\]?.()" tools/cem/src/wrappers/core/vue.ts` が **2** であること。
> `grep -c '{@render children()}' library/svelte/src/generated/menu.svelte` が **2** であること（= 直したいバグ）。
> `grep -c '"./experimental/' library/astro/package.json` が **3** であること（10 個の `.astro` があるのに 3 個しか公開していない）。
> どれか違えば STOP。

## なぜ

020 で入った `rd-tabs` / `rd-menu` / `rd-popover` は契約の木に **名前つきの `{ raw }`** を持つ
（`{ raw: '$trigger' }` と `{ raw: '$items' }`、`{ raw: '$tabs' }` と `{ raw: '$panels' }`）。
React の生成器は `{trigger}` / `{items}` と名前で描き分けるが、**Vue / Svelte / Astro の生成器は `raw` の名前を見ずに
既定 slot（`slots['default']` / `{@render children()}` / `<slot />`）を出す**ので、生成物が同じ子を 2 回描く:

```svelte
<!-- library/svelte/src/generated/menu.svelte（現状。バグ） -->
<rd-menu …>
  {@render children()}
  <div popover="" {id}>{@render children()}</div>
</rd-menu>
```

このせいで 020 は `e2e/frameworks/shared.ts` に tabs / menu / popover を載せられず、**3 部品が React でしか使えない**。
`rd-window` でも `collapsible` の boolean 差で astro を frameworks e2e から外している（018 メモ）。

もう 1 つ、`library/astro/package.json` の `exports` は**手書き**で、`experimental/` の `.astro` が 10 個あるのに 3 個
（checkbox / disclosure / select）しか公開していない。`bun run gen` が `exports` を書くようにして、二度とずれないようにする。

守る不変条件:

- 生成物は **`bun run gen` で再現できる**こと（手で直さない。CI の「エージェント向けの面」が `gen` 後の diff を見る）
- 既存の生成物（button / checkbox / dialog / disclosure / meter / radio-group / select / slider / text-field / window）の
  **内容が変わらない**こと（`raw: '$children'` は今までどおり既定 slot）。変わったら STOP
- e2e の 4 フレームワークすべてで **`JS 無し` → `JS あり`** の順に見る流儀（`frameworkSuite` と同じ）

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-typescript/SKILL.md` と `.claude/skills/riml-ds-tdd/SKILL.md` を読む。手本は
  **`tools/cem/src/wrappers/core/svelte.ts`**（`Dialect` の実装）と **`tools/cem/test/wrappers/svelte.test.ts`**（生成物の文字列をそのまま期待値にする）
- `any` / `as` / `!` / `enum` を書かない。生成器は**純関数**（`index.ts` だけが I/O）
- **失敗するテストを先に書く**（`tools/cem/test/wrappers/*.test.ts` に fixture を足し、期待する生成物を書いてから生成器を直す）
- 触ってよいパス（`scripts/lanes.tsv` の `feat/wrappers-wave3`）: `tools/cem/src/wrappers/**`、`tools/cem/test/wrappers/**`、
  `library/{react,vue,svelte,astro}/**`（`src/generated/**` は再生成物のみ。`package.json` は astro だけ）、
  `e2e/frameworks/**`、`e2e/{react,vue,svelte,astro}/**`、`vitest.config.ts`、`docs/proposals/wrappers-named-slots.md`（新設）、`.changeset/`
  **触らない**: `library/elements/**`（契約は変えない。変えたくなったら STOP）、`tools/cem/src/core/**`、`tools/cem/registry.json`、
  `tools/mcp/**`、`e2e/pe/**`、`e2e/a11y/**`、`e2e/vrt/**`、`e2e/__screenshots__/**`、`system/**`、`apps/**`、`docs/*.md`、`plans/README.md`、
  `skills/**`、`.claude/**`、`DESIGN.md`、`scripts/**`、`.github/**`、`.size-limit.json`
- コミットは段階ごと（下の Step の粒度）。Conventional Commits
- **並行レーン 021（`feat/form-wave4`）が同時に進んでいる。** 021 が `bun run gen` で `library/*/src/generated/**` に新しい部品
  （toggle / checkbox-group / input-otp）を足す。**自分の生成物は `bun run gen` の結果だけをコミットし**、`git merge main` で
  生成物が衝突したら**自分で解決せず `bun run gen` で作り直して STOP せずに続ける**（生成物の衝突だけは再生成で解ける。
  ソースの衝突は STOP）

## 現状のコード（抜粋。読んでから触る）

`tools/cem/src/wrappers/core/markup-lang.ts` — Svelte / Astro が共有する木の書き出し:

```ts
export type Dialect = {
  readonly attr: (name: string, expression: string, shorthand: boolean) => string
  readonly customAttr?: (name: string, prop: string, isBoolean: boolean) => string
  /** `{ prop }`。`children` に置き換わる位置かどうかを受ける */
  readonly text: (prop: string, isChildren: boolean) => string
  /** `{ raw }` */
  readonly raw: () => string
}
…
const inlineOf = (dialect, node, childrenText) => {
  if ('text' in node) return node.text
  if ('prop' in node) return dialect.text(node.prop, node.prop === childrenText)
  if ('raw' in node) return dialect.raw()          // ← 名前を捨てている
  return undefined
}
```

`tools/cem/src/wrappers/core/svelte.ts`:

```ts
const dialect: Dialect = {
  …
  raw: () => '{@render children()}',
}
const componentFile = (spec) => {
  const childrenText = childrenTextOf(spec)
  const hasRaw = spec.markupProps.some((markupProp) => markupProp.kind === 'raw')
  const names = [
    ...spec.markupProps.map((markupProp) => markupProp.name),   // raw の名前（trigger, items）は既にここに入る
    ...(childrenText !== undefined && !hasRaw ? ['children'] : []),
    'class: className',
  ]
```

`tools/cem/src/wrappers/core/astro.ts`:

```ts
const dialect: Dialect = {
  attr: (name, expression) => `${name}={${expression}}`,
  text: (prop, isChildren) => (isChildren ? `<slot>{${prop}}</slot>` : `{${prop}}`),
  raw: () => '<slot />',
}
…
    path: `${spec.status === 'experimental' ? 'experimental/' : ''}${spec.name}.astro`,
…
export const astroFiles = (specs) => specs.filter((spec) => spec.contract !== undefined).map(componentFile)
```

`tools/cem/src/wrappers/core/vue.ts`（`nodeSource`）:

```ts
  if ('prop' in node) {
    return `${pad}${node.prop === childrenText ? `slots['default']?.() ?? props.${node.prop}` : `props.${node.prop}`}`
  }
  if ('raw' in node) {
    return `${pad}slots['default']?.()`          // ← 名前を捨てている
  }
```

`tools/cem/src/wrappers/core/common.ts`（`collectProps`）— `raw` は `kind: 'raw'` の markupProp になる。名前は `$` を落としたもの:

```ts
  if ('raw' in node) {
    const name = placeholder(node.raw)
    return name === undefined ? [] : [{ name, type: 'string', optional: false, kind: 'raw' }]
  }
```

`tools/cem/src/wrappers/core/react.ts`（`inlineChild`）— React は既に名前で描く（**変えない**）:

```ts
  if ('raw' in node) {
    return `{${node.raw.startsWith('$') ? node.raw.slice(1) : node.raw}}`
  }
```

`tools/cem/src/wrappers/index.ts` — 4 つの生成器を回して `library/<fw>/src/generated` に `sync` する。`package.json` は書いていない。

`library/astro/package.json` の `exports`（手書き。experimental が 3 個しか無い）:

```json
    "./button.astro": "./src/generated/button.astro",
    "./dialog.astro": "./src/generated/dialog.astro",
    "./text-field.astro": "./src/generated/text-field.astro",
    "./experimental/checkbox.astro": "./src/generated/experimental/checkbox.astro",
    "./experimental/disclosure.astro": "./src/generated/experimental/disclosure.astro",
    "./experimental/select.astro": "./src/generated/experimental/select.astro",
    "./package.json": "./package.json"
```

契約の木で `raw` を使っている部品（`grep -rn "raw:" library/elements/src/*/*.contract.ts`）:

| 部品 | raw の名前 | 期待する slot |
| --- | --- | --- |
| dialog / disclosure / select / radio-group / window / popover（本文） | `$children` | **既定 slot**（今までどおり） |
| menu | `$trigger`、`$items` | 名前つき `trigger` / `items` |
| popover | `$trigger` | 名前つき `trigger`（本文は `$children` = 既定） |
| tabs | `$tabs`、`$panels` | 名前つき `tabs` / `panels` |

`e2e/frameworks/shared.ts` — `frameworkSuite` / `meterAndWindowSuite` / `radioGroupAndSliderSuite` を export し、各 `e2e/frameworks/<fw>.spec.ts` が呼ぶ。
`compareMarkup(page, selector, expected)` は要素の DOM を正規化して `*Markup()` の出力と比べる（属性はソート、空白は落とす）。
astro の spec は `frameworkSuite('astro')` だけ（meter / window は astro の exports が無かったため）。

## 設計（決めてある。変えるなら STOP）

### 1. `Dialect.raw` は名前を受け取る

```ts
  /** `{ raw }`。`name` は `$` を落とした名前。`children` なら既定 slot、それ以外は名前つき slot */
  readonly raw: (name: string) => string
```

`inlineOf` は `dialect.raw(placeholderName)` を呼ぶ（`placeholder()` は `common.ts` にある。`$` を落とすだけなら `node.raw.slice(1)`）。

| 言語 | `children` | それ以外（例 `trigger`） |
| --- | --- | --- |
| Svelte | `{@render children()}`（変えない） | `{@render trigger?.()}`（snippet prop。無ければ何も描かない） |
| Astro | `<slot />`（変えない） | `<slot name="trigger" />` |
| Vue | `slots['default']?.()`（変えない） | `slots['trigger']?.()` |

Svelte の `$props()` の分割代入には raw の名前が**既に入っている**（`markupProps` 由来）ので、script は変えない。
Vue の `propsType` / `propNames` は raw を除外している（変えない）。Astro の `Props` 型も raw を除外している（変えない）。

### 2. 利用側の書き方（e2e と proposal に書く）

```svelte
<RdMenu label="操作" id="row-actions">
  {#snippet trigger()}<button type="button" popovertarget="row-actions">操作</button>{/snippet}
  {#snippet items()}<a href="/copy">複製</a><button type="button">削除</button>{/snippet}
</RdMenu>
```

```vue
<RdMenu label="操作" id="row-actions">
  <template #trigger><button type="button" popovertarget="row-actions">操作</button></template>
  <template #items><a href="/copy">複製</a><button type="button">削除</button></template>
</RdMenu>
```

```astro
<RdMenu label="操作" id="row-actions">
  <button slot="trigger" type="button" popovertarget="row-actions">操作</button>
  <Fragment slot="items"><a href="/copy">複製</a><button type="button">削除</button></Fragment>
</RdMenu>
```

トリガーの中身は 020 の `menuTriggerMarkup()` / `popoverTriggerMarkup()` と同じ属性（`popovertarget` / `aria-haspopup` 等）を
利用側が書く。**生成器がトリガーを合成することはしない**（020 で React 側もそう決めた）。

### 3. astro の `exports` を `bun run gen` が書く

`tools/cem/src/wrappers/core/astro.ts` に純関数 `astroExports(specs): Record<string, string>` を足す:

- `"."` と `"./package.json"` は固定（今の値のまま）
- 契約のある spec ごとに `"./<name>.astro"`（stable）または `"./experimental/<name>.astro"`（experimental）→ `"./src/generated/…"`
- キーは **stable → experimental の順、それぞれ名前のアルファベット順**

`tools/cem/src/wrappers/index.ts` の `main` で astro の生成後に `library/astro/package.json` を読み、`exports` だけを差し替えて書き戻す
（他のキーの順序と内容を変えない。JSON は 2 スペース、末尾改行）。**差分が無ければ書かない**（`sync` と同じ流儀）。

### 4. frameworks e2e に `navigationSuite(framework)` を足す

`e2e/frameworks/shared.ts` に export を 1 つ足し、**4 つの spec すべて**から呼ぶ:

- `JS 無し`: `rd-tabs` のパネルがすべて見える（`e2e/pe/tier-b.spec.ts` の tabs と同じ観点）。`rd-menu` の項目がすべて見える。
  `rd-popover` の本文が見える
- `JS あり`: tabs は 2 つ目のタブを押すと 1 つ目のパネルが隠れる。menu はトリガーを押すと `role="menu"` が現れ、Esc で閉じる。
  popover はトリガーを押すと `[popover]` が `:popover-open` になる
- `compareMarkup` は **tabs だけ**（`tabsMarkup()` と比べられる。menu / popover はトリガーが利用側の生 HTML で、`id` の付け方が
  フレームワークごとに違うので振る舞いだけ見る）

各アプリ（`e2e/react/src/App.tsx`、`e2e/vue/src/App.ts`、`e2e/svelte/src/App.svelte`、`e2e/astro/src/pages/index.astro`）に
tabs / menu / popover を **1 つずつ**足す。既存の要素（お問い合わせフォーム・dialog 等）は動かさない（既存の `compareMarkup` を壊さない）。
React は `@rimltempest/riml-ds-react/experimental` の `RdTabs` / `RdMenu` / `RdPopover`（020 で生成済み）を使う。

### 5. astro を `meterAndWindowSuite` / `radioGroupAndSliderSuite` にも載せる

exports が揃うので `e2e/frameworks/astro.spec.ts` に 2 行足し、`e2e/astro/src/pages/index.astro` に meter / window / radio-group / slider を足す
（他の 3 つのアプリと同じ props。`e2e/react/src/App.tsx` を見て揃える）。`collapsible` のような boolean は astro では
`collapsible` と書く（`collapsible={true}` でも可）。**`compareMarkup` が boolean を `="true"` / `=""` で読み違えるなら**、
`shared.ts` の `canonical` で **値が `""` または `"true"` の属性を `name=""` に正規化**する（1 か所、コメントに理由を書く）。

### 6. `vitest.config.ts` の include に `apps/**/*.test.ts` を足す

`apps/storybook` などのテストが拾われていない（018 メモ）。`include` の配列に 1 行足すだけ。足した結果 **落ちるテストが出たら STOP**（直さない）。

## 手順（red → green。各 Step の終わりにコミット）

### Step 0: 現状を固定する

1. `bun run gen` を流し、`git status --short` が空であること（生成物が最新）。空でなければ STOP
2. `bun run test -- tools/cem` が通ること。`bun run e2e:frameworks` が通ること（数を控える）

### Step 1: 名前つき raw（red）

`tools/cem/test/wrappers/fixtures.ts` に **`rd-menu` 相当の fixture** を足す（`manifest` に要素、`contracts` に木）。木は本物の
`library/elements/src/menu/menu.contract.ts` の `tree` をそのまま写す（`{ raw: '$trigger' }` と `{ raw: '$items' }` を含む）。

`svelte.test.ts` / `vue.test.ts` / `astro.test.ts` に 1 本ずつ:

- svelte: `find('menu.svelte')` が `{@render trigger?.()}` と `{@render items?.()}` を含み、`{@render children()}` を**含まない**
- vue: `find('menu.ts')` が `slots['trigger']?.()` と `slots['items']?.()` を含み、`slots['default']` を含まない
- astro: `find('experimental/menu.astro')` が `<slot name="trigger" />` と `<slot name="items" />` を含み、`<slot />` を含まない
- 3 つとも: `find('dialog.…')` の既定 slot が**今までどおり**であること（既存テストがあるならそれで足りる）

`bun run test -- tools/cem/test/wrappers` が **落ちる**ことを確認してコミット（`test(cem): expect named raw slots in vue/svelte/astro wrappers`）。

### Step 2: 名前つき raw（green）

設計 §1 のとおり `markup-lang.ts` の `Dialect.raw` に名前を通し、`svelte.ts` / `astro.ts` / `vue.ts` を直す。
`bun run test -- tools/cem` が通り、`bun run gen` の差分が **`library/{vue,svelte,astro}/src/generated/{menu,popover,tabs}.*` だけ**であること
（`git status --short` で確認。他が変わったら STOP）。生成物を一緒にコミット（`fix(cem): render named raw nodes as named slots`）。

### Step 3: astro の exports（red → green）

`astro.test.ts` に `astroExports(specs)` の期待値（fixture の stable / experimental が正しいキーで並ぶこと、`"."` と `"./package.json"` が残ること）。
落ちるのを確認 → `astro.ts` に `astroExports` を足し、`index.ts` で書き戻す。`bun run gen` 後の `library/astro/package.json` に
experimental 10 個（checkbox / disclosure / menu / meter / popover / radio-group / select / slider / tabs / window）が並ぶこと。
`bun run release:check` が通ること（publint が exports の実在を見る）。コミット（`feat(cem): generate the astro package exports`）。

### Step 4: `navigationSuite`（4 フレームワーク）

設計 §4 のとおり。各アプリに 3 部品を足し、`e2e/frameworks/shared.ts` に suite、4 つの spec から呼ぶ。
`bun run e2e:frameworks` が通ること。コミット（`test(e2e): cover tabs, menu and popover in all four frameworks`）。

### Step 5: astro を meter / window / radio-group / slider にも載せる

設計 §5 のとおり。`bun run e2e:frameworks` が通ること。コミット（`test(e2e): run the meter, window, radio-group and slider suites on astro`）。

### Step 6: `vitest.config.ts`

設計 §6。`bun run test` が通ること。コミット（`chore(test): include apps/**/*.test.ts`）。

### Step 7: proposal と changeset

`docs/proposals/wrappers-named-slots.md`（設計 §1–§3 の要約と §2 の利用例）、`.changeset/wrappers-named-slots.md`
（`@rimltempest/riml-ds-vue` / `-svelte` / `-astro` を **patch**: 「名前つき raw が既定 slot に潰れていたのを直す」、
`@rimltempest/riml-ds-astro` は加えて experimental 7 個の export 追加）。コミット（`docs(changeset): record named slots and astro exports`）。

## 完了条件（機械で検査できるもの）

- `bun run check` → 0
- `bun run test` → 0（`tools/cem/test/wrappers` に fixture 由来のテストが **+4 以上**）
- `bun run gen && git status --short` → 空
- `grep -c '{@render children()}' library/svelte/src/generated/menu.svelte` → **0**、`grep -c '@render trigger' 同` → **1**
- `grep -c '"./experimental/' library/astro/package.json` → **10**（021 がマージされていれば 13）
- `bun run e2e:frameworks` → 0（4 fw × navigationSuite が増え、astro が meter / window / radio-group / slider を通す）
- `bun run release:check` → 0
- `bash scripts/guard.sh` → 0
- `git diff --name-only main...HEAD` が「触ってよいパス」の中だけ

## STOP する条件（改善せず報告する）

- 既存の生成物（menu / popover / tabs 以外）が `bun run gen` で変わる
- 契約の木（`library/elements/src/**/*.contract.ts`）を変えたくなった
- Svelte 5 で `{@render trigger?.()}` が型か実行時で通らない（snippet 未指定のとき）→ 代替案を書いて STOP
- `vitest.config.ts` の include を足したら落ちるテストが出た
- `git merge main` で**ソース**（生成物以外）が衝突した

## スコープ外

- vue / svelte の boolean 属性が `="true"` で反映される件（`compareMarkup` の正規化で吸収する。生成器側は変えない）
- `library/react` の生成器（既に名前で描く）
- `tools/mcp` の例（`examples.ts` は React 向けの生 HTML なので影響しない）
- 新しい部品

## 保守メモ

- **契約の木で `raw` に付ける名前がそのまま slot 名になる。** `children` だけが既定 slot。新しい部品を作るとき、既定 slot にしたい本文は
  `$children` と名付けること（`riml-ds-element` skill に advisor が追記する）
- astro の `exports` は生成物。手で足さない（`bun run gen`）。将来 react / vue / svelte の `exports` も同じ形にしてよい
- `e2e/frameworks/shared.ts` の suite は 4 spec から**必ず全部**呼ぶ。1 つのフレームワークだけ外すのは「そのフレームワークで壊れている」の意味
