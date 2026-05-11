import type { TemplateListFilterField } from './template-list-filter-form'
import { createCachedStringOptionsLoader } from './list-metadata-cache'

type FilterFieldName<TValues> = Extract<keyof TValues, string>

type PortFilterFieldsConfig<TValues extends Record<string, unknown>> = {
  originName: FilterFieldName<TValues>
  destinationName: FilterFieldName<TValues>
  originLabel?: string
  destinationLabel?: string
  originPlaceholder?: string
  destinationPlaceholder?: string
  originCacheKey: string
  destinationCacheKey: string
  fetchOriginOptions: () => Promise<string[]>
  fetchDestinationOptions: () => Promise<string[]>
  originAllowClear?: boolean
  destinationAllowClear?: boolean
}

type ShippingLineFieldConfig<TValues extends Record<string, unknown>> = {
  name: FilterFieldName<TValues>
  label?: string
  placeholder?: string
  cacheKey: string
  fetchOptions: () => Promise<string[]>
  allowClear?: boolean
}

export const createPortFilterFields = <TValues extends Record<string, unknown>>({
  originName,
  destinationName,
  originLabel = '起始港',
  destinationLabel = '目的港',
  originPlaceholder = '请选择起始港',
  destinationPlaceholder = '请选择目的港',
  originCacheKey,
  destinationCacheKey,
  fetchOriginOptions,
  fetchDestinationOptions,
  originAllowClear = true,
  destinationAllowClear = true,
}: PortFilterFieldsConfig<TValues>): TemplateListFilterField<TValues>[] => {
  return [
    {
      type: 'select',
      name: originName,
      label: originLabel,
      selectProps: { showSearch: true, allowClear: originAllowClear, placeholder: originPlaceholder },
      optionsLoader: createCachedStringOptionsLoader<TValues>(originCacheKey, fetchOriginOptions),
    },
    {
      type: 'select',
      name: destinationName,
      label: destinationLabel,
      selectProps: { showSearch: true, allowClear: destinationAllowClear, placeholder: destinationPlaceholder },
      optionsLoader: createCachedStringOptionsLoader<TValues>(destinationCacheKey, fetchDestinationOptions),
    },
  ]
}

export const createShippingLineFilterField = <TValues extends Record<string, unknown>>({
  name,
  label = '航线',
  placeholder = '请选择航线',
  cacheKey,
  fetchOptions,
  allowClear = true,
}: ShippingLineFieldConfig<TValues>): TemplateListFilterField<TValues> => {
  return {
    type: 'select',
    name,
    label,
    selectProps: { showSearch: true, allowClear, placeholder },
    optionsLoader: createCachedStringOptionsLoader<TValues>(cacheKey, fetchOptions),
  }
}
