/**
 * riml-ds project stylelint plugin.
 *
 * 規約の出典は `.claude/skills/riml-ds-css/SKILL.md` §6 と ADR-0004。レビューに頼らず
 * CI で落とすためのルールだけを置く。
 */
import stylelint from 'stylelint'
import * as baselineNewlyNeedsSupports from './rules/baseline-newly-needs-supports.js'
import * as motionInMedia from './rules/motion-in-media.js'
import * as noPaletteToken from './rules/no-palette-token.js'

export default [
  stylelint.createPlugin(motionInMedia.ruleName, motionInMedia.rule),
  stylelint.createPlugin(baselineNewlyNeedsSupports.ruleName, baselineNewlyNeedsSupports.rule),
  stylelint.createPlugin(noPaletteToken.ruleName, noPaletteToken.rule),
]
