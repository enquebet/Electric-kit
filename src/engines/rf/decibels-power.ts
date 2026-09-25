import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity, formatSignificantFigures } from '../../lib/units/formatter';

/**
 * Decibels & RF Power Conversion Functions
 */

// -------------------------------------------------------------
// Power dB: dB = 10 * log10(P2 / P1)
// -------------------------------------------------------------
export function calculatePowerDb(p1Watts: number, p2Watts: number): CalculationResult {
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (p1Watts <= 0 || p2Watts <= 0) {
    return {
      primaryValue: 0,
      formattedValue: 'Undefined',
      unit: 'dB',
      label: 'Power Ratio in Decibels',
      warnings: [{
        severity: 'danger',
        title: 'Non-Positive Power Input',
        message: 'Both reference power (P1) and signal power (P2) must be strictly greater than zero for logarithmic decibel calculations.',
      }],
      steps: [],
    };
  }

  const ratio = p2Watts / p1Watts;
  const db = 10 * Math.log10(ratio);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Linear Power Ratio',
    formula: 'Ratio = P₂ / P₁',
    substitution: `${formatQuantity(p2Watts, 'power')} / ${formatQuantity(p1Watts, 'power')}`,
    result: ratio.toFixed(4),
  });

  steps.push({
    stepNumber: 2,
    title: 'Convert Power Ratio to Decibels (dB)',
    formula: 'dB = 10 × log₁₀(P₂ / P₁)',
    substitution: `10 × log₁₀(${ratio.toFixed(4)})`,
    result: `${db >= 0 ? '+' : ''}${db.toFixed(2)} dB`,
    annotation: db > 0 ? 'Power amplification (Gain)' : db < 0 ? 'Power attenuation (Loss)' : 'Unity gain (0 dB)',
  });

  return {
    primaryValue: db,
    formattedValue: `${db >= 0 ? '+' : ''}${db.toFixed(2)} dB`,
    unit: 'dB',
    label: 'Power Ratio (dB)',
    warnings,
    steps,
    additionalOutputs: {
      linearRatio: {
        label: 'Linear Power Ratio (P₂/P₁)',
        value: `${ratio.toFixed(4)}×`,
      },
      p1: {
        label: 'Reference Power (P₁)',
        value: formatQuantity(p1Watts, 'power'),
      },
      p2: {
        label: 'Output Power (P₂)',
        value: formatQuantity(p2Watts, 'power'),
      },
    },
    visualData: { p1Watts, p2Watts, ratio, db },
  };
}

// -------------------------------------------------------------
// Voltage dB: dB = 20 * log10(V2 / V1)  [Equal Impedance Z1 = Z2]
// -------------------------------------------------------------
export function calculateVoltageDb(v1Volts: number, v2Volts: number, impedanceOhms: number = 50): CalculationResult {
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (v1Volts <= 0 || v2Volts <= 0) {
    return {
      primaryValue: 0,
      formattedValue: 'Undefined',
      unit: 'dB',
      label: 'Voltage Ratio in Decibels',
      warnings: [{
        severity: 'danger',
        title: 'Non-Positive Voltage Input',
        message: 'Voltages must be strictly positive (> 0 V) for logarithmic decibel calculations.',
      }],
      steps: [],
    };
  }

  const ratio = v2Volts / v1Volts;
  const db = 20 * Math.log10(ratio);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Voltage Ratio',
    formula: 'Ratio = V₂ / V₁',
    substitution: `${formatQuantity(v2Volts, 'voltage')} / ${formatQuantity(v1Volts, 'voltage')}`,
    result: ratio.toFixed(4),
  });

  steps.push({
    stepNumber: 2,
    title: 'Convert Voltage Ratio to Decibels (20·log10)',
    formula: 'dB = 20 × log₁₀(V₂ / V₁)',
    substitution: `20 × log₁₀(${ratio.toFixed(4)})`,
    result: `${db >= 0 ? '+' : ''}${db.toFixed(2)} dB`,
    annotation: 'NOTE: The 20·log10(V2/V1) formula assumes identical source and termination impedances (Z₁ = Z₂).',
  });

  return {
    primaryValue: db,
    formattedValue: `${db >= 0 ? '+' : ''}${db.toFixed(2)} dB`,
    unit: 'dB',
    label: 'Voltage Gain / Loss (dB)',
    warnings,
    steps,
    additionalOutputs: {
      linearRatio: {
        label: 'Voltage Transfer Ratio (V₂/V₁)',
        value: `${ratio.toFixed(4)}×`,
      },
      powerEquivalentDb: {
        label: 'Equivalent Power Ratio (assuming Z₁ = Z₂)',
        value: `${db >= 0 ? '+' : ''}${db.toFixed(2)} dB`,
      },
      impedanceAssumption: {
        label: 'Impedance Assumption',
        value: `Matched Z = ${impedanceOhms} Ω`,
      },
    },
    visualData: { v1Volts, v2Volts, ratio, db, impedanceOhms },
  };
}

