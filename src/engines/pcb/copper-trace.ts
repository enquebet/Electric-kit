/**
 * PCB Copper & Trace Engineering Engine
 * 
 * Implements:
 * - Copper weight (oz/ft²) ↔ thickness (µm, mil, mm)
 * - Conductor resistance R = ρ(T)·L/A with temperature correction
 * - Trace voltage drop V = I·R and percentage loss
 * - Trace I²R Joule heating power dissipation
 * - IPC-2221 / IPC-2152 empirical trace ampacity, temperature rise, and width synthesis
 * - Current density J = I/A in A/mm² and A/mil²
 * - Client-side trace resistance vs geometry sweep generator
 * 
 * Engineering Classification:
 * - Resistance, Voltage Drop, Power: THEORETICAL
 * - Current Capacity, Temp Rise: ENGINEERING ESTIMATE (IPC-2221 empirical model)
 */

import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { COPPER_RESISTIVITY_20C, COPPER_TEMP_COEFF_20C, COPPER_THICKNESS_1OZ_METERS } from '../../lib/constants';
import { formatQuantity } from '../../lib/units/formatter';

export type TraceLayerType = 'external' | 'internal';

export interface CopperWeightOption {
  oz: number;
  label: string;
  thicknessUm: number;
  thicknessMils: number;
  thicknessMm: number;
  sheetResistanceMilliOhmsAt20C: number;
}

export const STANDARD_COPPER_WEIGHTS: CopperWeightOption[] = [
  { oz: 0.5, label: '0.5 oz (17.5 µm / 0.7 mil)', thicknessUm: 17.5, thicknessMils: 0.689, thicknessMm: 0.0175, sheetResistanceMilliOhmsAt20C: 0.985 },
  { oz: 1.0, label: '1.0 oz (35 µm / 1.37 mil)', thicknessUm: 35.0, thicknessMils: 1.378, thicknessMm: 0.035, sheetResistanceMilliOhmsAt20C: 0.493 },
  { oz: 2.0, label: '2.0 oz (70 µm / 2.75 mil)', thicknessUm: 70.0, thicknessMils: 2.756, thicknessMm: 0.070, sheetResistanceMilliOhmsAt20C: 0.246 },
  { oz: 3.0, label: '3.0 oz (105 µm / 4.13 mil)', thicknessUm: 105.0, thicknessMils: 4.134, thicknessMm: 0.105, sheetResistanceMilliOhmsAt20C: 0.164 },
  { oz: 4.0, label: '4.0 oz (140 µm / 5.51 mil)', thicknessUm: 140.0, thicknessMils: 5.512, thicknessMm: 0.140, sheetResistanceMilliOhmsAt20C: 0.123 },
];

/** Convert copper weight in oz/ft² to nominal thickness in meters */
export function copperWeightToThicknessMeters(ozPerSqFt: number): number {
  return Math.max(0, ozPerSqFt) * COPPER_THICKNESS_1OZ_METERS;
}

/** Convert copper thickness in meters to nominal weight in oz/ft² */
export function copperThicknessToWeightOz(thicknessMeters: number): number {
  return Math.max(0, thicknessMeters) / COPPER_THICKNESS_1OZ_METERS;
}

export interface TraceResistanceInputs {
  lengthMeters: number;
  widthMeters: number;
  thicknessMeters: number;
  temperatureC?: number;
  currentAmps?: number;
  sourceVoltage?: number;
}

export interface TraceResistanceOutputs {
  resistanceOhms: number;
  effectiveResistivity: number;
  crossSectionalAreaM2: number;
  crossSectionalAreaMil2: number;
  crossSectionalAreaMm2: number;
  voltageDropVolts?: number;
  voltageDropPercent?: number;
  powerLossWatts?: number;
  currentDensityAmpsPerMm2?: number;
  currentDensityAmpsPerMil2?: number;
}

/**
 * Calculates PCB trace DC resistance, voltage drop, power loss, and current density.
 * Theoretical Model: R = ρ(T) · L / A
 */
