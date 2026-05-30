import { PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Tag,
  Table,
  Tooltip,
  Typography,
  message,
} from 'antd'
import type { InputRef } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { hasPermission } from '../../../infrastructure/auth/permissions'
import { normalizeApiError, type ApiError } from '../../../infrastructure/http/api-client'
import { useAuth } from '../../../infrastructure/auth/use-auth'
import { ListRowActions } from '../../../shared/components/list-row-actions'
import { RemoteStringSelect } from '../../../shared/components/remote-string-select'
import {
  createPortFilterFields,
  StandardListPageRecipe,
  type StandardListPageSpec,
  type TemplateListFilterField,
} from '../../../shared/template-kit/list'
import { ALL_DATA_PAGE_SIZE } from '../../../shared/hooks/use-standard-pagination'
import {
  batchUpdateBookTask,
  buildBookTaskBatchPayload,
  buildBookTaskUpdatePayload,
  clearBookTaskRouter,
  closeBookTaskInitialization,
  fetchAllBookTaskIds,
  fetchBookTaskList,
  fetchEndPortOptions,
  fetchStartPortOptions,
  normalizeDateValue,
  updateBookTask,
  type BookTaskBatchPayload,
  type BookTaskItem,
  type BookTaskListResponse,
  type BookTaskQueryFilters,
  type BookTaskSavePayload,
} from './api'
import { useBatchQueueTask } from '../../../shared/hooks/use-batch-queue-task'

void React

type BookTaskFilterValues = {
  order_id?: string
  origincity_name?: string
  destinationcity_name?: string
  box_type?: string
  cid_group?: string
  group_id?: string
  list_type?: string
}

type EditableBookTask = BookTaskItem & {
  key: number
}

type BookTaskFormValues = {
  order_id?: number
  account_name?: string
  quantity?: number
  box_type?: string
  origincity_name?: string
  destinationcity_name?: string
  destination_service_mode?: string
  order_date?: Dayjs
  is_order?: number
  limit_price?: string
  is_USA?: number
  is_plan?: number
  is_roll?: number
  is_cid?: number
  limit_day?: string
  cid_group?: number | null
  group_id?: string
  cid_type?: number
  cid_loop_times?: number
  get_cid_times?: number
  cid_concurrent?: number
  cid_sleep?: string
  nac_loop_times?: string
  nac_times?: string
  nac_concurrent?: string
  nac_sleep?: string
  route_select?: string
  is_add_data?: number
}

const PAGE_TITLE = '订舱管理'
const TABLE_ID = 'book-task-list'

const BOX_TYPE_OPTIONS = ['20 Dry Standard', '40 Dry High', '40 Reefer High', '45 Dry High'].map(
  (value) => ({
    label: value,
    value,
  })
)

const YES_NO_OPTIONS = [
  { label: '是', value: 1 },
  { label: '否', value: 0 },
]

const OPEN_CLOSE_OPTIONS = [
  { label: '开启', value: 1 },
  { label: '关闭', value: 0 },
]

const CID_INIT_OPTIONS = [
  { label: '关闭', value: 0 },
  { label: '常规初始化', value: 1 },
  { label: '加载更多初始化', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
]

const CID_TYPE_OPTIONS = [0, 1, 2, 3, 4].map((value) => ({
  label: String(value),
  value,
}))

const CID_TYPE_PATTERN = /^\d+$/

const DESTINATION_SERVICE_OPTIONS = ['CY', 'SD'].map((value) => ({ label: value, value }))

// 操作列固定宽度：当前仅展示 1 个“修改”按钮，2 个汉字按 14px/字计算为 28，
// 额外余量按 16，总计 44；考虑按钮点击热区与表格留白，向上固化为 60。
const ACTION_COLUMN_WIDTH = 60
const BATCH_OPEN_CONFIRM_OVERLAY_STYLE = { maxWidth: 280 }
const EDIT_MODAL_WIDTH = 1040
const EDIT_MODAL_STYLE = { top: 24 }
const EDIT_MODAL_BODY_STYLE = {
  overflowX: 'hidden' as const,
}
const FORM_START_PORT_CACHE_KEY = 'legacy:startport:0:form'
const FORM_END_PORT_CACHE_KEY = 'legacy:endport:0:form'

const renderBreakAllText = (value?: string | number | null) => {
  const text = value === null || value === undefined || value === '' ? '-' : String(value)
  return <div className="break-all whitespace-normal">{text}</div>
}

const renderEllipsisText = (value?: string | number | null) => {
  const text = value === null || value === undefined || value === '' ? '-' : String(value)
  return (
    <Tooltip title={text}>
      <div className="truncate">{text}</div>
    </Tooltip>
  )
}

const normalizeTextValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  return String(value).trim()
}

