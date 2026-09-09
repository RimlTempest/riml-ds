# 037: `rd-file-drop` — ファイル選択（`<label for>` + `<input type="file">` を包むティア A。ドラッグ＆ドロップと選んだファイルの一覧）

**優先度**: P1　**規模**: M　**依存**: 004（`rd-text-field`）、009（`_shared/field.ts` のヒント・エラー文言）、036（`rd-number-field`。`<input>` を包むティア A の直近の手本）
**レーン**: `feat/file-drop`　**計画時の main**: `4c4910f`（034・036 マージ後。**038（`feat/tree`）と並行** — `system/**` / `_shared/**` / `text-field/**` / `number-field/**` には触らない）

> **Drift check（最初に実行）**:
> `test -d library/elements/src/file-drop && echo EXISTS` が何も出ないこと（出たら STOP。自分の `scaffold:element` の出力なら続行）。
> `grep -c 'export const computeView' library/elements/src/_shared/field.ts` = 1、`grep -c 'export const readAttrs' library/elements/src/_shared/native-control.ts` = 1、
> `grep -c 'export const bindListeners' library/elements/src/_shared/native-control.ts` = 1、`grep -c 'export { usesJapaneseCopy }' library/elements/src/_shared/field.ts` = 1。
> `wc -l library/elements/src/number-field/number-field.element.ts` が **133**、`library/elements/src/number-field/number-field.dom.ts` が **162**（この部品も最初から `file-drop.dom.ts` に出す）。
> `grep -c 'rd-list-row' system/css/src/atoms.css` ≥ 1（選んだファイルの一覧に使う atom がある）。
> 「現状のコード」の抜粋を現物と見比べる。違っていたら STOP。

## なぜ

qrcc は「読み取りたい画像を選ぶ」、noter は「文書を取り込む」——どちらもファイルを 1〜数個受け取る。
いまは `<input type="file">` を素で置くしかなく、

1. ネイティブの入力欄は**触れる面が小さく**（ブラウザ既定のボタンは 44px に届かない）、見た目もページの中で浮く
2. **ドラッグ＆ドロップで置ける面**が無い（`dragover` / `drop` を利用側が毎回書くことになる）
3. 選んだファイルが「3 files」のような UA の文字列でしか出ず、**何を選んだのか**が読み上げからも分かりにくい

shadcn には File Upload に当たる部品が無い（Input の `type="file"` で済ませている）。これは shadcn の外の追加で、**アップロードはしない**——
`rd-file-drop` は「選ぶ」までを担い、送信は `<form>`（ネイティブ）か利用側の JS が行う。

