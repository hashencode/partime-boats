import type { ColProps } from 'antd'

type SearchGridProps = {
  formItem: ColProps
  labelItem: ColProps
  inputItem: ColProps
  actions: {
    xs: { span: number; offset: number }
    sm: { span: number; offset: number }
    md: { span: number; offset: number }
    xl: { span: number; offset: number }
    xxl: { flex: string }
  }
}

const XXL_COLUMN_WIDTH = '20%'

export const buildSearchGridProps = (visibleFieldCount: number): SearchGridProps => ({
  formItem: { xs: 8, sm: 8, md: 8, xl: 6, xxl: { flex: XXL_COLUMN_WIDTH } },
  labelItem: { xs: 8, sm: 8, md: 8, xl: 8, xxl: 8 },
  inputItem: { xs: 16, sm: 16, md: 16, xl: 16, xxl: 16 },
  actions: {
    xs: { span: 8, offset: (2 - (visibleFieldCount % 3)) * 8 },
    sm: { span: 8, offset: (2 - (visibleFieldCount % 3)) * 8 },
    md: { span: 8, offset: (2 - (visibleFieldCount % 3)) * 8 },
    xl: { span: 6, offset: (3 - (visibleFieldCount % 4)) * 6 },
    xxl: { flex: XXL_COLUMN_WIDTH },
  },
})
