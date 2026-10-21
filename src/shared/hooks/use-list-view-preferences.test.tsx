import React from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from '@rstest/core'
import { useListViewPreferences } from './use-list-view-preferences'

void React

const TABLE_ID = 'table-view-preferences-test'
const NEW_STORAGE_KEY = `list:table-view-preferences:v1:${TABLE_ID}`
const LEGACY_COLUMN_KEY = `list:table-columns:v1:${TABLE_ID}`

describe('useListViewPreferences', () => {
  it('shows an explicitly introduced column once while preserving later hiding and existing preferences', () => {
    window.localStorage.clear()
    window.localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify({
      density: 'small', visibleColumnKeys: ['name'], columnOrder: ['status', 'name'],
    }))
    const options = { tableId: TABLE_ID, defaultColumnKeys: ['name', 'status', 'list_type'], newColumnKeys: ['list_type'] }
    const first = renderHook(() => useListViewPreferences(options))
    expect(first.result.current.selectedColumnKeys).toEqual(['name', 'list_type'])
    expect(first.result.current.columnOrder).toEqual(['status', 'name', 'list_type'])
    expect(first.result.current.tableSize).toBe('small')
    act(() => first.result.current.setSelectedColumnKeys(['name']))
    first.unmount()
    const second = renderHook(() => useListViewPreferences(options))
    expect(second.result.current.selectedColumnKeys).toEqual(['name'])
  })
  it('migrates legacy column visibility into the unified preferences model', () => {
    window.localStorage.clear()
    window.localStorage.setItem(LEGACY_COLUMN_KEY, JSON.stringify(['name', 'status']))

    const { result } = renderHook(() =>
      useListViewPreferences({
        tableId: TABLE_ID,
        defaultColumnKeys: ['name', 'status', 'updatedAt'],
      })
    )

    expect(result.current.selectedColumnKeys).toEqual(['name', 'status'])
  })

  it('persists column sort changes and clears them independently', () => {
    window.localStorage.clear()
    const { result } = renderHook(() =>
      useListViewPreferences({
        tableId: TABLE_ID,
        defaultColumnKeys: ['name', 'status', 'updatedAt'],
      })
    )

    act(() => {
      result.current.setColumnOrder(['updatedAt', 'name', 'status'])
    })

    expect(result.current.hasCustomColumnOrder).toBe(true)

    act(() => {
      result.current.clearColumnOrder()
    })

    expect(result.current.columnOrder).toEqual(['name', 'status', 'updatedAt'])
    expect(result.current.hasCustomColumnOrder).toBe(false)

    const storedPreferences = JSON.parse(window.localStorage.getItem(NEW_STORAGE_KEY) ?? '{}')
    expect(storedPreferences.columnOrder).toEqual(['name', 'status', 'updatedAt'])
  })
})
