export type MskAccountKind = 'booking' | 'query'

export const ACCOUNT_REFRESH_EVENT = 'accounts-changed'
export const ACCOUNT_BOOLEAN_OPTIONS = [{ label: '是', value: 1 }, { label: '否', value: 0 }]

export const MSK_ACCOUNT_CONFIG = {
  booking: {
    title: 'MSK订舱账号',
    listPath: '/msk-book-account-list',
    listEndpoint: '/maersk/book/list',
    importEndpoint: '/maersk/book/account/import',
    refreshChannel: 'msk-book-accounts',
  },
  query: {
    title: 'MSK查询账号',
    listPath: '/msk-query-account-list',
    listEndpoint: '/maersk/list',
    importEndpoint: '/maersk/account/import',
    refreshChannel: 'msk-query-accounts',
  },
} as const

export const formatAccountBoolean = (value: number | null | undefined) => value === 1 ? '是' : value === 0 ? '否' : '-'
