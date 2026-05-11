import { describe, expect, it } from '@rstest/core'
import {
  isMenuVisibleInCurrentEnv,
  moveMenuGroupToEnd,
  shouldShowDevMenuGroup,
  shouldShowMswSwitch,
} from './app-shell'

describe('app-shell menu visibility helpers', () => {
  it('should hide dev-only routes outside development mode', () => {
    expect(
      isMenuVisibleInCurrentEnv(
        {
          key: 'template-only',
          path: '/template',
          title: 'Template',
          icon: null,
          permission: 'list.read',
          inMenu: true,
          menuVisibility: 'dev-only',
        },
        false
      )
    ).toBe(false)
  })

  it('should show dev menu group only in development mode with dev-only routes', () => {
    expect(
      shouldShowDevMenuGroup(
        [
          {
            key: 'template-only',
            path: '/template',
            title: 'Template',
            icon: null,
            permission: 'list.read',
            inMenu: true,
            menuVisibility: 'dev-only',
          },
        ],
        true
      )
    ).toBe(true)

    expect(
      shouldShowDevMenuGroup(
        [
          {
            key: 'template-only',
            path: '/template',
            title: 'Template',
            icon: null,
            permission: 'list.read',
            inMenu: true,
            menuVisibility: 'dev-only',
          },
        ],
        false
      )
    ).toBe(false)
  })

  it('should gate msw switch by development mode and availability', () => {
    expect(shouldShowMswSwitch(true, true)).toBe(true)
    expect(shouldShowMswSwitch(false, true)).toBe(false)
    expect(shouldShowMswSwitch(true, false)).toBe(false)
  })

  it('should keep always-visible routes available outside development mode', () => {
    expect(
      isMenuVisibleInCurrentEnv(
        {
          key: 'order-list',
          path: '/order-list',
          title: '订单列表',
          icon: null,
          permission: 'list.read',
          inMenu: true,
          menuVisibility: 'always',
        },
        false
      )
    ).toBe(true)
  })

  it('should move the system settings group to the end when present', () => {
    expect(
      moveMenuGroupToEnd(
        [
          { key: 'order-list', label: '订单管理' },
          { key: 'group-系统设置', label: '系统设置' },
          { key: 'group-查询管理', label: '查询管理' },
        ],
        'group-系统设置'
      ).map((item) => item.key)
    ).toEqual(['order-list', 'group-查询管理', 'group-系统设置'])
  })
})
