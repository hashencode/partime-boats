import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Table, theme } from 'antd'
import type { TableProps } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'

type DraggableTableProps<T extends object> = TableProps<T> & {
  sortPersistenceKey?: string
  sortResetVersion?: number
  onOrderChange?: (rows: T[]) => void
  onSortPersistenceChange?: (hasCustomOrder: boolean) => void
}

type DragIdentifier = string

type SortableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  'data-row-key': React.Key
}

const TABLE_ORDER_STORAGE_PREFIX = 'list:table-order:v1:'
const DRAG_ACTIVATION_DISTANCE = 6

const readJson = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

const writeJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage write failure and keep runtime state usable
  }
}

const removeStorageItem = (key: string) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore storage removal failure and keep runtime state usable
  }
}

const isDragIdentifierArray = (value: unknown): value is DragIdentifier[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export const buildTableOrderStorageKey = (tableId: string) => `${TABLE_ORDER_STORAGE_PREFIX}${tableId}`

export const readStoredTableOrder = (tableId: string): DragIdentifier[] | null => {
  const storedValue = readJson<unknown>(buildTableOrderStorageKey(tableId))
  return isDragIdentifierArray(storedValue) ? storedValue : null
}

export const writeStoredTableOrder = (tableId: string, rowIds: DragIdentifier[]) => {
  if (rowIds.length === 0) {
    removeStorageItem(buildTableOrderStorageKey(tableId))
    return
  }

  writeJson(buildTableOrderStorageKey(tableId), rowIds)
}

export const clearStoredTableOrder = (tableId: string) => {
  removeStorageItem(buildTableOrderStorageKey(tableId))
}

export const hasStoredTableOrder = (tableId: string) => {
  return Boolean(readStoredTableOrder(tableId)?.length)
}

export const normalizeDragIdentifier = (value: unknown) => String(value ?? '')

const resolveRowId = <T extends object>(record: T, index: number, rowKey?: TableProps<T>['rowKey']): DragIdentifier => {
  if (typeof rowKey === 'function') {
    return normalizeDragIdentifier(rowKey(record))
  }

  if (typeof rowKey === 'string') {
    const rowValue = Reflect.get(record, rowKey)
    return normalizeDragIdentifier(rowValue ?? index)
  }

  const recordKey = Reflect.get(record, 'key')
  return normalizeDragIdentifier(recordKey ?? index)
}

export const reorderTableData = <T extends object>(
  rows: T[],
  activeId: DragIdentifier,
  overId: DragIdentifier | undefined,
  rowKey?: TableProps<T>['rowKey']
) => {
  if (!overId || activeId === overId) {
    return rows
  }

  const activeIndex = rows.findIndex((row, index) => resolveRowId(row, index, rowKey) === activeId)
  const overIndex = rows.findIndex((row, index) => resolveRowId(row, index, rowKey) === overId)

  if (activeIndex < 0 || overIndex < 0) {
    return rows
  }

  return arrayMove(rows, activeIndex, overIndex)
}

export const applyPersistedOrderToRowIds = (sourceRowIds: DragIdentifier[], persistedOrder: DragIdentifier[] | null) => {
  if (!persistedOrder || persistedOrder.length === 0) {
    return sourceRowIds
  }

  const sourceRowIdSet = new Set(sourceRowIds)
  const orderedVisibleRowIds = persistedOrder.filter((rowId) => sourceRowIdSet.has(rowId))
  const orderedVisibleRowIdSet = new Set(orderedVisibleRowIds)
  const unseenRowIds = sourceRowIds.filter((rowId) => !orderedVisibleRowIdSet.has(rowId))

  return [...orderedVisibleRowIds, ...unseenRowIds]
}

export const mergePersistedOrder = (
  persistedOrder: DragIdentifier[] | null,
  visibleRowIds: DragIdentifier[],
  nextVisibleRowIds: DragIdentifier[]
) => {
  if (!persistedOrder || persistedOrder.length === 0) {
    return nextVisibleRowIds
  }

  const visibleRowIdSet = new Set(visibleRowIds)
  const reorderedVisibleQueue = [...nextVisibleRowIds]
  const nextPersistedOrder = persistedOrder.map((rowId) =>
    visibleRowIdSet.has(rowId) ? (reorderedVisibleQueue.shift() ?? rowId) : rowId
  )

  return [...nextPersistedOrder, ...reorderedVisibleQueue]
}

const SortableRow = (props: SortableRowProps) => {
  const { token } = theme.useToken()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: normalizeDragIdentifier(props['data-row-key']),
  })

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: 'move',
    ...(isDragging
      ? {
          position: 'relative',
          zIndex: 1,
          background: token.colorBgElevated,
        }
      : {}),
  }

  return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />
}

