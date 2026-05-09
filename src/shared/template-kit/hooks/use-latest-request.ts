import { useCallback, useEffect, useRef, useState } from 'react'

type UseLatestRequestOptions<TData, TArgs extends unknown[], TError> = {
  request: (...args: TArgs) => Promise<TData>
  mapError?: (error: unknown) => TError
  onError?: (error: TError, args: TArgs) => void
}

type UseLatestRequestResult<TData, TArgs extends unknown[], TError> = {
  loading: boolean
  error: TError | null
  run: (...args: TArgs) => Promise<TData | undefined>
  clearError: () => void
}

export const useLatestRequest = <TData, TArgs extends unknown[] = [], TError = unknown>({
  request,
  mapError,
  onError,
}: UseLatestRequestOptions<TData, TArgs, TError>): UseLatestRequestResult<TData, TArgs, TError> => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<TError | null>(null)
  const requestIdRef = useRef(0)
  const mapErrorRef = useRef(mapError)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    mapErrorRef.current = mapError
  }, [mapError])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const run = useCallback(
    async (...args: TArgs): Promise<TData | undefined> => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId
      setLoading(true)
      setError(null)

      try {
        const response = await request(...args)
        if (requestId !== requestIdRef.current) {
          return undefined
        }
        return response
      } catch (requestError) {
        if (requestId !== requestIdRef.current) {
          return undefined
        }

        const normalizedError = mapErrorRef.current
          ? mapErrorRef.current(requestError)
          : (requestError as TError)
        setError(normalizedError)
        onErrorRef.current?.(normalizedError, args)
        return undefined
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [request]
  )

  return {
    loading,
    error,
    run,
    clearError,
  }
}
