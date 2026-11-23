import { describe, expect, it } from '@rstest/core'
import { templateRoutes } from './routes.config'

const getRouteByKey = (key: string) => templateRoutes.find((route) => route.key === key)

describe('routes.config menu labels', () => {
  it('should use the updated management labels for standalone menus', () => {
    expect(getRouteByKey('order-list')?.title).toBe('订单管理')
    expect(getRouteByKey('book-task-list')?.title).toBe('订舱管理')
    expect(getRouteByKey('remind-list')?.title).toBe('日志管理')
  })

  it('should place query pages and system settings pages into the expected groups', () => {
    expect(getRouteByKey('msk-query-list')?.menuGroup).toBe('查询管理')
    expect(getRouteByKey('msk-api-list')?.menuGroup).toBe('查询管理')
    expect(getRouteByKey('base-port-list')?.menuMode).toBe('grouped')
    expect(getRouteByKey('base-port-list')?.menuGroup).toBe('系统设置')
    expect(getRouteByKey('book-account-list')?.title).toBe('系统设置')
    expect(getRouteByKey('book-account-list')?.menuGroup).toBe('系统设置')
  })
})

describe('MSK account management routes', () => {
  it('appends two account entries while preserving the existing system settings entry', () => {
    const entries = templateRoutes.filter((route) => route.inMenu && route.menuGroup === '系统设置')
    expect(entries.map((route) => route.key)).toEqual(['base-port-list', 'book-account-list', 'msk-book-account-list', 'msk-query-account-list'])
    expect(getRouteByKey('book-account-list')?.path).toBe('/book_account_list')
    expect(getRouteByKey('book-account-list')?.title).toBe('系统设置')
    expect(getRouteByKey('msk-book-account-list')?.title).toBe('MSK订舱账号')
    expect(getRouteByKey('msk-query-account-list')?.title).toBe('MSK查询账号')
    expect(getRouteByKey('msk-query-account-list')?.permission).toBe('list.read')
  })

  it('keeps account form routes beneath each list with form access and no menu entries', () => {
    for (const prefix of ['msk-book-account-list', 'msk-query-account-list']) {
      const form = getRouteByKey(`${prefix}-form`)
      expect(form?.path).toBe(`/${prefix}/form`)
      expect(form?.inMenu).toBe(false)
      expect(form?.permission).toBe('form.read')
    }
  })
})
