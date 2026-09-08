# 021: フォーム部品 wave 4 — `rd-toggle`、`rd-checkbox-group`（segmented 付き）、`rd-input-otp`、`.rd-button-group`

**優先度**: P1　**規模**: L　**依存**: 019（マージ済み。`library/elements/src/radio-group/**` と `.rd-input-group` が在ること）
**レーン**: `feat/form-wave4`　**計画時の main**: `9cfed6d`（019 マージ後。020 とは並行 — 020 のファイルには触らない）

> **Drift check（最初に実行）**:
> `test -d library/elements/src/toggle -o -d library/elements/src/checkbox-group -o -d library/elements/src/input-otp && echo EXISTS` が何も出ないこと。出たら STOP。
> `grep -c 'rd-button-group' system/css/src/patterns.css` が 0 であること。
> `test -d library/elements/src/radio-group && grep -c 'rd-input-group' system/css/src/patterns.css` が 1 以上であること（019 が入っている前提）。
> `library/elements/src/radio-group/radio-group.element.ts` を読み、「現状のコード」の抜粋と見比べる。
> 骨格（`checkContract` → `bindListeners` → `syncStates` / `syncAttribute`）が変わっていたら STOP。

## なぜ

基礎の部品が少ない、というオーナーの指摘（shadcn/ui の一覧を基準にする）。019 のあとフォーム側に残っているのは
**Toggle（押下状態を持つボタン）**、**Toggle Group の複数選択版**、**Input OTP（ワンタイムコード）**、
**Button Group（ボタンの列を 1 つの枕にまとめる形）**。riml-ds ではフォームに参加する部品・ボタンは
**ティア A**（ADR-0012。light DOM でネイティブを包む）でしか作れないので、

- Toggle は **`<button type="button" aria-pressed>`** を包む。部品がするのは押下で `aria-pressed` を反転し `:state(pressed)` を
  写すことだけ。**送信に載せたい値なら `rd-checkbox`（`switch`）を使う**。JS が無いときは「押しても変わらない普通のボタン」に
  縮退する（害は無い。proposal に明記する）
- Toggle Group の複数選択版は **`<input type="checkbox">` の列をピルの区画に見せる**形。`rd-radio-group` の `segmented` と
  対になる `rd-checkbox-group`（`segmented` 属性）。単一選択は 019 の `rd-radio-group segmented` で足りている
- Input OTP は **桁ごとの `<input inputmode="numeric" maxlength="1">`** を `<fieldset>` に並べる。JS が無くても Tab で
  1 桁ずつ入力して送信できる。JS があるときだけ自動前進・Backspace で戻る・貼り付けで分配する
- Button Group は JS が要らないので**部品にしない**。`patterns.css` の `.rd-button-group`（`.rd-input-group` と同じ判断）

参考画面（Phase E の指示画像）から持ち込むのは **ピルの区画・沈んだ枕の中に浮くピル** という構図だけ。
絵・アイコン・文言・ロゴは写さない（brand.md §9）。

守る不変条件:

- **AAA**（文字 7:1・非文字 3:1）。色は semantic トークンだけ（`--rd-color-palette-*` は stylelint が落とす）
- **ネイティブ要素に値を持たせる**。部品は `value` を委譲する getter/setter だけ
- **`outline: none` / `outline-width: 0` を書かない**（Chromium は `outline-style: auto` のとき幅を無視して二重の輪になる。
  置き換えるなら要素自身の `outline` + `outline-offset` で描く）。強制配色で選択・押下を示すのは
  `outline: var(--rd-border-width-default) solid Highlight`（`background: Highlight` は Chromium のバックプレートで読めなくなる）
