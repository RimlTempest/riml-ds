/**
 * vite alias `@rd-shadow` の型。実体は `apps/storybook/.storybook/shadow.ts`。
 * ティア B/C の story が shadow 内を見るときだけ使う（ティア A は light DOM なので不要）。
 */
declare module '@rd-shadow' {
  export const queryShadow: (host: Element | null | undefined, selector: string) => Element | null
  export const shadowText: (host: Element | null | undefined, selector: string) => string
}