const compareTextValue = (left?: string | number | null, right?: string | number | null) => {
  return normalizeTextValue(left).localeCompare(normalizeTextValue(right), 'zh-Hans-CN', {
    numeric: true,
    sensitivity: 'base',
  })
}

const parseFiniteNumber = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const compareNumberValue = (left?: string | number | null, right?: string | number | null) => {
  const leftNumber = parseFiniteNumber(left)
  const rightNumber = parseFiniteNumber(right)

  if (leftNumber !== undefined && rightNumber !== undefined) {
    return leftNumber - rightNumber
  }

  if (leftNumber !== undefined) {
    return -1
  }

  if (rightNumber !== undefined) {
    return 1
  }

  return compareTextValue(left, right)
}

const parseDateTimestamp = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.valueOf() : undefined
}

const compareDateValue = (left?: string | number | null, right?: string | number | null) => {
  const leftTimestamp = parseDateTimestamp(left)
  const rightTimestamp = parseDateTimestamp(right)

  if (leftTimestamp !== undefined && rightTimestamp !== undefined) {
    return leftTimestamp - rightTimestamp
  }

  if (leftTimestamp !== undefined) {
    return -1
  }

  if (rightTimestamp !== undefined) {
    return 1
  }

  return compareTextValue(left, right)
}

const numberLabel = (options: { label: string; value: number }[], value?: number | string | null) =>
  options.find((item) => item.value === Number(value))?.label ?? String(value ?? '')

const toEditableRow = (item: BookTaskItem): EditableBookTask => ({
  ...item,
  key: item.id,
})

const toQueryFilters = (values: BookTaskFilterValues): BookTaskQueryFilters => ({
  order_id: values.order_id?.trim() || undefined,
  origincity_name: values.origincity_name,
  destinationcity_name: values.destinationcity_name,
  box_type: values.box_type,
  cid_group: values.cid_group?.trim() || undefined,
  group_id: values.group_id?.trim() || undefined,
  list_type: values.list_type?.trim() || undefined,
})

const toFormValues = (record: EditableBookTask): BookTaskFormValues => ({
  order_id:
    typeof record.order_id === 'number' ? record.order_id : Number(record.order_id) || undefined,
  account_name: record.account_name ?? '',
  quantity:
    typeof record.quantity === 'number' ? record.quantity : Number(record.quantity) || undefined,
  box_type: record.box_type ?? undefined,
  origincity_name: record.origincity_name ?? undefined,
  destinationcity_name: record.destinationcity_name ?? undefined,
  destination_service_mode: record.destination_service_mode ?? undefined,
  order_date: normalizeDateValue(record.order_date) ? dayjs(record.order_date) : undefined,
  is_order: typeof record.is_order === 'number' ? record.is_order : undefined,
  limit_price:
    record.limit_price !== undefined && record.limit_price !== null
      ? String(record.limit_price)
      : undefined,
  is_USA: typeof record.is_USA === 'number' ? record.is_USA : undefined,
  is_plan: typeof record.is_plan === 'number' ? record.is_plan : undefined,
  is_roll: typeof record.is_roll === 'number' ? record.is_roll : undefined,
  is_cid: typeof record.is_cid === 'number' ? record.is_cid : Number(record.is_cid) || undefined,
  limit_day:
    record.limit_day !== undefined && record.limit_day !== null
      ? String(record.limit_day)
      : undefined,
  cid_group:
    record.cid_group === null
      ? null
      : typeof record.cid_group === 'number'
        ? record.cid_group
        : Number(record.cid_group) || null,
  group_id:
    record.group_id !== undefined && record.group_id !== null ? String(record.group_id) : undefined,
  cid_type:
    typeof record.cid_type === 'number' ? record.cid_type : Number(record.cid_type) || undefined,
  cid_loop_times:
    typeof record.cid_loop_times === 'number'
      ? record.cid_loop_times
      : Number(record.cid_loop_times) || undefined,
  get_cid_times:
    typeof record.get_cid_times === 'number'
      ? record.get_cid_times
      : Number(record.get_cid_times) || undefined,
  cid_concurrent:
    typeof record.cid_concurrent === 'number'
      ? record.cid_concurrent
      : Number(record.cid_concurrent) || undefined,
  cid_sleep:
    record.cid_sleep !== undefined && record.cid_sleep !== null
      ? String(record.cid_sleep)
      : undefined,
  nac_loop_times:
    record.nac_loop_times !== undefined && record.nac_loop_times !== null
      ? String(record.nac_loop_times)
      : undefined,
  nac_times:
    record.nac_times !== undefined && record.nac_times !== null
      ? String(record.nac_times)
      : undefined,
  nac_concurrent:
    record.nac_concurrent !== undefined && record.nac_concurrent !== null
      ? String(record.nac_concurrent)
      : undefined,
  nac_sleep:
    record.nac_sleep !== undefined && record.nac_sleep !== null
      ? String(record.nac_sleep)
      : undefined,
  route_select: record.route_select ?? undefined,
})

