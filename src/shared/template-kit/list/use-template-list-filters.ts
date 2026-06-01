import { useCallback, useState } from 'react'
import type { FormInstance } from 'antd'

type UseTemplateListFiltersOptions<
  TValues extends Record<string, unknown>,
  TFilters,
> = {
  form: FormInstance<TValues>
  initialFilters: TFilters
  toFilters: (values: TValues) => TFilters
  onResetPage?: () => void
  autoApplyOnValuesChange?: boolean
}

type UseTemplateListFiltersResult<
  TValues extends Record<string, unknown>,
  TFilters,
> = {
  filters: TFilters
  queryVersion: number
  setFilters: React.Dispatch<React.SetStateAction<TFilters>>
  onSubmit: (values: TValues) => void
  onValuesChange: (values: TValues) => void
  onReset: () => void
}

export const useTemplateListFilters = <
  TValues extends Record<string, unknown>,
  TFilters,
>({
  form,
  initialFilters,
  toFilters,
  onResetPage,
  autoApplyOnValuesChange = true,
}: UseTemplateListFiltersOptions<
  TValues,
  TFilters
>): UseTemplateListFiltersResult<TValues, TFilters> => {
  const [filters, setFilters] = useState<TFilters>(initialFilters)
  const [queryVersion, setQueryVersion] = useState(0)

  const applyFilters = useCallback(
    (values: TValues) => {
      setFilters(toFilters(values))
      setQueryVersion((current) => current + 1)
      onResetPage?.()
    },
    [onResetPage, toFilters]
  )

  const onSubmit = useCallback(
    (values: TValues) => {
      applyFilters(values)
    },
    [applyFilters]
  )

  const onValuesChange = useCallback(
    (values: TValues) => {
      if (!autoApplyOnValuesChange) {
        return
      }

      applyFilters(values)
    },
    [applyFilters, autoApplyOnValuesChange]
  )

  const onReset = useCallback(() => {
    form.resetFields()
    setFilters(initialFilters)
    setQueryVersion((current) => current + 1)
    onResetPage?.()
  }, [form, initialFilters, onResetPage])

  return {
    filters,
    queryVersion,
    setFilters,
    onSubmit,
    onValuesChange,
    onReset,
  }
}
