/**
 * ElectroKit — Phase 12 Engineering Design, System Analysis & Workflows
 * Module E: PCB / System-Level Analysis Workflows (Capabilities 41 - 50)
 *
 * Orchestrates:
 * - Phase 08 PCB Engineering (Power Integrity, Signal Integrity, Transmission Lines, Trace/Via)
 * - Phase 10 Thermal Models
 */

import { EngineeringMargin, WorkflowWarning } from './types';
import { globalTraceabilityRegister } from './traceability';
import { calculatePdnTargetImpedance } from '../pcb/power-integrity';
import { calculateTraceResistance, calculateIpcTraceAmpacity, copperWeightToThicknessMeters } from '../pcb/copper-trace';
import { calculateMicrostripImpedance } from '../pcb/transmission-lines';
import { calculateDifferentialPair } from '../pcb/differential-pairs';
import { calculateSignalIntegrity } from '../pcb/signal-integrity';
import { calculateViaProperties, calculateViaArray } from '../pcb/vias';
import { calculateClearanceAndCreepage } from '../pcb/drc-clearance';

export interface PcbPowerIntegrityInput {
  railVoltageVolts: number;
  maxTransientCurrentAmps: number;
  maxRipplePercent: number; // e.g. 5%
  switchingFrequencyHz: number;
}

/** 41. PCB Power Integrity Workflow */
export function analyzePcbPowerIntegrity(input: PcbPowerIntegrityInput): {
  allowedRippleVolts: number;
  targetPdnImpedanceOhms: number;
  targetPdnImpedanceMilliohms: number;
  recommendedBulkCapacitanceUf: number;
  pdnMargin: EngineeringMargin;
} {
  const { railVoltageVolts, maxTransientCurrentAmps, maxRipplePercent, switchingFrequencyHz } = input;
  if (railVoltageVolts <= 0 || maxTransientCurrentAmps <= 0) {
    throw new Error('Rail voltage and transient current step must be positive.');
  }

  // Reuse Phase 08 PDN target impedance engine
  const pdnRes = calculatePdnTargetImpedance({
    railVoltageVolts,
    allowedRipplePercent: maxRipplePercent,
    transientCurrentAmps: maxTransientCurrentAmps,
  });

  const zTarget = pdnRes.outputs.targetImpedanceOhms;
  const rippleV = pdnRes.outputs.allowedRippleVolts;

  // Approximate required bulk decoupling: C = delta_I / (2 * pi * f * delta_V)
  const cBulkUf = (maxTransientCurrentAmps / (2 * Math.PI * switchingFrequencyHz * rippleV)) * 1e6;

  const margin = globalTraceabilityRegister.createMargin(
    'PDN Target Impedance Limit',
    zTarget,
    zTarget * 0.85, // hypothetical modeled PDN impedance
    'Ω',
    'lower_is_better'
  );

  return {
    allowedRippleVolts: Number(rippleV.toFixed(4)),
    targetPdnImpedanceOhms: Number(zTarget.toFixed(5)),
    targetPdnImpedanceMilliohms: Number((zTarget * 1000).toFixed(2)),
    recommendedBulkCapacitanceUf: Number(cBulkUf.toFixed(2)),
    pdnMargin: margin,
  };
}

export interface PcbThermalWorkflowInput {
  traceLengthMm: number;
  traceWidthMm: number;
  copperThicknessOz: number;
  operatingCurrentAmps: number;
  ambientTempC: number;
}

