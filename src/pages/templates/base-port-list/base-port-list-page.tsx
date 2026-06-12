import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useMemo } from 'react'
import { hasPermission } from '../../../infrastructure/auth/permissions'
import { ListRowActions } from '../../../shared/components/list-row-actions'
import { normalizeApiError, type ApiError } from '../../../infrastructure/http/api-client'
import { useAuth } from '../../../infrastructure/auth/use-auth'
import { LIST_REFRESH_CHANNEL, LIST_REFRESH_EVENT } from '../../../shared/constants/list-refresh-channel'
import {
  createNumberSorter,
  createTextSorter,
  StandardListPageRecipe,
  type StandardListPageSpec,
} from '../../../shared/template-kit/list'
import {
  fetchBasePortList,
  type BasePortItem,
} from './api'

void React

type BasePortFilterValues = Record<string, never>
type BasePortRequestFilters = Record<string, never>

type BasePortRow = BasePortItem & {
  key: string
  countryName: string
  maerskGeoLocationId: string
  maerskRkstCode: string
  UNCode: string
  shippingline: string
}

type BasePortListResponse = {
  data: BasePortRow[]
}

const PAGE_TITLE = '基础端口列表'
const TABLE_ID = 'base-port-list'
const FORM_ROUTE = '/get_base_list/form'

// 操作列固定宽度：查看 2 字 28px + Divider 13px + 修改 2 字 28px + 余量 16px = 85px，向上固化为 96px。
const ACTION_COLUMN_WIDTH = 96
// 非操作列固定宽度已按项目级规则校准：
// 1. 以当前列表前 20 条数据的 90 分位内容宽度为样本，并同时校验表头单行显示；
// 2. 最终宽度显式计入左右 padding 与额外 16px 安全余量；
// 3. 单列宽度上限 220px，操作列继续使用独立固定宽度规则。
const BASE_PORT_TABLE_COLUMN_WIDTHS = {
  id: 64,
  cityName: 128,
  countryCode: 120,
  countryGeoId: 152,
  countryName: 128,
  maerskGeoLocationId: 184,
  maerskRkstCode: 152,
  UNCode: 104,
  shippingline: 120,
} as const
const NO_WRAP_HEADER_CELL_PROPS = {
  style: {
    whiteSpace: 'nowrap' as const,
  },
}

const toBasePortRow = (item: BasePortItem): BasePortRow => ({
  ...item,
  key: String(item.id),
  countryName: item.countryName ?? '',
  maerskGeoLocationId: item.maerskGeoLocationId ?? '',
  maerskRkstCode: item.maerskRkstCode ?? '',
  UNCode: item.UNCode ?? '',
  shippingline: item.shippingline ?? '',
})

export const BasePortListPage = () => {
  const { role } = useAuth()
  const canWrite = hasPermission(role, 'form.write')

  const spec = useMemo<
    StandardListPageSpec<BasePortFilterValues, BasePortRequestFilters, BasePortListResponse, BasePortRow, ApiError>
  >(
    () => ({
      paginationMode: 'local',
      pageTitle: PAGE_TITLE,
      tableId: TABLE_ID,
      formRoute: FORM_ROUTE,
      initialFilters: {},
      toFilters: () => ({}),
      request: async () => {
        const rows = (await fetchBasePortList())
          .sort((left, right) => left.id - right.id)
          .map(toBasePortRow)

        return { data: rows }
      },
      selectItems: (response) => response?.data ?? [],
      mapError: normalizeApiError,
      refreshChannel: {
        channelName: LIST_REFRESH_CHANNEL,
        eventType: LIST_REFRESH_EVENT.REFRESH_LIST,
      },
      stateCopy: {
        loadingTitle: '基础端口列表加载中，请稍候。',
        errorTitle: '基础端口列表加载失败',
        errorDescription: '请求失败，请稍后重试。',
        errorActionLabel: '重新加载',
        emptyTitle: '暂无基础端口数据',
        emptyDescription: '当前列表还没有基础端口记录。',
        emptyActionLabel: '重新加载',
      },
      filterFields: [],
      buildColumns: ({ openFormPage }) =>
        [
          {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: BASE_PORT_TABLE_COLUMN_WIDTHS.id,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createNumberSorter((record) => record.id),
          },
          {
            title: 'cityName',
            dataIndex: 'cityName',
            key: 'cityName',
            width: BASE_PORT_TABLE_COLUMN_WIDTHS.cityName,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.cityName),
          },
          {
            title: 'countryCode',
            dataIndex: 'countryCode',
            key: 'countryCode',
            width: BASE_PORT_TABLE_COLUMN_WIDTHS.countryCode,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.countryCode),
          },
          {
            title: 'countryGeoId',
            dataIndex: 'countryGeoId',
            key: 'countryGeoId',
            width: BASE_PORT_TABLE_COLUMN_WIDTHS.countryGeoId,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.countryGeoId),
          },
          {
            title: 'countryName',
            dataIndex: 'countryName',
            key: 'countryName',
            width: BASE_PORT_TABLE_COLUMN_WIDTHS.countryName,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.countryName),
          },
          {
            title: 'maerskGeoLocationId',
            dataIndex: 'maerskGeoLocationId',
            key: 'maerskGeoLocationId',
            width: BASE_PORT_TABLE_COLUMN_WIDTHS.maerskGeoLocationId,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.maerskGeoLocationId),
          },
          {
            title: 'maerskRkstCode',
            dataIndex: 'maerskRkstCode',
            key: 'maerskRkstCode',
            width: BASE_PORT_TABLE_COLUMN_WIDTHS.maerskRkstCode,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.maerskRkstCode),
          },
          {
            title: 'UNCode',
            dataIndex: 'UNCode',
            key: 'UNCode',
            width: BASE_PORT_TABLE_COLUMN_WIDTHS.UNCode,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.UNCode),
          },
          {
            title: 'shippingline',
            dataIndex: 'shippingline',
            key: 'shippingline',
            width: BASE_PORT_TABLE_COLUMN_WIDTHS.shippingline,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.shippingline),
            render: (value: string) => value || '-',
          },
          {
            title: '操作',
            key: 'operation',
            width: ACTION_COLUMN_WIDTH,
            fixed: 'right',
            render: (_, record) => (
              <ListRowActions
                actions={[
                  {
                    key: 'view',
                    label: '查看',
                    onClick: () => openFormPage('readonly', record.key),
                  },
                  {
                    key: 'edit',
                    label: '修改',
                    visible: canWrite,
                    onClick: () => openFormPage('modify', record.key),
                  },
                ]}
              />
            ),
          },
        ] satisfies ColumnsType<BasePortRow>,
      buildTableNode: ({ columns, dataSource, loading, tableClassName, pagination, tableSize }) => (
        <Table<BasePortRow>
          className={tableClassName}
          rowKey="key"
          bordered
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={pagination}
          size={tableSize}
          scroll={{ x: 'max-content' }}
        />
      ),
      createAction: canWrite
        ? {
            label: '新增端口',
          }
        : undefined,
    }),
    [canWrite]
  )

  return <StandardListPageRecipe spec={spec} />
}
