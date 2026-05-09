import React, { createContext, useCallback, useMemo, useState, type PropsWithChildren } from 'react'
import { loginByAccount } from './auth-api'
import { authStorage } from './auth-storage'
import type { Role } from '../../shared/types/roles'

const AUTH_STORAGE_KEY = 'codex-admin-auth'

type LoginPayload = {
  username: string
  password: string
}

type AuthContextValue = {
  isAuthenticated: boolean
  role: Role
  displayName: string
  setRole: (role: Role) => void
  setDisplayName: (displayName: string) => void
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
void React

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(AUTH_STORAGE_KEY) === '1' && Boolean(authStorage.getAccessToken())
  })
  const [role, setRole] = useState<Role>('admin')
  const [displayName, setDisplayName] = useState('付小小')

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginByAccount(payload)
    if (!response.access_token) {
      throw new Error('登录响应缺少 access_token，请联系后端检查接口返回。')
    }
    authStorage.setAccessToken(response.access_token)
    if (response.refresh_token) {
      authStorage.setRefreshToken(response.refresh_token)
    }
    setIsAuthenticated(true)
    setRole('admin')
    setDisplayName(payload.username.trim() || '付小小')
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_STORAGE_KEY, '1')
    }
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    authStorage.clearTokens()
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
