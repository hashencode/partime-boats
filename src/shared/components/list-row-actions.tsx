import { Button, Divider, Popconfirm, Popover } from 'antd'
import React, { Fragment, useMemo, useState } from 'react'

void React

export type ListRowActionSpec = {
  key: string
  label: string
  danger?: boolean
  disabled?: boolean
  visible?: boolean
  href?: string
  target?: string
  rel?: string
  confirm?: {
    title: string
    description?: string
    okText?: string
    cancelText?: string
  }
  onClick?: () => void | Promise<void>
}

type ListRowActionsProps = {
  actions: ListRowActionSpec[]
  maxVisibleActions?: number
  moreLabel?: string
}

const renderDirectAction = (action: ListRowActionSpec) => {
  const button = (
    <Button
      key={action.key}
      type="link"
      danger={action.danger}
      disabled={action.disabled}
      className="!px-0"
      href={action.href}
      target={action.target}
      rel={action.rel}
      onClick={
        action.confirm || !action.onClick
          ? undefined
          : () => {
              void action.onClick?.()
            }
      }
    >
      {action.label}
    </Button>
  )

  if (!action.confirm) {
    return button
  }

  return (
    <Popconfirm
      key={action.key}
      title={action.confirm.title}
      description={action.confirm.description}
      okText={action.confirm.okText}
      cancelText={action.confirm.cancelText}
      onConfirm={() => {
        void action.onClick?.()
      }}
    >
      {button}
    </Popconfirm>
  )
}

export const ListRowActions = ({
  actions,
  maxVisibleActions = Number.POSITIVE_INFINITY,
  moreLabel = '更多',
}: ListRowActionsProps) => {
  const [moreOpen, setMoreOpen] = useState(false)

  const visibleActions = useMemo(
    () => actions.filter((action) => action.visible !== false),
    [actions]
  )

  const directActions = visibleActions.slice(0, maxVisibleActions)
  const overflowActions = visibleActions.slice(maxVisibleActions)

  const overflowContent = (
    <div className="flex min-w-[120px] flex-col">
      {overflowActions.map((action, index) => {
        const button = (
          <Button
            key={action.key}
            type="text"
            danger={action.danger}
            disabled={action.disabled}
            className="!flex !w-full !justify-start !px-2"
            onClick={
              action.confirm || !action.onClick
                ? undefined
                : () => {
                    setMoreOpen(false)
                    void action.onClick?.()
                  }
            }
          >
            {action.label}
          </Button>
        )

        const content = action.confirm ? (
          <Popconfirm
            key={action.key}
            title={action.confirm.title}
            description={action.confirm.description}
            okText={action.confirm.okText}
            cancelText={action.confirm.cancelText}
            onConfirm={() => {
              setMoreOpen(false)
              void action.onClick?.()
            }}
          >
            {button}
          </Popconfirm>
        ) : (
          button
        )

        return (
          <Fragment key={action.key}>
            {content}
            {index < overflowActions.length - 1 ? <Divider className="!my-1" /> : null}
          </Fragment>
        )
      })}
    </div>
  )

  return (
    <div className="inline-flex items-center">
      {directActions.map((action, index) => (
        <Fragment key={action.key}>
          {renderDirectAction(action)}
          {index < directActions.length - 1 || overflowActions.length > 0 ? <Divider type="vertical" /> : null}
        </Fragment>
      ))}
      {overflowActions.length > 0 ? (
        <Popover
          trigger="click"
          placement="bottomRight"
          open={moreOpen}
          onOpenChange={setMoreOpen}
          content={overflowContent}
        >
          <Button type="link" className="!px-0">
            {moreLabel}
          </Button>
        </Popover>
      ) : null}
    </div>
  )
}