/** 42, 46. PCB Trace Current + Thermal Analysis */
export function analyzeTraceCurrentAndThermal(input: PcbThermalWorkflowInput): {
  traceResistanceOhms: number;
  voltageDropVolts: number;
  joulePowerLossWatts: number;
  maxCurrentCapacityIpc2152Amps: number;
  traceCurrentMargin: EngineeringMargin;
  ampacityMargin: EngineeringMargin;
} {
  const { traceLengthMm, traceWidthMm, copperThicknessOz, operatingCurrentAmps, ambientTempC } = input;
  if (traceLengthMm <= 0 || traceWidthMm <= 0 || copperThicknessOz <= 0) {
    throw new Error('Trace dimensions and copper weight must be strictly positive.');
  }

  const lengthM = traceLengthMm * 1e-3;
  const widthM = traceWidthMm * 1e-3;
  const thicknessM = copperWeightToThicknessMeters(copperThicknessOz);

  // Reuse Phase 08 trace resistance engine
  const rRes = calculateTraceResistance({
    lengthMeters: lengthM,
    widthMeters: widthM,
    thicknessMeters: thicknessM,
    temperatureC: ambientTempC,
    currentAmps: operatingCurrentAmps,
  });

  const rOhms = rRes.outputs.resistanceOhms;
  const vDrop = operatingCurrentAmps * rOhms;
  const pLoss = operatingCurrentAmps * operatingCurrentAmps * rOhms;

  // Reuse Phase 08 IPC ampacity engine
  const ampRes = calculateIpcTraceAmpacity({
    layer: 'external',
    thicknessMeters: thicknessM,
    widthMeters: widthM,
    tempRiseC: 20,
  });

  const maxIpcI = ampRes.outputs.calculatedCurrentAmps ?? 1.0;
  const margin = globalTraceabilityRegister.createMargin(
    'Trace Current Capacity (IPC-2152)',
    operatingCurrentAmps,
    maxIpcI,
    'A',
    'higher_is_better'
  );

  return {
    traceResistanceOhms: Number(rOhms.toFixed(5)),
    voltageDropVolts: Number(vDrop.toFixed(4)),
    joulePowerLossWatts: Number(pLoss.toFixed(4)),
    maxCurrentCapacityIpc2152Amps: Number(maxIpcI.toFixed(2)),
    traceCurrentMargin: margin,
    ampacityMargin: margin,
  };
}

export interface ControlledImpedanceInput {
  targetImpedanceOhms: number;
  traceWidthMm: number;
  dielectricHeightMm: number;
  dielectricConstantEr: number;
  copperThicknessOz?: number;
}

/** 43. Controlled-Impedance Design Workflow */
export function analyzeControlledImpedance(input: ControlledImpedanceInput): {
  characteristicImpedanceOhms: number;
  effectivePermittivity: number;
  propagationDelayPsPerMm: number;
  impedanceMargin: EngineeringMargin;
} {
  const { targetImpedanceOhms, traceWidthMm, dielectricHeightMm, dielectricConstantEr } = input;
  const cuOz = input.copperThicknessOz ?? 1.0;

  const wM = traceWidthMm * 1e-3;
  const hM = dielectricHeightMm * 1e-3;
  const tM = copperWeightToThicknessMeters(cuOz);

  // Reuse Phase 08 microstrip transmission line engine
  const lineRes = calculateMicrostripImpedance({
    traceWidthMeters: wM,
    dielectricHeightMeters: hM,
    copperThicknessMeters: tM,
    relativePermittivityEr: dielectricConstantEr,
  });

  const z0 = lineRes.outputs.impedanceOhms;
  const erEff = lineRes.outputs.effectivePermittivity;
  const delay = lineRes.outputs.delayPsPerMm;

  const margin = globalTraceabilityRegister.createMargin(
    'Target Impedance Match',
    targetImpedanceOhms,
    z0,
    'Ω',
    'lower_is_better'
  );

  return {
    characteristicImpedanceOhms: Number(z0.toFixed(2)),
    effectivePermittivity: Number(erEff.toFixed(3)),
    propagationDelayPsPerMm: Number(delay.toFixed(2)),
    impedanceMargin: margin,
  };
}

export interface DifferentialPairWorkflowInput {
  traceWidthMm: number;
  traceSpacingMm: number;
  dielectricHeightMm: number;
  dielectricConstantEr: number;
  targetDiffImpedanceOhms?: number; // typically 90Ω or 100Ω
}

