/**
 * ElectroKit — Phase 12 Engineering Design, System Analysis & Workflows
 * Module D: Battery + Power System Workflows (Capabilities 31 - 40)
 *
 * Orchestrates:
 * - Phase 11 Battery Sizing, Pack Design, Discharge & Aging Models
 * - Phase 05 Power Conversion Efficiency
 * - Phase 10 Thermal Resistance & Heat Dissipation
 */

import { EngineeringMargin, WorkflowWarning } from './types';
import { globalTraceabilityRegister } from './traceability';
import {
  sizeEnergyStorage,
  designBatteryPack,
  POPULAR_CELL_PRESETS,
  CellSpecification,
  calculateConstantCurrentDischarge,
  calculateConstantPowerDischarge,
  calculateBatteryThermalPower,
} from '../batteries';

export interface BatteryToLoadSizingInput {
  dailyLoadWh: number;
  autonomyDays: number;
  converterEfficiencyPercent: number; // Phase 05 DC-DC or inverter stage
  distributionEfficiencyPercent?: number; // wiring / connectors
  maxDodPercent?: number; // Phase 11 DoD limit (e.g. 80%)
  temperatureDeratingFactor?: number; // e.g. 0.90 for cold weather
  eolCapacityRetentionPercent?: number; // e.g. 80% SOH at EOL
  systemNominalVoltage: number;
}

/** 31. Battery-to-Load Sizing Workflow */
export function calculateBatteryToLoadSizing(input: BatteryToLoadSizingInput): {
  deliveredLoadEnergyWh: number;
  grossRequiredStorageWh: number;
  grossRequiredStorageKwh: number;
  requiredBatteryCapacityAh: number;
  systemEfficiencyPercent: number;
  sizingBreakdown: {
    autonomyEnergyWh: number;
    afterConverterLossesWh: number;
    afterDodReserveWh: number;
    afterTempDeratingWh: number;
    afterEolReserveWh: number;
  };
} {
  const { dailyLoadWh, autonomyDays, converterEfficiencyPercent, systemNominalVoltage } = input;
  const etaDist = (input.distributionEfficiencyPercent ?? 98) / 100;
  const etaConv = converterEfficiencyPercent / 100;
  const dod = (input.maxDodPercent ?? 80) / 100;
  const tDerat = input.temperatureDeratingFactor ?? 0.95;
  const eol = (input.eolCapacityRetentionPercent ?? 80) / 100;

  if (dailyLoadWh <= 0 || autonomyDays <= 0 || systemNominalVoltage <= 0) {
    throw new Error('Daily load, autonomy days, and system voltage must be strictly positive.');
  }
  if (etaConv <= 0 || etaConv > 1.0 || etaDist <= 0 || etaDist > 1.0) {
    throw new Error('Efficiencies must be in (0, 100%].');
  }

  const sysEff = etaConv * etaDist;
  const rawAutonomyWh = dailyLoadWh * autonomyDays;
  const afterConvWh = rawAutonomyWh / sysEff;
  const afterDodWh = afterConvWh / dod;
  const afterTempWh = afterDodWh / tDerat;
  const finalGrossWh = afterTempWh / eol;

  // Verify against Phase 11 sizeEnergyStorage engine
  const essRes = sizeEnergyStorage({
    dailyEnergyConsumptionWh: dailyLoadWh,
    desiredAutonomyDays: autonomyDays,
    systemInverterEfficiencyPercent: Number((sysEff * 100).toFixed(2)),
    maxAllowedDepthOfDischargePercent: input.maxDodPercent ?? 80,
    temperatureDeratingFraction: tDerat,
    agingReserveMarginFraction: eol,
    systemNominalVoltage,
  });

  return {
    deliveredLoadEnergyWh: rawAutonomyWh,
    grossRequiredStorageWh: essRes.nominalNameplateEnergyRequiredWh,
    grossRequiredStorageKwh: essRes.nominalNameplateEnergyRequiredKwh,
    requiredBatteryCapacityAh: essRes.requiredBatteryCapacityAh,
    systemEfficiencyPercent: Number((sysEff * 100).toFixed(2)),
    sizingBreakdown: {
      autonomyEnergyWh: Number(rawAutonomyWh.toFixed(2)),
      afterConverterLossesWh: Number(afterConvWh.toFixed(2)),
      afterDodReserveWh: Number(afterDodWh.toFixed(2)),
      afterTempDeratingWh: Number(afterTempWh.toFixed(2)),
      afterEolReserveWh: Number(finalGrossWh.toFixed(2)),
    },
  };
}

