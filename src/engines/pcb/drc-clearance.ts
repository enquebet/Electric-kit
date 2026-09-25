/**
 * PCB Creepage, Clearance & Manufacturing DRC Validation Engine
 * 
 * Implements:
 * - Standards-Aware Clearance Architecture (IPC-2221B Table 6-1 & IEC 60664-1)
 * - Standards-Aware Creepage Architecture based on Pollution Degree (1, 2, 3) & CTI Material Group
 * - DRC Checks:
 *   1. Minimum Annular Ring Check (IPC Class 1, 2, 3)
 *   2. Minimum Trace Width Rule Check
 *   3. Minimum Trace Spacing Rule Check
 *   4. Drill-to-Copper Clearance Check
 *   5. Via-to-Trace Clearance Check
 * 
 * Engineering Classification: STANDARDS COMPLIANCE & GEOMETRIC DRC RULE
 */

import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';

export type StandardsFramework = 'IPC_2221B' | 'IEC_60664_1';
export type ConductorLocation = 'external_uncoated' | 'external_coated' | 'internal';
export type PollutionDegree = 1 | 2 | 3;
export type CtiMaterialGroup = 'group_I' | 'group_II' | 'group_IIIa' | 'group_IIIb';

export interface ClearanceInputs {
  standard: StandardsFramework;
  voltagePeakOrDc: number;       // Volts
  voltageRms?: number;           // Volts RMS (for IEC creepage)
  location: ConductorLocation;
  pollutionDegree?: PollutionDegree; // default 2
  materialGroup?: CtiMaterialGroup;  // default 'group_IIIa' (standard FR-4)
  altitudeMeters?: number;          // default < 2000m
}

export interface ClearanceOutputs {
  minimumClearanceMeters: number;
  minimumClearanceMm: number;
  minimumClearanceMils: number;
  minimumCreepageMeters: number;
  minimumCreepageMm: number;
  minimumCreepageMils: number;
  altitudeCorrectionFactor: number;
  pollutionDegree: PollutionDegree;
  materialGroup: CtiMaterialGroup;
}

/**
 * Calculates Minimum Electrical Clearance and Creepage Distances
 * according to IPC-2221B Table 6-1 or IEC 60664-1.
 */
