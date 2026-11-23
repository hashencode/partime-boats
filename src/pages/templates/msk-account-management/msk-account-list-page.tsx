import { Alert, Button, Form, InputNumber, Modal, Table, Upload, message, type UploadFile } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { hasPermission } from '../../../infrastructure/auth/permissions'
import { useAuth } from '../../../infrastructure/auth/use-auth'
import type { ApiError } from '../../../infrastructure/http/api-client'
import { useTheme } from '../../../shared/contexts/theme-context'
import { buildSearchGridProps } from '../../../shared/template-kit/list/build-search-grid-props'
import { ListRowActions } from '../../../shared/components/list-row-actions'
import { StandardListPageRecipe, type StandardListPageSpec, type TemplateListFilterField } from '../../../shared/template-kit/list'
import { useListRefreshChannel } from '../../../shared/template-kit/hooks'
import { ACCOUNT_BOOLEAN_OPTIONS, ACCOUNT_REFRESH_EVENT, formatAccountBoolean, MSK_ACCOUNT_CONFIG, type MskAccountKind } from './account-config'
import { deleteMskAccount, fetchMskAccountList, importMskAccounts, toAccountApiError, type MskAccount, type MskAccountFilters, type MskAccountListResponse } from './api'

void React

type FilterValues = { account?: string; account_type?: number; is_refresh_use?: number; is_use?: number; use_type?: number }
type AccountRow = MskAccount & { account_type: number }
type AccountPageResponse = MskAccountListResponse & { data: AccountRow[] }

// 修改 2 字 28px + Divider 13px + 删除 2 字 28px + 16px 余量 = 85px，向上固化 96px。
const QUERY_ACTION_WIDTH = 96
// 修改 2 字 28px + 16px 余量 = 44px；计入“操作”表头及单元格 padding，固化 64px。
const BOOK_ACTION_WIDTH = 64
// 已按浏览器前 20 条虚构验收样本测量：max(表头, P90) + 左右 padding 16px + 余量 16px，向上取 8px 倍数，上限 220px。
// 真实账号数据未用于截图；实际数据的测量范围见验收记录。
const COLUMN_WIDTHS = { account: 136, password: 168, customer_code: 88, is_refresh_use: 120, is_use: 88, use_type: 88, update_time: 168 }
const NO_WRAP_HEADER = { style: { whiteSpace: 'nowrap' as const } }
const INITIAL_FILTERS = { account_type: 1 }
const EXPORT_HEADERS = ['账号', '密码', '客户代码', '是否使用刷新', '是否启用', '使用类型', '更新时间']
const toFilters = (values: FilterValues): MskAccountFilters => ({ ...values, account: values.account?.trim() || undefined, account_type: values.account_type ?? 1 })
const selectItems = (response: AccountPageResponse | null) => response?.data ?? []

