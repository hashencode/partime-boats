import { message } from 'antd'
import { useCallback, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useLatestRequest } from '../hooks/use-latest-request'
import { useListRefreshChannel } from '../hooks/use-list-refresh-channel'
import { useQueryViewState } from '../hooks/use-query-view-state'

type RefreshChannelConfig = {
  channelName: string
  eventType: string
}

type UseTemplateListControllerOptions<TFilter, TResponse, TItem, TError> = {
  filters: TFilter
  request: (filters: TFilter) => Promise<TResponse>
  selectItems: (response: TResponse | null) => TItem[]
  isPartial?: (response: TResponse | null) => boolean
  mapError?: (error: unknown) => TError
  onError?: (error: TError, filters: TFilter) => void
  transformResponse?: (response: TResponse) => TResponse
  refreshChannel?: RefreshChannelConfig
}

type UseTemplateListControllerResult<TResponse, TItem, TError> = {
  response: TResponse | null
  setResponse: Dispatch<SetStateAction<TResponse | null>>
  data: TItem[]
  loading: boolean
  error: TError | null
  showInitialLoading: boolean
  showError: boolean
  showEmpty: boolean
  showPartial: boolean
  load: (options?: {
    showSuccess?: boolean
    transformResponse?: (response: TResponse) => TResponse
  }) => Promise<void>
}

export const useTemplateListController = <TFilter, TResponse, TItem, TError = unknown>({
  filters,
  request,
  selectItems,
  isPartial,
  mapError,
  onError,
  transformResponse,
  refreshChannel,
}: UseTemplateListControllerOptions<
  TFilter,
  TResponse,
  TItem,
  TError
>): UseTemplateListControllerResult<TResponse, TItem, TError> => {
  const [response, setResponse] = useState<TResponse | null>(null)
  const {
    loading,
    error,
    run: runRequest,
  } = useLatestRequest<TResponse, [TFilter], TError>({
    request,
    mapError,
    onError: (requestError) => {
      onError?.(requestError, filters)
    },
  })

  const load = useCallback(
    async (options?: {
      showSuccess?: boolean
      transformResponse?: (response: TResponse) => TResponse
    }) => {
      const nextResponse = await runRequest(filters)
      if (!nextResponse) {
        return
      }

      const applied =
        options?.transformResponse?.(nextResponse) ??
        transformResponse?.(nextResponse) ??
        nextResponse
      setResponse(applied)

      if (options?.showSuccess) {
        void message.success('刷新成功')
      }
    },
    [filters, runRequest, transformResponse]
  )

  useListRefreshChannel({
    channelName: refreshChannel?.channelName ?? '',
    eventType: refreshChannel?.eventType ?? '',
    onRefresh: refreshChannel
      ? () => {
          void load()
        }
      : undefined,
  })

  const data = selectItems(response)
  const { showInitialLoading, showError, showEmpty, showPartial } = useQueryViewState({
    loading,
    hasData: Boolean(response),
    isEmpty: data.length === 0,
    hasError: Boolean(error),
    isPartial: isPartial ? isPartial(response) : false,
  })

  return {
    response,
    setResponse,
    data,
    loading,
    error,
    showInitialLoading,
    showError,
    showEmpty,
    showPartial,
    load,
  }
}
