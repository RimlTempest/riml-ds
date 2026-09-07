# Plan 009: 部品バックログ（ティア付き）と第 2 波（select / checkbox / disclosure / toast）

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat <plan-008 のマージコミット>..HEAD -- library/elements/src library/elements/package.json tools/cem/registry.json .size-limit.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L（第 2 波の 4 部品。バックログの残りは**この plan の対象外**：後続 plan に分割する）
- **Risk**: LOW（plan 004 の型に従うだけ。新しい仕組みは無い）
- **Depends on**: 005, 006（story と e2e/pe、ラッパー生成が回っている状態で足す。「story を書けば品質ゲートに乗る」ことの最初の実証）
- **Category**: direction
- **Planned at**: commit `7bf04e8`, 2026-09-07

## Why this matters

qrcc / noter の `shared/ui/src/components/` にあるのは button / field / live-region / skip-link / visually-hidden（noter は + avatar）で、
plan 004 でほぼ揃う。次に両アプリが**独自に作っている**のは選択（select）、真偽（checkbox）、折りたたみ、通知（toast）。
この 4 つを「部品を足す手順」（`riml-ds-element` skill）に**そのまま従って**足し、手順の穴を見つけるのがこの plan の目的。
残りのバックログは表として固定し、優先順位とティアを先に決めておく（後で議論しない）。

## Current state

- plan 004〜008 完了。`library/elements/src/{button,text-field,dialog,live-region}/`、`_shared/{markup,contract,internals}.ts`、
  `tools/cem`（CEM / registry / argTypes / wrappers）、Storybook、`e2e/pe`、4 fw ラッパー、release ゲート。
- 部品追加の手順は `.claude/skills/riml-ds-element/SKILL.md`（ティア表 → ファイル構成 → TDD 順序 → 完了条件）。
  `docs/governance.md` §部品の追加（`experimental` から始め、条件を満たしたら `stable`）。
- ADR-0009：新部品は **`@status experimental`** で入り、`@rimltempest/riml-ds-elements/experimental/<name>` から export（`exports` に `./experimental/<name>` / `./experimental/<name>/define` / `./experimental/<name>/style.css`）。
  stable 昇格の条件：story 8 種、AAA 自動検査、Vitest browser、**2 つ以上のフレームワーク e2e で動く**、guidelines がある。
- `text-field.contract.ts` の `roles.control` は `':scope > input, :scope > textarea'` → **textarea は新部品ではなく `rd-text-field` の子として既に対象**
  （`field-sizing: content` も plan 004 で入っている）。

## バックログ（ティア・優先・依存）

| # | 部品 | ティア | 包む／使うネイティブ | 優先 | 依存 | 備考 |
| - | ---- | ------ | -------------------- | ---- | ---- | ---- |
| 1 | `rd-select` | A | `<label for>` + `<select>` | P2（この plan） | — | `hint` / `error` / `:state(invalid)` は text-field と同じ logic を `_shared/field.ts` に括り出す |
| 2 | `rd-checkbox` | A | `<input type="checkbox">` + `<label>`（label が input を**包む**契約も許す） | P2（この plan） | — | `indeterminate` はプロパティ委譲。`role=switch` は `rd-switch` で別部品にせず **`switch` 属性**で見た目だけ変える |
| 3 | `rd-disclosure` | A | `<details>` / `<summary>`（内容は light DOM の子。ADR-0012 のティア A は「light DOM でネイティブを包む」作り方の名前で、フォーム部品に限らない） | P2（この plan） | — | JS 無しで `<details>` がそのまま開閉する。`name` 属性で排他（Baseline 2024） |
| 4 | `rd-toast` | C | — | P2（この plan） | `rd-live-region` | 表示は toast、読み上げは live-region に**委譲**（`@dependency rd-live-region`）。`popover` 属性で最前面 |
| 5 | `rd-radio-group` | A | `<fieldset>` + `<legend>` + `<input type="radio">`×n | P3 | — | 契約：`roles.legend` / `roles.options` |
| 6 | `rd-tabs` | B | `<a href="#panel">` のリスト（JS 無しはページ内リンクとして動く） | P3 | — | ARIA tabs パターンは JS で付与 |
| 7 | `rd-menu` | B | `<button popovertarget>` + `<div popover>` | P3 | — | Popover API（Baseline 2024）。`anchor-name` は Newly → `@supports` |
| 8 | `rd-tooltip` | C | — | P3 | — | `title` 属性のフォールバック（JS 無し）。ホバーだけに依存しない（フォーカスでも出る） |
| 9 | `rd-avatar` | C | `<img>` | P3 | — | noter のプレゼンス表示の共通部分だけ。**イニシャル生成のロジックは持たない** |
| 10 | `rd-skeleton` | C | — | P4 | — | `aria-busy` は親が付ける |
| 11 | `rd-badge` | — | — | P4 | — | **部品にしない候補**。`.rd-badge` の CSS クラスで足りるか先に検討（`.rd-skip-link` と同じ判断） |
| 12 | `rd-table` | — | `<table>` | 見送り | — | 部品にしない。`@rimltempest/riml-ds-css` の `rd.base` で `table` の既定を整える |

