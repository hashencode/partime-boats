import { apiClient } from '../../../infrastructure/http/api-client'
import {
  type LegacyEnvelope,
  toArrayOrEmpty,
  unwrapLegacyEnvelope,
  unwrapLegacyEnvelopeOr,
} from '../../../infrastructure/http/legacy-envelope'

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
  price?: number | string
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
  data?: OrderListItem[] | null
  total_page?: number
}

export type PortOptionResponse = string[]

export type SubmitOrderResponse = {
  bool_status?: boolean
  data?: string
}

export const fetchOrderList = async (filters: OrderListFilters): Promise<OrderListResponse> => {
  const response = await apiClient.post<OrderListResponse | LegacyEnvelope<OrderListResponse>>('/book/check', filters)
  const payload = unwrapLegacyEnvelopeOr<OrderListResponse>(response.data, { data: [], total_page: 0 })
  return {
    ...payload,
    data: toArrayOrEmpty(payload.data),
  }
}

export const fetchStartPortOptions = async (location = 1): Promise<PortOptionResponse> => {
  const response = await apiClient.get<PortOptionResponse | LegacyEnvelope<PortOptionResponse>>(
    `/startport?location=${location}`
  )
  return toArrayOrEmpty(unwrapLegacyEnvelopeOr<PortOptionResponse>(response.data, []))
}

export const fetchEndPortOptions = async (location = 1): Promise<PortOptionResponse> => {
  const response = await apiClient.get<PortOptionResponse | LegacyEnvelope<PortOptionResponse>>(
    `/endport?location=${location}`
  )
  return toArrayOrEmpty(unwrapLegacyEnvelopeOr<PortOptionResponse>(response.data, []))
}

export const submitOrder = async (id: number): Promise<SubmitOrderResponse> => {
  const response = await apiClient.post<SubmitOrderResponse | LegacyEnvelope<SubmitOrderResponse>>('book/order', { id })
  return unwrapLegacyEnvelope<SubmitOrderResponse>(response.data)
}

export const shutOutOrder = async (id: number): Promise<void> => {
  await apiClient.post('/book/out', { id })
}
