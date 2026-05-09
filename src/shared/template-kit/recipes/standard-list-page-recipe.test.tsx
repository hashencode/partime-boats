import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from '@rstest/core'
import type { ColumnsType } from 'antd/es/table'
import { StandardListPageRecipe } from './standard-list-page-recipe'
import type { StandardListPageSpec } from '../specs/standard-list-page-spec'

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

describe('StandardListPageRecipe', () => {
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

    render(<StandardListPageRecipe spec={spec} />)

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
})
