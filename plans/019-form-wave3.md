# 019: フォーム部品 wave 3 — `rd-radio-group`（segmented 付き）、`rd-slider`、`.rd-input-group`

**優先度**: P1　**規模**: L　**依存**: 017・018（両方マージ済み。`patterns.css` に `.rd-window-bar`、`system/css/src/atoms.css` が在ること）
**レーン**: `feat/form-wave3`　**計画時の main**: 017 / 018 のマージ後に advisor が `plans/README.md` の Planned at に記す

> **Drift check（最初に実行）**:
> `test -d library/elements/src/radio-group -o -d library/elements/src/slider && echo EXISTS` が何も出ないこと。出たら STOP。
> `grep -c 'rd-input-group' system/css/src/patterns.css` が 0 であること。
> `test -f system/css/src/atoms.css && grep -c 'rd-window-controls' system/css/src/patterns.css` が 1 以上であること（017 / 018 が入っている前提）。
> `git log --oneline -1 -- library/elements/src/checkbox/checkbox.element.ts` を見て、「現状のコード」の抜粋と `checkbox.element.ts` を見比べる。
> 骨格（`checkContract` → `bindListeners` → `syncStates` / `syncAttribute`）が変わっていたら STOP。

## なぜ

基礎の部品が少ない、というオーナーの指摘（shadcn/ui の一覧を基準にする）。フォーム側で欠けているのは
**択一（Radio Group）**、**連続値（Slider）**、**入力とボタンを 1 つの枕にまとめる形（Input Group）**、そして
**セグメント切替（Toggle Group）**。riml-ds ではフォームに参加する部品は **ティア A**（ADR-0012。JS 無しで動く）でしか作れないので、

- Toggle Group は「押下状態のボタンの列」ではなく **`<input type="radio">` の列をピルの区画に見せる**形にする。
  `rd-radio-group` の `segmented` 属性で見た目だけ変える（`rd-checkbox` の `switch` 属性と同じ判断。plan 009 バックログ #2）。
  JS 無しでも送信でき、キーボードは矢印でネイティブに動き、読み上げは radio のまま
- Slider は **`<input type="range">`** を包む。値・範囲・刻みはネイティブが持つ。部品がするのは `rd-meter` と同じで、
  **塗りの割合を CSS 変数に写す**ことと、`<output>` に現在値を書くことだけ
- Input Group は JS が要らないので**部品にしない**。`patterns.css` の `.rd-input-group`（ADR-0012 §6 の線引き。`.rd-skip-link` と同じ）

参考画面（Phase E の指示画像）から持ち込むのは **太いピルのトラック・丸いつまみ・縦向きのスライダー・ピルの区画** という
構図だけ。絵・アイコン・文言・ロゴは写さない（brand.md §9）。

守る不変条件:

