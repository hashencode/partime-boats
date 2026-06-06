import { describe, expect, it } from '@rstest/core'
import type { ColumnGroupType, ColumnType } from 'antd/es/table'
import {
  compareDateSortValue,
  compareNumberSortValue,
  compareTextSortValue,
  createNumberSorter,
  enableMultipleColumnSorting,
} from './table-sorters'

const isColumnGroup = <TItem,>(
  column: ColumnType<TItem> | ColumnGroupType<TItem>
): column is ColumnGroupType<TItem> => {
  return 'children' in column
}

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

  it('should upgrade function sorters to multiple sorters without changing compare behavior', () => {
    const compare = createNumberSorter<{ value?: string | number | null }>((item) => item.value)
    const [column] = enableMultipleColumnSorting([
      {
        key: 'value',
        title: '值',
        dataIndex: 'value',
        sorter: compare,
      },
    ])

    expect(typeof column.sorter).toBe('object')
    expect(column.sorter).toMatchObject({
      compare,
      multiple: 1,
    })
  })

  it('should clone shared header cell props for sortable columns', () => {
    const sharedHeaderCellProps = {
      style: {
        whiteSpace: 'nowrap' as const,
      },
    }
    const [column] = enableMultipleColumnSorting([
      {
        key: 'value',
        title: '值',
        dataIndex: 'value',
        sorter: createNumberSorter<{ value?: string | number | null }>((item) => item.value),
        onHeaderCell: () => sharedHeaderCellProps,
      },
    ])

    const firstHeaderCell = column.onHeaderCell?.(column as never)
    const secondHeaderCell = column.onHeaderCell?.(column as never)

    expect(firstHeaderCell).not.toBe(sharedHeaderCellProps)
    expect(secondHeaderCell).not.toBe(sharedHeaderCellProps)
    expect(firstHeaderCell).not.toBe(secondHeaderCell)
    expect(firstHeaderCell?.style).not.toBe(sharedHeaderCellProps.style)
    expect(secondHeaderCell?.style).not.toBe(sharedHeaderCellProps.style)
  })

  it('should preserve existing multiple priorities and recurse into grouped columns', () => {
    const [groupColumn] = enableMultipleColumnSorting([
      {
        key: 'group',
        title: '分组',
        children: [
          {
            key: 'name',
            title: '名称',
            dataIndex: 'name',
            sorter: {
              compare: createNumberSorter<{ name?: string | number | null }>((item) => item.name),
              multiple: 3,
            },
          },
        ],
      },
    ])

    expect(isColumnGroup(groupColumn) ? groupColumn.children[0]?.sorter : undefined).toMatchObject({
      multiple: 3,
    })
  })
})
