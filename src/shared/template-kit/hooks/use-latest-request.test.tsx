import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from '@rstest/core'
import { useLatestRequest } from './use-latest-request'

describe('useLatestRequest', () => {
  it('keeps run reference stable when onError changes', async () => {
    const request = async (_value: number) => _value
    const firstOnError = (error: Error, args: [number]) => {
      void error
      void args
    }

    const { result, rerender } = renderHook(
      ({ onError }: { onError?: (error: Error, args: [number]) => void }) =>
        useLatestRequest<number, [number], Error>({
          request,
          onError,
        }),
      {
        initialProps: {
          onError: firstOnError,
        },
      }
    )

    const firstRun = result.current.run

    rerender({
      onError: (error: Error, args: [number]) => {
        void error
        void args
      },
    })

    const secondRun = result.current.run
    expect(secondRun).toBe(firstRun)

    await act(async () => {
      const response = await result.current.run(42)
      expect(response).toBe(42)
    })
  })
})
