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
  return unwrapLegacyEnvelope(response.data)
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
  return unwrapLegacyEnvelope(response.data)
}

export const createBasePort = async (payload: BasePortSavePayload): Promise<void> => {
  await apiClient.post('/addBasePort', payload)
}

export const updateBasePort = async (payload: BasePortSavePayload): Promise<void> => {
  await apiClient.post('/basePort', payload)
}
