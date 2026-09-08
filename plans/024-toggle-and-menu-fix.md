# 024: `rd-toggle`（021 の STOP 分を入れ直す）、`rd-menu` の閉じたメニューが見えるバグ、frameworks e2e の穴埋め

**優先度**: P1　**規模**: M　**依存**: 023（マージ済み `887beb1`。ラッパー生成器が `aria-pressed` を Vue で引用し `'true' | 'false'` に絞ること）
**レーン**: `feat/form-wave5`　**計画時の main**: `b61ee24`（023 マージ後。**027（`feat/tokens-dark`）と並行** — `system/tokens/**` / `DESIGN.md` / `docs/*.md` には触らない）

> **Drift check（最初に実行）**:
> `test -d library/elements/src/toggle && echo EXISTS` が何も出ないこと。出たら STOP。
> `grep -c "'button.aria-pressed'" tools/cem/src/wrappers/core/common.ts` が **1**、`grep -c 'objectKey' tools/cem/src/wrappers/core/vue.ts` が **≥ 3** であること（023 が入っている）。
> `grep -n 'display: grid' library/elements/src/menu/menu.css` が **`rd-menu [popover] {` のブロックの中の 1 行**を指すこと（行 16 付近）。無ければ STOP（直っている）。
> `grep -c "formWave4Suite('astro')" e2e/frameworks/astro.spec.ts` が **0** であること。
> `library/elements/src/menu/menu.css` の先頭 30 行と `library/elements/src/button/button.element.ts` を読み、「現状のコード」の抜粋と見比べる。違っていたら STOP。

## なぜ

3 つの小さな借りを 1 レーンで返す。どれも 021 / 023 の実行で見つかったもの。

1. **`rd-toggle`（押下状態を持つボタン。shadcn の Toggle）** — 021 で書き上げてテストも緑だったが、契約の木の `aria-pressed: '$pressed'` を
   ラッパー生成器が扱えず STOP した。023 が生成器を直した（Vue のキーの引用・`button.aria-pressed` を `'true' | 'false'` に）ので入れ直す。
   **書き上げた一式は退避してある**（下の「退避したコード」）。ゼロから書かず、それを起点に red → green で入れる
2. **`rd-menu` の閉じたメニューが定義後も見える** — `menu.css` の `rd-menu [popover] { display: grid }` が UA の
   `[popover]:not(:popover-open) { display: none }` より強い（author の `@layer` は UA より勝つ）ため、`popovertarget` で閉じていても
   リストがその場に描かれる。023 の executor が e2e で見つけた（`rd-popover` は `display` を書いていないので無事）。
   Storybook の story は全部 `play` で開くので VRT が拾えなかった
3. **frameworks e2e の穴** — `formWave4Suite`（`rd-checkbox-group` / `rd-input-otp`）が astro を除外している理由（astro の `exports` が手書き）は
   023 で消えた。astro を載せ、`rd-toggle` も 4 フレームワークで回して「`aria-pressed` を prop に結んだ木」が実際に 4 つとも動くことを固定する

Toggle Group（shadcn）は**部品にしない**: 単一選択は `rd-radio-group segmented`、複数選択は `rd-checkbox-group segmented` が既にその形
（proposal に書く）。`.rd-button-group` の例（`patterns.css` のコメントと `e2e/pe` の `button-group.html`）は `rd-toggle` 2 個に差し替える —
「一覧 / 格子」の切替は押下状態を持つボタンの仕事で、`rd-button` の primary / secondary で見せ分けるのは意味論が無い。

守る不変条件:

- **AAA**（文字 7:1・非文字 3:1）。色は semantic トークンだけ
- **`outline: none` / `outline-width: 0` を書かない**。強制配色で押下を示すのは `outline: … solid Highlight`（背景色で示さない）
- **グラデーションを描かない**
- `rd-menu` の既存 API・開いた状態の見た目を変えない（**既存の VRT 画像が変わったら STOP**。閉じた状態の story を**足す**のはよい）
- `.size-limit.json` の予算内（`rd-toggle` は `checkbox-group` と同じ 12 KB から始める）
- `*.element.ts` ≤ 150 行、`if` ≤ 5

