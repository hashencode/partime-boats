import { Form } from 'antd'
import React from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
      <ThemeProvider>
        <BookTaskListPage />
      </ThemeProvider>
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
  it('should render task rows when request succeeds', async () => {
    renderPage()

    await screen.findByText('tester')

    expect(screen.getByRole('heading', { name: '订舱管理' })).toBeTruthy()
    expect(screen.getAllByText('tester').length).toBeGreaterThan(0)
    expect(latestPage).toBe('1')
    expect(latestPerPage).toBe('100')
    expect(screen.getByRole('button', { name: '批量打开' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '关闭初始化' })).toBeTruthy()
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

    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

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

    expect(screen.getByRole('button', { name: '关闭初始化' }).getAttribute('disabled')).not.toBeNull()
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

    fireEvent.click(screen.getByRole('button', { name: '批量打开' }))

    await waitFor(() => {
      expect(batchOpenPayloads).toHaveLength(2)
    })

    expect(requestParamsHistory.some((item) => item.page === '1' && item.perPage === '100')).toBeTruthy()
    expect(requestParamsHistory.some((item) => item.page === '2' && item.perPage === '100')).toBeTruthy()
    expect(batchOpenPayloads[0]?.split(',').map((item) => item.trim()).filter(Boolean)).toHaveLength(100)
    expect(batchOpenPayloads[1]?.split(',').map((item) => item.trim()).filter(Boolean)).toHaveLength(1)

  }, 10000)

  it('should show batch action in the card header when writable rows are selected', async () => {
    const view = renderPage()

    await waitFor(() => {
      expect(screen.getAllByText('tester').length).toBeGreaterThan(0)
    })

    const rowCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(rowCheckboxes[1] as Element)

    await waitFor(() => {
      const leftHeader = view.container.querySelector('.list-card-header-left')

      expect(leftHeader?.textContent).toContain('批量修改')
      expect(leftHeader?.textContent).toContain('已选 1 项')
    })

    const leftHeader = view.container.querySelector('.list-card-header-left')
    const centerHeader = view.container.querySelector('.list-card-header-center')

    expect(leftHeader?.textContent).toContain('批量打开')
    expect(leftHeader?.textContent).toContain('关闭初始化')
    expect(leftHeader?.textContent).toContain('清除路由')
    expect(centerHeader?.textContent).not.toContain('批量打开')
    expect(screen.queryByText('已选择')).toBeNull()

  }, 10000)

  it('should open edit modal with the repacked form fields', async () => {
    renderPage()

    await screen.findByText('tester')

    fireEvent.click(screen.getAllByRole('button', { name: '修改' })[0] as Element)

    await screen.findByDisplayValue('tester')
    expect(screen.getAllByText('下单方式').length).toBeGreaterThan(0)
    expect(screen.getAllByText('下单请求次数').length).toBeGreaterThan(0)
    expect(screen.getAllByText('下单并发次数').length).toBeGreaterThan(0)
    expect(screen.getAllByText('下单时间间隔').length).toBeGreaterThan(0)
    expect(screen.getAllByText('分组2').length).toBeGreaterThan(0)
    expect(screen.getAllByText('分组1').length).toBeGreaterThan(0)
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
      fireEvent.click(screen.getAllByRole('button', { name: '修改' })[0] as Element)
    })

    expect(await screen.findByDisplayValue('101,102')).toBeTruthy()

    const submitButton = within(screen.getByRole('dialog'))
      .getAllByRole('button')
      .find((button) => ['确 定', '确定', 'OK'].includes(button.textContent?.trim() ?? ''))

    await act(async () => {
      fireEvent.click(submitButton as Element)
    })

    await waitFor(() => {
      expect(latestUpdatePayload).toMatchObject({ order_id: '101,102' })
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
