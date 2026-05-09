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
  data: RemindListItem[]
  total?: number
}

export type RemindInvalidatePayload = {
  ids: string
}

export const fetchRemindList = async (filters: RemindListFilters): Promise<RemindListResponse> => {
  const response = await apiClient.get<RemindListResponse | LegacyEnvelope<RemindListResponse>>('/maersk/remind/list', {
    params: filters,
  })
  return unwrapLegacyEnvelope(response.data)
}

export const invalidateRemindList = async (payload: RemindInvalidatePayload): Promise<void> => {
  await apiClient.post('/maersk/remind/list', payload)
}

export const fetchShippingLineOptions = async (): Promise<string[]> => {
  const response = await apiClient.get<string[] | LegacyEnvelope<string[]>>('shippingLine')
  return unwrapLegacyEnvelope(response.data)
}
