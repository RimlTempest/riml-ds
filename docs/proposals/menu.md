# 提案: `rd-menu`（experimental）

## 目的

1 つのボタンから「その場で選ぶ操作」を並べる。既存の部品には無く、利用側が `<div>` と
クラスの付け替えで自作していた（開閉が JS 依存・矢印キーで動かない・Esc で閉じない・
読み上げがただのリンクの塊になる、が繰り返し起きる）。

## API

- ティア B（ADR-0012）。契約は `rd-menu > [slot="trigger"]`（`popovertarget` を持つボタン）と
  `rd-menu > [popover]`（中に `<ul>`）。項目のセレクタは `ITEM_SELECTOR` として別に公開する
  （複数一致するので `checkContract` の `roles` には入れられない）
- **JS が無くても開閉する**。`popovertarget` + `[popover]` はブラウザだけで動き（Baseline Newly）、
  項目はネイティブのリンク / ボタンのまま。定義前は `:not(:defined)` がリストをその場に開いて見せる
- JS が来たら `role="menu"` / `role="menuitem"` と `aria-haspopup` / `aria-expanded`、
  ↑ ↓ / Home / End の roving tabindex、開いたら最初の項目・閉じたらトリガーへのフォーカス移動を足す
- `label`（メニューの名前。必須）、`placement="start" | "end"`
- `rd-select` `{ index, href }` を出す。項目の `click` は **`preventDefault` しない**
  （React Router などがリンクを横取りできる。`hidePopover()` だけする）
- `:state(open)` / `:state(unlabeled)` / `:state(malformed)`

## a11y

- Esc はネイティブの popover が閉じる。閉じたらトリガーへフォーカスを戻す
- 押せない項目は `aria-disabled`。**`disabled` にしない**——フォーカスできない項目は
  スクリーンリーダーの利用者が「無い」と誤解する
- 区切りは項目に付く**装飾**（`menuItemMarkup({ separated: true })` → `<li data-separated>` に罫線）。
  要素として挟まないのは、`role="menu"` が持てるのが `menuitem` 系だけだから
  （WAI-ARIA 1.2 の Required Owned Elements。`<li role="separator">` も `<hr>` も落ちる）。
  `<li>` はすべて `role="presentation"` にして、`role="menu"` の直下に `listitem` を残さない
- 当たっている項目は面の色**と**インライン始端の太い縦罫で示す（色だけに頼らない）
- 項目の当たり判定は `sizing.target-min`（2.75rem）以上
- 強制配色では `Highlight` の輪郭で示す（地に敷くと Chromium のバックプレートで文字が読めなくなる）

## 代替案

- **`<details>` を使う**: 開閉は素で動くが top layer に出ないので、周りを押し出すか切られる。
  「重ねて出す」意味が失われる
- **Floating UI を入れる**: 依存が増え、`library/elements` は lit とトークンしか持たない決まりに反する。
  anchor positioning が使えないときは `getBoundingClientRect()` の一発計算で足りる（`docs/baseline.md`）
- **`role="menubar"` まで作る**: キーボードの取り決めが一段深くなる。帯のメニューは
  `navigation.css` の `.rd-menubar`（リンクの列）で足りる
