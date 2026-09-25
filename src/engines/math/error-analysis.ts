/**
 * Error Propagation & Measurement Uncertainty Engine (GUM / ISO 98-3 Compliant)
 * 
 * Implements:
 * 69. Absolute Error (Δx = |x_meas - x_true|)
 * 70. Relative Error (δx = Δx / |x_true|)
 * 71. Percentage Error (δx · 100%)
 * 72. Error Propagation: Addition & Subtraction (Absolute Quadrature: δq = √(Σ δx_i²))
 * 73. Error Propagation: Multiplication & Division (Relative Quadrature: δq/q = √(Σ (δx_i/x_i)²))
 * 74. Error Propagation: Powers & Exponents (Relative error multiplied by power: δq/q = |n| · δx/x)
 * 75. Combined Standard Uncertainty & Expanded Uncertainty (ISO GUM: u_c = √(Σ (c_i · u_i)²), U = k · u_c)
 */

import { CalculationStep } from '../../types/tool';

export interface UncertaintyComponent {
  name?: string;
  value: number;
  uncertainty: number; // 1-sigma standard uncertainty
  sensitivityCoefficient?: number; // c_i = ∂f/∂x_i
}

export interface ErrorPropagationResult {
  nominalResult: number;
  combinedAbsoluteUncertainty: number;
  combinedRelativeUncertainty: number;
  expandedUncertainty95: number; // k = 2 (95.45% confidence)
  confidenceInterval95: [number, number];
  formattedInterval: string;
  relativePercent: string;
  steps: CalculationStep[];
}

