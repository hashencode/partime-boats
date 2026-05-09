import { Button, Card, Checkbox, Form, Input, InputNumber, Popconfirm, Select, Space, Table, Typography, message } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { hasPermission } from '../../../infrastructure/auth/permissions'
import { useAuth } from '../../../infrastructure/auth/use-auth'
import { ListToolbarActions } from '../../../shared/components/list-toolbar-actions'
import { QueryStateBlock } from '../../../shared/components/query-state-block'
import { useListViewPreferences } from '../../../shared/hooks/use-list-view-preferences'
import { useStandardPagination } from '../../../shared/hooks/use-standard-pagination'
import { STANDARD_LIST_TABLE_CLASS_NAME } from '../../../shared/template-kit/list/standard-list-pagination'
import {
  createBasePort,
  fetchBasePortList,
  fetchShippingLineOptions,
  updateBasePort,
  type BasePortItem,
  type BasePortSavePayload,
} from './api'

void React

type EditableBasePortRow = {
  rowKey: string
  isNew?: boolean
  id: number | ''
  cityName: string
  countryCode: string
  countryGeoId: string
  countryName: string
  maerskGeoLocationId: string
  maerskRkstCode: string
  UNCode: string
  shippingline: string | null
}

type BasePortFormValues = Omit<EditableBasePortRow, 'rowKey' | 'isNew' | 'shippingline'> & {
  shippingline?: string[]
}

const PAGE_TITLE = '基础端口列表'
const TABLE_ID = 'base-port-list'

// 操作列固定宽度：2 字按钮“保存/修改”按 28px 计算，
// 单按钮场景保留 16px 余量，合计 44px；考虑链接热区与可读性，上调固化为 80px。
const ACTION_COLUMN_WIDTH = 80

const toEditableRow = (item: BasePortItem): EditableBasePortRow => ({
  rowKey: String(item.id),
  id: item.id,
  cityName: item.cityName ?? '',
  countryCode: item.countryCode ?? '',
  countryGeoId: item.countryGeoId ?? '',
  countryName: item.countryName ?? '',
  maerskGeoLocationId: item.maerskGeoLocationId ?? '',
  maerskRkstCode: item.maerskRkstCode ?? '',
  UNCode: item.UNCode ?? '',
  shippingline: item.shippingline ?? null,
})

const buildNewRow = (): EditableBasePortRow => ({
  rowKey: 'new-row',
  isNew: true,
  id: '',
  cityName: '',
  countryCode: '',
  countryGeoId: '',
  countryName: '',
  maerskGeoLocationId: '',
  maerskRkstCode: '',
  UNCode: '',
  shippingline: null,
})

