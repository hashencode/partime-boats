import { apiClient } from '../../../infrastructure/http/api-client'
import { type LegacyEnvelope, toArrayOrEmpty, unwrapLegacyEnvelopeOr } from '../../../infrastructure/http/legacy-envelope'

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
  data?: BookAccountItem[] | null
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

  const payload = unwrapLegacyEnvelopeOr<BookAccountListResponse>(response.data, { data: [], pagination: { total: 0 } })
  return {
    ...payload,
    data: toArrayOrEmpty(payload.data),
  }
}
