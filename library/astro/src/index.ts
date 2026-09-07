/**
 * 生成物に乗らない手書き部分（ADR-0002 §決定 3）。
 *
 * `layers.css` -> `tokens.css` -> `@rimltempest/riml-ds-css` の順で全ページに注入し、部品 CSS も
 * ここで 1 回だけ入れる（`.astro` 部品の `<style is:global>` に置くと部品の数だけ重複する）。
 * `define` は既定で入れない。ティア A/B は JS 無しで動く・読めるのが前提で、`client:*` も要らない
 * （ADR-0012）。インタラクションが要るページだけ `define: ['dialog']` のように足す。
 */
import type { AstroIntegration } from 'astro'

export type RimlDsOptions = {
  /** ページの JS に `define` を読ませる部品名（`['dialog']`）。既定は無し */
  readonly define?: readonly string[]
  /** 部品 CSS。`'all'`（既定）は `styles.css` 1 つ、配列なら部品ごとの `style.css` */
  readonly styles?: 'all' | readonly string[]
}

const BASE_CSS = [
  `import '@rimltempest/riml-ds-css/layers.css'`,
  `import '@rimltempest/riml-ds-tokens/tokens.css'`,
  `import '@rimltempest/riml-ds-css'`,
].join('\n')

const componentCss = (styles: 'all' | readonly string[]): string =>
  styles === 'all'
    ? `import '@rimltempest/riml-ds-elements/styles.css'`
    : styles.map((name) => `import '@rimltempest/riml-ds-elements/${name}/style.css'`).join('\n')

export const rimlDs = (options: RimlDsOptions = {}): AstroIntegration => ({
  name: '@rimltempest/riml-ds-astro',
  hooks: {
    'astro:config:setup': ({ injectScript }) => {
      injectScript('page-ssr', `${BASE_CSS}\n${componentCss(options.styles ?? 'all')}\n`)
      const define = options.define ?? []
      if (define.length > 0) {
        injectScript(
          'page',
          `${define
            .map((name) => `import '@rimltempest/riml-ds-elements/${name}/define'`)
            .join('\n')}\n`,
        )
      }
    },
  },
})
