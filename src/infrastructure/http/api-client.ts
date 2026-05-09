import axios, { AxiosError } from 'axios'

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(normalizeApiError(error))
  }
)
