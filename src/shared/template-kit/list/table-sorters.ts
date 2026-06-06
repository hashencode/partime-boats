import dayjs from 'dayjs'
import type { ColumnsType, ColumnType, ColumnGroupType } from 'antd/es/table'

const normalizeTextValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  return String(value).trim()
}

const parseFiniteNumber = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const parseDateTimestamp = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.valueOf() : undefined
}

export const compareTextSortValue = (left?: string | number | null, right?: string | number | null) => {
  return normalizeTextValue(left).localeCompare(normalizeTextValue(right), 'zh-Hans-CN', {
    numeric: true,
    sensitivity: 'base',
  })
}

export const compareNumberSortValue = (left?: string | number | null, right?: string | number | null) => {
  const leftNumber = parseFiniteNumber(left)
  const rightNumber = parseFiniteNumber(right)

  if (leftNumber !== undefined && rightNumber !== undefined) {
    return leftNumber - rightNumber
  }

  if (leftNumber !== undefined) {
    return -1
  }

  if (rightNumber !== undefined) {
    return 1
  }

  return compareTextSortValue(left, right)
}

export const compareDateSortValue = (left?: string | number | null, right?: string | number | null) => {
  const leftTimestamp = parseDateTimestamp(left)
  const rightTimestamp = parseDateTimestamp(right)

  if (leftTimestamp !== undefined && rightTimestamp !== undefined) {
    return leftTimestamp - rightTimestamp
  }

  if (leftTimestamp !== undefined) {
    return -1
  }

  if (rightTimestamp !== undefined) {
    return 1
  }

  return compareTextSortValue(left, right)
}

export const createTextSorter =
  <TItem>(pickValue: (item: TItem) => string | number | null | undefined) =>
  (left: TItem, right: TItem) =>
    compareTextSortValue(pickValue(left), pickValue(right))

export const createNumberSorter =
  <TItem>(pickValue: (item: TItem) => string | number | null | undefined) =>
  (left: TItem, right: TItem) =>
    compareNumberSortValue(pickValue(left), pickValue(right))

export const createDateSorter =
  <TItem>(pickValue: (item: TItem) => string | number | null | undefined) =>
  (left: TItem, right: TItem) =>
    compareDateSortValue(pickValue(left), pickValue(right))

const DEFAULT_MULTIPLE_SORT_PRIORITY = 1

const toMultipleSorterConfig = <TItem>(sorter: ColumnType<TItem>['sorter']): ColumnType<TItem>['sorter'] => {
  if (!sorter || sorter === true) {
    return sorter
  }

  if (typeof sorter === 'function') {
    return {
      compare: sorter,
      multiple: DEFAULT_MULTIPLE_SORT_PRIORITY,
    }
  }

  return {
    ...sorter,
    multiple: sorter.multiple ?? DEFAULT_MULTIPLE_SORT_PRIORITY,
  }
}

const cloneHeaderCellProps = <TItem>(onHeaderCell?: ColumnType<TItem>['onHeaderCell']): ColumnType<TItem>['onHeaderCell'] => {
  if (!onHeaderCell) {
    return onHeaderCell
  }

  return (column) => {
    const cell = onHeaderCell(column)
    if (!cell) {
      return cell
    }

    return {
      ...cell,
      style: cell.style ? { ...cell.style } : cell.style,
    }
  }
}

const isColumnGroup = <TItem>(column: ColumnType<TItem> | ColumnGroupType<TItem>): column is ColumnGroupType<TItem> => {
  return 'children' in column
}

export const enableMultipleColumnSorting = <TItem>(columns: ColumnsType<TItem>): ColumnsType<TItem> => {
  return columns.map((column) => {
    if (isColumnGroup(column)) {
      const nextChildren = enableMultipleColumnSorting(column.children)

      if (nextChildren === column.children) {
        return column
      }

      return {
        ...column,
        children: nextChildren,
      }
    }

    const nextSorter = toMultipleSorterConfig(column.sorter)
    const nextOnHeaderCell = column.sorter ? cloneHeaderCellProps(column.onHeaderCell) : column.onHeaderCell

    if (nextSorter === column.sorter && nextOnHeaderCell === column.onHeaderCell) {
      return column
    }

    return {
      ...column,
      sorter: nextSorter,
      onHeaderCell: nextOnHeaderCell,
    }
  })
}
