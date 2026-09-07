/**
 * vite alias `@rd-argtypes` の型。実体は `apps/storybook/.storybook/generated/argtypes.ts`
 * （`bun run gen` の生成物・gitignore）で、tsc には型だけを見せる。
 * 生成前でも `bun run typecheck` が通る。形は `tools/cem/src/core/argtypes.ts` の `ArgTypes` と同じ。
 */
declare module '@rd-argtypes' {
  type ArgType = {
    readonly control?: 'boolean' | 'text' | 'select' | false
    readonly options?: readonly string[]
    readonly description?: string
    readonly action?: string
    readonly table?: {
      readonly category: string
      readonly defaultValue?: { readonly summary: string }
    }
  }

  export const argTypes: Readonly<Record<string, Readonly<Record<string, ArgType>>>>
}
