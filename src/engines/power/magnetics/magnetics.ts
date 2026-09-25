import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export interface InductorEnergyInputs {
  inductanceH: number;
  currentA: number;
}

export function calculateInductorStoredEnergy(inputs: InductorEnergyInputs): CalculationResult {
  const { inductanceH: L, currentA: I } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeL = Math.max(L, 0);
  const energyJoules = 0.5 * safeL * Math.pow(I, 2);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Magnetic Field Stored Energy',
    formula: 'E_L = ½ × L × I²',
    substitution: `½ × ${formatQuantity(safeL, 'inductance')} × (${I.toFixed(3)} A)²`,
    result: `E_L = ${energyJoules >= 1 ? energyJoules.toFixed(4) + ' J' : (energyJoules * 1e6).toFixed(2) + ' µJ'}`,
    annotation: 'Energy stored in the volume of the magnetic core and core air-gap.',
  });

  return {
    primaryValue: energyJoules,
    formattedValue: energyJoules >= 1 ? `${energyJoules.toFixed(3)} J` : `${(energyJoules * 1e6).toFixed(1)} µJ`,
    unit: 'J',
    label: 'Inductor Stored Energy (E_L)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      energyJoules: { label: 'Energy (Joules)', value: `${energyJoules.toFixed(4)} J` },
      energyMicroJoules: { label: 'Energy (µJ)', value: `${(energyJoules * 1e6).toFixed(2)} µJ` },
      inductanceValue: { label: 'Inductance (L)', value: formatQuantity(safeL, 'inductance') },
      peakCurrent: { label: 'Operating Current (I)', value: `${I.toFixed(3)} A` },
    },
    visualData: {
      energyJoules,
      L: safeL,
      I,
    },
  };
}

export interface InductorRippleInputs {
  appliedVoltageV: number;
  timeSeconds: number;
  inductanceH: number;
}

export function calculateInductorRippleCurrent(inputs: InductorRippleInputs): CalculationResult {
  const { appliedVoltageV: V, timeSeconds: t, inductanceH: L } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeL = Math.max(L, 1e-9);
  // ΔI = (V * t) / L
  const deltaIAmperes = (V * t) / safeL;

  steps.push({
    stepNumber: 1,
    title: 'Apply Faraday Volt-Second Induction Law',
    formula: 'ΔI_L = (V_applied × Δt) / L',
    substitution: `(${V} V × ${(t * 1e6).toFixed(3)} µs) / ${formatQuantity(safeL, 'inductance')}`,
    result: `ΔI_L = ${deltaIAmperes.toFixed(3)} A`,
  });

  return {
    primaryValue: deltaIAmperes,
    formattedValue: `${deltaIAmperes.toFixed(3)} A`,
    unit: 'A',
    label: 'Inductor Ripple Current (ΔI_L)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      rippleCurrent: { label: 'Peak-to-Peak Ripple (ΔI_L)', value: `${deltaIAmperes.toFixed(3)} A` },
      appliedVoltage: { label: 'Applied Voltage', value: `${V.toFixed(2)} V` },
      conductionTime: { label: 'Time Duration (Δt)', value: `${(t * 1e6).toFixed(3)} µs` },
      inductance: { label: 'Inductance Value', value: formatQuantity(safeL, 'inductance') },
    },
    visualData: {
      deltaIAmperes,
      V,
      t,
      safeL,
    },
  };
}

export interface PeakRmsCurrentInputs {
  averageCurrentA: number;
  rippleCurrentDeltaIA: number;
}

