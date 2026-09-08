# 031: `rd-toggle-group` — 押下ボタンの列（`<fieldset>` + `<button aria-pressed>` を包むティア A。単一／複数選択と roving focus）

**優先度**: P1　**規模**: M　**依存**: 024（`rd-toggle` の見た目・`aria-pressed` の扱い）、021（`rd-checkbox-group` の `<fieldset>` / `<legend>` 契約）
**レーン**: `feat/toggle-group`　**計画時の main**: `28f2c5e`（028・029・030 マージ後。**032（`feat/carousel`）・033（`feat/calendar`）と並行** — `system/**` / `_shared/**` には触らない）

> **Drift check（最初に実行）**:
> `test -d library/elements/src/toggle-group && echo EXISTS` が何も出ないこと。出たら STOP。
> `grep -c 'export const nextIndex' library/elements/src/_shared/roving-focus.ts` = 1。
> `grep -c 'export const bindListeners' library/elements/src/_shared/native-control.ts` = 1、`grep -c 'export const syncAttribute' library/elements/src/_shared/internals.ts` = 1。
> `grep -c "roles: { control: ':scope > button' }" library/elements/src/toggle/toggle.contract.ts` = 1（`rd-toggle` の形が変わっていない）。
> `grep -c 'fieldset: .:scope > fieldset.' library/elements/src/checkbox-group/checkbox-group.contract.ts` = 1。
> `wc -l library/elements/src/toggle/toggle.element.ts` が **115**、`library/elements/src/checkbox-group/checkbox-group.element.ts` が **150**。
> 「現状のコード」の抜粋を現物と見比べる。違っていたら STOP。

## なぜ

shadcn の一覧にある **Toggle Group**（書式ツールバーの B / I / U、表示切替の「一覧 / カード」など）が無い。
riml-ds には押下ボタン単体の `rd-toggle`（024）と、**送信に載る**選択の `rd-radio-group segmented` / `rd-checkbox-group segmented` がある。
しかし「フォームに載せない・見た目が同じ押下ボタンの列で、**単一または複数**を選ぶ」部品が無く、利用側が `rd-toggle` を並べて
排他制御を自前で書いている。

`rd-toggle-group` はその隙間を埋める。値は各 `<button aria-pressed>` が持ち（真実は属性）、部品は

1. `mode="single"` のとき**他のボタンの `aria-pressed` を `false` に戻す**
2. 矢印キーで列の中を移動する（roving tabindex。APG「Toolbar」の Keyboard Interaction）
3. `rd-change { values }` を投げる

