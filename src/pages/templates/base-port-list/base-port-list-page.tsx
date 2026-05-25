import type { ColumnsType } from 'antd/es/table'
import React, { useMemo } from 'react'
import { DraggableTable } from '../../../shared/components/draggable-table'
import { hasPermission } from '../../../infrastructure/auth/permissions'
import { ListRowActions } from '../../../shared/components/list-row-actions'
import { normalizeApiError, type ApiError } from '../../../infrastructure/http/api-client'
import { useAuth } from '../../../infrastructure/auth/use-auth'
import { LIST_REFRESH_CHANNEL, LIST_REFRESH_EVENT } from '../../../shared/constants/list-refresh-channel'
import {
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
          { title: 'ID', dataIndex: 'id', key: 'id' },
          { title: 'cityName', dataIndex: 'cityName', key: 'cityName' },
          { title: 'countryCode', dataIndex: 'countryCode', key: 'countryCode' },
          { title: 'countryGeoId', dataIndex: 'countryGeoId', key: 'countryGeoId' },
          { title: 'countryName', dataIndex: 'countryName', key: 'countryName' },
          { title: 'maerskGeoLocationId', dataIndex: 'maerskGeoLocationId', key: 'maerskGeoLocationId' },
          { title: 'maerskRkstCode', dataIndex: 'maerskRkstCode', key: 'maerskRkstCode' },
          { title: 'UNCode', dataIndex: 'UNCode', key: 'UNCode' },
          {
            title: 'shippingline',
            dataIndex: 'shippingline',
            key: 'shippingline',
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
      buildTableNode: ({ columns, dataSource, loading, tableClassName, pagination, tableSize, dragSort, virtualScroll }) => (
        <DraggableTable<BasePortRow>
          className={tableClassName}
          rowKey="key"
          rowOrder={dragSort.rowOrder}
          onRowOrderChange={dragSort.onRowOrderChange}
          columnOrder={dragSort.columnOrder}
          onColumnOrderChange={dragSort.onColumnOrderChange}
          bordered
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={pagination}
          size={tableSize}
          scroll={virtualScroll.enabled ? { x: 'max-content', y: virtualScroll.scroll.y } : { x: 'max-content' }}
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
