import { css, type CSSResult } from 'lit'

/**
 * shadow は**枠だけ**（ティア B、ADR-0012）。タブの列もパネルも light DOM なので、
 * 見た目の大半は `tabs.css` が持つ（`::slotted()` は子孫に届かない）。
 * ここにあるのは「タブの列とパネルをどう並べるか」だけ。
 */
export const styles: CSSResult = css`
  @layer rd.components {
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    [part='control'] {
      display: grid;
      gap: var(--rd-space-4);
    }

    /* browser は帯からタブが生える見た目（brand.md §7.1）。帯と本体を離さない */
    :host([variant='browser']) [part='control'] {
      gap: 0;
    }

    /* 縦並びはタブの列が 1 列目、パネルが 2 列目。列は内容の幅、パネルは残り全部 */
    :host([orientation='vertical']) [part='control'] {
      grid-template-columns: max-content minmax(0, 1fr);
      align-items: start;
    }

    [part='panels'] {
      min-inline-size: 0;
    }

    :host([variant='browser']) [part='panels'] {
      padding: var(--rd-space-4);
      border-end-start-radius: var(--rd-radius-lg);
      border-end-end-radius: var(--rd-radius-lg);
      background: var(--rd-color-surface-raised);
      color: var(--rd-color-text-default);
    }

    @media (forced-colors: active) {
      :host([variant='browser']) [part='panels'] {
        border-width: var(--rd-border-width-default);
        border-style: solid;
        border-color: CanvasText;
        background: Canvas;
        color: CanvasText;
      }
    }
  }
`
