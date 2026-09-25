/**
 * ElectroKit — Phase 12 Engineering Design, System Analysis & Workflows
 * Module F: Engineering Design Review & System Design Report (Capabilities 51 - 60)
 */

import {
  EngineeringRequirement,
  EngineeringMargin,
  WorkflowWarning,
  SystemDesignReport,
  TraceabilityStep,
} from './types';
import { globalAssumptionRegister } from './assumptions';
import { globalWarningAggregator } from './warnings';
import { globalTraceabilityRegister } from './traceability';

export interface ElectricalReviewSummary {
  requirementsCount: number;
  satisfiedMarginsCount: number;
  violationsCount: number;
  criticalWarnings: WorkflowWarning[];
  overallElectricalStatus: 'SATISFIED' | 'MARGINAL' | 'NON_COMPLIANT';
}

/** 51. Electrical Design Review */
export function conductElectricalDesignReview(
  requirements: EngineeringRequirement[],
  margins: EngineeringMargin[]
): ElectricalReviewSummary {
  const violations = margins.filter((m) => !m.isSatisfied);
  const critical = globalWarningAggregator.getBySeverity('critical').filter((w) => w.category === 'electrical');

  let status: 'SATISFIED' | 'MARGINAL' | 'NON_COMPLIANT' = 'SATISFIED';
  if (violations.length > 0 || critical.length > 0) status = 'NON_COMPLIANT';
  else if (margins.some((m) => m.statusText === 'TIGHT_MARGIN')) status = 'MARGINAL';

  return {
    requirementsCount: requirements.filter((r) => r.category === 'electrical').length,
    satisfiedMarginsCount: margins.length - violations.length,
    violationsCount: violations.length,
    criticalWarnings: critical,
    overallElectricalStatus: status,
  };
}

/** 52. Power Design Review */
export function conductPowerDesignReview(
  systemPowerWatts: number,
  converterLossWatts: number,
  cascadedEfficiencyPercent: number,
  powerMargin: EngineeringMargin
): {
  systemEfficiencyRating: 'OPTIMAL' | 'ACCEPTABLE' | 'POOR';
  powerBalanceSummary: string;
  isPowerBudgetSatisfied: boolean;
} {
  const isSatisfied = powerMargin.isSatisfied;
  let rating: 'OPTIMAL' | 'ACCEPTABLE' | 'POOR' = 'ACCEPTABLE';
  if (cascadedEfficiencyPercent >= 92) rating = 'OPTIMAL';
  else if (cascadedEfficiencyPercent < 80) rating = 'POOR';

  const summary = `Delivered Load Power: ${systemPowerWatts} W | Converter Losses: ${converterLossWatts} W | Cascaded Efficiency: ${cascadedEfficiencyPercent}% | Headroom Margin: ${powerMargin.marginPercent}% (${powerMargin.statusText})`;

  return {
    systemEfficiencyRating: rating,
    powerBalanceSummary: summary,
    isPowerBudgetSatisfied: isSatisfied,
  };
}

/** 53. Thermal Design Review */
export function conductThermalDesignReview(
  totalHeatWatts: number,
  peakJunctionTempC: number,
  maxAllowableJunctionTempC: number,
  thermalHeadroomC: number
): {
  thermalRiskLevel: 'SAFE_CONSERVATIVE' | 'MODERATE_MONITORED' | 'HAZARDOUS_OVERHEAT';
  summaryRemarks: string;
} {
  let risk: 'SAFE_CONSERVATIVE' | 'MODERATE_MONITORED' | 'HAZARDOUS_OVERHEAT' = 'SAFE_CONSERVATIVE';
  if (peakJunctionTempC > maxAllowableJunctionTempC) {
    risk = 'HAZARDOUS_OVERHEAT';
  } else if (thermalHeadroomC < 15) {
    risk = 'MODERATE_MONITORED';
  }

  return {
    thermalRiskLevel: risk,
    summaryRemarks: `Total Heat: ${totalHeatWatts}W | Peak Tj: ${peakJunctionTempC}°C (Max ${maxAllowableJunctionTempC}°C) | Headroom: ${thermalHeadroomC}°C | Risk Level: ${risk}`,
  };
}

/** 54. Battery Design Review */
export function conductBatteryDesignReview(
  packConfig: string,
  nominalEnergyWh: number,
  autonomyHours: number,
  eolReservePercent: number,
  energyMargin: EngineeringMargin
): {
  packSuitability: 'MISSION_CAPABLE' | 'MARGINAL_AUTONOMY' | 'DEFICIENT_ENERGY';
  summaryText: string;
} {
  let suitability: 'MISSION_CAPABLE' | 'MARGINAL_AUTONOMY' | 'DEFICIENT_ENERGY' = 'MISSION_CAPABLE';
  if (!energyMargin.isSatisfied) suitability = 'DEFICIENT_ENERGY';
  else if (energyMargin.statusText === 'TIGHT_MARGIN' || eolReservePercent < 10) suitability = 'MARGINAL_AUTONOMY';

  return {
    packSuitability: suitability,
    summaryText: `Pack: ${packConfig} (${nominalEnergyWh}Wh) | Autonomy: ${autonomyHours}h | EOL Reserve: ${eolReservePercent}% | Margin: ${energyMargin.marginPercent}%`,
  };
}