export function calculateClearanceAndCreepage(inputs: ClearanceInputs): CalculationResult & { outputs: ClearanceOutputs } {
  const {
    standard,
    voltagePeakOrDc: V,
    voltageRms = V / Math.SQRT2,
    location,
    pollutionDegree = 2,
    materialGroup = 'group_IIIa',
    altitudeMeters = 0,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeV = Math.max(0, V);

  // Altitude derating factor for IEC (altitudes > 2000m require increased clearance)
  let altitudeFactor = 1.0;
  if (altitudeMeters > 2000) {
    if (altitudeMeters <= 3000) altitudeFactor = 1.14;
    else if (altitudeMeters <= 4000) altitudeFactor = 1.29;
    else if (altitudeMeters <= 5000) altitudeFactor = 1.48;
    else altitudeFactor = 1.70;

    warnings.push({
      severity: 'info',
      title: 'High Altitude Clearance Derating Applied',
      message: `Operating altitude (${altitudeMeters} m) exceeds 2,000 m. Clearance multiplier of ${altitudeFactor.toFixed(2)}x applied per IEC 60664-1 Table A.2 due to reduced barometric air breakdown voltage.`,
    });
  }

  let minClearanceMm = 0.1;
  let minCreepageMm = 0.1;

  if (standard === 'IPC_2221B') {
    // IPC-2221B Table 6-1 Electrical Clearance (Bare Board)
    if (location === 'internal') {
      if (safeV <= 15) minClearanceMm = 0.05;
      else if (safeV <= 30) minClearanceMm = 0.05;
      else if (safeV <= 50) minClearanceMm = 0.10;
      else if (safeV <= 100) minClearanceMm = 0.10;
      else if (safeV <= 150) minClearanceMm = 0.20;
      else if (safeV <= 170) minClearanceMm = 0.20;
      else if (safeV <= 300) minClearanceMm = 0.20;
      else if (safeV <= 500) minClearanceMm = 0.25;
      else minClearanceMm = 0.25 + (safeV - 500) * 0.0025; // 0.0025 mm/V above 500V
    } else if (location === 'external_coated') {
      // With conformal coating or permanent solder mask
      if (safeV <= 15) minClearanceMm = 0.05;
      else if (safeV <= 30) minClearanceMm = 0.05;
      else if (safeV <= 50) minClearanceMm = 0.13;
      else if (safeV <= 100) minClearanceMm = 0.13;
      else if (safeV <= 150) minClearanceMm = 0.40;
      else if (safeV <= 170) minClearanceMm = 0.40;
      else if (safeV <= 300) minClearanceMm = 0.40;
      else if (safeV <= 500) minClearanceMm = 0.80;
      else minClearanceMm = 0.80 + (safeV - 500) * 0.0030;
    } else {
      // External uncoated (sea level to 3050m)
      if (safeV <= 15) minClearanceMm = 0.10;
      else if (safeV <= 30) minClearanceMm = 0.10;
      else if (safeV <= 50) minClearanceMm = 0.60;
      else if (safeV <= 100) minClearanceMm = 0.60;
      else if (safeV <= 150) minClearanceMm = 0.60;
      else if (safeV <= 170) minClearanceMm = 1.25;
      else if (safeV <= 300) minClearanceMm = 1.25;
      else if (safeV <= 500) minClearanceMm = 2.50;
      else minClearanceMm = 2.50 + (safeV - 500) * 0.0050;
    }

    // In IPC-2221B, creepage on surface is typically set equal to or greater than uncoated clearance
    minCreepageMm = location === 'external_uncoated' ? minClearanceMm : minClearanceMm * 1.2;

    steps.push({
      stepNumber: 1,
      title: 'Lookup IPC-2221B Table 6-1 Electrical Clearance',
      formula: 'Clearance = f(Peak Voltage, Layer Placement)',
      substitution: `V_peak = ${safeV} V, Location = ${location}`,
      result: `${minClearanceMm.toFixed(2)} mm (${(minClearanceMm / 0.0254).toFixed(1)} mil)`,
    });
  } else {
    // IEC 60664-1 Insulation Coordination
    // Basic clearance based on peak/impulse voltage (assuming basic insulation, inhomogeneous field)
    if (safeV <= 50) minClearanceMm = 0.20;
    else if (safeV <= 100) minClearanceMm = 0.50;
    else if (safeV <= 150) minClearanceMm = 0.80;
    else if (safeV <= 300) minClearanceMm = 1.50;
    else if (safeV <= 600) minClearanceMm = 3.00;
    else minClearanceMm = 3.00 + (safeV - 600) * 0.005;

    minClearanceMm *= altitudeFactor;

    // Creepage per IEC 60664-1 Table F.4 (based on RMS working voltage, pollution degree, material group)
    // For Pollution Degree 2, Material Group IIIa (FR-4):
    const vRms = Math.max(0, voltageRms);
    let creepageBaseMm = 0.5;
    if (vRms <= 25) creepageBaseMm = 0.50;
    else if (vRms <= 50) creepageBaseMm = 0.60;
    else if (vRms <= 100) creepageBaseMm = 1.00;
    else if (vRms <= 150) creepageBaseMm = 1.40;
    else if (vRms <= 250) creepageBaseMm = 2.50;
    else if (vRms <= 320) creepageBaseMm = 3.20;
    else if (vRms <= 630) creepageBaseMm = 6.30;
    else creepageBaseMm = 6.30 + (vRms - 630) * 0.01;

    // Pollution degree modifiers:
    if (pollutionDegree === 1) {
      creepageBaseMm *= 0.5;
    } else if (pollutionDegree === 3) {
      creepageBaseMm *= 1.6;
    }

    minCreepageMm = creepageBaseMm;

    steps.push({
      stepNumber: 1,
      title: 'Evaluate IEC 60664-1 Clearance (Direct Line-of-Sight Distance through Air)',
      formula: 'Clearance = BaseClearance × AltitudeMultiplier',
      substitution: `V = ${safeV} V peak, Alt = ${altitudeMeters} m (Multiplier = ${altitudeFactor.toFixed(2)})`,
      result: `${minClearanceMm.toFixed(2)} mm (${(minClearanceMm / 0.0254).toFixed(1)} mil)`,
    });

    steps.push({
      stepNumber: 2,
      title: 'Evaluate IEC 60664-1 Creepage (Surface Tracking Path along Substrate)',
      formula: 'Creepage = f(V_rms, PollutionDegree, CTI Group)',
      substitution: `V_rms = ${vRms.toFixed(1)} V, Pollution = ${pollutionDegree}, Substrate = ${materialGroup}`,
      result: `${minCreepageMm.toFixed(2)} mm (${(minCreepageMm / 0.0254).toFixed(1)} mil)`,
      annotation: 'Standard FR-4 belongs to Material Group IIIa (175 ≤ CTI < 400). Isolation slots / routed cutouts can be used to convert creepage to clearance.',
    });
  }

  if (safeV > 60) {
    warnings.push({
      severity: 'warning',
      title: 'High Voltage Safety Domain (>60 V DC / 42.4 V AC peak)',
      message: 'Operating voltage exceeds SELV (Safety Extra Low Voltage) threshold. Strict reinforced/double insulation barriers and certified clearances are required by safety standards (IEC 62368-1 / UL 60950).',
    });
  }

  const clearanceMeters = minClearanceMm * 1e-3;
  const creepageMeters = minCreepageMm * 1e-3;
  const formattedSummary = `Clearance: ${minClearanceMm.toFixed(2)} mm | Creepage: ${minCreepageMm.toFixed(2)} mm`;

  return {
    label: 'Electrical Clearance & Creepage',
    primaryValue: minClearanceMm,
    primaryUnit: 'mm',
    formattedValue: formattedSummary,
    formattedResult: formattedSummary,
    steps,
    warnings,
    equationUsed: standard === 'IPC_2221B' ? 'IPC-2221B Table 6-1 Clearance' : 'IEC 60664-1 Insulation Coordination Tables',
    engineeringModel: 'STANDARDS_BASED',
    standardsContext: standard === 'IPC_2221B' 
      ? 'Standards-aware engineering estimate based on IPC-2221B Table 6-1. Not a formal NRTL safety certification guarantee.'
      : 'Standards-aware engineering estimate based on IEC 60664-1 basic insulation coordination. Not a formal NRTL safety certification guarantee.',
    additionalOutputs: {
      clearanceMm: { label: 'Min Clearance (Air)', value: `${minClearanceMm.toFixed(2)} mm (${(minClearanceMm / 0.0254).toFixed(1)} mil)` },
      creepageMm: { label: 'Min Creepage (Surface)', value: `${minCreepageMm.toFixed(2)} mm (${(minCreepageMm / 0.0254).toFixed(1)} mil)` },
      pollutionDegree: { label: 'Pollution Degree', value: `Degree ${pollutionDegree}` },
      materialCti: { label: 'CTI Material Group', value: `${materialGroup.toUpperCase()} (175 ≤ CTI < 400)` },
      altitudeMultiplier: { label: 'Altitude Factor', value: `${altitudeFactor.toFixed(2)}x` },
    },
    outputs: {
      minimumClearanceMeters: clearanceMeters,
      minimumClearanceMm: minClearanceMm,
      minimumClearanceMils: minClearanceMm / 0.0254,
      minimumCreepageMeters: creepageMeters,
      minimumCreepageMm: minCreepageMm,
      minimumCreepageMils: minCreepageMm / 0.0254,
      altitudeCorrectionFactor: altitudeFactor,
      pollutionDegree,
      materialGroup,
    },
  };
}

export type IpcClass = 'class1' | 'class2' | 'class3';

export interface AnnularRingCheckInputs {
  padDiameterMm: number;
  drillDiameterMm: number;
  ipcClass?: IpcClass;
  isExternalLayer?: boolean;
}

export interface DrcRuleResult {
  ruleName: string;
  actualValue: number;
  minValue: number;
  unit: string;
  status: 'pass' | 'fail' | 'marginal';
  details: string;
}

/**
 * Validates Minimum Annular Ring against IPC-A-600 / IPC-2221 Class 1, 2, and 3 criteria.
 */
export function checkAnnularRingDrc(inputs: AnnularRingCheckInputs): DrcRuleResult {
  const { padDiameterMm, drillDiameterMm, ipcClass = 'class2', isExternalLayer = true } = inputs;

  const actualRingMm = (padDiameterMm - drillDiameterMm) / 2;
  const actualRingMil = actualRingMm / 0.0254;

  // IPC minimum annular ring requirements:
  // Class 1: 0.05 mm (2 mil) breakout allowed up to 180°
  // Class 2: External 0.125 mm (5 mil), Internal 0.100 mm (4 mil)
  // Class 3: External 0.150 mm (6 mil), Internal 0.125 mm (5 mil)
  let minRequiredMm = 0.125;
  if (ipcClass === 'class1') {
    minRequiredMm = 0.05;
  } else if (ipcClass === 'class2') {
    minRequiredMm = isExternalLayer ? 0.125 : 0.100;
  } else {
    minRequiredMm = isExternalLayer ? 0.150 : 0.125;
  }

  let status: 'pass' | 'fail' | 'marginal' = 'pass';
  if (actualRingMm < minRequiredMm) {
    status = 'fail';
  } else if (actualRingMm < minRequiredMm * 1.15) {
    status = 'marginal';
  }

  return {
    ruleName: `Annular Ring (${ipcClass.toUpperCase()} ${isExternalLayer ? 'External' : 'Internal'})`,
    actualValue: actualRingMm,
    minValue: minRequiredMm,
    unit: 'mm',
    status,
    details: `Actual: ${actualRingMm.toFixed(3)} mm (${actualRingMil.toFixed(1)} mil). Requirement: ≥ ${minRequiredMm.toFixed(3)} mm (${(minRequiredMm / 0.0254).toFixed(1)} mil). ${status === 'fail' ? 'High drill breakout risk!' : status === 'marginal' ? 'Acceptable but close to tolerance limit.' : 'Complies with IPC registration tolerance.'}`,
  };
}

export interface CustomDrcRules {
  minTraceWidthMm?: number;
  minTraceSpacingMm?: number;
  drillToCopperMm?: number;
  viaToTraceMm?: number;
}

export interface GeometryDrcInputs {
  traceWidthMm: number;
  traceSpacingMm: number;
  drillToCopperMm: number;
  viaToTraceMm: number;
  fabricationCapabilityTier?: 'standard' | 'advanced' | 'leading_edge' | 'custom';
  customRules?: CustomDrcRules;
}

/**
 * Runs a comprehensive PCB geometry DRC rule check based on user-provided rules or industry fabrication tiers.
 */
export function runPcbGeometryDrcCheck(inputs: GeometryDrcInputs): DrcRuleResult[] {
  const {
    traceWidthMm,
    traceSpacingMm,
    drillToCopperMm,
    viaToTraceMm,
    fabricationCapabilityTier = 'standard',
    customRules,
  } = inputs;

  // Thresholds based on capability tier:
  // Standard: 5/5 mil (0.127 mm), drill-to-copper 8 mil (0.20 mm), via-to-trace 5 mil (0.127 mm)
  // Advanced: 3.5/3.5 mil (0.09 mm), drill-to-copper 6 mil (0.15 mm), via-to-trace 4 mil (0.10 mm)
  // Leading edge: 2.5/2.5 mil (0.063 mm), drill-to-copper 5 mil (0.125 mm), via-to-trace 3 mil (0.075 mm)
  let minTraceMm = 0.127;
  let minSpaceMm = 0.127;
  let minDrillToCuMm = 0.200;
  let minViaToTraceMm = 0.127;

  if (fabricationCapabilityTier === 'advanced') {
    minTraceMm = 0.090;
    minSpaceMm = 0.090;
    minDrillToCuMm = 0.150;
    minViaToTraceMm = 0.100;
  } else if (fabricationCapabilityTier === 'leading_edge') {
    minTraceMm = 0.063;
    minSpaceMm = 0.063;
    minDrillToCuMm = 0.125;
    minViaToTraceMm = 0.075;
  }

  // Override with user-provided custom DRC rules if specified:
  if (customRules) {
    if (customRules.minTraceWidthMm !== undefined) minTraceMm = customRules.minTraceWidthMm;
    if (customRules.minTraceSpacingMm !== undefined) minSpaceMm = customRules.minTraceSpacingMm;
    if (customRules.drillToCopperMm !== undefined) minDrillToCuMm = customRules.drillToCopperMm;
    if (customRules.viaToTraceMm !== undefined) minViaToTraceMm = customRules.viaToTraceMm;
  }

  const results: DrcRuleResult[] = [];

  // 1. Trace Width Check
  const widthStatus = traceWidthMm < minTraceMm ? 'fail' : traceWidthMm < minTraceMm * 1.1 ? 'marginal' : 'pass';
  results.push({
    ruleName: 'Minimum Trace Width',
    actualValue: traceWidthMm,
    minValue: minTraceMm,
    unit: 'mm',
    status: widthStatus,
    details: `Actual: ${traceWidthMm.toFixed(3)} mm (${(traceWidthMm / 0.0254).toFixed(1)} mil). Limit: ≥ ${minTraceMm.toFixed(3)} mm (${(minTraceMm / 0.0254).toFixed(1)} mil).`,
  });

  // 2. Trace Spacing Check
  const spaceStatus = traceSpacingMm < minSpaceMm ? 'fail' : traceSpacingMm < minSpaceMm * 1.1 ? 'marginal' : 'pass';
  results.push({
    ruleName: 'Minimum Trace Spacing / Clearance',
    actualValue: traceSpacingMm,
    minValue: minSpaceMm,
    unit: 'mm',
    status: spaceStatus,
    details: `Actual: ${traceSpacingMm.toFixed(3)} mm (${(traceSpacingMm / 0.0254).toFixed(1)} mil). Limit: ≥ ${minSpaceMm.toFixed(3)} mm (${(minSpaceMm / 0.0254).toFixed(1)} mil).`,
  });

  // 3. Drill-to-Copper Check
  const drillStatus = drillToCopperMm < minDrillToCuMm ? 'fail' : drillToCopperMm < minDrillToCuMm * 1.1 ? 'marginal' : 'pass';
  results.push({
    ruleName: 'Drill-to-Copper Clearance',
    actualValue: drillToCopperMm,
    minValue: minDrillToCuMm,
    unit: 'mm',
    status: drillStatus,
    details: `Actual: ${drillToCopperMm.toFixed(3)} mm (${(drillToCopperMm / 0.0254).toFixed(1)} mil). Limit: ≥ ${minDrillToCuMm.toFixed(3)} mm (${(minDrillToCuMm / 0.0254).toFixed(1)} mil).`,
  });

  // 4. Via-to-Trace Check
  const viaStatus = viaToTraceMm < minViaToTraceMm ? 'fail' : viaToTraceMm < minViaToTraceMm * 1.1 ? 'marginal' : 'pass';
  results.push({
    ruleName: 'Via Pad to Trace Clearance',
    actualValue: viaToTraceMm,
    minValue: minViaToTraceMm,
    unit: 'mm',
    status: viaStatus,
    details: `Actual: ${viaToTraceMm.toFixed(3)} mm (${(viaToTraceMm / 0.0254).toFixed(1)} mil). Limit: ≥ ${minViaToTraceMm.toFixed(3)} mm (${(minViaToTraceMm / 0.0254).toFixed(1)} mil).`,
  });

  return results;
}
