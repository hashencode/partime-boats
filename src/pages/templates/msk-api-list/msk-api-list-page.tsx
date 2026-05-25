import { Alert, Button, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Tag, Typography, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { DraggableTable } from '../../../shared/components/draggable-table'
import { ListRowActions } from '../../../shared/components/list-row-actions'
import { RemoteStringSelect } from '../../../shared/components/remote-string-select'
import { normalizeApiError, type ApiError } from '../../../infrastructure/http/api-client'
import {
  createPortFilterFields,
  createShippingLineFilterField,
  getCachedListMetadata,
  StandardListPageRecipe,
  type StandardListPageSpec,
  type TemplateListFilterField,
} from '../../../shared/template-kit/list'
import { resolveHostByDestination } from '../msk-query-list/host-map'
import {
  batchUpdateMskApiItem,
  clear429Account,
  fetchAccountNum,
  fetchEndPortOptions,
  fetchMskApiList,
  fetchShippingLineMap,
  fetchShippingLineOptions,
  fetchStartPortOptions,
  toggleAllByEarlyDate,
  updateMskApiItem,
  type BatchUpdatePayload,
  type MskApiFilters,
  type MskApiQueryItem,
} from './api'

void React

type SearchValues = {
  origincity_name?: string
  destinationcity_name?: string
  host?: string
}

type RowView = MskApiQueryItem & {
  key: number
  delay_time_label: string
  is_run_label: string
  is_roll_label: string
  booking_url?: string
}

type ListResponse = {
  data: RowView[]
  total: number
  current: number
  size: number
}

const DELAY_OPTIONS = [
  { label: '延迟', value: 3 },
  { label: '延时30S', value: 30 },
  { label: '延时60S', value: 60 },
  { label: '延时120S', value: 120 },
  { label: '延时240S', value: 240 },
  { label: '延时360S', value: 360 },
  { label: '延时600S', value: 600 },
  { label: '延时1200S', value: 1200 },
  { label: '无延时', value: 0 },
]

const IS_RUN_OPTIONS = [
  { label: '关闭', value: -1 },
  { label: '开启', value: 0 },
]

const IS_ROLL_OPTIONS = [
  { label: '不翻页', value: 1 },
  { label: '翻一页', value: 2 },
  { label: '翻二页', value: 3 },
  { label: '翻三页', value: 4 },
]

const BOX_TYPE_OPTIONS = ['20', '40', '45', '40NOR', '20,45', '20,40', '40,45', '20,40,45'].map((value) => ({
  label: value,
  value,
}))

const DESTINATION_MODE_OPTIONS = ['CY', 'SD'].map((value) => ({ label: value, value }))
const FORM_START_PORT_CACHE_KEY = 'startport:1:form'
const FORM_END_PORT_CACHE_KEY = 'endport:1:form'
const fetchFormStartPortOptions = () => fetchStartPortOptions(1)
const fetchFormEndPortOptions = () => fetchEndPortOptions(1)

const findLabel = (options: { label: string; value: number }[], value: number | string | undefined) => {
  const found = options.find((item) => item.value === value)
  return found?.label ?? String(value ?? '')
}

const parseFilter = (values: SearchValues): MskApiFilters => ({
  origincity_name: values.origincity_name,
  destinationcity_name: values.destinationcity_name,
  host: values.host,
})

const TABLE_HEADER = ['ID', '账号', '起始港', '目的港', '航线', '箱型', '延迟时间(秒)', '是否开启', '是否翻页', '开航时间', '目的港类型', '限价', '端口']
const TABLE_FILTER = ['id', 'tips', 'origincity_name', 'destinationcity_name', 'host', 'box_type', 'delay_time', 'is_run', 'is_roll', 'early_date', 'destination_service_mode', 'limit_price', 'port']

// 操作列固定宽度：2 个链接按钮（订舱/修改）按 56*2=112，间距 13，余量 16，总计 141，取 150。
const ACTION_COLUMN_WIDTH = 150
const TOGGLE_CONFIRM_OVERLAY_STYLE = { maxWidth: 280 }

const timeStamp = (value?: string) => {
  if (!value) return 0
  const parsed = dayjs(value).valueOf()
  return Number.isNaN(parsed) ? 0 : parsed
}

const buildToggleConfirmTitle = (selectedCount: number, actionLabel: '开启' | '关闭') => {
  if (selectedCount === 0) {
    return `当前没有勾选任何列表项，将会${actionLabel}当前筛选结果中的所有项，是否确认？`
  }
  return `确认要${actionLabel}选中的列表项吗？`
}

export const MskApiListPage = () => {
  const [selectedCount, setSelectedCount] = useState(0)
  const [accountNumText, setAccountNumText] = useState<string>('')
  const [editingItem, setEditingItem] = useState<RowView | null>(null)
  const [batchVisible, setBatchVisible] = useState(false)
  const [addingVisible, setAddingVisible] = useState(false)
  const [editForm] = Form.useForm<RowView>()
  const [batchForm] = Form.useForm<BatchUpdatePayload>()
  const [addForm] = Form.useForm<MskApiQueryItem>()
  const currentRowsRef = useRef<RowView[]>([])
  const selectedRowsRef = useRef<RowView[]>([])
  const reloadRef = useRef<() => Promise<void>>(async () => {})

  const handleToggleAll = useCallback(
    async (nextStatus: 0 | -1) => {
      const targetIds =
        selectedRowsRef.current.length > 0
          ? selectedRowsRef.current.map((item) => item.id)
          : currentRowsRef.current.map((item) => item.id)

      if (targetIds.length === 0) {
        message.warning('当前筛选结果中没有可操作的数据')
        return
      }

      await toggleAllByEarlyDate(nextStatus, targetIds.join(','))
      message.success(`${nextStatus === 0 ? '开启' : '关闭'}成功`)
      selectedRowsRef.current = []
      setSelectedCount(0)
      await reloadRef.current()
    },
    []
  )

  const filterFields = useMemo<TemplateListFilterField<SearchValues>[]>(
    () => [
      ...createPortFilterFields<SearchValues>({
        originName: 'origincity_name',
        destinationName: 'destinationcity_name',
        originCacheKey: 'startport:1',
        destinationCacheKey: 'endport:1',
        fetchOriginOptions: () => fetchStartPortOptions(1),
        fetchDestinationOptions: () => fetchEndPortOptions(1),
      }),
      createShippingLineFilterField<SearchValues>({
        name: 'host',
        cacheKey: 'shippingLine',
        fetchOptions: fetchShippingLineOptions,
        allowClear: false,
      }),
    ],
    []
  )

  const requestList = useCallback(async (filters: MskApiFilters): Promise<ListResponse> => {
    const accountInfo = await getCachedListMetadata('accountNum', fetchAccountNum, { ttlMs: 60 * 1000 }).catch(
      () => null
    )
    setAccountNumText(accountInfo ? (Array.isArray(accountInfo) ? accountInfo.join(' ') : accountInfo) : '账号数量信息加载失败')

    const [rows, lineMap] = await Promise.all([
      fetchMskApiList(filters),
      getCachedListMetadata('shippingLineMap', fetchShippingLineMap),
    ])

    const list = rows.map((item) => {
      const logLabel = item.log ?? ''
      const logUrl = lineMap[logLabel]
      return {
        ...item,
        key: item.id,
        host: item.host ?? resolveHostByDestination(item.destinationcity_name) ?? '',
        early_date: item.early_date ? dayjs(item.early_date).format('YYYY-MM-DD') : '',
        delay_time_label: findLabel(DELAY_OPTIONS, item.delay_time),
        is_run_label: findLabel(IS_RUN_OPTIONS, item.is_run),
        is_roll_label: findLabel(IS_ROLL_OPTIONS, item.is_roll),
        booking_url: logUrl,
      }
    })

    const filteredByHost = filters.host ? list.filter((item) => item.host === filters.host) : list

    return {
      data: filteredByHost,
      total: filteredByHost.length,
      current: 1,
      size: filteredByHost.length || 10,
    }
  }, [])

  const spec = useMemo<
    StandardListPageSpec<SearchValues, MskApiFilters, ListResponse, RowView, ApiError>
  >(
    () => ({
      pageTitle: 'MSK API列表',
      cardTitle: 'MSK API列表',
      tableId: 'msk-api-list',
      formRoute: '/msk-api-list/form',
      initialFilters: {},
      toFilters: parseFilter,
      request: requestList,
      selectItems: (response) => response?.data ?? [],
      mapError: normalizeApiError,
      filterFields,
      toolbarExtra: (
        <Space wrap>
          <Popconfirm
            title={buildToggleConfirmTitle(selectedCount, '开启')}
            okText="是"
            cancelText="否"
            overlayStyle={TOGGLE_CONFIRM_OVERLAY_STYLE}
            onConfirm={() => handleToggleAll(0)}
          >
            <Button>开启所有</Button>
          </Popconfirm>
          <Popconfirm
            title={buildToggleConfirmTitle(selectedCount, '关闭')}
            okText="是"
            cancelText="否"
            overlayStyle={TOGGLE_CONFIRM_OVERLAY_STYLE}
            onConfirm={() => handleToggleAll(-1)}
          >
            <Button>关闭所有</Button>
          </Popconfirm>
          <Button type="primary" onClick={() => setAddingVisible(true)}>
            新增一行
          </Button>
        </Space>
      ),
      renderBeforeFilter: (
        <Alert
          className="min-w-0"
          type="info"
          showIcon
          title={accountNumText}
          action={
            <Space>
              <Button
                className={'ml-2'}
                type="primary"
                ghost
                onClick={async () => {
                  const tableData = currentRowsRef.current.map((item) => ({
                    id: item.id,
                    tips: item.tips,
                    origincity_name: item.origincity_name,
                    destinationcity_name: item.destinationcity_name,
                    host: item.host,
                    box_type: item.box_type,
                    delay_time: item.delay_time_label,
                    is_run: item.is_run_label,
                    is_roll: item.is_roll_label,
                    early_date: item.early_date,
                    destination_service_mode: item.destination_service_mode,
                    limit_price: item.limit_price,
                    port: item.port,
                  }))

                  const { default: ExportJsonExcel } = await import('js-export-excel')
                  const exporter = new ExportJsonExcel({
                    fileName: 'MSK API列表',
                    datas: [
                      {
                        sheetData: tableData,
                        sheetName: 'sheet',
                        sheetFilter: TABLE_FILTER,
                        sheetHeader: TABLE_HEADER,
                      },
                    ],
                  })
                  exporter.saveExcel()
                }}
              >
                Excel导出
              </Button>
              <Popconfirm
                title="确认要清除吗？"
                okText="是"
                cancelText="否"
                onConfirm={async () => {
                  await clear429Account()
                  message.success('清除成功')
                }}
              >
                <Button danger ghost>
                  清除429账号
                </Button>
              </Popconfirm>
            </Space>
          }
        />
      ),
      buildColumns: ({ reload }) => {
        reloadRef.current = reload
        return [
          { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
          { title: '账号', dataIndex: 'tips', key: 'tips' },
          { title: '起始港', dataIndex: 'origincity_name', key: 'origincity_name' },
          {
            title: '目的港',
            dataIndex: 'destinationcity_name',
            key: 'destinationcity_name',
          },
          { title: '航线', dataIndex: 'host', key: 'host' },
          { title: '箱型', dataIndex: 'box_type', key: 'box_type' },
          {
            title: '延迟时间(秒)',
            dataIndex: 'delay_time_label',
            key: 'delay_time_label',
          },
          {
            title: '是否开启',
            dataIndex: 'is_run_label',
            key: 'is_run_label',
            render: (value: string) => (
              <Tag color={value === '开启' ? 'success' : 'default'}>{value || '-'}</Tag>
            ),
          },
          { title: '是否翻页', dataIndex: 'is_roll_label', key: 'is_roll_label' },
          {
            title: '开航时间',
            dataIndex: 'early_date',
            key: 'early_date',
            sorter: (a, b) => timeStamp(a.early_date) - timeStamp(b.early_date),
          },
          {
            title: '目的港类型',
            dataIndex: 'destination_service_mode',
            key: 'destination_service_mode',
          },
          {
            title: '限价',
            dataIndex: 'limit_price',
            key: 'limit_price',
            sorter: (a, b) => Number(a.limit_price ?? 0) - Number(b.limit_price ?? 0),
          },
          { title: '端口', dataIndex: 'port', key: 'port' },
          {
            title: '操作',
            key: 'operation',
            width: ACTION_COLUMN_WIDTH,
            fixed: 'right',
            render: (_, record) => (
              <ListRowActions
                actions={[
                  {
                    key: 'booking',
                    label: '订舱',
                    visible: Boolean(record.booking_url),
                    href: record.booking_url,
                    target: '_blank',
                    rel: 'noreferrer',
                  },
                  {
                    key: 'edit',
                    label: '修改',
                    onClick: () => {
                      setEditingItem(record)
                      editForm.setFieldsValue({
                        ...record,
                        early_date: record.early_date ? dayjs(record.early_date) : undefined,
                      } as unknown as RowView)
                    },
                  },
                ]}
              />
            ),
          },
        ]
      },
      buildTableNode: ({ columns, dataSource, loading, tableSize, tableClassName, pagination, dragSort, virtualScroll }) => {
        currentRowsRef.current = dataSource
        return (
          <DraggableTable<RowView>
            className={tableClassName}
            rowKey="id"
            rowOrder={dragSort.rowOrder}
            onRowOrderChange={dragSort.onRowOrderChange}
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            size={tableSize}
            pagination={pagination}
            rowSelection={{
              selectedRowKeys: selectedRowsRef.current.map((item) => item.id),
              onChange: (_, rows) => {
                selectedRowsRef.current = rows
                setSelectedCount(rows.length)
              },
              columnWidth: 50,
            }}
            scroll={virtualScroll.enabled ? { x: 'max-content', y: virtualScroll.scroll.y } : { x: 'max-content' }}
            onOrderChange={(rows) => {
              currentRowsRef.current = rows
            }}
          />
        )
      },
      stateCopy: {
        loadingTitle: 'MSK API列表加载中',
        loadingDescription: '正在获取查询数据，请稍候。',
        emptyTitle: '暂无查询数据',
        emptyDescription: '当前筛选条件下没有数据，请调整筛选后重试。',
        emptyActionText: '重置筛选',
        errorTitle: 'MSK API列表加载失败',
        errorDescription: '列表接口请求失败，请稍后重试。',
        errorActionText: '重新加载',
        partialTitle: '当前仅返回部分查询数据',
        partialDescription: '部分数据可能延迟返回，请稍后重试。',
        partialActionText: '重载完整数据',
      },
    }),
    [
      accountNumText,
      editForm,
      filterFields,
      handleToggleAll,
      requestList,
      selectedCount,
    ]
  )

  const cardTitleOverride =
    selectedCount > 0 ? (
      <div className="flex flex-wrap items-center gap-3">
        <Typography.Text>已选 {selectedCount} 项</Typography.Text>
        <Button onClick={() => setBatchVisible(true)}>批量修改</Button>
      </div>
    ) : undefined

  return (
    <>
      <StandardListPageRecipe spec={spec} cardTitleOverride={cardTitleOverride} />

      {addingVisible ? (
        <Modal
          title="新增一行"
          open
          onCancel={() => setAddingVisible(false)}
          onOk={async () => {
            const values = await addForm.validateFields()
            const currentMaxId = currentRowsRef.current.reduce((maxId, item) => Math.max(maxId, item.id), 0)
            const payload: MskApiQueryItem = {
              ...values,
              id: currentMaxId + 1,
              early_date: values.early_date ? dayjs(values.early_date as unknown as Dayjs).format('YYYY-MM-DD') : undefined,
            }
            await updateMskApiItem(payload)
            message.success('新增成功')
            setAddingVisible(false)
            addForm.resetFields()
            await reloadRef.current()
          }}
          destroyOnHidden
        >
          <Form form={addForm} layout="vertical">
            <Form.Item name="tips" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="origincity_name" label="起始港" rules={[{ required: true, message: '请输入起始港' }]}>
              <RemoteStringSelect
                cacheKey={FORM_START_PORT_CACHE_KEY}
                request={fetchFormStartPortOptions}
                placeholder="请选择起始港"
              />
            </Form.Item>
            <Form.Item name="destinationcity_name" label="目的港" rules={[{ required: true, message: '请输入目的港' }]}>
              <RemoteStringSelect
                cacheKey={FORM_END_PORT_CACHE_KEY}
                request={fetchFormEndPortOptions}
                placeholder="请选择目的港"
              />
            </Form.Item>
            <Form.Item name="box_type" label="箱型" rules={[{ required: true, message: '请选择箱型' }]}>
              <Select options={BOX_TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item name="delay_time" label="延迟时间" rules={[{ required: true, message: '请选择延迟时间' }]}>
              <Select options={DELAY_OPTIONS} />
            </Form.Item>
            <Form.Item name="is_run" label="是否开启" rules={[{ required: true, message: '请选择状态' }]}>
              <Select options={IS_RUN_OPTIONS} />
            </Form.Item>
            <Form.Item name="is_roll" label="是否翻页" rules={[{ required: true, message: '请选择翻页状态' }]}>
              <Select options={IS_ROLL_OPTIONS} />
            </Form.Item>
            <Form.Item name="early_date" label="开航时间">
              <DatePicker className="!w-full" />
            </Form.Item>
            <Form.Item name="destination_service_mode" label="目的港类型">
              <Select options={DESTINATION_MODE_OPTIONS} allowClear />
            </Form.Item>
            <Form.Item name="limit_price" label="限价">
              <InputNumber className="!w-full" min={0} />
            </Form.Item>
            <Form.Item name="port" label="端口">
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      ) : null}

      {editingItem ? (
        <Modal
          title="修改"
          open
          onCancel={() => setEditingItem(null)}
          onOk={async () => {
            const values = await editForm.validateFields()
            const payload: MskApiQueryItem = {
              ...editingItem,
              ...values,
              delay_time: values.delay_time,
              is_run: values.is_run,
              is_roll: values.is_roll,
              early_date: values.early_date ? dayjs(values.early_date as unknown as Dayjs).format('YYYY-MM-DD') : undefined,
            }
            await updateMskApiItem(payload)
            message.success('修改成功')
            setEditingItem(null)
            await reloadRef.current()
          }}
          destroyOnHidden
        >
          <Form form={editForm} layout="vertical">
            <Form.Item name="tips" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="origincity_name" label="起始港" rules={[{ required: true, message: '请输入起始港' }]}>
              <RemoteStringSelect
                cacheKey={FORM_START_PORT_CACHE_KEY}
                request={fetchFormStartPortOptions}
                placeholder="请选择起始港"
              />
            </Form.Item>
            <Form.Item name="destinationcity_name" label="目的港" rules={[{ required: true, message: '请输入目的港' }]}>
              <RemoteStringSelect
                cacheKey={FORM_END_PORT_CACHE_KEY}
                request={fetchFormEndPortOptions}
                placeholder="请选择目的港"
              />
            </Form.Item>
            <Form.Item name="box_type" label="箱型" rules={[{ required: true, message: '请选择箱型' }]}>
              <Select options={BOX_TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item name="delay_time" label="延迟时间" rules={[{ required: true, message: '请选择延迟时间' }]}>
              <Select options={DELAY_OPTIONS} />
            </Form.Item>
            <Form.Item name="is_run" label="是否开启" rules={[{ required: true, message: '请选择状态' }]}>
              <Select options={IS_RUN_OPTIONS} />
            </Form.Item>
            <Form.Item name="is_roll" label="是否翻页" rules={[{ required: true, message: '请选择翻页状态' }]}>
              <Select options={IS_ROLL_OPTIONS} />
            </Form.Item>
            <Form.Item name="early_date" label="开航时间">
              <DatePicker className="!w-full" />
            </Form.Item>
            <Form.Item name="destination_service_mode" label="目的港类型">
              <Select options={DESTINATION_MODE_OPTIONS} allowClear />
            </Form.Item>
            <Form.Item name="limit_price" label="限价">
              <InputNumber className="!w-full" min={0} />
            </Form.Item>
            <Form.Item name="port" label="端口">
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      ) : null}

      {batchVisible ? (
        <Modal
          title="批量修改"
          open
          onCancel={() => setBatchVisible(false)}
          onOk={async () => {
            if (selectedRowsRef.current.length === 0) {
              message.warning('请至少选择一条数据')
              return
            }

            const values = await batchForm.validateFields()
            const payload: BatchUpdatePayload = {
              ids: selectedRowsRef.current.map((item) => item.id).join(', '),
            }

            if (values.origincity_name) payload.origincity_name = values.origincity_name
            if (values.destinationcity_name) payload.destinationcity_name = values.destinationcity_name
            if (values.box_type) payload.box_type = values.box_type
            if (values.delay_time !== undefined) payload.delay_time = values.delay_time
            if (values.early_date) payload.early_date = dayjs(values.early_date as unknown as Dayjs).format('YYYY-MM-DD')
            if (values.destination_service_mode) payload.destination_service_mode = values.destination_service_mode
            if (values.limit_price !== undefined) payload.limit_price = values.limit_price
            if (values.is_run !== undefined) payload.is_run = values.is_run
            if (values.is_roll !== undefined) payload.is_roll = values.is_roll

            if (Object.keys(payload).length <= 1) {
              message.warning('请至少修改一个字段')
              return
            }

            await batchUpdateMskApiItem(payload)
            message.success('批量修改成功')
            setBatchVisible(false)
            batchForm.resetFields()
            await reloadRef.current()
          }}
          destroyOnHidden
        >
          <Form form={batchForm} layout="vertical">
            <Form.Item name="origincity_name" label="起始港">
              <RemoteStringSelect
                cacheKey={FORM_START_PORT_CACHE_KEY}
                request={fetchFormStartPortOptions}
                placeholder="请选择起始港"
              />
            </Form.Item>
            <Form.Item name="destinationcity_name" label="目的港">
              <RemoteStringSelect
                cacheKey={FORM_END_PORT_CACHE_KEY}
                request={fetchFormEndPortOptions}
                placeholder="请选择目的港"
              />
            </Form.Item>
            <Form.Item name="box_type" label="箱型">
              <Select options={BOX_TYPE_OPTIONS} allowClear />
            </Form.Item>
            <Form.Item name="delay_time" label="延迟时间">
              <Select options={DELAY_OPTIONS} allowClear />
            </Form.Item>
            <Form.Item name="early_date" label="开航时间">
              <DatePicker className="!w-full" />
            </Form.Item>
            <Form.Item name="destination_service_mode" label="目的港类型">
              <Select options={DESTINATION_MODE_OPTIONS} allowClear />
            </Form.Item>
            <Form.Item name="limit_price" label="限价">
              <InputNumber className="!w-full" min={0} />
            </Form.Item>
            <Form.Item name="is_run" label="是否开启">
              <Select options={IS_RUN_OPTIONS} allowClear />
            </Form.Item>
            <Form.Item name="is_roll" label="是否翻页">
              <Select options={IS_ROLL_OPTIONS} allowClear />
            </Form.Item>
          </Form>
        </Modal>
      ) : null}
    </>
  )
}
