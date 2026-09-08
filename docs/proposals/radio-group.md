# 提案: `rd-radio-group`（experimental）

## 目的

「いくつかの選択肢から 1 つだけ」を、**JS が無くても選べて送信できる**形で出す。
既存の部品には択一が無く、利用側が `<div role="radiogroup">` とキーボード処理を自作していた
（矢印キーの循環・group の名前・強制配色、の 3 つが繰り返し落ちる）。

同時に、shadcn/ui でいう Toggle Group（セグメント切替）もここで賄う。riml-ds では
フォームに参加する部品は**ティア A しか選べない**（ADR-0012）ので、「押下状態のボタンの列」ではなく
**`<input type="radio">` の列をピルの区画に見せる**。`segmented` 属性は見た目だけを変え、
役割・送信・矢印キーは radio のまま（`rd-checkbox` の `switch` と同じ判断）。

## API

- ティア A（ADR-0012）。契約は `rd-radio-group > fieldset`、`> fieldset > legend`、
  `> fieldset input[type="radio"]`（3 つとも必須）。選択肢の入れ物は `<div part="options">`
- 値は**ネイティブ要素が持つ**。`value` は「選ばれている radio の値」を返す getter と、
  一致する radio を選ぶ setter だけ（無い値を書いても選択は変わらない）
- 属性: `segmented`（boolean、reflect）、`hint`、`error`。
  **`disabled` は持たない** — `<fieldset disabled>` をそのまま使う
- `:state()`: `segmented` / `invalid` / `errored` / `hinted` / `filled` / `malformed`
- `radioOptionMarkup({ id, name, value, label, defaultChecked?, disabled?, required? })` が
  `<label><input type="radio" …>文言</label>` を組む。**`required` は最初の 1 個にだけ**付ければ
  HTML の仕様で group 全体が必須になる（ラッパーの `children` を自分で組む利用側も同じ）

## a11y

- 名前は `<legend>`。`<fieldset>` が `group` として読まれ、選択肢は「radio、n 個中 m 番目」で読まれる
- `aria-describedby`（hint / error）は **各 radio** に付ける（`rd-checkbox` / `rd-text-field` と同じ流儀）。
  `<fieldset>` には付けない。**`aria-invalid` は使わない** — ARIA 1.2 で `role="radio"` では非推奨。
  不正は `:state(invalid)` と `:user-invalid` で示す
- 文言は操作後（`change` / `blur` / `invalid`）にだけ出す。`error` 属性があれば最優先で出す
- 選択は**面・影・太字**で示す（`segmented` でも色だけに頼らない）。
  タップ標的は文言まで含めて 44×44 以上（WCAG 2.2）
- 強制配色では区画の自前描画をやめ、ネイティブの radio 表示に戻す

## 代替案

- **`<button aria-pressed>` の列（shadcn の Toggle Group）**: フォームに参加できず、JS 無しで送信できない。
  ティア A の条件を満たせないので不可（ADR-0012 §1）
- **部品にしない（CSS だけ）**: 検証文言・`:state()`・`aria-describedby` の付け替えが残るので不可
- **選択肢も部品が描く**: 契約が「利用側が light DOM に書く」ことを前提にしている（SSR で同じ HTML が出る）。
  部品が `<input>` を作るとハイドレーションの前後で木が変わる
- **`segmented` を別部品（`rd-toggle-group`）にする**: 役割・送信・キーボードが radio と同じなので、
  API を 2 つに割ると利用側が選び間違える。見た目の切り替えは属性 1 つで足りる
