import { Form, Input, InputNumber, Select, message } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { normalizeApiError, type ApiError } from '../../../infrastructure/http/api-client'
import { useAuth } from '../../../infrastructure/auth/use-auth'
import { LIST_REFRESH_CHANNEL, LIST_REFRESH_EVENT } from '../../../shared/constants/list-refresh-channel'
import { BasicCrudFormRecipe, type BasicCrudFormSpec } from '../../../shared/template-kit/form'
import { useFormModeAccess, useListRefreshChannel } from '../../../shared/template-kit/hooks'
import {
  createBasePort,
  fetchBasePortDetail,
  fetchShippingLineOptions,
  updateBasePort,
  type BasePortItem,
  type BasePortSavePayload,
} from './api'
import { useTemplateFormController } from '../../../shared/template-kit/form'

void React

type BasePortFormValues = {
  id: number | null
  cityName: string
  countryCode: string
  countryGeoId: string
  countryName?: string
  maerskGeoLocationId?: string
  maerskRkstCode?: string
  UNCode?: string
  shippingline?: string[]
}

const PAGE_TITLE = '基础端口'

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

const toFormValues = (entity: BasePortItem): BasePortFormValues => ({
  id: entity.id,
  cityName: entity.cityName ?? '',
  countryCode: entity.countryCode ?? '',
  countryGeoId: entity.countryGeoId ?? '',
  countryName: entity.countryName ?? '',
  maerskGeoLocationId: entity.maerskGeoLocationId ?? '',
  maerskRkstCode: entity.maerskRkstCode ?? '',
  UNCode: entity.UNCode ?? '',
  shippingline: splitShippingLines(entity.shippingline),
})

const toPayload = (values: BasePortFormValues): BasePortSavePayload => ({
  id: Number(values.id),
  cityName: values.cityName.trim(),
  countryCode: values.countryCode.trim(),
  countryGeoId: values.countryGeoId.trim(),
  countryName: values.countryName?.trim() || undefined,
  maerskGeoLocationId: values.maerskGeoLocationId?.trim() || undefined,
  maerskRkstCode: values.maerskRkstCode?.trim() || undefined,
  UNCode: values.UNCode?.trim() || '',
  shippingline: joinShippingLines(values.shippingline),
})

const buildDefaultValues = (): Partial<BasePortFormValues> => ({
  id: null,
  cityName: '',
  countryCode: '',
  countryGeoId: '',
  countryName: '',
  maerskGeoLocationId: '',
  maerskRkstCode: '',
  UNCode: '',
  shippingline: undefined,
})

const toEntityFromPayload = (payload: BasePortSavePayload): BasePortItem => ({
  id: payload.id,
  cityName: payload.cityName,
  countryCode: payload.countryCode,
  countryGeoId: payload.countryGeoId,
  countryName: payload.countryName,
  maerskGeoLocationId: payload.maerskGeoLocationId,
  maerskRkstCode: payload.maerskRkstCode,
  UNCode: payload.UNCode,
  shippingline: payload.shippingline,
})

