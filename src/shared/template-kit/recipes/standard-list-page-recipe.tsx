import {
  Button,
  Card,
  Form,
  Typography,
} from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { buildListToolbarColumnSettingOptions, ListToolbarActions } from '../../components/list-toolbar-actions'
import { useListViewPreferences } from '../../hooks/use-list-view-preferences'
import { useStandardPagination } from '../../hooks/use-standard-pagination'
import { useCrudFormNavigation } from '../hooks'
import type { StandardListPageSpec } from '../specs/standard-list-page-spec'
import { buildSearchGridProps } from '../list/build-search-grid-props'
import { buildStandardListPagination, STANDARD_LIST_TABLE_CLASS_NAME } from '../list/standard-list-pagination'
import { TemplateListContent } from '../list/template-list-content'
import { TemplateListFilterForm } from '../list/template-list-filter-form'
import { useTemplateListController } from '../list/use-template-list-controller'
import { useTemplateListFilters } from '../list/use-template-list-filters'

void React


export const StandardListPageRecipe = <
  TFilterValues extends Record<string, unknown>,
  TRequestFilters extends object,
  TResponse,
  TItem,
  TError = unknown,
>({
  spec,
}: {
  spec: StandardListPageSpec<TFilterValues, TRequestFilters, TResponse, TItem, TError>
}) => {
  const [filterForm] = Form.useForm<TFilterValues>()
  const { openFormPage } = useCrudFormNavigation(spec.formRoute)
  const [total, setTotal] = useState(0)
  const { current, pageSize, pagination, resetPage } = useStandardPagination({
    total,
    ...spec.pagination,
  })
  const tablePagination = useMemo(() => buildStandardListPagination(pagination), [pagination])

  const {
    filters,
    onSubmit: onSubmitFilters,
    onValuesChange: onValuesChangeFilters,
    onReset: onResetFilters,
  } = useTemplateListFilters<TFilterValues, TRequestFilters>({
    form: filterForm,
    initialFilters: spec.initialFilters,
    toFilters: spec.toFilters,
    autoApplyOnValuesChange: false,
  })

  const requestFilters = useMemo(
    () =>
      spec.buildRequestFilters?.({
        filters,
        current,
        pageSize,
      }) ?? filters,
    [current, filters, pageSize, spec]
  )
  const transformResponse = spec.transformResponse

  const handleTransformResponse = useCallback(
    (nextResponse: TResponse) => {
      const applied = transformResponse?.(nextResponse) ?? nextResponse
      const responseTotal = (applied as { total?: number } | null)?.total
      setTotal(typeof responseTotal === 'number' ? responseTotal : 0)
      return applied
    },
    [transformResponse]
  )

  const {
    response,
    loading,
    error,
    showInitialLoading,
    showError,
    showEmpty,
    showPartial,
    load,
  } = useTemplateListController<TRequestFilters, TResponse, TItem, TError>({
    filters: requestFilters,
    request: spec.request,
    selectItems: spec.selectItems,
    isPartial: spec.isPartial,
    mapError: spec.mapError,
    onError: (requestError, appliedFilters) => {
      spec.onError?.(requestError, appliedFilters)
    },
    transformResponse: handleTransformResponse,
    refreshChannel: spec.refreshChannel,
  })

  const watchedFilterValues =
    (Form.useWatch(
      (values) => values as Partial<TFilterValues>,
      filterForm
    ) as Partial<TFilterValues> | undefined) ?? {}

  const visibleFieldCount = useMemo(
    () =>
      spec.filterFields.filter((field) => {
        if (!field.visibleWhen) {
          return true
        }

        return field.visibleWhen(watchedFilterValues)
      }).length,
    [spec.filterFields, watchedFilterValues]
  )

  const searchColProps = useMemo(() => buildSearchGridProps(visibleFieldCount), [visibleFieldCount])

  useEffect(() => {
    void load()
  }, [load])

  const columns = useMemo(
    () =>
      spec.buildColumns({
        openFormPage,
        reload: async () => {
          await load()
        },
      }),
    [load, openFormPage, spec]
  )

  const defaultColumnKeys = useMemo(
    () => columns.filter((column) => typeof column.key === 'string').map((column) => String(column.key)),
    [columns]
  )

  const { tableSize, selectedColumnKeys, setTableSize, setSelectedColumnKeys } = useListViewPreferences({
    tableId: spec.tableId,
    defaultColumnKeys,
    defaultDensity: 'middle',
  })

  const visibleColumns = useMemo(
    () => columns.filter((column) => typeof column.key !== 'string' || selectedColumnKeys.includes(String(column.key))),
    [columns, selectedColumnKeys]
  )

  const handleResetAll = () => {
    onResetFilters()
    resetPage()
  }

  const responseTotal = (response as { total?: number } | null)?.total ?? 0

  const tableNode = spec.buildTableNode({
    columns: visibleColumns,
    dataSource: spec.selectItems(response),
    loading,
    tableSize,
    selectedColumnKeys,
    setTableSize,
    setSelectedColumnKeys,
    current,
    pageSize,
    total: responseTotal,
    tableClassName: STANDARD_LIST_TABLE_CLASS_NAME,
    pagination: tablePagination,
    onPageChange: (nextCurrent, nextPageSize) => {
      tablePagination.onChange?.(nextCurrent, nextPageSize)
    },
  })

  return (
    <div className="space-y-4 pb-20">
      <Typography.Title level={4} className="!mb-1">
        {spec.pageTitle}
      </Typography.Title>

      <Card variant="borderless">
        <TemplateListFilterForm<TFilterValues>
          form={filterForm}
          fields={spec.filterFields}
          fieldColProps={searchColProps.formItem}
          labelCol={searchColProps.labelItem}
          wrapperCol={searchColProps.inputItem}
          actionsColProps={searchColProps.actions}
          onSubmit={(values) => {
            onSubmitFilters(values)
            resetPage()
          }}
          onValuesChange={onValuesChangeFilters}
          onReset={handleResetAll}
        />
      </Card>

      {spec.renderBetweenFilterAndContent ?? null}
      <Card
        variant="borderless"
        title={spec.cardTitle}
        extra={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {spec.createAction ? (
              <Button type="primary" icon={spec.createAction.icon} onClick={() => openFormPage('add')}>
                {spec.createAction.label}
              </Button>
            ) : null}
            {spec.toolbarExtra}
            <ListToolbarActions
              tableSize={tableSize}
              densityItems={spec.densityItems}
              onTableSizeChange={setTableSize}
              onReload={() => {
                void load({ showSuccess: true })
              }}
              columnSettingOptions={buildListToolbarColumnSettingOptions(columns)}
              selectedColumnKeys={selectedColumnKeys}
              onSelectedColumnKeysChange={setSelectedColumnKeys}
            />
          </div>
        }
      >
        <TemplateListContent
          showInitialLoading={showInitialLoading}
          showError={showError}
          showPartial={showPartial}
          showEmpty={showEmpty}
          errorMessage={(error as { message?: string } | null)?.message}
          partialMessage={(response as { partialMessage?: string } | null)?.partialMessage}
          onRetry={() => {
            void load()
          }}
          onReloadPartial={() => {
            void load()
          }}
          onResetEmpty={handleResetAll}
          copy={spec.stateCopy}
          tableNode={tableNode}
        />
      </Card>
      {spec.renderAfterContent ?? null}
    </div>
  )
}
