import type { ReactNode } from 'react'
import type { FormInstance } from 'antd'
import type { ApiError } from '../../../infrastructure/http/api-client'
import type { FormModeViewModel, ParsedFormMode } from '../../../routes/form-route-contract'
import type { FormStateCopyContract } from '../contracts/page-state-contract'
import type { ResetAllHandler } from '../contracts/reset-all-contract'

export type BasicCrudFormSpec<TValues extends object> = {
  parsedMode: ParsedFormMode
  modeView: FormModeViewModel | null
  permissionDenied: boolean
  detailLoading: boolean
  detailError: ApiError | null
  saveLoading: boolean
  isReadonly: boolean
  form: FormInstance<TValues>
  initialValues: Partial<TValues>
  title: string
  maxWidthClassName?: string
  stateCopy: FormStateCopyContract
  onBackToList: () => void
  onRetryDetail: () => void
  onResetAll: ResetAllHandler
  onSubmit: (values: TValues) => Promise<void>
  renderFields: () => ReactNode
  renderAfterForm?: ReactNode
}
