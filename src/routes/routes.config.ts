import {
  ApiOutlined,
  BarChartOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DisconnectOutlined,
  ExclamationCircleOutlined,
  FormOutlined,
  ProfileOutlined,
  SearchOutlined,
  ShoppingOutlined,
  SmileOutlined,
  TableOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { createElement, type ReactNode } from 'react'
import { type PermissionKey } from '../infrastructure/auth/permissions'
import { lazyPage } from '../shared/components/lazy-page.tsx'

export type TemplateRoute = {
  key: string
  path: string
  title: string
  icon: ReactNode
  permission: PermissionKey
  inMenu: boolean
  menuVisibility?: 'always' | 'dev-only'
  menuMode?: 'standalone' | 'grouped'
  menuGroup?: string
  breadcrumb?: string[]
  component: () => ReactNode
}

export const templateRoutes: TemplateRoute[] = [
  {
    key: 'welcome',
    path: '/template',
    title: '欢迎',
    icon: createElement(SmileOutlined),
    permission: 'dashboard.read',
    inMenu: true,
    menuVisibility: 'dev-only',
    menuGroup: 'Template',
    component: () => lazyPage(() => import('../pages/home/welcome-page').then((m) => ({ default: m.WelcomePage }))),
  },
  {
    key: 'analysis',
    path: '/template/dashboard/analysis',
    title: '仪表盘',
    icon: createElement(BarChartOutlined),
    permission: 'dashboard.read',
    inMenu: true,
    menuVisibility: 'dev-only',
    menuGroup: 'Template',
    component: () =>
      lazyPage(() => import('../pages/templates/dashboard/analysis-page').then((m) => ({ default: m.AnalysisPage }))),
  },
  {
    key: 'table-query',
    path: '/template/list/table',
    title: '查询列表',
    icon: createElement(TableOutlined),
    permission: 'list.read',
    inMenu: true,
    menuVisibility: 'dev-only',
    menuGroup: 'Template',
    component: () =>
      lazyPage(() => import('../pages/templates/list/table-query-page').then((m) => ({ default: m.TableQueryPage }))),
  },
  {
    key: 'list-prompt-generator',
    path: '/dev/list/prompt-generator',
    title: '列表提示词生成',
    icon: createElement(TableOutlined),
    permission: 'list.read',
    inMenu: true,
    menuVisibility: 'dev-only',
    component: () =>
      lazyPage(() =>
        import('../pages/templates/list/list-prompt-generator-page').then((m) => ({
          default: m.ListPromptGeneratorPage,
        }))
      ),
  },
  {
    key: 'order-list',
    path: '/order-list',
    title: '订单管理',
    icon: createElement(ShoppingOutlined),
    permission: 'list.read',
    inMenu: true,
    menuVisibility: 'always',
    menuMode: 'standalone',
    component: () =>
      lazyPage(() => import('../pages/templates/order-list/order-list-page').then((m) => ({ default: m.OrderListPage }))),
  },
  {
    key: 'msk-query-list',
    path: '/msk-query-list',
    title: 'Maersk列表',
    icon: createElement(SearchOutlined),
    permission: 'list.read',
    inMenu: true,
    menuVisibility: 'always',
    menuMode: 'grouped',
    menuGroup: '查询管理',
    component: () =>
      lazyPage(() =>
        import('../pages/templates/msk-query-list/msk-query-list-page').then((m) => ({ default: m.MskQueryListPage }))
      ),
  },
  {
    key: 'msk-api-list',
    path: '/msk-api-list',
    title: 'Maersk API列表',
    icon: createElement(ApiOutlined),
    permission: 'list.read',
    inMenu: true,
    menuVisibility: 'always',
    menuMode: 'grouped',
    menuGroup: '查询管理',
    component: () =>
      lazyPage(() =>
        import('../pages/templates/msk-api-list/msk-api-list-page').then((m) => ({ default: m.MskApiListPage }))
      ),
  },
  {
    key: 'base-port-list',
    path: '/get_base_list',
    title: '基础端口列表',
    icon: createElement(DisconnectOutlined),
    permission: 'list.read',
    inMenu: true,
    menuVisibility: 'always',
    menuMode: 'grouped',
    menuGroup: '系统设置',
    component: () =>
      lazyPage(() =>
        import('../pages/templates/base-port-list/base-port-list-page').then((m) => ({ default: m.BasePortListPage }))
      ),
  },
  {
    key: 'base-port-form',
    path: '/get_base_list/form',
    title: '基础端口表单',
    icon: createElement(FormOutlined),
    permission: 'form.read',
    inMenu: false,
    breadcrumb: ['基础端口列表', '基础端口表单'],
    component: () =>
      lazyPage(() =>
        import('../pages/templates/base-port-list/base-port-form-page').then((m) => ({ default: m.BasePortFormPage }))
      ),
  },
  {
    key: 'book-task-list',
    path: '/get_book_task_list',
    title: '订舱管理',
    icon: createElement(UnorderedListOutlined),
    permission: 'list.read',
    inMenu: true,
    menuVisibility: 'always',
    menuMode: 'standalone',
    component: () =>
      lazyPage(() =>
        import('../pages/templates/book-task-list/book-task-list-page').then((m) => ({ default: m.BookTaskListPage }))
      ),
  },
  {
    key: 'remind-list',
    path: '/get_remined_list',
    title: '日志管理',
    icon: createElement(BellOutlined),
    permission: 'list.read',
    inMenu: true,
    menuVisibility: 'always',
    menuMode: 'standalone',
    component: () =>
      lazyPage(() =>
        import('../pages/templates/remind-list/remind-list-page').then((m) => ({ default: m.RemindListPage }))
      ),
  },
  {
    key: 'book-account-list',
    path: '/book_account_list',
    title: '系统设置',
    icon: createElement(TeamOutlined),
    permission: 'list.read',
    inMenu: true,
    menuVisibility: 'always',
    menuMode: 'grouped',
    menuGroup: '系统设置',
    component: () =>
      lazyPage(() =>
        import('../pages/templates/book-account-list/book-account-list-page').then((m) => ({
          default: m.BookAccountListPage,
        }))
      ),
  },
  {
    key: 'basic-form',
    path: '/template/list/table/form',
    title: '基础表单',
    icon: createElement(FormOutlined),
    permission: 'form.read',
    inMenu: true,
    menuVisibility: 'dev-only',
    menuGroup: 'Template',
    breadcrumb: ['表单页', '基础表单'],
    component: () =>
      lazyPage(() => import('../pages/templates/form/basic-form-page').then((m) => ({ default: m.BasicFormPage }))),
  },
  {
    key: 'step-form',
    path: '/template/form/step-form',
    title: '分步表单',
    icon: createElement(FormOutlined),
    permission: 'form.write',
    inMenu: true,
    menuVisibility: 'dev-only',
    menuGroup: 'Template',
    breadcrumb: ['表单页', '分步表单'],
    component: () =>
      lazyPage(() => import('../pages/templates/form/step-form-page').then((m) => ({ default: m.StepFormPage }))),
  },
  {
    key: 'advanced-form',
    path: '/template/form/advanced-form',
    title: '高级表单',
    icon: createElement(FormOutlined),
    permission: 'form.write',
    inMenu: true,
    menuVisibility: 'dev-only',
    menuGroup: 'Template',
    breadcrumb: ['表单页', '高级表单'],
    component: () =>
      lazyPage(() => import('../pages/templates/form/advanced-form-page').then((m) => ({ default: m.AdvancedFormPage }))),
  },
  {
    key: 'basic-profile',
    path: '/template/profile/basic',
    title: '详情页',
    icon: createElement(ProfileOutlined),
    permission: 'profile.read',
    inMenu: true,
    menuVisibility: 'dev-only',
    menuGroup: 'Template',
    component: () =>
      lazyPage(() => import('../pages/templates/profile/basic-profile-page').then((m) => ({ default: m.BasicProfilePage }))),
  },
  {
    key: 'result-success',
    path: '/template/result/success',
    title: '成功页',
    icon: createElement(CheckCircleOutlined),
    permission: 'result.read',
    inMenu: true,
    menuVisibility: 'dev-only',
    menuGroup: 'Template',
    breadcrumb: ['结果页', '成功页'],
    component: () =>
      lazyPage(() =>
        import('../pages/templates/dashboard/result-success-page').then((m) => ({ default: m.ResultSuccessPage }))
      ),
  },
  {
    key: 'result-fail',
    path: '/template/result/fail',
    title: '失败页',
    icon: createElement(CloseCircleOutlined),
    permission: 'result.read',
    inMenu: true,
    menuVisibility: 'dev-only',
    menuGroup: 'Template',
    breadcrumb: ['结果页', '失败页'],
    component: () =>
      lazyPage(() => import('../pages/templates/dashboard/result-fail-page').then((m) => ({ default: m.ResultFailPage }))),
  },
  {
    key: 'exception-403',
    path: '/template/exception/403',
    title: '403',
    icon: createElement(ExclamationCircleOutlined),
    permission: 'exception.read',
    inMenu: true,
    menuVisibility: 'dev-only',
    menuGroup: 'Template',
    breadcrumb: ['异常页', '403'],
    component: () =>
      lazyPage(() => import('../pages/templates/exception/forbidden-page').then((m) => ({ default: m.ForbiddenPage }))),
  },
  {
    key: 'exception-500',
    path: '/template/exception/500',
    title: '500',
    icon: createElement(ExclamationCircleOutlined),
    permission: 'exception.read',
    inMenu: true,
    menuVisibility: 'dev-only',
    menuGroup: 'Template',
    breadcrumb: ['异常页', '500'],
    component: () =>
      lazyPage(() => import('../pages/templates/exception/server-error-page').then((m) => ({ default: m.ServerErrorPage }))),
  },
  {
    key: 'exception-404',
    path: '*',
    title: '404',
    icon: createElement(ExclamationCircleOutlined),
    permission: 'exception.read',
    inMenu: false,
    breadcrumb: ['异常页', '404'],
    component: () =>
      lazyPage(() => import('../pages/templates/exception/not-found-page').then((m) => ({ default: m.NotFoundPage }))),
  },
]
