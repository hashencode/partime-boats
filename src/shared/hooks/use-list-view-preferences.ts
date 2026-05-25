import { useCallback, useEffect, useMemo, useState } from 'react'

type TableSize = 'small' | 'middle' | 'large'

const TABLE_DENSITY_STORAGE_KEY = 'list:table-density:v1'
const TABLE_COLUMNS_STORAGE_PREFIX = 'list:table-columns:v1:'
const TABLE_ROW_ORDER_STORAGE_PREFIX = 'list:table-order:v1:'
const TABLE_VIEW_PREFERENCES_STORAGE_PREFIX = 'list:table-view-preferences:v1:'

type TableViewPreferences = {
  density: TableSize
  visibleColumnKeys: string[]
  columnOrder: string[]
  rowOrder: string[]
}

const isTableSize = (value: unknown): value is TableSize => {
  return value === 'small' || value === 'middle' || value === 'large'
}

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
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

const removeStorageItem = (key: string) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore storage removal failure and keep runtime state usable
  }
}

const buildTableColumnsStorageKey = (tableId: string) => `${TABLE_COLUMNS_STORAGE_PREFIX}${tableId}`
const buildTableRowOrderStorageKey = (tableId: string) => `${TABLE_ROW_ORDER_STORAGE_PREFIX}${tableId}`
const buildTableViewPreferencesStorageKey = (tableId: string) => `${TABLE_VIEW_PREFERENCES_STORAGE_PREFIX}${tableId}`

export const applyPersistedOrderToKeys = (sourceKeys: string[], persistedOrder: string[]) => {
  if (persistedOrder.length === 0) {
    return sourceKeys
  }

  const sourceKeySet = new Set(sourceKeys)
  const orderedVisibleKeys = persistedOrder.filter((key) => sourceKeySet.has(key))
  const orderedVisibleKeySet = new Set(orderedVisibleKeys)
  const unseenKeys = sourceKeys.filter((key) => !orderedVisibleKeySet.has(key))

  return [...orderedVisibleKeys, ...unseenKeys]
}

export const mergePersistedOrder = (persistedOrder: string[], visibleKeys: string[], nextVisibleKeys: string[]) => {
  if (persistedOrder.length === 0) {
    return nextVisibleKeys
  }

  const visibleKeySet = new Set(visibleKeys)
  const reorderedVisibleQueue = [...nextVisibleKeys]
  const nextPersistedOrder = persistedOrder.map((key) =>
    visibleKeySet.has(key) ? (reorderedVisibleQueue.shift() ?? key) : key
  )

  return [...nextPersistedOrder, ...reorderedVisibleQueue]
}

const sanitizeVisibleColumnKeys = (keys: string[], defaultColumnKeys: string[]) => {
  const defaultColumnKeySet = new Set(defaultColumnKeys)
  const visibleColumnKeys = keys.filter((key) => defaultColumnKeySet.has(key))

  return visibleColumnKeys.length > 0 ? visibleColumnKeys : defaultColumnKeys
}

const sanitizeColumnOrder = (order: string[], defaultColumnKeys: string[]) => {
  return applyPersistedOrderToKeys(defaultColumnKeys, order)
}

