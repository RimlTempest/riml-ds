/**
 * RSC / SSR から使える既定 export。マークアップ契約の木をそのまま HTML にするだけの部品で、
 * `'use client'` を持たない（ADR-0012 §5）。イベントや controlled が要るなら `/client`。
 */
export * from './generated/index.js'
