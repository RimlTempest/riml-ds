# @rimltempest/riml-ds-astro

riml-ds の Astro integration と `.astro` 部品。部品は**手で書かない**：
`custom-elements.json`（CEM）とマークアップ契約（ADR-0012）から `bun run gen` が生成する。

## 導入

```bash
bun add @rimltempest/riml-ds-astro @rimltempest/riml-ds-elements \
        @rimltempest/riml-ds-tokens @rimltempest/riml-ds-css
```

```ts
// astro.config.mjs
import { rimlDs } from '@rimltempest/riml-ds-astro'

export default defineConfig({ integrations: [rimlDs()] })
```

integration が全ページに `layers.css` -> `tokens.css` -> `@rimltempest/riml-ds-css` と
部品 CSS を注入する（`.astro` 部品の `<style is:global>` に置くと部品の数だけ重複する）。

### オプション

| オプション | 既定    | 意味                                                               |
| ---------- | ------- | ------------------------------------------------------------------ |
| `define`   | `[]`    | ページの JS に読ませる部品（`['dialog']`）。既定では JS を出さない |
| `styles`   | `'all'` | `'all'` は `styles.css` 1 つ。配列なら部品ごとの `style.css`       |

```ts
rimlDs({ define: ['dialog', 'live-region'], styles: ['button', 'text-field', 'dialog'] })
```

`client:*` は要らない。ティア A/B は JS 無しで動く・読める（ADR-0012）。
ダイアログの開閉のように JS が要る操作だけ `define` に足す。

## 部品

```astro
---
import RdButton from '@rimltempest/riml-ds-astro/button.astro'
import RdTextField from '@rimltempest/riml-ds-astro/text-field.astro'
---

<form method="post" action="/save">
  <RdTextField label="メール" name="email" type="email" required />
  <RdButton type="submit">保存</RdButton>
</form>
```

- `<slot>` が使える。`RdButton` は子を渡せば `label` の代わりになる。
- `id` を渡さなければ `name` を使う。同名フィールドが 2 つ以上あるページでは `id` を明示する。

## 保守

部品を足す = `contract.ts` を書く。`bun run gen` で `.astro` が増える。
**`package.json` の `exports` に `./<name>.astro` を 1 行足す**（ADR-0009 でワイルドカード禁止）。
`.npmignore`（空ファイル）は、生成物の `src/generated` が `.gitignore` にあるため。
