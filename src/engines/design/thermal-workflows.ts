/**
 * ElectroKit — Phase 12 Engineering Design, System Analysis & Workflows
 * Module C: Thermal System Design Workflows (Capabilities 21 - 30)
 *
 * Orchestrates:
 * - Phase 10 Thermal Fundamentals & Semiconductor Chains
 * - Phase 10 Heatsink & Enclosure Models
 * - Phase 08 / Phase 10 PCB Thermal dissipation
 */

import { EngineeringMargin, WorkflowWarning } from './types';
import { globalTraceabilityRegister } from './traceability';
import {
  calculateSeriesThermalResistance,
  calculateJunctionTemperature,
  calculateMaxAllowablePower,
  calculateSealedEnclosureTemp,
} from '../thermal';

export interface HeatSourceItem {
  id: string;
  name: string;
  category: 'converter' | 'semiconductor' | 'resistor' | 'pcb' | 'battery' | 'other';
  dissipationWatts: number;
}

export interface SystemThermalBudgetResult {
  heatSources: Array<HeatSourceItem & { percentageOfTotal: number }>;
  totalHeatDissipatedWatts: number;
  categoryTotals: Record<string, number>;
}

/** 21, 22. System Thermal Budget & Component Heat-Source Aggregation */
export function calculateSystemThermalBudget(sources: HeatSourceItem[]): SystemThermalBudgetResult {
  if (sources.length === 0) throw new Error('At least one heat source is required.');

  let totalW = 0;
  const catTotals: Record<string, number> = {};

  sources.forEach((s) => {
    if (s.dissipationWatts < 0) throw new Error('Dissipated power cannot be negative.');
    totalW += s.dissipationWatts;
    catTotals[s.category] = (catTotals[s.category] ?? 0) + s.dissipationWatts;
  });

  const detailed = sources.map((s) => ({
    ...s,
    percentageOfTotal: totalW > 0 ? Number(((s.dissipationWatts / totalW) * 100).toFixed(1)) : 0,
  }));

  return {
    heatSources: detailed,
    totalHeatDissipatedWatts: Number(totalW.toFixed(3)),
    categoryTotals: catTotals,
  };
}

export interface ThermalResistanceChainInput {
  powerWatts: number;
  ambientTempC: number;
  rThetaJc: number; // Junction to Case (°C/W)
  rThetaCs: number; // Case to Sink (TIM) (°C/W)
  rThetaSa: number; // Sink to Ambient (°C/W)
  maxJunctionTempC?: number;
}

/** 23, 24. Junction-to-Ambient Thermal Chain & Network Builder */
export function calculateJunctionToAmbientChain(input: ThermalResistanceChainInput): {
  rThetaTotal: number;
  junctionTempC: number;
  caseTempC: number;
  sinkTempC: number;
  maxPowerWatts: number;
  thermalMargin: EngineeringMargin;
} {
  const { powerWatts, ambientTempC, rThetaJc, rThetaCs, rThetaSa } = input;
  const maxTj = input.maxJunctionTempC ?? 150;

  if (rThetaJc < 0 || rThetaCs < 0 || rThetaSa < 0) {
    throw new Error('Thermal resistances cannot be negative.');
  }

  // Reuse Phase 10 series thermal resistance primitive
  const rSeries = calculateSeriesThermalResistance(
    [
      { id: 'jc', name: 'Junction-to-Case', resistanceKW: rThetaJc },
      { id: 'cs', name: 'Case-to-Sink', resistanceKW: rThetaCs },
      { id: 'sa', name: 'Sink-to-Ambient', resistanceKW: rThetaSa },
    ],
    powerWatts
  );
  const rTotal = rSeries.totalResistanceKW;

  // Reuse Phase 10 semiconductor thermal engine
  const jtResult = calculateJunctionTemperature({
    ambientTempC,
    powerDissipationWatts: powerWatts,
    rthJcKW: rThetaJc,
    rthCsKW: rThetaCs,
    rthSaKW: rThetaSa,
    maxJunctionTempC: maxTj,
  });

  const sinkTemp = ambientTempC + powerWatts * rThetaSa;
  const caseTemp = sinkTemp + powerWatts * rThetaCs;
  const juncTemp = jtResult.junctionTempC;

  const maxP = calculateMaxAllowablePower(maxTj, ambientTempC, rTotal).maxPowerWatts;

  const tMargin = globalTraceabilityRegister.createMargin(
    'Junction Temperature Headroom',
    maxTj,
    juncTemp,
    '°C',
    'lower_is_better'
  );

  return {
    rThetaTotal: Number(rTotal.toFixed(3)),
    junctionTempC: Number(juncTemp.toFixed(2)),
    caseTempC: Number(caseTemp.toFixed(2)),
    sinkTempC: Number(sinkTemp.toFixed(2)),
    maxPowerWatts: Number(maxP.toFixed(2)),
    thermalMargin: tMargin,
  };
}

/** 25. Heat-Sink Requirement Workflow */
export function calculateHeatSinkRequirement(
  powerWatts: number,
  ambientTempC: number,
  maxJunctionTempC: number,
  rThetaJc: number,
  rThetaCs: number
): { requiredSinkResistance: number; isFeasible: boolean; warningNote?: string } {
  if (powerWatts <= 0) throw new Error('Power must be strictly positive.');
  const rJaMax = (maxJunctionTempC - ambientTempC) / powerWatts;
  const rSaReq = rJaMax - (rThetaJc + rThetaCs);
  const isFeasible = rSaReq > 0;

  return {
    requiredSinkResistance: Number(rSaReq.toFixed(3)),
    isFeasible,
    warningNote: isFeasible
      ? undefined
      : 'Required heatsink resistance is non-positive: junction-to-case and case-to-sink thermal resistance alone exceeds the allowable thermal budget.',
  };
}

