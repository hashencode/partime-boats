import {
  Button,
  Card,
  Form,
  Typography,
} from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { clearStoredTableOrder, hasStoredTableOrder } from '../../components/draggable-table'
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
import { useRouteTitle } from '../../contexts/route-title-context'
import { useTheme } from '../../contexts/theme-context'

void React

const VIRTUAL_TABLE_HEIGHT = 700
const DEFAULT_VIRTUAL_TABLE_WIDTH = 1200

const resolveVirtualScrollX = (columns: Array<{ width?: string | number }>) => {
  const numericWidthSum = columns.reduce((sum, column) => {
    return typeof column.width === 'number' ? sum + column.width : sum
  }, 0)

  return Math.max(numericWidthSum, DEFAULT_VIRTUAL_TABLE_WIDTH)
}

export const StandardListPageRecipe = <
  TFilterValues extends Record<string, unknown>,
  TRequestFilters extends object,
  TResponse,
  TItem,
  TError = unknown,
>({
  spec,
  cardTitleOverride,
}: {
  spec: StandardListPageSpec<TFilterValues, TRequestFilters, TResponse, TItem, TError>
  cardTitleOverride?: React.ReactNode
}) => {
  const [filterForm] = Form.useForm<TFilterValues>()
  const { title: routeTitle } = useRouteTitle()
  const { openFormPage } = useCrudFormNavigation(spec.formRoute)
  const { searchCompactLayout } = useTheme()
  const [total, setTotal] = useState(0)
  const [sortResetVersion, setSortResetVersion] = useState(0)
  const [hasCustomSortOrder, setHasCustomSortOrder] = useState(() => hasStoredTableOrder(spec.tableId))
  const paginationMode = spec.paginationMode ?? 'remote'
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

  const buildRequestFilters = spec.buildRequestFilters
  const nextRequestFilters = useMemo(
    () => {
      return paginationMode === 'local'
        ? filters
        : buildRequestFilters?.({
            filters,
            current,
            pageSize,
          }) ?? filters
    },
    [buildRequestFilters, current, filters, pageSize, paginationMode]
  )
  const requestFiltersKey = useMemo(() => JSON.stringify(nextRequestFilters), [nextRequestFilters])
  // Reuse the previous filters object when the serialized query params are unchanged,
  // so selection-only re-renders do not retrigger the initial list load effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const requestFilters = useMemo(() => nextRequestFilters, [requestFiltersKey])
  const buildColumns = spec.buildColumns
  const transformResponse = spec.transformResponse
  const selectItems = spec.selectItems

  const handleTransformResponse = useCallback(
    (nextResponse: TResponse) => {
      const applied = transformResponse?.(nextResponse) ?? nextResponse
      const responseTotal =
        paginationMode === 'local'
          ? selectItems(applied).length
          : (applied as { total?: number } | null)?.total
      setTotal(typeof responseTotal === 'number' ? responseTotal : 0)
      return applied
    },
    [paginationMode, selectItems, transformResponse]
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
    selectItems,
    isPartial: spec.isPartial,
    mapError: spec.mapError,
    onError: (requestError, appliedFilters) => {
      spec.onError?.(requestError, appliedFilters)
    },
    transformResponse: handleTransformResponse,
    refreshChannel: spec.refreshChannel,
  })

  const watchedFilterValues = Form.useWatch(
    (values) => values as Partial<TFilterValues>,
    filterForm
  ) as Partial<TFilterValues> | undefined
  const safeWatchedFilterValues = useMemo(() => watchedFilterValues ?? {}, [watchedFilterValues])

  const visibleFieldCount = useMemo(
    () =>
      spec.filterFields.filter((field) => {
        if (!field.visibleWhen) {
          return true
        }

        return field.visibleWhen(safeWatchedFilterValues)
      }).length,
    [safeWatchedFilterValues, spec.filterFields]
  )

  const searchColProps = useMemo(() => buildSearchGridProps(visibleFieldCount), [visibleFieldCount])

  useEffect(() => {
    void load()
  }, [load])

  const columns = useMemo(
    () =>
      buildColumns({
        openFormPage,
        reload: async () => {
          await load()
        },
      }),
    [buildColumns, load, openFormPage]
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

  const virtualScroll = useMemo(
    () => ({
      enabled: false,
      scroll: {
        x: resolveVirtualScrollX(visibleColumns),
        y: VIRTUAL_TABLE_HEIGHT,
      },
    }),
    [visibleColumns]
  )

  const handleResetAll = () => {
    onResetFilters()
    resetPage()
  }

  const handleClearSort = () => {
    clearStoredTableOrder(spec.tableId)
    setHasCustomSortOrder(false)
    setSortResetVersion((version) => version + 1)
  }

  const resolvedPageTitle = routeTitle ?? spec.pageTitle
  const resolvedCardTitleSource = cardTitleOverride ?? spec.cardTitle
  const resolvedCardTitle =
    typeof resolvedCardTitleSource === 'string'
      ? resolvedCardTitleSource &&
          resolvedCardTitleSource !== spec.pageTitle &&
          resolvedCardTitleSource !== resolvedPageTitle
        ? resolvedCardTitleSource
        : undefined
      : resolvedCardTitleSource

  const responseItems = selectItems(response)
  const dataSource =
    paginationMode === 'local'
      ? responseItems.slice((current - 1) * pageSize, current * pageSize)
      : responseItems
  const responseTotal = paginationMode === 'local' ? responseItems.length : (response as { total?: number } | null)?.total ?? 0

  const tableNode = spec.buildTableNode({
    columns: visibleColumns,
    dataSource,
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
    dragSort: {
      persistenceKey: spec.tableId,
      resetVersion: sortResetVersion,
      onPersistenceChange: setHasCustomSortOrder,
    },
    virtualScroll,
  })

  return (
    <div className="space-y-4 pb-20">
      <Typography.Title level={4} className="!mb-1">
        {resolvedPageTitle}
      </Typography.Title>

      {spec.renderBeforeFilter ?? null}
      {spec.filterFields.length > 0 ? (
        <Card
          variant="borderless"
          styles={{
            body: {
              paddingRight: 8,
            },
          }}
        >
          <TemplateListFilterForm<TFilterValues>
            form={filterForm}
            fields={spec.filterFields}
            fieldColProps={searchColProps.formItem}
            labelCol={searchColProps.labelItem}
            wrapperCol={searchColProps.inputItem}
            actionsColProps={searchColProps.actions}
            compactLayout={searchCompactLayout}
            onSubmit={(values) => {
              onSubmitFilters(values)
              resetPage()
            }}
            onValuesChange={onValuesChangeFilters}
            onReset={handleResetAll}
          />
        </Card>
      ) : null}

      {spec.renderBetweenFilterAndContent ?? null}
      <Card
        variant="borderless"
        title={resolvedCardTitle}
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
              onClearSort={handleClearSort}
              clearSortDisabled={!hasCustomSortOrder}
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
