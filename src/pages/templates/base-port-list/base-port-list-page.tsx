import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useMemo } from 'react'
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
          { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
          { title: 'cityName', dataIndex: 'cityName', key: 'cityName', width: 140 },
          { title: 'countryCode', dataIndex: 'countryCode', key: 'countryCode', width: 140 },
          { title: 'countryGeoId', dataIndex: 'countryGeoId', key: 'countryGeoId', width: 140 },
          { title: 'countryName', dataIndex: 'countryName', key: 'countryName', width: 160 },
          { title: 'maerskGeoLocationId', dataIndex: 'maerskGeoLocationId', key: 'maerskGeoLocationId', width: 180 },
          { title: 'maerskRkstCode', dataIndex: 'maerskRkstCode', key: 'maerskRkstCode', width: 160 },
          { title: 'UNCode', dataIndex: 'UNCode', key: 'UNCode', width: 120 },
          {
            title: 'shippingline',
            dataIndex: 'shippingline',
            key: 'shippingline',
            width: 200,
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
      buildTableNode: ({ columns, dataSource, loading, tableClassName, pagination, tableSize, virtualScroll }) => (
        <Table<BasePortRow>
          className={tableClassName}
          rowKey="key"
          bordered
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={pagination}
          size={tableSize}
          virtual={virtualScroll.enabled}
          scroll={virtualScroll.enabled ? { x: 1460, y: virtualScroll.scroll.y } : { x: 1460 }}
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
