/**
 * Engineering Data Analysis, Regression & Signal Filtering Engine
 * 
 * Implements:
 * 61. Linear Least-Squares Regression (y = mx + b)
 * 62. Correlation Coefficient (r) & Coefficient of Determination (R²)
 * 63. Standard Error of the Estimate (S_yx) & Standard Error of Parameters (S_m, S_b)
 * 64. Residuals Analysis & Sum of Squared Errors (SSE/SSR)
 * 65. Min-Max Normalization ([0, 1] or arbitrary [a, b])
 * 66. Z-Score Standardization (zero mean, unit variance)
 * 67. Moving Averages: Simple Moving Average (SMA) & Weighted Moving Average (WMA)
 * 68. Exponential Moving Average (EMA) with smoothing factor α
 */

import { CalculationStep } from '../../types/tool';

export interface RegressionPoint {
  x: number;
  y: number;
}

export interface ResidualItem {
  x: number;
  yActual: number;
  yPredicted: number;
  residual: number; // yActual - yPredicted
  residualSq: number;
}

export interface LinearRegressionResult {
  slope: number;              // m
  intercept: number;          // b
  r: number;                  // Pearson correlation coefficient
  rSquared: number;           // R²
  standardErrorEstimate: number; // S_yx
  standardErrorSlope: number;    // S_m
  standardErrorIntercept: number;// S_b
  sumSquaredErrors: number;   // SSE
  residuals: ResidualItem[];
  equationText: string;
  pointsCount: number;
  steps: CalculationStep[];
}

export function calculateLinearRegression(points: RegressionPoint[]): LinearRegressionResult {
  const n = points.length;
  if (n < 2) {
    throw new Error('Linear regression requires at least two (x, y) data points');
  }

  const steps: CalculationStep[] = [];

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const x = points[i].x;
    const y = points[i].y;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  const denomM = n * sumX2 - sumX * sumX;
  if (Math.abs(denomM) < 1e-14) {
    throw new Error('All x coordinates are identical: vertical line has infinite slope');
  }

  const slope = (n * sumXY - sumX * sumY) / denomM;
  const intercept = (sumY - slope * sumX) / n;

  // Pearson r
  const denomR = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const r = denomR !== 0 ? (n * sumXY - sumX * sumY) / denomR : 0;
  const rSquared = r * r;

  // Residuals & SSE
  let sse = 0;
  let sxx = 0;
  const residuals: ResidualItem[] = [];

  for (let i = 0; i < n; i++) {
    const x = points[i].x;
    const yActual = points[i].y;
    const yPredicted = slope * x + intercept;
    const res = yActual - yPredicted;
    const resSq = res * res;
    sse += resSq;
    sxx += (x - meanX) * (x - meanX);

    residuals.push({
      x,
      yActual,
      yPredicted,
      residual: res,
      residualSq: resSq,
    });
  }

  // Standard Error of Estimate S_yx = sqrt(SSE / (n - 2))
  const dof = Math.max(1, n - 2);
  const s_yx = Math.sqrt(sse / dof);
  const s_m = sxx > 0 ? s_yx / Math.sqrt(sxx) : 0;
  const s_b = sxx > 0 ? s_yx * Math.sqrt(sumX2 / (n * sxx)) : 0;

  const sign = intercept >= 0 ? '+' : '−';
  const equationText = `y = ${slope.toFixed(4)}x ${sign} ${Math.abs(intercept).toFixed(4)}`;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Slope m & Intercept b via Ordinary Least Squares (OLS)',
    formula: 'm = \\frac{n\\sum xy - \\sum x\\sum y}{n\\sum x^2 - (\\sum x)^2}, \\quad b = \\bar{y} - m\\bar{x}',
    substitution: `m = (${n}·${sumXY.toFixed(2)} - ${sumX.toFixed(2)}·${sumY.toFixed(2)}) / (${denomM.toFixed(2)})`,
    result: `m = ${slope.toFixed(4)}, b = ${intercept.toFixed(4)} (${equationText})`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Evaluate Goodness of Fit (Pearson r & R²)',
    formula: 'R^2 = 1 - \\frac{\\text{SSE}}{\\text{SST}} = r^2',
    substitution: `r = ${r.toFixed(4)} \\implies R^2 = ${rSquared.toFixed(4)} (${(rSquared * 100).toFixed(2)}% variance explained)`,
    result: `R² = ${rSquared.toFixed(4)}, S_{yx} = ${s_yx.toFixed(4)}`,
  });

  return {
    slope,
    intercept,
    r,
    rSquared,
    standardErrorEstimate: s_yx,
    standardErrorSlope: s_m,
    standardErrorIntercept: s_b,
    sumSquaredErrors: sse,
    residuals,
    equationText,
    pointsCount: n,
    steps,
  };
}

