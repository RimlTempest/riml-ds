# 033: `rd-calendar` — 月の暦（light DOM の `<input type="date">` を包み、JS があるときだけ shadow に `role="grid"` の月表を描くティア B）

**優先度**: P1　**規模**: L　**依存**: 023（`rd-tabs` の shadow 枠 + light DOM の roving tabindex）、`_shared/lang.ts`（日英の文言）
**レーン**: `feat/calendar`　**計画時の main**: `28f2c5e`（028・029・030 マージ後。**031（`feat/toggle-group`）・032（`feat/carousel`）と並行** — `system/**` / `_shared/**` には触らない）

> **Drift check（最初に実行）**:
> `test -d library/elements/src/calendar && echo EXISTS` が何も出ないこと。出たら STOP。
> `grep -c 'export const usesJapaneseCopy' library/elements/src/_shared/lang.ts` = 1、`grep -c 'export type LangHost' library/elements/src/_shared/lang.ts` = 1。
> `grep -c 'export const syncStates' library/elements/src/_shared/internals.ts` = 1、`grep -c 'export const setControlValue' library/elements/src/_shared/native-control.ts` = 1。
> `grep -c 'export const objectKey' tools/cem/src/wrappers/core/common.ts` = 1（ハイフン付きホスト属性 `week-start` をラッパーに出せる修正 `1b57a66` が入っている）。
> `wc -l library/elements/src/tabs/tabs.element.ts` が **150**、`grep -c 'serializable: true' library/elements/src/tabs/tabs.element.ts` = 1。
> 「現状のコード」の抜粋を現物と見比べる。違っていたら STOP。

## なぜ

shadcn の一覧にある **Calendar**（月の暦から日を選ぶ）と **Date Picker**（それをポップオーバーに入れたもの）が無い。
riml-ds には日付を扱う部品が 1 つも無く、利用側（noter の期限、qrcc の有効期限）は素の `<input type="date">` を置いている。
素の `<input type="date">` は **JS 無しで動き、送信に載り、モバイルでは OS のピッカーが出る**——これは捨てない。
足りないのは **デスクトップで月を見渡して選ぶ UI** と、**ブランドの見た目**（cream の窓・丸いタイル）である。

`rd-calendar` は PE の形でその両方を満たす（ADR-0012 ティア B）:

- light DOM に **`<label>` + `<input type="date">`** を置く（利用側が書く。契約）。JS 無しではそれがそのまま使える
- JS が来たら shadow に **`role="grid"` の月表**（APG「Date Picker Dialog」の Grid の部分）を描き、`<input>` は隠す（`display: none`。**送信には載る**）
- 選ぶと `<input>` の `value` に書き、`input` / `change` を `<input>` に投げ、`rd-change { value }` を出す。**値の真実は `<input>`**

