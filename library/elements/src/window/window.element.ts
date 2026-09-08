import { html, LitElement, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { linkLabelledBy, syncStates } from '../_shared/internals.js'
import { type WindowAction, windowControlLabels, windowControls } from '../_shared/window-chrome.js'
import { contract } from './window.contract.js'
import { computeStates, controlsFor, nextState } from './window.logic.js'
import { styles } from './window.styles.js'

const SHADOW_OPTIONS = { ...LitElement.shadowRootOptions, delegatesFocus: true, serializable: true }
const BODY_ID = 'rd-window-body'

/**
 * 窓。帯の左端に 閉じる / 広げる / たたむ の丸を持つ（ティア B、ADR-0012 / ADR-0014）。
 * 見出しは `slot="title"` に**利用側が h 要素を置く**。JS が無いときは `:not(:defined)` の
 * CSS が帯だけを見せ、ボタンは出ない（押せない丸を置かないため）。
 *
 * @summary 窓。帯と閉じる/広げる/たたむ。見出しは slot="title" に利用側が置く
 * @status experimental
 * @pe B
 *
 * @slot - 本文
 * @slot title - 見出し。省略不可（h 要素を置く）
 * @csspart bar - 帯（操作と見出しの入れ物）
 * @csspart controls - 操作の入れ物。使う操作が無ければ描かれない
 * @csspart control - 操作の丸（data-action で close / expand / collapse を見分ける）
 * @csspart title - 見出し slot の入れ物
 * @csspart body - 本文の入れ物
 * @cssprop --rd-window-expanded-inset - 広げたときの画面からの余白。既定 var(--rd-space-4)
 * @event {CustomEvent<{ reason: 'button' }>} rd-dismiss - × を押したとき。preventDefault で hidden を止める
 * @event {CustomEvent<{ collapsed: boolean }>} rd-toggle - たたむ / 戻すたび
 * @event {CustomEvent<{ expanded: boolean }>} rd-expand - 広げる / 戻すたび
 * @state collapsed - たたまれている
 * @state expanded - 広がっている
 * @state malformed - slot="title" の子が無い
 */
export class RdWindow extends LitElement {
  static override styles = styles

  static override shadowRootOptions = SHADOW_OPTIONS

  static override properties: PropertyDeclarations = {
    closable: { type: Boolean, reflect: true },
    expandable: { type: Boolean, reflect: true },
    collapsible: { type: Boolean, reflect: true },
    collapsed: { type: Boolean, reflect: true },
    expanded: { type: Boolean, reflect: true },
    tone: { reflect: true },
  }

  declare closable: boolean
  declare expandable: boolean
  declare collapsible: boolean
  declare collapsed: boolean
  declare expanded: boolean
  /** 帯の色。4 通り（brand.md §7.1）。既定は chrome（インク） */
  declare tone: 'chrome' | 'accent' | 'warning' | 'danger'

  #internals = this.attachInternals()
  #contractOk = false

  constructor() {
    super()
    this.closable = false
    this.expandable = false
    this.collapsible = false
    this.collapsed = false
    this.expanded = false
    this.tone = 'chrome'
    this.#internals.role = 'region'
    // 自分自身への購読なので外す必要が無い（要素が消えれば一緒に消える）
    this.addEventListener('keydown', this.#onKeydown)
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    if (result.kind === 'missing') {
      console.error(`[rd-window] slot="title" の子が必要（不足: ${result.roles.join(', ')}）`)
    }
    this.#contractOk = result.kind === 'ok'
    linkLabelledBy(this.#internals, result.kind === 'ok' ? result.found['title'] : undefined)
  }

  override updated(): void {
    const { collapsed, expanded } = this
    syncStates(
      this.#internals,
      computeStates({ collapsed, expanded, malformed: !this.#contractOk }),
    )
  }

  override render(): TemplateResult {
    const { collapsed, expanded } = this
    return html`<header part="bar">
        ${windowControls({
          actions: controlsFor(this),
          labels: windowControlLabels(this),
          collapsed,
          expanded,
          bodyId: BODY_ID,
          on: this.#press,
        })}
        <div part="title"><slot name="title"></slot></div>
      </header>
      <div part="body" id=${BODY_ID} ?hidden=${collapsed}><slot></slot></div>`
  }

  /** 閉じる。`rd-dismiss` を preventDefault すれば `hidden` は付かない（SPA が自分で消す） */
  close(): void {
    const detail = { reason: 'button' }
    const allowed = this.dispatchEvent(
      new CustomEvent('rd-dismiss', { bubbles: true, composed: true, cancelable: true, detail }),
    )
    this.hidden = allowed || this.hidden
  }

  toggleCollapsed(force?: boolean): void {
    this.collapsed = nextState(this, { kind: 'collapse', force }).collapsed
    this.#emit('rd-toggle', { collapsed: this.collapsed })
  }

  toggleExpanded(force?: boolean): void {
    this.expanded = nextState(this, { kind: 'expand', force }).expanded
    this.#emit('rd-expand', { expanded: this.expanded })
  }

  /** 丸を押したときの動作。`controlsFor` の並びと 1 対 1 */
  #press: Readonly<Record<WindowAction, () => void>> = {
    close: () => {
      this.close()
    },
    expand: () => {
      this.toggleExpanded()
    },
    collapse: () => {
      this.toggleCollapsed()
    },
  }

  /** 広げているときだけ Esc で戻す。モーダルではないのでフォーカスは閉じ込めない */
  #onKeydown = (event: KeyboardEvent): void => {
    const wanted = event.key === 'Escape' ? nextState(this, { kind: 'esc' }) : this
    if (wanted.expanded !== this.expanded) {
      this.toggleExpanded(wanted.expanded)
    }
  }

  #emit = (name: string, detail: Readonly<Record<string, boolean>>): void => {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }
}
