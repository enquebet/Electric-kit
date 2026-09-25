/**
 * Interpolation & Extrapolation Analysis Engine
 * 
 * Implements:
 * 48. Linear Interpolation (Pairwise segment interpolation)
 * 49. Polynomial Interpolation (Lagrange polynomial & Newton basis)
 * 50. Extrapolation Warning & Domain Boundary Analyzer
 * 
 * Note: Clearly distinguishes safe interior interpolation from potentially hazardous exterior extrapolation.
 */

import { CalculationStep, EngineeringWarning } from '../../types/tool';

export interface DataPoint {
  x: number;
  y: number;
}

export interface ExtrapolationReport {
  isExtrapolated: boolean;
  targetX: number;
  minX: number;
  maxX: number;
  distanceFromBoundary: number;
  direction: 'inside' | 'below_minimum' | 'above_maximum';
  severity: 'none' | 'warning' | 'danger';
  warningMessage?: string;
}

export function analyzeExtrapolation(points: DataPoint[], targetX: number): ExtrapolationReport {
  if (points.length === 0) {
    return {
      isExtrapolated: false,
      targetX,
      minX: 0,
      maxX: 0,
      distanceFromBoundary: 0,
      direction: 'inside',
      severity: 'none',
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
  }

  const span = maxX - minX;

  if (targetX < minX) {
    const dist = minX - targetX;
    const severity = span > 0 && dist / span > 0.5 ? 'danger' : 'warning';
    return {
      isExtrapolated: true,
      targetX,
      minX,
      maxX,
      distanceFromBoundary: dist,
      direction: 'below_minimum',
      severity,
      warningMessage: `Extrapolation Warning: target x = ${targetX} lies below known sample minimum ${minX}. High risk of model error.`,
    };
  }

  if (targetX > maxX) {
    const dist = targetX - maxX;
    const severity = span > 0 && dist / span > 0.5 ? 'danger' : 'warning';
    return {
      isExtrapolated: true,
      targetX,
      minX,
      maxX,
      distanceFromBoundary: dist,
      direction: 'above_maximum',
      severity,
      warningMessage: `Extrapolation Warning: target x = ${targetX} exceeds known sample maximum ${maxX}. Polynomial Runge oscillations or trend diversion may occur.`,
    };
  }

  return {
    isExtrapolated: false,
    targetX,
    minX,
    maxX,
    distanceFromBoundary: 0,
    direction: 'inside',
    severity: 'none',
  };
}

export interface LinearInterpolationResult {
  interpolatedY: number;
  extrapolation: ExtrapolationReport;
  leftPoint?: DataPoint;
  rightPoint?: DataPoint;
  slope: number;
  steps: CalculationStep[];
}

export function linearInterpolation(points: DataPoint[], targetX: number): LinearInterpolationResult {
  if (points.length < 2) {
    throw new Error('Linear interpolation requires at least two data points (x, y)');
  }

  // Sort by x ascending
  const sorted = [...points].sort((a, b) => a.x - b.x);

  // Check for duplicate x values
  for (let i = 0; i < sorted.length - 1; i++) {
    if (Math.abs(sorted[i].x - sorted[i + 1].x) < 1e-12) {
      throw new Error(`Duplicate x coordinate detected at x = ${sorted[i].x}. Function must be single-valued.`);
    }
  }

  const extrapolation = analyzeExtrapolation(sorted, targetX);
  const steps: CalculationStep[] = [];

  let p0: DataPoint;
  let p1: DataPoint;

  if (targetX <= sorted[0].x) {
    // Extrapolate below
    p0 = sorted[0];
    p1 = sorted[1];
  } else if (targetX >= sorted[sorted.length - 1].x) {
    // Extrapolate above
    p0 = sorted[sorted.length - 2];
    p1 = sorted[sorted.length - 1];
  } else {
    // Bracket points
    let idx = 0;
    while (idx < sorted.length - 1 && sorted[idx + 1].x < targetX) {
      idx++;
    }
    p0 = sorted[idx];
    p1 = sorted[idx + 1];
  }

  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const slope = dy / dx;
  const interpolatedY = p0.y + slope * (targetX - p0.x);

  steps.push({
    stepNumber: 1,
    title: 'Select Bracketing Interval Coordinates',
    formula: '(x_0, y_0) \\leftrightarrow (x_1, y_1)',
    substitution: `(${p0.x}, ${p0.y}) \\text{ and } (${p1.x}, ${p1.y})`,
    result: `Slope m = \\frac{${p1.y} - ${p0.y}}{${p1.x} - ${p0.x}} = ${slope.toFixed(4)}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Apply Point-Slope Linear Interpolation',
    formula: 'y = y_0 + m \\cdot (x - x_0)',
    substitution: `${p0.y} + ${slope.toFixed(4)} \\cdot (${targetX} - ${p0.x})`,
    result: `y(target) = ${interpolatedY.toFixed(4)}`,
    annotation: extrapolation.isExtrapolated ? 'Value obtained via linear EXTRAPOLATION outside interval.' : 'Valid interior interpolation.',
  });

  return {
    interpolatedY,
    extrapolation,
    leftPoint: p0,
    rightPoint: p1,
    slope,
    steps,
  };
}

export interface PolynomialInterpolationResult {
  interpolatedY: number;
  polynomialDegree: number;
  extrapolation: ExtrapolationReport;
  lagrangeTerms: { i: number; basisLi: number; termValue: number }[];
  steps: CalculationStep[];
}

/**
 * Lagrange Polynomial Interpolation:
 * P(x) = sum_{i=0}^n y_i * L_i(x)
 * where L_i(x) = prod_{j != i} (x - x_j) / (x_i - x_j)
 */
export function polynomialInterpolation(points: DataPoint[], targetX: number): PolynomialInterpolationResult {
  const n = points.length;
  if (n < 2) {
    throw new Error('Polynomial interpolation requires at least two distinct data points');
  }

  // Check unique X
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(points[i].x - points[j].x) < 1e-12) {
        throw new Error(`Duplicate x value at x = ${points[i].x}. All interpolation nodes must be distinct.`);
      }
    }
  }

  const extrapolation = analyzeExtrapolation(points, targetX);
  const steps: CalculationStep[] = [];
  const lagrangeTerms: { i: number; basisLi: number; termValue: number }[] = [];

  let totalY = 0;

  for (let i = 0; i < n; i++) {
    let basisLi = 1;
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        basisLi *= (targetX - points[j].x) / (points[i].x - points[j].x);
      }
    }
    const termValue = points[i].y * basisLi;
    totalY += termValue;
    lagrangeTerms.push({ i, basisLi, termValue });
  }

  steps.push({
    stepNumber: 1,
    title: `Construct Degree ${n - 1} Lagrange Polynomial Basis`,
    formula: 'L_i(x) = \\prod_{j \\neq i} \\frac{x - x_j}{x_i - x_j}',
    substitution: `Evaluated at x = ${targetX} for ${n} control nodes`,
    result: `${n} basis coefficients calculated`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Sum Weighted Lagrange Basis Components',
    formula: 'P(x) = \\sum_{i=0}^{n-1} y_i \\cdot L_i(x)',
    substitution: lagrangeTerms.map((t) => `${points[t.i].y.toFixed(2)} \\cdot (${t.basisLi.toFixed(4)})`).join(' + '),
    result: `P(${targetX}) = ${totalY.toFixed(4)}`,
    annotation: n >= 5 ? 'Warning: High polynomial order (>4) prone to Runge\'s oscillation at boundary edges.' : undefined,
  });

  return {
    interpolatedY: totalY,
    polynomialDegree: n - 1,
    extrapolation,
    lagrangeTerms,
    steps,
  };
}
