# 提案: `rd-checkbox-group`（experimental）

## 目的

タグ・通知の種類・絞り込みのような**複数選べる選択肢**を、`<input type="checkbox">` のまま
1 つのまとまりとして扱えるようにする。019 の `rd-radio-group`（択一）と対になる複数選択版で、
`segmented` の見た目（ピルの区画）も同じ形で持つ（`docs/brand.md` §7.2）。

既存の `rd-checkbox` は 1 個ぶんの部品なので、`<fieldset><legend>` でまとめる形・「1 つ以上選べ」
の検証・区画の見た目を、利用側がそのつど自作していた。

## API

- ティア A（ADR-0012）。契約は `rd-checkbox-group > fieldset`（必須）、`> fieldset > legend`（必須）、
  `> fieldset input[type="checkbox"]`（必須）。選択肢は `checkboxOptionMarkup(...)` で組む
- 属性: `hint`、`error`、`segmented`（Boolean reflect）、`min`（Number reflect）
- `value` は getter が **checked の値の配列**（`readonly string[]`）、setter は配列を受けて checked を揃える。
  値・送信・検証はネイティブの checkbox が持つ（同じ `name` を並べると `?tags=a&tags=b` で送られる）
- `checkValidity()` は「すべての checkbox の `checkValidity()`」かつ「checked の数 ≥ `min`」
- `:state()`: `segmented` / `invalid` / `errored` / `hinted` / `filled` / `malformed`
- 文言は `_shared/field.ts` の `computeMessage`（`system/guidelines/writing.md` が正）。
  `min` 未満は `valueMissing` として扱い、**新しい文言を足さない**

## a11y

- 名前は `<legend>`。役割（`group`）と各項目の `checkbox, checked / not checked` はネイティブが読み上げる
- `hint` / `error` は**各 checkbox** の `aria-describedby` で結ぶ（`<fieldset>` に付けると
  読み上げの順序がエンジンごとに割れる）。`aria-invalid` は使わず `:state(invalid)` で伝える
  （`rd-radio-group` と同じ判断）
- `<label>` が `<input>` を包むので、文言まで含めて 44×44 のタップ標的になる（WCAG 2.2 Target Size）
- `segmented` でも `<input>` は消さずに隠すだけ。読み上げと Tab 移動はネイティブのまま。
  強制配色ではネイティブの checkbox 表示に戻す（自前の面が消えるため）
- 選択は面・影・太字で示し、色だけに頼らない（`docs/accessibility.md` 9）

## 代替案

- **`required` で「1 つ以上」を表す**: HTML の仕様では checkbox の `required` は**その 1 個だけ**に効く
  （radio と違う）。group 全体の下限はネイティブに無いので `min` 属性を部品が見る
- **`min` を JS 無しでも効かせる**: できない。JS が無いときは `min` が効かず素通りする（正しい縮退）。
  **サーバ側の検証を省く理由にしない**
- **`rd-radio-group` に `multiple` を足す**: radio と checkbox は役割・キーボード操作・送信の形が違う。
  1 つの部品に混ぜると `value` の型が分岐して利用側が読めなくなる
- **区画の CSS を `patterns.css` に共通化する**: いまは `rd-radio-group` と 2 か所の重複。
  3 つ目が出たら `.rd-segmented` に寄せる（それまでは共通化しない — `_shared` に CSS を置く仕組みが無い）
