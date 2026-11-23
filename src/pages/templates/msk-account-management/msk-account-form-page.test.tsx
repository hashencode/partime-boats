import React from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core'
import type { InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthContext } from '../../../infrastructure/auth/auth-context'
import { apiClient } from '../../../infrastructure/http/api-client'
import type { Role } from '../../../shared/types/roles'
import * as formKit from '../../../shared/template-kit/form'
import { ACCOUNT_REFRESH_EVENT } from './account-config'
import { MskBookAccountFormPage, MskQueryAccountFormPage } from './msk-account-form-page'

void React

type FormValues = { account: string; password: string; account_type: number; customer_code: string; is_use: number; is_refresh_use: number; use_type: number }
rs.mock('../../../shared/template-kit/form', { spy: true })
const successMessage = rs.spyOn(message, 'success')
const errorMessage = rs.spyOn(message, 'error')
const getSubmit = () => rs.mocked(formKit.BasicCrudFormRecipe).mock.calls.at(-1)?.[0].spec.onSubmit as ((values: FormValues) => Promise<void>) | undefined
const getCreate = () => rs.mocked(formKit.useTemplateFormController).mock.calls.at(-1)?.[0].createEntity as ((values: FormValues) => Promise<unknown>) | undefined
const getUpdate = () => rs.mocked(formKit.useTemplateFormController).mock.calls.at(-1)?.[0].updateEntity as ((id: string, values: FormValues) => Promise<unknown>) | undefined

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: (query: string) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }) })
}
if (!window.ResizeObserver) {
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver
}

const broadcasts: { name: string; data: { type: string; source?: string } }[] = []
class BroadcastChannelMock {
  name: string
  constructor(name: string) { this.name = name }
  postMessage(data: { type: string; source?: string }) { broadcasts.push({ name: this.name, data }) }
  close() {}
}
window.BroadcastChannel = BroadcastChannelMock as unknown as typeof BroadcastChannel
globalThis.BroadcastChannel = BroadcastChannelMock as unknown as typeof BroadcastChannel

const initialAccount = { _id: 'account-1', account: 'demo-account', password: ' existing password ', customer_code: '00123', account_type: 0, is_use: 1, is_refresh_use: 0, use_type: 0, update_time: '2026-11-23 09:00:00' }
const callbackValues: FormValues = { account: 'forced', password: ' password ', customer_code: '00123', account_type: 0, is_use: 0, is_refresh_use: 0, use_type: 0 }
const originalAdapter = apiClient.defaults.adapter
const calls: InternalAxiosRequestConfig[] = []
let currentAccount = { ...initialAccount }
let businessFailure = false
let readFailure = false
let secondPage = false

const Location = () => {
  const location = useLocation()
  return <output aria-label="current URL">{location.pathname}{location.search}</output>
}

const renderPage = (entry: string, role: Role = 'admin', strict = false) => {
  const page = <MemoryRouter initialEntries={[entry]}>
    <AuthContext.Provider value={{ isAuthenticated: true, role, displayName: 'tester', setRole() {}, setDisplayName() {}, login: async () => undefined, logout() {} }}>
      <Routes>
        <Route path="/msk-query-account-list/form" element={<MskQueryAccountFormPage />} />
        <Route path="/msk-book-account-list/form" element={<MskBookAccountFormPage />} />
        <Route path="/msk-query-account-list" element={<div>查询账号列表</div>} />
        <Route path="/msk-book-account-list" element={<div>订舱账号列表</div>} />
        <Route path="/template/exception/403" element={<div>403</div>} />
      </Routes>
      <Location />
    </AuthContext.Provider>
  </MemoryRouter>
  return render(strict ? <React.StrictMode>{page}</React.StrictMode> : page)
}

const field = (id: string) => document.getElementById(id) as HTMLInputElement
const change = (id: string, value: string) => fireEvent.change(field(id), { target: { value } })
const save = () => fireEvent.click(screen.getByRole('button', { name: /保\s*存/ }))
const writes = () => calls.filter((call) => call.method === 'post')
const payload = (index = 0) => JSON.parse(writes()[index].data) as Record<string, unknown>
const waitForDetail = async () => waitFor(() => expect(field('account')?.value).toBe(currentAccount.account))

