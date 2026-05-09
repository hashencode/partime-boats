import React, { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
} from 'antd'
import type {
  ColProps,
  DatePickerProps,
  FormInstance,
  FormItemProps,
  FormProps,
  InputProps,
  RowProps,
  SelectProps,
} from 'antd'

type FilterFieldName<TValues> = Extract<keyof TValues, string>

type TemplateListFilterOption = {
  label: React.ReactNode
  value: string | number
}

type TemplateListFilterFieldBase<TValues extends Record<string, unknown>> = {
  key?: string
  label?: React.ReactNode
  colProps?: ColProps
  formItemProps?: Omit<FormItemProps<TValues>, 'name' | 'label' | 'children'>
  visibleWhen?: (values: Partial<TValues>) => boolean
  disabledWhen?: (values: Partial<TValues>) => boolean
}

type TemplateListInputField<TValues extends Record<string, unknown>> =
  TemplateListFilterFieldBase<TValues> & {
    type: 'input'
    name: FilterFieldName<TValues>
    inputProps?: InputProps
  }

type TemplateListDateField<TValues extends Record<string, unknown>> =
  TemplateListFilterFieldBase<TValues> & {
    type: 'date'
    name: FilterFieldName<TValues>
    datePickerProps?: DatePickerProps
  }

type TemplateListSelectField<TValues extends Record<string, unknown>> =
  TemplateListFilterFieldBase<TValues> & {
    type: 'select'
    name: FilterFieldName<TValues>
    options?: TemplateListFilterOption[]
    optionsLoader?: (context: {
      values: Partial<TValues>
      signal: AbortSignal
    }) => Promise<TemplateListFilterOption[]>
    dependsOn?: FilterFieldName<TValues>[]
    selectProps?: SelectProps
    onLoadError?: (error: unknown) => void
  }

type TemplateListCustomField<TValues extends Record<string, unknown>> =
  TemplateListFilterFieldBase<TValues> & {
    type: 'custom'
    render: (context: {
      values: Partial<TValues>
      form: FormInstance<TValues>
    }) => React.ReactNode
  }

export type TemplateListFilterField<TValues extends Record<string, unknown>> =
  | TemplateListInputField<TValues>
  | TemplateListDateField<TValues>
  | TemplateListSelectField<TValues>
  | TemplateListCustomField<TValues>

type TemplateListFilterFormProps<TValues extends Record<string, unknown>> = {
  form: FormInstance<TValues>
  fields: TemplateListFilterField<TValues>[]
  onSubmit: (values: TValues) => void
  onReset: () => void
  onValuesChange?: (values: TValues) => void
  formProps?: Omit<FormProps<TValues>, 'form' | 'onFinish' | 'onValuesChange'>
  rowGutter?: RowProps['gutter']
  fieldColProps: ColProps
  actionsColProps: ColProps
  labelCol?: ColProps
  wrapperCol?: ColProps
  submitText?: string
  resetText?: string
}

const TemplateListFilterFieldNode = <TValues extends Record<string, unknown>>({
  field,
  form,
  values,
  defaultColProps,
  labelCol,
  wrapperCol,
}: {
  field: TemplateListFilterField<TValues>
  form: FormInstance<TValues>
  values: Partial<TValues>
  defaultColProps: ColProps
  labelCol?: ColProps
  wrapperCol?: ColProps
}) => {
  const visible = field.visibleWhen ? field.visibleWhen(values) : true

  const colProps = field.colProps ?? defaultColProps
  if (!visible) {
    return null
  }

  if (field.type === 'custom') {
    return <Col {...colProps}>{field.render({ values, form })}</Col>
  }

  const disabled = field.disabledWhen ? field.disabledWhen(values) : false

  if (field.type === 'select') {
    return (
      <TemplateListSelectFilterFieldNode
        field={field}
        values={values}
        disabled={disabled}
        colProps={colProps}
        labelCol={labelCol}
        wrapperCol={wrapperCol}
      />
    )
  }

  return (
    <Col {...colProps}>
      <Form.Item<TValues>
        label={field.label}
        name={field.name as never}
        className="!mb-0 !mr-0"
        labelCol={labelCol}
        wrapperCol={wrapperCol}
        labelAlign="right"
        {...field.formItemProps}
      >
        {field.type === 'input' ? (
          <Input allowClear className="!w-full" disabled={disabled} {...field.inputProps} />
        ) : (
          <DatePicker className="!w-full" disabled={disabled} {...field.datePickerProps} />
        )}
      </Form.Item>
    </Col>
  )
}

