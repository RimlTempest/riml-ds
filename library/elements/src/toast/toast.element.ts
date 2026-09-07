import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit'
import { syncStates } from '../_shared/internals.js'
import {
  computeStates,
  nextToast,
  politenessFor,
  type ShowInput,
  shouldRunTimer,
  type Toast,
} from './toast.logic.js'
import { styles } from './toast.styles.js'

/** popover は Baseline Newly（docs/baseline.md）。無ければ shadow 内の固定配置に落ちる */
const popoverMode = (): string | undefined =>
  'popover' in HTMLElement.prototype ? 'manual' : undefined

/**
 * 一時的な通知。表示だけを持ち、**読み上げは `rd-live-region` に委譲する**（ADR-0008 §6）。
 * shadow 完結（ティア C、ADR-0012）で、JS が無ければ何も出ない（害が無い）。
 * `popover` があれば最前面（top layer）に、無ければ固定配置で右下に出る。
 *
 * @summary 一時的な通知。読み上げは rd-live-region に委譲する
 * @status experimental
 * @pe C
 * @dependency rd-live-region
 *
 * @csspart control - 通知の枠
 * @csspart message - 文言
 * @csspart close - 閉じるボタン
 * @event {CustomEvent<{ id: number }>} rd-dismiss - 閉じたときに発火
 * @state open - 表示中
 * @state info - tone=info（既定）
 * @state success - tone=success
 * @state warning - tone=warning
 * @state danger - tone=danger。読み上げだけ assertive になる
 */
export class RdToast extends LitElement {
  static override styles = styles

  static override shadowRootOptions = { ...LitElement.shadowRootOptions, serializable: true }

  static override properties: PropertyDeclarations = { open: { type: Boolean, reflect: true } }

  declare open: boolean

  #internals = this.attachInternals()
  #toast: Toast | undefined = undefined
  #paused = false
  #warned = false
  #count = 0
  #timer: ReturnType<typeof setTimeout> | undefined = undefined

  constructor() {
    super()
    this.open = false
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    clearTimeout(this.#timer)
  }

  override updated(): void {
    const tone = this.#toast?.tone ?? 'info'
    syncStates(this.#internals, computeStates({ open: this.open, tone }))
    this.#applyPopover()
    this.#restartTimer()
  }

  override render(): TemplateResult {
    const toast = this.#toast
    return html`<div
      part="control"
      popover=${popoverMode() ?? nothing}
      data-tone=${toast?.tone ?? 'info'}
      @pointerenter=${this.#pause}
      @pointerleave=${this.#resume}
      @focusin=${this.#pause}
      @focusout=${this.#resume}
    >
      <p part="message">${toast?.message ?? ''}</p>
      <button part="close" type="button" @click=${() => this.close()}>閉じる</button>
    </div>`
  }

  /** 文言を出し、`rd-live-region` に読み上げを委譲する。空（空白だけ）の文言は無視する */
  show(input: ShowInput): void {
    this.#count += 1
    const toast = nextToast(this.#count, input)
    if (toast === undefined) {
      return
    }
    this.#toast = toast
    this.#paused = false
    this.open = true
    this.#announce(toast)
  }

  close(): void {
    this.open = false
    const detail = { id: this.#toast?.id ?? 0 }
    this.dispatchEvent(new CustomEvent('rd-dismiss', { bubbles: true, composed: true, detail }))
  }

  /** 読み上げは持たない。ページの `rd-live-region` に渡す（無ければ 1 回だけ警告する） */
  #announce = (toast: Toast): void => {
    const region = document.querySelector('rd-live-region')
    if (region !== null && typeof region.announce === 'function') {
      region.announce(toast.message, { politeness: politenessFor(toast.tone) })
    } else if (!this.#warned) {
      this.#warned = true
      console.warn('[rd-toast] ページに <rd-live-region> が無いので読み上げられない（ADR-0008 §6）')
    }
  }

  /** 二重に呼ぶと InvalidStateError になるので、実際の表示状態と食い違うときだけ切り替える */
  #applyPopover = (): void => {
    const box = this.renderRoot.querySelector('[part=control]')
    if (!(box instanceof HTMLElement) || typeof box.showPopover !== 'function') {
      return
    }
    const shown = box.matches(':popover-open')
    if (this.open && !shown) {
      box.showPopover()
    } else if (!this.open && shown) {
      box.hidePopover()
    }
  }

  #restartTimer = (): void => {
    clearTimeout(this.#timer)
    this.#timer = undefined
    const toast = this.#toast
    const input = { open: this.open, paused: this.#paused, duration: toast?.duration ?? 0 }
    if (toast !== undefined && shouldRunTimer(input)) {
      this.#timer = setTimeout(() => {
        this.close()
      }, toast.duration)
    }
  }

  #pause = (): void => this.#setPaused(true)
  #resume = (): void => this.#setPaused(false)

  #setPaused = (paused: boolean): void => {
    this.#paused = paused
    this.requestUpdate()
  }
}
