import { Button, Dropdown, Popconfirm, Space, Table, Typography, message, theme } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import ExportJsonExcel from 'js-export-excel'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { hasPermission } from '../../../infrastructure/auth/permissions'
import { useAuth } from '../../../infrastructure/auth/use-auth'
import { normalizeApiError, type ApiError } from '../../../infrastructure/http/api-client'
import {
  StandardListPageRecipe,
  type StandardListPageSpec,
  type TemplateListFilterField,
} from '../../../shared/template-kit/list'
import { fetchEndPortOptions, fetchStartPortOptions } from '../msk-query-list/api'
import { resolveHostByDestination } from '../msk-query-list/host-map'
import {
  fetchRemindList,
  fetchShippingLineOptions,
  invalidateRemindList,
  type RemindListFilters,
  type RemindListItem,
  type RemindListResponse,
} from './api'

void React

type RemindSearchValues = {
  origincity_name?: string
  destinationcity_name?: string
  boxcode?: string
  shipping_line?: string
  insert_datetime?: Dayjs
}

type RemindRow = RemindListItem & {
  key: number
  ship_name: string
  is_use_label: '是' | '否' | '-'
}

type RemindPageResponse = {
  data: RemindRow[]
  total: number
  current: number
  size: number
}

const PAGE_TITLE = '提醒列表'
const CARD_TITLE = '提醒列表'
const TABLE_ID = 'remind-list'
const EXPORT_ALL_PAGE_SIZE = 10000

const BOX_TYPE_OPTIONS = ['20DRY', '40HDRY', '40NOR', '45HDRY'].map((value) => ({
  label: value,
  value,
}))

const TABLE_TITLE = ['启运港', '目的港', '航线', '箱型', '开航时间', '基础运价', '总价', '来源', '查询时间', '是否作废', '船名航次', 'price_id']
const TABLE_FILTER = ['portofloading', 'portofdischarge', 'ship_name', 'boxcode', 'departuredate', 'oceanfreightamount', 'total_amount', 'source', 'insert_datetime', 'is_use', 'ship_info', 'price_id']

// 操作列固定宽度：单个“作废”按钮 2 个汉字按 28px 计算，
// 无分隔与并列按钮，仅加默认余量 16px，总计 44px；结合表格单元格左右留白，固化为 60px。
const ACTION_COLUMN_WIDTH = 60

const toFilters = (values: RemindSearchValues): RemindListFilters => ({
  origincity_name: values.origincity_name,
  destinationcity_name: values.destinationcity_name,
  boxcode: values.boxcode,
  shipping_line: values.shipping_line,
  insert_datetime: dayjs.isDayjs(values.insert_datetime)
    ? values.insert_datetime.format('YYYY-MM-DD HH:mm:ss')
    : undefined,
})

const toNumber = (value?: number | string) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

const toTimestamp = (value?: string) => {
  if (!value) return 0
  const parsed = dayjs(value).valueOf()
  return Number.isNaN(parsed) ? 0 : parsed
}

const mapRow = (item: RemindListItem): RemindRow => ({
  ...item,
  key: item.id,
  ship_name: resolveHostByDestination(item.portofdischarge) ?? '',
  is_use_label: item.is_use === 1 ? '是' : item.is_use === 0 ? '否' : '-',
})

const buildExportRows = (rows: RemindRow[]) =>
  rows.map((item) => ({
    portofloading: item.portofloading,
    portofdischarge: item.portofdischarge,
    ship_name: item.ship_name,
    boxcode: item.boxcode,
    departuredate: item.departuredate,
    oceanfreightamount: item.oceanfreightamount,
    total_amount: item.total_amount,
    source: item.source,
    insert_datetime: item.insert_datetime,
    is_use: item.is_use_label,
    ship_info: item.ship_info,
    price_id: item.price_id,
  }))

const exportExcel = (rows: RemindRow[]) => {
  const exporter = new ExportJsonExcel({
    fileName: '订单列表',
    datas: [
      {
        sheetData: buildExportRows(rows),
        sheetName: 'sheet',
        sheetFilter: TABLE_FILTER,
        sheetHeader: TABLE_TITLE,
      },
    ],
  })
  exporter.saveExcel()
}