/** 32. Battery Pack Requirement Analyzer */
export function analyzeBatteryPackRequirements(
  targetVoltage: number,
  targetCapacityAh: number,
  targetContinuousCurrentAmps: number,
  cellTypeKey: string = 'molicel_p42a_21700'
): {
  recommendedConfig: string;
  seriesCount: number;
  parallelCount: number;
  actualNominalVoltage: number;
  actualCapacityAh: number;
  actualContinuousCurrentAmps: number;
  totalCells: number;
  packWeightKg: number;
} {
  const cell: CellSpecification = POPULAR_CELL_PRESETS[cellTypeKey] ?? POPULAR_CELL_PRESETS['molicel_p42a_21700'];

  // Reuse Phase 11 pack designer
  const design = designBatteryPack({
    targetVoltage,
    targetCapacityAh,
    targetContinuousCurrentAmps,
    cell,
  });

  return {
    recommendedConfig: design.configurationString,
    seriesCount: design.seriesCount,
    parallelCount: design.parallelCount,
    actualNominalVoltage: design.actualNominalVoltage,
    actualCapacityAh: design.actualCapacityAh,
    actualContinuousCurrentAmps: design.maxContinuousDischargeAmps,
    totalCells: design.totalCellCount,
    packWeightKg: design.totalCellWeightKg,
  };
}

export interface RuntimeCurvePoint {
  loadWatts: number;
  loadCurrentAmps: number;
  runtimeHours: number;
  runtimeMinutes: number;
  deliveredEnergyWh: number;
}

/** 33. Runtime vs Load Analyzer */
export function analyzeRuntimeVsLoad(
  nominalCapacityAh: number,
  nominalVoltage: number,
  cutoffVoltage: number,
  loadLevelsWatts: number[]
): RuntimeCurvePoint[] {
  if (nominalCapacityAh <= 0 || nominalVoltage <= 0 || cutoffVoltage <= 0) {
    throw new Error('Capacity and voltages must be strictly positive.');
  }

  return loadLevelsWatts.map((pWatts) => {
    // Reuse Phase 11 constant-power discharge model
    const cp = calculateConstantPowerDischarge({
      nominalCapacityAh,
      nominalVoltage,
      cutoffVoltage,
      loadPowerWatts: pWatts,
    });

    return {
      loadWatts: pWatts,
      loadCurrentAmps: cp.averageCurrentAmps,
      runtimeHours: cp.estimatedRuntimeHours,
      runtimeMinutes: cp.estimatedRuntimeMinutes,
      deliveredEnergyWh: cp.deliveredEnergyWh,
    };
  });
}

/** 34. Peak Current Compatibility */
export function checkPeakCurrentCompatibility(
  batteryMaxPeakCurrentAmps: number,
  converterMaxPeakCurrentAmps: number,
  loadPeakCurrentAmps: number
): {
  batteryMargin: EngineeringMargin;
  converterMargin: EngineeringMargin;
  limitingComponent: 'BATTERY' | 'CONVERTER' | 'NONE';
  isCompatible: boolean;
} {
  const bMargin = globalTraceabilityRegister.createMargin(
    'Battery Peak Current Capability',
    loadPeakCurrentAmps,
    batteryMaxPeakCurrentAmps,
    'A',
    'higher_is_better'
  );

  const cMargin = globalTraceabilityRegister.createMargin(
    'Converter Peak Current Capability',
    loadPeakCurrentAmps,
    converterMaxPeakCurrentAmps,
    'A',
    'higher_is_better'
  );

  const isCompat = bMargin.isSatisfied && cMargin.isSatisfied;
  let limiting: 'BATTERY' | 'CONVERTER' | 'NONE' = 'NONE';
  if (batteryMaxPeakCurrentAmps < converterMaxPeakCurrentAmps) limiting = 'BATTERY';
  else if (converterMaxPeakCurrentAmps < batteryMaxPeakCurrentAmps) limiting = 'CONVERTER';

  return {
    batteryMargin: bMargin,
    converterMargin: cMargin,
    limitingComponent: limiting,
    isCompatible: isCompat,
  };
}

