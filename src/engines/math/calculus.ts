/**
 * Numerical Calculus & Quadrature Engine
 * 
 * Implements:
 * 37. Numerical Derivative (Forward difference O(h), Backward difference O(h))
 * 38. Central Difference Derivative (Second-order O(h²))
 * 39. Numerical Integration (Midpoint rule)
 * 40. Trapezoidal Rule Integration (Composite Trapezoidal O(h²))
 * 41. Simpson's Rule Integration (Composite Simpson's 1/3 Rule O(h⁴))
 * 42. Numerical Second Derivative (Central second difference O(h²))
 * 
 * Note: Clearly distinguishes numerical discrete approximations from exact analytical closed-form derivatives.
 */

import { CalculationStep } from '../../types/tool';

export type MathFunction = (x: number) => number;

export interface DerivativeResult {
  derivative: number;
  stepSizeH: number;
  method: 'forward' | 'backward' | 'central';
  truncationErrorOrder: 'O(h)' | 'O(h^2)';
  formula: string;
  pointsEvaluated: { x: number; fx: number }[];
  steps: CalculationStep[];
}

export function numericalDerivative(
  f: MathFunction,
  x: number,
  h = 1e-5,
  method: 'forward' | 'backward' | 'central' = 'central'
): DerivativeResult {
  if (h <= 0) {
    throw new Error('Numerical step size h must be strictly positive');
  }

  const steps: CalculationStep[] = [];
  let derivative = 0;
  let formula = '';
  let truncationErrorOrder: 'O(h)' | 'O(h^2)' = 'O(h^2)';
  const pointsEvaluated: { x: number; fx: number }[] = [];

  const fx = f(x);
  pointsEvaluated.push({ x, fx });

  if (method === 'forward') {
    const fxh = f(x + h);
    pointsEvaluated.push({ x: x + h, fx: fxh });
    derivative = (fxh - fx) / h;
    formula = "f'(x) \\approx \\frac{f(x + h) - f(x)}{h}";
    truncationErrorOrder = 'O(h)';
    steps.push({
      stepNumber: 1,
      title: 'Forward Finite Difference Approximation',
      formula,
      substitution: `(${fxh.toFixed(6)} - ${fx.toFixed(6)}) / ${h}`,
      result: `${derivative.toFixed(6)}`,
      annotation: 'First-order truncation error ~ (h/2)·f\'\'(ξ)',
    });
  } else if (method === 'backward') {
    const fx_minus_h = f(x - h);
    pointsEvaluated.push({ x: x - h, fx: fx_minus_h });
    derivative = (fx - fx_minus_h) / h;
    formula = "f'(x) \\approx \\frac{f(x) - f(x - h)}{h}";
    truncationErrorOrder = 'O(h)';
    steps.push({
      stepNumber: 1,
      title: 'Backward Finite Difference Approximation',
      formula,
      substitution: `(${fx.toFixed(6)} - ${fx_minus_h.toFixed(6)}) / ${h}`,
      result: `${derivative.toFixed(6)}`,
      annotation: 'First-order truncation error ~ -(h/2)·f\'\'(ξ)',
    });
  } else {
    // Central Difference: f'(x) ≈ (f(x + h) - f(x - h)) / (2h)
    const fxh = f(x + h);
    const fx_minus_h = f(x - h);
    pointsEvaluated.push({ x: x + h, fx: fxh }, { x: x - h, fx: fx_minus_h });
    derivative = (fxh - fx_minus_h) / (2 * h);
    formula = "f'(x) \\approx \\frac{f(x + h) - f(x - h)}{2h}";
    truncationErrorOrder = 'O(h^2)';
    steps.push({
      stepNumber: 1,
      title: 'Central Finite Difference Approximation',
      formula,
      substitution: `(${fxh.toFixed(6)} - ${fx_minus_h.toFixed(6)}) / (2 · ${h})`,
      result: `${derivative.toFixed(6)}`,
      annotation: 'Second-order symmetric cancellation of odd Taylor series terms yields O(h²) error',
    });
  }

  return {
    derivative,
    stepSizeH: h,
    method,
    truncationErrorOrder,
    formula,
    pointsEvaluated,
    steps,
  };
}

export interface SecondDerivativeResult {
  secondDerivative: number;
  stepSizeH: number;
  formula: string;
  truncationErrorOrder: 'O(h^2)';
  steps: CalculationStep[];
}

