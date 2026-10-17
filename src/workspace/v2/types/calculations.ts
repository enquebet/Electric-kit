/**
 * ElectroKit V2 — Architecture & Engineering Data Model
 * Calculation Instances, Snapshots, and Cryptographic Integrity Hashes
 */

import { EngineeringAssumptionV2 } from './requirements';

export type CalculationStatus =
  | 'clean'
  | 'needs_recalculation'
  | 'recalculated'
  | 'error'
  | 'frozen';

export type CalculationValidationStatus =
  | 'unvalidated'
  | 'calculated'
  | 'reviewed'
  | 'hardware_validated'
  | 'manufacturer_verified';

export interface CalculationMarginV2 {
  name: string;
  nominalValue: number;
  limitValue: number;
  unit: string;
  marginHeadroom: number;
  percentageHeadroom: number;
  status: 'safe' | 'warning' | 'violation';
}

export interface CalculationWarningV2 {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  parameter?: string;
  suggestedAction?: string;
}

export interface CalculationSnapshotV2 {
  id: string; // snap_...
  calculationId: string; // calc_...
  timestamp: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  assumptions: EngineeringAssumptionV2[];
  warnings: CalculationWarningV2[];
  margins: CalculationMarginV2[];
  validationStatus: CalculationValidationStatus;
  integrityDigest: string; // deterministic cryptographic hash
  formulaSnippet?: string;
  notes?: string;
}

export interface CalculationInstanceV2 {
  id: string; // calc_...
  toolSlug: string;
  engineId: string;
  name: string;
  category: string;
  status: CalculationStatus;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  assumptions: EngineeringAssumptionV2[];
  margins: CalculationMarginV2[];
  warnings: CalculationWarningV2[];
  formulaReferences: string[];
  boundRequirementIds: string[];
  boundComponentIds: string[];
  boundRailIds: string[];
  latestSnapshotId?: string;
  lastCalculatedAt: string;
  notes?: string;
}
