# 提案: `rd-slider`（experimental）

## 目的

音量・上限・しきい値のような**連続値を 1 つ**、`<input type="range">` のまま扱えるようにする。
既存の部品には連続値が無く、利用側が `<div>` とドラッグ処理を自作していた
（キーボードで動かせない・値が読み上げられない・強制配色で消える）。

太いピルのトラックと丸いつまみ（`docs/brand.md` §4 / §7.5）を、ネイティブの range の上に重ねて描く。

## API

- ティア A（ADR-0012）。契約は `rd-slider > label`（`for`）と `> input[type="range"]`（必須）、
  `> output`（任意）。値・範囲・刻み・キーボード操作は**ネイティブが持つ**
- 部品がすることは 2 つだけ: `--rd-slider-fill`（0–1）を要素に書くことと、`<output>` に
  「値 + `unit`」を書くこと。`MutationObserver` で `value` / `min` / `max` / `step` の変更に追随する
  （`rd-meter` と同じ仕組み）
- 属性: `orientation`（`horizontal` | `vertical`、reflect）、`unit`、`hint`、`error`。
  **`disabled` は持たない** — `<input disabled>` をそのまま使う
- `value` は getter / setter でネイティブに委譲。`valueAsNumber` は getter だけ
- `:state()`: `vertical` / `invalid` / `errored` / `hinted` / `filled` / `malformed`
- 目盛は利用側の `<datalist>`。部品は `list` 属性を通すだけ

## a11y

- 名前は `<label for>`。役割・現在値・最小・最大はネイティブの range が読み上げる
- 部品が足す `[part="track"]` は装飾なので `aria-hidden="true"`。値の情報を持たせない
- つまみは 24×24 以上（WCAG 2.5.8）。フォーカスの輪は `<input>` 自身に出す
  （擬似要素に `outline` が効かないエンジンがあるため）
- 縦向きは `writing-mode: vertical-lr` + `direction: rtl` で**上が最大**にする
  （Vertical form controls は Baseline 2024。`docs/baseline.md` に 1 行足す必要がある）
- range は UA が値を範囲に丸めるので、ネイティブの検証にはまず落ちない。
  業務上の「選べない値」は `error` 属性で伝える
- 強制配色では自前のトラックを消し、ネイティブの range 表示に戻す

## 代替案

- **`::-webkit-slider-runnable-track` に `linear-gradient` で塗る**: グラデーションは `brand.md` §9 が禁じる。
  `::-moz-range-progress` は Firefox 専用で、エンジンごとに見た目が割れる
- **`<div role="slider">` を自前で組む**: 値の読み上げ・キーボード・タッチ・JS 無しの退行をすべて自分で持つ
- **値を部品が持つ（form-associated custom element）**: フォーム部品はティア A しか選べない（ADR-0012 §1）
- **`<output>` を部品が生成する**: 契約は「利用側が light DOM に書く」。JS 無しでも初期値が読めるよう、
  `<output>` の中身に初期値を書いてある（部品が作ると JS 無しで消える）
