import dayjs from 'dayjs'
import { apiClient } from '../../../infrastructure/http/api-client'

const BOOK_TASK_API_URL = 'http://124.70.141.127:9111/maersk/book/task'

type LegacyEnvelope<T> = {
  bool_status?: boolean
  msg?: string
  data?: T
}

type LegacyPagination = {
  total?: number
  page?: number
  per_page?: number
}

type LegacyListResponse<T> = {
  data?: T[]
  pagination?: LegacyPagination
}

type LegacyNestedListEnvelope<T> = {
  data?: LegacyListResponse<T>
  pagination?: LegacyPagination
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

const assertArrayResponse = <T>(value: unknown, apiName: string): T[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${apiName} 返回格式异常，请确认开发代理或后端接口是否已正确接通。`)
  }
  return value as T[]
}

const assertObjectResponse = <T extends object>(value: unknown, apiName: string): T => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${apiName} 返回格式异常，请确认开发代理或后端接口是否已正确接通。`)
  }
  return value as T
}

export type BookTaskQueryFilters = {
  order_id?: string
  origincity_name?: string
  destinationcity_name?: string
  box_type?: string
  cid_group?: string
  group_id?: string
  list_type?: string
  page?: number
  per_page?: number
}

export type BookTaskItem = {
  id: number
  order_id?: number | string
  account_name?: string
  quantity?: number | string
  box_type?: string
  origincity_name?: string
  destinationcity_name?: string
  destination_service_mode?: string
  order_date?: string
  is_order?: number
  limit_price?: number | string
  is_USA?: number
  is_plan?: number
  is_roll?: number
  cid?: string
  is_cid?: number | string
  fake_account?: number | string
  update_cid_time?: string
  cid_type?: number | string
  cid_loop_times?: number | string
  get_cid_times?: number | string
  cid_concurrent?: number | string
  cid_sleep?: number | string
  nac_loop_times?: number | string
  nac_times?: number | string
  nac_concurrent?: number | string
  nac_sleep?: number | string
  limit_day?: number | string
  cid_group?: number | string | null
  group_id?: number | string | null
  route_select?: string | null
}

export type BookTaskListResponse = {
  data: BookTaskItem[]
  total: number
  current: number
  size: number
}

export type BookTaskSavePayload = {
  order_id?: number
  account_name?: string
  quantity?: number
  box_type?: string
  origincity_name?: string
  destinationcity_name?: string
  destination_service_mode?: string
  order_date?: string
  is_order?: number
  limit_price?: string
  is_USA?: number
  is_plan?: number
  is_roll?: number
  is_cid?: number | string
  limit_day?: string
  cid_group?: number | null
  group_id?: string
  cid_type?: number
  cid_loop_times?: number
  get_cid_times?: number
  cid_concurrent?: number
  cid_sleep?: string
  nac_loop_times?: string
  nac_times?: string
  nac_concurrent?: string
  nac_sleep?: string
  route_select?: string
}

export type BookTaskBatchPayload = BookTaskSavePayload & {
  ids: string
  is_add_data?: number
}