const hasScopedFilters = (filters: BookTaskQueryFilters) => {
  return (
    Boolean(filters.box_type) ||
    Boolean(filters.cid_group) ||
    Boolean(filters.destinationcity_name) ||
    Boolean(filters.group_id) ||
    Boolean(filters.list_type) ||
    Boolean(filters.order_id) ||
    Boolean(filters.origincity_name)
  )
}

const buildScopedIds = async (
  filters: BookTaskQueryFilters,
  rows: EditableBookTask[],
  selectedIds: number[]
) => {
  if (selectedIds.length > 0) {
    return selectedIds.join(',')
  }

  if (hasScopedFilters(filters)) {
    if (rows.length === 0) {
      return undefined
    }

    const allIds = await fetchAllBookTaskIds(filters)
    return allIds.join(',')
  }

  return undefined
}

const buildBatchOpenConfirmTitle = (selectedCount: number) => {
  if (selectedCount === 0) {
    return '未勾选任何列表项，将会开启当前筛选结果中的所有项，是否确认？'
  }
  return '确认要开启选中的列表项吗？'
}

const buildCidTypeOption = (value: number) => {
  const presetOption = CID_TYPE_OPTIONS.find((item) => item.value === value)
  return presetOption ?? { label: String(value), value }
}

export const CidTypeSelect = ({
  value,
  onChange,
}: {
  value?: number
  onChange?: (nextValue?: number) => void
}) => {
  const [customOptions, setCustomOptions] = useState<number[]>([])
  const [draftValue, setDraftValue] = useState('')
  const inputRef = useRef<InputRef | null>(null)

  useEffect(() => {
    if (typeof value !== 'number') {
      return
    }

    setCustomOptions((previous) => {
      if (CID_TYPE_OPTIONS.some((item) => item.value === value) || previous.includes(value)) {
        return previous
      }
      return [...previous, value]
    })
  }, [value])

  const mergedOptions = useMemo(() => {
    const options = [...CID_TYPE_OPTIONS]

    customOptions.forEach((item) => {
      if (!options.some((option) => option.value === item)) {
        options.push(buildCidTypeOption(item))
      }
    })

    if (typeof value === 'number' && !options.some((option) => option.value === value)) {
      options.push(buildCidTypeOption(value))
    }

    return options
  }, [customOptions, value])

  const handleAddItem = useCallback(() => {
    const trimmedValue = draftValue.trim()
    if (!CID_TYPE_PATTERN.test(trimmedValue)) {
      message.warning('CID类型仅支持非负整数')
      return
    }

    const nextValue = Number(trimmedValue)

    setCustomOptions((previous) => {
      if (
        previous.includes(nextValue) ||
        CID_TYPE_OPTIONS.some((item) => item.value === nextValue)
      ) {
        return previous
      }
      return [...previous, nextValue]
    })
    onChange?.(nextValue)
    setDraftValue('')
    window.setTimeout(() => {
      inputRef.current?.focus?.()
    }, 0)
  }, [draftValue, onChange])

  return (
    <Select<number>
      value={value}
      allowClear
      showSearch
      placeholder="请选择或新增CID类型"
      options={mergedOptions}
      onChange={(nextValue) => onChange?.(nextValue)}
      popupRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: '8px 0' }} />
          <Space className="px-2 pb-1">
            <Input
              ref={inputRef}
              value={draftValue}
              placeholder="请输入CID类型数字"
              inputMode="numeric"
              onChange={(event) => setDraftValue(event.target.value)}
              onKeyDown={(event) => {
                event.stopPropagation()
              }}
              onPressEnter={(event) => {
                event.preventDefault()
                handleAddItem()
              }}
            />
            <Button type="text" icon={<PlusOutlined />} onClick={handleAddItem}>
              添加
            </Button>
          </Space>
        </>
      )}
    />
  )
}

