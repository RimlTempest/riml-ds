# @rimltempest/riml-ds-svelte

riml-ds の Svelte 5 部品と `svelteHTML` 型。**手で書かない**：`custom-elements.json`（CEM）と
マークアップ契約（ADR-0012）から `bun run gen` が生成する。

## 導入

```bash
bun add @rimltempest/riml-ds-svelte @rimltempest/riml-ds-elements \
        @rimltempest/riml-ds-tokens @rimltempest/riml-ds-css
```

`.svelte` は**ビルドせずそのまま配る**（`svelte` フィールドが `src/generated` を指す）。
素の `<script>`（TypeScript ではない）なので、利用側に preprocess を強制しない。

**このパッケージは `define` を import しない。** 強化が要るページで利用側が読む:

```ts
import '@rimltempest/riml-ds-elements/dialog/define'
```

## 使い方

部品を使う:

```svelte
<script>
  import { RdButton, RdTextField } from '@rimltempest/riml-ds-svelte'
</script>

<RdTextField label="メール" name="email" type="email" required />
<RdButton type="submit">保存</RdButton>
```

生の要素を書く（skills/riml-ds §3 の書き方）:

```svelte
<rd-button onrd-press={save}><button type="button">保存</button></rd-button>
```

## 型を入れる

`svelteHTML.IntrinsicElements` の拡張はグローバル宣言なので、アプリの `tsconfig.json`（または
`src/app.d.ts`）から読み込ませる:

```jsonc
// tsconfig.json
{ "compilerOptions": { "types": ["@rimltempest/riml-ds-svelte/types"] } }
```

イベントは `onrd-press` / `onrd-dismiss` / `onrd-announce`（DOM のイベント名そのまま）。

## 保守

部品を足す = `contract.ts` を書く。`bun run gen` で `.svelte` と型が揃う。
`.npmignore`（空ファイル）があるのは、生成物の `src/generated` が `.gitignore` に
入っているため。npm は `.npmignore` があればそちらを見るので、生成物が同梱される。
