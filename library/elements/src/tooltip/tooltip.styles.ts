import { css, type CSSResult } from 'lit'

/**
 * shadow 完結（ティア C、ADR-0012）。popover があれば最前面（top layer）に出るので、
 * ここが持つのは面の見た目と「隠れているときの姿」だけ。位置は _shared/popover-anchor.ts。
 *
 * 面はインク（chrome.default）に反転文字（chrome.text）——docs/brand.md §7.1 の帯と
 * 同じ組み合わせで、system/tokens の contrast 検査が 7:1 を保証している対だけを使う
 * （--rd-color-text-inverse というトークンはこのリポジトリに無い）。
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
      position: fixed;
      display: none;
      box-sizing: border-box;
      inset: auto;
      z-index: var(--rd-layer-overlay);
      max-inline-size: min(90vi, 32ch);
      margin: 0;
      padding-block: var(--rd-space-1);
      padding-inline: var(--rd-space-2);
      border-width: 0;
      border-style: solid;
      border-color: transparent;
      border-radius: var(--rd-radius-md);
      background: var(--rd-color-chrome-default);
      color: var(--rd-color-chrome-text);
      font: var(--rd-type-small);
    }

    /* 表示は :state(open) が持つ。popover が使えないブラウザでも同じ 1 行で出る */
    @supports selector(:state(open)) {
      :host(:state(open)) [part='control'] {
        display: block;
      }
    }

    @supports not selector(:state(open)) {
      :host([open]) [part='control'] {
        display: block;
      }
    }

    @supports (position-area: block-start) {
      [part='control'] {
        position-area: block-start;
        position-try-fallbacks: flip-block;
      }
    }

    @media (prefers-reduced-motion: no-preference) {
      [part='control'] {
        transition: opacity var(--rd-motion-duration-fast) var(--rd-motion-easing-standard);
      }
    }

    @media (forced-colors: active) {
      [part='control'] {
        border-width: var(--rd-border-width-default);
        border-color: CanvasText;
        background: Canvas;
        color: CanvasText;
      }
    }
  }
`
