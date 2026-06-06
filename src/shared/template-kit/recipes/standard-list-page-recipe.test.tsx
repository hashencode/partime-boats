import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from '@rstest/core'
import type { ColumnsType } from 'antd/es/table'
import { StandardListPageRecipe } from './standard-list-page-recipe'
import type { StandardListPageSpec } from '../specs/standard-list-page-spec'
import { RouteTitleProvider } from '../../contexts/route-title-context'
import { SEARCH_COMPACT_LAYOUT_STORAGE_KEY, ThemeProvider } from '../../contexts/theme-context'
import { ALL_DATA_PAGE_SIZE } from '../../hooks/use-standard-pagination'

void React

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

if (!window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}

type FilterValues = {
  name?: string
}

type RequestFilters = {
  name?: string
  current?: number
  size?: number
}

type Response = {
  data: Array<{ id: number; name: string }>
  current: number
  size: number
  total: number
}

type VirtualScrollSnapshot = {
  enabled: boolean
  scroll: {
    x: number
    y: number
  }
}

describe('StandardListPageRecipe', () => {
  const renderWithTheme = (node: React.ReactNode, routeTitle: string | null = null) =>
    render(
      <ThemeProvider>
        <RouteTitleProvider value={{ title: routeTitle }}>{node}</RouteTitleProvider>
      </ThemeProvider>
    )

  it('does not auto request on filter value change and re-queries on every submit click', async () => {
    const requestCalls: RequestFilters[] = []
    const spec: StandardListPageSpec<FilterValues, RequestFilters, Response, { id: number; name: string }, Error> = {
      pageTitle: '测试列表',
      cardTitle: '测试数据',
      tableId: 'recipe-test-list',
      formRoute: '/test/form',
      initialFilters: {},
      toFilters: (values) => ({
        name: values.name?.trim() || undefined,
      }),
      buildRequestFilters: ({ filters, current, pageSize }) => ({
        ...filters,
        current,
        size: pageSize,
      }),
      request: async (filters) => {
        requestCalls.push(filters)
        return {
          data: [{ id: 1, name: filters.name ?? 'default' }],
          current: filters.current ?? 1,
          size: filters.size ?? 10,
          total: 1,
        }
      },
      selectItems: (response) => response?.data ?? [],
      filterFields: [
        {
          type: 'input',
          name: 'name',
          label: '名称',
          inputProps: {
            placeholder: '请输入名称',
          },
        },
      ],
      buildColumns: () =>
        [
          {
            key: 'name',
            title: '名称',
            dataIndex: 'name',
          },
        ] satisfies ColumnsType<{ id: number; name: string }>,
      buildTableNode: ({ dataSource }) => <div data-testid="table-node">{dataSource[0]?.name ?? 'empty'}</div>,
    }

    renderWithTheme(<StandardListPageRecipe spec={spec} />)

    await waitFor(() => {
      expect(requestCalls).toHaveLength(1)
    })

    fireEvent.change(screen.getByPlaceholderText('请输入名称'), {
      target: { value: '  alpha  ' },
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })

    expect(requestCalls).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

    await waitFor(() => {
      expect(requestCalls).toHaveLength(2)
    })

    expect(requestCalls[1]).toEqual({
      name: 'alpha',
      current: 1,
      size: 10,
    })
    expect(screen.getByTestId('table-node').textContent).toBe('alpha')

    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

    await waitFor(() => {
      expect(requestCalls).toHaveLength(3)
    })

    expect(requestCalls[2]).toEqual({
      name: 'alpha',
      current: 1,
      size: 10,
    })
  })

  it('resets to first page when page size changes', async () => {
    const requestCalls: RequestFilters[] = []
    const spec: StandardListPageSpec<FilterValues, RequestFilters, Response, { id: number; name: string }, Error> = {
      pageTitle: '测试列表',
      cardTitle: '测试数据',
      tableId: 'recipe-test-list-page-size',
      formRoute: '/test/form',
      initialFilters: {},
      toFilters: (values) => ({
        name: values.name?.trim() || undefined,
      }),
      buildRequestFilters: ({ filters, current, pageSize }) => ({
        ...filters,
        current,
        size: pageSize,
      }),
      request: async (filters) => {
        requestCalls.push(filters)
        return {
          data: [{ id: 1, name: 'demo' }],
          current: filters.current ?? 1,
          size: filters.size ?? 10,
          total: 200,
        }
      },
      selectItems: (response) => response?.data ?? [],
      filterFields: [],
      buildColumns: () =>
        [
          {
            key: 'name',
            title: '名称',
            dataIndex: 'name',
          },
        ] satisfies ColumnsType<{ id: number; name: string }>,
      buildTableNode: ({ onPageChange }) => (
        <div>
          <button type="button" onClick={() => onPageChange(3, 10)}>
            goto-page-3
          </button>
          <button type="button" onClick={() => onPageChange(3, 20)}>
            change-size
          </button>
        </div>
      ),
    }

    renderWithTheme(<StandardListPageRecipe spec={spec} />)

    await waitFor(() => {
      expect(requestCalls).toHaveLength(1)
    })

    fireEvent.click(screen.getByRole('button', { name: 'goto-page-3' }))

    await waitFor(() => {
      expect(requestCalls).toHaveLength(2)
    })
    expect(requestCalls[1]).toEqual({
      current: 3,
      size: 10,
    })

    fireEvent.click(screen.getByRole('button', { name: 'change-size' }))

    await waitFor(() => {
      expect(requestCalls).toHaveLength(3)
    })
    expect(requestCalls[2]).toEqual({
      current: 1,
      size: 20,
    })
  })

  it('should enable virtual scroll when page size reaches the large-page threshold', async () => {
    let latestVirtualScroll: VirtualScrollSnapshot | null = null
    const spec: StandardListPageSpec<FilterValues, RequestFilters, Response, { id: number; name: string }, Error> = {
      pageTitle: '测试列表',
      cardTitle: '测试数据',
      tableId: 'recipe-test-list-virtual-scroll',
      formRoute: '/test/form',
      initialFilters: {},
      toFilters: (values) => ({
        name: values.name?.trim() || undefined,
      }),
      buildRequestFilters: ({ filters, current, pageSize }) => ({
        ...filters,
        current,
        size: pageSize,
      }),
      request: async (filters) => ({
        data: [{ id: 1, name: 'demo' }],
        current: filters.current ?? 1,
        size: filters.size ?? 10,
        total: 200,
      }),
      selectItems: (response) => response?.data ?? [],
      filterFields: [],
      buildColumns: () =>
        [
          {
            key: 'name',
            title: '名称',
            dataIndex: 'name',
            width: 180,
          },
        ] satisfies ColumnsType<{ id: number; name: string }>,
      buildTableNode: ({ onPageChange, virtualScroll }) => {
        latestVirtualScroll = virtualScroll
        return (
          <div>
            <button type="button" onClick={() => onPageChange(2, 100)}>
              change-page-size
            </button>
          </div>
        )
      },
    }

    renderWithTheme(<StandardListPageRecipe spec={spec} />)

    await waitFor(() => {
      expect(latestVirtualScroll).not.toBeNull()
    })

    expect(latestVirtualScroll).toEqual({
      enabled: false,
      scroll: {
        x: 1200,
        y: 700,
      },
    })

    fireEvent.click(screen.getByRole('button', { name: 'change-page-size' }))

    await waitFor(() => {
      expect(latestVirtualScroll).toEqual({
        enabled: true,
        scroll: {
          x: 1200,
          y: 700,
        },
      })
    })
  })

  it('should enable virtual scroll on first render when default page size is all data', async () => {
    let latestVirtualScroll: VirtualScrollSnapshot | null = null
    const spec: StandardListPageSpec<FilterValues, RequestFilters, Response, { id: number; name: string }, Error> = {
      pageTitle: '测试列表',
      cardTitle: '测试数据',
      tableId: 'recipe-test-list-default-all-data',
      formRoute: '/test/form',
      initialFilters: {},
      pagination: {
        defaultPageSize: ALL_DATA_PAGE_SIZE,
      },
      toFilters: (values) => ({
        name: values.name?.trim() || undefined,
      }),
      buildRequestFilters: ({ filters, current, pageSize }) => ({
        ...filters,
        current,
        size: pageSize,
      }),
      request: async (filters) => ({
        data: [{ id: 1, name: 'demo' }],
        current: filters.current ?? 1,
        size: filters.size ?? ALL_DATA_PAGE_SIZE,
        total: 1,
      }),
      selectItems: (response) => response?.data ?? [],
      filterFields: [],
      buildColumns: () =>
        [
          {
            key: 'name',
            title: '名称',
            dataIndex: 'name',
            width: 180,
          },
        ] satisfies ColumnsType<{ id: number; name: string }>,
      buildTableNode: ({ virtualScroll }) => {
        latestVirtualScroll = virtualScroll
        return <div>virtual-table</div>
      },
    }

    renderWithTheme(<StandardListPageRecipe spec={spec} />)

    await waitFor(() => {
      expect(latestVirtualScroll).toEqual({
        enabled: true,
        scroll: {
          x: 1200,
          y: 700,
        },
      })
    })
  })

  it('should pass compact search layout preference to filter form', async () => {
    window.localStorage.setItem(SEARCH_COMPACT_LAYOUT_STORAGE_KEY, 'true')

    const spec: StandardListPageSpec<FilterValues, RequestFilters, Response, { id: number; name: string }, Error> = {
      pageTitle: '测试列表',
      cardTitle: '测试数据',
      tableId: 'recipe-test-list-compact-layout',
      formRoute: '/test/form',
      initialFilters: {},
      toFilters: (values) => ({
        name: values.name?.trim() || undefined,
      }),
      request: async () => ({
        data: [{ id: 1, name: 'demo' }],
        current: 1,
        size: 10,
        total: 1,
      }),
      selectItems: (response) => response?.data ?? [],
      filterFields: [
        {
          type: 'input',
          name: 'name',
          label: '名称',
        },
      ],
      buildColumns: () =>
        [
          {
            key: 'name',
            title: '名称',
            dataIndex: 'name',
          },
        ] satisfies ColumnsType<{ id: number; name: string }>,
      buildTableNode: ({ dataSource }) => <div>{dataSource[0]?.name ?? 'empty'}</div>,
    }

    const { container } = renderWithTheme(<StandardListPageRecipe spec={spec} />)

    await waitFor(() => {
      expect(container.querySelector('.flex.w-full.flex-wrap.items-end')).toBeTruthy()
    })

    window.localStorage.removeItem(SEARCH_COMPACT_LAYOUT_STORAGE_KEY)
  })

  it('does not render the filter card when there are no filter fields', async () => {
    const spec: StandardListPageSpec<FilterValues, RequestFilters, Response, { id: number; name: string }, Error> = {
      pageTitle: '测试列表',
      cardTitle: '测试列表',
      tableId: 'recipe-test-list-without-filters',
      formRoute: '/test/form',
      initialFilters: {},
      toFilters: () => ({}),
      request: async () => ({
        data: [{ id: 1, name: 'demo' }],
        current: 1,
        size: 10,
        total: 1,
      }),
      selectItems: (response) => response?.data ?? [],
      filterFields: [],
      buildColumns: () =>
        [
          {
            key: 'name',
            title: '名称',
            dataIndex: 'name',
          },
        ] satisfies ColumnsType<{ id: number; name: string }>,
      buildTableNode: ({ dataSource }) => <div>{dataSource[0]?.name ?? 'empty'}</div>,
    }

    const { container } = renderWithTheme(<StandardListPageRecipe spec={spec} />)

    await waitFor(() => {
      expect(screen.getByText('demo')).toBeTruthy()
    })

    expect(screen.queryByRole('button', { name: /查\s*询/ })).toBeNull()
    expect(container.querySelector('.ant-card')).toBeTruthy()
    expect(container.querySelectorAll('.ant-card').length).toBe(1)
    expect(screen.getAllByText('测试列表')).toHaveLength(1)
  })

  it('should prefer the shared route title and hide the duplicated card title', async () => {
    const spec: StandardListPageSpec<FilterValues, RequestFilters, Response, { id: number; name: string }, Error> = {
      pageTitle: '提醒列表',
      cardTitle: '提醒列表',
      tableId: 'recipe-test-route-title',
      formRoute: '/test/form',
      initialFilters: {},
      toFilters: () => ({}),
      request: async () => ({
        data: [{ id: 1, name: 'demo' }],
        current: 1,
        size: 10,
        total: 1,
      }),
      selectItems: (response) => response?.data ?? [],
      filterFields: [],
      buildColumns: () =>
        [
          {
            key: 'name',
            title: '名称',
            dataIndex: 'name',
          },
        ] satisfies ColumnsType<{ id: number; name: string }>,
      buildTableNode: ({ dataSource }) => <div>{dataSource[0]?.name ?? 'empty'}</div>,
    }

    renderWithTheme(<StandardListPageRecipe spec={spec} />, '日志管理')

    await waitFor(() => {
      expect(screen.getByText('日志管理')).toBeTruthy()
    })

    expect(screen.queryByText('提醒列表')).toBeNull()
  })

  it('supports local pagination mode without sending page parameters to request', async () => {
    const requestCalls: RequestFilters[] = []
    const spec: StandardListPageSpec<FilterValues, RequestFilters, Response, { id: number; name: string }, Error> = {
      paginationMode: 'local',
      pageTitle: '测试列表',
      cardTitle: '测试数据',
      tableId: 'recipe-test-list-local-pagination',
      formRoute: '/test/form',
      initialFilters: {},
      toFilters: (values) => ({
        name: values.name?.trim() || undefined,
      }),
      buildRequestFilters: ({ filters, current, pageSize }) => ({
        ...filters,
        current,
        size: pageSize,
      }),
      request: async (filters) => {
        requestCalls.push(filters)
        return {
          data: Array.from({ length: 12 }, (_, index) => ({
            id: index + 1,
            name: `item-${index + 1}`,
          })),
          current: 1,
          size: 12,
          total: 12,
        }
      },
      selectItems: (response) => response?.data ?? [],
      filterFields: [],
      buildColumns: () =>
        [
          {
            key: 'name',
            title: '名称',
            dataIndex: 'name',
          },
        ] satisfies ColumnsType<{ id: number; name: string }>,
      buildTableNode: ({ dataSource, onPageChange }) => (
        <div>
          <div data-testid="local-page-items">{dataSource.map((item) => item.name).join(',')}</div>
          <button type="button" onClick={() => onPageChange(2, 10)}>
            goto-local-page-2
          </button>
        </div>
      ),
    }

    renderWithTheme(<StandardListPageRecipe spec={spec} />)

    await waitFor(() => {
      expect(requestCalls).toHaveLength(1)
    })

    expect(requestCalls[0]).toEqual({})
    expect(screen.getByTestId('local-page-items').textContent).toContain('item-1')
    expect(screen.getByTestId('local-page-items').textContent).not.toContain('item-11')

    fireEvent.click(screen.getByRole('button', { name: 'goto-local-page-2' }))

    await waitFor(() => {
      expect(screen.getByTestId('local-page-items').textContent).toContain('item-11')
    })
    expect(screen.getByTestId('local-page-items').textContent?.split(',')).toEqual(['item-11', 'item-12'])
    expect(requestCalls).toHaveLength(1)
  })

  it('does not refresh the list when selection state changes and request filters stay the same', async () => {
    const requestCalls: RequestFilters[] = []

    const SelectionRefreshProbe = () => {
      const [selectedCount, setSelectedCount] = React.useState(0)
      const spec = React.useMemo<
        StandardListPageSpec<FilterValues, RequestFilters, Response, { id: number; name: string }, Error>
      >(
        () => ({
          pageTitle: '测试列表',
          cardTitle: '测试数据',
          tableId: 'recipe-test-selection-refresh',
          formRoute: '/test/form',
          initialFilters: {},
          toFilters: () => ({}),
          buildRequestFilters: ({ filters, current, pageSize }) => ({
            ...filters,
            current,
            size: pageSize,
          }),
          request: async (filters) => {
            requestCalls.push(filters)
            return {
              data: [{ id: 1, name: 'demo' }],
              current: filters.current ?? 1,
              size: filters.size ?? 10,
              total: 1,
            }
          },
          selectItems: (response) => response?.data ?? [],
          filterFields: [],
          toolbarExtra: <span>已选 {selectedCount} 项</span>,
          buildColumns: () =>
            [
              {
                key: 'name',
                title: '名称',
                dataIndex: 'name',
              },
            ] satisfies ColumnsType<{ id: number; name: string }>,
          buildTableNode: ({ dataSource }) => (
            <div>
              <div data-testid="selection-table-node">{dataSource[0]?.name ?? 'empty'}</div>
              <button type="button" onClick={() => setSelectedCount((count) => count + 1)}>
                toggle-selection
              </button>
            </div>
          ),
        }),
        [selectedCount]
      )

      return <StandardListPageRecipe spec={spec} />
    }

    renderWithTheme(<SelectionRefreshProbe />)

    await waitFor(() => {
      expect(requestCalls).toHaveLength(1)
    })

    fireEvent.click(screen.getByRole('button', { name: 'toggle-selection' }))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })

    expect(requestCalls).toHaveLength(1)
    expect(screen.getByText('已选 1 项')).toBeTruthy()
    expect(screen.getByTestId('selection-table-node').textContent).toBe('demo')
  })

  it('places selection info on the left, action area in the center, and view controls on the right', async () => {
    const spec: StandardListPageSpec<FilterValues, RequestFilters, Response, { id: number; name: string }, Error> = {
      pageTitle: '测试列表',
      cardTitle: '测试数据',
      tableId: 'recipe-test-header-layout',
      formRoute: '/test/form',
      initialFilters: {},
      toFilters: () => ({}),
      request: async () => ({
        data: [{ id: 1, name: 'demo' }],
        current: 1,
        size: 10,
        total: 1,
      }),
      selectItems: (response) => response?.data ?? [],
      filterFields: [],
      createAction: {
        label: '新增规则',
      },
      toolbarExtra: <button type="button">批量操作</button>,
      buildColumns: () =>
        [
          {
            key: 'name',
            title: '名称',
            dataIndex: 'name',
          },
        ] satisfies ColumnsType<{ id: number; name: string }>,
      buildTableNode: ({ dataSource }) => <div>{dataSource[0]?.name ?? 'empty'}</div>,
    }

    const { container } = renderWithTheme(
      <StandardListPageRecipe spec={spec} cardTitleOverride={<span>已选 2 项</span>} />
    )

    await waitFor(() => {
      expect(screen.getByText('demo')).toBeTruthy()
    })

    const left = container.querySelector('.list-card-header-left')
    const center = container.querySelector('.list-card-header-center')
    const right = container.querySelector('.list-card-header-right')

    expect(left?.textContent).toContain('已选 2 项')
    const refreshButton = screen.getByRole('button', { name: '刷新' })
    const createButton = screen.getByRole('button', { name: '新增规则' })
    const customButton = screen.getByRole('button', { name: '批量操作' })

    expect(refreshButton.closest('.list-card-header-center')).toBe(center)
    expect(createButton.closest('.list-card-header-center')).toBe(center)
    expect(customButton.closest('.list-card-header-center')).toBe(center)
    expect(customButton.compareDocumentPosition(refreshButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('button', { name: '密度' }).closest('.list-card-header-right')).toBe(right)
    expect(screen.getByRole('button', { name: '列设置' }).closest('.list-card-header-right')).toBe(right)
  })
})
