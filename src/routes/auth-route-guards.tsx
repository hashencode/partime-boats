import React from 'react'
import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../infrastructure/auth/use-auth'
import { authStorage } from '../infrastructure/auth/auth-storage'
void React

export const RequireAuth = ({ children }: PropsWithChildren) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const hasToken = Boolean(authStorage.getAccessToken())

  if (!isAuthenticated || !hasToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export const RedirectIfAuthenticated = ({ children }: PropsWithChildren) => {
  const { isAuthenticated } = useAuth()
  const hasToken = Boolean(authStorage.getAccessToken())

  if (isAuthenticated && hasToken) {
    return <Navigate to="/" replace />
  }

  return children
}
