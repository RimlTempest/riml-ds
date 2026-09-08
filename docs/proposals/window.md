# 提案: `rd-window`（experimental）

## 目的

「まど」の窓（`docs/brand.md` §7.1）に**操作**を付ける。帯の左端の丸 3 つは装飾ではなく
閉じる / 広げる / たたむのボタンだ（ADR-0014）。閉じるだけなら `patterns.css` のクラスで組めるが、
**たたむ・広げるは状態と ARIA（`aria-expanded` / `aria-controls` / `aria-pressed`）と Esc の処理**を伴う。
これは「JS が要る = 部品にする」の線（ADR-0012 §6）の内側にある。

利用側が自前で組むと、たたんだのに `aria-expanded` が残る / 本文が `hidden` にならず読み上げに出る /
Esc が効かない、が繰り返し起きる。

## API

- ティア B（ADR-0012）。枠と帯だけが shadow にあり、**見出しは `slot="title"` に利用側が h 要素を置く**
  （文書構造は利用側のもの）。本文は既定 slot
- 属性（すべて reflect）: `closable` / `expandable` / `collapsible`（付いた操作の丸だけを描く）、
  `collapsed` / `expanded`、`tone`（`chrome` | `accent` | `warning` | `danger`。既定 `chrome`）
- メソッド: `close()` / `toggleCollapsed(force?)` / `toggleExpanded(force?)`
- イベント: `rd-dismiss`（`{ reason: 'button' }`。**cancelable**。既定の動作は host に `hidden` を付けるだけ）、
  `rd-toggle`（`{ collapsed }`）、`rd-expand`（`{ expanded }`）
- part: `bar` / `controls` / `control`（`data-action` 付き）/ `title` / `body`。
  state: `collapsed` / `expanded` / `malformed`
- `--rd-window-expanded-inset` で広げたときの画面からの余白を変えられる

## a11y

- 名前は `slot="title"` の見出し。`ElementInternals.ariaLabelledByElements` があれば host（`role="region"`）に結ぶ。
  無いエンジンでは何もしない（利用側が `aria-labelledby` を書ける）
- **帯 ⊃ 見出し**。ボタンは見出しの外にあるので、ボタンの名前が窓の名前に混ざらない（ADR-0014 決定 2）
- ボタンはネイティブ `<button>`。Enter / Space は無料。`aria-label` は最も近い `[lang]` で日英を選ぶ
  （`_shared/lang.ts`）。当たり判定は `sizing.target-min`（2.75rem）四方で、見た目の丸は 1.25rem
- たたむと本文に `hidden` が付く（読み上げからも消える）。たたむボタンは `aria-expanded` + `aria-controls`
- 広げるは `aria-pressed`。**モーダルではない**——フォーカスは閉じ込めず、Esc は広げた状態を戻すだけ
- 強制配色では丸を消さない（操作だから）。`ButtonFace` の地 + `ButtonText` の縁と記号で描く
- 記号は幾何（× / □ / −）の `mask`。絵・アイコンフォント・ロゴは持ち込まない

## 代替案

- **部品にしない**（`patterns.css` のクラスだけ）: 閉じるだけならそれでよく、実際にその出口は残してある。
  たたむ・広げるの状態と ARIA を利用側に書かせると必ずずれるので、そこだけを部品にした
- **丸をすべて描き、使わない操作は `disabled`**: 押せないボタンが常に並ぶ。無効は「今は押せない」の意味なので誤り
- **`heading-level` 属性で部品が見出しを作る**: 見出しは文書構造。`rd-dialog` と同じく slot に置いてもらう
- **広げるをモーダル（`showModal()`）にする**: 背面を操作できなくなる。モーダルが要るなら `rd-dialog`
- **記号を inline SVG で DOM に置く**: JS 無しの利用側が SVG を毎回貼ることになる。CSS の `mask` なら
  `<button data-action="close">` の 1 要素で済む

## stable に上げる条件

- qrcc / noter の少なくとも一方が実際に `rd-window` を使い、`expanded` の使い勝手の報告が返ってくること
- `ariaLabelledByElements` が Safari / Firefox でも使えるようになるか、代わりの結び方が決まること
- ドラッグ移動・リサイズ・タブ（plan 020）を入れるかどうかが決まること（入れるなら API が変わる）