const MskAccountListPage = ({ kind }: { kind: MskAccountKind }) => {
  const config = MSK_ACCOUNT_CONFIG[kind]
  const { searchCompactLayout } = useTheme()
  const filterGrid = useMemo(() => buildSearchGridProps(5), [])
  const numericLayout = useMemo(() => searchCompactLayout
    ? { labelCol: { flex: 'none' }, wrapperCol: { flex: '220px' } }
    : { labelCol: filterGrid.labelItem, wrapperCol: filterGrid.inputItem }, [filterGrid, searchCompactLayout])
  const { role } = useAuth()
  const canWrite = hasPermission(role, 'form.write')
  const canWriteRef = useRef(canWrite)
  canWriteRef.current = canWrite
  const [modal, modalHolder] = Modal.useModal()
  const [exportReady, setExportReady] = useState(false)
  const [exporting, setExporting] = useState(false)
  const currentRows = useRef<AccountRow[]>([])
  const requestVersion = useRef(0)
  const [importOpen, setImportOpen] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [importing, setImporting] = useState(false)
  const importPending = useRef(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const deletePending = useRef(false)
  const paging = useRef<{ current: number; pageSize: number; onPageChange: (page: number, size: number) => void } | null>(null)
  const { publishRefresh } = useListRefreshChannel({ channelName: config.refreshChannel, eventType: ACCOUNT_REFRESH_EVENT })

  const request = useCallback(async (filters: MskAccountFilters) => {
    const version = ++requestVersion.current
    setExportReady(false)
    const result = await fetchMskAccountList(kind, filters)
    if (version === requestVersion.current) setExportReady(!result.partial && result.data.length > 0)
    return { ...result, data: result.data.map((row) => ({ ...row, account_type: result.accountType })) }
  }, [kind])

  const openAccountForm = useCallback((row: AccountRow) => {
    if (!canWriteRef.current) return
    const params = new URLSearchParams({ mode: 'modify', id: row._id, original_account: row.account, account_type: String(row.account_type) })
    window.open(`${config.listPath}/form?${params}`, '_blank', 'noopener,noreferrer')
  }, [config.listPath])

  const confirmDelete = useCallback((row: AccountRow) => {
    if (kind !== 'query' || !canWriteRef.current || deletePending.current) return
    let shouldRefresh = false
    modal.confirm({
      title: `删除账号 ${row.account}？`,
      content: '删除后无法恢复。',
      okText: '删除账号',
      okButtonProps: { danger: true },
      cancelText: '取消',
      afterClose: () => {
        if (!shouldRefresh) return
        const page = paging.current
        if (currentRows.current.length === 1 && page && page.current > 1) page.onPageChange(page.current - 1, page.pageSize)
        publishRefresh()
      },
      onOk: async () => {
        if (!canWriteRef.current || deletePending.current) return
        deletePending.current = true
        setDeleting(true)
        try {
          const result = await deleteMskAccount(row._id)
          shouldRefresh = true
          message.success(result.deleted ? '账号已删除' : '账号已不存在')
        } catch (error) {
          message.error(toAccountApiError(error).message)
          throw error
        } finally {
          deletePending.current = false
          setDeleting(false)
        }
      },
    })
  }, [kind, modal, publishRefresh])

  const exportCurrentPage = useCallback(async () => {
    if (!exportReady || exporting || !currentRows.current.length) return
    const rows = currentRows.current.slice()
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.utils.book_new()
      const data = rows.map((row) => [row.account, row.password ?? '', row.customer_code ?? '', formatAccountBoolean(row.is_refresh_use), formatAccountBoolean(row.is_use), String(row.use_type ?? ''), row.update_time ?? ''])
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([EXPORT_HEADERS, ...data]), config.title)
      XLSX.writeFile(workbook, `${config.title}.xlsx`)
    } catch {
      message.error('导出失败，请重试。')
    } finally { setExporting(false) }
  }, [config.title, exportReady, exporting])

  const closeImport = () => {
    if (importPending.current) return
    setImportOpen(false)
    setFiles([])
    setImportError(null)
  }
  const submitImport = async () => {
    const file = files[0]?.originFileObj
    if (!canWriteRef.current || !file || importPending.current) return
    importPending.current = true
    setImporting(true)
    setImportError(null)
    try {
      const result = await importMskAccounts(kind, file)
      setImportOpen(false)
      setFiles([])
      message.success(`处理 ${result.total} 行，新增 ${result.inserted}，匹配 ${result.matched}，修改 ${result.modified}`, 6)
      publishRefresh()
    } catch (error) {
      setImportError(toAccountApiError(error).message)
    } finally {
      importPending.current = false
      setImporting(false)
    }
  }

  const filterFields = useMemo<TemplateListFilterField<FilterValues>[]>(() => [
    { type: 'input', name: 'account', label: '账号', inputProps: { placeholder: '请输入账号' } },
    { type: 'custom', key: 'account_type', render: () => <Form.Item {...numericLayout} labelAlign={searchCompactLayout ? 'left' : 'right'} name="account_type" label="账号类型" initialValue={1} rules={[{ required: true, message: '请输入账号类型' }]} className="!mb-0"><InputNumber min={0} precision={0} className="!w-full" /></Form.Item> },
    { type: 'select', name: 'is_refresh_use', label: '是否使用刷新', options: ACCOUNT_BOOLEAN_OPTIONS },
    { type: 'select', name: 'is_use', label: '是否启用', options: ACCOUNT_BOOLEAN_OPTIONS },
    { type: 'custom', key: 'use_type', render: () => <Form.Item {...numericLayout} labelAlign={searchCompactLayout ? 'left' : 'right'} name="use_type" label="使用类型" className="!mb-0"><InputNumber min={0} precision={0} className="!w-full" /></Form.Item> },
  ], [searchCompactLayout, numericLayout])

  const spec = useMemo<StandardListPageSpec<FilterValues, MskAccountFilters, AccountPageResponse, AccountRow, ApiError>>(() => ({
    pageTitle: config.title,
    tableId: `msk-${kind}-account-list`,
    formRoute: `${config.listPath}/form`,
    initialFilters: INITIAL_FILTERS,
    toFilters,
    buildRequestFilters: ({ filters, current, pageSize }) => ({ ...filters, page: current, per_page: pageSize }),
    pagination: { defaultPageSize: 100, pageSizeOptions: [10, 20, 50, 100, 500, 1000] },
    request,
    selectItems,
    mapError: toAccountApiError,
    isPartial: (response) => Boolean(response?.partial),
    showStaleDataError: true,
    refreshChannel: { channelName: config.refreshChannel, eventType: ACCOUNT_REFRESH_EVENT },
    filterFields,
    stateCopy: {
      loadingTitle: `正在加载${config.title}...`,
      errorTitle: `${config.title}加载失败`, errorDescription: '', errorActionLabel: '重试',
      emptyTitle: '当前筛选条件下暂无账号', emptyDescription: '当前筛选条件下暂无账号', emptyActionLabel: '重置筛选',
      partialTitle: '账号信息返回不完整', partialDescription: '', partialActionLabel: '重新加载',
    },
    createAction: kind === 'query' && canWrite ? { label: '新增账号' } : undefined,
    toolbarExtra: <>
      {canWrite ? <Button type="primary" onClick={() => { if (!canWriteRef.current) return; setFiles([]); setImportError(null); setImportOpen(true) }}>Excel导入</Button> : null}
      <Button disabled={!exportReady} loading={exporting} onClick={() => void exportCurrentPage()}>导出当前页</Button>
    </>,
    buildColumns: () => [
      { title: '账号', dataIndex: 'account', key: 'account', width: COLUMN_WIDTHS.account },
      { title: '密码', dataIndex: 'password', key: 'password', width: COLUMN_WIDTHS.password },
      { title: '客户代码', dataIndex: 'customer_code', key: 'customer_code', width: COLUMN_WIDTHS.customer_code },
      { title: '是否使用刷新', dataIndex: 'is_refresh_use', key: 'is_refresh_use', width: COLUMN_WIDTHS.is_refresh_use, render: formatAccountBoolean },
      { title: '是否启用', dataIndex: 'is_use', key: 'is_use', width: COLUMN_WIDTHS.is_use, render: formatAccountBoolean },
      { title: '使用类型', dataIndex: 'use_type', key: 'use_type', width: COLUMN_WIDTHS.use_type },
      { title: '更新时间', dataIndex: 'update_time', key: 'update_time', width: COLUMN_WIDTHS.update_time },
      { title: '操作', key: 'operation', width: kind === 'query' ? QUERY_ACTION_WIDTH : BOOK_ACTION_WIDTH, fixed: 'right', render: (_: unknown, row: AccountRow) => <ListRowActions actions={[
        { key: 'edit', label: '修改', visible: canWrite, disabled: deleting, onClick: () => openAccountForm(row) },
        { key: 'delete', label: '删除', visible: canWrite && kind === 'query', danger: true, disabled: deleting, onClick: () => confirmDelete(row) },
      ]} /> },
    ].map((column) => ({ onHeaderCell: () => NO_WRAP_HEADER, render: (value: unknown) => value === null || value === undefined || value === '' ? '-' : String(value), ...column })) as ColumnsType<AccountRow>,
    buildTableNode: ({ columns, dataSource, loading, tableClassName, pagination, tableSize, current, pageSize, onPageChange }) => {
      currentRows.current = dataSource
      paging.current = { current, pageSize, onPageChange }
      return <Table<AccountRow> rowKey="_id" className={tableClassName} columns={columns} dataSource={dataSource} loading={loading} pagination={pagination} size={tableSize} scroll={{ x: 'max-content' }} />
    },
  }), [config, kind, request, filterFields, canWrite, exportReady, exporting, deleting, openAccountForm, confirmDelete, exportCurrentPage])

  return <>
    <StandardListPageRecipe spec={spec} />
    {modalHolder}
    <Modal title={`${config.title}导入`} open={importOpen} onCancel={closeImport} onOk={() => void submitImport()} okText="导入账号" cancelText="取消" confirmLoading={importing} okButtonProps={{ disabled: !files.length || !canWrite }} cancelButtonProps={{ disabled: importing }} closable={!importing} mask={{ closable: !importing }} destroyOnHidden>
      <div className="space-y-4">
        <p>仅支持 .xlsx，必需表头：account、password。账号、密码和客户代码请使用文本格式。</p>
        <Upload accept=".xlsx" maxCount={1} fileList={files} disabled={importing} beforeUpload={(file) => {
          if (!file.name.toLowerCase().endsWith('.xlsx')) { message.error('请选择 .xlsx 文件。'); return Upload.LIST_IGNORE }
          return false
        }} onChange={({ fileList }) => { setFiles(fileList); setImportError(null) }}>
          <Button disabled={importing}>选择文件</Button>
        </Upload>
        {importError ? <Alert type="error" showIcon title={importError} description="请求中断时，请先查询账号，再决定是否重新导入。" action={<Button onClick={() => { closeImport(); publishRefresh() }}>查询账号</Button>} /> : null}
      </div>
    </Modal>
  </>
}

export const MskBookAccountListPage = () => <MskAccountListPage kind="booking" />
export const MskQueryAccountListPage = () => <MskAccountListPage kind="query" />