の 3 つだけをする。JS が無いときは「押しても変わらない普通のボタンの列」に縮退する（害は無い。`rd-toggle` と同じ判断）。
**送信に載せる値なら使わない**（`rd-radio-group segmented` / `rd-checkbox-group segmented` を使う。proposal に書く）。

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/toggle/**`**（`aria-pressed` を真実にする、`MutationObserver` で外からの書き換えに追随、`bindListeners`、`nothing` を返す `render`）と
  **`library/elements/src/checkbox-group/**`**（`<fieldset>` / `<legend>` の契約、`[part='options']`、segmented の CSS）と
  **`library/elements/src/tabs/**`**（`nextIndex` による roving tabindex の付け方）
- `any` / `as` / `!` / `enum` を書かない（`as const satisfies Contract` だけ許される）。`class` は `*.element.ts` の `extends LitElement` だけ（ADR-0005）
- **失敗するテストを先に書く**
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**
- **ラッパーの props は契約の `tree.attrs` から作られる**（`static properties` ではない）。`mode` / `orientation` / `variant` は `attrs` に入れる。props は文字列
- `bun run scaffold:element toggle-group --pe A` で骨格を作る（`toggle-group.contract.test.ts` も生成される。雛形の期待値は自分の契約に合わせて直す）
- `library/elements/package.json` の `exports` に `./experimental/toggle-group{,/contract,/define,/style.css}` の 4 ブロックを **`./experimental/toggle/style.css` の直後**に
- story は 8 種（Default / Variants（outline・ghost × single・multiple）/ Disabled（1 個だけ `disabled`）/ Invalid → **Vertical** に読み替える / Dark / Dense / RTL / ForcedColors / ReducedMotion）+ `Single`（`play` で 2 個目を押し、1 個目が戻る）+ `Toolbar`（`.rd-toolbar` の中に置く）
- 触ってよいパス（`scripts/lanes.tsv` の `feat/toggle-group`）: `library/elements/src/toggle-group/**`（新規）、`library/elements/src/experimental/toggle-group/**`（新規）、
  `library/elements/package.json`（exports のみ）、`library/elements/custom-elements.json`、`library/{react,vue,svelte,astro}/src/generated/**`、`library/astro/package.json`（生成分）、
  `tools/cem/registry.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`library/react/test/**`、`e2e/**`（`e2e/__screenshots__` は**新しい**画像だけ）、`.size-limit.json`、
  `docs/proposals/toggle-group.md`（新設）、`.changeset/`
  **触らない**: `library/elements/src/_shared/**`、`library/elements/src/toggle/**`、`library/elements/src/checkbox-group/**`、`system/**`、`tools/cem/src/**`、`apps/storybook/**`、`docs/*.md`、`DESIGN.md`、`plans/README.md`、`skills/**`、`.claude/**`、`scripts/**`、`.github/**`
- **並行レーン 032 / 033** も `e2e/pe/build-pages.ts` / `tier-a.spec.ts` / `tier-b.spec.ts` / `axe.spec.ts` / `e2e/a11y/keyboard.spec.ts` / `e2e/frameworks/**` / `e2e/*/src/**` /
  `.size-limit.json` / `library/elements/package.json` / `tools/mcp/src/examples.ts` に**追記する**。`git merge main` でコンフリクトしたら自分で解決せず STOP（reviewer が union で解く）。
  生成物（`custom-elements.json` / `registry.json` / generated）のコンフリクトは `bun run build && bun run gen` で作り直してよい

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/toggle/toggle.contract.ts`（真実は `aria-pressed`。`pressed` 省略時は `'false'` を書く）:

```ts
export const contract = {
  pe: 'A',
  roles: { control: ':scope > button' },
  required: ['control'],
  tree: {
    tag: 'rd-toggle',
    attrs: { variant: '$variant' },
    children: [
      {
        tag: 'button',
        attrs: { type: 'button', 'aria-pressed': '$pressed' },
        children: [{ prop: 'label' }],
      },
    ],
  },
} as const satisfies Contract
```

`library/elements/src/toggle/toggle.element.ts`（外からの書き換えに追随する observer と、押下の反転。この形をボタン**複数**に広げる）:

```ts
const OBSERVED = ['aria-pressed']
…
  /** 押下はネイティブ要素の `aria-pressed` が持つ。部品は委譲するだけ */
  get pressed(): boolean {
    return this.#control?.getAttribute('aria-pressed') === 'true'
  }

  set pressed(next: boolean) {
    syncAttribute(this.#control, 'aria-pressed', toAriaPressed(next))
    this.requestUpdate()
  }
…
  #onClick = (): void => {
    const pressed = nextPressed(this.pressed)
    this.pressed = pressed
    this.dispatchEvent(
      new CustomEvent('rd-toggle', { bubbles: true, composed: true, detail: { pressed } }),
    )
  }
```

`library/elements/src/checkbox-group/checkbox-group.contract.ts`（`<fieldset>` / `<legend>` / `[part='options']` の形。そのまま倣う）:

```ts
  roles: {
    fieldset: ':scope > fieldset',
    legend: ':scope > fieldset > legend',
    // 1 個以上。`checkContract` は `querySelector` なので最初の 1 個で判定する
    options: ':scope > fieldset label',
    control: ':scope > fieldset input[type="checkbox"]',
  },
  required: ['fieldset', 'legend', 'control'],
  tree: {
    tag: 'rd-checkbox-group',
    attrs: { segmented: '$segmented', min: '$min', hint: '$hint', error: '$error' },
    children: [
      {
        tag: 'fieldset',
        children: [
          { tag: 'legend', children: [{ prop: 'label' }] },
          // 選択肢は生 HTML。利用側が `checkboxOptionMarkup(...)` で組む
          { tag: 'div', attrs: { part: 'options' }, children: [{ raw: '$children' }] },
        ],
      },
    ],
  },
