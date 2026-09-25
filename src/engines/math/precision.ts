/**
 * Engineering Numbers, Precision & Radix Calculations Engine
 * 
 * Implements:
 * 1. Scientific Notation Calculator
 * 2. Engineering Notation Calculator (exponents multiple of 3)
 * 3. Significant Figures Calculator & Rules Engine
 * 4. Percentage Difference Calculator (|A - B| / ((A + B)/2) * 100%)
 * 5. Percentage Error Calculator ((experimental - theoretical) / theoretical * 100%)
 * 6. Ratio & Proportion Calculator (A:B = C:D, reduction, scaling)
 * 7. Engineering Prefix Converter (Yotta to Yocto with exact powers of 10)
 * 8. Rounding & Precision Engine (Decimal places, sig figs, floor, ceil, half-up, half-to-even)
 */

import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';

export interface ScientificNotationResult {
  coefficient: number;
  exponent: number;
  formatted: string;
  latex: string;
  plainText: string;
}

export function toScientificNotation(val: number, sigFigs = 4): ScientificNotationResult {
  if (isNaN(val) || !isFinite(val)) {
    return {
      coefficient: NaN,
      exponent: 0,
      formatted: 'NaN',
      latex: '\\text{NaN}',
      plainText: 'NaN',
    };
  }

  if (val === 0) {
    const zeroCoeff = (0).toFixed(Math.max(0, sigFigs - 1));
    return {
      coefficient: 0,
      exponent: 0,
      formatted: `${zeroCoeff} × 10⁰`,
      latex: `${zeroCoeff} \\times 10^{0}`,
      plainText: `${zeroCoeff}e+0`,
    };
  }

  const sign = val < 0 ? -1 : 1;
  const absVal = Math.abs(val);
  const exponent = Math.floor(Math.log10(absVal));
  const rawCoeff = sign * (absVal / Math.pow(10, exponent));

  const safeSigFigs = Math.max(1, Math.min(15, sigFigs));
  const precisionFactor = Math.pow(10, safeSigFigs - 1);
  const roundedCoeff = Math.round(rawCoeff * precisionFactor) / precisionFactor;

  // Handle rounding rollover (e.g., 9.999 rounded to 10.00)
  let finalCoeff = roundedCoeff;
  let finalExp = exponent;
  if (Math.abs(finalCoeff) >= 10) {
    finalCoeff /= 10;
    finalExp += 1;
  }

  const coeffStr = finalCoeff.toFixed(safeSigFigs - 1);
  const superscriptExp = toSuperscript(finalExp);

  return {
    coefficient: finalCoeff,
    exponent: finalExp,
    formatted: `${coeffStr} × 10${superscriptExp}`,
    latex: `${coeffStr} \\times 10^{${finalExp}}`,
    plainText: `${coeffStr}e${finalExp >= 0 ? '+' : ''}${finalExp}`,
  };
}

export interface EngineeringNotationResult {
  coefficient: number;
  exponent: number;
  prefix: string;
  prefixSymbol: string;
  formatted: string;
  latex: string;
  plainText: string;
}

export const SI_PREFIX_MAP: Record<number, { name: string; symbol: string }> = {
  24: { name: 'yotta', symbol: 'Y' },
  21: { name: 'zetta', symbol: 'Z' },
  18: { name: 'exa', symbol: 'E' },
  15: { name: 'peta', symbol: 'P' },
  12: { name: 'tera', symbol: 'T' },
  9: { name: 'giga', symbol: 'G' },
  6: { name: 'mega', symbol: 'M' },
  3: { name: 'kilo', symbol: 'k' },
  0: { name: '', symbol: '' },
  [-3]: { name: 'milli', symbol: 'm' },
  [-6]: { name: 'micro', symbol: 'µ' },
  [-9]: { name: 'nano', symbol: 'n' },
  [-12]: { name: 'pico', symbol: 'p' },
  [-15]: { name: 'femto', symbol: 'f' },
  [-18]: { name: 'atto', symbol: 'a' },
  [-21]: { name: 'zepto', symbol: 'z' },
  [-24]: { name: 'yocto', symbol: 'y' },
};

