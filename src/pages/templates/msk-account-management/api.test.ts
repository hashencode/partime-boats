import { afterEach, describe, expect, it } from '@rstest/core'
import type { InternalAxiosRequestConfig } from 'axios'
import { apiClient } from '../../../infrastructure/http/api-client'
import {
  fetchMskAccountDetail,
  fetchMskAccountList,
  updateMskAccount,
  createMskAccount,
  deleteMskAccount,
  importMskAccounts,
  toAccountApiError,
} from './api'

const originalAdapter = apiClient.defaults.adapter
const calls: InternalAxiosRequestConfig[] = []
const account = { _id: 'account-1', account: 'demo01', password: ' demo password ', customer_code: '00123', is_use: 1, is_refresh_use: 0, use_type: 0, update_time: '' }
const respond = (data: unknown) => {
  apiClient.defaults.adapter = async (config) => {
    calls.push(config)
    return { data, status: 200, statusText: 'OK', headers: {}, config }
  }
}
const list = (data = [account], page = 1, total = data.length) => ({
  data: { data, pagination: { total, page, per_page: 100, total_pages: Math.max(1, Math.ceil(total / 100)) } },
})
afterEach(() => { apiClient.defaults.adapter = originalAdapter; calls.length = 0 })

describe('MSK account API', () => {
  it('uses each account list endpoint and retains zero filters without changing the client timeout', async () => {
    respond(list())
    const result = await fetchMskAccountList('booking', { account_type: 0, is_use: 0, use_type: 0, page: 1, per_page: 500 })
    await fetchMskAccountList('query', { account_type: 1, page: 1, per_page: 10 })
    expect(result.data[0]).toMatchObject(account)
    expect(result.total).toBe(1)
    expect(calls.map((call) => call.url)).toEqual(['/maersk/book/list', '/maersk/list'])
    expect(calls[0].params).toMatchObject({ account_type: 0, is_use: 0, use_type: 0 })
    expect(calls.map((call) => call.timeout)).toEqual([20000, 5000])
    expect(apiClient.defaults.timeout).toBe(5000)
  })

  it('rejects HTTP-200 business failures and preserves a useful message', async () => {
    respond({ error_code: 'DUPLICATE_ACCOUNT', message: '账号已存在' })
    await expect(fetchMskAccountList('query', { account_type: 1 })).rejects.toThrow('账号已存在')
    expect(toAccountApiError(new Error('账号已存在')).message).toBe('账号已存在')
  })

  it('rejects malformed responses instead of treating missing rows as an empty success', async () => {
    respond({ bool_status: true, data: {} })
    await expect(fetchMskAccountList('query', { account_type: 1 })).rejects.toThrow()
  })

  it('finds the exact ID beyond page one without accepting a fuzzy account match', async () => {
    apiClient.defaults.adapter = async (config) => {
      calls.push(config)
      const page = Number(config.params.page)
      return { data: list([{ ...account, _id: page === 1 ? 'other' : 'target' }], page, 101), status: 200, statusText: 'OK', headers: {}, config }
    }
    const result = await fetchMskAccountDetail('query', 'target', { account_type: 0, original_account: 'demo' })
    expect(result._id).toBe('target')
    expect(calls.map((call) => call.params.page)).toEqual([1, 2])
    expect(calls[0].params).toMatchObject({ account_type: 0, account: 'demo' })
  })

  it('does not loop when the backend repeats a page', async () => {
    respond(list([account], 1, 101))
    await expect(fetchMskAccountDetail('booking', 'missing', { account_type: 1 })).rejects.toThrow()
    expect(calls.length).toBeLessThanOrEqual(2)
  })

  it('keeps password whitespace and omits an unchanged empty password on updates', async () => {
    respond({ bool_status: true, data: { _id: 'account-1', matched: 1, modified: 1 } })
    await updateMskAccount('booking', 'account-1', { password: ' secret ', is_use: 0, use_type: 0 })
    await updateMskAccount('query', 'account-1', { password: '', is_refresh_use: 0 })
    expect(JSON.parse(calls[0].data)).toEqual({ _id: 'account-1', password: ' secret ', is_use: 0, use_type: 0 })
    expect(JSON.parse(calls[1].data)).toEqual({ _id: 'account-1', is_refresh_use: 0 })
  })

  it('rejects zero matches and missing mutation success evidence', async () => {
    respond({ bool_status: true, data: { matched: 0, modified: 0 } })
    await expect(updateMskAccount('query', 'gone', { is_use: 0 })).rejects.toThrow()
    respond({ data: {} })
    await expect(updateMskAccount('query', 'account-1', { is_use: 0 })).rejects.toThrow()
  })

  it('accepts documented direct mutation results and nested booking results', async () => {
    respond({ _id: 'account-1', matched: 1, modified: 0 })
    expect((await updateMskAccount('query', 'account-1', { is_use: 0 })).modified).toBe(0)
    respond({ _id: 'new-account' })
    expect((await createMskAccount({ account: 'new', password: ' secret ' }))._id).toBe('new-account')
    respond({ total: 1, inserted: 1, matched: 0, modified: 0 })
    expect((await importMskAccounts('query', new File(['test'], 'query.xlsx'))).inserted).toBe(1)
  })

  it('creates query accounts and reports already-absent deletion without faking a removed row', async () => {
    respond({ bool_status: true, data: { _id: 'account-new' } })
    await createMskAccount({ account: 'new', password: ' secret ', account_type: 0 })
    expect(calls[0].url).toBe('/maersk/account')
    expect(JSON.parse(calls[0].data).password).toBe(' secret ')
    respond({ bool_status: true, data: { _id: 'gone', deleted: 0 } })
    expect((await deleteMskAccount('gone')).deleted).toBe(0)
    expect(calls[1].url).toBe('/maersk/account/gone')
  })

  it('uploads the original xlsx file using its category endpoint and actual result counts', async () => {
    respond({ bool_status: true, data: { total: 3, inserted: 1, matched: 2, modified: 1 } })
    const file = new File(['xlsx test'], 'accounts.xlsx')
    const result = await importMskAccounts('booking', file)
    expect(calls[0].url).toBe('/maersk/book/account/import')
    expect((calls[0].data as FormData).get('file')).toBe(file)
    expect(result).toEqual({ total: 3, inserted: 1, matched: 2, modified: 1 })
  })
})
