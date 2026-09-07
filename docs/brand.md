# riml ブランドと視覚言語「まど（Mado）」

riml-ds の**見た目の設計書**。何色を、どの形で、どう配るかをここで決める。
トークンの実値は `system/tokens/src/**`（真実源）、生成結果は `DESIGN.md` のフロントマター。
この文書は「なぜその値か」と「部品はどう組むか」を持つ。矛盾したらトークンが正、次にこの文書、最後に `DESIGN.md` 本文。

- ブランド（色・人格）は `RimlTempest/blogs` の `design.md` から引き継ぐ（青髪赤目の riml キャラクター由来の 7 色）。
- 視覚言語（形・構図・部品の佇まい）は、配信画面向けのレトロ OS 風 UI を参考にした**「まど」**。
  参考にしたのは佇まいだけで、絵・アイコン・ロゴ・文言は一切持ち込まない（→ §9）。
- 制約は変えない: **WCAG 2.2 AAA（文字 7:1・非文字 3:1）を全モードで機械検査**、Workers 無料枠、Web フォントを同梱しない。

## 1. 人格（何を感じさせたいか）

| キーワード | 言い換え | 形への落とし方 |
| --- | --- | --- |
| **やさしい** | 角が無い・声が大きくない | 大きめの丸み（12–16px）、ピル型のボタン、濁りのない紙色 |
| **手ざわりのある** | 「窓」や「紙」の実体感 | 硬い影（ぼかし 0・右下に落とす）、タイトルバーの帯、点線の区切り |
| **まじめ** | 読めること・迷わせないことが先 | 文字は常に「インク on 紙」。鮮やかな色は装飾と状態表示だけに使う |
| **riml らしい** | 青髪・赤目・クリームの肌 | 青 = 主役（accent）、赤 = 印章（signature、装飾のみ）、クリーム/桃 = 面 |

blogs の Voice & Tone（誠実・具体的・簡潔／ラベルは動詞+目的語／エラーは原因+次の行動）は
`system/guidelines/writing.md` がそのまま引き継ぐ。

## 2. パレット（`color.palette.*`）

OKLCH で定義する。blogs のブランド 7 色を**AAA が成り立つ段に移し替えた**もの（変えた理由は各行）。
sRGB 近似は Terrazzo のガマットマップ後の値（C は自動で縮む）。

### 2.1 中性色 = riml の紙とインク（`neutral`）

| 段 | OKLCH `[L, C, H]` | sRGB 近似 | 出自 | 役割 |
| --- | --- | --- | --- | --- |
| `neutral.0` | `[0.9701, 0.0181, 78.24]` | `#fcf4e8` | blogs `cream` そのまま | **紙**。ライトの既定面 `surface.default`、ダークの本文色 |
| `neutral.100` | `[0.99, 0.008, 78]` | `#fffbf6` | cream をさらに白く | **窓**。ライトの浮いた面 `surface.raised`（紙より明るい） |
| `neutral.200` | `[0.9178, 0.0393, 57.35]` | `#f9decb` | blogs `peach` そのまま | **肌**。窪んだ面 `surface.sunken` と hover |
| `neutral.300` | `[0.80, 0.015, 78.24]` | `#c3bdb3` | blogs `cream-muted` | ダークの補助文字・強い境界 |
| `neutral.500` | `[0.60, 0.026, 273.03]` | `#7b8090` | blogs `slate.dark` | 境界線（紙に 3.63:1、ダーク面に 4.38:1） |
| `neutral.600` | `[0.40, 0.025, 273.03]` | `#434756` | blogs `slate.base`（L 48→40） | ライトの補助文字（紙 8.46:1・肌 7.19:1）、強い境界、ダークのタイトルバー |
| `neutral.700` | `[0.38, 0.045, 270.31]` | `#39415b` | blogs `navy.base`（L 43.76→38） | **インク**。ライトの本文・タイトルバー |
| `neutral.800` | `[0.28, 0.032, 270.31]` | `#232839` | blogs `navy.surface`（27→28） | ダークの浮いた面 |
| `neutral.900` | `[0.22, 0.03, 270.31]` | `#151a29` | blogs `navy.deep` そのまま | ダークの既定面・ライトの `on-accent` の下地 |

