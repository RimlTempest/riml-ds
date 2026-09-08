/**
 * 窓の帯（`docs/brand.md` §7.1、ADR-0014）を `rd-window` と `rd-dialog` で共有する。
 *
 * 帯 ⊃ 見出し。左端の丸は**装飾ではなく `<button>`** で、記号は幾何（× / □ / −）を
 * `mask` の data URI で描く。同じ見た目を light DOM 側でも出せるよう、
 * `@rimltempest/riml-ds-css` の `patterns.css` が同じ宣言を `.rd-window-*` のクラスで持つ。
 * **記号の data URI は 2 か所で同じ文字列**であることを
 * `library/elements/test/window-chrome.test.ts` が固定する。色・寸法は VRT でしか揃わない。
 */
import { css, type CSSResult, unsafeCSS } from 'lit'
import { type LangHost, usesJapaneseCopy } from './lang.js'

export type WindowAction = 'close' | 'expand' | 'collapse'

/**
 * 記号は `viewBox 0 0 16 16` / `stroke-width 2` / `stroke-linecap round` の線だけ。
 * `mask` は既定で alpha を見るので、SVG の色は不透明でありさえすればよい。
 * 参考にした画面の絵・アイコン・ロゴは持ち込まない（brand.md §9）。
 */
export const WINDOW_GLYPHS = {
  close:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M4 4 12 12'/%3E%3Cpath d='M12 4 4 12'/%3E%3C/svg%3E\")",
  expand:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round'%3E%3Crect x='3' y='3' width='10' height='10' rx='1'/%3E%3C/svg%3E\")",
  collapse:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M4 8 12 8'/%3E%3C/svg%3E\")",
} as const satisfies Readonly<Record<WindowAction, string>>

const JA: Readonly<Record<WindowAction, string>> = {
  close: '閉じる',
  expand: '広げる',
  collapse: 'たたむ',
}

const EN: Readonly<Record<WindowAction, string>> = {
  close: 'Close',
  expand: 'Expand',
  collapse: 'Collapse',
}

/** ボタンの `aria-label`。最も近い `[lang]` で日英を選ぶ（`_shared/lang.ts`） */
export const windowControlLabels = (host: LangHost): Readonly<Record<WindowAction, string>> =>
  usesJapaneseCopy(host) ? JA : EN

/**
 * shadow の帯。`[part='bar']` ⊃ `[part='controls']` + 見出しの入れ物。
 * ボタンは `[data-action]` で選ぶ（`rd-dialog` の `<dialog>` が `part="control"` を先に使っている）。
 */
export const windowChrome: CSSResult = css`
  /* 1 列目 = 操作、2 列目 = 見出し、3 列目 = 空（左右対称の余白）。見出しは短ければ中央 */
  [part='bar'] {
    display: grid;
    grid-template-columns:
      minmax(var(--rd-space-12), 1fr)
      minmax(0, auto)
      minmax(var(--rd-space-12), 1fr);
    align-items: center;
    column-gap: var(--rd-space-2);
    box-sizing: border-box;
    min-block-size: var(--rd-sizing-target-min);
    padding-inline: var(--rd-space-2);
    border-start-start-radius: var(--rd-radius-lg);
    border-start-end-radius: var(--rd-radius-lg);
    background: var(--rd-color-chrome-default);
    color: var(--rd-color-chrome-text);
  }

  /* 操作が 1 つも無いなら要素ごと省く。押せない丸は置かない（ADR-0014 決定 1） */
  [part='controls'] {
    display: flex;
    grid-column: 1;
    justify-self: start;
  }

  /* 当たり判定は sizing.target-min（2.75rem）四方、見た目の丸は 1.25rem（brand.md §7.1） */
  [data-action] {
    display: grid;
    grid-template-areas: 'glyph';
    place-items: center;
    box-sizing: border-box;
    inline-size: var(--rd-sizing-target-min);
    block-size: var(--rd-sizing-target-min);
    padding: 0;
    border-width: 0;
    border-radius: var(--rd-radius-full);
    background: transparent;
    color: inherit;
    cursor: default;

    --rd-window-control-size: 1.25rem;
    --rd-window-glyph-size: 0.75rem;
  }

  [data-action]::before,
  [data-action]::after {
    grid-area: glyph;
    box-sizing: border-box;
    content: '';
  }

  /* 丸は tone でも chrome.text のまま。塗りの上に文字は置かない（brand.md §9） */
  [data-action]::before {
    inline-size: var(--rd-window-control-size);
    block-size: var(--rd-window-control-size);
    border-radius: var(--rd-radius-full);
    background: var(--rd-color-chrome-text);
  }

  /* 記号は幾何（× / □ / −）だけ。絵・アイコンフォントは持ち込まない（ADR-0014） */
  [data-action]::after {
    inline-size: var(--rd-window-glyph-size);
    block-size: var(--rd-window-glyph-size);
    background: var(--rd-color-chrome-default);
    mask: var(--rd-window-glyph) center / contain no-repeat;
  }

  /* stylelint-disable value-keyword-case -- 補間は postcss-lit が大文字の識別子に置き換える */
  [data-action='close'] {
    --rd-window-glyph: ${unsafeCSS(WINDOW_GLYPHS.close)};
  }

  [data-action='expand'] {
    --rd-window-glyph: ${unsafeCSS(WINDOW_GLYPHS.expand)};
  }

  [data-action='collapse'] {
    --rd-window-glyph: ${unsafeCSS(WINDOW_GLYPHS.collapse)};
  }
  /* stylelint-enable value-keyword-case */

  /* 既定のリングは丸より大きいので消し、丸のすぐ外に描き直す（brand.md §7.1） */
  [data-action]:focus-visible {
    outline-width: 0;
  }

  [data-action]:hover::before,
  [data-action]:focus-visible::before {
    outline: 2px solid var(--rd-color-chrome-text);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: no-preference) {
    [data-action]:active {
      translate: 0 0.0625rem;
    }
  }

  /* 丸は消さない（操作だから）。ButtonFace の地 + ButtonText の縁と記号で出す */
  @media (forced-colors: active) {
    [part='bar'] {
      border-block-end: var(--rd-border-width-default) solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    [data-action]::before {
      border-width: var(--rd-border-width-default);
      border-style: solid;
      border-color: ButtonText;
      background: ButtonFace;
    }

    [data-action]::after {
      background: ButtonText;
    }
  }
`
