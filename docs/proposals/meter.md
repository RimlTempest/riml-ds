# 提案: `rd-meter`（experimental）

## 目的

使用量・進捗・達成率のような「全体に対する割合」を、**色以外でも読める**形で出す。
既存の部品には割合を出すものが無く、利用側が `<div>` と幅の計算で自作していた
（読み上げに乗らない・強制配色で消える・ダークで潰れる、の 3 つが繰り返し起きる）。

## API

- ティア A（ADR-0012）。契約は `rd-meter > label` と `rd-meter > meter | progress`（どちらも必須）。
  値・最小・最大・フォールバック文言は**ネイティブ要素が持つ**。部品は値を持たない
- 部品がすることは 1 つだけ: `value` / `min` / `max` を読んで `--rd-meter-fill`（0–1）を要素に書く。
  `MutationObserver` で属性の変更に追随する
- `data-tone="success" | "warning" | "danger"` で塗りの意味色を変える（`--rd-meter-color`）
- `:state(indeterminate)` は `<progress>` に `value` が無いとき。`:state(malformed)` は契約の子が無いとき

## a11y

- 名前は `<label for>`。役割は `<meter>` = `meter`、`<progress>` = `progressbar`（ブラウザが付ける）
- **色だけで伝えない**。`<meter>` の中身にフォールバック文言（例「3.2 GB / 10 GB」）を必ず書く
- 強制配色ではグラデーションの塗りが消えるので `appearance: auto` でネイティブ表示に戻す
- トラックは `surface.sunken`、塗りは `accent.default` / `status.*.default`。どちらも面に 3:1 以上

## 代替案

- **部品にしない**（CSS だけ）: 割合を CSS 変数に写す仕事が残るので不可（ADR-0012 §6 の線引き）
- **`<div role="meter">` を自前で組む**: 値の読み上げ・強制配色・JS 無しの退行をすべて自分で持つことになる
- **区分メーター（複数系列）を最初から入れる**: 凡例と読み上げの設計が別物なので、まずは 1 系列だけにした。
  要るときは `rd-meter` を並べ、凡例を `<dl>` で出す
