import { expect, test } from '@playwright/test'

/**
 * ティア A は **JS 無しで動く**（ADR-0012）。送信・検証・ラベル関連付けはブラウザが素で行う。
 * この project は `javaScriptEnabled: false`。axe は別 project（`pe-axe`）が見る
 * （axe 自身がページに JS を注入するため。ページに `<script>` は 1 つも無いので DOM は同じ）。
 */
test('button: JS 無しでも押せて、フォームがネイティブに送信される', async ({ page }) => {
  await page.goto('/button.html')
  const submit = page.getByRole('button', { name: '送信' })
  await expect(submit).toBeVisible()
  await submit.click()
  await expect(page).toHaveURL(/\/echo\.html/u)
  await expect(page.getByRole('heading', { name: '送信済み' })).toBeVisible()
})

test('button: JS 無しでも <name>.css が当たる（タップ標的 44px）', async ({ page }) => {
  await page.goto('/button.html')
  // --rd-sizing-target-min: 2.75rem = 44px（WCAG 2.2 Target Size）
  await expect(page.locator('rd-button > button')).toHaveCSS('min-block-size', '44px')
})

test('text-field: JS 無しでも入力が送信される', async ({ page }) => {
  await page.goto('/text-field.html')
  await page.getByLabel('メール').fill('name@example.com')
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/email=name%40example\.com/u)
})

test('text-field: required が空なら遷移しない（ネイティブ検証）', async ({ page }) => {
  await page.goto('/text-field.html')
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/\/text-field\.html$/u)
  await expect(page.getByLabel('メール')).toBeFocused()
})

test('skip link: JS 無しでも Tab で現れ、Enter で本文へ飛ぶ', async ({ page }) => {
  await page.goto('/button.html')
  const link = page.getByRole('link', { name: '本文へ' })
  await page.keyboard.press('Tab')
  await expect(link).toBeFocused()
  await expect(link).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#main$/u)
})

test('select: JS 無しでも選んで送信できる', async ({ page }) => {
  await page.goto('/select.html')
  await page.getByLabel('国').selectOption('jp')
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/country=jp/u)
})

test('select: required が未選択なら遷移しない（ネイティブ検証）', async ({ page }) => {
  await page.goto('/select.html')
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/\/select\.html$/u)
  await expect(page.getByLabel('国')).toBeFocused()
})

test('combobox: JS 無しでは <input list> と <datalist> がネイティブの候補を出す', async ({
  page,
}) => {
  await page.goto('/combobox.html')
  const control = page.getByLabel('読み')
  // 定義前は `list` が残っている（部品が外すのは定義後だけ。契約もこの形を見る）
  await expect(control).toHaveAttribute('list', 'reading-list')
  await expect(page.locator('#reading-list > option')).toHaveCount(5)
  // 部品が足す listbox は JS が無いので存在しない（ネイティブの吹き出しと二重にならない）
  await expect(page.locator("rd-combobox [part='list']")).toHaveCount(0)
})

test('combobox: JS 無しでも打った値が送信される', async ({ page }) => {
  await page.goto('/combobox.html')
  await page.getByLabel('読み').fill('かな')
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/reading=%E3%81%8B%E3%81%AA/u)
})

test('combobox: JS 無しでも <name>.css が当たる（タップ標的 44px）', async ({ page }) => {
  await page.goto('/combobox.html')
  await expect(page.locator('rd-combobox > input')).toHaveCSS('min-block-size', '44px')
})

test('checkbox: JS 無しでもチェックが送信される', async ({ page }) => {
  await page.goto('/checkbox.html')
  await page.getByLabel('規約に同意する').check()
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/terms=yes/u)
})

test('checkbox: JS 無しでも文言までがタップ標的になる（44px）', async ({ page }) => {
  await page.goto('/checkbox.html')
  await expect(page.locator('rd-checkbox > label')).toHaveCSS('min-block-size', '44px')
})

test('checkbox group: JS 無しでも複数の値が同じ name で送信される', async ({ page }) => {
  await page.goto('/checkbox-group.html')
  const group = page.getByRole('group', { name: 'タグ' })
  await group.getByLabel('仕事').check()
  await group.getByLabel('私用').check()
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/tags=a&tags=b/u)
})

test('checkbox group: JS 無しでは min が効かない（正しい縮退。サーバで検証する）', async ({
  page,
}) => {
  await page.goto('/checkbox-group.html')
  await page.getByRole('button', { name: '送信' }).click()
  // 1 つも選ばなくてもネイティブは止めない（min は部品が JS で見る）
  await expect(page).toHaveURL(/\/echo\.html/u)
})

test('checkbox group: JS 無しでは segmented の見た目にならない（:state() は JS が付ける）', async ({
  page,
}) => {
  await page.goto('/checkbox-group.html')
  await expect(page.locator('rd-checkbox-group[segmented] label').first()).toHaveCSS(
    'min-block-size',
    '44px',
  )
})

test('input otp: JS 無しでも桁ごとに入力して送信できる', async ({ page }) => {
  await page.goto('/input-otp.html')
  await page.getByLabel('1 桁目').fill('1')
  await page.getByLabel('2 桁目').fill('2')
  await page.getByLabel('3 桁目').fill('3')
  await page.getByLabel('4 桁目').fill('4')
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/code-1=1&code-2=2&code-3=3&code-4=4/u)
})

