import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from '@rstest/core'
import type { ColumnsType } from 'antd/es/table'
import {
  buildListToolbarColumnSettingOptions,
  type ListToolbarColumnSettingOption,
  ListToolbarActions,
} from './list-toolbar-actions'

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

if (!window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}

describe('list-toolbar-actions', () => {
  it('builds column setting options from keyed columns', () => {
    const columns: ColumnsType<{ id: number }> = [
      { key: 'id', title: 'ID', dataIndex: 'id' },
      { title: '无 key 列', dataIndex: 'id' },
      { key: 'action', title: () => '操作', render: () => null },
    ]

    expect(buildListToolbarColumnSettingOptions(columns)).toEqual<ListToolbarColumnSettingOption[]>([
      { key: 'id', label: 'ID' },
      { key: 'action', label: 'action' },
    ])
  })

  it('renders built-in column setting panel and reports selection changes', async () => {
    const recordedKeys: string[][] = []

    render(
      <ListToolbarActions
        tableSize="small"
        onTableSizeChange={() => undefined}
        onReload={() => undefined}
        columnSettingOptions={[
          { key: 'id', label: 'ID' },
          { key: 'name', label: '名称' },
        ]}
        selectedColumnKeys={['id']}
        onSelectedColumnKeysChange={(keys) => {
          recordedKeys.push(keys)
        }}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '列设置' }))

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'ID' })).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('checkbox', { name: '名称' }))

    await waitFor(() => {
      expect(recordedKeys.length).toBeGreaterThan(0)
    })
  })
})
