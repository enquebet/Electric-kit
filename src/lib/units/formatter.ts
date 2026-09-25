import { QuantityType } from '../../types/units';
import { UNITS_REGISTRY } from './quantities';

/**
 * Format a number to engineering notation with appropriate SI prefix
 */
export function formatEngineeringNotation(
  value: number,
  baseSymbol: string,
  sigFigs: number = 4
): { formattedNumber: string; prefix: string; full: string } {
  if (value === 0) {
    return { formattedNumber: '0', prefix: '', full: `0 ${baseSymbol}`.trim() };
  }
  if (!Number.isFinite(value)) {
    const infStr = value === Infinity ? '∞' : value === -Infinity ? '-∞' : 'NaN';
    return { formattedNumber: infStr, prefix: '', full: `${infStr} ${baseSymbol}`.trim() };
  }

  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  // Log10 to determine order of magnitude
  const exponent = Math.floor(Math.log10(absVal));
  let engExponent = Math.floor(exponent / 3) * 3;

  const prefixMap: Record<number, string> = {
    12: 'T',
    9: 'G',
    6: 'M',
    3: 'k',
    0: '',
    [-3]: 'm',
    [-6]: 'µ',
    [-9]: 'n',
    [-12]: 'p',
    [-15]: 'f',
  };

  let scaled = absVal / Math.pow(10, engExponent);
  let numStr = formatSignificantFigures(scaled, sigFigs);

  // Check if rounding pushed scaled value over 1000 boundary (e.g. 999.96 -> 1000)
  if (parseFloat(numStr) >= 1000 && prefixMap[engExponent + 3] !== undefined) {
    engExponent += 3;
    scaled = absVal / Math.pow(10, engExponent);
    numStr = formatSignificantFigures(scaled, sigFigs);
  }

  const prefix = prefixMap[engExponent];

  if (prefix !== undefined) {
    const full = `${sign}${numStr} ${prefix}${baseSymbol}`.trim();
    return { formattedNumber: `${sign}${numStr}`, prefix, full };
  }

  // Fallback to exponential
  const expStr = value.toExponential(sigFigs - 1);
  return { formattedNumber: expStr, prefix: '', full: `${expStr} ${baseSymbol}`.trim() };
}

/**
 * Formats a number to a specified number of significant figures without trailing noise or floating artifacts
 */
export function formatSignificantFigures(num: number, sigFigs: number = 4): string {
  if (num === 0) return '0';
  if (!Number.isFinite(num)) {
    if (num === Infinity) return '∞';
    if (num === -Infinity) return '-∞';
    return String(num);
  }

  // Fix floating point representation jitter (e.g. 0.07000000000000002 -> 0.07)
  const cleanNum = Number(num.toPrecision(12));
  const prec = cleanNum.toPrecision(sigFigs);
  const parsed = parseFloat(prec);

  // If number is a simple integer or clean decimal within standard range, strip trailing zero noise if appropriate
  if (Math.abs(parsed) >= 1e-4 && Math.abs(parsed) < 1e7) {
    // Avoid displaying 5.00000000001
    return Number(prec).toString();
  }
  return prec;
}

/**
 * Human readable formatting for engineering calculation outputs
 */
export function formatQuantity(
  valueInBase: number,
  quantity: QuantityType,
  preferredUnitSymbol?: string,
  sigFigs: number = 4
): string {
  const units = UNITS_REGISTRY[quantity] || [];
  const baseUnit = units.find(u => u.isBase) || units[0] || { symbol: '', factorToBase: 1 };

  if (!Number.isFinite(valueInBase)) {
    if (valueInBase === Infinity) return `∞ ${baseUnit.symbol}`.trim();
    if (valueInBase === -Infinity) return `-∞ ${baseUnit.symbol}`.trim();
    return 'Invalid value';
  }

  if (preferredUnitSymbol) {
    const targetUnit = units.find(u => u.symbol === preferredUnitSymbol);
    if (targetUnit) {
      const converted = valueInBase / targetUnit.factorToBase;
      const numStr = formatSignificantFigures(converted, sigFigs);
      return `${numStr} ${targetUnit.symbol}`;
    }
  }

  // Auto pick best matching unit from the registry
  const absVal = Math.abs(valueInBase);
  if (absVal === 0) {
    return `0 ${baseUnit.symbol}`;
  }

  // Find unit where converted value is closest to 1..999
  let bestUnit = baseUnit;
  let bestDiff = Infinity;

  for (const u of units) {
    if (u.factorToBase === 0) continue;
    const valInUnit = absVal / u.factorToBase;
    if (valInUnit >= 0.8 && valInUnit < 1000) {
      const diff = Math.abs(Math.log10(valInUnit) - 1.5); // centered around ~30
      if (diff < bestDiff) {
        bestDiff = diff;
        bestUnit = u;
      }
    }
  }

  const scaled = valueInBase / bestUnit.factorToBase;
  return `${formatSignificantFigures(scaled, sigFigs)} ${bestUnit.symbol}`;
}
