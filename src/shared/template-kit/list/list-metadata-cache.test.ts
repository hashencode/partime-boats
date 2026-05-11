import { describe, expect, it } from '@rstest/core'
import { createCachedStringOptionsLoader, getCachedListMetadata } from './list-metadata-cache'

describe('list metadata cache', () => {
  it('should reuse cached metadata for repeated requests', async () => {
    let requestCount = 0
    const cacheKey = `test-cache-${crypto.randomUUID()}`

    const first = await getCachedListMetadata(cacheKey, async () => {
      requestCount += 1
      return ['A', 'B']
    })

    const second = await getCachedListMetadata(cacheKey, async () => {
      requestCount += 1
      return ['X']
    })

    expect(first).toEqual(['A', 'B'])
    expect(second).toEqual(['A', 'B'])
    expect(requestCount).toBe(1)
  })

  it('should dedupe concurrent option loading for the same key', async () => {
    let requestCount = 0
    const cacheKey = `option-cache-${crypto.randomUUID()}`
    const loader = createCachedStringOptionsLoader<Record<string, unknown>>(cacheKey, async () => {
      requestCount += 1
      await Promise.resolve()
      return ['宁波', '上海']
    })

    const [first, second] = await Promise.all([
      loader({ values: {}, signal: new AbortController().signal }),
      loader({ values: {}, signal: new AbortController().signal }),
    ])

    expect(first).toEqual([
      { label: '宁波', value: '宁波' },
      { label: '上海', value: '上海' },
    ])
    expect(second).toEqual(first)
    expect(requestCount).toBe(1)
  })
})
