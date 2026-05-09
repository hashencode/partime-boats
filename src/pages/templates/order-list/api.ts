import { apiClient } from '../../../infrastructure/http/api-client'

export type OrderStatus = 0 | 1 | 2 | 3 | 4

export type OrderListItem = {
  id: number
  username?: string
  earlytime?: string
  arrive_time?: string
  origin_location?: string
  destination_location?: string
  box_type?: string
  vessel_name?: string
  booking_number?: string
  price?: number
  is_roll?: string
  capacity_hard_stop_indicator?: number | string
  booktime?: string
  endtime?: string
  update_time?: string
  is_book: OrderStatus
  is_instant_confirmation?: string
  free_day?: string | number
  box_number?: string | number
}

export type OrderListFilters = {
  origin_location?: string
  destination_location?: string
  is_time_out?: string
  is_book?: OrderStatus
  start_time?: string
  end_time?: string
  earlytime?: string
  username?: string
  vessel_name?: string
  list_type?: string
  page?: number
  per_page?: number
}

export type OrderListResponse = {
  data: OrderListItem[]
  total_page?: number
}

export type PortOptionResponse = string[]

export type SubmitOrderResponse = {
  bool_status?: boolean
  data?: string
}

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
    return envelope.data as T
  }
  return raw as T
}

export const fetchOrderList = async (filters: OrderListFilters): Promise<OrderListResponse> => {
  const response = await apiClient.post<OrderListResponse | LegacyEnvelope<OrderListResponse>>('/book/check', filters)
  return unwrapLegacyEnvelope<OrderListResponse>(response.data)
}

export const fetchStartPortOptions = async (location = 1): Promise<PortOptionResponse> => {
  const response = await apiClient.get<PortOptionResponse | LegacyEnvelope<PortOptionResponse>>(
    `/startport?location=${location}`
  )
  return unwrapLegacyEnvelope<PortOptionResponse>(response.data)
}

export const fetchEndPortOptions = async (location = 1): Promise<PortOptionResponse> => {
  const response = await apiClient.get<PortOptionResponse | LegacyEnvelope<PortOptionResponse>>(
    `/endport?location=${location}`
  )
  return unwrapLegacyEnvelope<PortOptionResponse>(response.data)
}

export const submitOrder = async (id: number): Promise<SubmitOrderResponse> => {
  const response = await apiClient.post<SubmitOrderResponse | LegacyEnvelope<SubmitOrderResponse>>('book/order', { id })
  return unwrapLegacyEnvelope<SubmitOrderResponse>(response.data)
}

export const shutOutOrder = async (id: number): Promise<void> => {
  await apiClient.post('/book/out', { id })
}
