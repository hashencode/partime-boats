import React from 'react'
import { afterEach, describe, expect, it, rs } from '@rstest/core'
import { page } from '@rstest/browser'
import { render, cleanup, screen } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import { apiClient } from '../../../infrastructure/http/api-client'
import { AuthContext } from '../../../infrastructure/auth/auth-context'
import { ThemeProvider } from '../../../shared/contexts/theme-context'
import { MskQueryAccountListPage } from './msk-account-list-page'

void React
const originalAdapter = apiClient.defaults.adapter
const originalBroadcastChannel = window.BroadcastChannel
const calls: Record<string, unknown>[] = []
const renderList = (viewer = false, motion = false) => {
  apiClient.defaults.adapter = async (config) => {
    calls.push(config.params)
    return {
      status: 200, statusText: 'OK', headers: {}, config,
      data: { data: { data: [{ _id: 'browser-account', account: 'browser-demo', password: 'example-password', customer_code: '00123', is_use: 1, is_refresh_use: 0, use_type: 0 }], pagination: { total: 1, page: 1, per_page: 100, total_pages: 1 } } },
    }
  }
  render(<AuthContext.Provider value={{ isAuthenticated: true, role: viewer ? 'viewer' : 'admin', displayName: 'browser-test', setRole() {}, setDisplayName() {}, login: async () => {}, logout() {} }}>
    <ConfigProvider theme={{ token: { motion } }}><ThemeProvider><MskQueryAccountListPage /></ThemeProvider></ConfigProvider>
  </AuthContext.Provider>)
}
afterEach(() => { cleanup(); apiClient.defaults.adapter = originalAdapter; window.BroadcastChannel = originalBroadcastChannel; calls.length = 0; localStorage.clear() })

describe('MSK account browser interactions', () => {
  it('should expose a clickable empty-state reset only after the deletion dialog closes', async () => {
    const channels = new Set<TestChannel>()
    class TestChannel {
      name: string
      onmessage: ((event: MessageEvent) => void) | null = null
      constructor(name: string) { this.name = name; channels.add(this) }
      postMessage(data: unknown) { for (const channel of channels) if (channel !== this && channel.name === this.name) channel.onmessage?.({ data } as MessageEvent) }
      close() { channels.delete(this) }
    }
    // Keep refresh delivery deterministic while exercising real modal motion and pointer hit-testing.
    window.BroadcastChannel = TestChannel as unknown as typeof BroadcastChannel
    renderList(false, true)
    await expect.element(page.getByText('browser-demo', { exact: true })).toBeVisible()
    let deleted = false
    apiClient.defaults.adapter = async (config) => {
      if (config.method === 'delete') {
        deleted = true
        return { data: { data: { _id: 'browser-account', deleted: 1 } }, status: 200, statusText: 'OK', headers: {}, config }
      }
      return { data: { data: { data: deleted ? [] : [{ _id: 'browser-account', account: 'browser-demo' }], pagination: { total: deleted ? 0 : 1, page: 1, per_page: 100, total_pages: deleted ? 0 : 1 } } }, status: 200, statusText: 'OK', headers: {}, config }
    }
    await page.getByRole('textbox', { name: '账号' }).fill('browser-demo')
    await page.getByRole('button', { name: /查\s*询/ }).click()
    await page.getByRole('button', { name: '删除', exact: true }).click()
    await rs.waitFor(() => {
      const dialog = screen.getByRole('dialog')
      expect(getComputedStyle(dialog).transform).toBe('none')
    })
    await page.getByRole('button', { name: '删除账号', exact: true }).click()
    await rs.waitFor(() => expect(deleted).toBe(true))
    const reset = await screen.findByRole('button', { name: '重置筛选' })
    const bounds = reset.getBoundingClientRect()
    const receiver = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
    expect(receiver !== null && reset.contains(receiver)).toBe(true)
    await page.getByRole('button', { name: '重置筛选', exact: true }).click()
    await expect.element(page.getByRole('textbox', { name: '账号' })).toHaveValue('')
  })

  it('keeps numeric filter edits as drafts until query and restores the default on reset', async () => {
    renderList()
    await expect.element(page.getByText('browser-demo', { exact: true })).toBeVisible()
    await page.getByRole('spinbutton', { name: '账号类型' }).fill('0')
    expect(calls).toHaveLength(1)
    await page.getByRole('button', { name: /查\s*询/ }).click()
    await rs.waitFor(() => expect(calls.at(-1)?.account_type).toBe(0))
    await page.getByRole('button', { name: /重\s*置/ }).click()
    await rs.waitFor(() => expect(calls.at(-1)?.account_type).toBe(1))
    await expect.element(page.getByRole('spinbutton', { name: '账号类型' })).toHaveValue('1')
  })

  it('shows confirmed plaintext credentials while withholding write controls from a viewer', async () => {
    renderList(true)
    await expect.element(page.getByText('example-password', { exact: true })).toBeVisible()
    await expect.element(page.getByText('00123', { exact: true })).toBeVisible()
    await expect.element(page.getByRole('button', { name: '导出当前页' })).toBeEnabled()
    await expect.element(page.getByRole('button', { name: '新增账号' })).not.toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Excel导入' })).not.toBeVisible()
    await expect.element(page.getByRole('button', { name: '修改', exact: true })).not.toBeVisible()
  })
})
