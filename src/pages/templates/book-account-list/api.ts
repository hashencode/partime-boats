import { apiClient } from '../../../infrastructure/http/api-client'

type LegacyEnvelope<T> = {
  bool_status?: boolean
  msg?: string
  data?: T
}

const unwrapLegacyEnvelope = <T>(raw: T | LegacyEnvelope<T>): T => {
  const envelope = raw as LegacyEnvelope<T>
  if (typeof envelope.bool_status === 'boolean') {
    if (!envelope.bool_status) {
      throw new Error(envelope.msg || '请求失败，请稍后重试。')
    }
    if (envelope.data === undefined) {
      throw new Error('接口返回缺少 data 字段。')
    }
    return envelope.data
  }
  return raw as T
}

export type BookAccountItem = {
  account?: string | null
  customer_code?: string | null
  is_refresh_use?: number | string | null
  update_time?: string | null
}

export type BookAccountListFilters = {
  account_type?: string
  page?: number
  per_page?: number
}

export type BookAccountListResponse = {
  data: BookAccountItem[]
  pagination?: {
    total?: number
  }
}

export const fetchBookAccountList = async (filters: BookAccountListFilters): Promise<BookAccountListResponse> => {
  const response = await apiClient.get<BookAccountListResponse | LegacyEnvelope<BookAccountListResponse>>(
    'maersk/book/list',
    {
      params: filters,
    }
  )

  return unwrapLegacyEnvelope(response.data)
}
