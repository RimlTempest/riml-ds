# 025: `rd-combobox` — 候補から選びながら打てる入力欄（`<input list>` + `<datalist>` を包むティア A）

**優先度**: P1　**規模**: L　**依存**: 024（マージ済み `fb0c2c2`。`rd-toggle` の入れ直しと `[popover]` の `display` の決まり）
**レーン**: `feat/combobox`　**計画時の main**: `7684d09`（024 マージ後。**026（`feat/hover-context-nav`）と並行** — `menu` / `popover` / `system/css` には触らない）

> **Drift check（最初に実行）**:
> `test -d library/elements/src/combobox && echo EXISTS` が何も出ないこと。出たら STOP。
> `wc -l library/elements/src/select/select.element.ts` が **149**、`library/elements/src/text-field/text-field.element.ts` が **149** であること（手本の形が変わっていない）。
> `grep -c 'export const computeView' library/elements/src/_shared/field.ts` = 1、`grep -c 'export const bindListeners' library/elements/src/_shared/native-control.ts` = 1、
> `grep -c 'export const nextIndex' library/elements/src/_shared/roving-focus.ts` = 1。
> `grep -c "'rd-toggle'" tools/mcp/src/examples.ts` = 1（024 が入っている）。
> 「現状のコード」の抜粋（`select.contract.ts` / `select.element.ts` の `#view`）を現物と見比べる。違っていたら STOP。

## なぜ

shadcn の **Combobox** / **Autocomplete** に当たる部品が無い。`rd-select` は `<select>` を包むので候補が多いと探せず、自由入力もできない。
`rd-combobox` は「打つと候補が絞られ、矢印で選び、Enter で確定する」入力欄で、**JS が無くてもネイティブの `<datalist>` が候補を出す**
（ティア A、ADR-0012）。これが PE の要: 部品は `<input list>` の見た目と操作を**整えるだけ**で、値も送信も検証もネイティブが持つ。

決めていること:

- **包むのは `<label for>` + `<input list="…" autocomplete="off">` + `<datalist id="…"><option value>…</datalist>`**。部品は候補を生成しない
  （利用側が `<option>` を書く。`rd-select` と同じ）。`<option>` の `value` が値、テキストがあれば表示名（無ければ `value`）
- **定義後は ARIA の combobox パターン（APG「Combobox with List Autocomplete」）に置き換える**: `<input>` に `role="combobox"` `aria-autocomplete="list"`
  `aria-expanded` `aria-controls` `aria-activedescendant` を載せ、候補は部品が末尾に足す **`<div part="list" role="listbox" popover="manual">`** に
  `<div role="option" id aria-selected>` として写す。**`list` 属性はこのとき外す**（ネイティブの吹き出しと二重に出るのを防ぐ）。`<datalist>` は
  候補の**唯一の出どころ**として残す（`MutationObserver` で `<option>` の増減に追随）
- **自由入力を許す**（既定）。候補に無い値も送れる。候補限定にしたいなら利用側が `pattern` / `required` を書く（ネイティブ検証。`_shared/field.ts` が文言を出す）
- **絞り込みは `filter` 属性**: `contains`（既定。部分一致、大文字小文字・全角半角の正規化は `NFKC` + `toLocaleLowerCase()`）/ `prefix`（前方一致）/ `none`（絞らない。サーバー側で絞る利用側向け）
- **`[popover="manual"]`** を使う（light dismiss ではなく部品が閉じる。入力欄がフォーカスを持ったまま候補を出すため）。**通常状態に `display` を書かない**
  （024 の決まり。`display` は `:popover-open` 側にだけ書く）
- 位置決めは `_shared/popover-anchor.ts` の `anchorPopover(input, list, name, { placement: 'start' })`（同じ木なので CSS anchor に任せられる）
- **キーボード**（APG）: ↓ / ↑ で候補を移動（`aria-activedescendant`。フォーカスは `<input>` に留める）、Home / End は**入力欄のカーソル移動に任せる**（横取りしない）、
  Enter で確定（候補が選ばれていれば `value` を書いて閉じる。選ばれていなければ何もしない＝フォーム送信を妨げない）、Esc で閉じる（値は消さない）、
  Alt+↓ で開く、Tab で閉じる（確定しない）
