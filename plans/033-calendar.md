# 033: `rd-calendar` — 月の暦（light DOM の `<label>` + `<input type="date">` を包み、JS があるときだけその下に `role="grid"` の月表を描くティア A）

**優先度**: P1　**規模**: L　**依存**: 023（`_shared/lang.ts` の日英の文言）、028（`rd-command` の「light DOM に描く + `*.dom.ts` 層」の形）
**レーン**: `feat/calendar`　**計画時の main**: `74fa5bd`（028・029・030 マージ後。**031（`feat/toggle-group`）・032（`feat/carousel`）と並行** — `system/**` / `_shared/**` には触らない）

> **改訂（2026-09-09）**: 初版は「`<input type="date">` を包む**ティア B**（shadow に grid）」だったが、これは ADR-0012 決定 1
> （フォームに参加する部品は **A 以外を選べない**）と `scripts/guard.sh` 規則 9 に反し、executor が正しく STOP した。
> 本版は **ティア A**——grid も light DOM に描く（`rd-input-otp` の hint / error、`rd-command` の `[part='empty']` と同じ「強化ノード」）。
> `<input type="date">` は**隠さない**（入力欄として残る。モバイルでは OS のピッカー、デスクトップでは下の月表）。

> **Drift check（最初に実行）**:
> `test -d library/elements/src/calendar && echo EXISTS` が何も出ないこと。出たら STOP。
> `grep -c 'export const usesJapaneseCopy' library/elements/src/_shared/lang.ts` = 1、`grep -c 'export type LangHost' library/elements/src/_shared/lang.ts` = 1。
> `grep -c 'export const syncStates' library/elements/src/_shared/internals.ts` = 1、`grep -c 'export const setControlValue' library/elements/src/_shared/native-control.ts` = 1、
> `grep -c 'export const bindListeners' library/elements/src/_shared/native-control.ts` = 1。
> `grep -c 'export const objectKey' tools/cem/src/wrappers/core/common.ts` = 1（ハイフン付きホスト属性 `week-start` をラッパーに出せる修正 `1b57a66` が入っている）。
> `grep -c 'createRenderRoot' library/elements/src/input-otp/input-otp.element.ts` = 1、`grep -c 'createRenderRoot' library/elements/src/command/command.element.ts` = 1。
> `grep -c '@pe A' scripts/guard.sh` ≥ 1（規則 9 が生きている）。
> 「現状のコード」の抜粋を現物と見比べる。違っていたら STOP。

## なぜ

shadcn の一覧にある **Calendar**（月の暦から日を選ぶ）と **Date Picker**（それをポップオーバーに入れたもの）が無い。
riml-ds には日付を扱う部品が 1 つも無く、利用側（noter の期限、qrcc の有効期限）は素の `<input type="date">` を置いている。
素の `<input type="date">` は **JS 無しで動き、送信に載り、モバイルでは OS のピッカーが出る**——これは捨てない。
足りないのは **デスクトップで月を見渡して選ぶ UI** と、**ブランドの見た目**（cream の窓・丸いタイル）である。

`rd-calendar` は PE の形でその両方を満たす（ADR-0012 **ティア A**。フォームに参加する部品は A 以外を選べない）:

- light DOM に **`<label for>` + `<input type="date">`** を置く（利用側が書く。契約）。JS 無しではそれがそのまま使える
- JS が来たら **同じ light DOM の末尾に** `role="grid"` の月表（APG「Date Picker Dialog」の Grid の部分）と前後の月ボタンを描く。
  `<input>` は**そのまま見せる**（キーボードで打てる・モバイルは OS のピッカー。grid は「もう 1 つの入力面」）
- grid で選ぶと `<input>` の `value` に書き、`input` / `change` を `<input>` に投げ、`rd-change { value }` を出す。**値の真実は `<input>`**。
  逆に `<input>` に打ち込むと（`input` イベント）grid の選択と表示月が追随する
- `min` / `max` / `required` は **`<input>` の属性**（JS 無しでも効く。部品は読むだけ）