const isSameStringArray = (left: string[], right: string[]) => {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

const readLegacyDensity = (defaultDensity: TableSize) => {
  const storedDensity = readJson<unknown>(TABLE_DENSITY_STORAGE_KEY)
  return isTableSize(storedDensity) ? storedDensity : defaultDensity
}

const readStoredTableViewPreferences = (
  tableId: string,
  defaultColumnKeys: string[],
  defaultDensity: TableSize
): TableViewPreferences => {
  const storedPreferences = readJson<Partial<TableViewPreferences>>(buildTableViewPreferencesStorageKey(tableId))
  const legacyVisibleColumns = readJson<unknown>(buildTableColumnsStorageKey(tableId))
  const legacyRowOrder = readJson<unknown>(buildTableRowOrderStorageKey(tableId))

  return {
    density: isTableSize(storedPreferences?.density) ? storedPreferences.density : readLegacyDensity(defaultDensity),
    visibleColumnKeys: sanitizeVisibleColumnKeys(
      isStringArray(storedPreferences?.visibleColumnKeys)
        ? storedPreferences.visibleColumnKeys
        : isStringArray(legacyVisibleColumns)
          ? legacyVisibleColumns
          : defaultColumnKeys,
      defaultColumnKeys
    ),
    columnOrder: sanitizeColumnOrder(
      isStringArray(storedPreferences?.columnOrder) ? storedPreferences.columnOrder : defaultColumnKeys,
      defaultColumnKeys
    ),
    rowOrder: isStringArray(storedPreferences?.rowOrder)
      ? storedPreferences.rowOrder
      : isStringArray(legacyRowOrder)
        ? legacyRowOrder
        : [],
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
  defaultDensity = 'middle',
}: UseListViewPreferencesOptions) => {
  const defaultColumnKeysKey = useMemo(() => defaultColumnKeys.join('|'), [defaultColumnKeys])
  const [preferences, setPreferencesState] = useState<TableViewPreferences>(() =>
    readStoredTableViewPreferences(tableId, defaultColumnKeys, defaultDensity)
  )

  const writePreferences = useCallback(
    (nextPreferences: TableViewPreferences) => {
      writeJson(buildTableViewPreferencesStorageKey(tableId), nextPreferences)
      writeJson(TABLE_DENSITY_STORAGE_KEY, nextPreferences.density)
    },
    [tableId]
  )

  const setPreferences = useCallback(
    (updater: TableViewPreferences | ((current: TableViewPreferences) => TableViewPreferences)) => {
      setPreferencesState((current) => {
        const nextPreferences = typeof updater === 'function' ? updater(current) : updater
        writePreferences(nextPreferences)
        return nextPreferences
      })
    },
    [writePreferences]
  )

  useEffect(() => {
    setPreferencesState((current) => {
      const nextVisibleColumnKeys = sanitizeVisibleColumnKeys(current.visibleColumnKeys, defaultColumnKeys)
      const nextColumnOrder = sanitizeColumnOrder(current.columnOrder, defaultColumnKeys)
      const nextPreferences = {
        ...current,
        visibleColumnKeys: nextVisibleColumnKeys,
        columnOrder: nextColumnOrder,
      }

      if (isSameStringArray(nextVisibleColumnKeys, current.visibleColumnKeys) && isSameStringArray(nextColumnOrder, current.columnOrder)) {
        return current
      }

      writePreferences(nextPreferences)
      return nextPreferences
    })
  }, [defaultColumnKeys, defaultColumnKeysKey, writePreferences])

  const setTableSize = useCallback((size: TableSize) => {
    setPreferences((current) => ({
      ...current,
      density: size,
    }))
  }, [setPreferences])

  const setSelectedColumnKeys = useCallback(
    (keys: string[]) => {
      setPreferences((current) => ({
        ...current,
        visibleColumnKeys: sanitizeVisibleColumnKeys(keys, defaultColumnKeys),
      }))
    },
    [defaultColumnKeys, setPreferences]
  )

  const setColumnOrder = useCallback(
    (keys: string[]) => {
      setPreferences((current) => ({
        ...current,
        columnOrder: sanitizeColumnOrder(keys, defaultColumnKeys),
      }))
    },
    [defaultColumnKeys, setPreferences]
  )

  const clearColumnOrder = useCallback(() => {
    setPreferences((current) => ({
      ...current,
      columnOrder: defaultColumnKeys,
    }))
  }, [defaultColumnKeys, setPreferences])

  const setRowOrder = useCallback(
    (rowOrder: string[]) => {
      setPreferences((current) => ({
        ...current,
        rowOrder,
      }))
    },
    [setPreferences]
  )

  const clearRowOrder = useCallback(() => {
    setPreferences((current) => ({
      ...current,
      rowOrder: [],
    }))
    removeStorageItem(buildTableRowOrderStorageKey(tableId))
  }, [setPreferences, tableId])

  const hasCustomColumnOrder = useMemo(
    () => preferences.columnOrder.join('|') !== defaultColumnKeys.join('|'),
    [defaultColumnKeysKey, preferences.columnOrder]
  )

  return {
    tableSize: preferences.density,
    selectedColumnKeys: preferences.visibleColumnKeys,
    columnOrder: preferences.columnOrder,
    rowOrder: preferences.rowOrder,
    hasCustomColumnOrder,
    hasCustomRowOrder: preferences.rowOrder.length > 0,
    setTableSize,
    setSelectedColumnKeys,
    setColumnOrder,
    clearColumnOrder,
    setRowOrder,
    clearRowOrder,
  }
}
