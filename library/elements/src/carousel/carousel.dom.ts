/**
 * `rd-carousel` が light DOM を読み書きする層。判断はすべて `carousel.logic.ts`（純関数）が
 * 済ませていて、ここにあるのは「読む・書く・観る」だけ（`*.element.ts` を薄く保つ。ADR-0005）。
 *
 * **枚（`<li>`）に `role` は書かない。** `<ul>` の子は暗黙の `listitem` でなければならず
 * （axe `list` / `aria-allowed-role`）、足すのは名前（`aria-label`）と役割の言い換えだけ。
 */
import { html, type TemplateResult } from 'lit'
import { syncAttribute } from '../_shared/internals.js'
import { usesJapaneseCopy } from '../_shared/lang.js'
import { contract, ITEM_SELECTOR } from './carousel.contract.js'
import {
  buttonCopy,
  computeStates,
  contractProblems,
  counterText,
  pickVisible,
} from './carousel.logic.js'

/** 前へ／次への強化ノード。契約の子ではないので、描き終わるまでは `undefined` */
export type Buttons = {
  readonly prev: HTMLElement | undefined
  readonly next: HTMLElement | undefined
}

const asElement = (node: Element | null): HTMLElement | undefined =>
  node instanceof HTMLElement ? node : undefined

/** 横に転がる箱（`<ul>`）。`IntersectionObserver` の `root` になる */
export const readTrack = (host: ParentNode): HTMLElement | undefined =>
  asElement(host.querySelector(contract.roles.track))

export const readItems = (host: ParentNode): readonly HTMLLIElement[] =>
  [...host.querySelectorAll(ITEM_SELECTOR)].filter(
    (item): item is HTMLLIElement => item instanceof HTMLLIElement,
  )

export const readButtons = (host: ParentNode): Buttons => ({
  prev: asElement(host.querySelector("[part='prev']")),
  next: asElement(host.querySelector("[part='next']")),
})

/**
 * 各枚に「n / N」の名前と、スライドという役割の言い換えを付ける。
 * 枚の**中身には触らない**（利用側が書いたカードをそのまま残す）。
 */
export const labelSlides = (items: readonly HTMLLIElement[]): void => {
  items.forEach((item, index) => {
    item.setAttribute('aria-roledescription', 'slide')
    item.setAttribute('aria-label', counterText(index, items.length))
  })
}

/**
 * 枚を頭に合わせる。**`behavior: 'auto'`** で呼ぶ——滑らかさは CSS の `scroll-behavior`
 * （`prefers-reduced-motion` で切り替わる）が決める。JS が `'smooth'` を書くと利用者の設定を踏み越える。
 */
export const scrollToItem = (items: readonly HTMLLIElement[], index: number): void => {
  items[index]?.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'auto' })
}

/**
 * 見えている枚を追う。`scrollend` は Safari 26.2 以降だけ、`scrollsnapchange` は Chromium だけ
 * なので、全エンジンにある `IntersectionObserver` を使う（`docs/proposals/carousel.md`）。
 * 戻り値を呼ぶと観るのをやめる。
 */
export const watchVisible = (
  track: HTMLElement | undefined,
  items: readonly HTMLLIElement[],
  onVisible: (index: number) => void,
): (() => void) => {
  if (track === undefined) {
    return () => {}
  }
  const numbers = new Map<Element, number>(items.map((item, index) => [item, index]))
  const ratios = new Map<number, number>()
  let current = 0
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const index = numbers.get(entry.target)
        if (index !== undefined) {
          ratios.set(index, entry.intersectionRatio)
        }
      })
      const seen = [...ratios].map(([index, ratio]) => ({ index, ratio }))
      current = pickVisible(seen, current)
      onVisible(current)
    },
    // 「半分以上見えている枚」を現在位置にする。同率なら `pickVisible` が先頭を選ぶ
    { root: track, threshold: [0.5, 1] },
  )
  items.forEach((item) => {
    observer.observe(item)
  })
  return () => {
    observer.disconnect()
  }
}

/**
 * 端に来たことをボタンに写す。`disabled` は使わない——押せないボタンもフォーカスは
 * 受け取れるままにする（skill §4）。`loop` があれば端は無いので何も付かない。
 */
export const syncButtons = (buttons: Buttons, states: ReadonlySet<string>): void => {
  syncAttribute(buttons.prev, 'aria-disabled', states.has('at-start') ? 'true' : undefined)
  syncAttribute(buttons.next, 'aria-disabled', states.has('at-end') ? 'true' : undefined)
}

/**
 * 契約と属性から `:state()` の集合を作る。枚の数は毎回 light DOM から数える
 * （利用側が `<li>` を足し引きしても追随する）。
 */
export const carouselStates = (
  host: ParentNode,
  input: {
    readonly index: number
    readonly loop: boolean
    readonly label: string
    readonly contractOk: boolean
  },
): ReadonlySet<string> =>
  computeStates({
    count: readItems(host).length,
    index: input.index,
    loop: input.loop,
    unlabeled: input.label === '',
    malformed: !input.contractOk,
  })

/**
 * 強化ノード。既存の子の**末尾に**足される（利用側の `<ul>` は触らない）。
 * `<output>` は暗黙のライブリージョンなので `aria-live` は書かない（ネイティブに任せる）。
 * 「‹」「›」に `aria-hidden` は要らない——`aria-label` が名前として勝つ。
 */
export const controlsTemplate = (
  host: HTMLElement,
  index: number,
  handlers: { readonly prev: () => void; readonly next: () => void },
): TemplateResult => {
  const copy = buttonCopy(usesJapaneseCopy(host))
  return html`<div part="controls">
    <button type="button" part="prev" aria-label=${copy.prev} @click=${handlers.prev}>‹</button
    ><output part="counter">${counterText(index, readItems(host).length)}</output
    ><button type="button" part="next" aria-label=${copy.next} @click=${handlers.next}>›</button>
  </div>`
}

/**
 * 契約と名前の不足を開発者に知らせる。利用者の画面には何も出さない——
 * 契約が破れていても列は横スクロールできるまま（ティア A）。文言は純関数が組む。
 */
export const complain = (missing: readonly string[], label: string): void => {
  contractProblems(missing, label).forEach((problem) => {
    console.error(`[rd-carousel] ${problem}`)
  })
}
