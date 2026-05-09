export type ListStateCopyContract = Partial<{
  loadingTitle: string
  errorTitle: string
  errorDescription: string
  errorActionLabel: string
  partialTitle: string
  partialDescription: string
  partialActionLabel: string
  emptyTitle: string
  emptyDescription: string
  emptyActionLabel: string
}>

export type FormStateCopyContract = {
  readonlyNotice?: string
  submitBlockedMessage?: string
  submitSuccessMessage: string
}
