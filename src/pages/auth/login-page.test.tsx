import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../infrastructure/auth/auth-context'
import { useAuth } from '../../infrastructure/auth/use-auth'
import { LoginPage } from './login-page'

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
  http.post('*/admin/login', async ({ request }) => {
    const payload = (await request.json()) as { username?: string }

    return HttpResponse.json({
      access_token: 'token-1',
      refresh_token: 'refresh-1',
      username: payload.username,
    })
  })
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

const HomeProbe = () => {
  const { isAuthenticated, displayName } = useAuth()
  return (
    <div>
      <span>{isAuthenticated ? 'AUTHED' : 'ANON'}</span>
      <span>{displayName}</span>
    </div>
  )
}

const renderPage = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )

describe('LoginPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('logs in and redirects to home after valid account submit', async () => {
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('用户名'), { target: { value: 'alice' } })
    fireEvent.change(screen.getByPlaceholderText('密码'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: '登 录' }))

    await waitFor(() => {
      expect(screen.getByText('AUTHED')).toBeTruthy()
      expect(screen.getByText('alice')).toBeTruthy()
    })
  })

  it('shows required validation errors when form is empty', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: '登 录' }))

    await waitFor(() => {
      expect(screen.getByText('请输入用户名!')).toBeTruthy()
      expect(screen.getByText('请输入密码！')).toBeTruthy()
    })
  })
})
