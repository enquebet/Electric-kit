import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';

export interface SamplingInputs {
  signalFreqHz: number; // Highest frequency component f_max
  samplingFreqHz: number; // Sampling rate f_s
  oversamplingRatio?: number; // Optional target oversampling factor
}

export function calculateSampling(inputs: SamplingInputs): CalculationResult {
  const { signalFreqHz: fIn, samplingFreqHz: fs, oversamplingRatio } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (fs <= 0 || fIn <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Zero or Negative Frequency',
      message: 'Signal frequency and sampling frequency must be greater than zero.',
    });
  }

  // Nyquist rate & frequency
  const nyquistRate = 2 * fIn; // Minimum theoretical fs
  const nyquistFreq = fs / 2; // Maximum signal without aliasing (f_N)
  const samplingPeriodSec = fs > 0 ? 1 / fs : Infinity;

  // Aliasing calculation
  // Find m such that |fIn - m * fs| is minimized and within [0, fs/2]
  const m = Math.round(fIn / fs);
  const aliasFreq = Math.abs(fIn - m * fs);
  const isAliased = fIn > nyquistFreq;

  // Nyquist Zone: 1st zone is [0, fs/2], 2nd zone is [fs/2, fs], 3rd is [fs, 3fs/2], etc.
  const nyquistZone = Math.floor(fIn / nyquistFreq) + 1;

  steps.push({
    stepNumber: 1,
    title: 'Evaluate Nyquist-Shannon Sampling Criterion',
    formula: 'f_N = f_s / 2;  f_Nyquist_rate = 2 × f_max',
    substitution: `f_s = ${formatQuantity(fs, 'frequency')} → Nyquist Limit f_N = ${formatQuantity(nyquistFreq, 'frequency')}`,
    result: `Input: ${formatQuantity(fIn, 'frequency')} ${isAliased ? 'EXCEEDS f_N (ALIASING OCCURS)' : 'IS IN 1st NYQUIST ZONE (NO ALIASING)'}`,
  });

  if (isAliased) {
    warnings.push({
      severity: 'danger',
      title: 'Aliasing / Frequency Foldover Detected',
      message: `Input signal frequency (${formatQuantity(fIn, 'frequency')}) exceeds the Nyquist limit (${formatQuantity(nyquistFreq, 'frequency')}). It will fold back into the baseband at ${formatQuantity(aliasFreq, 'frequency')} (Zone ${nyquistZone}) and cannot be distinguished from a true ${formatQuantity(aliasFreq, 'frequency')} tone without an analog anti-aliasing filter.`,
    });
  }

  steps.push({
    stepNumber: 2,
    title: 'Calculate Folded Apparent Alias Frequency',
    formula: 'f_alias = | f_in - m × f_s |  where f_alias ∈ [0, f_s / 2]',
    substitution: `| ${formatQuantity(fIn, 'frequency')} - ${m} × ${formatQuantity(fs, 'frequency')} |`,
    result: `Apparent Baseband Frequency: ${formatQuantity(aliasFreq, 'frequency')} (Zone ${nyquistZone})`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Sampling Period / Interval (T_s)',
    formula: 'T_s = 1 / f_s',
    substitution: `T_s = 1 / ${formatQuantity(fs, 'frequency')}`,
    result: `T_s = ${formatQuantity(samplingPeriodSec, 'time')} (${(samplingPeriodSec * 1e6).toFixed(3)} µs / sample)`,
  });

  const effectiveOversampling = fs / (2 * fIn);

  return {
    primaryValue: aliasFreq,
    formattedValue: formatQuantity(aliasFreq, 'frequency'),
    unit: 'Hz',
    label: isAliased ? 'Aliased Apparent Frequency' : 'Baseband Reconstructed Frequency',
    classification: 'THEORETICAL',
    standardsContext: 'Nyquist-Shannon Sampling Theorem & Anti-Aliasing Filter Design.',
    warnings,
    steps,
    additionalOutputs: {
      nyquistFrequency: {
        label: 'Nyquist Limit (f_s / 2)',
        value: formatQuantity(nyquistFreq, 'frequency'),
        note: 'Maximum unambiguous bandwidth',
      },
      samplingInterval: {
        label: 'Sample Period (T_s)',
        value: formatQuantity(samplingPeriodSec, 'time'),
        note: `${(samplingPeriodSec * 1e9).toFixed(1)} ns per conversion`,
      },
      aliasingStatus: {
        label: 'Signal Integrity Status',
        value: isAliased ? 'Aliasing Active (Foldover)' : 'Pristine (No Aliasing)',
        note: `Nyquist Zone ${nyquistZone}`,
      },
      oversamplingRatio: {
        label: 'Oversampling Factor (OSR)',
        value: `${effectiveOversampling.toFixed(2)}x`,
        note: effectiveOversampling >= 1 ? 'Sufficient Nyquist rate' : 'Undersampled (< 1x)',
      },
    },
    visualData: {
      fIn,
      fs,
      nyquistFreq,
      aliasFreq,
      isAliased,
      nyquistZone,
      samplingPeriodSec,
      effectiveOversampling,
    },
  };
}
