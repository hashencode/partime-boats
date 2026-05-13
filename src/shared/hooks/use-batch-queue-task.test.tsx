import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from '@rstest/core'
import { useBatchQueueTask } from './use-batch-queue-task'

void React

describe('useBatchQueueTask', () => {
  it('should pause and retry remaining task when processing fails', async () => {
    const { result } = renderHook(() => useBatchQueueTask())
    let shouldFail = true
    const processedBatches: number[][] = []

    await act(async () => {
      await result.current.start({
        pageSize: 2,
        loadPage: async (page) => {
          if (page === 1) {
            return { ids: [1, 2], total: 3 }
          }
          return { ids: [3], total: 3 }
        },
        processPage: async (ids) => {
          processedBatches.push(ids)
          if (shouldFail) {
            shouldFail = false
            throw new Error('批量处理失败')
          }
        },
      })
    })

    await waitFor(() => {
      expect(result.current.progress.status).toBe('paused')
      expect(result.current.progress.errorMessage).toBe('批量处理失败')
    })

    await act(async () => {
      await result.current.retry()
    })

    await waitFor(() => {
      expect(result.current.progress.status).toBe('success')
      expect(processedBatches).toEqual([[1, 2], [1, 2], [3]])
    })
  })
})
