import React from 'react'
import {
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Form,
  Input,
  Space,
  Typography,
  theme,
} from 'antd'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { normalizeApiError } from '../../infrastructure/http/api-client'
import { useAuth } from '../../infrastructure/auth/use-auth'
void React

type LoginValues = {
  username: string
  password: string
}

type LoginLocationState = {
  from?: string
}

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { token } = theme.useToken()
  const [form] = Form.useForm<LoginValues>()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const from = ((location.state as LoginLocationState | null)?.from || '/') as string

  const passwordStrength = useMemo(() => {
    const value = form.getFieldValue('password') || ''
    if (!value) return null
    if (value.length > 12) return { label: '强度：强', color: token.colorSuccess }
    if (value.length > 6) return { label: '强度：中', color: token.colorWarning }
    return { label: '强度：弱', color: token.colorError }
  }, [form, token.colorError, token.colorSuccess, token.colorWarning])

  const handleSubmit = async (values: LoginValues) => {
    setSubmitError(null)
    if (!values.username.trim() || !values.password.trim()) {
      setSubmitError('请输入账号和密码后重试。')
      return
    }
    try {
      await login({
        username: values.username.trim(),
        password: values.password,
      })
      navigate(from, { replace: true })
    } catch (error) {
      const apiError = normalizeApiError(error)
      setSubmitError(apiError.message)
    }
  }

  return (
    <div
      className="flex min-h-screen justify-center p-6 mt-20"
      style={{
        background: `linear-gradient(135deg, ${token.colorBgLayout}, ${token.colorBgContainer})`,
      }}
    >
      <div className="w-full max-w-[360px]">
        <Space orientation="vertical" size={20} className="w-full">
          <div className="text-center">
            <img
              src="https://raw.githubusercontent.com/brand-icons/brands/refs/heads/master/icons/dark/github.svg"
              alt="logo"
              className="mx-auto mb-3 h-10 w-10"
            />
            <Typography.Title level={3} className="!mb-1">
              Github
            </Typography.Title>
            <Typography.Text type="secondary">全球最大的代码托管平台</Typography.Text>
          </div>

          {submitError ? (
            <Alert
              type="error"
              showIcon
              title="登录失败"
              description={submitError}
              closable={{ onClose: () => setSubmitError(null) }}
            />
          ) : null}

          <Form<LoginValues>
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名!' }]}>
              <Input
                size="large"
                prefix={<UserOutlined />}
                placeholder="用户名"
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码！' }]}>
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="current-password"
                onChange={() => form.validateFields(['password']).catch(() => undefined)}
              />
            </Form.Item>
            {passwordStrength ? (
              <div className="-mt-3 mb-3 text-sm" style={{ color: passwordStrength.color }}>
                {passwordStrength.label}
              </div>
            ) : null}
            <Form.Item className="!mb-3">
              <Button type="primary" htmlType="submit" block>
                登 录
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </div>
    </div>
  )
}
