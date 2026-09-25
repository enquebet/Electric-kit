import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity, formatSignificantFigures } from '../../lib/units/formatter';
import { BOLTZMANN_CONSTANT, STANDARD_NOISE_TEMPERATURE_KELVIN } from '../../lib/constants';
import { dbmToMilliwatts } from './decibels-power';

// -------------------------------------------------------------
// Thermal Noise Calculator (k * T * B)
// -------------------------------------------------------------
export interface ThermalNoiseInputs {
  temperatureKelvin?: number;
  temperatureCelsius?: number;
  bandwidthHz: number;
}

export interface ThermalNoiseResult {
  temperatureKelvin: number;
  temperatureCelsius: number;
  bandwidthHz: number;
  noisePowerWatts: number;
  powerWatts: number;
  noisePowerDbm: number;
  powerDbm: number;
  powerDbw: number;
  noiseSpectralDensityWattsPerHz: number;
  noiseSpectralDensityWHz: number;
  noiseSpectralDensityDbmPerHz: number;
  noiseSpectralDensityDbmHz: number;
}

export function calculateThermalNoise(inputs: ThermalNoiseInputs): ThermalNoiseResult {
  let T = STANDARD_NOISE_TEMPERATURE_KELVIN; // 290 K by default
  if (inputs.temperatureKelvin !== undefined) {
    T = Math.max(0.001, inputs.temperatureKelvin);
  } else if (inputs.temperatureCelsius !== undefined) {
    T = Math.max(0.001, inputs.temperatureCelsius + 273.15);
  }

  const B = Math.max(1, inputs.bandwidthHz);
  const nsdWattsPerHz = BOLTZMANN_CONSTANT * T; // k * T
  const nsdDbmPerHz = 10 * Math.log10(nsdWattsPerHz * 1000);

  const noisePowerWatts = nsdWattsPerHz * B;
  const noisePowerDbm = 10 * Math.log10(noisePowerWatts * 1000);
  const powerDbw = noisePowerDbm - 30;

  return {
    temperatureKelvin: T,
    temperatureCelsius: T - 273.15,
    bandwidthHz: B,
    noisePowerWatts,
    powerWatts: noisePowerWatts,
    noisePowerDbm,
    powerDbm: noisePowerDbm,
    powerDbw,
    noiseSpectralDensityWattsPerHz: nsdWattsPerHz,
    noiseSpectralDensityWHz: nsdWattsPerHz,
    noiseSpectralDensityDbmPerHz: nsdDbmPerHz,
    noiseSpectralDensityDbmHz: nsdDbmPerHz,
  };
}

// -------------------------------------------------------------
// Noise Factor & Noise Figure (F & NF)
// -------------------------------------------------------------
export interface NoiseFigureInputs {
  mode: 'nf_to_factor' | 'factor_to_nf' | 'temp_to_nf';
  noiseFigureDb?: number;
  noiseFactorLinear?: number;
  effectiveNoiseTempKelvin?: number;
}

export interface NoiseFigureResult {
  noiseFigureDb: number;
  noiseFactorLinear: number;
  effectiveNoiseTempKelvin: number;
}

export function calculateNoiseFigure(inputs: NoiseFigureInputs): NoiseFigureResult {
  const { mode } = inputs;
  let nf = 0;
  let fLinear = 1;
  let te = 0;

  if (mode === 'nf_to_factor') {
    nf = Math.max(0, inputs.noiseFigureDb ?? 0);
    fLinear = Math.pow(10, nf / 10);
    te = STANDARD_NOISE_TEMPERATURE_KELVIN * (fLinear - 1);
  } else if (mode === 'factor_to_nf') {
    fLinear = Math.max(1, inputs.noiseFactorLinear ?? 1);
    nf = 10 * Math.log10(fLinear);
    te = STANDARD_NOISE_TEMPERATURE_KELVIN * (fLinear - 1);
  } else {
    te = Math.max(0, inputs.effectiveNoiseTempKelvin ?? 0);
    fLinear = 1 + te / STANDARD_NOISE_TEMPERATURE_KELVIN;
    nf = 10 * Math.log10(fLinear);
  }

  return {
    noiseFigureDb: nf,
    noiseFactorLinear: fLinear,
    effectiveNoiseTempKelvin: te,
  };
}

export interface NoiseFigureFactorInputs {
  mode: 'from_nf' | 'from_te' | 'from_factor';
  value: number;
  refTempKelvin?: number;
}

export interface NoiseFigureFactorResult {
  noiseFigureDb: number;
  noiseFactorLinear: number;
  equivalentNoiseTempKelvin: number;
}

