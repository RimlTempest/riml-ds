# 034: `rd-calendar picker` — Date Picker（`rd-calendar` に `picker` 属性を足し、月表を `[popover]` に入れて 1 つのボタンで開く）

**優先度**: P1　**規模**: M　**依存**: 033（`rd-calendar`。**マージ済みであること**）、022（`rd-popover` の `popovertarget` + `[popover]` + `_shared/popover-anchor.ts`）、027（`rd-combobox` の `[popover]` の CSS と `anchorPopover` の使い方）
**レーン**: `feat/date-picker`　**計画時の main**: `20ca0a9`（033 マージ後。**036（`feat/number-field`）と並行** — `system/**` / `_shared/**` / `popover/**` / `combobox/**` には触らない）

> **Drift check（最初に実行）**:
> `grep -c picker library/elements/src/calendar/calendar.contract.ts` = 0（まだ `picker` が無い。1 以上なら STOP）。`sed -n 22p library/elements/src/calendar/calendar.contract.ts` が `    attrs: { today: '$today', 'week-start': '$weekStart' },`。
> `wc -l library/elements/src/calendar/calendar.element.ts` が **150**（上限ぎりぎり。**先に `#run` を `calendar.dom.ts` に出す**——§3）。
> `grep -c 'export const anchorPopover' library/elements/src/_shared/popover-anchor.ts` = 1、`grep -c 'export const syncStates' library/elements/src/_shared/internals.ts` = 1。
> `grep -c 'popover="manual"' library/elements/src/combobox/combobox.dom.ts` = 3（手本。ただしこの計画は **`popover`（auto）**を使う）。
> `grep -c 'export const calendarTemplate' library/elements/src/calendar/calendar.dom.ts` = 1、`grep -c 'export const commitDate' library/elements/src/calendar/calendar.dom.ts` = 1。
> `grep -c '^## 034 への道筋' docs/proposals/calendar.md` = 1。
> 「現状のコード」の抜粋を現物と見比べる。違っていたら STOP。

## なぜ

033 の `rd-calendar` は **月表が常に見えている**（inline calendar）。予定表や「今日を選ぶ」画面ではそれで良いが、
フォームの 1 行（生年月日・締め切り）に 7 行の月表を常設すると、他の入力欄が画面の外へ押し出される。
shadcn の **Date Picker** に当たるもの——入力欄の隣の 1 つのボタンで月表を開き、日を選んだら閉じる——が無い。

`rd-calendar` に **`picker` 属性**を足すだけで作る（新しい要素は作らない。`docs/proposals/calendar.md`「034 への道筋」で決めたとおり）。