export function toEngineeringNotation(val: number, sigFigs = 4): EngineeringNotationResult {
  if (isNaN(val) || !isFinite(val)) {
    return {
      coefficient: NaN,
      exponent: 0,
      prefix: '',
      prefixSymbol: '',
      formatted: 'NaN',
      latex: '\\text{NaN}',
      plainText: 'NaN',
    };
  }

  if (val === 0) {
    return {
      coefficient: 0,
      exponent: 0,
      prefix: '',
      prefixSymbol: '',
      formatted: '0.000 × 10⁰',
      latex: '0.000 \\times 10^{0}',
      plainText: '0.000e+0',
    };
  }

  const sign = val < 0 ? -1 : 1;
  const absVal = Math.abs(val);
  const rawExp = Math.floor(Math.log10(absVal));
  const engExp = Math.floor(rawExp / 3) * 3;
  const rawCoeff = sign * (absVal / Math.pow(10, engExp));

  // Round coefficient preserving sigFigs
  const safeSigFigs = Math.max(1, Math.min(15, sigFigs));
  const roundedCoeff = parseFloat(rawCoeff.toPrecision(safeSigFigs));

  let finalCoeff = roundedCoeff;
  let finalExp = engExp;

  if (Math.abs(finalCoeff) >= 1000) {
    finalCoeff /= 1000;
    finalExp += 3;
  }

  const prefixInfo = SI_PREFIX_MAP[finalExp] || { name: `10^${finalExp}`, symbol: `·10^${finalExp}` };
  const superscriptExp = toSuperscript(finalExp);

  return {
    coefficient: finalCoeff,
    exponent: finalExp,
    prefix: prefixInfo.name,
    prefixSymbol: prefixInfo.symbol,
    formatted: `${finalCoeff} × 10${superscriptExp}${prefixInfo.symbol ? ` (${prefixInfo.symbol})` : ''}`,
    latex: `${finalCoeff} \\times 10^{${finalExp}}`,
    plainText: `${finalCoeff}e${finalExp >= 0 ? '+' : ''}${finalExp}`,
  };
}

export interface SigFigsResult {
  significantDigitsCount: number;
  digitsString: string;
  rulesApplied: string[];
  scientificNotation: string;
  isExact: boolean;
}

export function countSignificantFigures(inputStr: string | number): SigFigsResult {
  const str = String(inputStr).trim().toLowerCase();
  const rules: string[] = [];

  if (!str || str === 'nan' || str === 'infinity') {
    return {
      significantDigitsCount: 0,
      digitsString: '',
      rulesApplied: ['Invalid numerical input'],
      scientificNotation: 'NaN',
      isExact: false,
    };
  }

  // Handle scientific notation input like 1.23e-4
  let baseStr = str;
  let expVal = 0;
  if (str.includes('e')) {
    const parts = str.split('e');
    baseStr = parts[0];
    expVal = parseInt(parts[1], 10) || 0;
    rules.push('Separated scientific exponential component from mantissa');
  }

  // Remove leading negative/positive signs
  const cleaned = baseStr.replace(/^[+-]/, '');
  const hasDecimal = cleaned.includes('.');

  let digitsCount = 0;
  let significantDigits = '';

  if (hasDecimal) {
    rules.push('Decimal point present: all non-zero digits and trailing zeros are significant');
    // Remove leading zeros before first non-zero digit
    const parts = cleaned.split('.');
    const integerPart = parts[0];
    const fractionalPart = parts[1];

    const joined = integerPart + fractionalPart;
    // Find first non-zero digit
    const firstNonZero = joined.search(/[1-9]/);
    if (firstNonZero === -1) {
      // Input is 0.000...
      digitsCount = fractionalPart.length;
      significantDigits = '0'.repeat(digitsCount);
      rules.push('All zeros after decimal point are considered significant');
    } else {
      significantDigits = joined.slice(firstNonZero);
      digitsCount = significantDigits.length;
      rules.push('Leading zeros preceding the first non-zero digit are non-significant placeholders');
    }
  } else {
    // Integer without decimal point
    rules.push('No decimal point: non-zero digits and captive zeros between non-zeros are significant');
    const firstNonZero = cleaned.search(/[1-9]/);
    if (firstNonZero === -1) {
      digitsCount = 1;
      significantDigits = '0';
      rules.push('Single zero integer has 1 significant figure');
    } else {
      const trailingZerosMatch = cleaned.match(/0+$/);
      if (trailingZerosMatch) {
        rules.push('Trailing zeros without a decimal point are ambiguous/non-significant placeholders per standard convention');
        significantDigits = cleaned.slice(firstNonZero, cleaned.length - trailingZerosMatch[0].length);
      } else {
        significantDigits = cleaned.slice(firstNonZero);
      }
      digitsCount = significantDigits.length;
    }
  }

  const numVal = parseFloat(str);
  const sci = toScientificNotation(numVal, Math.max(1, digitsCount));

  return {
    significantDigitsCount: digitsCount,
    digitsString: significantDigits,
    rulesApplied: rules,
    scientificNotation: sci.formatted,
    isExact: false,
  };
}

