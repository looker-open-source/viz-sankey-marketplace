// © 2019 Google LLC.  All rights reserved.
//
// This software is subject to the Google Cloud Terms of Service, as
// modified by the "General Software Terms" of the Google Cloud Service Specific Terms, available at: https://cloud.google.com/terms/service-terms.

import { sankey, sankeyLinkHorizontal, sankeyLeft } from 'd3-sankey'
import { extractHorizontalPathMatch, handleErrors } from './utils'
import { format as SSF } from 'ssf'
import * as d3 from 'd3'

import {
  Cell,
  Link,
  Looker,
  LookerChartUtils,
  VisualizationDefinition
} from './types'

// Global values provided via the API
declare var looker: Looker
declare var LookerCharts: LookerChartUtils

interface Sankey extends VisualizationDefinition {
  svg?: any
  addError?: (error: any) => void
  clearErrors?: (group?: string) => void
}

const vis: Sankey = {
  id: 'sankey', // id/label not required, but nice for testing and keeping manifests in sync
  label: 'Sankey',
  options: {
    color_range: {
      type: 'array',
      label: 'Color Range',
      display: 'colors',
      default: [
        '#dd3333',
        '#80ce5d',
        '#f78131',
        '#369dc1',
        '#c572d3',
        '#36c1b3',
        '#b57052',
        '#ed69af'
      ]
    },
    label_type: {
      default: 'name',
      display: 'select',
      label: 'Label Type',
      type: 'string',
      values: [{ Name: 'name' }, { 'Name (value)': 'name_value' }]
    },
    show_null_points: {
      type: 'boolean',
      label: 'Plot Null Values',
      default: true
    }
  },
  // Set up the initial state of the visualization
  create(element, config) {
    element.innerHTML = ''
    this.svg = d3.select(element).append('svg')
  },
  // Render in response to the data or settings changing
  updateAsync(data, element, config, queryResponse, details, doneRendering) {
    this.clearErrors?.()

    try {
      if (!this.svg) {
        this.svg = d3.select(element).append('svg')
      }

      if (
        !handleErrors(this, queryResponse, {
          min_pivots: 0,
          max_pivots: 0,
          min_dimensions: 2,
          max_dimensions: undefined,
          min_measures: 1,
          max_measures: 1
        })
      ) {
        return
      }

      const width = element.clientWidth || (element.getBoundingClientRect ? element.getBoundingClientRect().width : 0) || 800
      const height = element.clientHeight || (element.getBoundingClientRect ? element.getBoundingClientRect().height : 0) || 600

      if (width <= 0 || height <= 0) {
        return
      }

      const svg = this.svg
        .html('')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')

      const dimensions = queryResponse.fields.dimension_like || []
      const measure = queryResponse.fields.measure_like?.[0]
      if (!measure) {
        return
      }
      const valFormat = measure.value_format || measure.value_format_string

      // config object is not set properly on DB-next
      // unless a user interacts with the config. Just catch the case for now.
      if (typeof config.label_type === 'undefined') {
        config.label_type = 'name'
      }

      const color = d3
        .scaleOrdinal<string[], string[]>()
        .range(config.color_range || vis.options.color_range.default)

      const defs = svg.append('defs')

      const sankeyInst = sankey()
        .nodeAlign(sankeyLeft)
        .nodeWidth(10)
        .nodePadding(12)
        .extent([
          [1, 1],
          [width - 1, Math.max(10, height - 6)]
        ])

      sankeyInst.nodeSort(null)

      let link = svg
        .append('g')
        .attr('class', 'links')
        .attr('fill', 'none')
        .attr('stroke', '#fff')
        .selectAll('path')

      let node = svg
        .append('g')
        .attr('class', 'nodes')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 10)
        .selectAll('g')

      const graph: any = {
        nodes: [],
        links: []
      }

      const nodes = new Set()

      if (Array.isArray(data)) {
        data.forEach(function (d: any) {
          if (!d) return
          // variable number of dimensions
          const path: any[] = []
          for (const dim of dimensions) {
            if (!d[dim.name]) break
            const val = d[dim.name].value
            if (val === null && !config.show_null_points) break
            path.push(val !== null && val !== undefined ? val + '' : 'null')
          }
          path.forEach(function (p: any, i: number) {
            if (i === path.length - 1) return
            const source: any = `${path[i]}${i}len:${path[i].length}`
            const target: any = `${path[i + 1]}${i + 1}len:${path[i + 1].length}`

            nodes.add(source)
            nodes.add(target)
            // Setup drill links
            const drillLinks: Link[] = []
            for (const key in d) {
              if (d[key] && d[key].links) {
                d[key].links.forEach((l: Link) => {
                  drillLinks.push(l)
                })
              }
            }

            const rawVal = d[measure.name] ? +d[measure.name].value : 0
            const val = isNaN(rawVal) ? 0 : Math.max(0, rawVal)

            graph.links.push({
              drillLinks: drillLinks,
              source: source,
              target: target,
              value: val
            })
          })
        })
      }

      const nodesArray = Array.from(nodes.values())

      if (nodesArray.length === 0 || graph.links.length === 0) {
        return
      }

      const nodeIndexMap = new Map(
        nodesArray.map((val, index) => [val, index])
      )

      graph.links.forEach(function (d: Cell) {
        d.source = nodeIndexMap.get(d.source)
        d.target = nodeIndexMap.get(d.target)
      })

      graph.nodes = nodesArray.map((d: any) => {
        const parts = d.split('len:')
        const len = parseInt(parts[parts.length - 1], 10)
        return {
          name: d.slice(0, len)
        }
      })

      sankeyInst(graph)

      link = link
        .data(graph.links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', function (d: any) {
          // Prevents exact horizontal sankey links from disappearing.
          // See for reference https://github.com/d3/d3-sankey/issues/28
          const pathStr = sankeyLinkHorizontal()(d)
          if (!pathStr) return ''
          const match = extractHorizontalPathMatch(pathStr)
          if (match && match.length === 2) {
            const replacementValue = +match[1] + 0.01
            return pathStr.replace(match[1], '' + replacementValue)
          }
          return pathStr
        })
        .style('opacity', 0.4)
        .attr('stroke-width', function (d: Cell) {
          return Math.max(1, d.width || 0)
        })
        .on('mouseenter', function (this: any, d: Cell) {
          svg.selectAll('.link').style('opacity', 0.05)
          d3.select(this).style('opacity', 0.7)
          svg.selectAll('.node').style('opacity', function (p: any) {
            if (p === d.source || p === d.target) return 1
            return 0.5
          })
        })
        .on('click', function (event: MouseEvent, d: Cell) {
          if (LookerCharts?.Utils?.openDrillMenu && d.drillLinks?.length) {
            LookerCharts.Utils.openDrillMenu({
              links: d.drillLinks,
              event: event
            })
          }
        })
        .on('mouseleave', function (d: Cell) {
          svg.selectAll('.node').style('opacity', 1)
          svg.selectAll('.link').style('opacity', 0.4)
        })

      // gradients https://bl.ocks.org/micahstubbs/bf90fda6717e243832edad6ed9f82814
      link.style('stroke', function (d: Cell, i: number) {
        const gradientID = 'sankey-gradient-' + i

        const startColor = color(d.source?.name?.replace(/ .*/, '') || '')
        const stopColor = color(d.target?.name?.replace(/ .*/, '') || '')

        const linearGradient = defs
          .append('linearGradient')
          .attr('id', gradientID)

        linearGradient
          .selectAll('stop')
          .data([
            { offset: '10%', color: startColor },
            { offset: '90%', color: stopColor }
          ])
          .enter()
          .append('stop')
          .attr('offset', function (d: Cell) {
            return d.offset
          })
          .attr('stop-color', function (d: Cell) {
            return d.color
          })

        return 'url(#' + gradientID + ')'
      })

      node = node
        .data(graph.nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .on('mouseenter', function (d: Cell) {
          svg.selectAll('.link').style('opacity', function (p: any) {
            if (p.source === d || p.target === d) return 0.7
            return 0.05
          })
        })
        .on('mouseleave', function (d: Cell) {
          svg.selectAll('.link').style('opacity', 0.4)
        })

      node
        .append('rect')
        .attr('x', function (d: Cell) {
          return d.x0
        })
        .attr('y', function (d: Cell) {
          return d.y0
        })
        .attr('height', function (d: Cell) {
          return Math.abs(d.y1 - d.y0)
        })
        .attr('width', function (d: Cell) {
          return Math.abs(d.x1 - d.x0)
        })
        .attr('fill', function (d: Cell) {
          return color(d.name?.replace(/ .*/, '') || '')
        })
        .attr('stroke', '#555')

      node
        .append('text')
        .attr('x', function (d: Cell) {
          return d.x0 - 6
        })
        .attr('y', function (d: Cell) {
          return (d.y1 + d.y0) / 2
        })
        .attr('dy', '0.35em')
        .style('font-weight', 'bold')
        .attr('text-anchor', 'end')
        .style('fill', '#222')
        .text(function (d: Cell) {
          switch (config.label_type) {
            case 'name':
              return d.name
            case 'name_value': {
              let formattedVal = d.value
              if (valFormat && typeof d.value === 'number') {
                try {
                  formattedVal = SSF(valFormat, d.value)
                } catch (e) {
                  formattedVal = d.value
                }
              }
              return `${d.name} (${formattedVal})`
            }
            default:
              return ''
          }
        })
        .filter(function (d: Cell) {
          return d.x0 < width / 2
        })
        .attr('x', function (d: Cell) {
          return d.x1 + 6
        })
        .attr('text-anchor', 'start')

      node.append('title').text(function (d: Cell) {
        return (d.name || '') + '\n' + (d.value ?? '')
      })
    } catch (error) {
      console.error('Sankey Rendering Error:', error)
      this.addError?.({
        title: 'Rendering Error',
        message:
          'An unexpected error occurred while drawing the visualization.'
      })
    } finally {
      if (typeof doneRendering === 'function') {
        doneRendering()
      }
    }
  }
}
if (typeof looker !== 'undefined' && looker?.plugins?.visualizations) {
  looker.plugins.visualizations.add(vis)
}
export { vis }