- `<label for>` と `<input type="date">` はそのまま（値の真実は `<input>`。`min` / `max` / `required` も `<input>` の属性）
- JS が来たら、`<input>` の右に **44px のボタン**（`popovertarget`）と、header + grid を入れた **`<div part="popover" popover role="dialog">`** を足す
- 開くのはネイティブ（`popovertarget`）。**閉じるのも Escape / light dismiss はネイティブ**。部品が自分で呼ぶのは「日を選んだあとの `hidePopover()`」の 1 行だけ
- JS が無ければ **`<input type="date">` だけの普通の入力欄**（ティア A。OS のピッカーが出る。害は無い）

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/calendar/**`**（自分が変える部品。全ファイルを先に読む）、**`library/elements/src/popover/popover.element.ts`**（`popovertarget` を結ぶ・`toggle` を聞く・開いたら中へ、閉じたら trigger へフォーカス）、
  **`library/elements/src/combobox/combobox.css` の `[part='list']`**（top layer の重ね物の CSS。`position: fixed; inset: auto`、**通常状態に `display` を書かない**、`@supports (position-area: block-end)` の anchor positioning）、**`combobox.dom.ts` の `anchorPopover(control, snap.list, snap.name, …)`**
- `any` / `as` / `!` / `enum` を書かない（`as const satisfies Contract` だけ許される）。`class` は `*.element.ts` の `extends LitElement` だけ
- **`*.logic.ts` で `throw` しない**。**失敗するテストを先に書く**
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**。`custom-elements.json` / `tools/cem/registry.json` / 生成ラッパーの差分は**同じコミットに含める**（guard 規則 15）
- **ホストの属性名を `popover` にしない**（§1）。`popover` は HTML のグローバル属性で、`<rd-calendar popover>` と書くとホスト自身が popover になって**消える**
- ティア A の不変条件: `createRenderRoot() { return this }`、`static styles` / `shadowRootOptions` / `attachShadow` を書かない、`calendar.styles.ts` を作らない、`@pe A`
- 触ってよいパス（`scripts/lanes.tsv` の `feat/date-picker`）: `library/elements/src/calendar/**`、`library/elements/src/experimental/calendar/**`、`library/elements/package.json`（exports は変えない。触らずに済むはず）、`library/elements/custom-elements.json`、
  `library/{react,vue,svelte,astro}/src/generated/**`、`library/astro/package.json`（生成分）、`tools/cem/registry.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`library/react/test/**`、`e2e/**`（`e2e/__screenshots__` は**新しい**画像だけ）、
  `.size-limit.json`（`calendar/define` の上限を変える必要が出たときだけ。15 KB のまま通るはず）、`docs/proposals/calendar.md`（**「034 への道筋」節を「034 の結果」に書き換える**）、`.changeset/`
  **触らない**: `library/elements/src/_shared/**`、`library/elements/src/popover/**`、`library/elements/src/combobox/**`、`library/elements/src/text-field/**`、`system/**`、`tools/cem/src/**`、`apps/storybook/**`、`docs/*.md`（`docs/proposals/calendar.md` を除く）、`DESIGN.md`、`plans/README.md`、`skills/**`、`.claude/**`、`scripts/**`、`.github/**`
- **並行レーン 036** も `e2e/pe/build-pages.ts` / `tier-a.spec.ts` / `axe.spec.ts` / `e2e/a11y/keyboard.spec.ts` / `e2e/frameworks/**` / `e2e/*/src/**` / `tools/mcp/src/examples.ts` に**追記する**。
  自分の追記は **033 が足した `calendar` の記述の直後**（`build-pages.ts` は `'calendar.html'` の直後、`keyboard.spec.ts` は `calendar:` の 3 テストの直後、`shared.ts` は `calendarSuite` の中）に置く。
  `git merge main` は任意。コンフリクトしたら自分で解決せず STOP（reviewer が union で解く）。生成物のコンフリクトは `bun run build && bun run gen` で作り直してよい

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/calendar/calendar.contract.ts`（契約。`picker` はまだ無い）:

```ts
  tree: {
    tag: 'rd-calendar',
    attrs: { today: '$today', 'week-start': '$weekStart' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: {
          id: '$id',
          name: '$name',
          type: 'date',
          value: '$defaultValue',
          min: '$min',
          max: '$max',
          required: '$required',
        },
      },
    ],
  },
```

`calendar.element.ts`（150 行。`#run` が 16 行、`if` が 4 つ。**`#run` を `calendar.dom.ts` へ出してから**足す）:

```ts
  /** 範囲の外へ焦点は動けるが選べない（`aria-disabled`。APG と同じ） */
  #run = (action: logic.CalendarAction, event: Event): void => {
    const dates = this.#read()
    if (action.kind === 'none') {
      return
    }
    event.preventDefault()
    if (action.kind === 'move') {
      this.#focused = action.iso
      this.#month = logic.monthOf(action.iso)
      this.#pendingFocus = action.focus
      this.requestUpdate()
      return
    }
    if (logic.inRange(action.iso, dates.min, dates.max)) {
      dom.commitDate(this, this.#attached.control, action.iso)
    }
  }
