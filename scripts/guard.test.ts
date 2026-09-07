import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// guard.sh は CI と手元で同じ不変条件を検査する。偽のリポジトリを作って
// 「壊れている木では落ちる」「素の木では通る」を固定する。
const guardPath = fileURLToPath(new URL('./guard.sh', import.meta.url))

const write = (dir: string, relative: string, content: string): void => {
  const file = join(dir, relative)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
}

const runGuard = (setup: (dir: string) => void): number => {
  const dir = mkdtempSync(join(tmpdir(), 'riml-ds-guard-'))
  setup(dir)
  const result = spawnSync('bash', [guardPath], { cwd: dir, encoding: 'utf8' })
  return result.status ?? 1
}

describe('scripts/guard.sh', () => {
  it('空の木では通る', () => {
    expect(runGuard(() => {})).toBe(0)
  })

  it('*.element.ts 以外の class で落ちる', () => {
    expect(
      runGuard((dir) => {
        write(dir, 'library/elements/src/x/x.ts', 'export class Foo {}\n')
      }),
    ).not.toBe(0)
  })

  it('*.element.ts の class では落ちない', () => {
    expect(
      runGuard((dir) => {
        write(
          dir,
          'library/elements/src/x/x.element.ts',
          'export class RdX extends HTMLElement {}\n',
        )
      }),
    ).toBe(0)
  })

  it('.npmrc の _authToken で落ちる', () => {
    expect(
      runGuard((dir) => {
        write(dir, '.npmrc', 'provenance=true\n//registry.npmjs.org/:_authToken=REDACTED\n')
      }),
    ).not.toBe(0)
  })

  it('system が library を import していると落ちる', () => {
    expect(
      runGuard((dir) => {
        write(
          dir,
          'system/css/src/x.ts',
          "import { RdButton } from '@rimltempest/riml-ds-elements'\n\nexport const x = RdButton\n",
        )
      }),
    ).not.toBe(0)
  })
})
