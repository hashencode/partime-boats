import React from 'react'
import { Form } from 'antd'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
let latestSingleUpdatePayload: Record<string, unknown> | null = null
let latestCheckShowShippingLine = ''
type CapturedFilterForm = {
  setFieldValue: (name: string, value: unknown) => void
}

const server = setupServer(
  http.get('*/check/show', ({ request }) => {
    latestCheckShowShippingLine = new URL(request.url).searchParams.get('shipping_line') ?? ''
    return HttpResponse.json([
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
  }),
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
  }),
  http.post('*/check/update', async ({ request }) => {
    latestSingleUpdatePayload = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ bool_status: true, data: true })
  })
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  latestToggleIds = ''
  latestToggleStatus = ''
  latestSingleUpdatePayload = null
  latestCheckShowShippingLine = ''
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

    expect(screen.getByRole('button', { name: '修改' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: '订舱' })).toBeNull()
  })

  it('should show all returned rows on first render by default', async () => {
    server.use(
      http.get('*/check/show', () =>
        HttpResponse.json(
          Array.from({ length: 11 }, (_, index) => ({
            id: index + 1,
            origincity_name: `PORT-${index + 1}`,
            destinationcity_name: `DEST-${index + 1}`,
            host: 'MSK',
            box_type: '40',
            delay_time: 30,
            is_run: 0,
            is_roll: 1,
            early_date: '2026-05-01',
            destination_service_mode: 'CY',
            limit_price: 1200 + index,
            port: `A${index + 1}`,
            tips: `tip-${index + 1}`,
          }))
        )
      )
    )

    const { container } = render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('PORT-1')).toBeTruthy()
      expect(screen.getByText('PORT-11')).toBeTruthy()
    })

    expect(screen.getByText('所有数据')).toBeTruthy()
    expect(container.querySelector('.ant-table-virtual')).toBeTruthy()

    fireEvent.mouseDown(screen.getByText('所有数据'))

    await waitFor(() => {
      expect(screen.getByText('10 条/页')).toBeTruthy()
      expect(screen.getByText('20 条/页')).toBeTruthy()
      expect(screen.getByText('50 条/页')).toBeTruthy()
      expect(screen.getByText('100 条/页')).toBeTruthy()
    })
  })

  it('should show error state when list request fails', async () => {
    server.use(http.get('*/check/show', () => HttpResponse.json({ message: 'server err' }, { status: 500 })))

    render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('Maersk列表加载失败')).toBeTruthy()
      expect(screen.getByText('请求失败，请稍后重试。')).toBeTruthy()
    })
  })

  it('should treat null data in legacy envelope as empty state', async () => {
    server.use(
      http.get('*/check/show', () =>
        HttpResponse.json({
          bool_status: true,
          data: null,
        })
      )
    )

    render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('当前筛选条件没有结果，请调整后重试。')).toBeTruthy()
    })
  })

  it('should treat missing data in legacy envelope as empty state', async () => {
    server.use(
      http.get('*/check/show', () =>
        HttpResponse.json({
          bool_status: true,
        })
      )
    )

    render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('当前筛选条件没有结果，请调整后重试。')).toBeTruthy()
    })
  })

  it('should only re-request after clicking query when filter values change', async () => {
    const originalUseForm = Form.useForm
    let capturedForm: CapturedFilterForm | null = null
    Form.useForm = ((...args: Parameters<typeof originalUseForm>) => {
      const formTuple = originalUseForm(...args)
      capturedForm = formTuple[0] as CapturedFilterForm
      return formTuple
    }) as typeof Form.useForm

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

    try {
      render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

      await waitFor(() => {
        expect(requestCount).toBeGreaterThan(0)
      })
      const initialCount = requestCount

      expect(capturedForm).toBeTruthy()
      if (!capturedForm) {
        throw new Error('filter form was not created')
      }
      const filterForm = capturedForm as CapturedFilterForm
      filterForm.setFieldValue('type_name', 2)

      expect(requestCount).toBe(initialCount)
      fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

      await waitFor(() => {
        expect(requestCount).toBe(initialCount + 1)
      })
    } finally {
      Form.useForm = originalUseForm
    }
  }, 10000)

  it('should send shipping_line when querying by shipping line', async () => {
    const originalUseForm = Form.useForm
    let capturedForm: CapturedFilterForm | null = null
    Form.useForm = ((...args: Parameters<typeof originalUseForm>) => {
      const formTuple = originalUseForm(...args)
      capturedForm = formTuple[0] as CapturedFilterForm
      return formTuple
    }) as typeof Form.useForm

    try {
      render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

      await waitFor(() => {
        expect(screen.getByText('NINGBO')).toBeTruthy()
      })

      expect(capturedForm).toBeTruthy()
      if (!capturedForm) {
        throw new Error('filter form was not created')
      }

      const filterForm = capturedForm as CapturedFilterForm
      filterForm.setFieldValue('shipping_line', 'MSK')
      fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

      await waitFor(() => {
        expect(latestCheckShowShippingLine).toBe('MSK')
      })
    } finally {
      Form.useForm = originalUseForm
    }
  })

  it('should toggle all visible rows when nothing is checked', async () => {
    render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('NINGBO')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: '开启所有' }))

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

    await waitFor(() => {
      expect(latestToggleIds).toBe('1')
      expect(latestToggleStatus).toBe('-1')
    })
  })

  it('should toggle a single row status via the status column and submit numeric is_run', async () => {
    let requestCount = 0
    server.use(
      http.get('*/check/show', () => {
        requestCount += 1
        return HttpResponse.json([
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
      })
    )

    render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('NINGBO')).toBeTruthy()
      expect(requestCount).toBeGreaterThan(0)
    })

    const initialCount = requestCount

    fireEvent.click(screen.getByText('开启'))

    await waitFor(() => {
      expect(latestSingleUpdatePayload).toMatchObject({
        id: 1,
        is_run: -1,
        delay_time: 30,
        is_roll: 1,
      })
      expect(requestCount).toBe(initialCount + 1)
    })
  })

  it('should toggle ascending sort state when clicking the status column header', async () => {
    server.use(
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
            tips: 'enabled',
          },
          {
            id: 2,
            origincity_name: 'SHA',
            destinationcity_name: 'HAMBURG',
            host: 'MSK',
            box_type: '20',
            delay_time: 0,
            is_run: -1,
            is_roll: 1,
            early_date: '2026-05-02',
            destination_service_mode: 'SD',
            limit_price: 1000,
            port: 'B1',
            log: 'lineB',
            tips: 'disabled',
          },
        ])
      )
    )

    const { container } = render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('NINGBO')).toBeTruthy()
      expect(screen.getByText('SHA')).toBeTruthy()
    })

    const statusHeader = Array.from(container.querySelectorAll('thead th')).find((cell) =>
      cell.textContent?.includes('是否开启')
    ) as HTMLElement | undefined

    expect(statusHeader).toBeTruthy()
    expect(statusHeader?.getAttribute('aria-sort')).not.toBe('ascending')
    fireEvent.click(statusHeader as HTMLElement)

    await waitFor(() => {
      expect(statusHeader?.getAttribute('aria-sort')).toBe('ascending')
    })
  })

  it('should keep the row unchanged when single status toggle request fails', async () => {
    server.use(
      http.post('*/check/update', () => HttpResponse.json({ message: 'server err' }, { status: 500 }))
    )

    render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('NINGBO')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('开启'))

    await waitFor(() => {
      expect(screen.getByText('server err')).toBeTruthy()
    })
  })

  it('should move batch action into the card header when rows are selected', async () => {
    render(<ThemeProvider><MskQueryListPage /></ThemeProvider>)

    await waitFor(() => {
      expect(screen.getByText('Maersk列表')).toBeTruthy()
    })

    const rowCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(rowCheckboxes[1] as Element)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '批量修改' })).toBeTruthy()
      expect(screen.getByText('已选 1 项')).toBeTruthy()
    })

    expect(screen.getAllByText('Maersk列表')).toHaveLength(1)
    expect(screen.queryByText('已选择')).toBeNull()
  })
})
