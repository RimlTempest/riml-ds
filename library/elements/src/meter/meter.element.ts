import { LitElement, nothing } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncStates } from '../_shared/internals.js'
import { contract } from './meter.contract.js'
import { computeMeterView, type MeterAttrs } from './meter.logic.js'

/** ネイティブが値を持つ属性。これが変わったら塗りを描き直す */
const OBSERVED = ['value', 'min', 'max']

/**
 * 使用量や進捗の割合。ネイティブ `<meter>` / `<progress>` を子として包む（ティア A、ADR-0012）。
 * JS が無ければネイティブの見た目のまま値が読める。JS がすることは `value` / `min` / `max` を読んで
 * `--rd-meter-fill`（0–1）を書くことだけで、太いピルは CSS がその変数で描く（docs/brand.md §7.5）。
 *
 * @summary 割合の表示。<label for> と <meter> / <progress> は利用側が書く
 * @status experimental
 * @pe A
 *
 * @cssprop --rd-meter-fill - 塗りの割合（0–1）。部品が書く。読む側は上書きしない
 * @cssprop --rd-meter-color - 塗りの色。既定 var(--rd-color-accent-default)
 * @state indeterminate - <progress> に value が無い（値が決まっていない）
 * @state malformed - 契約の子（<label for> と <meter> / <progress>）が無い
 */
export class RdMeter extends LitElement {
  #internals = this.attachInternals()
  #control: Element | undefined = undefined
  #observer: MutationObserver | undefined = undefined

  /** light DOM に描く。既存の子は消さず、強化ノードも足さない（値はネイティブが持つ） */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#observer?.disconnect()
    this.#observer = undefined
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      console.error(
        `[rd-meter] <label for> と <meter> / <progress> が必要（不足: ${result.roles.join(', ')}）`,
      )
    }
    this.#control = result.kind === 'ok' ? result.found['control'] : undefined
    this.#observe()
    this.#apply()
  }

  override updated(): void {
    this.#apply()
  }

  /** 強化ノードは無い。値も見た目もネイティブと CSS が持つ */
  override render(): typeof nothing {
    return nothing
  }

  /** 属性が書き換わったら追随する。`disconnectedCallback` で切る */
  #observe = (): void => {
    const control = this.#control
    if (control === undefined) {
      return
    }
    const observer = new MutationObserver(this.#apply)
    observer.observe(control, { attributes: true, attributeFilter: OBSERVED })
    this.#observer = observer
  }

  #attrs = (): MeterAttrs => {
    const control = this.#control
    return {
      value: control?.getAttribute('value') ?? undefined,
      min: control?.getAttribute('min') ?? undefined,
      max: control?.getAttribute('max') ?? undefined,
    }
  }

  #apply = (): void => {
    const control = this.#control
    const attrs = this.#attrs()
    const view = computeMeterView({
      attrs,
      indeterminate: control?.localName === 'progress' && attrs.value === undefined,
      malformed: control === undefined,
    })
    this.style.setProperty('--rd-meter-fill', String(view.fill))
    syncStates(this.#internals, view.states)
  }
}
