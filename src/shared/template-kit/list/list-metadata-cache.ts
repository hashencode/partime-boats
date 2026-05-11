import type { TemplateListFilterOption, TemplateListSelectOptionsLoader } from './template-list-filter-form'

type CacheEntry<T> = {
  expiresAt: number
  value: T
}

type CachedMetadataOptions = {
  ttlMs?: number
}

const DEFAULT_TTL_MS = 5 * 60 * 1000

const metadataCache = new Map<string, CacheEntry<unknown>>()
const inflightCache = new Map<string, Promise<unknown>>()

const isCacheEntryValid = (entry: CacheEntry<unknown> | undefined) => {
  return Boolean(entry && entry.expiresAt > Date.now())
}

export const getCachedListMetadata = async <T>(
  cacheKey: string,
  request: () => Promise<T>,
  options?: CachedMetadataOptions
): Promise<T> => {
  const cached = metadataCache.get(cacheKey)
  if (isCacheEntryValid(cached)) {
    return cached!.value as T
  }

  const inflight = inflightCache.get(cacheKey)
  if (inflight) {
    return (await inflight) as T
  }

  const nextRequest = request()
    .then((value) => {
      metadataCache.set(cacheKey, {
        expiresAt: Date.now() + (options?.ttlMs ?? DEFAULT_TTL_MS),
        value,
      })
      return value
    })
    .finally(() => {
      inflightCache.delete(cacheKey)
    })

  inflightCache.set(cacheKey, nextRequest)

  return (await nextRequest) as T
}

export const createCachedStringOptionsLoader = <TValues extends Record<string, unknown>>(
  cacheKey: string,
  request: () => Promise<string[]>,
  options?: CachedMetadataOptions
): TemplateListSelectOptionsLoader<TValues> => {
  return async ({ signal }) => {
    if (signal.aborted) {
      return []
    }

    const list = await getCachedListMetadata<TemplateListFilterOption[]>(
      cacheKey,
      async () => {
        const items = await request()
        return items.map((item) => ({ label: item, value: item }))
      },
      options
    )

    if (signal.aborted) {
      return []
    }

    return list
  }
}