blogs の `navy.base`（L 43.76%）は cream 上 7.22:1 だが peach 上 6.13:1 で AAA を割る。
riml-ds は**どの面の上でも本文 7:1** を守るので、インクを L 38% に落とした。`slate` も同じ理由で 40% に落とした。

### 2.2 青 = 主役（`accent`、H 260.53）

| 段 | OKLCH | sRGB | 役割 |
| --- | --- | --- | --- |
| `accent.300` | `[0.878, 0.06, 260.53]` | `#c1d8ff` | ダーク hover |
| `accent.400` | `[0.80, 0.082, 260.53]` | `#a0bff3` | ダークの accent / focus ring / ブランド色 |
| `accent.500` | `[0.5915, 0.0911, 260.53]` | `#5e7eb4` | **blogs `blue`（髪）そのまま**。ライトの**装飾用**ブランド色 `brand.primary`（紙に 3.76:1 = 非文字のみ） |
| `accent.600` | `[0.42, 0.0911, 260.53]` | `#2f4c7e` | ライトの accent 塗り・リンク文字・focus ring（紙に 7.81:1） |
| `accent.700` | `[0.36, 0.0911, 260.53]` | `#1f3c6c` | ライト hover |

blogs の `blue.700`（L 45%）は cream 文字で 6.86:1（AA）。AAA のため塗りは L 42% を使う。
髪の青（`accent.500`）は**文字を載せない**装飾（窓の丸ボタン、区切り、メーターの区分、アイコン地）にだけ使う。

### 2.3 赤 = 印章（`signature`、H 25.84）— 装飾専用

| 段 | OKLCH | sRGB | 役割 |
| --- | --- | --- | --- |
| `signature.400` | `[0.71, 0.19, 25.84]` | `#ff6b63` | ダークの `brand.signature`（面に 6.22:1） |
| `signature.500` | `[0.6057, 0.2011, 25.84]` | `#e13d3c` | **blogs `red`（赤目）そのまま**。ライトの `brand.signature`（紙に 3.90:1） |

signature は「riml の印」。窓の丸ボタンの 1 つ目、選択中の目印、ブランド表示に使う。
**文字を載せない・文字色にしない・danger の代わりにしない**（danger は §2.4）。

### 2.4 意味色（`danger` / `warning` / `success` / `info`）

danger は signature と同じ色相 25.84 で**濃さだけ**変える（同じ赤の家族に見え、かつ役割が違う）。
info は主役の青と混ざらないよう色相 200（青緑）に置く。

| 段 | OKLCH | sRGB | 役割 |
| --- | --- | --- | --- |
| `danger.300` | `[0.86, 0.09, 25.84]` | `#ffbfb7` | ダーク hover |
| `danger.400` | `[0.78, 0.13, 25.84]` | `#ff968c` | ダーク既定（`neutral.900` 文字で 8.23:1） |
| `danger.600` | `[0.43, 0.175, 25.84]` | `#990012` | ライト既定・文字（紙に 8.14:1） |
| `danger.700` | `[0.37, 0.15, 25.84]` | `#7c000d` | ライト hover |
| `warning.400` / `.600` | `[0.78, 0.10, 75]` / `[0.42, 0.09, 75]` | `#ddae6c` / `#694500` | ダーク / ライト |
| `success.400` / `.600` | `[0.78, 0.11, 150]` / `[0.42, 0.11, 150]` | `#82cb92` / `#0b5d2a` | ダーク / ライト |
| `info.400` / `.600` | `[0.78, 0.11, 200]` / `[0.42, 0.07, 200]` | `#4eccd3` / `#04585c` | ダーク / ライト |

## 3. 役割（semantic）— ライト / ダークの参照先