const TemplateListSelectFilterFieldNode = <
  TValues extends Record<string, unknown>,
>({
  field,
  values,
  disabled,
  colProps,
  labelCol,
  wrapperCol,
}: {
  field: TemplateListSelectField<TValues>
  values: Partial<TValues>
  disabled: boolean
  colProps: ColProps
  labelCol?: ColProps
  wrapperCol?: ColProps
}) => {
  const [dynamicOptions, setDynamicOptions] = useState<TemplateListFilterOption[]>([])
  const optionsLoader = field.optionsLoader
  const onLoadError = field.onLoadError
  const dependencyValues = useMemo(() => {
    if (!field.dependsOn || field.dependsOn.length === 0) {
      return {} as Partial<TValues>
    }

    return field.dependsOn.reduce<Partial<TValues>>((acc, name) => {
      acc[name] = values[name]
      return acc
    }, {})
  }, [field.dependsOn, values])
  const dependencyKey = useMemo(() => {
    if (!field.dependsOn || field.dependsOn.length === 0) {
      return '__no_dependency__'
    }

    return JSON.stringify(dependencyValues)
  }, [dependencyValues, field.dependsOn])

  useEffect(() => {
    if (!optionsLoader) {
      return
    }

    const controller = new AbortController()
    const requestValues =
      dependencyKey === '__no_dependency__'
        ? ({} as Partial<TValues>)
        : (JSON.parse(dependencyKey) as Partial<TValues>)

    void optionsLoader({ values: requestValues, signal: controller.signal })
      .then((options) => {
        if (controller.signal.aborted) {
          return
        }

        setDynamicOptions(options)
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return
        }

        setDynamicOptions([])
        onLoadError?.(error)
      })

    return () => {
      controller.abort()
    }
  }, [dependencyKey, onLoadError, optionsLoader])

  const options = field.optionsLoader ? dynamicOptions : (field.options ?? [])

  return (
    <Col {...colProps}>
      <Form.Item<TValues>
        label={field.label}
        name={field.name as never}
        className="!mb-0 !mr-0"
        labelCol={labelCol}
        wrapperCol={wrapperCol}
        labelAlign="right"
        {...field.formItemProps}
      >
        <Select
          allowClear
          className="!w-full"
          disabled={disabled}
          options={options}
          {...field.selectProps}
        />
      </Form.Item>
    </Col>
  )
}

export const TemplateListFilterForm = <TValues extends Record<string, unknown>>({
  form,
  fields,
  onSubmit,
  onReset,
  onValuesChange,
  formProps,
  rowGutter = [16, 12],
  fieldColProps,
  actionsColProps,
  labelCol,
  wrapperCol,
  submitText = '查询',
  resetText = '重置',
}: TemplateListFilterFormProps<TValues>) => {
  const values =
    (Form.useWatch(
      (currentValues) => currentValues as Partial<TValues>,
      form
    ) as Partial<TValues> | undefined) ?? {}

  return (
    <Form<TValues>
      form={form}
      layout="inline"
      className="w-full"
      {...formProps}
      onFinish={onSubmit}
      onValuesChange={(_, allValues) => {
        onValuesChange?.(allValues as TValues)
      }}
    >
      <Row className="w-full" gutter={rowGutter}>
        {fields.map((field, index) => (
          <TemplateListFilterFieldNode
            key={field.key ?? `template-list-filter-field-${index}`}
            field={field}
            form={form}
            values={values}
            defaultColProps={fieldColProps}
            labelCol={labelCol}
            wrapperCol={wrapperCol}
          />
        ))}
        <Col {...actionsColProps}>
          <Form.Item className="!mb-0 !mr-0">
            <div className="flex justify-end gap-2">
              <Button htmlType="button" onClick={onReset}>
                {resetText}
              </Button>
              <Button type="primary" htmlType="submit">
                {submitText}
              </Button>
            </div>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  )
}
