import { ConfigProvider, Form } from 'antd'
import React from 'react'
import { act, cleanup, fireEvent, isInaccessible, render, screen, waitFor, within } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AuthContext } from '../../../infrastructure/auth/auth-context'
import { ThemeProvider } from '../../../shared/contexts/theme-context'
import { BookTaskFormFields, BookTaskListPage, CidTypeSelect } from './book-task-list-page'

void React

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

const originalGetComputedStyle = window.getComputedStyle.bind(window)
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: (element: Element) => originalGetComputedStyle(element),
})

if (!window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}

let listRequestCount = 0
let latestPage: string | null = null
let latestPerPage: string | null = null
let requestParamsHistory: Array<{ page: string | null; perPage: string | null; orderId: string | null }> = []
let batchOpenPayloads: string[] = []
let batchPayloads: Record<string, unknown>[] = []
let latestUpdatePayload: Record<string, unknown> | null = null
const buildTaskRows = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    order_id: 100 + index + 1,
    account_name: index === 0 ? 'tester' : `tester-${index + 1}`,
    quantity: 1,
    box_type: '20 Dry Standard',
    origincity_name: '上海',
    destinationcity_name: '纽约',
    destination_service_mode: 'CY',
    order_date: '2026-05-01',
    is_order: 1,
    limit_price: 0,
    is_USA: 1,
    is_plan: 0,
    is_roll: null,
    is_cid: 1,
    cid_type: 0,
    cid_loop_times: 12,
    get_cid_times: 1,
    cid_concurrent: 1,
    cid_sleep: 20,
    nac_loop_times: 2,
    nac_times: 6,
    nac_concurrent: 1,
    nac_sleep: 1,
    limit_day: null,
    route_select: null,
    cid_group: null,
    group_id: 1,
    list_type: 1,
  }))

const server = setupServer(
  http.get('*/startport', () => HttpResponse.json(['上海'])),
  http.get('*/endport', () => HttpResponse.json(['纽约'])),
  http.get('http://124.70.141.127:9111/maersk/book/task', async ({ request }) => {
    listRequestCount += 1
    const url = new URL(request.url)
    const orderId = url.searchParams.get('order_id')
    latestPage = url.searchParams.get('page')
    latestPerPage = url.searchParams.get('per_page')
    requestParamsHistory.push({
      page: latestPage,
      perPage: latestPerPage,
      orderId,
    })
    const page = Number(url.searchParams.get('page') || 1)
    const perPage = Number(url.searchParams.get('per_page') || 10)
    const data = orderId === '999' ? [] : buildTaskRows(101)
    const startIndex = (page - 1) * perPage
    const pagedData = data.slice(startIndex, startIndex + perPage)

    return HttpResponse.json({
      data: pagedData,
      pagination: {
        total: data.length,
        page,
        per_page: perPage,
      },
    })
  }),
  http.post('http://124.70.141.127:9111/maersk/book/task', async ({ request }) => {
    latestUpdatePayload = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ bool_status: true, data: true })
  }),
  http.post('*/maersk/group/task', async ({ request }) => {
    const payload = (await request.json()) as Record<string, unknown> & { ids?: string }
    batchOpenPayloads.push(payload.ids ?? '')
    batchPayloads.push(payload)
    return HttpResponse.json({ bool_status: true, data: true })
  }),
  http.get('*/delay/cid', () => HttpResponse.json({ bool_status: true, data: true })),
  http.get('*/delay/route', () => HttpResponse.json({ bool_status: true, data: true }))
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  listRequestCount = 0
  latestPage = null
  latestPerPage = null
  requestParamsHistory = []
  batchOpenPayloads = []
  batchPayloads = []
  latestUpdatePayload = null
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

const renderPage = (role: 'admin' | 'editor' | 'viewer' = 'admin') =>
  render(
    <AuthContext.Provider
      value={{
        isAuthenticated: true,
        role,
        displayName: 'tester',
        setRole: () => undefined,
        setDisplayName: () => undefined,
        login: async () => Promise.resolve(),
        logout: () => undefined,
      }}
    >
      <ConfigProvider theme={{ token: { motion: false } }}>
        <ThemeProvider>
          <BookTaskListPage />
        </ThemeProvider>
      </ConfigProvider>
      </AuthContext.Provider>
  )

const getRenderedBodyRowsText = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.ant-table-row'))
    .map((row) => row.textContent?.trim() ?? '')
    .filter(Boolean)

