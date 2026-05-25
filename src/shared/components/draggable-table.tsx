import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Table, theme } from 'antd'
import type { TableProps } from 'antd'
import React, { useEffect, useMemo } from 'react'
import { applyPersistedOrderToKeys, mergePersistedOrder } from '../hooks/use-list-view-preferences'

type DraggableTableProps<T extends object> = TableProps<T> & {
  rowOrder?: string[]
  onRowOrderChange?: (rowIds: string[]) => void
  onOrderChange?: (rows: T[]) => void
}

type DragIdentifier = string

type SortableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  'data-row-key': React.Key
}

const DRAG_ACTIVATION_DISTANCE = 6

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

const SortableRow = (props: SortableRowProps) => {
  const { token } = theme.useToken()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: normalizeDragIdentifier(props['data-row-key']),
    data: {
      type: 'row',
    },
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
  columns = [],
  rowKey,
  components,
  rowOrder = [],
  onRowOrderChange,
  onOrderChange,
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
  const orderedRowIds = useMemo(() => applyPersistedOrderToKeys(sourceRowIds, rowOrder), [rowOrder, sourceRowIds])

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
    const nextRowOrder = mergePersistedOrder(rowOrder, sourceRowIds, nextVisibleRowIds)
    onRowOrderChange?.(nextRowOrder)
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
