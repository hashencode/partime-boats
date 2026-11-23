import React from 'react'
import { ConfigProvider, message } from 'antd'
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, rs } from '@rstest/core'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import * as XLSX from 'xlsx'
import { AxiosError } from 'axios'
import { ThemeProvider } from '../../../shared/contexts/theme-context'
import { AuthContext } from '../../../infrastructure/auth/auth-context'
import { apiClient } from '../../../infrastructure/http/api-client'
import { MskBookAccountListPage, MskQueryAccountListPage } from './msk-account-list-page'

void React
const { workbooks } = rs.hoisted(() => ({ workbooks: [] as import('xlsx').WorkBook[] }))
rs.mock('xlsx', { spy: true })
rs.mocked(XLSX.writeFile).mockImplementation((workbook) => { workbooks.push(workbook) })

window.matchMedia = (query: string) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false })
const originalComputedStyle = window.getComputedStyle
window.getComputedStyle = (element) => originalComputedStyle(element)
window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
class Channel {
  static all = new Set<Channel>()
  onmessage: ((event: MessageEvent) => void) | null = null
  name: string
  constructor(name: string) { this.name = name; Channel.all.add(this) }
  postMessage(data: unknown) { for (const other of Channel.all) if (other !== this && other.name === this.name) other.onmessage?.({ data } as MessageEvent) }
  close() { Channel.all.delete(this) }
}
window.BroadcastChannel = Channel as unknown as typeof BroadcastChannel
const requests: URL[] = []
let deletes: string[] = []
let imports = 0
const row = { _id: 'row-1', account: 'demo01', password: ' fake password ', customer_code: '00123', is_use: 1, is_refresh_use: 0, use_type: 0, update_time: '2026-11-23 10:00:00' }
const result = () => ({ data: { data: [row], pagination: { total: 1, page: 1, per_page: 100, total_pages: 1 } } })
const handler = ({ request }: { request: Request }) => { requests.push(new URL(request.url)); return HttpResponse.json(result()) }
const server = setupServer(
  http.get('*/maersk/list', handler), http.get('*/maersk/book/list', handler),
  http.delete('*/maersk/account/:id', ({ params }) => { deletes.push(String(params.id)); return HttpResponse.json({ data: { _id: params.id, deleted: 1 } }) }),
  http.post('*/maersk/account/import', () => { imports += 1; return HttpResponse.json({ total: 2, inserted: 1, matched: 1, modified: 0 }) })
)
const originalAdapter = apiClient.defaults.adapter
const originalOpen = window.open
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => { cleanup(); apiClient.defaults.adapter = originalAdapter; message.destroy(); server.resetHandlers(); requests.length = 0; deletes = []; imports = 0; workbooks.length = 0; window.localStorage.clear(); window.open = originalOpen; Channel.all.clear() })
afterAll(() => server.close())
const renderPage = (booking = false, viewer = false) => render(
  <AuthContext.Provider value={{ isAuthenticated: true, role: viewer ? 'viewer' : 'admin', displayName: 'tester', setRole() {}, setDisplayName() {}, login: async () => {}, logout() {} }}>
    <ConfigProvider theme={{ token: { motion: false } }}><ThemeProvider>{booking ? <MskBookAccountListPage /> : <MskQueryAccountListPage />}</ThemeProvider></ConfigProvider>
  </AuthContext.Provider>
)
const loadRow = async () => { await screen.findByText('demo01'); await waitFor(() => expect((screen.getByRole('button', { name: '导出当前页' }) as HTMLButtonElement).disabled).toBe(false)) }

