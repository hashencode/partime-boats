import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ThemeProvider } from '../../../shared/contexts/theme-context'
import { OrderListPage } from './order-list-page'

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
  http.get('*/startport', () => HttpResponse.json(['宁波'])),
  http.get('*/endport', () => HttpResponse.json(['洛杉矶'])),
  http.post('*/book/check', () =>
    HttpResponse.json({
      data: [
        {
          id: 1,
          username: 'demo_user',
          earlytime: '2026-05-01',
          arrive_time: '2026-05-08',
          is_book: 0,
          price: 120,
          box_number: 3,
        },
      ],
      total_page: 1,
    })
  ),
  http.post('*/book/order', () => HttpResponse.json({ bool_status: true, data: '提交成功' })),
  http.post('*/book/out', () => HttpResponse.json({}))
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  window.localStorage.clear()
})

afterAll(() => {
  server.close()
})

describe('OrderListPage', () => {
  it('should render list data when request succeeds', async () => {
    render(<ThemeProvider><OrderListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getAllByText('订单列表').length).toBeGreaterThan(0)
      expect(screen.getByText('demo_user')).toBeTruthy()
    })

    expect(screen.getByText('40')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByRole('button', { name: '120' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '120 / 3' })).toBeNull()

    expect(screen.getByText('50 条/页')).toBeTruthy()

    fireEvent.mouseDown(screen.getByText('50 条/页'))

    await waitFor(() => {
      expect(screen.getByText('100 条/页')).toBeTruthy()
      expect(screen.getByText('200 条/页')).toBeTruthy()
      expect(screen.getByText('500 条/页')).toBeTruthy()
      expect(screen.getByText('所有数据')).toBeTruthy()
    })
  })

  it('should show quantity column even when old column preferences are stored', async () => {
    window.localStorage.setItem(
      'list:table-view-preferences:v1:template-order-list',
      JSON.stringify({
        density: 'middle',
        visibleColumnKeys: ['actions', 'username', 'price'],
        columnOrder: ['actions', 'username', 'price'],
      })
    )

    render(<ThemeProvider><OrderListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: '数量' })).toBeTruthy()
      expect(screen.getByText('3')).toBeTruthy()
    })
  })

  it('should make action column sortable by total price', async () => {
    render(<ThemeProvider><OrderListPage /></ThemeProvider>)

    const actionHeader = await screen.findByRole('columnheader', { name: '下单' })
    expect(actionHeader.getAttribute('aria-description')).toBe('sortable')
  })

  it('should not re-query when changing filters until query button clicked', async () => {
    let requestCount = 0
    server.use(
      http.post('*/book/check', () => {
        requestCount += 1
        return HttpResponse.json({
          data: [{ id: 2, username: 'u2', is_book: 0, earlytime: '2026-05-01', arrive_time: '2026-05-03' }],
          total_page: 1,
        })
      })
    )

    render(<ThemeProvider><OrderListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(requestCount).toBe(1)
    })

    fireEvent.change(screen.getByLabelText('用户名'), { target: { value: 'alice' } })

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
      http.post('*/book/check', () =>
        HttpResponse.json({ errorCode: 'QUERY_SERVER_ERROR', message: '服务异常' }, { status: 500 })
      )
    )

    render(<ThemeProvider><OrderListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('订单列表加载失败')).toBeTruthy()
      expect(screen.getByText('请求失败，请稍后重试。')).toBeTruthy()
    })
  })

  it('should render expired endtime with tertiary text color', async () => {
    server.use(
      http.post('*/book/check', () =>
        HttpResponse.json({
          data: [
            {
              id: 1,
              username: 'demo_user',
              earlytime: '2026-05-01',
              arrive_time: '2026-05-08',
              endtime: '2020-01-01 00:00:00',
              is_book: 0,
              price: 123,
              box_number: 0,
            },
          ],
          total_page: 1,
        })
      )
    )

    render(<ThemeProvider><OrderListPage /></ThemeProvider>)

    const expiredText = await screen.findByText('2020-01-01 00:00:00')
    expect(expiredText.className).toContain('text-[color:var(--ant-color-text-tertiary)]')
  })

  it('should render dash for unit price when quantity is invalid', async () => {
    server.use(
      http.post('*/book/check', () =>
        HttpResponse.json({
          data: [
            {
              id: 1,
              username: 'demo_user',
              earlytime: '2026-05-01',
              arrive_time: '2026-05-08',
              is_book: 0,
              price: 123,
              box_number: 0,
            },
          ],
          total_page: 1,
        })
      )
    )

    render(<ThemeProvider><OrderListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '123' })).toBeTruthy()
      expect(screen.getAllByText('-').length).toBeGreaterThan(0)
    })
  })
})
