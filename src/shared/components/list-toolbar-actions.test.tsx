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

  it('limits column setting panel height and enables vertical scrolling', async () => {
    render(
      <ListToolbarActions
        tableSize="small"
        onTableSizeChange={() => undefined}
        onReload={() => undefined}
        columnSettingOptions={Array.from({ length: 20 }, (_, index) => ({
          key: `column-${index + 1}`,
          label: `列${index + 1}`,
        }))}
        selectedColumnKeys={['column-1']}
        onSelectedColumnKeysChange={() => undefined}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '列设置' }))

    const checkbox = await screen.findByRole('checkbox', { name: '列1' })
    const scrollContainer = checkbox.closest('div[class*="overflow-y-auto"]') as HTMLDivElement | null

    expect(scrollContainer).toBeTruthy()
    expect(scrollContainer?.className).toContain('max-h-[500px]')
    expect(scrollContainer?.className).toContain('overflow-y-auto')
  })

  it('uses the label area as drag handle and does not toggle visibility on label click', async () => {
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

    const labelHandle = await screen.findByText('名称')
    fireEvent.click(labelHandle)

    expect(recordedKeys).toEqual([])
  })

  it('renders reset-column action inside column settings and reports clicks', async () => {
    const callSequence: string[] = []

    render(
      <ListToolbarActions
        tableSize="small"
        onTableSizeChange={() => undefined}
        onClearColumnSort={() => {
          callSequence.push('clear-column')
        }}
        clearColumnSortDisabled={false}
        onReload={() => {
          callSequence.push('reload')
        }}
        columnSettingOptions={[]}
        selectedColumnKeys={[]}
        onSelectedColumnKeysChange={() => undefined}
      />
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons[0].getAttribute('aria-label')).toBe('刷新')
    expect(buttons[2].getAttribute('aria-label')).toBe('列设置')

    fireEvent.click(buttons[2])
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '重置列排序' })).toBeTruthy()
    })
    fireEvent.click(screen.getByRole('button', { name: '重置列排序' }))
    fireEvent.click(buttons[0])

    expect(callSequence).toEqual(['clear-column', 'reload'])
  })

  it('hides the reload button when configured for right-side controls only', () => {
    render(
      <ListToolbarActions
        showReload={false}
        tableSize="small"
        onTableSizeChange={() => undefined}
        onReload={() => undefined}
        columnSettingOptions={[]}
        selectedColumnKeys={[]}
        onSelectedColumnKeysChange={() => undefined}
      />
    )

    expect(screen.queryByRole('button', { name: '刷新' })).toBeNull()
    expect(screen.getByRole('button', { name: '密度' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '列设置' })).toBeTruthy()
  })
})