export function numericalSecondDerivative(f: MathFunction, x: number, h = 1e-4): SecondDerivativeResult {
  if (h <= 0) {
    throw new Error('Numerical step size h must be strictly positive');
  }

  const fxh = f(x + h);
  const fx = f(x);
  const fx_minus_h = f(x - h);

  // Central 2nd derivative: (f(x + h) - 2f(x) + f(x - h)) / h^2
  const secondDerivative = (fxh - 2 * fx + fx_minus_h) / (h * h);

  const steps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Central Second Difference Derivative Formula',
      formula: "f''(x) \\approx \\frac{f(x + h) - 2f(x) + f(x - h)}{h^2}",
      substitution: `(${fxh.toFixed(6)} - 2·(${fx.toFixed(6)}) + ${fx_minus_h.toFixed(6)}) / (${h}²)`,
      result: `${secondDerivative.toFixed(6)}`,
      annotation: 'Second-order symmetric approximation with error order O(h²)',
    },
  ];

  return {
    secondDerivative,
    stepSizeH: h,
    formula: "f''(x) \\approx \\frac{f(x + h) - 2f(x) + f(x - h)}{h^2}",
    truncationErrorOrder: 'O(h^2)',
    steps,
  };
}

export interface IntegrationResult {
  integral: number;
  method: 'midpoint' | 'trapezoidal' | 'simpson';
  lowerBoundA: number;
  upperBoundB: number;
  intervalsN: number;
  stepSizeH: number;
  estimatedOrder: string;
  steps: CalculationStep[];
}

export function trapezoidalIntegration(f: MathFunction, a: number, b: number, n: number): number {
  if (n <= 0) throw new Error('Number of intervals n must be at least 1');
  if (a === b) return 0;

  const h = (b - a) / n;
  let sum = 0.5 * (f(a) + f(b));
  for (let i = 1; i < n; i++) {
    sum += f(a + i * h);
  }
  return sum * h;
}

export function simpsonsRule(f: MathFunction, a: number, b: number, n: number): number {
  if (n <= 0) throw new Error('Number of intervals n must be at least 2');
  if (n % 2 !== 0) {
    n = n + 1; // Simpson's 1/3 rule requires an even number of intervals
  }
  if (a === b) return 0;

  const h = (b - a) / n;
  let sum = f(a) + f(b);

  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    sum += (i % 2 === 0 ? 2 : 4) * f(x);
  }
  return (sum * h) / 3;
}

export function numericalIntegration(
  f: MathFunction,
  a: number,
  b: number,
  intervals = 100,
  method: 'midpoint' | 'trapezoidal' | 'simpson' = 'simpson'
): IntegrationResult {
  const n = Math.max(2, Math.floor(intervals));
  const h = (b - a) / n;
  const steps: CalculationStep[] = [];
  let integral = 0;
  let estimatedOrder = 'O(h^2)';

  if (method === 'midpoint') {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const mid = a + (i + 0.5) * h;
      sum += f(mid);
    }
    integral = sum * h;
    estimatedOrder = 'O(h^2)';
    steps.push({
      stepNumber: 1,
      title: 'Composite Midpoint Quadrature',
      formula: 'I \\approx h \\sum_{i=0}^{n-1} f\\left(a + (i + 0.5)h\\right)',
      substitution: `h = (${b} - ${a}) / ${n} = ${h.toFixed(6)}, evaluated over ${n} midpoints`,
      result: `${integral.toFixed(6)}`,
    });
  } else if (method === 'trapezoidal') {
    integral = trapezoidalIntegration(f, a, b, n);
    estimatedOrder = 'O(h^2)';
    steps.push({
      stepNumber: 1,
      title: 'Composite Trapezoidal Rule',
      formula: 'I \\approx \\frac{h}{2} \\left[ f(a) + 2\\sum_{i=1}^{n-1} f(x_i) + f(b) \\right]',
      substitution: `Step size h = ${h.toFixed(6)}, ${n} panels`,
      result: `${integral.toFixed(6)}`,
    });
  } else {
    // Simpson's 1/3 Rule
    const actualN = n % 2 === 0 ? n : n + 1;
    integral = simpsonsRule(f, a, b, actualN);
    estimatedOrder = 'O(h^4)';
    steps.push({
      stepNumber: 1,
      title: "Composite Simpson's 1/3 Parabolic Quadrature",
      formula: 'I \\approx \\frac{h}{3} \\left[ f(a) + 4\\sum_{i=1,3,\\dots}^{n-1} f(x_i) + 2\\sum_{i=2,4,\\dots}^{n-2} f(x_i) + f(b) \\right]',
      substitution: `Even interval count n = ${actualN}, h = ${((b - a) / actualN).toFixed(6)}`,
      result: `${integral.toFixed(6)}`,
      annotation: 'Parabolic 3-point interpolants yield 4th-order truncation error ~ O(h⁴)',
    });
  }

  return {
    integral,
    method,
    lowerBoundA: a,
    upperBoundB: b,
    intervalsN: n,
    stepSizeH: h,
    estimatedOrder,
    steps,
  };
}
