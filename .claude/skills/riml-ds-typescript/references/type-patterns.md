# 型でユースケースを表現する

## Branded Primitive（`unique symbol`）

素の `string` を混ぜないための最小コスト。ブランドは値としては存在しない。

```ts
declare const brand: unique symbol
type Brand<T, B> = T & { readonly [brand]: B }

export type TokenPath = Brand<string, 'TokenPath'>     // 'color.text.default'
export type CssVarName = Brand<string, 'CssVarName'>   // '--rd-color-text-default'
export type TagName = Brand<`rd-${string}`, 'TagName'> // 'rd-button'
```

**作り方は必ずパース関数経由**（`as` は禁止なので、唯一の生成点を型ガードで作る）。

```ts
const isTokenPath = (v: string): v is TokenPath => /^[a-z][a-z0-9]*(\.[a-z0-9-]+)+$/.test(v)

export const parseTokenPath = (v: string): Result<TokenPath, { kind: 'invalid_token_path'; input: string }> =>
  isTokenPath(v) ? ok(v) : err({ kind: 'invalid_token_path', input: v })

// 変換も型が守る: TokenPath からしか CssVarName は作れない
export const toCssVar = (p: TokenPath): CssVarName => brandCssVar(`--rd-${p.replaceAll('.', '-')}`)
```

これで「`--rd-` を付け忘れた変数名」「`.` のままの変数名」が型の外に出られない。

---

## Discriminated Union

「種類ごとに持つデータが違う」ものはすべてこれ。optional の寄せ集めにしない。

```ts
// 入力部品の状態。表示・aria 属性・:state() がここで決まる
export type FieldState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'invalid'; readonly message: string; readonly userTouched: boolean }
  | { readonly kind: 'busy'; readonly label: string }
  | { readonly kind: 'disabled'; readonly reason?: string }

export const ariaFor = (s: FieldState): AriaAttrs => {
  switch (s.kind) {
    case 'idle': return {}
    case 'invalid': return { 'aria-invalid': 'true', 'aria-describedby': 'error' }
    case 'busy': return { 'aria-busy': 'true' }
    case 'disabled': return { 'aria-disabled': 'true' }
    default: { const _: never = s; return _ }
  }
}
```

`default` の `never` で「メンバーを足したのに分岐を足していない」がコンパイルエラーになる。

CEM の member も同じ形で扱う：

```ts
export type CemMember =
  | { readonly kind: 'attribute'; readonly name: string; readonly type: string; readonly default?: string }
  | { readonly kind: 'event'; readonly name: string; readonly detail: string }
  | { readonly kind: 'slot'; readonly name: string }
  | { readonly kind: 'csspart'; readonly name: string }
  | { readonly kind: 'cssprop'; readonly name: CssVarName }
  | { readonly kind: 'state'; readonly name: string }
```

---

## Utility Types

派生型は手書きしない。元の型が変わったら派生も自動で追随させる。

```ts
export type ButtonProps = {
  readonly variant: ButtonVariant
  readonly size: 'sm' | 'md' | 'lg'
  readonly loading: boolean
  readonly disabled: boolean
  readonly type: 'button' | 'submit' | 'reset'
}

export type ButtonArgs = Partial<ButtonProps>                       // Storybook の args
export type ButtonVisual = Pick<ButtonProps, 'variant' | 'size'>    // VRT のマトリクス軸
export type ReactButtonProps = Omit<ButtonProps, 'type'> & { readonly type?: ButtonProps['type'] }
```

よく使うもの: `Omit` `Pick` `Partial` `Required` `Readonly` `Extract` `Exclude`
`NonNullable` `Awaited` `Parameters` `ReturnType` `Record`。

---

## Conditional / Mapped Types

「トークンの `$type` ごとに値の形が違う」を 1 つの型関数で表す。

```ts
export type TokenValueOf<T extends TokenType> =
  T extends 'color' ? { colorSpace: 'oklch'; components: readonly [number, number, number]; hex?: string }
  : T extends 'dimension' ? { value: number; unit: 'rem' | 'px' }
  : T extends 'duration' ? { value: number; unit: 'ms' }
  : T extends 'fontWeight' ? number
  : never

// $type → 出力器、を型安全に持つレジストリ
type Emitters = { readonly [K in TokenType]: (v: TokenValueOf<K>) => string }

export const cssEmitters: Emitters = {
  color: (v) => `oklch(${v.components.join(' ')})`,
  dimension: (v) => `${v.value}${v.unit}`,
  duration: (v) => `${v.value}${v.unit}`,
  fontWeight: (v) => String(v),
  // $type を足して出力器を足し忘れるとコンパイルエラー
}
```

レジストリを Mapped Type で持つと、「union にメンバーを足したのに実装を足していない」が
必ずコンパイルエラーになる。**これが拡張性の中核**。

### `as const` から型を導く

```ts
// tokens.ts（生成物）
export const tokens = { color: { text: { default: 'var(--rd-color-text-default)' } } } as const
export type Tokens = typeof tokens
type Leaves<T> = T extends string ? T : { [K in keyof T]: Leaves<T[K]> }[keyof T]
export type CssVarRef = Leaves<Tokens>   // 'var(--rd-color-text-default)' | …
```

### テンプレートリテラル型

```ts
type RdEventName = `rd-${string}`
type CssPart = 'control' | 'label' | 'hint' | 'error'
```

---

## 迷ったときの判断表

| 症状                                    | 使うもの                   |
| --------------------------------------- | -------------------------- |
| 同じ `string` を取り違えそう            | Branded type               |
| optional が 3 個以上並ぶ                | Discriminated union に分解 |
| 「A のときだけ B が必須」               | Discriminated union        |
| 元の型に追随させたい派生型              | Utility Types              |
| 種類ごとに違う実装/設定を全部そろえたい | Mapped Type のレジストリ   |
| 失敗しうる変換                          | `Result` を返すパース関数  |
