# 035: 小さな追随 2（command の空表示幅・splitter の溢れた面を Tab で届かせる・menu の story・表見出しの折返し）

**優先度**: P2　**規模**: S　**依存**: 028・030（マージ済み）　**レーン**: `chore/follow-ups-035`
**計画時の main**: `0428da0`（2026-09-09。**031（`feat/toggle-group`）・032（`feat/carousel`）・033（`feat/calendar`）と並行** — それらのディレクトリと `_shared/**` には触らない）

> **Drift check（最初に実行）**:
> `git diff --stat 0428da0..HEAD -- library/elements/src/command library/elements/src/splitter library/elements/src/menu/menu.stories.ts system/css/src/atoms.css system/css/test docs/proposals/splitter.md`
> 差分が出たら、その内容を読んでから進める。`splitter.element.ts` の行数が 150 でなくなっていたり、`splitter.dom.ts` の `wireHandle` が無くなっていたら STOP して報告。

> **改訂（2026-09-09）**: executor の STOP を受けて 2 点を直した。(A) Step 1 の red テストの置き場 `command.test.ts` と、(B) §2 の `#dispose` フィールドで必ず変わる `custom-elements.json` を「触ってよいパス」と `scripts/lanes.tsv` に足した（guard 規則 15 は CEM の同時更新を**要求**するので、変わらないことを完了条件にしていた初版が矛盾していた）。§2 の 1 行削りは executor が `#onKeydown` の早期 return を畳む形で解決済み（挙動不変）。

## なぜ

028（`rd-command`）・030（`rd-splitter`）のレビューで「後で」にした 4 件と、010 の `.rd-table` の 1 件を片付ける。どれも小さいが、放置すると利用側の axe や見た目に出る。

1. **`rd-command` の「見つかりません」が細長い枡で狭くなる。** `[part='empty']` は `<p>` で描く（`command.dom.ts` の `renderEmpty`）。`system/css/src/base.css` が `p, li { max-inline-size: var(--rd-sizing-measure-max) }`（80ch）を当てるので、`text-align: center` の文言が **80ch を超える幅のパレットで左に寄る**。`max-inline-size: none` を足す。
2. **`rd-splitter` の面が溢れると axe `scrollable-region-focusable` に落ちる。** 面（shadow の `[part='start']` / `[part='end']`）は `overflow: auto` だが focusable でないので、内容が溢れたとき**キーボードだけの人が転がせない**。030 のレビュー（`Nested` story）で実際に落ちて、story 側の箱を大きくして逃げた（main `29dad78`）。部品側で「溢れているときだけ `tabindex="0"`」にする。
3. **`Menu` の `Variants` story が閉じたメニュー 2 つを撮っていて、何の比較にもなっていない。** `placement` の違いはメニューを開かないと見えない。`Placement` story（開いた `end`）が別にあるので、`Variants` は **`end` を開いた状態**で撮り直し、`Placement` は削る（同じ絵が 2 枚ある必要は無い）。
4. **`.rd-table` の見出しが狭い列で折り返す。** 「名前」「更新日」のような短い見出しが 2 行になると行の高さが揃わない。`th` に `white-space: nowrap` を足す（`td` は折り返してよい）。
5. **`docs/proposals/splitter.md` に「面の中に入れた splitter は `block-size: 100%` が解けない」の記録が無い。** 030 のレビューで見つけた事実（`29dad78` の `framedMarkup` のコメント）。次に nested を書く人が同じ穴に落ちないよう「実装のメモ」に 1 項足す。

## 現状のコード（抜粋）

`library/elements/src/command/command.css` L93–100:

```css
  rd-command > [part='empty'] {
    margin: 0;
    padding: var(--rd-space-3);
    color: var(--rd-color-text-muted);
    font: var(--rd-type-small);
    /* stylelint-disable-next-line property-disallowed-list -- center は方向を持たない。RTL でも同じ */
    text-align: center;
  }
```

`library/elements/src/splitter/splitter.styles.ts` L30–36（面は shadow に在る）:

