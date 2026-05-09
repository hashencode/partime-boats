import React, { createContext, useCallback, useMemo, useState, type PropsWithChildren } from 'react'
import type { Role } from '../../shared/types/roles'

const AUTH_STORAGE_KEY = 'codex-admin-auth'

type LoginPayload = {
  role?: Role
  displayName?: string
}

type AuthContextValue = {
  isAuthenticated: boolean
  role: Role
  displayName: string
  setRole: (role: Role) => void
  setDisplayName: (displayName: string) => void
  login: (payload?: LoginPayload) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
void React

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(AUTH_STORAGE_KEY) === '1'
  })
  const [role, setRole] = useState<Role>('admin')
  const [displayName, setDisplayName] = useState('付小小')

  const login = useCallback((payload?: LoginPayload) => {
    setIsAuthenticated(true)
    setRole(payload?.role ?? 'admin')
    setDisplayName(payload?.displayName?.trim() ? payload.displayName : '付小小')
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_STORAGE_KEY, '1')
    }
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated, role, displayName, setRole, setDisplayName, login, logout }),
    [displayName, isAuthenticated, role, login, logout]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
