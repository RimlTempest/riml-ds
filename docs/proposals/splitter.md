# 提案: `rd-splitter`（experimental）

## 目的

shadcn の **Resizable** に当たるものが無い。noter の「一覧 | エディタ | プレビュー」、
qrcc の「設定 | プレビュー」は割合を変えたい 2 面なのに、いまはどちらも固定の grid で、
利用側が `pointermove` を自作している（キーボードで動かない・読み上げが仕切りを知らない・
JS が落ちると片方の面しか見えない、の 3 つが繰り返し起きる）。

WAI-ARIA APG の「Window Splitter」のとおり、**`role="separator"` のつまみを 1 つ**持つ部品にする。

## API

- ティア B（ADR-0012）。契約は `rd-splitter > [slot="start"]` と `> [slot="end"]`（どちらも必須）
- **JS が無ければ 2 つの面が縦に積まれて両方読める**（`splitter.css` の `:not(:defined)`）。
  つまみは shadow にしか無いので、定義前は 1 つも現れない（押せない仕切りを置かない）
- `label`（つまみのアクセシブル名。**必須**。空なら `:state(malformed)`）
- `direction="horizontal" | "vertical"`（既定 `horizontal`）、
  `position`（%。既定 50。反映される属性で JS からも読み書きできる）、`min`（20）/ `max`（80）
- `rd-resize` `{ position }` を出す。**利用者の操作で変わったときだけ**で、JS からの
  `position` 書き換えでは出さない
- `:state(dragging)` / `:state(vertical)` / `:state(malformed)`
- `::part(start)` / `::part(handle)` / `::part(grip)` / `::part(end)`、`--rd-splitter-size`（つまみの見える太さ）

## 決めたこと（なぜそうしたか）

### `direction` と `aria-orientation` は逆になる

`direction="horizontal"` は「**面が横に並ぶ**」（shadcn と同じ語）。そのとき 2 面のあいだの
仕切りは**縦線**なので、APG の separator としては `aria-orientation="vertical"` になる。
語が逆さまなのは混乱の元なので、反転を知っているのは `splitter.logic.ts` の
`ariaOrientation()` 1 か所だけにして、テストで固定した。

- 利用者が読むのは「どちらの向きに面が並ぶか」で、`direction` はその語彙に合わせた
- 支援技術が読むのは「仕切り線がどちらを向いているか」で、`aria-orientation` はその語彙
- どちらかに寄せると、もう片方の読み手にとって嘘になる

### 値は % で持つ（px にしない）

`position` は **0–100 の整数 %**。px を受けないのは、割合の意味が入れ物のサイズに依存して
しまうから——同じ `position="240"` が広い画面では細い脇、狭い画面では画面の半分になり、
`min` / `max` も画面ごとに意味が変わる。% なら `min` / `max` がどの画面でも同じ約束になる。

px 幅で止めたい要件（「脇は最低 240px」）は、面の中身が `min-inline-size` を持てば
CSS 側で足りる。部品が px を持つのは、その要件が出てから。

### Enter の折り畳みは入れない

APG は separator に「Enter で折り畳む / 戻す」を任意で認めているが、この版では入れない。

- 折り畳みは「割合を変える」とは別の状態（畳む前の値を覚える・復元する・
  畳んだ面の中身をどう読み上げるか）で、`position` だけでは表せない
- 折り畳みが要る画面は、たいてい「面ごと消す」ほうが正しい（`hidden` を利用側が付ける）
- **他のキーを横取りしない**という約束を守るため、扱わないキーは `decideKey()` が
  `undefined` を返して `preventDefault()` しない。Enter もそこに含まれる

### `rd-resize` は間引かない

`pointermove` ごとに出る。部品の側で `requestAnimationFrame` などに丸めると、
「いつ出るか」が部品の都合で決まってしまい、利用側が正確な値を取れなくなる。
**間引きが要るなら利用側で間引く**（保存や再計算の頻度は利用側の事情）。

## a11y

- つまみは `role="separator"` + `tabindex="0"` + `aria-valuenow` / `aria-valuemin` /
  `aria-valuemax` / `aria-label` / `aria-orientation`
- キーは APG のとおり: 面が横なら ← →、縦なら ↑ ↓ で 1%、Shift で 10%、Home → `min`、
  End → `max`。**RTL の横並びでは ← → を反転する**（`:dir(rtl)`）
- 標的は 44px（WCAG 2.5.5 AAA）。見える太さは `--rd-splitter-size`（既定 `var(--rd-space-2)`）の
  ままで、つまみに重ねた透明な板（`[part='grip']`、`aria-hidden="true"`）を
  `var(--rd-sizing-target-min)` まで広げる。擬似要素ではなく実要素にしたのは、
  当たり領域を `getBoundingClientRect()` で測れるようにするため（`riml-ds-tdd` の完了条件）と、
  空の palpable 要素を許さない markuplint に合わせるため（`rd-slider` の `[part='track']` と同じ形）
- 色だけに頼らない: つまみは太さと位置で分かる。hover / focus-visible / dragging の
  アクセント色は補助で、フォーカスの輪は `base.css` のものをそのまま使う
- 強制配色では `CanvasText`（フォーカス時 `Highlight`）
- 動きは `background-color` の遷移だけ。`prefers-reduced-motion: no-preference` の中にしか書かない

## 実装のメモ

- 割合は host のインラインの `--rd-splitter-position` に書き、shadow の
  `grid-template-columns` / `-rows` がそれを読む（`menu.dom.ts` が `top` / `left` を書くのと同じ考え）
- ドラッグは `setPointerCapture` を取るので、ポインタが面の外へ出ても `pointermove` は
  つまみに届き続ける（`window` を購読しない ＝ 部品の外に痕跡を残さない）
- `:state(dragging)` は `@supports selector(:state(dragging))` の中でだけ使う（Newly。docs/baseline.md）。
  無いブラウザではドラッグ中の `user-select: none` が効かないだけで、操作は変わらない

## 生成されるラッパーの型（この計画の外）

`tools/cem` は `position` / `min` / `max` を **`number`** の props として生成した
（`rd-slider` の `min?: string` と違う）。属性は文字列になるので実害は無いが、
数値属性の props 型が部品によって揃っていないのは事実で、生成器側の課題として残っている。

## 代替案

- **3 面以上を 1 つの部品で持つ**: つまみが n-1 個になり、`position` が配列になる。
  APG も「1 つの separator」を前提にしている。2 面の splitter を入れ子にすれば足りる
  （story の `Nested`）ので、この版では 2 面に限る
- **`localStorage` に割合を保存する**: 保存の鍵も範囲も利用側の事情。部品は `rd-resize` を
  出すところまでにして、保存は利用側に任せる
- **`min-content` で面の最小幅を決める**: 中身が変わるたびにつまみの可動域が動き、
  利用者が「さっきまで動かせた場所」に動かせなくなる。`min` / `max` を % で固定する
