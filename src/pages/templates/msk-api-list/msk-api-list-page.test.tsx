import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MskApiListPage } from './msk-api-list-page'

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
  http.get('*/check/show', () =>
    HttpResponse.json([
      {
        id: 1,
        tips: 'yufan',
        origincity_name: 'NINGBO',
        destinationcity_name: 'GDANSK',
        host: '欧洲',
        box_type: '40',
        delay_time: 30,
        is_run: 0,
        is_roll: 1,
        early_date: '2026-05-01',
        destination_service_mode: 'CY',
        limit_price: 1200,
        port: 'A1',
        log: 'lineA',
      },
    ])
  ),
  http.get('*/query/list', () => HttpResponse.json({ lineA: 'https://example.com/log' })),
  http.get('*/shippingLine', () => HttpResponse.json(['欧洲', '东南亚'])),
  http.get('*/startport', () => HttpResponse.json(['NINGBO', 'SHA'])),
  http.get('*/endport', () => HttpResponse.json(['GDANSK', 'HAMBURG'])),
  http.get('*/account/num', () => HttpResponse.json('账号数: 12')),
  http.get('*/book/clear', () => HttpResponse.json({ bool_status: true, data: true })),
  http.get('*/check/auto', () => HttpResponse.json({ bool_status: true, data: true }))
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

describe('MskApiListPage', () => {
  it('should render list rows when request succeeds', async () => {
    render(<MskApiListPage />)

    await waitFor(() => {
      expect(screen.getByText('NINGBO')).toBeTruthy()
      expect(screen.getByText('账号数: 12')).toBeTruthy()
    })
  })

  it('should show error state when list request fails', async () => {
    server.use(http.get('*/check/show', () => HttpResponse.json({ message: 'server err' }, { status: 500 })))

    render(<MskApiListPage />)

    await waitFor(() => {
      expect(screen.getByText('MSK API列表加载失败')).toBeTruthy()
      expect(screen.getByText('请求失败，请稍后重试。')).toBeTruthy()
    })
  })

  it('should not re-request before submit when filter changes', async () => {
    let requestCount = 0
    server.use(
      http.get('*/check/show', () => {
        requestCount += 1
        return HttpResponse.json([
          {
            id: 1,
            tips: 'yufan',
            origincity_name: 'NINGBO',
            destinationcity_name: 'GDANSK',
          },
        ])
      })
    )

    render(<MskApiListPage />)

    await waitFor(() => {
      expect(requestCount).toBeGreaterThan(0)
    })
    const initialCount = requestCount

    const comboBoxes = screen.getAllByRole('combobox')
    fireEvent.change(comboBoxes[0] as Element, { target: { value: 'SHA' } })

    await waitFor(() => {
      expect(requestCount).toBe(initialCount)
    })

    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

    await waitFor(() => {
      expect(requestCount).toBe(initialCount + 1)
    })
  })
})
