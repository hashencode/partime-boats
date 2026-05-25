import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToHorizontalAxis, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Table, theme } from 'antd'
import type { TableProps } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { applyPersistedOrderToKeys, mergePersistedOrder } from '../hooks/use-list-view-preferences'

type DraggableTableProps<T extends object> = TableProps<T> & {
  rowOrder?: string[]
  onRowOrderChange?: (rowIds: string[]) => void
  columnOrder?: string[]
  onColumnOrderChange?: (columnKeys: string[]) => void
  onOrderChange?: (rows: T[]) => void
}

type DragIdentifier = string

type SortableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  'data-row-key': React.Key
}

type SortableHeaderCellProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  'data-column-id'?: string
}

type DragType = 'row' | 'column' | null

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

const SortableHeaderCell = (props: SortableHeaderCellProps) => {
  const { token } = theme.useToken()
  const columnId = props['data-column-id']
  const sortable = useSortable({
    id: columnId ?? '__non-draggable-column__',
    data: {
      type: 'column',
    },
    disabled: !columnId,
  })

  const style: React.CSSProperties = {
    ...props.style,
    transform: columnId ? CSS.Translate.toString(sortable.transform) : undefined,
    transition: columnId ? sortable.transition : undefined,
    cursor: columnId ? 'move' : props.style?.cursor,
    ...(sortable.isDragging
      ? {
          position: 'relative',
          zIndex: 1,
          background: token.colorBgElevated,
        }
      : {}),
  }

  return (
    <th
      {...props}
      ref={columnId ? sortable.setNodeRef : undefined}
      style={style}
      {...(columnId ? sortable.attributes : {})}
      {...(columnId ? sortable.listeners : {})}
    />
  )
}

export const DraggableTable = <T extends object>({
  dataSource,
  columns = [],
  rowKey,
  components,
  rowOrder = [],
  onRowOrderChange,
  columnOrder = [],
  onColumnOrderChange,
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
  const [activeDragType, setActiveDragType] = useState<DragType>(null)

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

  const columnIds = useMemo(
    () => columns.filter((column) => typeof column.key === 'string').map((column) => String(column.key)),
    [columns]
  )
  const orderedColumnIds = useMemo(() => applyPersistedOrderToKeys(columnIds, columnOrder), [columnIds, columnOrder])

  const columnsWithDrag = useMemo(
    () =>
      columns.map((column) => {
        if (typeof column.key !== 'string') {
          return column
        }

        const originalOnHeaderCell = column.onHeaderCell
        return {
          ...column,
          onHeaderCell: (currentColumn: unknown) => ({
            ...(originalOnHeaderCell?.(currentColumn as never) ?? {}),
            'data-column-id': String(column.key),
          }),
        }
      }),
    [columns]
  )

  const mergedComponents = useMemo(
    () => ({
      ...components,
      header: {
        ...components?.header,
        cell: SortableHeaderCell,
      },
      body: {
        ...components?.body,
        row: SortableRow,
      },
    }),
    [components]
  )

  const resetDragType = () => {
    setActiveDragType(null)
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    const nextDragType = active.data.current?.type
    setActiveDragType(nextDragType === 'column' || nextDragType === 'row' ? nextDragType : null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const activeId = normalizeDragIdentifier(active.id)
    const overId = over ? normalizeDragIdentifier(over.id) : undefined
    const dragType = active.data.current?.type

    resetDragType()

    if (!overId || activeId === overId) {
      return
    }

    if (dragType === 'row') {
      const activeIndex = orderedRowIds.findIndex((rowId) => rowId === activeId)
      const overIndex = orderedRowIds.findIndex((rowId) => rowId === overId)

      if (activeIndex < 0 || overIndex < 0) {
        return
      }

      const nextVisibleRowIds = arrayMove(orderedRowIds, activeIndex, overIndex)
      const nextRowOrder = mergePersistedOrder(rowOrder, sourceRowIds, nextVisibleRowIds)
      onRowOrderChange?.(nextRowOrder)
      return
    }

    if (dragType === 'column') {
      const activeIndex = orderedColumnIds.findIndex((columnId) => columnId === activeId)
      const overIndex = orderedColumnIds.findIndex((columnId) => columnId === overId)

      if (activeIndex < 0 || overIndex < 0) {
        return
      }

      const nextVisibleColumnIds = arrayMove(orderedColumnIds, activeIndex, overIndex)
      const nextColumnOrder = mergePersistedOrder(columnOrder, columnIds, nextVisibleColumnIds)
      onColumnOrderChange?.(nextColumnOrder)
    }
  }

  const modifiers =
    activeDragType === 'column'
      ? [restrictToHorizontalAxis]
      : activeDragType === 'row'
        ? [restrictToVerticalAxis]
        : undefined

  return (
    <DndContext sensors={sensors} modifiers={modifiers} onDragStart={handleDragStart} onDragCancel={resetDragType} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedColumnIds} strategy={horizontalListSortingStrategy}>
        <SortableContext items={orderedRowIds} strategy={verticalListSortingStrategy}>
          <Table<T>
            {...tableProps}
            rowKey={rowKey}
            columns={columnsWithDrag}
            dataSource={orderedDataSource}
            components={mergedComponents}
          />
        </SortableContext>
      </SortableContext>
    </DndContext>
  )
}
