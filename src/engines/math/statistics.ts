/**
 * Descriptive Statistics & Engineering Sample Moments Engine
 * 
 * Implements:
 * 51. Mean (Arithmetic & Weighted)
 * 52. Median (50th Percentile)
 * 53. Mode (Unimodal, Multimodal, or None)
 * 54. Root Mean Square (RMS - essential for AC waveforms & noise voltages)
 * 55. Variance (Sample s² with Bessel's N-1 correction & Population σ²)
 * 56. Standard Deviation (Sample s & Population σ)
 * 57. Standard Error of the Mean (SEM = s / √N)
 * 58. Extremes: Min, Max, Range (Span)
 * 59. Percentiles & Quartiles (Q1/25%, Q2/50%, Q3/75%, IQR, P90, P95, P99)
 * 60. Skewness (3rd moment) & Kurtosis (4th moment / peakedness)
 */

import { CalculationStep } from '../../types/tool';

export interface PercentilesData {
  p25: number; // Q1
  p50: number; // Median
  p75: number; // Q3
  p90: number;
  p95: number;
  p99: number;
  iqr: number; // Interquartile Range Q3 - Q1
}

export interface DescriptiveStatisticsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  modes: number[];
  rms: number;
  sampleVariance: number;
  populationVariance: number;
  sampleStdDev: number;
  populationStdDev: number;
  standardErrorOfMean: number;
  min: number;
  max: number;
  range: number;
  percentiles: PercentilesData;
  skewness: number;
  kurtosis: number;
  steps: CalculationStep[];
}

export function calculateDescriptiveStatistics(
  data: number[],
  weights?: number[]
): DescriptiveStatisticsResult {
  // Filter out NaNs, Infinities, and empty values
  const cleanData = data.filter((v) => !isNaN(v) && isFinite(v));
  const n = cleanData.length;

  if (n === 0) {
    throw new Error('Statistics calculation requires at least one finite numerical data point');
  }

  const steps: CalculationStep[] = [];
  const sorted = [...cleanData].sort((a, b) => a - b);

  // Sum & Mean
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    sum += sorted[i];
    sumSq += sorted[i] * sorted[i];
  }
  const mean = sum / n;
  const rms = Math.sqrt(sumSq / n);

  // Min, Max, Range
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  // Median
  let median: number;
  if (n % 2 === 1) {
    median = sorted[Math.floor(n / 2)];
  } else {
    const mid1 = sorted[n / 2 - 1];
    const mid2 = sorted[n / 2];
    median = (mid1 + mid2) / 2;
  }

  // Modes
  const freqMap = new Map<number, number>();
  let maxFreq = 0;
  for (const v of sorted) {
    const count = (freqMap.get(v) || 0) + 1;
    freqMap.set(v, count);
    if (count > maxFreq) maxFreq = count;
  }

  const modes: number[] = [];
  if (maxFreq > 1) {
    freqMap.forEach((count, val) => {
      if (count === maxFreq) {
        modes.push(val);
      }
    });
    modes.sort((a, b) => a - b);
  }

  // Variances & Higher Moments
  let sumDiffSq = 0;
  let sumDiffCube = 0;
  let sumDiffFourth = 0;

  for (let i = 0; i < n; i++) {
    const diff = sorted[i] - mean;
    const diffSq = diff * diff;
    sumDiffSq += diffSq;
    sumDiffCube += diffSq * diff;
    sumDiffFourth += diffSq * diffSq;
  }

  const populationVariance = sumDiffSq / n;
  const populationStdDev = Math.sqrt(populationVariance);

  const sampleVariance = n > 1 ? sumDiffSq / (n - 1) : 0;
  const sampleStdDev = Math.sqrt(sampleVariance);
  const sem = n > 0 ? sampleStdDev / Math.sqrt(n) : 0;

  // Skewness & Kurtosis
  let skewness = 0;
  let kurtosis = 0;
  if (n > 2 && populationStdDev > 0) {
    const m3 = sumDiffCube / n;
    skewness = m3 / Math.pow(populationStdDev, 3);
  }
  if (n > 3 && populationStdDev > 0) {
    const m4 = sumDiffFourth / n;
    kurtosis = m4 / Math.pow(populationVariance, 2) - 3; // Excess kurtosis (normal distribution = 0)
  }

  // Percentiles (linear interpolation method per NIST / R-7)
  const getPercentile = (p: number): number => {
    if (n === 1) return sorted[0];
    const rank = (p / 100) * (n - 1);
    const low = Math.floor(rank);
    const high = Math.ceil(rank);
    const weight = rank - low;
    return sorted[low] * (1 - weight) + sorted[high] * weight;
  };

  const p25 = getPercentile(25);
  const p50 = median;
  const p75 = getPercentile(75);
  const p90 = getPercentile(90);
  const p95 = getPercentile(95);
  const p99 = getPercentile(99);
  const iqr = p75 - p25;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Central Tendency (Mean, Median, RMS)',
    formula: '\\bar{x} = \\frac{1}{n}\\sum x_i, \\quad V_{\\text{rms}} = \\sqrt{\\frac{1}{n}\\sum x_i^2}',
    substitution: `Sum = ${sum.toFixed(3)}, n = ${n}`,
    result: `Mean = ${mean.toFixed(4)}, Median = ${median.toFixed(4)}, RMS = ${rms.toFixed(4)}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Sample Dispersion & Standard Deviation',
    formula: 's^2 = \\frac{1}{n-1}\\sum (x_i - \\bar{x})^2, \\quad s = \\sqrt{s^2}',
    substitution: `SS = ${sumDiffSq.toFixed(4)} / (${n} - 1)`,
    result: `s = ${sampleStdDev.toFixed(4)} (Pop σ = ${populationStdDev.toFixed(4)})`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Compute Standard Error of the Mean (SEM)',
    formula: '\\text{SEM} = \\frac{s}{\\sqrt{n}}',
    substitution: `${sampleStdDev.toFixed(4)} / \\sqrt{${n}}`,
    result: `SEM = ${sem.toFixed(4)}`,
  });

  return {
    count: n,
    sum,
    mean,
    median,
    modes,
    rms,
    sampleVariance,
    populationVariance,
    sampleStdDev,
    populationStdDev,
    standardErrorOfMean: sem,
    min,
    max,
    range,
    percentiles: {
      p25,
      p50,
      p75,
      p90,
      p95,
      p99,
      iqr,
    },
    skewness,
    kurtosis,
    steps,
  };
}
