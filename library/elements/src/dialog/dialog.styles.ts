import { css, type CSSResult } from 'lit'
import { windowChrome } from '../_shared/window-chrome.js'

/**
 * shadow の枠だけ。内容の見た目は利用側の CSS が light DOM の slot 内容に当てる。
 * 骨格は「まど」（docs/brand.md §7.1）: 帯 ⊃ 見出し、本体が面、硬い影。
 * 帯そのものは `_shared/window-chrome.ts` から挿す（`rd-window` と 1 か所で共有する）。
 * light DOM 側の同じ見た目は `@rimltempest/riml-ds-css` の `.rd-window-*`
 * （shadow は light DOM のクラスを参照できない）。記号の一致は window-chrome.test.ts が固定する。
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

    ${windowChrome}

    /* 見出しは 2 列目に固定する（× が無い persistent でも 1 列目に落ちない） */
    [part='label'] {
      grid-column: 2;
      overflow: hidden;
      justify-self: center;
      max-inline-size: 100%;
    }

    ::slotted([slot='label']) {
      overflow: hidden;
      margin: 0;
      color: inherit;
      font: var(--rd-type-heading-2);
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
    }
  }
`
