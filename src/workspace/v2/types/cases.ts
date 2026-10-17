/**
 * ElectroKit V2 — Architecture & Engineering Data Model
 * Design Cases, Corner Scenarios, and Operating Envelopes
 */

import { EngineeringAssumptionV2 } from './requirements';

export type ScenarioTypeV2 =
  | 'nominal'
  | 'worst_case_max'
  | 'worst_case_min'
  | 'high_temperature'
  | 'cold_start'
  | 'heavy_load'
  | 'light_load_quiescent'
  | 'battery_eol'
  | 'supply_voltage_sag'
  | 'tolerance_stackup'
  | 'combined_stress';

export interface DesignScenarioV2 {
  id: string; // scen_...
  caseId: string;
  name: string;
  type: ScenarioTypeV2;
  description: string;
  environmentalOverrides: {
    ambientTemperatureC?: number;
    inputVoltageV?: number;
    loadCurrentA?: number;
    stateOfHealthPercent?: number;
    humidityPercent?: number;
  };
  parameterOverrides: Record<string, any>;
  resultsSummary?: {
    overallVerdict: 'pass' | 'marginal' | 'fail';
    worstMarginHeadroom?: number;
    limitingFactor?: string;
  };
  notes?: string;
  createdAt: string;
}

export interface DesignCaseV2 {
  id: string; // case_...
  name: string;
  description: string;
  isBaseline: boolean;
  revisionNumber: number;
  inputs: Record<string, any>;
  assumptionOverrides: EngineeringAssumptionV2[];
  scenarios: DesignScenarioV2[];
  associatedCalculationIds: string[];
  associatedSnapshotIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