const toNumber = (value: unknown) => {
  if (value === '' || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const toOptionalString = (value: unknown) => {
  if (value === '' || value === null || value === undefined) return undefined
  return String(value).trim()
}

export const normalizeDateValue = (value: unknown) => {
  if (!value) return undefined
  const parsed = dayjs(value as string | number | Date)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined
}

const parseBookTaskListResponse = (
  raw: unknown,
  fallbackFilters: Pick<BookTaskQueryFilters, 'page' | 'per_page'>
): BookTaskListResponse => {
  const payload = assertObjectResponse<LegacyNestedListEnvelope<BookTaskItem> | LegacyListResponse<BookTaskItem>>(
    raw,
    '任务列表接口'
  )
  const listPayload = payload.data && !Array.isArray(payload.data) ? payload.data : payload
  const items = listPayload.data === undefined ? [] : assertArrayResponse<BookTaskItem>(listPayload.data, '任务列表接口')
  const pagination = listPayload.pagination ?? payload.pagination ?? {}

  return {
    data: items,
    total: pagination.total ?? items.length,
    current: pagination.page ?? fallbackFilters.page ?? 1,
    size: pagination.per_page ?? fallbackFilters.per_page ?? items.length,
  }
}

export const fetchBookTaskList = async (filters: BookTaskQueryFilters): Promise<BookTaskListResponse> => {
  const firstPageResponse = await apiClient.get<LegacyNestedListEnvelope<BookTaskItem> | LegacyListResponse<BookTaskItem>>(
    BOOK_TASK_API_URL,
    {
      params: filters,
    }
  )

  return parseBookTaskListResponse(firstPageResponse.data, filters)
}

export const fetchAllBookTaskIds = async (filters: BookTaskQueryFilters): Promise<number[]> => {
  const requestFilters = {
    ...filters,
    page: 1,
    per_page: 1000,
  }

  const firstPageResponse = await apiClient.get<LegacyNestedListEnvelope<BookTaskItem> | LegacyListResponse<BookTaskItem>>(
    BOOK_TASK_API_URL,
    {
      params: requestFilters,
    }
  )

  const firstPage = parseBookTaskListResponse(firstPageResponse.data, requestFilters)
  const ids = firstPage.data.map((item) => item.id)
  const totalPages = Math.max(1, Math.ceil(firstPage.total / requestFilters.per_page))

  for (let page = 2; page <= totalPages; page += 1) {
    const nextResponse = await apiClient.get<LegacyNestedListEnvelope<BookTaskItem> | LegacyListResponse<BookTaskItem>>(
      BOOK_TASK_API_URL,
      {
        params: {
          ...requestFilters,
          page,
        },
      }
    )
    const nextPage = parseBookTaskListResponse(nextResponse.data, {
      page,
      per_page: requestFilters.per_page,
    })
    ids.push(...nextPage.data.map((item) => item.id))
  }

  return ids
}

export const fetchStartPortOptions = async (location = 0): Promise<string[]> => {
  const response = await apiClient.get<string[] | LegacyEnvelope<string[]>>(`/startport?location=${location}`)
  const payload = unwrapLegacyEnvelope(response.data)
  return assertArrayResponse<string>(payload, '起始港接口')
}

export const fetchEndPortOptions = async (location = 0): Promise<string[]> => {
  const response = await apiClient.get<string[] | LegacyEnvelope<string[]>>(`/endport?location=${location}`)
  const payload = unwrapLegacyEnvelope(response.data)
  return assertArrayResponse<string>(payload, '目的港接口')
}

export const updateBookTask = async (id: number, payload: BookTaskSavePayload): Promise<void> => {
  await apiClient.post(
    BOOK_TASK_API_URL,
    {
      ...payload,
      id,
    }
  )
}

export const batchUpdateBookTask = async (payload: BookTaskBatchPayload): Promise<void> => {
  await apiClient.post('/maersk/group/task', payload)
}

export const closeBookTaskInitialization = async (ids?: string): Promise<void> => {
  await apiClient.get(ids ? `/delay/cid?ids=${ids}` : '/delay/cid')
}

export const clearBookTaskRouter = async (ids?: string): Promise<void> => {
  await apiClient.get(ids ? `/delay/route?ids=${ids}` : '/delay/route')
}

export const buildBookTaskSavePayload = (values: Record<string, unknown>): BookTaskSavePayload => ({
  order_id: toNumber(values.order_id),
  account_name: toOptionalString(values.account_name),
  quantity: toNumber(values.quantity),
  box_type: toOptionalString(values.box_type),
  origincity_name: toOptionalString(values.origincity_name),
  destinationcity_name: toOptionalString(values.destinationcity_name),
  destination_service_mode: toOptionalString(values.destination_service_mode),
  order_date: normalizeDateValue(values.order_date),
  is_order: toNumber(values.is_order),
  limit_price: toOptionalString(values.limit_price),
  is_USA: toNumber(values.is_USA),
  is_plan: toNumber(values.is_plan),
  is_roll: toNumber(values.is_roll),
  is_cid: toNumber(values.is_cid) ?? toOptionalString(values.is_cid),
  limit_day: toOptionalString(values.limit_day),
  cid_group: values.cid_group === null ? null : toNumber(values.cid_group),
  group_id: toOptionalString(values.group_id),
  cid_type: toNumber(values.cid_type),
  cid_loop_times: toNumber(values.cid_loop_times),
  get_cid_times: toNumber(values.get_cid_times),
  cid_concurrent: toNumber(values.cid_concurrent),
  cid_sleep: toOptionalString(values.cid_sleep),
  nac_loop_times: toOptionalString(values.nac_loop_times),
  nac_times: toOptionalString(values.nac_times),
  nac_concurrent: toOptionalString(values.nac_concurrent),
  nac_sleep: toOptionalString(values.nac_sleep),
  route_select: toOptionalString(values.route_select),
})

export const buildBookTaskBatchPayload = (
  values: Record<string, unknown>,
  ids: number[]
): BookTaskBatchPayload => ({
  ...buildBookTaskSavePayload(values),
  is_add_data: toNumber(values.is_add_data),
  ids: ids.join(', '),
})
