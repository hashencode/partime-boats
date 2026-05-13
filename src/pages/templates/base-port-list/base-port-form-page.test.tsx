import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../../../infrastructure/auth/auth-context'
import { LIST_REFRESH_EVENT } from '../../../shared/constants/list-refresh-channel'
import { BasePortFormPage } from './base-port-form-page'

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

const channelMessages: unknown[] = []
class BroadcastChannelMock {
  name: string
  onmessage: ((event: MessageEvent) => void) | null = null
  constructor(name: string) {
    this.name = name
  }
  postMessage(data: unknown) {
    channelMessages.push(data)
  }
  close() {}
}
window.BroadcastChannel = BroadcastChannelMock as unknown as typeof BroadcastChannel

let latestCreatePayload: Record<string, unknown> | null = null
const basePortRows = [
  {
    id: 1,
    cityName: 'PORT-1',
    countryCode: 'CN',
    countryGeoId: '156',
    countryName: 'China',
    maerskGeoLocationId: 'M1',
    maerskRkstCode: 'R1',
    UNCode: 'CODE-1',
    shippingline: 'MSK,CMA',
  },
]

const server = setupServer(
  http.get('*/basePort', () => HttpResponse.json(basePortRows)),
  http.get('*/shippingLine', () => HttpResponse.json(['MSK', 'CMA'])),
  http.post('*/addBasePort', async ({ request }) => {
    latestCreatePayload = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ bool_status: true, data: true })
  }),
  http.post('*/basePort', () => HttpResponse.json({ bool_status: true, data: true }))
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  latestCreatePayload = null
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

beforeEach(() => {
  channelMessages.length = 0
})

const renderPage = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthContext.Provider
        value={{
          isAuthenticated: true,
          role: 'admin',
          displayName: 'tester',
          setRole: () => undefined,
          setDisplayName: () => undefined,
          login: async () => Promise.resolve(),
          logout: () => undefined,
        }}
      >
        <Routes>
          <Route path="/get_base_list/form" element={<BasePortFormPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )

describe('BasePortFormPage', () => {
  it('shows route parameter error state when mode is invalid', async () => {
    renderPage('/get_base_list/form?mode=invalid')

    await waitFor(() => {
      expect(screen.getByText('路由参数错误')).toBeTruthy()
      expect(screen.getByText('mode 参数非法，仅支持 add / modify / readonly。')).toBeTruthy()
    })
  })

  it('loads existing detail in modify mode', async () => {
    const { container } = renderPage('/get_base_list/form?mode=modify&id=1')

    await waitFor(() => {
      expect(screen.getByText('基础端口')).toBeTruthy()
    })

    const cityNameInput = container.querySelector('#cityName') as HTMLInputElement
    expect(cityNameInput.value).toBe('PORT-1')
  })

  it('publishes list refresh after successful add submit', async () => {
    const { container } = renderPage('/get_base_list/form?mode=add')

    await waitFor(() => {
      expect(screen.getByText('基础端口')).toBeTruthy()
    })

    fireEvent.change(container.querySelector('#id') as HTMLInputElement, { target: { value: '2' } })
    fireEvent.change(container.querySelector('#cityName') as HTMLInputElement, { target: { value: 'PORT-2' } })
    fireEvent.change(container.querySelector('#countryCode') as HTMLInputElement, { target: { value: 'CN' } })
    fireEvent.change(container.querySelector('#countryGeoId') as HTMLInputElement, { target: { value: '157' } })
    fireEvent.click(screen.getByRole('button', { name: /保\s*存/ }))

    await waitFor(() => {
      expect(latestCreatePayload).toMatchObject({
        id: 2,
        cityName: 'PORT-2',
        countryCode: 'CN',
        countryGeoId: '157',
      })
    })

    expect(
      channelMessages.some(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          (item as { type?: string }).type === LIST_REFRESH_EVENT.REFRESH_LIST
      )
    ).toBe(true)
  })
})
