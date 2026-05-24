import { describe, expect, it } from '@rstest/core'
import {
  isMenuVisibleInCurrentEnv,
  moveMenuGroupToEnd,
  resolveDocumentTitle,
  resolveNavigationTitle,
  resolveRouteByPath,
  shouldShowDevMenuGroup,
  shouldShowMswSwitch,
} from './app-shell'
import { SEARCH_COMPACT_LAYOUT_STORAGE_KEY, THEME_STORAGE_KEY } from '../contexts/theme-context'

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

  it('should use stable storage keys for theme and search compact layout preferences', () => {
    expect(THEME_STORAGE_KEY).toBe('admin-theme-mode')
    expect(SEARCH_COMPACT_LAYOUT_STORAGE_KEY).toBe('admin-search-compact-layout')
  })

  it('should resolve the current route by exact path or the longest matching prefix', () => {
    const routes = [
      {
        key: 'book-task-list',
        path: '/get_book_task_list',
        title: '订舱管理',
        icon: null,
        permission: 'list.read' as const,
        inMenu: true,
      },
      {
        key: 'base-port-form',
        path: '/get_base_list/form',
        title: '基础端口表单',
        icon: null,
        permission: 'form.read' as const,
        inMenu: false,
      },
    ]

    expect(resolveRouteByPath(routes, '/get_book_task_list')?.title).toBe('订舱管理')
    expect(resolveRouteByPath(routes, '/get_base_list/form/edit')?.title).toBe('基础端口表单')
  })

  it('should prefer the current route title for the browser tab title', () => {
    const routes = [
      {
        key: 'book-task-list',
        path: '/get_book_task_list',
        title: '订舱管理',
        icon: null,
        permission: 'list.read' as const,
        inMenu: true,
      },
    ]

    expect(resolveDocumentTitle(routes, '/get_book_task_list')).toBe('订舱管理')
    expect(resolveDocumentTitle(routes, '/')).toBe('欢迎')
    expect(resolveDocumentTitle(routes, '/unknown')).toBe('Admin Quick Start')
  })

  it('should keep the browser title aligned with the highlighted navigation item', () => {
    const menuRoutes = [
      {
        key: 'base-port-list',
        path: '/get_base_list',
        title: '基础端口列表',
        icon: null,
        permission: 'list.read' as const,
        inMenu: true,
      },
    ]

    expect(resolveNavigationTitle(menuRoutes, '/get_base_list/form')).toBe('基础端口列表')
    expect(resolveNavigationTitle(menuRoutes, '/')).toBe('欢迎')
  })
})