beforeEach(() => {
  currentAccount = { ...initialAccount }
  businessFailure = false
  readFailure = false
  secondPage = false
  calls.length = 0
  broadcasts.length = 0
  rs.clearAllMocks()
  apiClient.defaults.adapter = async (config) => {
    calls.push(config)
    let data: unknown
    if (config.method === 'get') {
      if (readFailure) throw new Error('读取暂时失败')
      const page = Number(config.params.page)
      const rows = secondPage && page === 1 ? Array.from({ length: 100 }, (_, index) => ({ ...currentAccount, _id: `other-${index}`, account: 'similar-account' })) : [currentAccount]
      data = { data: { data: rows, pagination: { page, per_page: 100, total: secondPage ? 101 : 1, total_pages: secondPage ? 2 : 1 } } }
    } else if (businessFailure) {
      data = { error_code: 'DUPLICATE_ACCOUNT', message: '账号已存在，请使用其他账号' }
    } else {
      const submitted = JSON.parse(config.data) as Record<string, unknown>
      currentAccount = { ...currentAccount, ...submitted, _id: config.url === '/maersk/account' ? 'new-id' : currentAccount._id } as typeof currentAccount
      data = config.url === '/maersk/account' ? { _id: 'new-id' } : { _id: currentAccount._id, matched: 1, modified: 1 }
    }
    return { data, status: 200, statusText: 'OK', headers: {}, config }
  }
})

afterEach(async () => {
  cleanup()
  await act(async () => { message.destroy() })
  apiClient.defaults.adapter = originalAdapter
})

