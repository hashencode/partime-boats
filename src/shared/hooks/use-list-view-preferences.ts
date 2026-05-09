import { useCallback, useState } from 'react'

type TableSize = 'small' | 'middle' | 'large'

const TABLE_DENSITY_STORAGE_KEY = 'list:table-density:v1'
const TABLE_COLUMNS_STORAGE_PREFIX = 'list:table-columns:v1:'

const isTableSize = (value: unknown): value is TableSize => {
  return value === 'small' || value === 'middle' || value === 'large'
}

const readJson = <T>(key: string): T | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

const writeJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage write failure and keep runtime state usable
  }
}

type UseListViewPreferencesOptions = {
  tableId: string
  defaultColumnKeys: string[]
  defaultDensity?: TableSize
}

export const useListViewPreferences = ({
  tableId,
  defaultColumnKeys,
  defaultDensity = 'small',
}: UseListViewPreferencesOptions) => {
  const [tableSize, setTableSizeState] = useState<TableSize>(() => {
    const storedDensity = readJson<unknown>(TABLE_DENSITY_STORAGE_KEY)
    return isTableSize(storedDensity) ? storedDensity : defaultDensity
  })

  const [selectedColumnKeys, setSelectedColumnKeysState] = useState<string[]>(() => {
    const storedColumns = readJson<unknown>(`${TABLE_COLUMNS_STORAGE_PREFIX}${tableId}`)
    if (!Array.isArray(storedColumns)) {
      return defaultColumnKeys
    }

    const normalized = storedColumns.filter((item): item is string => typeof item === 'string')
    return normalized.length > 0 ? normalized : defaultColumnKeys
  })

  const setTableSize = useCallback((size: TableSize) => {
    setTableSizeState(size)
    writeJson(TABLE_DENSITY_STORAGE_KEY, size)
  }, [])

  const setSelectedColumnKeys = useCallback(
    (keys: string[]) => {
      setSelectedColumnKeysState(keys)
      writeJson(`${TABLE_COLUMNS_STORAGE_PREFIX}${tableId}`, keys)
    },
    [tableId]
  )

  return {
    tableSize,
    selectedColumnKeys,
    setTableSize,
    setSelectedColumnKeys,
  }
}