ティアの決め方は ADR-0012 §2 の表。**この表を変えるときは PR で理由を書く**（plans/README の「決定」に追記）。

## Commands you will need

plan 004 / 005 / 006 と同じ。加えて：

| Purpose        | Command                                                  | Expected on success                  |
| -------------- | -------------------------------------------------------- | ------------------------------------ |
| 部品雛形       | `bun run scaffold:element <name> --pe A`（**この plan で作る**。`scripts/` は chore/scaffold 所有 → `library/elements/scripts/scaffold.ts` に置く） | 8 ファイル生成 |
| 全ゲート       | `bun run check && bun run test && bun run gen && bun run guard && bun run pe && bun run e2e:frameworks` | exit 0 |

## Suggested executor toolkit

- skill：`riml-ds-element`（必読）、`riml-ds-css`、`riml-ds-tdd`、`riml-ds-release`（changeset）
- Context7：`/lit/lit`、`/whatwg/html`（`<details name>`、Popover API、`<select>` の `:user-invalid`）
- `bunx modern-web-guidance@latest search "details name exclusive"`、`"popover toast accessibility"`、`"customizable select"`（**customizable `<select>` は
  Baseline 外 → 使わない。見た目はネイティブのまま、トークンで色と枕だけ**）

## Scope

**In scope**:

- `library/elements/src/{select,checkbox,disclosure,toast}/**`（8 ファイル型：contract / logic / element / css|styles / define / index / stories / tests）
- `library/elements/src/_shared/field.ts`（text-field から括り出す共通 logic。**text-field のテストが全部通ることを条件に**リファクタ）
- `library/elements/src/experimental/<name>/index.ts`（re-export）+ `package.json` の `exports`（`./experimental/*` を**列挙**。ワイルドカード禁止）
- `library/elements/scripts/scaffold.ts`（雛形生成。skill のファイル構成をそのまま出す）+ root `package.json` の `scaffold:element`
- `e2e/pe/build-pages.ts` の一覧（ティア A/B の新部品を追加。plan 005 Maintenance の通り。`registry.json` の `pe` から自動列挙に置き換えてよい）
- `.changeset/*.md`（minor ×1：「experimental に 4 部品追加」、minor ×1：「rd-dialog: dismissible → persistent、rd-live-region: serializable」）
- Step 0 のため：`library/elements/src/{dialog,live-region}/**`、`library/elements/README.md`、`e2e/frameworks/**`、`e2e/{react,vue,svelte,astro}/**`（`dismissible` の置換のみ）、
  `library/elements/custom-elements.json`、`tools/cem/registry.json`、`e2e/__screenshots__/**`（dialog Persistent の画像のみ）
- `plans/README.md`（自分の行だけ）

**Out of scope**:

- 既存 4 部品の API 変更（Step 0 の 2 点を除く。`_shared/field.ts` の括り出しは**内部**のみで、Step 0 以降 CEM の diff がゼロであること）
- `system/**`（トークン不足は STOP）、`tools/cem/src/**`（生成器が新部品で失敗したら STOP）、`docs/**`、`.claude/skills/**`
- バックログ #5〜#12 の実装

## Git workflow

- Branch: `feat/elements-wave2`（`bun run wt new feat/elements-wave2`。`scripts/lanes.tsv` に行を足す：所有は `library/elements/src/{select,checkbox,disclosure,toast,_shared/field.ts,experimental},library/elements/scripts,e2e/pe/build-pages.ts`）
- 部品 1 つ = コミット 3〜4（contract → logic → element+css → stories）。`feat(elements): add rd-select (experimental, tier A)` など
- push しない

## Steps

### Step 0: plan 004 / 005 / 006 からの追補（既存 4 部品の小さな修正。**先にやる**）

いずれも実装で見つかった欠陥。まだ npm に公開していないので API を直してよい（0.x、ADR-0009）。

- **`rd-live-region` に `serializable: true`**：`shadowRootOptions` を `{ ...LitElement.shadowRootOptions, serializable: true }` にする
  （`RdDialog` と同じ）。無いと `getHTML({ serializableShadowRoots: true })` に shadow 内容が出ず、Storybook の描画後 HTML（markuplint）に
  live region が現れない。`live-region.test.ts` に「`el.getHTML({ serializableShadowRoots: true })` が `part="polite"` を含む」を 1 件追加（red → green）。