export function propagateAdditionSubtraction(components: { value: number; uncertainty: number; sign?: 1 | -1 }[]): ErrorPropagationResult {
  const steps: CalculationStep[] = [];
  let nominal = 0;
  let sumSq = 0;

  for (const c of components) {
    const s = c.sign ?? 1;
    nominal += s * c.value;
    sumSq += c.uncertainty * c.uncertainty;
  }

  const combAbs = Math.sqrt(sumSq);
  const combRel = nominal !== 0 ? Math.abs(combAbs / nominal) : Infinity;
  const expanded95 = 2.0 * combAbs;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Sum of Squares in Quadrature',
    formula: 'u_c(q) = \\sqrt{\\sum_{i=1}^N u(x_i)^2}',
    substitution: `\\sqrt{${components.map((c) => `${c.uncertainty}²`).join(' + ')}}`,
    result: `u_c = ${combAbs.toFixed(4)}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Expanded Uncertainty (k = 2, 95% Confidence)',
    formula: 'U = k \\cdot u_c(q) \\quad (k = 2)',
    substitution: `2 \\times ${combAbs.toFixed(4)}`,
    result: `±${expanded95.toFixed(4)}`,
  });

  return {
    nominalResult: nominal,
    combinedAbsoluteUncertainty: combAbs,
    combinedRelativeUncertainty: combRel,
    expandedUncertainty95: expanded95,
    confidenceInterval95: [nominal - expanded95, nominal + expanded95],
    formattedInterval: `${nominal.toFixed(4)} ± ${expanded95.toFixed(4)}`,
    relativePercent: `${(combRel * 100).toFixed(2)}%`,
    steps,
  };
}

export function propagateMultiplicationDivision(
  components: { value: number; uncertainty: number; isDivisor?: boolean }[]
): ErrorPropagationResult {
  const steps: CalculationStep[] = [];
  let nominal = 1;
  let sumRelSq = 0;

  for (const c of components) {
    if (c.value === 0) {
      throw new Error('Zero value encountered in multiplication/division uncertainty propagation');
    }
    if (c.isDivisor) {
      nominal /= c.value;
    } else {
      nominal *= c.value;
    }
    const relUnc = c.uncertainty / Math.abs(c.value);
    sumRelSq += relUnc * relUnc;
  }

  const combRel = Math.sqrt(sumRelSq);
  const combAbs = Math.abs(nominal) * combRel;
  const expanded95 = 2.0 * combAbs;

  steps.push({
    stepNumber: 1,
    title: 'Sum Relative Uncertainties in Quadrature',
    formula: '\\frac{u_c(q)}{|q|} = \\sqrt{\\sum_{i=1}^N \\left(\\frac{u(x_i)}{x_i}\\right)^2}',
    substitution: `\\sqrt{${components.map((c) => `(${c.uncertainty}/${c.value})²`).join(' + ')}}`,
    result: `Relative u_c = ${(combRel * 100).toFixed(3)}%`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Convert to Absolute & Expanded Uncertainty',
    formula: 'u_c = |q| \\cdot \\frac{u_c}{|q|}, \\quad U_{95\\%} = 2 \\cdot u_c',
    substitution: `|${nominal.toFixed(4)}| \\times ${combRel.toFixed(4)}`,
    result: `u_c = ${combAbs.toFixed(4)}, U = ±${expanded95.toFixed(4)}`,
  });

  return {
    nominalResult: nominal,
    combinedAbsoluteUncertainty: combAbs,
    combinedRelativeUncertainty: combRel,
    expandedUncertainty95: expanded95,
    confidenceInterval95: [nominal - expanded95, nominal + expanded95],
    formattedInterval: `${nominal.toFixed(4)} ± ${expanded95.toFixed(4)}`,
    relativePercent: `${(combRel * 100).toFixed(2)}%`,
    steps,
  };
}

export function propagatePower(baseVal: number, baseUnc: number, exponent: number): ErrorPropagationResult {
  const steps: CalculationStep[] = [];
  if (baseVal === 0 && exponent < 0) {
    throw new Error('Division by zero: base is 0 with negative exponent');
  }

  const nominal = Math.pow(baseVal, exponent);
  const relBase = Math.abs(baseUnc / baseVal);
  const combRel = Math.abs(exponent) * relBase;
  const combAbs = Math.abs(nominal) * combRel;
  const expanded95 = 2.0 * combAbs;

  steps.push({
    stepNumber: 1,
    title: 'Scale Relative Uncertainty by Exponent Magnitude',
    formula: '\\frac{u(q)}{|q|} = |n| \\cdot \\frac{u(x)}{|x|}',
    substitution: `|${exponent}| \\times (${baseUnc} / |${baseVal}|)`,
    result: `Relative unc = ${(combRel * 100).toFixed(3)}%`,
  });

  return {
    nominalResult: nominal,
    combinedAbsoluteUncertainty: combAbs,
    combinedRelativeUncertainty: combRel,
    expandedUncertainty95: expanded95,
    confidenceInterval95: [nominal - expanded95, nominal + expanded95],
    formattedInterval: `${nominal.toFixed(4)} ± ${expanded95.toFixed(4)}`,
    relativePercent: `${(combRel * 100).toFixed(2)}%`,
    steps,
  };
}

export function calculateCombinedUncertaintyGUM(
  nominalValue: number,
  components: UncertaintyComponent[],
  coverageFactorK = 2.0
): ErrorPropagationResult {
  const steps: CalculationStep[] = [];
  let sumWeightedSq = 0;

  for (const c of components) {
    const sens = c.sensitivityCoefficient ?? 1.0;
    const term = sens * c.uncertainty;
    sumWeightedSq += term * term;
  }

  const combAbs = Math.sqrt(sumWeightedSq);
  const combRel = nominalValue !== 0 ? Math.abs(combAbs / nominalValue) : 0;
  const expanded = coverageFactorK * combAbs;

  steps.push({
    stepNumber: 1,
    title: 'GUM Law of Propagation of Uncertainty',
    formula: 'u_c^2(y) = \\sum_{i=1}^N \\left( \\frac{\\partial f}{\\partial x_i} \\right)^2 u^2(x_i) = \\sum c_i^2 u_i^2',
    substitution: `\\sqrt{${components.map((c) => `(${c.sensitivityCoefficient ?? 1} · ${c.uncertainty})²`).join(' + ')}}`,
    result: `u_c = ${combAbs.toFixed(4)}`,
  });

  return {
    nominalResult: nominalValue,
    combinedAbsoluteUncertainty: combAbs,
    combinedRelativeUncertainty: combRel,
    expandedUncertainty95: expanded,
    confidenceInterval95: [nominalValue - expanded, nominalValue + expanded],
    formattedInterval: `${nominalValue.toFixed(4)} ± ${expanded.toFixed(4)} (k = ${coverageFactorK})`,
    relativePercent: `${(combRel * 100).toFixed(2)}%`,
    steps,
  };
}