const splitShippingLines = (value?: string | null) => {
  if (!value) return undefined
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const joinShippingLines = (value?: string[]) => {
  if (!value?.length) return null
  return value.join(',')
}

const EditableCell = ({
  editing,
  dataIndex,
  title,
  shippingLineOptions,
  children,
  ...restProps
}: {
  editing: boolean
  dataIndex: keyof BasePortFormValues
  title: string
  shippingLineOptions: string[]
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) => {
  if (!editing) {
    return <td {...restProps}>{children}</td>
  }

  const required =
    dataIndex === 'id' || dataIndex === 'cityName' || dataIndex === 'countryCode' || dataIndex === 'countryGeoId'

  let inputNode: React.ReactNode
  if (dataIndex === 'id') {
    inputNode = <InputNumber className="w-full" min={1} precision={0} />
  } else if (dataIndex === 'shippingline') {
    inputNode = (
      <Select
        mode="multiple"
        allowClear
        showSearch
        placeholder="请选择航线"
        options={shippingLineOptions.map((item) => ({ label: item, value: item }))}
      />
    )
  } else {
    inputNode = <Input placeholder={`请输入${title}`} />
  }

  return (
    <td {...restProps}>
      <Form.Item
        name={dataIndex}
        className="!mb-0"
        rules={required ? [{ required: true, message: '数据不能为空' }] : undefined}
      >
        {inputNode}
      </Form.Item>
    </td>
  )
}

export const BasePortListPage = () => {
  const { role } = useAuth()
  const canWrite = hasPermission(role, 'form.write')
  const [form] = Form.useForm<BasePortFormValues>()
  const [rows, setRows] = useState<EditableBasePortRow[]>([])
  const [shippingLineOptions, setShippingLineOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<string>('')
  const { current, pageSize, pagination, resetPage } = useStandardPagination({
    total: rows.length,
    defaultPageSize: 10,
  })

  const loadPageData = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const [basePorts, shippingLines] = await Promise.all([fetchBasePortList(), fetchShippingLineOptions()])
      const nextRows = [...basePorts]
        .sort((left, right) => left.id - right.id)
        .map(toEditableRow)
      setRows(nextRows)
      setShippingLineOptions(shippingLines)
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '请求失败，请稍后重试。'
      setErrorMessage(messageText)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPageData()
  }, [loadPageData])

  const isEditing = useCallback((record: EditableBasePortRow) => record.rowKey === editingKey, [editingKey])

  const startEdit = useCallback((record: EditableBasePortRow) => {
    form.setFieldsValue({
      id: record.id,
      cityName: record.cityName,
      countryCode: record.countryCode,
      countryGeoId: record.countryGeoId,
      countryName: record.countryName,
      maerskGeoLocationId: record.maerskGeoLocationId,
      maerskRkstCode: record.maerskRkstCode,
      UNCode: record.UNCode,
      shippingline: splitShippingLines(record.shippingline),
    })
    setEditingKey(record.rowKey)
  }, [form])

  const handleAdd = useCallback(() => {
    if (!canWrite || editingKey) return
    const nextRow = buildNewRow()
    setRows((current) => [nextRow, ...current.filter((item) => !item.isNew)])
    resetPage()
    form.setFieldsValue({
      id: nextRow.id,
      cityName: nextRow.cityName,
      countryCode: nextRow.countryCode,
      countryGeoId: nextRow.countryGeoId,
      countryName: nextRow.countryName,
      maerskGeoLocationId: nextRow.maerskGeoLocationId,
      maerskRkstCode: nextRow.maerskRkstCode,
      UNCode: nextRow.UNCode,
      shippingline: undefined,
    })
    setEditingKey(nextRow.rowKey)
  }, [canWrite, editingKey, form, resetPage])

  const handleSave = useCallback(async (record: EditableBasePortRow) => {
    try {
      setSaving(true)
      const values = await form.validateFields()
      const payload: BasePortSavePayload = {
        id: Number(values.id),
        cityName: values.cityName.trim(),
        countryCode: values.countryCode.trim(),
        countryGeoId: values.countryGeoId.trim(),
        countryName: values.countryName?.trim() || undefined,
        maerskGeoLocationId: values.maerskGeoLocationId?.trim() || undefined,
        maerskRkstCode: values.maerskRkstCode?.trim() || undefined,
        UNCode: values.UNCode?.trim() || '',
        shippingline: joinShippingLines(values.shippingline),
      }

      if (record.isNew) {
        await createBasePort(payload)
        message.success('新增成功')
      } else {
        await updateBasePort(payload)
        message.success('保存成功')
      }

      setEditingKey('')
      await loadPageData()
    } catch (error) {
      if (error instanceof Error && 'errorFields' in error) {
        message.error('数据不能为空')
        return
      }
      const messageText = error instanceof Error ? error.message : '保存失败，请稍后重试。'
      message.error(messageText)
    } finally {
      setSaving(false)
    }
  }, [form, loadPageData])

  const handleCancelEdit = useCallback(() => {
    setEditingKey('')
    void loadPageData()
  }, [loadPageData])

  const columns = useMemo(
    () => [
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
        render: (value: string | null) => value || '-',
      },
      {
        title: '操作',
        key: 'operation',
        dataIndex: 'operation',
        width: ACTION_COLUMN_WIDTH,
        fixed: 'right' as const,
        render: (_: unknown, record: EditableBasePortRow) => {
          if (!canWrite) return null
          const editing = isEditing(record)
          if (editing) {
            return (
              <Space size={8}>
                <Typography.Link disabled={saving} onClick={() => void handleSave(record)}>
                  保存
                </Typography.Link>
                <Popconfirm
                  title="确认取消当前编辑吗？"
                  okText="是"
                  cancelText="否"
                  onConfirm={handleCancelEdit}
                >
                  <Typography.Link disabled={saving}>取消</Typography.Link>
                </Popconfirm>
              </Space>
            )
          }
          return (
            <Typography.Link disabled={Boolean(editingKey)} onClick={() => startEdit(record)}>
              修改
            </Typography.Link>
          )
        },
      },
    ],
    [canWrite, editingKey, handleCancelEdit, handleSave, isEditing, saving, startEdit]
  )

  const defaultColumnKeys = useMemo(
    () => columns.filter((column) => typeof column.key === 'string').map((column) => String(column.key)),
    [columns]
  )

  const { tableSize, selectedColumnKeys, setTableSize, setSelectedColumnKeys } = useListViewPreferences({
    tableId: TABLE_ID,
    defaultColumnKeys,
    defaultDensity: 'middle',
  })

  const visibleColumns = useMemo(
    () => columns.filter((column) => typeof column.key !== 'string' || selectedColumnKeys.includes(String(column.key))),
    [columns, selectedColumnKeys]
  )

  const mergedColumns = useMemo(
    () =>
      visibleColumns.map((column) => {
        if (!('dataIndex' in column) || column.dataIndex === 'operation') {
          return column
        }

        return {
          ...column,
          onCell: (record: EditableBasePortRow) => ({
            record,
            dataIndex: column.dataIndex as keyof BasePortFormValues,
            title: String(column.title),
            editing: isEditing(record),
            shippingLineOptions,
          }),
        }
      }),
    [isEditing, shippingLineOptions, visibleColumns]
  )

  const pagedRows = useMemo(() => {
    const startIndex = (current - 1) * pageSize
    return rows.slice(startIndex, startIndex + pageSize)
  }, [current, pageSize, rows])

  const tablePagination = useMemo(
    () => ({
      ...pagination,
      placement: ['bottomRight'] as const,
      showTotal: (total: number) => `共 ${total} 条数据`,
    }),
    [pagination]
  )

  const tableNode = (
    <Form form={form} component={false}>
      <Table<EditableBasePortRow>
        className={STANDARD_LIST_TABLE_CLASS_NAME}
        rowKey="rowKey"
        bordered
        scroll={{ x: 1460 }}
        pagination={tablePagination}
        dataSource={pagedRows}
        columns={mergedColumns}
        size={tableSize}
        components={{
          body: {
            cell: EditableCell,
          },
        }}
      />
    </Form>
  )

  return (
    <div className="space-y-4 pb-20">
      <Typography.Title level={4} className="!mb-1">
        {PAGE_TITLE}
      </Typography.Title>

      <Card
        variant="borderless"
        extra={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canWrite ? (
              <Button type="primary" onClick={handleAdd} disabled={Boolean(editingKey)}>
                新增一行
              </Button>
            ) : null}
            <ListToolbarActions
              tableSize={tableSize}
              densityItems={[
                { key: 'large', label: '宽松' },
                { key: 'middle', label: '默认' },
                { key: 'small', label: '紧凑' },
              ]}
              onTableSizeChange={setTableSize}
              onReload={() => {
                void loadPageData()
              }}
              columnSettingContent={
                <Checkbox.Group
                  value={selectedColumnKeys}
                  onChange={(values) => setSelectedColumnKeys(values as string[])}
                >
                  <Space orientation="vertical">
                    {columns
                      .filter((column) => typeof column.key === 'string')
                      .map((column) => (
                        <Checkbox key={String(column.key)} value={String(column.key)}>
                          {String(column.title)}
                        </Checkbox>
                      ))}
                  </Space>
                </Checkbox.Group>
              }
            />
          </div>
        }
      >
        {loading ? (
          <QueryStateBlock state="loading" title="基础端口列表加载中，请稍候。" />
        ) : errorMessage ? (
          <QueryStateBlock
            state="error"
            title="基础端口列表加载失败"
            description={errorMessage}
            primaryActionLabel="重新加载"
            onPrimaryAction={() => {
              void loadPageData()
            }}
          />
        ) : rows.length === 0 ? (
          <QueryStateBlock
            state="empty"
            title="暂无基础端口数据"
            description="当前没有可展示的基础端口记录。"
            primaryActionLabel={canWrite ? '新增一行' : undefined}
            onPrimaryAction={canWrite ? handleAdd : undefined}
          />
        ) : (
          tableNode
        )}
      </Card>
    </div>
  )
}