## リポジトリの決まり（守る）

- `.claude/skills/riml-ds-element/SKILL.md`、`.claude/skills/riml-ds-css/SKILL.md`、`.claude/skills/riml-ds-tdd/SKILL.md` を読む。
  手本は **`library/elements/src/button/**`**（`<button>` を包み `bindListeners` で click を聞く、ティア A）と
  **`library/elements/src/checkbox-group/**`**（021 で入った最新のティア A。story 8 種・sr テスト・proposal の形）
- `any` / `as` / `!` / `enum` を書かない（`as const satisfies Contract` だけは契約の決まり文句として許されている。既存の contract と同じ形にする）。
  `class` は `*.element.ts` の `extends LitElement` だけ。リアクティブな prop は `static properties` + `declare` + constructor 初期化
- **失敗するテストを先に書く**。退避したテストをそのまま置いて red を見てから実装を置く（順番を守る）
- `*.element.ts` / `*.contract.ts` を変えたら **`bun run build` → `bun run gen`**（クリーンな worktree では `gen` 単体だと契約が `dist` から読めず生成物が出ない）
- 新部品は `bun run scaffold:element toggle --pe A` で骨格を作ってから退避版で上書きする（scaffold が作るファイル一覧と退避版が一致することを確認する。違ったら STOP）
- `library/elements/package.json` の `exports` に `./experimental/toggle{,/contract,/define,/style.css}` の 4 ブロック。**末尾ではなく `./experimental/toast` の直後**
  （並びはアルファベット順ではない。近い名前の隣に置く）
- story は 8 種（`Default` / `Variants` / `Disabled` / `Invalid` / `Dark` / `ForcedColors` / `ReducedMotion` / `RTL` / `Dense`）+ `Pressed`
- CSS の単位: `px` は罫線・アウトラインだけ
- 触ってよいパス（`scripts/lanes.tsv` の `feat/form-wave5`）: `library/elements/src/toggle/**`（新規）、`library/elements/src/experimental/toggle/**`（新規）、
  `library/elements/package.json`（exports のみ）、`library/elements/custom-elements.json`、`library/elements/src/menu/menu.css`、`library/elements/src/menu/menu.stories.ts`、
  `library/elements/src/menu/menu.test.ts`、`system/css/src/patterns.css`（`.rd-button-group` のコメントの例だけ）、
  `library/{react,vue,svelte,astro}/src/generated/**`（再生成物のみ）、`library/astro/package.json`（**`bun run gen` が書く exports だけ**）、`tools/cem/registry.json`、
  `tools/mcp/src/examples.ts`、`tools/mcp/test/**`、`library/react/test/**`、`e2e/**`、`.size-limit.json`、`docs/proposals/toggle.md`（新設）、`.changeset/`
  **触らない**: `system/tokens/**`、`DESIGN.md`、`docs/*.md`（027 が触る）、`system/css/src/` の他ファイル、`library/elements/src/` の toggle / menu 以外、
  `library/elements/src/_shared/**`、`tools/cem/src/**`（生成器が落ちるなら STOP）、`apps/storybook/**`、`plans/README.md`、`skills/**`、`.claude/**`、`scripts/**`、`.github/**`
- コミットは段階ごと。Conventional Commits
- **並行レーン 027 が `system/tokens` / `DESIGN.md` / `docs/brand.md` / `docs/tokens.md` / `e2e/__screenshots__/vrt-dark-*` の既存画像を触る。**
  このレーンは `e2e/__screenshots__` に**新しい**画像（toggle・menu の closed story）を足すだけなので衝突しないはず。
  `git merge main` はしてよいが、コンフリクトが出たら**自分で解決せず STOP**

## 退避したコード（021 の成果。読んでから使う）

`/private/tmp/claude-501/-Users-riml-orca-projects-qrcc2/48797a3a-a85f-4cd9-9575-846928aee3d2/scratchpad/021/toggle-stopped/` に 12 ファイル:

