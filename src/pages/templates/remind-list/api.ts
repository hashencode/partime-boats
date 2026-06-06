import { apiClient } from '../../../infrastructure/http/api-client'
import { type LegacyEnvelope, toArrayOrEmpty, unwrapLegacyEnvelopeOr } from '../../../infrastructure/http/legacy-envelope'

export type RemindListItem = {
  id: number
  portofloading?: string
  portofdischarge?: string
  boxcode?: string
  departuredate?: string
  oceanfreightamount?: number | string
  total_amount?: number | string
  source?: string
  insert_datetime?: string
  is_use?: number
  ship_info?: string
  price_id?: number | string
}

export type RemindListFilters = {
  origincity_name?: string
  destinationcity_name?: string
  boxcode?: string
  shipping_line?: string
  insert_datetime?: string
  page?: number
  per_page?: number
}

export type RemindListResponse = {
  data?: RemindListItem[] | null
  total?: number
}

export type RemindInvalidatePayload = {
  ids: string
}

export const fetchRemindList = async (filters: RemindListFilters): Promise<RemindListResponse> => {
  const response = await apiClient.get<RemindListResponse | LegacyEnvelope<RemindListResponse>>('/maersk/remind/list', {
    params: filters,
  })
  const payload = unwrapLegacyEnvelopeOr<RemindListResponse>(response.data, { data: [], total: 0 })
  return {
    ...payload,
    data: toArrayOrEmpty(payload.data),
  }
}

export const invalidateRemindList = async (payload: RemindInvalidatePayload): Promise<void> => {
  await apiClient.post('/maersk/remind/list', payload)
}

export const fetchShippingLineOptions = async (): Promise<string[]> => {
  const response = await apiClient.get<string[] | LegacyEnvelope<string[]>>('shippingLine')
  return toArrayOrEmpty(unwrapLegacyEnvelopeOr<string[]>(response.data, []))
}