export function calculatePeakInductorCurrent(inputs: PeakRmsCurrentInputs): CalculationResult {
  const { averageCurrentA: Iavg, rippleCurrentDeltaIA: deltaI } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const iPeak = Iavg + deltaI / 2;
  const iMin = Iavg - deltaI / 2;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Inductor Peak and Valley Currents',
    formula: 'I_peak = I_avg + (ΔI / 2);  I_valley = I_avg - (ΔI / 2)',
    substitution: `${Iavg.toFixed(3)} A ± (${deltaI.toFixed(3)} A / 2)`,
    result: `I_peak = ${iPeak.toFixed(3)} A,  I_valley = ${iMin.toFixed(3)} A`,
  });

  return {
    primaryValue: iPeak,
    formattedValue: `${iPeak.toFixed(3)} A`,
    unit: 'A',
    label: 'Peak Inductor Current (I_peak)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      peakCurrent: { label: 'Peak Current (I_peak)', value: `${iPeak.toFixed(3)} A` },
      valleyCurrent: { label: 'Valley Current (I_valley)', value: `${iMin.toFixed(3)} A` },
      averageCurrent: { label: 'DC Average Current', value: `${Iavg.toFixed(3)} A` },
      rippleDelta: { label: 'Peak-to-Peak Ripple (ΔI)', value: `${deltaI.toFixed(3)} A` },
    },
    visualData: {
      iPeak,
      iMin,
      Iavg,
      deltaI,
    },
  };
}

export function calculateRmsInductorCurrent(inputs: PeakRmsCurrentInputs): CalculationResult {
  const { averageCurrentA: Iavg, rippleCurrentDeltaIA: deltaI } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // Triangular waveform RMS current:
  // I_rms = sqrt( I_avg^2 + (ΔI^2 / 12) )
  const iRms = Math.sqrt(Math.pow(Iavg, 2) + Math.pow(deltaI, 2) / 12);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Triangular Ripple Waveform RMS Current',
    formula: 'I_rms = √[ I_avg² + (ΔI² / 12) ]',
    substitution: `√[ (${Iavg.toFixed(3)} A)² + (${deltaI.toFixed(3)} A)² / 12 ]`,
    result: `I_rms = ${iRms.toFixed(3)} A`,
    annotation: 'Used to calculate total copper I²R winding power dissipation (DCR loss).',
  });

  return {
    primaryValue: iRms,
    formattedValue: `${iRms.toFixed(3)} A RMS`,
    unit: 'A',
    label: 'Inductor RMS Current (I_rms)',
    classification: 'ENGINEERING ESTIMATE',
    warnings,
    steps,
    additionalOutputs: {
      rmsCurrent: { label: 'True RMS Current', value: `${iRms.toFixed(3)} A` },
      dcAverageCurrent: { label: 'DC Component (I_avg)', value: `${Iavg.toFixed(3)} A` },
      acRippleComponent: { label: 'AC Ripple RMS (ΔI / √12)', value: `${(deltaI / Math.sqrt(12)).toFixed(3)} A` },
    },
    visualData: {
      iRms,
      Iavg,
      deltaI,
    },
  };
}

export interface MagneticFluxDensityInputs {
  appliedVoltageV: number;
  onTimeMicroseconds: number;
  turnCountN: number;
  coreAreaSquareMm: number; // Ae in mm²
}

