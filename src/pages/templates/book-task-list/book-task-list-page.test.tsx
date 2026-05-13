import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AuthContext } from '../../../infrastructure/auth/auth-context'
import { ThemeProvider } from '../../../shared/contexts/theme-context'
import { BookTaskListPage } from './book-task-list-page'

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

const originalGetComputedStyle = window.getComputedStyle.bind(window)
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: (element: Element) => originalGetComputedStyle(element),
})

const originalSetInterval = window.setInterval.bind(window)
const originalClearInterval = window.clearInterval.bind(window)
let intervalCallback: (() => void) | null = null
let clearedIntervalId: number | null = null
let nextTimerId = 1

if (!window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}

let listRequestCount = 0
let latestPage: string | null = null
let latestPerPage: string | null = null
let requestParamsHistory: Array<{ page: string | null; perPage: string | null; orderId: string | null }> = []
let batchOpenPayloads: string[] = []
const buildTaskRows = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    order_id: 100 + index + 1,
    account_name: index === 0 ? 'tester' : `tester-${index + 1}`,
    quantity: 1,
    box_type: '20 Dry Standard',
    origincity_name: '上海',
    destinationcity_name: '纽约',
    destination_service_mode: 'CY',
    order_date: '2026-05-01',
    is_order: 1,
    is_USA: 1,
    is_plan: 0,
    is_roll: 1,
    is_cid: 1,
    cid_type: 0,
    cid_group: 1,
    group_id: 'A1',
  }))

