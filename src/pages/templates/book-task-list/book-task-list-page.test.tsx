import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AuthContext } from '../../../infrastructure/auth/auth-context'
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

if (!window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}

let listRequestCount = 0
let saveRequestCount = 0

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
  http.get('*/legacy-api/startport', () => HttpResponse.json(['上海'])),
  http.get('*/legacy-api/endport', () => HttpResponse.json(['纽约'])),
  http.get('*/legacy-api/maersk/book/task', async ({ request }) => {
    listRequestCount += 1
    const url = new URL(request.url)
    const orderId = url.searchParams.get('order_id')
    const data = orderId === '999' ? [] : buildTaskRows(101)

    return HttpResponse.json({
      data,
      pagination: {
        total: data.length,
        page: Number(url.searchParams.get('page') || 1),
        per_page: Number(url.searchParams.get('per_page') || 100),
      },
    })
  }),
  http.post('*/legacy-api/maersk/book/task', () => {
    saveRequestCount += 1
    return HttpResponse.json({ bool_status: true, data: true })
  }),
  http.post('*/legacy-api/maersk/group/task', () => HttpResponse.json({ bool_status: true, data: true })),
  http.get('*/legacy-api/delay/cid', () => HttpResponse.json({ bool_status: true, data: true })),
  http.get('*/legacy-api/delay/route', () => HttpResponse.json({ bool_status: true, data: true }))
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  listRequestCount = 0
  saveRequestCount = 0
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
      <BookTaskListPage />
    </AuthContext.Provider>
  )

describe('BookTaskListPage', () => {
  it('should render task rows when request succeeds', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getAllByText('任务列表').length).toBeGreaterThan(0)
      expect(screen.getByText('tester')).toBeTruthy()
      expect(screen.getByRole('button', { name: '关闭初始化' })).toBeTruthy()
      expect(screen.queryByRole('button', { name: '批量修改' })).toBeNull()
    })
  })

  it('should not re-query when changing filters until query button clicked', async () => {
    renderPage()

    await waitFor(() => {
      expect(listRequestCount).toBe(1)
    })

    fireEvent.change(screen.getByLabelText('对应taskID'), { target: { value: '999' } })

    await waitFor(() => {
      expect(listRequestCount).toBe(1)
    })

    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

    await waitFor(() => {
      expect(listRequestCount).toBe(2)
    })
  })

  it('should hide write actions for viewer role', async () => {
    renderPage('viewer')

    await waitFor(() => {
      expect(screen.getByText('tester')).toBeTruthy()
    })

    expect(screen.getByRole('button', { name: '关闭初始化' })).toBeDisabled()
    expect(screen.queryByText('修改')).toBeNull()
  })

  it('should show error state when list request fails', async () => {
    server.use(
      http.get('*/legacy-api/maersk/book/task', () => HttpResponse.json({ message: 'server err' }, { status: 500 }))
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('任务列表加载失败')).toBeTruthy()
      expect(screen.getByText('请求失败，请稍后重试。')).toBeTruthy()
    })
  })

  it('should show batch toolbar when rows selected', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('tester')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('checkbox', { name: /select all/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '批量修改' })).toBeTruthy()
      expect(screen.getByRole('button', { name: '批量打开' })).toBeTruthy()
      expect(listRequestCount).toBe(1)
    })
  })

  it('should open edit modal and save without re-querying on page change', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('tester')).toBeTruthy()
      expect(listRequestCount).toBe(1)
    })

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    await waitFor(() => {
      expect(screen.getByText('tester-101')).toBeTruthy()
      expect(listRequestCount).toBe(1)
    })

    fireEvent.click(screen.getAllByRole('button', { name: '修改' })[0])

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '修改' })).toBeTruthy()
    })

    fireEvent.change(screen.getAllByLabelText('账户')[0], { target: { value: 'updated-tester' } })
    fireEvent.click(screen.getByRole('button', { name: '确 定' }))

    await waitFor(() => {
      expect(saveRequestCount).toBe(1)
      expect(screen.queryByRole('dialog', { name: '修改' })).toBeNull()
      expect(listRequestCount).toBe(2)
    })
  })
})
