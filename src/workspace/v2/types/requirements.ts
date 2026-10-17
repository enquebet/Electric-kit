/**
 * ElectroKit V2 — Architecture & Engineering Data Model
 * Requirements, Constraints, Assumptions, and Target Specifications
 */

export type RequirementCategory =
  | 'electrical'
  | 'power'
  | 'thermal'
  | 'battery'
  | 'pcb'
  | 'rf'
  | 'mechanical'
  | 'environmental'
  | 'regulatory'
  | 'firmware';

export type RequirementPriority = 'critical' | 'high' | 'medium' | 'low';

export type VerificationMethod =
  | 'calculation'
  | 'simulation'
  | 'measurement'
  | 'datasheet_inspection'
  | 'formal_review';

export type VerificationStatus =
  | 'unverified'
  | 'in_progress'
  | 'passed'
  | 'failed'
  | 'waived';

export interface EngineeringRequirementV2 {
  id: string; // req_...
  name: string;
  category: RequirementCategory;
  description: string;
  nominalValue?: number;
  minValue?: number;
  maxValue?: number;
  unit: string;
  tolerancePercent?: number;
  priority: RequirementPriority;
  verificationMethod: VerificationMethod;
  verificationStatus: VerificationStatus;
  satisfiedByCalculationIds: string[];
  satisfiedByMeasurementIds: string[];
  source: 'user' | 'standard' | 'customer' | 'system_derivation';
  rationale?: string;
  createdAt: string;
  updatedAt: string;
}

export type ConstraintCategory =
  | 'electrical'
  | 'power'
  | 'thermal'
  | 'battery'
  | 'pcb'
  | 'rf'
  | 'environmental'
  | 'mechanical'
  | 'component';

export type ConstraintLimitType = 'min' | 'max' | 'exact' | 'target';

export interface EngineeringConstraintV2 {
  id: string; // con_...
  name: string;
  category: ConstraintCategory;
  value: number | string;
  unit: string;
  limitType: ConstraintLimitType;
  marginThresholdPercent?: number;
  governingStandard?: string;
  source?: string;
  notes?: string;
  enforcedBySystemIds?: string[];
}

export type AssumptionClassification =
  | 'physics_law'
  | 'standards_estimate'
  | 'user_assumption'
  | 'datasheet_typical'
  | 'environmental_boundary';

export type AssumptionSensitivity = 'low' | 'medium' | 'high';

export interface EngineeringAssumptionV2 {
  id: string; // asm_...
  parameter: string;
  value: number | string;
  unit: string;
  classification: AssumptionClassification;
  sensitivity: AssumptionSensitivity;
  description: string;
  isUserConfigurable: boolean;
  applicableWorkflow?: string;
  validityRange?: {
    min?: number;
    max?: number;
    unit?: string;
  };
  notes?: string;
}

export interface EngineeringTargetV2 {
  id: string; // tgt_...
  parameter: string;
  targetValue: number;
  unit: string;
  tolerancePercent?: number;
  priority: RequirementPriority;
  notes?: string;
}