- **AAA**（文字 7:1・非文字 3:1）。色は semantic トークンだけ（`--rd-color-palette-*` は stylelint が落とす）
- **ネイティブ要素に値を持たせる**。部品は `value` を委譲する getter/setter だけ（`rd-checkbox` の `checked` と同じ）
- 動きは `prefers-reduced-motion: no-preference` の中だけ。強制配色では `appearance: auto` に戻す
- `.size-limit.json` の予算内（新部品 1 つ = `define` 12 KB。超えたら 1 KB 単位で上げ、理由を changeset に書く）
- 検証文言は `_shared/field.ts` の `computeMessage`（`system/guidelines/writing.md` が正）。新しい文言を足さない

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/checkbox/**`**（ティア A、`<label>` が `<input>` を包む契約）と **`library/elements/src/meter/**`**（値 → CSS 変数）
- `any` / `as` / `!` / `enum` を書かない。`class` は `*.element.ts` の `extends LitElement` だけ。リアクティブな prop は
  `static properties` + `declare` + constructor 初期化（デコレータ禁止、ADR-0005 §4）
- **失敗するテストを先に書く**（logic は Vitest node、DOM は Vitest browser `*.test.ts`、読み上げは `*.sr.test.ts`、見た目は VRT）
- `*.element.ts` / `*.contract.ts` を変えたら `bun run gen`（CEM・registry・ラッパー・argTypes。guard 検査 15）
- 新部品は `bun run scaffold:element radio-group --pe A` / `bun run scaffold:element slider --pe A` で骨格を作る（上書きしない）。
  `library/elements/package.json` の `exports` に `./experimental/<name>{,/contract,/define,/style.css}` を足す（`checkbox` の 4 ブロックを手本に。ワイルドカード禁止）
- story は 8 種（`Default` / `Variants` / `Disabled` / `Invalid` / `Dark` / `ForcedColors` / `ReducedMotion` / `RTL` / `Dense`）。
  a11y の除外には `reason:` を付ける
- CSS の単位: `px` は罫線・アウトラインだけ。それ以外は `rem` か `--rd-*`
- 触ってよいパス（`scripts/lanes.tsv` の `feat/form-wave3`）: `library/elements/src/radio-group/**`（新規）、`library/elements/src/slider/**`（新規）、
  `library/elements/src/experimental/{radio-group,slider}/**`（新規）、`library/elements/package.json`（exports のみ）、
  `library/elements/src/text-field/text-field.stories.ts`（Step 0 のみ）、`library/elements/src/_shared/field.ts`（**純関数の追加のみ**。既存の関数は変えない）、
  `system/css/src/patterns.css`（`.rd-input-group` の追記のみ）、`system/css/test/**`、
  `library/{react,vue,svelte,astro}/src/generated/**`（再生成物のみ）、`tools/cem/registry.json`、`library/elements/custom-elements.json`、
  `tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`e2e/**`、`.size-limit.json`、`docs/proposals/{radio-group,slider}.md`（新設）、`.changeset/`
  **触らない**: `system/tokens/**`（値が要るなら STOP）、`system/css/src/` の他ファイル、`library/elements/src/{button,dialog,checkbox,select,disclosure,toast,meter,live-region,window}/**`、
  `apps/storybook/**`、`docs/*.md`、`plans/README.md`、`skills/**`、`.claude/**`、`DESIGN.md`
- コミットは段階ごと（下の Step の粒度）。Conventional Commits

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/checkbox/checkbox.contract.ts`（ティア A の契約。**この形をそのまま倣う**）:

```ts
export const contract = {
  pe: 'A',
  roles: {
    label: ':scope label',
    control: ':scope input[type="checkbox"]',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-checkbox',
    attrs: { switch: '$asSwitch', hint: '$hint', error: '$error' },
    children: [
      {
        tag: 'label',
        children: [
          { tag: 'input', attrs: { type: 'checkbox', id: '$id', name: '$name', value: '$defaultValue', checked: '$defaultChecked', required: '$required' } },
          { prop: 'label' },
        ],
      },
    ],
  },
} as const satisfies Contract
export const markup = (props: CheckboxMarkupProps): string => renderMarkup(contract.tree, props)
```

`checkbox.element.ts` の骨格（`createRenderRoot` は `this`、`firstUpdated` で `checkContract`、`bindListeners`、`updated` で `syncStates` / `syncAttribute`、
`render()` は hint / error の `<p part>` だけ）。`checked` は getter/setter でネイティブに委譲。`#view()` が `computeCheckboxView(...)` に
`validity` / `validationMessage` / `japanese: usesJapaneseCopy(this)` / `touched` を渡す。**新部品もこの骨格のまま**（`*.element.ts` ≤ 150 行、`if` ≤ 5）。

`library/elements/src/meter/meter.element.ts`: `value` / `min` / `max` を読んで `this.style.setProperty('--rd-meter-fill', ratio)`、
`MutationObserver` で属性に追随。**slider の塗りはこれと同じ仕組み**（`--rd-slider-fill`）。

`library/elements/src/_shared/field.ts`: `computeMessage({ error, validity, validationMessage, attrs, japanese })`、`usesJapaneseCopy(el)`。
`ValidationAttrs` には `min` / `max` / `step` が既にある（range の `rangeUnderflow` / `rangeOverflow` / `stepMismatch` はそのまま出る）。

`e2e/pe/build-pages.ts` の `PAGES`: 部品ごとに `'<name>.html': page('見出し', markup(...))`。フォーム部品は `<form method="get" action="/echo.html">` に入れ、
`e2e/pe/tier-a.spec.ts` が **JS を切って送信できる**ことを見る。`e2e/frameworks/shared.ts` は 4 フレームワークで同じマークアップを描いて比べる。

`system/css/src/patterns.css` は `@layer rd.components`。`.rd-window*`（017 以降は `.rd-window-bar` / `.rd-window-controls`）が在る。
`system/css/src/atoms.css`（018）に `.rd-icon-button` / `.rd-toolbar` が在る。**`.rd-input-group` は patterns.css に足す**（動的な入れ物 = pattern、静的な飾り = atom）。

## 設計（決めてある。変えるなら STOP）

### `rd-radio-group`（ティア A、experimental）

契約（`radio-group.contract.ts`）:

```ts
export const contract = {
  pe: 'A',
  roles: {
    fieldset: ':scope > fieldset',
    legend: ':scope > fieldset > legend',
    options: ':scope > fieldset label',          // 1 個以上。checkContract は最初の 1 個で判定
    control: ':scope > fieldset input[type="radio"]',
  },
  required: ['fieldset', 'legend', 'control'],
  tree: {
    tag: 'rd-radio-group',
    attrs: { segmented: '$segmented', hint: '$hint', error: '$error' },
    children: [
      {
        tag: 'fieldset',
        children: [
          { tag: 'legend', children: [{ prop: 'label' }] },
          // 選択肢は生 HTML。利用側が `radioOptionMarkup(...)` で組む
          { raw: '$children' },
        ],
      },
    ],
  },
} as const satisfies Contract

export type RadioOptionMarkupProps = {
  readonly id: string
  readonly name: string
  readonly value: string
  readonly label: string
  readonly defaultChecked?: boolean
  readonly disabled?: boolean
}
/** `<label><input type="radio" …>文言</label>`。`required` は**最初の 1 個にだけ**付ければ HTML の仕様で group 全体が必須になる */
export const radioOptionMarkup = (props: RadioOptionMarkupProps & { readonly required?: boolean }): string
export const markup = (props: RadioGroupMarkupProps): string
```

- 属性: `segmented`（boolean、reflect）、`hint`、`error`。`disabled` は `<fieldset disabled>` をそのまま使う（部品は持たない）
- `:state()`: `segmented` / `invalid` / `errored` / `hinted` / `malformed`。`checked` は要らない（どの radio かは `:checked` で見える）
- `value` getter/setter: `querySelector('input[type="radio"]:checked')?.value ?? ''` / 一致する radio に `checked = true`
- `aria-describedby` は **`<fieldset>`** に付ける（hint / error の `id`）。`aria-invalid` は各 radio ではなく `<fieldset>` に付けない
  （fieldset に `aria-invalid` は無効）→ **最初の radio** に付ける。`valueMissing` は required radio の `validity` から読む
- `invalid` は「`touched` かつ `validity.valid === false`」または `error !== ''`。`touched` は `change` / `blur` / `invalid`（checkbox と同じ）
- CSS（`radio-group.css`、`@layer rd.components`）:
  - 既定: `fieldset` は枕・罫線なし（`border: 0; padding: 0; margin: 0; min-inline-size: 0`）、`legend` は `font: var(--rd-type-label)`（018 で在る。無ければ `--rd-type-body` + 太字）、
    選択肢は `display: grid; gap: var(--rd-space-2)`、各 `label` は checkbox と同じ（`display: flex; gap; min-block-size: var(--rd-sizing-target-min)`）、
    `input` は `accent-color: var(--rd-color-accent-default)`、`:focus-visible` は focus ring トークン
  - `@supports selector(:state(segmented))` の中: `rd-radio-group:state(segmented) fieldset > div`（選択肢の入れ物。契約の `raw` は `<div part="options">` で包む）が
    `display: inline-flex; padding: var(--rd-space-1); border-radius: var(--rd-radius-full); background: var(--rd-color-surface-sunken)`、
    各 `label` が `padding-inline: var(--rd-space-4); min-block-size: var(--rd-sizing-target-min); border-radius: var(--rd-radius-full)`、
    `input` は **`appearance: none; position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%)`**
    （消さない。フォーカスは `label:has(input:focus-visible)` に ring）、`label:has(input:checked)` が `background: var(--rd-color-surface-raised); box-shadow: var(--rd-elevation-1); font-weight: var(--rd-font-weight-bold)`
    （選択は**位置・太字・面**で示す。色だけに頼らない）
  - `@media (forced-colors: active)`: segmented でも `input` を `appearance: auto; position: static; inline-size: auto; block-size: auto; clip-path: none` に戻す
  - `prefers-reduced-motion: no-preference` の中だけ `background-color` の transition
- `hint` / `error` の `<p part>` は `render()` が末尾に足す（checkbox と同じ）

### `rd-slider`（ティア A、experimental）

契約（`slider.contract.ts`）:

```ts
export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope input[type="range"]',
    output: ':scope output',     // 任意
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-slider',
    attrs: { orientation: '$orientation', hint: '$hint', error: '$error' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      { tag: 'input', attrs: { type: 'range', id: '$id', name: '$name', value: '$defaultValue', min: '$min', max: '$max', step: '$step', list: '$list' } },
      { tag: 'output', attrs: { for: '$id' }, children: [{ prop: 'defaultValue' }] },
    ],
  },
} as const satisfies Contract
```

- 属性: `orientation`（`'horizontal' | 'vertical'`、既定 horizontal、reflect）、`hint`、`error`。`unit`（文字列。`<output>` に「値 + 単位」を書く。既定 `''`）
- `:state()`: `vertical` / `invalid` / `errored` / `hinted` / `malformed`
- 部品がすること: `input` イベントで `--rd-slider-fill`（`(value - min) / (max - min)`、0–1）を **`this` に** `style.setProperty`、`<output>` があれば `textContent = value + unit`。
  `MutationObserver`（`value` / `min` / `max` 属性）で追随（meter と同じ）。純関数 `computeSliderView({ value, min, max, unit, … })` を `slider.logic.ts` に置き、`fill` と `outputText` を返す
- `value` getter/setter はネイティブに委譲。`valueAsNumber` も getter だけ委譲
- 縦向き: `writing-mode: vertical-lr` を `input[type="range"]` に当てる（**Vertical form controls は Baseline 2024**。`docs/baseline.md` の表に 1 行足すのは advisor の仕事 → 追記が必要なら報告に書く）。
  `direction: rtl` で下が最小になるので、`rd-slider:state(vertical) input { writing-mode: vertical-lr; direction: rtl; }` にして**上が最大**にする
- CSS（`slider.css`）:
  - トラックはピル（`block-size: var(--rd-space-3)`、`border-radius: var(--rd-radius-full)`、`background: var(--rd-color-surface-sunken)`）。
    **塗りは擬似要素では描かない**（`::-webkit-slider-runnable-track` に `linear-gradient` を使う手は brand.md §9 が禁じる。`::-moz-range-progress` は Firefox 専用）。
    決定: `render()` が `rd-slider` 直下に `<span part="track" aria-hidden="true"><span part="fill"></span></span>` を足し、
    `[part='fill']` を `inline-size: calc(var(--rd-slider-fill, 0) * 100%); background: var(--rd-color-accent-default); border-radius: var(--rd-radius-full)` で描く。
    `rd-slider` は `display: grid`（label / 重ねた track+input / output の 3 行）、track と `input` は同じグリッド領域に重ね、
    `input` 自身のトラックは透明（`appearance: none; background: transparent`）にしてつまみだけ描き、`position: relative; z-index: 1` で上に置く。
    `input` には `margin: 0; inline-size: 100%` を当てて track と幅を揃える（つまみの半径ぶんは `[part='track']` の `margin-inline: calc(var(--rd-space-6) / 2)` で吸収）
  - つまみ: `::-webkit-slider-thumb` / `::-moz-range-thumb` を `inline-size: var(--rd-space-6); block-size: var(--rd-space-6); border-radius: var(--rd-radius-full); background: var(--rd-color-surface-raised); border: var(--rd-border-width-default) solid var(--rd-color-border-strong); box-shadow: var(--rd-elevation-1)`
    （brand.md §4: つまみは `radius.full`）。標的 24×24 以上（WCAG 2.5.8）
  - `:focus-visible` はつまみに ring（`::-webkit-slider-thumb` に `outline` が効かないブラウザがあるので `input:focus-visible` に `outline` を当て `outline-offset` で外に出す）
  - 縦向き: `rd-slider:state(vertical)` で `display: inline-grid; block-size: var(--rd-slider-block-size, 10rem)`、track は `inline-size: var(--rd-space-3); block-size: calc(var(--rd-slider-fill, 0) * 100%); align-self: end`
  - `@media (forced-colors: active)`: `input { appearance: auto }`、`[part='track'] { display: none }`
  - `<output>` は `font: var(--rd-type-small); font-variant-numeric: tabular-nums; color: var(--rd-color-text-muted)`
- `<datalist>`（目盛）は利用側が置く。部品は `list` 属性を通すだけ（story `Variants` で 1 つ見せる）

### `.rd-input-group`（CSS のみ、`patterns.css`）

```html
<div class="rd-input-group">
  <label class="rd-visually-hidden" for="q">検索</label>
  <input id="q" name="q" type="search" />
  <rd-button><button type="submit">検索</button></rd-button>
