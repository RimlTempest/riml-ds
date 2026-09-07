import { html, LitElement, type TemplateResult } from 'lit'
import {
  type AnnouncementQueue,
  emptyQueue,
  nextAnnouncement,
  type Politeness,
} from './live-region.logic.js'
import { styles } from './live-region.styles.js'

/** `serializable: true` が無いと `getHTML({ serializableShadowRoots: true })` に shadow の中身が出ない */
const SHADOW_OPTIONS = { ...LitElement.shadowRootOptions, serializable: true }

export type AnnounceOptions = { readonly politeness?: Politeness }

/**
 * ページで唯一のライブリージョン。他の部品は `aria-live` を持たず、ここへ `announce()` する（ADR-0008 §6）。
 * JS が無いときは何も起きない（害が無い。ティア C、ADR-0012）。
 *
 * @summary 読み上げの集約点。ページに 1 つだけ置く
 * @status stable
 * @pe C
 *
 * @csspart polite - 割り込まない読み上げのノード
 * @csspart assertive - 割り込む読み上げのノード。エラーだけに使う
 * @event {CustomEvent<{ message: string; politeness: 'polite' | 'assertive' }>} rd-announce - 読み上げを積んだときに発火
 */
export class RdLiveRegion extends LitElement {
  static override styles = styles

  static override shadowRootOptions = SHADOW_OPTIONS

  #queue: AnnouncementQueue = emptyQueue

  override render(): TemplateResult {
    return html`<div part="polite" aria-live="polite" aria-atomic="true">${this.#queue.polite}</div>
      <div part="assertive" aria-live="assertive" aria-atomic="true">${this.#queue.assertive}</div>`
  }

  /** 空（空白だけ）の文言は無視する。`assertive` はエラーだけに使う */
  announce(message: string, options: AnnounceOptions = {}): void {
    const politeness = options.politeness ?? 'polite'
    const next = nextAnnouncement(this.#queue, message, politeness)
    if (next === this.#queue) {
      return
    }
    this.#queue = next
    this.requestUpdate()
    this.dispatchEvent(
      new CustomEvent('rd-announce', {
        bubbles: true,
        composed: true,
        detail: { message, politeness },
      }),
    )
  }
}
