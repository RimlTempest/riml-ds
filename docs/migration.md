# 移行（qrcc / noter → riml-ds）

段階的に、視覚差分ゼロで始める。

## 段階 1: トークンだけ

qrcc での実例: qrcc2 の `plans/010-riml-ds-tokens-stage1.md` と `docs/adr/0011-riml-ds-tokens.md`。

1. `@rimltempest/riml-ds-tokens` を入れる。**npm 公開前**は riml-ds をビルドしてから
   `cd system/tokens && bun pm pack --destination <app>/vendor/riml-ds --quiet` で tgz を作り、
   アプリ側の `package.json` に `"@rimltempest/riml-ds-tokens": "file:./vendor/riml-ds/rimltempest-riml-ds-tokens-0.1.0.tgz"`
   と書く（`bun install --frozen-lockfile` は tgz の整合性ハッシュを lockfile に持つので CI でも通る）。
   公開後はこの 1 行をバージョン指定に変え、`vendor/` を消す。CSS 側の `@import` 指定子は変わらない。
2. ルート CSS の `@layer` 宣言の**先頭に `rd.tokens`** を足し、既存の import より前で
   `@import "@rimltempest/riml-ds-tokens/tokens.css"; @import "@rimltempest/riml-ds-tokens/themes/qrcc.css";`
   （両ファイルは自分で `@layer rd.tokens { … }` に包まれているので `layer()` を付けない）。
   アプリ側の `color-scheme: light dark;` は消す（riml-ds の `tokens.css` が `:root` に置く）。
3. 既存の `--qrcc-*` を **別名**にする。アプリの CSS は触らず、トークン定義ファイルの値だけを
   `var(--rd-*)` に置き換える：
   ```css
   :root { --qrcc-text: var(--rd-color-text-default); /* … */ }
   ```
   対応表はアプリ側に手書きし、ADR に残す（`tools/migrate` はまだ無い。2 アプリ目で同じ表が要るなら作る）。
   riml-ds に無い概念（qrcc の `--qrcc-measure: 70ch`、見出し 4 段）は生値のまま残し、
   「残したものの一覧」をテストで固定する（qrcc の `shared/ui/src/styles/tokens.test.ts`）。
4. a11y ゲート（各アプリの axe）で差分ゼロを確認。**視覚差分はゼロにならない**（palette を共有するため
   text / border / hover の明度が数 % 動く）。差分は ADR に表で記録し、AAA を満たす側への変化だけ受け入れる。
   受け入れられない差分はテーマ側（`themes/qrcc`）の palette を直す — semantic トークンは触らない。
5. 以後、新しい CSS は `--rd-*` で書く。`--qrcc-*` を足すとテストが落ちるようにしておく。

## 段階 2: 基盤 CSS

`@rimltempest/riml-ds-css` の reset / base に切り替え、アプリ側の reset を消す。`@layer` 順を揃える。

**npm 公開前の注意**: css パッケージの tgz は `peerDependencies` に tokens の固定版（`0.1.0`）を持ち、
bun はそれを registry で解決しようとして 404 になる（`file:` の tokens tgz とは結び付かない）。
段階 2 は npm 公開後に始めるか、アプリ側 `package.json` の `overrides` で tokens を tgz に固定してから始める。

## 段階 3: 共通部品

`rd-button` / `rd-text-field` / `rd-live-region` / `rd-dialog`（experimental の `rd-select` / `rd-checkbox` / `rd-disclosure` / `rd-toast` は stable になってから。スキップリンクは `.rd-skip-link`） を `@rimltempest/riml-ds-react` で
置き換える。1 部品 1 PR。既存の a11y e2e がそのまま通ることを条件にする。

## 段階 4: 独自部品の整理

アプリ固有（qrcc の QR プレビュー、noter のプレゼンス表示）はアプリに残す。2 つ以上のアプリで
使うものだけ `library/elements/experimental` に昇格させる。

## 削除された API の codemod

`tools/migrate/rules/*.yml`（ast-grep）。例：

```yaml
id: rd-button-kind-to-variant
language: html
rule: { pattern: '<rd-button kind="$V">' }
fix: '<rd-button variant="$V">'
```

`bunx @rimltempest/riml-ds-mcp migrate run --from 1 --to 2` で適用。

## 0.2 → 0.3: 窓の帯（破壊的。ADR-0014）

窓（`.rd-window`）とダイアログの帯の左端の丸 3 つは、**装飾ではなく操作ボタン**になった。
併せて帯の構造が 1 段深くなる（**帯 = 見出し** → **帯 ⊃ 見出し**）。0.x なので互換の別名は残さない。

### CSS で組んでいる窓（`@rimltempest/riml-ds-css`）

before:

```html
<section class="rd-window">
  <h2 class="rd-window-title" data-tone="warning"><span>タイトル</span></h2>
  <div class="rd-window-body">…</div>
</section>
```

after:

```html
<section class="rd-window" aria-labelledby="w1">
  <header class="rd-window-bar" data-tone="warning">
    <div class="rd-window-controls">
      <button type="button" class="rd-window-control" data-action="close" aria-label="閉じる"></button>
    </div>
    <h2 class="rd-window-title" id="w1">タイトル</h2>
  </header>
  <div class="rd-window-body" id="w1-body">…</div>
</section>
```

変わったところ:

- `data-tone` の付け先が**見出しから帯（`.rd-window-bar`）へ**移った。見出しに付けても効かない
- `.rd-window-title` は背景も高さも持たない（帯が持つ）。長いタイトルを切るための `<span>` は要らない
- `.rd-window-title::before` の丸（`radial-gradient`）は消えた。丸が要るなら
  `.rd-window-control[data-action="close|expand|collapse"]` を**使う分だけ**置く（押せない丸は置かない）。
  **ボタンの動作は利用側が書く**。動作まで要るなら部品の `rd-window`
- `.rd-window-controls` は操作が 1 つも無いなら要素ごと省く

### `rd-dialog`

- 帯の左端に ×（閉じる）が出る。`persistent` のときは出ない
- `rd-dismiss` の `detail.reason` に `'button'` が増えた。`reason` で分岐しているコードは網羅を見直す
- 新しい part: `bar` / `controls` / `close`。`::part(control)` は `<dialog>` と × の**両方**に当たる
  （× は `part="control close"`）。`<dialog>` だけを狙うなら `::part(control):not(::part(close))` ではなく
  `::part(bar)` の外側で当てるか、`::part(close)` を先に上書きする

### `rd-meter`

塗りを `rd-meter::after` のピルで描くようになった（端が丸くなる）。
`rd-meter` に `position` を書いていたアプリは `relative` と衝突しないか見る。

### 利用側の追随

- qrcc2 の `<Window>` は plan 013 で追随する（帯の構造・`data-tone` の付け先・丸の廃止）
- noter も同じ 3 点。`.rd-window-title` の見た目を借りている独自 UI があれば `.rd-window-bar` に移す