```ts
    /* 溢れたら面ごと転がす。min-*-size: 0 が無いと grid の軌道が内容に押し広げられる */
    [part='start'],
    [part='end'] {
      min-inline-size: 0;
      min-block-size: 0;
      overflow: auto;
    }
```

`library/elements/src/splitter/splitter.element.ts` は **ちょうど 150 行**（guard 規則 8 の上限）。関係する箇所:

```ts
  #internals = this.attachInternals()
  #contractOk = false
  #drag = dragController({ … })              // L66–73

  override disconnectedCallback(): void {      // L84–87
    super.disconnectedCallback()
    this.#drag.dispose()
  }

  override firstUpdated(): void {              // L89–95
    const result = checkContract(this, contract)
    this.#contractOk = result.kind === 'ok'
    reportMissing(result, this.label)
    wireHandle(this.shadowRoot, this.#drag)
    this.requestUpdate()
  }
  …
  #setPosition = (next: number, byUser: boolean): void => {   // L131–139
    …
    if (changed && byUser) {
      const detail = { position: clamped }
      this.dispatchEvent(new CustomEvent('rd-resize', { bubbles: true, composed: true, detail }))
    }
  }
```

`library/elements/src/splitter/splitter.dom.ts` L137–143（143 行。行数制限は無い）:

```ts
/** shadow のつまみを掴んでドラッグを配線する（見つからなければ何もしない） */
export const wireHandle = (root: ShadowRoot | null, drag: DragController): void => {
  const handle = root?.querySelector('[part=handle]')
  if (handle instanceof HTMLElement) {
    drag.wire(handle)
  }
}
```

`library/elements/src/menu/menu.stories.ts` L60–76:

```ts
/** `placement` は `start`（既定）と `end` の 2 通り。インライン方向の揃えだけが変わる */
export const Variants: Story = {
  render: (args) =>
    html`<div class="rd-stack" style="min-block-size: 18rem">
      ${unsafeHTML(menuMarkup({ ...args, id: 'sb-menu-start', label: '始端に揃える' }))}
      ${unsafeHTML(
        menuMarkup({ ...args, id: 'sb-menu-end', label: '終端に揃える', placement: 'end' }),
      )}
    </div>`,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('rd-menu')).toHaveLength(2)
  },
}

/** トリガーの終端に揃える。画面の端で溢れそうなときに使う */
export const Placement: Story = { args: { placement: 'end' }, play: openMenu }
```

`system/css/src/atoms.css` L329–335:

```css
  .rd-table :where(th) {
    padding: var(--rd-space-2) var(--rd-space-3);
    border-block-end: 0.125rem dotted var(--rd-color-border-default);
    font-weight: var(--rd-font-weight-bold);
    /* stylelint-disable-next-line property-disallowed-list -- start は論理値。RTL で自動的に反転する */
    text-align: start;
  }
```

## リポジトリの決まり（守る）

- `any` / `as` / 非 null `!` / `enum` を書かない。`class` は `*.element.ts` の Lit 要素クラスだけ。oxlint `riml-ds/*` が落とす
- CSS の値はトークン `var(--rd-*)` だけ（stylelint `declaration-strict-value`）。キーワード値（`none` / `nowrap`）は対象外。要素 CSS は `selector-max-specificity: 0,3,0`
- **失敗するテストを先に書く**（red → green）。要素のテストは `library/elements/src/<name>/<name>.test.ts`（vitest browser。`cd library/elements && bunx vitest run --root ../.. --project browser <name>`）、CSS のテストは `system/css/test/*.test.ts`（`--project node`）
- `splitter.element.ts` は **150 行 / `if` 5 個以内**（guard 規則 8）。溢れる分は `splitter.dom.ts` に出す
- `bun run gen` は決定的。contract を変えないので `tools/cem/registry.json` は変わらない。**`custom-elements.json` は §2 の `#dispose` フィールド 1 個分（+8 行）だけ変わる**——CEM は private フィールドも載せる。それをコミットしてから `git status` が空になること
- `.changeset/*.md` は手書きで置く（対話 CLI は使わない）。fixed group なので全パッケージが一緒に上がる
- 触ってよいパス（`scripts/lanes.tsv` の `chore/follow-ups-035`）: `library/elements/src/command/command.css`, `library/elements/src/command/command.test.ts`（Step 1 の red テスト）, `library/elements/custom-elements.json`（§2 の `#dispose` フィールドで CEM が変わる。guard 規則 15 のとおり**同じブランチで再生成してコミットする**）, `library/elements/src/splitter`, `library/elements/src/menu/menu.stories.ts`, `system/css/src/atoms.css`, `system/css/test`, `e2e/__screenshots__`, `docs/proposals/splitter.md`, `.changeset`。
  **触らない**: `library/elements/src/_shared/**`, `system/css/src/base.css`, `toggle-group/**`, `carousel/**`, `calendar/**`, `docs/**`（`docs/proposals/splitter.md` を除く）, `plans/README.md`, `README.md`, `.claude/**`, `skills/**`, `scripts/**`, `.github/**`, lint 設定, `scripts/lanes.tsv`

