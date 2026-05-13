import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AuthContext } from '../../../infrastructure/auth/auth-context'
import { ThemeProvider } from '../../../shared/contexts/theme-context'
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

if (!window.BroadcastChannel) {
  class BroadcastChannelMock {
    name: string
    onmessage: ((event: MessageEvent) => void) | null = null
    constructor(name: string) {
      this.name = name
    }
    postMessage(data: unknown) {
      void data
    }
    close() {}
  }

  window.BroadcastChannel = BroadcastChannelMock as unknown as typeof BroadcastChannel
}

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

const server = setupServer(http.get('*/basePort', () => HttpResponse.json(buildBasePortRows(12))))

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
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
        <BasePortListPage />
      </ThemeProvider>
    </AuthContext.Provider>
  )

describe('BasePortListPage', () => {
  it('renders base port rows without the filter card when request succeeds', async () => {
    renderPage()

    expect(await screen.findByText('PORT-1')).toBeTruthy()
    expect(screen.getAllByText('基础端口列表')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /查\s*询/ })).toBeNull()
    expect(screen.getByRole('button', { name: /新增端口/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: '刷新' })).toBeTruthy()
  })

  it('shows error state when list request fails', async () => {
    server.use(http.get('*/basePort', () => HttpResponse.json({ message: 'server err' }, { status: 500 })))

    renderPage()

    expect(await screen.findByText('基础端口列表加载失败')).toBeTruthy()
    expect(screen.getByText('请求失败，请稍后重试。')).toBeTruthy()
  })

  it('hides write actions for viewer role', async () => {
    renderPage('viewer')

    expect(await screen.findByText('PORT-1')).toBeTruthy()

    expect(screen.queryByRole('button', { name: /新增端口/ })).toBeNull()
    expect(screen.queryByRole('button', { name: '修改' })).toBeNull()
    expect(screen.getAllByRole('button', { name: '查看' }).length).toBeGreaterThan(0)
  })

  it('opens add and modify form pages in a new tab', async () => {
    const openSpy = window.open
    const calls: unknown[][] = []
    window.open = ((...args: unknown[]) => {
      calls.push(args)
      return null
    }) as typeof window.open

    renderPage()

    expect(await screen.findByText('PORT-1')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /新增端口/ }))
    fireEvent.click(screen.getAllByRole('button', { name: '修改' })[0] as HTMLElement)

    expect(calls).toHaveLength(2)
    expect(calls[0]?.[0]).toBe('/get_base_list/form?mode=add')
    expect(calls[1]?.[0]).toBe('/get_base_list/form?mode=modify&id=1')

    window.open = openSpy
  })

  it('paginates rows locally on the frontend', async () => {
    renderPage()

    expect(await screen.findByText('PORT-1')).toBeTruthy()
    expect(screen.queryByText('PORT-11')).toBeNull()
    expect(screen.getByText('共 12 条数据')).toBeTruthy()

    fireEvent.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(screen.getByText('PORT-11')).toBeTruthy()
      expect(screen.queryByText('PORT-1')).toBeNull()
    })
  })
})
