# 提案: `rd-command`（experimental）

## 目的

「⌘K で窓を開き、打って絞って Enter で飛ぶ」入り口（shadcn の Command / cmdk に当たるもの）が無い。
noter（ノートの検索・操作）と qrcc（保存したコードの検索）の両方が要る。`rd-combobox`（025）は
**値を入力欄に確定する**部品なので、リンクへ飛ぶ／操作を実行する用途には合わない。

`rd-command` は `<label for>` + `<input type="search">` + リンクとボタンの `<ul>` を包むティア A
（ADR-0012）で、**JS が無ければ入力欄が飾りになるだけ**——全項目が見えていて、そのまま辿れる。
部品は項目を生成しない（`rd-menu` と同じで、利用側が書く）。

## API

- ティア A。契約は `rd-command > label`（必須）、`> input[type="search"]`（必須）、`> ul`（必須）。
  項目は `commandGroupMarkup({ label?, items })` と
  `commandItemMarkup({ label, href?, value?, keywords?, shortcut? })` で組む
- **グループは `<ul>` を分けるだけ**。見出しは `aria-label` から CSS の `::before` が描く
  （DOM に二重の文字を置かない＝読み上げの項目数が実際と合う）
- 属性: `filter`（`contains`（既定）/ `prefix` / `none`）、`empty-text`
- 絞り込みは `_shared/text-filter.ts`（`NFKC` + `toLocaleLowerCase()`）で combobox と同じ規則。
  検索文字列は表示テキスト + `data-keywords`（空白区切りの別名。「設定 せってい preferences」）。
  `data-keywords` は 1 つの文字列として比べるので、`prefix` では**先頭の別名だけ**が当たる
- 隠すのは `<li hidden>`。その `<ul>` の項目が全部隠れたら `<ul>` ごと隠す（見出しだけ残さない）。
  0 件のときは `<p part="empty" role="status">` を見せる（`empty-text`、既定は言語で決まる）
- キーボード:
  - 入力欄: ↓ で見えている 1 件目、↑ で最後の項目へフォーカス。Enter で 1 件目を `click()`。
    Esc は**文字が入っているときだけ**空にする（空なら外側の `rd-dialog` に渡す）。
    **印字キーと Home / End は横取りしない**（打つのとカーソル移動が入力欄の本業）
  - 項目: ↓ ↑ で見えている項目を移動（端で折り返す）、Home / End で先頭・末尾。
    **印字キーで入力欄に戻り、その 1 文字が末尾に足される**（打ち続けられる）。Backspace は 1 文字消す。
    Enter / Space / Tab / 修飾キー付きは横取りしない
- イベント: `rd-select`（`detail: { value, label }`）。値は `data-value` → `value` → `href` →
  テキストの順。**押した項目の既定動作は妨げない**（リンクは飛び、ボタンは利用側の `click` が動く）
- `:state()`: `filtering` / `empty` / `malformed`
- 項目の増減は `MutationObserver`（`childList` / `subtree` / `characterData`）で拾う。
  **`attributes` は見ない**——部品自身が書く `hidden` で呼び戻されて無限に回るのを防ぐ

## a11y

- **`aria-activedescendant` を使わない。項目は本物のリンク／ボタンのまま、フォーカスを移す**（roving）。
  cmdk は `role="option"` に書き換えるが、そうするとリンクの「Enter で飛ぶ」「⌘クリックで新しいタブ」
  「右クリックでリンクをコピー」がすべて消える。**ネイティブの意味を残すほうを選んだ**
  （ティア A の「JS 無しでも動く」という約束とも一致する）
- 入力欄には `role` を載せない（`type="search"` のまま）。`aria-controls` で `<ul>` を指すだけで、
  `aria-expanded` は載せない——一覧は**常に見えている**（開閉しない）
- **件数を読み上げない**（ADR-0008 §6。025 と同じ判断。数の案内は打つたびに騒がしい）。
  0 件だけ `role="status"` の 1 文が伝える。`<p part="empty">` は**常に描いて `hidden` で切る**
- 当たっている項目は面の色と**左の縦罫**で示す（色だけに頼らない。`combobox.css` と同じ見せ方）。
  `outline` は書かず `base.css` のフォーカスリングに任せる。強制配色では縦罫を `Highlight` にする
- 名前はネイティブの `<label for>`。グループの `<ul aria-label>` が読み上げの区切りになる

## 代替案

- **⌘K を部品が持つ**: 持たない。近道のキーはアプリごとに違い（`⌘K` / `/` / `Ctrl+K`）、
  window に listener を足す部品は取り外しの責任が曖昧になる。利用側が `keydown` を拾って
  `rd-dialog` を開く（story `InDialog` が見本。**フォーカスを入力欄へ移すのも利用側**——
  `showModal()` は帯の × にフォーカスを置く）
- **`aria-activedescendant` 方式（cmdk と同じ）**: 上のとおり採らない。将来必要になったら
  この提案を書き換える（リンクの既定動作を失う判断なので、実装より先に文章で決める）
- **`rd-combobox` を拡張する**: 混ぜない。combobox は**値を確定する**部品（`<input>` に値が入り、
  フォームに送信される）で、command は**移動・実行の入り口**（値を持たない）。
  共有するのは絞り込みの純関数（`_shared/text-filter.ts`）だけで十分
- **項目を部品が生成する（`items` プロパティ）**: しない。`rd-menu` と同じで、リンクとボタンは
  利用側が書く——ルーターの `<Link>` や `hx-` 属性を差し込めるのはそのため
- **非同期の絞り込み（`aria-busy`）**: 範囲外。`filter="none"` で利用側がサーバー側の結果を
  `<li>` に書けば `MutationObserver` が拾う
- **最近使った項目の記憶**: 範囲外（保存先を部品が決められない）
