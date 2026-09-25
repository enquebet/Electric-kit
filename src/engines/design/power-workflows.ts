/**
 * ElectroKit — Phase 12 Engineering Design, System Analysis & Workflows
 * Module B: Power System Design Workflows (Capabilities 11 - 20)
 *
 * Orchestrates:
 * - Phase 01 / Phase 03 Power & Circuit Models
 * - Phase 05 Power Conversion & Efficiency Models
 * - Phase 11 Energy Storage Models
 */

import { EngineeringMargin } from './types';
import { globalTraceabilityRegister } from './traceability';
import { calculateElectricalPower } from '../circuit/power';

export interface PowerLoadItem {
  id: string;
  name: string;
  voltageRailVolts: number;
  nominalCurrentAmps: number;
  peakCurrentAmps?: number;
  dutyCycleFraction?: number; // 0 to 1
}

export interface DcPowerBudgetResult {
  totalLoadCurrentAmps: number;
  equivalentSupplyCurrentAmps: number;
  totalLoadPowerWatts: number;
  loadContributions: Array<{
    id: string;
    name: string;
    powerWatts: number;
    currentAmps: number;
    percentageOfTotal: number;
  }>;
  availableSupplyPowerWatts: number;
  powerMargin: EngineeringMargin;
}

/** 11. DC Power Budget */
export function calculateDcPowerBudget(
  loads: PowerLoadItem[],
  supplyVoltageVolts: number,
  supplyMaxPowerWatts: number
): DcPowerBudgetResult {
  if (supplyVoltageVolts <= 0 || supplyMaxPowerWatts <= 0) {
    throw new Error('Supply voltage and maximum power must be strictly positive.');
  }
  if (loads.length === 0) throw new Error('At least one load is required.');

  let totalI = 0;
  let totalP = 0;

  const contributions = loads.map((load) => {
    if (load.nominalCurrentAmps < 0) throw new Error('Load current cannot be negative.');
    const pVal = load.voltageRailVolts * load.nominalCurrentAmps;
    
    totalI += load.nominalCurrentAmps;
    totalP += pVal;

    return {
      id: load.id,
      name: load.name,
      powerWatts: Number(pVal.toFixed(3)),
      currentAmps: load.nominalCurrentAmps,
      percentageOfTotal: 0,
    };
  });

  contributions.forEach((c) => {
    c.percentageOfTotal = totalP > 0 ? Number(((c.powerWatts / totalP) * 100).toFixed(1)) : 0;
  });

  const equivalentSupplyI = totalP / supplyVoltageVolts;

  const margin = globalTraceabilityRegister.createMargin(
    'DC Supply Power',
    totalP,
    supplyMaxPowerWatts,
    'W',
    'higher_is_better'
  );

  return {
    totalLoadCurrentAmps: Number(totalI.toFixed(3)),
    equivalentSupplyCurrentAmps: Number(equivalentSupplyI.toFixed(3)),
    totalLoadPowerWatts: Number(totalP.toFixed(3)),
    loadContributions: contributions,
    availableSupplyPowerWatts: supplyMaxPowerWatts,
    powerMargin: margin,
  };
}

export interface PowerRailDefinition {
  railId: string;
  voltageVolts: number;
  maxCurrentCapacityAmps: number;
  converterEfficiencyPercent?: number; // e.g. 92%
}

export interface MultiRailResult {
  rails: Array<{
    railId: string;
    voltageVolts: number;
    totalCurrentAmps: number;
    peakCurrentAmps: number;
    totalPowerWatts: number;
    converterInputPowerWatts: number;
    utilizationPercent: number;
    margin: EngineeringMargin;
  }>;
  aggregateSystemPowerWatts: number;
  aggregateConverterInputWatts: number;
  overallEfficiencyPercent: number;
}