```

`calendar.element.ts` の `render()` / `updated()`（`calendarTemplate` は header + grid を**ホストの直下**に描く）:

```ts
  override updated(): void {
    syncStates(this.#internals, this.#view().states)
    dom.focusCell(this, this.#pendingFocus ? this.#focused : undefined)
    this.#pendingFocus = false
  }

  override render(): TemplateResult {
    const view = this.#view()
    const names = dom.namesOf(view, logic.parseWeekStart(this.weekStart), this)
    return dom.calendarTemplate(view, names, { labelId: this.#attached.labelId })
  }
```

`calendar.dom.ts` の `calendarTemplate`（末尾。`malformed` なら何も足さない）:

```ts
export const calendarTemplate = (
  view: CalendarView,
  names: CalendarNames,
  ids: CalendarIds,
): TemplateResult =>
  view.states.has('malformed')
    ? html``
    : html`<div part="header">
          ${navTemplate('prev', names.nav.prev, '‹', view.states.has('at-min'))}
          <p part="title" aria-live="polite">${names.title}</p>
          ${navTemplate('next', names.nav.next, '›', view.states.has('at-max'))}
        </div>
        <table part="grid" role="grid" aria-labelledby=${ids.labelId}>
          …
        </table>`
```

`calendar.logic.ts` の `computeView`（`states` はここで決まる。`open` を足す）:

```ts
export const computeView = (input: CalendarViewInput): CalendarView => ({
  …
  states: input.malformed
    ? new Set(['malformed'])
    : new Set([input.selected === undefined ? 'empty' : 'selected', ...navStates(input)]),
})
```

`library/elements/src/popover/popover.element.ts`（手本: `popovertarget` を結び、`toggle` を聞き、開いたら中へ・閉じたら trigger へフォーカス）:

```ts
    trigger.setAttribute('popovertarget', trigger.getAttribute('popovertarget') ?? panel.id)
    panel.addEventListener('toggle', this.#onToggle)
    …
      ;(this.#open ? entryPoint(this.#panel()) : this.#trigger())?.focus()
```

`library/elements/src/combobox/combobox.css`（手本: top layer の重ね物。**通常状態に `display` を書かない**）:

```css
  rd-combobox [part='list'] {
    position: fixed;
    box-sizing: border-box;
    inset: auto;
    z-index: var(--rd-layer-overlay);
    …
    box-shadow: var(--rd-shadow-raised);
  }

  rd-combobox [part='list']:popover-open {
    display: grid;
  }

  @supports (position-area: block-end) {
    rd-combobox [part='list'] {
      position-area: block-end span-inline-end;
      position-try-fallbacks: flip-block;
      inline-size: anchor-size(width);
    }
  }
```

`_shared/popover-anchor.ts` の `anchorPopover(trigger, popover, name, options)`——同じ木（light DOM 同士）なら `anchor-name` / `position-anchor` を書いて CSS に任せ、無ければ `top` / `left` を書く。`name` は部品ごとに一意（`--` は付けない）。

## 設計（決めてある。変えるなら STOP）

### 1. 契約（`calendar.contract.ts`）

- `tree.attrs` に **`picker: '$picker'`** を足す: `attrs: { today: '$today', 'week-start': '$weekStart', picker: '$picker' }`
- `CalendarMarkupProps` に `readonly picker?: boolean`（JSDoc: 「月表を常設せず、ボタンで開く `[popover]` に入れる。JS 無しでは `<input type="date">` だけ」）
- `roles` / `required` / 子は変えない。**新しい `<button>` / `[popover]` は契約の子ではない**（JS が足す強化ノード。`rd-popover` と違い利用側は書かない）
- 属性名は **`picker`**。`popover` にしない（グローバル属性と衝突してホストが消える）。`date-picker` にもしない（ラッパー props が `datePicker` になり、部品名と紛れる）
- `contract.test.ts`: `markup({ …, picker: true })` に ` picker` が出て、`picker` を省くと出ないこと（`required` と同じ真偽属性の扱い）

### 2. 純関数（`calendar.logic.ts`）

- `CalendarViewInput` に **`readonly picker: boolean`** と **`readonly open: boolean`** を足す
- `computeView` の `states`: `malformed` でなければ、いまの集合に **`picker && open` のとき `'open'`** を足す（`picker` が無いときは `open` が true でも足さない——popover が無いので常に閉じている）
- `CalendarView` に **`readonly picker: boolean`** と **`readonly open: boolean`** を足す（描く側が読む）
- ボタンの文言: `navCopy` の隣に **`toggleCopy(japanese: boolean): string`** → 日本語 `'暦を開く'`、英語 `'Open calendar'`（`NavCopy` に足さず別関数。`navCopy` の呼び側を変えない）
- `logic.test.ts`: `computeView` で `picker: true, open: true` → `states` に `open`、`picker: false, open: true` → 無い、`malformed: true` → `open` も無い。`toggleCopy` の 2 通り

### 3. element（`calendar.element.ts`、≤ 150 行、`if` ≤ 5）と `calendar.dom.ts`

**先に `#run` を `calendar.dom.ts` へ出す**（150 行の余白を作る）:

```ts
// calendar.dom.ts
export type PerformInput = {
  readonly host: HTMLElement
  readonly attached: Attached
  readonly dates: CalendarDates
  readonly picker: boolean
}
export type Move = { readonly iso: IsoDate; readonly focus: boolean }

/**
 * action を実行する。`move` は element に返して状態を動かしてもらう（`undefined` は「何も変えない」）。
 * `select` は `<input>` に書き、`picker` なら popover を閉じる（focus は UA が invoker へ戻す）。
 */
export const perform = (input: PerformInput, action: CalendarAction, event: Event): Move | undefined
```

- `perform`: `none` → `undefined`（`preventDefault` しない）。`move` → `event.preventDefault()` して `{ iso, focus }` を返す。`select` → `preventDefault()`、`inRange` なら `commitDate(...)` し、**`input.picker` なら `readPopover(host)?.hidePopover()`**（**`if` は `perform` の中で使ってよい**。`dom.ts` に行数の上限は無い）→ `undefined`
- element 側の `#run` は 8 行以内:

```ts
  #run = (action: logic.CalendarAction, event: Event): void => {
    const input = { host: this, attached: this.#attached, dates: this.#read(), picker: this.picker }
    const move = dom.perform(input, action, event)
    if (move === undefined) {
      return
    }
    this.#focused = move.iso
    this.#month = logic.monthOf(move.iso)
    this.#pendingFocus = move.focus
    this.requestUpdate()
  }
```

**`picker` 属性**:

- `static properties` に `picker: { type: Boolean, reflect: false }`（Lit の真偽属性。`declare picker: boolean`、constructor で `false`）
- `#view()` の入力に `picker: this.picker, open: dom.isOpen(this)` を足す（`dom.isOpen(host) = host.querySelector(':scope > [part="popover"]')?.matches(':popover-open') ?? false`）
- **`toggle` イベント**: popover の `toggle` を Lit テンプレートで `@toggle=${callbacks.onToggle}` と結ぶ（`calendarTemplate` の第 3 引数 `ids` を `{ labelId, onToggle }` に広げる）。element の `#onToggle = (event: Event): void => { this.#pendingFocus = dom.isOpening(event); this.requestUpdate() }`——`dom.isOpening(event)` は `popover.dom.ts` の `newState` の読み方と同じ（`'newState' in event && event.newState === 'open'`）
- 開いたときのフォーカス: 既存の `updated()` が `#pendingFocus` を見て `focusCell(this, this.#focused)` する（**変えない**）。`tabindex="0"` の升目（選ばれている日か今日）へ移る
- 閉じたときのフォーカス: **部品は何もしない**。`popovertarget` で開いた `popover`（auto）は、閉じるときにフォーカスが中にあれば UA が invoker（toggle ボタン）へ戻す（HTML 仕様の hide popover algorithm）。`Escape` と light dismiss（外を押す）もネイティブ
- 位置決め: `updated()` の末尾で **`dom.anchorPicker(this)`**——`picker` かつ `[part='toggle']` と `[part='popover']` があるとき `anchorPopover(toggle, popover, \`rd-calendar-${control.id}\`)` を呼ぶ（`combobox.dom.ts` と同じ。`name` に `control.id` を使うのは `id` がページ内で一意だから）。`picker` でなければ何もしない
- `aria-expanded` は Lit テンプレートで `aria-expanded=${view.open ? 'true' : 'false'}`（`toggle` → `requestUpdate` で追随）
- `disconnectedCallback` は変えない（popover は light DOM の子なので一緒に外れる）
- **`showPopover()` を呼ばない**（開くのは `popovertarget` だけ）。`hidePopover()` は `perform` の 1 箇所だけ

**`calendarTemplate`**（`calendar.dom.ts`）:

```ts
export const calendarTemplate = (view, names, ids: { labelId; onToggle }): TemplateResult => {
  if (view.states.has('malformed')) return html``
  const body = html`<div part="header">…</div><table part="grid" …>…</table>`   // いまの中身そのまま
  return view.picker ? pickerTemplate(body, view, names, ids) : body
}
```

```ts
/** picker のとき。ボタンは <input> の右、月表は top layer の [popover] の中 */
const pickerTemplate = (body, view, names, ids): TemplateResult => html`<button
    type="button"
    part="toggle"
    popovertarget=${ids.popoverId}
    aria-expanded=${view.open ? 'true' : 'false'}
    aria-label=${names.toggle}
  >
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="16" height="16">
      <rect x="1" y="2" width="14" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" />
      <path d="M1 6h14M5 1v3M11 1v3" stroke="currentColor" stroke-width="1.5" />
    </svg>
  </button>
  <div part="popover" id=${ids.popoverId} popover role="dialog" aria-labelledby=${ids.labelId} @toggle=${ids.onToggle}>
    ${body}
  </div>`
```

- `ids.popoverId` は `\`${control.id}-popover\``（`attach` の `Attached` に `popoverId` を足す。`labelId` と同じ作り）
- **アイコンは上の 4 本の線だけの inline SVG**（`currentColor`、`aria-hidden`）。絵文字や `▦` は使わない——CI の Chromium（`fonts-noto-cjk` だけ）で字形が無い。参考画像の柄を写さない
- `role="dialog"` は **`aria-modal` を付けない**（非モーダル。後ろは操作できる。APG「Date Picker Dialog」はモーダルだが、`popover`（auto）の light dismiss と噛み合わない）。名前は `<label>` を `aria-labelledby` で指す（grid と同じ出どころ）
- `popover`（**auto**。`combobox` の `manual` と違う）: Escape と外側クリックで閉じるのが Date Picker の期待。開いている間に別の `auto` popover が開けば閉じる（正しい）
- `names.toggle`: `CalendarNames` に `readonly toggle: string` を足し、`namesOf` で `toggleCopy(japanese)` を入れる

### 4. CSS（`calendar.css`）

`@layer rd.components` の中に追記（既存の宣言は**変えない**。`picker` のときだけ上書きする）:

```css
  /* picker: 枠と月表の常設をやめ、<label> / <input> / ボタンだけを 2 列に並べる。月表は top layer へ */
  rd-calendar[picker] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: var(--rd-space-2);
    align-items: end;
    inline-size: auto;
    padding: 0;
    border-width: 0;
    background: transparent;
    overflow: visible;
  }

  rd-calendar[picker] > label {
    grid-column: 1 / -1;
  }

  rd-calendar[picker] > input {
    margin-block-end: 0;
  }

  /* 開くボタン。<input> と同じ高さ・枠・角（.rd-icon-button の寸法） */
  rd-calendar > [part='toggle'] {
    display: inline-grid;
    place-items: center;
    inline-size: var(--rd-sizing-target-min);
    block-size: var(--rd-sizing-target-min);
    padding: 0;
    border-width: var(--rd-border-width-default);
    border-style: solid;
    border-color: var(--rd-color-border-default);
    border-radius: var(--rd-radius-md);
    background: var(--rd-color-surface-raised);
    color: var(--rd-color-text-default);
    font: inherit;
    cursor: pointer;
  }

  rd-calendar > [part='toggle'] > svg {
    inline-size: 1.25rem;
    block-size: 1.25rem;
  }

  /* 月表の窓（brand.md §7.3）。top layer に出るので fixed。inset を戻さないと UA の中央寄せが残る。
     **通常状態に display を書かない**——author の @layer が UA の
     `[popover]:not(:popover-open) { display: none }` に勝って、閉じても見えてしまう（024） */
  rd-calendar > [part='popover'] {
    position: fixed;
    box-sizing: border-box;
    inset: auto;
    z-index: var(--rd-layer-overlay);
    inline-size: max-content;
    max-inline-size: calc(100vi - var(--rd-space-4));
    margin: var(--rd-space-1) 0 0;
    padding: var(--rd-space-3);
    border-width: var(--rd-border-width-default);
    border-style: solid;
    border-color: var(--rd-color-border-default);
    border-radius: var(--rd-radius-lg);
    background: var(--rd-color-surface-raised);
    box-shadow: var(--rd-shadow-raised);
    color: var(--rd-color-text-default);
  }

  /* anchor positioning は Baseline Newly。無ければ element が top / left を書く（_shared/popover-anchor.ts） */
  @supports (position-area: block-end) {
    rd-calendar > [part='popover'] {
      position-area: block-end span-inline-end;
      position-try-fallbacks: flip-block;
    }
  }
```

- `[part='header']` / `[part='grid']` / `td` の宣言は **`rd-calendar > [part='header']`** のように `>` で書かれているものがある。popover の中では `rd-calendar > [part='popover'] > [part='header']` になるので、**`>` を外して `rd-calendar [part='header']` にする**（`[part='title']` の `rd-calendar > [part='header'] > [part='title']` も同様）。`:where()` で詳細度 `0,3,0` に収める（stylelint `selector-max-specificity`）
- forced-colors: `rd-calendar > [part='toggle'] { border-color: ButtonText; color: ButtonText }`、`rd-calendar > [part='popover'] { border-color: CanvasText }`
- `rd-calendar > [part='toggle']:focus-visible` は既存の `rd-calendar button:focus-visible` が当たる（追記不要）
- `inline-size: anchor-size(width)` は**書かない**（月表は自分の幅を持つ。入力欄より広い）

### 5. イベント・状態・JSDoc

- 新しいイベントは無い（`rd-change` はそのまま。popover の開閉は `toggle` がネイティブに出る）
- `:state()` に **`open`** を足す（`picker` で popover が開いているとき）。JSDoc `@state open - picker の月表が開いている`
- JSDoc に `@attr picker - 月表を常設せず、<input> の右のボタンで開く [popover] に入れる（JS 無しでは <input type="date"> だけ）`、`@csspart toggle - 月表を開くボタン（picker のとき）`、`@csspart popover - 月表を入れる [popover]（picker のとき）`
- `@summary` を「月の暦。<label> と <input type="date"> は利用側が書き、JS があるときだけその下（picker ならボタンで開く窓）に月表が付く」に

### 6. 検証面

- **`calendar.test.ts`**（追記 7 件。`fixtureOf` / `press` / `cellOf` の既存ヘルパーを使う）:
  1. `picker` 無し → `[part='toggle']` / `[part='popover']` が 0 個（回帰）
  2. `picker` → `button[part='toggle'][popovertarget]` と `[part='popover'][popover][role='dialog']` が 1 個ずつ、header と grid は **popover の中**、`:popover-open` でない、toggle の `aria-expanded="false"`、`:state(open)` でない
  3. toggle を `click()` → `:popover-open`、`:state(open)`、`aria-expanded="true"`、**`document.activeElement` が `[data-iso][tabindex="0"]`**
  4. 開いた状態で升目に `Enter` → `<input>` の値が変わり `rd-change` が 1 回、popover が閉じて `:state(open)` が消える、`aria-expanded="false"`
  5. `popover.hidePopover()` を直接呼んでも `aria-expanded` / `:state(open)` が追随する（`toggle` を聞いている）
  6. `picker` で `value` setter → 表示月が動く（既存の挙動が popover の中でも生きている）
  7. `picker` でも契約の子が無ければ `malformed` で **toggle も popover も描かない**
  - `Escape` と外側クリックは合成イベントでは UA の light dismiss が動かないので **e2e（Playwright）で見る**（下）
  - 4 で「閉じたあとフォーカスが toggle に戻る」も見たいが、vitest browser の Chromium で UA のフォーカス復帰が観測できなければ**その 1 行だけ落として報告**する（STOP ではない）
- **`calendar.sr.test.ts`**（追記 2 件）: `picker` の toggle が `button` で名前 `暦を開く`（`lang="en"` なら `Open calendar`）、popover が `dialog` で名前が `<label>` の文字列
- **stories**（`calendar.stories.ts` に 3 つ追記）: `Picker`（閉じた姿。`play`: toggle の `aria-expanded` が `false`、`:popover-open` でない）、`PickerOpen`（`play`: `userEvent.click(toggle)` → `waitFor(:state(open))` → 焦点が `[data-iso="2026-09-15"]`）、`PickerDark`（`{ ...PickerOpen, globals: { scheme: 'dark' } }`）。
  render は `html\`<div style="min-block-size: 26rem">${unsafeHTML(...)}</div>\`` で下に開く余白を取る（`popover.stories.ts` と同じ理由）。story の `args` は `{ ...Default の args, picker: true }`
- **e2e/pe**: `build-pages.ts` に **`'date-picker.html'`**（`'calendar.html'` の直後）: `calendarMarkup({ id: 'deadline', label: '締め切り', name: 'deadline', defaultValue: '2026-09-15', today: '2026-09-09', picker: true })`。
  `tier-a.spec.ts` に 2 テスト（JS 無し: `[part='toggle']` と `[part='popover']` が 0 個、`<input type="date">` が見えて `<label>` が名前を付ける／JS 無しでも `rd-calendar[picker]` の枠が無い = `border-width` が `0px`）。`axe.spec.ts` の `PAGES` に `'/date-picker.html'`
- **`e2e/a11y/keyboard.spec.ts`**（`components-calendar--picker` を使う。3 テスト）:
  1. `<input>` に focus → `Tab` → toggle に届く → `Enter` → `:popover-open` → 焦点が `[data-iso="2026-09-15"]`
  2. 開いて `ArrowRight` → `Enter` → `<input>` が `2026-09-16`、popover が閉じ、**toggle にフォーカスが戻る**（UA の復帰）
  3. 開いて `Escape` → 閉じて toggle にフォーカスが戻る（ネイティブ）
- **`e2e/frameworks`**: 4 つの App（`e2e/react/src/App.tsx`、`e2e/vue/src/App.vue`、`e2e/svelte/src/App.svelte`、`e2e/astro/src/pages/index.astro`）の既存の `RdCalendar` の**直後**に `picker` の 2 つ目を足す（`id="deadline" label="締め切り" name="deadline" defaultValue="2026-09-15" today="2026-09-09" picker`）。
  `shared.ts` の `calendarSuite` に追記: JS 無し → `compareMarkup(page, 'rd-calendar[picker]', calendarMarkup({ …, picker: true }))` と `rd-calendar[picker] [part='toggle']` が 0 個；JS あり → toggle を click → `rd-calendar[picker] [part='popover']` が `:popover-open` → `[data-iso="2026-09-20"]` を click → `rd-calendar[picker] > input` が `2026-09-20`、popover が閉じる
- **`tools/mcp/src/examples.ts`**: `rd-calendar` の例に `picker` 付きの 2 例目を足す（既存の形に合わせる）。`tools/mcp/test` の件数が変わるなら合わせる
- **`library/react/test/markup.test.tsx`**: `RdCalendar` に `picker` を渡した `renderToString` が `calendarMarkup({ …, picker: true })` と一致

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

`bun install --frozen-lockfile && git checkout bun.lock && bun run build && bun run gen && bun run test`。緑を確認して Drift check。

### Step 1 — 契約と純関数（`feat(elements): add the picker attribute to the rd-calendar contract and view states`）

§1・§2。`contract.test.ts` / `logic.test.ts` を先に赤にする。`bun run build && bun run gen` で `custom-elements.json` / `registry.json` / 生成ラッパー（`picker` prop）を同じコミットへ。

### Step 2 — element と CSS（`feat(elements): open the rd-calendar month grid from a popover when picker is set`）

§3・§4・§5。**最初に `#run` → `dom.perform` の抽出だけを行い `bun run test` が緑のままであることを確認**してから `picker` を足す。`calendar.test.ts` / `sr.test.ts` / stories を先に赤にする。`bun run build && bun run gen`。

### Step 3 — 検証面（`test(e2e): cover the rd-calendar picker with and without JS and in the four frameworks`）

§6 の e2e / examples / react test。`bun run pe` → `bun run e2e:frameworks` → `bun run a11y`。

### Step 4 — VRT（`test(vrt): baselines for the calendar picker stories`）

`bun run storybook:build && bash scripts/vrt.sh`（background）。新規は `Picker` / `PickerOpen` / `PickerDark` × 4 プロジェクト = **12 枚**（`forced-colors` / `reduced-motion` のプロジェクトはこの story を撮らない）。**既存の calendar の画像が変わっていたら STOP**（`>` を外した CSS の詳細度で inline の見え方が変わった可能性）。

### Step 5 — 仕上げ（`docs(proposals): record the date picker decision and add a changeset`）

`docs/proposals/calendar.md` の「034 への道筋」を **「034 の結果（Date Picker）」** に書き換える（なぜ新要素でなく属性か／なぜ `popover`（auto）で `aria-modal` を付けないか／なぜ閉じたときのフォーカス復帰を UA に任せるか／なぜホスト属性名が `popover` ではなく `picker` か／inline SVG のアイコンの理由）。`.changeset/calendar-picker.md`（`@rimltempest/riml-ds-elements` minor、ラッパー 4 つ patch）。

## 完了条件（機械で検査できるもの）

- `bun run check` = 0、`bun run test` = 0
- `wc -l library/elements/src/calendar/calendar.element.ts` ≤ 150、`grep -c '\bif\b' library/elements/src/calendar/calendar.element.ts` ≤ 5
- ティア A の不変条件: `grep -c '@pe A' …/calendar.element.ts` = 1、`grep -cE 'static (override )?styles|shadowRootOptions|attachShadow' …/calendar.element.ts` = 0、`test ! -e …/calendar.styles.ts`、`grep -c 'createRenderRoot' …/calendar.element.ts` = 1
- `grep -c "picker: '\$picker'" library/elements/src/calendar/calendar.contract.ts` = 1
- `grep -c 'showPopover' library/elements/src/calendar/*.ts` = 0、`grep -c 'hidePopover' library/elements/src/calendar/calendar.dom.ts` = 1、`grep -c 'popovertarget' library/elements/src/calendar/calendar.dom.ts` = 1
- `grep -c 'role="dialog"' library/elements/src/calendar/calendar.dom.ts` = 1、`grep -c 'aria-modal' library/elements/src/calendar/*.ts` = 0、`grep -c '<svg' library/elements/src/calendar/calendar.dom.ts` = 1
- `grep -c "'open'" library/elements/src/calendar/calendar.logic.ts` ≥ 1
- `grep -c 'Temporal\|getWeekInfo' library/elements/src/calendar/*.ts` = 0（033 のまま）
- `bash scripts/guard.sh` = 0、`bun run pe` = 0、`bun run e2e:frameworks` = 0、`bash scripts/vrt.sh` = 0、`bun run a11y` = 0、`bun run release:check` = 0
- `git diff --name-only main...HEAD -- e2e/__screenshots__` に**既存**画像が 1 枚も無い（新規 12 枚だけ）
- 生成物: `grep -c 'picker' library/react/src/generated/calendar.tsx` ≥ 1（React の props に `picker?: boolean`）
- `.size-limit.json` の `calendar/define` が通る（15 KB のまま）

## STOP する条件（改善せず報告する）

- `bash scripts/guard.sh` が落ちる（規則 8・9 のどちらでも）。guard を緩めない
- 既存の calendar の VRT 画像が変わる。size-limit 超過。`calendar.element.ts` が 150 行 / `if` 5 に収まらない（`dom.ts` に出しても）
- `git merge main` で `e2e/**` / `.size-limit.json` / `package.json` / `examples.ts` がコンフリクトする
- ラッパー生成器が `picker: '$picker'` を真偽 prop にしない（`required: '$required'` と同じ扱いになるはず。ならなければ `tools/cem/src/**` の問題——レーン外）
- markuplint / axe が light DOM の `<div popover role="dialog" aria-labelledby>` か `<button popovertarget aria-expanded>` を落とす（規則を緩めない）
- vitest browser の Chromium で `popovertarget` の click が `:popover-open` にならない（合成 click は UA の invoker 動作を起こすはずだが、起きなければ報告）
- `_shared/**` / `system/**` / `popover/**` / `combobox/**` を変えないと実装できない

## スコープ外

- 範囲選択・複数選択、時刻、年月のドロップダウン、`rd-text-field` と同じ hint / error（`<input>` のネイティブ検証に任せる。必要なら次の計画）、モーダルの Date Picker（`<dialog>`）、`rd-popover` 側の変更、和暦

## 保守メモ

- ホスト属性 **`picker`** は HTML のグローバル属性 `popover` と**別物**。`popover` に改名しないこと（ホストが消える）
- 開くのは UA（`popovertarget`）、閉じるのも Escape / light dismiss は UA。部品が呼ぶのは `perform` の `hidePopover()` 1 行。**`showPopover()` を足したくなったら設計を見直す**（開閉の主導権が 2 つになる）
- 閉じたときのフォーカス復帰は UA の hide popover algorithm（フォーカスが popover の中にあれば invoker へ）に任せている。**`toggle.focus()` を自分で呼ばない**——UA の復帰と二重になり、light dismiss で他所を押した人のフォーカスを奪う
- `[part='header']` / `[part='grid']` の CSS は inline（ホスト直下）と picker（`[part='popover']` の中）の**両方**に当たる。`>` を戻さない
- `anchor-name` は `rd-calendar-${input.id}`。同じ `id` の `<input>` が 2 つあるページでは位置が狂う（`id` の一意性は HTML の前提）
