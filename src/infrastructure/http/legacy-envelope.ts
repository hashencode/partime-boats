export type LegacyEnvelope<T> = {
  bool_status?: boolean
  msg?: string
  data?: T | null
}

export const unwrapLegacyEnvelope = <T>(raw: T | LegacyEnvelope<T>): T => {
  const envelope = raw as LegacyEnvelope<T>
  if (typeof envelope.bool_status === 'boolean') {
    if (!envelope.bool_status) {
      throw new Error(envelope.msg || '请求失败，请稍后重试。')
    }
    if (envelope.data === undefined) {
      throw new Error('接口返回缺少 data 字段。')
    }
    return envelope.data as T
  }
  return raw as T
}

export const unwrapLegacyEnvelopeOr = <T>(
  raw: T | LegacyEnvelope<T> | null | undefined,
  fallback: T
): T => {
  const envelope = raw as LegacyEnvelope<T> | null | undefined
  if (typeof envelope?.bool_status === 'boolean') {
    if (!envelope.bool_status) {
      throw new Error(envelope.msg || '请求失败，请稍后重试。')
    }
    return envelope.data ?? fallback
  }
  return (raw ?? fallback) as T
}

export const toArrayOrEmpty = <T>(value: T[] | null | undefined): T[] => {
  return Array.isArray(value) ? value : []
}
