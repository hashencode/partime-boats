import { useCallback } from 'react'
import type { FormMode } from '../../../routes/form-route-contract'

export const useCrudFormNavigation = (formRoute: string) => {
  const openFormPage = useCallback(
    (mode: FormMode, resourceKey?: string) => {
      const params = new URLSearchParams({ mode })
      if (resourceKey) {
        params.set('id', resourceKey)
      }

      const url = `${formRoute}?${params.toString()}`
      window.open(url, '_blank', 'noopener,noreferrer')
    },
    [formRoute]
  )

  return {
    openFormPage,
  }
}