Date Picker（ポップオーバーに月表を入れる）は **034** で、この部品に `popover` の姿を足す。ここでは inline の暦だけを作る。

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/input-otp/**`**（ティア A が light DOM に強化ノードを `render()` する形・`bindListeners`・`syncStates`）と
  **`library/elements/src/command/**`**（`*.element.ts` を 150 行に収める `*.dom.ts` 層、light DOM への `renderEmpty`、キー表 `decideKey`）と
  **`library/elements/src/text-field/**`**（`<label for>` + `<input>` の契約、`text-field.css` の入力欄の見た目）
- ティア A の不変条件（`scripts/guard.sh` 規則 8）: `*.element.ts` に `static styles` / `shadowRootOptions` / `attachShadow` を**書かない**。
  `createRenderRoot() { return this }`。CSS は **`calendar.css` だけ**（`calendar.styles.ts` は作らない）
- `any` / `as` / `!` / `enum` を書かない（`as const satisfies Contract` だけ許される）。`class` は `*.element.ts` の `extends LitElement` だけ（ADR-0005）
- **失敗するテストを先に書く**
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**
- **ラッパーの props は契約の `tree.attrs` から作られる**。ホスト属性は `today` / `week-start` の 2 つ、`<input>` の属性は `id` / `name` / `value` / `min` / `max` / `required`。
  ハイフン付きの `week-start` は `1b57a66` 以降ラッパーに出せる（`objectKey` で引用される）。React の prop 名は `$weekStart` から `weekStart`
- **`Temporal` は使わない**（Safari 未対応）。日付の計算は `Date.UTC` + `getUTC*` だけで書き、**タイムゾーンに依存しない**
  （`new Date('2026-09-09')` は UTC 深夜として解釈される。ローカル時刻の `new Date(y, m, d)` は使わない）
- `Intl.Locale.prototype.getWeekInfo` は **使わない**（TS 7 の lib に型が無く、Firefox も無い）。週の始まりは属性 `week-start` で受ける
- 「今日」は属性 `today`（`YYYY-MM-DD`）で注入できる。テスト・story・VRT は**必ず `today` を書く**（時計を引数で受ける規則の element 版）
- 文言（「前の月」「次の月」）は `usesJapaneseCopy(host)`。月名・曜日名は `Intl.DateTimeFormat` に任せる（`timeZone: 'UTC'` を必ず付ける）

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/input-otp/input-otp.element.ts`（ティア A。既存の子を消さずに light DOM の末尾へ強化ノードを描く。この形をそのまま使う）:

```ts
  /** light DOM に描く。既存の子は消さない */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#bindings.forEach((binding) => binding.detach())
    this.#bindings = []
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      const missing = result.roles.join(', ')
      console.error(`[rd-input-otp] <fieldset><legend> と桁の <input> が必要（不足: ${missing}）`)
    }
    this.#contractOk = result.kind === 'ok'
    this.#bindings = this.#cells().map((cell) => bindListeners(cell, this.#listeners))
  }
  …
  /** 強化ノード（ADR-0008 §6: `aria-live` は付けない） */
  override render(): TemplateResult {
    const view = this.#view()
    return html`${this.hint === '' ? nothing : html`<p part="hint" id=${view.hintId}>${this.hint}</p>`}${
      view.message === '' ? nothing : html`<p part="error" id=${view.errorId}>${view.message}</p>`
    }`
  }
```

`library/elements/src/command/command.dom.ts`（テンプレートと DOM の読み書きを `*.dom.ts` に出し、element を 150 行に収める。関数 + クロージャだけ）:

```ts
export const renderEmpty = (copy: string, show: boolean): TemplateResult =>
  html`<p part="empty" role="status" ?hidden=${!show}>${copy}</p>`
```

`library/elements/src/text-field/text-field.contract.ts`（`<label for>` + `<input>` の木。`id` / `name` / `value` / `required` の置き方）:

```ts
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: {
          id: '$id',
          name: '$name',
          type: '$type',
          required: '$required',
          autocomplete: '$autocomplete',
          value: '$defaultValue',
        },
      },
    ],
```

`library/elements/src/text-field/text-field.css`（ティア A の入力欄の見た目。`calendar.css` の `<input>` はこれと同じ宣言にする）:

```css
  rd-text-field > input,
  rd-text-field > textarea {
    display: block;
    inline-size: 100%;
    min-block-size: var(--rd-sizing-target-min);
    padding-block: var(--rd-space-2);
    padding-inline: var(--rd-space-3);
    border-width: var(--rd-border-width-default);
    border-style: solid;
    border-color: var(--rd-color-border-default);
    border-radius: var(--rd-radius-md);
    background: var(--rd-color-surface-raised);
    color: var(--rd-color-text-default);
    font: inherit;
    line-height: var(--rd-line-height-body);
  }
