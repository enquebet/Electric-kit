import { StandardValueMatch } from '../../types/tool';
import { formatQuantity } from '../units/formatter';

// E12: 10% tolerance standard values
export const E12_SERIES = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];

// E24: 5% tolerance standard values
export const E24_SERIES = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
  3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1
];

// E96: 1% tolerance standard values (base decade multipliers)
export const E96_SERIES = [
  1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.30,
  1.33, 1.37, 1.40, 1.43, 1.47, 1.50, 1.54, 1.58, 1.62, 1.65, 1.69, 1.74,
  1.78, 1.82, 1.87, 1.91, 1.96, 2.00, 2.05, 2.10, 2.15, 2.21, 2.26, 2.32,
  2.37, 2.43, 2.49, 2.55, 2.61, 2.67, 2.74, 2.80, 2.87, 2.94, 3.01, 3.09,
  3.16, 3.24, 3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12,
  4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23, 5.36, 5.49,
  5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65, 6.81, 6.98, 7.15, 7.32,
  7.50, 7.68, 7.87, 8.06, 8.25, 8.45, 8.66, 8.87, 9.09, 9.31, 9.53, 9.76
];

export function findStandardValueMatch(
  valueInOhms: number,
  seriesName: 'E12' | 'E24' | 'E96' = 'E24'
): StandardValueMatch | undefined {
  if (valueInOhms <= 0 || !Number.isFinite(valueInOhms)) return undefined;

  const baseSeries =
    seriesName === 'E12' ? E12_SERIES : seriesName === 'E96' ? E96_SERIES : E24_SERIES;

  // Determine decade power
  const decadeExponent = Math.floor(Math.log10(valueInOhms));
  const decadeMultiplier = Math.pow(10, decadeExponent);
  const normalizedValue = valueInOhms / decadeMultiplier;

  // Construct search array extending slightly lower and higher to handle boundaries (e.g. 9.8 -> next decade 10.0)
  const fullDecadeCandidates: number[] = [];
  
  // Previous decade end
  fullDecadeCandidates.push(baseSeries[baseSeries.length - 1] * (decadeMultiplier / 10));
  // Current decade
  baseSeries.forEach(val => fullDecadeCandidates.push(val * decadeMultiplier));
  // Next decade start
  fullDecadeCandidates.push(baseSeries[0] * (decadeMultiplier * 10));

  let lower = fullDecadeCandidates[0];
  let upper = fullDecadeCandidates[fullDecadeCandidates.length - 1];

  for (let i = 0; i < fullDecadeCandidates.length; i++) {
    const val = fullDecadeCandidates[i];
    if (val <= valueInOhms) {
      lower = val;
    }
    if (val >= valueInOhms && upper === fullDecadeCandidates[fullDecadeCandidates.length - 1]) {
      upper = val;
      break;
    }
  }

  // Choose recommended closest
  const diffLower = Math.abs(valueInOhms - lower);
  const diffUpper = Math.abs(upper - valueInOhms);
  const recommended = diffLower <= diffUpper ? lower : upper;
  const deviation = ((recommended - valueInOhms) / valueInOhms) * 100;

  return {
    series: seriesName,
    nominalValue: valueInOhms,
    formattedNominal: formatQuantity(valueInOhms, 'resistance'),
    lowerStandard: lower,
    formattedLower: formatQuantity(lower, 'resistance'),
    upperStandard: upper,
    formattedUpper: formatQuantity(upper, 'resistance'),
    recommendedValue: recommended,
    formattedRecommended: formatQuantity(recommended, 'resistance'),
    deviationPercent: parseFloat(deviation.toFixed(2)),
  };
}

export interface SuggestedWattage {
  watts: number;
  formatted: string;
  suggestedRating: string;
  note: string;
}

export function recommendResistorPowerRating(dissipatedWatts: number): SuggestedWattage {
  // Common standard wattage tiers
  const tiers = [
    { rating: 0.125, label: '1/8 W (0.125 W)' },
    { rating: 0.25, label: '1/4 W (0.25 W)' },
    { rating: 0.5, label: '1/2 W (0.5 W)' },
    { rating: 1.0, label: '1 W' },
    { rating: 2.0, label: '2 W' },
    { rating: 5.0, label: '5 W' },
    { rating: 10.0, label: '10 W' },
    { rating: 25.0, label: '25 W (Chassis mount)' },
    { rating: 50.0, label: '50 W (Heatsink required)' },
  ];

  // Apply 2x safety derating factor (standard practice in aerospace and industrial electronics)
  const deratedTarget = dissipatedWatts * 2.0;

  let recommended = tiers[tiers.length - 1].label;
  for (const tier of tiers) {
    if (tier.rating >= deratedTarget) {
      recommended = tier.label;
      break;
    }
  }

  let note = 'Includes 50% derating safety margin for thermal longevity';
  if (dissipatedWatts > 0.5) {
    note += '. Consider ambient airflow or heatsinking for power resistors.';
  }

  return {
    watts: dissipatedWatts,
    formatted: formatQuantity(dissipatedWatts, 'power'),
    suggestedRating: recommended,
    note,
  };
}

export function snapToStandardE24(valueInOhms: number): StandardValueMatch | undefined {
  return findStandardValueMatch(valueInOhms, 'E24');
}
