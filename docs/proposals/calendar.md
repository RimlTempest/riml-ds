# 提案: `rd-calendar`（experimental）

## 目的

riml-ds には日付を扱う部品が 1 つも無く、利用側（noter の期限、qrcc の有効期限）は素の
`<input type="date">` を置いている。素の日付欄は **JS 無しで動き、送信に載り、モバイルでは OS の
ピッカーが出る**——これは捨てない。足りないのは **デスクトップで月を見渡して選ぶ UI** と、
**ブランドの見た目**（cream の窓・丸いタイル）だけである。

`rd-calendar` は `<label for>` + `<input type="date">` を包む**ティア A**（ADR-0012）で、
JS が来たときだけ同じ light DOM の末尾に `role="grid"` の月表（APG「Date Picker Dialog」の
Grid の部分）を足す。ポップオーバーに入れた Date Picker は 034 で、この部品に **`picker` 属性**を
足して作った（下の「034 の結果」）。

## API

- ティア A。契約は `rd-calendar > label`（必須）、`> input[type="date"]`（必須）。
  マークアップは `calendarMarkup({ id, label, name?, defaultValue?, today?, weekStart?, min?, max?, required?, picker? })`
- ホスト属性は `today`（`YYYY-MM-DD`）・`week-start`（`0`（日曜、既定）〜 `6`）・`picker`（034）の 3 つだけ。
  **どれも見え方しか決めない**
- **値・範囲・必須は `<input>` の属性**（`value` / `min` / `max` / `required`）。部品は読むだけ
- 描く木: `[part='header']`（`[part='prev']` / `[part='title']` / `[part='next']`）と
  `[part='grid']`（`<table role="grid">`。`<td data-iso>`）。`picker` のときは両方が
  `[part='popover']`（`popover role="dialog"`）の中に入り、`[part='toggle']` が 1 つ増える
- キーボード（APG Date Picker の Grid）: ← → ±1 日、↑ ↓ ±7 日、Home / End は週の始め・終わり
  （`week-start` 基準）、PageUp / PageDown ±1 か月、Shift 付きで ±1 年、Enter / Space で選ぶ
- イベント: 日を選ぶと `<input>` に `input` と `change` を投げ、host から `rd-change`
  （`detail: { value }`）を出す。**同じ日をもう一度押しても出す**（解除はしない）
- `:state()`: `selected` / `empty` / `at-min` / `at-max` / `malformed` / `open`（`picker` で開いている）
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

## 034 の結果（Date Picker）

034 は **新しい要素を作らず、この部品に `picker` 属性を足した**。`picker` のとき、header + grid を
`<div part="popover" popover role="dialog">` に入れ、`<input>` の右に 44px の開くボタン
（`popovertarget`）を 1 つ描く。JS が無ければ `<input type="date">` だけの普通の入力欄に縮退する
（ティア A の約束はそのまま。OS のピッカーが出る）。

### なぜ新しい要素ではなく属性か

月表・キーボード・範囲・`rd-change`——`rd-date-picker` に要るものは `rd-calendar` に全部ある。
別の要素にすると同じ純関数を 2 つの殻が使い、契約とラッパーとテストが二重になる。
違うのは**月表を常設するか、1 つのボタンで開くか**という見せ方だけなので、属性 1 つで足りる。

### なぜホスト属性の名前が `popover` ではなく `picker` か

`popover` は HTML の**グローバル属性**である。`<rd-calendar popover>` と書くとホスト自身が
popover になり、`showPopover()` を呼ばない限り **画面から消える**。`date-picker` にすると
ラッパーの prop が `datePicker` になって部品名と紛れるので、`picker` にした
（033 の「034 への道筋」では `popover` と書いていたが、この理由で変えた）。

### なぜ `popover`（auto）で `aria-modal` を付けないか

Date Picker に期待されるのは「Escape で閉じる」「外を押したら閉じる」——どちらも
`popover`（auto）の**ネイティブの light dismiss** がやる。APG「Date Picker Dialog」はモーダル
（`aria-modal="true"` + フォーカストラップ）だが、モーダルにすると後ろが操作できなくなり
light dismiss と噛み合わない。`role="dialog"` は残し、名前は `<label>` を `aria-labelledby` で
指す（grid と同じ出どころ）。

### なぜ閉じたときのフォーカス復帰を UA に任せるか

`popovertarget` で開いた popover は、閉じるときフォーカスが中にあれば UA が invoker
（開くボタン）へ戻す（HTML 仕様 hide popover algorithm）。自分で `toggle.focus()` を呼ぶと
UA の復帰と二重になり、**外を押して閉じた人のフォーカスまで奪う**。
部品が呼ぶのは「日を選んだあとの `hidePopover()`」の 1 行だけで、`showPopover()` は呼ばない
（開閉の主導権を 2 つにしない）。

### アイコンは inline SVG（絵文字や記号を使わない）

開くボタンはアイコンだけなので `aria-label`（`暦を開く` / `Open calendar`）で名前を付け、
中身は `currentColor` の inline SVG（`aria-hidden`）にした。`▦` や絵文字は CI の Chromium
（`fonts-noto-cjk` だけ）に字形が無く、VRT が環境で揺れる。

### 位置決めは `position-area: block-end span-inline-start`

開くボタンは行の**終端**にあるので、月表はその終端に揃えて下へ開く。`span-inline-end`
（`rd-popover` / `rd-menu` の既定）だと、ボタンの始端から画面の終端までの狭い帯が
position-area になり、月表（`max-content` で 366px）が**インライン方向に溢れる**。
溢れると Chromium は `position-try-fallbacks: flip-block` を採らず、下にはみ出したまま留まる
（画面の下に月の後半が隠れて押せない）。始端側に span させると溢れなくなり、下に入らないときは
`flip-block` が上へ倒してくれる。anchor positioning が無い環境では `_shared/popover-anchor.ts` が
`top` / `left` を書く（そちらは元から「入らなければ反対側」を見ている）。

### `[part='header']` / `[part='grid']` の CSS は子結合子を外した

inline のときはホスト直下、`picker` のときは `[part='popover']` の中——同じ宣言が両方に当たる
必要があるので、`rd-calendar > [part='header']` を `rd-calendar [part='header']` にした。
**`>` を戻さないこと**（popover に入れた途端に枠と余白が外れる）。
