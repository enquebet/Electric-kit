/**
 * ElectroKit V2 — Architecture & Engineering Data Model
 * Unified V2 Project Definition & Report Schemas
 */

import {
  EngineeringRequirementV2,
  EngineeringConstraintV2,
  EngineeringAssumptionV2,
  EngineeringTargetV2,
} from './requirements';
import {
  EngineeringSystemV2,
  PowerRailV2,
} from './systems';
import {
  EngineeringComponentV2,
  EngineeringConnectionV2,
  EngineeringNetV2,
} from './components';
import {
  PowerPathV2,
  SignalPathV2,
  ThermalPathV2,
  EngineeringReferenceV2,
  OperatingConditionV2,
} from './paths';
import {
  PowerSourceV2,
  PowerLoadV2,
  PowerSequencingRuleV2,
} from './power-architecture';
import { PcbBoardV2 } from './pcb';
import { DesignCaseV2 } from './cases';
import {
  CalculationInstanceV2,
  CalculationSnapshotV2,
} from './calculations';
import {
  EngineeringMeasurementV2,
  ValidationMilestoneV2,
  DatasheetVerificationV2,
} from './validation';
import {
  ProjectRevisionV2,
  EngineeringIssueV2,
  EngineeringDecisionV2,
} from './governance';
import { TraceabilityLinkV2 } from './traceability';

export type ProjectDomainV2 =
  | 'power_electronics'
  | 'embedded_iot'
  | 'battery_systems'
  | 'rf_microwave'
  | 'high_speed_digital'
  | 'automotive_hardware'
  | 'general_electrical';

export type ProjectLifecycleStatusV2 =
  | 'requirements_definition'
  | 'architecture_sizing'
  | 'detailed_calculation'
  | 'verification_in_progress'
  | 'hardware_validation'
  | 'engineering_signoff'
  | 'archived';

export interface ProjectMetadataV2 {
  id: string; // proj_...
  name: string;
  description: string;
  projectType: string;
  domain: ProjectDomainV2;
  author: string;
  organization?: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectLifecycleStatusV2;
  engineeringObjective?: string;
  designTarget?: string;
  targetEnclosure?: string;
  operatingEnvironment?: string;
  targetStandardCertifications?: string[];
  tags: string[];
  notes?: string;
}

export interface EngineeringReportConfigV2 {
  id: string; // rep_...
  title: string;
  scope: 'full_system' | 'power_only' | 'thermal_only' | 'battery_only' | 'validation_summary';
  includeRequirements: boolean;
  includeCalculations: boolean;
  includeMeasurements: boolean;
  includeDecisions: boolean;
  includeTraceabilityMatrix: boolean;
  targetCaseIds: string[];
  signoffStatus: 'draft' | 'approved';
  generatedAt?: string;
}

export interface EngineeringNoteV2 {
  id: string; // note_...
  title: string;
  body: string;
  timestamp: string;
  author?: string;
  associatedEntityId?: string;
  tag?: string;
}

export interface ElectroKitProjectV2 {
  schemaVersion: '2.0.0';
  metadata: ProjectMetadataV2;
  requirements: EngineeringRequirementV2[];
  constraints: EngineeringConstraintV2[];
  assumptions: EngineeringAssumptionV2[];
  targets: EngineeringTargetV2[];
  systems: EngineeringSystemV2[];
  components: EngineeringComponentV2[];
  connections: EngineeringConnectionV2[];
  nets: EngineeringNetV2[];
  powerRails: PowerRailV2[];
  designCases: DesignCaseV2[];
  calculations: CalculationInstanceV2[];
  calculationSnapshots: CalculationSnapshotV2[];
  validationMilestones: ValidationMilestoneV2[];
  measurements: EngineeringMeasurementV2[];
  datasheetVerifications: DatasheetVerificationV2[];
  revisions: ProjectRevisionV2[];
  issues: EngineeringIssueV2[];
  decisions: EngineeringDecisionV2[];
  traceabilityLinks: TraceabilityLinkV2[];
  powerPaths?: PowerPathV2[];
  signalPaths?: SignalPathV2[];
  thermalPaths?: ThermalPathV2[];
  references?: EngineeringReferenceV2[];
  operatingConditions?: OperatingConditionV2[];
  powerSources?: PowerSourceV2[];
  powerLoads?: PowerLoadV2[];
  powerSequencingRules?: PowerSequencingRuleV2[];
  pcbBoards?: PcbBoardV2[];
  reports: EngineeringReportConfigV2[];
  notes: EngineeringNoteV2[];
  activeCaseId?: string;
  activeBoardId?: string;
}