export const BasePortFormPage = () => {
  const [form] = Form.useForm<BasePortFormValues>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const [shippingLineOptions, setShippingLineOptions] = useState<string[]>([])
  const defaultValues = useMemo(() => buildDefaultValues(), [])
  const { publishRefresh } = useListRefreshChannel({
    channelName: LIST_REFRESH_CHANNEL,
    eventType: LIST_REFRESH_EVENT.REFRESH_LIST,
  })
  const { parsedMode, modeView, isReadonly, permissionDenied } = useFormModeAccess({
    searchParams,
    role,
  })
  const {
    detailLoading,
    detailError,
    saveLoading,
    initializeForm,
    loadDetail,
    resetFormValues,
    submitFormValues,
  } = useTemplateFormController<BasePortFormValues, BasePortItem, BasePortSavePayload, ApiError>({
    form,
    parsedMode,
    modeView,
    defaultValues,
    fetchDetail: fetchBasePortDetail,
    createEntity: async (payload) => {
      await createBasePort(payload)
      return toEntityFromPayload(payload)
    },
    updateEntity: async (resourceKey, payload) => {
      void resourceKey
      await updateBasePort(payload)
      return toEntityFromPayload(payload)
    },
    toValues: toFormValues,
    toPayload,
    mapError: normalizeApiError,
  })
  const isAddMode = parsedMode.ok && parsedMode.mode === 'add'

  useEffect(() => {
    void initializeForm()
  }, [initializeForm])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await fetchShippingLineOptions()
        setShippingLineOptions(options)
      } catch (error) {
        const messageText = error instanceof Error ? error.message : '航线选项加载失败，请稍后重试。'
        message.error(messageText)
      }
    }

    void loadOptions()
  }, [])

  const spec = useMemo<BasicCrudFormSpec<BasePortFormValues>>(
    () => ({
      parsedMode,
      modeView,
      permissionDenied,
      detailLoading,
      detailError,
      saveLoading,
      isReadonly,
      form,
      initialValues: defaultValues,
      title: PAGE_TITLE,
      stateCopy: {
        readonlyNotice: '当前为查看模式，基础端口内容仅可查看，不可编辑或保存。',
        submitBlockedMessage: '查看模式不允许提交。',
        submitSuccessMessage: isAddMode ? '新增成功' : '保存成功',
      },
      onBackToList: () => navigate('/get_base_list'),
      onRetryDetail: () => {
        void loadDetail()
      },
      onResetAll: resetFormValues,
      onSubmit: async (values) => {
        if (isReadonly) {
          message.warning('查看模式不允许提交。')
          return
        }

        const submitResult = await submitFormValues(values)
        if (submitResult.success) {
          message.success(isAddMode ? '新增成功' : '保存成功')
          publishRefresh({ source: 'base-port-form' })
        } else {
          message.error(submitResult.error.message)
        }
      },
      renderFields: () => (
        <>
          <Form.Item label="ID" name="id" rules={[{ required: true, message: '请输入ID' }]}>
            <InputNumber className="!w-full" min={1} precision={0} />
          </Form.Item>

          <Form.Item label="cityName" name="cityName" rules={[{ required: true, message: '请输入cityName' }]}>
            <Input placeholder="请输入cityName" />
          </Form.Item>

          <Form.Item label="countryCode" name="countryCode" rules={[{ required: true, message: '请输入countryCode' }]}>
            <Input placeholder="请输入countryCode" />
          </Form.Item>

          <Form.Item label="countryGeoId" name="countryGeoId" rules={[{ required: true, message: '请输入countryGeoId' }]}>
            <Input placeholder="请输入countryGeoId" />
          </Form.Item>

          <Form.Item label="countryName" name="countryName">
            <Input placeholder="请输入countryName" />
          </Form.Item>

          <Form.Item label="maerskGeoLocationId" name="maerskGeoLocationId">
            <Input placeholder="请输入maerskGeoLocationId" />
          </Form.Item>

          <Form.Item label="maerskRkstCode" name="maerskRkstCode">
            <Input placeholder="请输入maerskRkstCode" />
          </Form.Item>

          <Form.Item label="UNCode" name="UNCode">
            <Input placeholder="请输入UNCode" />
          </Form.Item>

          <Form.Item label="shippingline" name="shippingline">
            <Select
              mode="multiple"
              allowClear
              showSearch
              placeholder="请选择航线"
              options={shippingLineOptions.map((item) => ({ label: item, value: item }))}
            />
          </Form.Item>
        </>
      ),
    }),
    [
      defaultValues,
      detailError,
      detailLoading,
      form,
      isAddMode,
      isReadonly,
      loadDetail,
      modeView,
      navigate,
      parsedMode,
      permissionDenied,
      publishRefresh,
      resetFormValues,
      saveLoading,
      shippingLineOptions,
      submitFormValues,
    ]
  )

  return <BasicCrudFormRecipe spec={spec} />
}
