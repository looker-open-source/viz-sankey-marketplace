// © 2019 Google LLC.  All rights reserved.
//
// This software is subject to the Google Cloud Terms of Service, as
// modified by the "General Software Terms" of the Google Cloud Service Specific Terms, available at: https://cloud.google.com/terms/service-terms.

import { describe, expect, it, jest } from '@jest/globals'
import { extractHorizontalPathMatch } from './utils'

describe('extractHorizontalPathMatch', () => {
  it('should return null when the path is null or undefined', () => {
    expect(extractHorizontalPathMatch(null)).toBeNull()
    expect(extractHorizontalPathMatch(undefined)).toBeNull()
  })

  it('should return null when the path does not contain the expected D3 format', () => {
    expect(extractHorizontalPathMatch('M10 10 L20 20')).toBeNull()
    expect(extractHorizontalPathMatch('')).toBeNull()
  })

  it('should successfully extract the coordinate segment from a valid d3-sankey path', () => {
    const mockD3Path = 'M0,15.5C50,15.5,50,30,100,30'
    const match = extractHorizontalPathMatch(mockD3Path)

    expect(match).not.toBeNull()

    // The full regex match
    expect(match![0]).toBe(',15.5C')

    // The captured group (which is the specific coordinate you need)
    expect(match![1]).toBe('15.5')
  })
})

describe('handleErrors', () => {
  it('should return false and add error if dimensions count is below minimum', () => {
    const mockVis: any = {
      addError: jest.fn(),
      clearErrors: jest.fn()
    }
    const mockResponse: any = {
      fields: {
        pivots: [],
        dimensions: [{ name: 'dim1' }],
        measure_like: [{ name: 'm1' }]
      }
    }
    const options: any = {
      min_pivots: 0,
      max_pivots: 0,
      min_dimensions: 2,
      max_dimensions: undefined,
      min_measures: 1,
      max_measures: 1
    }

    const { handleErrors } = require('./utils')
    const result = handleErrors(mockVis, mockResponse, options)
    expect(result).toBe(false)
    expect(mockVis.addError).toHaveBeenCalledWith({
      title: 'Not Enough Dimensions',
      message: 'This visualization requires at least 2 dimensions.',
      group: 'dim-req'
    })
  })

  it('should return true and clear errors if query response meets options criteria', () => {
    const mockVis: any = {
      addError: jest.fn(),
      clearErrors: jest.fn()
    }
    const mockResponse: any = {
      fields: {
        pivots: [],
        dimensions: [{ name: 'dim1' }, { name: 'dim2' }],
        measure_like: [{ name: 'm1' }]
      }
    }
    const options: any = {
      min_pivots: 0,
      max_pivots: 0,
      min_dimensions: 2,
      max_dimensions: undefined,
      min_measures: 1,
      max_measures: 1
    }

    const { handleErrors } = require('./utils')
    const result = handleErrors(mockVis, mockResponse, options)
    expect(result).toBe(true)
    expect(mockVis.clearErrors).toHaveBeenCalled()
  })
})

