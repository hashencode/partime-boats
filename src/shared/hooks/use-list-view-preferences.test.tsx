import React from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from '@rstest/core'
import { useListViewPreferences } from './use-list-view-preferences'

void React

const TABLE_ID = 'table-view-preferences-test'
const NEW_STORAGE_KEY = `list:table-view-preferences:v1:${TABLE_ID}`
const LEGACY_COLUMN_KEY = `list:table-columns:v1:${TABLE_ID}`
const LEGACY_ROW_ORDER_KEY = `list:table-order:v1:${TABLE_ID}`

describe('useListViewPreferences', () => {
  it('migrates legacy column visibility and row order into the unified preferences model', () => {
    window.localStorage.clear()
    window.localStorage.setItem(LEGACY_COLUMN_KEY, JSON.stringify(['name', 'status']))
    window.localStorage.setItem(LEGACY_ROW_ORDER_KEY, JSON.stringify(['3', '1']))

    const { result } = renderHook(() =>
      useListViewPreferences({
        tableId: TABLE_ID,
        defaultColumnKeys: ['name', 'status', 'updatedAt'],
      })
    )

    expect(result.current.selectedColumnKeys).toEqual(['name', 'status'])
    expect(result.current.rowOrder).toEqual(['3', '1'])
  })

  it('persists column and row sort changes separately and clears them independently', () => {
    window.localStorage.clear()
    const { result } = renderHook(() =>
      useListViewPreferences({
        tableId: TABLE_ID,
        defaultColumnKeys: ['name', 'status', 'updatedAt'],
      })
    )

    act(() => {
      result.current.setColumnOrder(['updatedAt', 'name', 'status'])
      result.current.setRowOrder(['row-2', 'row-1'])
    })

    expect(result.current.hasCustomColumnOrder).toBe(true)
    expect(result.current.hasCustomRowOrder).toBe(true)

    act(() => {
      result.current.clearColumnOrder()
    })

    expect(result.current.columnOrder).toEqual(['name', 'status', 'updatedAt'])
    expect(result.current.hasCustomColumnOrder).toBe(false)
    expect(result.current.rowOrder).toEqual(['row-2', 'row-1'])
    expect(result.current.hasCustomRowOrder).toBe(true)

    act(() => {
      result.current.clearRowOrder()
    })

    expect(result.current.rowOrder).toEqual([])
    expect(result.current.hasCustomRowOrder).toBe(false)

    const storedPreferences = JSON.parse(window.localStorage.getItem(NEW_STORAGE_KEY) ?? '{}')
    expect(storedPreferences.columnOrder).toEqual(['name', 'status', 'updatedAt'])
    expect(storedPreferences.rowOrder).toEqual([])
  })
})
