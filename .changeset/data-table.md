---
'@rimltempest/riml-ds-elements': minor
'@rimltempest/riml-ds-react': patch
'@rimltempest/riml-ds-vue': patch
'@rimltempest/riml-ds-svelte': patch
'@rimltempest/riml-ds-astro': patch
---

- elements: `rd-data-table`（experimental、ティア A）を追加。`<table class="rd-table">`（`<caption>` + `<thead>` + `<tbody>` が必須）を包み、**JS が無ければ書かれた順の表がそのまま読める**。定義されてはじめて `th[data-sort]` の中身が `<button type="button" part="sort">` になり、押すと `<tbody>` の `<tr>` が並び替わる（押せないボタンを JS 無しの見出しに置かない）
- elements: 並べ替えられる列は `th[data-sort]`（`text`（既定）/ `number` / `date`）。比較キーは `td[data-value]`、無ければ `textContent` なので「1,234 GB」や「2026/01/02」を表示したまま機械が読める値で比べられる。`text` は最も近い `[lang]` の `Intl.Collator`（`numeric` + `sensitivity: 'base'`）、読めない値は向きに関わらず末尾、同値は元の順（安定）
- elements: 属性は `column`（0 始まり。既定 -1 = 並べ替えていない）/ `direction`（`ascending` / `descending`）/ `manual`。初期値が書いてあれば定義のときに並べ替え、JS から書き換えても並べ替わる。向きの巡りは 未ソート → 昇順 → 降順 → 昇順（「無し」には戻さない。APG「Sortable Table」）
- elements: `manual` は行を動かさず `aria-sort` と `rd-sort` だけを出す（サーバー側／データ側で並べ替える利用側向け。`rd-combobox` の `filter="none"` と同じ思想）。イベントは `rd-sort`（`detail: { column, key, direction }`。`key` は `th[data-key]`）で、**見出しのボタンが押されたときだけ**出る
- elements: 読み上げは `aria-sort` に任せる（`rd-live-region` を使わない。ADR-0008 §6）。`aria-sort` が付くのは並べ替え中の 1 列だけ。矢印は `::after`（`↕` / `↑` / `↓`）で代替テキストを空にし、色だけに頼らない。`:state()` は `sorted` / `malformed`、CSS part は `sort`
- elements: 横に溢れる表は `rd-data-table` 自身が転がす（`overflow-x: auto`。WCAG 1.4.10）。`.rd-table` の atoms は変えていない
- wrappers: `RdDataTable` を生成（react / vue / svelte / astro）