- **選び方はポインタでも同じ**: `option` の `pointerdown` で `preventDefault`（入力欄のフォーカスを奪わない）→ `click` で確定
- **読み上げ**: `aria-activedescendant` に任せる。候補数の案内は**出さない**（`rd-live-region` を使わない。ADR-0008 §6。数の案内は騒がしい）
- `hint` / `error` / 状態（`invalid` / `errored` / `hinted` / `filled` / `malformed`）は `rd-text-field` / `rd-select` と**同じ**（`_shared/field.ts` の `computeView`）。追加の状態: `open`（候補が出ている）/ `empty`（絞った結果 0 件）
- 0 件のときは候補を**閉じる**（空のリストボックスを見せない）
- イベント: `rd-select`（`detail: { value: string; index: number }`。候補で確定したときだけ。自由入力の `input` / `change` はネイティブがそのまま出す）

守る不変条件:

- **AAA**（文字 7:1・非文字 3:1）。色は semantic トークンだけ。候補の選択中は `--rd-color-surface-hover` + 左の縦罫（色だけに頼らない。`menu.css` の hover と同じ見せ方）
- **`outline: none` / `0` を書かない**。**グラデーションを描かない**
- `*.element.ts` ≤ 150 行、`if` ≤ 5 → **DOM の読み書きは `combobox.dom.ts` に出す**（`menu.dom.ts` / `popover.dom.ts` と同じ置き方）
- `.size-limit.json` に `combobox/define` **14 KB**（select 系より少し大きい。超えたら STOP）
- `_shared/**` を**変えない**（要る関数は `combobox.logic.ts` / `combobox.dom.ts` に書く）

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/select/**`**（ティア A のフォーム部品。`computeView` / `bindListeners` / `value` の委譲 / `checkValidity`）と
  **`library/elements/src/menu/**`**（`[popover]` の位置決め・`nextIndex`・`*.dom.ts` の分け方・`menu.css` の候補行の見せ方）
- `any` / `as` / `!` / `enum` を書かない（`as const satisfies Contract` だけ許される）。`class` は `*.element.ts` の `extends LitElement` だけ
- **失敗するテストを先に書く**
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**
- `bun run scaffold:element combobox --pe A` で骨格を作る（**`combobox.contract.test.ts` は作られないので `select/` から写す**）
- `library/elements/package.json` の `exports` に `./experimental/combobox{,/contract,/define,/style.css}` の 4 ブロックを **`./experimental/checkbox-group/style.css` の直後**に
- story は 8 種 + `Open`（`play` で ↓ を押して候補を出す）+ `Filtered`（`play` で「か」と打つ）+ `Empty`（0 件で閉じたまま）
- 触ってよいパス（`scripts/lanes.tsv` の `feat/combobox`）: `library/elements/src/combobox/**`（新規）、`library/elements/src/experimental/combobox/**`（新規）、
  `library/elements/package.json`（exports のみ）、`library/elements/custom-elements.json`、`library/{react,vue,svelte,astro}/src/generated/**`（再生成物のみ）、
  `library/astro/package.json`（`bun run gen` が書く exports だけ）、`tools/cem/registry.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`library/react/test/**`、
  `e2e/**`（`e2e/__screenshots__` は**新しい**画像だけ）、`.size-limit.json`、`docs/proposals/combobox.md`（新設）、`.changeset/`
  **触らない**: `library/elements/src/_shared/**`、`library/elements/src/` の combobox 以外、`system/**`、`tools/cem/src/**`（生成器が落ちるなら STOP）、
  `apps/storybook/**`、`docs/*.md`、`DESIGN.md`、`plans/README.md`、`skills/**`、`.claude/**`、`scripts/**`、`.github/**`
- **並行レーン 026** が `library/elements/src/{menu,popover}/**`、`system/css/src/navigation.css`、`apps/storybook/stories/Patterns/**`、`e2e/pe/build-pages.ts` を触る。
  `build-pages.ts` / `tier-a.spec.ts` / `axe.spec.ts` / `e2e/frameworks/**` / `e2e/*/src/**` は**両レーンが足す**ので、`git merge main` でコンフリクトしたら自分で解決せず STOP
  （reviewer が union で解く）。生成物（`custom-elements.json` / `registry.json` / generated）のコンフリクトは `bun run build && bun run gen` で作り直してよい

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/select/select.contract.ts`（ティア A の契約の形。`combobox.contract.ts` はこれに `datalist` を足す）:

```ts
export const contract = {
  pe: 'A',
  roles: { label: ':scope > label', control: ':scope > select' },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-select',
    attrs: { hint: '$hint', error: '$error', value: '$defaultValue' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      { tag: 'select', attrs: { id: '$id', name: '$name', required: '$required' }, children: [{ raw: '$children' }] },
    ],
  },
} as const satisfies Contract
```

`select.element.ts` の `#view`（`computeView` の入力。combobox は `filled: value !== ''` と `attrs` にネイティブ検証属性を渡す。`text-field.element.ts` を見る）:

```ts
  #view = (): FieldView =>
    computeView({
      controlId: this.#control?.id ?? this.querySelector(contract.roles.control)?.id ?? '',
      error: this.error,
      validity: this.#control?.validity ?? {},
      validationMessage: this.#control?.validationMessage ?? '',
      attrs: {},
      japanese: usesJapaneseCopy(this),
      malformed: !this.#contractOk,
      invalid: this.#control?.validity.valid === false,
      touched: this.#touched,
      hasHint: this.hint !== '',
      hasError: this.error !== '',
      filled: isSelected(this.#control?.value ?? ''),
    })
```

`_shared/roving-focus.ts` の `nextIndex(current, count, key, 'vertical')`: ↓ / ↑ / Home / End で番号を返す。端で折り返す。**Home / End も返す**ので、
combobox では `key === 'ArrowDown' || key === 'ArrowUp'` のときだけ呼ぶ（Home / End はカーソル移動に任せる）。

`_shared/popover-anchor.ts` の `anchorPopover(trigger, popover, name, { placement })`: 同じ木なら `anchor-name` / `position-anchor` を書いて CSS に任せる。
`menu.css` の `@supports (position-area)` ブロックが `position-area: block-end span-inline-end` などを書いている——`combobox.css` にも同じ形で書く。

`menu.css` の候補行（見せ方をそろえる）:

```css
  rd-menu [popover] > :is(a, button, span) {
    display: flex;
    align-items: center;
    gap: var(--rd-space-2);
    min-block-size: var(--rd-sizing-target-min);
    padding-inline: var(--rd-space-3);
    …
  }
```

## 設計（決めてある。変えるなら STOP）

### 1. 契約（`combobox.contract.ts`）

```ts
export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input[list]',      // 定義後に list を外すので、契約の検査は firstUpdated の最初に 1 回だけ
    options: ':scope > datalist',
  },
  required: ['label', 'control', 'options'],
  tree: {
    tag: 'rd-combobox',
    attrs: { hint: '$hint', error: '$error', filter: '$filter' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: {
          id: '$id', name: '$name', list: '$listId', type: 'text', autocomplete: 'off',
          required: '$required', placeholder: '$placeholder', pattern: '$pattern', title: '$title', value: '$defaultValue',
        },
      },
      { tag: 'datalist', attrs: { id: '$listId' }, children: [{ raw: '$children' }] },
    ],
  },
} as const satisfies Contract

export type ComboboxMarkupProps = {
  readonly id: string
  readonly listId: string            // `${id}-list` を利用側が渡す（React は useId）
  readonly label: string
  readonly name: string
  /** `<option value="…">表示名</option>` 群。エスケープされないので信頼済みの断片だけ */
  readonly children: string
  readonly filter?: 'contains' | 'prefix' | 'none'
  readonly required?: boolean
  readonly placeholder?: string
  readonly pattern?: string
  readonly title?: string
  readonly defaultValue?: string
  readonly hint?: string
  readonly error?: string
}