- 動きは `prefers-reduced-motion: no-preference` の中だけ。強制配色では `appearance: auto` に戻す
- `.size-limit.json` の予算内（新部品 1 つ = `define` 12 KB。超えたら 1 KB 単位で上げ、理由を changeset に書く）
- 検証文言は `_shared/field.ts` の `computeMessage`（`system/guidelines/writing.md` が正）。新しい文言を足さない

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/radio-group/**`**（`<fieldset><legend>` + 複数の `<input>`、`bindListeners` を各 input に付ける）と
  **`library/elements/src/button/**`**（`<button>` を包み、click を聞く）
- `any` / `as` / `!` / `enum` を書かない。`class` は `*.element.ts` の `extends LitElement` だけ。リアクティブな prop は
  `static properties` + `declare` + constructor 初期化（デコレータ禁止、ADR-0005 §4）
- **失敗するテストを先に書く**（logic は Vitest node、DOM は Vitest browser `*.test.ts`、読み上げは `*.sr.test.ts`、見た目は VRT）
- `*.element.ts` / `*.contract.ts` を変えたら `bun run gen`（CEM・registry・ラッパー・argTypes。guard 検査 15）
- 新部品は `bun run scaffold:element toggle --pe A` / `bun run scaffold:element checkbox-group --pe A` / `bun run scaffold:element input-otp --pe A` で
  骨格を作る（上書きしない）。`library/elements/package.json` の `exports` に `./experimental/<name>{,/contract,/define,/style.css}` を足す
  （`radio-group` の 4 ブロックを手本に。ワイルドカード禁止）
- story は 8 種（`Default` / `Variants` / `Disabled` / `Invalid` / `Dark` / `ForcedColors` / `ReducedMotion` / `RTL` / `Dense`）。
  a11y の除外には `reason:` を付ける
- CSS の単位: `px` は罫線・アウトラインだけ。それ以外は `rem` か `--rd-*`
- 触ってよいパス（`scripts/lanes.tsv` の `feat/form-wave4`）: `library/elements/src/{toggle,checkbox-group,input-otp}/**`（新規）、
  `library/elements/src/experimental/{toggle,checkbox-group,input-otp}/**`（新規）、`library/elements/package.json`（exports のみ）、
  `system/css/src/patterns.css`（`.rd-button-group` の追記のみ）、`system/css/test/**`、
  `library/{react,vue,svelte,astro}/src/generated/**`（再生成物のみ）、`tools/cem/registry.json`、`library/elements/custom-elements.json`、
  `tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`library/react/test/**`、`e2e/**`、`.size-limit.json`、
  `docs/proposals/{toggle,checkbox-group,input-otp}.md`（新設）、`.changeset/`
  **触らない**: `system/tokens/**`（値が要るなら STOP）、`system/css/src/` の他ファイル、
  `library/elements/src/{button,dialog,checkbox,select,disclosure,toast,meter,live-region,window,radio-group,slider,text-field,tabs,menu,popover,tooltip}/**`、
  `library/elements/src/_shared/**`（純関数が要るなら**自分の部品の `*.logic.ts` に置く**）、
  `apps/storybook/**`、`docs/*.md`、`plans/README.md`、`skills/**`、`.claude/**`、`DESIGN.md`、`scripts/**`、`.github/**`
- コミットは段階ごと（下の Step の粒度）。Conventional Commits
- **並行レーン 020（`feat/nav-overlays`）が同時に進んでいる。** `library/elements/package.json` / `custom-elements.json` / `registry.json` /
  `tools/mcp/src/examples.ts` / `tools/mcp/test/core/elements.test.ts` / `e2e/pe/build-pages.ts` / `library/react/test/markup.test.tsx` /
  `.size-limit.json` は両レーンが追記する。**自分の追記は既存の末尾ではなくアルファベット順の位置に入れる**（マージの衝突を小さくする）。
  衝突の解決は advisor がやる。`git merge main` はしてよいが、コンフリクトが出たら**自分で解決せず STOP**

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/radio-group/radio-group.contract.ts`（**checkbox-group はこの形をそのまま倣う**。`radio` → `checkbox`）:

```ts
export const contract = {
  pe: 'A',
  roles: {
    fieldset: ':scope > fieldset',
    legend: ':scope > fieldset > legend',
    options: ':scope > fieldset label',
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
          { tag: 'div', attrs: { part: 'options' }, children: [{ raw: '$children' }] },
        ],
      },
    ],
  },
} as const satisfies Contract
// 選択肢 1 個分は optionTree + radioOptionMarkup(props)（label / input の順。文言も属性値もエスケープされる）
```

`radio-group.element.ts` の骨格: `createRenderRoot() { return this }`、`firstUpdated` で `checkContract` → 各 radio に `bindListeners(radio, this.#listeners)`
（`change` / `blur` / `invalid` で `#touched`）、`updated` で `syncStates` と各 radio の `aria-describedby`、`render()` は hint / error の `<p part>` だけ。
`value` は getter/setter でネイティブに委譲。`#view()` が `computeRadioGroupView(...)` に `validity` / `validationMessage` / `japanese: usesJapaneseCopy(this)` /
`touched` を渡す。**149 行**。新部品も **≤ 150 行、`if` ≤ 5**。

`library/elements/src/button/button.element.ts`: `#control` に `click` を付け、`decidePress({ loading })` が `blocked` なら
`preventDefault` + `stopImmediatePropagation`、そうでなければ `rd-press` を出す。`syncAttribute(this.#control, 'aria-busy', …)`。

`library/elements/src/_shared/native-control.ts`: `bindListeners(el, listeners): Binding`（`detach()` を持つ）、`readAttrs`、`setControlValue`。
`_shared/internals.ts`: `syncStates(internals, Set)`、`syncAttribute(el, name, value | null)`。`_shared/field.ts`: `computeMessage`、`usesJapaneseCopy`。

`system/css/src/patterns.css` の `.rd-input-group`（**`.rd-button-group` はこの直後に足す**）:
`display: flex; align-items: stretch; padding: var(--rd-space-1); border-radius: var(--rd-radius-full); background: var(--rd-color-surface-sunken)`、
`:has(:focus-visible)` で枕が `--rd-color-surface-hover`、`:has(:user-invalid)` で danger の outline、forced-colors で `CanvasText` の罫線。

`e2e/pe/build-pages.ts` の `PAGES`: `'<name>.html': page('見出し', markup(...))`。フォーム部品は `<form method="get" action="/echo.html">` に入れ、
`e2e/pe/tier-a.spec.ts` が **JS を切って送信できる**ことを見る。`e2e/frameworks/shared.ts` は `radioGroupAndSliderSuite(framework)` のように
部品ごとの suite を export し、`e2e/{react,vue,svelte}/…spec.ts` が呼ぶ（**astro は除外**する前例。`library/astro` の experimental export は別レーン）。
`library/react/test/markup.test.tsx` は `./experimental` バレルの export 名一覧を `toEqual` で固定している → 新部品 3 つを**アルファベット順の位置に**足す。

## 設計（決めてある。変えるなら STOP）

### `rd-toggle`（ティア A、experimental）

契約（`toggle.contract.ts`）:

```ts
export const contract = {
  pe: 'A',
  roles: { control: ':scope > button' },
  required: ['control'],
  tree: {
    tag: 'rd-toggle',
    attrs: { variant: '$variant' },
    children: [
      { tag: 'button', attrs: { type: 'button', 'aria-pressed': '$pressed' }, children: [{ prop: 'label' }] },
    ],
  },
} as const satisfies Contract
export type ToggleMarkupProps = { readonly label: string; readonly pressed?: 'true' | 'false'; readonly variant?: ToggleVariant }
```

- `pressed` は **`aria-pressed` が唯一の真実**（属性 `'true' | 'false'`。`markup()` の既定は `'false'` — 省略すると `aria-pressed` 自体が
  消えて toggle でなくなるので、`markupProps.pressed ?? 'false'` を渡す）。部品の `pressed` は getter/setter でネイティブに委譲
  （`el.pressed` → `button.getAttribute('aria-pressed') === 'true'`）
- `variant`: `'outline' | 'ghost'`（既定 `'outline'`）。`ToggleVariant` は `toggle.logic.ts` に置く
- logic（`toggle.logic.ts`）: `computeToggleView({ pressed, variant, malformed })` → `states`（`pressed` / `outline` / `ghost` / `malformed`）、
  `nextPressed(current: boolean)` → `!current`（1 行でも純関数として置く。テストの起点）
- element: `click` を聞いて `aria-pressed` を反転し、`rd-toggle` イベント（`detail: { pressed }`、bubbles + composed）を出す。
  `disabled` はネイティブの `<button disabled>` をそのまま使う（部品は見ない）。`MutationObserver`（`aria-pressed`）で外からの変更にも
  `:state(pressed)` を追随させる（`rd-meter` の `OBSERVED` と同じ作り）
- CSS（`toggle.css`）: `rd-toggle > button` はピル（`min-block-size: var(--rd-sizing-target-min)`、`padding-inline: var(--rd-space-4)`、
  `border-radius: var(--rd-radius-full)`、`font: var(--rd-type-body)`）。`outline` 既定は `border: var(--rd-border-width-default) solid var(--rd-color-border-strong); background: transparent`、
  `ghost` は罫線無し。**押下（`[aria-pressed='true']`）は `background: var(--rd-color-accent-default); color: var(--rd-color-text-on-accent); border-color: transparent`**。
  `:hover` は `--rd-color-surface-hover`（押下中は `--rd-color-accent-hover`）。`:focus-visible` は `outline: var(--rd-focus-ring-width) solid var(--rd-focus-ring-color); outline-offset: var(--rd-focus-ring-offset)`。
  `@media (forced-colors: active)`: 押下は `outline: var(--rd-border-width-default) solid Highlight; outline-offset: calc(-1 * var(--rd-space-1))`（背景色で示さない）。
  `@media (prefers-reduced-motion: no-preference)` で `transition: background-color var(--rd-motion-duration-fast) var(--rd-motion-easing-standard)`
- 読み上げ: `button, pressed` / `button, not pressed`（`toggle.sr.test.ts`）

### `rd-checkbox-group`（ティア A、experimental）

- 契約は `radio-group.contract.ts` を `checkbox` に置き換えたもの。`checkboxOptionMarkup(props)`（`id` / `name` / `value` / `label` / `defaultChecked` / `disabled` / `required`）。
  `required` は radio と違い**各 checkbox に個別に効く**（HTML の仕様）ので、「1 つ以上選べ」は **`min` 属性**（数値、既定 0）で部品が見る
- 属性: `hint`、`error`、`segmented`（Boolean reflect）、`min`（Number。`min="1"` で「1 つ以上」）
- logic（`checkbox-group.logic.ts`）: `computeCheckboxGroupView({ checkedCount, min, error, touched, hasHint, hasError, malformed, segmented, japanese, hintId, errorId })` →
  `states`（`segmented` / `invalid` / `errored` / `hinted` / `filled` / `malformed`）、`message`、`describedBy`。
  `min` 未満で `touched` なら `invalid` と文言（**`computeMessage` の `valueMissing` と同じ文言**「未入力です。入力してください。」を使う。
  `computeMessage({ validity: { valueMissing: true }, … })` を呼んで新しい文言を足さない）
- element: `value` getter は checked の値の **配列**（`readonly string[]`）、setter は配列を受けて checked を揃える。`checkValidity()` は
  すべての checkbox の `checkValidity()` かつ `checkedCount >= min`。`aria-describedby` は各 checkbox に付ける（radio-group と同じ。`aria-invalid` は付けない）。
  `min` 未満のときネイティブの `invalid` は出ないので、**`submit` 前の検証は利用側が `checkValidity()` を呼ぶ**（proposal に明記。tier A の縮退として JS 無しでは `min` は効かない）
- CSS（`checkbox-group.css`）: `radio-group.css` の `segmented` の見た目をそのまま（`[part='options']` が沈んだピル枕、`label` がピル、`:has(:checked)` でアクセント塗り、
  forced-colors は `outline … Highlight`）。**コピーでよい**（`_shared` に共通 CSS を置く仕組みは無い。重複は proposal の「保守メモ」に書く）
- 読み上げ: `group` の名前が legend、各項目が `checkbox, checked/not checked`

### `rd-input-otp`（ティア A、experimental）

契約（`input-otp.contract.ts`）:

```ts
export const contract = {
  pe: 'A',
  roles: {
    fieldset: ':scope > fieldset',
    legend: ':scope > fieldset > legend',
    control: ':scope > fieldset input',   // 桁。checkContract は最初の 1 個で判定
  },
  required: ['fieldset', 'legend', 'control'],
  tree: {
    tag: 'rd-input-otp',
    attrs: { hint: '$hint', error: '$error' },
    children: [
      {
        tag: 'fieldset',
        children: [
          { tag: 'legend', children: [{ prop: 'label' }] },
          { tag: 'div', attrs: { part: 'cells' }, children: [{ raw: '$children' }] },
        ],
      },
    ],
  },
} as const satisfies Contract
```

- `otpCellsMarkup({ name, length = 6, autocomplete = true })` が桁を組む: `<input type="text" inputmode="numeric" pattern="[0-9]" maxlength="1" name="${name}-${i}" aria-label="${i} 桁目" required autocomplete="one-time-code">`
  （`autocomplete` は**最初の 1 桁だけ**。`aria-label` は `japanese` を見ない — `usesJapaneseCopy` は element 側の概念で、markup は静的。
  英語が要る利用側は `children` を自分で組む）。`length` は `markup()` だけが使う。**element は `length` を持たず、実際の `<input>` の数を数える**
- logic（`input-otp.logic.ts`）: `nextCellIndex({ index, count, key })`（`ArrowRight`/入力後 → `index + 1`、`ArrowLeft`/`Backspace`(空のとき) → `index - 1`、範囲外は端に留める）、
  `distributePaste({ text, count })` → 数字だけを `count` 桁に分けた配列、`computeOtpView({ values, error, touched, hasHint, hasError, malformed, japanese, hintId, errorId })` →
  `states`（`invalid` / `errored` / `hinted` / `filled`（全桁埋まった）/ `malformed`）、`message`、`describedBy`、`value`（連結）
- element: 各 `<input>` に `bindListeners`（`input`: 1 文字入ったら次へ focus、`keydown`: `Backspace` で空なら前へ、矢印で移動、`paste`: `distributePaste` で埋めて末尾へ focus、
  `blur` / `invalid`: touched）。`value` getter は連結、setter は分配。`checkValidity()` は全桁。`aria-describedby` は各桁。
  **`if` ≤ 5** を守るため、キー処理は logic の `nextCellIndex` に寄せ、element は返ってきた index に focus するだけ
- CSS（`input-otp.css`）: `[part='cells']` は `display: flex; gap: var(--rd-space-2)`、各 `input` は正方形（`inline-size: var(--rd-sizing-target-min); block-size: var(--rd-sizing-target-min)`、
  `text-align: center`、`font: var(--rd-type-heading-3)`、`font-variant-numeric: tabular-nums`、`border: var(--rd-border-width-default) solid var(--rd-color-border-strong)`、
  `border-radius: var(--rd-radius-md)`、`background: var(--rd-color-surface-raised)`）。`:focus-visible` は ring。`:user-invalid` は danger の罫線。
  `rd-input-otp:state(invalid) input` も danger。`@media (forced-colors: active)`: 罫線 `CanvasText`。**入力中の桁を `caret-color: var(--rd-color-accent-default)`**
- 読み上げ: `group` の名前が legend、各桁が `textbox, 1 桁目`。hint が `aria-describedby` で読まれる

### `.rd-button-group`（CSS のみ、`patterns.css`）

```html
<div class="rd-button-group" role="group" aria-label="表示">
  <rd-toggle><button type="button" aria-pressed="true">一覧</button></rd-toggle>
  <rd-toggle><button type="button" aria-pressed="false">格子</button></rd-toggle>
</div>
```

- `display: inline-flex; gap: var(--rd-space-1); padding: var(--rd-space-1); border-radius: var(--rd-radius-full); background: var(--rd-color-surface-sunken)`
- 中の `rd-button` / `rd-toggle` / `.rd-icon-button` はピルのまま（brand.md §7.2。角を削らない）
- `role="group"` + `aria-label` は**利用側が付ける**（コメントに書く。`.rd-alert` の role と同じ判断）
- `@media (forced-colors: active)`: `border: var(--rd-border-width-default) solid CanvasText`
- `.rd-button-group[data-orientation='vertical']` は `flex-direction: column`（縦の並びは参考画面のツールバー）

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

```bash
bun install --frozen-lockfile && bun run build && bun run gen && bun run check && bun run test
```

全部 exit 0 を確認してから始める（落ちるなら STOP。あなたの変更ではない）。

### Step 1 — `rd-toggle`（`feat(elements): add rd-toggle (experimental, tier A)`）

`bun run scaffold:element toggle --pe A`。red: `toggle.contract.test.ts`（`markup()` が `<button type="button" aria-pressed="false">` を出す、`pressed: 'true'` が通る）、
`toggle.logic.test.ts`（`computeToggleView` の states、`nextPressed`）、`toggle.test.ts`（browser。click で `aria-pressed` が反転し `:state(pressed)`、`rd-toggle` の `detail.pressed`、
`disabled` の button は click しても変わらない（ネイティブが click を出さない）、外から `aria-pressed` を書き換えると state が追随、`pressed` setter）、
`toggle.sr.test.ts`。green: contract / logic / element / css / story 8 種 + `Pressed`。`bun run gen`。
`bun run test -- --project node --project browser --project storybook library/elements/src/toggle`。

### Step 2 — `rd-checkbox-group`（`feat(elements): add rd-checkbox-group (experimental, tier A)`）

`bun run scaffold:element checkbox-group --pe A`。red: contract（`checkboxOptionMarkup`、`segmented` / `min` 属性）、logic（`min: 1` + `checkedCount: 0` + `touched` → `invalid` と文言、
`error` 最優先、`filled`）、browser（`value` が配列、setter、`min` 未満で blur 後に `[part='error']`、`segmented` で `:state(segmented)`、`checkValidity()`）、sr。
green: story 8 種 + `Segmented` + `SegmentedDisabled`（`<fieldset disabled>`）+ `Min`。`bun run gen`。

### Step 3 — `rd-input-otp`（`feat(elements): add rd-input-otp (experimental, tier A)`）

`bun run scaffold:element input-otp --pe A`。red: contract（`otpCellsMarkup` が 6 桁、`autocomplete` は最初だけ、`aria-label` が「1 桁目」…）、logic（`nextCellIndex` の端、`distributePaste('12-34 56', 6)` → `['1','2','3','4','5','6']`、
`computeOtpView` の `filled` / `value`）、browser（1 桁入力で次の桁に focus、`Backspace` で戻る、貼り付けで埋まる、`value` getter/setter、全桁で `:state(filled)`）、sr。
green: story 8 種 + `Filled`。`bun run gen`。

### Step 4 — `.rd-button-group`（`feat(css): add the button group pattern`）

red: `system/css/test/patterns.test.ts` に `.rd-button-group` と `[data-orientation='vertical']` と forced-colors のブロックが在ること、`linear-gradient` を含まないこと。
green: `patterns.css` に追記。`bun run check`。`e2e/pe/build-pages.ts` に `'button-group.html'`（`rd-toggle` 2 個入り）。

### Step 5 — 露出と検証面（`feat(elements): export toggle, checkbox-group and input-otp from experimental` / `test(e2e): cover form wave 4`）

- `library/elements/package.json` の `exports` に 12 ブロック（アルファベット順の位置）、`src/experimental/{toggle,checkbox-group,input-otp}/index.ts`
- `e2e/pe/build-pages.ts` に `'toggle.html'` / `'checkbox-group.html'`（`min="1"`、`segmented` 版も）/ `'input-otp.html'`。`tier-a.spec.ts` に「JS 無しで送信できる（`?tags=a&tags=b`、`?code-1=1&…`）」
- `e2e/frameworks/shared.ts` に `formWave4Suite(framework)`（3 部品の `compareMarkup`）を足し、`e2e/{react,vue,svelte}` で呼ぶ（astro は除外）
- `library/react/test/markup.test.tsx` の export 一覧に `RdCheckboxGroup` / `RdInputOtp` / `RdToggle`（アルファベット順）
- `.size-limit.json` に 3 つ（各 12 KB）
- `tools/mcp/src/examples.ts` に 3 部品の例（既存の radio-group の例に倣う）→ `tools/mcp/test` green（要素名一覧のテストがあれば足す）
- `docs/proposals/{toggle,checkbox-group,input-otp}.md`（`docs/proposals/slider.md` と同じ見出し: 目的 / API / a11y / 代替案。
  toggle には「送信に載せるなら rd-checkbox switch」、checkbox-group には「`min` は JS 無しでは効かない」、input-otp には「値は `name-1..N` の N フィールド」を書く）

```bash
bun run build && bun run gen && bun run pe && bun run e2e:frameworks
```

### Step 6 — VRT（`test(vrt): baselines for toggle, checkbox group, input otp and button group`）

```bash
bun run storybook:build
bash scripts/vrt.sh --update-snapshots --grep 'Toggle|CheckboxGroup|InputOtp'
bash scripts/vrt.sh
bun run a11y
bun run render && bun run lint:html
```

新規の画像だけが増えること（既存の画像が変わったら STOP して差分を報告）。

### Step 7 — 仕上げ

```bash
bun run check && bun run test && bun run release:check
bash scripts/guard.sh
git diff --name-only main...HEAD
```

changeset（minor、`@rimltempest/riml-ds-elements`: 「experimental に rd-toggle / rd-checkbox-group / rd-input-otp」、`@rimltempest/riml-ds-css`: 「`.rd-button-group`」）。

## 完了条件（機械で検査できるもの）

- `bun run gen` 後 `grep -c '"rd-toggle"\|"rd-checkbox-group"\|"rd-input-otp"' tools/cem/registry.json` ≥ 3、すべて `"status": "experimental"`, `"pe": "A"`
- `test -f library/react/src/generated/RdToggle.ts -a -f library/react/src/generated/RdCheckboxGroup.ts -a -f library/react/src/generated/RdInputOtp.ts`
- `bun run pe` exit 0（`toggle.html` / `checkbox-group.html` / `input-otp.html` / `button-group.html` が JS 無しで読める・送信できる）
- `bun run e2e:frameworks` exit 0
- `bun run test` exit 0（新規 story 全部で AAA の axe が通る）
- `bash scripts/vrt.sh` exit 0、`bun run a11y` exit 0、`bun run render && bun run lint:html` exit 0
- `wc -l library/elements/src/{toggle,checkbox-group,input-otp}/*.element.ts` それぞれ ≤ 150
- `grep -c 'outline: none\|outline-width: 0\|linear-gradient' library/elements/src/{toggle,checkbox-group,input-otp}/*.css system/css/src/patterns.css` = 0
- `bun run release:check` exit 0（size-limit 内）
- `bash scripts/guard.sh` exit 0

## STOP する条件（改善せず報告する）

- 必要なトークンが無い → 名前と用途を書いて STOP。`system/tokens` は触らない
- `_shared/**` に手を入れないと書けない（`bindListeners` が `paste` / `keydown` を通せない等）→ **自分の `*.element.ts` で `addEventListener` を直接使い**、それでも `if` ≤ 5 / 150 行に収まらなければ STOP
- ラッパー生成器（`tools/cem/src/wrappers`）が `aria-pressed` や `raw` 子を扱えず落ちる → STOP（`tools/cem/src` は触らない）
- `scaffold:element` が無い、または出力が skill のファイル構成と違う → STOP
- size-limit を 2 KB 以上超える → STOP
- `git merge main` でコンフリクト → STOP（ファイル一覧を報告）
- 既存の VRT 画像が変わる → STOP

## スコープ外

- Combobox・Command palette・Date Picker の独自カレンダー・Context menu・Hover card（020 の `_shared/popover-anchor.ts` に依存するので 020 マージ後の wave）
- `rd-button` に `pressed` を足す（toggle は別部品にする。button は stable なので API を増やさない）
- Storybook の Patterns story（`apps/storybook` は advisor が後で足す）

## 保守メモ

- `rd-toggle` の真実は `aria-pressed` 属性。利用側が属性を書き換えても `MutationObserver` で state が追随する。`pressed` プロパティは委譲するだけで値を持たない
- `rd-checkbox-group` の `min` は JS がないと効かない。サーバ側の検証を省く理由にしない（proposal に書く）
- `rd-input-otp` は桁ごとに `name-1..N` で送信される。連結した値が欲しい利用側は `el.value` を読むか、サーバで連結する
- `segmented` の CSS は radio-group と checkbox-group で重複している。3 つ目が出たら `patterns.css` の `.rd-segmented` に寄せる
