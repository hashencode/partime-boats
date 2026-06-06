import { Button, Dropdown, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import ExportJsonExcel from 'js-export-excel'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { hasPermission } from '../../../infrastructure/auth/permissions'
import { useAuth } from '../../../infrastructure/auth/use-auth'
import { ListRowActions } from '../../../shared/components/list-row-actions'
import { normalizeApiError, type ApiError } from '../../../infrastructure/http/api-client'
import {
  createPortFilterFields,
  createDateSorter,
  createNumberSorter,
  createShippingLineFilterField,
  createTextSorter,
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
  is_use_label: '已作废' | '未作废' | '-'
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
const AUTO_REFRESH_INTERVAL_MS = 30_000
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
// 非操作列固定宽度已按项目级规则校准：
// 1. 以当前列表前 20 条数据的 90 分位内容宽度为样本，并同时校验表头单行显示；
// 2. 最终宽度显式计入左右 padding 与额外 16px 安全余量；
// 3. 单列宽度上限 220px，操作列继续使用独立固定宽度规则。
const REMIND_TABLE_COLUMN_WIDTHS = {
  portofloading: 88,
  portofdischarge: 112,
  ship_name: 64,
  boxcode: 88,
  departuredate: 176,
  oceanfreightamount: 88,
  total_amount: 72,
  source: 96,
  insert_datetime: 176,
  is_use_label: 88,
  ship_info: 220,
  price_id: 88,
} as const
const NO_WRAP_HEADER_CELL_PROPS = {
  style: {
    whiteSpace: 'nowrap' as const,
  },
}

const toFilters = (values: RemindSearchValues): RemindListFilters => ({
  origincity_name: values.origincity_name,
  destinationcity_name: values.destinationcity_name,
  boxcode: values.boxcode,
  shipping_line: values.shipping_line,
  insert_datetime: dayjs.isDayjs(values.insert_datetime)
    ? values.insert_datetime.format('YYYY-MM-DD HH:mm:ss')
    : undefined,
})

const isRemindInvalidated = (item: Pick<RemindListItem, 'is_use'>) => item.is_use === 0

const mapRow = (item: RemindListItem): RemindRow => ({
  ...item,
  key: item.id,
  ship_name: resolveHostByDestination(item.portofdischarge) ?? '',
  is_use_label: isRemindInvalidated(item) ? '已作废' : item.is_use === 1 ? '未作废' : '-',
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
  const canWrite = hasPermission(role, 'form.write')
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [exportAllLoading, setExportAllLoading] = useState(false)
  const selectedRowKeysRef = useRef<number[]>([])
  const currentRowsRef = useRef<RemindRow[]>([])
  const latestFiltersRef = useRef<RemindListFilters>({})
  const reloadRef = useRef<() => Promise<void>>(async () => {})

  const filterFields = useMemo<TemplateListFilterField<RemindSearchValues>[]>(
    () => [
      ...createPortFilterFields<RemindSearchValues>({
        originName: 'origincity_name',
        destinationName: 'destinationcity_name',
        originLabel: '起运',
        destinationLabel: '目的',
        originPlaceholder: '请选择起运港',
        destinationPlaceholder: '请选择目的港',
        originCacheKey: 'startport:1',
        destinationCacheKey: 'endport:1',
        fetchOriginOptions: () => fetchStartPortOptions(1),
        fetchDestinationOptions: () => fetchEndPortOptions(1),
      }),
      {
        type: 'select',
        name: 'boxcode',
        label: '箱型',
        options: BOX_TYPE_OPTIONS,
        selectProps: { showSearch: true, allowClear: true, placeholder: '请选择箱型' },
      },
      createShippingLineFilterField<RemindSearchValues>({
        name: 'shipping_line',
        cacheKey: 'shippingLine',
        fetchOptions: fetchShippingLineOptions,
        allowClear: true,
      }),
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

  const handleBatchInvalidate = useCallback(async () => {
    const targetIds =
      selectedRowKeysRef.current.length > 0
        ? selectedRowKeysRef.current
        : currentRowsRef.current.map((item) => item.id)

    if (targetIds.length === 0) {
      message.error('当前列表暂无可作废的数据')
      return
    }

    await handleInvalidate(targetIds.join(', '))
  }, [handleInvalidate])

  const batchInvalidateButton = useMemo(
    () => (canWrite ? <Button onClick={() => void handleBatchInvalidate()}>批量作废</Button> : null),
    [canWrite, handleBatchInvalidate]
  )

  useEffect(() => {
    const timerId = window.setInterval(() => {
      void reloadRef.current()
    }, AUTO_REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(timerId)
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
        <>
          {selectedRowKeys.length === 0 ? batchInvalidateButton : null}
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
        </>
      ),
      buildColumns: ({ reload }) => {
        reloadRef.current = reload

        return [
          {
            title: '启运港',
            dataIndex: 'portofloading',
            key: 'portofloading',
            width: REMIND_TABLE_COLUMN_WIDTHS.portofloading,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.portofloading),
          },
          {
            title: '目的港',
            dataIndex: 'portofdischarge',
            key: 'portofdischarge',
            width: REMIND_TABLE_COLUMN_WIDTHS.portofdischarge,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.portofdischarge),
          },
          {
            title: '航线',
            dataIndex: 'ship_name',
            key: 'ship_name',
            width: REMIND_TABLE_COLUMN_WIDTHS.ship_name,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.ship_name),
          },
          {
            title: '箱型',
            dataIndex: 'boxcode',
            key: 'boxcode',
            width: REMIND_TABLE_COLUMN_WIDTHS.boxcode,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.boxcode),
          },
          {
            title: '开航时间',
            dataIndex: 'departuredate',
            key: 'departuredate',
            width: REMIND_TABLE_COLUMN_WIDTHS.departuredate,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createDateSorter((record) => record.departuredate),
          },
          {
            title: '基础运价',
            dataIndex: 'oceanfreightamount',
            key: 'oceanfreightamount',
            width: REMIND_TABLE_COLUMN_WIDTHS.oceanfreightamount,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createNumberSorter((record) => record.oceanfreightamount),
          },
          {
            title: '总价',
            dataIndex: 'total_amount',
            key: 'total_amount',
            width: REMIND_TABLE_COLUMN_WIDTHS.total_amount,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createNumberSorter((record) => record.total_amount),
          },
          {
            title: '来源',
            dataIndex: 'source',
            key: 'source',
            width: REMIND_TABLE_COLUMN_WIDTHS.source,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.source),
          },
          {
            title: '查询时间',
            dataIndex: 'insert_datetime',
            key: 'insert_datetime',
            width: REMIND_TABLE_COLUMN_WIDTHS.insert_datetime,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createDateSorter((record) => record.insert_datetime),
          },
          {
            title: '是否作废',
            dataIndex: 'is_use_label',
            key: 'is_use_label',
            width: REMIND_TABLE_COLUMN_WIDTHS.is_use_label,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createNumberSorter((record) => record.is_use),
            render: (value: RemindRow['is_use_label']) => {
              if (value === '已作废') {
                return <Tag color="error">{value}</Tag>
              }

              if (value === '未作废') {
                return <Tag color="success">{value}</Tag>
              }

              return value
            },
          },
          {
            title: '船名航次',
            dataIndex: 'ship_info',
            key: 'ship_info',
            width: REMIND_TABLE_COLUMN_WIDTHS.ship_info,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.ship_info),
          },
          {
            title: 'price_id',
            dataIndex: 'price_id',
            key: 'price_id',
            width: REMIND_TABLE_COLUMN_WIDTHS.price_id,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createNumberSorter((record) => record.price_id),
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
                <ListRowActions
                  actions={[
                    {
                      key: 'invalidate',
                      label: '作废',
                      confirm: {
                        title: '确认要作废吗？',
                        okText: '是',
                        cancelText: '否',
                      },
                      onClick: async () => {
                        if (isRemindInvalidated(record)) {
                          message.error('请勿重复作废')
                          return
                        }
                        await handleInvalidate(String(record.id))
                      },
                    },
                  ]}
                />
              )
            },
          },
        ] as ColumnsType<RemindRow>
      },
      buildTableNode: ({ columns, dataSource, loading, tableClassName, pagination, tableSize, virtualScroll }) => {
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
            virtual={virtualScroll.enabled}
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
            scroll={virtualScroll.enabled ? virtualScroll.scroll : { x: 'max-content' }}
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
    [
      canWrite,
      exportAllLoading,
      filterFields,
      batchInvalidateButton,
      handleExportAll,
      handleInvalidate,
      requestList,
      selectedRowKeys.length,
    ]
  )

  const cardTitleOverride =
    selectedRowKeys.length > 0 ? (
      <div className="flex flex-wrap items-center gap-3">
        <Typography.Text>已选 {selectedRowKeys.length} 项</Typography.Text>
        {batchInvalidateButton}
      </div>
    ) : undefined

  return (
    <>
      <StandardListPageRecipe spec={spec} cardTitleOverride={cardTitleOverride} />
    </>
  )
}