- **`rd-dialog` の `dismissible`（既定 true）を `persistent`（既定 false）に反転**：boolean 属性は「無い = false」しか HTML で表せず、
  `markup({ dismissible: false })` が属性を省くだけで既定 true のまま立ち上がる欠陥。`dialog.contract.ts` / `dialog.logic.ts`（`decideClose({ persistent, reason })`）/
  `dialog.element.ts`（`@state persistent` は付けない。`:state(open)` のみのまま）/ `dialog.css` / `dialog.stories.ts`（`Persistent` story を属性で書く）/
  `dialog.test.ts` / `library/elements/README.md` を更新。`bun run gen` で CEM とラッパー（`library/*/src/generated`）が追随し、
  `e2e/frameworks/*.spec.ts` と `e2e/<fw>/**` に `dismissible` が残っていれば `persistent` に置換（`grep -rn dismissible library e2e apps` が 0 件）。
  `skills/riml-ds/SKILL.md` §3 の `dismissible={undefined}` の例は**レビュアーが直す**（skills は out of scope）。
- **text-field の現状**：`text-field.logic.ts` は `computeView` / `usesJapaneseCopy` / `computeMessage` 系を持ち、テストは node 17 + browser 13 = **30 件**
  （plan 本文の「23 件」は改訂前の数）。Step 1 の `_shared/field.ts` はこれらを移す。

**Verify**: `bun run test` → live-region +1、dialog は件数同じで全 pass。`bun run gen && git status --porcelain` が空（生成物をコミットした後）。
`bun run e2e:frameworks` 17 件 pass、`bun run pe` pass、`bun run vrt`（Docker）で差分が出るのは dialog の `Persistent` story だけ → その画像だけ `bun run vrt:update` で更新。

### Step 1: 雛形生成器と `_shared/field.ts`

`library/elements/scripts/scaffold.ts`：`--pe A|B|C` に応じて skill §1.1 のファイル構成を空の TDD 雛形で出す（`it.todo` 入りのテスト、
`@pe` / `@status experimental` / `@summary TODO` 入りの element、契約の骨）。生成後に `bun run check` が通ること（`it.todo` は許容）。
`_shared/field.ts`：`text-field.logic.ts` の `computeMessage` / `computeStates` / `computeDescribedBy` を移し、text-field は re-export。**text-field の 30 件が
変更無しで通る**（テストを触らない）。

**Verify**: `bun run scaffold:element probe --pe A && bun run check` exit 0 → 生成物を削除。`bun run test` → text-field 30 件 pass、`bun run gen && git diff --exit-code library/elements/custom-elements.json`

### Step 2: `rd-select`（A）

契約：`roles: { label: ':scope > label', control: ':scope > select' }`、`tree`：`<rd-select hint error><label for=$id>{label}</label><select id=$id name=$name required=$required>{raw:options}</select></rd-select>`
（`options` は `<option>` 群の文字列。React では `children`）。logic は `_shared/field.ts`。css：`rd-select > select { min-block-size: var(--rd-sizing-target-min); … appearance: auto }`
（ネイティブの矢印を残す。`:user-invalid`）。stories 8 種、browser 8 件、sr 2 件、contract 3 件。

### Step 3: `rd-checkbox`（A）

契約：`roles: { control: ':scope input[type="checkbox"]', label: ':scope label' }`（**1 段下でなくてもよい**：`<label><input>文言</label>` の包む形を許す。
`checkContract` は `querySelector` なので対応済み）。`tree`：`<rd-checkbox switch=$switch><label><input type="checkbox" id=$id name=$name value=$value checked=$defaultChecked required=$required>{label}</label></rd-checkbox>`。
`switch` 属性で `role="switch"` を **JS が付ける**（JS 無しはチェックボックスとして動く = 退行しない）。`indeterminate` はプロパティ委譲。
css：`accent-color: var(--rd-color-accent-default)`、`switch` の見た目は `@supports selector(:state(switch))` 内で `appearance: none` + トラック描画、
forced-colors ではネイティブ表示に戻す。stories 8 + `Switch`、browser 7、sr 2、contract 3。

### Step 4: `rd-disclosure`（A）

契約：`roles: { details: ':scope > details', summary: ':scope > details > summary' }`、`tree`：`<rd-disclosure><details name=$group open=$open><summary>{label}</summary>{raw:children}</details></rd-disclosure>`。
element：`createRenderRoot() { return this }`（ティア A。`.css` だけで styles.ts を持たない。guard (a) を通す）、
`toggle` イベント → `open` 属性同期 + `rd-toggle`、`:state(open)`。css：`summary` にフォーカスリングと `list-style` の整え、`::details-content` は Newly → `@supports`。
`e2e/pe`：JS 無しで開閉できる（`<details>` そのもの）。stories 8、browser 5、sr 1、contract 2。

