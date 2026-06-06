import { apiClient } from '../../../infrastructure/http/api-client'
import { type LegacyEnvelope, toArrayOrEmpty, unwrapLegacyEnvelopeOr } from '../../../infrastructure/http/legacy-envelope'

export type BasePortItem = {
  id: number
  cityName: string
  countryCode: string
  countryGeoId: string
  countryName?: string
  maerskGeoLocationId?: string
  maerskRkstCode?: string
  UNCode?: string | null
  shippingline?: string | null
}

export type BasePortSavePayload = {
  id: number
  cityName: string
  countryCode: string
  countryGeoId: string
  countryName?: string
  maerskGeoLocationId?: string
  maerskRkstCode?: string
  UNCode?: string
  shippingline?: string | null
}

export const fetchBasePortList = async (): Promise<BasePortItem[]> => {
  const response = await apiClient.get<BasePortItem[] | LegacyEnvelope<BasePortItem[]>>('/basePort')
  return toArrayOrEmpty(unwrapLegacyEnvelopeOr<BasePortItem[]>(response.data, []))
}

export const fetchBasePortDetail = async (resourceKey: string): Promise<BasePortItem> => {
  const rows = await fetchBasePortList()
  const matched = rows.find((item) => String(item.id) === resourceKey)

  if (!matched) {
    throw new Error('未找到对应的基础端口记录。')
  }

  return matched
}

export const fetchShippingLineOptions = async (): Promise<string[]> => {
  const response = await apiClient.get<string[] | LegacyEnvelope<string[]>>('/shippingLine')
  return toArrayOrEmpty(unwrapLegacyEnvelopeOr<string[]>(response.data, []))
}

export const createBasePort = async (payload: BasePortSavePayload): Promise<void> => {
  await apiClient.post('/addBasePort', payload)
}

export const updateBasePort = async (payload: BasePortSavePayload): Promise<void> => {
  await apiClient.post('/basePort', payload)
}