| semantic | ライト | ダーク | 備考 |
| --- | --- | --- | --- |
| `color.surface.default` | `neutral.0` 紙 | `neutral.900` | 既定の面 |
| `color.surface.raised` | `neutral.100` 窓 | `neutral.800` | 窓・カード・ダイアログ |
| `color.surface.sunken` | `neutral.200` 肌 | `neutral.900` | 入力の窪み・リスト見出し |
| `color.surface.hover` | `neutral.200` | `neutral.800` | 行の hover |
| `color.text.default` | `neutral.700` インク | `neutral.0` 紙 | 本文（旧 `neutral.800`。段を 1 つ増やして分離） |
| `color.text.muted` | `neutral.600` | `neutral.300` | 補助 |
| `color.text.on-accent` / `on-status` | `neutral.0` | `neutral.900` | 塗りの上の文字 |
| `color.border.default` / `strong` | `neutral.500` / `neutral.600` | `neutral.500` / `neutral.300` | |
| `color.accent.default` / `hover` / `text` / `color.focus.ring` | `accent.600` / `700` / `600` / `600` | `accent.400` / `300` / `400` / `400` | |
| **`color.brand.primary`**（新設） | `accent.500` | `accent.400` | 装飾用ブランド青。**非文字 3:1** で検査 |
| **`color.brand.signature`**（新設） | `signature.500` | `signature.400` | 装飾用ブランド赤。**非文字 3:1** で検査 |
| **`color.chrome.default`**（新設） | `neutral.700` | `neutral.600` | 窓のタイトルバーの帯 |
| **`color.chrome.text`**（新設） | `neutral.0` | `neutral.0` | 帯の上の文字。**`chrome.default` に 7:1** で検査 |
| `color.status.*` | `*.600` | `*.400` | 変更なし（参照先は同じ、実色だけ変わる） |

高コントラスト（`prefers-contrast: more`）の 3 つの別名（muted→default、border→strong、accent.text→hover）は変えない。

### 検査済みの比（culori `wcagContrast`、ガマットマップ後）

| 対 | ライト | ダーク | 基準 |
| --- | --- | --- | --- |
| text / surface.default | 9.22 | 15.90 | 7 |
| text / surface.raised | 9.78 | 13.41 | 7（参考） |
| text / surface.sunken | 7.83 | 15.90 | 7（参考） |
| muted / surface.default | 8.46 | 9.28 | 7 |
| muted / surface.sunken | 7.19 | 9.28 | 7（参考） |
| on-accent / accent.default・hover | 7.81・10.04 | 9.28・12.01 | 7 |
| on-status / danger・danger.hover・warning・success・info | 8.14・10.29・7.88・7.37・7.50 | 8.23・11.03・8.57・9.04・9.04 | 7 |
| accent.text / surface | 7.81 | 9.28 | 7 |
| status.*.text / surface | 8.14・7.88・7.37・7.50 | 8.23・8.57・9.04・9.04 | 7 |
| border.default / surface | 3.63 | 4.38 | 3 |
| focus.ring / surface | 7.81 | 9.28 | 3 |
| brand.primary / surface | 3.76 | 9.28 | 3 |
| brand.signature / surface | 3.90 | 6.22 | 3 |
| chrome.text / chrome.default | 9.22 | 8.46 | 7 |

## 4. 形（shape）

| トークン | 値 | 使う所 |
| --- | --- | --- |
| `radius.sm` | 0.5rem（8px） | チェックボックスの箱、タグ、メーターの区分 |
| `radius.md` | 0.75rem（12px） | 入力欄、セレクト、リスト行、アイコン地 |
| `radius.lg` | 1rem（16px） | 窓・カード・ダイアログ・トースト |
| `radius.full` | 9999px | **ボタン**、スイッチ、スライダーのつまみ、丸ボタン |

輪郭線は既定 1px（`border.width.default`）のまま。「まど」は**線ではなく面の切り替えで区切る**（帯・窪み・点線）。

## 5. 影（elevation）— 硬い影

ぼかし 0、右下に落とす。実体があるものにだけ付ける。

| トークン | 値 | 使う所 |
| --- | --- | --- |
| `shadow.raised` | `0.25rem 0.25rem 0 0` / インク（`[0.22, 0.03, 270.31]`）alpha 0.16 | 窓・カード |
| `shadow.overlay` | `0.5rem 0.5rem 0 0` / 同色 alpha 0.24 | ダイアログ（トーストは小さな窓なので `raised`、§7.7） |

ぼかしが無いので描画が軽い（`filter` も `backdrop-filter` も使わない）。

## 6. 文字（typography）

- 本文は変えない: `font.family.sans` のシステムスタック、1rem / 1.6。
- **見出しとタイトルバーに丸ゴシック系のスタックを足す** — `font.family.display` =
  `"Zen Maru Gothic", "M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", "Kosugi Maru", "Arial Rounded MT Bold", "Nunito", system-ui, sans-serif`。
  **フォントファイルは同梱しない・読み込まない**。入っていれば丸くなり、無ければシステム UI で崩れない。
  Web フォントを使いたい利用側は自分で `@font-face` を書く（`docs/responsive-and-motion.md` の性能予算に従う）。
