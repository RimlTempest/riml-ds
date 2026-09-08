# 提案: `rd-dialog` の `alert` と `placement`（Alert Dialog / Sheet / Drawer）

## 目的

shadcn/ui の一覧を基準にすると、riml-ds には **Alert Dialog** と **Sheet / Drawer** が無い。
どちらも「モーダルの窓」で、変わるのは 2 つだけ:

- **Alert Dialog**: 返事を求めるので **外側（背面）を押しても閉じない**。役割は `alertdialog`
- **Sheet / Drawer**: 画面の端に着く帯。中身と閉じ方は同じで、**置き場所**だけが違う

これを別部品にすると、帯（× と見出し）・フォーカス戻し・`rd-dismiss` の 3 つを 2 か所に持つことになる。
ADR-0014 決定 4 の「帯は 1 か所」と同じ判断で、**`rd-dialog` の属性**にした。

## API

既存の API（`open` / `persistent` / `show()` / `close()` / `rd-dismiss`）は**何も変えない**。足したのは属性 2 つ。

| 属性 | 型 | 既定 | すること |
| --- | --- | --- | --- |
| `alert` | boolean（reflect） | `false` | `<dialog role="alertdialog">` にし、**背面クリックを止める**（Esc と × は効く） |
| `placement` | `'center' \| 'start' \| 'end' \| 'bottom'`（reflect） | `'center'` | 窓の置き場所。`center` 以外は `:state()` が付く |

- 判断は純関数（`dialog.logic.ts`）。`decideClose({ persistent, alert, reason })` が
  `alert && reason === 'backdrop'` を `blocked` にする。`persistent` の規則はそのまま
- `computeStates({ open, malformed, placement })` が `center` 以外の placement を `:state()` に足す
  （`:state(open)` と共存する。`malformed` は今までどおりすべてを置き換える）
- **JS は属性を反映するだけ**で、見た目は `dialog.styles.ts` の `:host([placement='end']) [part='control']` などが当てる
- 位置は `<dialog>` の **`margin`** で決める。top layer の `<dialog>` は `inset` を見ないので margin が唯一の手
- 角は面している側だけ落とす（`border-start-end-radius` などの論理プロパティ。RTL で自動的に反転する）
- 帯は縦に長くなるので `[part='body']` を `overflow: auto` にする（帯の × と見出しは残す）

## a11y

- `alert` の名前は今までどおり `slot="label"`（`aria-labelledby`）。帯の × の名前は混ざらない（ADR-0014 決定 2）
- `alertdialog` でも **Esc は閉じる**。閉じられない窓は `persistent`（× を描かない）で表す。
  両方付けると Esc も背面も止まる
- `placement` は見た目だけを変える。読み上げの順序・役割・名前は `center` と同じ
- 動きは `prefers-reduced-motion: no-preference` の中だけ。**入場だけ**を滑らせ
  （`@starting-style` の `translate`）、閉じるときは `center` と同じ「その場で消える」にした。
  閉じるときも滑らせると `display` の `allow-discrete` と噛み合わず、帯が消えたあとに残像が出る
- 強制配色は今までどおり `CanvasText` の罫線（帯の見え方は変えない）

## 代替案

- **別部品（`rd-alert-dialog` / `rd-sheet`）にする**: 帯・フォーカス戻し・`rd-dismiss` を二重に持つ。
  `rd-dialog` と 3 つの部品でキーボード操作がずれる余地が生まれる。ADR-0014 決定 4 と同じ理由で採らない
- **`alert` を `persistent` で代用する**: `persistent` は Esc も止める。Alert Dialog は Esc で閉じるべき
  （WAI-APG）なので意味が違う。`persistent` は「閉じられない」、`alert` は「返事を求める」
- **`placement` を CSS 変数（`--rd-dialog-placement`）にする**: 値ごとに角丸・寸法・入場の向きが変わるので、
  変数 1 つでは表せない。`:state()` に出しておくと利用側が `::part(control)` で足せる
- **`popover` 属性に載せ替える**: モーダルの `<dialog>` はフォーカストラップと `::backdrop` を素で持つ。
  非モーダルの重ね窓（`rd-popover` / `rd-menu`）とは別の道具のままにする