```
index.ts  toggle.contract.ts  toggle.contract.test.ts  toggle.logic.ts  toggle.logic.test.ts
toggle.element.ts (115 行)  toggle.css (99 行)  toggle.define.ts  toggle.test.ts  toggle.sr.test.ts  toggle.stories.ts
GENERATED-react-toggle.tsx.txt  GENERATED-vue-toggle.ts.txt   ← 参考（生成物。コピーしない）
```

**このディレクトリは読むだけ**（書かない・消さない）。中身は 021 の設計（下に再掲）どおりで、当時 `bun run test` は緑だった。
`_shared` の API（`checkContract` / `bindListeners` / `syncAttribute` / `syncStates`）はその後変わっていないはずだが、
**置いた後に型が合わなければ 021 以降の `_shared` の変更に合わせて直す**（`_shared` 自体は触らない）。

契約（`toggle.contract.ts`。**変えない**）:

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

export type ToggleMarkupProps = {
  readonly label: string
  readonly pressed?: 'true' | 'false'   // 省略時は 'false' を書く（属性ごと消えると toggle でなくなる）
  readonly variant?: ToggleVariant       // 'outline' | 'ghost'（既定 'outline'）
}
export const markup = (props: ToggleMarkupProps): string =>
  renderMarkup(contract.tree, { ...props, pressed: props.pressed ?? 'false' })
```

element の要点（`toggle.element.ts`）: `aria-pressed` が唯一の真実。`pressed` getter/setter はネイティブに委譲。`click` で反転して
`rd-toggle` イベント（`detail: { pressed }`、bubbles + composed）。`MutationObserver`（`attributeFilter: ['aria-pressed']`）で外からの変更に `:state(pressed)` を追随。
states: `pressed` / `outline` / `ghost` / `malformed`。`disabled` はネイティブの `<button disabled>` に任せる。

CSS の要点（`toggle.css`）: ピル（`min-block-size: var(--rd-sizing-target-min)`、`padding-inline: var(--rd-space-4)`、`border-radius: var(--rd-radius-full)`）。
`outline` = 罫線 `--rd-color-border-strong` + 透明背景、`ghost` = 罫線無し。押下 = `--rd-color-accent-default` 塗り + `--rd-color-text-on-accent`。
hover = `--rd-color-surface-hover`（押下中は `--rd-color-accent-hover`）。forced-colors の押下 = `outline … solid Highlight`、`outline-offset: calc(-1 * var(--rd-space-1))`。

## 現状のコード（抜粋。読んでから触る）

`library/elements/src/menu/menu.css`（`@layer rd.components`。行 11〜27）:

```css
  /* 窓の面（brand.md §7.3）。top layer に出るので位置は fixed で、
     inset / margin を戻さないと UA の中央寄せが効いたままになる */
  rd-menu [popover] {
    position: fixed;
    box-sizing: border-box;
    inset: auto;
    z-index: var(--rd-layer-overlay);
    display: grid;               /* ← これが UA の [popover]:not(:popover-open) { display: none } に勝つ */
    min-inline-size: var(--rd-space-12);
    …
  }
  …
  /* 定義前（JS が無い / 遅い）: リストをその場に開いたまま見せる。 */
  rd-menu:not(:defined) [popover] {
    position: static;
    display: block;
  }
```

`library/elements/src/popover/popover.css` の `rd-popover [popover] { … }` は **`display` を書いていない**（開いたときの `display` は UA の `[popover]:popover-open { display: block }`）。

`library/elements/src/menu/menu.test.ts`（browser）: `open()` ヘルパが `:state(open)` を待つ。`listOf(el)?.matches(':popover-open')` を見るテストがある。
「閉じているとき `[popover]` が**描画されない**」を見るテストは無い。

`library/elements/src/menu/menu.stories.ts`: `Default` 以下すべて `play: openMenu`（開いた状態しか撮っていない）。

`system/css/src/patterns.css` の `.rd-button-group`（行 261〜264 のコメントの例）:

```css
  /* <div class="rd-button-group" role="group" aria-label="表示">
       <rd-button><button type="button">一覧</button></rd-button>
       <rd-button variant="secondary"><button type="button">格子</button></rd-button>
     </div> */