Date Picker（ポップオーバー + 入力欄）は **034** で、この部品と `rd-popover` を組む。ここでは暦だけを作る。

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/tabs/**`**（shadow は枠だけ・`serializable: true`・`nextIndex` の roving・`rd-change`）と
  **`library/elements/src/text-field/**`**（`<label for>` + `<input>` の契約、`id` / `name` / `value` の受け渡し）と
  **`library/elements/src/menu/menu.dom.ts`**（`*.element.ts` を 150 行に収めるための「読む・書く」層。関数 + クロージャだけ）
- `any` / `as` / `!` / `enum` を書かない（`as const satisfies Contract` だけ許される）。`class` は `*.element.ts` の `extends LitElement` だけ（ADR-0005）
- **失敗するテストを先に書く**
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**
- **ラッパーの props は契約の `tree.attrs` から作られる**。`label` / `today` / `week-start` / `min` / `max` はここに入れる。
  ハイフン付きの `week-start` は `1b57a66` 以降ラッパーに出せる（`objectKey` で引用される）。React の prop 名は `$weekStart` から `weekStart`
- **`Temporal` は使わない**（Safari 未対応）。日付の計算は `Date.UTC` + `getUTC*` だけで書き、**タイムゾーンに依存しない**
  （`new Date('2026-09-09')` は UTC 深夜として解釈される。ローカル時刻の `new Date(y, m, d)` は使わない）
- `Intl.Locale.prototype.getWeekInfo` は **使わない**（TS 7 の lib に型が無く、Firefox も無い）。週の始まりは属性 `week-start` で受ける
- 「今日」は属性 `today`（`YYYY-MM-DD`）で注入できる。テスト・story・VRT は**必ず `today` を書く**（時計を引数で受ける規則の element 版）
- 文言（「前の月」「次の月」）は `usesJapaneseCopy(host)`。月名・曜日名は `Intl.DateTimeFormat` に任せる（`timeZone: 'UTC'` を必ず付ける）

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/tabs/tabs.element.ts`（shadow は枠だけ。`serializable: true`。roving は light DOM に書き戻す。**この部品は逆に shadow の中に表を描く**が、
イベントの委譲・`nextIndex` 風の移動・`rd-change` の出し方はこの形に倣う）:

```ts
export class RdTabs extends LitElement {
  static override styles = styles

  /** `delegatesFocus` は付けない——タブ自身が light DOM のリンクで、フォーカスはそこに行く */
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, serializable: true }
  …
  constructor() {
    super()
    …
    // 自分自身への購読。要素が消えれば一緒に消えるので外す必要が無い
    this.addEventListener('click', this.#onInteract)
    this.addEventListener('keydown', this.#onInteract)
  }
  …
  override render(): TemplateResult {
    return html`<div part="control">
      <slot name="tabs"></slot>
      <div part="panels"><slot></slot></div>
    </div>`
  }
  …
    this.dispatchEvent(new CustomEvent('rd-change', { bubbles: true, composed: true, detail }))
```

`library/elements/src/text-field/text-field.contract.ts`（`<label for>` + `<input>` の木。`id` / `name` / `value` の置き方）:

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

`library/elements/src/_shared/lang.ts`:

```ts
/** 最も近い `[lang]` を見る。無い / `ja-*` なら日本語の文言を使う */
export const usesJapaneseCopy = (host: LangHost): boolean => {
  const lang = host.closest('[lang]')?.getAttribute('lang') ?? ''
  const primary = lang.split('-')[0]?.toLowerCase() ?? ''
  return primary === '' || primary === 'ja'
}
```

`library/elements/src/_shared/native-control.ts`: `setControlValue(control, value)`（`value` を書くだけ。イベントは出さない）、`asNativeControl(el)`（`HTMLInputElement | HTMLTextAreaElement | undefined`）。
`library/elements/src/_shared/internals.ts`: `syncStates(internals, ReadonlySet<string>)`、`syncAttribute(el, name, value | undefined)`。

`library/elements/src/tabs/tabs.styles.ts`（shadow の CSS は `css` タグで `@layer rd.components` に書く）:

```ts
export const styles: CSSResult = css`
  @layer rd.components {
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }
```

`library/elements/src/dialog/dialog.css`（light DOM 側の CSS。**JS 無しの見た目**は `:not(:defined)` で当てる）:

```css
  rd-dialog:not(:defined) {
    display: block;
    padding: var(--rd-space-4);
```

## 設計（決めてある。変えるなら STOP）

### 1. 契約（`calendar.contract.ts`）

```ts
export const contract = {
  pe: 'B',
  roles: {
    label: ':scope > label',
    control: ':scope > input[type="date"]',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-calendar',
    attrs: { today: '$today', 'week-start': '$weekStart', min: '$min', max: '$max' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      { tag: 'input', attrs: { id: '$id', name: '$name', type: 'date', value: '$value' } },
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
  /** 選べる範囲（`YYYY-MM-DD`）。ホスト属性。`<input min max>` には**書かない**（二重管理を避ける） */
  readonly min?: string
  readonly max?: string
}
export const markup = (props: CalendarMarkupProps): string => renderMarkup(contract.tree, props)
```

- **`min` / `max` はホスト属性**（`<input>` には書かない）。JS 無しの `<input type="date">` は範囲無しで動く（縮退。proposal に書く）。
- `label` は `<label for>`（JS 無しで `<input>` に結びつく）。JS があるときは element が **`<label>` の `textContent` を grid の `aria-label` に写す**
  （shadow の中から light DOM の `id` を `aria-labelledby` で参照できないため）。
- `required` は受けない（`display: none` の `<input required>` は送信時に「focusable でない」で黙って止まる。034 の date-field が受ける。スコープ外に書く）。

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

- shadow（`serializable: true`。`delegatesFocus` は付けない——フォーカス先は shadow の gridcell 1 個で、`tabindex` で自分が管理する）。
  `static override properties = { today: {}, weekStart: { attribute: 'week-start' }, min: {}, max: {} }`（`reflect` しない）
- **描く木**（`calendar.dom.ts` の `calendarTemplate(view, names, handlers): TemplateResult` が返す。element 本体には `render() { return calendarTemplate(...) }` だけ）:

  ```html
  <slot></slot>                                   <!-- light DOM の <label> と <input>。<input> は ::slotted で display: none -->
  <div part="header">
    <button type="button" part="prev" aria-label="前の月">‹</button>
    <h2 part="title" id="title" aria-live="polite">2026年9月</h2>
    <button type="button" part="next" aria-label="次の月">›</button>
  </div>
  <table part="grid" role="grid" aria-label="{label の textContent}">   <!-- light DOM の id は shadow から aria-labelledby で参照できない -->
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
  - `<h2 part="title">` は `aria-live="polite"`（月が変わったら読む。APG と同じ）
  - `prev` / `next` は `:state(at-min)` / `:state(at-max)` で `aria-disabled="true"`（`disabled` にしない。Tab で止まって理由が分かる）
- `firstUpdated`: `checkContract` → `malformed` + `console.error('[rd-calendar] <label> と <input type="date"> が必要（不足: …）')`。
  `#selected = parseIsoDate(input.value)`、`#focused = #selected ?? clampToRange(today, min, max)`、`#month = monthOf(#focused)`。
  `input` に `MutationObserver { attributes: true, attributeFilter: ['value'] }` **は付けない**——`value` プロパティは属性を動かさない。
  代わりに **`input` イベント**を `<input>` から拾って `#selected` を追随させる（外から `input.value = …; input.dispatchEvent(new Event('input'))` で同期できる。proposal に書く）
- `updated`: `syncStates`、`#pendingFocus` が立っていれば `renderRoot.querySelector('[data-iso="…"]')` を `focus()` して下ろす（**月をまたいだ再描画でフォーカスを失わない**）
- イベントは shadow root に 1 組だけ委譲: `this.renderRoot.addEventListener('click' | 'keydown', …)`（`calendar.dom.ts` の `readCell(event): IsoDate | undefined`（`closest('[data-iso]')`）で対象を判定）
  - click on cell → `#select(iso)`。click on `prev` / `next` → `#month = addMonths(±1)`、`#focused` は同じ日（無ければ末日）
  - keydown on cell → `moveDate(focused, key, shiftKey, weekStart)` が `undefined` なら何もしない。そうでなければ `preventDefault()`、`#focused = next`、`#month = monthOf(next)`、`#pendingFocus = true`、`requestUpdate()`
  - `Enter` / `Space` on cell → `#select(focused)`（範囲外なら何もしない）
- `#select(iso)`: `inRange` でなければ return。`setControlValue(input, iso)`、`input.dispatchEvent(new Event('input', { bubbles: true }))`、`new Event('change', { bubbles: true })`、
  `rd-change` を `{ value: iso }` で dispatch（`bubbles: true, composed: true`）。**同じ日をもう一度押しても出す**（shadcn と違い解除はしない。範囲選択は 035 以降）
- `get value(): string`（`input.value`）、`set value(next)`（`parseIsoDate` に通らなければ `''`。`<input>` に書き、表示月を合わせる。イベントは出さない）
- `disconnectedCallback` で `input` の listener を外す（`bindListeners` の `detach`）

### 4. CSS（`calendar.styles.ts` = shadow、`calendar.css` = light DOM）

`calendar.styles.ts`:

- `:host { display: inline-block; padding: var(--rd-space-3); border: var(--rd-border-width-default) solid var(--rd-color-border-default); border-radius: var(--rd-radius-lg); background: var(--rd-color-surface-raised); color: var(--rd-color-text-default) }`、`:host([hidden]) { display: none }`
- `::slotted(input) { display: none }`（JS があるときは grid が入力面。**送信には載る**）、`::slotted(label) { display: block; margin-block-end: var(--rd-space-2); font: var(--rd-type-small); color: var(--rd-color-text-muted) }`
- `[part='header'] { display: flex; align-items: center; justify-content: space-between; gap: var(--rd-space-2) }`、`[part='title'] { margin: 0; font: var(--rd-type-body); font-weight: var(--rd-font-weight-bold) }`
- `[part='prev'], [part='next']`: `.rd-icon-button` と同じ寸法（`inline-size: var(--rd-sizing-target-min); block-size: var(--rd-sizing-target-min); border: 0; border-radius: var(--rd-radius-full); background: transparent; color: inherit`）。`[aria-disabled='true'] { color: var(--rd-color-text-muted); cursor: not-allowed }`
- `[part='grid'] { border-collapse: separate; border-spacing: var(--rd-space-1); inline-size: 100% }`、`th { font: var(--rd-type-small); font-weight: var(--rd-font-weight-bold); color: var(--rd-color-text-muted) }`
- `td[data-iso] { inline-size: var(--rd-sizing-target-min); block-size: var(--rd-sizing-target-min); border-radius: var(--rd-radius-md); text-align: center; cursor: pointer }`（**丸いタイル**。ブランド §7 の ink tile）
  `td[aria-selected='true'] { background: var(--rd-color-accent-default); color: var(--rd-color-accent-text); font-weight: var(--rd-font-weight-bold) }`
  `td[aria-current='date']:not([aria-selected='true']) { box-shadow: 0 0 0 var(--rd-border-width-default) var(--rd-color-accent-default) }`（**`inset` は書かない**）
  `td[aria-disabled='true'] { color: var(--rd-color-text-muted); cursor: not-allowed }`
  `td[data-iso]:hover:not([aria-disabled='true']) { background: var(--rd-color-surface-hover) }`
- `td:focus-visible, button:focus-visible { outline: var(--rd-focus-ring-width) solid var(--rd-focus-ring-color); outline-offset: var(--rd-focus-ring-offset) }`
- 強制配色: `td[aria-selected='true'] { forced-color-adjust: none; background: SelectedItem; color: SelectedItemText }`、`td[aria-current='date'] { box-shadow: 0 0 0 var(--rd-border-width-default) CanvasText }`
- `@media (prefers-reduced-motion: no-preference)` の中だけに `td { transition: background-color var(--rd-motion-duration-fast) var(--rd-motion-easing-standard) }`
- 小さい画面: `@container` は使わない。`:host` が `inline-block` なので親の幅に従い、`td` は `--rd-sizing-target-min` を下回らない（横に溢れるより縦にスクロール）

`calendar.css`（light DOM。JS 無しの姿）: `rd-calendar:not(:defined) { display: grid; gap: var(--rd-space-1) }`、`rd-calendar:not(:defined) > label { font: var(--rd-type-small); color: var(--rd-color-text-muted) }`、`rd-calendar:not(:defined) > input { min-block-size: var(--rd-sizing-target-min); padding-inline: var(--rd-space-3); border: var(--rd-border-width-default) solid var(--rd-color-border-default); border-radius: var(--rd-radius-md); background: var(--rd-color-surface-raised); color: inherit; font: inherit }`。
`system/css` は触らない。`e2e/pe/build-pages.ts` の CSS 一覧に `calendar.css` を足す。

### 5. イベント・状態・JSDoc

- `@event {CustomEvent<{ value: string }>} rd-change - 日を選んだときに発火（value は YYYY-MM-DD）`
- `@state selected` / `@state empty` / `@state at-min` / `@state at-max` / `@state malformed`
- `@csspart header` / `title` / `prev` / `next` / `grid`、`@cssprop --rd-calendar-cell-size - 日のタイルの一辺。既定 var(--rd-sizing-target-min)`
- `@summary 月の暦。<label> と <input type="date"> は利用側が書き、JS があるときだけ月表になる`、`@status experimental`、`@pe B`
- `@slot - <label for> と <input type="date">（省略不可）`

### 6. 検証面

- `calendar.contract.test.ts`（roles / tree / `markup` が `<input type="date">` と `for`/`id` を出す、`min`/`max` がホスト属性に出て `<input>` には出ない、エスケープ）
- `calendar.logic.test.ts`（`parseIsoDate` の不正日付、`monthGrid` が 6×7・`weekStart=1` で月曜始まり・2026-09 の 1 日が火曜の位置、`moveDate` 全キー + 月またぎ + 閏年 2028-02-29、`addMonths` の末日寄せ 2026-01-31 → 2026-02-28、`computeView` の states、`monthTitle('ja')` = `2026年9月`、`monthTitle('en-US')` = `September 2026`、`weekdayNames` の順、`navCopy`）
- `calendar.test.ts`（実 DOM、`today="2026-09-09"` を必ず書く）: 契約欠落で `malformed`、初期フォーカスが `value` の日（無ければ today）で `tabindex="0"` が 1 個だけ、→ で翌日、↓ で翌週、PageDown で title が `2026年10月` に変わり**フォーカスが残る**（`shadowRoot.activeElement` が新しい `[data-iso]`）、Shift+PageUp で `2025年9月`、Enter で `input.value` と `rd-change.detail.value` が同じ ISO、`min`/`max` 外は `aria-disabled` で Enter しても変わらない、`at-min` で prev が `aria-disabled`、`lang="en"` で `Previous month`、`value` setter で表示月が動く、`<input>` へ `input` イベントを投げると `aria-selected` が追随、タッチターゲット ≥ 44px、`prefers-reduced-motion: reduce` で `getAnimations()` が空
- `calendar.sr.test.ts`: 仮想 SR が「grid 期限」→「gridcell 2026年9月15日火曜日 selected」の順で読む（`aria-label` を読むこと）
- `e2e/pe/build-pages.ts` に `calendar.html`（`markup` 1 個 + `calendar.css`）、`tier-b.spec.ts` に **JS 無し 2 本**（`<input type="date">` が見えて `label` で名前が付く／`:not(:defined)` の枠が当たる）、`e2e/a11y/keyboard.spec.ts` に **JS あり 3 本**（Tab で「前の月」→「次の月」→ 今日の gridcell に届く／→ ↓ で `tabindex="0"` の日が動く／Enter で `input.value`）、`axe.spec.ts` に 1 ページ
- `e2e/frameworks/shared.ts` に `calendarSuite`（4 フレームワークで描画・日を押すと `input.value`）、4 アプリに 1 例ずつ（`today` を固定）
- `tools/mcp/src/examples.ts` に `'rd-calendar'`、`library/react/test/**` に生成ラッパーのテスト 1 本（`weekStart` prop が `week-start` 属性になる）
- `.size-limit.json` に `calendar/define`（lit 込み）**15 KB**
- stories（**すべて `today="2026-09-09"`、`value="2026-09-15"` を固定**。`lang` は story の wrapper に書く）: `Default`（ja）、`English`（`lang="en-US"`）、`MondayStart`（`week-start="1"`）、`Range`（`min="2026-09-05" max="2026-09-25"`）、`Empty`（`value` 無し）、`Dark`、`Dense`、`RTL`、`ForcedColors`、`ReducedMotion`

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

`bun install --frozen-lockfile` → `git checkout bun.lock` → `bun run build` → `bun run gen` → `bun run test`。Drift check を通す。

### Step 1 — 契約と純関数（`feat(elements): add the rd-calendar contract and date math`）

`bun run scaffold:element calendar --pe B` → 契約と `calendar.logic.ts` のテストを先に書く → green。`Date` を作る所はすべて `new Date(Date.UTC(...))` にする（ローカル時刻の `new Date(y, m, d)` / `new Date('2026-09-09T00:00')` は書かない。完了条件の grep で見る）。

### Step 2 — element と CSS（`feat(elements): add rd-calendar (experimental, tier B)`）

`calendar.element.ts` / `calendar.dom.ts` / `calendar.styles.ts` / `calendar.css` / stories / `calendar.test.ts` / `calendar.sr.test.ts`。`bun run build && bun run gen`。
`wc -l calendar.element.ts` ≤ 150（テンプレートと `readCell` / `focusCell` / `labelOf` は `calendar.dom.ts`）。exports・size-limit・examples・react test もこの Step で。

### Step 3 — 検証面（`test(e2e): cover rd-calendar with and without JS and in the four frameworks`）

### Step 4 — VRT（`test(vrt): baselines for calendar`）

`bun run storybook:build && bash scripts/vrt.sh --update-snapshots`（新規画像だけ増えること。`git status` で既存画像の変更が無いこと）。

### Step 5 — 仕上げ（`docs(proposals): record the rd-calendar decision and add a changeset`）

`docs/proposals/calendar.md`（なぜ `<input type="date">` を包むのか／なぜ `min`/`max` をホスト属性にしたか／なぜ `<td>` が focusable で `<button>` を入れないか／なぜ `required` を受けないか／`Temporal` と `getWeekInfo` を使わない理由／034 date-field への道筋）、`.changeset/calendar.md`（`@rimltempest/riml-ds-elements` minor）。

## 完了条件（機械で検査できるもの）

- `bun run check` = 0、`bun run test` = 0（`calendar.*.test.ts` を含む）
- `wc -l library/elements/src/calendar/calendar.element.ts` ≤ 150、`grep -c '\bif\b' …/calendar.element.ts` ≤ 5
- `grep -c 'Temporal\|getWeekInfo' library/elements/src/calendar/*.ts` = 0、`grep -c 'new Date([0-9a-z]' library/elements/src/calendar/calendar.logic.ts` = 0（ローカル時刻の `Date` を作っていない）
- `bash scripts/guard.sh` = 0、`bun run pe` = 0、`bun run e2e:frameworks` = 0、`bash scripts/vrt.sh` = 0、`bun run a11y` = 0、`bun run release:check` = 0
- `git diff --name-only main...HEAD -- e2e/__screenshots__` に**既存**画像が 1 枚も無い
- `grep -c 'rd-calendar' library/react/src/generated/index.ts` ≥ 1、React の props に `weekStart` / `today` / `min` / `max` があり、生成物に `'week-start'` が引用付きで出る
- `.size-limit.json` の `calendar/define` が通る（15 KB）

## STOP する条件（改善せず報告する）

- 既存 VRT 画像が変わる。size-limit 超過。`calendar.element.ts` が 150 行 / `if` 5 に収まらない（`dom.ts` に出しても）
- `git merge main` で `e2e/**` / `.size-limit.json` / `package.json` / `examples.ts` がコンフリクトする
- markuplint が shadow の `<td role="gridcell" tabindex>` や `aria-hidden` の空欄 `<td>` を落とす（規則を緩めない。報告する）
- axe が `role="grid"` の中の `<td tabindex>` に `nested-interactive` や `aria-required-children` を出す
- vitest browser で `shadowRoot.activeElement` がフォーカス移動後に更新されない（月またぎのフォーカス保持が検証できない）
- `Intl.DateTimeFormat` の出力が CI（Linux Chromium）とローカルで違って VRT が安定しない（`lang` を固定しても揺れるなら報告）
- `_shared/**` / `system/**` / `tabs/**` / `text-field/**` を変えないと実装できない

## スコープ外

- Date Picker（ポップオーバー + 入力欄。034）、範囲選択・複数選択、時刻、年月のドロップダウン、`required` / 検証文言、和暦・他の暦（`Intl` の `calendar` オプションは触らない）、`rd-text-field` 側の変更

## 保守メモ

- 値の真実は light DOM の `<input type="date">`。**部品は `value` を自分で持たない**（`#selected` は描画用のコピーで、`input` イベントで追随する）。
  外から値を変えるときは `element.value = …` か「`input.value = …` + `input` イベント」のどちらか
- 「今日」を実時刻から決めるのは element の 1 箇所だけ。テスト・story・e2e は必ず `today` を書く（書き忘れると年が変わった日に VRT が落ちる）
- `Intl.DateTimeFormat` の出力はブラウザの ICU に依存する。VRT は `lang="ja"` / `lang="en-US"` の 2 つに絞ってある。3 つ目を足すときは Docker の Chromium で確認する
- 034（date-field）は **この部品を `rd-popover` の中に置く**だけで作る。暦側に「閉じる」責務を足さない（`rd-change` を popover 側が聞いて閉じる）
