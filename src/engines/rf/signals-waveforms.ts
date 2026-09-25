import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity, formatSignificantFigures } from '../../lib/units/formatter';

export type WaveformType = 'sine' | 'square' | 'triangle';

export interface WaveformMetricsInputs {
  waveformType: WaveformType;
  inputMode: 'peak' | 'rms' | 'peak_to_peak' | 'average';
  value: number;
}

export interface WaveformMetricsResult {
  vPeak: number;
  vRms: number;
  vPeakToPeak: number;
  vAverage: number; // Rectified average
  crestFactor: number; // V_pk / V_rms
  formFactor: number;  // V_rms / V_avg
  formulaNote: string;
}

/**
 * Calculates Peak, RMS, Peak-to-Peak, and Rectified Average values
 * for sinusoidal, square, and triangle waveforms strictly using their
 * true mathematical definitions (never applying sine formulas to square/triangle).
 */
export function calculateWaveformMetrics(inputs: WaveformMetricsInputs): WaveformMetricsResult {
  const { waveformType, inputMode, value } = inputs;
  const val = Math.max(0, value);

  let vPeak = 0;

  // Determine Peak value first based on the input mode and waveform geometry
  switch (waveformType) {
    case 'sine': {
      // V_rms = V_pk / sqrt(2)
      // V_pp = 2 * V_pk
      // V_avg = (2 / pi) * V_pk
      if (inputMode === 'peak') vPeak = val;
      else if (inputMode === 'rms') vPeak = val * Math.SQRT2;
      else if (inputMode === 'peak_to_peak') vPeak = val / 2;
      else if (inputMode === 'average') vPeak = (val * Math.PI) / 2;
      break;
    }
    case 'square': {
      // Symmetrical 50% duty bipolar square wave:
      // V_rms = V_pk
      // V_pp = 2 * V_pk
      // V_avg = V_pk
      if (inputMode === 'peak') vPeak = val;
      else if (inputMode === 'rms') vPeak = val;
      else if (inputMode === 'peak_to_peak') vPeak = val / 2;
      else if (inputMode === 'average') vPeak = val;
      break;
    }
    case 'triangle': {
      // Symmetrical triangle wave:
      // V_rms = V_pk / sqrt(3)
      // V_pp = 2 * V_pk
      // V_avg = V_pk / 2
      if (inputMode === 'peak') vPeak = val;
      else if (inputMode === 'rms') vPeak = val * Math.sqrt(3);
      else if (inputMode === 'peak_to_peak') vPeak = val / 2;
      else if (inputMode === 'average') vPeak = val * 2;
      break;
    }
  }

  let vRms = 0;
  let vPeakToPeak = 2 * vPeak;
  let vAverage = 0;
  let crestFactor = 0;
  let formFactor = 0;
  let formulaNote = '';

  switch (waveformType) {
    case 'sine':
      vRms = vPeak / Math.SQRT2; // ~0.7071 * V_pk
      vAverage = (2 * vPeak) / Math.PI; // ~0.6366 * V_pk
      crestFactor = Math.SQRT2; // 1.4142
      formFactor = Math.PI / (2 * Math.SQRT2); // 1.1107
      formulaNote = 'V_rms = V_pk / √2 (0.7071); V_avg = (2/π)·V_pk (0.6366); Crest Factor = √2 ≈ 1.414';
      break;
    case 'square':
      vRms = vPeak; // 1.0 * V_pk
      vAverage = vPeak; // 1.0 * V_pk
      crestFactor = 1.0;
      formFactor = 1.0;
      formulaNote = 'V_rms = V_pk; V_avg = V_pk; Crest Factor = 1.000; Form Factor = 1.000';
      break;
    case 'triangle':
      vRms = vPeak / Math.sqrt(3); // ~0.5774 * V_pk
      vAverage = vPeak / 2; // 0.5000 * V_pk
      crestFactor = Math.sqrt(3); // 1.7321
      formFactor = (2 / Math.sqrt(3)); // 1.1547
      formulaNote = 'V_rms = V_pk / √3 (0.5774); V_avg = V_pk / 2 (0.5000); Crest Factor = √3 ≈ 1.732';
      break;
  }

  return {
    vPeak,
    vRms,
    vPeakToPeak,
    vAverage,
    crestFactor,
    formFactor,
    formulaNote,
  };
}

// -------------------------------------------------------------
// Waveform Parameters & Visualization Sampling
// -------------------------------------------------------------
export interface WaveformVisualInputs {
  waveformType: WaveformType;
  amplitude: number;     // V (Peak amplitude)
  dcOffset?: number;     // V
  frequencyHz: number;   // Hz
  phaseDegrees?: number; // deg (-180 to 180)
  dutyCyclePercent?: number; // % (for square wave, default 50%)
  cyclesToShow?: number; // default 2
  samplePoints?: number; // default 100
}

