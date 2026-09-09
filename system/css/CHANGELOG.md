# @rimltempest/riml-ds-css

## 0.3.0

### Minor Changes

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

- [`5175fed`](https://github.com/RimlTempest/riml-ds/commit/5175fed025fd6bd9d9dd8d5a257d1427fc954883) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - css: `atoms.css` に `.rd-card` / `.rd-empty` / `.rd-spinner` / `.rd-accordion` / `.rd-carousel` / `.rd-scroll-area` を追加。JS が要らないので部品にしない（ADR-0012 §6）。待ちの輪は罫線で描き、回転は `prefers-reduced-motion: no-preference` の中だけ。転がる入れ物の細いスクロールバーは `@supports (scrollbar-width: thin)` の中で、強制配色では既定に戻す
  - css: `utilities.css` に `.rd-aspect`（比を固定した入れ物。比は `--rd-aspect`、`data-ratio="1" | "4-3"`）を追加
  - elements: `rd-dialog` に `alert` と `placement` を追加。`alert` は `role="alertdialog"` にして背面クリックだけを止める（Esc と帯の × は効く）。`placement="start" | "end" | "bottom"` は窓を画面の端に着ける帯（Sheet / Drawer）で、`:state(start|end|bottom)` が付く。既定（`center`）の見た目と既存の API（`open` / `persistent` / `show()` / `close()` / `rd-dismiss`）は変わらない
  - wrappers: `RdDialog` に `alert` / `placement` の props を生成

- [`dcf0d36`](https://github.com/RimlTempest/riml-ds/commit/dcf0d36013cc6687584735dbc0f5513f6fa8a547) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - tokens: `type.display` / `type.heading.3` / `type.heading.4`（display は流体、heading.4 は固定）、`line.height.display`、`letter.spacing.{normal,wide}` を追加
  - css: `typography.css` を追加。`.rd-display` / `.rd-heading-1..4` / `.rd-body` / `.rd-small` / `.rd-caption` / `.rd-label` / `.rd-mono` / `.rd-numeric` / `.rd-truncate` / `.rd-clamp` / `.rd-prose`。見出しレベル（`h1`..`h6`）とは独立した「見た目のクラス」
  - css: `atoms.css` を追加。JS が要らない静的パターン（`.rd-badge` / `.rd-dot` / `.rd-avatar` / `.rd-separator` / `.rd-skeleton` / `.rd-kbd` / `.rd-tile` / `.rd-icon-button` / `.rd-toolbar` / `.rd-list` / `.rd-table` / `.rd-alert` / `.rd-legend`）
  - css: `exports` に `./typography.css` と `./atoms.css` を追加。`@rimltempest/riml-ds-tokens` を `peerDependenciesMeta` で optional にし、npm 未公開の tokens を `file:` で取り込む利用側が 404 で止まらないようにした
  - guidelines: `system/guidelines/typography.md`（MCP の `riml-ds://guidelines/typography`）

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

### Patch Changes

- [`bf712c2`](https://github.com/RimlTempest/riml-ds/commit/bf712c250b1ebb0409c823cb0a3fecc9bf4dfe31) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - elements: `rd-splitter` の面（`[part='start']` / `[part='end']`）が溢れているときだけ `tabindex="0"` を付けるようにした。キーボードだけの人が転がせる（axe `scrollable-region-focusable`）。溢れていない面には付けないので Tab の止まる所は増えない。焦点環は面の**内側**に描く（`overflow: auto` の箱の外に出すと親に切られる）
  - elements: `rd-command` の 0 件表示（`[part='empty']`）が 80ch で止まらないようにした（`max-inline-size: none`）。80ch より広いパレットで、中央揃えの文言が左に寄っていた
  - css: `.rd-table` の見出しセル（`th`）を折り返さないようにした（`white-space: nowrap`）。短い見出しが 2 行になると行の高さが揃わない。`td` は今までどおり折り返す。横に溢れる表は `.rd-table-scroll` で包む
- Updated dependencies [[`50ab1f3`](https://github.com/RimlTempest/riml-ds/commit/50ab1f35d34af541e5efb5660fcbcb395400de3a), [`2add6f1`](https://github.com/RimlTempest/riml-ds/commit/2add6f1b9318276bb3c5ff700aeb695646863752), [`dcf0d36`](https://github.com/RimlTempest/riml-ds/commit/dcf0d36013cc6687584735dbc0f5513f6fa8a547)]:
  - @rimltempest/riml-ds-tokens@0.3.0

## 0.2.0

### Patch Changes

- [`ff7952b`](https://github.com/RimlTempest/riml-ds/commit/ff7952b2ce090ea157ca1cdeb032789380f1c3ba) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - tokens: `type.link.underline-offset`（`--rd-type-link-underline-offset`、0.15em）を追加
  - css: `a` の下線を `text-underline-offset` でディセンダーから離した。`print.css` に見出し直後（`break-after: avoid`）と
    表・図・コード・リスト項目の途中（`break-inside: avoid`）で改ページしない指定を足した
- Updated dependencies [[`ff7952b`](https://github.com/RimlTempest/riml-ds/commit/ff7952b2ce090ea157ca1cdeb032789380f1c3ba), [`5fa23c6`](https://github.com/RimlTempest/riml-ds/commit/5fa23c6a90de82a6f46a6a83d97d1de5142d1234)]:
  - @rimltempest/riml-ds-tokens@0.2.0
