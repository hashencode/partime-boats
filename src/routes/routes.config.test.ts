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
