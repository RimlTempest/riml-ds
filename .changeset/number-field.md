---
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-number-field`（experimental、ティア A）を追加。`<label for>` と `<input type="number">` を包み、**44px の − / + ボタン**と刻みの丸めだけを足す。値・範囲（`min` / `max` / `step`）・送信・検証・↑↓ キーの刻みはネイティブのままなので、JS が無ければ「ボタンの無い普通の数値入力」に縮退する
- elements: 刻みは `number-field.logic.ts` の純関数が決める（ネイティブの `stepUp()` は呼ばない）。空欄は 0 から刻んで `min` / `max` で止め、`step` と現在値の桁数の大きい方で丸めるので `0.2 + 0.1` は `0.3` になる。`step="any"` は 1 刻みとして扱う。端に着いたボタンはネイティブの `disabled` になる
- elements: − / + は `tabindex="-1"`（キーボードは入力欄の ↑↓ で刻む。APG Spinbutton / react-aria と同じ）。押すと `<input>` から `input` → `change` が上がる——**独自イベントは出さない**（購読は `<input>` に付ける）。`value` / `valueAsNumber` は `<input>` への委譲で、`stepUp()` / `stepDown()` は例外を投げない
- elements: ヒント・エラー文言と `:state()` は `_shared/field.ts` をそのまま使う（`invalid` / `errored` / `hinted` / `filled` / `malformed`）。`@csspart stepper` / `decrement` / `increment` / `hint` / `error`、`@cssprop --rd-number-field-gap`
- wrappers: `RdNumberField` を生成（`min` / `max` / `step` / `required` / `defaultValue` / `hint` / `error`）
