import { LitElement, type PropertyDeclarations, type TemplateResult } from 'lit'
import { syncStates } from '../_shared/internals.js'
import { usesJapaneseCopy } from '../_shared/lang.js'
import { type Binding, bindListeners } from '../_shared/native-control.js'
import { parseFilterMode } from '../_shared/text-filter.js'
import type { CommandFilter } from './command.contract.js'
import * as dom from './command.dom.js'
import { type CommandKeyAction, computeStates, decideKey, emptyCopy } from './command.logic.js'

const NONE: CommandKeyAction = { kind: 'none' }
let sequence = 0

/**
 * 打って絞って選ぶコマンドパレット。子の `<label for>`・`<input type="search">`・
 * リンクとボタンの `<ul>` を包む（ティア A、ADR-0012）。**JS が無くても一覧はそのまま辿れる**
 * ——入力欄は飾りになるが、全項目が見えていて押せる。項目は本物のリンク／ボタンのままで、
 * `role="option"` に書き換えない（`docs/proposals/command.md`）。
 *
 * @summary 打って絞って選ぶコマンドパレット。項目の <ul> は利用側が書く
 * @status experimental
 * @pe A
 *
 * @csspart empty - 0 件のときの知らせ
 * @attr filter - 絞り込みの仕方（contains / prefix / none）
 * @attr empty-text - 0 件のときの文言。既定はページの言語で決まる
 * @event {CustomEvent<{ value: string; label: string }>} rd-select - 項目が押されたとき
 * @state filtering - 入力欄に文字が入っている
 * @state empty - 見えている項目が 0 件
 * @state malformed - 契約の子（<label for> と <input type="search"> と <ul>）が無い
 */
export class RdCommand extends LitElement {
  static override properties: PropertyDeclarations = {
    filter: {},
    emptyText: { attribute: 'empty-text' },
  }

  /** 絞り込みの仕方。`none` は候補をサーバー側で絞る利用側向け */
  declare filter: CommandFilter
  declare emptyText: string
  #internals = this.attachInternals()
  #wiring = dom.NO_WIRING
  #name = `rd-command-${(sequence += 1)}`
  #query = ''
  #nodes: readonly dom.ItemNode[] = []
  #view: dom.FilterResult = dom.NO_MATCHES
  #binding: Binding | undefined = undefined
  #hostBinding: Binding | undefined = undefined
  #observer: MutationObserver | undefined = undefined

  constructor() {
    super()
    this.filter = 'contains'
    this.emptyText = ''
  }

  /** light DOM に描く。既存の子は消さず、0 件の知らせだけを末尾に足す */
  override createRenderRoot(): HTMLElement {
    return this
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#binding?.detach()
    this.#hostBinding?.detach()
    this.#observer?.disconnect()
  }

  /** 描く前に絞り込みを済ませる（`render()` は 0 件かどうかしか見ない） */
  override willUpdate(): void {
    this.#setup()
    this.#nodes = dom.readItems(this)
    this.#view = dom.applyFilter(this.#nodes, this.#query, parseFilterMode(this.filter))
  }

  override updated(): void {
    syncStates(
      this.#internals,
      computeStates({
        malformed: !this.#wiring.ok,
        filtering: this.#query !== '',
        empty: this.#view.count === 0,
      }),
    )
  }

  override render(): TemplateResult {
    return dom.renderEmpty(
      emptyCopy(usesJapaneseCopy(this), this.emptyText),
      this.#view.count === 0,
    )
  }

  /** 初回だけ。契約を見て子を掴み、入力欄とホスト（項目の分）にリスナを配る */
  #setup = (): void => {
    if (this.hasUpdated) {
      return
    }
    this.#wiring = dom.wire(this, this.#name)
    this.#binding = bindListeners(this.#wiring.control, {
      input: () => this.#sync(),
      keydown: (event) => this.#press(event, true),
    })
    this.#hostBinding = bindListeners(this, {
      keydown: (event) => this.#press(event, false),
      click: (event) => dom.commitItem(this, event, this.#nodes),
    })
    this.#observer = dom.observeItems(this, () => this.requestUpdate())
  }

  #sync = (): void => {
    this.#query = this.#wiring.control?.value ?? ''
    this.requestUpdate()
  }

  /** 入力欄の keydown はホストにも上がってくる。項目に居ないときは何もしない */
  #press = (event: Event, onInput: boolean): void => {
    const current = dom.visibleIndexOf(event, this.#view.visible)
    const where = { onInput, current, count: this.#view.count, hasQuery: this.#query !== '' }
    const ignored = !onInput && current < 0
    this.#run(ignored ? NONE : decideKey({ ...dom.keyOf(event), ...where }), event)
  }

  #run = (action: CommandKeyAction, event: Event): void => {
    switch (action.kind) {
      case 'focus-item':
        dom.focusVisible(this.#view.visible, action.index)
        break
      case 'activate-first':
        this.#view.visible[0]?.click()
        break
      case 'clear':
        dom.setQuery(this.#wiring.control, '')
        break
      case 'type':
        dom.typeInto(this.#wiring.control, action.char)
        break
      case 'backspace':
        dom.typeInto(this.#wiring.control, undefined)
        break
      case 'none':
        return
    }
    event.preventDefault()
  }
}
