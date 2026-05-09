import axios, { AxiosError } from 'axios'
import { authStorage } from '../auth/auth-storage'

export type ApiErrorCode =
  | 'QUERY_TIMEOUT'
  | 'QUERY_SERVER_ERROR'
  | 'RESOURCE_NOT_FOUND'
  | 'ROUTE_PARAM_INVALID'
  | 'ROUTE_PARAM_MISSING_ID'
  | 'UNKNOWN_ERROR'

export type ApiError = Error & {
  code: ApiErrorCode
  status?: number
}

export const resolveApiBaseUrl = (apiBase?: string): string => {
  return apiBase || '/'
}

export const normalizeApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; errorCode?: ApiErrorCode }>
    const status = axiosError.response?.status
    const message =
      axiosError.response?.data?.message ??
      axiosError.message ??
      '请求失败，请稍后重试。'

    if (axiosError.code === 'ECONNABORTED') {
      return Object.assign(new Error(message), {
        code: 'QUERY_TIMEOUT' as const,
        status,
      })
    }

    if (status === 404) {
      return Object.assign(new Error(message), {
        code: 'RESOURCE_NOT_FOUND' as const,
        status,
      })
    }

    if (status && status >= 500) {
      return Object.assign(new Error(message), {
        code: 'QUERY_SERVER_ERROR' as const,
        status,
      })
    }

    const errorCode = axiosError.response?.data?.errorCode

    if (errorCode) {
      return Object.assign(new Error(message), {
        code: errorCode,
        status,
      })
    }

    return Object.assign(new Error(message), {
      code: 'UNKNOWN_ERROR' as const,
      status,
    })
  }

  return Object.assign(new Error('请求失败，请稍后重试。'), {
    code: 'UNKNOWN_ERROR' as const,
  })
}

export const apiClient = axios.create({
  // Prefer env-driven API base; fallback to same-origin.
  baseURL: resolveApiBaseUrl(import.meta.env.PUBLIC_API_BASE),
  timeout: 5000,
})

apiClient.interceptors.request.use((config) => {
  const accessToken = authStorage.getAccessToken()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let refreshRequest: Promise<string | null> | null = null

type RefreshTokenEnvelope = {
  bool_status?: boolean
  data?: {
    access_token?: string
  }
  access_token?: string
}

const requestTokenRefresh = async () => {
  const refreshToken = authStorage.getRefreshToken()
  if (!refreshToken) return null
  const response = await axios.post<RefreshTokenEnvelope>(
    '/admin/token',
    '',
    {
      baseURL: resolveApiBaseUrl(import.meta.env.PUBLIC_API_BASE),
      headers: { Authorization: `Bearer ${refreshToken}` },
    }
  )
  if (response.data.bool_status === false) {
    return null
  }
  return response.data.access_token ?? response.data.data?.access_token ?? null
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const originalRequest = error?.config as (typeof error.config & { _retry?: boolean }) | undefined

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      refreshRequest ??= requestTokenRefresh().finally(() => {
        refreshRequest = null
      })
      const newToken = await refreshRequest
      if (newToken) {
        authStorage.setAccessToken(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      }
      authStorage.clearTokens()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(normalizeApiError(error))
  }
)