## 設計（決定事項。変えたくなったら STOP）

### 1. command の空表示

`rd-command > [part='empty']` に `max-inline-size: none;` を 1 行足す（`margin: 0` の次）。コメント: `/* base.css の p は 80ch で止まる。中央揃えの文言を枡の幅いっぱいに置く */`。

### 2. splitter — 溢れた面だけ focusable

- `splitter.dom.ts` に **`overflowWatcher`** を足す:

  ```ts
  /** 面の内容が溢れているか（縦横どちらでも） */
  export const isOverflowing = (pane: HTMLElement): boolean =>
    pane.scrollHeight > pane.clientHeight || pane.scrollWidth > pane.clientWidth

  /**
   * 溢れた面だけ Tab で届くようにする（axe `scrollable-region-focusable`）。
   * 溢れていない面に tabindex を残すと、Tab の止まる所が増えるだけなので外す。
   * ResizeObserver は面（部品の割合が変わる・窓が変わる）と slot の中身（slotchange）の両方で回す。
   */
  export const overflowWatcher = (root: ShadowRoot | null): { readonly dispose: () => void } => { … }
  ```

  中身: `root.querySelectorAll('[part=start], [part=end]')` の各 `HTMLElement` について、`sync = () => { if (isOverflowing(pane)) pane.setAttribute('tabindex', '0'); else pane.removeAttribute('tabindex') }` を **ResizeObserver（面を observe）** と、面の中の `<slot>` の **`slotchange`** で呼ぶ。`dispose` は `observer.disconnect()` と `slotchange` の解除。`ResizeObserver` が無い環境（`typeof ResizeObserver === 'undefined'`）では一度 `sync()` して終わる（vitest browser の Chromium には在る）。
- `wireHandle(root, drag)` を **`wireShadow(root, drag): () => void`** に改名・拡張する: いまの handle 配線に加えて `overflowWatcher(root)` を起こし、**`() => { drag.dispose(); watcher.dispose() }`** を返す。
- `splitter.element.ts`:
  - `#dispose: () => void = () => {}` をフィールドに足す（1 行）
  - `firstUpdated` の `wireHandle(this.shadowRoot, this.#drag)` → `this.#dispose = wireShadow(this.shadowRoot, this.#drag)`
  - `disconnectedCallback` の `this.#drag.dispose()` → `this.#dispose()`
  - これで **151 行**になるので 1 行削る: `#setPosition` の `const detail = { position: clamped }` を消し、`dispatchEvent(new CustomEvent('rd-resize', { bubbles: true, composed: true, detail: { position: clamped } }))` と 1 行に（printWidth 100 に収まる。oxfmt が折るなら `#onKeydown` の `const bounds` を呼び出しにインラインする）。**150 行 / `if` 5 以内**を確認する
- `splitter.styles.ts` の面の規則に `:focus-visible` を足す（見える焦点環。`[part='handle']:focus-visible` と同じ宣言を写す）:

  ```css
    :is([part='start'], [part='end']):focus-visible {
      outline: var(--rd-focus-ring-width) solid var(--rd-focus-ring-color);
      outline-offset: calc(-1 * var(--rd-focus-ring-offset));
    }
  ```

  （`overflow: auto` の箱の外側に出した outline は親に切られることがあるので **内側**に描く）
