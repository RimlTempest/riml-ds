---
name: riml-ds-typescript
description: riml-ds の TypeScript コーディング規約。TS を書く・直す・レビューする前に必ず読む。any/as/!/enum を禁止し、class は *.element.ts だけに許す。Result・Branded 型・discriminated union で状態を型に落とし、依存は関数引数で注入する。「型が決まらない」「as で通した」「Lit の class にロジックを書きそう」「エラーをどう返すか」「モックできない」ときに発火。
---

# riml-ds TypeScript 規約

型で「起こりえない状態」をコンパイル時に消す。禁止事項は `.oxlintrc.json` の `riml-ds/*`
ルールで機械的に強制される。lint が落ちたら回避せず設計を直す。

## 0. まずこれだけ

| やること                                          | やらないこと                                   |
| ------------------------------------------------- | ---------------------------------------------- |
| `Result<T, E>` を返す                             | ドメイン（`*.logic.ts`、`tools/*`）で `throw`  |
| 型ガード / 判別可能ユニオンで絞る                 | `as` でねじ伏せる（`as const` だけ許可）       |
| ファクトリ関数 + クロージャ                       | `class`（`*.element.ts` を除く、ADR-0005）     |
| `const X = {...} as const` + 値のユニオン         | `enum`                                         |
| 引数で依存を受け取る                              | モジュールスコープの実体を直接呼ぶ             |
| `unknown` + パース                                | `any`                                          |
| `*.element.ts` は殻。ロジックは `*.logic.ts`      | Lit の class にロジックを書く                  |

## 1. 禁止事項と代替

### `any` 禁止

外部入力（属性値・`tokens.json`・CEM・CLI 引数）は `unknown` で受け、
`(input: unknown) => Result<T, ParseError>` のパース関数で境界を越えさせる。
詳細は [references/result.md](references/result.md)。

### `as` 禁止（`as const` のみ許可）

- 絞り込みは型ガード（`value is T`）か判別可能ユニオンの `switch`。
- オブジェクトリテラルの型検査は `satisfies`。
- `!`（non-null assertion）も禁止。`undefined` の場合を必ず書く。
- DOM の取得（`shadowRoot.querySelector`）は `null` を返す。`instanceof` で絞るか、
  `Result` にして呼び出し側に返す。

### `class` は `*.element.ts` だけ

Custom Elements は class でしか定義できない（ADR-0005）。`library/elements/src/**/*.element.ts`
にだけ書き、**薄い殻**に留める。ロジック（属性の集合の計算、値の検証、状態遷移）は
隣の `*.logic.ts` の純関数に置く。詳細は [references/element-shell.md](references/element-shell.md)。

それ以外の場所で状態と振る舞いが要るならファクトリ関数 + クロージャ
（[references/function-di.md](references/function-di.md)）。`interface` ではなく `type`。

### `enum` 禁止

```ts
export const ButtonVariant = { primary: 'primary', secondary: 'secondary', ghost: 'ghost', danger: 'danger' } as const
export type ButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant]
```

属性値の型はこの形で作り、CEM の `@attr {ButtonVariant}` に載せる。

### `default export` 禁止（`*.stories.ts` と設定ファイルを除く）

Storybook の CSF3 は default export を要求するので `*.stories.ts` だけ許す。

## 2. 型でユースケースを表現する

| 道具                           | riml-ds での使いどころ                                                   |
| ------------------------------ | ------------------------------------------------------------------------ |
| Branded type                   | `TokenPath`（`color.text.default`）、`CssVarName`（`--rd-…`）、`TagName`（`rd-…`） |
| Discriminated union            | 部品の状態（`idle / loading / invalid`）、CEM の member 種別、lint の診断 |
| Utility Types                  | `Pick<ButtonProps, 'variant' | 'size'>`、`Readonly<Tokens>`               |
| Conditional / Mapped Types     | `tokens.ts` の `as const` から CSS 変数名の型を導く                       |

**原則: 不正な状態を表現できない型にする。** 「`loading` のときだけ `progress` がある」なら
optional ではなく union のメンバーとして持つ。詳細は [references/type-patterns.md](references/type-patterns.md)。

## 3. エラーは値。`Result<T, E>`

```ts
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }
```

- `E` はタグ付き構造体の判別可能ユニオン。文字列メッセージではない。
- `throw` は「呼び出し側が回復できないバグ」だけ。CLI（`tools/*`）は `main` で `Result` を
  exit code に変換する。部品は `console.error` + `:state(…)` に変換する（利用側に投げない）。

## 4. 依存は関数引数で注入する

```ts
type Deps = { readonly readFile: (p: string) => Promise<Result<string, IoError>> }
export const makeLoadManifest = (deps: Deps) => async (path: string): Promise<Result<Manifest, LoadError>> => { /* … */ }
```

- ユースケースは「依存 → 入力 → 結果」の 2 段カリー化。
- 依存の型は利用側が定義する。実装側の型を import しない。
- 配線は composition root（各 CLI の `main.ts`、部品では `*.element.ts` の constructor）だけ。
- 部品では **時計・`requestAnimationFrame`・`matchMedia`** も logic 関数の引数で受ける。

## 5. モジュール境界

```
system/tokens/src       … JSON のみ。TS は terrazzo.config.ts だけ
system/css              … CSS のみ
library/elements/src/<name>/
  <name>.logic.ts       … 純関数。DOM を import しない（型 `HTMLElement` の参照は可、実体は不可）
  <name>.element.ts     … class。logic を呼ぶだけ
  <name>.styles.ts      … css`` のみ
  <name>.define.ts      … customElements.define のみ
tools/*                 … node。lit を import しない
```

`library/elements` は `lit` と `@riml-ds/tokens` 以外に依存しない。
`system/*` は `library/*` を import しない（CI の `guard` で落ちる）。

## 6. TypeScript 設定

`strict`、`exactOptionalPropertyTypes`、`noUncheckedIndexedAccess`、`verbatimModuleSyntax`、
`isolatedDeclarations`（公開パッケージ）。`isolatedDeclarations` のため **export する関数は
戻り値の型を明示**する。

## 7. レビュー用チェックリスト

[references/checklist.md](references/checklist.md) を通す。
