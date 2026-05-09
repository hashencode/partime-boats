import {
  CodeOutlined,
  DesktopOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SnippetsOutlined,
  SmileOutlined,
  SunOutlined,
} from '@ant-design/icons'
import { Avatar, Breadcrumb, Dropdown, Layout, Menu, Switch, message, theme, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { useMemo, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../infrastructure/auth/use-auth'
import { hasPermission } from '../../infrastructure/auth/permissions'
import {
  getStoredMswEnabled,
  isMswGlobalToggleAvailable,
  setStoredMswEnabled,
} from '../../infrastructure/msw/config'
import { useTheme } from '../contexts/theme-context'
import { getDisplayNameAvatarText, normalizeDisplayName } from '../utils/display-name'

const { Header, Content, Sider } = Layout

type RouteContract = {
  key: string
  path: string
  title: string
  icon: ReactNode
  permission: Parameters<typeof hasPermission>[1]
  inMenu: boolean
  menuVisibility?: 'always' | 'dev-only'
  menuMode?: 'standalone' | 'grouped'
  menuGroup?: string
  breadcrumb?: string[]
}

const isStandaloneMenuItem = (route: RouteContract) => route.menuMode === 'standalone'
const getMenuGroup = (route: RouteContract) => route.menuGroup ?? route.breadcrumb?.[0] ?? 'General'
const isMenuVisibleInCurrentEnv = (route: RouteContract) =>
  route.menuVisibility !== 'dev-only' || import.meta.env.DEV

type AppShellProps = {
  routes?: RouteContract[]
  headerExtra?: ReactNode
}

export const AppShell = ({ routes = [], headerExtra }: AppShellProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, displayName, logout } = useAuth()
  const { mode, resolvedTheme, setMode } = useTheme()
  const { token } = theme.useToken()

  const [collapsed, setCollapsed] = useState(false)
  const [mswEnabled, setMswEnabled] = useState(getStoredMswEnabled)
  const [switchLoading, setSwitchLoading] = useState(false)

  const menuRoutes = useMemo(() => {
    return routes.filter(
      (contract) =>
        contract.inMenu &&
        contract.path !== '*' &&
        isMenuVisibleInCurrentEnv(contract) &&
        hasPermission(role, contract.permission)
    )
  }, [role, routes])

  const showDevMenuGroup =
    import.meta.env.DEV && menuRoutes.some((route) => route.menuVisibility === 'dev-only')

  const groupedMenuItems = useMemo(() => {
    const items: {
      key: string
      icon: ReactNode
      label: string
      onClick?: () => void
      children?: { key: string; label: string; onClick: () => void }[]
    }[] = []
    const groups = new Map<
      string,
      {
        icon: ReactNode
        children: { key: string; label: string; onClick: () => void }[]
      }
    >()

    for (const route of menuRoutes) {
      const shouldUseDevGroup =
        showDevMenuGroup && route.menuVisibility === 'dev-only' && route.menuGroup === undefined

      if (!shouldUseDevGroup && isStandaloneMenuItem(route)) {
        items.push({
          key: route.key,
          icon: route.icon,
          label: route.title,
          onClick: () => navigate(route.path),
        })
        continue
      }

      const group = shouldUseDevGroup ? 'Dev' : getMenuGroup(route)
      const groupIcon = shouldUseDevGroup ? <CodeOutlined /> : group === 'Template' ? <SnippetsOutlined /> : route.icon
      let current = groups.get(group)
      if (!current) {
        current = { icon: groupIcon, children: [] }
        groups.set(group, current)
        items.push({
          key: `group-${group}`,
          icon: current.icon,
          label: group,
          children: current.children,
        })
      }

      current.children.push({
        key: route.key,
        label: route.title,
        onClick: () => navigate(route.path),
      })
    }

    return items
  }, [menuRoutes, navigate, showDevMenuGroup])

  const selectedRoute = useMemo(() => {
    const exactMatch = menuRoutes.find((route) => route.path === location.pathname)
    if (exactMatch) return exactMatch

    const prefixMatches = menuRoutes
      .filter((route) => route.path !== '/' && location.pathname.startsWith(`${route.path}/`))
      .sort((a, b) => b.path.length - a.path.length)
    return prefixMatches[0]
  }, [menuRoutes, location.pathname])

  const fullDisplayName = useMemo(() => normalizeDisplayName(displayName), [displayName])
  const avatarText = useMemo(() => getDisplayNameAvatarText(fullDisplayName), [fullDisplayName])

  const selectedKey = location.pathname === '/' ? 'home' : selectedRoute?.key ?? 'home'
  const activeGroupKey =
    selectedRoute
      ? showDevMenuGroup &&
          selectedRoute.menuVisibility === 'dev-only' &&
          selectedRoute.menuGroup === undefined
        ? 'group-Dev'
        : !isStandaloneMenuItem(selectedRoute)
          ? `group-${getMenuGroup(selectedRoute)}`
          : undefined
      : undefined
  const breadcrumbItems = routes.find((route) => route.path === location.pathname)?.breadcrumb ?? []
  const shouldShowBreadcrumb = breadcrumbItems.length > 0

  const handleLogout = () => {
    logout()
    void message.success('已退出登录')
    navigate('/login')
  }

  const copyDisplayName = async () => {
    const text = fullDisplayName.trim()
    if (!text) {
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      void message.success('用户名已复制')
      return
    } catch {
      // Fallback for restricted clipboard environments.
    }

    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      void message.success('用户名已复制')
    } catch {
      void message.error('复制失败，请手动复制')
    }
  }

  const renderThemeItemLabel = (label: string, active: boolean) => (
    <span className="inline-flex min-w-[150px] items-center justify-between gap-3">
      <span>{label}</span>
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: active ? token.colorPrimary : token.colorFillSecondary }}
      />
    </span>
  )

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile-name',
      label: (
        <div className="flex flex-col">
          <Typography.Text style={{ color: token.colorText }}>{fullDisplayName}</Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            点击复制用户名
          </Typography.Text>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'theme-light',
      icon: <SunOutlined />,
      label: renderThemeItemLabel('浅色模式', mode === 'light'),
    },
    {
      key: 'theme-dark',
      icon: <MoonOutlined />,
      label: renderThemeItemLabel('深色模式', mode === 'dark'),
    },
    {
      key: 'theme-system',
      icon: <DesktopOutlined />,
      label: renderThemeItemLabel('跟随系统', mode === 'system'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ]

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'profile-name') {
      void copyDisplayName()
      return
    }

    if (key === 'logout') {
      handleLogout()
      return
    }

    if (key === 'theme-light' || key === 'theme-dark' || key === 'theme-system') {
      const nextMode = key.replace('theme-', '') as 'light' | 'dark' | 'system'
      setMode(nextMode)
      void message.success(`已切换到${nextMode === 'system' ? '跟随系统' : nextMode === 'dark' ? '深色模式' : '浅色模式'}`)
    }
  }

  const handleMswSwitchChange = async (checked: boolean) => {
    if (!isMswGlobalToggleAvailable || switchLoading) {
      return
    }

    setSwitchLoading(true)
    try {
      const { disableMocking, enableMocking } = await import('../../infrastructure/msw/browser')
      if (checked) {
        await enableMocking()
      } else {
        disableMocking()
      }

      setMswEnabled(checked)
      setStoredMswEnabled(checked)
      void message.success(checked ? 'MSW 已开启（全局）' : 'MSW 已关闭（全局）')
    } catch {
      void message.error(`MSW ${checked ? '开启' : '关闭'}失败，请重试`)
    } finally {
      setSwitchLoading(false)
    }
  }

  return (
    <Layout className="h-screen overflow-hidden" style={{ background: token.colorBgLayout }}>
      <Header
        className="flex h-14 items-center justify-between gap-3 px-5 pl-4 shadow-none"
        style={{
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div className="flex min-w-0 items-center">
          <div
            className="flex cursor-pointer items-center gap-2.5 pr-4"
            style={{ color: token.colorText }}
            onClick={() => navigate('/')}
          >
            <span className="text-base tracking-[0.2px]">Admin Quick Start</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {headerExtra}
          {isMswGlobalToggleAvailable && (
            <Switch
              checked={mswEnabled}
              loading={switchLoading}
              checkedChildren="MSW"
              unCheckedChildren="MSW"
              aria-label="全局 MSW 开关"
              onChange={(checked) => void handleMswSwitchChange(checked)}
            />
          )}
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <div className="flex cursor-pointer items-center gap-2">
              <Avatar size={36}>{avatarText}</Avatar>
            </div>
          </Dropdown>
        </div>
      </Header>

      <Layout className="min-h-0 flex-1 overflow-hidden" style={{ background: token.colorBgLayout }}>
        <Sider
          width={224}
          collapsible
          collapsed={collapsed}
          trigger={null}
          className="flex h-full flex-col overflow-hidden [&_.ant-layout-sider-children]:flex [&_.ant-layout-sider-children]:h-full [&_.ant-layout-sider-children]:min-h-0 [&_.ant-layout-sider-children]:flex-col"
          style={{
            background: token.colorBgContainer,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
          breakpoint="lg"
          onBreakpoint={(broken) => setCollapsed(broken)}
        >
          <Menu
            key={`menu-${collapsed ? 'collapsed' : activeGroupKey ?? 'default'}`}
            className="min-h-0 flex-1 overflow-auto !border-e-0 pt-2.5 [&_.ant-menu-item-group-title]:!hidden"
            style={{ background: token.colorBgContainer }}
            theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={selectedKey ? [selectedKey] : []}
            defaultOpenKeys={collapsed ? [] : activeGroupKey ? [activeGroupKey] : []}
            items={[
              {
                key: 'home',
                icon: <SmileOutlined />,
                label: '欢迎',
                onClick: () => navigate('/'),
              },
              ...groupedMenuItems,
            ]}
          />
          <div
            className="sticky bottom-0 z-[2] flex h-11 cursor-pointer items-center justify-center hover:opacity-90"
            style={{
              background: token.colorBgContainer,
              borderTop: `1px solid ${token.colorBorderSecondary}`,
              color: token.colorTextSecondary,
            }}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </Sider>

        <Content
          className="min-h-0 overflow-y-auto p-6"
          style={{
            background: token.colorBgLayout,
            scrollbarGutter: 'stable both-edges',
          }}
        >
          {shouldShowBreadcrumb && (
            <div className="mb-3 bg-transparent p-0 [&_.ant-breadcrumb]:text-[13px]">
              <Breadcrumb items={breadcrumbItems.map((item) => ({ title: item }))} />
            </div>
          )}

          <div className="flex flex-col gap-4 [&_.ant-card_.ant-card-body]:p-6 [&_.ant-card_.ant-card-head]:min-h-[50px] [&_.ant-card_.ant-card-head]:px-6 [&_.ant-card]:rounded-lg [&_.ant-card]:shadow-none [&_.ant-result]:mx-auto [&_.ant-result]:max-w-[920px] [&_.ant-result]:px-0 [&_.ant-result]:pt-8 [&_.ant-result]:pb-3 [&_.ant-statistic-content]:text-[28px] [&_.ant-table-wrapper_.ant-table]:rounded-lg">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