// -------------------------------------------------------------
// dBm & dBW Conversions
// -------------------------------------------------------------
export function milliwattsToDbm(pMilliwatts: number): number {
  if (pMilliwatts <= 0) return -Infinity;
  return 10 * Math.log10(pMilliwatts);
}

export function dbmToMilliwatts(dbm: number): number {
  return Math.pow(10, dbm / 10);
}

export function wattsToDbm(pWatts: number): number {
  return milliwattsToDbm(pWatts * 1000);
}

export function dbmToWatts(dbm: number): number {
  return dbmToMilliwatts(dbm) * 1e-3;
}

export function wattsToDbw(pWatts: number): number {
  if (pWatts <= 0) return -Infinity;
  return 10 * Math.log10(pWatts);
}

export function dbwToWatts(dbw: number): number {
  return Math.pow(10, dbw / 10);
}

export function dbmToDbw(dbm: number): number {
  return dbm - 30;
}

export function dbwToDbm(dbw: number): number {
  return dbw + 30;
}

export interface RfPowerConversionResult {
  watts: number;
  milliwatts: number;
  microwatts: number;
  dbm: number;
  dbw: number;
  voltageRms50Ohm: number;
  voltagePeak50Ohm: number;
}

export function convertRfPower(value: number, inputUnit: 'W' | 'mW' | 'uW' | 'dBm' | 'dBW'): RfPowerConversionResult {
  let pWatts = 0;

  switch (inputUnit) {
    case 'W':
      pWatts = Math.max(0, value);
      break;
    case 'mW':
      pWatts = Math.max(0, value) * 1e-3;
      break;
    case 'uW':
      pWatts = Math.max(0, value) * 1e-6;
      break;
    case 'dBm':
      pWatts = dbmToMilliwatts(value) * 1e-3;
      break;
    case 'dBW':
      pWatts = dbwToWatts(value);
      break;
  }

  const pMilliwatts = pWatts * 1e3;
  const pMicrowatts = pWatts * 1e6;
  const dbm = pMilliwatts > 0 ? milliwattsToDbm(pMilliwatts) : -Infinity;
  const dbw = pWatts > 0 ? wattsToDbw(pWatts) : -Infinity;

  // Power in 50-ohm system: P = V_rms^2 / R => V_rms = sqrt(P * 50)
  const voltageRms50Ohm = Math.sqrt(pWatts * 50);
  const voltagePeak50Ohm = voltageRms50Ohm * Math.SQRT2;

  return {
    watts: pWatts,
    milliwatts: pMilliwatts,
    microwatts: pMicrowatts,
    dbm,
    dbw,
    voltageRms50Ohm,
    voltagePeak50Ohm,
  };
}

// -------------------------------------------------------------
// Linear Ratio ↔ dB
// -------------------------------------------------------------
export function linearRatioToDb(ratio: number, mode: 'power' | 'voltage'): number {
  if (ratio <= 0) return -Infinity;
  return mode === 'power' ? 10 * Math.log10(ratio) : 20 * Math.log10(ratio);
}

export function dbToLinearRatio(db: number, mode: 'power' | 'voltage'): number {
  return mode === 'power' ? Math.pow(10, db / 10) : Math.pow(10, db / 20);
}

// -------------------------------------------------------------
// Multi-Stage dB Gain / Loss Chain
// -------------------------------------------------------------
export interface GainStage {
  name?: string;
  gainDb: number; // Positive for amplifier, negative for attenuator/filter/cable
  noiseFigureDb?: number;
}

export interface GainChainInputs {
  inputPowerDbm: number;
  stages: GainStage[];
}

export interface GainChainResult {
  inputPowerDbm: number;
  outputPowerDbm: number;
  outputPowerWatts: number;
  totalGainDb: number;
  netLinearPowerRatio: number;
  stageProgress: {
    stageIndex: number;
    name: string;
    stageGainDb: number;
    cumulativeGainDb: number;
    powerOutDbm: number;
    powerOutWatts: number;
  }[];
}

export function calculateGainChain(inputs: GainChainInputs): GainChainResult {
  const { inputPowerDbm, stages } = inputs;

  let currentDbm = inputPowerDbm;
  let cumulativeGain = 0;
  const progress: GainChainResult['stageProgress'] = [];

  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    cumulativeGain += s.gainDb;
    currentDbm += s.gainDb;
    const pWatts = dbmToMilliwatts(currentDbm) * 1e-3;

    progress.push({
      stageIndex: i + 1,
      name: s.name || `Stage ${i + 1}`,
      stageGainDb: s.gainDb,
      cumulativeGainDb: cumulativeGain,
      powerOutDbm: currentDbm,
      powerOutWatts: pWatts,
    });
  }

  const outputPowerWatts = dbmToMilliwatts(currentDbm) * 1e-3;
  const netLinearRatio = Math.pow(10, cumulativeGain / 10);

  return {
    inputPowerDbm,
    outputPowerDbm: currentDbm,
    outputPowerWatts,
    totalGainDb: cumulativeGain,
    netLinearPowerRatio: netLinearRatio,
    stageProgress: progress,
  };
}
