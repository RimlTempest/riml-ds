/**
 * riml-ds/baseline-newly-needs-supports — Baseline Newly の機能は `@supports` の中だけ。
 *
 * 出典 docs/baseline.md（Newly 表）。機能一覧は隣の `baseline-newly.json` に転記してあり、
 * 四半期ごとに docs/baseline.md と同時に見直す。Widely は無条件、Wait は使わない（ADR-0004 §3）。
 */
import { createRequire } from 'node:module'
import stylelint from 'stylelint'

const { report, ruleMessages, validateOptions } = stylelint.utils

const require = createRequire(import.meta.url)
/** @type {{ properties: string[], declarations: { property: string, value: string }[], selectors: string[] }} */
const newly = require('./../baseline-newly.json')

export const ruleName = 'riml-ds/baseline-newly-needs-supports'

export const messages = ruleMessages(ruleName, {
  rejected: (/** @type {string} */ feature) =>
    `${feature} は Baseline Newly。@supports で囲み、フォールバックを書く`,
  rejectedSelector: (/** @type {string} */ feature) =>
    `${feature} は Baseline Newly。@supports selector(…) で囲み、フォールバックを書く`,
})

/**
 * @param {import('postcss').Node} node
 * @param {(params: string) => boolean} matches
 */
const insideSupports = (node, matches) => {
  for (let current = node.parent; current !== undefined; current = current.parent) {
    if (
      current.type === 'atrule'
      && current.name.toLowerCase() === 'supports'
      && matches(current.params)
    ) {
      return true
    }
  }
  return false
}

const anySupports = () => true
const selectorSupports = (params) => /selector\s*\(/i.test(params)

/** @param {import('postcss').Declaration} decl */
const featureOf = (decl) => {
  const prop = decl.prop.toLowerCase()
  if (newly.properties.includes(prop)) return prop
  const value = decl.value.trim().toLowerCase()
  const pair = newly.declarations.find(
    (candidate) => candidate.property === prop && candidate.value === value,
  )
  return pair === undefined ? undefined : `${prop}: ${value}`
}

/** @type {import('stylelint').Rule} */
export const rule = (primary) => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary, possible: [true] })) return

  root.walkDecls((decl) => {
    const feature = featureOf(decl)
    if (feature === undefined) return
    if (insideSupports(decl, anySupports)) return

    report({
      message: messages.rejected(feature),
      messageArgs: [feature],
      node: decl,
      result,
      ruleName,
    })
  })

  root.walkRules((cssRule) => {
    const feature = newly.selectors.find((selector) => cssRule.selector.includes(selector))
    if (feature === undefined) return
    if (insideSupports(cssRule, selectorSupports)) return

    report({
      message: messages.rejectedSelector(feature),
      messageArgs: [feature],
      node: cssRule,
      result,
      ruleName,
    })
  })
}

rule.ruleName = ruleName
rule.messages = messages