```

`library/elements/src/_shared/lang.ts`:

```ts
/** 最も近い `[lang]` を見る。無い / `ja-*` なら日本語の文言を使う */
export const usesJapaneseCopy = (host: LangHost): boolean => {
  const lang = host.closest('[lang]')?.getAttribute('lang') ?? ''
  const primary = lang.split('-')[0]?.toLowerCase() ?? ''
  return primary === '' || primary === 'ja'
}
```

`library/elements/src/_shared/native-control.ts`: `setControlValue(control, value)`（`value` を書くだけ。イベントは出さない）、`bindListeners(el, listeners)`（`{ detach }` を返す）、
`asNativeControl(el)`（`HTMLInputElement | HTMLTextAreaElement | undefined`）。
`library/elements/src/_shared/internals.ts`: `syncStates(internals, ReadonlySet<string>)`、`syncAttribute(el, name, value | undefined)`。
`library/elements/src/_shared/markup.ts`: 属性値の `'$name'` は **props[name] そのもの**を指す（`'$id-label'` のような連結は**できない**。ラベルの `id` は element が実行時に付ける）。

`scripts/guard.sh` 規則 9（この部品が A でなければならない理由。**欺かない**）:

```sh
  roles="$(grep -A6 -E '^[[:space:]]*roles:' "$contract_file" || true)"
  if printf '%s' "$roles" | grep -qE '(input|textarea|select|button|a\[href\])'; then
    if ! grep -qE '^[[:space:]]*\*[[:space:]]*@pe[[:space:]]+A' "$dir/$name.element.ts" 2>/dev/null; then
      report "$contract_file" "a contract wrapping form / link / button elements must be @pe A (ADR-0012)"
```

## 設計（決めてある。変えるなら STOP）

### 1. 契約（`calendar.contract.ts`）

```ts
export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input[type="date"]',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-calendar',
    attrs: { today: '$today', 'week-start': '$weekStart' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: { id: '$id', name: '$name', type: 'date', value: '$value', min: '$min', max: '$max', required: '$required' },
      },
    ],
  },
} as const satisfies Contract

export type CalendarMarkupProps = {
  readonly id: string
  readonly label: string
  readonly name?: string
  /** 選ばれている日（`YYYY-MM-DD`）。`<input value>` に書く */
  readonly value?: string
  /** 「今日」。省略すると element が実時刻から決める。テスト・story は必ず書く */
  readonly today?: string
  /** 週の始まり。`0`（日曜、既定）〜 `6` */
  readonly weekStart?: '0' | '1' | '2' | '3' | '4' | '5' | '6'
  /** 選べる範囲（`YYYY-MM-DD`）。**`<input min max>` に書く**（JS 無しでもネイティブの検証が効く。部品は読むだけ） */
  readonly min?: string
  readonly max?: string
  readonly required?: boolean
}
export const markup = (props: CalendarMarkupProps): string => renderMarkup(contract.tree, props)
```

- **`min` / `max` / `required` は `<input>` の属性**。element は `input.min` / `input.max` を読む（`MutationObserver { attributeFilter: ['min', 'max'] }` で追随。`value` は見ない——下記）。
- `label` は `<label for>`（JS 無しで `<input>` に結びつく）。JS があるときは element が **`label.id ||= \`${input.id}-label\`` を付け、grid に `aria-labelledby` で結ぶ**（同じ light DOM なので参照できる。`aria-label` への複写はしない）。
- `<input>` は隠さない。**入力欄 + 月表の 2 つの入力面**が同じ値を指す。

### 2. 純関数（`calendar.logic.ts`）

日付は **`YYYY-MM-DD` の文字列**か **`{ year, month(1–12), day }`** で持ち、`Date` は `Date.UTC` の往復にだけ使う。