export interface WaveformSamplePoint {
  timeSec: number;
  timeNorm: number; // normalized 0 to 1
  voltage: number;
}

export interface WaveformAnalysisResult {
  frequencyHz: number;
  periodSec: number;
  omegaRadS: number;
  amplitude: number;
  dcOffset: number;
  vMax: number;
  vMin: number;
  vPeakToPeak: number;
  vRms: number;
  metrics: WaveformMetricsResult;
  samplePoints: WaveformSamplePoint[];
}

export function analyzeWaveform(inputs: WaveformVisualInputs): WaveformAnalysisResult {
  const {
    waveformType,
    amplitude,
    dcOffset = 0,
    frequencyHz,
    phaseDegrees = 0,
    dutyCyclePercent = 50,
    cyclesToShow = 2,
    samplePoints = 120,
  } = inputs;

  const f = Math.max(frequencyHz, 1e-9);
  const T = 1 / f;
  const omega = 2 * Math.PI * f;
  const phaseRad = (phaseDegrees * Math.PI) / 180;
  const duty = Math.min(Math.max(dutyCyclePercent, 1), 99) / 100;

  const metrics = calculateWaveformMetrics({
    waveformType,
    inputMode: 'peak',
    value: amplitude,
  });

  // Effective RMS with DC offset: V_rms_total = sqrt(V_rms_ac^2 + V_dc^2)
  const totalRms = Math.sqrt(metrics.vRms * metrics.vRms + dcOffset * dcOffset);

  const totalTime = cyclesToShow * T;
  const points: WaveformSamplePoint[] = [];

  for (let i = 0; i <= samplePoints; i++) {
    const t = (i / samplePoints) * totalTime;
    const angle = 2 * Math.PI * f * t + phaseRad;
    const angleMod = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); // 0 to 2pi
    let instantAc = 0;

    switch (waveformType) {
      case 'sine':
        instantAc = amplitude * Math.sin(angle);
        break;
      case 'square':
        instantAc = angleMod < 2 * Math.PI * duty ? amplitude : -amplitude;
        break;
      case 'triangle': {
        // Triangle wave oscillating between -1 and +1 with period 2pi
        // fraction from 0 to 1:
        const frac = angleMod / (2 * Math.PI);
        if (frac < 0.5) {
          instantAc = amplitude * (4 * frac - 1);
        } else {
          instantAc = amplitude * (3 - 4 * frac);
        }
        break;
      }
    }

    const voltage = instantAc + dcOffset;
    points.push({
      timeSec: t,
      timeNorm: i / samplePoints,
      voltage,
    });
  }

  const vMax = dcOffset + amplitude;
  const vMin = dcOffset - amplitude;

  return {
    frequencyHz: f,
    periodSec: T,
    omegaRadS: omega,
    amplitude,
    dcOffset,
    vMax,
    vMin,
    vPeakToPeak: 2 * amplitude,
    vRms: totalRms,
    metrics,
    samplePoints: points,
  };
}

// -------------------------------------------------------------
// Phase Difference & Time Difference Calculations
// -------------------------------------------------------------
export interface PhaseDiffInputs {
  frequencyHz: number;
  mode: 'time_to_phase' | 'phase_to_time';
  timeDeltaSec?: number;
  phaseDeltaDeg?: number;
}

export interface PhaseDiffResult {
  frequencyHz: number;
  periodSec: number;
  timeDeltaSec: number;
  phaseDeltaDeg: number;
  phaseDeltaRad: number;
  leadLagStatus: string;
  quarterCycleFraction: number; // fraction of full 360 deg
}

