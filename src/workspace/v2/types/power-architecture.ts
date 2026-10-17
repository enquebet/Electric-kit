/**
 * ElectroKit V2 — Wave 04: System Power Architecture Data Model
 * Extends the V2 Engineering Object Model to represent power sources,
 * conversion stages, power rails, loads, sequencing, and system power flows.
 */

export type PowerSourceType =
  | 'dc_input'
  | 'ac_mains'
  | 'battery'
  | 'external_adapter'
  | 'usb_power'
  | 'internal_generator'
  | 'solar_pv'
  | 'other';

export type PowerSourceStatus = 'active' | 'standby' | 'fault' | 'offline';

export interface PowerSourceV2 {
  id: string; // psrc_...
  name: string; // e.g. "Main 24V DC Supply", "USB-C PD 20V", "Li-Ion 4S Battery"
  sourceType: PowerSourceType;
  nominalVoltage: number;
  minVoltage: number;
  maxVoltage: number;
  availableCurrentAmps: number;
  availablePowerWatts: number;
  sourceImpedanceOhms?: number;
  outputRailId?: string; // rail_...
  associatedComponentId?: string; // comp_...
  status: PowerSourceStatus;
  requirements?: string[]; // req_...
  references?: string[]; // ref_...
  operatingConditions?: string;
  notes?: string;
}

export type PowerLoadPriority =
  | 'critical'
  | 'essential'
  | 'standard'
  | 'non_essential'
  | 'sheddable';

export type PowerLoadOperatingState =
  | 'sleep'
  | 'idle'
  | 'nominal'
  | 'peak'
  | 'active';

export interface PowerLoadV2 {
  id: string; // load_...
  name: string; // e.g. "MCU Core & Digital Subsystem", "5.8 GHz RF Power Amplifier"
  componentId?: string; // comp_... (links to Component inventory)
  subsystemId?: string; // subsys_...
  railId: string; // rail_... (which power rail supplies this load)
  nominalVoltage: number;
  minVoltage?: number;
  maxVoltage?: number;
  nominalCurrentAmps: number;
  minCurrentAmps?: number;
  maxCurrentAmps?: number;
  startupCurrentAmps?: number;
  peakCurrentAmps?: number;
  dutyCycleFraction?: number; // 0.0 to 1.0
  nominalPowerWatts: number;
  peakPowerWatts?: number;
  operatingState?: PowerLoadOperatingState;
  priority: PowerLoadPriority;
  enableDependencyId?: string; // rail_... or seq_...
  notes?: string;
}

export type PowerSequencingDependencyType =
  | 'power_good'
  | 'enable'
  | 'delay'
  | 'reset_release';

export interface PowerSequencingRuleV2 {
  id: string; // seq_...
  name: string; // e.g. "3V3 before 1V8 Core Sequence"
  predecessorRailId: string; // rail_...
  successorRailId: string; // rail_...
  dependencyType: PowerSequencingDependencyType;
  delayMilliSeconds?: number;
  requiredPredecessorVoltagePercent?: number; // e.g. 90%
  notes?: string;
}

export type PowerAnalysisStatus = 'PASS' | 'MARGINAL' | 'FAIL';

export interface RailAnalysisResult {
  railId: string;
  railName: string;
  nominalVoltage: number;
  minVoltage: number;
  maxVoltage: number;
  voltageStatus: PowerAnalysisStatus;
  voltageIssues: string[];
  totalNominalCurrentAmps: number;
  totalPeakCurrentAmps: number;
  availableCurrentAmps: number;
  currentHeadroomAmps: number;
  currentUtilizationPercent: number;
  currentStatus: PowerAnalysisStatus;
  totalPowerWatts: number;
  powerLimitWatts?: number;
  powerHeadroomWatts?: number;
  powerUtilizationPercent?: number;
  powerStatus: PowerAnalysisStatus;
  overallStatus: PowerAnalysisStatus;
  loadCount: number;
}

export interface ConverterAnalysisResult {
  stageId: string;
  stageName: string;
  topology: string;
  inputRailId: string;
  outputRailId: string;
  inputVoltageVolts: number;
  outputVoltageVolts: number;
  outputCurrentAmps: number;
  maxCurrentAmps: number;
  currentUtilizationPercent: number;
  outputPowerWatts: number;
  efficiencyPercent: number;
  inputPowerWatts: number;
  dissipatedLossWatts: number;
  status: PowerAnalysisStatus;
}

export interface SourceAnalysisResult {
  sourceId: string;
  sourceName: string;
  sourceType: PowerSourceType;
  nominalVoltage: number;
  deliveredCurrentAmps: number;
  availableCurrentAmps: number;
  currentUtilizationPercent: number;
  deliveredPowerWatts: number;
  availablePowerWatts: number;
  powerUtilizationPercent: number;
  status: PowerAnalysisStatus;
}

export interface SystemBottleneckItem {
  entityId: string;
  entityType: 'source' | 'converter' | 'rail' | 'load';
  entityName: string;
  metric: string;
  utilizationPercent: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
}

export interface SystemPowerFlowResult {
  sources: SourceAnalysisResult[];
  converters: ConverterAnalysisResult[];
  rails: RailAnalysisResult[];
  loads: Array<{
    loadId: string;
    name: string;
    railId: string;
    currentAmps: number;
    powerWatts: number;
    percentageOfSystemPower: number;
  }>;
  totalDeliveredPayloadPowerWatts: number;
  totalSystemInputPowerWatts: number;
  totalSystemLossWatts: number;
  cascadedSystemEfficiencyPercent: number;
  bottlenecks: SystemBottleneckItem[];
  circularDependencies: string[][];
  sequencingValid: boolean;
  sequencingErrors: string[];
  unassignedLoads: string[];
  unfedRails: string[];
  analyzedAt: string;
}

export interface PowerTreeNode {
  id: string;
  type: 'source' | 'converter' | 'rail' | 'load';
  name: string;
  voltage?: number;
  current?: number;
  power?: number;
  status?: PowerAnalysisStatus;
  utilizationPercent?: number;
  children: PowerTreeNode[];
}
