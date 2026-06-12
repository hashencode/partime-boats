import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'
import { normalizeApiError, type ApiError } from '../../../infrastructure/http/api-client'
import { toArrayOrEmpty } from '../../../infrastructure/http/legacy-envelope'
import {
  createDateSorter,
  createNumberSorter,
  createTextSorter,
  StandardListPageRecipe,
  type StandardListPageSpec,
  type TemplateListFilterField,
} from '../../../shared/template-kit/list'
import {
  fetchBookAccountList,
  type BookAccountItem,
  type BookAccountListFilters,
} from './api'

void React

type BookAccountFilterValues = {
  account_type?: string
}

type BookAccountRow = BookAccountItem & {
  key: string
  customer_code: string
  is_refresh_use_label: string
  update_time: string
}

type BookAccountPageResponse = {
  data: BookAccountRow[]
  total: number
  current: number
  size: number
}

const PAGE_TITLE = '订舱账号列表'
const CARD_TITLE = '订舱账号列表'
const TABLE_ID = 'book-account-list'
// 非操作列固定宽度已按项目级规则校准：
// 1. 以当前列表前 20 条数据的 90 分位内容宽度为样本，并同时校验表头单行显示；
// 2. 最终宽度显式计入左右 padding 与额外 16px 安全余量；
// 3. 单列宽度上限 220px。
const BOOK_ACCOUNT_TABLE_COLUMN_WIDTHS = {
  account: 112,
  customer_code: 128,
  is_refresh_use_label: 120,
  update_time: 176,
} as const
const NO_WRAP_HEADER_CELL_PROPS = {
  style: {
    whiteSpace: 'nowrap' as const,
  },
}

const toFilters = (values: BookAccountFilterValues): BookAccountListFilters => ({
  account_type: values.account_type?.trim() || undefined,
})

const formatRefreshUse = (value?: number | string | null) => {
  if (Number(value) === 0) return '否'
  if (Number(value) === 1) return '是'
  return ''
}

const formatRow = (item: BookAccountItem, index: number): BookAccountRow => ({
  ...item,
  key: `${item.account ?? 'book-account'}-${item.update_time ?? 'no-time'}-${index}`,
  customer_code: item.customer_code ?? '',
  is_refresh_use_label: formatRefreshUse(item.is_refresh_use),
  update_time: item.update_time ? dayjs(item.update_time).format('YYYY-MM-DD HH:mm:ss') : '',
})

export const BookAccountListPage = () => {
  const filterFields = useMemo<TemplateListFilterField<BookAccountFilterValues>[]>(
    () => [
      {
        type: 'input',
        name: 'account_type',
        label: '账号分组',
        inputProps: { placeholder: '请输入账号分组' },
      },
    ],
    []
  )

  const spec = useMemo<
    StandardListPageSpec<BookAccountFilterValues, BookAccountListFilters, BookAccountPageResponse, BookAccountRow, ApiError>
  >(
    () => ({
      pageTitle: PAGE_TITLE,
      cardTitle: CARD_TITLE,
      tableId: TABLE_ID,
      formRoute: '/book_account_list/form',
      initialFilters: {},
      toFilters,
      buildRequestFilters: ({ filters, current, pageSize }) => ({
        ...filters,
        page: current,
        per_page: pageSize,
      }),
      request: async (filters) => {
        const response = await fetchBookAccountList(filters)
        const rows = toArrayOrEmpty(response.data).map(formatRow)
        return {
          data: rows,
          total: response.pagination?.total ?? rows.length,
          current: filters.page ?? 1,
          size: filters.per_page ?? 100,
        }
      },
      selectItems: (response) => response?.data ?? [],
      mapError: normalizeApiError,
      stateCopy: {
        loadingTitle: '正在加载订舱账号列表...',
        errorTitle: '订舱账号列表加载失败',
        errorDescription: '请检查网络连接或稍后重试。',
        errorActionLabel: '重试',
        partialTitle: '订舱账号列表返回不完整',
        partialDescription: '请重新加载完整数据。',
        partialActionLabel: '重新加载',
        emptyTitle: '当前筛选条件下暂无订舱账号',
        emptyDescription: '可以重置筛选后重新查询。',
        emptyActionLabel: '重置筛选',
      },
      filterFields,
      buildColumns: () =>
        [
          {
            title: '账号',
            dataIndex: 'account',
            key: 'account',
            align: 'center',
            width: BOOK_ACCOUNT_TABLE_COLUMN_WIDTHS.account,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.account),
          },
          {
            title: '客户代码',
            dataIndex: 'customer_code',
            key: 'customer_code',
            align: 'center',
            width: BOOK_ACCOUNT_TABLE_COLUMN_WIDTHS.customer_code,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.customer_code),
          },
          {
            title: '是否刷新使用',
            dataIndex: 'is_refresh_use_label',
            key: 'is_refresh_use_label',
            align: 'center',
            width: BOOK_ACCOUNT_TABLE_COLUMN_WIDTHS.is_refresh_use_label,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createNumberSorter((record) => record.is_refresh_use),
          },
          {
            title: '更新时间',
            dataIndex: 'update_time',
            key: 'update_time',
            align: 'center',
            width: BOOK_ACCOUNT_TABLE_COLUMN_WIDTHS.update_time,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createDateSorter((record) => record.update_time),
          },
        ] satisfies ColumnsType<BookAccountRow>,
      buildTableNode: ({ columns, dataSource, loading, tableClassName, pagination, tableSize }) => {
        return (
          <Table<BookAccountRow>
            rowKey="key"
            className={tableClassName}
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            pagination={pagination}
            size={tableSize}
            scroll={{ x: 'max-content' }}
          />
        )
      },
    }),
    [filterFields]
  )

  return <StandardListPageRecipe spec={spec} />
}