export function calculateNoiseFigureFactor(inputs: NoiseFigureFactorInputs): NoiseFigureFactorResult {
  const { mode, value, refTempKelvin = STANDARD_NOISE_TEMPERATURE_KELVIN } = inputs;
  let nf = 0;
  let fLinear = 1;
  let te = 0;

  if (mode === 'from_nf') {
    nf = Math.max(0, value);
    fLinear = Math.pow(10, nf / 10);
    te = refTempKelvin * (fLinear - 1);
  } else if (mode === 'from_factor') {
    fLinear = Math.max(1, value);
    nf = 10 * Math.log10(fLinear);
    te = refTempKelvin * (fLinear - 1);
  } else {
    te = Math.max(0, value);
    fLinear = 1 + te / refTempKelvin;
    nf = 10 * Math.log10(fLinear);
  }

  return {
    noiseFigureDb: nf,
    noiseFactorLinear: fLinear,
    equivalentNoiseTempKelvin: te,
  };
}

// -------------------------------------------------------------
// Receiver Noise Floor & Sensitivity
// -------------------------------------------------------------
export interface NoiseFloorInputs {
  bandwidthHz: number;
  noiseFigureDb: number;
  temperatureKelvin?: number;
  requiredSnrDb?: number;
}

export interface NoiseFloorResult {
  thermalNoiseDbm: number;
  noiseFloorDbm: number;
  noiseFloorWatts: number;
  receiverSensitivityDbm?: number;
  sensitivityDbm?: number;
  receiverSensitivityWatts?: number;
  bandwidthHz: number;
  noiseFigureDb: number;
}

export function calculateReceiverNoiseFloor(inputs: NoiseFloorInputs): NoiseFloorResult {
  const { bandwidthHz, noiseFigureDb, temperatureKelvin = STANDARD_NOISE_TEMPERATURE_KELVIN, requiredSnrDb } = inputs;

  const thermal = calculateThermalNoise({
    temperatureKelvin,
    bandwidthHz,
  });

  // Noise floor = kTB (dBm) + NF (dB)
  const noiseFloorDbm = thermal.noisePowerDbm + noiseFigureDb;
  const noiseFloorWatts = dbmToMilliwatts(noiseFloorDbm) * 1e-3;

  let receiverSensitivityDbm: number | undefined;
  let receiverSensitivityWatts: number | undefined;

  if (requiredSnrDb !== undefined) {
    receiverSensitivityDbm = noiseFloorDbm + requiredSnrDb;
    receiverSensitivityWatts = dbmToMilliwatts(receiverSensitivityDbm) * 1e-3;
  }

  return {
    thermalNoiseDbm: thermal.noisePowerDbm,
    noiseFloorDbm,
    noiseFloorWatts,
    receiverSensitivityDbm,
    sensitivityDbm: receiverSensitivityDbm ?? noiseFloorDbm,
    receiverSensitivityWatts,
    bandwidthHz,
    noiseFigureDb,
  };
}

// -------------------------------------------------------------
// Signal-to-Noise Ratio (SNR)
// -------------------------------------------------------------
export interface SnrInputs {
  mode: 'power' | 'voltage';
  signalValue: number; // Watts or Volts
  noiseValue: number;  // Watts or Volts
}

export interface SnrResult {
  snrLinear: number;
  snrDb: number;
  mode: 'power' | 'voltage';
  signalValue: number;
  noiseValue: number;
}

export function calculateSnr(inputs: SnrInputs): SnrResult {
  const { mode, signalValue, noiseValue } = inputs;
  const s = Math.max(0, signalValue);
  const n = Math.max(1e-15, noiseValue);

  const snrLinear = s / n;
  const snrDb = mode === 'power' ? 10 * Math.log10(snrLinear) : 20 * Math.log10(snrLinear);

  return {
    snrLinear,
    snrDb,
    mode,
    signalValue: s,
    noiseValue: n,
  };
}

// -------------------------------------------------------------
// Cascaded Noise Figure (Friis Formula for Noise)
// -------------------------------------------------------------
export interface CascadedStage {
  name?: string;
  gainDb: number;        // Stage power gain in dB (can be negative for attenuator/filter)
  noiseFigureDb: number; // Stage noise figure in dB (for passive loss L_dB, NF_dB = L_dB)
}

export type NoiseStage = CascadedStage;

export interface CascadedNoiseResult {
  totalNoiseFactor: number;
  totalNoiseFactorLinear: number;
  totalNoiseFigureDb: number;
  totalGainDb: number;
  effectiveNoiseTempKelvin: number;
  totalEquivalentNoiseTempKelvin: number;
  stageContributions: {
    stageIndex: number;
    name: string;
    stageGainDb: number;
    stageNfDb: number;
    linearGain: number;
    linearF: number;
    cumulativeGainDb: number;
    addedNoiseTerm: number;
  }[];
  stages: {
    name: string;
    gainDb: number;
    noiseFigureDb: number;
    stageContributionLinear: number;
  }[];
}

/**
 * Calculates cascaded noise figure using Friis Formula for Noise:
 * F_total = F1 + (F2 - 1)/G1 + (F3 - 1)/(G1*G2) + ...
 * NOTE: Passive attenuators at 290 K have NF equal to their loss in dB (e.g. 3 dB cable loss has NF = 3 dB, Gain = -3 dB).
 */