/** 55. PCB Design Review */
export function conductPcbDesignReview(
  traceMargins: EngineeringMargin[],
  impedanceDeviationOhms: number,
  clearanceSatisfied: boolean
): {
  pcbReadiness: 'READY_FOR_FABRICATION_REVIEW' | 'REVISIONS_REQUIRED';
  traceabilityNotes: string;
} {
  const validMargins = traceMargins.filter((m): m is EngineeringMargin => Boolean(m));
  const traceOk = validMargins.length > 0 && validMargins.every((m) => m.isSatisfied);
  const zOk = Math.abs(impedanceDeviationOhms) <= 5.0; // standard 10% impedance tolerance
  const ready = traceOk && zOk && clearanceSatisfied;

  return {
    pcbReadiness: ready ? 'READY_FOR_FABRICATION_REVIEW' : 'REVISIONS_REQUIRED',
    traceabilityNotes: `Ampacity: ${traceOk ? 'PASS' : 'FAIL'} | Impedance Match: ${zOk ? 'PASS (±5Ω)' : 'FAIL'} | DRC Clearances: ${clearanceSatisfied ? 'PASS' : 'FAIL'}`,
  };
}

/** 56. Signal-Integrity Review */
export function conductSignalIntegrityReview(
  kneeFrequencyGhz: number,
  criticalLengthMm: number,
  actualTraceLengthMm: number,
  terminationRecommended: boolean
): {
  siRiskScore: 'LOW_LUMPED_TRACE' | 'CONTROLLED_IMPEDANCE_MANDATED' | 'HIGH_REFLECTION_RISK';
  recommendations: string[];
} {
  const isLine = actualTraceLengthMm > criticalLengthMm;
  const recs: string[] = [];

  let score: 'LOW_LUMPED_TRACE' | 'CONTROLLED_IMPEDANCE_MANDATED' | 'HIGH_REFLECTION_RISK' = 'LOW_LUMPED_TRACE';
  if (isLine) {
    score = terminationRecommended ? 'HIGH_REFLECTION_RISK' : 'CONTROLLED_IMPEDANCE_MANDATED';
    recs.push(`Trace length (${actualTraceLengthMm}mm) exceeds critical length (${criticalLengthMm}mm). Transmission line modeling required.`);
    if (terminationRecommended) {
      recs.push('Source series termination damping resistor required to absorb reflections.');
    }
  } else {
    recs.push('Trace behaves as lumped electrical node; reflections negligible at operating edge rates.');
  }

  return {
    siRiskScore: score,
    recommendations: recs,
  };
}

export interface BuildSystemDesignReportInput {
  title: string;
  projectDescription: string;
  requirements: EngineeringRequirement[];
  margins: EngineeringMargin[];
  traceabilitySteps?: TraceabilityStep[];
}

/** 60. SYSTEM ENGINEERING DESIGN REPORT (Unified Workflow Synthesis) */
export function generateSystemEngineeringDesignReport(
  input: BuildSystemDesignReportInput
): SystemDesignReport {
  const { title, projectDescription, requirements, margins } = input;
  const warnings = globalWarningAggregator.getAll();
  const assumptions = globalAssumptionRegister.getAll();
  const trace = input.traceabilitySteps ?? globalTraceabilityRegister.getAll();

  const violatedMargins = margins.filter((m) => !m.isSatisfied);
  const criticalWarnings = warnings.filter((w) => w.severity === 'critical');
  const hwValidationRequired = warnings.filter((w) => w.requiresHardwareValidation === true);

  let overallStatus: SystemDesignReport['overallStatus'] = 'Validated calculation';

  if (violatedMargins.length > 0) {
    overallStatus = 'Requirement exceeds modeled capability';
  } else if (criticalWarnings.length > 0) {
    overallStatus = 'Requirement exceeds modeled capability';
  } else if (hwValidationRequired.length > 0) {
    overallStatus = 'Hardware validation required';
  } else if (margins.some((m) => m.statusText === 'TIGHT_MARGIN')) {
    overallStatus = 'Requirement satisfied by modeled inputs';
  }

  const remarks: string[] = [
    `Engineered Workflows Synthesized: ${requirements.length} requirements mapped across ${margins.length} design margins.`,
    `Assumptions Active: ${assumptions.length} registered engineering model assumptions.`,
    `Warnings Aggregated: ${warnings.length} (${criticalWarnings.length} critical, ${hwValidationRequired.length} requiring physical bench validation).`,
  ];

  return {
    title,
    projectDescription,
    requirements,
    margins,
    assumptions,
    warnings,
    traceability: trace,
    overallStatus,
    summaryRemarks: remarks,
  };
}
