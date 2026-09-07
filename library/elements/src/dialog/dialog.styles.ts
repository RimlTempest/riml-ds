import { css, type CSSResult } from 'lit'

/** shadow の枠だけ。内容の見た目は利用側の CSS が light DOM の slot 内容に当てる */
export const styles: CSSResult = css`
  @layer rd.components {
    :host {
      display: contents;
    }

    :host([hidden]) {
      display: none;
    }

    [part='control'] {
      max-inline-size: min(90vi, 60ch);
      padding: var(--rd-space-6);
      border-width: var(--rd-border-width-default);
      border-style: solid;
      border-color: var(--rd-color-border-default);
      border-radius: var(--rd-radius-lg);
      background: var(--rd-color-surface-raised);
      box-shadow: var(--rd-shadow-overlay);
      color: var(--rd-color-text-default);
      font: inherit;
    }

    [part='control']::backdrop {
      background: var(--rd-color-overlay-default);
    }

    [part='label'] {
      margin-block-end: var(--rd-space-4);
      font: var(--rd-type-heading-2);
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
        border-color: CanvasText;
      }
    }
  }
`
