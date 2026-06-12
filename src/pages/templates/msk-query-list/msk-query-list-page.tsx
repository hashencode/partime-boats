import { Alert, Button, Col, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Table, Tag, Typography, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { ListRowActions } from '../../../shared/components/list-row-actions'
import { RemoteStringSelect } from '../../../shared/components/remote-string-select'
import { normalizeApiError, type ApiError } from '../../../infrastructure/http/api-client'
import { ALL_DATA_PAGE_SIZE } from '../../../shared/hooks/use-standard-pagination'
import {
  createPortFilterFields,
  createDateSorter,
  createNumberSorter,
  createShippingLineFilterField,
  createTextSorter,
  getCachedListMetadata,
  StandardListPageRecipe,
  type StandardListPageSpec,
  type TemplateListFilterField,
} from '../../../shared/template-kit/list'
import {
  batchUpdateMskQueryItem,
  clear429Account,
  fetchAccountNum,
  fetchEndPortOptions,
  fetchMskQueryList,
  fetchShippingLineOptions,
  fetchStartPortOptions,
  toggleAllByEarlyDate,
  updateMskQueryItem,
  type BatchUpdatePayload,
  type MskQueryFilters,
  type MskQueryItem,
  type QueryType,
} from './api'
import { resolveHostByDestination } from './host-map'

void React

type SearchValues = {
  origincity_name?: string
  destinationcity_name?: string
  type_name?: QueryType
  shipping_line?: string
}

type RowView = MskQueryItem & {
  key: number
  delay_time_label: string
  is_run_label: string
  is_roll_label: string
}

type ListResponse = {
  data: RowView[]
  total: number
  current: number
  size: number
}

const TYPE_NAME_OPTIONS = [
  { label: '订舱查询', value: 1 },
  { label: '普通查询', value: 2 },
  { label: '内部查询', value: 3 },
  { label: '线下查询', value: 6 },
]

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
const MODAL_FORM_COL_PROPS = { xs: 24, md: 12, xl: 8 }
const FORM_MODAL_WIDTH = 960
const fetchFormStartPortOptions = () => fetchStartPortOptions(1)
const fetchFormEndPortOptions = () => fetchEndPortOptions(1)

const normalizeOptionalText = (value?: string) => {
  if (typeof value !== 'string') {
    return value
  }
  return value.trim()
}

const MskQueryModalFormFields = ({ required }: { required?: boolean }) => (
  <Row gutter={16}>
    <Col {...MODAL_FORM_COL_PROPS}>
      <Form.Item
        name="origincity_name"
        label="起始港"
        rules={required ? [{ required: true, message: '请输入起始港' }] : undefined}
      >
        <RemoteStringSelect
          cacheKey={FORM_START_PORT_CACHE_KEY}
          request={fetchFormStartPortOptions}
          placeholder="请选择起始港"
        />
      </Form.Item>
    </Col>
    <Col {...MODAL_FORM_COL_PROPS}>
      <Form.Item
        name="destinationcity_name"
        label="目的港"
        rules={required ? [{ required: true, message: '请输入目的港' }] : undefined}
      >
        <RemoteStringSelect
          cacheKey={FORM_END_PORT_CACHE_KEY}
          request={fetchFormEndPortOptions}
          placeholder="请选择目的港"
        />
      </Form.Item>
    </Col>
    <Col {...MODAL_FORM_COL_PROPS}>
      <Form.Item name="box_type" label="箱型" rules={required ? [{ required: true, message: '请选择箱型' }] : undefined}>
        <Select options={BOX_TYPE_OPTIONS} allowClear={!required} />
      </Form.Item>
    </Col>
    <Col {...MODAL_FORM_COL_PROPS}>
      <Form.Item
        name="delay_time"
        label="延迟时间"
        rules={required ? [{ required: true, message: '请选择延迟时间' }] : undefined}
      >
        <Select options={DELAY_OPTIONS} allowClear={!required} />
      </Form.Item>
    </Col>
    <Col {...MODAL_FORM_COL_PROPS}>
      <Form.Item name="is_run" label="是否开启" rules={required ? [{ required: true, message: '请选择状态' }] : undefined}>
        <Select options={IS_RUN_OPTIONS} allowClear={!required} />
      </Form.Item>
    </Col>
    <Col {...MODAL_FORM_COL_PROPS}>
      <Form.Item name="is_roll" label="是否翻页" rules={required ? [{ required: true, message: '请选择翻页状态' }] : undefined}>
        <Select options={IS_ROLL_OPTIONS} allowClear={!required} />
      </Form.Item>
    </Col>
    <Col {...MODAL_FORM_COL_PROPS}>
      <Form.Item name="early_date" label="开航时间">
        <DatePicker className="!w-full" />
      </Form.Item>
    </Col>
    <Col {...MODAL_FORM_COL_PROPS}>
      <Form.Item name="destination_service_mode" label="目的港类型">
        <Select options={DESTINATION_MODE_OPTIONS} allowClear />
      </Form.Item>
    </Col>
    <Col {...MODAL_FORM_COL_PROPS}>
      <Form.Item name="limit_price" label="限价">
        <InputNumber className="!w-full" min={0} />
      </Form.Item>
    </Col>
    <Col {...MODAL_FORM_COL_PROPS}>
      <Form.Item name="port" label="端口">
        <Input />
      </Form.Item>
    </Col>
    <Col span={24}>
      <Form.Item name="tips" label="备注">
        <Input.TextArea rows={3} placeholder="请输入备注" />
      </Form.Item>
    </Col>
  </Row>
)

const findLabel = (options: { label: string; value: number }[], value: number | string | undefined) => {
  const found = options.find((item) => item.value === value)
  return found?.label ?? String(value ?? '')
}

const parseFilter = (values: SearchValues): MskQueryFilters => ({
  origincity_name: values.origincity_name,
  destinationcity_name: values.destinationcity_name,
  type_name: values.type_name,
  shipping_line: values.shipping_line,
})

const TABLE_HEADER = ['ID', '起始港', '目的港', '航线', '箱型', '延迟时间(秒)', '是否开启', '是否翻页', '开航时间', '目的港类型', '限价', '端口', '备注']
const TABLE_FILTER = ['id', 'origincity_name', 'destinationcity_name', 'host', 'box_type', 'delay_time', 'is_run', 'is_roll', 'early_date', 'destination_service_mode', 'limit_price', 'port', 'tips']

// 操作列固定宽度：1 个按钮“修改”按 2 字计算为 28，
// 额外余量 16，总计 44，向上取整为 60。
const ACTION_COLUMN_WIDTH = 60
// 非操作列固定宽度已按项目级规则校准：
// 1. 以当前列表前 20 条数据的 90 分位内容宽度为样本，并同时校验表头单行显示；
// 2. 最终宽度显式计入左右 padding 与额外 16px 安全余量；
// 3. 单列宽度上限 220px，操作列继续使用独立固定宽度规则。
const MSK_QUERY_TABLE_COLUMN_WIDTHS = {
  id: 48,
  origincity_name: 88,
  destinationcity_name: 88,
  host: 104,
  box_type: 64,
  delay_time_label: 120,
  is_run_label: 88,
  is_roll_label: 88,
  early_date: 120,
  destination_service_mode: 104,
  limit_price: 64,
  port: 96,
  tips: 128,
} as const
const NO_WRAP_HEADER_CELL_PROPS = {
  style: {
    whiteSpace: 'nowrap' as const,
  },
}
const buildSingleTogglePayload = (record: RowView, nextStatus: 0 | -1): MskQueryItem => ({
  id: record.id,
  origincity_name: record.origincity_name,
  destinationcity_name: record.destinationcity_name,
  host: record.host,
  box_type: record.box_type,
  delay_time: record.delay_time,
  is_run: nextStatus,
  is_roll: record.is_roll,
  early_date: record.early_date,
  destination_service_mode: record.destination_service_mode,
  limit_price: record.limit_price,
  port: record.port,
  log: record.log,
  tips: record.tips,
})

export const MskQueryListPage = () => {
  const [selectedCount, setSelectedCount] = useState(0)
  const [accountNumText, setAccountNumText] = useState<string>('')
  const [editingItem, setEditingItem] = useState<RowView | null>(null)
  const [batchVisible, setBatchVisible] = useState(false)
  const [editForm] = Form.useForm<RowView>()
  const [batchForm] = Form.useForm<BatchUpdatePayload>()
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

  const handleToggleSingle = useCallback(async (record: RowView) => {
    const nextStatus = record.is_run === 0 ? -1 : 0

    try {
      await updateMskQueryItem(buildSingleTogglePayload(record, nextStatus))
      message.success(`${nextStatus === 0 ? '开启' : '关闭'}成功`)
      await reloadRef.current()
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '操作失败，请稍后重试。'
      message.error(messageText)
    }
  }, [])

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
      { type: 'select', name: 'type_name', label: '查询类型', options: TYPE_NAME_OPTIONS },
      createShippingLineFilterField<SearchValues>({
        name: 'shipping_line',
        cacheKey: 'shippingLine',
        fetchOptions: fetchShippingLineOptions,
        allowClear: false,
      }),
    ],
    []
  )

  const requestList = useCallback(async (filters: MskQueryFilters): Promise<ListResponse> => {
    const [rows, accountNum] = await Promise.all([
      fetchMskQueryList(filters),
      getCachedListMetadata('accountNum', fetchAccountNum, { ttlMs: 60 * 1000 }),
    ])

    setAccountNumText(Array.isArray(accountNum) ? accountNum.join(' ') : accountNum)

    const list = rows.map((item) => {
      return {
        ...item,
        key: item.id,
        host: item.host ?? resolveHostByDestination(item.destinationcity_name) ?? '',
        early_date: item.early_date ? dayjs(item.early_date).format('YYYY-MM-DD') : '',
        delay_time_label: findLabel(DELAY_OPTIONS, item.delay_time),
        is_run_label: findLabel(IS_RUN_OPTIONS, item.is_run),
        is_roll_label: findLabel(IS_ROLL_OPTIONS, item.is_roll),
      }
    })

    const filteredByHost = filters.shipping_line ? list.filter((item) => item.host === filters.shipping_line) : list

    return {
      data: filteredByHost,
      total: filteredByHost.length,
      current: 1,
      size: filteredByHost.length || 10,
    }
  }, [])

  const spec = useMemo<
    StandardListPageSpec<SearchValues, MskQueryFilters, ListResponse, RowView, ApiError>
  >(
    () => ({
      pageTitle: 'Maersk列表',
      cardTitle: 'Maersk列表',
      tableId: 'msk-query-list',
      formRoute: '/msk-query-list/form',
      initialFilters: {},
      pagination: {
        defaultPageSize: ALL_DATA_PAGE_SIZE,
      },
      toFilters: parseFilter,
      request: requestList,
      selectItems: (response) => response?.data ?? [],
      mapError: normalizeApiError,
      filterFields,
      toolbarExtra: (
        <Space wrap>
          <Button onClick={() => void handleToggleAll(0)}>开启所有</Button>
          <Button onClick={() => void handleToggleAll(-1)}>关闭所有</Button>
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
                    tips: item.tips,
                  }))

                  const { default: ExportJsonExcel } = await import('js-export-excel')
                  const exporter = new ExportJsonExcel({
                    fileName: 'Maersk列表',
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
          {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: MSK_QUERY_TABLE_COLUMN_WIDTHS.id,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createNumberSorter((record) => record.id),
          },
          {
            title: '起始港',
            dataIndex: 'origincity_name',
            key: 'origincity_name',
            width: MSK_QUERY_TABLE_COLUMN_WIDTHS.origincity_name,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.origincity_name),
          },
          {
            title: '目的港',
            dataIndex: 'destinationcity_name',
            key: 'destinationcity_name',
            width: MSK_QUERY_TABLE_COLUMN_WIDTHS.destinationcity_name,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.destinationcity_name),
          },
          {
            title: '航线',
            dataIndex: 'host',
            key: 'host',
            width: MSK_QUERY_TABLE_COLUMN_WIDTHS.host,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.host),
          },
          {
            title: '箱型',
            dataIndex: 'box_type',
            key: 'box_type',
            width: MSK_QUERY_TABLE_COLUMN_WIDTHS.box_type,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.box_type),
          },
          {
            title: '延迟时间(秒)',
            dataIndex: 'delay_time_label',
            key: 'delay_time_label',
            width: MSK_QUERY_TABLE_COLUMN_WIDTHS.delay_time_label,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createNumberSorter((record) => record.delay_time),
          },
          {
            title: '是否开启',
            dataIndex: 'is_run_label',
            key: 'is_run_label',
            width: MSK_QUERY_TABLE_COLUMN_WIDTHS.is_run_label,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createNumberSorter((record) => record.is_run),
            render: (value: string, record) => (
              <Button
                type="link"
                className="!px-0"
                onClick={() => {
                  void handleToggleSingle(record)
                }}
              >
                <Tag color={value === '开启' ? 'success' : 'default'}>{value || '-'}</Tag>
              </Button>
            ),
          },
          {
            title: '是否翻页',
            dataIndex: 'is_roll_label',
            key: 'is_roll_label',
            width: MSK_QUERY_TABLE_COLUMN_WIDTHS.is_roll_label,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createNumberSorter((record) => record.is_roll),
            render: (value: string) => value || '-',
          },
          {
            title: '开航时间',
            dataIndex: 'early_date',
            key: 'early_date',
            width: MSK_QUERY_TABLE_COLUMN_WIDTHS.early_date,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createDateSorter((record) => record.early_date),
          },
          {
            title: '目的港类型',
            dataIndex: 'destination_service_mode',
            key: 'destination_service_mode',
            width: MSK_QUERY_TABLE_COLUMN_WIDTHS.destination_service_mode,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.destination_service_mode),
          },
          {
            title: '限价',
            dataIndex: 'limit_price',
            key: 'limit_price',
            width: MSK_QUERY_TABLE_COLUMN_WIDTHS.limit_price,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createNumberSorter((record) => record.limit_price),
          },
          {
            title: '端口',
            dataIndex: 'port',
            key: 'port',
            width: MSK_QUERY_TABLE_COLUMN_WIDTHS.port,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.port),
          },
          {
            title: '备注',
            dataIndex: 'tips',
            key: 'tips',
            width: MSK_QUERY_TABLE_COLUMN_WIDTHS.tips,
            onHeaderCell: () => NO_WRAP_HEADER_CELL_PROPS,
            sorter: createTextSorter((record) => record.tips),
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
      buildTableNode: ({ columns, dataSource, loading, tableSize, tableClassName, pagination }) => {
        currentRowsRef.current = dataSource
        return (
          <Table<RowView>
            className={tableClassName}
            rowKey="id"
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
            scroll={{ x: 'max-content' }}
          />
        )
      },
      stateCopy: {
        loadingTitle: 'Maersk列表加载中',
        loadingDescription: '正在获取查询数据，请稍候。',
        emptyTitle: '暂无查询数据',
        emptyDescription: '当前筛选条件没有结果，请调整后重试。',
        emptyActionText: '重置筛选',
        errorTitle: 'Maersk列表加载失败',
        errorDescription: '请求失败，请稍后重试。',
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
      handleToggleSingle,
      handleToggleAll,
      requestList,
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

      {editingItem ? (
        <Modal
          title="修改"
          open
          width={FORM_MODAL_WIDTH}
          onCancel={() => {
            editForm.resetFields()
            setEditingItem(null)
          }}
          onOk={async () => {
            const values = await editForm.validateFields()
            const payload: MskQueryItem = {
              ...editingItem,
              ...values,
              delay_time: values.delay_time,
              is_run: values.is_run,
              is_roll: values.is_roll,
              early_date: values.early_date ? dayjs(values.early_date as unknown as Dayjs).format('YYYY-MM-DD') : undefined,
              tips: normalizeOptionalText(values.tips),
            }
            await updateMskQueryItem(payload)
            message.success('修改成功')
            editForm.resetFields()
            setEditingItem(null)
            await reloadRef.current()
          }}
          destroyOnHidden
        >
          <Form form={editForm} layout="vertical">
            <MskQueryModalFormFields required />
          </Form>
        </Modal>
      ) : null}

      {batchVisible ? (
        <Modal
          title="批量修改"
          open
          width={FORM_MODAL_WIDTH}
          onCancel={() => {
            batchForm.resetFields()
            setBatchVisible(false)
          }}
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
            if (normalizeOptionalText(values.tips)) payload.tips = normalizeOptionalText(values.tips)

            if (Object.keys(payload).length <= 1) {
              message.warning('请至少修改一个字段')
              return
            }

            await batchUpdateMskQueryItem(payload)
            message.success('批量修改成功')
            setBatchVisible(false)
            batchForm.resetFields()
            await reloadRef.current()
          }}
          destroyOnHidden
        >
          <Form form={batchForm} layout="vertical">
            <MskQueryModalFormFields />
          </Form>
        </Modal>
      ) : null}
    </>
  )
}
