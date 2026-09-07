import { css, type CSSResult } from 'lit'

/** 視覚的には隠すが読み上げには残す（system/css の `.rd-visually-hidden` と同じ 5 宣言） */
export const styles: CSSResult = css`
  @layer rd.components {
    :host {
      position: absolute;
      display: block;
      overflow: hidden;
      inline-size: 0.0625rem;
      block-size: 0.0625rem;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    :host([hidden]) {
      display: none;
    }
  }
`
