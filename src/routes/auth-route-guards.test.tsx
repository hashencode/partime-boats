import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from '@rstest/core'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../infrastructure/auth/auth-context'
import { RedirectIfAuthenticated, RequireAuth } from './auth-route-guards'

void React

const renderWithAuth = (isAuthenticated: boolean, entry: string) =>
  render(
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role: 'admin',
        displayName: '管理员',
        setRole: () => undefined,
        setDisplayName: () => undefined,
        login: async () => undefined,
        logout: () => undefined,
      }}
    >
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireAuth>
                <div>PROTECTED_PAGE</div>
              </RequireAuth>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <div>LOGIN_PAGE</div>
              </RedirectIfAuthenticated>
            }
          />
          <Route path="/" element={<div>HOME_PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )

describe('auth-route-guards', () => {
  it('redirects anonymous users to login when visiting protected route', () => {
    window.localStorage.removeItem('auth.access_token')
    renderWithAuth(false, '/protected')

    expect(screen.getByText('LOGIN_PAGE')).toBeTruthy()
  })

  it('redirects authenticated users away from login', () => {
    window.localStorage.setItem('auth.access_token', 'token-1')
    renderWithAuth(true, '/login')

    expect(screen.getByText('HOME_PAGE')).toBeTruthy()
  })
})