const server = setupServer(
  http.get('*/api/startport', () => HttpResponse.json(['上海'])),
  http.get('*/api/endport', () => HttpResponse.json(['纽约'])),
  http.get('*/api/maersk/book/task', async ({ request }) => {
    listRequestCount += 1
    const url = new URL(request.url)
    const orderId = url.searchParams.get('order_id')
    latestPage = url.searchParams.get('page')
    latestPerPage = url.searchParams.get('per_page')
    requestParamsHistory.push({
      page: latestPage,
      perPage: latestPerPage,
      orderId,
    })
    const page = Number(url.searchParams.get('page') || 1)
    const perPage = Number(url.searchParams.get('per_page') || 10)
    const data = orderId === '999' ? [] : buildTaskRows(101)
    const startIndex = (page - 1) * perPage
    const pagedData = data.slice(startIndex, startIndex + perPage)

    return HttpResponse.json({
      data: pagedData,
      pagination: {
        total: data.length,
        page,
        per_page: perPage,
      },
    })
  }),
  http.post('*/api/maersk/book/task', () => HttpResponse.json({ bool_status: true, data: true })),
  http.post('*/api/maersk/group/task', async ({ request }) => {
    const payload = (await request.json()) as { ids?: string }
    batchOpenPayloads.push(payload.ids ?? '')
    return HttpResponse.json({ bool_status: true, data: true })
  }),
  http.get('*/api/delay/cid', () => HttpResponse.json({ bool_status: true, data: true })),
  http.get('*/api/delay/route', () => HttpResponse.json({ bool_status: true, data: true }))
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  listRequestCount = 0
  latestPage = null
  latestPerPage = null
  requestParamsHistory = []
  batchOpenPayloads = []
  intervalCallback = null
  clearedIntervalId = null
  nextTimerId = 1
  window.setInterval = originalSetInterval
  window.clearInterval = originalClearInterval
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

const renderPage = (role: 'admin' | 'editor' | 'viewer' = 'admin') =>
  render(
    <AuthContext.Provider
      value={{
        isAuthenticated: true,
        role,
        displayName: 'tester',
        setRole: () => undefined,
        setDisplayName: () => undefined,
        login: async () => Promise.resolve(),
        logout: () => undefined,
      }}
    >
      <ThemeProvider>
        <BookTaskListPage />
      </ThemeProvider>
    </AuthContext.Provider>
  )

describe('BookTaskListPage', () => {
  it('should render task rows when request succeeds', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getAllByText('任务列表').length).toBeGreaterThan(0)
      expect(screen.getByText('tester')).toBeTruthy()
      expect(latestPage).toBe('1')
      expect(latestPerPage).toBe('10')
      expect(screen.getByRole('button', { name: '批量打开' })).toBeTruthy()
      expect(screen.getByRole('button', { name: '关闭初始化' })).toBeTruthy()
      expect(screen.queryByRole('button', { name: '批量修改' })).toBeNull()
    })
  })

  it('should not re-query when changing filters until query button clicked', async () => {
    renderPage()

    await waitFor(() => {
      expect(listRequestCount).toBeGreaterThan(0)
    })
    const initialCount = listRequestCount

    fireEvent.change(screen.getByLabelText('对应taskID'), { target: { value: '999' } })

    await waitFor(() => {
      expect(listRequestCount).toBe(initialCount)
    })

    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

    await waitFor(() => {
      expect(listRequestCount).toBe(initialCount + 1)
    })

    expect(requestParamsHistory.at(-1)).toEqual({
      page: '1',
      perPage: '10',
      orderId: '999',
    })
  }, 10000)

  it('should hide write actions for viewer role', async () => {
    renderPage('viewer')

    await waitFor(() => {
      expect(screen.getByText('tester')).toBeTruthy()
    })

    expect(screen.getByRole('button', { name: '关闭初始化' }).getAttribute('disabled')).not.toBeNull()
    expect(screen.queryByText('修改')).toBeNull()
  })

  it('should show error state when list request fails', async () => {
    server.use(
      http.get('*/api/maersk/book/task', () => HttpResponse.json({ message: 'server err' }, { status: 500 }))
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('任务列表加载失败')).toBeTruthy()
      expect(screen.getByText('请求失败，请稍后重试。')).toBeTruthy()
    })
  })

  it('should batch open all filtered rows in queue when nothing is checked', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('tester')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: '批量打开' }))
    const confirmText = await screen.findByText('未勾选任何列表项，将会开启当前筛选结果中的所有项，是否确认？')
    expect(confirmText.closest('.ant-popover')?.getAttribute('style')).toContain('max-width: 280px')
    fireEvent.click(await screen.findByRole('button', { name: '是' }))

    await waitFor(() => {
      expect(batchOpenPayloads).toHaveLength(2)
    })

    expect(requestParamsHistory.some((item) => item.page === '1' && item.perPage === '100')).toBeTruthy()
    expect(requestParamsHistory.some((item) => item.page === '2' && item.perPage === '100')).toBeTruthy()
    expect(batchOpenPayloads[0]?.split(',').map((item) => item.trim()).filter(Boolean)).toHaveLength(100)
    expect(batchOpenPayloads[1]?.split(',').map((item) => item.trim()).filter(Boolean)).toHaveLength(1)
  }, 10000)

  it('should auto refresh every 15 seconds without changing submitted filters or pagination', async () => {
    window.setInterval = ((handler: TimerHandler, timeout?: number) => {
      if (timeout === 15000) {
        intervalCallback = () => {
          if (typeof handler === 'function') {
            handler()
          }
        }
        return nextTimerId++
      }

      return originalSetInterval(handler, timeout)
    }) as typeof window.setInterval

    window.clearInterval = ((timerId?: number) => {
      clearedIntervalId = timerId ?? null
    }) as typeof window.clearInterval

    const view = renderPage()

    await waitFor(() => {
      expect(screen.getByText('tester')).toBeTruthy()
    })

    fireEvent.change(screen.getByLabelText('对应taskID'), { target: { value: '101' } })
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

    await waitFor(() => {
      expect(requestParamsHistory.at(-1)).toEqual({
        page: '1',
        perPage: '10',
        orderId: '101',
      })
    })

    const pageTwoItem = view.container.querySelector('.ant-pagination-item-2') as HTMLElement | null
    expect(pageTwoItem).toBeTruthy()
    fireEvent.click(pageTwoItem!)

    await waitFor(() => {
      expect(requestParamsHistory.at(-1)).toEqual({
        page: '2',
        perPage: '10',
        orderId: '101',
      })
    })

    fireEvent.change(screen.getByLabelText('对应taskID'), { target: { value: '999' } })

    expect(intervalCallback).toBeTruthy()
    await act(async () => {
      intervalCallback?.()
    })

    await waitFor(() => {
      expect(requestParamsHistory.at(-1)).toEqual({
        page: '2',
        perPage: '10',
        orderId: '101',
      })
    })

    view.unmount()

    expect(clearedIntervalId).toBe(1)
  })
})
