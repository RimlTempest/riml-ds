# @rimltempest/riml-ds-astro

## 0.3.0

### Patch Changes

- [`2a83bd7`](https://github.com/RimlTempest/riml-ds/commit/2a83bd7b065dc68697917659a72cebf217d3726b) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-calendar` に **`picker` 属性**を追加（Date Picker）。月表を常設せず、`<input>` の右の 44px のボタン 1 つで開く `<div part="popover" popover role="dialog">` に入れる。新しい要素は作らない——違うのは見せ方だけなので属性 1 つで足りる
  - elements: 開くのは `popovertarget`（UA）、**Escape と外側クリックも `popover`（auto）のネイティブの light dismiss**。部品が呼ぶのは「日を選んだあとの `hidePopover()`」の 1 行だけで、`showPopover()` は呼ばない。閉じたあとのフォーカス復帰も UA の hide popover algorithm に任せる（`toggle.focus()` を自分で呼ばない）
  - elements: JS が無ければ `<input type="date">` だけの普通の入力欄に縮退する（ティア A のまま。モバイルでは OS のピッカーが出て、`min` / `max` / `required` のネイティブ検証も生きる）
  - elements: 開くボタンは `[part='toggle']`（`aria-label` は `暦を開く` / `Open calendar`、中身は `currentColor` の inline SVG）、窓は `[part='popover']`。`:state()` に **`open`** を追加。`role="dialog"` に `aria-modal` は付けない（非モーダル。light dismiss と噛み合わせる）
  - elements: `[part='header']` / `[part='grid']` の CSS から子結合子を外した（inline と popover の中の両方に当てるため）。窓の位置決めは `position-area: block-end span-inline-start` + `position-try-fallbacks: flip-block`（anchor positioning が無ければ `_shared/popover-anchor.ts` が `top` / `left` を書く）
  - wrappers: `RdCalendar` に真偽 prop `picker` が生える（react / vue / svelte / astro）

- [`68d02cb`](https://github.com/RimlTempest/riml-ds/commit/68d02cb94edeb9d373debd079d788837ecf09f8c) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-calendar`（experimental、ティア A）を追加。`<label for>` + `<input type="date">` を包み、JS が無ければ入力欄がそのまま送信され、モバイルでは OS のピッカーが出る。JS が来たときだけ同じ light DOM の末尾に `role="grid"` の月表（APG「Date Picker Dialog」の Grid）を足す。**`<input>` は隠さない**——入力欄と月表の 2 つが同じ値を指す
  - elements: 値・範囲・必須は `<input>` の属性（`value` / `min` / `max` / `required`）。ネイティブの検証がそのまま働くので JS 無しでも制約が生きる。ホスト属性は `today`（`YYYY-MM-DD`）と `week-start`（`0`（日曜、既定）〜 `6`）の 2 つだけで、どちらも見え方しか決めない
  - elements: キーボードは APG の Grid（← → ±1 日、↑ ↓ ±7 日、Home / End は週の始め・終わり、PageUp / PageDown ±1 か月、Shift 付きで ±1 年、Enter / Space で選ぶ）。gridcell は `<td>` 自身が focusable で、`tabindex="0"` は焦点のある 1 つだけ。範囲の外へフォーカスは動けるが選べない（`aria-disabled`）
  - elements: 日を選ぶと `<input>` に `input` / `change` を投げ、host から `rd-change`（`detail: { value }`）を出す。`:state()` は `selected` / `empty` / `at-min` / `at-max` / `malformed`。`--rd-calendar-cell-size` で日のタイルの一辺を変えられる（既定 `--rd-sizing-target-min`）
  - elements: 日付の計算は `Date.UTC` の往復だけで書き、タイムゾーンに依存しない。`Temporal` と週情報の `Intl` 拡張（Baseline 外）は使わない。「今日」は `today` 属性で注入できる
  - wrappers: `RdCalendar` を生成（react / vue / svelte / astro）

- [`4703572`](https://github.com/RimlTempest/riml-ds/commit/47035725935fb47ba810dac7f08864d8a6ebdc29) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-carousel`（experimental、ティア A）を追加。利用側が書いた `<ul tabindex="0"><li>…</li></ul>` を包み、**JS が無ければ `.rd-carousel` の atom と同じ横スクロールできる列**のまま。定義されてはじめて前へ／次へのボタンと `<output part="counter">` の「n / N」が末尾に足され、各 `<li>` に `aria-roledescription="slide"` と `aria-label="n / N"` が付く（`role` は書かない。`<ul>` の子は暗黙の `listitem` のまま — axe `list` / `aria-allowed-role`）
  - elements: 列そのものの役割と名前は `ElementInternals`（`role = 'group'` / `ariaRoleDescription = 'carousel'` / `ariaLabel = label`）が持つので、利用側の HTML に属性を書き足さない。`label` が無ければ `:state(unlabeled)` + `console.error`
  - elements: 属性は `label`（必須）と `loop`（boolean）。`loop` が無ければ端でボタンが `aria-disabled="true"` になる（`disabled` にはしない。フォーカスは受け取れるまま）。イベントは `rd-change`（`detail: { index }`。0 始まり）で、**ボタンでもユーザーの転がりでも**出るが `index` プロパティへの代入では出さない
  - elements: 見えている枚は `IntersectionObserver`（`root` は `<ul>`、`threshold: [0.5, 1]`）で決める。`scrollend` は Safari 26.2 以降だけ、`scrollsnapchange` は Chromium だけなので使わない
  - elements: `:state()` は `at-start` / `at-end` / `single`（1 枚以下。操作を隠す）/ `unlabeled` / `malformed`。CSS part は `controls` / `prev` / `next` / `counter`、CSS 変数は `--rd-carousel-item`（既定 `min(100%, 20rem)`）と `--rd-carousel-padding`（既定 0）
  - elements: 転がる箱は契約が `tabindex="0"` を持つので **JS 無しでも Tab で届く**（axe `scrollable-region-focusable`）。滑らかさは `@media (prefers-reduced-motion: no-preference)` の `scroll-behavior: smooth` だけが決め、JS は必ず `behavior: 'auto'` で呼ぶ。スクロールバーは隠さない
  - elements: **自動再生は作らない**（WCAG 2.2.2 / AAA 2.3.3 / 3.2.5。`docs/proposals/carousel.md`）。`.rd-carousel` の atom はそのまま残す
  - wrappers: `RdCarousel` を生成（react / vue / svelte / astro）

- [`0636092`](https://github.com/RimlTempest/riml-ds/commit/06360924b420a0b7df3edf9a31c6faa0cda4b742) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-combobox`（experimental、ティア A）を追加。`<label for>` + `<input list>` + `<datalist>` を包み、JS が無ければネイティブの `<datalist>` がそのまま候補を出す。定義後は `list` 属性を外して APG「Combobox with List Autocomplete」の形（`role="combobox"` + `[part='list']` の listbox、`aria-activedescendant`）に置き換える。候補の唯一の出どころは `<datalist>` で、`MutationObserver` が `<option>` の増減に追随する
  - elements: 絞り込みは `filter` 属性（`contains`（既定）/ `prefix` / `none`）。`NFKC` + `toLocaleLowerCase()` で正規化して比べるので `ｶﾅ` と `カナ`、`AB` と `ＡＢ` が同じ候補に当たる。0 件のときは閉じたままにして `:state(empty)` を出す
  - elements: 自由入力を許す（候補に無い値も送れる）。候補限定にしたいときは `pattern` / `required` をネイティブに書く。候補で確定したときだけ `rd-select`（`detail: { value, index }`）を出す
  - wrappers: `RdCombobox` を生成（react / vue / svelte / astro）

- [`9e5328c`](https://github.com/RimlTempest/riml-ds/commit/9e5328c5daf60fcc3155b536964176d549b9f441) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-command`（experimental、ティア A）を追加。`<label for>` + `<input type="search">` + リンクとボタンの `<ul>` を包むコマンドパレット。**JS が無くても一覧はそのまま辿れる**（入力欄が飾りになるだけ）。項目は利用側が `commandGroupMarkup()` / `commandItemMarkup()` で書く（部品は生成しない）
  - elements: 項目は**本物のリンク／ボタンのまま**で、`aria-activedescendant` ではなくフォーカスを移す（roving）。リンクの「Enter で飛ぶ」「⌘クリックで新しいタブ」がネイティブに残る。入力欄では ↓ ↑ で項目へ、Enter で 1 件目、Esc で入力を空に。項目では ↓ ↑ Home End で移動し、**印字キーで入力欄に戻って打ち続けられる**
  - elements: 絞り込みは `filter` 属性（`contains`（既定）/ `prefix` / `none`）。検索文字列は表示テキスト + `data-keywords`（空白区切りの別名）。隠すのは `<li hidden>` で、項目が全部隠れた `<ul>` も隠す。0 件のときだけ `[part="empty"]`（`role="status"`、文言は `empty-text`）を見せる。押された項目は `rd-select`（`detail: { value, label }`）で知らせ、既定動作は妨げない
  - elements: 絞り込みの純関数を `_shared/text-filter.ts` に移し、`rd-combobox` と `rd-command` で共有する（`combobox.logic.ts` は再エクスポートするだけで挙動は変わらない）
  - wrappers: `RdCommand` を生成（react / vue / svelte / astro）

- [`11bcae7`](https://github.com/RimlTempest/riml-ds/commit/11bcae76e36a8047057b4195a2c5a40f2b11fb4e) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-data-table`（experimental、ティア A）を追加。`<table class="rd-table">`（`<caption>` + `<thead>` + `<tbody>` が必須）を包み、**JS が無ければ書かれた順の表がそのまま読める**。定義されてはじめて `th[data-sort]` の中身が `<button type="button" part="sort">` になり、押すと `<tbody>` の `<tr>` が並び替わる（押せないボタンを JS 無しの見出しに置かない）
  - elements: 並べ替えられる列は `th[data-sort]`（`text`（既定）/ `number` / `date`）。比較キーは `td[data-value]`、無ければ `textContent` なので「1,234 GB」や「2026/01/02」を表示したまま機械が読める値で比べられる。`text` は最も近い `[lang]` の `Intl.Collator`（`numeric` + `sensitivity: 'base'`）、読めない値は向きに関わらず末尾、同値は元の順（安定）
  - elements: 属性は `column`（0 始まり。既定 -1 = 並べ替えていない）/ `direction`（`ascending` / `descending`）/ `manual`。初期値が書いてあれば定義のときに並べ替え、JS から書き換えても並べ替わる。向きの巡りは 未ソート → 昇順 → 降順 → 昇順（「無し」には戻さない。APG「Sortable Table」）
  - elements: `manual` は行を動かさず `aria-sort` と `rd-sort` だけを出す（サーバー側／データ側で並べ替える利用側向け。`rd-combobox` の `filter="none"` と同じ思想）。イベントは `rd-sort`（`detail: { column, key, direction }`。`key` は `th[data-key]`）で、**見出しのボタンが押されたときだけ**出る
  - elements: 読み上げは `aria-sort` に任せる（`rd-live-region` を使わない。ADR-0008 §6）。`aria-sort` が付くのは並べ替え中の 1 列だけ。矢印は `::after`（`↕` / `↑` / `↓`）で代替テキストを空にし、色だけに頼らない。`:state()` は `sorted` / `malformed`、CSS part は `sort`
  - elements: 横に溢れる表は `rd-data-table` 自身が転がす（`overflow-x: auto`。WCAG 1.4.10）。`.rd-table` の atoms は変えていない
  - wrappers: `RdDataTable` を生成（react / vue / svelte / astro）

- [`1f703f5`](https://github.com/RimlTempest/riml-ds/commit/1f703f5ea3618f81250166851361c30578ef0f09) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-radio-group`（experimental、ティア A）を追加。`<fieldset>` / `<legend>` と `<label>` が包む `<input type="radio">` に状態と文言を足す。`segmented` 属性は見た目だけをピルの区画に変え、役割・送信・矢印キーは radio のまま（JS も `:has()` も無ければ普通の radio に見える）。`radioOptionMarkup()` で選択肢を組む
  - elements: `rd-slider`（experimental、ティア A）を追加。`<input type="range">` を包み、塗りの割合を `--rd-slider-fill` に写して `<output>` に現在値を書く。`orientation="vertical"` は `writing-mode: vertical-lr` で上が最大
  - css: `patterns.css` に `.rd-input-group`（入力とボタンを 1 つのピルの枕にまとめる）を追加。JS が要らないので部品にしない（ADR-0012 §6）
  - wrappers: `RdRadioGroup` / `RdSlider` を生成

- [`f239bb1`](https://github.com/RimlTempest/riml-ds/commit/f239bb152bedebdff916233e9496346e417d652d) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-checkbox-group`（experimental、ティア A）を追加。`<fieldset>` / `<legend>` と `<label>` が包む `<input type="checkbox">` に状態と文言を足す。`segmented` は `rd-radio-group` と同じピルの区画（見た目だけ）、`min` は「1 つ以上」を部品が見る（ネイティブの検証に無い判定なので **JS が無いと効かない**。サーバ側の検証を省く理由にしない）。`value` は checked の値の配列。`checkboxOptionMarkup()` で選択肢を組む
  - elements: `rd-input-otp`（experimental、ティア A）を追加。桁ごとの `<input inputmode="numeric" maxlength="1">` を `<fieldset>` に並べ、JS 無しでも Tab で 1 桁ずつ入力して送信できる（`name-1` … `name-N` の N フィールド）。JS があるときだけ自動前進・`Backspace` で戻る・貼り付けで分配する。`otpCellsMarkup()` で桁を組む
  - css: `patterns.css` に `.rd-button-group`（ボタンの列を 1 つの沈んだ枕にまとめる）を追加。JS が要らないので部品にしない（ADR-0012 §6）。`data-orientation="vertical"` で縦並び。枕が沈んだ面なので中に `ghost` は入れない（AAA の 7:1 に届かない）
  - wrappers: `RdCheckboxGroup` / `RdInputOtp` を生成

- [`1bd5823`](https://github.com/RimlTempest/riml-ds/commit/1bd582322e0d9a2f2d7814e0d05aa5936a1c6b4d) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-popover` に `hover` を追加（Hover Card）。トリガーに乗せる / フォーカスすると遅れて開き（開く 300ms / 閉じる 200ms）、離れると遅れて閉じる。**押して開く経路（`popovertarget`）はそのまま残る**ので、キーボード・タッチ・JS 無しでは今までどおりボタンが働く。hover で開いたときは**フォーカスを奪わない**（読み中の人から取り上げない）。`role="dialog"` と見た目は変えていない
  - elements: `rd-menu` に `context` を追加（Context Menu）。`[slot="trigger"]` の面で右クリック（長押し・Shift+F10 / Menu キー）するとポインタの位置に開く。**目に見えるボタンは必ず残る**（APG）。キーボードからの `contextmenu` は座標が 0 なのでトリガーに寄せる。閉じると位置を忘れて `anchor-name` に戻る
  - elements: `hover` / `context` を付けないときの `rd-popover` / `rd-menu` の挙動は変わらない
  - css: `navigation.css` に `.rd-nav-menu` を追加。ページの主要ナビの帯で、面は surface（窓の帯 `.rd-menubar` は chrome のまま）。現在地は `aria-current` を太字 + 下の縦罫で示し、`48rem` 未満では折り返さず横に流れる。強制配色では下線に置き換わる
  - wrappers: `RdPopover` に `hover?: boolean`、`RdMenu` に `context?: boolean` が出る

- [`506d555`](https://github.com/RimlTempest/riml-ds/commit/506d5558c1b58d120c63302eb150c498356e8543) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - css: `patterns.css` に窓 `.rd-window` / `.rd-window-title` / `.rd-window-body` を追加（帯 + 丸 3 つ、`data-tone`）。`hr` を点線に、見出しを display スタックに
  - elements: ボタンをピル・太字・枠なしに（hover / active を追加）。入力・チェックボックス・スイッチ・開閉・ダイアログ・トーストを「まど」の形に
  - elements: `rd-meter`（experimental、ティア A）を追加。`<meter>` / `<progress>` を包み `--rd-meter-fill` を書く
  - wrappers: `RdMeter` を生成

- [`fc300d0`](https://github.com/RimlTempest/riml-ds/commit/fc300d065980483223da19e4a52d29f497b335b6) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-tabs`（experimental、ティア B）を追加。JS が無ければページ内リンクの列として動き、パネルはすべて見える。JS が来たら tablist / tab / tabpanel と roving tabindex・自動活性化を足す。`variant="line" | "browser"`、`orientation`、`selected`、`rd-change`
  - elements: `rd-menu`（experimental、ティア B）を追加。`popovertarget` + `[popover]` で **JS 無しでも開閉する**。JS が来たら `role="menu"` / `menuitem`、`aria-haspopup` / `aria-expanded`、↑ ↓ / Home / End の roving tabindex、開いたら最初の項目・閉じたらトリガーへのフォーカス移動を足す。`label`、`placement="start" | "end"`、`rd-select` `{ index, href }`
  - elements: `rd-popover`（experimental、ティア B）を追加。`rd-menu` と同じ骨格で中身は自由。**非モーダル**の `role="dialog"` で、見出し（`[slot="label"]`）が名前になる。開いたら中の最初の行き先へ、閉じたらトリガーへフォーカスが戻る。`placement`、`rd-toggle` `{ open }`
  - elements: `rd-tooltip`（experimental、ティア C）を追加。`for` の相手に `aria-describedby` を足し、ホバーだけに頼らずフォーカスでも出す。Esc で閉じ、吹き出し自身に乗っても消えない（WCAG 1.4.13）。`--rd-tooltip-delay`
  - css: `navigation.css` を追加（`.rd-breadcrumb` / `.rd-pagination` / `.rd-nav-rail` / `.rd-menubar` / `.rd-sidebar`）。ARIA は利用側の HTML が持ち、現在地は太さ・面・位置で示す
  - wrappers: `RdTabs` / `RdMenu` / `RdPopover` を生成（React のみ正しく出る。Vue / Svelte / Astro は生 HTML の差し込みを既定 slot として 2 回描くため要修正）

- [`c73b8d4`](https://github.com/RimlTempest/riml-ds/commit/c73b8d473e309275426a2f4c2fe2aa1b00c8cef4) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-number-field`（experimental、ティア A）を追加。`<label for>` と `<input type="number">` を包み、**44px の − / + ボタン**と刻みの丸めだけを足す。値・範囲（`min` / `max` / `step`）・送信・検証・↑↓ キーの刻みはネイティブのままなので、JS が無ければ「ボタンの無い普通の数値入力」に縮退する
  - elements: 刻みは `number-field.logic.ts` の純関数が決める（ネイティブの `stepUp()` は呼ばない）。空欄は 0 から刻んで `min` / `max` で止め、`step` と現在値の桁数の大きい方で丸めるので `0.2 + 0.1` は `0.3` になる。`step="any"` は 1 刻みとして扱う。端に着いたボタンはネイティブの `disabled` になる
  - elements: − / + は `tabindex="-1"`（キーボードは入力欄の ↑↓ で刻む。APG Spinbutton / react-aria と同じ）。押すと `<input>` から `input` → `change` が上がる——**独自イベントは出さない**（購読は `<input>` に付ける）。`value` / `valueAsNumber` は `<input>` への委譲で、`stepUp()` / `stepDown()` は例外を投げない
  - elements: ヒント・エラー文言と `:state()` は `_shared/field.ts` をそのまま使う（`invalid` / `errored` / `hinted` / `filled` / `malformed`）。`@csspart stepper` / `decrement` / `increment` / `hint` / `error`、`@cssprop --rd-number-field-gap`
  - wrappers: `RdNumberField` を生成（`min` / `max` / `step` / `required` / `defaultValue` / `hint` / `error`）

- [`e3f92e2`](https://github.com/RimlTempest/riml-ds/commit/e3f92e2047f75bead3ae4d2d427a7047fc6ec4dc) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-splitter`（experimental、ティア B）を追加。`slot="start"` と `slot="end"` の 2 面のあいだに WAI-ARIA APG「Window Splitter」の `role="separator"` のつまみを 1 つ置き、つまみを動かすと 2 面の割合が変わる。JS が無いあいだは 2 面が縦に積まれて両方読め、つまみは 1 つも現れない（`:not(:defined)`）
  - elements: `direction`（`horizontal`（既定。面が横に並ぶ）/ `vertical`）・`position`（%。既定 50。反映される属性）・`min`（20）・`max`（80）・`label`（つまみの名前。必須）。**`aria-orientation` は `direction` と逆になる**（横に並ぶ 2 面のあいだの仕切りは縦線。`docs/proposals/splitter.md`）
  - elements: キーは APG のとおり ← → / ↑ ↓ で 1%、Shift で 10%、Home → `min`、End → `max`（RTL の横並びは ← → を反転）。扱わないキーは横取りしない。ドラッグは `setPointerCapture` を取るので面の外へ出ても追従する
  - elements: 利用者の操作で割合が変わったときだけ `rd-resize`（`detail: { position }`）を出す。JS からの `position` 書き換えでは出さない。`pointermove` ごとに出るので、間引きが要るなら利用側で間引く
  - elements: つまみの標的は 44px（WCAG 2.5.5 AAA）。見える太さは `--rd-splitter-size`（既定 `var(--rd-space-2)`）のままで、透明な当たり領域だけを `var(--rd-sizing-target-min)` に広げる
  - wrappers: `RdSplitter` を生成（react / vue / svelte / astro）

- [`5175fed`](https://github.com/RimlTempest/riml-ds/commit/5175fed025fd6bd9d9dd8d5a257d1427fc954883) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - css: `atoms.css` に `.rd-card` / `.rd-empty` / `.rd-spinner` / `.rd-accordion` / `.rd-carousel` / `.rd-scroll-area` を追加。JS が要らないので部品にしない（ADR-0012 §6）。待ちの輪は罫線で描き、回転は `prefers-reduced-motion: no-preference` の中だけ。転がる入れ物の細いスクロールバーは `@supports (scrollbar-width: thin)` の中で、強制配色では既定に戻す
  - css: `utilities.css` に `.rd-aspect`（比を固定した入れ物。比は `--rd-aspect`、`data-ratio="1" | "4-3"`）を追加
  - elements: `rd-dialog` に `alert` と `placement` を追加。`alert` は `role="alertdialog"` にして背面クリックだけを止める（Esc と帯の × は効く）。`placement="start" | "end" | "bottom"` は窓を画面の端に着ける帯（Sheet / Drawer）で、`:state(start|end|bottom)` が付く。既定（`center`）の見た目と既存の API（`open` / `persistent` / `show()` / `close()` / `rd-dismiss`）は変わらない
  - wrappers: `RdDialog` に `alert` / `placement` の props を生成

- [`3739d5b`](https://github.com/RimlTempest/riml-ds/commit/3739d5bee8a5f6d9b368ab9cddb2b582151d4aa9) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-toggle-group`（experimental、ティア A）を追加。`<fieldset>` / `<legend>` と `<button aria-pressed>` の列を包み、**送信には載せない**押下ボタンの列（書式ツールバーの B / I / U、表示切替の「一覧 / カード」）にする。部品がするのは 3 つだけ：`mode="single"` のとき他の `aria-pressed` を `false` に戻す、矢印 / Home / End で列の中を移動する（roving tabindex。APG「Toolbar」。`disabled` は飛ばし、扱わないキーでは `preventDefault()` しない）、`rd-change`（`detail: { values }`）を投げる。`single` でも押されている項目をもう一度押せば解除できる（0 個を許す）
  - elements: 押下の真実は各 `<button>` の `aria-pressed` 属性で、`values` プロパティは getter / setter がそこへ委譲するだけ。`values` setter と外からの属性書き換えでは `rd-change` を出さない（ユーザー操作だけ）。`toggleGroupMarkup()` / `toggleItemMarkup()` でマークアップを組む（`aria-pressed` は省略時 `"false"`）。属性は `mode`（`multiple` 既定 / `single`）、`orientation`（`horizontal` 既定 / `vertical`）、`variant`（`outline` 既定 / `ghost`。`rd-toggle` と同じ名前）。無効化はネイティブの `<button disabled>` に任せる
  - elements: JS が無いときは「押しても変わらない普通のボタンの列」に縮退する（`tabindex` は JS が付けるので全部 Tab で辿れる）。**送信に載せる値には使わない** —— `rd-radio-group segmented`（単一）/ `rd-checkbox-group segmented`（複数）を使う
  - wrappers: `RdToggleGroup` を生成（`mode` / `orientation` / `variant`）

- [`99bb482`](https://github.com/RimlTempest/riml-ds/commit/99bb482bcb5cd8c3dca98064a392e2feebc5c54f) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - **破壊的（0.x）**: 窓の帯を「帯 = 見出し」から「帯 ⊃ 見出し」に変えた（ADR-0014）。
  css: `.rd-window-bar` / `.rd-window-controls` / `.rd-window-control[data-action]` を追加し、
  `.rd-window-title::before` の丸（`radial-gradient`）を削除。`data-tone` の付け先が見出しから帯へ移った。
  移行は `docs/migration.md`「0.2 → 0.3: 窓の帯」
  - elements: `rd-window`（experimental、ティア B）を追加。閉じる / 広げる / たたむの丸は**本物の `<button>`**で、
    `closable` / `expandable` / `collapsible` / `collapsed` / `expanded` / `tone` と
    `rd-dismiss` / `rd-toggle` / `rd-expand`。見出しは `slot="title"` に利用側が置く
  - elements: `rd-dialog` の帯の左端に ×（閉じる）を追加（`persistent` では出さない）。
    `rd-dismiss` の `reason` に `'button'` が増え、part に `bar` / `controls` / `close` が増えた
  - elements: `rd-meter` の塗りの端を丸くした（トラックだけでなく塗りもピルになる）
  - wrappers: `RdWindow` を生成

- [`9ba20ba`](https://github.com/RimlTempest/riml-ds/commit/9ba20ba256cc3543761e094ae437c62758852d51) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - wrappers: 契約の木の**名前つき `{ raw }`** が既定 slot に潰れて同じ子を 2 回描いていたのを直した。`rd-menu` は `trigger` / `items`、`rd-popover` は `trigger`、`rd-tabs` は `tabs` / `panels` を名前つき slot で受ける（Svelte は `{#snippet trigger()}`、Vue は `<template #trigger>`、Astro は `slot="trigger"`）。`$children` は今までどおり既定 slot で、他の部品の生成物は変わらない
  - wrappers: ハイフンを含む属性（`aria-pressed` など）を prop に結んだ木が Vue で構文エラーになっていたのを直し、`button` の `aria-pressed` を `'true' | 'false'` に絞るようにした
  - astro: `package.json` の `exports` を `bun run gen` が書くようにし、experimental の `.astro` を 7 個追加で公開（`menu` / `meter` / `popover` / `radio-group` / `slider` / `tabs` / `window`）。これまで手書きで、10 個あるうち 3 個しか import できなかった
- Updated dependencies [[`2a83bd7`](https://github.com/RimlTempest/riml-ds/commit/2a83bd7b065dc68697917659a72cebf217d3726b), [`68d02cb`](https://github.com/RimlTempest/riml-ds/commit/68d02cb94edeb9d373debd079d788837ecf09f8c), [`4703572`](https://github.com/RimlTempest/riml-ds/commit/47035725935fb47ba810dac7f08864d8a6ebdc29), [`0636092`](https://github.com/RimlTempest/riml-ds/commit/06360924b420a0b7df3edf9a31c6faa0cda4b742), [`9e5328c`](https://github.com/RimlTempest/riml-ds/commit/9e5328c5daf60fcc3155b536964176d549b9f441), [`50ab1f3`](https://github.com/RimlTempest/riml-ds/commit/50ab1f35d34af541e5efb5660fcbcb395400de3a), [`11bcae7`](https://github.com/RimlTempest/riml-ds/commit/11bcae76e36a8047057b4195a2c5a40f2b11fb4e), [`bf712c2`](https://github.com/RimlTempest/riml-ds/commit/bf712c250b1ebb0409c823cb0a3fecc9bf4dfe31), [`1f703f5`](https://github.com/RimlTempest/riml-ds/commit/1f703f5ea3618f81250166851361c30578ef0f09), [`f239bb1`](https://github.com/RimlTempest/riml-ds/commit/f239bb152bedebdff916233e9496346e417d652d), [`1bd5823`](https://github.com/RimlTempest/riml-ds/commit/1bd582322e0d9a2f2d7814e0d05aa5936a1c6b4d), [`506d555`](https://github.com/RimlTempest/riml-ds/commit/506d5558c1b58d120c63302eb150c498356e8543), [`fc300d0`](https://github.com/RimlTempest/riml-ds/commit/fc300d065980483223da19e4a52d29f497b335b6), [`c73b8d4`](https://github.com/RimlTempest/riml-ds/commit/c73b8d473e309275426a2f4c2fe2aa1b00c8cef4), [`2add6f1`](https://github.com/RimlTempest/riml-ds/commit/2add6f1b9318276bb3c5ff700aeb695646863752), [`e3f92e2`](https://github.com/RimlTempest/riml-ds/commit/e3f92e2047f75bead3ae4d2d427a7047fc6ec4dc), [`5175fed`](https://github.com/RimlTempest/riml-ds/commit/5175fed025fd6bd9d9dd8d5a257d1427fc954883), [`9543954`](https://github.com/RimlTempest/riml-ds/commit/954395469c083173324c7da498248587df90728c), [`3739d5b`](https://github.com/RimlTempest/riml-ds/commit/3739d5bee8a5f6d9b368ab9cddb2b582151d4aa9), [`dcf0d36`](https://github.com/RimlTempest/riml-ds/commit/dcf0d36013cc6687584735dbc0f5513f6fa8a547), [`99bb482`](https://github.com/RimlTempest/riml-ds/commit/99bb482bcb5cd8c3dca98064a392e2feebc5c54f)]:
  - @rimltempest/riml-ds-elements@0.3.0
  - @rimltempest/riml-ds-tokens@0.3.0
  - @rimltempest/riml-ds-css@0.3.0

## 0.2.0

### Minor Changes

- [`4861471`](https://github.com/RimlTempest/riml-ds/commit/4861471786cc9c05f109315ee8826353b5c0aaa7) Thanks [@RimlTempest](https://github.com/RimlTempest)! - **`@status experimental` の部品を専用サブパスに分けた**（ADR-0009）。`rd-select` / `rd-checkbox` /
  `rd-disclosure` のラッパーは root の index から出なくなり、import 先が変わる（0.x なので minor で入れる）。

  ```diff
  - import { RdButton, RdSelect } from '@rimltempest/riml-ds-react'
  + import { RdButton } from '@rimltempest/riml-ds-react'
  + import { RdSelect } from '@rimltempest/riml-ds-react/experimental'
  ```

  | fw     | stable                | experimental                                   |
  | ------ | --------------------- | ---------------------------------------------- |
  | react  | `.` / `./client`      | `./experimental` / `./client/experimental`     |
  | vue    | `.`（`rdComponents`） | `./experimental`（`rdExperimentalComponents`） |
  | svelte | `.`                   | `./experimental`                               |
  | astro  | `./<name>.astro`      | `./experimental/<name>.astro`                  |
  - Vue の `rdDesignSystem` プラグインが `app.component()` するのは **stable だけ**になった。
    experimental は `rdExperimentalComponents` を利用側が明示的に登録する。`GlobalComponents` の
    型も登録される部品だけを持つ（`<rd-*>` を直接書くときの `IntrinsicElementAttributes` は全部品のまま）
  - `<rd-*>` をタグで直接書くときの型（React の `IntrinsicElements`、svelte の `svelteHTML`）は
    全部品を持ち続ける
  - **Vue の `v-model` が `<select>` / `<textarea>` でも効くようになった。**
    生成する `onInput` が `HTMLInputElement` のときしか `update:modelValue` を emit しておらず、
    `rd-select` に `v-model` を付けても値が返ってこなかった

### Patch Changes

- Updated dependencies [[`c5e056e`](https://github.com/RimlTempest/riml-ds/commit/c5e056e722d9f7872997a577d80f67072474f4c3), [`4861471`](https://github.com/RimlTempest/riml-ds/commit/4861471786cc9c05f109315ee8826353b5c0aaa7), [`c5e056e`](https://github.com/RimlTempest/riml-ds/commit/c5e056e722d9f7872997a577d80f67072474f4c3), [`ff7952b`](https://github.com/RimlTempest/riml-ds/commit/ff7952b2ce090ea157ca1cdeb032789380f1c3ba), [`5fa23c6`](https://github.com/RimlTempest/riml-ds/commit/5fa23c6a90de82a6f46a6a83d97d1de5142d1234)]:
  - @rimltempest/riml-ds-elements@0.2.0
  - @rimltempest/riml-ds-tokens@0.2.0
  - @rimltempest/riml-ds-css@0.2.0
