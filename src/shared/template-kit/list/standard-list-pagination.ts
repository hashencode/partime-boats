import type { TablePaginationConfig } from 'antd'

export const STANDARD_LIST_TABLE_CLASS_NAME = 'rule-list-table'

export const buildStandardListPagination = (
  pagination: TablePaginationConfig
): TablePaginationConfig => ({
  ...pagination,
  size: 'middle',
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条数据`,
  placement: ['bottomEnd'],
})
