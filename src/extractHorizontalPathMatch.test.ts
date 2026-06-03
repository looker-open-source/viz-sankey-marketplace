import { extractHorizontalPathMatch } from './utils';

describe('extractHorizontalPathMatch', () => {
  it('should return null when the path is null or undefined', () => {
    expect(extractHorizontalPathMatch(null)).toBeNull();
    expect(extractHorizontalPathMatch(undefined)).toBeNull();
  });

  it('should return null when the path does not contain the expected D3 format', () => {
    expect(extractHorizontalPathMatch('M10 10 L20 20')).toBeNull();
    expect(extractHorizontalPathMatch('')).toBeNull();
  });

  it('should successfully extract the coordinate segment from a valid d3-sankey path', () => {
    const mockD3Path = 'M0,15.5C50,15.5,50,30,100,30';
    const match = extractHorizontalPathMatch(mockD3Path);

    expect(match).not.toBeNull();

    // The full regex match
    expect(match![0]).toBe(',15.5C');

    // The captured group (which is the specific coordinate you need)
    expect(match![1]).toBe('15.5');
  });
});