export function calculateTraceResistance(inputs: TraceResistanceInputs): CalculationResult & { outputs: TraceResistanceOutputs } {
  const {
    lengthMeters: L,
    widthMeters: W,
    thicknessMeters: T,
    temperatureC = 25,
    currentAmps: I,
    sourceVoltage: Vsource,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeL = Math.max(1e-6, L);
  const safeW = Math.max(1e-6, W);
  const safeT = Math.max(1e-7, T);

  // Area A = W * T
  const areaM2 = safeW * safeT;
  const areaMm2 = areaM2 * 1e6;
  const areaMil2 = areaM2 / (0.0000254 * 0.0000254);

  // Temperature corrected resistivity: rho(T) = rho20 * [1 + alpha * (T - 20)]
  const rhoT = COPPER_RESISTIVITY_20C * (1 + COPPER_TEMP_COEFF_20C * (temperatureC - 20));
  const resistance = (rhoT * safeL) / areaM2;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Temperature-Corrected Copper Resistivity',
    formula: 'ρ(T) = ρ₂₀ × [1 + α₂₀ × (T − 20°C)]',
    substitution: `ρ(${temperatureC}°C) = 1.7241e-8 × [1 + 0.00393 × (${temperatureC} − 20)]`,
    result: `${rhoT.toExponential(4)} Ω·m`,
    annotation: `Reference resistivity at 20°C: 1.7241 × 10⁻⁸ Ω·m (100% IACS). Temperature coefficient: 0.00393/°C.`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Trace Conductor Cross-Sectional Area',
    formula: 'A = Width × Thickness',
    substitution: `A = ${(safeW * 1e3).toFixed(3)} mm × ${(safeT * 1e6).toFixed(1)} µm`,
    result: `${areaMm2.toFixed(4)} mm² (${areaMil2.toFixed(1)} mil²)`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate DC Trace Resistance',
    formula: 'R = ρ(T) × L / A',
    substitution: `R = (${rhoT.toExponential(4)} Ω·m × ${(safeL * 1e3).toFixed(1)} mm) / ${areaM2.toExponential(4)} m²`,
    result: `${resistance < 1 ? (resistance * 1e3).toFixed(3) + ' mΩ' : resistance.toFixed(4) + ' Ω'}`,
  });

  let voltageDrop: number | undefined;
  let voltageDropPercent: number | undefined;
  let powerLoss: number | undefined;
  let currentDensityMm2: number | undefined;
  let currentDensityMil2: number | undefined;

  if (I !== undefined && I > 0) {
    voltageDrop = I * resistance;
    powerLoss = I * I * resistance;
    currentDensityMm2 = I / areaMm2;
    currentDensityMil2 = I / areaMil2;

    steps.push({
      stepNumber: 4,
      title: 'Calculate Trace Voltage Drop & Power Loss',
      formula: 'V_drop = I × R | P_loss = I² × R',
      substitution: `V = ${I} A × ${resistance.toFixed(5)} Ω | P = (${I} A)² × ${resistance.toFixed(5)} Ω`,
      result: `V_drop = ${(voltageDrop * 1e3).toFixed(2)} mV | P_loss = ${(powerLoss * 1e3).toFixed(2)} mW`,
    });

    if (Vsource !== undefined && Vsource > 0) {
      voltageDropPercent = (voltageDrop / Vsource) * 100;
      steps.push({
        stepNumber: 5,
        title: 'Calculate Percentage Voltage Drop',
        formula: '%V_drop = (V_drop / V_source) × 100%',
        substitution: `(${voltageDrop.toFixed(4)} V / ${Vsource} V) × 100%`,
        result: `${voltageDropPercent.toFixed(2)}%`,
        annotation: voltageDropPercent > 3.0 ? 'Exceeds standard 3% DC bus voltage drop design allowance.' : 'Within standard 3% DC bus margin.',
      });

      if (voltageDropPercent > 5.0) {
        warnings.push({
          severity: 'warning',
          title: 'Excessive Trace Voltage Drop',
          message: `Trace voltage drop (${voltageDropPercent.toFixed(1)}%) exceeds the recommended 5% maximum limit for digital and analog supply rails. Consider increasing trace width or copper weight.`,
        });
      }
    }

    if (currentDensityMm2 > 35) {
      warnings.push({
        severity: 'warning',
        title: 'High Current Density Warning',
        message: `Current density is ${currentDensityMm2.toFixed(1)} A/mm² (exceeds typical continuous rule-of-thumb limit of 30–35 A/mm² for standard FR-4). Check IPC thermal rise.`,
      });
    }
  }

  const formatted = resistance < 1 ? `${(resistance * 1e3).toFixed(3)} mΩ` : `${resistance.toFixed(4)} Ω`;

  return {
    label: 'Trace DC Resistance',
    primaryValue: resistance,
    primaryUnit: 'Ω',
    formattedValue: formatted,
    formattedResult: formatted,
    steps,
    warnings,
    equationUsed: 'R = ρ(T)·L / (W·T) | V_drop = I·R | P = I²·R',
    engineeringModel: 'THEORETICAL',
    standardsContext: 'IACS (International Annealed Copper Standard) conductivity at 20°C with linear temperature correction.',
    additionalOutputs: {
      resistanceMilliOhms: { label: 'Resistance (mΩ)', value: `${(resistance * 1e3).toFixed(3)} mΩ` },
      crossSectionalArea: { label: 'Cross-Section Area', value: `${areaMm2.toFixed(4)} mm² (${areaMil2.toFixed(1)} mil²)` },
      ...(currentDensityMm2 ? { currentDensity: { label: 'Current Density', value: `${currentDensityMm2.toFixed(2)} A/mm²` } } : {}),
      ...(voltageDrop ? { voltageDrop: { label: 'Voltage Drop', value: `${(voltageDrop * 1e3).toFixed(2)} mV` } } : {}),
      ...(voltageDropPercent ? { voltageDropPercent: { label: '% Voltage Drop', value: `${voltageDropPercent.toFixed(2)}%` } } : {}),
      ...(powerLoss ? { powerDissipation: { label: 'Thermal Power Loss', value: `${(powerLoss * 1e3).toFixed(2)} mW` } } : {}),
    },
    outputs: {
      resistanceOhms: resistance,
      effectiveResistivity: rhoT,
      crossSectionalAreaM2: areaM2,
      crossSectionalAreaMil2: areaMil2,
      crossSectionalAreaMm2: areaMm2,
      voltageDropVolts: voltageDrop,
      voltageDropPercent: voltageDropPercent,
      powerLossWatts: powerLoss,
      currentDensityAmpsPerMm2: currentDensityMm2,
      currentDensityAmpsPerMil2: currentDensityMil2,
    },
  };
}