/** `<option>` を 1 つ組む（`menuItemMarkup` と同じ役目。値と表示名をエスケープする） */
export const comboboxOptionMarkup = (props: { readonly value: string; readonly label?: string }): string
```

`control` セレクタが `input[list]` なのは「JS 無しで候補が出る形になっているか」を契約で見るため。**定義後に `list` を外す**ので、`checkContract` は
`firstUpdated` の**先頭**（属性を外す前）で 1 回だけ呼ぶ。`ITEM`（datalist の option）は `':scope > datalist > option'`。

### 2. 純関数（`combobox.logic.ts`。DOM を触らない）

```ts
export type Candidate = { readonly value: string; readonly label: string }
export type FilterMode = 'contains' | 'prefix' | 'none'
export const normalize = (text: string): string            // NFKC + toLocaleLowerCase + trim
export const parseFilter = (raw: string | null | undefined): FilterMode   // 不明なら 'contains'
export const filterCandidates = (all: readonly Candidate[], query: string, mode: FilterMode): readonly Candidate[]
export const nextActive = (current: number, count: number, key: string): number | undefined
  // ArrowDown / ArrowUp だけ nextIndex(…, 'vertical') に委譲。他は undefined
export const optionId = (name: string, index: number): string   // `${name}-option-${index}`
export type ComboboxViewInput = { open: boolean; active: number; count: number; name: string; field: FieldView }
export type ComboboxView = { states: ReadonlySet<string>; inputAttrs: Readonly<Record<string, string>>; activeId: string | undefined }
export const computeComboboxView = (input: ComboboxViewInput): ComboboxView
  // states = field.states ∪ { open?, empty?（count === 0 かつ query !== ''）}
  // inputAttrs = { role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': String(open), 'aria-controls': name }
  // activeId = open && 0 <= active < count ? optionId(name, active) : undefined（→ syncAttribute で aria-activedescendant）
