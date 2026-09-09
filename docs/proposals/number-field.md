# 提案: `rd-number-field`（experimental）

## 目的

数量・枚数・サイズ・価格など、**数値を 1 つ入れる**場面に専用の部品を置く。
いまは `rd-text-field` に `type="number"` を書くしかない（`text-field.stories.ts` の `Types` がその形）。

ネイティブの `<input type="number">` はそれだけで送信・検証（`min` / `max` / `step`）・
↑↓ キーの刻みまで動くが、3 つだけ穴がある。

1. ブラウザの刻みボタン（spinner）は **44px に届かない**。タッチでは事実上使えない（WCAG 2.2 Target Size）
2. `step="0.1"` で刻むと `0.30000000000000004` のような浮動小数の誤差が**値に残る**ブラウザがある
3. 空欄から刻んだときの開始値がブラウザごとに違い、`stepUp()` は `step="any"` で例外を投げる

`rd-number-field` は `rd-text-field` と同じヒント・エラーの仕組み（`_shared/field.ts`）の上に、
**44px の − / + ボタン**と**刻みの純関数**（開始値・丸め・境界での無効化）だけを足す。

shadcn には Number Field が無い（`Input type="number"` で済ませている）。これは shadcn の外の追加で、
qrcc（印刷枚数・QR のサイズ）と noter（フォントサイズ・行数）の両方が使う。

## API

- ティア A（ADR-0012）。契約は `rd-number-field > label` と `> input[type="number"]`（どちらも必須）。
  マークアップは `numberFieldMarkup(...)` で組む
- ホストの属性は `hint` / `error` の 2 つだけ。`min` / `max` / `step` / `required` / `name` / `value` は
  すべて **`<input>` の属性**（JS が無くても検証と送信が効く）
- `value` / `valueAsNumber` は `<input>` へ委譲する getter / setter。部品は値を持たない
- `stepUp()` / `stepDown()` を公開メソッドとして持つ（中身は純関数。例外を投げない）
- 独自イベントは**無し**。押すと `<input>` から `input` → `change` の順に上がる
- `:state()`: `invalid` / `errored` / `hinted` / `filled` / `malformed`（`_shared/field.ts` のまま）
- `@csspart stepper` / `decrement` / `increment` / `hint` / `error`、`@cssprop --rd-number-field-gap`

## 決めたこと

### `<input type="number">` を捨てず包む（`type="text" inputmode="numeric"` にしない）

`inputmode="numeric"` + `type="text"` にすると、桁区切りやロケール表示を自前で書けるようになる代わりに
**ネイティブの `min` / `max` / `step` 検証と ↑↓ の刻みを全部捨てる**ことになる。ティア A の決まりは
「JS 無しで動く」なので、検証を JS 側に移す設計は選べない。

桁区切り・通貨・ロケール表示が要る場面は利用側の責任にする（`hint` に書く、あるいは表示用の
別要素を置く）。本当に必要になったら `Intl.NumberFormat` を使う**別の部品**になる。

`inputmode` も `pattern` も書かない——`type="number"` がモバイルの数字キーボードを出す。

### − / + は `tabindex="-1"`（Tab 順に増やさない）

キーボード利用者は入力欄の上で ↑↓ を押せば刻める（ネイティブ）。そこに 2 個のボタンを
Tab 順へ足すと、フォームの移動が部品 1 つにつき 3 回になる。APG の Spinbutton も
react-aria の NumberField も同じ判断で、ボタンをフォーカス順から外している。

`tabindex="-1"` でも**アクセシビリティツリーには居る**ので、スクリーンリーダーのタッチ探索や
仮想カーソルからは押せる（`number-field.sr.test.ts` がそれを固定している）。
押した後に `control.focus()` は**しない**——ポインタで押した人の焦点を勝手に動かさないため。

### 独自イベントを出さず `<input>` の `input` / `change` を出す

値の真実は `<input>` なので、購読も `<input>` に付けるのが正しい（`rd-text-field` と同じ）。
`rd-change` のような独自イベントを足すと、`v-model` / `onChange` / `bind:value` と
二重の経路ができて「どちらが正か」が場面によって変わる。

### `stepUp()` を自前で持つ（ネイティブの `stepUp()` を呼ばない）

ネイティブの `stepUp()` / `stepDown()` は 3 つの理由で使えない。

- `step="any"` で `InvalidStateError` を投げる
- 空欄から刻んだときの開始値がブラウザ依存（`min` か 0 か）
- `step="0.1"` の刻みで浮動小数の誤差が値に残る

`number-field.logic.ts` の `stepValue` が、空欄を 0 から刻み・`min` / `max` で止め・
`step` と現在値の桁数の大きい方で丸める。純関数なので `*.logic.test.ts` が全部の境界を固定できる。

`min` / `max` が `step` の格子に乗っていない値（`min="0.5" step="1"`）でも、clamp の結果を
そのまま返す。**格子に寄せる補正はしない**——ずれはネイティブの `stepMismatch` が
`_shared/field.ts` の文言で見せる。

### 長押しの連続刻みを入れない

タイマーを注入する仕組みが要り（テストが時計に依存する）、`prefers-reduced-motion` や
繰り返しの速度も決めることになる。**まず要望を待つ**。

### `unit` 属性を持たない

`rd-slider` の `unit` は `<output>` に単位を書くためのもので、そこは**部品が描くノード**だった。
`rd-number-field` の値は `<input>` そのものなので、単位を入れる場所が無い。
「枚」「GB」は `hint` か `<label>` に書く。

## a11y

- 名前と役割はネイティブの `<label for>` + `<input type="number">`（spinbutton）が持つ
- − / + は 44 × 44px（`--rd-sizing-target-min`）。ブラウザ既定の spinner は `:defined` の中でだけ消す
  ——JS が来ていなければネイティブの spinner が唯一の刻む手段として残る
- 端まで来たボタンはネイティブの `disabled`（ティア A は `aria-disabled` を使わない）
- 強制配色では枕とボタンがシステム色の枠に置き換わり、無効なボタンは `GrayText` になる
- エラーは色だけでなく**太字と縦罫**でも示す（`docs/accessibility.md` 9）
- JS が無いときは「ボタンの無い普通の数値入力」に縮退する（害は無い。ADR-0012 ティア A）

## 代替案

- **`rd-text-field` に統合する**: しない。`type="number"` の判定で分岐すると `text-field.element.ts`
  が 150 行を超え、テキスト入力の読みやすさが落ちる
- **`rd-button` を刻みのボタンに使う**: 使わない。部品が部品を描くと定義順に依存する
  （`rd-data-table` の `part="sort"` と同じ判断）
- **値を部品が持ち `<input>` に書き戻す**: しない。JS が無いときに値が消える
- **ホイールでの値変更を抑える**: しない。ブラウザ既定に任せる（抑えると「動かない」に見える）

## 保守メモ

- 値の真実は light DOM の `<input type="number">`。外から変えるときは `element.value = …` か
  「`input.value = …` + `input` イベント」
- ↑↓ キーはネイティブのまま（部品は触らない）ので、**キーとボタンで丸めの結果が違う**場合がある
  （`step="0.1"` をキーで刻んだときの誤差はブラウザの責任）。気になる利用側は `step` の桁に
  合わせた `value` を書く
- 「枕」の見た目（`[part='stepper']`）は `.rd-input-group` / `rd-toggle-group [part='options']` /
  `rd-checkbox-group:state(segmented)` と 4 つ目の重複。
  **次に増えたら `patterns.css` の `.rd-segmented` に寄せる**（031 / 021 の proposal 保守メモと同じ判断）