export interface IpcAmpacityInputs {
  layer: TraceLayerType;
  thicknessMeters: number;
  widthMeters?: number;
  currentAmps?: number;
  tempRiseC: number;
}

export interface IpcAmpacityOutputs {
  layer: TraceLayerType;
  kFactor: number;
  calculatedCurrentAmps?: number;
  requiredWidthMeters?: number;
  requiredWidthMils?: number;
  requiredWidthMm?: number;
  estimatedTempRiseC?: number;
  crossSectionalAreaMil2: number;
  currentDensityAmpsPerMm2: number;
}

/**
 * IPC-2221 / IPC-2152 Empirical Trace Current Capacity & Width Synthesizer
 * 
 * Empirical Equation:
 * I = k · (ΔT)^0.44 · (Area_mil²)^0.725
 * Where:
 * - External layer: k = 0.048
 * - Internal layer: k = 0.024 (half the thermal dissipation of external surface)
 * 
 * Engineering Classification: ENGINEERING ESTIMATE
 */
export function calculateIpcTraceAmpacity(inputs: IpcAmpacityInputs): CalculationResult & { outputs: IpcAmpacityOutputs } {
  const { layer, thicknessMeters: T, widthMeters: W, currentAmps: I, tempRiseC } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const k = layer === 'external' ? 0.048 : 0.024;
  const safeDeltaT = Math.max(1.0, tempRiseC);
  const safeT = Math.max(1e-7, T);
  const thicknessMils = (safeT / 0.0000254);

  let calculatedCurrent: number | undefined;
  let requiredWidthMeters: number | undefined;
  let requiredWidthMils: number | undefined;
  let requiredWidthMm: number | undefined;
  let estimatedTempRise: number | undefined;
  let crossSectionAreaMil2 = 0;
  let currentDensity = 0;

  if (W !== undefined && W > 0) {
    // Mode 1: Given Width & Allowed Temp Rise -> Calculate Max Current Capacity
    const widthMils = W / 0.0000254;
    crossSectionAreaMil2 = widthMils * thicknessMils;
    calculatedCurrent = k * Math.pow(safeDeltaT, 0.44) * Math.pow(crossSectionAreaMil2, 0.725);
    const areaMm2 = crossSectionAreaMil2 * (0.0254 * 0.0254);
    currentDensity = calculatedCurrent / areaMm2;

    steps.push({
      stepNumber: 1,
      title: 'Calculate Trace Cross-Sectional Area',
      formula: 'Area(mil²) = Width(mil) × Thickness(mil)',
      substitution: `Area = ${widthMils.toFixed(1)} mil × ${thicknessMils.toFixed(2)} mil`,
      result: `${crossSectionAreaMil2.toFixed(1)} mil² (${areaMm2.toFixed(4)} mm²)`,
    });

    steps.push({
      stepNumber: 2,
      title: `Apply IPC-2221 Empirical Ampacity Equation (${layer.toUpperCase()} layer)`,
      formula: 'I = k × (ΔT)^0.44 × (Area)^0.725',
      substitution: `I = ${k} × (${safeDeltaT}°C)^0.44 × (${crossSectionAreaMil2.toFixed(1)} mil²)^0.725`,
      result: `${calculatedCurrent.toFixed(2)} A`,
      annotation: `Layer factor k = ${k}. Model assumes natural convection and radiation on 1.6 mm FR-4 in still air.`,
    });
  } else if (I !== undefined && I > 0) {
    // Mode 2: Given Current & Allowed Temp Rise -> Synthesize Required Trace Width
    // Area_mil² = [ I / (k * ΔT^0.44) ]^(1 / 0.725)
    const areaMil2 = Math.pow(I / (k * Math.pow(safeDeltaT, 0.44)), 1 / 0.725);
    crossSectionAreaMil2 = areaMil2;
    requiredWidthMils = areaMil2 / thicknessMils;
    requiredWidthMeters = requiredWidthMils * 0.0000254;
    requiredWidthMm = requiredWidthMils * 0.0254;
    const areaMm2 = areaMil2 * (0.0254 * 0.0254);
    currentDensity = I / areaMm2;

    steps.push({
      stepNumber: 1,
      title: 'Invert IPC-2221 Equation for Required Copper Cross-Section Area',
      formula: 'Area(mil²) = [ I / (k × ΔT^0.44) ]^(1 / 0.725)',
      substitution: `Area = [ ${I} A / (${k} × (${safeDeltaT}°C)^0.44) ]^(1.3793)`,
      result: `${areaMil2.toFixed(1)} mil² (${areaMm2.toFixed(4)} mm²)`,
    });

    steps.push({
      stepNumber: 2,
      title: 'Solve Minimum Required Trace Width',
      formula: 'Width = Area / Thickness',
      substitution: `Width = ${areaMil2.toFixed(1)} mil² / ${thicknessMils.toFixed(2)} mil`,
      result: `${requiredWidthMm.toFixed(3)} mm (${requiredWidthMils.toFixed(1)} mil)`,
      annotation: `For ${thicknessMils.toFixed(1)} mil nominal copper thickness (${(T * 1e6).toFixed(0)} µm).`,
    });
  }

  // Model Limitations Warning
  warnings.push({
    severity: 'info',
    title: 'IPC-2221 Empirical Model Limitations',
    message: 'IPC-2221 equations represent legacy empirical curve-fits for isolated traces on unpopulated double-sided boards. Modern multi-layer designs with internal power/ground planes dissipate heat significantly better (typically 20–40% lower temp rise per IPC-2152).',
  });

  if (requiredWidthMm !== undefined && requiredWidthMm < 0.1) {
    warnings.push({
      severity: 'warning',
      title: 'Trace Below Standard Fabrication Limit',
      message: `Calculated trace width (${(requiredWidthMm * 1e3).toFixed(0)} µm / ${requiredWidthMils?.toFixed(1)} mil) is smaller than standard 4 mil (0.1 mm) PCB fabrication minimums. Clamp to fab minimum.`,
    });
  }

  const primaryVal = calculatedCurrent ?? (requiredWidthMm ?? 0);
  const primaryUnit = calculatedCurrent !== undefined ? 'A' : 'mm';

  const formatted = calculatedCurrent !== undefined ? `${calculatedCurrent.toFixed(2)} A` : `${requiredWidthMm?.toFixed(3)} mm`;

  return {
    label: calculatedCurrent !== undefined ? 'Max Trace Ampacity' : 'Required Trace Width',
    primaryValue: primaryVal,
    primaryUnit,
    formattedValue: formatted,
    formattedResult: formatted,
    steps,
    warnings,
    equationUsed: 'I = k · ΔT^0.44 · A^0.725 (IPC-2221 Empirical)',
    engineeringModel: 'ENGINEERING ESTIMATE',
    standardsContext: 'IPC-2221 Generic Standard on Printed Board Design (legacy empirical charts) / IPC-2152 guidelines.',
    additionalOutputs: {
      layerClassification: { label: 'Layer Type', value: layer === 'external' ? 'External Surface (k = 0.048)' : 'Internal Sub-Layer (k = 0.024)' },
      ...(calculatedCurrent !== undefined ? { currentCapacity: { label: 'Max Continuous Current', value: `${calculatedCurrent.toFixed(2)} A` } } : {}),
      ...(requiredWidthMm !== undefined ? { requiredWidth: { label: 'Required Trace Width', value: `${requiredWidthMm.toFixed(3)} mm (${requiredWidthMils?.toFixed(1)} mil)` } } : {}),
      currentDensity: { label: 'Current Density (J)', value: `${currentDensity.toFixed(2)} A/mm²` },
      crossSectionArea: { label: 'Cross-Section Area', value: `${(crossSectionAreaMil2 * 0.0254 * 0.0254).toFixed(4)} mm² (${crossSectionAreaMil2.toFixed(1)} mil²)` },
    },
    outputs: {
      layer,
      kFactor: k,
      calculatedCurrentAmps: calculatedCurrent,
      requiredWidthMeters,
      requiredWidthMils,
      requiredWidthMm,
      estimatedTempRiseC: estimatedTempRise,
      crossSectionalAreaMil2: crossSectionAreaMil2,
      currentDensityAmpsPerMm2: currentDensity,
    },
  };
}

