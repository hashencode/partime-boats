import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ColumnHeightOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Checkbox, Dropdown, Popover, Tooltip, theme } from 'antd'
import type { MenuProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Columns3, Eraser } from 'lucide-react'
import React, { type ReactNode } from 'react'

void React

export const DEFAULT_TABLE_DENSITY_ITEMS: MenuProps['items'] = [
  { key: 'large', label: '宽松' },
  { key: 'middle', label: '默认' },
  { key: 'small', label: '紧凑' },
]

export type ListToolbarColumnSettingOption = {
  key: string
  label: ReactNode
  disabled?: boolean
}

const DEFAULT_COLUMN_SETTING_MAX_HEIGHT = 500
const COLUMN_SETTING_DRAG_DISTANCE = 6

export const buildListToolbarColumnSettingOptions = <TItem,>(
  columns: ColumnsType<TItem>
): ListToolbarColumnSettingOption[] =>
  columns
    .filter((column) => typeof column.key === 'string')
    .map((column) => ({
      key: String(column.key),
      label: typeof column.title === 'function' ? String(column.key) : (column.title ?? String(column.key)),
    }))

type ListToolbarActionsProps = {
  tableSize: 'small' | 'middle' | 'large'
  densityItems?: MenuProps['items']
  onTableSizeChange: (size: 'small' | 'middle' | 'large') => void
  onClearColumnSort?: () => void
  clearColumnSortDisabled?: boolean
  onClearRowSort?: () => void
  clearRowSortDisabled?: boolean
  onReload: () => void
  columnSettingOptions: ListToolbarColumnSettingOption[]
  selectedColumnKeys: string[]
  onSelectedColumnKeysChange: (keys: string[]) => void
  onColumnSettingOrderChange?: (keys: string[]) => void
  columnSettingMinWidth?: number
}

type SortableColumnSettingRowProps = {
  checked: boolean
  option: ListToolbarColumnSettingOption
  onCheckedChange: (key: string, checked: boolean) => void
}

const SortableColumnSettingRow = ({ checked, option, onCheckedChange }: SortableColumnSettingRowProps) => {
  const { token } = theme.useToken()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option.key,
    disabled: option.disabled,
  })

  return (
    <div
      ref={setNodeRef}
      className="flex items-center gap-2 rounded-md px-2 py-1"
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        background: isDragging ? token.colorBgElevated : undefined,
      }}
    >
      <Checkbox
        checked={checked}
        disabled={option.disabled}
        onChange={(event) => onCheckedChange(option.key, event.target.checked)}
        aria-label={`切换列显隐-${option.key}`}
      />
      <span
        className={`flex-1 select-none text-sm ${option.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-move'}`}
        {...(!option.disabled ? attributes : {})}
        {...(!option.disabled ? listeners : {})}
      >
        {option.label}
      </span>
    </div>
  )
}

export const ListToolbarActions = ({
  tableSize,
  densityItems = DEFAULT_TABLE_DENSITY_ITEMS,
  onTableSizeChange,
  onClearColumnSort,
  clearColumnSortDisabled = true,
  onClearRowSort,
  clearRowSortDisabled = true,
  onReload,
  columnSettingOptions,
  selectedColumnKeys,
  onSelectedColumnKeysChange,
  onColumnSettingOrderChange,
  columnSettingMinWidth = 220,
}: ListToolbarActionsProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: COLUMN_SETTING_DRAG_DISTANCE,
      },
    })
  )
  const clearSortItems = [
    onClearColumnSort
      ? {
          key: 'column-sort',
          label: '清除列排序',
          disabled: clearColumnSortDisabled,
          onClick: onClearColumnSort,
        }
      : null,
    onClearRowSort
      ? {
          key: 'row-sort',
          label: '清除行排序',
          disabled: clearRowSortDisabled,
          onClick: onClearRowSort,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  const clearSortDisabled = clearSortItems.length === 0 || clearSortItems.every((item) => item.disabled)
  const visibleColumnKeySet = new Set(selectedColumnKeys)

  const handleColumnSettingCheckedChange = (key: string, checked: boolean) => {
    const nextSelectedColumnKeys = checked
      ? [...selectedColumnKeys, key]
      : selectedColumnKeys.filter((selectedKey) => selectedKey !== key)
    onSelectedColumnKeysChange(nextSelectedColumnKeys)
  }

  const handleColumnSettingDragEnd = ({ active, over }: DragEndEvent) => {
    const activeKey = String(active.id)
    const overKey = over ? String(over.id) : null

    if (!overKey || activeKey === overKey || !onColumnSettingOrderChange) {
      return
    }

    const activeIndex = columnSettingOptions.findIndex((option) => option.key === activeKey)
    const overIndex = columnSettingOptions.findIndex((option) => option.key === overKey)

    if (activeIndex < 0 || overIndex < 0) {
      return
    }

    const nextOptions = arrayMove(columnSettingOptions, activeIndex, overIndex)
    onColumnSettingOrderChange(nextOptions.map((option) => option.key))
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Tooltip title="刷新">
        <Button icon={<ReloadOutlined />} aria-label="刷新" onClick={onReload} />
      </Tooltip>
      <Dropdown
        menu={{
          selectedKeys: [tableSize],
          items: densityItems,
          onClick: ({ key }) => onTableSizeChange(key as 'small' | 'middle' | 'large'),
        }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Tooltip title="密度">
          <Button icon={<ColumnHeightOutlined />} aria-label="密度" />
        </Tooltip>
      </Dropdown>
      <Popover
        trigger="click"
        placement="bottomRight"
        content={
          <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={handleColumnSettingDragEnd}
          >
            <SortableContext items={columnSettingOptions.map((option) => option.key)} strategy={verticalListSortingStrategy}>
              <div
                className="flex flex-col overflow-y-auto"
                style={{
                  minWidth: columnSettingMinWidth,
                  maxHeight: DEFAULT_COLUMN_SETTING_MAX_HEIGHT,
                }}
              >
                {columnSettingOptions.map((option) => (
                  <SortableColumnSettingRow
                    key={option.key}
                    option={option}
                    checked={visibleColumnKeySet.has(option.key)}
                    onCheckedChange={handleColumnSettingCheckedChange}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        }
      >
        <Tooltip title="列设置">
          <Button icon={<Columns3 size={16} />} aria-label="列设置" />
        </Tooltip>
      </Popover>
      {clearSortItems.length > 0 ? (
        <Dropdown
          menu={{
            items: clearSortItems.map((item) => ({
              key: item.key,
              label: item.label,
              disabled: item.disabled,
            })),
            onClick: ({ key }) => {
              clearSortItems.find((item) => item.key === key)?.onClick()
            },
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Tooltip title="清除排序">
            <Button icon={<Eraser size={16} />} aria-label="清除排序" disabled={clearSortDisabled} />
          </Tooltip>
        </Dropdown>
      ) : null}
    </div>
  )
}