- `type.heading.1` / `type.heading.2` の `fontFamily` を `{font.family.display}` に切り替える。太さ 700、字間は変えない。
- 窓のタイトルは `type.heading.2` を使う（新しい typography トークンは作らない）。

## 7. 「まど」の部品規約

### 7.1 窓（`.rd-window` / `rd-window`。ダイアログも同じ骨格）

```
┌──────────────────────────────┐  帯: chrome.default、文字 chrome.text、高さ ≥ 2.75rem
│ ⊗ ▢ ⊖        タイトル          │  左端の丸 3 つ = 本物のボタン（閉じる / 広げる / たたむ）
├──────────────────────────────┤  角: radius.lg（帯は上 2 角、本体は下 2 角）
│  本体: surface.raised          │  影: shadow.raised
│  文字: text.default            │
└──────────────────────────────┘
```

- **左端の丸は装飾ではなく操作**（2026-09-08 のオーナー判断、ADR-0014）。丸 = `chrome.text` の塗り（クリーム）、
  中の記号 = `chrome.default`（インク）。記号は幾何（× / □ / −）で、絵やロゴを持ち込まない。並びは左から
  **閉じる（×）・広げる（□）・たたむ（−）**。使わない操作の丸は**描かない**（押せない丸を置かない）。
  1 つも使わないなら帯の左は空欄で、タイトルは帯の中央のまま。
- 丸の見た目は 1.25rem、当たり判定は `sizing.target-min`（2.75rem）四方。hover / focus-visible は丸の外側に
  `chrome.text` の 2px リング（塗りは変えない — `brand.primary` の上に記号を置かない §9）。
- 骨格は 2 つの出口を持つ:
  - **CSS だけ**（JS 不要な窓）: `@rimltempest/riml-ds-css` の `patterns.css` が `.rd-window` / `.rd-window-bar` /
    `.rd-window-controls` / `.rd-window-control[data-action]` / `.rd-window-title` / `.rd-window-body` を出す。
    ボタンの動作（閉じる・たたむ）は利用側が書く。
    ```html
    <section class="rd-window" aria-labelledby="w1">
      <header class="rd-window-bar">
        <div class="rd-window-controls">
          <button type="button" class="rd-window-control" data-action="close" aria-label="閉じる"></button>
        </div>
        <h2 class="rd-window-title" id="w1">タイトル</h2>
      </header>
      <div class="rd-window-body">…</div>
    </section>
    ```
  - **部品**（`rd-window`、ティア B、experimental）: 帯とボタンとその動作（`closable` / `collapsible` / `expandable`、
    `rd-dismiss` / `rd-toggle` / `rd-expand`）を持つ。見出しは `slot="title"` に**利用側が h 要素を置く**
    （文書構造は利用側のもの）。JS 無しでは `:not(:defined)` の CSS が帯だけを描き、ボタンは出ない。
- 帯 = 見出しではなく **帯 ⊃ 見出し**（ボタンが見出しの名前に混ざらないように、見出しは帯の中の別要素）。
  `aria-labelledby` は見出しに結ぶ。
- タイトルは帯の中央、`type.heading.2`、1 行で切る（`text-overflow: ellipsis`）。左のボタンが場所を取るときは
  中央からずれてよいが、ボタンを削ってはいけない。
- 帯の色は変えられる: `data-tone="accent"`（`accent.default` + `text.on-accent`）、`data-tone="warning"` / `"danger"`
  （`status.*.default` + `text.on-status`）。文字色は必ず対応する `on-*`。丸は tone でも `chrome.text` のまま
  （`on-*` と同系のクリーム）。
- 40rem 未満では窓は全幅・角丸は上下ともそのまま。帯の高さは縮めない（44px のタップ目標）。
- `forced-colors: active` では帯を `Canvas`/`CanvasText` と 1px `CanvasText` の境界線に置き換え、丸は
  `ButtonFace` + 1px `ButtonText` の縁 + `ButtonText` の記号になる（消さない — 操作だから）。

### 7.2 ボタン（`rd-button`）

