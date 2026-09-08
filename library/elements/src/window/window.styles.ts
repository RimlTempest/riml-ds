import { css, type CSSResult } from 'lit'
import { windowChrome } from '../_shared/window-chrome.js'

/**
 * shadow の枠と帯だけ。見出しと本文は slot（light DOM）なので `::slotted()` で最小限だけ当てる。
 * 帯そのものは `_shared/window-chrome.ts` と共有し、`patterns.css` の `.rd-window-*` と
 * 同じ見た目にする（記号の data URI は `window-chrome.test.ts` が一致を固定する）。
 */
export const styles: CSSResult = css`
  @layer rd.components {
    :host {
      display: block;
      overflow: clip;
      border-radius: var(--rd-radius-lg);
      background: var(--rd-color-surface-raised);
      box-shadow: var(--rd-shadow-raised);
      color: var(--rd-color-text-default);
    }

    :host([hidden]) {
      display: none;
    }

    /* 広げるのは画面を覆うだけ。モーダルでもフォーカストラップでもない（ADR-0014 / 保守メモ） */
    :host([expanded]) {
      position: fixed;
      z-index: var(--rd-layer-overlay);
      overflow: auto;
      inset: var(--rd-window-expanded-inset, var(--rd-space-4));
      box-shadow: var(--rd-shadow-overlay);
    }

    ${windowChrome}

    /* 帯の色を変える。文字色は必ず対応する on-*（brand.md §9） */
    :host([tone='accent']) [part='bar'] {
      background: var(--rd-color-accent-default);
      color: var(--rd-color-text-on-accent);
    }

    :host([tone='warning']) [part='bar'] {
      background: var(--rd-color-status-warning-default);
      color: var(--rd-color-text-on-status);
    }

    :host([tone='danger']) [part='bar'] {
      background: var(--rd-color-status-danger-default);
      color: var(--rd-color-text-on-status);
    }

    /* 見出しは 2 列目に固定する（操作が無くても 1 列目に落ちない） */
    [part='title'] {
      grid-column: 2;
      overflow: hidden;
      justify-self: center;
      max-inline-size: 100%;
    }

    ::slotted([slot='title']) {
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

    @media (forced-colors: active) {
      :host {
        border-width: var(--rd-border-width-default);
        border-style: solid;
        border-color: CanvasText;
      }

      /* tone より後に、同じ詳細度で置く（低いと tone の色が残る） */
      :host([tone]) [part='bar'] {
        background: Canvas;
        color: CanvasText;
      }
    }
  }
`