/** 12, 13, 14. Multi-Rail Power Budget & Aggregation */
export function calculateMultiRailPowerBudget(
  rails: PowerRailDefinition[],
  loads: PowerLoadItem[]
): MultiRailResult {
  if (rails.length === 0) throw new Error('At least one power rail is required.');

  let totalOutWatts = 0;
  let totalInWatts = 0;

  const railResults = rails.map((rail) => {
    if (rail.voltageVolts <= 0 || rail.maxCurrentCapacityAmps <= 0) {
      throw new Error('Rail voltage and current capacity must be positive.');
    }
    const railLoads = loads.filter((l) => Math.abs(l.voltageRailVolts - rail.voltageVolts) < 0.05);

    let railI = 0;
    let railPeakI = 0;
    let railP = 0;

    railLoads.forEach((l) => {
      railI += l.nominalCurrentAmps;
      railPeakI += l.peakCurrentAmps ?? l.nominalCurrentAmps;
      railP += l.voltageRailVolts * l.nominalCurrentAmps;
    });

    const eff = (rail.converterEfficiencyPercent ?? 90) / 100;
    if (eff <= 0 || eff > 1.0) throw new Error('Efficiency must be between 0 and 100%.');

    const inputP = railP / eff;
    totalOutWatts += railP;
    totalInWatts += inputP;

    const util = (railI / rail.maxCurrentCapacityAmps) * 100;
    const margin = globalTraceabilityRegister.createMargin(
      `Rail ${rail.railId} Current Capacity`,
      railI,
      rail.maxCurrentCapacityAmps,
      'A',
      'higher_is_better'
    );

    return {
      railId: rail.railId,
      voltageVolts: rail.voltageVolts,
      totalCurrentAmps: Number(railI.toFixed(3)),
      peakCurrentAmps: Number(railPeakI.toFixed(3)),
      totalPowerWatts: Number(railP.toFixed(3)),
      converterInputPowerWatts: Number(inputP.toFixed(3)),
      utilizationPercent: Number(util.toFixed(1)),
      margin,
    };
  });

  const overallEff = totalInWatts > 0 ? (totalOutWatts / totalInWatts) * 100 : 100;

  return {
    rails: railResults,
    aggregateSystemPowerWatts: Number(totalOutWatts.toFixed(3)),
    aggregateConverterInputWatts: Number(totalInWatts.toFixed(3)),
    overallEfficiencyPercent: Number(overallEff.toFixed(2)),
  };
}

/** 15. Input Power Estimation */
export function estimateInputPower(
  outputPowerWatts: number,
  converterEfficiencyPercent: number
): { inputPowerWatts: number; dissipatedLossWatts: number; formula: string } {
  if (outputPowerWatts < 0) throw new Error('Output power must be non-negative.');
  const eta = converterEfficiencyPercent / 100;
  if (eta <= 0 || eta > 1.0) throw new Error('Efficiency must be in (0, 100%].');

  const pIn = outputPowerWatts / eta;
  const pLoss = pIn - outputPowerWatts;

  return {
    inputPowerWatts: Number(pIn.toFixed(3)),
    dissipatedLossWatts: Number(pLoss.toFixed(3)),
    formula: 'P_{in} = P_{out} / η | P_{loss} = P_{in} - P_{out}',
  };
}

export interface ConverterStage {
  stageId: string;
  name: string;
  inputVoltageVolts: number;
  outputVoltageVolts: number;
  efficiencyPercent: number;
  outputPowerWatts: number;
}

export interface ConverterLossChainResult {
  stages: Array<{
    stageId: string;
    name: string;
    inputPowerWatts: number;
    outputPowerWatts: number;
    lossWatts: number;
    efficiencyPercent: number;
  }>;
  totalSystemInputPowerWatts: number;
  totalSystemDeliveredPowerWatts: number;
  totalSystemLossWatts: number;
  cascadedEfficiencyPercent: number;
  cascadedSeriesInputPowerWatts: number;
  formula: string;
}

/** 16, 17. Converter Loss Chain & Total System Cascaded Efficiency */
export function calculateConverterLossChain(
  stages: ConverterStage[],
  finalLoadPowerWatts?: number
): ConverterLossChainResult {
  if (stages.length === 0) throw new Error('At least one converter stage is required.');

  let totalLoss = 0;
  let currentP = 0;
  let cascadedEff = 1.0;

  const stageResults = stages.map((s) => {
    const eta = s.efficiencyPercent / 100;
    if (eta <= 0 || eta > 1.0) throw new Error('Stage efficiency must be in (0, 100%].');
    if (s.outputPowerWatts < 0) throw new Error('Output power must be non-negative.');

    const pIn = s.outputPowerWatts / eta;
    const pLoss = pIn - s.outputPowerWatts;

    totalLoss += pLoss;
    currentP += s.outputPowerWatts;
    cascadedEff *= eta;

    return {
      stageId: s.stageId,
      name: s.name,
      inputPowerWatts: Number(pIn.toFixed(3)),
      outputPowerWatts: Number(s.outputPowerWatts.toFixed(3)),
      lossWatts: Number(pLoss.toFixed(3)),
      efficiencyPercent: s.efficiencyPercent,
    };
  });

  const totalIn = currentP + totalLoss;
  const loadForCascade = finalLoadPowerWatts ?? stages[stages.length - 1].outputPowerWatts;
  const seriesInWatts = cascadedEff > 0 ? loadForCascade / cascadedEff : 0;

  return {
    stages: stageResults,
    totalSystemInputPowerWatts: Number(totalIn.toFixed(3)),
    totalSystemDeliveredPowerWatts: Number(currentP.toFixed(3)),
    totalSystemLossWatts: Number(totalLoss.toFixed(3)),
    cascadedEfficiencyPercent: Number((cascadedEff * 100).toFixed(2)),
    cascadedSeriesInputPowerWatts: Number(seriesInWatts.toFixed(3)),
    formula: 'η_{total} = \\prod_{i} η_i | P_{in,tot} = \\sum P_{in,i} | P_{in,cascade} = P_{load} / η_{total}',
  };
}

