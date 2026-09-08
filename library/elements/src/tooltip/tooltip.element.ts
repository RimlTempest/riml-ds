import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { syncStates } from '../_shared/internals.js'
import { anchorPopover } from '../_shared/popover-anchor.js'
import { computeTooltipView, parseDelay } from './tooltip.logic.js'
import { styles } from './tooltip.styles.js'

let sequence = 0

/** 既定の待ち時間。`--rd-tooltip-delay` で上書きできる */
const DEFAULT_DELAY = 400

/** popover は Baseline Newly（docs/baseline.md）。無ければ shadow 内の固定配置に落ちる */
const popoverMode = (): string | undefined =>
  'popover' in HTMLElement.prototype ? 'manual' : undefined

/**
 * 対象を説明する小さな吹き出し。**無くても害が無い**（ティア C、ADR-0012）——
 * JS が無ければ何も出ず、代わりは利用側が対象に書く `title`。
 * ホバーだけに頼らずフォーカスでも出し、Esc で閉じ、吹き出しに乗っても消えない（WCAG 1.4.13）。
 *
 * @summary 対象を説明する吹き出し。フォーカスでも出て Esc で閉じる
 * @status experimental
 * @pe C
 *
 * @slot - 説明の文言
 * @csspart control - 吹き出しの箱
 * @cssprop --rd-tooltip-delay - ポインタで開くまでの待ち時間。既定 400ms
 * @state open - 表示中
 * @state orphan - for の先が見つからない
 */
export class RdTooltip extends LitElement {
  static override styles = styles

  static override shadowRootOptions = { ...LitElement.shadowRootOptions, serializable: true }

  static override properties: PropertyDeclarations = { for: {} }

  /** 説明する相手の id（同じ木の中） */
  declare for: string

  #internals = this.attachInternals()
  #open = false
  #timer: ReturnType<typeof setTimeout> | undefined = undefined

  constructor() {
    super()
    this.for = ''
    this.id = this.id === '' ? `rd-tooltip-${(sequence += 1)}` : this.id
    // 自分自身への購読。要素が消えれば一緒に消えるので外す必要が無い
    this.addEventListener('pointerenter', this.#hold)
    this.addEventListener('pointerleave', this.#hide)
  }

  override connectedCallback(): void {
    super.connectedCallback()
    document.addEventListener('keydown', this.#onKeydown)
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    document.removeEventListener('keydown', this.#onKeydown)
    clearTimeout(this.#timer)
  }

  override firstUpdated(): void {
    const target = this.#target()
    if (target === undefined) {
      console.warn(`[rd-tooltip] for="${this.for}" の対象が無いので何も出さない`)
      return
    }
    if (!target.hasAttribute('title')) {
      console.warn(
        '[rd-tooltip] 対象に title が無い。JS が無いときの代替が消える（ADR-0012 ティア C）',
      )
    }
    const described = [target.getAttribute('aria-describedby') ?? '', this.id]
      .filter((part) => part !== '')
      .join(' ')
    target.setAttribute('aria-describedby', described)
    target.addEventListener('pointerenter', this.#delayedShow)
    target.addEventListener('pointerleave', this.#hide)
    target.addEventListener('focusin', this.#show)
    target.addEventListener('focusout', this.#hide)
  }

  override updated(): void {
    const view = computeTooltipView({ open: this.#open, orphan: this.#target() === undefined })
    syncStates(this.#internals, view.states)
    this.#applyPopover(view.visible)
    anchorPopover(this.#target(), this.#box(), this.id, { side: 'block-start' })
  }

  override render(): TemplateResult {
    return html`<div part="control" role="tooltip" popover=${popoverMode() ?? nothing}>
      <slot></slot>
    </div>`
  }

  #target = (): HTMLElement | undefined => {
    const root = this.getRootNode()
    const found =
      this.for === '' || !(root instanceof Document || root instanceof ShadowRoot)
        ? null
        : root.getElementById(this.for)
    return found instanceof HTMLElement ? found : undefined
  }

  #box = (): HTMLElement | undefined => {
    const box = this.renderRoot.querySelector('[part=control]')
    return box instanceof HTMLElement ? box : undefined
  }

  /** 二重に呼ぶと InvalidStateError になるので、実際の表示状態と食い違うときだけ切り替える */
  #applyPopover = (visible: boolean): void => {
    const box = this.#box()
    if (box === undefined || typeof box.showPopover !== 'function') {
      return
    }
    const shown = box.matches(':popover-open')
    if (visible && !shown) {
      box.showPopover()
    } else if (!visible && shown) {
      box.hidePopover()
    }
  }

  #setOpen = (open: boolean): void => {
    clearTimeout(this.#timer)
    this.#timer = undefined
    this.#open = open
    this.requestUpdate()
  }

  #show = (): void => this.#setOpen(true)
  #hide = (): void => this.#setOpen(false)
  /** 吹き出し自身に乗っている間は消さない（WCAG 1.4.13 Hoverable） */
  #hold = (): void => this.#setOpen(true)

  #delayedShow = (): void => {
    clearTimeout(this.#timer)
    const raw = getComputedStyle(this).getPropertyValue('--rd-tooltip-delay')
    this.#timer = setTimeout(this.#show, parseDelay(raw, DEFAULT_DELAY))
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.#hide()
    }
  }
}