```

`library/elements/src/_shared/roving-focus.ts`（移動先を決める純関数。`Home` → 0、`End` → 末尾、矢印は折り返し、扱わないキーは `undefined`）:

```ts
export const nextIndex = (
  current: number,
  count: number,
  key: string,
  orientation: Orientation,
): number | undefined => { … }
```

`library/elements/src/_shared/internals.ts` の `syncAttribute(element, name, value | undefined)`（`undefined` で属性を消す）、`syncStates(internals, ReadonlySet<string>)`。
`library/elements/src/_shared/native-control.ts` の `bindListeners(target, { click: fn, keydown: fn })` → `{ detach }`。

`system/css/src/atoms.css` の `.rd-toolbar`（この中に置ける。`role="toolbar"` は利用側が付ける）:

```css
  .rd-toolbar {
    display: flex;
    align-items: center;
    gap: var(--rd-space-1);
    padding: var(--rd-space-1) var(--rd-space-2);
    border-block-start: 0.125rem dotted var(--rd-color-border-default);
  }
```

## 設計（決めてある。変えるなら STOP）

### 1. 契約（`toggle-group.contract.ts`）

```ts
export const ITEM_SELECTOR = ':scope > fieldset > [part="options"] > button'

export const contract = {
  pe: 'A',
  roles: {
    fieldset: ':scope > fieldset',
    legend: ':scope > fieldset > legend',
    options: ':scope > fieldset > [part="options"]',
    // 1 個以上。`checkContract` は最初の 1 個で判定する
    item: ITEM_SELECTOR,
  },
  required: ['fieldset', 'legend', 'options', 'item'],
  tree: {
    tag: 'rd-toggle-group',
    attrs: { mode: '$mode', orientation: '$orientation', variant: '$variant' },
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
```

- 項目 1 個の木 `toggleItemMarkup({ label, value, pressed?, disabled? })` → `<button type="button" value="…" aria-pressed="true|false" disabled?>文言</button>`。
  `pressed` 省略時は `'false'` を書く（`rd-toggle` と同じ理由。属性ごと消えると toggle でなくなる）。
- **項目は `<button>` 直書きだけ**。`rd-toggle` を中に入れる形は許さない（押下の所有者が二重になる。proposal に書く）。
- `mode`: `'single' | 'multiple'`（既定 `multiple`）。`orientation`: `'horizontal' | 'vertical'`（既定 `horizontal`）。`variant`: `'outline' | 'ghost'`（既定 `outline`。`rd-toggle` の `ToggleVariant` を **import して再利用**する — `library/elements/src/toggle/toggle.logic.js` の `toToggleVariant`。toggle 側は触らない）。
- `<legend>` がアクセシブル名。`rd-toggle-group` 自身に `role` は付けない（`<fieldset>` が group）。

### 2. 純関数（`toggle-group.logic.ts`）

```ts
export type ToggleGroupMode = 'single' | 'multiple'
export const parseMode = (value: string | null): ToggleGroupMode      // 'single' 以外はすべて multiple
export const parseOrientation = (value: string | null): Orientation  // 'vertical' 以外はすべて horizontal（`_shared/roving-focus.js` の型）

export type ItemState = { readonly value: string; readonly pressed: boolean; readonly disabled: boolean }

/** index 番目を押したあとの各項目の pressed。single なら他を false に。押した項目は反転 */
export const pressAt = (items: readonly ItemState[], index: number, mode: ToggleGroupMode): readonly boolean[]

/** pressed な項目の value（順序は DOM 順） */
export const selectedValues = (items: readonly ItemState[]): readonly string[]

/** roving tabindex を置く 1 個。優先: 最初の pressed で enabled → 最初の enabled → -1（全部 disabled） */
export const tabStopIndex = (items: readonly ItemState[]): number

/** 矢印キーの移動先。disabled を飛ばす（enabled の並びの中で nextIndex を使い、元の index に戻す）。扱わないキーは undefined */
export const moveIndex = (items: readonly ItemState[], current: number, key: string, orientation: Orientation): number | undefined

export const computeStates = (input: { mode: ToggleGroupMode; orientation: Orientation; variant: ToggleVariant; malformed: boolean }): ReadonlySet<string>
// malformed なら {'malformed'} だけ。それ以外は { variant, mode==='single' ? 'single' : 'multiple', orientation==='vertical' ? 'vertical' : 'horizontal' }
```

- `pressAt` は `disabled` の項目を押せない（そのまま返す）。single で既に押されている項目を押すと **解除される**（shadcn と同じ。0 個も許す）。

### 3. element（`toggle-group.element.ts`、≤ 150 行、`if` ≤ 5）

- `createRenderRoot() { return this }`、`render()` は `nothing`。`static override properties = { mode: {}, orientation: {}, variant: {} }`（`reflect` しない。属性が真実）
- `firstUpdated`: `checkContract` → `malformed` + `console.error('[rd-toggle-group] <fieldset> / <legend> / [part="options"] / <button> が必要（不足: …）')`。
  `bindListeners(options, { click: #onClick, keydown: #onKeydown })`（**`[part='options']` 1 個に委譲**。ボタン 1 個ずつには付けない）。
  `MutationObserver` を `options` に `{ childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'disabled'] }` で付け、変化で `requestUpdate()`（`rd-toggle` の observer と同じ）。
- `updated`: `#items()`（`this.querySelectorAll(ITEM_SELECTOR)` → `ItemState[]`）→ `tabStopIndex` で **`tabindex`** を付け直す（該当 1 個は属性を消す（既定 0）、他は `-1`。`disabled` の項目は触らない）→ `syncStates`。
  **`tabindex` は JS が付ける**ので、JS 無しでは全部 Tab で辿れる（縮退）。
- `#onClick(event)`: `event.target` の `closest('button')` が `ITEM_SELECTOR` に合う項目か（`this.#items()` の index）→ `pressAt` → 各ボタンに `syncAttribute('aria-pressed', 'true'|'false')` →
  `rd-change` を `{ values: selectedValues(next) }` で dispatch（`bubbles: true, composed: true`）。**変化が無い（disabled を押した）なら dispatch しない**。
- `#onKeydown(event)`: `moveIndex(items, currentIndex, event.key, orientation)` が `undefined` なら何もしない（`preventDefault` もしない）。そうでなければ `preventDefault()` + その項目に `focus()`。**フォーカスを動かすだけで押さない**（APG Toolbar。押すのは Enter / Space = ネイティブの click）。
- `get values(): readonly string[]`（`selectedValues`）。`set values(next: readonly string[])` は各ボタンの `aria-pressed` を書き換える（single で 2 個以上渡されたら**先頭だけ**）。イベントは出さない（プログラムからの変更）。
- `disconnectedCallback` で `detach` と `observer.disconnect()`。

### 4. CSS（`toggle-group.css`）

- `rd-toggle-group > fieldset { display: inline-grid; gap: var(--rd-space-2); margin: 0; padding: 0; border: 0; min-inline-size: 0 }`、`legend { padding: 0; font: var(--rd-type-small); color: var(--rd-color-text-muted) }`
- `[part='options'] { display: inline-flex; gap: 0; padding: var(--rd-space-1); border-radius: var(--rd-radius-full); background: var(--rd-color-surface-sunken) }`（`rd-checkbox-group:state(segmented) [part='options']` と**同じ見た目**。checkbox-group.css は触らない）
- `:state(vertical) [part='options'] { flex-direction: column; align-items: stretch }`
- ボタン: `min-block-size: var(--rd-sizing-target-min); padding-inline: var(--rd-space-4); border: var(--rd-border-width-default) solid transparent; border-radius: var(--rd-radius-full); background: transparent; color: inherit; font: inherit`。
  `[aria-pressed='true'] { background: var(--rd-color-surface-raised); box-shadow: var(--rd-shadow-raised); font-weight: var(--rd-font-weight-bold) }`
  `:state(ghost) [part='options'] { padding: 0; background: transparent }`（罫線も面も無し。`rd-toggle` の ghost と同じ）
  `:hover:where(:enabled) { background: var(--rd-color-surface-hover) }`、`:disabled { color: var(--rd-color-text-muted); cursor: not-allowed }`
- フォーカスリングは `button:focus-visible { outline: var(--rd-focus-ring-width) solid var(--rd-focus-ring-color); outline-offset: var(--rd-focus-ring-offset) }`
- 強制配色: `[aria-pressed='true'] { forced-color-adjust: none; background: SelectedItem; color: SelectedItemText }`、境界は `border-color: ButtonText`（`rd-toggle` の書き方を写す。押下とフォーカスが**同じ形にならない**こと — 024 のレビュー指摘）
- `@media (prefers-reduced-motion: no-preference)` の中だけに `transition: background-color var(--rd-motion-duration-fast) var(--rd-motion-easing-standard)`
- **`box-shadow: inset …` は書かない**（stylelint が落とす）。`:not(:defined)` の見た目は「普通のボタンの列」（何も足さない）。

### 5. イベント・状態・JSDoc

- `@event {CustomEvent<{ values: readonly string[] }>} rd-change - 押下で選択が変わったときに発火`
- `@state outline` / `@state ghost` / `@state single` / `@state multiple` / `@state horizontal` / `@state vertical` / `@state malformed`
- `@summary 押下ボタンの列。単一 / 複数選択と矢印キー移動。<fieldset><legend> と <button aria-pressed> は利用側が書く`、`@status experimental`、`@pe A`

### 6. 検証面

- `toggle-group.contract.test.ts`（roles / tree / `toggleItemMarkup` の `pressed` 既定 `'false'`、エスケープ）、`toggle-group.logic.test.ts`（`pressAt` single/multiple/disabled/解除、`tabStopIndex` の優先順、`moveIndex` が disabled を飛ばして折り返す、`computeStates`）
- `toggle-group.test.ts`（実 DOM）: 契約欠落で `malformed`、single で 2 個目を押すと 1 個目が `false`、multiple で両方 `true`、`rd-change` の `detail.values`、disabled を押しても発火しない、`tabindex` が 1 個だけ 0 相当、→ で次へ・End で末尾・↓ は horizontal では無視（`defaultPrevented` が false）、外から `aria-pressed` を書き換えると `values` が追随、`values` setter、タッチターゲット ≥ 44px、`prefers-reduced-motion: reduce` で `getAnimations()` が空
- `toggle-group.sr.test.ts`: 仮想 SR が「group 書式」→「toggle button 太字 pressed」の順で読む
- `e2e/pe/build-pages.ts` に `toggle-group.html`（`toggleGroupMarkup` で 3 個）、`tier-a.spec.ts` に **JS 無し 2 本**（3 個とも Tab で辿れる／`aria-pressed` が markup のまま読める）、`e2e/a11y/keyboard.spec.ts` に **JS あり 3 本**（single の排他、矢印で移動、Space で押下）、`axe.spec.ts` に 1 ページ追加
- `e2e/frameworks/shared.ts` に `toggleGroupSuite`（4 フレームワークで描画・`mode="single"` で排他）、4 アプリに 1 例ずつ
- `tools/mcp/src/examples.ts` に `'rd-toggle-group'`、`library/react/test/**` に生成ラッパーのテスト 1 本
- `.size-limit.json` に `toggle-group/define`（lit 込み）**12 KB**

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

`bun install --frozen-lockfile` → `git checkout bun.lock` → `bun run build` → `bun run gen` → `bun run test`。Drift check を通す。

### Step 1 — 契約と純関数（`feat(elements): add the rd-toggle-group contract and selection logic`）

`bun run scaffold:element toggle-group --pe A` → 契約と `toggle-group.logic.ts` のテストを先に書く → green。

### Step 2 — element と CSS（`feat(elements): add rd-toggle-group (experimental, tier A)`）

`toggle-group.element.ts` / `toggle-group.css` / stories / `toggle-group.test.ts` / `toggle-group.sr.test.ts`。`bun run build && bun run gen`。
`wc -l toggle-group.element.ts` ≤ 150（超えるなら `toggle-group.dom.ts` に `readItems` / `applyPressed` / `applyTabStops` を出す）。exports・size-limit・examples・react test もこの Step で。

### Step 3 — 検証面（`test(e2e): cover rd-toggle-group with and without JS and in the four frameworks`）

### Step 4 — VRT（`test(vrt): baselines for toggle-group`）

`bun run storybook:build && bash scripts/vrt.sh --update-snapshots`（新規画像だけ増えること。`git status` で既存画像の変更が無いこと）。

### Step 5 — 仕上げ（`docs(proposals): record the rd-toggle-group decision and add a changeset`）

`docs/proposals/toggle-group.md`（なぜ `<button>` 直書きだけか／なぜ送信値に使わないか／roving tabindex を選んだ理由／single の解除を許す理由）、`.changeset/toggle-group.md`（`@rimltempest/riml-ds-elements` minor）。

## 完了条件（機械で検査できるもの）

- `bun run check` = 0、`bun run test` = 0（`toggle-group.*.test.ts` を含む）
- `wc -l library/elements/src/toggle-group/toggle-group.element.ts` ≤ 150、`grep -c '\bif\b' …/toggle-group.element.ts` ≤ 5
- `grep -c "from '../toggle/toggle.logic.js'" library/elements/src/toggle-group/toggle-group.logic.ts` = 1（variant を再利用している）
- `bash scripts/guard.sh` = 0、`bun run pe` = 0、`bun run e2e:frameworks` = 0、`bash scripts/vrt.sh` = 0、`bun run a11y` = 0、`bun run release:check` = 0
- `git diff --name-only main...HEAD -- e2e/__screenshots__` に**既存**画像が 1 枚も無い
- `grep -c 'rd-toggle-group' library/react/src/generated/index.ts` ≥ 1、React の props に `mode` / `orientation` / `variant` がある
- `.size-limit.json` の `toggle-group/define` が通る（12 KB）

## STOP する条件（改善せず報告する）

- 既存 VRT 画像が変わる。size-limit 超過。`toggle-group.element.ts` が 150 行 / `if` 5 に収まらない（`dom.ts` に出しても）
- `git merge main` で `e2e/**` / `.size-limit.json` / `package.json` / `examples.ts` がコンフリクトする
- markuplint が `<fieldset>` の中の `<div part="options"><button>` を落とす（規則を緩めない。報告する）
- `toggle/toggle.logic.ts` や `_shared/**` を変えないと実装できない

## スコープ外

- フォーム送信（`rd-radio-group segmented` / `rd-checkbox-group segmented` を使う）。`rd-toggle` を中に入れる形。アイコンだけのボタン（利用側が `aria-label` を書く。`.rd-icon-button` は CSS のみ）。`rd-toggle` 側の変更

## 保守メモ

- 見た目は `rd-checkbox-group:state(segmented)` と揃えてある（`[part='options']` の丸い面、押下の raised）。**3 つ目が出たら `patterns.css` の `.rd-segmented` に寄せる**（checkbox-group proposal の保守メモと同じ判断）
- `tabindex` は `updated` で毎回付け直す。ボタンを動的に足す利用側は `MutationObserver` の `childList` が拾うので何もしなくてよい
- `rd-change` は**ユーザー操作だけ**。`values` setter や外からの属性書き換えでは出さない（`rd-select` / `rd-sort` と同じ方針）