/** 26. Enclosure Thermal Budget */
export function calculateEnclosureThermalBudget(
  enclosureHeatLoadWatts: number,
  surfaceAreaM2: number,
  heatTransferCoeffWm2K: number = 5.5,
  ambientTempC: number = 25.0
): { internalAirTempC: number; deltaTempC: number; formula: string } {
  if (enclosureHeatLoadWatts < 0 || surfaceAreaM2 <= 0 || heatTransferCoeffWm2K <= 0) {
    throw new Error('Heat load >= 0, surface area > 0, heat transfer coefficient > 0 required.');
  }

  // Reuse Phase 10 enclosure calculation primitive
  const encRes = calculateSealedEnclosureTemp(
    enclosureHeatLoadWatts,
    ambientTempC,
    surfaceAreaM2,
    heatTransferCoeffWm2K
  );

  return {
    internalAirTempC: encRes.internalAirTempC,
    deltaTempC: encRes.deltaTC,
    formula: 'T_{int} = T_a + \\frac{P}{U · A}',
  };
}

export interface PcbThermalItem {
  id: string;
  name: string;
  traceLossWatts: number;
  componentLossWatts: number;
  viaLossWatts: number;
}

/** 27. PCB Thermal Budget */
export function calculatePcbThermalBudget(
  boardAreaCm2: number,
  items: PcbThermalItem[]
): { totalPcbHeatWatts: number; heatFluxWattsPerCm2: number; pcbThermalDensity: string } {
  if (boardAreaCm2 <= 0) throw new Error('Board area must be strictly positive.');

  let totalW = 0;
  items.forEach((item) => {
    totalW += item.traceLossWatts + item.componentLossWatts + item.viaLossWatts;
  });

  const flux = totalW / boardAreaCm2;
  let density = 'LOW_PASSIVE_AIR';
  if (flux > 0.5) density = 'EXTREME_FORCED_OR_CONDUCTION_PLANE_REQUIRED';
  else if (flux > 0.15) density = 'MODERATE_HEATSINK_OR_VIAS_REQUIRED';

  return {
    totalPcbHeatWatts: Number(totalW.toFixed(3)),
    heatFluxWattsPerCm2: Number(flux.toFixed(4)),
    pcbThermalDensity: density,
  };
}

export interface WorstCaseThermalInput {
  maxAmbientTempC: number;
  maxOperatingPowerWatts: number;
  rThetaJaMax: number;
  maxJunctionTempC: number;
}

/** 28, 29. Worst-Case Thermal Analysis & Thermal Margin Analysis */
export function analyzeWorstCaseThermal(input: WorstCaseThermalInput): {
  worstCaseJunctionTempC: number;
  thermalMargin: EngineeringMargin;
  allowablePowerAtMaxAmbientWatts: number;
  warnings: WorkflowWarning[];
} {
  const { maxAmbientTempC, maxOperatingPowerWatts, rThetaJaMax, maxJunctionTempC } = input;
  if (rThetaJaMax <= 0 || maxOperatingPowerWatts < 0) {
    throw new Error('Thermal resistance must be > 0 and power >= 0.');
  }

  const worstTj = maxAmbientTempC + maxOperatingPowerWatts * rThetaJaMax;
  const allowableP = Math.max(0, (maxJunctionTempC - maxAmbientTempC) / rThetaJaMax);

  const margin = globalTraceabilityRegister.createMargin(
    'Worst-Case Junction Headroom',
    maxJunctionTempC,
    worstTj,
    '°C',
    'lower_is_better'
  );

  const warnings: WorkflowWarning[] = [];
  if (!margin.isSatisfied) {
    warnings.push({
      id: 'warn-therm-worst-case-exceeded',
      severity: 'critical',
      category: 'thermal',
      message: `Worst-case junction temperature (${worstTj.toFixed(1)}°C) exceeds rated limit (${maxJunctionTempC}°C).`,
      remedyHint: 'Increase heat sink thermal mass, enhance airflow CFM, or derate operating power.',
      requiresHardwareValidation: true,
    });
  } else if (margin.statusText === 'TIGHT_MARGIN') {
    warnings.push({
      id: 'warn-therm-tight-headroom',
      severity: 'warning',
      category: 'thermal',
      message: `Thermal margin is tight (${margin.marginAbsolute}°C headroom). Hot spot or ambient fluctuations may breach rating.`,
      requiresHardwareValidation: true,
    });
  }

  return {
    worstCaseJunctionTempC: Number(worstTj.toFixed(2)),
    thermalMargin: margin,
    allowablePowerAtMaxAmbientWatts: Number(allowableP.toFixed(2)),
    warnings,
  };
}

/** 30. Thermal Design Summary */
export function generateThermalDesignSummary(
  budget: SystemThermalBudgetResult,
  chain: { junctionTempC: number; rThetaTotal: number },
  margin: EngineeringMargin,
  warnings: WorkflowWarning[]
): {
  totalHeatWatts: number;
  peakJunctionTempC: number;
  isThermalDesignSatisfied: boolean;
  summaryText: string;
} {
  const isOk = margin.isSatisfied && !warnings.some((w) => w.severity === 'critical');
  const text = `Thermal Design Summary: Total Heat = ${budget.totalHeatDissipatedWatts} W. Peak Tj = ${chain.junctionTempC} °C (R_th = ${chain.rThetaTotal} °C/W). Headroom Margin = ${margin.marginAbsolute} °C. Status = ${margin.statusText}.`;

  return {
    totalHeatWatts: budget.totalHeatDissipatedWatts,
    peakJunctionTempC: chain.junctionTempC,
    isThermalDesignSatisfied: isOk,
    summaryText: text,
  };
}
