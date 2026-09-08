import { css, type CSSResult } from 'lit'

/**
 * ティア B（ADR-0012）。2 つの面の中身は light DOM なので見た目は利用側が持つが、
 * **並べ方とつまみは shadow が持つ**（つまみは shadow にしか無い要素だから）。
 *
 * 割合は host にインラインで書かれる `--rd-splitter-position`（`splitter.dom.ts`）を
 * `grid-template-*` が読む。JS が無いあいだは変数が無いので既定の 50% になり、
 * そもそも `:not(:defined)` の `splitter.css` が縦積みにする。
 */
export const styles: CSSResult = css`
  @layer rd.components {
    /* 3 本の軌道: 始端の面 / つまみ / 残り全部。つまみは内容の太さ（auto） */
    :host {
      display: grid;
      grid-template-columns: minmax(0, var(--rd-splitter-position, 50%)) auto minmax(0, 1fr);
      block-size: 100%;
    }

    :host([hidden]) {
      display: none;
    }

    /* 面の並びが縦になると軌道も行に移る。direction 属性は見た目なので属性セレクタで当てる */
    :host([direction='vertical']) {
      grid-template-columns: none;
      grid-template-rows: minmax(0, var(--rd-splitter-position, 50%)) auto minmax(0, 1fr);
    }

    /* 溢れたら面ごと転がす。min-*-size: 0 が無いと grid の軌道が内容に押し広げられる */
    [part='start'],
    [part='end'] {
      min-inline-size: 0;
      min-block-size: 0;
      overflow: auto;
    }

    /* 見える太さは --rd-splitter-size。当たり領域は ::before が別に持つ */
    [part='handle'] {
      position: relative;
      inline-size: var(--rd-splitter-size, var(--rd-space-2));
      background: var(--rd-color-border-default);
      cursor: col-resize;
      touch-action: none;
    }

    :host([direction='vertical']) [part='handle'] {
      inline-size: auto;
      block-size: var(--rd-splitter-size, var(--rd-space-2));
      cursor: row-resize;
    }

    /* 標的は 44px（WCAG 2.5.5 AAA）。見た目を太らせずに当たり領域だけ横へ広げる */
    [part='handle']::before {
      content: '';
      position: absolute;
      inset-block: 0;
      inset-inline: calc(
        (var(--rd-sizing-target-min) - var(--rd-splitter-size, var(--rd-space-2))) / -2
      );
    }

    /* ::before の分だけ詳細度が上がるので :where() で属性を 0 にする（stylelint 0,3,0） */
    :host(:where([direction='vertical'])) [part='handle']::before {
      inset-inline: 0;
      inset-block: calc(
        (var(--rd-sizing-target-min) - var(--rd-splitter-size, var(--rd-space-2))) / -2
      );
    }

    /* 色だけに頼らない: つまみは形（太さ）と位置で分かる。色は状態の補助 */
    [part='handle']:hover,
    [part='handle']:focus-visible {
      background: var(--rd-color-accent-default);
    }

    /* :state() は Newly なので @supports の中だけ（docs/baseline.md）。
       無いブラウザではドラッグ中の色と選択止めが効かないだけで、操作は変わらない */
    @supports selector(:state(dragging)) {
      :host(:state(dragging)) {
        user-select: none;
      }

      :host(:state(dragging)) [part='handle'] {
        background: var(--rd-color-accent-default);
      }
    }

    @media (prefers-reduced-motion: no-preference) {
      [part='handle'] {
        transition: background-color var(--rd-motion-duration-fast) var(--rd-motion-easing-standard);
      }
    }

    @media (forced-colors: active) {
      [part='handle'] {
        background: CanvasText;
      }

      [part='handle']:focus-visible {
        background: Highlight;
      }
    }
  }
`
