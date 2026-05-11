import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from '@rstest/core'
import { Button, Form } from 'antd'
import type { TemplateListFilterField } from './template-list-filter-form'
import { DEFAULT_TEMPLATE_LIST_FILTER_ROW_GUTTER, TemplateListFilterForm } from './template-list-filter-form'

void React

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

if (!window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}

type DemoValues = {
  name?: string
  status?: number
  updatedAt?: string
  statusDetail?: string
}

const baseLayoutProps = {
  fieldColProps: { span: 8 },
  actionsColProps: { span: 8 },
}

describe('TemplateListFilterForm', () => {
  it('uses the shared responsive row gutter defaults', () => {
    expect(DEFAULT_TEMPLATE_LIST_FILTER_ROW_GUTTER).toEqual([
      { xs: 8, sm: 12, md: 16, lg: 16, xl: 16, xxl: 16 },
      { xs: 8, sm: 10, md: 12, lg: 12, xl: 12, xxl: 12 },
    ])
  })

  it('renders normally when custom rowGutter overrides the defaults', () => {
    const fields: TemplateListFilterField<DemoValues>[] = [
      {
        type: 'input',
        name: 'name',
        label: '名称',
      },
    ]

    const Demo = () => {
      const [form] = Form.useForm<DemoValues>()

      return (
        <TemplateListFilterForm<DemoValues>
          form={form}
          fields={fields}
          onSubmit={() => undefined}
          onReset={() => undefined}
          rowGutter={[4, 6]}
          {...baseLayoutProps}
        />
      )
    }

    render(
      <Demo />
    )

    expect(screen.getByRole('button', { name: /查\s*询/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /重\s*置/ })).toBeTruthy()
  })

  it('renders conditional field only when visibleWhen is satisfied', async () => {
    const Demo = () => {
      const [form] = Form.useForm<DemoValues>()
      const fields: TemplateListFilterField<DemoValues>[] = [
        {
          type: 'select',
          name: 'status',
          label: '状态',
          options: [
            { label: '关闭', value: 0 },
            { label: '异常', value: 3 },
          ],
        },
        {
          type: 'input',
          name: 'name',
          label: '名称',
        },
        {
          type: 'custom',
          key: 'status-detail-tip',
          visibleWhen: (values) => values.status === 3,
          render: () => <div data-testid="status-detail-tip">异常标签</div>,
        },
      ]

      return (
        <>
          <Button onClick={() => form.setFieldValue('status', 3)}>set-status-error</Button>
          <TemplateListFilterForm<DemoValues>
            form={form}
            fields={fields}
            onSubmit={() => undefined}
            onReset={() => undefined}
            {...baseLayoutProps}
          />
        </>
      )
    }

    render(<Demo />)
    expect(screen.queryByTestId('status-detail-tip')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'set-status-error' }))

    await waitFor(() => {
      expect(screen.getByTestId('status-detail-tip')).toBeTruthy()
    })
  })

  it('loads select options only when dependsOn fields change and aborts stale request', async () => {
    let loadCount = 0
    const seenSignals: AbortSignal[] = []

    const loader = async ({
      values,
      signal,
    }: {
      values: Partial<DemoValues>
      signal: AbortSignal
    }) => {
      loadCount += 1
      seenSignals.push(signal)
      await new Promise<void>((resolve, reject) => {
        if (signal.aborted) {
          reject(new DOMException('aborted', 'AbortError'))
          return
        }

        const timer = window.setTimeout(resolve, 30)
        signal.addEventListener(
          'abort',
          () => {
            window.clearTimeout(timer)
            reject(new DOMException('aborted', 'AbortError'))
          },
          { once: true }
        )
      })

      return [{ label: values.name ?? 'fallback', value: 'ok' }]
    }

    const Demo = () => {
      const [form] = Form.useForm<DemoValues>()
      const fields: TemplateListFilterField<DemoValues>[] = [
        {
          type: 'input',
          name: 'name',
          label: '名称',
        },
        {
          type: 'input',
          name: 'updatedAt',
          label: '更新时间',
        },
        {
          type: 'select',
          name: 'statusDetail',
          label: '异常标签',
          dependsOn: ['name'],
          optionsLoader: loader,
        },
      ]

      return (
        <>
          <Button onClick={() => form.setFieldValue('updatedAt', String(Date.now()))}>set-unrelated</Button>
          <Button onClick={() => form.setFieldValue('name', `name-${Date.now()}`)}>set-name</Button>
          <TemplateListFilterForm<DemoValues>
            form={form}
            fields={fields}
            onSubmit={() => undefined}
            onReset={() => undefined}
            {...baseLayoutProps}
          />
        </>
      )
    }

    render(<Demo />)

    await waitFor(() => {
      expect(loadCount).toBeGreaterThan(0)
    })
    const initialCount = loadCount

    fireEvent.click(screen.getByRole('button', { name: 'set-unrelated' }))
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(loadCount).toBe(initialCount)

    fireEvent.click(screen.getByRole('button', { name: 'set-name' }))
    await waitFor(() => {
      expect(loadCount).toBeGreaterThan(initialCount)
    })

    fireEvent.click(screen.getByRole('button', { name: 'set-name' }))
    await waitFor(() => {
      expect(seenSignals.some((signal) => signal.aborted)).toBe(true)
    })
  })
})
