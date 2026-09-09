# 提案: `rd-calendar`（experimental）

## 目的

riml-ds には日付を扱う部品が 1 つも無く、利用側（noter の期限、qrcc の有効期限）は素の
`<input type="date">` を置いている。素の日付欄は **JS 無しで動き、送信に載り、モバイルでは OS の
ピッカーが出る**——これは捨てない。足りないのは **デスクトップで月を見渡して選ぶ UI** と、
**ブランドの見た目**（cream の窓・丸いタイル）だけである。

`rd-calendar` は `<label for>` + `<input type="date">` を包む**ティア A**（ADR-0012）で、
JS が来たときだけ同じ light DOM の末尾に `role="grid"` の月表（APG「Date Picker Dialog」の
Grid の部分）を足す。ポップオーバーに入れた Date Picker は 034 で、この部品に `popover` の姿を
足して作る。

## API

- ティア A。契約は `rd-calendar > label`（必須）、`> input[type="date"]`（必須）。
  マークアップは `calendarMarkup({ id, label, name?, defaultValue?, today?, weekStart?, min?, max?, required? })`
- ホスト属性は `today`（`YYYY-MM-DD`）と `week-start`（`0`（日曜、既定）〜 `6`）の 2 つだけ。
  **どちらも見え方しか決めない**
- **値・範囲・必須は `<input>` の属性**（`value` / `min` / `max` / `required`）。部品は読むだけ
- 描く木: `[part='header']`（`[part='prev']` / `[part='title']` / `[part='next']`）と
  `[part='grid']`（`<table role="grid">`。`<td role="gridcell" data-iso>`）
- キーボード（APG Date Picker の Grid）: ← → ±1 日、↑ ↓ ±7 日、Home / End は週の始め・終わり
  （`week-start` 基準）、PageUp / PageDown ±1 か月、Shift 付きで ±1 年、Enter / Space で選ぶ
- イベント: 日を選ぶと `<input>` に `input` と `change` を投げ、host から `rd-change`
  （`detail: { value }`）を出す。**同じ日をもう一度押しても出す**（解除はしない）
- `:state()`: `selected` / `empty` / `at-min` / `at-max` / `malformed`
- `value` の getter / setter と `checkValidity()` / `reportValidity()` は `<input>` へ委譲する
- 日付の計算は `calendar.logic.ts` の純関数（`Date.UTC` の往復だけ）。DOM の読み書きと
  テンプレートは `calendar.dom.ts`。`*.element.ts` は 150 行の殻（ADR-0005）

## 決めたこと

### `<input type="date">` を隠さない

shadcn の Date Picker は入力欄をボタンに置き換えるが、この部品は**入力欄をそのまま見せる**。
ティア A の約束は「JS 無しで**動く**」ことで、JS が来る前の唯一の入力手段が `<input>` だからである。
JS が来たあとも入力欄は消さない——キーボードで日付を打つほうが速い人がいて、モバイルでは
OS のピッカーが出る。月表は「もう 1 つの入力面」であって、置き換えではない。

### ティア A（light DOM に月表を描く）

`<input>` を包む契約はティア A 以外を選べない（ADR-0012 決定 1、`scripts/guard.sh` 規則 9）。
それだけでなく、**shadow だと `<label for>` も `aria-labelledby` も境界を越えない**——
月表を shadow に描くと、grid に名前を付ける手段が `aria-label` への文字列の複写しか無くなる。
light DOM に描けば、利用側が書いた `<label>` に `id` を付けて `aria-labelledby` で指すだけで済む
（名前の出どころが 1 つになる）。スタイルは `calendar.css`（`@layer rd.components`）だけに置く。

### `min` / `max` / `required` はホストではなく `<input>` の属性

