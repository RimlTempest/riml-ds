/**
 * 実 DOM テスト用のヘルパ。`library/elements/test/fixture.ts` に 1 つだけ置く（docs/testing.md）。
 * `test/` はドメイン層の外なので `throw` してよい（設定ミスは呼び側のバグ）。
 */

type LitLike = HTMLElement & { readonly updateComplete: Promise<boolean> }

const isLitLike = (el: HTMLElement): el is LitLike =>
  'updateComplete' in el && el.updateComplete instanceof Promise

/** define 済みのタグを含む HTML を body に挿し、Lit の初回描画を待って返す */
export const fixtureOf = async <T extends HTMLElement>(
  ctor: new () => T,
  html: string,
): Promise<T> => {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.append(host)
  const el = host.firstElementChild
  if (!(el instanceof ctor)) {
    throw new Error(`fixtureOf: ${ctor.name} が 1 つ必要`)
  }
  if (isLitLike(el)) {
    await el.updateComplete
  }
  return el
}

/** ティア A/B 用：部品の style.css を <link> で 1 回だけ読み込む */
export const loadStyle = async (href: string): Promise<void> => {
  const existing = document.head.querySelector(
    `link[rel='stylesheet'][data-fixture-href='${href}']`,
  )
  if (existing !== null) {
    return
  }
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset['fixtureHref'] = href
  const loaded = new Promise<void>((resolve, reject) => {
    link.addEventListener(
      'load',
      () => {
        resolve()
      },
      { once: true },
    )
    link.addEventListener(
      'error',
      () => {
        reject(new Error(`loadStyle: ${href} を読み込めない`))
      },
      { once: true },
    )
  })
  document.head.append(link)
  await loaded
}

/** 各テストの後に呼ぶ。fixture が挿した要素だけを片付ける（<link> は残す） */
export const cleanupFixtures = (): void => {
  document.body.replaceChildren()
}
