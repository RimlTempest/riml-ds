# @rimltempest/riml-ds-vue

riml-ds の Vue 3.5 ラッパーとプラグイン。**手で書かない**：`custom-elements.json`（CEM）と
マークアップ契約（ADR-0012）から `bun run gen` が生成する。

## 導入

```bash
bun add @rimltempest/riml-ds-vue @rimltempest/riml-ds-elements \
        @rimltempest/riml-ds-tokens @rimltempest/riml-ds-css
```

```ts
// main.ts
import { rdDesignSystem } from '@rimltempest/riml-ds-vue'

createApp(App).use(rdDesignSystem).mount('#app')
```

`<rd-*>` を**テンプレートに直接**書くなら、Vue のコンパイラに custom element だと教える:

```ts
// vite.config.ts
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('rd-') } } })
```

**このパッケージは `define` を import しない。** 強化が要るページで利用側が読む:

```ts
import '@rimltempest/riml-ds-elements/dialog/define'
```

## 使い方

```vue
<template>
  <form method="post" action="/save">
    <RdTextField label="メール" name="email" type="email" required v-model="email" />
    <RdButton type="submit">保存</RdButton>
  </form>
</template>
```

- 部品は SFC ではなく `defineComponent` + `h()`。契約の木をそのまま描くので、
  SSR でも JS 無しでも同じ HTML が出る。
- ティア A のフォーム部品は `v-model`（`modelValue` / `update:modelValue`）を受ける。
- `<rd-text-field v-model="email">` のように**生の要素**に付けた `v-model` は、Vue が
  `value` プロパティ + `input` イベントに束ねる（`isCustomElement` の設定が要る）。
- `id` を渡さなければ `name` を使う。同名フィールドが 2 つ以上あるページでは `id` を明示する。
- 非文字列のプロパティは `.prop` 修飾子（`:items.prop="list"`）。

## `/experimental` — `@status experimental` の部品

プラグイン（`rdDesignSystem`）が `app.component()` するのは stable な部品だけ。
`rd-select` / `rd-checkbox` / `rd-disclosure` は `@rimltempest/riml-ds-vue/experimental` の
`rdExperimentalComponents` を利用側が明示的に登録する（semver の対象外。ADR-0009）。

```ts
import { rdExperimentalComponents } from '@rimltempest/riml-ds-vue/experimental'
for (const [name, component] of Object.entries(rdExperimentalComponents))
  app.component(name, component)
```

`GlobalComponents` の型も登録される部品だけ。`<rd-*>` を直接書くための `IntrinsicElementAttributes` は全部品を持つ。
`v-model` は `<input>` / `<select>` / `<textarea>` を包む部品で効く。

## 型

`@rimltempest/riml-ds-vue` を import すると `GlobalComponents`（`<RdButton>` の補完）と
`IntrinsicElementAttributes`（`<rd-button variant="…">` の補完）が広がる。
型だけ欲しいときは `@rimltempest/riml-ds-vue/types`。

## 保守

部品を足す = `contract.ts` を書く。`bun run gen` で部品・型・プラグイン登録が揃う。
プラグインは `rdComponents`（生成物）を回すだけなので**手を入れる必要が無い**。
