import React from 'react'
import { Form } from 'antd'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

const originalSetInterval = window.setInterval.bind(window)
const originalClearInterval = window.clearInterval.bind(window)
let intervalCallback: (() => void) | null = null
let clearedIntervalId: number | null = null
let nextTimerId = 1

const remindRows = Array.from({ length: 11 }, (_, index) => ({
  id: index + 1,
  portofloading: 'NINGBO',
  portofdischarge: 'ONNE',
  boxcode: '20DRY',
  departuredate: '2026-05-01',
  oceanfreightamount: 100 + index,
  total_amount: 120 + index,
  source: 'demo',
  insert_datetime: '2026-05-01 12:00:00',
  is_use: index === 0 ? 1 : 0,
  ship_info: `V${String(index + 1).padStart(3, '0')}`,
  price_id: 1001 + index,
}))

let remindRequestCount = 0
let invalidatePayload: Record<string, unknown> | null = null
let latestPage: string | null = null
let latestPerPage: string | null = null
let requestParamsHistory: Array<{
  page: string | null
  perPage: string | null
  boxcode: string | null
}> = []
type CapturedFilterForm = {
  setFieldValue: (name: string, value: unknown) => void
}

const requireCapturedForm = (capturedForm: CapturedFilterForm | null): CapturedFilterForm => {
  if (!capturedForm) {
    throw new Error('filter form was not created')
  }

  return capturedForm
}

const server = setupServer(
  http.get('*/startport', () => HttpResponse.json(['NINGBO'])),
  http.get('*/endport', () => HttpResponse.json(['ONNE'])),
  http.get('*/shippingLine', () => HttpResponse.json(['西非基本港'])),
  http.get('*/maersk/remind/list', ({ request }) => {
    remindRequestCount += 1
    const url = new URL(request.url)
    latestPage = url.searchParams.get('page')
    latestPerPage = url.searchParams.get('per_page')
    const boxcode = url.searchParams.get('boxcode')
    requestParamsHistory.push({
      page: latestPage,
      perPage: latestPerPage,
      boxcode,
    })

    const page = Number(latestPage || 1)
    const perPage = Number(latestPerPage || 10)
    const filteredRows = boxcode ? remindRows.filter((item) => item.boxcode === boxcode) : remindRows
    const startIndex = (page - 1) * perPage

    return HttpResponse.json({
      data: filteredRows.slice(startIndex, startIndex + perPage),
      total: filteredRows.length,
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
  cleanup()
  remindRequestCount = 0
  invalidatePayload = null
  latestPage = null
  latestPerPage = null
  requestParamsHistory = []
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
        <RemindListPage />
      </ThemeProvider>
    </AuthContext.Provider>
  )

describe('RemindListPage', () => {
  it('should render remind rows when request succeeds', async () => {
    renderPage()

    await screen.findAllByText('NINGBO')

    expect(screen.getAllByText('提醒列表').length).toBeGreaterThan(0)
    expect(latestPerPage).toBe('10')
    expect(screen.getByRole('button', { name: '刷新' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '密度' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '列设置' })).toBeTruthy()
    expect(screen.getByText('未作废')).toBeTruthy()
    expect(screen.getAllByText('已作废').length).toBeGreaterThan(0)

    expect(screen.queryByText('是')).toBeNull()
    expect(screen.queryByText('否')).toBeNull()
  })

  it('should not re-query when changing filters until query button clicked', async () => {
    const originalUseForm = Form.useForm
    let capturedForm: CapturedFilterForm | null = null
    Form.useForm = ((...args: Parameters<typeof originalUseForm>) => {
      const formTuple = originalUseForm(...args)
      capturedForm = formTuple[0] as CapturedFilterForm
      return formTuple
    }) as typeof Form.useForm

    try {
      renderPage()

      await waitFor(() => {
        expect(remindRequestCount).toBe(1)
      })

      expect(capturedForm).toBeTruthy()
      const filterForm = requireCapturedForm(capturedForm)

      filterForm.setFieldValue('boxcode', '20DRY')

      await waitFor(() => {
        expect(remindRequestCount).toBe(1)
      })

      fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

      await waitFor(() => {
        expect(remindRequestCount).toBe(2)
      })
    } finally {
      Form.useForm = originalUseForm
    }
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
      expect(screen.getAllByText('NINGBO').length).toBeGreaterThan(0)
    })

    expect(screen.queryByRole('button', { name: '批量作废' })).toBeNull()
    expect(screen.queryByRole('button', { name: '作废' })).toBeNull()
    expect(screen.getByRole('button', { name: '刷新' })).toBeTruthy()
  })

  it('should invalidate selected rows when batch action confirmed', async () => {
    renderPage()

    await screen.findAllByText('NINGBO')

    const table = screen.getByRole('table')
    const checkbox = within(table).getAllByRole('checkbox')[1]
    await act(async () => {
      fireEvent.click(checkbox)
    })

    await waitFor(() => {
      expect(screen.getByText('已选 1 项')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '批量作废' }))
    })
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

  it('should move the batch action into the card header when rows are selected', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getAllByText('NINGBO').length).toBeGreaterThan(0)
      expect(screen.getAllByText('提醒列表').length).toBeGreaterThan(0)
    })

    const table = screen.getByRole('table')
    const checkbox = within(table).getAllByRole('checkbox')[1]
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(screen.getByText('已选 1 项')).toBeTruthy()
      expect(screen.getByRole('button', { name: '批量作废' })).toBeTruthy()
    })

    expect(screen.queryByText('已选择')).toBeNull()
  })

  it('should auto refresh every 30 seconds without changing submitted filters or pagination', async () => {
    const originalUseForm = Form.useForm
    let capturedForm: CapturedFilterForm | null = null
    Form.useForm = ((...args: Parameters<typeof originalUseForm>) => {
      const formTuple = originalUseForm(...args)
      capturedForm = formTuple[0] as CapturedFilterForm
      return formTuple
    }) as typeof Form.useForm

    window.setInterval = ((handler: TimerHandler, timeout?: number) => {
      if (timeout === 30000) {
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

    try {
      const view = renderPage()

      await waitFor(() => {
        expect(screen.getAllByText('NINGBO').length).toBeGreaterThan(0)
      })

      expect(capturedForm).toBeTruthy()
      const filterForm = requireCapturedForm(capturedForm)

      filterForm.setFieldValue('boxcode', '20DRY')
      fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

      await waitFor(() => {
        expect(requestParamsHistory.at(-1)?.page).toBe('1')
        expect(requestParamsHistory.at(-1)?.perPage).toBe('10')
      })

      const pageTwoItem = view.container.querySelector('.ant-pagination-item-2') as HTMLElement | null
      expect(pageTwoItem).toBeTruthy()
      fireEvent.click(pageTwoItem!)

      let submittedPageTwoParams:
        | {
            page: string | null
            perPage: string | null
            boxcode: string | null
          }
        | undefined
      await waitFor(() => {
        submittedPageTwoParams = requestParamsHistory.at(-1)
        expect(submittedPageTwoParams?.page).toBe('2')
        expect(submittedPageTwoParams?.perPage).toBe('10')
      })

      filterForm.setFieldValue('boxcode', '40HDRY')

      expect(intervalCallback).toBeTruthy()
      await act(async () => {
        intervalCallback?.()
      })

      await waitFor(() => {
        expect(requestParamsHistory.at(-1)).toEqual(submittedPageTwoParams)
      })

      await act(async () => {
        view.unmount()
      })

      await waitFor(() => {
        expect(clearedIntervalId).toBe(1)
      })
    } finally {
      Form.useForm = originalUseForm
    }
  })
})