ネイティブの検証がそのまま働き、**JS 無しでも制約が生きる**（送信が止まり、ブラウザの吹き出しが
理由を言う）。部品は `input.min` / `input.max` を読んで升目に `aria-disabled` を付けるだけで、
検証には関わらない。`MutationObserver` は `min` / `max` の**属性**だけを見る
（`value` はプロパティで書かれると属性が動かないので、追随は `input` イベントで行う）。

### gridcell は `<td>` 自身が focusable（`<button>` を入れない）

`aria-selected` は gridcell に置く必要があり、`<td>` の中に `<button>` を入れると
「選ばれている」を持つ要素とフォーカスを持つ要素がずれる。APG「Date Picker Dialog」も
`<td tabindex>` を使う。`tabindex="0"` は焦点のある 1 つだけ（roving tabindex）で、
月の外の升目は `aria-hidden="true"` の空欄にして読み上げから外す。

### 月の見出しは `<p>`（`<h2>` にしない）

部品は利用側の見出し階層を知らない。`<h2>` を勝手に出すと見出しの飛び級になる。
月が変わったことは `aria-live="polite"` が伝える（APG と同じ）。
これは ADR-0008 §6「部品に `aria-live` を書かない」の例外で、理由は
**grid の中でフォーカスが動くだけでは月の変化が読まれない**から——`rd-live-region` に
渡すと「アプリの知らせ」と混ざるので、見出しそのものを live にした。

### `Temporal` と週情報の `Intl` 拡張を使わない

どちらも Baseline 外（`docs/baseline.md`）。日付の計算は `Date.UTC` + `getUTC*` だけで書き、
**タイムゾーンに依存しない**（ローカル時刻の `Date` を 1 つも作らない）。週の始まりは
`week-start` 属性で受ける。月名・曜日名・日の読みは `Intl.DateTimeFormat` に任せるが、
必ず `timeZone: 'UTC'` を付ける。

### 「今日」は属性で注入する

`today` があればそれ、無ければ実時刻。実時刻を読むのは element の 1 箇所だけで、
テスト・story・e2e は必ず `today` を書く（書き忘れると年が変わった日に VRT が落ちる）。

## a11y

- 名前はネイティブの `<label for>`。grid は同じ `<label>` を `aria-labelledby` で指す
  （`aria-label` への複写をしない＝名前の出どころが 1 つ）
- 範囲の外へ**フォーカスは動ける**が選べない（`aria-disabled="true"`。APG と同じ）
- 行き止まりの月送りボタンは `disabled` にせず `aria-disabled`（Tab で止まって理由が分かる）
- Tab 順は自然な DOM 順（`<input>` → 前の月 → 次の月 → 焦点のある gridcell）。
  `tabindex` の並べ替えはしない
- 「今日」は色だけでなく**枠**でも示す（`accessibility.md` 9）。強制配色では
  `SelectedItem` / `CanvasText` に置き換える
- 日のタイルは 44×44 以上（`--rd-calendar-cell-size`、既定 `--rd-sizing-target-min`）

## 代替案

- **ティア B（shadow に grid を描く）**: 選べない。`<input>` を包む契約は guard 規則 9 が落とし、
  `<label for>` と `aria-labelledby` が境界を越えない
- **部品が値を持つ（form-associated custom element）**: 選ばない。値の真実は `<input>` 1 つで、
  部品の `#selected` は描画用のコピーにすぎない。外から変えるときは `element.value = …` か
  「`input.value = …` + `input` イベント」のどちらかを使う
- **範囲選択・複数選択・時刻・年月のドロップダウン**: この提案には入れない（035 以降）
- **和暦・他の暦**: `Intl` の `calendar` オプションには触れない。必要になったら別の提案で決める

## 034 への道筋

034（Date Picker）は **この部品に `popover` 属性を足し、header + grid を `[popover]` に入れて
開くボタンを 1 つ描く**だけで作る。暦側に「閉じる」責務は足さない（`rd-change` を受けて
`hidePopover()` するのは 034 の element 側の 1 行）。
