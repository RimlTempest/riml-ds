/**
 * shadow 内の要素を 1 つ引く。ティア B/C の `play` でだけ使う（ティア A は light DOM なので不要）。
 * `!` を使わないため、見つからなければ `null` を返す（呼び側が `expect` で落とす）。
 */
export const queryShadow = (host: Element | null | undefined, selector: string): Element | null =>
  host?.shadowRoot?.querySelector(selector) ?? null

/** shadow 内のテキスト。読み上げ内容の assert に使う */
export const shadowText = (host: Element | null | undefined, selector: string): string =>
  queryShadow(host, selector)?.textContent?.trim() ?? ''

/**
 * `rd-dialog` の枠が `@starting-style` の遷移を終えているか。開いた枠は opacity が 1 に戻り
 * translate が無くなる、閉じた枠は display が none になる。遷移の途中を axe が掴むと
 * 半透明の枠が backdrop と混ざってコントラスト違反に見えるので、窓を開く story の `play` は
 * これが true になるまで `waitFor` する（`document.getAnimations()` の空だけを見ると、
 * まだ始まっていない瞬間を「終わった」と誤認する）。
 */
export const dialogsAreSteady = (root: ParentNode = document): boolean =>
  [...root.querySelectorAll('rd-dialog')].every((dialog) => {
    const control = queryShadow(dialog, "[part='control']")
    if (control === null) {
      return true
    }
    const style = getComputedStyle(control)
    return dialog.hasAttribute('open')
      ? style.opacity === '1' && style.translate === 'none'
      : style.display === 'none'
  })
