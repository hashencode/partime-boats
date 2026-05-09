import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from '@rstest/core'
import { Form, Input } from 'antd'
import { StepFormRecipe } from './step-form-recipe'
import type { StepFormSpec } from '../specs/step-form-spec'

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
  name: string
}

const createBaseSpec = (form: ReturnType<typeof Form.useForm<DemoValues>>[0]): StepFormSpec<DemoValues> => ({
  title: '分步演示',
  form,
  initialValues: { name: 'demo' },
  currentStep: 0,
  steps: [{ title: '第一步' }, { title: '第二步' }],
  submitting: false,
  primaryActionLabel: '下一步',
  showStepActions: true,
  onBackToList: () => undefined,
  onPrevStep: () => undefined,
  onPrimaryAction: async () => undefined,
  renderStepContent: () => (
    <Form.Item label="名称" name="name">
      <Input placeholder="请输入名称" />
    </Form.Item>
  ),
})

describe('StepFormRecipe', () => {
  it('renders step shell and primary action', () => {
    const Demo = () => {
      const [form] = Form.useForm<DemoValues>()
      return <StepFormRecipe spec={createBaseSpec(form)} />
    }

    render(<Demo />)

    expect(screen.getByText('分步演示')).toBeTruthy()
    expect(screen.getByText('第一步')).toBeTruthy()
    expect(screen.getByRole('button', { name: '下一步' })).toBeTruthy()
  })

  it('shows previous button when current step is greater than zero', () => {
    const Demo = () => {
      const [form] = Form.useForm<DemoValues>()
      return <StepFormRecipe spec={{ ...createBaseSpec(form), currentStep: 1 }} />
    }

    render(<Demo />)

    expect(screen.getByRole('button', { name: '上一步' })).toBeTruthy()
  })

  it('calls primary action from unified action button', () => {
    let triggerCount = 0

    const Demo = () => {
      const [form] = Form.useForm<DemoValues>()
      return <StepFormRecipe spec={{ ...createBaseSpec(form), onPrimaryAction: async () => { triggerCount += 1 } }} />
    }

    render(<Demo />)
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))

    expect(triggerCount).toBe(1)
  })

  it('hides actions when page is in completed state', () => {
    const Demo = () => {
      const [form] = Form.useForm<DemoValues>()
      return <StepFormRecipe spec={{ ...createBaseSpec(form), showStepActions: false }} />
    }

    render(<Demo />)

    expect(screen.queryByRole('button', { name: '下一步' })).toBeNull()
  })
})
