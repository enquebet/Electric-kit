/**
 * ElectroKit — Phase 13 Engineering Workspace
 * Deterministic Calculation Snapshot Orchestrator
 *
 * Core Principle: "Workspace orchestrates. Engines calculate."
 * Re-evaluates pinned calculation snapshots using real locked Phase 01–12 engines.
 */

import { CalculationSnapshot, ValidationStatus } from './types';
import {
  calculateDcPowerBudget,
  calculateMultiRailPowerBudget,
  calculateConverterLossChain,
  PowerLoadItem,
  PowerRailDefinition,
  ConverterStage,
} from '../engines/design/power-workflows';
import {
  calculateJunctionToAmbientChain,
  calculateEnclosureThermalBudget,
} from '../engines/design/thermal-workflows';
import {
  calculateBatteryToLoadSizing,
  analyzeBatteryPackRequirements,
} from '../engines/design/battery-workflows';
import {
  analyzePcbPowerIntegrity,
  analyzeControlledImpedance,
  analyzeTraceCurrentAndThermal,
  analyzeSignalIntegrityRisk,
  analyzePcbClearanceCreepage,
} from '../engines/design/pcb-workflows';

export function createSnapshotFromCalculation(params: {
  toolSlug: string;
  engineId: string;
  name: string;
  category: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  assumptions?: any[];
  warnings?: any[];
  margins?: any[];
  formulaSnippet?: string;
  notes?: string;
}): CalculationSnapshot {
  const timestamp = new Date().toISOString();
  const id = 'snap_' + Math.random().toString(36).substring(2, 9);

  return {
    id,
    calculationId: id,
    toolSlug: params.toolSlug,
    engineId: params.engineId,
    name: params.name,
    category: params.category,
    timestamp,
    inputs: JSON.parse(JSON.stringify(params.inputs)),
    outputs: JSON.parse(JSON.stringify(params.outputs)),
    assumptions: params.assumptions ? JSON.parse(JSON.stringify(params.assumptions)) : [],
    warnings: params.warnings ? JSON.parse(JSON.stringify(params.warnings)) : [],
    margins: params.margins ? JSON.parse(JSON.stringify(params.margins)) : [],
    validationStatus: 'Calculated',
    formulaSnippet: params.formulaSnippet,
    notes: params.notes,
  };
}

