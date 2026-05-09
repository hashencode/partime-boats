import { PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Drawer,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
  theme,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import React, { useCallback, useMemo, useRef, useState } from 'react'
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

// 操作列固定宽度：3 个按钮（查看/编辑/删除）按 4 字按钮口径估算 56*3=168，
// 2 个间距按 13*2=26，额外余量 16，总计 210（不超过 220 上限）。
const ACTION_COLUMN_WIDTH = 210

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
  const { token } = theme.useToken()
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
            <Space>
              <Button type="link" className="!p-0" onClick={() => openFormPage('readonly', record.key)}>
                查看
              </Button>
              <Button type="link" className="!p-0" onClick={() => openFormPage('modify', record.key)}>
                编辑
              </Button>
              <Popconfirm
                title="确认删除这条规则吗？"
                description="删除后将从当前列表中移除。"
                okText="确认删除"
                cancelText="取消"
                onConfirm={() => {
                  void handleDeleteRule(record, async () => {
                    await reload()
                  })
                }}
              >
                <Button type="link" danger className="!p-0">
                  删除
                </Button>
              </Popconfirm>
            </Space>
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
        label: '新建',
        icon: <PlusOutlined />,
      },
      renderAfterContent:
        selectedRows.length > 0 ? (
          <div
            className="fixed right-0 bottom-0 left-0 z-[11] px-6 py-3 backdrop-blur-[6px] lg:left-56"
            style={{
              borderTop: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorBgElevated,
            }}
          >
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                已选择 <span className="font-medium">{selectedRows.length}</span> 项，服务调用总量{' '}
                <span className="font-medium">{selectedRows.reduce((sum, item) => sum + item.callNo, 0)}</span>
              </div>
              <Space>
                <Button onClick={() => message.success('批量删除成功')}>批量删除</Button>
                <Button type="primary" onClick={() => message.success('批量审批成功')}>
                  批量审批
                </Button>
              </Space>
            </div>
          </div>
        ) : null,
    }),
    [applyDeletedRules, deletedRuleKeys, filterFields, handleDeleteRule, selectedRows, token.colorBgElevated, token.colorBorderSecondary]
  )

  return (
    <>
      <StandardListPageRecipe spec={spec} />

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
