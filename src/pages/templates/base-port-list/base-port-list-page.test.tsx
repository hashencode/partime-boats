import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AuthContext } from '../../../infrastructure/auth/auth-context'
import { BasePortListPage } from './base-port-list-page'

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

let createPayload: Record<string, unknown> | null = null
const buildBasePortRows = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    cityName: `PORT-${index + 1}`,
    countryCode: 'CN',
    countryGeoId: String(156 + index),
    countryName: 'China',
    maerskGeoLocationId: `M${index + 1}`,
    maerskRkstCode: `R${index + 1}`,
    UNCode: `CODE-${index + 1}`,
    shippingline: 'MSK,CMA',
  }))

const server = setupServer(
  http.get('*/basePort', () => HttpResponse.json(buildBasePortRows(12))),
  http.get('*/shippingLine', () => HttpResponse.json(['MSK', 'CMA'])),
  http.post('*/addBasePort', async ({ request }) => {
    createPayload = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ bool_status: true, data: true })
  }),
  http.post('*/basePort', () => HttpResponse.json({ bool_status: true, data: true }))
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  createPayload = null
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
      <BasePortListPage />
    </AuthContext.Provider>
  )

describe('BasePortListPage', () => {
  it('should render base port rows when request succeeds', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getAllByText('基础端口列表').length).toBeGreaterThan(0)
      expect(screen.getByText('PORT-1')).toBeTruthy()
      expect(screen.getByRole('button', { name: '新增一行' })).toBeTruthy()
      expect(screen.getByRole('button', { name: '刷新' })).toBeTruthy()
      expect(screen.getByRole('button', { name: '密度' })).toBeTruthy()
      expect(screen.getByRole('button', { name: '列设置' })).toBeTruthy()
    })
  })

  it('should show error state when list request fails', async () => {
    server.use(http.get('*/basePort', () => HttpResponse.json({ message: 'server err' }, { status: 500 })))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('基础端口列表加载失败')).toBeTruthy()
      expect(screen.getByText('server err')).toBeTruthy()
    })
  })

  it('should hide write actions for viewer role', async () => {
    renderPage('viewer')

    await waitFor(() => {
      expect(screen.getByText('PORT-1')).toBeTruthy()
    })

    expect(screen.queryByRole('button', { name: '新增一行' })).toBeNull()
    expect(screen.queryByText('修改')).toBeNull()
    expect(screen.getByRole('button', { name: '刷新' })).toBeTruthy()
  })

  it('should block save when required fields are empty', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '新增一行' })).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: '新增一行' }))
    fireEvent.click(screen.getByText('保存'))

    await waitFor(() => {
      expect(createPayload).toBeNull()
      expect(screen.getAllByText('数据不能为空').length).toBeGreaterThan(0)
    })
  })

  it('should paginate rows on the frontend', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('PORT-1')).toBeTruthy()
      expect(screen.queryByText('PORT-11')).toBeNull()
      expect(screen.getByText('共 12 条数据')).toBeTruthy()
      expect(screen.getAllByText('修改').length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(screen.getByText('PORT-11')).toBeTruthy()
      expect(screen.queryByText('PORT-1')).toBeNull()
    })
  })
})