/** 44. Differential-Pair Design Workflow */
export function analyzeDifferentialPairWorkflow(input: DifferentialPairWorkflowInput): {
  singleEndedZ0Ohms: number;
  differentialZDiffOhms: number;
  couplingCoefficientPercent: number;
  diffImpedanceMargin: EngineeringMargin;
} {
  const targetDiff = input.targetDiffImpedanceOhms ?? 100.0;

  const wM = input.traceWidthMm * 1e-3;
  const sM = input.traceSpacingMm * 1e-3;
  const hM = input.dielectricHeightMm * 1e-3;
  const tM = copperWeightToThicknessMeters(1.0);

  // Reuse Phase 08 differential pair engine
  const dpRes = calculateDifferentialPair({
    type: 'microstrip',
    traceWidthMeters: wM,
    traceSpacingMeters: sM,
    dielectricHeightMeters: hM,
    copperThicknessMeters: tM,
    relativePermittivityEr: input.dielectricConstantEr,
  });

  const zDiff = dpRes.outputs.diffImpedanceZdiff;
  const z0 = dpRes.outputs.singleEndedZ0;
  const kCoupling = dpRes.outputs.couplingCoefficient;

  const margin = globalTraceabilityRegister.createMargin(
    'Differential Target Impedance',
    targetDiff,
    zDiff,
    'Ω',
    'lower_is_better'
  );

  return {
    singleEndedZ0Ohms: Number(z0.toFixed(2)),
    differentialZDiffOhms: Number(zDiff.toFixed(2)),
    couplingCoefficientPercent: Number((kCoupling * 100).toFixed(1)),
    diffImpedanceMargin: margin,
  };
}

export interface SignalIntegrityRiskInput {
  signalRiseTimeNs: number;
  traceLengthMm: number;
  sourceImpedanceOhms?: number;
  loadImpedanceOhms?: number;
  characteristicZ0Ohms?: number;
}

/** 45. Signal-Integrity Risk Analysis */
export function analyzeSignalIntegrityRisk(input: SignalIntegrityRiskInput): {
  kneeFrequencyGhz: number;
  criticalLengthMm: number;
  isTransmissionLineBehavior: boolean;
  reflectionCoefficientLoad: number;
  recommendedTerminationOhms: number;
  riskSeverity: 'LOW_LUMPED' | 'MODERATE_TERMINATION_RECOMMENDED' | 'CRITICAL_REFLECTIONS';
} {
  const { signalRiseTimeNs, traceLengthMm } = input;
  const z0 = input.characteristicZ0Ohms ?? 50.0;
  const zSource = input.sourceImpedanceOhms ?? 20.0;
  const zLoad = input.loadImpedanceOhms ?? 1e6;

  // Reuse Phase 08 signal integrity engine
  const siRes = calculateSignalIntegrity({
    riseTimeNs: signalRiseTimeNs,
    characteristicZ0Ohms: z0,
    loadImpedanceZlOhms: zLoad,
    actualTraceLengthInches: traceLengthMm / 25.4,
  });

  const fKnee = siRes.outputs.kneeFrequencyGhz;
  const lCrit = siRes.outputs.criticalLengthMm;
  const isLine = siRes.outputs.isTransmissionLineRegime ?? (traceLengthMm > lCrit);
  const gammaLoad = siRes.outputs.reflectionCoefficient;

  // Series termination resistor Rs = Z0 - Zsource
  const rTerm = Math.max(0, z0 - zSource);

  let severity: 'LOW_LUMPED' | 'MODERATE_TERMINATION_RECOMMENDED' | 'CRITICAL_REFLECTIONS' = 'LOW_LUMPED';
  if (isLine) {
    severity = Math.abs(gammaLoad) > 0.5 ? 'CRITICAL_REFLECTIONS' : 'MODERATE_TERMINATION_RECOMMENDED';
  }

  return {
    kneeFrequencyGhz: Number(fKnee.toFixed(3)),
    criticalLengthMm: Number(lCrit.toFixed(1)),
    isTransmissionLineBehavior: isLine,
    reflectionCoefficientLoad: Number(gammaLoad.toFixed(3)),
    recommendedTerminationOhms: Number(rTerm.toFixed(1)),
    riskSeverity: severity,
  };
}

