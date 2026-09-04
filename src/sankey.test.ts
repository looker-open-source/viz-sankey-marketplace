/**
 * @jest-environment jsdom
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { vis } from './sankey'

describe('Sankey Visualization', () => {
  let element: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = ''
    element = document.createElement('div')
    // Set mock dimensions for jsdom
    Object.defineProperty(element, 'clientWidth', { value: 800, configurable: true })
    Object.defineProperty(element, 'clientHeight', { value: 600, configurable: true })
    document.body.appendChild(element)
  })

  describe('create()', () => {
    it('should initialize svg element and not inject CSS opacity transitions', () => {
      vis.create(element, {})
      expect(element.querySelector('svg')).not.toBeNull()
      expect(element.innerHTML).not.toContain('transition: 0.5s opacity')
    })
  })

  describe('updateAsync() and doneRendering callback', () => {
    const validQueryResponse: any = {
      data: [],
      pivots: [],
      fields: {
        pivots: [],
        dimensions: [
          { name: 'dim1', label: 'Dim 1' },
          { name: 'dim2', label: 'Dim 2' }
        ],
        dimension_like: [
          { name: 'dim1', label: 'Dim 1' },
          { name: 'dim2', label: 'Dim 2' }
        ],
        measures: [
          { name: 'm1', label: 'Measure 1', value_format: '#,##0' }
        ],
        measure_like: [
          { name: 'm1', label: 'Measure 1', value_format: '#,##0' }
        ]
      }
    }

    const validData = [
      {
        dim1: { value: 'Stage A' },
        dim2: { value: 'Stage B' },
        m1: { value: 100 }
      }
    ]

    it('should call doneRendering when rendering completes successfully', () => {
      vis.create(element, {})
      const doneRendering = jest.fn()

      vis.updateAsync!(validData, element, {}, validQueryResponse, undefined, doneRendering)

      expect(doneRendering).toHaveBeenCalledTimes(1)
      expect(element.querySelectorAll('path.link').length).toBeGreaterThan(0)
    })

    it('should call doneRendering when handleErrors fails (defensive execution)', () => {
      vis.create(element, {})
      const doneRendering = jest.fn()
      const invalidQueryResponse: any = {
        data: [],
        pivots: [],
        fields: {
          pivots: [],
          dimension_like: [{ name: 'dim1' }], // Missing 2nd dimension
          measure_like: [{ name: 'm1' }]
        }
      }

      vis.updateAsync!([], element, {}, invalidQueryResponse, undefined, doneRendering)

      expect(doneRendering).toHaveBeenCalledTimes(1)
    })

    it('should call doneRendering when container size is 0', () => {
      vis.create(element, {})
      Object.defineProperty(element, 'clientWidth', { value: 0, configurable: true })
      Object.defineProperty(element, 'clientHeight', { value: 0, configurable: true })

      const doneRendering = jest.fn()
      vis.updateAsync!(validData, element, {}, validQueryResponse, undefined, doneRendering)

      expect(doneRendering).toHaveBeenCalledTimes(1)
    })

    it('should NOT prepend M-10,-10 MoveTo prefix to link SVG paths', () => {
      vis.create(element, {})
      const doneRendering = jest.fn()

      vis.updateAsync!(validData, element, {}, validQueryResponse, undefined, doneRendering)

      const linkPaths = element.querySelectorAll('path.link')
      expect(linkPaths.length).toBeGreaterThan(0)
      linkPaths.forEach((pathElement) => {
        const d = pathElement.getAttribute('d') || ''
        expect(d).not.toContain('M-10,-10')
        expect(d.startsWith('M')).toBe(true)
      })
    })

    it('should handle missing or null data rows gracefully without throwing', () => {
      vis.create(element, {})
      const doneRendering = jest.fn()
      const nullData = [
        {
          dim1: { value: null },
          dim2: { value: null },
          m1: { value: null }
        }
      ]

      expect(() => {
        vis.updateAsync!(nullData, element, { show_null_points: true }, validQueryResponse, undefined, doneRendering)
      }).not.toThrow()

      expect(doneRendering).toHaveBeenCalledTimes(1)
    })
  })
})
