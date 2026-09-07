/**
 * riml-ds/no-palette-token — `--rd-color-palette-*` を部品・基盤 CSS から直接参照させない。
 *
 * palette は semantic トークン（`--rd-color-text-default` 等）の材料で、テーマ差し替えと
 * ダーク/高コントラストの切り替えは semantic 側で完結する（ADR-0003 / ADR-0004 §7、
 * `.claude/skills/riml-ds-css/SKILL.md` §6）。
 */
import stylelint from 'stylelint'

const { report, ruleMessages, validateOptions } = stylelint.utils

export const ruleName = 'riml-ds/no-palette-token'

export const messages = ruleMessages(ruleName, {
  rejected: (/** @type {string} */ value) =>
    `${value} は palette トークンの直参照。--rd-color-palette-* ではなく semantic トークン（--rd-color-text-default 等）を使う`,
})

const PALETTE_PREFIX = '--rd-color-palette-'

/** @type {import('stylelint').Rule} */
export const rule = (primary) => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary, possible: [true] })) return

  root.walkDecls((decl) => {
    if (!decl.value.includes(PALETTE_PREFIX)) return

    report({
      message: messages.rejected(decl.value.trim()),
      messageArgs: [decl.value.trim()],
      node: decl,
      result,
      ruleName,
    })
  })
}

rule.ruleName = ruleName
rule.messages = messages
