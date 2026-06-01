import dayjs from 'dayjs'

const normalizeTextValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  return String(value).trim()
}

const parseFiniteNumber = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const parseDateTimestamp = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.valueOf() : undefined
}

export const compareTextSortValue = (left?: string | number | null, right?: string | number | null) => {
  return normalizeTextValue(left).localeCompare(normalizeTextValue(right), 'zh-Hans-CN', {
    numeric: true,
    sensitivity: 'base',
  })
}

export const compareNumberSortValue = (left?: string | number | null, right?: string | number | null) => {
  const leftNumber = parseFiniteNumber(left)
  const rightNumber = parseFiniteNumber(right)

  if (leftNumber !== undefined && rightNumber !== undefined) {
    return leftNumber - rightNumber
  }

  if (leftNumber !== undefined) {
    return -1
  }

  if (rightNumber !== undefined) {
    return 1
  }

  return compareTextSortValue(left, right)
}

export const compareDateSortValue = (left?: string | number | null, right?: string | number | null) => {
  const leftTimestamp = parseDateTimestamp(left)
  const rightTimestamp = parseDateTimestamp(right)

  if (leftTimestamp !== undefined && rightTimestamp !== undefined) {
    return leftTimestamp - rightTimestamp
  }

  if (leftTimestamp !== undefined) {
    return -1
  }

  if (rightTimestamp !== undefined) {
    return 1
  }

  return compareTextSortValue(left, right)
}

export const createTextSorter =
  <TItem>(pickValue: (item: TItem) => string | number | null | undefined) =>
  (left: TItem, right: TItem) =>
    compareTextSortValue(pickValue(left), pickValue(right))

export const createNumberSorter =
  <TItem>(pickValue: (item: TItem) => string | number | null | undefined) =>
  (left: TItem, right: TItem) =>
    compareNumberSortValue(pickValue(left), pickValue(right))

export const createDateSorter =
  <TItem>(pickValue: (item: TItem) => string | number | null | undefined) =>
  (left: TItem, right: TItem) =>
    compareDateSortValue(pickValue(left), pickValue(right))