describe('MSK account form', () => {
  it('compares changes against the latest displayed detail when requests finish out of order', async () => {
    const resolveReads: ((entity: typeof initialAccount) => void)[] = []
    apiClient.defaults.adapter = (config) => {
      calls.push(config)
      if (config.method === 'post') return Promise.resolve({ data: { _id: initialAccount._id, matched: 1, modified: 1 }, status: 200, statusText: 'OK', headers: {}, config })
      return new Promise((resolve) => resolveReads.push((entity) => resolve({ data: { data: { data: [entity], pagination: { total: 1, page: 1, per_page: 100, total_pages: 1 } } }, status: 200, statusText: 'OK', headers: {}, config })))
    }
    renderPage('/msk-query-account-list/form?mode=modify&id=account-1&account_type=0', 'admin', true)
    await waitFor(() => expect(resolveReads).toHaveLength(2))
    const latest = { ...initialAccount, account: 'latest-account', use_type: 2, is_use: 0 }
    await act(async () => { resolveReads[1](latest) })
    await waitFor(() => expect(field('account').value).toBe('latest-account'))
    await act(async () => { resolveReads[0](initialAccount) })
    change('account', 'latest-renamed')
    save()
    await waitFor(() => expect(writes()).toHaveLength(1))
    expect(payload()).toEqual({ _id: 'account-1', account: 'latest-renamed' })
  })

  it('should create a query account with numeric defaults and retain password whitespace, then edit the returned identity', async () => {
    renderPage('/msk-query-account-list/form?mode=add')
    change('account', ' new-query ')
    change('password', ' new password ')
    change('customer_code', '00123')
    save()
    await waitFor(() => expect(writes()).toHaveLength(1))
    expect(payload()).toEqual({ account: 'new-query', password: ' new password ', customer_code: '00123', account_type: 1, use_type: 1, is_use: 1, is_refresh_use: 1 })
    await waitFor(() => expect(screen.getByLabelText('current URL').textContent).toContain('mode=modify'))
    expect(screen.getByLabelText('current URL').textContent).toContain('id=new-id')
    expect(screen.getByLabelText('current URL').textContent).toContain('original_account=new-query')
    expect(screen.getByLabelText('current URL').textContent).not.toContain('password')
    await waitForDetail()
    save()
    await screen.findByText('未修改账号信息')
    expect(writes()).toHaveLength(1)
    expect(broadcasts).toEqual([{ name: 'msk-query-accounts', data: expect.objectContaining({ type: ACCOUNT_REFRESH_EVENT }) }])
  })

  it('should require a password on add without trimming it', async () => {
    renderPage('/msk-query-account-list/form?mode=add')
    change('account', 'new-query')
    save()
    await screen.findByText('请输入密码')
    expect(writes()).toHaveLength(0)
    change('password', '   ')
    save()
    await waitFor(() => expect(writes()).toHaveLength(1))
    expect(payload().password).toBe('   ')
  })

  it('should load the exact account from a later page using the zero account type locator', async () => {
    secondPage = true
    renderPage('/msk-query-account-list/form?mode=modify&id=account-1&original_account=demo&account_type=0')
    await waitForDetail()
    expect(calls.map((call) => call.params.page)).toEqual([1, 2])
    expect(calls[0].params).toMatchObject({ account_type: 0, account: 'demo' })
    expect(field('customer_code').disabled).toBe(true)
    expect(field('account_type').disabled).toBe(true)
    expect(field('password').value).toBe('')
    expect(field('password').placeholder).toBe('留空则不修改密码')
    expect(field('update_time').disabled).toBe(true)
  })

  it('should submit only changed fields, preserve password whitespace, and reset to the renamed baseline', async () => {
    renderPage('/msk-book-account-list/form?mode=modify&id=account-1&original_account=demo-account&account_type=0')
    await waitForDetail()
    change('account', ' renamed-account ')
    change('password', ' new password ')
    save()
    await waitFor(() => expect(writes()).toHaveLength(1))
    expect(writes()[0].url).toBe('/maersk/book/list')
    expect(payload()).toEqual({ _id: 'account-1', account: 'renamed-account', password: ' new password ' })
    await waitFor(() => expect(screen.getByLabelText('current URL').textContent).toContain('original_account=renamed-account'))
    await waitForDetail()
    change('account', 'unsaved-draft')
    fireEvent.click(screen.getByRole('button', { name: /重\s*置/ }))
    expect(field('account').value).toBe('renamed-account')
    expect(field('password').value).toBe('')
    save()
    await screen.findByText('未修改账号信息')
    expect(writes()).toHaveLength(1)
    expect(broadcasts[0].name).toBe('msk-book-accounts')
    expect(calls.filter((call) => call.method === 'get').every((call) => call.url === '/maersk/book/list')).toBe(true)
  })

  it('should omit an empty edit password and send numeric zero when a type changes', async () => {
    currentAccount.use_type = 1
    renderPage('/msk-query-account-list/form?mode=modify&id=account-1&account_type=0')
    await waitForDetail()
    change('use_type', '0')
    save()
    await waitFor(() => expect(writes()).toHaveLength(1))
    expect(payload()).toEqual({ _id: 'account-1', use_type: 0 })
  })

  it('should preserve input and show a business failure without publishing success', async () => {
    businessFailure = true
    renderPage('/msk-query-account-list/form?mode=modify&id=account-1')
    await waitForDetail()
    change('account', 'duplicate-draft')
    change('password', ' retry password ')
    save()
    await screen.findByText('账号已存在，请使用其他账号')
    expect(field('account').value).toBe('duplicate-draft')
    expect(field('password').value).toBe(' retry password ')
    expect(broadcasts).toHaveLength(0)
    expect(screen.getByLabelText('current URL').textContent).not.toContain('duplicate-draft')
  })

  it('should keep a successful save separate from a failed detail reload and retry reads only', async () => {
    renderPage('/msk-query-account-list/form?mode=modify&id=account-1&original_account=demo-account')
    await waitForDetail()
    change('account', 'saved-account')
    readFailure = true
    save()
    await waitFor(() => expect(successMessage).toHaveBeenCalledWith('保存成功'))
    await screen.findByText('表单详情加载失败')
    fireEvent.click(screen.getByRole('button', { name: /重\s*试/ }))
    await waitFor(() => expect(calls.filter((call) => call.method === 'get').length).toBeGreaterThan(2))
    expect(writes()).toHaveLength(1)
    readFailure = false
    fireEvent.click(screen.getByRole('button', { name: /重\s*试/ }))
    await waitForDetail()
    expect(field('account').value).toBe('saved-account')
    expect(writes()).toHaveLength(1)
  })

  it('should block readonly writes through the form submit and both mutation callbacks', async () => {
    renderPage('/msk-query-account-list/form?mode=readonly&id=account-1', 'viewer')
    await waitForDetail()
    expect(screen.getByText('查看模式')).toBeTruthy()
    expect(field('account').disabled).toBe(true)
    expect(screen.queryByRole('button', { name: /保\s*存/ })).toBeNull()
    await act(async () => { await getSubmit()?.(callbackValues) })
    expect(errorMessage).not.toHaveBeenCalled()
    await expect(getCreate()?.(callbackValues)).rejects.toThrow('当前页面不允许保存账号')
    await expect(getUpdate()?.('account-1', callbackValues)).rejects.toThrow('当前页面不允许保存账号')
    expect(writes()).toHaveLength(0)
  })

  it('should block denied writes through submit and mutation callbacks', async () => {
    renderPage('/msk-query-account-list/form?mode=modify&id=account-1', 'viewer')
    const submit = getSubmit()
    const create = getCreate()
    const update = getUpdate()
    await screen.findByText('403')
    await act(async () => { await submit?.(callbackValues) })
    expect(errorMessage).not.toHaveBeenCalled()
    await expect(create?.(callbackValues)).rejects.toThrow('当前页面不允许保存账号')
    await expect(update?.('account-1', callbackValues)).rejects.toThrow('当前页面不允许保存账号')
    expect(calls).toHaveLength(0)
  })

  it.each([
    '/msk-query-account-list/form?mode=invalid',
    '/msk-query-account-list/form?mode=modify',
    '/msk-book-account-list/form?mode=add',
  ])('should show a recoverable route error and block writes for %s', async (entry) => {
    renderPage(entry)
    await screen.findByText('路由参数错误')
    await act(async () => { await getSubmit()?.(callbackValues) })
    await expect(getCreate()?.(callbackValues)).rejects.toThrow()
    await expect(getUpdate()?.('account-1', callbackValues)).rejects.toThrow()
    expect(calls).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: '返回列表' }))
    await screen.findByText(entry.includes('msk-book') ? '订舱账号列表' : '查询账号列表')
  })
})