```

`query` が空のとき `filterCandidates` は**全件**を返す（Alt+↓ で全候補を見られる）。`mode === 'none'` も全件。

### 3. DOM 層（`combobox.dom.ts`）

`readCandidates(datalist): readonly Candidate[]`（`option.value` / `option.label || option.textContent`）、`applyAttrs`、`asInput`、
`renderOptions(list, candidates, activeIndex, name)`（`role="option"` `id` `aria-selected` を持つ `<div>` を**差分なしで作り直す**。lit の `repeat` を使ってもよい—`render()` の中で
描くなら `combobox.dom.ts` は要らない。**どちらかに決めて JSDoc に書く**）。

### 4. element（`combobox.element.ts` ≤ 150 行）

- `static properties = { hint: {}, error: {}, filter: {} }`、`declare`、constructor で `''` / `''` / `'contains'`
- `firstUpdated`: `checkContract` → `#control` / `#datalist` を掴む → **`list` 属性を外す**（`this.#control.removeAttribute('list')`。`aria-controls` で結び直す）→
  `bindListeners(control, { input, keydown, focus?, blur, invalid, change })` → `MutationObserver(datalist, { childList: true, subtree: true, attributes: true })` で候補を読み直す
- `render()`: `hint` / `error` の `<p part>`（select と同じ）+ `<div part="list" id=${name} role="listbox" popover="manual" aria-labelledby=${labelId}>` + 候補（`repeat`）
- `updated()`: `syncStates`、`applyAttrs(control, view.inputAttrs)`、`syncAttribute(control, 'aria-activedescendant', view.activeId)`、
  `syncAttribute(control, 'aria-describedby' / 'aria-invalid', …)`（select と同じ）、開閉（`open ? showPopover() : hidePopover()` を **`matches(':popover-open')` と違うときだけ**）、
  `anchorPopover(control, list, name, { placement: 'start' })`
- `input` → `query = control.value`、`open = true`、`active = -1`（`filterCandidates(…).length === 0` なら `open = false`）
- `keydown`: `nextActive` → `preventDefault` + `active` 更新（閉じていれば開く）。`Enter` で `active >= 0` なら `#commit(active)` + `preventDefault`。`Escape` で閉じる（`preventDefault`。
  **ダイアログの中でも Esc が親を閉じないように** `stopPropagation` はしない——Popover API の manual なので Esc は素通り。閉じるだけ）。`Alt+ArrowDown` で開く。`Tab` で閉じる
- `#commit(index)`: `control.value = candidate.value`、`control.dispatchEvent(new Event('input', { bubbles: true }))` と `change`（ネイティブと同じ順）、閉じる、
  `rd-select` イベント（`bubbles + composed`、`detail: { value, index }`）
- option の `pointerdown` → `preventDefault`、`click` → `#commit`
- `blur` → 閉じる + `touched`（select と同じ）。ただし **`relatedTarget` が list の中なら閉じない**（ポインタで候補を押している途中）
- `get/set value` はネイティブに委譲、`checkValidity` / `reportValidity` も select と同じ
- 状態: `invalid` / `errored` / `hinted` / `filled` / `malformed` / `open` / `empty`
- JSDoc: `@summary 候補から選びながら打てる入力欄。<input list> と <datalist> は利用側が書く`、`@status experimental`、`@pe A`、`@event rd-select`、`@csspart hint / error / list`、
  `@cssprop --rd-combobox-gap`、`@state` 7 つ

### 5. CSS（`combobox.css`。`@layer rd.components`）