```ts
export type IsoDate = string   // 'YYYY-MM-DD'。検証は parseIsoDate
export type YearMonth = { readonly year: number; readonly month: number }   // month は 1–12

export const parseIsoDate = (value: string | null | undefined): IsoDate | undefined
  // /^\d{4}-\d{2}-\d{2}$/ に合い、Date.UTC 往復で同じ文字列になるもの（2026-02-30 は undefined）
export const formatIsoDate = (date: Date): IsoDate            // getUTC* から
export const monthOf = (iso: IsoDate): YearMonth
export const addMonths = (ym: YearMonth, delta: number): YearMonth
export const addDays = (iso: IsoDate, delta: number): IsoDate  // Date.UTC(y, m-1, d + delta)
export const parseWeekStart = (value: string | null): number   // '0'..'6' 以外は 0
export const clampToRange = (iso: IsoDate, min: IsoDate | undefined, max: IsoDate | undefined): IsoDate
export const inRange = (iso: IsoDate, min: IsoDate | undefined, max: IsoDate | undefined): boolean

export type Cell = { readonly iso: IsoDate; readonly day: number } | undefined   // undefined = 月の外（空欄）
/** 常に 6 週 × 7 日。先頭は weekStart の曜日。月の外は undefined */
export const monthGrid = (ym: YearMonth, weekStart: number): readonly (readonly Cell[])[]

/** APG Date Picker の Grid。← → ±1 日、↑ ↓ ±7 日、Home / End 週の始め / 終わり（weekStart 基準）、
 *  PageUp / PageDown ±1 か月、Shift+PageUp / Shift+PageDown ±1 年。扱わないキーは undefined。
 *  月をまたいだ結果もそのまま返す（表示月の切り替えは element が monthOf で判断する） */
export const moveDate = (iso: IsoDate, key: string, shift: boolean, weekStart: number): IsoDate | undefined

/** ±1 か月で日が無いとき（1/31 → 2/28）は末日に寄せる */

export type CalendarView = {
  readonly month: YearMonth
  readonly rows: readonly (readonly Cell[])[]
  readonly focused: IsoDate
  readonly selected: IsoDate | undefined
  readonly today: IsoDate
  readonly states: ReadonlySet<string>
}
export const computeView = (input: {
  month: YearMonth; focused: IsoDate; selected: IsoDate | undefined; today: IsoDate
  weekStart: number; min: IsoDate | undefined; max: IsoDate | undefined; malformed: boolean
}): CalendarView
// states: malformed → {'malformed'} だけ。それ以外は { selected!==undefined ? 'selected' : 'empty',
//   addMonths(month,-1) の末日 < min なら 'at-min', addMonths(month,+1) の 1 日 > max なら 'at-max' }

/** 表示用の名前。すべて timeZone: 'UTC' */
export const monthTitle = (ym: YearMonth, locale: string): string        // Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', timeZone: 'UTC' })
export const weekdayNames = (weekStart: number, locale: string): readonly { readonly short: string; readonly long: string }[]  // 7 個、weekStart から
export const cellLabel = (iso: IsoDate, locale: string): string           // { year:'numeric', month:'long', day:'numeric', weekday:'long', timeZone:'UTC' }（gridcell の aria-label）
export const navCopy = (japanese: boolean): { readonly prev: string; readonly next: string }   // 「前の月」「次の月」 / 'Previous month' 'Next month'
```

- `moveDate` に `min` / `max` は渡さない。範囲外へフォーカスは**移動できる**が選べない（APG と同じ。`aria-disabled="true"`）。
- 「今日」は `today` 属性があればそれ、無ければ `formatIsoDate(new Date())`（element の 1 箇所だけ）。

### 3. element（`calendar.element.ts`、≤ 150 行、`if` ≤ 5）+ `calendar.dom.ts`

- **ティア A**: `createRenderRoot() { return this }`。`static styles` / `shadowRootOptions` を書かない。`@pe A`。
  `static override properties = { today: {}, weekStart: { attribute: 'week-start' } }`（`reflect` しない）
- **描く木**（`calendar.dom.ts` の `calendarTemplate(view, names, ids): TemplateResult` が返す。element 本体には `render() { return calendarTemplate(...) }` だけ。
  Lit は既存の子（`<label>` / `<input>`）を消さず、**その後ろ**に描く）:

  ```html
  <label for="due" id="due-label">期限</label>     <!-- 利用側が書く（契約）。id は element が実行時に付ける -->
  <input id="due" name="due" type="date" value="2026-09-15" min="…" max="…">
  <div part="header">                              <!-- ここから下は JS が足す強化ノード -->
    <button type="button" part="prev" aria-label="前の月">‹</button>
    <p part="title" aria-live="polite">2026年9月</p>
    <button type="button" part="next" aria-label="次の月">›</button>
  </div>
  <table part="grid" role="grid" aria-labelledby="due-label">
    <thead><tr><th scope="col" abbr="日曜日">日</th> …×7</tr></thead>
    <tbody>
      <tr> ×6
        <td role="gridcell" tabindex="-1|0" data-iso="2026-09-01" aria-label="2026年9月1日火曜日"
            aria-selected="true"? aria-current="date"? aria-disabled="true"?>1</td>
        <td role="gridcell" aria-hidden="true"></td>     <!-- 月の外は空欄。tabindex 無し -->
      </tr>
    </tbody>
  </table>
  ```

  - **gridcell は `<td>` 自身が focusable**（APG「Date Picker Dialog」と同じ。`<button>` は入れない。`aria-selected` は gridcell に置く必要があるため）
  - `tabindex="0"` は `focused` の 1 個だけ。他は `-1`。空欄は `tabindex` 無し
  - `aria-label` は日付の読み（`cellLabel`）。表示は日の数字だけ
  - 月の見出しは **`<p part="title">`**（`<h2>` にしない——利用側の見出し階層に割り込まない）。`aria-live="polite"`（月が変わったら読む。APG と同じ）
  - `prev` / `next` は `:state(at-min)` / `:state(at-max)` で `aria-disabled="true"`（`disabled` にしない。Tab で止まって理由が分かる）
  - Tab 順は **`<input>` → prev → next → focused の gridcell**（自然な DOM 順。`tabindex` の並べ替えはしない）
