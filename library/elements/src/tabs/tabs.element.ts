import { html, LitElement, type PropertyDeclarations, type TemplateResult } from 'lit'
import { checkContract } from '../_shared/contract.js'
import { syncAttribute, syncStates } from '../_shared/internals.js'
import { nextIndex } from '../_shared/roving-focus.js'
import { contract } from './tabs.contract.js'
import { computeTabsView, initialIndex, panelAttributes, tabAttributes } from './tabs.logic.js'
import { styles } from './tabs.styles.js'

const applyAttrs = (el: Element | undefined, attrs: Readonly<Record<string, string>>): void =>
  Object.entries(attrs).forEach(([name, value]) => el?.setAttribute(name, value))

/**
 * タブ。JS が無ければ**ページ内リンクの列**として動き、パネルはすべて見える（ティア B、ADR-0012）。
 * JS が来たら tablist / tab / tabpanel と roving tabindex・自動活性化（APG）を足す。
 * `location.hash` は読むだけ（履歴を汚さない）。深いリンクは利用側が `selected` に書く。
 *
 * @summary タブ。JS 無しではページ内リンクの列
 * @status experimental
 * @pe B
 *
 * @slot - パネル。`id` が tab の href の飛び先
 * @slot tabs - タブの列（`<ul>`）。省略不可
 * @csspart control - shadow の枠
 * @csspart panels - パネルの入れ物
 * @event {CustomEvent<{ id: string }>} rd-change - 選ぶタブが変わるたび（id は開いたパネルの id）
 * @state vertical - orientation="vertical"
 * @state unlabeled - label が無い
 * @state malformed - slot="tabs" の列かページ内リンクが無い
 */
export class RdTabs extends LitElement {
  static override styles = styles

  /** `delegatesFocus` は付けない——タブ自身が light DOM のリンクで、フォーカスはそこに行く */
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, serializable: true }

  static override properties: PropertyDeclarations = {
    variant: { reflect: true },
    label: {},
    orientation: { reflect: true },
    selected: {},
  }

  /** `line`（下線）か `browser`（帯から生える窓のタブ）。見た目は `[variant]` で当てる */
  declare variant: 'line' | 'browser'
  declare label: string
  declare orientation: 'horizontal' | 'vertical'
  declare selected: string

  #internals = this.attachInternals()
  #contractOk = false
  #index = 0

  constructor() {
    super()
    this.variant = 'line'
    this.label = ''
    this.orientation = 'horizontal'
    this.selected = ''
    // 自分自身への購読。要素が消えれば一緒に消えるので外す必要が無い
    this.addEventListener('click', this.#onInteract)
    this.addEventListener('keydown', this.#onInteract)
  }

  override firstUpdated(): void {
    const result = checkContract(this, contract)
    this.#contractOk = result.kind === 'ok'
    const missing = [
      result.kind === 'missing' ? `slot="tabs" とページ内リンク（${result.roles.join(', ')}）` : '',
      this.label === '' ? 'label（タブの列の名前）' : '',
    ].filter((problem) => problem !== '')
    if (missing.length > 0) {
      console.error(`[rd-tabs] 必要: ${missing.join(' / ')}`)
    }
    const hrefs = this.#tabs().map((tab) => tab.getAttribute('href') ?? '')
    this.#index = initialIndex({ hrefs, hash: location.hash, selected: this.selected })
  }

  override updated(): void {
    this.#apply()
  }

  override render(): TemplateResult {
    return html`<div part="control">
      <slot name="tabs"></slot>
      <div part="panels"><slot></slot></div>
    </div>`
  }

  /** タブを選ぶ。範囲外は無視。`rd-change` を出し、そのタブへフォーカスを移す */
  select(index: number): void {
    const tab = this.#tabs()[index]
    if (tab === undefined) {
      return
    }
    this.#index = index
    this.#apply()
    tab.focus()
    const detail = { id: (tab.getAttribute('href') ?? '').replace(/^#/u, '') }
    this.dispatchEvent(new CustomEvent('rd-change', { bubbles: true, composed: true, detail }))
  }

  #tabs = (): readonly HTMLAnchorElement[] =>
    [...this.querySelectorAll(contract.roles.tabs)].filter((n) => n instanceof HTMLAnchorElement)

  /** ARIA と roving tabindex を light DOM に書き戻す。描画のたびに冪等に走る */
  #apply = (): void => {
    const tabs = this.#tabs()
    const view = computeTabsView({
      hrefs: tabs.map((tab) => tab.getAttribute('href') ?? ''),
      ids: tabs.map((tab) => tab.id),
      index: this.#index,
      label: this.label,
      orientation: this.orientation,
      malformed: !this.#contractOk,
    })
    syncStates(this.#internals, view.states)
    const list = this.querySelector(contract.roles.list) ?? undefined
    applyAttrs(list, { role: 'tablist', 'aria-orientation': this.orientation })
    syncAttribute(list, 'aria-label', this.label === '' ? undefined : this.label)
    view.tabs.forEach((item, index) => {
      applyAttrs(tabs[index], tabAttributes(item))
      tabs[index]?.parentElement?.setAttribute('role', 'presentation')
      const panel = [...this.children].find((child) => child.id === item.panelId)
      applyAttrs(panel, panelAttributes(item))
      panel?.toggleAttribute('hidden', !item.selected)
    })
  }

  /** click は押したタブへ、矢印 / Home / End は次のタブへ（自動活性化） */
  #onInteract = (event: Event): void => {
    const current = this.#indexOf(event.target)
    const next =
      current === undefined
        ? undefined
        : event instanceof KeyboardEvent
          ? nextIndex(current, this.#tabs().length, event.key, this.orientation)
          : current
    if (next !== undefined) {
      // click では URL の hash を汚さない（履歴も汚さない）。パネルの出し分けは部品が行う
      event.preventDefault()
      this.select(next)
    }
  }

  #indexOf = (target: EventTarget | null): number | undefined => {
    const tab = target instanceof Element ? target.closest('a[href^="#"]') : null
    const index = this.#tabs().findIndex((candidate) => candidate === tab)
    return index === -1 ? undefined : index
  }
}
