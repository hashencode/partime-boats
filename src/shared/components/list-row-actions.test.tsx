import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from '@rstest/core'
import { ListRowActions, type ListRowActionSpec } from './list-row-actions'

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

describe('ListRowActions', () => {
  it('renders direct actions with vertical dividers', () => {
    const actions: ListRowActionSpec[] = [
      { key: 'view', label: '查看', onClick: () => undefined },
      { key: 'edit', label: '修改', onClick: () => undefined },
    ]

    const { container } = render(<ListRowActions actions={actions} />)

    expect(screen.getByRole('button', { name: '查看' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '修改' })).toBeTruthy()
    expect(container.querySelectorAll('.ant-divider-vertical').length).toBe(1)
  })

  it('moves overflow actions into more popover', async () => {
    const actions: ListRowActionSpec[] = [
      { key: 'view', label: '查看', onClick: () => undefined },
      { key: 'edit', label: '修改', onClick: () => undefined },
      { key: 'delete', label: '删除', onClick: () => undefined },
    ]

    render(<ListRowActions actions={actions} maxVisibleActions={2} />)

    expect(screen.getByRole('button', { name: '查看' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '修改' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '更多' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '更多' }))

    expect(await screen.findByRole('button', { name: '删除' })).toBeTruthy()
  })

  it('renders link actions with href metadata', () => {
    const actions: ListRowActionSpec[] = [
      {
        key: 'booking',
        label: '订舱',
        href: 'https://example.com/booking',
        target: '_blank',
        rel: 'noreferrer',
      },
    ]

    render(<ListRowActions actions={actions} />)

    const linkAction = screen.getByRole('link', { name: '订舱' })
    expect(linkAction.getAttribute('href')).toBe('https://example.com/booking')
    expect(linkAction.getAttribute('target')).toBe('_blank')
  })

  it('wraps dangerous actions with popconfirm', async () => {
    let deleteCount = 0
    const actions: ListRowActionSpec[] = [
      {
        key: 'delete',
        label: '删除',
        danger: true,
        confirm: {
          title: '确认删除这条规则吗？',
          description: '删除后将从当前列表中移除。',
          okText: '确认删除',
          cancelText: '取消',
        },
        onClick: () => {
          deleteCount += 1
        },
      },
    ]

    render(<ListRowActions actions={actions} />)

    fireEvent.click(screen.getByRole('button', { name: '删除' }))

    expect(await screen.findByText('确认删除这条规则吗？')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }))

    await waitFor(() => {
      expect(deleteCount).toBe(1)
    })
  })
})