/**
 * Generate client-side curve points for trace resistance vs trace width
 * across multiple copper weights.
 */
export function generateTraceResistanceVsWidthData(
  lengthMeters: number,
  tempC = 25,
  minWidthMm = 0.1,
  maxWidthMm = 5.0,
  pointsCount = 30
) {
  const step = (maxWidthMm - minWidthMm) / (pointsCount - 1);
  const data: { widthMm: number; rHalfOz: number; rOneOz: number; rTwoOz: number }[] = [];

  for (let i = 0; i < pointsCount; i++) {
    const widthMm = minWidthMm + i * step;
    const widthM = widthMm * 1e-3;

    const r05 = calculateTraceResistance({
      lengthMeters,
      widthMeters: widthM,
      thicknessMeters: 17.5e-6,
      temperatureC: tempC,
    }).primaryValue;

    const r10 = calculateTraceResistance({
      lengthMeters,
      widthMeters: widthM,
      thicknessMeters: 35.0e-6,
      temperatureC: tempC,
    }).primaryValue;

    const r20 = calculateTraceResistance({
      lengthMeters,
      widthMeters: widthM,
      thicknessMeters: 70.0e-6,
      temperatureC: tempC,
    }).primaryValue;

    data.push({
      widthMm: parseFloat(widthMm.toFixed(2)),
      rHalfOz: parseFloat((r05 * 1000).toFixed(3)), // mΩ
      rOneOz: parseFloat((r10 * 1000).toFixed(3)),   // mΩ
      rTwoOz: parseFloat((r20 * 1000).toFixed(3)),   // mΩ
    });
  }

  return data;
}
