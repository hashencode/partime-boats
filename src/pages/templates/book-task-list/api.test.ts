import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { apiClient } from '../../../infrastructure/http/api-client'
import {
  buildBookTaskBatchPayload,
  buildBookTaskSavePayload,
  buildBookTaskUpdatePayload,
  batchUpdateBookTask,
  fetchAllBookTaskIds,
  fetchBookTaskList,
  fetchStartPortOptions,
  updateBookTask,
} from './api'

let requestPages: number[] = []
let latestStartPortRequestUrl: string | null = null
const originalBaseUrl = apiClient.defaults.baseURL

const buildTaskRows = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    order_id: 100 + index + 1,
    account_name: `tester-${index + 1}`,
  }))

const server = setupServer(
  http.get('http://124.70.141.127:9111/maersk/book/task', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || 1)
    const perPage = Number(url.searchParams.get('per_page') || 10)
    const allRows = buildTaskRows(101)
    requestPages.push(page)

    return HttpResponse.json({
      data: allRows.slice((page - 1) * perPage, page * perPage),
      pagination: {
        total: allRows.length,
        page,
        per_page: perPage,
      },
    })
  }),
  http.get('http://124.70.141.127:9111/startport', ({ request }) => {
    latestStartPortRequestUrl = request.url
    return HttpResponse.json(['上海'])
  })
)

beforeAll(() => {
  apiClient.defaults.baseURL = 'http://124.70.141.127:9111'
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  requestPages = []
  latestStartPortRequestUrl = null
  server.resetHandlers()
})

afterAll(() => {
  apiClient.defaults.baseURL = originalBaseUrl
  server.close()
})

describe('book task api', () => {
  it('should submit numeric list groups without clearing an omitted batch value', () => {
    expect(buildBookTaskUpdatePayload({ list_type: '2' }).list_type).toBe(2)
    expect(buildBookTaskBatchPayload({ list_type: 0 }, [1, 2])).toMatchObject({ ids: '1, 2', list_type: 0 })
    expect(JSON.parse(JSON.stringify(buildBookTaskBatchPayload({ list_type: '' }, [1])))).not.toHaveProperty('list_type')
  })

  it('should send a close request to the existing batch endpoint', async () => {
    let body: unknown
    server.use(http.post('http://124.70.141.127:9111/maersk/group/task', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ bool_status: true })
    }))
    await batchUpdateBookTask({ ids: '1, 2', is_order: 0 })
    expect(body).toEqual({ ids: '1, 2', is_order: 0 })
  })

  it('should reject business failures even when the server responds with HTTP 200', async () => {
    server.use(http.post('http://124.70.141.127:9111/maersk/book/task', () =>
      HttpResponse.json({ bool_status: false, msg: '修改失败' })))
    await expect(updateBookTask(1, { list_type: 2 })).rejects.toThrow('修改失败')
  })

  it('should not confirm a write with an unknown success response', async () => {
    server.use(http.post('http://124.70.141.127:9111/maersk/group/task', () => HttpResponse.json({})))
    await expect(batchUpdateBookTask({ ids: '1', is_order: 0 })).rejects.toThrow('无法确认修改结果')
  })

  it('should collect every id using the page size actually returned by the server', async () => {
    server.use(http.get('http://124.70.141.127:9111/maersk/book/task', ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get('page'))
      requestPages.push(page)
      return HttpResponse.json({
        data: buildTaskRows(25).slice((page - 1) * 20, page * 20),
        pagination: { total: 25, page, per_page: 20 },
      })
    }))
    expect(await fetchAllBookTaskIds({})).toHaveLength(25)
    expect(requestPages).toEqual([1, 2])
  })

  it('should reject an incomplete target set before any batch can run', async () => {
    server.use(http.get('http://124.70.141.127:9111/maersk/book/task', ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get('page'))
      return HttpResponse.json({ data: page === 1 ? [{ id: 1 }] : [], pagination: { total: 2, page, per_page: 1 } })
    }))
    await expect(fetchAllBookTaskIds({})).rejects.toThrow('未完整加载')
  })
  it('should request only the current page for list loading', async () => {
    const response = await fetchBookTaskList({ page: 2, per_page: 10 })

    expect(requestPages).toEqual([2])
    expect(response.current).toBe(2)
    expect(response.size).toBe(10)
    expect(response.data).toHaveLength(10)
    expect(response.data[0]?.id).toBe(11)
  })

  it('should treat null data as an empty task list', async () => {
    server.use(
      http.get('http://124.70.141.127:9111/maersk/book/task', () =>
        HttpResponse.json({
          data: null,
          pagination: {
            total: 0,
            page: 1,
            per_page: 10,
          },
        })
      )
    )

    const response = await fetchBookTaskList({ page: 1, per_page: 10 })

    expect(response.data).toEqual([])
    expect(response.total).toBe(0)
  })

  it('should aggregate ids only when full scoped ids are needed', async () => {
    const ids = await fetchAllBookTaskIds({ origincity_name: '上海' })

    expect(requestPages).toEqual([1])
    expect(ids).toHaveLength(101)
    expect(ids[0]).toBe(1)
    expect(ids.at(-1)).toBe(101)
  })

  it('should use the configured api host for start port metadata', async () => {
    const options = await fetchStartPortOptions()

    expect(options).toEqual(['上海'])
    expect(latestStartPortRequestUrl).toBe('http://124.70.141.127:9111/startport?location=0')
  })

  it('should convert a custom cid type string into a numeric payload', () => {
    const payload = buildBookTaskSavePayload({
      cid_type: '9',
    })

    expect(payload.cid_type).toBe(9)
  })

  it('should ignore an invalid cid type value when building the payload', () => {
    const payload = buildBookTaskSavePayload({
      cid_type: 'abc',
    })

    expect(payload.cid_type).toBeUndefined()
  })

  it('should preserve comma-separated order ids for batch updates', () => {
    const payload = buildBookTaskBatchPayload(
      {
        order_id: '101,102',
      },
      [1, 2]
    )

    expect(payload.order_id).toBe('101,102')
    expect(payload.ids).toBe('1, 2')
  })

  it('should keep the legacy update payload shape for nullable fields', () => {
    const payload = buildBookTaskUpdatePayload({
      order_id: 12210,
      quantity: 1,
      destination_service_mode: 'CY',
      limit_price: '0',
      is_USA: 1,
      is_order: 0,
      is_plan: 0,
      is_cid: 0,
      cid_type: 0,
      cid_loop_times: 12,
      get_cid_times: 1,
      cid_concurrent: 1,
      cid_sleep: '20',
      nac_loop_times: '2',
      nac_times: '6',
      nac_concurrent: '1',
      nac_sleep: '1',
      route_select: undefined,
      is_roll: undefined,
      limit_day: undefined,
      cid_group: undefined,
      group_id: '1',
    })

    expect(payload).toMatchObject({
      order_id: '12210',
      destination_service_mode: 'CY',
      limit_price: 0,
      route_select: null,
      is_roll: null,
      limit_day: null,
      cid_group: null,
      group_id: 1,
      cid_sleep: 20,
      nac_loop_times: 2,
      nac_times: 6,
      nac_concurrent: 1,
      nac_sleep: 1,
    })
  })
})