- `rd-combobox { display: grid; gap: var(--rd-combobox-gap, var(--rd-space-1)) }`、`rd-combobox > input` は **`text-field.css` の `rd-text-field > input` と同じ宣言**（コピーして揃える。共通化はしない）
- `rd-combobox [part='list']`: `position: fixed; inset: auto; margin: 0; padding: var(--rd-space-1); border …; border-radius: var(--rd-radius-md); background: var(--rd-color-surface-raised); box-shadow: var(--rd-shadow-raised); max-block-size: 40vb; overflow-y: auto; z-index: var(--rd-layer-overlay)`。
  **`display` は書かない**。`rd-combobox [part='list']:popover-open { display: grid }`
- `[role='option']`: `menu.css` の項目と同じ寸法。`[aria-selected='true']` は `background: var(--rd-color-surface-hover)` + `box-shadow: inset var(--rd-space-1) 0 0 var(--rd-color-accent-default)`（左の縦罫。**`box-shadow` の inset は影ではなく罫線**なので `px` の縛りの対象外——`--rd-space-1` を使う）
- `@supports (position-area)` で `position-area: block-end span-inline-end; position-try-fallbacks: flip-block; inline-size: anchor-size(width)`（入力欄と同じ幅）
- `:not(:defined)`: 何も書かない（ネイティブの `<datalist>` がそのまま働く。`[part='list']` は定義前には存在しない）
- forced-colors: 選択中の option は `outline: var(--rd-border-width-default) solid Highlight; outline-offset: calc(-1 * var(--rd-border-width-default))`（内側。フォーカスは `<input>` にあるのでリングと競合しない）
- reduced-motion 以外では `transition` を書かない（候補は瞬時に出る）

### 6. 露出

- `src/experimental/combobox/index.ts`、`package.json` 4 ブロック、`.size-limit.json`（14 KB）
- `tools/mcp/src/examples.ts` に `'rd-combobox'`（`checkbox-group` の隣。候補 3 つ「かな」「漢字」「カナ」）、`tools/mcp/test/**` の一覧、`library/react/test/markup.test.tsx` の一覧に `RdCombobox`
- `e2e/pe/build-pages.ts` に `'combobox.html'`（候補 5 つ。`hint` あり）、`tier-a.spec.ts`: JS 無しで `input[list]` と `datalist option` が 5 つ、JS 有りで ↓ → `aria-expanded="true"` と `aria-activedescendant`、
  「か」と打つと候補が 2 つ、Enter で `value` が入る。`axe.spec.ts` に載せる
- `e2e/frameworks/shared.ts` に `comboboxSuite(framework)`（`compareMarkup` + ↓ → Enter で値が入る）、4 spec と 4 アプリに `RdCombobox`（`children` は `comboboxOptionMarkup` × 3）、`defines.ts`
- VRT: 新画像だけ（`bash scripts/vrt.sh --update-snapshots --grep Combobox`。既存に `M` が出たら STOP）

### 7. proposal と changeset

`docs/proposals/combobox.md`（見出しは `docs/proposals/checkbox-group.md` と同じ: 目的 / API / a11y / 代替案）。代替案に「候補限定なら `rd-select`」「複数選択は作らない（`rd-checkbox-group` か、将来の `rd-multi-select`）」
「`rd-command`（コマンドパレット）は 028 で `filterCandidates` を再利用する」「Home / End を横取りしない理由」を書く。
changeset: `@rimltempest/riml-ds-elements` **minor**。

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

`RIML_DS_BASE_REF=main bash scripts/wt.sh new feat/combobox`。`bun install --frozen-lockfile` → `git checkout bun.lock`。**`bun run build`**。Drift check。`bun run test` 緑。

### Step 1 — 契約と純関数（`feat(elements): add the rd-combobox contract and filtering logic`）

`scaffold:element combobox --pe A`。`combobox.contract.test.ts`（`select.contract.test.ts` を写す。`markup()` が `input[list][autocomplete="off"]` と `datalist` を出す、`comboboxOptionMarkup` がエスケープする）→ red → 契約。
`combobox.logic.test.ts`（`normalize`: 「カナ」と「ｶﾅ」、`filterCandidates` の 3 モード、空 query は全件、`nextActive` は ↓ / ↑ だけ、`computeComboboxView` の `states` / `inputAttrs` / `activeId`）→ red → 実装。

### Step 2 — element と CSS（`feat(elements): add rd-combobox (experimental, tier A)`）