- **`[part='start']` / `[part='end']` に `role` は付けない**（`role="region"` は名前が必須になり、名前を発明することになる）。`tabindex` だけ。
- story `Overflow` を `splitter.stories.ts` に足す（`Nested` の次）: `framed(…, 4)` の低い箱に、`start` に長い `<p>` を 6 つ、`end` に短い 1 つ。`play` で `start` の面（`el.shadowRoot?.querySelector('[part=start]')`）が `tabindex="0"` を持ち、`end` が持たないことを `waitFor` で確認する。VRT はこの story を 4 プロジェクト分**新規**に撮る（既存画像の変更は 0）。

### 3. menu の story

- `Variants` を「**`end` のメニューを開いた状態**で 2 つ並べる」に直す: `render` はそのまま、`play` を

  ```ts
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('rd-menu')).toHaveLength(2)
    const trigger = within(canvasElement).getByRole('button', { name: '終端に揃える' })
    await userEvent.click(trigger)
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
  },
  ```

  （`openMenu` は `'操作'` の名前で取っているので流用できない。既存の `openMenu` の中身を読んで同じ待ち方にする）
- `Placement` story と、その VRT 画像 **4 枚**（`e2e/__screenshots__/*/components-menu--placement.png`）を削る。`Variants` の 4 枚は撮り直す（`--grep components-menu--variants --update-snapshots`）。**これ以外の既存画像は変えない。**

### 4. `.rd-table` の見出し

`.rd-table :where(th)` に `white-space: nowrap;` を足す（`font-weight` の次）。コメント: `/* 見出しは折り返さない。短い見出しが 2 行になると行の高さが揃わない。td は折り返してよい */`。`system/css/test/atoms.test.ts` に `it('表の見出しは折り返さない（td は折り返す）', …)` を足す — `declsOf(/\.rd-table :where\(th\)/)` に `white-space:nowrap` が**あり**、`declsOf(/\.rd-table :where\(td\)/)` には**無い**こと。`.rd-table` の story（`apps/storybook/stories/**` に在れば）の VRT が変わらないことを確認する。変わる（見出しが折り返していた）なら、その画像だけ撮り直して報告に書く。

### 5. `docs/proposals/splitter.md`

「実装のメモ」に 1 項足す:

> - **面の中に `rd-splitter` を直接入れると、内側の `block-size: 100%` は解けない**（面は grid の軌道で、高さが内容から決まる）。内側は内容の高さになり、sub-pixel の丸めで `scrollHeight > clientHeight` になって axe `scrollable-region-focusable` に落ちることがある。**内側の splitter は高さを持つ箱（`<div style="block-size: …">`）で包む**（`splitter.stories.ts` の `Nested` が見本）。035 で面が溢れたときだけ `tabindex="0"` になるようにしたので axe には落ちないが、内側の高さが 0 になる問題そのものは変わらない

## Step 1 — command（`fix(command): let the empty message span the palette width`）

red: `command.test.ts` に `it('[part=empty] は base.css の 80ch に止められない', …)` — `loadStyle` で `base.css`（`/system/css/src/base.css`）と `command.css` を読み、0 件にしてから `getComputedStyle(empty(el)).maxInlineSize` が `'none'`。green: §1。`cd library/elements && bunx vitest run --root ../.. --project browser command`。

## Step 2 — splitter（`feat(splitter): make overflowing panes focusable and add a focus ring`）

red: `splitter.test.ts` に 3 本 — (a) `start` に長い内容を入れて `sized()`（200px）→ `[part=start]` が `tabindex="0"`、`[part=end]`（短い）は `tabindex` 無し（`waitFor` で待つ。ResizeObserver は非同期）; (b) `position` を動かして `end` が溢れたら `end` にも付く; (c) `disconnectedCallback` 後に内容を変えても属性が変わらない（dispose）。green: §2。`wc -l splitter.element.ts` ≤ 150、`grep -c '\bif\b'` ≤ 5。story `Overflow`（`cd apps/storybook && bunx vitest run --root ../.. --project storybook splitter`）。