- `firstUpdated`: `checkContract` → `malformed` + `console.error('[rd-calendar] <label> と <input type="date"> が必要（不足: …）')`。
  `label.id ||= …`。`#selected = parseIsoDate(input.value)`、`#focused = #selected ?? clampToRange(today, min, max)`、`#month = monthOf(#focused)`。
  `<input>` に `bindListeners(input, { input: … })`——**`input` イベント**で `#selected` / `#month` を追随させる（打ち込みにも、外からの `input.value = …; input.dispatchEvent(new Event('input'))` にも同じ道）。
  `value` **属性**の `MutationObserver` は付けない（`value` プロパティは属性を動かさない）。`min` / `max` だけ `attributeFilter` で見る
- `updated`: `syncStates`、`#pendingFocus` が立っていれば `this.querySelector('[data-iso="…"]')` を `focus()` して下ろす（**月をまたいだ再描画でフォーカスを失わない**）
- イベントは host に 1 組だけ委譲: `this.addEventListener('click' | 'keydown', …)`（constructor。`calendar.dom.ts` の `readCell(event): IsoDate | undefined`（`closest('[data-iso]')`）と `readNav(event): 'prev' | 'next' | undefined` で対象を判定。
  **`<input>` から上がってきた keydown は無視する**（`event.target === input` なら return——入力欄の矢印キーはネイティブに任せる）
  - click on cell → `#select(iso)`。click on `prev` / `next` → `#month = addMonths(±1)`、`#focused` は同じ日（無ければ末日）
  - keydown on cell → `moveDate(focused, key, shiftKey, weekStart)` が `undefined` なら何もしない。そうでなければ `preventDefault()`、`#focused = next`、`#month = monthOf(next)`、`#pendingFocus = true`、`requestUpdate()`
  - `Enter` / `Space` on cell → `#select(focused)`（範囲外なら何もしない）
- `#select(iso)`: `inRange` でなければ return。`setControlValue(input, iso)`、`input.dispatchEvent(new Event('input', { bubbles: true }))`、`new Event('change', { bubbles: true })`、
  `rd-change` を `{ value: iso }` で dispatch（`bubbles: true, composed: true`）。**同じ日をもう一度押しても出す**（shadcn と違い解除はしない。範囲選択は 035 以降）。
  自分が投げた `input` イベントで `bindListeners` の追随が走るのは正しい（`#selected` が同じ値になるだけ）
- `get value(): string`（`input.value`）、`set value(next)`（`parseIsoDate` に通らなければ `''`。`<input>` に書き、表示月を合わせる。イベントは出さない）
- `checkValidity()` / `reportValidity()` は **`<input>` に委譲**（`rd-text-field` と同じ。`required` / `min` / `max` の検証はネイティブ）
- `disconnectedCallback` で `input` の listener と `MutationObserver` を外す

### 4. CSS（`calendar.css` だけ。light DOM）

`@layer rd.components` に書く。**`calendar.styles.ts` は作らない**（ティア A）。

- `rd-calendar { display: block; inline-size: fit-content; max-inline-size: 100%; overflow-x: auto; padding: var(--rd-space-3); border: var(--rd-border-width-default) solid var(--rd-color-border-default); border-radius: var(--rd-radius-lg); background: var(--rd-color-surface-raised); color: var(--rd-color-text-default) }`、`rd-calendar[hidden] { display: none }`
- `rd-calendar > label` は `text-field.css` の `rd-text-field > label` と同じ宣言。`rd-calendar > input` は `rd-text-field > input` と同じ宣言（上の抜粋）+ `:focus-visible` + `:user-invalid`（`text-field.css` を写す。**`system/**` には触らない**）。
  `rd-calendar > input { margin-block-end: var(--rd-space-3) }`（月表との間）
- `rd-calendar > [part='header'] { display: flex; align-items: center; justify-content: space-between; gap: var(--rd-space-2) }`、`rd-calendar > [part='header'] > [part='title'] { margin: 0; font: var(--rd-type-body); font-weight: var(--rd-font-weight-bold) }`
- `[part='prev'], [part='next']`: `.rd-icon-button` と同じ寸法（`inline-size: var(--rd-sizing-target-min); block-size: var(--rd-sizing-target-min); border: 0; border-radius: var(--rd-radius-full); background: transparent; color: inherit`）。`[aria-disabled='true'] { color: var(--rd-color-text-muted); cursor: not-allowed }`
- `rd-calendar > [part='grid'] { border-collapse: separate; border-spacing: var(--rd-space-1); inline-size: 100% }`、`th { font: var(--rd-type-small); font-weight: var(--rd-font-weight-bold); color: var(--rd-color-text-muted) }`
  （`base.css` の `table` / `th` / `td` の既定（罫線・余白）を **ここで上書きする**——`rd-calendar > [part='grid'] :is(th, td) { border: 0; padding: 0 }`）