export function calculateMagneticFluxDensity(inputs: MagneticFluxDensityInputs): CalculationResult {
  const {
    appliedVoltageV: V,
    onTimeMicroseconds: tOnUs,
    turnCountN: N,
    coreAreaSquareMm: AeMm2,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const tOnSec = Math.max(tOnUs, 0.001) * 1e-6;
  const safeN = Math.max(N, 1);
  const aeM2 = Math.max(AeMm2, 1) * 1e-6;

  // B = (V * t_on) / (N * Ae) in Teslas
  const deltaBTeslas = (V * tOnSec) / (safeN * aeM2);

  if (deltaBTeslas > 0.4) {
    warnings.push({
      severity: 'warning',
      title: 'High Flux Density Swing (ΔB > 0.4 T)',
      message: `Calculated flux swing (${deltaBTeslas.toFixed(3)} T) is high for typical manganese-zinc (MnZn) power ferrite cores (Bsat ≈ 0.35T to 0.45T at 100°C). Risk of core saturation.`,
    });
  }

  steps.push({
    stepNumber: 1,
    title: 'Calculate Peak Magnetic Flux Density Swing (ΔB)',
    formula: 'ΔB = (V × t_on) / (N × A_e)',
    substitution: `(${V} V × ${tOnUs} µs) / (${safeN} turns × ${AeMm2} mm² × 10⁻⁶)`,
    result: `ΔB = ${deltaBTeslas.toFixed(4)} T (${(deltaBTeslas * 1000).toFixed(1)} mT)`,
    annotation: 'Faraday electromagnetic law relating volt-seconds to magnetic core flux density.',
  });

  return {
    primaryValue: deltaBTeslas,
    formattedValue: `${deltaBTeslas.toFixed(3)} T`,
    unit: 'T',
    label: 'Magnetic Flux Density Swing (ΔB)',
    classification: 'ENGINEERING ESTIMATE',
    warnings,
    steps,
    additionalOutputs: {
      fluxDensityTeslas: { label: 'Flux Density (B)', value: `${deltaBTeslas.toFixed(4)} T` },
      fluxDensityMilliTeslas: { label: 'Flux Density (mT)', value: `${(deltaBTeslas * 1000).toFixed(1)} mT` },
      coreArea: { label: 'Effective Core Area (A_e)', value: `${AeMm2} mm²` },
      turnCount: { label: 'Primary Winding Turns', value: `${safeN}` },
    },
    visualData: {
      deltaBTeslas,
      V,
      tOnUs,
      safeN,
      AeMm2,
    },
  };
}

export interface CoreSaturationMarginInputs {
  operatingFluxDensityT: number;
  saturationFluxDensityT: number; // e.g. 0.35T or 0.40T
}

export function calculateCoreSaturationMargin(inputs: CoreSaturationMarginInputs): CalculationResult {
  const { operatingFluxDensityT: Bop, saturationFluxDensityT: Bsat } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeBsat = Math.max(Bsat, 0.05);
  const marginT = safeBsat - Bop;
  const utilizationPercent = (Bop / safeBsat) * 100;

  if (utilizationPercent >= 100) {
    warnings.push({
      severity: 'danger',
      title: 'CORE SATURATION IMMINENT / EXCEEDED',
      message: `Operating flux density (${Bop.toFixed(3)} T) meets or exceeds core saturation limit (${safeBsat.toFixed(3)} T). Inductance will collapse, causing destructive switch overcurrent!`,
    });
  } else if (utilizationPercent > 80) {
    warnings.push({
      severity: 'warning',
      title: 'Narrow Core Saturation Margin (<20%)',
      message: `Core utilization is ${utilizationPercent.toFixed(1)}%. Ferrite Bsat drops significantly at elevated temperatures (100°C). Increase core area, turns, or air gap.`,
    });
  }

  steps.push({
    stepNumber: 1,
    title: 'Calculate Magnetic Saturation Margin & Percentage Utilization',
    formula: 'Margin = B_sat - B_op;  Utilization = (B_op / B_sat) × 100%',
    substitution: `${safeBsat.toFixed(3)} T - ${Bop.toFixed(3)} T`,
    result: `Margin = ${marginT.toFixed(3)} T (Utilization = ${utilizationPercent.toFixed(1)}%)`,
  });

  return {
    primaryValue: marginT,
    formattedValue: `${(marginT * 1000).toFixed(1)} mT margin`,
    unit: 'T',
    label: 'Core Saturation Margin (ΔB)',
    classification: 'COMPONENT-DATA DEPENDENT',
    warnings,
    steps,
    additionalOutputs: {
      saturationMargin: { label: 'Saturation Margin', value: `${(marginT * 1000).toFixed(1)} mT` },
      utilizationPercent: { label: 'Core Utilization', value: `${utilizationPercent.toFixed(1)}%` },
      operatingB: { label: 'Operating Flux Density (B_op)', value: `${Bop.toFixed(3)} T` },
      coreBsat: { label: 'Core Saturation Limit (B_sat)', value: `${safeBsat.toFixed(3)} T` },
    },
    visualData: {
      marginT,
      utilizationPercent,
      Bop,
      safeBsat,
    },
  };
}
