import { PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Drawer,
  Popconfirm,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { ListRowActions } from '../../../shared/components/list-row-actions'
import { normalizeApiError, type ApiError } from '../../../infrastructure/http/api-client'
import { LIST_REFRESH_CHANNEL, LIST_REFRESH_EVENT } from '../../../shared/constants/list-refresh-channel'
import {
  StandardListPageRecipe,
  type StandardListPageSpec,
  type TemplateListFilterField,
} from '../../../shared/template-kit/list'
import {
  fetchRuleList,
  type RuleItem,
  type RuleListFilters,
  type RuleListResponse,
  type RuleStatus,
} from './api'

void React

// 操作列固定宽度：查看 2 字 28px + Divider 13px + 编辑 2 字 28px +
// Divider 13px + 更多 2 字 28px + 余量 16px = 126px，向上固化为 140px。
const ACTION_COLUMN_WIDTH = 140

const statusMap: Record<RuleStatus, { text: string; color: string }> = {
  0: { text: '关闭', color: 'default' },
  1: { text: '运行中', color: 'processing' },
  2: { text: '已上线', color: 'success' },
  3: { text: '异常', color: 'error' },
}

type RuleSearchFormValues = {
  name?: string
  status?: RuleStatus
  statusDetail?: string
  updatedAt?: Dayjs
}

const allStatusDetailOptions = [
  { label: '超时', value: 'timeout' },
  { label: '参数错误', value: 'invalid-param' },
  { label: '权限不足', value: 'permission-denied' },
  { label: '上游不可用', value: 'upstream-unavailable' },
]

const waitWithAbort = (durationMs: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('aborted', 'AbortError'))
      return
    }

    const timer = window.setTimeout(() => {
      resolve()
    }, durationMs)

    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('aborted', 'AbortError'))
      },
      { once: true }
    )
  })

const loadStatusDetailOptions = async (values: Partial<RuleSearchFormValues>, signal: AbortSignal) => {
  await waitWithAbort(180, signal)

  const keyword = values.name?.trim().toLowerCase()
  if (!keyword) {
    return allStatusDetailOptions
  }

  return allStatusDetailOptions.filter((item) => item.label.toLowerCase().includes(keyword))
}

const toFilters = (values: RuleSearchFormValues): RuleListFilters => ({
  name: values.name,
  status: typeof values.status === 'number' ? values.status : undefined,
  statusDetail: values.statusDetail?.trim() || undefined,
  updatedAt: dayjs.isDayjs(values.updatedAt) ? values.updatedAt.format('YYYY-MM-DD') : undefined,
})