/** 35. Battery Voltage Compatibility */
export function checkBatteryVoltageCompatibility(
  batteryMinCutoffVoltage: number,
  batteryMaxChargeVoltage: number,
  converterMinInputVoltage: number,
  converterMaxInputVoltage: number
): {
  isCompatible: boolean;
  lowVoltageHeadroomVolts: number;
  highVoltageHeadroomVolts: number;
  warnings: WorkflowWarning[];
} {
  const lowHeadroom = batteryMinCutoffVoltage - converterMinInputVoltage;
  const highHeadroom = converterMaxInputVoltage - batteryMaxChargeVoltage;

  const warnings: WorkflowWarning[] = [];
  let isCompat = true;

  if (lowHeadroom < 0) {
    isCompat = false;
    warnings.push({
      id: 'warn-batt-under-voltage-incompatible',
      severity: 'critical',
      category: 'battery',
      message: `Battery cutoff voltage (${batteryMinCutoffVoltage}V) is lower than converter minimum input (${converterMinInputVoltage}V). Converter will shut down prematurely.`,
      requiresHardwareValidation: true,
    });
  }

  if (highHeadroom < 0) {
    isCompat = false;
    warnings.push({
      id: 'warn-batt-over-voltage-incompatible',
      severity: 'critical',
      category: 'battery',
      message: `Battery full charge voltage (${batteryMaxChargeVoltage}V) exceeds converter maximum input limit (${converterMaxInputVoltage}V), risking converter over-voltage damage.`,
      requiresHardwareValidation: true,
    });
  }

  return {
    isCompatible: isCompat,
    lowVoltageHeadroomVolts: Number(lowHeadroom.toFixed(2)),
    highVoltageHeadroomVolts: Number(highHeadroom.toFixed(2)),
    warnings,
  };
}

/** 36. Battery Thermal Load */
export function calculateBatteryThermalLoad(
  dischargeCurrentAmps: number,
  internalResistanceOhms: number,
  ambientTempC: number,
  thermalResistanceCellToAmbientCPerW: number
): {
  jouleLossWatts: number;
  totalHeatWatts: number;
  steadyStateCellTempC: number;
  temperatureRiseC: number;
} {
  // Reuse Phase 11 thermal power engine
  const pTherm = calculateBatteryThermalPower({
    currentAmps: dischargeCurrentAmps,
    internalResistanceOhms,
    cellTemperatureCelsius: ambientTempC,
  });

  const deltaT = pTherm.totalThermalPowerWatts * thermalResistanceCellToAmbientCPerW;
  const cellT = ambientTempC + deltaT;

  return {
    jouleLossWatts: pTherm.jouleHeatingWatts,
    totalHeatWatts: pTherm.totalThermalPowerWatts,
    steadyStateCellTempC: Number(cellT.toFixed(2)),
    temperatureRiseC: Number(deltaT.toFixed(2)),
  };
}

/** 37, 38. Battery Energy Margin & End-of-Life Capacity Analysis */
export function analyzeEolBatteryCapacity(
  nominalCapacityAh: number,
  nominalVoltage: number,
  currentSohPercent: number,
  requiredMissionEnergyWh: number,
  eolCutoffSohPercent: number = 80.0
): {
  nominalEnergyWh: number;
  currentAvailableEnergyWh: number;
  eolAvailableEnergyWh: number;
  eolEnergyMargin: EngineeringMargin;
  isMissionSatisfiedAtEol: boolean;
} {
  const nomWh = nominalCapacityAh * nominalVoltage;
  const currWh = nomWh * (currentSohPercent / 100);
  const eolWh = nomWh * (eolCutoffSohPercent / 100);

  const eolMargin = globalTraceabilityRegister.createMargin(
    'EOL Delivered Battery Energy',
    requiredMissionEnergyWh,
    eolWh,
    'Wh',
    'higher_is_better'
  );

  return {
    nominalEnergyWh: Number(nomWh.toFixed(2)),
    currentAvailableEnergyWh: Number(currWh.toFixed(2)),
    eolAvailableEnergyWh: Number(eolWh.toFixed(2)),
    eolEnergyMargin: eolMargin,
    isMissionSatisfiedAtEol: eolMargin.isSatisfied,
  };
}