export const DraggableTable = <T extends object>({
  dataSource,
  columns,
  rowKey,
  components,
  sortPersistenceKey,
  sortResetVersion = 0,
  onOrderChange,
  onSortPersistenceChange,
  ...tableProps
}: DraggableTableProps<T>) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: DRAG_ACTIVATION_DISTANCE,
      },
    })
  )
  const resolvedDataSource = useMemo(() => [...(dataSource ?? [])], [dataSource])
  const sourceRowIds = useMemo(
    () => resolvedDataSource.map((row, index) => resolveRowId(row, index, rowKey)),
    [resolvedDataSource, rowKey]
  )
  const persistenceSyncKey = `${sortPersistenceKey ?? ''}:${sortResetVersion}`
  const persistedOrderSnapshot = useMemo(() => {
    const syncMarker = persistenceSyncKey
    return syncMarker && sortPersistenceKey ? readStoredTableOrder(sortPersistenceKey) : null
  }, [persistenceSyncKey, sortPersistenceKey])
  const [persistedOrderState, setPersistedOrderState] = useState<{
    syncKey: string
    rowIds: DragIdentifier[] | null
  }>(() => ({
    syncKey: persistenceSyncKey,
    rowIds: persistedOrderSnapshot,
  }))
  const persistedOrder =
    persistedOrderState.syncKey === persistenceSyncKey ? persistedOrderState.rowIds : persistedOrderSnapshot

  useEffect(() => {
    onSortPersistenceChange?.(Boolean(persistedOrder?.length))
  }, [onSortPersistenceChange, persistedOrder])

  const orderedRowIds = useMemo(
    () => applyPersistedOrderToRowIds(sourceRowIds, persistedOrder),
    [persistedOrder, sourceRowIds]
  )

  const orderedDataSource = useMemo(() => {
    if (orderedRowIds === sourceRowIds) {
      return resolvedDataSource
    }

    const rowMap = new Map(sourceRowIds.map((rowId, index) => [rowId, resolvedDataSource[index]]))
    return orderedRowIds
      .map((rowId) => rowMap.get(rowId))
      .filter((row): row is T => row !== undefined)
  }, [orderedRowIds, resolvedDataSource, sourceRowIds])

  useEffect(() => {
    onOrderChange?.(orderedDataSource)
  }, [onOrderChange, orderedDataSource])

  const mergedComponents = useMemo(
    () => ({
      ...components,
      body: {
        ...components?.body,
        row: SortableRow,
      },
    }),
    [components]
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const activeId = normalizeDragIdentifier(active.id)
    const overId = over ? normalizeDragIdentifier(over.id) : undefined

    if (!overId || activeId === overId) {
      return
    }

    const activeIndex = orderedRowIds.findIndex((rowId) => rowId === activeId)
    const overIndex = orderedRowIds.findIndex((rowId) => rowId === overId)

    if (activeIndex < 0 || overIndex < 0) {
      return
    }

    const nextVisibleRowIds = arrayMove(orderedRowIds, activeIndex, overIndex)
    const nextPersistedOrder = mergePersistedOrder(persistedOrder, sourceRowIds, nextVisibleRowIds)

    if (sortPersistenceKey) {
      writeStoredTableOrder(sortPersistenceKey, nextPersistedOrder)
    }

    setPersistedOrderState({
      syncKey: persistenceSyncKey,
      rowIds: nextPersistedOrder,
    })
  }

  return (
    <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedRowIds} strategy={verticalListSortingStrategy}>
        <Table<T>
          {...tableProps}
          rowKey={rowKey}
          columns={columns}
          dataSource={orderedDataSource}
          components={mergedComponents}
        />
      </SortableContext>
    </DndContext>
  )
}