```

`e2e/pe/build-pages.ts` の `'button-group.html'`（`buttonMarkup` 2 個）:

```ts
  'button-group.html': page(
    'ボタンの枕',
    `      <div class="rd-button-group" role="group" aria-label="表示">
        ${buttonMarkup({ label: '一覧' })}
        ${buttonMarkup({ label: '格子', variant: 'secondary' })}
      </div>`,
  ),
```

`e2e/frameworks/shared.ts` の `formWave4Suite`（行 416〜）のコメント: 「`@rimltempest/riml-ds-astro` の `package.json` がこの 2 つの `.astro` をまだ export していないので、
astro 以外の 3 つで回す」— **023 で `exports` は生成されるようになった**（`grep -c 'checkbox-group.astro\|input-otp.astro' library/astro/package.json` = 2）。
`e2e/frameworks/astro.spec.ts` は `frameworkSuite` / `meterAndWindowSuite` / `radioGroupAndSliderSuite` / `navigationSuite` の 4 つ。
`e2e/astro/src/pages/index.astro` は `RdCheckboxGroup` / `RdInputOtp` を import していない。

## 設計（決めてある。変えるなら STOP）

### 1. `rd-toggle` — 退避版をそのまま。生成物の確認だけ足す

`bun run gen` の後:

- `library/vue/src/generated/toggle.ts` に `'aria-pressed':`（引用されたキー）があり、`bun run check` の typecheck が通る
- `library/react/src/generated/toggle.tsx` の props 型が `pressed?: 'true' | 'false'` を含む
- `library/svelte/src/generated/toggle.svelte` / `library/astro/src/generated/experimental/toggle.astro` が出る
- `library/astro/package.json` の `exports` に `./experimental/toggle.astro` が**生成器によって**足される

### 2. `rd-menu` の `display`

`rd-menu [popover]` のブロックから `display: grid` を**外し**、次を足す:

```css
  /* 開いているときだけ grid（UA の [popover]:popover-open { display: block } を上書き）。
     閉じているときは UA の display: none に任せる — ここで display を書くと閉じても見える */
  rd-menu [popover]:popover-open {
    display: grid;
  }
