# 提案: `rd-toggle-group`（experimental）

## 目的

**フォームに載せない押下ボタンの列**を 1 つの部品にする。書式ツールバーの B / I / U、
表示切替の「一覧 / カード」がこれにあたる。

`rd-toggle`（024）は押下ボタン**単体**で、排他制御を持たない。送信に載る選択は
`rd-radio-group segmented` / `rd-checkbox-group segmented` が既にあるが、どちらも
`<input>` を持つので**フォームに参加してしまう**。その隙間 —— 送信には関わらず、
見た目が同じ押下ボタンの列で単一または複数を選ぶ —— を利用側が `rd-toggle` を並べて
自前の排他制御で埋めていた。

`rd-toggle` の提案では「Toggle Group は作らない」と書いたが、そこで想定していたのは
**送信に載る選択**だった。載せない場合に `rd-radio-group` を使うのは
「値を送らない `<input name>`」を書くことになり、意味論が合わない。

## API

- ティア A（ADR-0012）。契約は `rd-toggle-group > fieldset > legend` と
  `> fieldset > [part="options"] > button`（すべて必須）。マークアップは
  `toggleGroupMarkup(...)` + `toggleItemMarkup(...)` で組む
- 属性: `mode`（`multiple`（既定）/ `single`）、`orientation`（`horizontal`（既定）/ `vertical`）、
  `variant`（`outline`（既定）/ `ghost`。`rd-toggle` の `ToggleVariant` を再利用する）
- 押下の真実は各 `<button>` の **`aria-pressed`** 属性。`toggleItemMarkup` は省略時に
  `aria-pressed="false"` を書く（属性ごと消えると toggle ではなくただのボタンになる）
- `values` プロパティは getter / setter が `aria-pressed` に**委譲するだけ**で値を持たない。
  `MutationObserver` が外からの書き換え・項目の増減に追随する
- イベント: `rd-change`（`detail: { values: readonly string[] }`、bubbles + composed）。
  **ユーザー操作だけ**で発火し、`values` setter や外からの属性書き換えでは出さない
  （`rd-select` / `rd-data-table` と同じ方針）
- `:state()`: `outline` / `ghost` / `single` / `multiple` / `horizontal` / `vertical` / `malformed`
- 無効化はネイティブの `<button disabled>` に任せる（部品は `disabled` 属性を持たない）

## 決めたこと

### 項目は `<button>` 直書きだけ（`rd-toggle` を中に入れない）

`rd-toggle` を項目にすると押下の所有者が二重になる。`rd-toggle` は自分の `click` で
`aria-pressed` を反転して `rd-toggle` イベントを出すので、`single` の排他と衝突し、
「どちらが真実か」が場合によって変わる。`rd-toggle-group` は `<button>` の
`aria-pressed` だけを見て書き、単体の `rd-toggle` はグループの外で使う。

### 送信に載せる値には使わない

`<button>` は値を送らない。送信するなら `rd-radio-group segmented`（単一）/
`rd-checkbox-group segmented`（複数）を使う。どちらも見た目は同じ区画で、
送信・検証・キーボード操作をネイティブに任せられる。

### roving tabindex（Tab で 1 個、矢印で移動）

APG の「Toolbar」に従う。列は 1 つの操作単位なので、Tab で列に入り・列を出るのが 1 回ずつになる。
辿れる 1 個は「最初の押下（enabled）」→「最初の enabled」の順に決める。
**`tabindex` は JS が付ける**ので、JS が無ければ全部が普通の順で辿れる（縮退しても閉じ込めない）。
矢印は `disabled` を飛ばして折り返し、扱わないキー（横並びの ↑ ↓ など）では
`preventDefault()` しない —— ページのスクロールを奪わないため。
矢印は**フォーカスを動かすだけで押さない**（押すのは Enter / Space = ネイティブの `click`）。

### `single` でも解除を許す（0 個を許す）

押されている項目をもう一度押すと解除される。shadcn と同じで、`rd-radio-group` とは違う点。
radio は「どれか 1 つ」がネイティブの意味論だが、こちらは送信に載らないので
「絞り込みを解除して全部を見る」を 1 回の操作で表せるほうが素直。
「必ず 1 つ」が要る場面は送信に載る選択なので `rd-radio-group segmented` を使う。

## a11y

- 名前と役割は `<fieldset>` / `<legend>` が持つ。部品自身に `role` は付けない
  （`<fieldset>` が group）。読み上げは「書式、group」→「太字、toggle button、押されている」
- 押下は**面（raised）+ 影 + 太字**の 3 つで示し、色だけに頼らない（`docs/accessibility.md` 9）
- 強制配色では自前の面と影が消えるので、押下を `SelectedItem` / `SelectedItemText` で示し、
  フォーカスは**外側の太い `Highlight` のリング**にする。押下とフォーカスが同じ形にならないこと
  （024 のレビュー指摘）
- ボタンの高さ・幅は `--rd-sizing-target-min`（44px）を切らない（WCAG 2.2 Target Size）
- JS が無いときは「押しても変わらない普通のボタンの列」に縮退する。初期の `aria-pressed` は
  マークアップに書かれているので**読み上げは正しい**（害の無い縮退。ADR-0012 ティア A）

## 代替案

- **`rd-toggle` を並べて利用側が排他を書く**: いまの状態。排他・roving tabindex・
  `rd-change` を利用側が毎回書き直すことになり、キーボード操作が落ちやすい
- **`role="toolbar"` を部品が付ける**: 付けない。ツールバーは列より広い単位（`.rd-toolbar` に
  複数の列やボタンが並ぶ）で、`role` を付けるのは利用側の判断
- **`rd-radio-group` / `rd-checkbox-group` に `submit=false` を足す**: 足さない。
  `<input>` を持つ以上フォームに参加するのがネイティブの意味論で、それを属性で殺すと
  「JS 無しでは送られる」という最悪の縮退になる
- **`values` を部品が持ち `aria-pressed` を部品が書く**: しない。JS が無いときに属性が消え、
  読み上げが押下を落とす。真実をネイティブ側に置くのがティア A の決まり

## 保守メモ

見た目は `rd-checkbox-group:state(segmented)` と揃えてある（`[part='options']` の丸い面、
押下の raised）。`_shared` に CSS を置く仕組みが無いので重複している。
**3 つ目が出たら `patterns.css` の `.rd-segmented` に寄せる**
（`checkbox-group` proposal の保守メモと同じ判断）。
