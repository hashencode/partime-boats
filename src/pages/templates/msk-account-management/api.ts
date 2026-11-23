import { apiClient, normalizeApiError, type ApiError } from '../../../infrastructure/http/api-client'
import { MSK_ACCOUNT_CONFIG, type MskAccountKind } from './account-config'

export type MskAccount = {
  _id: string
  account: string
  password?: string | null
  customer_code?: string | null
  account_type?: number
  is_refresh_use?: number | null
  is_use?: number | null
  use_type?: number | null
  update_time?: string | null
}

export type MskAccountFilters = {
  account_type?: number
  account?: string
  is_refresh_use?: number
  is_use?: number
  use_type?: number
  page?: number
  per_page?: number
}

export type MskAccountListResponse = {
  data: MskAccount[]
  total: number
  current: number
  size: number
  lastPage: number
  accountType: number
  partial: boolean
  partialMessage?: string
}

export type MskAccountChanges = Partial<Pick<MskAccount, 'account' | 'password' | 'is_use' | 'is_refresh_use' | 'use_type'>>
export type MskAccountCreate = MskAccountChanges & {
  account: string
  password: string
  customer_code?: string
  account_type?: number
}
export type MskAccountUpdateResult = { _id?: string; matched: number; modified: number }
export type MskAccountImportResult = { total: number; inserted: number; matched: number; modified: number }
type AccountLocator = { original_account?: string; account_type?: number }
type AccountEnvelope = { data?: unknown; error_code?: unknown; message?: unknown; bool_status?: boolean; msg?: string }
type AccountPagination = { total: number; page?: number; total_pages?: number; current_page?: number; last_page?: number; per_page?: number }
type AccountListPayload = { data: unknown[]; pagination: AccountPagination }

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const invalidResponse = () => new Error('账号接口返回不完整，请重新加载。')
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0

const decodeResult = (raw: unknown): Record<string, unknown> => {
  if (!isObject(raw)) throw invalidResponse()
  const envelope = raw as AccountEnvelope
  if (Object.hasOwn(raw, 'error_code') || envelope.bool_status === false) {
    throw new Error(typeof envelope.message === 'string' ? envelope.message : envelope.msg || '账号操作失败，请重试。')
  }
  return isObject(envelope.data) ? envelope.data : raw
}

export const toAccountApiError = (error: unknown): ApiError => {
  if (error instanceof Error && 'code' in error) return error as ApiError
  if (error instanceof Error) return Object.assign(new Error(error.message), { code: 'UNKNOWN_ERROR' as const })
  return normalizeApiError(error)
}

export const fetchMskAccountList = async (kind: MskAccountKind, filters: MskAccountFilters): Promise<MskAccountListResponse> => {
  const response = await apiClient.get<unknown>(MSK_ACCOUNT_CONFIG[kind].listEndpoint, {
    params: filters,
    ...(filters.per_page === 500 || filters.per_page === 1000 ? { timeout: 20000 } : {}),
  })
  const payload = decodeResult(response.data)
  if (!Array.isArray(payload.data) || !isObject(payload.pagination) || !isCount(payload.pagination.total)) throw invalidResponse()
  const { data, pagination } = payload as AccountListPayload
  const current = pagination.page ?? pagination.current_page ?? filters.page ?? 1
  const size = pagination.per_page ?? filters.per_page ?? 100
  const lastPage = pagination.total_pages ?? pagination.last_page ?? Math.max(1, Math.ceil(pagination.total / size))
  if (!isCount(current) || current < 1 || !isCount(size) || size < 1 || !isCount(lastPage)) throw invalidResponse()
  const rows = data.filter((row): row is MskAccount => isObject(row) && typeof row._id === 'string' && row._id.length > 0 && typeof row.account === 'string')
  const partial = rows.length !== data.length || (data.length === 0 && pagination.total > 0 && current <= lastPage)
  return {
    data: rows,
    total: pagination.total,
    current,
    size,
    lastPage: Math.max(1, lastPage),
    accountType: filters.account_type ?? 1,
    partial,
    ...(partial ? { partialMessage: '部分账号信息缺失，请重新加载完整数据。' } : {}),
  }
}

export const fetchMskAccountDetail = async (kind: MskAccountKind, id: string, locator: AccountLocator = {}): Promise<MskAccount> => {
  if (!id) throw new Error('缺少账号标识，请返回列表重新打开。')
  const seen = new Set<string>()
  for (let page = 1; ; page += 1) {
    const result = await fetchMskAccountList(kind, { account_type: locator.account_type ?? 1, account: locator.original_account || undefined, page, per_page: 100 })
    if (result.partial || result.current !== page) throw invalidResponse()
    const row = result.data.find((item) => item._id === id)
    if (row) return { ...row, account_type: locator.account_type ?? 1 }
    const signature = result.data.map((item) => item._id).join(',')
    if (seen.has(signature)) throw new Error('账号分页未更新，请返回列表重新查询。')
    seen.add(signature)
    if (page >= result.lastPage) break
  }
  throw new Error('账号已不存在，或账号类型不匹配，请返回列表重新查询。')
}

export const createMskAccount = async (payload: MskAccountCreate): Promise<{ _id: string }> => {
  if (!payload.account.trim() || !payload.password) throw new Error('请输入账号和密码。')
  const response = await apiClient.post<unknown>('/maersk/account', { ...payload, account: payload.account.trim() })
  const result = decodeResult(response.data)
  if (typeof result._id !== 'string' || !result._id) throw invalidResponse()
  return { _id: result._id }
}

export const updateMskAccount = async (kind: MskAccountKind, id: string, changes: MskAccountChanges): Promise<MskAccountUpdateResult> => {
  if (!id) throw new Error('缺少账号标识，请返回列表重新打开。')
  const payload: MskAccountChanges & { _id: string } = { _id: id }
  for (const key of ['account', 'password', 'is_use', 'is_refresh_use', 'use_type'] as const) {
    const value = changes[key]
    if (value === undefined || value === null || (key === 'password' && value === '')) continue
    Object.assign(payload, { [key]: key === 'account' && typeof value === 'string' ? value.trim() : value })
  }
  if (Object.keys(payload).length === 1) return { _id: id, matched: 1, modified: 0 }
  const response = await apiClient.post<unknown>(MSK_ACCOUNT_CONFIG[kind].listEndpoint, payload)
  const result = decodeResult(response.data)
  if (!isCount(result.matched) || !isCount(result.modified)) throw invalidResponse()
  if (!result.matched) throw new Error('账号已不存在，请返回列表重新查询。')
  if (result._id !== undefined && result._id !== id) throw invalidResponse()
  return result as MskAccountUpdateResult
}

export const deleteMskAccount = async (id: string): Promise<{ deleted: number }> => {
  if (!id) throw new Error('缺少账号标识，请重新查询。')
  const response = await apiClient.delete<unknown>(`/maersk/account/${encodeURIComponent(id)}`)
  const result = decodeResult(response.data)
  if (!isCount(result.deleted)) throw invalidResponse()
  if (result._id !== undefined && result._id !== id) throw invalidResponse()
  return { deleted: result.deleted }
}

export const importMskAccounts = async (kind: MskAccountKind, file: File): Promise<MskAccountImportResult> => {
  if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('请选择 .xlsx 文件。')
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post<unknown>(MSK_ACCOUNT_CONFIG[kind].importEndpoint, formData)
  const result = decodeResult(response.data)
  if (!['total', 'inserted', 'matched', 'modified'].every((key) => isCount(result[key]))) throw invalidResponse()
  return { total: result.total, inserted: result.inserted, matched: result.matched, modified: result.modified } as MskAccountImportResult
}