const BookTaskFormFields = ({
  includeRepeatAdd,
}: {
  includeRepeatAdd?: boolean
}) => (
  <Row gutter={16}>
    <Col span={8}>
      <Form.Item label="对应taskID" name="order_id">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="账户" name="account_name">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="数量" name="quantity">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="箱型" name="box_type">
        <Select options={BOX_TYPE_OPTIONS} allowClear showSearch />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="起始港" name="origincity_name">
        <RemoteStringSelect
          cacheKey={FORM_START_PORT_CACHE_KEY}
          request={fetchStartPortOptions}
          placeholder="请选择起始港"
        />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="目的港" name="destinationcity_name">
        <RemoteStringSelect
          cacheKey={FORM_END_PORT_CACHE_KEY}
          request={fetchEndPortOptions}
          placeholder="请选择目的港"
        />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="目的港类型" name="destination_service_mode">
        <Select options={DESTINATION_SERVICE_OPTIONS} allowClear showSearch />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="搜索开航日" name="order_date">
        <DatePicker className="!w-full" format="YYYY-MM-DD" />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="路由" name="route_select">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="是否开启" name="is_order">
        <Select options={OPEN_CLOSE_OPTIONS} allowClear showSearch />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="限价" name="limit_price">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="直接下单" name="is_plan">
        <Select options={YES_NO_OPTIONS} allowClear showSearch />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="is_roll" name="is_roll">
        <Select options={YES_NO_OPTIONS} allowClear showSearch />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="美线" name="is_USA">
        <Select options={YES_NO_OPTIONS} allowClear showSearch />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="是否开启CID" name="is_cid">
        <Select options={CID_INIT_OPTIONS} allowClear showSearch />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="限制天数" name="limit_day">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="分组2" name="cid_group">
        <InputNumber className="!w-full" precision={0} />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="分组1" name="group_id">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="下单方式" name="cid_type">
        <CidTypeSelect />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="cid循环次数" name="cid_loop_times">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="下单请求次数" name="get_cid_times">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="下单并发次数" name="cid_concurrent">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="下单时间间隔" name="cid_sleep">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="nac循环次数" name="nac_loop_times">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="nac请求次数" name="nac_times">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="nac并发次数" name="nac_concurrent">
        <Input />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item label="nac间隔时间" name="nac_sleep">
        <Input />
      </Form.Item>
    </Col>
    {includeRepeatAdd ? (
      <Col span={8}>
        <Form.Item label="是否重复添加" name="is_add_data">
          <Select options={YES_NO_OPTIONS} allowClear showSearch />
        </Form.Item>
      </Col>
    ) : null}
  </Row>
)

