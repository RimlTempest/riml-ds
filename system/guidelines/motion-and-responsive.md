# モーションとレスポンシブ

## モーション

- **既定は動かない。** すべての `transition` / `animation` は
  `@media (prefers-reduced-motion: no-preference) { … }` の中。
- 使うのは**応答**だけ：押した（pressed）、開いた（dialog / popover の入場）、切り替わった
  （タブの下線）。装飾・注意喚起・待機演出には使わない。
- 時間は `motion.duration.fast`（120ms）と `motion.duration.base`（200ms）の 2 つ。
  それ以上長いものは置かない。easing は `motion.easing.standard` 1 つ。
- 入場は `@starting-style` + `transition-behavior: allow-discrete`（Newly）。無ければ瞬時に出る。
  退場アニメーションは持たない（閉じる操作を遅らせない）。
- 高さのアニメーションは `grid-template-rows: 0fr → 1fr`。`height: auto` には遷移しない。
- `will-change` を書かない。`transform` / `opacity` 以外をアニメーションしない。
- ローディングのスピナーは `prefers-reduced-motion: reduce` では点滅しない静止アイコンに置き換え、
  文言（「読み込み中」）を必ず併記する。

## レスポンシブ

- **モバイルファースト。** 360px を最小の設計幅、320px でも横スクロールを出さない（リフロー）。
- **部品の中は `@container`**（`container-type: inline-size` をホストに）。ページの骨格だけ `@media`。
  幅は `40rem` / `64rem` / `80rem`。
- **流体タイポグラフィ**（`clamp()`）。ブレークポイントでフォントサイズを切り替えない。
- **論理プロパティのみ。** `margin-inline` / `padding-block` / `inset-inline-start`。
- 密度 `[data-density="compact"]`：`space.*` と `sizing.*` を 0.75 倍。タッチターゲットは
  `::after` の透明領域で 44px を保つ。文字サイズは変えない。
- 入力欄の `font-size` は 16px 以上（iOS のフォーカス時ズーム回避）。
- 画像・アイコンは `max-inline-size: 100%`、`block-size: auto`。アイコンは `1em` 基準。
- 横に並ぶものは `flex-wrap: wrap` を既定に。折り返せないもの（表）は
  `overflow-x: auto` の容器に入れ、容器に `tabindex="0"` と名前を付ける。
- ホバーに依存しない（`@media (hover: hover)` の中でだけホバー表現を足す）。

## 印刷

- `@media print`：影・背景色・アニメーションを消す。`color-adjust: exact` は使わない。
- リンクは `a[href^="http"]::after { content: " (" attr(href) ")" }`。
- 対話部品は値だけを残す（ボタンは消す、入力欄は値をテキストとして）。
- 改ページ：見出し直後で切らない（`break-after: avoid`）、表の行を割らない（`break-inside: avoid`）。