export interface BatteryToLoadChainInput {
  batteryNominalVoltage: number;
  batteryCapacityAh: number;
  converterEfficiencyPercent: number;
  distributionEfficiencyPercent?: number;
  loadPowerWatts: number;
  runtimeTargetHours: number;
}

/** 18. Battery-to-Load Energy Chain */
export function calculateBatteryToLoadChain(input: BatteryToLoadChainInput): {
  batteryGrossEnergyWh: number;
  converterLossWh: number;
  distributionLossWh: number;
  deliveredLoadEnergyWh: number;
  energyMargin: EngineeringMargin;
  achievableRuntimeHours: number;
} {
  const { batteryNominalVoltage, batteryCapacityAh, converterEfficiencyPercent, loadPowerWatts, runtimeTargetHours } = input;
  const etaDist = (input.distributionEfficiencyPercent ?? 98) / 100;
  const etaConv = converterEfficiencyPercent / 100;

  if (batteryNominalVoltage <= 0 || batteryCapacityAh <= 0 || loadPowerWatts <= 0 || runtimeTargetHours <= 0) {
    throw new Error('All battery, load, and runtime values must be strictly positive.');
  }
  if (etaConv <= 0 || etaConv > 1.0 || etaDist <= 0 || etaDist > 1.0) {
    throw new Error('Efficiencies must be in (0, 100%].');
  }

  const grossWh = batteryNominalVoltage * batteryCapacityAh;
  const sysEff = etaConv * etaDist;
  const usableWh = grossWh * sysEff;

  const requiredWh = loadPowerWatts * runtimeTargetHours;
  const convLoss = grossWh * (1 - etaConv);
  const distLoss = (grossWh - convLoss) * (1 - etaDist);

  const achievableHours = usableWh / loadPowerWatts;
  const margin = globalTraceabilityRegister.createMargin(
    'Delivered Battery Energy',
    requiredWh,
    usableWh,
    'Wh',
    'higher_is_better'
  );

  return {
    batteryGrossEnergyWh: Number(grossWh.toFixed(2)),
    converterLossWh: Number(convLoss.toFixed(2)),
    distributionLossWh: Number(distLoss.toFixed(2)),
    deliveredLoadEnergyWh: Number(usableWh.toFixed(2)),
    energyMargin: margin,
    achievableRuntimeHours: Number(achievableHours.toFixed(2)),
  };
}

/** 19, 20. Peak vs Continuous Power Analysis & Power Budget Margin Analysis */
export function analyzePeakVsContinuousPower(
  continuousLoadWatts: number,
  peakLoadWatts: number,
  sourceContinuousRatingWatts: number,
  sourcePeakRatingWatts: number
): {
  continuousMargin: EngineeringMargin;
  peakMargin: EngineeringMargin;
  peakToContinuousRatio: number;
  status: 'SATISFIED' | 'PEAK_LIMIT_EXCEEDED' | 'CONTINUOUS_LIMIT_EXCEEDED';
} {
  if (sourceContinuousRatingWatts <= 0 || sourcePeakRatingWatts <= 0) {
    throw new Error('Source ratings must be strictly positive.');
  }

  const contMargin = globalTraceabilityRegister.createMargin(
    'Continuous Power',
    continuousLoadWatts,
    sourceContinuousRatingWatts,
    'W',
    'higher_is_better'
  );

  const peakMargin = globalTraceabilityRegister.createMargin(
    'Peak Power',
    peakLoadWatts,
    sourcePeakRatingWatts,
    'W',
    'higher_is_better'
  );

  let status: 'SATISFIED' | 'PEAK_LIMIT_EXCEEDED' | 'CONTINUOUS_LIMIT_EXCEEDED' = 'SATISFIED';
  if (!contMargin.isSatisfied) status = 'CONTINUOUS_LIMIT_EXCEEDED';
  else if (!peakMargin.isSatisfied) status = 'PEAK_LIMIT_EXCEEDED';

  return {
    continuousMargin: contMargin,
    peakMargin,
    peakToContinuousRatio: continuousLoadWatts > 0 ? Number((peakLoadWatts / continuousLoadWatts).toFixed(2)) : 0,
    status,
  };
}
