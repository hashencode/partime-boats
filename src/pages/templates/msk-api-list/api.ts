import { apiClient } from '../../../infrastructure/http/api-client'
import {
  type LegacyEnvelope,
  toArrayOrEmpty,
  unwrapLegacyEnvelope,
  unwrapLegacyEnvelopeOr,
} from '../../../infrastructure/http/legacy-envelope'

export type MskApiQueryItem = {
  id: number
  tips?: string
  origincity_name?: string
  destinationcity_name?: string
  host?: string | null
  box_type?: string
  delay_time?: number | string
  is_run?: number | string
  is_roll?: number | string
  early_date?: string
  destination_service_mode?: string
  limit_price?: number
  port?: string | number
  log?: string
}

export type MskApiFilters = {
  origincity_name?: string
  destinationcity_name?: string
  host?: string
}

export type ShippingLineMap = Record<string, string>

export type AccountNumPayload = string | string[]

const normalizeAccountNumText = (value: string): string => {
  return value.replace('同丰', ', ').replace('同丰', '')
}

const normalizeAccountNumPayload = (payload: AccountNumPayload): AccountNumPayload => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeAccountNumText)
  }
  return normalizeAccountNumText(payload)
}

export type BatchUpdatePayload = {
  ids: string
  origincity_name?: string
  destinationcity_name?: string
  box_type?: string
  delay_time?: number
  early_date?: string
  destination_service_mode?: string
  limit_price?: number
  is_run?: number
  is_roll?: number
}

export type UpdateSinglePayload = MskApiQueryItem

export const fetchShippingLineMap = async (): Promise<ShippingLineMap> => {
  const response = await apiClient.get<ShippingLineMap | LegacyEnvelope<ShippingLineMap>>('query/list')
  return unwrapLegacyEnvelope(response.data)
}

export const fetchMskApiList = async (filters: MskApiFilters): Promise<MskApiQueryItem[]> => {
  const response = await apiClient.get<MskApiQueryItem[] | LegacyEnvelope<MskApiQueryItem[]>>('/check/show?type_name=4', {
    params: filters,
  })
  return toArrayOrEmpty(unwrapLegacyEnvelopeOr<MskApiQueryItem[]>(response.data, []))
}

export const fetchShippingLineOptions = async (): Promise<string[]> => {
  const response = await apiClient.get<string[] | LegacyEnvelope<string[]>>('shippingLine')
  return toArrayOrEmpty(unwrapLegacyEnvelopeOr<string[]>(response.data, []))
}

export const fetchStartPortOptions = async (location = 1): Promise<string[]> => {
  const response = await apiClient.get<string[] | LegacyEnvelope<string[]>>(`/startport?location=${location}`)
  return toArrayOrEmpty(unwrapLegacyEnvelopeOr<string[]>(response.data, []))
}

export const fetchEndPortOptions = async (location = 1): Promise<string[]> => {
  const response = await apiClient.get<string[] | LegacyEnvelope<string[]>>(`/endport?location=${location}`)
  return toArrayOrEmpty(unwrapLegacyEnvelopeOr<string[]>(response.data, []))
}

export const fetchAccountNum = async (): Promise<AccountNumPayload> => {
  const response = await apiClient.get<AccountNumPayload | LegacyEnvelope<AccountNumPayload>>('/account/num')
  return normalizeAccountNumPayload(unwrapLegacyEnvelope(response.data))
}

export const updateMskApiItem = async (payload: UpdateSinglePayload): Promise<void> => {
  await apiClient.post('/check/update', payload)
}

export const batchUpdateMskApiItem = async (payload: BatchUpdatePayload): Promise<void> => {
  await apiClient.post('/check/update/group', payload)
}

export const clear429Account = async (): Promise<void> => {
  await apiClient.get('/book/clear')
}

export const toggleAllByEarlyDate = async (earlyDate: 0 | -1, ids: string): Promise<void> => {
  await apiClient.get(`/check/auto?early_date=${earlyDate}&ids=${ids}`)
}