JS が無ければ**ネイティブの `<input type="file">` がそのまま働く**（ティア A）。JS が来たら
「置ける面」「選んだファイルの一覧」「取り消し（1 件ずつ外す）」が足される。

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/number-field/**`**（`<label for>` + `<input>` のティア A。`dom.ts` に `attach` / `viewOf` / テンプレートを置き `element.ts` を 150 行に収める形）と
  **`library/elements/src/text-field/**`**（hint / error の `<p part>`、`:user-invalid`、`_shared/field.ts` の使い方）
- `any` / `as` / `!` / `enum` を書かない（`as const satisfies Contract` だけ許される）。`class` は `*.element.ts` の `extends LitElement` だけ（ADR-0005）
- **`*.logic.ts` で `throw` しない**。**失敗するテストを先に書く**（red → green）
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**。`custom-elements.json` / `tools/cem/registry.json` / 生成ラッパーは**同じコミット**に含める（guard 規則 15）
- `bun run scaffold:element file-drop --pe A` で骨格を作る（**`file-drop.styles.ts` は作らない**。ティア A）
- `library/elements/package.json` の `exports` に `./experimental/file-drop{,/contract,/define,/style.css}` の 4 ブロックを**アルファベット順の位置**に（`dialog` < `file-drop` < `input-otp`。実際の並びを見て入れる）
- **`bun run check` に `lint:html` は入っていない。** マージ前に必ず `bun run render && bun run lint:html` を回す（CI はこれで落ちる）。
  直近で落ちた例: story の見出しが飛び級（`<h3>` を `<h2>` に）、暗黙の役割を書いた（`<td role="gridcell">`）
- **色**: accent の面に載る文字は `--rd-color-text-on-accent`（`--rd-color-accent-text` は**リンクの色**で `accent-default` と同値。面の上では消える）
- 触ってよいパス（`scripts/lanes.tsv` の `feat/file-drop`）: `library/elements/src/file-drop/**`（新規）、`library/elements/src/experimental/file-drop/**`（新規）、
  `library/elements/package.json`（exports のみ）、`library/elements/custom-elements.json`、`library/{react,vue,svelte,astro}/src/generated/**`、`library/astro/package.json`（生成分）、
  `tools/cem/registry.json`、`tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`library/react/test/**`、`e2e/**`（`e2e/__screenshots__` は**新しい**画像だけ）、`.size-limit.json`、`docs/proposals/file-drop.md`（新設）、`.changeset/`
  **触らない**: `library/elements/src/_shared/**`、`library/elements/src/text-field/**`、`library/elements/src/number-field/**`、`library/elements/src/calendar/**`、`system/**`、`tools/cem/src/**`、`apps/storybook/**`、`docs/*.md`、`DESIGN.md`、`plans/README.md`、`skills/**`、`.claude/**`、`scripts/**`、`.github/**`
- **並行レーン 038** も `e2e/pe/build-pages.ts` / `tier-a.spec.ts` / `axe.spec.ts` / `e2e/a11y/keyboard.spec.ts` / `e2e/frameworks/**` / `e2e/*/src/**` / `.size-limit.json` / `library/elements/package.json` / `tools/mcp/src/examples.ts` に**追記する**。
  自分の追記は各ファイルの**最後の既存エントリの直後**（`build-pages.ts` は `echo.html` の前）。`git merge main` は任意。ソース／e2e がコンフリクトしたら STOP（reviewer が union で解く）

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/number-field/number-field.contract.ts`（ティア A の契約の形。**これを写す**）:

```ts
export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input[type="number"]',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-number-field',
    attrs: { hint: '$hint', error: '$error' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: { id: '$id', name: '$name', type: 'number', value: '$defaultValue', … },
      },
    ],
  },
} as const satisfies Contract
```

`library/elements/src/_shared/field.ts`（そのまま使う。**触らない**）:

```ts
export type ViewInput = StateInput & MessageInput & { readonly controlId: string }
export const computeView = (input: ViewInput): FieldView => { … }
export { usesJapaneseCopy } from './lang.js'
```

`library/elements/src/_shared/native-control.ts`:

```ts
export const bindListeners = (target: EventTarget | null | undefined, listeners: Listeners): Binding
export const readAttrs = (control: Element | undefined, names: readonly string[]): Record<string, string | undefined>
```

`system/css/src/atoms.css`（選んだファイルの一覧に使う。**利用側の見た目に寄せず、部品側で `.rd-list-row` の宣言を写さない**——
`[part='item']` に独自の宣言を書く。atom は利用側が使うもの）:

```css
  .rd-list-row { … }
  .rd-list-row:is([aria-selected='true'], [aria-current]) { … }
```

## 設計（決めてある。変えるなら STOP）

### 1. 契約（`file-drop.contract.ts`）

```ts
export const contract = {
  pe: 'A',
  roles: {
    label: ':scope > label',
    control: ':scope > input[type="file"]',
  },
  required: ['label', 'control'],
  tree: {
    tag: 'rd-file-drop',
    attrs: { hint: '$hint', error: '$error' },
    children: [
      { tag: 'label', attrs: { for: '$id' }, children: [{ prop: 'label' }] },
      {
        tag: 'input',
        attrs: {
          id: '$id',
          name: '$name',
          type: 'file',
          accept: '$accept',
          multiple: '$multiple',
          required: '$required',
          capture: '$capture',
        },
      },
    ],
  },
} as const satisfies Contract
```

- `FileDropMarkupProps` = `{ id, label, name?, accept?, multiple?, required?, capture?, hint?, error? }`
- **`value` は契約に無い**（`<input type="file">` の `value` はスクリプトから設定できない。空文字だけ）
- `capture` は `'user' | 'environment'`（モバイルのカメラ直起動。`accept` と併せて qrcc が使う）

### 2. 純関数（`file-drop.logic.ts`）

- `type PickedFile = { readonly name: string; readonly size: number; readonly type: string }`（**`File` を持たない**。純関数に DOM の型を持ち込まない）
- `formatSize(bytes: number, japanese: boolean): string` — `0` → `'0 B'`、1024 未満は `B`、以降 `KB` / `MB` / `GB`。
  小数 1 桁で、末尾の `.0` は落とす（`1536` → `'1.5 KB'`、`1048576` → `'1 MB'`）。負数・NaN は `'0 B'`（**throw しない**）
- `matchesAccept(file: PickedFile, accept: string): boolean` — `accept` が空なら true。`,` 区切りで、
  `image/*` のワイルドカード、`image/png` の完全一致、`.png` の拡張子（大文字小文字を無視）に対応。どれかに当たれば true
- `filterFiles(files: readonly PickedFile[], accept: string, multiple: boolean): { readonly kept: readonly PickedFile[]; readonly rejected: readonly PickedFile[] }`
  — `accept` に合わないものを `rejected` に。`multiple` が false なら `kept` は**最後の 1 つだけ**（ネイティブの drop と同じ）
- `dropMessage(input: { count: number; rejected: number; japanese: boolean }): string` — `rd-live-region` ではなく `[part='status']` に出す文言。
  例: `'3 個のファイルを選んだ'` / `'1 個は形式が合わないので外した'`。英語も同じ構造（`'3 files selected'` / `'1 file was rejected'`）
- `computeFileDropView(input)` — `_shared/field.ts` の `computeView` に、`files: readonly PickedFile[]`・`dragging: boolean`・
  文言（`browseLabel` / `dropHint` / `removeLabel(name)`）・`states` への `dragging` / `filled` の追加を重ねたもの
- **`throw` しない**。`accept` の書式が壊れていても「当たらない」を返すだけ

### 3. element（`file-drop.element.ts`、≤ 150 行、`if` ≤ 5）と `file-drop.dom.ts`

`element.ts` に置くのは: `hint` / `error` プロパティ、`#internals`、`#attached`、`#dragging`、`#files`、
`createRenderRoot`（`return this`）、`connected` / `disconnected` / `willUpdate` / `updated` / `render`、
公開 API（`files` getter / `clear()`）。**判断と DOM 操作は `file-drop.dom.ts`**。

`file-drop.dom.ts` に置くもの:

- `attach(host, listeners, onRedraw)` — `checkContract` → `<input type="file">` を掴む。`change` を聞き、`<form>` の `reset` も聞く（`number-field.dom.ts` と同じ形）
- `readPicked(control): readonly PickedFile[]` — `control.files` を `PickedFile[]` に写す（`FileList` はここでだけ触る）
- **`applyFiles(control, files: readonly File[]): void`** — `DataTransfer` を作って `control.files` に代入する（**ドロップされたファイルを `<input>` に載せる唯一の道**。
  `DataTransfer` はどのエンジンにもある）。代入のあと `input` → `change` を `bubbles: true, composed: true` で投げる。独自イベントは出さない
- `onDropFiles(control, event, accept, multiple)` — `event.dataTransfer?.files` から `File[]` を作り、`filterFiles` に掛け、`kept` を `applyFiles` に渡す
- `dropZoneTemplate(view, handlers)` — 「置ける面」。**`<button type="button" part="browse">` を 1 つだけ**置き、押すと `control.click()`（`<label for>` があるのでキーボードだけでも `<input>` に届く。ボタンは**ポインタのための近道**）
- `fileListTemplate(view, onRemove)` — `<ul part="list">` に `<li part="item">`（名前・`formatSize`・`<button part="remove" aria-label=…>`）
- `statusTemplate(view)` — `<p part="status">`（`dropMessage`）。**`aria-live` は書かない**（ADR-0008 §6。読み上げは `<input>` の `change` でネイティブが行い、
  文言は目で見るためのもの）

**ドラッグ＆ドロップ**:

- ホストに `dragenter` / `dragover` / `dragleave` / `drop` を配る（`bindListeners`）。`dragover` は `preventDefault()` が要る（既定は「受け取らない」）
- `#dragging` は `dragenter` / `dragover` で true、`drop` と `dragleave`（**`relatedTarget` がホストの外のときだけ**）で false。`:state(dragging)`
- `drop` で `event.preventDefault()` → `onDropFiles(...)`。**アップロードはしない**（送信は `<form>` か利用側）
- `dragover` の間だけ `dropEffect = 'copy'`（カーソルが「＋」になる）

**キーボードと焦点**:
- 「置ける面」自体は focusable にしない（`<input>` と `<label>` があるので Tab で届く）。`[part='browse']` と `[part='remove']` は普通の `<button>`（Tab 順に入る）
- `remove` を押したら、`applyFiles` で**その 1 個を除いた配列**を載せ直す（`DataTransfer` を作り直す）。押した後の焦点は
  「次の `remove` があればそこ、無ければ `[part='browse']`」（`_shared` は使わず `dom.ts` の 5 行）

### 4. CSS（`file-drop.css`）

- ホストは `display: grid` / `gap: var(--rd-file-drop-gap, var(--rd-space-2))`。`<label>` は太字（`text-field.css` と同じ宣言）
- **ネイティブの `<input type="file">` は隠さない**（JS 無しの唯一の入力手段。ティア A）。`:defined` のときだけ `[part='zone']` の中に見えるよう並べ替える
  （`order` ではなく grid の行指定。`display: none` にしない——キーボードで届かなくなる）
- `[part='zone']`: 破線の枠（`border-style: dashed`）、`border-radius: var(--rd-radius-lg)`、`background: var(--rd-color-surface-sunken)`、
  `padding: var(--rd-space-6)`、中身は `place-items: center` の grid。`:state(dragging)` で `border-color: var(--rd-color-accent-default)` と
  `background: var(--rd-color-surface-hover)`
- `[part='browse']`: `.rd-button`（secondary）と同じ寸法。`min-block-size: var(--rd-sizing-target-min)`
- `[part='list']` は `list-style: none` / `padding: 0`、`[part='item']` は 44px 以上の行に名前・大きさ・`[part='remove']`（44px の丸ボタン）
- `@media (prefers-reduced-motion: no-preference)` のときだけ枠色に `transition`
- `@media (forced-colors: active)`: 枠は `CanvasText`、`:state(dragging)` は `Highlight`
- **`box-shadow: inset` を書かない**（stylelint）。詳細度は `:where()` で `0,3,0` に収める

### 5. イベント・状態・JSDoc

- **独自イベントは出さない**。値の真実は `<input>` で、購読は `<input>` の `change`（`rd-number-field` と同じ判断）
- `:state()`: `dragging` / `filled`（1 個以上選ばれている）/ `invalid` / `errored` / `hinted` / `malformed`
- `@csspart zone` / `browse` / `list` / `item` / `remove` / `status` / `hint` / `error`、`@cssprop --rd-file-drop-gap`
- 公開 API: `get files(): readonly File[]`（`<input>` の `FileList` を配列にして返す）、`clear(): void`（`applyFiles(control, [])`）

### 6. 検証面

- `file-drop.logic.test.ts`: `formatSize`（0 / 999 / 1024 / 1536 / 1048576 / 負数 / NaN）、`matchesAccept`（`image/*` / `image/png` / `.PNG` / 空 / 複数）、
  `filterFiles`（`multiple` false で最後の 1 つ / 全部弾かれる / 全部通る）、`dropMessage`（日本語・英語・0 件・弾いた件数あり）
- `file-drop.test.ts`（vitest browser）:
  1. 契約どおりなら `malformed` にならない。`<input type="file">` が無ければ `console.error` して `malformed`、強化ノードを描かない
  2. ティア A なので `shadowRoot` が `null`
  3. `DataTransfer` で作った 2 個のファイルを `drop` すると `<input>` の `files.length` が 2 になり、`[part='item']` が 2 行出て、`change` が 1 回上がる
  4. `accept="image/png"` のとき `text/plain` のファイルは弾かれ、`[part='status']` に「外した」が出る
  5. `multiple` が無ければ 2 個ドロップしても 1 個だけ載る
  6. `remove` を押すと 1 行減り、`change` がもう一度上がる。焦点は次の `remove`（最後の 1 個なら `[part='browse']`）へ移る
  7. `dragenter` → `:state(dragging)`、`drop` で外れる。`dragleave`（`relatedTarget` が中の要素）では外れない
  8. `clear()` で 0 件・`filled` が外れる
  9. 44px: `[part='browse']` と `[part='remove']` の `min-block-size` が `44px`
- `file-drop.sr.test.ts`: `<label>` の名前が `<input type="file">` に付く／`[part='remove']` の `aria-label` が「〜を外す」（ファイル名込み）
- **stories 12 種**: `Default` / `WithHint` / `Multiple`（`play` で `DataTransfer` から 2 個載せる）/ `Rejected`（`accept="image/png"` に `.txt` を落とす）/
  `Dragging`（`play` で `dragenter` を投げて `:state(dragging)` の姿）/ `Invalid`（`error` 属性）/ `Disabled`（`<input disabled>`）/
  `Dark` / `Dense` / `RTL` / `ForcedColors` / `ReducedMotion`。**カード見出しを使うなら `<h2>`**（見出しの飛び級で markuplint が落ちる）
- e2e:
  - `e2e/pe/build-pages.ts` に `file-drop.html`（`echo.html` の前）。`tier-a.spec.ts` に 2 テスト（JS 無しで `<input type="file">` が見えて `<label>` が名前を付ける／`[part='zone']` が 0 個）。`axe.spec.ts` に `'/file-drop.html'`
  - `e2e/a11y/keyboard.spec.ts` に 2 テスト（`components-filedrop--multiple` で Tab が `<input>` → `browse` → `remove` の順／`remove` を Enter で押すと行が減り焦点が移る）
  - `e2e/frameworks/shared.ts` に `fileDropSuite`（4 FW）。JS 無しの `compareMarkup`、`setInputFiles` でファイルを選ぶと一覧に出る、`accept` に合わないものが弾かれる
    （Playwright の `setInputFiles` を使う。**`drop` の合成は Playwright では面倒なので e2e ではやらない**——drop の検証は vitest browser が持つ）
- `.size-limit.json` に `file-drop/define` を **12 KB** で追加
- `tools/mcp/src/examples.ts` に `rd-file-drop` の例、`tools/mcp/test/core/elements.test.ts` のタグ一覧に 1 行（アルファベット順）
- `library/react/test/markup.test.tsx` に `RdFileDrop` の `renderToString` 比較（**名前付き import**。`experimental` のキー一覧にも 1 行）

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備
`bun install --frozen-lockfile && git checkout bun.lock && bun run build && bun run gen && bun run test` が緑。Drift check を実行。

### Step 1 — 契約と純関数（`feat(elements): add the rd-file-drop contract and file filtering logic`）
§1・§2。テストを先に赤くする。`bun run build && bun run gen`（生成物を同じコミットに）。

### Step 2 — element と CSS（`feat(elements): add rd-file-drop (experimental, tier A)`）
§3・§4・§5 と `file-drop.test.ts` / `sr.test.ts` / stories。

### Step 3 — 検証面（`test(e2e): cover rd-file-drop with and without JS and in the four frameworks`）
§6 の e2e / examples / react test。`bun run pe` → `bun run e2e:frameworks` → `bun run a11y`。

### Step 4 — VRT（`test(vrt): baselines for file-drop`）
`bun run storybook:build && bash scripts/vrt.sh`（background で。10 分以上かかる）。新規は 12 story × 4 project + forced-colors + reduced-motion。
**既存の画像が変わったら STOP**。

### Step 5 — 仕上げ（`docs(proposals): record the rd-file-drop decision and add a changeset`）
`docs/proposals/file-drop.md`（なぜアップロードを担当しないか／なぜ `<input type="file">` を隠さないか／なぜ `DataTransfer` で `control.files` に書くのか／
なぜ独自イベントを出さないか／なぜ「置ける面」を focusable にしないか／`accept` の照合を自前で持つ理由（ドロップはネイティブの検証を通らない））、
`.changeset/file-drop.md`（elements minor、ラッパー 4 つ patch）。

## 完了条件（機械で検査できるもの）

- `bun run check` = 0、`bun run test` = 0
- `wc -l …/file-drop.element.ts` ≤ 150、`grep -c '\bif\b' …/file-drop.element.ts` ≤ 5
- ティア A: `grep -c '@pe A'` = 1、`grep -cE 'static (override )?styles|shadowRootOptions|attachShadow'` = 0、`test ! -e …/file-drop.styles.ts`、`grep -c 'createRenderRoot'` = 1
- `grep -c 'CustomEvent' library/elements/src/file-drop/*.ts` = 0、`grep -c 'throw' …/file-drop.logic.ts` = 0
- `grep -c 'DataTransfer' …/file-drop.dom.ts` ≥ 1、`grep -c 'display: none' …/file-drop.css` = 0
- `grep -c 'aria-live' library/elements/src/file-drop/*.ts` = 0
- `bash scripts/guard.sh` = 0、`bun run pe` = 0、`bun run e2e:frameworks` = 0、`bash scripts/vrt.sh` = 0、`bun run a11y` = 0、`bun run release:check` = 0、
  **`bun run render && bun run lint:html` = 0**
- `git diff --name-only main...HEAD -- e2e/__screenshots__` に**既存**画像が 1 枚も無い
- `grep -c 'rd-file-drop' library/react/src/generated/jsx.ts` ≥ 1、`grep -c 'RdFileDrop' library/react/src/generated/experimental.ts` ≥ 1
- `.size-limit.json` の `file-drop/define` が 12 KB で通る

## STOP する条件（改善せず報告する）

- `bash scripts/guard.sh` が落ちる（規則 8・9）。guard を緩めない
- 既存 VRT 画像が変わる。size-limit 超過。`element.ts` が 150 行 / `if` 5 に収まらない（`dom.ts` に出しても）
- `DataTransfer` で `control.files` に代入できないエンジンがある（vitest browser の Chromium で落ちるなら報告。**`Object.defineProperty` で誤魔化さない**）
- markuplint / axe が `<ul part="list">` の中の `<button part="remove">` や破線の面を落とす（規則を緩めない）
- `_shared/**` / `system/**` / `text-field/**` / `number-field/**` を変えないと実装できない
- `git merge main` で `e2e/**` / `.size-limit.json` / `package.json` / `examples.ts` がコンフリクトする

## スコープ外

- **アップロード**（`fetch` / 進捗バー / 再試行 / 分割）。送信は `<form>` かアプリの責務
- 画像のプレビュー・切り抜き・並べ替え、フォルダごとの受け取り（`webkitdirectory`）、貼り付け（`paste`）からの取り込み、
  最大サイズ・最大個数の検証（`hint` に書く。将来 `max-size` 属性を足すなら別の提案）

## 保守メモ

- 値の真実は `<input type="file">` の `files`。**部品は `File` を溜め込まない**（`DataTransfer` で載せ直すのが唯一の書き込み）
- `accept` の照合は**ドロップの経路だけ**に要る（ボタン経由の選択はネイティブが弾く）。両方を通すために `filterFiles` は純関数に置いてある
- 「置ける面」を focusable にしたくなったら、`<input>` と `<label>` で既に届いていることを思い出す（Tab の止まる所を増やさない）
- `capture` はモバイル専用の属性で、デスクトップでは無視される。VRT では見た目に出ない
