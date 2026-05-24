import { Button, Dropdown, message, Popconfirm, Tag } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import ExportJsonExcel from 'js-export-excel'
import { DraggableTable } from '../../../shared/components/draggable-table'
import { normalizeApiError, type ApiError } from '../../../infrastructure/http/api-client'
import {
  createPortFilterFields,
  StandardListPageRecipe,
  type StandardListPageSpec,
  type TemplateListFilterField,
} from '../../../shared/template-kit/list'
import {
  fetchEndPortOptions,
  fetchOrderList,
  fetchStartPortOptions,
  shutOutOrder,
  submitOrder,
  type OrderListFilters,
  type OrderListItem,
  type OrderStatus,
} from './api'

void React

const ORDER_STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: '未提交订单', value: 0 },
  { label: '已提交', value: 1 },
  { label: '超时', value: 2 },
  { label: '正在锁定', value: 3 },
  { label: '退关', value: 4 },
]

const BOX_TYPE_OPTIONS = ['20 Dry Standard', '40 Dry High', '40 Reefer High', '45 Dry High'].map((item) => ({
  label: item,
  value: item,
}))

// 操作列固定宽度：2 个按钮（下单/退关）按 4 字口径 56*2=112，
// 1 个间距 13，加余量 16，总计 141，按易读性上调到 150。
const ACTION_COLUMN_WIDTH = 150
const EXPORT_ALL_PAGE_SIZE = 10000

const TABLE_TITLE = [
  '账号',
  '开航时间',
  '到港时间',
  '起始港',
  '目的港',
  '箱型',
  '船名',
  '航程（天）',
  '提单号',
  '价格',
  'is_roll',
  '返回值2',
  '下单时间',
  '截止提交时间',
  '提交时间',
  '状态',
  'ID',
  '返回值1',
  '免用箱',
]

const TABLE_FILTER = [
  'username',
  'earlytime',
  'arrive_time',
  'origin_location',
  'destination_location',
  'box_type',
  'vessel_name',
  'voyage_days',
  'booking_number',
  'price',
  'is_roll',
  'capacity_hard_stop_indicator',
  'booktime',
  'endtime',
  'update_time',
  'is_book',
  'id',
  'is_instant_confirmation',
  'free_day',
]

type OrderSearchValues = {
  origin_location?: string
  destination_location?: string
  is_time_out?: string
  is_book?: OrderStatus
  start_time?: Dayjs
  end_time?: Dayjs
  earlytime?: Dayjs
  username?: string
  vessel_name?: string
  list_type?: string
}

type OrderListPageResponse = {
  data: (OrderListItem & { voyage_days: number | null })[]
  total: number
  current: number
  size: number
}

const toFilters = (values: OrderSearchValues): OrderListFilters => ({
  origin_location: values.origin_location,
  destination_location: values.destination_location,
  is_time_out: values.is_time_out,
  is_book: typeof values.is_book === 'number' ? values.is_book : undefined,
  start_time: dayjs.isDayjs(values.start_time) ? values.start_time.format('YYYY-MM-DD HH:mm:ss') : undefined,
  end_time: dayjs.isDayjs(values.end_time) ? values.end_time.format('YYYY-MM-DD HH:mm:ss') : undefined,
  earlytime: dayjs.isDayjs(values.earlytime) ? values.earlytime.format('YYYY-MM-DD') : undefined,
  username: values.username?.trim() || undefined,
  vessel_name: values.vessel_name?.trim() || undefined,
  list_type: values.list_type?.trim() || undefined,
})

const statusLabel = (value: OrderStatus) => ORDER_STATUS_OPTIONS.find((item) => item.value === value)?.label ?? '-'
const toTimestamp = (value?: string) => {
  if (!value) return 0
  const time = dayjs(value).valueOf()
  return Number.isNaN(time) ? 0 : time
}

