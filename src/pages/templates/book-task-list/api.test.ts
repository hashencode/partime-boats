import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { fetchAllBookTaskIds, fetchBookTaskList } from './api'

let requestPages: number[] = []

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
  })
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  requestPages = []
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('book task api', () => {
  it('should request only the current page for list loading', async () => {
    const response = await fetchBookTaskList({ page: 2, per_page: 10 })

    expect(requestPages).toEqual([2])
    expect(response.current).toBe(2)
    expect(response.size).toBe(10)
    expect(response.data).toHaveLength(10)
    expect(response.data[0]?.id).toBe(11)
  })

  it('should aggregate ids only when full scoped ids are needed', async () => {
    const ids = await fetchAllBookTaskIds({ origincity_name: '上海' })

    expect(requestPages).toEqual([1])
    expect(ids).toHaveLength(101)
    expect(ids[0]).toBe(1)
    expect(ids.at(-1)).toBe(101)
  })
})
