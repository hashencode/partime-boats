import { apiClient } from '../http/api-client'

type LoginPayload = {
  username: string
  password: string
}

type LoginResponse = {
  access_token: string
  refresh_token?: string
}

type RefreshResponse = {
  access_token?: string
  data?: {
    access_token?: string
  }
}

type LegacyEnvelope<T> = {
  bool_status?: boolean
  data?: T
  msg?: string
}

const extractTokenPayload = <T extends { access_token?: string; refresh_token?: string }>(
  raw: T | LegacyEnvelope<T>
): T => {
  const envelope = raw as LegacyEnvelope<T>
  if (typeof envelope.bool_status === 'boolean') {
    if (!envelope.bool_status) {
      throw new Error(envelope.msg || '登录失败，请检查账号密码后重试。')
    }
    return (envelope.data ?? {}) as T
  }
  return raw as T
}

export const loginByAccount = async (payload: LoginPayload) => {
  const response = await apiClient.post<LoginResponse | LegacyEnvelope<LoginResponse>>('/admin/login', payload)
  return extractTokenPayload<LoginResponse>(response.data)
}

export const refreshAccessToken = async (refreshToken: string) => {
  const response = await apiClient.post<RefreshResponse | LegacyEnvelope<RefreshResponse>>(
    '/admin/token',
    '',
    { headers: { Authorization: `Bearer ${refreshToken}` } }
  )
  const payload = extractTokenPayload<RefreshResponse>(response.data)
  const token = payload.access_token ?? payload.data?.access_token
  return token ?? null
}
