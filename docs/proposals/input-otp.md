# 提案: `rd-input-otp`（experimental）

## 目的

SMS・認証アプリの**ワンタイムコード**を、桁ごとの `<input>` のまま入力できるようにする。
1 つの `<input maxlength="6">` だと桁が読み取りにくく、貼り付けたコードの整形も利用側の自作になる。

桁は正方形のマス（`docs/brand.md` §4 の硬い面）で、等幅数字（`tabular-nums`）で並べる。

## API

- ティア A（ADR-0012）。契約は `rd-input-otp > fieldset`（必須）、`> fieldset > legend`（必須）、
  `> fieldset input`（必須。`checkContract` は最初の 1 桁で判定する）
- 桁は `otpCellsMarkup({ name, length = 6, autocomplete = true })` が組む:
  `<input type="text" inputmode="numeric" pattern="[0-9]" maxlength="1" … required>`。
  `autocomplete="one-time-code"` は**最初の 1 桁だけ**に付く
- **値は `name-1` … `name-N` の N フィールドとして送信される。** 連結した値が欲しい利用側は
  `el.value` を読むか、サーバで連結する
- `length` は `markup()` だけが使う。**部品は `length` を持たず、実際の `<input>` の数を数える**
- 属性: `hint`、`error`。`value` は getter が連結、setter が分配。`checkValidity()` は全桁
- `:state()`: `invalid` / `errored` / `hinted` / `filled`（全桁が埋まった）/ `malformed`
- JS があるときだけの強化: 1 文字入ったら次の桁へ、`Backspace`（空のとき）と矢印で移動、
  貼り付けで分配。判断は `nextCellIndex` / `distributePaste`（純関数）が持つ

## a11y

- group の名前は `<legend>`。各桁の名前は `aria-label="N 桁目"`（`markup()` は静的なので UI 言語を見ない。
  英語が要る利用側は `children` を自分で組む）
- `hint` / `error` は**各桁**の `aria-describedby` で結ぶ（`rd-radio-group` と同じ判断）
- 桁は 44×44（`--rd-sizing-target-min`）。入力中の桁はキャレット色をアクセントにする
- 数字キーパッドは `inputmode="numeric"`。`type="number"` は使わない（スピナーが出る・
  `maxlength` が効かない・iOS で先頭 0 が落ちる）
- 強制配色では桁の罫線を `CanvasText` で描く（自前の面が消えるため）

## 代替案

- **1 つの `<input maxlength="6">` にする**: 桁の区切りが読み取れず、貼り付け以外の入力で
  どこまで打ったかが分からない。マスの見た目を背景画像で作るのは `brand.md` §9 が禁じる
- **`contenteditable` の自作フィールド**: 値の読み上げ・キーボード・IME・JS 無しの退行を
  すべて自分で持つことになる
- **部品が桁の `<input>` を生成する**: 契約は「利用側が light DOM に書く」。部品が作ると
  JS 無しで何も入力できない（ティア A の不変条件を破る）
- **`length` 属性を部品に持たせる**: マークアップと属性の 2 か所に桁数の正ができる。
  実際の `<input>` の数を数えれば 1 か所で済む
