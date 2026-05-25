import { Select, type SelectProps } from 'antd'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { getCachedListMetadata } from '../template-kit/list/list-metadata-cache'

void React

type RemoteStringOption = {
  label: string
  value: string
}

type RemoteStringSelectProps = Omit<SelectProps<string>, 'options'> & {
  cacheKey: string
  request: () => Promise<string[]>
  onLoadError?: (error: unknown) => void
}

const toOptions = (items: string[]): RemoteStringOption[] => items.map((item) => ({ label: item, value: item }))

const appendMissingSelectedOptions = (
  options: RemoteStringOption[],
  value: RemoteStringSelectProps['value']
): RemoteStringOption[] => {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : []
  if (selectedValues.length === 0) {
    return options
  }

  const optionMap = new Map(options.map((option) => [option.value, option]))
  selectedValues.forEach((selectedValue) => {
    const normalizedValue = String(selectedValue)
    if (!optionMap.has(normalizedValue)) {
      optionMap.set(normalizedValue, { label: normalizedValue, value: normalizedValue })
    }
  })

  return Array.from(optionMap.values())
}

export const RemoteStringSelect = ({ cacheKey, request, onLoadError, value, ...selectProps }: RemoteStringSelectProps) => {
  const [options, setOptions] = useState<RemoteStringOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)

    void getCachedListMetadata(cacheKey, request)
      .then((items) => {
        if (!active) {
          return
        }

        setOptions(toOptions(items))
      })
      .catch((error) => {
        if (!active) {
          return
        }

        setOptions([])
        onLoadError?.(error)
      })
      .finally(() => {
        if (!active) {
          return
        }

        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [cacheKey, onLoadError, request])

  const mergedOptions = useMemo(() => appendMissingSelectedOptions(options, value), [options, value])

  return <Select<string> allowClear showSearch loading={loading} value={value} options={mergedOptions} {...selectProps} />
}
