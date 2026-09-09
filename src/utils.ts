// © 2019 Google LLC.  All rights reserved.
//
// This software is subject to the Google Cloud Terms of Service, as
// modified by the "General Software Terms" of the Google Cloud Service Specific Terms, available at: https://cloud.google.com/terms/service-terms.

import * as d3 from 'd3';

import {VisConfig, VisQueryResponse, VisualizationDefinition} from './types';

export {d3};

export const extractHorizontalPathMatch = (
  path: string | null | undefined
): RegExpMatchArray | null => {
  if (!path) return null;
  return path.match(/,([^C]+)C/);
};

export const handleErrors = (
  vis: VisualizationDefinition,
  res: VisQueryResponse,
  options: VisConfig
) => {
  const check = (
    group: string,
    noun: string,
    count: number,
    min: number,
    max: number
  ): boolean => {
    if (count < min) {
      vis.addError?.({
        title: `Not Enough ${noun}s`,
        message: `This visualization requires ${
          min === max ? 'exactly' : 'at least'
        } ${min} ${noun.toLowerCase()}${min === 1 ? '' : 's'}.`,
        group,
      });
      return false;
    }
    if (count > max) {
      vis.addError?.({
        title: `Too Many ${noun}s`,
        message: `This visualization requires ${
          min === max ? 'exactly' : 'no more than'
        } ${max} ${noun.toLowerCase()}${min === 1 ? '' : 's'}.`,
        group,
      });
      return false;
    }
    vis.clearErrors?.(group);
    return true;
  };

  const pivots = res?.fields?.pivots || [];
  const dimensions =
    res?.fields?.dimensions || res?.fields?.dimension_like || [];
  const measures = res?.fields?.measures || res?.fields?.measure_like || [];

  return (
    check(
      'pivot-req',
      'Pivot',
      pivots.length,
      options.min_pivots,
      options.max_pivots
    ) &&
    check(
      'dim-req',
      'Dimension',
      dimensions.length,
      options.min_dimensions,
      options.max_dimensions
    ) &&
    check(
      'mes-req',
      'Measure',
      measures.length,
      options.min_measures,
      options.max_measures
    )
  );
};
