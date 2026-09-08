# 提案: `rd-data-table`（experimental）

## 目的

shadcn の **Data Table** に当たるものが `.rd-table`（見た目だけの atoms）しか無く、**並べ替え**が
できない。qrcc の「保存したコードの一覧」、noter の「ノート一覧」はどちらも列見出しで並べ替えたい。

`rd-data-table` は `<table class="rd-table">` を包むティア A（ADR-0012）で、**JS が無ければ
書かれた順の表がそのまま読める**。定義されてはじめて `th[data-sort]` の中身が
`<button part="sort">` になり、押すと `<tbody>` の `<tr>` が並び替わる。

## なぜ「並べ替えだけ」か

Data Table と呼ばれるものは、実際には**別々の関心**の寄せ集めになっている。riml-ds には
それぞれに対応する部品・パターンが既にある:

| 関心         | riml-ds での置き場                              |
| ------------ | ----------------------------------------------- |
| ページ送り   | `.rd-pagination`（`navigation.css`）            |
| 行の選択     | `rd-checkbox`                                   |
| 絞り込み     | `rd-text-field` / `rd-combobox`                 |
| 行ごとの操作 | `rd-menu`                                       |
| 見た目       | `.rd-table`（`atoms.css`）                      |
| **並べ替え** | **無かった → この部品**                         |

足りなかったのは並べ替えだけなので、部品もそれだけを持つ。残りは**外側で組み合わせる**。
1 つの巨大な部品にすると、行の描画（テンプレート）まで部品が抱えることになり、
「表そのものは利用側が書く」というティア A の前提（ADR-0012）が崩れる。

APG の「Sortable Table」も同じ範囲で、`aria-sort` と見出しの中のボタンだけで足りる。

## なぜ見出しをボタンで包むのが「定義後」か

JS が無ければ並べ替えは起きない。そこに `<button>` を置くと、**押しても何も起きないボタン**が
読み上げにもキーボードの Tab 順にも現れる。ティア A の縮退は「機能が減る」ことであって
「壊れた操作子が残る」ことではない（ADR-0012）。

だから利用側が書く HTML は `<th scope="col" data-sort="text">名前</th>` の**ただの見出し**で、
`wire()` が定義後に中身を `<button type="button" part="sort">` へ移す。ボタンの文字 =
見出しの文字なので、`th` のアクセシブル名は包む前後で変わらない。

包みは `disconnectedCallback` でも**戻さない**。戻すとフォーカスがボタンから飛ぶ。
再接続で二重に包まないよう、`wire()` は `[part="sort"]` の有無で判定する。

## `manual` の意図

行が多い一覧はサーバー側（あるいはデータ側）で並べ替えるのが普通で、そのとき部品が DOM を
動かすと**二重に並べ替わる**。`manual` を書くと部品は `aria-sort` と `rd-sort` だけを出し、
`<tr>` を動かさない。`rd-combobox` の `filter="none"` と同じ思想で、
「判断は利用側、a11y の面倒は部品」という切り方にそろえてある。

フレームワークで `<tr>` を再描画する利用側も同じ。DOM の移動はテンプレートの再描画で戻るので、
**`manual` を使ってデータ側で並べ替えるのが正しい**（`rd-sort` を受けて `order by` を変える）。

## API

- ティア A。契約は `rd-data-table > table`（必須）、`> table > caption`（必須）、
  `> table > thead`（必須）、`> table > tbody`（必須）。どれかが無ければ
  `console.error` + `:state(malformed)` で、見出しを包まない
- **`<caption>` を必須にする**。読み上げが表の名前として使う（`aria-label` を部品が付けない）
- 並べ替えられる列は `th[data-sort]` で利用側が印を付ける。値は `text`（既定）/ `number` / `date`
- 比較キーは `td[data-value]`、無ければ `textContent.trim()`。「1,234 GB」の列は
  `data-value="1234"`、日付は `data-value="2026-09-08"` と書く（表示と比較を分ける）
- 比較: `text` は `Intl.Collator(lang, { numeric: true, sensitivity: 'base' })`（`lang` は
  最も近い `[lang]`）、`number` は `Number.parseFloat`、`date` は `Date.parse`。
  読めない値は**向きに関わらず末尾**。同値は元の順（安定）
- 向きの巡り: 未ソート → `ascending` → `descending` → `ascending` …（「無し」に戻さない。APG の例と同じ）
- 属性: `column`（0 始まり。既定 -1 = 無し）、`direction`（`ascending` / `descending`）、`manual`。
  どれも反映する。初期値が書いてあれば定義のときに並べ替え、JS から書き換えても並べ替わる
- イベント: `rd-sort`（`detail: { column, key, direction }`。`key` は `th[data-key]`）。
  **ボタンが押されたときだけ**。JS から `column` / `direction` を書き換えたときは出さない
  （利用側が起こした変化を利用側に知らせ返さない）
- `:state()`: `sorted`（`column >= 0`）/ `malformed`
- CSS part: `sort`（見出しの中のボタン）
- 行の増減には `MutationObserver`（`tbody` の `childList`）で追随して並べ替え直す。
  `manual` のときは見ない

## a11y

- 読み上げは **`aria-sort` に任せる**（`rd-live-region` を使わない。ADR-0008 §6）。
  並べ替えは押した本人が起こした変化で、`aria-sort` は次にその列を読んだときに伝わる
- `aria-sort` が付くのは並べ替え中の**1 列だけ**（APG）。他の列からは外す
- 矢印は CSS の `::after`（DOM を増やさない）。代替テキストを空にして
  （`content: '↕' / ''`）読み上げに「上下矢印」を混ぜない
- **色だけに頼らない**: 矢印の向き（↕ / ↑ / ↓）と `aria-sort` が状態を持つ。
  色は補助で、未ソートは `--rd-color-text-muted`、ソート中は `--rd-color-accent-default`
  （非文字なので 3:1）。強制配色では `ButtonText` + `[aria-sort]` に下線
- ボタンの当たり判定は 44×44（`th` の上下 padding を負の `margin-block` で打ち消して確保する）
- 行は**動かすだけ**で作り直さないので、行の中のフォーカスも選択も消えない
- 横に溢れる表は `rd-data-table` 自身が転がす（`overflow-x: auto`。WCAG 1.4.10）

## 代替案

- **複数列ソート**: 作らない。`aria-sort` は 1 列にしか付けられず（APG）、
  「第 2 キー」を読み上げで伝える標準的な形が無い。要るならサーバー側で並べ替えて `manual` にする
- **部品が行を描く（`rows` プロパティ）**: 取らない。行のマークアップを部品が持つと
  リンク・ボタン・画像を入れる利用側が困り、ティア A の「表は利用側が書く」が崩れる
- **見出しを最初から `<button>` にしておく**: 取らない（上の「なぜ定義後か」）
- **`aria-live` で「名前の昇順で並べ替えました」と読む**: 取らない（ADR-0008 §6）。
  押した本人が起こした変化を毎回読み上げるのは騒がしい
- **`.rd-table` の atoms に矢印を入れる**: 取らない。atoms は JS 無しで完結する見た目だけを持つ。
  この部品の CSS は `rd-data-table > table` に限定して足し、`.rd-table` の規則は変えない
- **ページ送り・行の選択・絞り込みを取り込む**: 取らない（上の表）
