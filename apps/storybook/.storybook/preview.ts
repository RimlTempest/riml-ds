// oxlint-disable import/no-unassigned-import -- CSS と define は副作用 import が正しい形
// import 順は skills/riml-ds/SKILL.md §import order と同じ：layers → tokens → base CSS
import '@rimltempest/riml-ds-css/layers.css'
import '@rimltempest/riml-ds-tokens/tokens.css'
import '@rimltempest/riml-ds-css'
// 部品の `define` と `<name>.css` は各 story が src から import する（preview では読まない）。
// dist と src の両方を読むと customElements.define が二重になって落ちるため、登録は 1 か所に絞る。
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