- `td[data-iso] { inline-size: var(--rd-calendar-cell-size, var(--rd-sizing-target-min)); block-size: var(--rd-calendar-cell-size, var(--rd-sizing-target-min)); border-radius: var(--rd-radius-md); text-align: center; cursor: pointer }`（**丸いタイル**。ブランド §7 の ink tile）
  `td[aria-selected='true'] { background: var(--rd-color-accent-default); color: var(--rd-color-accent-text); font-weight: var(--rd-font-weight-bold) }`
  `td[aria-current='date']:not([aria-selected='true']) { box-shadow: 0 0 0 var(--rd-border-width-default) var(--rd-color-accent-default) }`（**`inset` は書かない**）
  `td[aria-disabled='true'] { color: var(--rd-color-text-muted); cursor: not-allowed }`
  `td[data-iso]:hover:not([aria-disabled='true']) { background: var(--rd-color-surface-hover) }`
- `td:focus-visible, button:focus-visible { outline: var(--rd-focus-ring-width) solid var(--rd-focus-ring-color); outline-offset: var(--rd-focus-ring-offset) }`
- 強制配色: `td[aria-selected='true'] { forced-color-adjust: none; background: SelectedItem; color: SelectedItemText }`、`td[aria-current='date'] { box-shadow: 0 0 0 var(--rd-border-width-default) CanvasText }`
- `@media (prefers-reduced-motion: no-preference)` の中だけに `td { transition: background-color var(--rd-motion-duration-fast) var(--rd-motion-easing-standard) }`
- **JS 無し**: 強化ノードが無いだけで、`<label>` + `<input>` の見た目は上の宣言がそのまま当たる（`:not(:defined)` の分岐は要らない。`rd-calendar` の枠と余白も同じ）
- 小さい画面: `@container` は使わない。`inline-size: fit-content` なので親が狭ければ `td` は `--rd-sizing-target-min` を下回らずに横へ溢れ、host の `overflow-x: auto` が受ける
  （**溢れた host はキーボードで届く**——中に focusable な `<input>` / `<td tabindex>` があるので axe の `scrollable-region-focusable` は出ない）
- `system/css` は触らない。`e2e/pe/build-pages.ts` の CSS 一覧に `calendar.css` を足す

### 5. イベント・状態・JSDoc

- `@event {CustomEvent<{ value: string }>} rd-change - 日を選んだときに発火（value は YYYY-MM-DD）`
- `@state selected` / `@state empty` / `@state at-min` / `@state at-max` / `@state malformed`
- `@csspart header` / `title` / `prev` / `next` / `grid`、`@cssprop --rd-calendar-cell-size - 日のタイルの一辺。既定 var(--rd-sizing-target-min)`
- `@summary 月の暦。<label> と <input type="date"> は利用側が書き、JS があるときだけその下に月表が付く`、`@status experimental`、`@pe A`
- `@slot - <label for> と <input type="date">（省略不可）`

### 6. 検証面