export function minMaxNormalize(data: number[], targetMin = 0, targetMax = 1): number[] {
  if (data.length === 0) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const v of data) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min;
  if (span === 0) {
    return data.map(() => (targetMin + targetMax) / 2);
  }
  const targetSpan = targetMax - targetMin;
  return data.map((v) => targetMin + ((v - min) / span) * targetSpan);
}

export function zScoreStandardize(data: number[]): {
  standardized: number[];
  mean: number;
  stdDev: number;
} {
  const n = data.length;
  if (n === 0) return { standardized: [], mean: 0, stdDev: 0 };

  let sum = 0;
  for (const v of data) sum += v;
  const mean = sum / n;

  let sumSq = 0;
  for (const v of data) sumSq += (v - mean) * (v - mean);
  const stdDev = Math.sqrt(sumSq / n);

  if (stdDev === 0) {
    return { standardized: data.map(() => 0), mean, stdDev: 0 };
  }

  const standardized = data.map((v) => (v - mean) / stdDev);
  return { standardized, mean, stdDev };
}

export function calculateSimpleMovingAverage(data: number[], windowSize: number): number[] {
  const n = data.length;
  const w = Math.max(1, Math.min(n, Math.floor(windowSize)));
  const result: number[] = [];

  let windowSum = 0;
  for (let i = 0; i < n; i++) {
    windowSum += data[i];
    if (i >= w) {
      windowSum -= data[i - w];
    }
    const currentWindowCount = Math.min(i + 1, w);
    result.push(windowSum / currentWindowCount);
  }

  return result;
}

export function calculateWeightedMovingAverage(data: number[], windowSize: number, weights?: number[]): number[] {
  const n = data.length;
  const w = Math.max(1, Math.min(n, Math.floor(windowSize)));

  // Default linear triangular weights: 1, 2, ..., w
  let wArray = weights;
  if (!wArray || wArray.length !== w) {
    wArray = Array.from({ length: w }, (_, i) => i + 1);
  }

  const weightSum = wArray.reduce((acc, v) => acc + v, 0);
  const result: number[] = [];

  for (let i = 0; i < n; i++) {
    if (i < w - 1) {
      // Partial window at startup
      let pSum = 0;
      let pW = 0;
      for (let j = 0; j <= i; j++) {
        pSum += data[j] * wArray[w - 1 - (i - j)];
        pW += wArray[w - 1 - (i - j)];
      }
      result.push(pSum / (pW || 1));
    } else {
      let sum = 0;
      for (let j = 0; j < w; j++) {
        sum += data[i - w + 1 + j] * wArray[j];
      }
      result.push(sum / weightSum);
    }
  }

  return result;
}

export function calculateExponentialMovingAverage(data: number[], alpha: number): number[] {
  if (data.length === 0) return [];
  const safeAlpha = Math.max(0.0001, Math.min(1, alpha));
  const result: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const prevEma = result[i - 1];
    const currentEma = safeAlpha * data[i] + (1 - safeAlpha) * prevEma;
    result.push(currentEma);
  }

  return result;
}
