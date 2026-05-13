import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from '@rstest/core'
import type { ColumnsType } from 'antd/es/table'
import { StandardListPageRecipe } from './standard-list-page-recipe'
import type { StandardListPageSpec } from '../specs/standard-list-page-spec'
import { VIRTUAL_SCROLL_PAGE_SIZE_THRESHOLD } from '../../hooks/use-standard-pagination'
import { SEARCH_COMPACT_LAYOUT_STORAGE_KEY, ThemeProvider } from '../../contexts/theme-context'

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
  const renderWithTheme = (node: React.ReactNode) => render(<ThemeProvider>{node}</ThemeProvider>)

  it('does not auto request on filter value change and only queries on submit', async () => {
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

  it('should enable virtual scroll with fixed height when page size reaches threshold', async () => {
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
            <button type="button" onClick={() => onPageChange(2, VIRTUAL_SCROLL_PAGE_SIZE_THRESHOLD)}>
              enable-virtual-scroll
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

    fireEvent.click(screen.getByRole('button', { name: 'enable-virtual-scroll' }))

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
})