`combobox.test.ts`（browser）を先に: 定義後 `list` 属性が無く `role="combobox"`、↓ で `aria-expanded="true"` と option が候補数ぶん、`aria-activedescendant` が 1 つ目、
「か」で絞られる、Enter で `value` と `rd-select`、Esc で閉じて値が残る、0 件で閉じる（`:state(empty)`）、`blur` で閉じる、`required` 未入力の `blur` で `:state(invalid)` と文言、
`datalist` に `<option>` を足すと候補が増える（MutationObserver）、契約違反で `malformed`。`combobox.sr.test.ts`（仮想 SR: 「ラベル, コンボボックス」と読まれ、↓ で候補名が読まれる）。
→ red → `combobox.element.ts` / `combobox.dom.ts` / `combobox.css` / `combobox.define.ts` / `index.ts` → green。stories 11 種。`bun run build && bun run gen` → `bun run check` → storybook a11y。

### Step 3 — 露出と検証面（`test(e2e): cover rd-combobox with and without JS and in the four frameworks`）

§6。`bun run pe`、`bun run e2e:frameworks`（110 → ≥ 118）。

### Step 4 — VRT（`test(vrt): baselines for combobox`）

`bun run storybook:build && bash scripts/vrt.sh --update-snapshots --grep Combobox`。新画像を全部目で確認（候補が入力欄と同じ幅で下に出る、選択中の行に左の縦罫、dark で影が見える）。

### Step 5 — 仕上げ（`docs(proposals): record the rd-combobox decision and add a changeset`）

§7。`bun run check`、`bun run test`、`bun run pe`、`bun run e2e:frameworks`、`bun run a11y`、`bash scripts/vrt.sh`、`bun run render && bun run lint:html`、`bun run release:check`、`bash scripts/guard.sh`。

## 完了条件（機械で検査できるもの）

- `grep -c '"rd-combobox"' tools/cem/registry.json` ≥ 1（`"pe": "A"`）、`git status --short` が空
- `library/{react,vue,svelte}/src/generated/combobox.*` と `library/astro/src/generated/experimental/combobox.astro` が存在し、`grep -c 'combobox.astro' library/astro/package.json` = 1
- `wc -l library/elements/src/combobox/combobox.element.ts` ≤ 150、`grep -c 'outline: none\|outline-width: 0\|linear-gradient' library/elements/src/combobox/combobox.css` = 0
- `grep -n 'display:' library/elements/src/combobox/combobox.css` の `[part='list']` に当たる行が `:popover-open` のブロックにだけある
- `bun run test` exit 0、`bun run pe` exit 0、`bun run e2e:frameworks` exit 0（≥ 118 passed）、`bun run a11y` exit 0、`bash scripts/vrt.sh` exit 0、`bun run render && bun run lint:html` exit 0
- 既存 VRT 画像に `M` が無い（`git diff --diff-filter=M --name-only main -- e2e/__screenshots__ | wc -l` = 0）
- `bun run release:check` exit 0（`combobox/define` ≤ 14 KB）、`bash scripts/guard.sh` exit 0

## STOP する条件（改善せず報告する）

- `input[list]` の `list` を外すと Safari / Chromium のどちらかでネイティブの `value` / `validity` の挙動が変わる（確認できる範囲で）
- `popover="manual"` の `showPopover()` が `<input>` のフォーカスを奪う（Vitest browser で再現したら）
- 150 行 / `if` 5 個に収まらない（`combobox.dom.ts` に出しても）
- size-limit 14 KB を超える
- ラッパー生成器が `datalist` / `option` の raw を扱えない（`tools/cem/src` は触らず STOP）
- `git merge main` で e2e のソースがコンフリクト

## スコープ外

- 複数選択（タグ入力）、候補の非同期読み込み（利用側が `<option>` を書き換えれば `MutationObserver` が拾う——それで足りる）
- `rd-command`（コマンドパレット。028）、`rd-select` のカスタム描写（customizable select は Baseline 外）
- 候補数の読み上げ

## 保守メモ

- 候補の唯一の出どころは `<datalist>`。部品は `[part='list']` に**写す**だけなので、利用側は `<option>` を書き換えれば済む
- `list` 属性を外すのは定義後だけ。SSR / JS 無しの HTML は常に `input[list]`（契約もそれを見る）
- `filterCandidates` は `rd-command`（028）が再利用する前提で `_shared` に**まだ移さない**（2 つ目の利用者が出たときに移す）
