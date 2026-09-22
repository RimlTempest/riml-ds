# @rimltempest/riml-ds-tokens

## 0.3.1

### Patch Changes

- [#4](https://github.com/RimlTempest/riml-ds/pull/4) [`feac890`](https://github.com/RimlTempest/riml-ds/commit/feac89018dacbc645ffacd9fb1596740885e4eba) Thanks [@RimlTempest](https://github.com/RimlTempest)! - 公開物の修正。0.2.0 / 0.3.0 は `package.json` の依存に `workspace:*` が残ったまま公開され、`@rimltempest/riml-ds-{css,elements,react,vue,svelte,astro,mcp}` はどのパッケージマネージャからもインストールできなかった（`Workspace dependency "@rimltempest/riml-ds-elements" not found`）。0.3.1 から、ほかの riml-ds パッケージへの依存は実際の版範囲（peer は `^0.3.1`）で公開する。利用側は 0.3.1 に上げるだけでよい。コードと見た目の変更は無い。

## 0.3.0

### Minor Changes

- [`50ab1f3`](https://github.com/RimlTempest/riml-ds/commit/50ab1f35d34af541e5efb5660fcbcb395400de3a) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - tokens: palette に `color.palette.neutral.750`（`[0.31, 0.035, 270.31]`）と `neutral.950`（`[0.17, 0.025, 270.31]`）を追加（riml / qrcc / noter の 3 テーマ）。どちらも `status: internal` なので CSS から直接引かない
  - tokens: ダークの `color.surface.sunken` を `neutral.950`、`color.surface.hover` を `neutral.750` に付け替えた。ダークは 950 / 900 / 800 / 750 の 4 素材で `sunken` / `default` / `raised` / `hover` の 4 役になり、入力欄・溝・リスト見出しが既定面に溶けず、窓（raised）の中の行も hover で動く（ライトの値は変えていない）
  - tokens: ダークの `shadow.raised` / `shadow.overlay` を黒 alpha 0.5 / 0.6 にした（寸法はライトと同じ）。インク色の影はダークの面の上では見えなかった
  - tokens: `color.text.muted` は `surface.hover` の上でも 7:1 を満たす（`contrastAgainst` が 4 面になった）。ダークの実測は riml 7.06 / qrcc 7.55 / noter 7.28
  - tokens: `postbuild` の `light-dark()` 畳み込みが「共通の接頭辞 + 末尾の色」なら色だけを包むようになった（`--rd-shadow-raised: 0.25rem 0.25rem 0rem 0rem light-dark(…, …)`）。色トークンの出力は変わらない

- [`2add6f1`](https://github.com/RimlTempest/riml-ds/commit/2add6f1b9318276bb3c5ff700aeb695646863752) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - 既定ブランドを riml の色にした（blogs の 7 色由来。紙 = cream、インク = navy、主役 = 髪の青、印章 = 赤目）。旧既定の青緑は `themes/noter` へ
  - `color.brand.primary` / `color.brand.signature`（装飾用・非文字 3:1）、`color.chrome.default` / `color.chrome.text`（タイトルバー）、
    `font.family.display`（丸ゴシック系スタック、同梱なし）、`color.palette.neutral.700` / `accent.500` / `signature.*` を追加
  - `radius.sm/md/lg` を 8/12/16px に、`shadow.*` をぼかし 0 の硬い影に、`type.heading.*` を display スタックに
  - `color.text.default`（ライト）の参照先を `neutral.700` に。テーマは既定の palette 段を全部持つ（テストで固定）

- [`dcf0d36`](https://github.com/RimlTempest/riml-ds/commit/dcf0d36013cc6687584735dbc0f5513f6fa8a547) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - tokens: `type.display` / `type.heading.3` / `type.heading.4`（display は流体、heading.4 は固定）、`line.height.display`、`letter.spacing.{normal,wide}` を追加
  - css: `typography.css` を追加。`.rd-display` / `.rd-heading-1..4` / `.rd-body` / `.rd-small` / `.rd-caption` / `.rd-label` / `.rd-mono` / `.rd-numeric` / `.rd-truncate` / `.rd-clamp` / `.rd-prose`。見出しレベル（`h1`..`h6`）とは独立した「見た目のクラス」
  - css: `atoms.css` を追加。JS が要らない静的パターン（`.rd-badge` / `.rd-dot` / `.rd-avatar` / `.rd-separator` / `.rd-skeleton` / `.rd-kbd` / `.rd-tile` / `.rd-icon-button` / `.rd-toolbar` / `.rd-list` / `.rd-table` / `.rd-alert` / `.rd-legend`）
  - css: `exports` に `./typography.css` と `./atoms.css` を追加。`@rimltempest/riml-ds-tokens` を `peerDependenciesMeta` で optional にし、npm 未公開の tokens を `file:` で取り込む利用側が 404 で止まらないようにした
  - guidelines: `system/guidelines/typography.md`（MCP の `riml-ds://guidelines/typography`）

- [`8927534`](https://github.com/RimlTempest/riml-ds/commit/89275349d60dee851d8f645de5f2db2f9ed85d99) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - tokens: `color.chrome.control.close` / `.expand` / `.collapse` を追加（ADR-0015）。窓の帯の操作の丸を riml の 3 色（ほっぺの桃 `danger.300` / 髪の青 `accent.300` / 紙 `neutral.0`）で塗る。3 つとも `chrome.default` に対して **3:1 以上**を全モード・全テーマで検査する（最低は dark の 5.84:1）。記号の色 = 帯の色なので、この 1 対で「丸 ↔ 帯」と「記号 ↔ 丸」の両方を見ている
  - css / elements: 窓とダイアログの帯の記号（× / □ / −）を **riml の筆致**に差し替えた（ADR-0015）。参考にした画面の記号と同じ角度・太さ・角丸で描かない。× は 8 度傾け、□ は角丸を一辺の 1/3 弱（一辺 9.6 に `rx 3`）に、− は端を丸く短く取り、線は `stroke-width 2.4` / `stroke-linecap round` の 1 本書きにした
  - css / elements: 丸の塗りに `--rd-window-control-color` を挟み、`[data-action]` ごとに上の 3 色を当てる。帯の `data-tone` を変えても丸の色は動かない。`forced-colors: active` では従来どおり `ButtonFace` + `ButtonText` の輪郭に戻る
  - **見た目だけの変更で、クラス・属性・part・イベントは変わらない**（利用側の追随は不要。VRT の基準画像は撮り直しが要る）
  - css / elements: 帯の丸の並びを利用側が調整できるようにした。`--rd-window-control-gap`（丸どうしの間隔。既定 `0`）、`--rd-window-control-size`（丸の直径。既定 `1.25rem`）、`--rd-window-glyph-size`（記号の大きさ。既定 `0.75rem`）。既定値は帯（`:host` / `.rd-window-bar`）に置いたので、`rd-window { --rd-window-control-gap: 0.25rem }` のように**外から**上書きできる（丸自身に書いてあった従来の既定は届かなかった）。当たり判定は 2.75rem 四方のまま変わらない

## 0.2.0

### Minor Changes

- [`ff7952b`](https://github.com/RimlTempest/riml-ds/commit/ff7952b2ce090ea157ca1cdeb032789380f1c3ba) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - tokens: `type.link.underline-offset`（`--rd-type-link-underline-offset`、0.15em）を追加
  - css: `a` の下線を `text-underline-offset` でディセンダーから離した。`print.css` に見出し直後（`break-after: avoid`）と
    表・図・コード・リスト項目の途中（`break-inside: avoid`）で改ページしない指定を足した

- [`5fa23c6`](https://github.com/RimlTempest/riml-ds/commit/5fa23c6a90de82a6f46a6a83d97d1de5142d1234) Thanks [@RimlTempest](https://github.com/RimlTempest)! - - テーマがダークも解決するようになった。`themes/<brand>.css` はライトとダークの差分を `light-dark()` に畳む
  - テーマが上書きできるのは `color.palette.*` だけ（テストで固定）。semantic と `modes/*` は palette を参照する
  - `color.surface.hover` / `color.status.danger.hover`（と `palette.danger.300/700`）を追加
  - `themes/qrcc` に qrcc（青 / hue 255）の palette を入れた。`tokens.json` の `$extensions.riml-ds.modes` に
    `theme-<brand>` / `theme-<brand>-dark` が出る
