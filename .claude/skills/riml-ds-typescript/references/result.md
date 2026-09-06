# Result

```ts
// shared: library/elements/src/internal/result.ts と tools/*/src/result.ts に同じものを置く
// （パッケージ間で import しない。小さいので重複を許す）
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })
```

## エラー型はタグ付き

```ts
export type ParseTokenError =
  | { readonly kind: 'missing_type'; readonly path: TokenPath }
  | { readonly kind: 'unknown_type'; readonly path: TokenPath; readonly type: string }
  | { readonly kind: 'unresolved_alias'; readonly path: TokenPath; readonly ref: string }
```

- `kind` で switch し、`default: { const _: never = e }` で網羅を型で保証する。
- 文字列 1 本のエラー（`err('invalid')`）は、呼び出し側が分岐する必要のないときだけ。

## 境界での変換

| 境界                 | 変換                                                                           |
| -------------------- | ------------------------------------------------------------------------------ |
| CLI（`tools/*`）     | `main` で `if (!r.ok) { printDiagnostic(r.error); process.exitCode = 1 }`      |
| 部品（`*.element.ts`）| `console.error('[rd-text-field] label is required')` + `internals.states.add('unlabeled')` |
| Storybook / test     | `expect(r).toEqual(ok(…))`。`ok` だけでなく `err` の枝も必ずテスト               |

部品は **利用側に例外を投げない**。属性の不正値は既定値に落とし、`:state(invalid-attr)` と
開発ビルドの `console.warn` で知らせる。
