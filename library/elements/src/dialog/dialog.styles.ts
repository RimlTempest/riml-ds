import { css, type CSSResult } from 'lit'

/**
 * shadow の枠だけ。内容の見た目は利用側の CSS が light DOM の slot 内容に当てる。
 * 骨格は「まど」（docs/brand.md §7.1）: 見出しが帯、本体が面、硬い影。
 * 帯の宣言は `@rimltempest/riml-ds-css` の `.rd-window-title` と 2 か所にある
 * （shadow は light DOM のクラスを参照できない）。値はトークン参照だけなので追随する。
 */
export const styles: CSSResult = css`
  @layer rd.components {
    :host {
      display: contents;
    }

    :host([hidden]) {
      display: none;
    }

    [part='control'] {
      overflow: clip;
      max-inline-size: min(90vi, 60ch);
      padding: 0;
      border-width: 0;
      border-style: solid;
      border-color: transparent;
      border-radius: var(--rd-radius-lg);
      background: var(--rd-color-surface-raised);
      box-shadow: var(--rd-shadow-overlay);
      color: var(--rd-color-text-default);
      font: inherit;
    }

    [part='control']::backdrop {
      background: var(--rd-color-overlay-default);
    }

    /* 帯 = 見出し。丸 3 つは ::before の装飾で、DOM にも読み上げにも出ない */
    [part='label'] {
      display: grid;
      grid-template-columns: var(--rd-space-12) 1fr var(--rd-space-12);
      place-items: center;
      min-block-size: var(--rd-sizing-target-min);
      padding-inline: var(--rd-space-3);
      background: var(--rd-color-chrome-default);
      color: var(--rd-color-chrome-text);
      font: var(--rd-type-heading-2);
    }

    [part='label']::before {
      grid-column: 1;
      inline-size: var(--rd-space-12);
      block-size: var(--rd-space-3);
      background-image:
        radial-gradient(circle at 12.5% 50%, var(--rd-color-brand-signature) 45%, transparent 50%),
        radial-gradient(circle at 50% 50%, var(--rd-color-brand-primary) 45%, transparent 50%),
        radial-gradient(circle at 87.5% 50%, var(--rd-color-border-default) 45%, transparent 50%);
      content: '';
    }

    ::slotted([slot='label']) {
      grid-column: 2;
      overflow: hidden;
      max-inline-size: 100%;
      margin: 0;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    [part='body'] {
      padding: var(--rd-space-4);
    }

    ::slotted([slot='actions']) {
      margin-block-start: var(--rd-space-4);
    }

    @media (prefers-reduced-motion: no-preference) {
      [part='control'] {
        transition:
          opacity var(--rd-motion-duration-fast) var(--rd-motion-easing-standard),
          display var(--rd-motion-duration-fast) allow-discrete;
      }

      @supports (transition-behavior: allow-discrete) {
        @starting-style {
          [part='control'][open] {
            opacity: 0;
          }
        }
      }
    }

    @media (forced-colors: active) {
      [part='control'] {
        border-width: var(--rd-border-width-default);
        border-color: CanvasText;
      }

      [part='label'] {
        border-block-end: var(--rd-border-width-default) solid CanvasText;
        background: Canvas;
        color: CanvasText;
      }

      [part='label']::before {
        display: none;
      }
    }
  }
`
