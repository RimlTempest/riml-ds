import { css, type CSSResult } from 'lit'

/**
 * shadow は**枠だけ**（ティア B、ADR-0012）。トリガーもリストも light DOM なので、
 * 見た目の大半は `menu.css` が持つ（`::slotted()` は子孫に届かない）。
 */
export const styles: CSSResult = css`
  @layer rd.components {
    :host {
      display: inline-block;
    }

    :host([hidden]) {
      display: none;
    }

    [part='control'] {
      display: contents;
    }
  }
`
