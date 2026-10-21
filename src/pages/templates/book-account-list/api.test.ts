import { afterEach, describe, expect, it } from '@rstest/core'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { apiClient } from '../../../infrastructure/http/api-client'
import { fetchBookAccountList } from './api'

const originalAdapter = apiClient.defaults.adapter
afterEach(() => { apiClient.defaults.adapter = originalAdapter })

describe('book account list requests', () => {
  it('should extend only the new large-page requests without changing the shared timeout', async () => {
    const calls: InternalAxiosRequestConfig[] = []
    apiClient.defaults.adapter = async (config) => {
      calls.push(config)
      return { data: { data: [], pagination: { total: 0 } }, status: 200, statusText: 'OK', headers: {}, config }
    }
    await fetchBookAccountList({ page: 1, per_page: 500 })
    await fetchBookAccountList({ page: 1, per_page: 1000 })
    await fetchBookAccountList({ page: 2, per_page: 10 })
    expect(calls.map((config) => config.timeout)).toEqual([20000, 20000, 5000])
    expect(calls.map((config) => config.params.per_page)).toEqual([500, 1000, 10])
    expect(apiClient.defaults.timeout).toBe(5000)
  })

  it('should propagate a large-page timeout for the page retry feedback', async () => {
    apiClient.defaults.adapter = async () => { throw new AxiosError('timeout', 'ECONNABORTED') }
    await expect(fetchBookAccountList({ page: 1, per_page: 1000 })).rejects.toMatchObject({ code: 'QUERY_TIMEOUT' })
  })
})