### Step 5: `rd-toast`（C、`@dependency rd-live-region`）

`show({ message, tone, duration })`：shadow に `popover="manual"` の枡を描き、文言の読み上げは `document.querySelector('rd-live-region')?.announce(message)`
（**無ければ `console.warn` 1 回**。自前 `aria-live` を持たない：ADR-0008 §6）。`duration` は reduced-motion に関係なく、**フォーカス／ホバー中は止める**
（WCAG 2.2.1）。閉じるボタンは shadow 内 `<button>`（ティア C は JS 前提なので可）。styles.ts：`position-area` は Newly → `@supports`、
無ければ `inset-block-end` / `inset-inline-end` で右下。stories 8（`Default` は `play` で `show()`）、browser 6（表示／自動消去／ホバーで停止／閉じる／live-region 連携／無い時 warn）、sr 1。

### Step 6: experimental export・e2e・changeset

`package.json` `exports` に 4 部品 × 3（C は 2）を `./experimental/…` で列挙。`bun run gen`（CEM / registry / argTypes / 4 fw ラッパー）→ 新部品が
`library/*/src/generated/` に出る。`e2e/pe/build-pages.ts` に select / checkbox / disclosure（すべて A）。`e2e/frameworks` の共通ページに `RdSelect` と `RdCheckbox` を 1 つずつ足す
（**shared.ts のシナリオを増やす**：選択して送信 → クエリに載る）。`.size-limit.json` に **足さない**（experimental は予算外。stable 昇格時に足す）。
`.changeset/wave2.md`：`"@rimltempest/riml-ds-elements": minor` + 4 fw も fixed で上がる旨。

**Verify**: 全ゲート（Commands の行）exit 0。`jq '[.modules[].declarations[]? | select(.customElement==true)] | length' library/elements/custom-elements.json` = 8

## Test plan

- contract：3+3+2 = 8（node）、logic：select 2 / checkbox 4 / disclosure 3 / toast 5 = 14（node）
- browser：8+7+5+6 = 26、sr：2+2+1+1 = 6、stories：≥ 33（addon-vitest）
- e2e/pe：select 2 / checkbox 2 / disclosure 1 = 5、e2e/frameworks：+1 シナリオ × 4 fw
- 実行：`bun run test` → 全 pass（新規 54 + story 33）。`bun run pe` / `bun run e2e:frameworks` pass

## Done criteria

- [ ] 4 部品が `@status experimental`、`@pe` 付きで CEM に載る（合計 8 部品）
- [ ] `exports` に `./experimental/<name>`（+ `/define`、A/B は `/style.css`）。`.` も `./*` も無い
- [ ] 既存 4 部品の CEM に diff ゼロ（`_shared/field.ts` の括り出しが API に影響していない）
- [ ] 全テスト pass（数は Test plan）、a11y 除外 0、`bun run pe` で select / checkbox / disclosure が JS 無しで動く
- [ ] 4 fw のラッパーが生成され、React e2e で `RdSelect` / `RdCheckbox` が送信できる
- [ ] `scaffold:element` が skill §1.1 と同じファイル構成を出す
- [ ] `.changeset` 1 件（minor）、`bun run release:check` exit 0
- [ ] `bun run check` / `bun run guard` exit 0、`plans/README.md` の 009 行更新

## STOP conditions

- `_shared/field.ts` の括り出しで text-field のテストが落ちる → 括り出しをやめて重複のまま進め、報告
- `--rd-*` の不足（`color.accent.default`、toast の `shadow.overlay` など）→ 一覧を報告
- wrappers 生成器が `{ raw: 'options' }`（`children` 以外の raw 名）を扱えない → 契約名を `children` に揃えて進め、報告（plan 006 の制約）
- `checkContract` が「label が input を包む」形を扱えない → `_shared/contract.ts` を直さず報告
- Popover API / `<details name>` が Vitest browser の Chromium で動かない（版が古い）→ Playwright の版を報告

## Maintenance notes

- 第 3 波（#5〜#8）は `plans/011-*.md` として **この表の行をそのまま Status に写す**。表を更新したら plans/README の「決定」に日付
- stable 昇格は 1 部品 1 PR（`@status` 変更 + `exports` を `./<name>` に移す + `.size-limit.json` に行 + changeset **major 扱い（0.x では minor）**）。
  `experimental/` のパスを 1 メジャー残す（ADR-0009 deprecated 手順）
- `rd-badge` / `rd-table` は**部品にしない判断を先にする**（CSS で足りるなら plan 003 の `utilities.css` / `base.css` に 1 行）
- 見送り：customizable `<select>`（Baseline 外）、独自ドロップダウン（ネイティブ `<select>` で AAA を満たせる）、`rd-switch` 単独部品（`switch` 属性で足りる）
