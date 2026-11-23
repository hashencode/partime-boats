import { Form, Input, InputNumber, Select, message } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../infrastructure/auth/use-auth'
import type { ApiError } from '../../../infrastructure/http/api-client'
import type { ParsedFormMode } from '../../../routes/form-route-contract'
import { BasicCrudFormRecipe, useTemplateFormController, type BasicCrudFormSpec } from '../../../shared/template-kit/form'
import { useFormModeAccess, useListRefreshChannel } from '../../../shared/template-kit/hooks'
import { ACCOUNT_BOOLEAN_OPTIONS, ACCOUNT_REFRESH_EVENT, MSK_ACCOUNT_CONFIG, type MskAccountKind } from './account-config'
import { createMskAccount, fetchMskAccountDetail, toAccountApiError, updateMskAccount, type MskAccount, type MskAccountChanges } from './api'

void React

type AccountFormValues = {
  account: string
  password: string
  customer_code: string
  account_type: number
  use_type: number
  is_use: number
  is_refresh_use: number
  update_time?: string
}

const DEFAULT_VALUES: AccountFormValues = {
  account: '',
  password: '',
  customer_code: '',
  account_type: 1,
  use_type: 1,
  is_use: 1,
  is_refresh_use: 1,
  update_time: '',
}

const toEditableValues = (entity: MskAccount): AccountFormValues => ({
  account: entity.account,
  password: '',
  customer_code: entity.customer_code ?? '',
  account_type: entity.account_type ?? 1,
  use_type: entity.use_type ?? 1,
  is_use: entity.is_use ?? 1,
  is_refresh_use: entity.is_refresh_use ?? 1,
  update_time: entity.update_time ?? '',
})

const toChanges = (values: AccountFormValues, baseline: MskAccount): MskAccountChanges => {
  const previous = toEditableValues(baseline)
  const changes: MskAccountChanges = {}
  if (values.account.trim() !== previous.account.trim()) changes.account = values.account.trim()
  if (values.password !== '' && values.password !== baseline.password) changes.password = values.password
  for (const key of ['use_type', 'is_use', 'is_refresh_use'] as const) {
    if (values[key] !== previous[key]) changes[key] = values[key]
  }
  return changes
}

const toPayload = (values: AccountFormValues) => values

