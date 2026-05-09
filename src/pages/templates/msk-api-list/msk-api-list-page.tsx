import { Alert, Button, DatePicker, Divider, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message, theme } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import ExportJsonExcel from 'js-export-excel'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { normalizeApiError, type ApiError } from '../../../infrastructure/http/api-client'
import {
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

const timeStamp = (value?: string) => {
  if (!value) return 0
  const parsed = dayjs(value).valueOf()
  return Number.isNaN(parsed) ? 0 : parsed
}

export const MskApiListPage = () => {
  const { token } = theme.useToken()
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

  const filterFields = useMemo<TemplateListFilterField<SearchValues>[]>(
    () => [
      {
        type: 'select',
        name: 'origincity_name',
        label: '起始港',
        selectProps: { showSearch: true, allowClear: true, placeholder: '请选择起始港' },
        optionsLoader: async ({ signal }) => {
          if (signal.aborted) return []
          const data = await fetchStartPortOptions(1)
          return data.map((item) => ({ label: item, value: item }))
        },
      },
      {
        type: 'select',
        name: 'destinationcity_name',
        label: '目的港',
        selectProps: { showSearch: true, allowClear: true, placeholder: '请选择目的港' },
        optionsLoader: async ({ signal }) => {
          if (signal.aborted) return []
          const data = await fetchEndPortOptions(1)
          return data.map((item) => ({ label: item, value: item }))
        },
      },
      {
        type: 'select',
        name: 'host',
        label: '航线',
        optionsLoader: async ({ signal }) => {
          if (signal.aborted) return []
          const data = await fetchShippingLineOptions()
          return data.map((item) => ({ label: item, value: item }))
        },
      },
    ],
    []
  )

  const requestList = useCallback(async (filters: MskApiFilters): Promise<ListResponse> => {
    const accountInfo = await fetchAccountNum().catch(() => null)
    setAccountNumText(accountInfo ? (Array.isArray(accountInfo) ? accountInfo.join(' ') : accountInfo) : '账号数量信息加载失败')

    const [rows, lineMap] = await Promise.all([fetchMskApiList(filters), fetchShippingLineMap()])

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

  const spec = useMemo<StandardListPageSpec<SearchValues, MskApiFilters, ListResponse, RowView, ApiError>>(
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
        <Button type="primary" onClick={() => setAddingVisible(true)}>
          新增一行
        </Button>
      ),
      renderBetweenFilterAndContent: (
        <div className="flex w-full items-center gap-2">
          <Alert className="min-w-0 flex-1" type="info" showIcon title={accountNumText} />
          <Button
            onClick={() => {
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

              const exporter = new ExportJsonExcel({
                fileName: 'MSK API列表',
                datas: [{ sheetData: tableData, sheetName: 'sheet', sheetFilter: TABLE_FILTER, sheetHeader: TABLE_HEADER }],
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
        </div>
      ),
      buildColumns: ({ reload }) => {
        reloadRef.current = reload
        return [
          { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a, b) => a.id - b.id },
          { title: '账号', dataIndex: 'tips', key: 'tips', width: 120 },
          { title: '起始港', dataIndex: 'origincity_name', key: 'origincity_name', width: 120 },
          { title: '目的港', dataIndex: 'destinationcity_name', key: 'destinationcity_name', width: 160 },
          { title: '航线', dataIndex: 'host', key: 'host', width: 120 },
          { title: '箱型', dataIndex: 'box_type', key: 'box_type', width: 100 },
          { title: '延迟时间(秒)', dataIndex: 'delay_time_label', key: 'delay_time_label', width: 120 },
          {
            title: '是否开启',
            dataIndex: 'is_run_label',
            key: 'is_run_label',
            width: 100,
            render: (value: string) => <Tag color={value === '开启' ? 'success' : 'default'}>{value || '-'}</Tag>,
          },
          { title: '是否翻页', dataIndex: 'is_roll_label', key: 'is_roll_label', width: 100 },
          { title: '开航时间', dataIndex: 'early_date', key: 'early_date', width: 120, sorter: (a, b) => timeStamp(a.early_date) - timeStamp(b.early_date) },
          { title: '目的港类型', dataIndex: 'destination_service_mode', key: 'destination_service_mode', width: 120 },
          { title: '限价', dataIndex: 'limit_price', key: 'limit_price', width: 100, sorter: (a, b) => Number(a.limit_price ?? 0) - Number(b.limit_price ?? 0) },
          { title: '端口', dataIndex: 'port', key: 'port', width: 100 },
          {
            title: '操作',
            key: 'operation',
            width: ACTION_COLUMN_WIDTH,
            fixed: 'right',
            render: (_, record) => (
              <Space size={8}>
                {record.booking_url ? (
                  <>
                    <Typography.Link href={record.booking_url} target="_blank" rel="noreferrer">
                      订舱
                    </Typography.Link>
                    <Divider type="vertical" />
                  </>
                ) : null}
                <Button
                  type="link"
                  className="!p-0"
                  onClick={() => {
                    setEditingItem(record)
                    editForm.setFieldsValue({
                      ...record,
                      early_date: record.early_date ? dayjs(record.early_date) : undefined,
                    } as unknown as RowView)
                  }}
                >
                  修改
                </Button>
              </Space>
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
            scroll={{ x: 2160 }}
          />
        )
      },
      renderAfterContent:
        selectedCount > 0 ? (
          <div
            className="fixed right-0 bottom-0 left-0 z-[11] px-6 py-3 backdrop-blur-sm"
            style={{
              borderTop: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorBgElevated,
            }}
          >
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3">
              <Typography.Text>
                已选择 <span className="font-medium">{selectedCount}</span> 项
              </Typography.Text>
              <Space>
                <Popconfirm
                  title="确认要开启所有吗？"
                  okText="是"
                  cancelText="否"
                  onConfirm={() =>
                    toggleAllByEarlyDate(0, selectedRowsRef.current.map((item) => item.id).join(',')).then(async () => {
                      message.success('开启成功')
                      await reloadRef.current()
                    })
                  }
                >
                  <Button>开启所有</Button>
                </Popconfirm>
                <Popconfirm
                  title="确认要关闭所有吗？"
                  okText="是"
                  cancelText="否"
                  onConfirm={() =>
                    toggleAllByEarlyDate(-1, selectedRowsRef.current.map((item) => item.id).join(',')).then(async () => {
                      message.success('关闭成功')
                      await reloadRef.current()
                    })
                  }
                >
                  <Button>关闭所有</Button>
                </Popconfirm>
                <Button type="primary" onClick={() => setBatchVisible(true)}>
                  批量修改
                </Button>
              </Space>
            </div>
          </div>
        ) : null,
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
    [accountNumText, editForm, filterFields, requestList, selectedCount, token.colorBgElevated, token.colorBorderSecondary]
  )

  return (
    <>
      <StandardListPageRecipe spec={spec} />

      <Modal
        title="新增一行"
        open={addingVisible}
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
      >
        <Form form={addForm} layout="vertical">
          <Form.Item name="tips" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="origincity_name" label="起始港" rules={[{ required: true, message: '请输入起始港' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="destinationcity_name" label="目的港" rules={[{ required: true, message: '请输入目的港' }]}>
            <Input />
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

      <Modal
        title="修改"
        open={Boolean(editingItem)}
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
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="tips" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="origincity_name" label="起始港" rules={[{ required: true, message: '请输入起始港' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="destinationcity_name" label="目的港" rules={[{ required: true, message: '请输入目的港' }]}>
            <Input />
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

      <Modal
        title="批量修改"
        open={batchVisible}
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
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item name="origincity_name" label="起始港">
            <Input />
          </Form.Item>
          <Form.Item name="destinationcity_name" label="目的港">
            <Input />
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
    </>
  )
}