## Step 3 — menu story（`test(stories): open the end-aligned menu in Variants and drop the duplicate Placement story`）

§3。`git rm e2e/__screenshots__/*/components-menu--placement.png`。VRT は Step 5 でまとめて。

## Step 4 — table（`fix(css): keep table headings on one line`）

red: `atoms.test.ts`。green: §4。`cd system/css && bunx vitest run --root ../.. --project node atoms`。

## Step 5 — 仕上げ（`docs(proposals): record the nested splitter sizing pitfall and add a changeset`）

§5、`.changeset/follow-ups-035.md`（`@rimltempest/riml-ds-elements` patch、`@rimltempest/riml-ds-css` patch）。`bun run storybook:build && bash scripts/vrt.sh`（background。10 分超）→ `Overflow` の新規 4 枚と `Variants` の撮り直し 4 枚以外に差分が無いこと。`bash scripts/vrt.sh --grep components-menu--variants --update-snapshots` で撮り直す。

## 完了条件（機械で検査できるもの）

- `bun run check` = 0、`bun run test` = 0、`bash scripts/guard.sh` = 0
- `wc -l library/elements/src/splitter/splitter.element.ts` ≤ 150、`grep -c '\bif\b' library/elements/src/splitter/splitter.element.ts` ≤ 5
- `grep -c 'wireHandle' library/elements/src/splitter/*.ts` = 0、`grep -c 'overflowWatcher' library/elements/src/splitter/splitter.dom.ts` ≥ 1
- `grep -c 'max-inline-size: none' library/elements/src/command/command.css` = 1
- `grep -c 'white-space: nowrap' system/css/src/atoms.css` ≥ 1（`.rd-table :where(th)` の中）
- `grep -c 'export const Placement' library/elements/src/menu/menu.stories.ts` = 0、`command ls e2e/__screenshots__/*/components-menu--placement.png 2>/dev/null | wc -l` = 0
- `command ls e2e/__screenshots__/*/components-splitter--overflow.png | wc -l` = 4
- `git diff --name-only main...HEAD -- e2e/__screenshots__` が **`components-menu--variants.png` × 4、`components-menu--placement.png` × 4（削除）、`components-splitter--overflow.png` × 4** だけ（`.rd-table` の story が変わったなら報告に書く）
- `bun run build && bun run gen` の後に `git status --porcelain` が空（CEM の `#dispose` 分はコミット済み、`registry.json` は無変更）。`git diff main...HEAD -- library/elements/custom-elements.json | grep -c '^+.*"name"'` = 1（増えたエントリは `#dispose` だけ）
- `bun run pe` = 0、`bun run e2e:frameworks` = 0、`bash scripts/vrt.sh` = 0、`bun run a11y` = 0、`bun run release:check` = 0

## STOP する条件（改善せず報告する）

- `splitter.element.ts` が 150 行 / `if` 5 に収まらない（§2 の 1 行削りで足りない）
- `bun run gen` で `registry.json` が変わる、または `custom-elements.json` の差分が `RdSplitter` の `#dispose` エントリ以外を含む（contract を変えていないのに変わる＝別の原因）
- ResizeObserver の `sync` が vitest browser で発火せず (a) が緑にできない（`await new Promise(requestAnimationFrame)` を 2 回挟んでも）
- 上に挙げた 12 枚以外の VRT 画像が変わる（`.rd-table` の story を除く）
- `_shared/**` / `base.css` を変えないと解けない

## スコープ外

- `neutral.300` の明度・VRT の閾値（別計画）、splitter の面に `role` / 名前を付けること、`rd-command` の他の見た目、`.rd-table` の他の宣言、030 の生成器の数値 props 型

## 保守メモ

- splitter の面の `tabindex` は **部品が付け外しする**。利用側が `part` に `tabindex` を書いても上書きされる（shadow なので書けないはず）
- `wireShadow` が返す dispose は drag と overflow の両方を止める。`disconnectedCallback` 以外から呼ばない
- `.rd-table :where(th)` の `nowrap` は狭い画面で表が横に溢れる原因になる。`.rd-table-scroll` で包むのが前提（`system/css/README.md` の表の項に既に書いてある）
