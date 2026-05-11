import { ColumnHeightOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Checkbox, Dropdown, Popover, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
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
  onReload: () => void
  columnSettingOptions: ListToolbarColumnSettingOption[]
  selectedColumnKeys: string[]
  onSelectedColumnKeysChange: (keys: string[]) => void
  columnSettingMinWidth?: number
}

export const ListToolbarActions = ({
  tableSize,
  densityItems = DEFAULT_TABLE_DENSITY_ITEMS,
  onTableSizeChange,
  onReload,
  columnSettingOptions,
  selectedColumnKeys,
  onSelectedColumnKeysChange,
  columnSettingMinWidth = 220,
}: ListToolbarActionsProps) => {
  return (
    <>
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
          <Checkbox.Group
            value={selectedColumnKeys}
            onChange={(values) => onSelectedColumnKeysChange(values as string[])}
            className="flex flex-col gap-2"
          >
            <div className="flex flex-col gap-2" style={{ minWidth: columnSettingMinWidth }}>
              {columnSettingOptions.map((option) => (
                <Checkbox key={option.key} value={option.key} disabled={option.disabled}>
                  {option.label}
                </Checkbox>
              ))}
            </div>
          </Checkbox.Group>
        }
      >
        <Tooltip title="列设置">
          <Button icon={<SettingOutlined />} aria-label="列设置" />
        </Tooltip>
      </Popover>
    </>
  )
}
