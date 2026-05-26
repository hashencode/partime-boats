import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ThemeProvider } from '../../../shared/contexts/theme-context'
import { MskQueryListPage } from './msk-query-list-page'

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

let latestToggleIds = ''
let latestToggleStatus = ''

const server = setupServer(
  http.get('*/check/show', () =>
    HttpResponse.json([
      {
        id: 1,
        origincity_name: 'NINGBO',
        destinationcity_name: 'GDANSK',
        host: 'MSK',
        box_type: '40',
        delay_time: 30,
        is_run: 0,
        is_roll: 1,
        early_date: '2026-05-01',
        destination_service_mode: 'CY',
        limit_price: 1200,
        port: 'A1',
        log: 'lineA',
        tips: 'ok',
      },
    ])
  ),
  http.get('*/query/list', () => HttpResponse.json({ lineA: 'https://example.com/log' })),
  http.get('*/shippingLine', () => HttpResponse.json(['MSK', 'CMA'])),
  http.get('*/startport', () => HttpResponse.json(['NINGBO', 'SHA'])),
  http.get('*/endport', () => HttpResponse.json(['GDANSK', 'HAMBURG'])),
  http.get('*/account/num', () => HttpResponse.json('账号数: 12')),
  http.get('*/book/clear', () => HttpResponse.json({ bool_status: true, data: true })),
  http.get('*/check/auto', ({ request }) => {
    const url = new URL(request.url)
    latestToggleIds = url.searchParams.get('ids') ?? ''
    latestToggleStatus = url.searchParams.get('early_date') ?? ''
    return HttpResponse.json({ bool_status: true, data: true })
  })
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  latestToggleIds = ''
  latestToggleStatus = ''
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('MskQueryListPage', () => {
  it('should render list rows when request succeeds', async () => {
    render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getAllByText('NINGBO').length).toBeGreaterThan(0)
      expect(screen.getByText('账号数: 12')).toBeTruthy()
    })
  })

  it('should show error state when list request fails', async () => {
    server.use(http.get('*/check/show', () => HttpResponse.json({ message: 'server err' }, { status: 500 })))

    render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('MSK列表加载失败')).toBeTruthy()
      expect(screen.getByText('请求失败，请稍后重试。')).toBeTruthy()
    })
  })

  it('should not re-request when filter values change before submit', async () => {
    let requestCount = 0
    server.use(
      http.get('*/check/show', () => {
        requestCount += 1
        return HttpResponse.json([
          {
            id: 1,
            origincity_name: 'NINGBO',
            destinationcity_name: 'GDANSK',
          },
        ])
      })
    )

    render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(requestCount).toBeGreaterThan(0)
    })
    const initialCount = requestCount

    const comboBoxes = screen.getAllByRole('combobox')
    fireEvent.change(comboBoxes[0] as Element, { target: { value: 'SHA' } })

    expect(requestCount).toBe(initialCount)
  })

  it('should toggle all visible rows when nothing is checked', async () => {
    render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('NINGBO')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: '开启所有' }))
    const confirmText = await screen.findByText('当前没有勾选任何列表项，将会开启当前筛选结果中的所有项，是否确认？')
    expect(confirmText.closest('.ant-popover')?.getAttribute('style')).toContain('max-width: 280px')
    fireEvent.click(await screen.findByRole('button', { name: '是' }))

    await waitFor(() => {
      expect(latestToggleIds).toBe('1')
      expect(latestToggleStatus).toBe('0')
    })
  })

  it('should toggle checked rows when rows are selected', async () => {
    server.use(
      http.get('*/check/show', () =>
        HttpResponse.json([
          { id: 1, origincity_name: 'NINGBO', destinationcity_name: 'GDANSK' },
          { id: 2, origincity_name: 'SHA', destinationcity_name: 'HAMBURG' },
        ])
      )
    )

    render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('NINGBO')).toBeTruthy()
      expect(screen.getByText('HAMBURG')).toBeTruthy()
    })

    const rowCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(rowCheckboxes[1] as Element)

    fireEvent.click(screen.getByRole('button', { name: '关闭所有' }))
    fireEvent.click(await screen.findByRole('button', { name: '是' }))

    await waitFor(() => {
      expect(latestToggleIds).toBe('1')
      expect(latestToggleStatus).toBe('-1')
    })
  })

  it('should move batch action into the card header when rows are selected', async () => {
    render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('查询列表')).toBeTruthy()
    })

    const rowCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(rowCheckboxes[1] as Element)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '批量修改' })).toBeTruthy()
      expect(screen.getByText('已选 1 项')).toBeTruthy()
    })

    expect(screen.queryByText('查询列表')).toBeNull()
    expect(screen.queryByText('已选择')).toBeNull()
  })
})
