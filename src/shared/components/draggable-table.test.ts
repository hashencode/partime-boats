import { describe, expect, it } from '@rstest/core'
import {
  normalizeDragIdentifier,
  reorderTableData,
} from './draggable-table'
import { applyPersistedOrderToKeys, mergePersistedOrder } from '../hooks/use-list-view-preferences'

describe('reorderTableData', () => {
  it('should move the dragged row to the target position', () => {
    const rows = [
      { id: 1, name: '第一行' },
      { id: 2, name: '第二行' },
      { id: 3, name: '第三行' },
    ]

    expect(reorderTableData(rows, '1', '3', 'id')).toEqual([
      { id: 2, name: '第二行' },
      { id: 3, name: '第三行' },
      { id: 1, name: '第一行' },
    ])
  })

  it('should keep the original order when the target row is missing', () => {
    const rows = [
      { key: 'a', name: 'A' },
      { key: 'b', name: 'B' },
    ]

    expect(reorderTableData(rows, 'a', undefined, 'key')).toBe(rows)
    expect(reorderTableData(rows, 'a', 'missing', 'key')).toBe(rows)
  })
})

describe('normalizeDragIdentifier', () => {
  it('should normalize numeric row keys to strings for sortable ids', () => {
    expect(normalizeDragIdentifier(1)).toBe('1')
    expect(normalizeDragIdentifier(99)).toBe('99')
  })

  it('should keep string row keys stable', () => {
    expect(normalizeDragIdentifier('rule-1')).toBe('rule-1')
    expect(normalizeDragIdentifier(undefined)).toBe('')
  })
})

describe('persisted table order helpers', () => {
  it('applies persisted order to the current result set and appends unseen ids', () => {
    expect(applyPersistedOrderToKeys(['1', '2', '3'], ['3', '1'])).toEqual(['3', '1', '2'])
    expect(applyPersistedOrderToKeys(['2', '4'], ['3', '1'])).toEqual(['2', '4'])
  })

  it('merges a reordered visible subset back into persisted global order', () => {
    expect(mergePersistedOrder(['1', '2', '3', '4'], ['2', '4'], ['4', '2'])).toEqual(['1', '4', '3', '2'])
    expect(mergePersistedOrder([], ['2', '4'], ['4', '2'])).toEqual(['4', '2'])
  })
})
