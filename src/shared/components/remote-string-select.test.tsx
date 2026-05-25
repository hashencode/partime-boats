import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from '@rstest/core'
import { ThemeProvider } from '../contexts/theme-context'
import { RemoteStringSelect } from './remote-string-select'

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

describe('RemoteStringSelect', () => {
  it('should load remote options when mounted', async () => {
    let requestCount = 0
    const request = async () => {
      requestCount += 1
      return ['NINGBO', 'SHA']
    }
    const { container } = render(
      <ThemeProvider>
        <RemoteStringSelect cacheKey="port:test" request={request} placeholder="请选择起始港" />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(requestCount).toBe(1)
    })

    const selector = container.querySelector('.ant-select-content')
    expect(selector).toBeTruthy()
    fireEvent.mouseDown(selector as Element)

    await waitFor(() => {
      expect(screen.getAllByText('NINGBO').length).toBeGreaterThan(0)
      expect(screen.getAllByText('SHA').length).toBeGreaterThan(0)
    })
  })

  it('should keep current value visible when remote loading fails', async () => {
    let requestCount = 0
    let errorCount = 0
    const request = async () => {
      requestCount += 1
      throw new Error('load failed')
    }
    const onLoadError = () => {
      errorCount += 1
    }
    const { container } = render(
      <ThemeProvider>
        <RemoteStringSelect cacheKey="port:error" request={request} value="NINGBO" onLoadError={onLoadError} />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(requestCount).toBe(1)
      expect(errorCount).toBe(1)
    })

    await waitFor(() => {
      expect(container.querySelector('.ant-select-content')?.textContent ?? '').toContain('NINGBO')
    })
  })
})
