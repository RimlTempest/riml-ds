// oxlint-disable import/no-unassigned-import -- CSS と define は副作用 import が正しい形
// import 順は skills/riml-ds/SKILL.md §import order と同じ：layers → tokens → base CSS
import '@rimltempest/riml-ds-css/layers.css'
import '@rimltempest/riml-ds-tokens/tokens.css'
import '@rimltempest/riml-ds-css'
// 部品の登録。ティア A/B の `<name>.css` は preview では読まず、各 story が自分で import する
import '@rimltempest/riml-ds-elements/button/define'
import '@rimltempest/riml-ds-elements/text-field/define'
import '@rimltempest/riml-ds-elements/dialog/define'
import '@rimltempest/riml-ds-elements/live-region/define'
import type { Preview } from '@storybook/web-components-vite'
import { initialModeGlobals, modeGlobalTypes, withModes } from './modes.js'

/** ADR-0007 決定 3。AAA まで含めて全 story で回し、違反は test を落とす */
const A11Y_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag2aaa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
]

const preview: Preview = {
  parameters: {
    a11y: { test: 'error', options: { runOnly: { type: 'tag', values: A11Y_TAGS } } },
    controls: { expanded: true },
    docs: { toc: true },
  },
  globalTypes: modeGlobalTypes,
  initialGlobals: initialModeGlobals,
  decorators: [withModes],
}

// oxlint-disable-next-line import/no-default-export -- Storybook の preview は default export でしか読まれない
export default preview
