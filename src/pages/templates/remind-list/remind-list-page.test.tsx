import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AuthContext } from '../../../infrastructure/auth/auth-context'
import { ThemeProvider } from '../../../shared/contexts/theme-context'
import { RemindListPage } from './remind-list-page'

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

const remindRows = [
  {
    id: 1,
    portofloading: 'NINGBO',
    portofdischarge: 'ONNE',
    boxcode: '20DRY',
    departuredate: '2026-05-01',
    oceanfreightamount: 100,
    total_amount: 120,
    source: 'demo',
    insert_datetime: '2026-05-01 12:00:00',
    is_use: 0,
    ship_info: 'V001',
    price_id: 1001,
  },
]

let remindRequestCount = 0
let invalidatePayload: Record<string, unknown> | null = null
let latestPerPage: string | null = null

const server = setupServer(
  http.get('*/startport', () => HttpResponse.json(['NINGBO'])),
  http.get('*/endport', () => HttpResponse.json(['ONNE'])),
  http.get('*/shippingLine', () => HttpResponse.json(['西非基本港'])),
  http.get('*/maersk/remind/list', ({ request }) => {
    remindRequestCount += 1
    latestPerPage = new URL(request.url).searchParams.get('per_page')
    return HttpResponse.json({
      data: remindRows,
      total: 1,
    })
  }),
  http.post('*/maersk/remind/list', async ({ request }) => {
    invalidatePayload = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ bool_status: true, data: true })
  })
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  remindRequestCount = 0
  invalidatePayload = null
  latestPerPage = null
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
        <RemindListPage />
      </ThemeProvider>
    </AuthContext.Provider>
  )

describe('RemindListPage', () => {
  it('should render remind rows when request succeeds', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getAllByText('提醒列表').length).toBeGreaterThan(0)
      expect(screen.getByText('NINGBO')).toBeTruthy()
      expect(latestPerPage).toBe('10')
      expect(screen.getByRole('button', { name: '刷新' })).toBeTruthy()
      expect(screen.getByRole('button', { name: '密度' })).toBeTruthy()
      expect(screen.getByRole('button', { name: '列设置' })).toBeTruthy()
    })
  })

  it('should not re-query when changing filters until query button clicked', async () => {
    renderPage()

    await waitFor(() => {
      expect(remindRequestCount).toBe(1)
    })

    const comboboxes = screen.getAllByRole('combobox')
    fireEvent.mouseDown(comboboxes[2]!)

    const option = await screen.findByRole('option', { name: '20DRY' })
    fireEvent.click(option)

    await waitFor(() => {
      expect(remindRequestCount).toBe(1)
    })

    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

    await waitFor(() => {
      expect(remindRequestCount).toBe(2)
    })
  })

  it('should show error state when list request fails', async () => {
    server.use(
      http.get('*/maersk/remind/list', () =>
        HttpResponse.json({ errorCode: 'QUERY_SERVER_ERROR', message: '服务异常' }, { status: 500 })
      )
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('提醒列表加载失败')).toBeTruthy()
      expect(screen.getByText('请求失败，请稍后重试。')).toBeTruthy()
    })
  })

  it('should hide write actions for viewer role', async () => {
    renderPage('viewer')

    await waitFor(() => {
      expect(screen.getByText('NINGBO')).toBeTruthy()
    })

    expect(screen.queryByRole('button', { name: '批量作废' })).toBeNull()
    expect(screen.queryByRole('button', { name: '作废' })).toBeNull()
    expect(screen.getByRole('button', { name: '刷新' })).toBeTruthy()
  })

  it('should invalidate selected rows when batch action confirmed', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('NINGBO')).toBeTruthy()
    })

    const table = screen.getByRole('table')
    const checkbox = within(table).getAllByRole('checkbox')[1]
    fireEvent.click(checkbox)
    fireEvent.click(screen.getByRole('button', { name: '批量作废' }))
    fireEvent.click(await screen.findByRole('button', { name: '是' }))

    await waitFor(() => {
      expect(invalidatePayload).toEqual({ ids: '1' })
    })
  })

  it('should not re-query when selecting rows', async () => {
    renderPage()

    await waitFor(() => {
      expect(remindRequestCount).toBe(1)
    })

    const table = screen.getByRole('table')
    const checkbox = within(table).getAllByRole('checkbox')[1]
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(remindRequestCount).toBe(1)
    })
  })
})
