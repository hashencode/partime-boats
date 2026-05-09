import { useCallback, useMemo, useState } from 'react'
import type { TablePaginationConfig } from 'antd'

export type StandardPaginationConfig = {
  defaultPageSize?: number
  maxPageSize?: number
  pageSizeOptions?: number[]
}

type UseStandardPaginationOptions = StandardPaginationConfig & {
  total: number
}

type StandardPaginationResult = {
  current: number
  pageSize: number
  pagination: TablePaginationConfig
  resetPage: () => void
}

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const toPositiveInteger = (value: number, fallback: number) => {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}

const clampPageSize = (nextPageSize: number, maxPageSize: number, defaultPageSize: number) => {
  return Math.min(toPositiveInteger(nextPageSize, defaultPageSize), maxPageSize)
}

const getMaxPage = (total: number, pageSize: number) => {
  if (total <= 0) {
    return 1
  }

  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
}

export const useStandardPagination = ({
  total,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  maxPageSize = DEFAULT_MAX_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: UseStandardPaginationOptions): StandardPaginationResult => {
  const safeDefaultPageSize = clampPageSize(defaultPageSize, maxPageSize, DEFAULT_PAGE_SIZE)
  const safePageSizeOptions = useMemo(() => {
    const merged = new Set(
      pageSizeOptions
        .map((value) => toPositiveInteger(value, safeDefaultPageSize))
        .filter((value) => value <= maxPageSize)
    )
    merged.add(safeDefaultPageSize)
    return [...merged].sort((a, b) => a - b)
  }, [maxPageSize, pageSizeOptions, safeDefaultPageSize])

  const [requestedPage, setRequestedPage] = useState(1)
  const [pageSize, setPageSize] = useState(safeDefaultPageSize)

  const current = useMemo(
    () => {
      const maxPage = getMaxPage(total, pageSize)
      return Math.min(Math.max(toPositiveInteger(requestedPage, 1), 1), maxPage)
    },
    [pageSize, requestedPage, total]
  )

  const resetPage = useCallback(() => {
    setRequestedPage(1)
  }, [])

  const pagination = useMemo<TablePaginationConfig>(
    () => ({
      current,
      pageSize,
      total,
      size: 'middle',
      showQuickJumper: true,
      showSizeChanger: true,
      pageSizeOptions: safePageSizeOptions,
      onChange: (nextPage, nextPageSize) => {
        const normalizedPageSize = clampPageSize(
          nextPageSize ?? pageSize,
          maxPageSize,
          safeDefaultPageSize
        )

        setPageSize(normalizedPageSize)
        setRequestedPage(normalizedPageSize === pageSize ? nextPage : 1)
      },
    }),
    [current, maxPageSize, pageSize, safeDefaultPageSize, safePageSizeOptions, total]
  )

  return {
    current,
    pageSize,
    pagination,
    resetPage,
  }
}