/** 47. Via Current + Thermal Analysis */
export function analyzeViaCurrentAndThermal(
  drillDiameterMm: number,
  boardThicknessMm: number,
  operatingCurrentAmps: number,
  parallelViaCount: number = 1
): {
  singleViaResistanceMilliohms: number;
  arrayResistanceMilliohms: number;
  viaCurrentMargin: EngineeringMargin;
} {
  if (drillDiameterMm <= 0 || boardThicknessMm <= 0 || parallelViaCount < 1) {
    throw new Error('Drill diameter, board thickness, and via count must be positive.');
  }

  const drillM = drillDiameterMm * 1e-3;
  const padM = drillM * 2;
  const thickM = boardThicknessMm * 1e-3;

  // Reuse Phase 08 via properties engine
  const vSingle = calculateViaProperties({
    drillDiameterMeters: drillM,
    padDiameterMeters: padM,
    boardThicknessMeters: thickM,
  });

  const rSingle = vSingle.outputs.resistanceOhms;
  const singleAmpacity = vSingle.outputs.estimatedAmpacityAmps;

  // Reuse Phase 08 via array engine
  const vArray = calculateViaArray({
    singleViaProperties: {
      resistanceOhms: rSingle,
      thermalResistanceKPerW: vSingle.outputs.thermalResistanceKPerW,
      estimatedAmpacityAmps: singleAmpacity,
      drillDiameterMeters: drillM,
    },
    targetCurrentAmps: operatingCurrentAmps,
  });

  const rArray = vArray.outputs.arrayResistanceOhms;
  const arrayAmpacity = singleAmpacity * parallelViaCount * 0.85;

  const margin = globalTraceabilityRegister.createMargin(
    'Via Array Current Capability',
    operatingCurrentAmps,
    arrayAmpacity,
    'A',
    'higher_is_better'
  );

  return {
    singleViaResistanceMilliohms: Number((rSingle * 1000).toFixed(2)),
    arrayResistanceMilliohms: Number((rArray * 1000).toFixed(2)),
    viaCurrentMargin: margin,
  };
}

/** 48. PCB Clearance & Creepage Workflow */
export function analyzePcbClearanceCreepage(
  peakVoltageVolts: number,
  layerType: 'internal' | 'external_uncoated' | 'external_coated' = 'external_uncoated',
  pollutionDegree: 1 | 2 | 3 = 2
): {
  recommendedClearanceMm: number;
  recommendedCreepageMm: number;
  standardReference: string;
} {
  // Reuse Phase 08 clearance/creepage engine
  const clRes = calculateClearanceAndCreepage({
    standard: 'IPC_2221B',
    voltagePeakOrDc: peakVoltageVolts,
    location: layerType,
    pollutionDegree,
  });

  return {
    recommendedClearanceMm: clRes.outputs.minimumClearanceMm,
    recommendedCreepageMm: clRes.outputs.minimumCreepageMm,
    standardReference: 'IPC-2221B Table 6-1 & IEC 60664-1 (Engineering estimates; formal safety listing requires laboratory Hi-Pot verification)',
  };
}

/** 49, 50. PCB Design Margin Analysis & Engineering Summary */
export function generatePcbEngineeringSummary(
  traceMargin: EngineeringMargin,
  viaMargin: EngineeringMargin,
  impedanceMargin: EngineeringMargin
): {
  isPcbDesignCompliant: boolean;
  summaryText: string;
} {
  const isOk = traceMargin.isSatisfied && viaMargin.isSatisfied;
  const text = `PCB Summary: Trace Ampacity Margin = ${traceMargin.marginPercent}% (${traceMargin.statusText}), Via Array Margin = ${viaMargin.marginPercent}% (${viaMargin.statusText}), Impedance Deviation = ${impedanceMargin.marginAbsolute} Ω.`;

  return {
    isPcbDesignCompliant: isOk,
    summaryText: text,
  };
}
