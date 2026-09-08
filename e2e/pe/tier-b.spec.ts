import { expect, test } from '@playwright/test'

/**
 * ティア B は **JS 無しで内容が見える**（ADR-0012）。`rd-dialog:not(:defined)` の CSS が受け、
 * 見出しと本文が inline のセクションとして読める。隠れていたら fail。
 */
test('dialog: JS 無しでも見出しと本文が読める', async ({ page }) => {
  await page.goto('/dialog.html')
  await expect(page.getByRole('heading', { name: '確認' })).toBeVisible()
  await expect(page.getByText('保存しますか？')).toBeVisible()
})

test('dialog: JS 無しでも枠の見た目が当たる（:not(:defined)）', async ({ page }) => {
  await page.goto('/dialog.html')
  await expect(page.locator('rd-dialog')).toHaveCSS('display', 'block')
})

/**
 * `rd-window` も同じ約束。JS 無しでは帯だけを描き、**ボタンは出さない**
 * （押せない丸を置かない。ADR-0014 決定 1）。
 */
test('window: JS 無しでも見出しと本文が読める', async ({ page }) => {
  await page.goto('/window.html')
  await expect(page.getByRole('heading', { name: 'バックアップの設定' })).toBeVisible()
  await expect(page.getByText('毎晩 3 時に実行します。')).toBeVisible()
})

test('window: JS 無しでは操作の丸が 1 つも出ない', async ({ page }) => {
  await page.goto('/window.html')
  await expect(page.locator('rd-window')).toHaveCSS('display', 'block')
  await expect(page.locator('rd-window button')).toHaveCount(0)
})

/**
 * `alert` / `placement`（plan 022）は属性が増えるだけで、JS 無しの見え方は変わらない。
 * `:not(:defined)` の CSS はどちらも同じ（帯にするのは shadow の枠なので、定義前は関係ない）。
 */
test('dialog: 帯（placement）と alert でも JS 無しで内容が読める', async ({ page }) => {
  await page.goto('/dialog-sheet.html')
  await expect(page.getByRole('heading', { name: '絞り込み' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '削除の確認' })).toBeVisible()
  await expect(page.getByText('元に戻せません。')).toBeVisible()
  await expect(page.locator('rd-dialog').first()).toHaveCSS('display', 'block')
})

/**
 * `atoms.css` / `utilities.css` の面と待ち（plan 022）は **JS を 1 行も使わない**。
 * ここは「クラスだけで内容が読めて、転がる入れ物がキーボードで届く」ことを見る。
 */
test('surfaces: JS 無しでカード・空の知らせ・待ちの輪が読める', async ({ page }) => {
  await page.goto('/card.html')
  await expect(page.getByRole('link', { name: '送料のはなし' })).toBeVisible()
  await expect(page.getByText('まだありません')).toBeVisible()
  await expect(page.getByRole('status')).toContainText('読み込み中')
})

test('surfaces: アコーディオンは <details> なので JS 無しで開く', async ({ page }) => {
  await page.goto('/card.html')
  const answer = page.getByText('7 日以内なら受け付けます。')
  await expect(answer).toBeHidden()
  await page.getByRole('group').filter({ hasText: '返品について' }).locator('summary').click()
  await expect(answer).toBeVisible()
})

test('surfaces: 転がる入れ物はキーボードで届く（tabindex="0"）', async ({ page }) => {
  await page.goto('/card.html')
  const carousel = page.getByRole('region', { name: '新着' })
  await carousel.focus()
  await expect(carousel).toBeFocused()
  const log = page.getByRole('region', { name: '記録' })
  await log.focus()
  await expect(log).toBeFocused()
})

/**
 * `rd-tabs` は JS が無ければ**ページ内リンクの列**。パネルは**すべて見える**
 * （どれかを隠すのは JS が来てから）。
 */
test('tabs: JS 無しでもすべてのパネルが読める', async ({ page }) => {
  await page.goto('/tabs.html')
  await expect(page.getByText('この部品の概要。')).toBeVisible()
  await expect(page.getByText('使い方の説明。')).toBeVisible()
})

test('tabs: JS 無しではタブがただのページ内リンク', async ({ page }) => {
  await page.goto('/tabs.html')
  const tab = page.getByRole('link', { name: '使い方' })
  await expect(tab).toBeVisible()
  await expect(tab).toHaveAttribute('href', '#usage')
  // JS が来る前に role を先取りしない（tablist は element が足す）
  await expect(page.locator('rd-tabs [slot=tabs]')).not.toHaveAttribute('role', 'tablist')
})

/**
 * `rd-menu` は **HTML だけで開閉する**（`popovertarget` + `[popover]`）。JS が来る前は
 * `:not(:defined)` が受けて項目をその場に開いたまま見せる——ティア B の「内容が見える」。
 */
test('menu: JS 無しでもすべての項目が読める', async ({ page }) => {
  await page.goto('/menu.html')
  await expect(page.getByRole('link', { name: '複製' })).toBeVisible()
  await expect(page.getByRole('button', { name: '削除' })).toBeVisible()
})

