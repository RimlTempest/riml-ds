/**
 * ティア A/B のマークアップ契約（ADR-0012）。必要な子（役割 → セレクタ）と既定のマークアップの木を持つ。
 * `checkContract` は DOM を**読むだけ**（書かない）。`querySelector` だけをダックタイプで受けるので
 * 実 DOM が無い node のテストでも回せる。
 */
import type { MarkupTree } from './markup.js'

export type PeTier = 'A' | 'B' | 'C'

export type Contract = {
  readonly pe: PeTier
  /** 役割 → 子セレクタ（例 `control: ':scope > input, :scope > textarea'`） */
  readonly roles: Readonly<Record<string, string>>
  readonly required: readonly string[]
  readonly tree: MarkupTree
}

export type ContractHost<E> = { readonly querySelector: (selector: string) => E | null }

export type ContractCheck<E> =
  | { readonly kind: 'ok'; readonly found: Readonly<Record<string, E>> }
  | { readonly kind: 'missing'; readonly roles: readonly string[] }

export const checkContract = <E>(host: ContractHost<E>, contract: Contract): ContractCheck<E> => {
  const found: Record<string, E> = {}
  const missing: string[] = []
  for (const role of contract.required) {
    const selector = contract.roles[role]
    const element = selector === undefined ? null : host.querySelector(selector)
    if (element === null) {
      missing.push(role)
    } else {
      found[role] = element
    }
  }
  return missing.length === 0 ? { kind: 'ok', found } : { kind: 'missing', roles: missing }
}