describe('MSK account lists', () => {
  it('keeps booking and query capabilities separate and shows plaintext password', async () => {
    renderPage(true)
    await loadRow()
    expect(requests[0].pathname).toContain('/maersk/book/list')
    expect(screen.getByText('fake password', { exact: false })).toBeTruthy()
    expect(screen.getByRole('button', { name: '修改' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '新增账号' })).toBeNull()
    expect(screen.queryByRole('button', { name: '删除' })).toBeNull()
  }, 15000)

  it('queries only on submit, retains zero, and resets account type to one', async () => {
    renderPage()
    await loadRow()
    const type = screen.getByRole('spinbutton', { name: '账号类型' })
    fireEvent.change(type, { target: { value: '0' } })
    expect(requests.length).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('account_type')).toBe('0'))
    fireEvent.click(screen.getByRole('button', { name: /重\s*置/ }))
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('account_type')).toBe('1'))
    expect((screen.getByRole('spinbutton', { name: '账号类型' }) as HTMLInputElement).value).toBe('1')
  }, 15000)

  it('edits using the successful row context rather than unsubmitted filters', async () => {
    let url = ''
    window.open = ((value: string | URL | undefined) => { url = String(value); return null }) as typeof window.open
    renderPage()
    await loadRow()
    fireEvent.change(screen.getByRole('spinbutton', { name: '账号类型' }), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: '修改' }))
    expect(url).toContain('/msk-query-account-list/form?')
    const params = new URL(url, 'http://localhost').searchParams
    expect(params.get('id')).toBe('row-1')
    expect(params.get('account_type')).toBe('1')
    expect(params.get('original_account')).toBe('demo01')
    expect(url).not.toContain('password')
  }, 15000)

  it('exports only the successful current page including passwords and no internal ID', async () => {
    renderPage()
    await loadRow()
    fireEvent.click(screen.getByRole('button', { name: '导出当前页' }))
    await waitFor(() => expect(workbooks.length).toBe(1))
    const saved = XLSX.read(XLSX.write(workbooks[0], { type: 'array', bookType: 'xlsx' }), { type: 'array' })
    const rows = XLSX.utils.sheet_to_json(saved.Sheets[saved.SheetNames[0]], { header: 1 })
    expect(rows).toEqual([['账号', '密码', '客户代码', '是否使用刷新', '是否启用', '使用类型', '更新时间'], ['demo01', ' fake password ', '00123', '否', '是', '0', '2026-11-23 10:00:00']])
    expect(requests).toHaveLength(1)
  }, 15000)

  it('writes hyperlink-prefixed credentials and formula-like values as literal text', async () => {
    server.use(http.get('*/maersk/list', () => HttpResponse.json({ data: { data: [{ ...row, password: 'hyperlink:example-password', customer_code: '=00123' }], pagination: { total: 1, page: 1, per_page: 100, total_pages: 1 } } })))
    renderPage()
    await loadRow()
    fireEvent.click(screen.getByRole('button', { name: '导出当前页' }))
    await waitFor(() => expect(workbooks).toHaveLength(1))
    const saved = XLSX.read(XLSX.write(workbooks[0], { type: 'array', bookType: 'xlsx' }), { type: 'array' })
    const sheet = saved.Sheets[saved.SheetNames[0]]
    expect(sheet.B2).toMatchObject({ t: 's', v: 'hyperlink:example-password' })
    expect(sheet.B2.l).toBeUndefined()
    expect(sheet.C2).toMatchObject({ t: 's', v: '=00123' })
    expect(sheet.C2.f).toBeUndefined()
  }, 15000)

  it('disables export for a nonempty partial page', async () => {
    server.use(http.get('*/maersk/list', () => HttpResponse.json({ data: { data: [row], pagination: { total: 101, page: 1, per_page: 100, total_pages: 2 } } })))
    renderPage()
    await screen.findByText('账号信息返回不完整')
    expect((screen.getByRole('button', { name: '导出当前页' }) as HTMLButtonElement).disabled).toBe(true)
    expect(workbooks).toHaveLength(0)
  }, 15000)

  it('recovers from an empty filtered list by resetting the filters', async () => {
    server.use(http.get('*/maersk/list', ({ request }) => {
      const url = new URL(request.url)
      requests.push(url)
      return HttpResponse.json(url.searchParams.get('account') ? { data: { data: [], pagination: { total: 0, page: 1, per_page: 100, total_pages: 0 } } } : result())
    }))
    renderPage()
    await loadRow()
    fireEvent.change(screen.getByRole('textbox', { name: '账号' }), { target: { value: 'missing' } })
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }))
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('account')).toBe('missing'))
    await screen.findByText('当前筛选条件下暂无账号', {}, { timeout: 5000 })
    fireEvent.click(screen.getByRole('button', { name: '重置筛选' }))
    await loadRow()
    expect(requests.at(-1)?.searchParams.get('account')).toBeNull()
  }, 15000)

  it('retains old rows on reload failure and disables stale export until retry succeeds', async () => {
    renderPage()
    await loadRow()
    server.use(http.get('*/maersk/list', () => HttpResponse.json({ error_code: 'FAILED', message: '查询失败' })))
    fireEvent.click(screen.getByRole('button', { name: '刷新' }))
    await screen.findByText('本次列表未更新')
    expect(screen.getByText('demo01')).toBeTruthy()
    expect((screen.getByRole('button', { name: '导出当前页' }) as HTMLButtonElement).disabled).toBe(true)
    server.resetHandlers()
    fireEvent.click(screen.getByRole('button', { name: /重\s*试/ }))
    await waitFor(() => expect((screen.getByRole('button', { name: '导出当前页' }) as HTMLButtonElement).disabled).toBe(false))
  }, 15000)

  it('does not expose write controls to a viewer', async () => {
    renderPage(false, true)
    await loadRow()
    for (const name of ['修改', '删除', '新增账号', 'Excel导入']) expect(screen.queryByRole('button', { name })).toBeNull()
  }, 15000)

  it('confirms the target before deletion, cancels without mutation and refreshes after success', async () => {
    renderPage()
    await loadRow()
    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    await screen.findByText(/删除后无法恢复/)
    fireEvent.click(screen.getByRole('button', { name: /取\s*消/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(deletes).toHaveLength(0)
    expect(requests).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    fireEvent.click(await screen.findByRole('button', { name: '删除账号' }))
    await waitFor(() => expect(deletes).toEqual(['row-1']))
    await waitFor(() => expect(requests.length).toBeGreaterThan(1))
  }, 15000)

  it('exports only the selected page and returns to the previous page after deleting its last row', async () => {
    let removed = false
    server.use(
      http.get('*/maersk/list', ({ request }) => {
        const url = new URL(request.url)
        requests.push(url)
        const page = Number(url.searchParams.get('page'))
        const rows = page === 1 ? Array.from({ length: 100 }, (_, index) => ({ ...row, _id: `page-one-${index}`, account: index ? `demo-${index}` : 'demo01' })) : removed ? [] : [{ ...row, _id: 'last-id', account: 'last-page-account' }]
        return HttpResponse.json({ data: { data: rows, pagination: { total: removed ? 100 : 101, page, per_page: 100, total_pages: removed ? 1 : 2 } } })
      }),
      http.delete('*/maersk/account/:id', ({ params }) => { removed = true; deletes.push(String(params.id)); return HttpResponse.json({ data: { _id: params.id, deleted: 1 } }) })
    )
    renderPage()
    await loadRow()
    fireEvent.click(document.querySelector('.ant-pagination-next')!)
    await screen.findByText('last-page-account')
    await waitFor(() => expect((screen.getByRole('button', { name: '导出当前页' }) as HTMLButtonElement).disabled).toBe(false))
    const readCount = requests.length
    fireEvent.click(screen.getByRole('button', { name: '导出当前页' }))
    await waitFor(() => expect(workbooks).toHaveLength(1))
    expect(XLSX.utils.sheet_to_json(workbooks[0].Sheets[workbooks[0].SheetNames[0]], { header: 1 })).toHaveLength(2)
    expect(workbooks[0].Sheets[workbooks[0].SheetNames[0]].A2.v).toBe('last-page-account')
    expect(requests).toHaveLength(readCount)
    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    fireEvent.click(await screen.findByRole('button', { name: '删除账号' }))
    await screen.findByText('demo01')
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('page')).toBe('1'))
    expect(deletes).toEqual(['last-id'])
    expect(screen.queryByText('last-page-account')).toBeNull()
  }, 30000)

  it('does not upload on selection and reports the actual counts after explicit import', async () => {
    const adapter = apiClient.defaults.adapter
    apiClient.defaults.adapter = async (config) => {
      if (config.method === 'post') { imports += 1; return { data: { total: 2, inserted: 1, matched: 1, modified: 0 }, status: 200, statusText: 'OK', headers: {}, config } }
      requests.push(new URL(config.url!, 'http://localhost'))
      return { data: result(), status: 200, statusText: 'OK', headers: {}, config }
    }
    const { container } = renderPage()
    await loadRow()
    fireEvent.click(screen.getByRole('button', { name: 'Excel导入' }))
    const dialog = within(screen.getByRole('dialog'))
    const importButton = dialog.getByRole('button', { name: '导入账号' })
    expect(importButton).toBeDisabled()
    const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['test'], 'accounts.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })] } })
    expect(imports).toBe(0)
    await waitFor(() => expect(importButton).toBeEnabled())
    fireEvent.click(importButton)
    await waitFor(() => expect(imports).toBe(1))
    await screen.findByText(/处理 2 行.*新增 1.*匹配 1.*修改 0/)
    apiClient.defaults.adapter = adapter
  }, 15000)

  it.each([false, true])('recovers by reading without repeating an import (write confirmed: %s)', async (confirmed) => {
    let failReads = false
    apiClient.defaults.adapter = async (config) => {
      if (config.method === 'post') {
        imports += 1
        if (!confirmed) throw new AxiosError('请求超时，导入结果未确认', 'ECONNABORTED', config)
        failReads = true
        return { data: { total: 2, inserted: 1, matched: 1, modified: 0 }, status: 200, statusText: 'OK', headers: {}, config }
      }
      requests.push(new URL(config.url!, 'http://localhost'))
      if (failReads) throw new Error('查询失败')
      return { data: result(), status: 200, statusText: 'OK', headers: {}, config }
    }
    const { container } = renderPage()
    await loadRow()
    fireEvent.click(screen.getByRole('button', { name: 'Excel导入' }))
    const dialog = within(screen.getByRole('dialog'))
    const importButton = dialog.getByRole('button', { name: '导入账号' })
    expect(importButton).toBeDisabled()
    fireEvent.change(container.ownerDocument.querySelector('input[type="file"]')!, { target: { files: [new File(['test'], 'accounts.xlsx')] } })
    await waitFor(() => expect(importButton).toBeEnabled())
    fireEvent.click(importButton)
    if (confirmed) {
      await screen.findByText(/处理 2 行.*新增 1/)
      await screen.findByText('本次列表未更新')
      failReads = false
      fireEvent.click(screen.getByRole('button', { name: /重\s*试/ }))
    } else {
      await screen.findByText('请求超时，导入结果未确认')
      fireEvent.click(dialog.getByRole('button', { name: '查询账号' }))
    }
    await loadRow()
    expect(imports).toBe(1)
    expect(requests.length).toBeGreaterThan(1)
  }, 15000)
})