export const TableQueryPage = () => {
  const [selectedRows, setSelectedRows] = useState<RuleItem[]>([])
  const [drawerRow, setDrawerRow] = useState<RuleItem | null>(null)
  const [deletedRuleKeys, setDeletedRuleKeys] = useState<string[]>([])
  const paginationMetaRef = useRef({ current: 1, pageSize: 10 })

  const applyDeletedRules = useCallback(
    (response: RuleListResponse, nextDeletedRuleKeys?: string[]) => {
      const deletedKeySet = new Set(nextDeletedRuleKeys ?? deletedRuleKeys)
      return {
        ...response,
        data: response.data.filter((item) => !deletedKeySet.has(item.key)),
      }
    },
    [deletedRuleKeys]
  )

  const handleDeleteRule = useCallback(
    async (rule: RuleItem, reload: () => Promise<void>) => {
      const nextDeletedRuleKeys = deletedRuleKeys.includes(rule.key)
        ? deletedRuleKeys
        : [...deletedRuleKeys, rule.key]

      setDeletedRuleKeys(nextDeletedRuleKeys)
      setSelectedRows((rows) => rows.filter((item) => item.key !== rule.key))
      setDrawerRow((currentRow) => (currentRow?.key === rule.key ? null : currentRow))

      await reload()
      void message.success(`已删除规则：${rule.name}`)
    },
    [deletedRuleKeys]
  )

  const filterFields = useMemo<TemplateListFilterField<RuleSearchFormValues>[]>(
    () => [
      {
        type: 'input',
        name: 'name',
        label: '规则名称',
        inputProps: {
          placeholder: '请输入规则名称',
        },
      },
      {
        type: 'select',
        name: 'status',
        label: '状态',
        selectProps: {
          placeholder: '请选择状态',
        },
        options: [
          { label: '关闭', value: 0 },
          { label: '运行中', value: 1 },
          { label: '已上线', value: 2 },
          { label: '异常', value: 3 },
        ],
      },
      {
        type: 'select',
        name: 'statusDetail',
        label: '异常标签',
        visibleWhen: (values) => values.status === 3,
        dependsOn: ['name'],
        selectProps: {
          placeholder: '异步加载标签（演示）',
        },
        optionsLoader: async ({ values, signal }: { values: Partial<RuleSearchFormValues>; signal: AbortSignal }) =>
          loadStatusDetailOptions(values, signal),
      },
      {
        type: 'date',
        name: 'updatedAt',
        label: '更新时间',
        datePickerProps: {
          placeholder: '请选择更新时间',
        },
        disabledWhen: (values) => values.status === 0,
      },
    ],
    []
  )

  const spec = useMemo<StandardListPageSpec<RuleSearchFormValues, RuleListFilters, RuleListResponse, RuleItem, ApiError>>(
    () => ({
      pageTitle: '查询表格',
      cardTitle: '规则列表',
      tableId: 'template-rule-list',
      formRoute: '/template/list/table/form',
      initialFilters: {},
      toFilters,
      buildRequestFilters: ({ filters, current, pageSize }) => ({
        ...filters,
        current,
        size: pageSize,
      }),
      request: fetchRuleList,
      selectItems: (response) => response?.data ?? [],
      isPartial: (response) => Boolean(response?.partial),
      mapError: normalizeApiError,
      onError: (requestError) => {
        console.error('[rule-list] fetch failed', {
          current: paginationMetaRef.current.current,
          pageSize: paginationMetaRef.current.pageSize,
          error: requestError.message,
        })
      },
      transformResponse: applyDeletedRules,
      refreshChannel: {
        channelName: LIST_REFRESH_CHANNEL,
        eventType: LIST_REFRESH_EVENT.REFRESH_LIST,
      },
      filterFields,
      buildColumns: ({ openFormPage, reload }) => [
        {
          key: 'name',
          title: '规则名称',
          dataIndex: 'name',
          render: (_, record) => (
            <Button type="link" className="!p-0" onClick={() => setDrawerRow(record)}>
              {record.name}
            </Button>
          ),
        },
        { key: 'desc', title: '描述', dataIndex: 'desc' },
        {
          key: 'callNo',
          title: '服务调用次数',
          dataIndex: 'callNo',
          sorter: (a, b) => a.callNo - b.callNo,
        },
        {
          key: 'status',
          title: '状态',
          dataIndex: 'status',
          render: (value: RuleStatus) => <Tag color={statusMap[value].color}>{statusMap[value].text}</Tag>,
        },
        {
          key: 'updatedAt',
          title: '上次调度时间',
          dataIndex: 'updatedAt',
          render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
          title: '操作',
          key: 'action',
          width: ACTION_COLUMN_WIDTH,
          render: (_, record) => (
            <ListRowActions
              maxVisibleActions={2}
              actions={[
                {
                  key: 'view',
                  label: '查看',
                  onClick: () => openFormPage('readonly', record.key),
                },
                {
                  key: 'edit',
                  label: '编辑',
                  onClick: () => openFormPage('modify', record.key),
                },
                {
                  key: 'delete',
                  label: '删除',
                  danger: true,
                  confirm: {
                    title: '确认删除这条规则吗？',
                    description: '删除后将从当前列表中移除。',
                    okText: '确认删除',
                    cancelText: '取消',
                  },
                  onClick: () => {
                    void handleDeleteRule(record, async () => {
                      await reload()
                    })
                  },
                },
              ]}
            />
          ),
        },
      ],
      buildTableNode: ({ columns, dataSource, loading, tableSize, current, pageSize, tableClassName, pagination }) => {
        paginationMetaRef.current = { current, pageSize }

        return (
          <Table<RuleItem>
            className={tableClassName}
            rowKey="key"
            dataSource={dataSource}
            columns={columns}
            size={tableSize}
            pagination={pagination}
            loading={loading}
            rowSelection={{
              onChange: (_, rows) => setSelectedRows(rows),
            }}
          />
        )
      },
      createAction: {
        label: '新增规则',
        icon: <PlusOutlined />,
      },
    }),
    [applyDeletedRules, filterFields, handleDeleteRule]
  )

  const cardTitleOverride =
    selectedRows.length > 0 ? (
      <div className="flex flex-wrap items-center gap-3">
        <Typography.Text>
          已选 {selectedRows.length} 项，服务调用总量 {selectedRows.reduce((sum, item) => sum + item.callNo, 0)}
        </Typography.Text>
        <Popconfirm
          title="确认批量删除已选规则吗？"
          description="删除后将从当前列表中移除。"
          okText="确认删除"
          cancelText="取消"
          onConfirm={() => message.success('批量删除成功')}
        >
          <Button>批量删除</Button>
        </Popconfirm>
        <Button onClick={() => message.success('批量审批成功')}>批量审批</Button>
      </div>
    ) : undefined

  return (
    <>
      <StandardListPageRecipe spec={spec} cardTitleOverride={cardTitleOverride} />

      <Drawer size={560} open={Boolean(drawerRow)} onClose={() => setDrawerRow(null)} title={drawerRow?.name}>
        {drawerRow ? (
          <div className="space-y-3">
            <Typography.Paragraph>
              <span className="font-medium">规则名称：</span>
              {drawerRow.name}
            </Typography.Paragraph>
            <Typography.Paragraph>
              <span className="font-medium">描述：</span>
              {drawerRow.desc}
            </Typography.Paragraph>
            <Typography.Paragraph>
              <span className="font-medium">调用量：</span>
              {drawerRow.callNo}
            </Typography.Paragraph>
            <Typography.Paragraph>
              <span className="font-medium">状态：</span>
              {statusMap[drawerRow.status].text}
            </Typography.Paragraph>
            <Typography.Paragraph>
              <span className="font-medium">更新时间：</span>
              {dayjs(drawerRow.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
            </Typography.Paragraph>
          </div>
        ) : null}
      </Drawer>
    </>
  )
}
