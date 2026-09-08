# 提案: `rd-popover`（experimental）

## 目的

トリガーの脇に「軽い重ね物」を出す。中身は自由（見出し・本文・小さなフォーム）で、
**画面を止めない**。`rd-dialog` はモーダルなので、確定を迫らない用途には重すぎた。

## API

- ティア B（ADR-0012）。`rd-menu` と同じ骨格（`[slot="trigger"]` + `[popover]`）で、
  中身だけが自由。見出しは `[popover]` の先頭に `[slot="label"]` を置く
  （`[popover]` の中は slot されないので、これは**名前の出どころを指す印**）
- **JS が無くても開閉する**（`popovertarget` + `[popover]`）。定義前は `:not(:defined)` が
  中身をその場に開いて見せる
- JS が来たら `role="dialog"`（**非モーダル**）と `aria-labelledby`、`aria-haspopup="dialog"` /
  `aria-expanded`、開いたら中の最初の行き先・閉じたらトリガーへのフォーカス移動を足す
- `placement="start" | "end"`
- `rd-toggle` `{ open }` を出す（ネイティブの `toggle` と名前が衝突しないよう `rd-` を付ける）
- `:state(open)` / `:state(unlabeled)` / `:state(malformed)`

## a11y

- Esc はネイティブの popover が閉じる。閉じたらトリガーへフォーカスを戻す
- **フォーカスを閉じ込めない**。非モーダルなので Tab は素直に外へ抜ける
  （閉じ込めるものは `rd-dialog`）
- 押せるものが 1 つも無い中身でも開いた先に入れるよう、`[popover]` は `tabindex="-1"` を持つ。
  その輪は要素自身の `outline` で描く（`outline: none` で消さない）
- 見出しが無ければ `:state(unlabeled)` と `console.error`。名前の無い dialog を作らない

## 代替案

- **`rd-dialog` に `modal={false}` を足す**: `<dialog>` の `show()` は top layer に出ず、
  anchor positioning とも噛み合わない。骨格（帯・×）も要らないので別部品にした
- **`rd-menu` に自由な中身を許す**: `role="menu"` の中に見出しやフォームを置けない。
  ARIA の取り決めが別物なので部品を分ける
- **ホバーで開く（Hover Card）**: ホバーだけに頼る導線は WCAG 1.4.13 の扱いが増える。
  要るまで作らない（plan 020 スコープ外）