export function roundToSignificantFigures(val: number, sigFigs: number): number {
  if (val === 0 || isNaN(val) || !isFinite(val) || sigFigs <= 0) return val;
  const factor = Math.pow(10, sigFigs - Math.ceil(Math.log10(Math.abs(val))));
  return Math.round(val * factor) / factor;
}

export interface PercentageDiffResult {
  valA: number;
  valB: number;
  absoluteDiff: number;
  average: number;
  percentDiff: number;
  formatted: string;
  steps: CalculationStep[];
}

export function calculatePercentageDifference(valA: number, valB: number): PercentageDiffResult {
  const steps: CalculationStep[] = [];
  const absDiff = Math.abs(valA - valB);
  const avg = (Math.abs(valA) + Math.abs(valB)) / 2;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Absolute Difference |A − B|',
    formula: '\\Delta = |A - B|',
    substitution: `|${valA} - ${valB}|`,
    result: `${absDiff}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Average Value (|A| + |B|) / 2',
    formula: '\\bar{V} = \\frac{|A| + |B|}{2}',
    substitution: `(${Math.abs(valA)} + ${Math.abs(valB)}) / 2`,
    result: `${avg}`,
  });

  const percentDiff = avg === 0 ? 0 : (absDiff / avg) * 100;

  steps.push({
    stepNumber: 3,
    title: 'Calculate Percentage Difference',
    formula: '\\%\\text{Diff} = \\frac{|A - B|}{\\bar{V}} \\times 100\\%',
    substitution: `(${absDiff} / ${avg}) \\times 100`,
    result: `${percentDiff.toFixed(3)}%`,
  });

  return {
    valA,
    valB,
    absoluteDiff: absDiff,
    average: avg,
    percentDiff,
    formatted: `${percentDiff.toFixed(3)}%`,
    steps,
  };
}

export interface PercentageErrorResult {
  experimental: number;
  theoretical: number;
  absoluteError: number;
  relativeError: number;
  percentError: number;
  isOverestimate: boolean;
  formatted: string;
  steps: CalculationStep[];
}

export function calculatePercentageError(experimental: number, theoretical: number): PercentageErrorResult {
  const steps: CalculationStep[] = [];
  const error = experimental - theoretical;
  const absError = Math.abs(error);

  steps.push({
    stepNumber: 1,
    title: 'Compute Absolute Error (V_exp − V_theo)',
    formula: '\\Delta V = V_{\\text{exp}} - V_{\\text{theo}}',
    substitution: `${experimental} - ${theoretical}`,
    result: `${error >= 0 ? '+' : ''}${error.toFixed(4)}`,
  });

  if (theoretical === 0) {
    return {
      experimental,
      theoretical,
      absoluteError: absError,
      relativeError: Infinity,
      percentError: Infinity,
      isOverestimate: experimental > 0,
      formatted: 'Undefined (Theoretical value is zero)',
      steps,
    };
  }

  const relError = absError / Math.abs(theoretical);
  const pctError = (error / Math.abs(theoretical)) * 100;

  steps.push({
    stepNumber: 2,
    title: 'Calculate Percentage Error Relative to Theoretical Baseline',
    formula: '\\%\\text{Error} = \\frac{V_{\\text{exp}} - V_{\\text{theo}}}{|V_{\\text{theo}}|} \\times 100\\%',
    substitution: `(${error.toFixed(4)} / ${Math.abs(theoretical)}) \\times 100`,
    result: `${pctError >= 0 ? '+' : ''}${pctError.toFixed(3)}%`,
  });

  return {
    experimental,
    theoretical,
    absoluteError: absError,
    relativeError: relError,
    percentError: pctError,
    isOverestimate: experimental > theoretical,
    formatted: `${pctError >= 0 ? '+' : ''}${pctError.toFixed(3)}%`,
    steps,
  };
}

export interface RatioProportionInputs {
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  scalingFactor?: number;
}

export interface RatioProportionResult {
  solvedVariable: 'a' | 'b' | 'c' | 'd' | 'none';
  solvedValue: number | null;
  reducedRatio: [number, number];
  ratioDecimal: number;
  scaledRatio?: [number, number];
  steps: CalculationStep[];
}

export function calculateRatioAndProportion(inputs: RatioProportionInputs): RatioProportionResult {
  const { a, b, c, d, scalingFactor } = inputs;
  const steps: CalculationStep[] = [];

  let solvedVariable: 'a' | 'b' | 'c' | 'd' | 'none' = 'none';
  let solvedValue: number | null = null;

  // Check which one is missing in A/B = C/D
  if (a === undefined && b !== undefined && c !== undefined && d !== undefined) {
    if (d === 0) throw new Error('Denominator D cannot be zero in proportion A/B = C/D');
    solvedVariable = 'a';
    solvedValue = (b * c) / d;
    steps.push({
      stepNumber: 1,
      title: 'Cross-multiply to isolate A',
      formula: 'A = \\frac{B \\cdot C}{D}',
      substitution: `(${b} \\cdot ${c}) / ${d}`,
      result: `${solvedValue}`,
    });
  } else if (b === undefined && a !== undefined && c !== undefined && d !== undefined) {
    if (c === 0) throw new Error('C cannot be zero when solving for denominator B');
    solvedVariable = 'b';
    solvedValue = (a * d) / c;
    steps.push({
      stepNumber: 1,
      title: 'Cross-multiply to isolate B',
      formula: 'B = \\frac{A \\cdot D}{C}',
      substitution: `(${a} \\cdot ${d}) / ${c}`,
      result: `${solvedValue}`,
    });
  } else if (c === undefined && a !== undefined && b !== undefined && d !== undefined) {
    if (b === 0) throw new Error('Denominator B cannot be zero');
    solvedVariable = 'c';
    solvedValue = (a * d) / b;
    steps.push({
      stepNumber: 1,
      title: 'Cross-multiply to isolate C',
      formula: 'C = \\frac{A \\cdot D}{B}',
      substitution: `(${a} \\cdot ${d}) / ${b}`,
      result: `${solvedValue}`,
    });
  } else if (d === undefined && a !== undefined && b !== undefined && c !== undefined) {
    if (a === 0) throw new Error('A cannot be zero when solving for denominator D');
    solvedVariable = 'd';
    solvedValue = (b * c) / a;
    steps.push({
      stepNumber: 1,
      title: 'Cross-multiply to isolate D',
      formula: 'D = \\frac{B \\cdot C}{A}',
      substitution: `(${b} \\cdot ${c}) / ${a}`,
      result: `${solvedValue}`,
    });
  }

  // Base ratio A : B
  const numA = (a !== undefined ? a : solvedValue) ?? 1;
  const numB = (b !== undefined ? b : solvedValue) ?? 1;

  const gcdVal = gcd(Math.round(numA * 1000), Math.round(numB * 1000));
  const reducedA = Math.round((numA * 1000) / gcdVal);
  const reducedB = Math.round((numB * 1000) / gcdVal);

  const ratioDecimal = numB !== 0 ? numA / numB : NaN;

  let scaledRatio: [number, number] | undefined;
  if (scalingFactor !== undefined && scalingFactor > 0) {
    scaledRatio = [numA * scalingFactor, numB * scalingFactor];
    steps.push({
      stepNumber: steps.length + 1,
      title: 'Apply Scaling Factor',
      formula: 'Scaled = (A \\cdot k) : (B \\cdot k)',
      substitution: `(${numA} \\cdot ${scalingFactor}) : (${numB} \\cdot ${scalingFactor})`,
      result: `${scaledRatio[0]} : ${scaledRatio[1]}`,
    });
  }

  return {
    solvedVariable,
    solvedValue,
    reducedRatio: [reducedA, reducedB],
    ratioDecimal,
    scaledRatio,
    steps,
  };
}

export function convertEngineeringPrefix(value: number, fromExp: number, toExp: number): {
  convertedValue: number;
  multiplier: number;
  fromSymbol: string;
  toSymbol: string;
  formatted: string;
} {
  const diffExp = fromExp - toExp;
  const multiplier = Math.pow(10, diffExp);
  const convertedValue = value * multiplier;

  const fromInfo = SI_PREFIX_MAP[fromExp] || { symbol: `10^${fromExp}` };
  const toInfo = SI_PREFIX_MAP[toExp] || { symbol: `10^${toExp}` };

  return {
    convertedValue,
    multiplier,
    fromSymbol: fromInfo.symbol,
    toSymbol: toInfo.symbol,
    formatted: `${value} ${fromInfo.symbol} = ${convertedValue} ${toInfo.symbol}`,
  };
}

export type RoundingMethod =
  | 'decimal_places'
  | 'significant_figures'
  | 'floor'
  | 'ceil'
  | 'round_half_up'
  | 'round_half_even'; // Banker's rounding

export function roundPrecision(val: number, method: RoundingMethod, precision: number): {
  result: number;
  formatted: string;
  explanation: string;
} {
  if (isNaN(val) || !isFinite(val)) {
    return { result: NaN, formatted: 'NaN', explanation: 'Value is not finite' };
  }

  let result = val;
  let explanation = '';

  switch (method) {
    case 'decimal_places': {
      const p = Math.max(0, Math.min(15, Math.floor(precision)));
      const factor = Math.pow(10, p);
      result = Math.round(val * factor) / factor;
      explanation = `Rounded to ${p} decimal places using standard arithmetic rounding.`;
      break;
    }
    case 'significant_figures': {
      const s = Math.max(1, Math.min(15, Math.floor(precision)));
      result = roundToSignificantFigures(val, s);
      explanation = `Rounded to ${s} significant figures.`;
      break;
    }
    case 'floor': {
      const p = Math.max(0, Math.min(15, Math.floor(precision)));
      const factor = Math.pow(10, p);
      result = Math.floor(val * factor) / factor;
      explanation = `Truncated downwards (floor) at ${p} decimal places.`;
      break;
    }
    case 'ceil': {
      const p = Math.max(0, Math.min(15, Math.floor(precision)));
      const factor = Math.pow(10, p);
      result = Math.ceil(val * factor) / factor;
      explanation = `Rounded upwards (ceiling) at ${p} decimal places.`;
      break;
    }
    case 'round_half_up': {
      const p = Math.max(0, Math.min(15, Math.floor(precision)));
      const factor = Math.pow(10, p);
      result = Math.floor(val * factor + 0.5) / factor;
      explanation = `Half-up rounding (ties broken toward +∞) to ${p} decimal places.`;
      break;
    }
    case 'round_half_even': {
      // Banker's Rounding: round to nearest even digit on exact 0.5 ties
      const p = Math.max(0, Math.min(15, Math.floor(precision)));
      const factor = Math.pow(10, p);
      const scaled = val * factor;
      const floorVal = Math.floor(scaled);
      const diff = scaled - floorVal;

      if (Math.abs(diff - 0.5) < 1e-12) {
        result = (floorVal % 2 === 0 ? floorVal : floorVal + 1) / factor;
      } else {
        result = Math.round(scaled) / factor;
      }
      explanation = `Banker's rounding (round half to even) prevents statistical upward drift over repeated sums.`;
      break;
    }
  }

  return {
    result,
    formatted: String(result),
    explanation,
  };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function toSuperscript(num: number): string {
  const superscripts: Record<string, string> = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return String(num)
    .split('')
    .map((c) => superscripts[c] || c)
    .join('');
}
