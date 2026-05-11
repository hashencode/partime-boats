import { describe, expect, it } from '@rstest/core'
import { buildSearchGridProps } from './build-search-grid-props'

describe('buildSearchGridProps', () => {
  it('should keep at least three columns before the larger breakpoints', () => {
    const gridProps = buildSearchGridProps(4)

    expect(gridProps.formItem.xs).toBe(8)
    expect(gridProps.formItem.sm).toBe(8)
    expect(gridProps.labelItem.xs).toBe(8)
    expect(gridProps.inputItem.xs).toBe(16)
    expect(gridProps.actions.xs).toEqual({ span: 8, offset: 8 })
    expect(gridProps.actions.sm).toEqual({ span: 8, offset: 8 })
    expect(gridProps.actions.md).toEqual({ span: 8, offset: 8 })
  })

  it('should keep xl at four columns while enabling five columns at xxl', () => {
    const gridProps = buildSearchGridProps(5)

    expect(gridProps.formItem.xl).toBe(6)
    expect(gridProps.formItem.xxl).toEqual({ flex: '20%' })
    expect(gridProps.actions.xl).toEqual({ span: 6, offset: 12 })
    expect(gridProps.actions.xxl).toEqual({ flex: '20%' })
  })

  it('should keep the actions area to one xxl column when the row already has four fields', () => {
    const gridProps = buildSearchGridProps(4)

    expect(gridProps.actions.xxl).toEqual({ flex: '20%' })
  })
})
