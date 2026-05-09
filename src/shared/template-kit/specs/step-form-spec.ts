import type { ReactNode } from 'react'
import type { FormInstance } from 'antd'

export type StepFormSpec<TValues extends object> = {
  title: string
  form: FormInstance<TValues>
  initialValues: Partial<TValues>
  currentStep: number
  steps: Array<{
    title: string
  }>
  submitting: boolean
  primaryActionLabel: string
  showStepActions: boolean
  minBodyHeightClassName?: string
  onBackToList: () => void
  onPrevStep: () => void
  onPrimaryAction: () => Promise<void>
  renderStepContent: () => ReactNode
  renderBottomNotes?: ReactNode
}
