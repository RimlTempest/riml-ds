# 提案: `rd-tabs`（experimental）

## 目的

同じ場所に複数の面を重ねて、1 つずつ見せる。既存の部品には無く、利用側が `<div>` と
クラスの付け替えで自作していた（キーボードで動かない・読み上げがただのリンクになる・
JS が落ちると 1 つの面しか読めない、の 3 つが繰り返し起きる）。

## API

- ティア B（ADR-0012）。契約は `rd-tabs > [slot="tabs"]`（`<ul>`）と、その中の
  `a[href^="#"]`（1 つ以上）。パネルは `id` を持つ子（`<section id>`）
- **JS が無ければページ内リンクの列**。パネルはすべて見えていて、リンクを押せばそこへ飛ぶ。
  JS が来たら `role="tablist"` / `role="tab"` / `role="tabpanel"` と roving tabindex を足し、
  選ばれていないパネルに `hidden` を付ける
- `label`（タブの列の名前。必須）、`variant="line" | "browser"`、`orientation="horizontal" | "vertical"`、
  `selected="#id"`（`location.hash` のほうが強い）
- `rd-change` `{ id }` を出す。`location.hash` は**読むだけで書かない**（履歴を汚さない）
- `:state(vertical)` / `:state(unlabeled)` / `:state(malformed)`

## a11y

- 自動活性化（フォーカスが移ると同時に切り替わる。WAI-ARIA APG の既定）。パネルが重いなら
  利用側が中身を遅延させる——切り替えの操作を 2 段にはしない
- 矢印は向きに従う（横は ← →、縦は ↑ ↓）。関係ないキーは奪わない（ページのスクロールを止めない）
- 選択は**色だけで示さない**。`line` は太い下線 + 太字、`browser` は面が本体と同じ色になって「生える」
- 強制配色では `Highlight` の輪郭で示す（地に敷くと Chromium のバックプレートで文字が読めなくなる）
- タブの当たり判定は `sizing.target-min`（2.75rem）四方以上

## 代替案

- **`<button role="tab">` を並べる**: JS が無いと押せない。ティア B の約束（内容が見える）を満たせない
- **パネルを `<details>` にする**: 縦のアコーディオンになる。`rd-disclosure` が既にあるのでそちら
- **`variant="browser"` を別部品にする**: 骨格も ARIA も同じで、違うのは面と角丸だけ。属性で足りる