const formatRecord = (item: OrderListItem): OrderListItem & { voyage_days: number | null } => {
  const earlytime = item.earlytime ? dayjs(item.earlytime).format('YYYY-MM-DD') : ''
  const arriveTime = item.arrive_time ? dayjs(item.arrive_time).format('YYYY-MM-DD') : ''
  const voyageDays =
    item.earlytime && item.arrive_time ? dayjs(item.arrive_time).diff(dayjs(item.earlytime), 'day') : Number.NaN

  return {
    ...item,
    earlytime,
    arrive_time: arriveTime,
    voyage_days: Number.isNaN(voyageDays) ? null : voyageDays,
  }
}

export const OrderListPage = () => {
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [disabledIds, setDisabledIds] = useState<number[]>([])
  const [exporting, setExporting] = useState(false)
  const currentRowsRef = useRef<(OrderListItem & { voyage_days: number | null })[]>([])
  const latestRequestFiltersRef = useRef<OrderListFilters>({})

  const exportExcel = useCallback((rows: (OrderListItem & { voyage_days: number | null })[]) => {
    const options = {
      fileName: '订单列表',
      datas: [
        {
          sheetData: rows.map((item) => ({
            id: item.id,
            username: item.username,
            earlytime: item.earlytime,
            arrive_time: item.arrive_time,
            origin_location: item.origin_location,
            destination_location: item.destination_location,
            box_type: item.box_type,
            vessel_name: item.vessel_name,
            voyage_days: item.voyage_days,
            booking_number: item.booking_number,
            price: item.price,
            is_roll: item.is_roll,
            capacity_hard_stop_indicator: item.capacity_hard_stop_indicator,
            booktime: item.booktime,
            endtime: item.endtime,
            update_time: item.update_time,
            is_book: statusLabel(item.is_book),
            is_instant_confirmation: item.is_instant_confirmation,
            free_day: item.free_day,
          })),
          sheetName: 'sheet',
          sheetFilter: TABLE_FILTER,
          sheetHeader: TABLE_TITLE,
        },
      ],
    }
    const exporter = new ExportJsonExcel(options)
    exporter.saveExcel()
  }, [])

  const filterFields = useMemo<TemplateListFilterField<OrderSearchValues>[]>(
    () => [
      ...createPortFilterFields<OrderSearchValues>({
        originName: 'origin_location',
        destinationName: 'destination_location',
        originLabel: '起始',
        destinationLabel: '目的',
        originCacheKey: 'startport:1',
        destinationCacheKey: 'endport:1',
        originAllowClear: false,
        destinationAllowClear: false,
        fetchOriginOptions: () => fetchStartPortOptions(1),
        fetchDestinationOptions: () => fetchEndPortOptions(1),
      }),
      {
        type: 'select',
        name: 'is_time_out',
        label: '箱型',
        options: BOX_TYPE_OPTIONS,
        selectProps: { showSearch: true, placeholder: '请选择箱型' },
      },
      {
        type: 'select',
        name: 'is_book',
        label: '订单状态',
        options: ORDER_STATUS_OPTIONS,
        selectProps: { placeholder: '请选择订单状态' },
      },
      {
        type: 'date',
        name: 'start_time',
        label: '开始时间',
        datePickerProps: { showTime: true, placeholder: '请选择开始时间' },
      },
      {
        type: 'date',
        name: 'end_time',
        label: '结束时间',
        datePickerProps: { showTime: true, placeholder: '请选择结束时间' },
      },
      { type: 'date', name: 'earlytime', label: '开航时间', datePickerProps: { placeholder: '请选择开航时间' } },
      { type: 'input', name: 'username', label: '用户名', inputProps: { placeholder: '请输入用户名' } },
      { type: 'input', name: 'vessel_name', label: '船名', inputProps: { placeholder: '请输入船名' } },
      { type: 'input', name: 'list_type', label: '订单分组', inputProps: { placeholder: '请输入订单分组' } },
    ],
    []
  )

  const spec = useMemo<
    StandardListPageSpec<OrderSearchValues, OrderListFilters, OrderListPageResponse, OrderListItem & { voyage_days: number | null }, ApiError>
  >(
    () => ({
      pageTitle: '订单列表',
      cardTitle: '订单列表',
      tableId: 'template-order-list',
      formRoute: '/template/list/order-list/form',
      initialFilters: {},
      pagination: {
        defaultCurrent: 1,
        defaultPageSize: 10,
      },
      toFilters,
      buildRequestFilters: ({ filters, current, pageSize }) => ({ ...filters, page: current, per_page: pageSize }),
      request: async (filters) => {
        latestRequestFiltersRef.current = filters
        const response = await fetchOrderList(filters)
        const total = response.total_page ?? response.data.length
        return {
          data: response.data.map(formatRecord),
          total,
          current: filters.page ?? 1,
          size: filters.per_page ?? 100,
        }
      },
      selectItems: (response) => response?.data ?? [],
      mapError: normalizeApiError,
      filterFields,
      toolbarExtra: (
        <Dropdown
          menu={{
            items: [
              { key: 'current', label: '导出当前页' },
              { key: 'all', label: '导出全部页' },
            ],
            onClick: async ({ key }) => {
              if (key === 'current') {
                exportExcel(currentRowsRef.current)
                return
              }

              setExporting(true)
              try {
                const allResponse = await fetchOrderList({
                  ...latestRequestFiltersRef.current,
                  page: 1,
                  per_page: EXPORT_ALL_PAGE_SIZE,
                })
                exportExcel(allResponse.data.map(formatRecord))
              } finally {
                setExporting(false)
              }
            },
          }}
          trigger={['click']}
        >
          <Button loading={exporting}>Excel导出</Button>
        </Dropdown>
      ),
      buildColumns: ({ reload }) => [
        {
          title: '下单',
          key: 'actions',
          width: ACTION_COLUMN_WIDTH,
          align: 'center',
          render: (_, record) => {
            const disabled = disabledIds.includes(record.id)
            if (record.is_book === 0) {
              return (
                <Button
                  loading={record.id === submittingId}
                  onClick={async () => {
                    setSubmittingId(record.id)
                    try {
                      const response = await submitOrder(record.id)
                      message.info(response.data ?? '提交成功')
                      if (response.bool_status) {
                        setDisabledIds((prev) => [...prev, record.id])
                      }
                      await reload()
                    } finally {
                      setSubmittingId(null)
                    }
                  }}
                  disabled={disabled}
                >
                  {disabled ? '下单完成' : `${record.price ?? '-'} / ${record.box_number ?? ''}`}
                </Button>
              )
            }

            if (record.is_book === 1) {
              return (
                <Popconfirm
                  title="确认退关这条订单吗？"
                  description="退关后该订单状态将变更。"
                  okText="确认退关"
                  cancelText="取消"
                  onConfirm={async () => {
                    setSubmittingId(record.id)
                    try {
                      await shutOutOrder(record.id)
                      message.success('成功退关')
                      setDisabledIds((prev) => [...prev, record.id])
                      await reload()
                    } finally {
                      setSubmittingId(null)
                    }
                  }}
                >
                  <Button loading={record.id === submittingId} disabled={disabled}>
                    {disabled ? '退关完成' : '退关'}
                  </Button>
                </Popconfirm>
              )
            }

            return null
          },
        },
        { title: '账号', key: 'username', dataIndex: 'username' },
        { title: '开航时间', key: 'earlytime', dataIndex: 'earlytime', sorter: (a, b) => toTimestamp(a.earlytime) - toTimestamp(b.earlytime) },
        { title: '到港时间', key: 'arrive_time', dataIndex: 'arrive_time', sorter: (a, b) => toTimestamp(a.arrive_time) - toTimestamp(b.arrive_time) },
        { title: '起始港', key: 'origin_location', dataIndex: 'origin_location' },
        { title: '目的港', key: 'destination_location', dataIndex: 'destination_location' },
        { title: '箱型', key: 'box_type', dataIndex: 'box_type' },
        { title: '船名', key: 'vessel_name', dataIndex: 'vessel_name' },
        { title: '航程（天）', key: 'voyage_days', dataIndex: 'voyage_days', sorter: (a, b) => (a.voyage_days ?? -1) - (b.voyage_days ?? -1) },
        { title: '提单号', key: 'booking_number', dataIndex: 'booking_number' },
        { title: '价格', key: 'price', dataIndex: 'price', sorter: (a, b) => (a.price ?? -1) - (b.price ?? -1) },
        { title: 'is_roll', key: 'is_roll', dataIndex: 'is_roll' },
        {
          title: '返回值2',
          key: 'capacity_hard_stop_indicator',
          dataIndex: 'capacity_hard_stop_indicator',
          render: (value) => {
            const isAbnormal = value !== 200 && value !== '200'
            return <span className={isAbnormal ? 'text-orange-500' : ''}>{value ?? '-'}</span>
          },
        },
        { title: '下单时间', key: 'booktime', dataIndex: 'booktime', sorter: (a, b) => toTimestamp(a.booktime) - toTimestamp(b.booktime) },
        {
          title: '截止提交时间',
          key: 'endtime',
          dataIndex: 'endtime',
          sorter: (a, b) => toTimestamp(a.endtime) - toTimestamp(b.endtime),
          render: (value?: string) => {
            if (!value) return '-'
            const endTs = dayjs(value).valueOf()
            if (Number.isNaN(endTs)) return value
            const remainingMs = endTs - Date.now()
            const isWarning = remainingMs > 0 && remainingMs <= 3 * 60 * 1000
            return <span className={isWarning ? 'font-semibold text-red-500' : 'text-black'}>{value}</span>
          },
        },
        { title: '提交时间', key: 'update_time', dataIndex: 'update_time', sorter: (a, b) => toTimestamp(a.update_time) - toTimestamp(b.update_time) },
        {
          title: '状态',
          key: 'is_book',
          dataIndex: 'is_book',
          render: (value: OrderStatus) => <Tag>{statusLabel(value)}</Tag>,
        },
        { title: 'ID', key: 'id', dataIndex: 'id' },
        { title: '返回值1', key: 'is_instant_confirmation', dataIndex: 'is_instant_confirmation' },
        { title: '免用箱', key: 'free_day', dataIndex: 'free_day' },
      ],
      buildTableNode: ({ columns, dataSource, loading, tableSize, tableClassName, pagination, dragSort, virtualScroll }) => {
        currentRowsRef.current = dataSource
        return (
          <DraggableTable
            className={tableClassName}
            rowKey="id"
            sortPersistenceKey={dragSort.persistenceKey}
            sortResetVersion={dragSort.resetVersion}
            onSortPersistenceChange={dragSort.onPersistenceChange}
            columns={columns}
            dataSource={dataSource}
            size={tableSize}
            loading={loading}
            scroll={virtualScroll.enabled ? { x: 'max-content', y: virtualScroll.scroll.y } : { x: 'max-content' }}
            pagination={pagination}
            onOrderChange={(rows) => {
              currentRowsRef.current = rows
            }}
          />
        )
      },
      stateCopy: {
        loadingTitle: '订单列表加载中',
        loadingDescription: '正在拉取订单数据，请稍候。',
        emptyTitle: '暂无订单数据',
        emptyDescription: '当前筛选条件下没有订单，建议调整筛选后重试。',
        emptyActionText: '重置筛选',
        errorTitle: '订单列表加载失败',
        errorDescription: '请求失败，请稍后重试。',
        errorActionText: '重新加载',
        partialTitle: '当前仅返回部分订单数据',
        partialDescription: '部分数据可能延迟，请稍后重载完整数据。',
        partialActionText: '重载完整数据',
      },
    }),
    [disabledIds, exportExcel, exporting, filterFields, submittingId]
  )

  return <StandardListPageRecipe spec={spec} />
}
