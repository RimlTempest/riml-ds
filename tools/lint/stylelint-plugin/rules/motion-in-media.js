/**
 * riml-ds/motion-in-media — モーションは `prefers-reduced-motion: no-preference` の中だけ。
 *
 * 出典: ADR-0004 §8、system/guidelines/accessibility.md（既定で動かない / WCAG 2.3.3）、
 * `.claude/skills/riml-ds-css/SKILL.md` §6。
 */
import stylelint from 'stylelint'

const { report, ruleMessages, validateOptions } = stylelint.utils

export const ruleName = 'riml-ds/motion-in-media'

export const messages = ruleMessages(ruleName, {
  rejected: (/** @type {string} */ prop) =>
    `${prop} は @media (prefers-reduced-motion: no-preference) で囲む`,
})

/** 動きを生む宣言。ショートハンドと、時間・名前を持つロングハンドだけを見る。 */
const MOTION_PROPS = new Set([
  'transition',
  'transition-property',
  'transition-duration',
  'animation',
  'animation-name',
  'animation-duration',
])

/** 動きを打ち消す値。これらは `no-preference` の外に書いてよい。 */
const INERT_VALUES = new Set(['none', '0s', 'inherit'])

const REDUCED_MOTION = /prefers-reduced-motion\s*:\s*no-preference/i

/** @param {import('postcss').Node} node */
const insideNoPreference = (node) => {
  for (let current = node.parent; current !== undefined; current = current.parent) {
    if (
      current.type === 'atrule'
      && current.name.toLowerCase() === 'media'
      && REDUCED_MOTION.test(current.params)
    ) {
      return true
    }
  }
  return false
}

/** @type {import('stylelint').Rule} */
export const rule = (primary) => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary, possible: [true] })) return

  root.walkDecls((decl) => {
    const prop = decl.prop.toLowerCase()
    if (!MOTION_PROPS.has(prop)) return
    if (INERT_VALUES.has(decl.value.trim().toLowerCase())) return
    if (insideNoPreference(decl)) return

    report({
      message: messages.rejected(prop),
      messageArgs: [prop],
      node: decl,
      result,
      ruleName,
    })
  })
}

rule.ruleName = ruleName
rule.messages = messages
