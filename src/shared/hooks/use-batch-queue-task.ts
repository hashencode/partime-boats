import { useCallback, useRef, useState } from 'react'

export type BatchQueueStatus = 'idle' | 'running' | 'paused' | 'success'

export type BatchQueueTaskPage = {
  ids: number[]
  total: number
}

export type BatchQueueTaskConfig = {
  pageSize: number
  loadPage: (page: number, pageSize: number) => Promise<BatchQueueTaskPage>
  processPage: (ids: number[]) => Promise<void>
}

export type BatchQueueProgress = {
  processed: number
  total: number
  currentStart: number
  currentEnd: number
  status: BatchQueueStatus
  errorMessage: string | null
}

const createInitialProgress = (): BatchQueueProgress => ({
  processed: 0,
  total: 0,
  currentStart: 0,
  currentEnd: 0,
  status: 'idle',
  errorMessage: null,
})

export const useBatchQueueTask = () => {
  const [progress, setProgress] = useState<BatchQueueProgress>(createInitialProgress)
  const configRef = useRef<BatchQueueTaskConfig | null>(null)
  const currentPageRef = useRef(1)
  const processedRef = useRef(0)
  const totalRef = useRef(0)
  const runningRef = useRef(false)

  const run = useCallback(async () => {
    const config = configRef.current
    if (!config || runningRef.current) return

    runningRef.current = true

    try {
      while (true) {
        const pageResult = await config.loadPage(currentPageRef.current, config.pageSize)
        const total = pageResult.total
        const ids = pageResult.ids

        totalRef.current = total

        if (total === 0 || ids.length === 0) {
          setProgress({
            processed: processedRef.current,
            total,
            currentStart: processedRef.current,
            currentEnd: processedRef.current,
            status: 'success',
            errorMessage: null,
          })
          break
        }

        const currentStart = processedRef.current + 1
        const currentEnd = Math.min(processedRef.current + ids.length, total)

        setProgress({
          processed: processedRef.current,
          total,
          currentStart,
          currentEnd,
          status: 'running',
          errorMessage: null,
        })

        await config.processPage(ids)

        processedRef.current += ids.length

        if (processedRef.current >= total) {
          setProgress({
            processed: processedRef.current,
            total,
            currentStart,
            currentEnd,
            status: 'success',
            errorMessage: null,
          })
          break
        }

        currentPageRef.current += 1
      }
    } catch (error) {
      setProgress({
        processed: processedRef.current,
        total: totalRef.current,
        currentStart: processedRef.current + 1,
        currentEnd: Math.min(processedRef.current + config.pageSize, totalRef.current || processedRef.current + config.pageSize),
        status: 'paused',
        errorMessage: error instanceof Error ? error.message : '批量任务执行失败，请稍后重试。',
      })
    } finally {
      runningRef.current = false
    }
  }, [])

  const start = useCallback(
    async (config: BatchQueueTaskConfig) => {
      configRef.current = config
      currentPageRef.current = 1
      processedRef.current = 0
      totalRef.current = 0
      setProgress({
        processed: 0,
        total: 0,
        currentStart: 0,
        currentEnd: 0,
        status: 'running',
        errorMessage: null,
      })
      await run()
    },
    [run]
  )

  const retry = useCallback(async () => {
    setProgress((current) => ({
      ...current,
      status: 'running',
      errorMessage: null,
    }))
    await run()
  }, [run])

  const reset = useCallback(() => {
    configRef.current = null
    currentPageRef.current = 1
    processedRef.current = 0
    totalRef.current = 0
    runningRef.current = false
    setProgress(createInitialProgress())
  }, [])

  return {
    progress,
    start,
    retry,
    reset,
  }
}
