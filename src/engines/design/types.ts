/**
 * ElectroKit — Phase 12 Engineering Design, System Analysis & Workflows
 * Unified Data Models & Core Types
 */

export type ModelClassification =
  | 'Exact mathematical relationship'
  | 'Idealized model'
  | 'Empirical model'
  | 'Reference estimate'
  | 'User-defined assumption'
  | 'Standards-aware estimate'
  | 'Hardware-dependent';

export interface EngineeringRequirement {
  id: string;
  category: 'electrical' | 'power' | 'thermal' | 'environmental' | 'mechanical' | 'component' | 'margin';
  name: string;
  nominalValue: number;
  minValue?: number;
  maxValue?: number;
  unit: string;
  description?: string;
  source: 'user' | 'reference' | 'derived';
}

export interface EngineeringAssumption {
  id: string;
  parameter: string;
  value: number | string;
  unit?: string;
  classification: ModelClassification;
  description: string;
  isUserConfigurable: boolean;
  applicableWorkflow: string;
}

export interface WorkflowWarning {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'electrical' | 'power' | 'thermal' | 'battery' | 'pcb' | 'regulatory' | 'hardware-limit';
  message: string;
  remedyHint?: string;
  requiresHardwareValidation?: boolean;
}

export interface EngineeringMargin {
  parameter: string;
  requiredValue: number;
  availableOrCalculatedValue: number;
  marginAbsolute: number;
  marginPercent: number;
  utilizationPercent?: number;
  unit: string;
  isSatisfied: boolean;
  statusText: 'SATISFIED' | 'TIGHT_MARGIN' | 'VIOLATED';
}

export interface TraceabilityStep {
  requirementId: string;
  requirementName: string;
  participatingEngine: string;
  formulaOrMethod: string;
  calculatedValue: number | string;
  unit: string;
  margin?: EngineeringMargin;
  warningIds?: string[];
}

export interface SystemDesignReport {
  title: string;
  projectDescription: string;
  requirements: EngineeringRequirement[];
  margins: EngineeringMargin[];
  assumptions: EngineeringAssumption[];
  warnings: WorkflowWarning[];
  traceability: TraceabilityStep[];
  overallStatus:
    | 'Validated calculation'
    | 'Requirement satisfied by modeled inputs'
    | 'Requirement exceeds modeled capability'
    | 'Additional manufacturer data required'
    | 'Hardware validation required'
    | 'Standards verification required';
  summaryRemarks: string[];
}