export const RemindListPage = () => {
  const { role } = useAuth()
  const { token } = theme.useToken()
  const canWrite = hasPermission(role, 'form.write')
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [exportAllLoading, setExportAllLoading] = useState(false)
  const selectedRowKeysRef = useRef<number[]>([])
  const currentRowsRef = useRef<RemindRow[]>([])
  const latestFiltersRef = useRef<RemindListFilters>({})
  const reloadRef = useRef<() => Promise<void>>(async () => {})

  const filterFields = useMemo<TemplateListFilterField<RemindSearchValues>[]>(
    () => [
      {
        type: 'select',
        name: 'origincity_name',
        label: '起运',
        selectProps: { showSearch: true, allowClear: true, placeholder: '请选择起运港' },
        optionsLoader: async ({ signal }) => {
          if (signal.aborted) return []
          const data = await fetchStartPortOptions(1)
          return data.map((item) => ({ label: item, value: item }))
        },
      },
      {
        type: 'select',
        name: 'destinationcity_name',
        label: '目的',
        selectProps: { showSearch: true, allowClear: true, placeholder: '请选择目的港' },
        optionsLoader: async ({ signal }) => {
          if (signal.aborted) return []
          const data = await fetchEndPortOptions(1)
          return data.map((item) => ({ label: item, value: item }))
        },
      },
      {
        type: 'select',
        name: 'boxcode',
        label: '箱型',
        options: BOX_TYPE_OPTIONS,
        selectProps: { showSearch: true, allowClear: true, placeholder: '请选择箱型' },
      },
      {
        type: 'select',
        name: 'shipping_line',
        label: '航线',
        selectProps: { showSearch: true, allowClear: true, placeholder: '请选择航线' },
        optionsLoader: async ({ signal }) => {
          if (signal.aborted) return []
          const data = await fetchShippingLineOptions()
          return data.map((item) => ({ label: item, value: item }))
        },
      },
      {
        type: 'date',
        name: 'insert_datetime',
        label: '选择时间',
        datePickerProps: { showTime: true, placeholder: '请选择时间' },
      },
    ],
    []
  )

  const handleInvalidate = useCallback(
    async (ids: string) => {
      await invalidateRemindList({ ids })
      message.success('作废成功')
      selectedRowKeysRef.current = []
      setSelectedRowKeys([])
      await reloadRef.current()
    },
    []
  )

  const handleExportAll = useCallback(async () => {
    setExportAllLoading(true)
    try {
      const response = await fetchRemindList({
        ...latestFiltersRef.current,
        page: 1,
        per_page: Math.max(EXPORT_ALL_PAGE_SIZE, currentRowsRef.current.length),
      })
      let rows = (response.data ?? []).map(mapRow)
      if (latestFiltersRef.current.shipping_line) {
        rows = rows.filter((item) => item.ship_name === latestFiltersRef.current.shipping_line)
      }
      exportExcel(rows)
      message.success('导出成功')
    } finally {
      setExportAllLoading(false)
    }
  }, [])

  const requestList = useCallback(async (filters: RemindListFilters): Promise<RemindPageResponse> => {
    latestFiltersRef.current = filters
    const response: RemindListResponse = await fetchRemindList(filters)
    let rows = (response.data ?? []).map(mapRow)

    if (filters.shipping_line) {
      rows = rows.filter((item) => item.ship_name === filters.shipping_line)
    }

    return {
      data: rows,
      total: filters.shipping_line ? rows.length : response.total ?? rows.length,
      current: filters.page ?? 1,
      size: (filters.per_page ?? rows.length) || 10,
    }
  }, [])

  const spec = useMemo<
    StandardListPageSpec<RemindSearchValues, RemindListFilters, RemindPageResponse, RemindRow, ApiError>
  >(
    () => ({
      pageTitle: PAGE_TITLE,
      cardTitle: CARD_TITLE,
      tableId: TABLE_ID,
      formRoute: '/get_remined_list/form',
      initialFilters: {},
      pagination: {
        defaultCurrent: 1,
        defaultPageSize: 10,
      },
      toFilters,
      buildRequestFilters: ({ filters, current, pageSize }) => ({
        ...filters,
        page: current,
        per_page: pageSize,
      }),
      request: requestList,
      selectItems: (response) => response?.data ?? [],
      mapError: normalizeApiError,
      filterFields,
      toolbarExtra: (
        <Dropdown
          menu={{
            items: [
              { key: 'current', label: '导出当前页' },
              { key: 'all', label: exportAllLoading ? '正在导出' : '导出全部页', disabled: exportAllLoading },
            ],
            onClick: ({ key }) => {
              if (key === 'current') {
                exportExcel(currentRowsRef.current)
                return
              }
              void handleExportAll()
            },
          }}
        >
          <Button>
            <Space>Excel导出</Space>
          </Button>
        </Dropdown>
      ),
      buildColumns: ({ reload }) => {
        reloadRef.current = reload

        return [
          {
            title: '启运港',
            dataIndex: 'portofloading',
            key: 'portofloading',
            width: 120,
          },
          {
            title: '目的港',
            dataIndex: 'portofdischarge',
            key: 'portofdischarge',
            width: 120,
          },
          {
            title: '航线',
            dataIndex: 'ship_name',
            key: 'ship_name',
            width: 120,
          },
          {
            title: '箱型',
            dataIndex: 'boxcode',
            key: 'boxcode',
            width: 80,
          },
          {
            title: '开航时间',
            dataIndex: 'departuredate',
            key: 'departuredate',
            width: 100,
            sorter: (left, right) => toTimestamp(left.departuredate) - toTimestamp(right.departuredate),
          },
          {
            title: '基础运价',
            dataIndex: 'oceanfreightamount',
            key: 'oceanfreightamount',
            width: 100,
            sorter: (left, right) => (toNumber(left.oceanfreightamount) ?? 0) - (toNumber(right.oceanfreightamount) ?? 0),
          },
          {
            title: '总价',
            dataIndex: 'total_amount',
            key: 'total_amount',
            width: 100,
            sorter: (left, right) => (toNumber(left.total_amount) ?? 0) - (toNumber(right.total_amount) ?? 0),
          },
          {
            title: '来源',
            dataIndex: 'source',
            key: 'source',
            width: 120,
          },
          {
            title: '查询时间',
            dataIndex: 'insert_datetime',
            key: 'insert_datetime',
            width: 160,
          },
          {
            title: '是否作废',
            dataIndex: 'is_use_label',
            key: 'is_use_label',
            width: 100,
          },
          {
            title: '船名航次',
            dataIndex: 'ship_info',
            key: 'ship_info',
            width: 140,
          },
          {
            title: 'price_id',
            dataIndex: 'price_id',
            key: 'price_id',
            width: 100,
          },
          {
            title: '操作',
            dataIndex: 'operation',
            key: 'operation',
            width: ACTION_COLUMN_WIDTH,
            fixed: 'right',
            render: (_, record) => {
              if (!canWrite) return null
              return (
                <Popconfirm
                  title="确认要作废吗？"
                  okText="是"
                  cancelText="否"
                  onConfirm={async () => {
                    if (record.is_use_label === '是') {
                      message.error('请勿重复作废')
                      return
                    }
                    await handleInvalidate(String(record.id))
                  }}
                >
                  <Button type="link" className="!px-0">
                    作废
                  </Button>
                </Popconfirm>
              )
            },
          },
        ] as ColumnsType<RemindRow>
      },
      buildTableNode: ({ columns, dataSource, loading, tableClassName, pagination, tableSize }) => {
        currentRowsRef.current = dataSource
        return (
          <Table<RemindRow>
            className={tableClassName}
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            size={tableSize}
            pagination={pagination}
            rowSelection={
              canWrite
                ? {
                    selectedRowKeys: selectedRowKeysRef.current,
                    onChange: (keys) => {
                      const nextKeys = keys as number[]
                      selectedRowKeysRef.current = nextKeys
                      setSelectedRowKeys(nextKeys)
                    },
                    columnWidth: 50,
                  }
                : undefined
            }
            scroll={{ x: 1600 }}
          />
        )
      },
      stateCopy: {
        loadingTitle: '提醒列表加载中',
        emptyTitle: '暂无提醒数据',
        emptyDescription: '当前筛选条件下没有提醒记录，请调整筛选条件后重试。',
        emptyActionLabel: '重置筛选',
        errorTitle: '提醒列表加载失败',
        errorDescription: '列表接口请求失败，请稍后重试。',
        errorActionLabel: '重新加载',
        partialTitle: '当前仅返回部分提醒数据',
        partialDescription: '部分提醒数据可能延迟返回，请稍后重试。',
        partialActionLabel: '重载完整数据',
      },
    }),
    [canWrite, exportAllLoading, filterFields, handleExportAll, handleInvalidate, requestList]
  )

  return (
    <>
      <StandardListPageRecipe spec={spec} />
      {canWrite && selectedRowKeys.length > 0 ? (
        <div
          className="fixed right-0 bottom-0 left-0 z-[11] px-6 py-3"
          style={{
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgElevated,
          }}
        >
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3">
            <Typography.Text>
              已选择 <span className="font-medium">{selectedRowKeys.length}</span> 项
            </Typography.Text>
            <Space>
              <Popconfirm
                title="确认要批量作废吗？"
                okText="是"
                cancelText="否"
                onConfirm={async () => {
                  if (selectedRowKeysRef.current.length === 0) {
                    message.error('请选择要作废的数据')
                    return
                  }
                  await handleInvalidate(selectedRowKeysRef.current.join(', '))
                }}
              >
                <Button type="primary">批量作废</Button>
              </Popconfirm>
            </Space>
          </div>
        </div>
      ) : null}
    </>
  )
}
