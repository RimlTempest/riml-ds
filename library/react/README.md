# @rimltempest/riml-ds-react

riml-ds の React 19 ラッパー。**手で書かない**：`custom-elements.json`（CEM）と
マークアップ契約（ADR-0012）から `bun run gen` が生成する。

## 導入

```bash
bun add @rimltempest/riml-ds-react @rimltempest/riml-ds-elements \
        @rimltempest/riml-ds-tokens @rimltempest/riml-ds-css
```

CSS の読み込み順とテーマは [skills/riml-ds](../../skills/riml-ds/SKILL.md) §1 のとおり。
**このパッケージは `define` を import しない。** 強化（`:state()`・インラインの文言・
ダイアログの開閉）が要るページで、利用側が読む:

```ts
import '@rimltempest/riml-ds-elements/dialog/define'
```

## 既定 export と `/client`

| 入口                                | `'use client'` | 使いどころ                                    |
| ----------------------------------- | -------------- | --------------------------------------------- |
| `@rimltempest/riml-ds-react`        | 無し           | RSC / SSR。契約の木をそのまま HTML にするだけ |
| `@rimltempest/riml-ds-react/client` | 有り           | `rd-*` イベント、controlled（`value`）        |

```tsx
// サーバーコンポーネント（RSC）でもそのまま描ける
import { RdButton, RdTextField } from '@rimltempest/riml-ds-react'

;<form action={saveAction}>
  <RdTextField label="メール" name="email" type="email" required hint="確認メールを送ります" />
  <RdButton type="submit">保存</RdButton>
</form>
```

```tsx
'use client'
import { RdButton, RdTextField } from '@rimltempest/riml-ds-react/client'

const [email, setEmail] = useState('')
;<RdTextField
  label="メール"
  name="email"
  value={email}
  onInput={(e) => setEmail(e.currentTarget.value)}
/>
;<RdButton onRdPress={() => save()}>保存</RdButton>
```

- 既定 export の出力は light DOM の純粋な HTML。`renderToString` の結果は
  `@rimltempest/riml-ds-elements/<name>` の `markup()` と（属性順を除いて）**同じ文字列**で、
  テストで固定してある。JS 無しでも送信・検証・ラベルが効く。
- `children` は `label` より優先する（`<RdButton type="submit">保存</RdButton>`）。
- `id` を渡さなければ `name` を使う。RSC では hook（`useId`）を呼べないので、
  ID は決定的に決める。2 つ以上の同名フィールドがあるページでは `id` を明示する。
- controlled（`value`）は `<input>` と同じ意味論。親が値を更新しなければ、
  描画直後に要素の値が戻る（ADR-0012 §5）。uncontrolled は `defaultValue`。
- `ref` はホスト要素（`<rd-text-field>`）。ティア A はネイティブ要素が子なので
  `ref.current.querySelector('input')` が届く。

## `<rd-*>` を JSX に直接書く

部品（`RdButton` など）を使うだけなら要らない。生の要素を書くときだけ:

```ts
import '@rimltempest/riml-ds-react/jsx'
```

## `@lit/react` を使っていない

React 19 は custom element の属性・プロパティ・イベントを素で扱える。いまの部品は
どれもプリミティブな属性しか受け取らないので、`createComponent` を挟むと Lit が
React パッケージに入るだけで得が無い（サイズ予算：button のみ import で 13 KB brotli）。
**オブジェクト・配列のプロパティを渡す部品**が出たら、その部品の `client/` だけ
`@lit/react` に切り替える（ADR-0002 / ADR-0012 §5）。

## 保守

部品を足す = `library/elements/src/<name>/<name>.contract.ts` を書く。
`bun run gen` でこのパッケージの部品と型が揃う。**手書きのラッパーを増やさない。**
