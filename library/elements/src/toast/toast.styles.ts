import { css, type CSSResult } from 'lit'

/**
 * shadow 完結（ティア C、ADR-0012）。`popover` があれば最前面（top layer）に出るので位置指定だけを持つ。
 * `position-area`（Baseline Newly）はアンカー要素が要る指定で、画面の隅に固定する用途には使わない。
 * 右下固定は論理プロパティ（`inset-block` / `inset-inline`）で書くので RTL でも左右が入れ替わる。
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
      gap: var(--rd-space-4);
      align-items: center;
      inset-block: auto var(--rd-space-4);
      inset-inline: auto var(--rd-space-4);
      z-index: var(--rd-layer-toast);
      max-inline-size: min(90vi, 40ch);
      margin: 0;
      padding-block: var(--rd-space-2);
      padding-inline: var(--rd-space-4);
      border-width: 0;
      border-style: solid;
      border-color: transparent;
      border-radius: var(--rd-radius-md);
      background: var(--rd-color-surface-raised);
      box-shadow: var(--rd-shadow-raised);
      color: var(--rd-color-text-default);
      font: inherit;

      /* 小さな窓（docs/brand.md §7.7）。tone は左端 0.5rem の帯だけで示し、
         本文は常にインク on 窓。意味は文言そのものが持つ（accessibility.md 9） */
      border-inline-start-width: var(--rd-space-2);
      border-inline-start-color: var(--rd-color-status-info-default);
    }

    :host([open]) [part='control'] {
      display: flex;
    }

    [part='control'][data-tone='success'] {
      border-inline-start-color: var(--rd-color-status-success-default);
    }

    [part='control'][data-tone='warning'] {
      border-inline-start-color: var(--rd-color-status-warning-default);
    }

    [part='control'][data-tone='danger'] {
      border-inline-start-color: var(--rd-color-status-danger-default);
    }

    [part='message'] {
      margin: 0;
      line-height: var(--rd-line-height-body);
    }

    [part='close'] {
      flex: none;
      min-block-size: var(--rd-sizing-target-min);
      min-inline-size: var(--rd-sizing-target-min);
      padding-inline: var(--rd-space-2);
      border-width: var(--rd-border-width-default);
      border-style: solid;
      border-color: transparent;
      border-radius: var(--rd-radius-full);
      background: transparent;
      color: var(--rd-color-text-default);
      font: inherit;
      cursor: pointer;
    }

    @media (hover: hover) {
      [part='close']:hover {
        background: var(--rd-color-surface-hover);
      }
    }

    [part='close']:focus-visible {
      outline: var(--rd-focus-ring-width) solid var(--rd-focus-ring-color);
      outline-offset: var(--rd-focus-ring-offset);
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
      }

      [part='close']:focus-visible {
        outline-color: Highlight;
      }
    }
  }
`
