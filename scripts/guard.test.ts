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

/**
 * git フック（lefthook の pre-push など）の中で走ると `GIT_DIR` / `GIT_WORK_TREE` /
 * `GIT_INDEX_FILE` が継承され、偽リポジトリの `git init` / `commit` が**本物のリポジトリ**に
 * 当たる（core.bare が true になり、ブランチが `base` / `head` で上書きされた事故がある）。
 * 子プロセスには `GIT_*` を渡さない。
 */
const withoutGitEnv = (): NodeJS.ProcessEnv =>
  Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')))

const runGuard = (setup: (dir: string) => void): number => {
  const dir = mkdtempSync(join(tmpdir(), 'riml-ds-guard-'))
  setup(dir)
  const result = spawnSync('bash', [guardPath], {
    cwd: dir,
    encoding: 'utf8',
    env: withoutGitEnv(),
  })
  return result.status ?? 1
}

/** guard が読む JSDoc は `@pe` の 1 行だけ。ティアごとの最小の検体を作る */
const element = (tier: string): string =>
  `/**\n * @summary x\n * @status experimental\n * @pe ${tier}\n */\nexport class RdX extends HTMLElement {}\n`

const tierA = element('A')
const tierC = element('C')

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
        write(dir, 'library/elements/src/x/x.element.ts', tierC)
      }),
    ).toBe(0)
  })

  it('@pe の無い *.element.ts で落ちる（ADR-0012）', () => {
    expect(
      runGuard((dir) => {
        write(
          dir,
          'library/elements/src/x/x.element.ts',
          'export class RdX extends HTMLElement {}\n',
        )
      }),
    ).not.toBe(0)
  })

  it('ティア A に static styles があると落ちる（ADR-0012）', () => {
    expect(
      runGuard((dir) => {
        write(
          dir,
          'library/elements/src/x/x.element.ts',
          `${tierA}export class RdX {\n  static styles = []\n}\n`,
        )
        write(
          dir,
          'library/elements/src/x/x.css',
          '@layer rd.components { rd-x { display: block; } }\n',
        )
        write(dir, 'library/elements/src/x/x.contract.ts', 'export const contract = {}\n')
      }),
    ).not.toBe(0)
  })

  it('ティア A に <name>.css / <name>.contract.ts が無いと落ちる（ADR-0012）', () => {
    expect(
      runGuard((dir) => {
        write(dir, 'library/elements/src/x/x.element.ts', tierA)
      }),
    ).not.toBe(0)
  })

  it('ティア C に <name>.css があると落ちる（ADR-0012）', () => {
    expect(
      runGuard((dir) => {
        write(dir, 'library/elements/src/x/x.element.ts', tierC)
        write(
          dir,
          'library/elements/src/x/x.css',
          '@layer rd.components { rd-x { display: block; } }\n',
        )
      }),
    ).not.toBe(0)
  })

  it('input を包む契約がティア A でないと落ちる（ADR-0012 §1）', () => {
    expect(
      runGuard((dir) => {
        write(dir, 'library/elements/src/x/x.element.ts', tierC)
        write(
          dir,
          'library/elements/src/x/x.contract.ts',
          "export const contract = {\n  roles: { control: ':scope > input' },\n}\n",
        )
      }),
    ).not.toBe(0)
  })

  it('*.element.ts が 150 行を超えると落ちる（ADR-0005）', () => {
    expect(
      runGuard((dir) => {
        write(dir, 'library/elements/src/x/x.element.ts', tierC + '\n'.repeat(200))
      }),
    ).not.toBe(0)
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

// plan 010: レーン所有権（14）と CEM の鮮度（15）は `main` からの差分を読む。
// 偽の git リポジトリを作り、base コミットと head コミットの差分で検査させる。
const runGuardOnBranch = (
  branch: string,
  base: (dir: string) => void,
  head: (dir: string) => void,
): number => {
  const dir = mkdtempSync(join(tmpdir(), 'riml-ds-guard-'))
  const env = withoutGitEnv()
  const git = (...args: readonly string[]): void => {
    const result = spawnSync('git', [...args], { cwd: dir, encoding: 'utf8', env })
    if ((result.status ?? 1) !== 0) {
      throw new Error(`git ${args.join(' ')}: ${result.stderr}`)
    }
  }
  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 'guard@example.test')
  git('config', 'user.name', 'guard')
  base(dir)
  git('add', '-A')
  git('commit', '-q', '-m', 'base')
  git('checkout', '-q', '-b', branch)
  head(dir)
  git('add', '-A')
  git('commit', '-q', '-m', 'head')
  const result = spawnSync('bash', [guardPath], {
    cwd: dir,
    encoding: 'utf8',
    // CI（GitHub Actions）で走らせたときに実際の PR ブランチ名を拾わないようにする
    env: { ...env, GITHUB_HEAD_REF: '' },
  })
  return result.status ?? 1
}

const lanes = [
  '# branch\tdepends_on\towned_paths\tsummary',
  'feat/tokens\t-\tsystem/tokens,tools/design-md\tトークン',
  '',
].join('\n')

describe('scripts/guard.sh レーン所有権（docs/parallel-lanes.md）', () => {
  it('所有していないパスを変えると落ちる', () => {
    expect(
      runGuardOnBranch(
        'feat/tokens',
        (dir) => {
          write(dir, 'scripts/lanes.tsv', lanes)
        },
        (dir) => {
          write(dir, 'library/react/src/wrapper.ts', 'export const wrapper = 1\n')
        },
      ),
    ).not.toBe(0)
  })

  it('所有するパスだけなら通る', () => {
    expect(
      runGuardOnBranch(
        'feat/tokens',
        (dir) => {
          write(dir, 'scripts/lanes.tsv', lanes)
        },
        (dir) => {
          write(dir, 'system/tokens/src/color.tokens.json', '{}\n')
        },
      ),
    ).toBe(0)
  })
})

describe('scripts/guard.sh CEM の鮮度', () => {
  const seed = (dir: string): void => {
    write(dir, 'scripts/lanes.tsv', lanes)
    write(dir, 'library/elements/custom-elements.json', '{ "modules": [] }\n')
    write(dir, 'tools/cem/registry.json', '[]\n')
  }

  it('*.element.ts を変えて custom-elements.json / registry.json を更新しないと落ちる', () => {
    expect(
      runGuardOnBranch('work', seed, (dir) => {
        write(dir, 'library/elements/src/x/x.element.ts', tierC)
      }),
    ).not.toBe(0)
  })

  it('*.element.ts と一緒に生成物を更新すれば通る', () => {
    expect(
      runGuardOnBranch('work', seed, (dir) => {
        write(dir, 'library/elements/src/x/x.element.ts', tierC)
        write(dir, 'library/elements/custom-elements.json', '{ "modules": [1] }\n')
        write(dir, 'tools/cem/registry.json', '[\n]\n')
      }),
    ).toBe(0)
  })
})
