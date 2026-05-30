import React from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AuthContext } from '../../../infrastructure/auth/auth-context'
import { ThemeProvider } from '../../../shared/contexts/theme-context'
import { BookTaskListPage, CidTypeSelect } from './book-task-list-page'

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
    const payload = (await request.json()) as { ids?: string }
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
    const view = renderPage()

    await screen.findByText('tester')

    expect(screen.getByRole('heading', { name: '订舱管理' })).toBeTruthy()
    expect(screen.getAllByText('tester').length).toBeGreaterThan(0)
    expect(latestPage).toBe('1')
    expect(latestPerPage).toBe('10')
    expect(screen.getByRole('button', { name: '批量打开' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '关闭初始化' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '批量修改' })).toBeNull()
    expect(screen.queryByText(/最近刷新时间/)).toBeNull()

    view.unmount()
  }, 10000)

  it('should not re-query when changing filters until query button clicked', async () => {
    const view = renderPage()

    await waitFor(() => {
      expect(listRequestCount).toBeGreaterThan(0)
    })
    const initialCount = listRequestCount

    fireEvent.change(screen.getByLabelText('对应taskID'), { target: { value: '999' } })

    await waitFor(() => {
      expect(listRequestCount).toBe(initialCount)
    })

    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

    await waitFor(() => {
      expect(listRequestCount).toBe(initialCount + 1)
    })

    expect(requestParamsHistory.at(-1)).toEqual({
      page: '1',
      perPage: '10',
      orderId: '999',
    })

    view.unmount()
  }, 10000)

  it('should hide write actions for viewer role', async () => {
    const view = renderPage('viewer')

    await waitFor(() => {
      expect(screen.getAllByText('tester').length).toBeGreaterThan(0)
    })

    expect(screen.getByRole('button', { name: '关闭初始化' }).getAttribute('disabled')).not.toBeNull()
    expect(screen.queryByText('修改')).toBeNull()

    view.unmount()
  })

  it('should show error state when list request fails', async () => {
    server.use(
      http.get('http://124.70.141.127:9111/maersk/book/task', () =>
        HttpResponse.json({ message: 'server err' }, { status: 500 })
      )
    )

    const view = renderPage()

    await waitFor(() => {
      expect(screen.getByText('任务列表加载失败')).toBeTruthy()
      expect(screen.getByText('请求失败，请稍后重试。')).toBeTruthy()
    })

    view.unmount()
  })

  it('should batch open all filtered rows in queue when nothing is checked', async () => {
    const view = renderPage()

    await waitFor(() => {
      expect(screen.getAllByText('tester').length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getByRole('button', { name: '批量打开' }))
    const confirmText = await screen.findByText('未勾选任何列表项，将会开启当前筛选结果中的所有项，是否确认？')
    expect(confirmText.closest('.ant-popover')?.getAttribute('style')).toContain('max-width: 280px')
    fireEvent.click(await screen.findByRole('button', { name: '是' }))

    await waitFor(() => {
      expect(batchOpenPayloads).toHaveLength(2)
    })

    expect(requestParamsHistory.some((item) => item.page === '1' && item.perPage === '100')).toBeTruthy()
    expect(requestParamsHistory.some((item) => item.page === '2' && item.perPage === '100')).toBeTruthy()
    expect(batchOpenPayloads[0]?.split(',').map((item) => item.trim()).filter(Boolean)).toHaveLength(100)
    expect(batchOpenPayloads[1]?.split(',').map((item) => item.trim()).filter(Boolean)).toHaveLength(1)

    view.unmount()
  }, 10000)

  it('should show batch action in the card header when writable rows are selected', async () => {
    const view = renderPage()

    await waitFor(() => {
      expect(screen.getAllByText('tester').length).toBeGreaterThan(0)
    })

    const rowCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(rowCheckboxes[1] as Element)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '批量修改' })).toBeTruthy()
      expect(screen.getByText('已选 1 项')).toBeTruthy()
    })

    expect(screen.queryByText('已选择')).toBeNull()

    view.unmount()
  })

  it('should open edit modal with the repacked form fields', async () => {
    const view = renderPage()

    await screen.findByText('tester')

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: '修改' })[0] as Element)
    })

    await screen.findByLabelText('起始港')
    expect(screen.getAllByText('cid类型').length).toBeGreaterThan(0)
    expect(screen.getAllByText('nac间隔时间').length).toBeGreaterThan(0)

    view.unmount()
  }, 10000)

  it('should submit the legacy-shaped payload for single-row edits', async () => {
    const view = renderPage()

    await screen.findByText('tester')

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: '修改' })[0] as Element)
    })

    await screen.findByLabelText('起始港')

    const submitButton = screen
      .getAllByRole('button')
      .find((button) => ['确 定', '确定', 'OK'].includes(button.textContent?.trim() ?? ''))

    expect(submitButton).toBeTruthy()

    await act(async () => {
      fireEvent.click(submitButton as Element)
    })

    await waitFor(() => {
      expect(latestUpdatePayload).not.toBeNull()
    })

    expect(latestUpdatePayload).toMatchObject({
      order_id: '101',
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
      id: 1,
    })

    view.unmount()
  }, 10000)

  it('should open batch modal with repeat-add field intact', async () => {
    const view = renderPage()

    await screen.findByText('tester')

    const rowCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(rowCheckboxes[1] as Element)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '批量修改' })).toBeTruthy()
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '批量修改' }))
    })

    await screen.findByLabelText('是否重复添加')

    view.unmount()
  }, 10000)

  it('should allow adding a custom cid type option', async () => {
    const view = render(<CidTypeSelectHarness initialValue={0} />)

    const comboBox = screen.getByRole('combobox')
    await act(async () => {
      fireEvent.mouseDown(comboBox)
    })

    const customInput = await screen.findByPlaceholderText('请输入CID类型数字')
    fireEvent.change(customInput, { target: { value: '9' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /添加/ }))
    })

    await waitFor(() => {
      expect(screen.getByText('current:9')).toBeTruthy()
    })

    view.unmount()
  })

  it('should keep an unknown cid type value visible', async () => {
    const view = render(<CidTypeSelectHarness initialValue={9} />)

    await waitFor(() => {
      expect(screen.getByText('9')).toBeTruthy()
      expect(screen.getByText('current:9')).toBeTruthy()
    })

    view.unmount()
  })
})
