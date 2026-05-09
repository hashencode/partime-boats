import { ArrowLeftOutlined } from '@ant-design/icons'
import { Space, Typography } from 'antd'
import React from 'react'

void React

type FormPageHeaderProps = {
  title: string
  onBack: () => void
}

export const FormPageHeader = ({ title, onBack }: FormPageHeaderProps) => {
  return (
    <div className="flex items-center gap-2">
      <ArrowLeftOutlined
        className="ax-breadcrumb__back-icon"
        style={{ fontSize: 24 }}
        onClick={onBack}
        aria-label="返回"
      />
      <Space size={0}>
        <Typography.Title level={4} className="!mb-0">
          {title}
        </Typography.Title>
      </Space>
    </div>
  )
}

export type PageHeaderWithBackProps = FormPageHeaderProps
export const PageHeaderWithBack = FormPageHeader
