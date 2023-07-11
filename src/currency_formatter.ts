/** @fileoverview A set of utility functions for use with parsing and
 * formatting currency values.*/

/**
 * Determines the currency symbol used in the value format.
 *
 * @param valueFormat The format specification to parse.
 * @return The currency associated with the value format.
 */
export function getCurrencySymbol(valueFormat: string) {
  const c = valueFormat.charAt(0);
  switch (c) {
    case '$':
    case '£':
    case '€':
      return c;
    default:
      return '';
  }
}

/**
 * Obtains the span for the generated formatting specification.
 *
 * @param valueFormat The format specification to parse.
 * @return The span used for the generated formatting specification.
 */
export function getFormatSpan(valueFormat: string) {
  const parts = valueFormat.split('.');
  return parts.length > 1 ? parts[1].length : 0;
}

/**
 * Determines the suffix to use with the format.
 *
 * @param valueFormat The input value format.
 * @return The suffix to use with the eventual format.
 */
export function getFormatSuffix(valueFormat: string) {
  const c = valueFormat.slice(-1);
  switch (c) {
    case '%':
      return '%';
    case '0':
      return 'f';
    default:
      return '';
  }
}

/**
 * Determines the character used to group digits in the numeral.
 *
 * @param valueFormat The input format to parse.
 * @param symbol The grouping symbol to look for.
 * @param otherwise The value to return if the symbol has not been found.
 */
export function getGroupingSymbol(
  valueFormat: string,
  symbol = ',',
  otherwise = ''
) {
  return valueFormat.indexOf(symbol) > -1 ? symbol : otherwise;
}

/**
 * Converts from the Sheets currency formatting specification
 * to the one acceptable for D3.js.
 *
 * @param valueFormat The sheets format spec.
 * @return The D3 format spec.
 */
export function fromSheetsToD3Format(valueFormat: string) {
  if (!valueFormat) {
    return '';
  }
  const currency = getCurrencySymbol(valueFormat);
  const grouper = getGroupingSymbol(valueFormat, ',', '');
  const n = getFormatSpan(valueFormat);
  const suffix = getFormatSuffix(valueFormat);
  return `${currency}${grouper}.${n}${suffix}`;
}

/** Original implementation for the currency formatter.
 *
 * @deprecated */
export function fromSheetsToD3FormatOriginal(valueFormat: string) {
  if (!valueFormat) return undefined;
  let format = '';
  switch (valueFormat.charAt(0)) {
    case '$':
      format += '$';
      break;
    case '£':
      format += '£';
      break;
    case '€':
      format += '€';
      break;
  }
  if (valueFormat.indexOf(',') > -1) {
    format += ',';
  }
  const splitValueFormat = valueFormat.split('.');
  format += '.';
  format += splitValueFormat.length > 1 ? splitValueFormat[1].length : 0;

  switch (valueFormat.slice(-1)) {
    case '%':
      format += '%';
      break;
    case '0':
      format += 'f';
      break;
  }
  return format;
}