export function recalculateSnapshot(
  snapshot: CalculationSnapshot,
  overrides?: Record<string, any>
): CalculationSnapshot {
  const mergedInputs = { ...snapshot.inputs, ...(overrides || {}) };
  let outputs: Record<string, any> = { ...snapshot.outputs };
  let margins = [...snapshot.margins];
  let assumptions = [...snapshot.assumptions];
  let warnings = [...snapshot.warnings];

  try {
    switch (snapshot.engineId) {
      case 'dc-power-budget': {
        const supplyV = Number(mergedInputs.supplyVoltageVolts ?? 12);
        const supplyP = Number(mergedInputs.supplyMaxPowerWatts ?? 50);
        const loads: PowerLoadItem[] = Array.isArray(mergedInputs.loads)
          ? mergedInputs.loads.map((l: any, i: number) => ({
              id: l.id || `load_${i}`,
              name: l.name || `Load ${i + 1}`,
              voltageRailVolts: Number(l.voltageRailVolts ?? supplyV),
              nominalCurrentAmps: Number(l.nominalCurrentAmps ?? 1.0),
              peakCurrentAmps: l.peakCurrentAmps ? Number(l.peakCurrentAmps) : undefined,
            }))
          : [
              {
                id: 'l1',
                name: 'Core System',
                voltageRailVolts: supplyV,
                nominalCurrentAmps: 2.0,
              },
            ];

        const res = calculateDcPowerBudget(loads, supplyV, supplyP);
        outputs = {
          totalLoadCurrentAmps: res.totalLoadCurrentAmps,
          equivalentSupplyCurrentAmps: res.equivalentSupplyCurrentAmps,
          totalLoadPowerWatts: res.totalLoadPowerWatts,
          availableSupplyPowerWatts: res.availableSupplyPowerWatts,
        };
        margins = [res.powerMargin];
        break;
      }

      case 'multi-rail-budget': {
        const rails: PowerRailDefinition[] = Array.isArray(mergedInputs.rails)
          ? mergedInputs.rails
          : [
              { railId: 'rail_5v', voltageVolts: 5.0, maxCurrentCapacityAmps: 3.0 },
              { railId: 'rail_3v3', voltageVolts: 3.3, maxCurrentCapacityAmps: 1.5 },
            ];
        const loads: PowerLoadItem[] = Array.isArray(mergedInputs.loads)
          ? mergedInputs.loads
          : [
              { id: 'l1', name: '5V Load', voltageRailVolts: 5.0, nominalCurrentAmps: 1.5 },
              { id: 'l2', name: '3.3V Core', voltageRailVolts: 3.3, nominalCurrentAmps: 0.8 },
            ];

        const res = calculateMultiRailPowerBudget(rails, loads);
        outputs = {
          aggregateSystemPowerWatts: res.aggregateSystemPowerWatts,
          aggregateConverterInputWatts: res.aggregateConverterInputWatts,
          overallEfficiencyPercent: res.overallEfficiencyPercent,
          rails: res.rails,
        };
        margins = res.rails.map((r) => r.margin);
        break;
      }

      case 'cascaded-converters': {
        const stages: ConverterStage[] = Array.isArray(mergedInputs.stages)
          ? mergedInputs.stages
          : [
              {
                stageId: 's1',
                name: 'Stage 1',
                inputVoltageVolts: 12,
                outputVoltageVolts: 5,
                efficiencyPercent: 92,
                outputPowerWatts: 15,
              },
            ];
        const res = calculateConverterLossChain(
          stages,
          mergedInputs.finalLoadPowerWatts !== undefined
            ? Number(mergedInputs.finalLoadPowerWatts)
            : undefined
        );
        outputs = {
          totalSystemInputPowerWatts: res.totalSystemInputPowerWatts,
          totalSystemDeliveredPowerWatts: res.totalSystemDeliveredPowerWatts,
          totalSystemLossWatts: res.totalSystemLossWatts,
          cascadedEfficiencyPercent: res.cascadedEfficiencyPercent,
          cascadedSeriesInputPowerWatts: res.cascadedSeriesInputPowerWatts,
        };
        break;
      }

      case 'thermal-junction-chain': {
        const res = calculateJunctionToAmbientChain({
          powerWatts: Number(mergedInputs.powerWatts ?? 3.5),
          ambientTempC: Number(mergedInputs.ambientTempC ?? 35),
          rThetaJc: Number(mergedInputs.rThetaJc ?? 1.2),
          rThetaCs: Number(mergedInputs.rThetaCs ?? 0.5),
          rThetaSa: Number(mergedInputs.rThetaSa ?? 6.0),
          maxJunctionTempC: Number(mergedInputs.maxJunctionTempC ?? 125),
        });
        outputs = {
          rThetaTotal: res.rThetaTotal,
          junctionTempC: res.junctionTempC,
          caseTempC: res.caseTempC,
          sinkTempC: res.sinkTempC,
          maxPowerWatts: res.maxPowerWatts,
        };
        margins = [res.thermalMargin];
        break;
      }

      case 'enclosure-thermal': {
        const res = calculateEnclosureThermalBudget(
          Number(mergedInputs.internalDissipationWatts ?? 15),
          Number(mergedInputs.surfaceAreaM2 ?? 0.08),
          Number(mergedInputs.heatTransferCoefficientW_m2K ?? 8),
          Number(mergedInputs.ambientTempC ?? 30)
        );
        outputs = {
          internalAirTempC: res.internalAirTempC,
          deltaTempC: res.deltaTempC,
          formula: res.formula,
        };
        break;
      }

      case 'battery-to-load': {
        const res = calculateBatteryToLoadSizing({
          dailyLoadWh: Number(mergedInputs.dailyLoadWh ?? 40),
          autonomyDays: Number(mergedInputs.autonomyDays ?? 2.0),
          converterEfficiencyPercent: Number(mergedInputs.converterEfficiencyPercent ?? 90),
          distributionEfficiencyPercent: Number(mergedInputs.distributionEfficiencyPercent ?? 98),
          maxDodPercent: Number(mergedInputs.maxDodPercent ?? 80),
          temperatureDeratingFactor: Number(mergedInputs.temperatureDeratingFactor ?? 0.95),
          eolCapacityRetentionPercent: Number(mergedInputs.eolCapacityRetentionPercent ?? 80),
          systemNominalVoltage: Number(mergedInputs.systemNominalVoltage ?? 12),
        });
        outputs = {
          deliveredLoadEnergyWh: res.deliveredLoadEnergyWh,
          grossRequiredStorageWh: res.grossRequiredStorageWh,
          grossRequiredStorageKwh: res.grossRequiredStorageKwh,
          requiredBatteryCapacityAh: res.requiredBatteryCapacityAh,
          systemEfficiencyPercent: res.systemEfficiencyPercent,
        };
        break;
      }

      case 'battery-pack-sizing': {
        const res = analyzeBatteryPackRequirements(
          Number(mergedInputs.targetVoltage ?? 48),
          Number(mergedInputs.targetCapacityAh ?? 20),
          Number(mergedInputs.targetContinuousCurrentAmps ?? 15),
          String(mergedInputs.cellTypeKey ?? 'molicel_p42a_21700')
        );
        outputs = {
          recommendedConfig: res.recommendedConfig,
          seriesCount: res.seriesCount,
          parallelCount: res.parallelCount,
          totalCells: res.totalCells,
          actualNominalVoltage: res.actualNominalVoltage,
          actualCapacityAh: res.actualCapacityAh,
          actualContinuousCurrentAmps: res.actualContinuousCurrentAmps,
          packWeightKg: res.packWeightKg,
        };
        break;
      }

      case 'pdn-target-impedance': {
        const res = analyzePcbPowerIntegrity({
          railVoltageVolts: Number(mergedInputs.railVoltageVolts ?? 1.2),
          maxTransientCurrentAmps: Number(mergedInputs.maxTransientCurrentAmps ?? 2.0),
          maxRipplePercent: Number(mergedInputs.maxRipplePercent ?? 3.0),
          switchingFrequencyHz: Number(mergedInputs.switchingFrequencyHz ?? 500000),
        });
        outputs = {
          allowedRippleVolts: res.allowedRippleVolts,
          targetPdnImpedanceOhms: res.targetPdnImpedanceOhms,
          targetPdnImpedanceMilliohms: res.targetPdnImpedanceMilliohms,
          recommendedBulkCapacitanceUf: res.recommendedBulkCapacitanceUf,
        };
        margins = [res.pdnMargin];
        break;
      }

      case 'controlled-impedance': {
        const res = analyzeControlledImpedance({
          targetImpedanceOhms: Number(mergedInputs.targetImpedanceOhms ?? 50),
          traceWidthMm: Number(mergedInputs.traceWidthMm ?? 0.32),
          dielectricHeightMm: Number(mergedInputs.dielectricHeightMm ?? 0.18),
          dielectricConstantEr: Number(mergedInputs.dielectricConstantEr ?? 4.2),
          copperThicknessOz: Number(mergedInputs.copperThicknessOz ?? 1.0),
        });
        outputs = {
          characteristicImpedanceOhms: res.characteristicImpedanceOhms,
          effectivePermittivity: res.effectivePermittivity,
          propagationDelayPsPerMm: res.propagationDelayPsPerMm,
        };
        margins = [res.impedanceMargin];
        break;
      }

      case 'trace-ampacity-thermal': {
        const res = analyzeTraceCurrentAndThermal({
          traceWidthMm: Number(mergedInputs.traceWidthMm ?? 1.0),
          copperThicknessOz: Number(mergedInputs.copperThicknessOz ?? 1.0),
          traceLengthMm: Number(mergedInputs.traceLengthMm ?? 50),
          operatingCurrentAmps: Number(mergedInputs.operatingCurrentAmps ?? 2.0),
          ambientTempC: Number(mergedInputs.ambientTempC ?? 25),
        });
        outputs = {
          traceResistanceOhms: res.traceResistanceOhms,
          voltageDropVolts: res.voltageDropVolts,
          joulePowerLossWatts: res.joulePowerLossWatts,
          maxCurrentCapacityIpc2152Amps: res.maxCurrentCapacityIpc2152Amps,
        };
        margins = [res.traceCurrentMargin];
        break;
      }

      case 'signal-integrity-risk': {
        const res = analyzeSignalIntegrityRisk({
          signalRiseTimeNs: Number(mergedInputs.signalRiseTimeNs ?? 0.8),
          traceLengthMm: Number(mergedInputs.traceLengthMm ?? 75),
          characteristicZ0Ohms: Number(mergedInputs.characteristicZ0Ohms ?? 50),
          sourceImpedanceOhms: Number(mergedInputs.sourceImpedanceOhms ?? 20),
          loadImpedanceOhms: Number(mergedInputs.loadImpedanceOhms ?? 1e6),
        });
        outputs = {
          kneeFrequencyGhz: res.kneeFrequencyGhz,
          criticalLengthMm: res.criticalLengthMm,
          isTransmissionLineBehavior: res.isTransmissionLineBehavior,
          reflectionCoefficientLoad: res.reflectionCoefficientLoad,
          recommendedTerminationOhms: res.recommendedTerminationOhms,
          riskSeverity: res.riskSeverity,
        };
        break;
      }

      case 'clearance-creepage': {
        const res = analyzePcbClearanceCreepage(
          Number(mergedInputs.peakVoltageVolts ?? 48),
          mergedInputs.layerType ?? 'external_uncoated',
          mergedInputs.pollutionDegree ?? 2
        );
        outputs = {
          recommendedClearanceMm: res.recommendedClearanceMm,
          recommendedCreepageMm: res.recommendedCreepageMm,
          standardReference: res.standardReference,
        };
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`Recalculation error in ${snapshot.engineId}:`, err);
  }

  return {
    ...snapshot,
    inputs: mergedInputs,
    outputs,
    margins,
    assumptions,
    warnings,
    timestamp: new Date().toISOString(),
  };
}

export function updateValidationStatus(
  snapshot: CalculationSnapshot,
  status: ValidationStatus
): CalculationSnapshot {
  return {
    ...snapshot,
    validationStatus: status,
  };
}
