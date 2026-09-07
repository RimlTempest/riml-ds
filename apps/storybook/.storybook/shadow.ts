/**
 * shadow 内の要素を 1 つ引く。ティア B/C の `play` でだけ使う（ティア A は light DOM なので不要）。
 * `!` を使わないため、見つからなければ `null` を返す（呼び側が `expect` で落とす）。
 */
export const queryShadow = (host: Element | null | undefined, selector: string): Element | null =>
  host?.shadowRoot?.querySelector(selector) ?? null

/** shadow 内のテキスト。読み上げ内容の assert に使う */
export const shadowText = (host: Element | null | undefined, selector: string): string =>
  queryShadow(host, selector)?.textContent?.trim() ?? ''
