# 提案: Context Menu（`rd-menu` の `context` 属性）

## 目的

一覧の行・カード・キャンバスの上で「その場のもの」に対する操作を出す。
shadcn の Context Menu に当たるものが無く、利用側が `contextmenu` を拾って
`<div>` を絶対配置していた（キーボードから出せない・画面の端で切れる・
右クリックしか入口が無い、が繰り返し起きる）。

## なぜ新しい部品にしないか

中身（`role="menu"` / `menuitem`・roving tabindex・Esc・項目選択・`rd-select`）は
`rd-menu` と**1 つも違わない**。違うのは「開くきっかけ」と「開く位置」だけなので、
属性 1 つで足りる（ADR-0012 §6）。

## API

- `context`（boolean、reflect）。既定 `false`。**初期化時にだけ**読む
- 購読はホストに付ける（`[slot="trigger"]` の領域＝light DOM の子全体が対象）
- `menu.css` に足したのは 1 ルールだけ:
  `rd-menu[context] > [slot='trigger'] { display: block }`
  （領域が inline のボタンだけだと右クリックの面が無い）。既定の見え方は変えない

## 決めたこと

### 目に見えるボタンを必ず残す

`popovertarget` の `<button>` はそのまま。**右クリックは近道でしかない**——
APG は「コンテキストメニューには常に見える代替を用意する」と言う。
JS が無ければボタンだけが働き、右クリックはブラウザ既定に戻る。

### ポインタの位置に出す

`contextPosition(point, popover, viewport)` は**幅 0 高 0 のトリガー矩形**で
`_shared/popover-anchor.ts` の `computeAnchorStyle` を呼ぶだけ。新しい算術を書かないので、
「入らなければ倒す・画面からはみ出さない」規則は他の重ね物とまったく同じになる。

置くときは `position-anchor` を外して inline の `top` / `left` を書く——
`position-anchor` が無ければ `menu.css` の `position-area` は解決せず、inline の座標が生きる。
閉じたら位置を忘れ、今までどおり `anchorPopover` でトリガーに繋ぎ直す。
`resize` / `scroll` には追随しない（`_shared/popover-anchor.ts` と同じ判断）。

### キーボードからの `contextmenu` はトリガーに寄せる

Shift+F10 と Menu キーも `contextmenu` を出すが、座標は `0, 0` になる。
そのときは位置を持たず、今までどおりトリガーに繋ぐ——画面の左上に飛ばさない。

### 触っていないもの

Esc・矢印移動・項目選択・`rd-select`・`aria-disabled` の扱いはすべて今までどおり。
`context` を付けないときの `rd-menu` は 1 バイトも動きが変わらない。

## a11y

- `role="menu"` / `menuitem` のまま。トリガーの `aria-haspopup="menu"` も変わらない
- 開いたら最初の項目へ、閉じたらトリガーへフォーカスが戻る（APG）
- 右クリックだけの入口を作らない（見えるボタンが唯一の保証された入口）
- 当たり判定・強制配色・区切りの扱いは `rd-menu` の proposal のまま

## 代替案

- **`rd-context-menu` を新しく作る**: 中身が `rd-menu` と同じなので、キーボード操作・契約・
  ラッパー生成・VRT がまるごと二重になる
- **`document` に購読する**: どのメニューが受けるかが曖昧になり、入れ子で壊れる。
  ホストに付ければ「自分の面の中だけ」がそのまま境界になる
- **サブメニューまで作る**: 開閉の入れ子とキーボードの取り決めが一段深くなる。今は範囲外