test('input otp: required な桁が空なら遷移しない（ネイティブ検証）', async ({ page }) => {
  await page.goto('/input-otp.html')
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/\/input-otp\.html$/u)
  await expect(page.getByLabel('1 桁目')).toBeFocused()
})

test('disclosure: JS 無しでも開閉できる（<details> そのもの）', async ({ page }) => {
  await page.goto('/disclosure.html')
  const body = page.getByText('全国一律 500 円です。')
  await expect(body).toBeHidden()
  await page.getByText('送料について').click()
  await expect(body).toBeVisible()
})

test('meter: JS 無しでもネイティブ <meter> が値を表示する', async ({ page }) => {
  await page.goto('/meter.html')
  const meter = page.getByRole('meter', { name: 'ディスク使用量' })
  await expect(meter).toBeVisible()
  await expect(meter).toHaveAttribute('value', '3.2')
  // JS が無いので --rd-meter-fill は書かれない。フォールバック（0）で描く
  await expect(page.locator('rd-meter > meter')).toHaveCSS('border-radius', '9999px')
})

test('meter: JS 無しでもフォールバック文言が読める', async ({ page }) => {
  await page.goto('/meter.html')
  await expect(page.locator('rd-meter > meter')).toContainText('3.2 GB / 10 GB')
})

test('input group: JS 無しでも検索語がネイティブに送信される', async ({ page }) => {
  await page.goto('/input-group.html')
  await page.getByLabel('検索').fill('qr')
  await page.getByRole('button', { name: '検索' }).click()
  await expect(page).toHaveURL(/q=qr/u)
})

test('input group: JS 無しでもピルの枕が当たる（.rd-input-group）', async ({ page }) => {
  await page.goto('/input-group.html')
  await expect(page.locator('.rd-input-group')).toHaveCSS('border-radius', '9999px')
})

test('button group: JS 無しでもピルの枕が当たる（.rd-button-group）', async ({ page }) => {
  await page.goto('/button-group.html')
  await expect(page.locator('.rd-button-group')).toHaveCSS('border-radius', '9999px')
  await expect(page.getByRole('group', { name: '表示' })).toBeVisible()
  // 中のボタンはピルのまま（角を削らない。docs/brand.md §7.2）
  await expect(page.locator('.rd-button-group rd-toggle > button').first()).toHaveCSS(
    'border-radius',
    '9999px',
  )
})

test('radio group: JS 無しでも選んだ値が送信される', async ({ page }) => {
  await page.goto('/radio-group.html')
  await page.getByRole('group', { name: 'プラン' }).getByLabel('有料').check()
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/plan=pro/u)
})

test('radio group: required が未選択なら遷移しない（ネイティブ検証）', async ({ page }) => {
  await page.goto('/radio-group.html')
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/\/radio-group\.html$/u)
})

test('radio group: JS 無しでは segmented の見た目にならない（:state() は JS が付ける）', async ({
  page,
}) => {
  await page.goto('/radio-group.html')
  // 区画の見た目は付かないが、選択肢はそのまま押せて送信できる（正しい縮退）
  await expect(page.locator('rd-radio-group[segmented] label').first()).toHaveCSS(
    'min-block-size',
    '44px',
  )
})

test('slider: JS 無しでも値が送信される', async ({ page }) => {
  await page.goto('/slider.html')
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page).toHaveURL(/volume=3/u)
})

test('slider: JS 無しでは塗りが出ない（ネイティブの range そのもの）', async ({ page }) => {
  await page.goto('/slider.html')
  await expect(page.getByRole('slider', { name: '音量' })).toBeVisible()
  await expect(page.locator("rd-slider [part='track']")).toHaveCount(0)
})

test('toggle: JS 無しでも押下状態が読める（aria-pressed は markup が書く）', async ({ page }) => {
  await page.goto('/toggle.html')
  await expect(page.getByRole('button', { name: '太字' })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('button', { name: '下線' })).toHaveAttribute('aria-pressed', 'true')
  // JS 無しでは押しても変わらない（ただのボタンに縮退する。害は無い）
  await page.getByRole('button', { name: '太字' }).click()
  await expect(page.getByRole('button', { name: '太字' })).toHaveAttribute('aria-pressed', 'false')
})

test('toggle: JS 無しでも <name>.css が当たる（タップ標的 44px のピル）', async ({ page }) => {
  await page.goto('/toggle.html')
  await expect(page.locator('rd-toggle > button').first()).toHaveCSS('min-block-size', '44px')
})

test('button group: 枕の中身は押下状態を持つボタン（JS 無しでも aria-pressed が読める）', async ({
  page,
}) => {
  await page.goto('/button-group.html')
  const group = page.getByRole('group', { name: '表示' })
  await expect(group.getByRole('button', { name: '一覧' })).toHaveAttribute('aria-pressed', 'true')
  await expect(group.getByRole('button', { name: '格子' })).toHaveAttribute('aria-pressed', 'false')
})