</div>
```

- `display: flex; align-items: stretch; padding: var(--rd-space-1); border-radius: var(--rd-radius-full); background: var(--rd-color-surface-sunken)`
- 子の `input` / `select` は `flex: 1; min-inline-size: 0; border: 0; background: transparent; padding-inline: var(--rd-space-3); font: inherit`、
  `:focus-visible` は **`.rd-input-group:has(:focus-visible)`** に ring を出す（枕ごと光る。入力自身の outline は `outline: none` にしてよい—代替があるので）
- 末尾の `rd-button` / `.rd-icon-button` はピルのまま（brand.md §7.2）
- `:has(:user-invalid)` で `outline: var(--rd-focus-ring-width) solid var(--rd-color-status-danger-default)`
- `@media (forced-colors: active)`: `border: var(--rd-border-width-default) solid CanvasText`、`input { border: var(--rd-border-width-default) solid CanvasText }`
- `rd-text-field` を中に入れる形は**対象外**（text-field は自分で hint / error を持つ。入れ子は次の plan で判断）

### Step 0 — `rd-text-field` の型を story で見せる

shadcn の Input / Textarea / Native Select / Date Picker に相当するものは既に `rd-text-field`（`input` の全 `type` と `textarea`）と `rd-select` で足りている。
足りないのは**見せ方**。`text-field.stories.ts` に `Types` story（`type` = `search` / `number` / `date` / `password` / `url` の 5 つと `<textarea>` を並べる）を 1 つ足す。
既存の story は変えない。`e2e/__screenshots__` に 1 枚増える。

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備と text-field の `Types` story（`test(storybook): show every text-field type`）

```bash
bun install --frozen-lockfile && bun run build && bun run gen && bun run check && bun run test
```

全部 exit 0 を確認してから始める（落ちるなら STOP。あなたの変更ではない）。`Types` story を足し、`bun run test -- --project storybook library/elements/src/text-field` green。

### Step 1 — `rd-radio-group` の契約と logic（`feat(elements): add rd-radio-group contract and logic`）

```bash
bun run scaffold:element radio-group --pe A
```

red: `radio-group.contract.test.ts`（`markup()` が `<fieldset><legend>` と `radioOptionMarkup` の `<label><input type="radio">` を出す。`segmented: true` で属性が付く。
`checkContract` が legend 無しを `missing` にする）、`radio-group.logic.test.ts`（`computeRadioGroupView`: `valueMissing` + `touched` → `invalid` と文言「未入力です。入力してください。」、
`error` 属性が最優先、`segmented` → states に `segmented`、`hasHint` → `hinted`、`describedBy` が hint / error の id を空白区切りで返す）。
green: 契約と logic。`bun run test -- --project node library/elements/src/radio-group`。

### Step 2 — `rd-radio-group` の element / css / story（`feat(elements): add rd-radio-group (experimental, tier A)`）

red: `radio-group.test.ts`（browser。契約 OK で `malformed` が付かない、`value` getter が checked の値を返す、setter で切り替わる、required 未選択で `invalid` イベント後に `[part='error']` が出る、
`segmented` で `:state(segmented)`）、`radio-group.sr.test.ts`（仮想 SR: legend が group の名前として読まれる、選択肢が「radio, 1 of 3」相当で読まれる、hint が `aria-describedby` で読まれる）。
green: element（≤ 150 行、`if` ≤ 5）、`radio-group.css`、story 8 種 + `Segmented` + `Segmented` の `Disabled`（`<fieldset disabled>`）。
`bun run gen` → `custom-elements.json` / `registry.json` / ラッパー再生成を同じコミットに含める。`bun run test -- --project browser --project storybook library/elements/src/radio-group`。

### Step 3 — `rd-slider` の契約と logic（`feat(elements): add rd-slider contract and logic`）

```bash
bun run scaffold:element slider --pe A
```

red: `slider.contract.test.ts`（`markup()` が `<label for>` + `<input type="range">` + `<output for>` を出す、`min` / `max` / `step` / `list` が通る）、
`slider.logic.test.ts`（`computeSliderView({ value: '3', min: '0', max: '10', unit: ' GB' })` → `fill: 0.3`、`outputText: '3 GB'`; `max <= min` → `fill: 0`; 数にならない値 → `fill: 0`;
`orientation: 'vertical'` → states に `vertical`; `rangeOverflow` + `touched` → `invalid` と「大きすぎます。10 以下で入力してください。」）。
green。`bun run test -- --project node library/elements/src/slider`。

### Step 4 — `rd-slider` の element / css / story（`feat(elements): add rd-slider (experimental, tier A)`）

red: `slider.test.ts`（browser。`input` イベントで `style.getPropertyValue('--rd-slider-fill')` が変わる、`<output>` の文言が変わる、`max` 属性の変更に追随（MutationObserver）、
`orientation="vertical"` で `:state(vertical)`、`[part='track']` が `aria-hidden="true"`）、`slider.sr.test.ts`（`slider` 役割、名前は label、値が読まれる）。
green: element、`slider.css`（縦向き含む）、story 8 種 + `Vertical` + `WithTicks`（`<datalist>`）。`bun run gen`。
`bun run test -- --project browser --project storybook library/elements/src/slider`。

### Step 5 — `.rd-input-group`（`feat(css): add the input group pattern`）

red: `system/css/test/patterns.test.ts`（既存があればそこに追記。`.rd-input-group` と `.rd-input-group:has(:focus-visible)` と `forced-colors` ブロックが在る、`linear-gradient` を含まない）。
green: `patterns.css` に追記。`bun run check`（stylelint）。Storybook の story は **`apps/storybook` を触れない**ので、`e2e/pe/build-pages.ts` に `'input-group.html'`（検索フォーム）を足し、
`e2e/pe/tier-a.spec.ts` に「JS 無しで送信できる」を 1 ケース足す（`rd-button` 込み）。

### Step 6 — 露出と検証面（`feat(elements): export radio-group and slider from experimental` / `test(e2e): cover radio-group and slider`）

- `library/elements/package.json` の `exports` に 8 ブロック、`src/experimental/{radio-group,slider}/index.ts`
- `e2e/pe/build-pages.ts` に `'radio-group.html'`（required、`segmented` 版も）と `'slider.html'` を足す。`tier-a.spec.ts` に「JS 無しで送信できる（`?plan=pro`、`?volume=3`）」
- `e2e/frameworks/shared.ts` に `radioGroupMarkup` / `sliderMarkup` を足し、4 フレームワークで同じ木になることを見る（`e2e/{react,vue,svelte,astro}` のページに置く。既存の置き方に倣う）
- `.size-limit.json` に `experimental/radio-group/define` と `experimental/slider/define`（各 12 KB）
- `tools/mcp/src/examples.ts` に 2 部品の例（既存の checkbox / meter の例に倣う）→ `tools/mcp/test` green
- `docs/proposals/radio-group.md` / `docs/proposals/slider.md`（`docs/proposals/meter.md` と同じ見出し: 目的 / API / a11y / 代替案）

```bash
bun run build && bun run gen && bun run pe && bun run e2e:frameworks
```

### Step 7 — VRT とガイドライン確認（`test(vrt): baselines for radio-group, slider and input group`）

```bash
bun run storybook:build
bash scripts/vrt.sh --update-snapshots --grep 'RadioGroup|Slider|TextField'
bash scripts/vrt.sh
bun run a11y
```

新規の画像だけが増えること（`TextField` は `Types` の 1 枚のみ増える）。

### Step 8 — 仕上げ

```bash
bun run check && bun run test && bun run release:check
bash scripts/guard.sh
git diff --name-only main...HEAD
```

changeset（minor、`@rimltempest/riml-ds-elements`: 「experimental に rd-radio-group / rd-slider」、`@rimltempest/riml-ds-css`: 「`.rd-input-group`」）。

## 完了条件（機械で検査できるもの）

- `bun run gen` 後 `grep -c '"rd-radio-group"\|"rd-slider"' tools/cem/registry.json` ≥ 2、両方 `"status": "experimental"`, `"pe": "A"`
- `test -f library/react/src/generated/RdRadioGroup.ts -a -f library/react/src/generated/RdSlider.ts`（ファイル名は既存の生成物の命名に合わせる）
- `bun run pe` exit 0（`radio-group.html` / `slider.html` / `input-group.html` が JS 無しで送信できる）
- `bun run e2e:frameworks` exit 0
- `bun run test` exit 0（node + browser + storybook。新規 story 全部で AAA の axe が通る）
- `bash scripts/vrt.sh` exit 0
- `wc -l library/elements/src/radio-group/radio-group.element.ts library/elements/src/slider/slider.element.ts` それぞれ ≤ 150
- `grep -c 'linear-gradient\|radial-gradient' library/elements/src/radio-group/radio-group.css library/elements/src/slider/slider.css system/css/src/patterns.css` = 0
- `bun run release:check` exit 0（size-limit 内）
- `bash scripts/guard.sh` exit 0

## STOP する条件（改善せず報告する）

- 必要なトークンが無い（例: `--rd-type-label` / `--rd-elevation-1` / `--rd-space-12`）→ 名前と用途を書いて STOP。`system/tokens` は触らない
- `checkContract` が `options`（複数一致）の役割を扱えない → `_shared/contract.ts` を変えずに、`required` から外して element 側で `querySelectorAll` する。それでも無理なら STOP
- `writing-mode: vertical-lr` の range が Vitest browser（Chromium）で動かない → 縦向きを `@supports` で囲み、報告に書く（縮退は許す。落とすのは不可）
- ラッパー生成器（`tools/cem/src/wrappers`）が `<output for>` や `raw` 子を扱えず落ちる → STOP（`tools/cem/src` は触らない）
- `scaffold:element` が無い、または出力が skill のファイル構成と違う → STOP
- size-limit を 2 KB 以上超える → STOP（`define` に lit 以外の依存が混ざっている可能性）

## スコープ外

- Toggle（単体の押下ボタン）、Combobox（`<input list>`）、Input OTP、Date Picker の独自 UI、File input → 次の wave（plans/README のバックログ）
- `rd-text-field` を `.rd-input-group` に入れる形
- Storybook の Patterns story（`apps/storybook` は別レーン。advisor が 020 のあとに `Patterns/InputGroup` を足す）

## 保守メモ

- `segmented` の見た目は `:has()` と `:state()` に依存する。どちらかが無いブラウザでは**普通の radio に見える**（退行しない）。VRT は Chromium だけなので、Firefox / Safari の縮退は `docs/baseline.md` の方針どおり手で確かめない
- slider の塗り（`[part='track']`）は **JS が無いと出ない**（ネイティブのトラックだけ）。それが正しい縮退（ティア A: 動く ≠ 同じ見た目）
- `<output for>` の値は JS が無いと初期値のまま。契約で `defaultValue` を中に書いているのはそのため
- `radioOptionMarkup` の `required` を最初の 1 個に付ける約束は HTML の仕様（同名 radio のどれかに `required` があれば group が必須）。ラッパーの `children` を組む利用側にも `docs/proposals/radio-group.md` で書く