- `calendar.contract.test.ts`（roles / tree / `markup` が `<input type="date">` と `for`/`id` を出す、`min`/`max`/`required` が **`<input>` に出る**（ホストには出ない）、`today` / `week-start` がホストに出る、エスケープ）
- `calendar.logic.test.ts`（`parseIsoDate` の不正日付、`monthGrid` が 6×7・`weekStart=1` で月曜始まり・2026-09 の 1 日が火曜の位置、`moveDate` 全キー + 月またぎ + 閏年 2028-02-29、`addMonths` の末日寄せ 2026-01-31 → 2026-02-28、`computeView` の states、`monthTitle('ja')` = `2026年9月`、`monthTitle('en-US')` = `September 2026`、`weekdayNames` の順、`navCopy`）
- `calendar.test.ts`（実 DOM、`today="2026-09-09"` を必ず書く）: 契約欠落で `malformed`、**`shadowRoot` が `null`**（ティア A）、grid が `<input>` の**後ろ**に描かれ `aria-labelledby` が `<label>` の `id` を指す、初期フォーカスが `value` の日（無ければ today）で `tabindex="0"` が 1 個だけ、→ で翌日、↓ で翌週、PageDown で title が `2026年10月` に変わり**フォーカスが残る**（`document.activeElement` が新しい `[data-iso]`）、Shift+PageUp で `2025年9月`、Enter で `input.value` と `rd-change.detail.value` が同じ ISO、`<input min max>` 外は `aria-disabled` で Enter しても変わらない、`at-min` で prev が `aria-disabled`、`lang="en"` で `Previous month`、`value` setter で表示月が動く、`<input>` へ `input` イベントを投げると `aria-selected` と表示月が追随、`<input>` にフォーカスがあるときの `ArrowRight` は grid を動かさない、`required` で空のとき `checkValidity()` が `false`、タッチターゲット ≥ 44px、`prefers-reduced-motion: reduce` で `getAnimations()` が空
- `calendar.sr.test.ts`: 仮想 SR が「textbox 期限（date）」→「button 前の月」→「grid 期限」→「gridcell 2026年9月15日火曜日 selected」の順で読む
- `e2e/pe/build-pages.ts` に `calendar.html`（`markup` 1 個 + `calendar.css`）、ティア A の JS 無し spec に **2 本**（`<input type="date">` が見えて `label` で名前が付く／grid が**無い**）、`e2e/a11y/keyboard.spec.ts` に **JS あり 3 本**（Tab で `<input>` → 「前の月」→「次の月」→ 今日の gridcell に届く／→ ↓ で `tabindex="0"` の日が動く／Enter で `input.value`）、`axe.spec.ts` に 1 ページ
- `e2e/frameworks/shared.ts` に `calendarSuite`（4 フレームワークで描画・日を押すと `input.value`）、4 アプリに 1 例ずつ（`today` を固定）
- `tools/mcp/src/examples.ts` に `'rd-calendar'`、`library/react/test/**` に生成ラッパーのテスト 1 本（`weekStart` prop が `week-start` 属性になり、`min` が `<input>` に出る）
- `.size-limit.json` に `calendar/define`（lit 込み）**15 KB**
- stories（**すべて `today="2026-09-09"`、`value="2026-09-15"` を固定**。`lang` は story の wrapper に書く）: `Default`（ja）、`English`（`lang="en-US"`）、`MondayStart`（`week-start="1"`）、`Range`（`min="2026-09-05" max="2026-09-25"`）、`Empty`（`value` 無し）、`Required`（`required`、`reportValidity()` 後の `:user-invalid`）、`Dark`、`Dense`、`RTL`、`ForcedColors`、`ReducedMotion`

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

`bun install --frozen-lockfile` → `git checkout bun.lock` → `bun run build` → `bun run gen` → `bun run test`。Drift check を通す。

### Step 1 — 契約と純関数（`feat(elements): add the rd-calendar contract and date math`）

`bun run scaffold:element calendar --pe A` → 契約と `calendar.logic.ts` のテストを先に書く → green。`Date` を作る所はすべて `new Date(Date.UTC(...))` にする（ローカル時刻の `new Date(y, m, d)` / `new Date('2026-09-09T00:00')` は書かない。完了条件の grep で見る）。

### Step 2 — element と CSS（`feat(elements): add rd-calendar (experimental, tier A)`）

`calendar.element.ts` / `calendar.dom.ts` / `calendar.css` / stories / `calendar.test.ts` / `calendar.sr.test.ts`。`bun run build && bun run gen`。
`wc -l calendar.element.ts` ≤ 150（テンプレートと `readCell` / `readNav` / `focusCell` / `ensureLabelId` は `calendar.dom.ts`）。exports・size-limit・examples・react test もこの Step で。
**`bash scripts/guard.sh` をこの Step の終わりに必ず回す**（規則 8・9）。

### Step 3 — 検証面（`test(e2e): cover rd-calendar with and without JS and in the four frameworks`）

§6 の `e2e/pe`（build-pages + JS 無し 2 本）、`e2e/a11y`（keyboard 3 本 + axe 1 ページ）、`e2e/frameworks`（`calendarSuite` + 4 アプリの例）を書く。`bun run pe && bun run e2e:frameworks && bun run a11y`（VRT と同時に回さない）。

### Step 4 — VRT（`test(vrt): baselines for calendar`）

`bun run storybook:build && bash scripts/vrt.sh --update-snapshots`（新規画像だけ増えること。`git status` で既存画像の変更が無いこと）。

### Step 5 — 仕上げ（`docs(proposals): record the rd-calendar decision and add a changeset`）

`docs/proposals/calendar.md`（なぜ `<input type="date">` を**隠さず**そのまま見せるのか（JS 無しの唯一の入力手段。ティア A の約束）／なぜ **ティア A で light DOM に月表を描くのか**（`<input>` を包む契約は ADR-0012・guard 規則 9 でティア A が必須。shadow だと `<label for>` と `aria-labelledby` が境界を越えない）／なぜ `min` / `max` / `required` を**ホストではなく `<input>` の属性**にしたか（ネイティブ検証がそのまま働く。JS 無しでも制約が生きる）／なぜ `<td>` が focusable で `<button>` を入れないか（`aria-selected` は gridcell に置く。APG Date Picker Dialog と同じ）／なぜ月の見出しが `<p>` で `<h2>` でないか／`Temporal` と `getWeekInfo` を使わない理由（Baseline 外）／034（`popover` 属性）への道筋）、`.changeset/calendar.md`（`@rimltempest/riml-ds-elements` minor）。

