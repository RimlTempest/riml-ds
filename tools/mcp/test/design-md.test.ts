import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import { buildDesignMd } from '../src/core/design-md.js'
import { isRecord } from '../src/core/result.js'

const run = promisify(execFile)

const repoFile = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${name}`, import.meta.url)), 'utf8')

const tokens: unknown = JSON.parse(repoFile('system/tokens/dist/tokens.json'))
const template = repoFile('DESIGN.md')

/** 1 トークンだけに `theme-<brand>` のモード値を足した合成フィクスチャ（純関数） */
const withThemeMode = (node: unknown, path: readonly string[], value: unknown): unknown => {
  if (!isRecord(node)) {
    return node
  }
  const [head, ...rest] = path
  if (head === undefined) {
    const extensions = isRecord(node['$extensions']) ? node['$extensions'] : {}
    const riml = isRecord(extensions['riml-ds']) ? extensions['riml-ds'] : {}
    const modes = isRecord(riml['modes']) ? riml['modes'] : {}
    return {
      ...node,
      $extensions: {
        ...extensions,
        'riml-ds': { ...riml, modes: { ...modes, 'theme-qrcc': value } },
      },
    }
  }
  return { ...node, [head]: withThemeMode(node[head], rest, value) }
}

describe('buildDesignMd', () => {
  it('テーマ指定なしならリポジトリの DESIGN.md と 1 バイトも変わらない', () => {
    const result = buildDesignMd(tokens, template, {})
    expect(result.ok).toBe(true)
    expect(result.ok ? result.value : '').toBe(template)
  })

  it('--theme qrcc でフロントマターの name が riml-ds/qrcc になる', () => {
    const result = buildDesignMd(tokens, template, { theme: 'qrcc' })
    expect(result.ok).toBe(true)
    expect(result.ok ? result.value : '').toContain('name: "riml-ds/qrcc"')
  })

  it('テーマのモード値があれば色が差し替わる（今の themes/qrcc は既定と同値なので合成で固定する）', () => {
    const themed = withThemeMode(tokens, ['color', 'text', 'default'], {
      colorSpace: 'oklch',
      components: [0.5, 0.1, 20],
      alpha: 1,
    })
    const brand = buildDesignMd(themed, template, { theme: 'qrcc' })
    expect(brand.ok).toBe(true)
    expect(brand.ok ? brand.value : '').toContain('oklch(0.5 0.1 20)')

    // 実データの themes/qrcc は既定値と差が無い（tokens.json に theme-qrcc のモードが出ない）
    const real = buildDesignMd(tokens, template, { theme: 'qrcc' })
    expect(real.ok ? real.value : '').not.toContain('oklch(0.5 0.1 20)')
  })

  it('生成結果が @google/design.md lint を通る', async () => {
    const result = buildDesignMd(tokens, template, { theme: 'qrcc' })
    expect(result.ok).toBe(true)
    const directory = await mkdtemp(join(tmpdir(), 'riml-ds-design-md-'))
    const file = join(directory, 'DESIGN.md')
    await writeFile(file, result.ok ? result.value : '', 'utf8')
    const cli = fileURLToPath(new URL('../../../node_modules/.bin/design.md', import.meta.url))
    const lint = await run(cli, ['lint', file])
    expect(lint.stdout).toContain('"errors": 0')
  })
})