```

詳細度は 0,2,1 → `selector-max-specificity: 0,3,0` の中。`rd-menu:not(:defined) [popover] { display: block }` はそのまま（定義前はその場に開いて見せる）。
`[popover]:not(:popover-open)` を自分で書かない（UA に任せる方が壊れない）。

テスト（red → green）:

- `menu.test.ts`: 「定義後、開く前は `[popover]` の `getBoundingClientRect().height` が 0（描画されない）」「開くと > 0」「Escape で閉じると再び 0」
- `menu.stories.ts`: **`Closed`** story（`play` 無し。トリガーだけが見える）を足す。8 種の既存 story は変えない。VRT の新画像が 3 枚（default / dark / …は `e2e/stories.ts` の選び方に従う）

### 3. frameworks e2e

- `formWave4Suite('astro')` を `astro.spec.ts` に。`index.astro` に `RdCheckboxGroup`（`label="タグ"`、`checkboxOptionMarkup` 相当の 2 択）と
  `RdInputOtp`（`label="確認コード"`、`name="code"`、2 桁）を他の 3 フレームワークと**同じ props** で置く。`shared.ts` のコメントを「4 つで回す（023 で exports が生成される）」に直す
- **`toggleSuite(framework)`** を `shared.ts` に足し、4 つの spec すべてに載せる: JS 無しで `compareMarkup(page, 'rd-toggle', toggleMarkup({ label: '太字', pressed: 'false' }))`、
  JS 有りで押すと `aria-pressed="true"` になり `:state(pressed)`、もう一度押すと戻る。
  4 つの `App.*` / `index.astro` に `<RdToggle label="太字" />`（React は `pressed="false"` が既定で出ること — `markup()` の既定と同じ）を置く。
  `defines.ts` に `experimental/toggle/define` を**アルファベット順の位置**に

### 4. `.rd-button-group` の例を `rd-toggle` に

`patterns.css` のコメントと `e2e/pe/build-pages.ts` の `button-group.html` を `rd-toggle` 2 個（`pressed: 'true'` / `'false'`、`label` 一覧 / 格子）に。
`e2e/pe/tier-a.spec.ts` に「`button-group.html` は JS 無しで `aria-pressed` が読める」を足す（見た目の検査は VRT の `Patterns` が無いので pe-axe だけ）。
**`.rd-button-group` の CSS は変えない**。

### 5. proposal と changeset

`docs/proposals/toggle.md`（`docs/proposals/checkbox-group.md` と同じ見出し: 目的 / API / a11y / 代替案）。代替案に
「送信に載せるなら `rd-checkbox`（`switch`）」「Toggle Group は `rd-radio-group segmented`（単一）/ `rd-checkbox-group segmented`（複数）で部品にしない」
「`rd-button` に `pressed` は足さない（stable の API を増やさない）」を書く。
changeset: `@rimltempest/riml-ds-elements` **minor**（experimental に `rd-toggle`）+ **patch**（`rd-menu`: 閉じたメニューが定義後に見えていたのを修正）。
`@rimltempest/riml-ds-astro` は 023 の changeset が未リリースなので**足さない**（`exports` の追加は生成物）。

## 手順（red → green。各 Step の終わりにコミット）

### Step 0 — 準備

`RIML_DS_BASE_REF=main bash scripts/wt.sh new feat/form-wave5`。`bun install --frozen-lockfile` → `git checkout bun.lock`。**`bun run build`**。Drift check。`bun run test` 緑。

### Step 1 — `rd-menu` の修正（`fix(elements): keep a closed rd-menu hidden after definition`）

red: `menu.test.ts` に §2 の 3 つの期待。`bun run test -- --project browser library/elements/src/menu` で fail（閉じていても高さ > 0）。
green: `menu.css`。`Closed` story。`bun run check`（stylelint）。コミット。

### Step 2 — `rd-toggle` を入れ直す（`feat(elements): add rd-toggle (experimental, tier A)`）

`bun run scaffold:element toggle --pe A`。**テストだけ**退避版で上書き（`toggle.contract.test.ts` / `toggle.logic.test.ts` / `toggle.test.ts` / `toggle.sr.test.ts`）→
`bun run test -- --project node --project browser library/elements/src/toggle` で **red** を確認。
次に `index.ts` / `toggle.contract.ts` / `toggle.logic.ts` / `toggle.element.ts` / `toggle.css` / `toggle.define.ts` / `toggle.stories.ts` を退避版で上書き →
green。`src/experimental/toggle/index.ts`、`package.json` の 4 ブロック、`.size-limit.json`。
`bun run build && bun run gen` → §1 の確認 → `bun run check`。`bun run test -- --project storybook library/elements/src/toggle`（story 9 種の axe）。コミット。

### Step 3 — 露出と検証面（`test(e2e): cover rd-toggle in all four frameworks and run form wave 4 on astro`）

§3。`tools/mcp/src/examples.ts` に `'rd-toggle'`（`toast` の隣）、`tools/mcp/test` / `library/react/test/markup.test.tsx` の一覧に `RdToggle`。
`e2e/pe/build-pages.ts` に `'toggle.html'`（outline / ghost / pressed / disabled の 4 個）と §4 の `button-group.html`。`tier-a.spec.ts` / `axe.spec.ts` に載せる。
`bun run e2e:frameworks`（98 → **≥ 110**）、`bun run pe`。コミット（e2e と pe で分けてよい）。

### Step 4 — VRT（`test(vrt): baselines for toggle and the closed menu`）

`bun run storybook:build && bash scripts/vrt.sh --update-snapshots --grep 'Toggle|Menu'`。**既存の画像に差分が出たら STOP**（`git status --short e2e/__screenshots__` で `M` が無いこと。`A` だけ）。
新画像を全部開いて、押下が accent 塗り・forced-colors で Highlight の輪郭・`Closed` でトリガーだけ、を目で確認。コミット。

### Step 5 — 仕上げ

§5 の proposal / changeset。`bun run check`、`bun run test`、`bun run pe`、`bun run e2e:frameworks`、`bun run a11y`、`bash scripts/vrt.sh`、`bun run render && bun run lint:html`、
`bun run release:check`、`bash scripts/guard.sh`。コミット。

## 完了条件（機械で検査できるもの）

- `bun run gen` 後 `grep -c '"rd-toggle"' tools/cem/registry.json` ≥ 1（`"status": "experimental"`, `"pe": "A"`）、`git status --short` が空
- `grep -c "'aria-pressed'" library/vue/src/generated/toggle.ts` ≥ 1、`grep -c "'true' | 'false'" library/react/src/generated/toggle.tsx` ≥ 1
- `grep -c 'toggle.astro' library/astro/package.json` = 1
- `grep -c 'display: grid' library/elements/src/menu/menu.css` = 1 かつその行の直前のセレクタが `rd-menu [popover]:popover-open`（`grep -B2 'display: grid' library/elements/src/menu/menu.css | grep -c popover-open` = 1）
- `grep -c "formWave4Suite('astro')\|toggleSuite('astro')" e2e/frameworks/astro.spec.ts` = 2、react / vue / svelte の spec にも `toggleSuite` が 1 つずつ
- `bun run e2e:frameworks` exit 0（≥ 110 passed）、`bun run pe` exit 0
- `bun run test` exit 0、`bun run a11y` exit 0、`bash scripts/vrt.sh` exit 0、`bun run render && bun run lint:html` exit 0
- `git diff --name-only main -- e2e/__screenshots__ | xargs -I{} git diff --diff-filter=M --name-only main -- {} | wc -l` = **0**（既存画像は変わらない）
- `wc -l library/elements/src/toggle/toggle.element.ts` ≤ 150、`grep -c 'outline: none\|outline-width: 0\|linear-gradient' library/elements/src/toggle/toggle.css library/elements/src/menu/menu.css` = 0
- `bun run release:check` exit 0、`bash scripts/guard.sh` exit 0

## STOP する条件（改善せず報告する）

- `scaffold:element` の出力と退避版のファイル一覧が違う（skill の構成が変わった）
- 退避版を置いても `_shared` の API 差で直せない（`_shared` は触らない）
- ラッパー生成器がまだ `aria-pressed` で落ちる（`bun run check` の typecheck が生成物で失敗）→ `tools/cem/src` は触らず STOP
- `rd-menu` の修正で**開いた**状態の既存 VRT 画像が変わる
- size-limit を 2 KB 以上超える
- `git merge main` でコンフリクト

## スコープ外

- Toggle Group 部品（`segmented` の radio-group / checkbox-group で足りる）
- `rd-button` の `pressed`
- `_shared/popover-anchor.ts` の `:not(:defined)` フラッシュ（別件）
- Storybook の `Patterns/ButtonGroup` story（advisor）

## 保守メモ

- `rd-toggle` の真実は `aria-pressed` 属性。`pressed` プロパティは委譲するだけで値を持たない。利用側が属性を直接書き換えても `MutationObserver` で state が追随する
- `[popover]` を持つ部品は **`display` を通常状態に書かない**（`:popover-open` か `:not(:defined)` の側に書く）。`rd-popover` / `rd-tooltip` / 今後の combobox もこの決まり
  → `.claude/skills/riml-ds-element/SKILL.md` への追記は advisor がやる
- `astroExports()`（023）が `exports` を書くので、`.astro` を足すたびに `library/astro/package.json` を手で触る必要は無い。`bun run gen` の差分に出たらコミットする
