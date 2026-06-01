import { describe, expect, it } from '@rstest/core'
import {
  compareDateSortValue,
  compareNumberSortValue,
  compareTextSortValue,
  createNumberSorter,
} from './table-sorters'

describe('table-sorters', () => {
  it('should sort text values with numeric-aware comparison', () => {
    expect(compareTextSortValue('港口2', '港口10')).toBeLessThan(0)
    expect(compareTextSortValue('Alpha', 'alpha')).toBe(0)
  })

  it('should sort numeric values before non-numeric fallback values', () => {
    const sorter = createNumberSorter<{ value?: string | number | null }>((item) => item.value)

    expect(sorter({ value: '2' }, { value: '10' })).toBeLessThan(0)
    expect(sorter({ value: 10 }, { value: 'A-1' })).toBeLessThan(0)
    expect(compareNumberSortValue(undefined, null)).toBe(0)
  })

  it('should sort valid dates before invalid values and fall back to text when needed', () => {
    expect(compareDateSortValue('2026-06-01 08:00:00', '2026-06-02 08:00:00')).toBeLessThan(0)
    expect(compareDateSortValue('2026-06-01', 'not-a-date')).toBeLessThan(0)
    expect(compareDateSortValue('港口2', '港口10')).toBeLessThan(0)
  })
})