## 完了条件（機械で検査できるもの）

- `bun run check` = 0、`bun run test` = 0（`calendar.*.test.ts` を含む）
- `wc -l library/elements/src/calendar/calendar.element.ts` ≤ 150、`grep -c '\bif\b' …/calendar.element.ts` ≤ 5
- **ティア A の不変条件**: `grep -c '@pe A' library/elements/src/calendar/calendar.element.ts` = 1、`grep -cE 'static (override )?styles|shadowRootOptions|attachShadow' library/elements/src/calendar/calendar.element.ts` = 0、`test ! -e library/elements/src/calendar/calendar.styles.ts`、`grep -c 'createRenderRoot' library/elements/src/calendar/calendar.element.ts` = 1
- `grep -c 'Temporal\|getWeekInfo' library/elements/src/calendar/*.ts` = 0、`grep -c 'new Date([0-9a-z]' library/elements/src/calendar/calendar.logic.ts` = 0（ローカル時刻の `Date` を作っていない）
- `bash scripts/guard.sh` = 0（規則 8・9・15 を含む）、`bun run pe` = 0、`bun run e2e:frameworks` = 0、`bash scripts/vrt.sh` = 0、`bun run a11y` = 0、`bun run release:check` = 0
- `git diff --name-only main...HEAD -- e2e/__screenshots__` に**既存**画像が 1 枚も無い
- `grep -c 'rd-calendar' library/react/src/generated/index.ts` ≥ 1、React の props に `weekStart` / `today` があり、`markup` の props に `min` / `max` / `required` があり、生成物に `'week-start'` が引用付きで出る
- `.size-limit.json` の `calendar/define` が通る（15 KB）

## STOP する条件（改善せず報告する）

- **`bash scripts/guard.sh` が落ちる**（規則 8・9 のどちらでも）。guard を緩めたり、grep をすり抜ける書き方（例: `@pe` の綴りを変える、`styles` を別名で持つ）で通したりしない。報告する
- 既存 VRT 画像が変わる。size-limit 超過。`calendar.element.ts` が 150 行 / `if` 5 に収まらない（`dom.ts` に出しても）
- `git merge main` で `e2e/**` / `.size-limit.json` / `package.json` / `examples.ts` がコンフリクトする
- markuplint が light DOM の `<td role="gridcell" tabindex>`、`aria-hidden` の空欄 `<td>`、`<table aria-labelledby>` を落とす（規則を緩めない。報告する）
- axe が `role="grid"` の中の `<td tabindex>` に `nested-interactive` や `aria-required-children` を出す
- `base.css` の `table` / `th` / `td` の既定が `rd-calendar > [part='grid'] :is(th, td)` で上書きできない（詳細度や `@layer` の順で負ける）。`system/**` を触らずに解けなければ報告する
- vitest browser で `document.activeElement` がフォーカス移動後に更新されない（月またぎのフォーカス保持が検証できない）
- `Intl.DateTimeFormat` の出力が CI（Linux Chromium）とローカルで違って VRT が安定しない（`lang` を固定しても揺れるなら報告）
- `_shared/**` / `system/**` / `tabs/**` / `text-field/**` / `input-otp/**` / `command/**` を変えないと実装できない

## スコープ外

- Date Picker（`popover` 属性で月表を `[popover]` に入れる形。034）、範囲選択・複数選択、時刻、年月のドロップダウン、hint / error の文言（`rd-text-field` の担当）、和暦・他の暦（`Intl` の `calendar` オプションは触らない）、`rd-text-field` 側の変更

## 保守メモ

- 値の真実は light DOM の `<input type="date">`。**部品は `value` を自分で持たない**（`#selected` は描画用のコピーで、`input` イベントで追随する）。
  外から値を変えるときは `element.value = …` か「`input.value = …` + `input` イベント」のどちらか
- 月表は **light DOM** にある。`base.css` の `table` / `th` / `td` の既定を `calendar.css` で上書きしているので、`system/css` の table 既定を変えるときは `Default` story の VRT で暦が崩れていないか見る
- 「今日」を実時刻から決めるのは element の 1 箇所だけ。テスト・story・e2e は必ず `today` を書く（書き忘れると年が変わった日に VRT が落ちる）
- `Intl.DateTimeFormat` の出力はブラウザの ICU に依存する。VRT は `lang="ja"` / `lang="en-US"` の 2 つに絞ってある。3 つ目を足すときは Docker の Chromium で確認する
- 034 は **この部品に `popover` 属性を足し、header + grid を `[popover]` に入れて開くボタンを 1 つ描く**だけで作る。暦側に「閉じる」責務を足さない（`rd-change` を受けて `hidePopover()` するのは 034 の element 側の 1 行）