export interface WorstCaseBatteryScenarioInput {
  nominalCapacityAh: number;
  nominalVoltage: number;
  operatingCurrentAmps: number;
  ambientTempC: number; // e.g. -10°C cold winter
  converterEfficiencyPercent: number; // e.g. 90%
  eolSohPercent?: number; // e.g. 80%
  dodLimitPercent?: number; // e.g. 80%
}

/** 39. Worst-Case Battery Scenario */
export function analyzeWorstCaseBatteryScenario(input: WorstCaseBatteryScenarioInput): {
  effectiveDeliveredCapacityAh: number;
  effectiveDeliveredEnergyWh: number;
  estimatedRuntimeHours: number;
  deratingFactorsApplied: {
    tempFactor: number;
    sohFactor: number;
    dodFactor: number;
    converterFactor: number;
  };
  warnings: WorkflowWarning[];
} {
  const { nominalCapacityAh, nominalVoltage, operatingCurrentAmps, ambientTempC, converterEfficiencyPercent } = input;
  const eol = (input.eolSohPercent ?? 80) / 100;
  const dod = (input.dodLimitPercent ?? 80) / 100;
  const etaConv = converterEfficiencyPercent / 100;

  // Temperature capacity derating rule from Phase 11
  let fTemp = 1.0;
  if (ambientTempC < 0) {
    fTemp = Math.max(0.2, 0.80 - (0 - ambientTempC) * 0.02);
  } else if (ambientTempC < 25) {
    fTemp = 1.0 - (25 - ambientTempC) * 0.008;
  }

  const netCapAh = nominalCapacityAh * eol * dod * fTemp;
  const netEnergyWh = netCapAh * nominalVoltage * etaConv;
  const runtimeH = operatingCurrentAmps > 0 ? netCapAh / operatingCurrentAmps : 0;

  const warnings: WorkflowWarning[] = [];
  if (ambientTempC < 0) {
    warnings.push({
      id: 'warn-subzero-discharge-degradation',
      severity: 'warning',
      category: 'battery',
      message: `Sub-zero temperature (${ambientTempC}°C) significantly restricts electrolyte mobility, reducing usable capacity to ${(fTemp * 100).toFixed(1)}%.`,
      requiresHardwareValidation: true,
    });
  }

  return {
    effectiveDeliveredCapacityAh: Number(netCapAh.toFixed(3)),
    effectiveDeliveredEnergyWh: Number(netEnergyWh.toFixed(2)),
    estimatedRuntimeHours: Number(runtimeH.toFixed(2)),
    deratingFactorsApplied: {
      tempFactor: Number(fTemp.toFixed(3)),
      sohFactor: Number(eol.toFixed(2)),
      dodFactor: Number(dod.toFixed(2)),
      converterFactor: Number(etaConv.toFixed(2)),
    },
    warnings,
  };
}

/** 40. Battery System Design Summary */
export function generateBatterySystemDesignSummary(
  packConfig: string,
  packVoltage: number,
  packCapacityAh: number,
  runtimeHours: number,
  margin: EngineeringMargin
): {
  summaryText: string;
  isPackCompatible: boolean;
} {
  const isOk = margin.isSatisfied;
  const text = `Battery Design Summary: Configuration = ${packConfig}, Nominal Voltage = ${packVoltage}V, Capacity = ${packCapacityAh}Ah. Mission Runtime = ${runtimeHours} hrs. Design Margin = ${margin.marginPercent}% (${margin.statusText}).`;

  return {
    summaryText: text,
    isPackCompatible: isOk,
  };
}