const MskAccountFormPage = ({ kind }: { kind: MskAccountKind }) => {
  const config = MSK_ACCOUNT_CONFIG[kind]
  const [form] = Form.useForm<AccountFormValues>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const baseline = useRef<MskAccount | null>(null)
  const access = useFormModeAccess({ searchParams, role })
  const rawAccountType = searchParams.get('account_type')
  const accountType = rawAccountType === null ? 1 : Number(rawAccountType)
  const originalAccount = searchParams.get('original_account') ?? undefined
  const parsedMode = useMemo<ParsedFormMode>(() => {
    if (access.parsedMode.ok && kind === 'booking' && access.parsedMode.mode === 'add') {
      return { ok: false, errorCode: 'ROUTE_PARAM_INVALID', message: '订舱账号不支持单条新增，请返回列表导入账号。' }
    }
    if (access.parsedMode.ok && (!Number.isInteger(accountType) || accountType < 0)) {
      return { ok: false, errorCode: 'ROUTE_PARAM_INVALID', message: '账号类型无效，请返回列表重新打开账号。' }
    }
    return access.parsedMode
  }, [access.parsedMode, accountType, kind])
  const modeView = parsedMode.ok ? access.modeView : null
  const { isReadonly, permissionDenied } = access
  const isAddMode = parsedMode.ok && parsedMode.mode === 'add'
  const { publishRefresh } = useListRefreshChannel({ channelName: config.refreshChannel, eventType: ACCOUNT_REFRESH_EVENT })

  const assertCanWrite = useCallback(() => {
    if (!parsedMode.ok || isReadonly || permissionDenied) {
      throw new Error('当前页面不允许保存账号，请返回列表重新打开。')
    }
  }, [isReadonly, parsedMode, permissionDenied])

  const toValues = useCallback((entity: MskAccount): AccountFormValues => {
    // The controller calls this only after accepting the latest detail response.
    baseline.current = entity
    return { ...toEditableValues(entity), password: isReadonly ? entity.password ?? '' : '' }
  }, [isReadonly])

  const fetchDetail = useCallback(async (id: string) => {
    const entity = await fetchMskAccountDetail(kind, id, { original_account: originalAccount, account_type: accountType })
    return entity
  }, [accountType, kind, originalAccount])

  const acceptSavedEntity = useCallback((entity: MskAccount) => {
    baseline.current = entity
    form.setFieldsValue(toValues(entity))
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('mode', 'modify')
      next.set('id', entity._id)
      next.delete('resourceKey')
      next.set('original_account', entity.account)
      next.set('account_type', String(entity.account_type ?? 1))
      return next
    }, { replace: true })
  }, [form, setSearchParams, toValues])

  const createEntity = useCallback(async (values: AccountFormValues): Promise<MskAccount> => {
    assertCanWrite()
    if (kind !== 'query' || !parsedMode.ok || parsedMode.mode !== 'add') throw new Error('当前页面不允许新增账号。')
    const payload = {
      account: values.account.trim(),
      password: values.password,
      customer_code: values.customer_code.trim() || undefined,
      account_type: values.account_type,
      use_type: values.use_type,
      is_use: values.is_use,
      is_refresh_use: values.is_refresh_use,
    }
    const result = await createMskAccount(payload)
    const entity = { ...payload, _id: result._id }
    acceptSavedEntity(entity)
    return entity
  }, [acceptSavedEntity, assertCanWrite, kind, parsedMode])

  const updateEntity = useCallback(async (id: string, values: AccountFormValues): Promise<MskAccount> => {
    assertCanWrite()
    if (!parsedMode.ok || parsedMode.mode !== 'modify' || parsedMode.resourceKey !== id || baseline.current?._id !== id) {
      throw new Error('账号详情尚未加载，请重新加载后保存。')
    }
    const changes = toChanges(values, baseline.current)
    if (!Object.keys(changes).length) return baseline.current
    await updateMskAccount(kind, id, changes)
    const entity = { ...baseline.current, ...changes }
    acceptSavedEntity(entity)
    return entity
  }, [acceptSavedEntity, assertCanWrite, kind, parsedMode])

  const { detailLoading, detailError, saveLoading, initializeForm, loadDetail, submitFormValues } = useTemplateFormController<AccountFormValues, MskAccount, AccountFormValues, ApiError>({
    form,
    parsedMode,
    modeView,
    defaultValues: DEFAULT_VALUES,
    fetchDetail,
    createEntity,
    updateEntity,
    toValues,
    toPayload,
    mapError: toAccountApiError,
  })

  useEffect(() => {
    if (!permissionDenied) void initializeForm()
  }, [initializeForm, permissionDenied])

  const spec: BasicCrudFormSpec<AccountFormValues> = {
    parsedMode,
    modeView,
    permissionDenied,
    detailLoading,
    detailError,
    saveLoading,
    isReadonly,
    form,
    initialValues: DEFAULT_VALUES,
    title: config.title,
    stateCopy: { readonlyNotice: '查看模式', submitBlockedMessage: '查看模式不允许提交。', submitSuccessMessage: isAddMode ? '新增成功' : '保存成功' },
    onBackToList: () => navigate(config.listPath),
    onRetryDetail: () => { void loadDetail() },
    onResetAll: () => {
      form.resetFields()
      form.setFieldsValue(baseline.current ? toValues(baseline.current) : DEFAULT_VALUES)
    },
    onSubmit: async (values) => {
      if (!parsedMode.ok || isReadonly || permissionDenied || saveLoading) return
      if (!isAddMode && baseline.current && !Object.keys(toChanges(values, baseline.current)).length) {
        message.info('未修改账号信息')
        return
      }
      const result = await submitFormValues(values)
      if (!result.success) {
        message.error(result.error.message)
        return
      }
      message.success(isAddMode ? '新增成功' : '保存成功')
      publishRefresh({ source: `${kind}-account-form` })
    },
    renderFields: () => (
      <>
        <Form.Item label="账号" name="account" rules={[{ required: true, whitespace: true, message: '请输入账号' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="密码" name="password" rules={isAddMode ? [{ required: true, message: '请输入密码' }] : undefined}>
          <Input.Password placeholder={isReadonly || isAddMode ? undefined : '留空则不修改密码'} />
        </Form.Item>
        <Form.Item label="客户代码" name="customer_code">
          <Input disabled={!isAddMode} />
        </Form.Item>
        <Form.Item label="账号类型" name="account_type" rules={[{ required: true, message: '请输入账号类型' }]}>
          <InputNumber className="!w-full" min={0} precision={0} disabled={!isAddMode} />
        </Form.Item>
        <Form.Item label="使用类型" name="use_type" rules={[{ required: true, message: '请输入使用类型' }]}>
          <InputNumber className="!w-full" min={0} precision={0} />
        </Form.Item>
        <Form.Item label="是否启用" name="is_use" rules={[{ required: true, message: '请选择是否启用' }]}>
          <Select options={ACCOUNT_BOOLEAN_OPTIONS} />
        </Form.Item>
        <Form.Item label="是否使用刷新" name="is_refresh_use" rules={[{ required: true, message: '请选择是否使用刷新' }]}>
          <Select options={ACCOUNT_BOOLEAN_OPTIONS} />
        </Form.Item>
        <Form.Item label="更新时间" name="update_time">
          <Input disabled />
        </Form.Item>
      </>
    ),
  }

  return <BasicCrudFormRecipe spec={spec} />
}

export const MskBookAccountFormPage = () => <MskAccountFormPage kind="booking" />
export const MskQueryAccountFormPage = () => <MskAccountFormPage kind="query" />
