import React from 'react'
import { ColumnHeightOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Dropdown, Popover, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import type { ReactNode } from 'react'
void React

type ListToolbarActionsProps = {
  tableSize: 'small' | 'middle' | 'large'
  densityItems: MenuProps['items']
  onTableSizeChange: (size: 'small' | 'middle' | 'large') => void
  onReload: () => void
  columnSettingContent: ReactNode
}

export const ListToolbarActions = ({
  tableSize,
  densityItems,
  onTableSizeChange,
  onReload,
  columnSettingContent,
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
      <Popover trigger="click" placement="bottomRight" content={columnSettingContent}>
        <Tooltip title="列设置">
          <Button icon={<SettingOutlined />} aria-label="列设置" />
        </Tooltip>
      </Popover>
    </>
  )
}