export function calculateCascadedNoiseFigure(
  input: CascadedStage[] | { stages: CascadedStage[] }
): CascadedNoiseResult {
  const stages = Array.isArray(input) ? input : input.stages || [];

  if (stages.length === 0) {
    return {
      totalNoiseFactor: 1,
      totalNoiseFactorLinear: 1,
      totalNoiseFigureDb: 0,
      totalGainDb: 0,
      effectiveNoiseTempKelvin: 0,
      totalEquivalentNoiseTempKelvin: 0,
      stageContributions: [],
      stages: [],
    };
  }

  let cumulativeLinearGain = 1.0;
  let totalF = 0;
  let cumulativeGainDb = 0;
  const contributions: CascadedNoiseResult['stageContributions'] = [];
  const stagesOutput: CascadedNoiseResult['stages'] = [];

  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    const stageName = s.name || `Stage ${i + 1}`;
    const gLinear = Math.pow(10, s.gainDb / 10);
    const fLinear = Math.pow(10, s.noiseFigureDb / 10);

    let addedTerm = 0;
    if (i === 0) {
      addedTerm = fLinear;
      totalF = fLinear;
    } else {
      addedTerm = (fLinear - 1) / cumulativeLinearGain;
      totalF += addedTerm;
    }

    cumulativeGainDb += s.gainDb;

    contributions.push({
      stageIndex: i + 1,
      name: stageName,
      stageGainDb: s.gainDb,
      stageNfDb: s.noiseFigureDb,
      linearGain: gLinear,
      linearF: fLinear,
      cumulativeGainDb,
      addedNoiseTerm: addedTerm,
    });

    stagesOutput.push({
      name: stageName,
      gainDb: s.gainDb,
      noiseFigureDb: s.noiseFigureDb,
      stageContributionLinear: addedTerm,
    });

    cumulativeLinearGain *= gLinear;
  }

  const totalNfDb = 10 * Math.log10(Math.max(1, totalF));
  const effectiveTe = STANDARD_NOISE_TEMPERATURE_KELVIN * (totalF - 1);

  return {
    totalNoiseFactor: totalF,
    totalNoiseFactorLinear: totalF,
    totalNoiseFigureDb: totalNfDb,
    totalGainDb: cumulativeGainDb,
    effectiveNoiseTempKelvin: effectiveTe,
    totalEquivalentNoiseTempKelvin: effectiveTe,
    stageContributions: contributions,
    stages: stagesOutput,
  };
}

// -------------------------------------------------------------
// Dynamic Range & ADC Resolution
// -------------------------------------------------------------
export interface DynamicRangeInputs {
  maxSignalDbm: number;
  noiseFloorDbm: number;
}

export interface DynamicRangeResult {
  dynamicRangeDb: number;
  dynamicRangeLinear: number;
  maxSignalWatts: number;
  noiseFloorWatts: number;
}

export function calculateDynamicRange(inputs: DynamicRangeInputs): DynamicRangeResult {
  const { maxSignalDbm, noiseFloorDbm } = inputs;
  const drDb = maxSignalDbm - noiseFloorDbm;
  const drLinear = Math.pow(10, drDb / 10);
  const maxSignalWatts = dbmToMilliwatts(maxSignalDbm) * 1e-3;
  const noiseFloorWatts = dbmToMilliwatts(noiseFloorDbm) * 1e-3;

  return {
    dynamicRangeDb: drDb,
    dynamicRangeLinear: drLinear,
    maxSignalWatts,
    noiseFloorWatts,
  };
}

export function calculateAdcDynamicRange(resolutionBits: number): { idealSnrDb: number; dynamicRangeDb: number; levels: number } {
  const n = Math.max(1, Math.min(32, resolutionBits));
  const idealSnrDb = 6.02 * n + 1.76;
  const levels = Math.pow(2, n);
  return {
    idealSnrDb,
    dynamicRangeDb: idealSnrDb,
    levels,
  };
}

export interface AdcQuantizationInputs {
  resolutionBits: number;
  enob?: number;
}

export interface AdcQuantizationResult {
  resolutionBits: number;
  quantizationLevels: number;
  idealSnrDb: number;
  sinadFromEnobDb?: number;
  dynamicRangeDb: number;
  levels: number;
}

export function calculateAdcQuantizationSnr(inputs: AdcQuantizationInputs): AdcQuantizationResult {
  const n = Math.max(1, Math.min(32, inputs.resolutionBits));
  const idealSnrDb = 6.02 * n + 1.76;
  const quantizationLevels = Math.pow(2, n);
  const sinadFromEnobDb = inputs.enob !== undefined ? 6.02 * inputs.enob + 1.76 : undefined;

  return {
    resolutionBits: n,
    quantizationLevels,
    levels: quantizationLevels,
    idealSnrDb,
    sinadFromEnobDb,
    dynamicRangeDb: idealSnrDb,
  };
}