const CidTypeSelectHarness = ({ initialValue }: { initialValue?: number }) => {
  const [value, setValue] = React.useState<number | undefined>(initialValue)

  return (
    <ThemeProvider>
      <div>
        <CidTypeSelect value={value} onChange={setValue} />
        <span>{value === undefined ? 'empty' : `current:${value}`}</span>
      </div>
    </ThemeProvider>
  )
}

describe('BookTaskListPage', () => {
  it('should confirm the full scope and close fixed batches without using draft filters', async () => {
    server.use(http.get('http://124.70.141.127:9111/maersk/book/task', ({ request }) => {
      const url = new URL(request.url)
      const page = Number(url.searchParams.get('page') || 1)
      const size = Number(url.searchParams.get('per_page') || 100)
      return HttpResponse.json({ data: buildTaskRows(201).slice((page - 1) * size, size === 100 ? 3 : page * size), pagination: { total: 201, page, per_page: size } })
    }))
    renderPage()
    await screen.findByText('tester')
    fireEvent.change(screen.getByPlaceholderText('请输入对应taskID'), { target: { value: '999' } })
    fireEvent.click(screen.getByText('批量关闭').closest('button')!)
    const confirmation = (await screen.findByText('确认批量关闭')).closest('[role=dialog]') as HTMLElement
    expect(confirmation.textContent).toContain('全部任务，共 201 条')
    expect(batchPayloads).toEqual([])
    fireEvent.click(within(confirmation).getByRole('button', { name: '确认关闭' }))
    await waitFor(() => expect(batchPayloads).toHaveLength(3))
    expect(batchPayloads.map((p) => String(p.ids).split(',').length)).toEqual([100, 100, 1])
    expect(batchPayloads.flatMap((p) => String(p.ids).split(',').map(Number))).toEqual(
      Array.from({ length: 201 }, (_, index) => index + 1)
    )
    expect(batchPayloads.every((p) => p.is_order === 0)).toBe(true)
  }, 15000)

  it('should close only selected ids and send nothing when confirmation is cancelled', async () => {
    server.use(http.get('http://124.70.141.127:9111/maersk/book/task', () =>
      HttpResponse.json({ data: buildTaskRows(2), pagination: { total: 2, page: 1, per_page: 100 } })))
    renderPage()
    await screen.findByText('tester')
    fireEvent.click(screen.getAllByRole('checkbox')[1] as Element)
    fireEvent.click(screen.getByText('批量关闭').closest('button')!)
    const confirmation = (await screen.findByText('确认批量关闭')).closest('[role=dialog]') as HTMLElement
    expect(confirmation.textContent).toContain('已选任务，共 1 条')
    fireEvent.click(within(confirmation).getByRole('button', { name: /取\s*消/ }))
    expect(batchPayloads).toEqual([])
    fireEvent.click(screen.getByText('批量关闭').closest('button')!)
    const second = (await screen.findByText('确认批量关闭')).closest('[role=dialog]') as HTMLElement
    fireEvent.click(within(second).getByRole('button', { name: '确认关闭' }))
    await waitFor(() => expect(batchPayloads).toEqual([{ ids: '1', is_order: 0 }]))
  }, 15000)

  it('should retry only the failed close batch and retain the original ids', async () => {
    const attempts: Record<string, unknown>[] = []
    server.use(
      http.get('http://124.70.141.127:9111/maersk/book/task', ({ request }) => {
        const url = new URL(request.url)
        const size = Number(url.searchParams.get('per_page') || 100)
        return HttpResponse.json({
          data: buildTaskRows(size === 100 ? 2 : 201),
          pagination: { total: 201, page: 1, per_page: size },
        })
      }),
      http.post('*/maersk/group/task', async ({ request }) => {
        attempts.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json({ bool_status: attempts.length !== 2, msg: '测试批次失败', data: true })
      })
    )
    renderPage()
    await screen.findByText('tester')
    fireEvent.click(screen.getByText('批量关闭').closest('button')!)
    const confirmation = (await screen.findByText('确认批量关闭')).closest('[role=dialog]') as HTMLElement
    fireEvent.click(within(confirmation).getByRole('button', { name: '确认关闭' }))
    await screen.findByText('测试批次失败')
    expect(attempts).toHaveLength(2)
    const progress = screen.getByText('批量关闭进度').closest('[role=dialog]') as HTMLElement
    fireEvent.click(within(progress).getByRole('button', { name: /重\s*试/ }))
    await waitFor(() => expect(attempts).toHaveLength(4))
    expect(attempts[2]).toEqual(attempts[1])
    expect(attempts[0].ids).toBe(Array.from({ length: 100 }, (_, i) => i + 1).join(', '))
    expect(attempts[3]).toEqual({ ids: '201', is_order: 0 })
    expect(attempts.every((payload) => payload.is_order === 0)).toBe(true)
  }, 15000)

  it('should refresh changed task states when a partially completed close is ended', async () => {
    let closed = false
    server.use(
      http.get('http://124.70.141.127:9111/maersk/book/task', ({ request }) => {
        const size = Number(new URL(request.url).searchParams.get('per_page') || 100)
        return HttpResponse.json({
          data: buildTaskRows(size === 100 ? 2 : 101).map((row) => ({ ...row, is_order: closed ? 0 : 1 })),
          pagination: { total: 101, page: 1, per_page: size },
        })
      }),
      http.post('*/maersk/group/task', async ({ request }) => {
        batchPayloads.push((await request.json()) as Record<string, unknown>)
        closed = true
        return HttpResponse.json({ bool_status: batchPayloads.length === 1, msg: '测试关闭失败', data: true })
      })
    )
    renderPage()
    await screen.findByText('tester')
    fireEvent.click(screen.getByText('批量关闭').closest('button')!)
    const confirmation = (await screen.findByText('确认批量关闭')).closest('[role=dialog]') as HTMLElement
    fireEvent.click(within(confirmation).getByRole('button', { name: '确认关闭' }))
    await screen.findByText('测试关闭失败')
    const progress = screen.getByText('批量关闭进度').closest('[role=dialog]') as HTMLElement
    fireEvent.click(within(progress).getByRole('button', { name: '结束本次' }))
    await screen.findAllByText('开启', { selector: 'button span' })
    await waitFor(() => expect(isInaccessible(progress)).toBe(true))
    expect(batchPayloads).toHaveLength(2)
  }, 15000)

  it('should discard selected ids when a new query is submitted', async () => {
    server.use(http.get('http://124.70.141.127:9111/maersk/book/task', ({ request }) => {
      const url = new URL(request.url)
      const filtered = url.searchParams.get('order_id') === '999'
      return HttpResponse.json({
        data: filtered ? [{ ...buildTaskRows(1)[0], id: 9, account_name: 'filtered-task' }] : buildTaskRows(2),
        pagination: { total: filtered ? 1 : 2, page: 1, per_page: Number(url.searchParams.get('per_page')) },
      })
    }))
    renderPage()
    await screen.findByText('tester')
    fireEvent.click(screen.getAllByRole('checkbox')[1])
    expect(await screen.findByText('已选 1 项')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('请输入对应taskID'), { target: { value: '999' } })
    fireEvent.click(screen.getByText(/查\s*询/, { selector: 'button span' }).closest('button')!)
    await screen.findByText('filtered-task')
    expect(screen.queryByText('已选 1 项')).toBeNull()
    fireEvent.click(screen.getByText('批量关闭').closest('button')!)
    const confirmation = (await screen.findByText('确认批量关闭')).closest('[role=dialog]') as HTMLElement
    expect(confirmation.textContent).toContain('当前筛选结果，共 1 条')
    fireEvent.click(within(confirmation).getByRole('button', { name: '确认关闭' }))
    await waitFor(() => expect(batchPayloads).toEqual([{ ids: '9', is_order: 0 }]))
  }, 15000)

  it('should identify retained task states as stale when refresh fails after closing', async () => {
    let reads = 0
    server.use(http.get('http://124.70.141.127:9111/maersk/book/task', () => {
      reads += 1
      return reads === 1
        ? HttpResponse.json({ data: buildTaskRows(2), pagination: { total: 2, page: 1, per_page: 100 } })
        : HttpResponse.json({ message: '测试刷新失败' }, { status: 500 })
    }))
    renderPage()
    await screen.findByText('tester')
    fireEvent.click(screen.getAllByRole('checkbox')[1])
    fireEvent.click(screen.getByText('批量关闭').closest('button')!)
    const confirmation = (await screen.findByText('确认批量关闭')).closest('[role=dialog]') as HTMLElement
    fireEvent.click(within(confirmation).getByRole('button', { name: '确认关闭' }))
    await screen.findByText('本次列表未更新')
    expect(screen.getByText('tester')).toBeTruthy()
    expect(batchPayloads).toEqual([{ ids: '1', is_order: 0 }])
  }, 15000)

  it('should submit a list group from the batch edit form for selected tasks', async () => {
    server.use(http.get('http://124.70.141.127:9111/maersk/book/task', () =>
      HttpResponse.json({ data: buildTaskRows(2), pagination: { total: 2, page: 1, per_page: 100 } })))
    const view = renderPage()
    await screen.findByText('tester')
    fireEvent.click(screen.getAllByRole('checkbox')[1])
    const toolbar = within(view.container.querySelector('.list-card-header-center') as HTMLElement)
    fireEvent.click(toolbar.getByRole('button', { name: '批量修改' }))
    const form = within(await screen.findByRole('dialog'))
    fireEvent.change(form.getByLabelText('列表分组'), { target: { value: '2' } })
    fireEvent.click(form.getByRole('button', { name: /确\s*定/ }))
    await waitFor(() => expect(batchPayloads).toEqual([{ ids: '1', list_type: 2 }]))
  }, 15000)

  it('should render task rows when request succeeds', async () => {
    renderPage()

    await screen.findByText('tester')

    expect(screen.getByRole('heading', { name: '订舱管理' })).toBeTruthy()
    expect(screen.getAllByText('tester').length).toBeGreaterThan(0)
    expect(latestPage).toBe('1')
    expect(latestPerPage).toBe('100')
    expect(screen.getByText('批量打开').closest('button')!).toBeTruthy()
    expect(screen.getByText('批量关闭').closest('button')!).toBeTruthy()
    expect(screen.queryByRole('button', { name: '清除路由' })).toBeNull()
    expect(screen.queryByRole('button', { name: '批量修改' })).toBeNull()
    expect(screen.queryByText(/最近刷新时间/)).toBeNull()
    expect(screen.getByText('100 条/页')).toBeTruthy()
    expect(screen.queryByText('常规下单')).toBeNull()

  }, 10000)

  it('should not re-query when changing filters until query button clicked', async () => {
    renderPage()

    await waitFor(() => {
      expect(listRequestCount).toBeGreaterThan(0)
    })
    const initialCount = listRequestCount

    fireEvent.change(screen.getByPlaceholderText('请输入对应taskID'), { target: { value: '999' } })

    await waitFor(() => {
      expect(listRequestCount).toBe(initialCount)
    })

    fireEvent.click(screen.getByText(/查\s*询/, { selector: 'button span' }).closest('button')!)

    await waitFor(() => {
      expect(listRequestCount).toBe(initialCount + 1)
    })

    expect(requestParamsHistory.at(-1)).toEqual({
      page: '1',
      perPage: '100',
      orderId: '999',
    })

  }, 10000)

  it('should hide write actions for viewer role', async () => {
    renderPage('viewer')

    await waitFor(() => {
      expect(screen.getAllByText('tester').length).toBeGreaterThan(0)
    })

    expect(screen.getByText('批量关闭').closest('button')!.getAttribute('disabled')).not.toBeNull()
    expect(screen.queryByText('修改')).toBeNull()

  })

  it('should show error state when list request fails', async () => {
    server.use(
      http.get('http://124.70.141.127:9111/maersk/book/task', () =>
        HttpResponse.json({ message: 'server err' }, { status: 500 })
      )
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('任务列表加载失败')).toBeTruthy()
      expect(screen.getByText('请求失败，请稍后重试。')).toBeTruthy()
    })

  })

  it('should sort text and numeric columns when clicking the column headers', async () => {
    server.use(
      http.get('http://124.70.141.127:9111/maersk/book/task', () =>
        HttpResponse.json({
          data: [
            {
              id: 1,
              order_id: 301,
              account_name: 'charlie',
              quantity: 2,
              box_type: '20 Dry Standard',
              origincity_name: '上海',
              destinationcity_name: '纽约',
              destination_service_mode: 'CY',
              order_date: '2026-05-03',
              is_order: 1,
              limit_price: 200,
              is_USA: 1,
              is_plan: 0,
              is_roll: 0,
              is_cid: 1,
              cid_type: 0,
              cid_loop_times: 12,
              get_cid_times: 1,
              cid_concurrent: 1,
              cid_sleep: 20,
              nac_loop_times: 2,
              nac_times: 6,
              nac_concurrent: 1,
              nac_sleep: 1,
              limit_day: 3,
              route_select: 'R3',
              cid_group: 3,
              group_id: 3,
            },
            {
              id: 2,
              order_id: 201,
              account_name: 'alice',
              quantity: 3,
              box_type: '40 Dry High',
              origincity_name: '宁波',
              destinationcity_name: '汉堡',
              destination_service_mode: 'SD',
              order_date: '2026-05-02',
              is_order: 0,
              limit_price: 100,
              is_USA: 0,
              is_plan: 1,
              is_roll: 1,
              is_cid: 0,
              cid_type: 1,
              cid_loop_times: 8,
              get_cid_times: 2,
              cid_concurrent: 2,
              cid_sleep: 10,
              nac_loop_times: 3,
              nac_times: 4,
              nac_concurrent: 2,
              nac_sleep: 2,
              limit_day: 2,
              route_select: 'R2',
              cid_group: 2,
              group_id: 2,
            },
            {
              id: 3,
              order_id: 101,
              account_name: 'bravo',
              quantity: 1,
              box_type: '45 Dry High',
              origincity_name: '青岛',
              destinationcity_name: '长滩',
              destination_service_mode: 'CY',
              order_date: '2026-05-01',
              is_order: 1,
              limit_price: 300,
              is_USA: 1,
              is_plan: 0,
              is_roll: 0,
              is_cid: 1,
              cid_type: 2,
              cid_loop_times: 10,
              get_cid_times: 3,
              cid_concurrent: 3,
              cid_sleep: 30,
              nac_loop_times: 1,
              nac_times: 8,
              nac_concurrent: 3,
              nac_sleep: 3,
              limit_day: 1,
              route_select: 'R1',
              cid_group: 1,
              group_id: 1,
            },
          ],
          pagination: {
            total: 3,
            page: 1,
            per_page: 10,
          },
        })
      )
    )

    const view = renderPage()

    await screen.findByText('charlie')

    fireEvent.click(screen.getByRole('columnheader', { name: '账户名' }))

    await waitFor(() => {
      const rowTexts = getRenderedBodyRowsText(view.container).slice(0, 3)
      expect(rowTexts[0]).toContain('alice')
      expect(rowTexts[1]).toContain('bravo')
      expect(rowTexts[2]).toContain('charlie')
    })

    cleanup()
    const secondView = renderPage()

    await screen.findByText('charlie')

    fireEvent.click(screen.getByRole('columnheader', { name: '数量' }))

    await waitFor(() => {
      const rowTexts = getRenderedBodyRowsText(secondView.container).slice(0, 3)
      expect(rowTexts[0]).toContain('bravo')
      expect(rowTexts[1]).toContain('charlie')
      expect(rowTexts[2]).toContain('alice')
    })

  })

  it('should batch open all filtered rows in queue when nothing is checked', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getAllByText('tester').length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getByText('批量打开').closest('button')!)

    await waitFor(() => {
      expect(batchOpenPayloads).toHaveLength(2)
    })

    expect(requestParamsHistory.some((item) => item.page === '1' && item.perPage === '100')).toBeTruthy()
    expect(requestParamsHistory.some((item) => item.page === '2' && item.perPage === '100')).toBeTruthy()
    expect(batchOpenPayloads[0]?.split(',').map((item) => item.trim()).filter(Boolean)).toHaveLength(100)
    expect(batchOpenPayloads[1]?.split(',').map((item) => item.trim()).filter(Boolean)).toHaveLength(1)

  }, 10000)

  it('should keep actions in the centered toolbar when writable rows are selected and cleared', async () => {
    server.use(
      http.get('http://124.70.141.127:9111/maersk/book/task', () => {
        listRequestCount += 1
        return HttpResponse.json({
          data: buildTaskRows(2),
          pagination: { total: 2, page: 1, per_page: 100 },
        })
      })
    )
    const view = renderPage()

    await waitFor(() => {
      expect(screen.getAllByText('tester').length).toBeGreaterThan(0)
    })

    const actionNames = ['批量打开', '批量关闭']
    const centerHeader = view.container.querySelector('.list-card-header-center')
    const toolbar = within(centerHeader as HTMLElement)
    const originalButtons = actionNames.map((name) => toolbar.getByRole('button', { name }))
    const initialRequestCount = listRequestCount
    const checkbox = screen.getAllByRole('checkbox')[1] as Element
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(toolbar.getByRole('button', { name: '批量修改' }).closest('.list-card-header-center')).toBe(centerHeader)
      expect(toolbar.getByText('已选 1 项').closest('.list-card-header-center')).toBe(centerHeader)
    })

    actionNames.forEach((name, index) => {
      const button = toolbar.getByRole('button', { name })
      expect(button).toBe(originalButtons[index])
      expect(button.closest('.list-card-header-center')).toBe(centerHeader)
    })
    expect(view.container.querySelector('.list-card-header-left')?.textContent).toBe('')

    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(toolbar.queryByRole('button', { name: '批量修改' })).toBeNull()
      expect(toolbar.queryByText('已选 1 项')).toBeNull()
    })
    actionNames.forEach((name, index) => {
      expect(toolbar.getByRole('button', { name })).toBe(originalButtons[index])
    })
    expect(listRequestCount).toBe(initialRequestCount)

  }, 30000)

  it('should open edit modal with the repacked form fields', async () => {
    renderPage()

    await screen.findByText('tester')

    fireEvent.click(screen.getAllByText('修改')[0]?.closest('button') as Element)

    await screen.findByDisplayValue('tester')
    expect(screen.getAllByText('下单方式').length).toBeGreaterThan(0)
    expect(screen.getAllByText('下单请求次数').length).toBeGreaterThan(0)
    expect(screen.getAllByText('下单并发次数').length).toBeGreaterThan(0)
    expect(screen.getAllByText('下单时间间隔').length).toBeGreaterThan(0)
    expect(screen.getAllByText('账号分组').length).toBeGreaterThan(0)
    expect(screen.getAllByText('分组1').length).toBeGreaterThan(0)
    expect((within(screen.getByRole('dialog')).getByLabelText('列表分组') as HTMLInputElement).value).toBe('1')
    expect(screen.queryByText('cid类型')).toBeNull()
    expect(screen.getAllByText('nac间隔时间').length).toBeGreaterThan(0)

  }, 10000)

  it('should preserve comma-separated order ids when reopening an edited row', async () => {
    server.use(
      http.get('http://124.70.141.127:9111/maersk/book/task', () =>
        HttpResponse.json({
          data: [
            {
              ...buildTaskRows(1)[0],
              order_id: '101,102',
            },
          ],
          pagination: {
            total: 1,
            page: 1,
            per_page: 100,
          },
        })
      )
    )

    renderPage()

    await screen.findByText('tester')

    await act(async () => {
      fireEvent.click(screen.getAllByText('修改')[0]?.closest('button') as Element)
    })

    expect(await screen.findByDisplayValue('101,102')).toBeTruthy()

    fireEvent.change(within(screen.getByRole('dialog')).getByLabelText('列表分组'), { target: { value: '0' } })

    const submitButton = within(screen.getByRole('dialog'))
      .getAllByRole('button')
      .find((button) => ['确 定', '确定', 'OK'].includes(button.textContent?.trim() ?? ''))

    await act(async () => {
      fireEvent.click(submitButton as Element)
    })

    await waitFor(() => {
      expect(latestUpdatePayload).toMatchObject({ order_id: '101,102', list_type: 0 })
    })

  }, 10000)

  it('should open batch modal with repeat-add field intact', async () => {
    render(
      <ThemeProvider>
        <Form layout="vertical">
          <BookTaskFormFields includeRepeatAdd />
        </Form>
      </ThemeProvider>
    )

    expect(screen.getByText('是否重复添加')).toBeTruthy()
  })

  it('should allow adding a custom cid type option', async () => {
    render(<CidTypeSelectHarness initialValue={0} />)

    const comboBox = screen.getByRole('combobox')
    await act(async () => {
      fireEvent.mouseDown(comboBox)
    })

    await waitFor(() => {
      expect(screen.queryAllByText('1').length).toBeGreaterThan(0)
      expect(screen.queryAllByText('2').length).toBeGreaterThan(0)
      expect(screen.queryAllByText('3').length).toBeGreaterThan(0)
      expect(screen.queryAllByText('4').length).toBeGreaterThan(0)
      expect(screen.queryByText('模式下单')).toBeNull()
    })

    const customInput = await screen.findByPlaceholderText('请输入CID类型数字')
    fireEvent.change(customInput, { target: { value: '9' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /添加/ }))
    })

    await waitFor(() => {
      expect(screen.getByText('current:9')).toBeTruthy()
    })

  })

  it('should keep an unknown cid type value visible', async () => {
    render(<CidTypeSelectHarness initialValue={9} />)

    await waitFor(() => {
      expect(screen.getByText('9')).toBeTruthy()
      expect(screen.getByText('current:9')).toBeTruthy()
    })

  })
})
