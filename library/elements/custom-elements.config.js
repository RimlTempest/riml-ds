import { jsdocTags } from '../../tools/cem/src/plugins/jsdoc-tags.js'

export default {
  globs: ['src/**/*.element.ts', 'src/**/*.define.ts'],
  exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts', 'src/_shared/**'],
  outdir: '.',
  litelement: true,
  packagejson: true,
  plugins: [jsdocTags()],
}