export const BookTaskListPage = () => {
  const { role } = useAuth()
  const canWrite = hasPermission(role, 'form.write')
  const [editForm] = Form.useForm<BookTaskFormValues>()
  const [batchForm] = Form.useForm<BookTaskFormValues>()
  const [editingItem, setEditingItem] = useState<EditableBookTask | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [batchVisible, setBatchVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const latestFiltersRef = useRef<BookTaskQueryFilters>({})
  const currentRowsRef = useRef<EditableBookTask[]>([])
  const reloadRef = useRef<() => Promise<void>>(async () => {})
  const batchQueueTask = useBatchQueueTask()

  const filterFields = useMemo<TemplateListFilterField<BookTaskFilterValues>[]>(
    () => [
      {
        type: 'input',
        name: 'order_id',
        label: '对应taskID',
        inputProps: { placeholder: '请输入对应taskID' },
      },
      ...createPortFilterFields<BookTaskFilterValues>({
        originName: 'origincity_name',
        destinationName: 'destinationcity_name',
        originCacheKey: 'legacy:startport:0',
        destinationCacheKey: 'legacy:endport:0',
        fetchOriginOptions: fetchStartPortOptions,
        fetchDestinationOptions: fetchEndPortOptions,
      }),
      {
        type: 'select',
        name: 'box_type',
        label: '箱型',
        selectProps: { showSearch: true, allowClear: true, placeholder: '请选择箱型' },
        options: BOX_TYPE_OPTIONS,
      },
      {
        type: 'input',
        name: 'cid_group',
        label: 'CID分组',
        inputProps: { placeholder: '请输入CID分组' },
      },
      { type: 'input', name: 'group_id', label: '分组', inputProps: { placeholder: '请输入分组' } },
      {
        type: 'input',
        name: 'list_type',
        label: '列表分组',
        inputProps: { placeholder: '请输入列表分组' },
      },
    ],
    []
  )

  const handleToggleOrderStatus = useCallback(
    async (record: EditableBookTask, reload: () => Promise<void>) => {
      if (!canWrite) return
      await batchUpdateBookTask({
        ids: String(record.id),
        is_order: record.is_order === 1 ? 0 : 1,
      })
      message.success(`${record.is_order === 1 ? '关闭' : '开启'}成功`)
      await reload()
    },
    [canWrite]
  )

  const handleSave = useCallback(
    async (record: EditableBookTask, reload: () => Promise<void>) => {
      try {
        setSaving(true)
        const values = await editForm.validateFields()
        const payload: BookTaskSavePayload = buildBookTaskUpdatePayload(
          values as Record<string, unknown>
        )
        await updateBookTask(record.id, payload)
        message.success('保存成功')
        editForm.resetFields()
        setEditingItem(null)
        await reload()
      } catch (error) {
        if (error instanceof Error && 'errorFields' in error) {
          return
        }
        const messageText = error instanceof Error ? error.message : '保存失败，请稍后重试。'
        message.error(messageText)
      } finally {
        setSaving(false)
      }
    },
    [editForm]
  )

  const handleBatchSubmit = useCallback(
    async (reload: () => Promise<void>) => {
      if (selectedRowKeys.length === 0) {
        message.error('请选择要修改的数据')
        return
      }

      try {
        setSaving(true)
        const values = await batchForm.validateFields()
        const payload: BookTaskBatchPayload = buildBookTaskBatchPayload(
          values as Record<string, unknown>,
          selectedRowKeys
        )
        await batchUpdateBookTask(payload)
        message.success('修改成功')
        batchForm.resetFields()
        setBatchVisible(false)
        setSelectedRowKeys([])
        await reload()
      } catch (error) {
        if (error instanceof Error && 'errorFields' in error) {
          return
        }
        const messageText = error instanceof Error ? error.message : '批量修改失败，请稍后重试。'
        message.error(messageText)
      } finally {
        setSaving(false)
      }
    },
    [batchForm, selectedRowKeys]
  )

  const handleBatchOpen = useCallback(async () => {
    const selectedIds = [...selectedRowKeys]

    if (selectedIds.length > 0) {
      await batchQueueTask.start({
        pageSize: selectedIds.length,
        loadPage: async () => ({
          ids: selectedIds,
          total: selectedIds.length,
        }),
        processPage: async (ids) => {
          await batchUpdateBookTask({ ids: ids.join(', '), is_order: 1 })
        },
      })
      return
    }

    if (currentRowsRef.current.length === 0) {
      message.warning('当前筛选结果中没有可操作的数据')
      return
    }

    const queueFilters = { ...latestFiltersRef.current }

    await batchQueueTask.start({
      pageSize: 100,
      loadPage: async (page, pageSize) => {
        const response = await fetchBookTaskList({
          ...queueFilters,
          page,
          per_page: pageSize,
        })

        return {
          ids: response.data.map((item) => item.id),
          total: response.total,
        }
      },
      processPage: async (ids) => {
        await batchUpdateBookTask({ ids: ids.join(', '), is_order: 1 })
      },
    })
  }, [batchQueueTask, selectedRowKeys])

  useEffect(() => {
    if (batchQueueTask.progress.status !== 'success') {
      return
    }

    void reloadRef.current()
    setSelectedRowKeys([])
    message.success('批量打开成功')
    batchQueueTask.reset()
  }, [batchQueueTask.progress.status, batchQueueTask.reset])

  const batchOpenProgressPercent =
    batchQueueTask.progress.total > 0
      ? Math.min(
          100,
          Math.round((batchQueueTask.progress.processed / batchQueueTask.progress.total) * 100)
        )
      : 0

  const spec = useMemo<
    StandardListPageSpec<
      BookTaskFilterValues,
      BookTaskQueryFilters,
      BookTaskListResponse,
      EditableBookTask,
      ApiError
    >
  >(
    () => ({
      pageTitle: PAGE_TITLE,
      tableId: TABLE_ID,
      formRoute: '/get_book_task_list/form',
      initialFilters: {},
      pagination: {
        defaultPageSize: 100,
        pageSizeOptions: [100, 200, 500, 1000, ALL_DATA_PAGE_SIZE],
      },
      toFilters: toQueryFilters,
      buildRequestFilters: ({ filters, current, pageSize }) => ({
        ...filters,
        page: current,
        per_page: pageSize,
      }),
      request: async (filters) => {
        latestFiltersRef.current = filters
        return fetchBookTaskList(filters)
      },
      selectItems: (response) => (response?.data ?? []).map(toEditableRow),
      mapError: normalizeApiError,
      filterFields,
      toolbarExtra: (
        <Space wrap>
          <Popconfirm
            title={buildBatchOpenConfirmTitle(selectedRowKeys.length)}
            okText="是"
            cancelText="否"
            overlayStyle={BATCH_OPEN_CONFIRM_OVERLAY_STYLE}
            onConfirm={() => handleBatchOpen()}
          >
            <Button loading={batchQueueTask.progress.status === 'running'} disabled={!canWrite}>
              批量打开
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确认关闭初始化吗？"
            okText="是"
            cancelText="否"
            onConfirm={async () => {
              const ids = await buildScopedIds(
                latestFiltersRef.current,
                currentRowsRef.current,
                selectedRowKeys
              )
              await closeBookTaskInitialization(ids)
              message.success('关闭初始化成功')
              await reloadRef.current()
            }}
          >
            <Button disabled={!canWrite}>关闭初始化</Button>
          </Popconfirm>
          <Popconfirm
            title="确认清除路由吗？"
            okText="是"
            cancelText="否"
            onConfirm={async () => {
              const ids = await buildScopedIds(
                latestFiltersRef.current,
                currentRowsRef.current,
                selectedRowKeys
              )
              await clearBookTaskRouter(ids)
              message.success('清除路由成功')
              await reloadRef.current()
            }}
          >
            <Button disabled={!canWrite}>清除路由</Button>
          </Popconfirm>
        </Space>
      ),
      buildColumns: ({ reload }) => {
        reloadRef.current = reload
        return [
          { key: 'id', title: 'ID', dataIndex: 'id', sorter: (a, b) => a.id - b.id },
          {
            key: 'order_id',
            title: '对应taskID',
            dataIndex: 'order_id',
            width: 160,
            sorter: (a, b) => compareNumberValue(a.order_id, b.order_id),
            render: (value) => renderEllipsisText(value),
          },
          {
            key: 'account_name',
            title: '账户名',
            dataIndex: 'account_name',
            sorter: (a, b) => compareTextValue(a.account_name, b.account_name),
          },
          {
            key: 'quantity',
            title: '数量',
            dataIndex: 'quantity',
            sorter: (a, b) => compareNumberValue(a.quantity, b.quantity),
          },
          {
            key: 'box_type',
            title: '箱型',
            dataIndex: 'box_type',
            sorter: (a, b) => compareTextValue(a.box_type, b.box_type),
          },
          {
            key: 'origincity_name',
            title: '起始港',
            dataIndex: 'origincity_name',
            sorter: (a, b) => compareTextValue(a.origincity_name, b.origincity_name),
            render: (value) => renderBreakAllText(value),
          },
          {
            key: 'destinationcity_name',
            title: '目的港',
            dataIndex: 'destinationcity_name',
            sorter: (a, b) => compareTextValue(a.destinationcity_name, b.destinationcity_name),
            render: (value) => renderBreakAllText(value),
          },
          {
            key: 'destination_service_mode',
            title: '目的港类型',
            dataIndex: 'destination_service_mode',
            sorter: (a, b) =>
              compareTextValue(a.destination_service_mode, b.destination_service_mode),
          },
          {
            key: 'order_date',
            title: '搜索开航日',
            dataIndex: 'order_date',
            sorter: (a, b) => compareDateValue(a.order_date, b.order_date),
          },
          {
            key: 'is_USA',
            title: '美线',
            dataIndex: 'is_USA',
            sorter: (a, b) => compareNumberValue(a.is_USA, b.is_USA),
            render: (value) => numberLabel(YES_NO_OPTIONS, value),
          },
          {
            key: 'route_select',
            title: '路由',
            dataIndex: 'route_select',
            sorter: (a, b) => compareTextValue(a.route_select, b.route_select),
          },
          {
            key: 'is_order',
            title: '是否开启',
            dataIndex: 'is_order',
            sorter: (a, b) => compareNumberValue(a.is_order, b.is_order),
            render: (value, record) => {
              const label = numberLabel(OPEN_CLOSE_OPTIONS, value)
              return (
                <Popconfirm
                  title={`确认${record.is_order === 1 ? '关闭' : '开启'}当前任务吗？`}
                  okText="是"
                  cancelText="否"
                  onConfirm={() => {
                    void handleToggleOrderStatus(record, reload)
                  }}
                >
                  <Button type="link" className="!px-0" disabled={!canWrite}>
                    <Tag color={value === 1 ? 'success' : 'default'}>{label}</Tag>
                  </Button>
                </Popconfirm>
              )
            },
          },
          {
            key: 'limit_price',
            title: '限价',
            dataIndex: 'limit_price',
            sorter: (a, b) => compareNumberValue(a.limit_price, b.limit_price),
          },
          {
            key: 'is_plan',
            title: '直接下单',
            dataIndex: 'is_plan',
            sorter: (a, b) => compareNumberValue(a.is_plan, b.is_plan),
            render: (value) => numberLabel(YES_NO_OPTIONS, value),
          },
          {
            key: 'is_roll',
            title: 'is_roll',
            dataIndex: 'is_roll',
            sorter: (a, b) => compareNumberValue(a.is_roll, b.is_roll),
            render: (value) => numberLabel(YES_NO_OPTIONS, value),
          },
          {
            key: 'cid',
            title: 'CID',
            dataIndex: 'cid',
            sorter: (a, b) => compareTextValue(a.cid, b.cid),
          },
          {
            key: 'is_cid',
            title: '是否开启CID',
            dataIndex: 'is_cid',
            sorter: (a, b) => compareNumberValue(a.is_cid, b.is_cid),
            render: (value) => numberLabel(CID_INIT_OPTIONS, value),
          },
          {
            key: 'fake_account',
            title: 'CID账号',
            dataIndex: 'fake_account',
            sorter: (a, b) => compareTextValue(a.fake_account, b.fake_account),
          },
          {
            key: 'update_cid_time',
            title: 'CID更新时间',
            dataIndex: 'update_cid_time',
            sorter: (a, b) => compareDateValue(a.update_cid_time, b.update_cid_time),
          },
          {
            key: 'cid_type',
            title: '下单方式',
            dataIndex: 'cid_type',
            sorter: (a, b) => compareNumberValue(a.cid_type, b.cid_type),
            render: (value) => renderEllipsisText(value),
          },
          {
            key: 'cid_loop_times',
            title: 'cid循环次数',
            dataIndex: 'cid_loop_times',
            sorter: (a, b) => compareNumberValue(a.cid_loop_times, b.cid_loop_times),
          },
          {
            key: 'get_cid_times',
            title: '下单请求次数',
            dataIndex: 'get_cid_times',
            sorter: (a, b) => compareNumberValue(a.get_cid_times, b.get_cid_times),
          },
          {
            key: 'cid_concurrent',
            title: '下单并发次数',
            dataIndex: 'cid_concurrent',
            sorter: (a, b) => compareNumberValue(a.cid_concurrent, b.cid_concurrent),
          },
          {
            key: 'cid_sleep',
            title: '下单时间间隔',
            dataIndex: 'cid_sleep',
            sorter: (a, b) => compareNumberValue(a.cid_sleep, b.cid_sleep),
          },
          {
            key: 'nac_loop_times',
            title: 'nac循环次数',
            dataIndex: 'nac_loop_times',
            sorter: (a, b) => compareNumberValue(a.nac_loop_times, b.nac_loop_times),
          },
          {
            key: 'nac_times',
            title: 'nac请求次数',
            dataIndex: 'nac_times',
            sorter: (a, b) => compareNumberValue(a.nac_times, b.nac_times),
          },
          {
            key: 'nac_concurrent',
            title: 'nac并发次数',
            dataIndex: 'nac_concurrent',
            sorter: (a, b) => compareNumberValue(a.nac_concurrent, b.nac_concurrent),
          },
          {
            key: 'nac_sleep',
            title: 'nac间隔时间',
            dataIndex: 'nac_sleep',
            sorter: (a, b) => compareNumberValue(a.nac_sleep, b.nac_sleep),
          },
          {
            key: 'limit_day',
            title: '限制天数',
            dataIndex: 'limit_day',
            sorter: (a, b) => compareNumberValue(a.limit_day, b.limit_day),
          },
          {
            key: 'cid_group',
            title: '分组2',
            dataIndex: 'cid_group',
            sorter: (a, b) => compareNumberValue(a.cid_group, b.cid_group),
          },
          {
            key: 'group_id',
            title: '分组1',
            dataIndex: 'group_id',
            sorter: (a, b) => compareNumberValue(a.group_id, b.group_id),
          },
          {
            key: 'operation',
            title: '操作',
            dataIndex: 'operation',
            width: ACTION_COLUMN_WIDTH,
            fixed: 'right',
            render: (_, record) => {
              if (!canWrite) return null
              return (
                <ListRowActions
                  actions={[
                    {
                      key: 'edit',
                      label: '修改',
                      onClick: () => {
                        editForm.setFieldsValue(toFormValues(record))
                        setEditingItem(record)
                      },
                    },
                  ]}
                />
              )
            },
          },
        ] as ColumnsType<EditableBookTask>
      },
      buildTableNode: ({
        columns,
        dataSource,
        loading,
        tableSize,
        tableClassName,
        pagination,
        virtualScroll,
      }) => {
        currentRowsRef.current = dataSource

        return (
          <Table<EditableBookTask>
            className={tableClassName}
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            size={tableSize}
            pagination={pagination}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys as number[]),
              columnWidth: 50,
            }}
            scroll={
              virtualScroll.enabled
                ? { x: 'max-content', y: virtualScroll.scroll.y }
                : { x: 'max-content' }
            }
          />
        )
      },
      stateCopy: {
        loadingTitle: '任务列表加载中',
        emptyTitle: '暂无任务数据',
        emptyDescription: '当前筛选条件下没有任务数据，请调整筛选条件后重试。',
        emptyActionLabel: '重置筛选',
        errorTitle: '任务列表加载失败',
        errorDescription: '列表接口请求失败，请稍后重试。',
        errorActionLabel: '重新加载',
        partialTitle: '当前仅返回部分任务数据',
        partialDescription: '部分任务数据可能延迟返回，请稍后重试。',
        partialActionLabel: '重载完整数据',
      },
    }),
    [
      batchQueueTask.progress.status,
      canWrite,
      editForm,
      filterFields,
      handleBatchOpen,
      handleToggleOrderStatus,
      selectedRowKeys,
    ]
  )

  const cardTitleOverride =
    canWrite && selectedRowKeys.length > 0 ? (
      <div className="flex flex-wrap items-center gap-3">
        <Typography.Text>已选 {selectedRowKeys.length} 项</Typography.Text>
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
          width={EDIT_MODAL_WIDTH}
          style={EDIT_MODAL_STYLE}
          onOk={() => {
            void handleSave(editingItem, reloadRef.current)
          }}
          onCancel={() => {
            editForm.resetFields()
            setEditingItem(null)
          }}
          confirmLoading={saving}
          styles={{ body: EDIT_MODAL_BODY_STYLE }}
          destroyOnHidden
        >
          <Form form={editForm} layout="vertical">
            <BookTaskFormFields />
          </Form>
        </Modal>
      ) : null}
      <Modal
        title="批量修改"
        open={batchVisible}
        width={EDIT_MODAL_WIDTH}
        style={EDIT_MODAL_STYLE}
        onOk={() => undefined}
        onCancel={() => {
          batchForm.resetFields()
          setBatchVisible(false)
        }}
        footer={null}
        styles={{ body: EDIT_MODAL_BODY_STYLE }}
        destroyOnHidden
      >
        <Form form={batchForm} layout="vertical">
          <BookTaskFormFields includeRepeatAdd />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                batchForm.resetFields()
                setBatchVisible(false)
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              loading={saving}
              onClick={() => {
                void handleBatchSubmit(reloadRef.current)
              }}
            >
              确定
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        title="批量打开进度"
        open={
          batchQueueTask.progress.status === 'running' ||
          batchQueueTask.progress.status === 'paused'
        }
        footer={null}
        closable={false}
        mask={{ closable: false }}
        destroyOnHidden={false}
      >
        <div className="flex w-full flex-col gap-4">
          <Progress
            percent={batchOpenProgressPercent}
            status={batchQueueTask.progress.status === 'paused' ? 'exception' : 'active'}
          />
          <Typography.Text>
            当前正在处理第 {batchQueueTask.progress.currentStart} 到{' '}
            {batchQueueTask.progress.currentEnd} 条的开启任务队列
          </Typography.Text>
          {batchQueueTask.progress.errorMessage ? (
            <Typography.Text type="danger">{batchQueueTask.progress.errorMessage}</Typography.Text>
          ) : null}
          {batchQueueTask.progress.status === 'paused' ? (
            <div className="flex justify-end">
              <Button
                type="primary"
                onClick={() => {
                  void batchQueueTask.retry()
                }}
              >
                重试
              </Button>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  )
}
