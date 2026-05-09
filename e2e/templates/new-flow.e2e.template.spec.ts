import { expect, test } from '@playwright/test'

test.describe('Xxx Flow E2E', () => {
  test('should complete the critical user journey', async ({ page }) => {
    // Replace with your app entry. Consider using baseURL in playwright config.
    await page.goto('/login')

    // 1) login
    await page.getByLabel('用户名').fill('admin')
    await page.getByLabel('密码').fill('password')
    await page.getByRole('button', { name: '登录' }).click()

    // 2) navigate to target page
    await page.getByRole('link', { name: '查询列表' }).click()
    await expect(page.getByText('查询列表')).toBeVisible()

    // 3) query
    await page.getByPlaceholder('请输入规则名称').fill('模板')
    await page.getByRole('button', { name: '查询' }).click()
    await expect(page.getByText('模板列表')).toBeVisible()

    // 4) open create form and validate navigation
    await page.getByRole('button', { name: '新建规则' }).click()
    await expect(page).toHaveURL(/\/template\/form\/basic-form/)
  })

  test('should reject unauthorized write action for viewer', async ({ page }) => {
    // Replace with real viewer login flow.
    await page.goto('/template/list/table')
    await expect(page.getByText('查询列表')).toBeVisible()
    await expect(page.getByRole('button', { name: '新建规则' })).toHaveCount(0)
  })
})
