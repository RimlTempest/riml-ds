# 提案: 名前つき `{ raw }` を名前つき slot にし、astro の `exports` を生成する

## 目的

契約の木（ADR-0012）の `{ raw }` には**名前**がある（`$children` / `$trigger` / `$items` /
`$tabs` / `$panels`）。React の生成器は最初から名前で描き分けていたが、Vue / Svelte / Astro の
生成器は名前を捨てて既定 slot を出していたので、名前つきの `{ raw }` を 2 つ持つ部品
（`rd-menu` / `rd-popover` / `rd-tabs`）で**同じ子を 2 回描いていた**。

```svelte
<!-- library/svelte/src/generated/menu.svelte（plan 023 の前。バグ） -->
<rd-menu …>
  {@render children()}
  <div popover="" {id}>{@render children()}</div>
</rd-menu>
```

このせいで plan 020 の 3 部品は **React でしか使えず**、`e2e/frameworks` にも載せられなかった。

あわせて `library/astro/package.json` の `exports` が手書きで、`experimental/` の `.astro` が
10 個あるのに 3 個しか公開していなかった（`rd-meter` / `rd-window` などが import できない）。

## 決めたこと

### 1. `Dialect.raw` が名前を受け取る

`tools/cem/src/wrappers/core/markup-lang.ts` の `Dialect` を変える。`$` を落とした名前を渡し、
**`children` だけが既定 slot**、それ以外は名前つき slot になる。

```ts
/** `{ raw }`。`name` は `$` を落とした名前 */
readonly raw: (name: string) => string
```

| 言語   | `children`（変えない）  | それ以外（例 `trigger`）           |
| ------ | ----------------------- | ---------------------------------- |
| Svelte | `{@render children()}`  | `{@render trigger?.()}`（snippet） |
| Astro  | `<slot />`              | `<slot name="trigger" />`          |
| Vue    | `slots['default']?.()`  | `slots['trigger']?.()`             |

React は元から名前で描いていたので変えない。既存の生成物（button / checkbox / dialog /
disclosure / meter / radio-group / select / slider / text-field / window）は 1 バイトも変わらない。

### 2. 利用側の書き方

```svelte
<RdMenu label="操作" id="row-actions">
  {#snippet trigger()}<rd-button slot="trigger"
      ><button type="button" popovertarget="row-actions">操作</button></rd-button
    >{/snippet}
  {#snippet items()}<a href="/copy">複製</a><button type="button">削除</button>{/snippet}
</RdMenu>
```

```ts
h(
  RdMenu,
  { label: '操作', id: 'row-actions' },
  {
    trigger: () =>
      h(
        'rd-button',
        { slot: 'trigger' },
        h('button', { type: 'button', popovertarget: 'row-actions' }, '操作'),
      ),
    items: () => [h('a', { href: '/copy' }, '複製'), h('button', { type: 'button' }, '削除')],
  },
)
```

```astro
<RdMenu label="操作" id="row-actions">
  <rd-button slot="trigger"
    ><button type="button" popovertarget="row-actions">操作</button></rd-button
  >
  <Fragment slot="items"><a href="/copy">複製</a><button type="button">削除</button></Fragment>
</RdMenu>
```

**生成器はトリガーを合成しない。** `popovertarget` / `aria-haspopup` の綴りはフレームワークごとに
違い（React は `popoverTarget`）、`menuTriggerMarkup()` と同じ属性は利用側が書く
（plan 020 で React 側もそう決めた）。

### 3. astro の `exports` は生成物

`astroExports(specs)` を `tools/cem/src/wrappers/core/astro.ts` に置き（純関数）、
`tools/cem/src/wrappers/index.ts` が `bun run gen` のたびに `library/astro/package.json` の
`exports` **だけ**を差し替える。並びは `"."` → stable（名前順）→ experimental（名前順）→
`"./package.json"`。差分が無ければ書かない。

手で足さない。将来 react / vue / svelte の `exports` も同じ形にしてよい。

### 4. ハイフンを含む属性

`{ 'aria-pressed': '$pressed' }` のような属性は 2 か所で落ちていた（plan 021 が踏んだ）。

- Vue の `h()` はオブジェクトのキーを引用していなかった（`aria-pressed: props.pressed` は構文エラー）。
  識別子として書けない名前だけ引用する
- 型がホストの CEM 属性名（`pressed`）でしか引けず `string` に落ちていた。`HTML_ENUM_ATTRS` に
  `'button.aria-pressed': ['true', 'false']` を足して、`type` と同じ仕組みで絞る

## 効果

- `e2e/frameworks` に `navigationSuite` が入り、**4 フレームワークすべて**で `rd-tabs` /
  `rd-menu` / `rd-popover` を JS 無し → JS ありの順に見る
- astro が `meterAndWindowSuite` / `radioGroupAndSliderSuite` にも載る（`exports` が揃ったため）
- `e2e:frameworks` は 50 → 86 テスト

## 保守メモ

- **契約の木で `raw` に付ける名前がそのまま slot 名になる。** 既定 slot にしたい本文は
  必ず `$children` と名付けること
- Svelte の名前つき snippet は `{@render trigger?.()}`。渡されなければ何も描かない
  （`children` は既定 slot なので `?.` を付けない。今までどおり）

## 代替案

- **生成器がトリガーまで合成する**: `popovertarget` の綴りをフレームワークごとに読み替える必要があり、
  React の型検査に落ちる（plan 020 で却下済み）
- **astro の `exports` を手書きのまま lint で見張る**: ずれてから気づく。生成物にすればずれない
- **Vue のキーをすべて引用する**: 既存の生成物が全部変わる。識別子でない名前だけ引用すれば差分は出ない