- 形は **ピル**（`radius.full`）。太字。最小 2.75rem。
- primary: `accent.default` 塗り + `text.on-accent`。hover: `accent.hover`。active: `translateY(1px)`（動きはこれだけ）。
- secondary: `surface.sunken`（肌）塗り + `text.default`。境界線なし。hover: `surface.hover` を 1 段濃く（`color-mix` 8%）。
- ghost: 透明 + `accent.text`。danger: `status.danger.default` + `text.on-status`。
- 無効はネイティブ `disabled` のまま（`GrayText`）。

### 7.3 入力（`rd-text-field` / `rd-select`）

- 窪み = `surface.raised` の上に 1px `border.default`、`radius.md`。フォーカスはリング（3px `focus.ring` / 2px オフセット）。
- ラベルは太字・インク。エラーは `status.danger.text` + 原因と次の行動（`writing.md`）。

### 7.4 チェックボックス・スイッチ（`rd-checkbox`）

- 箱は `radius.sm`、選択時 `accent.default` 塗り + `text.on-accent` のチェック。
- スイッチはピルの太いトラック（高さ 1.5rem、`surface.sunken` → on で `accent.default`）と `radius.full` のつまみ。

### 7.5 メーター（`rd-meter`、新設・experimental）

- 太いトラック（1rem、`surface.sunken`、`radius.full`）。値は `accent.default`。
- 区分表示（複数系列）は `brand.primary` / `success` / `warning` / `neutral.500` の順に塗り分け、**色以外に凡例の文字**を必ず出す。
- ネイティブ `<meter>` / `<progress>` を包む（JS 無しでも値が読める = ティア A）。JS は `value` / `max` を読んで
  `--rd-meter-fill`（0–1）を要素に書くだけ。太いピルは CSS がその変数で描く。JS 無しならネイティブの見た目で値が出る。

### 7.6 区切り

- `hr` は **点線**（`2px dotted border.default`）。面の切り替え（帯・窪み）で区切れるときは線を引かない。

### 7.7 トースト・ダイアログ

- ダイアログ = 窓 + `shadow.overlay`。帯の左端の **×（閉じる）が閉じるボタン**（§7.1 と同じ丸）。`persistent` のときは
  × を出さない（Esc・背面クリックと同じく閉じられない状態を見た目でも示す）。□ / − はダイアログには無い。
  帯の右端にピルは置かない。
- トーストは小さな窓。意味色は**左端の 0.5rem の帯**で示し、本文は常にインク on 窓。

## 8. 動き・応答・性能

- 動きは `motion.duration.fast`（120ms）/ `base`（200ms）、`transform` と `opacity` と背景色だけ。`prefers-reduced-motion` で全て止まる。
- 硬い影・平坦な塗り・グラデ無し・フィルタ無し。テクスチャ（粒子）を**既定では入れない**（性能と可読性）。
- Web フォント 0 バイト。CSS 変数の追加は約 10 個で、`tokens.css` の増分は 1KB 未満。

## 9. やらないこと

- 参考にした画面の**絵・アイコン・ロゴ・キャラクター・文言を写さない**。持ち込むのは「帯 + 丸 3 つ + ピル + 硬い影 + 点線」という構図だけ。
- `brand.primary` / `brand.signature` の上に文字を置かない。文字色にもしない。
- 本文を `neutral.700` 以外のインクで書かない（意味色の文字は `status.*.text` だけ）。
- 角丸・影・帯を利用側で `!important` で剥がさない。変えたいなら `--rd-*` を差し替える。

## 10. 他ブランド（テーマ）との関係

- riml が**既定**（`theme=riml-ds`）。qrcc / noter は `themes/<brand>/color.tokens.json` で `color.palette.*` だけを差し替える（ADR-0013 / plan 013 の決まり）。
- 形・影・文字は全ブランド共通（「まど」は riml-ds の視覚言語であって riml ブランドの色とは独立）。
- noter は旧既定の青緑（accent hue 175 / neutral hue 200）を**自分のテーマとして**引き取る。

## 参照

- `RimlTempest/blogs` `design.md`（ブランド 7 色・スケール・Voice）
- `docs/adr/0013-riml-brand-and-mado.md`（決定の記録）
- `system/guidelines/color-and-theming.md`（色の運用規約）、`system/guidelines/accessibility.md`（AAA の根拠）