test('menu: JS 無しでもトリガーが popovertarget で [popover] を指す', async ({ page }) => {
  await page.goto('/menu.html')
  const trigger = page.getByRole('button', { name: '操作' })
  await expect(trigger).toHaveAttribute('popovertarget', 'row-actions')
  // JS が来る前に role を先取りしない（menu は element が [popover] 自身に足す）
  await expect(page.locator('rd-menu [popover]')).not.toHaveAttribute('role', 'menu')
})

/** `rd-popover` も同じ約束。見出しと本文が JS 無しで読める */
test('popover: JS 無しでも見出しと本文が読める', async ({ page }) => {
  await page.goto('/popover.html')
  await expect(page.getByRole('heading', { name: '絞り込み' })).toBeVisible()
  await expect(page.getByText('条件を選ぶと一覧がその場で変わる。')).toBeVisible()
})

/**
 * `hover`（Hover Card、plan 026）は**ホバーという近道を足すだけ**。JS が無ければ
 * 今までどおり見出しと本文が読め、`popovertarget` のボタンが唯一の入口として残る。
 */
test('popover: hover を付けても JS 無しで見出しと本文が読める', async ({ page }) => {
  await page.goto('/hover-card.html')
  await expect(page.getByRole('heading', { name: 'riml' })).toBeVisible()
  await expect(page.getByText('デザインシステムを作っている。')).toBeVisible()
})

test('popover: hover を付けても押して開く経路（popovertarget）が残る', async ({ page }) => {
  await page.goto('/hover-card.html')
  await expect(page.locator('rd-popover')).toHaveAttribute('hover', '')
  await expect(page.getByRole('button', { name: 'riml' })).toHaveAttribute(
    'popovertarget',
    'profile',
  )
})

/**
 * `context`（Context Menu、plan 026）も同じ。右クリックは近道で、**目に見えるボタンが
 * 唯一の保証された入口**（APG）。JS が無ければブラウザ既定の右クリックのままになる。
 */
test('menu: context を付けても JS 無しですべての項目が読める', async ({ page }) => {
  await page.goto('/context-menu.html')
  await expect(page.getByRole('link', { name: '複製' })).toBeVisible()
  await expect(page.getByRole('button', { name: '削除' })).toBeVisible()
})

test('menu: context を付けても目に見えるボタンが popovertarget を持つ', async ({ page }) => {
  await page.goto('/context-menu.html')
  await expect(page.locator('rd-menu')).toHaveAttribute('context', '')
  await expect(page.getByRole('button', { name: '操作' })).toHaveAttribute(
    'popovertarget',
    'row-context',
  )
})

/** `.rd-nav-menu` は CSS だけ（plan 026）。JS が無くてもリンクの帯として辿れる */
test('nav-menu: JS 無しでもリンクの帯と現在地が読める', async ({ page }) => {
  await page.goto('/nav-menu.html')
  const nav = page.getByRole('navigation', { name: '主要' })
  await expect(nav.getByRole('link', { name: 'ホーム' })).toHaveAttribute('aria-current', 'page')
  await expect(nav.getByRole('link', { name: 'ヘルプ' })).toBeVisible()
  // 落ちるメニューの中身も JS 無しでは開いたまま見える（:not(:defined)）
  await expect(page.getByRole('link', { name: '新しい書類' })).toBeVisible()
})

test('nav-menu: 現在地は太字 + 下の縦罫（色だけに頼らない）', async ({ page }) => {
  await page.goto('/nav-menu.html')
  const current = page.getByRole('link', { name: 'ホーム' })
  await expect(current).toHaveCSS('font-weight', '700')
  await expect(current).not.toHaveCSS('border-block-end-color', 'rgba(0, 0, 0, 0)')
})

/**
 * `rd-splitter` は JS が無ければ **2 つの面が縦に積まれてどちらも読める**（ティア B）。
 * 割合を変えるのは JS が来てからで、それまでは全部見えているのが正しい姿。
 */
test('splitter: JS 無しでも 2 つの面がどちらも読める', async ({ page }) => {
  await page.goto('/splitter.html')
  await expect(page.getByRole('heading', { name: '一覧' })).toBeVisible()
  await expect(page.getByText('条件で絞った結果がここに出る。')).toBeVisible()
  await expect(page.getByRole('heading', { name: '本文' })).toBeVisible()
  await expect(page.getByText('選んだものの中身がここに出る。')).toBeVisible()
  await expect(page.locator('rd-splitter')).toHaveCSS('display', 'grid')
})

test('splitter: JS 無しではつまみ（separator）が 1 つも無い', async ({ page }) => {
  await page.goto('/splitter.html')
  // つまみは shadow にしか無い。定義前に role を先取りしない（押せない仕切りを置かない）
  await expect(page.getByRole('separator')).toHaveCount(0)
  await expect(page.locator('rd-splitter [role=separator]')).toHaveCount(0)
})
