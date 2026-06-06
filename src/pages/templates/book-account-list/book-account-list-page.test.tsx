import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ThemeProvider } from '../../../shared/contexts/theme-context'
import { BookAccountListPage } from './book-account-list-page'

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

const server = setupServer(
  http.get('*/maersk/book/list', () =>
    HttpResponse.json({
      data: [
        {
          account: 'demo-account',
          customer_code: 'C001',
          is_refresh_use: 1,
          update_time: '2026-05-01 08:09:10',
        },
      ],
      pagination: {
        total: 1,
      },
    })
  )
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('BookAccountListPage', () => {
  it('should render list data when request succeeds', async () => {
    render(<ThemeProvider><BookAccountListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getAllByText('订舱账号列表').length).toBeGreaterThan(0)
      expect(screen.getByText('demo-account')).toBeTruthy()
      expect(screen.getByText('C001')).toBeTruthy()
      expect(screen.getByText('是')).toBeTruthy()
    })
  })

  it('should not re-query when changing filters until query button clicked', async () => {
    let requestCount = 0
    server.use(
      http.get('*/maersk/book/list', () => {
        requestCount += 1
        return HttpResponse.json({
          data: [{ account: 'filtered-account', customer_code: 'C002', is_refresh_use: 0, update_time: '2026-05-02 10:00:00' }],
          pagination: { total: 1 },
        })
      })
    )

    render(<ThemeProvider><BookAccountListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(requestCount).toBe(1)
    })

    fireEvent.change(screen.getByPlaceholderText('请输入账号分组'), { target: { value: 'group-a' } })

    await waitFor(() => {
      expect(requestCount).toBe(1)
    })

    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

    await waitFor(() => {
      expect(requestCount).toBe(2)
    })
  })

  it('should show error state when list request fails', async () => {
    server.use(
      http.get('*/maersk/book/list', () =>
        HttpResponse.json({ errorCode: 'QUERY_SERVER_ERROR', message: '服务异常' }, { status: 500 })
      )
    )

    render(<ThemeProvider><BookAccountListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('订舱账号列表加载失败')).toBeTruthy()
      expect(screen.getByText('请求失败，请稍后重试。')).toBeTruthy()
    })
  })

  it('should show empty state when request returns no rows', async () => {
    server.use(
      http.get('*/maersk/book/list', () =>
        HttpResponse.json({
          data: [],
          pagination: { total: 0 },
        })
      )
    )

    render(<ThemeProvider><BookAccountListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('可以重置筛选后重新查询。')).toBeTruthy()
      expect(screen.getByRole('button', { name: '重置筛选' })).toBeTruthy()
    })
  })

  it('should treat missing data field as empty state', async () => {
    server.use(
      http.get('*/maersk/book/list', () =>
        HttpResponse.json({
          pagination: { total: 0 },
        })
      )
    )

    render(<ThemeProvider><BookAccountListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('可以重置筛选后重新查询。')).toBeTruthy()
    })
  })

  it('should treat null data field as empty state', async () => {
    server.use(
      http.get('*/maersk/book/list', () =>
        HttpResponse.json({
          data: null,
          pagination: { total: 0 },
        })
      )
    )

    render(<ThemeProvider><BookAccountListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('可以重置筛选后重新查询。')).toBeTruthy()
    })
  })
})