export function calculatePhaseDifference(inputs: PhaseDiffInputs): CalculationResult {
  const { frequencyHz, mode } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const f = Math.max(frequencyHz, 1e-9);
  const T = 1 / f;

  let deltaT = 0;
  let deltaDeg = 0;

  if (mode === 'time_to_phase') {
    deltaT = inputs.timeDeltaSec ?? 0;
    // phi = 360° * (deltaT / T)
    deltaDeg = (deltaT / T) * 360;
    steps.push({
      stepNumber: 1,
      title: 'Calculate Phase Shift from Time Delay',
      formula: 'φ = 360° × (Δt / T) = 2π × f × Δt',
      substitution: `φ = 360° × (${formatQuantity(deltaT, 'time')} / ${formatQuantity(T, 'time')})`,
      result: `φ = ${deltaDeg.toFixed(2)}° (${((deltaDeg * Math.PI) / 180).toFixed(4)} rad)`,
      annotation: deltaDeg > 0 ? 'Positive Δt indicates Waveform A leads Waveform B.' : 'Negative Δt indicates Waveform A lags Waveform B.',
    });
  } else {
    deltaDeg = inputs.phaseDeltaDeg ?? 0;
    // deltaT = (phi / 360°) * T
    deltaT = (deltaDeg / 360) * T;
    steps.push({
      stepNumber: 1,
      title: 'Calculate Time Delay from Phase Angle',
      formula: 'Δt = (φ / 360°) × T = φ_rad / (2π × f)',
      substitution: `Δt = (${deltaDeg.toFixed(2)}° / 360°) × ${formatQuantity(T, 'time')}`,
      result: `Δt = ${formatQuantity(deltaT, 'time')}`,
      annotation: `At ${formatQuantity(f, 'frequency')}, each degree corresponds to ${formatQuantity(T / 360, 'time')}.`,
    });
  }

  // Normalize angle to -180° .. +180° for lead/lag description
  let normDeg = ((deltaDeg % 360) + 360) % 360;
  if (normDeg > 180) normDeg -= 360;
  const deltaRad = (normDeg * Math.PI) / 180;

  let leadLagStatus = 'In-Phase (0°)';
  if (Math.abs(normDeg) < 0.01) leadLagStatus = 'In-Phase (0°)';
  else if (Math.abs(Math.abs(normDeg) - 180) < 0.01) leadLagStatus = 'Anti-Phase / Inverted (180°)';
  else if (Math.abs(normDeg - 90) < 0.01) leadLagStatus = 'Quadrature Lead (+90°)';
  else if (Math.abs(normDeg - (-90)) < 0.01) leadLagStatus = 'Quadrature Lag (-90°)';
  else if (normDeg > 0) leadLagStatus = `Leading by +${normDeg.toFixed(1)}°`;
  else leadLagStatus = `Lagging by ${normDeg.toFixed(1)}°`;

  const fractionOfPeriod = deltaT / T;

  return {
    primaryValue: mode === 'time_to_phase' ? normDeg : deltaT,
    formattedValue: mode === 'time_to_phase' ? `${normDeg.toFixed(2)}°` : formatQuantity(deltaT, 'time'),
    unit: mode === 'time_to_phase' ? '°' : 's',
    label: mode === 'time_to_phase' ? 'Phase Shift (φ)' : 'Time Delay (Δt)',
    warnings,
    steps,
    additionalOutputs: {
      phaseDeg: {
        label: 'Phase Difference (Degrees)',
        value: `${normDeg.toFixed(2)}°`,
      },
      phaseRad: {
        label: 'Phase Difference (Radians)',
        value: `${deltaRad.toFixed(4)} rad (${(deltaRad / Math.PI).toFixed(3)}π)`,
      },
      timeDelta: {
        label: 'Time Shift (Δt)',
        value: formatQuantity(deltaT, 'time'),
      },
      period: {
        label: 'Signal Period (T = 1/f)',
        value: formatQuantity(T, 'time'),
      },
      frequency: {
        label: 'Frequency (f)',
        value: formatQuantity(f, 'frequency'),
      },
      relationship: {
        label: 'Phase Relationship',
        value: leadLagStatus,
      },
      cycleFraction: {
        label: 'Fraction of Waveform Cycle',
        value: `${(fractionOfPeriod * 100).toFixed(2)}% of cycle`,
      },
    },
    visualData: {
      frequencyHz: f,
      periodSec: T,
      timeDeltaSec: deltaT,
      phaseDeltaDeg: normDeg,
      phaseDeltaRad: deltaRad,
      leadLagStatus,
    },
  };
}

export function calculatePhaseShiftDelay(inputs: { frequencyHz: number; phaseShiftDeg: number }): CalculationResult {
  return calculatePhaseDifference({
    frequencyHz: inputs.frequencyHz,
    mode: 'phase_to_time',
    phaseDeltaDeg: inputs.phaseShiftDeg,
  });
}

export function calculateFreqPeriod(inputs: { frequencyHz?: number; periodSec?: number }) {
  const f = inputs.frequencyHz !== undefined && inputs.frequencyHz > 0
    ? inputs.frequencyHz
    : (inputs.periodSec !== undefined && inputs.periodSec > 0 ? 1 / inputs.periodSec : 1000);
  const T = 1 / f;
  const omega = 2 * Math.PI * f;
  return {
    frequencyHz: f,
    periodSec: T,
    angularFreqRadPerSec: omega,
    visualData: {
      frequencyHz: f,
      periodSec: T,
      angularFreqRadPerSec: omega,
    },
  };
}

