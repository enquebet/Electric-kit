/**
 * ElectroKit — Phase 13 Engineering Workspace & Intelligence Layer
 * Unified Workspace Data Models & Core Schema
 */

import {
  EngineeringRequirement,
  EngineeringAssumption,
  WorkflowWarning,
  EngineeringMargin,
  SystemDesignReport,
  TraceabilityStep,
} from '../engines/design/types';

export {
  type EngineeringRequirement,
  type EngineeringAssumption,
  type WorkflowWarning,
  type EngineeringMargin,
  type SystemDesignReport,
  type TraceabilityStep,
};

export type ProjectStatus =
  | 'Draft'
  | 'Analysis'
  | 'Review'
  | 'Validation Required'
  | 'Complete';

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  projectType: 'Power Supply' | 'Embedded System' | 'IoT Device' | 'Battery Pack' | 'RF Subsystem' | 'Custom Hardware';
  domain: 'Electrical' | 'Power' | 'RF' | 'Embedded' | 'Automotive' | 'Renewable' | 'General Hardware';
  author: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  engineeringObjective?: string;
  designTarget?: string;
  tags: string[];
  notes?: string;
}

export interface EngineeringConstraint {
  id: string;
  category: 'electrical' | 'power' | 'thermal' | 'battery' | 'pcb' | 'environmental' | 'mechanical' | 'component';
  name: string;
  value: number | string;
  unit: string;
  limitType: 'min' | 'max' | 'exact' | 'target';
  source?: string;
  notes?: string;
}

export interface EngineeringTarget {
  id: string;
  parameter: string;
  targetValue: number;
  unit: string;
  tolerancePercent?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  notes?: string;
}

export type ValidationStatus =
  | 'Unvalidated'
  | 'Calculated'
  | 'Reviewed'
  | 'Hardware Validated'
  | 'Manufacturer Data Verified';

export interface CalculationSnapshot {
  id: string;
  calculationId: string;
  toolSlug: string;
  engineId: string;
  name: string;
  category: string;
  timestamp: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  assumptions: EngineeringAssumption[];
  warnings: WorkflowWarning[];
  margins: EngineeringMargin[];
  validationStatus: ValidationStatus;
  formulaSnippet?: string;
  notes?: string;
}

export interface DesignCase {
  id: string;
  name: string;
  description: string;
  isBaseline: boolean;
  inputs: Record<string, any>;
  calculationSnapshots: CalculationSnapshot[];
  assumptionOverrides: EngineeringAssumption[];
  warnings: WorkflowWarning[];
  revisionNumber: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ScenarioType =
  | 'nominal'
  | 'worst-case'
  | 'best-case'
  | 'temperature'
  | 'load'
  | 'battery-eol'
  | 'tolerance'
  | 'supply-variation'
  | 'combined';

export interface DesignScenario {
  id: string;
  caseId: string;
  name: string;
  type: ScenarioType;
  parameterOverrides: Record<string, any>;
  resultsSummary?: Record<string, any>;
  notes?: string;
  createdAt: string;
}

export interface ValidationItem {
  id: string;
  title: string;
  category: 'datasheet' | 'prototype' | 'thermal' | 'electrical' | 'battery' | 'pcb' | 'si' | 'compliance';
  status: ValidationStatus;
  assignedTo?: string;
  notes?: string;
  hardwareValidationRequired: boolean;
  verifiedAt?: string;
}

export interface ManufacturerPlaceholder {
  id: string;
  componentRef: string;
  parameter: string;
  value: number | string;
  unit: string;
  manufacturer: string;
  partNumber: string;
  datasheetUrl?: string;
  verified: boolean;
}

export interface MeasurementPlaceholder {
  id: string;
  testPoint: string;
  parameter: string;
  measuredValue: number | string;
  unit: string;
  measurementMethod: string;
  instrument?: string;
  timestamp: string;
  tolerance?: string;
}

export interface EngineeringNote {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  associatedCaseId?: string;
  associatedCalculationId?: string;
  tag?: string;
}

export interface ProjectRevision {
  revisionNumber: number;
  timestamp: string;
  author: string;
  summary: string;
  snapshotDigest: string;
}

export interface DesignIteration {
  id: string;
  timestamp: string;
  parameterChanged: string;
  beforeValue: any;
  afterValue: any;
  affectedCalculationIds: string[];
  improvedMargins: string[];
  degradedMargins: string[];
  newViolations: string[];
}

export interface ElectroKitProject {
  schemaVersion: '1.0.0';
  metadata: ProjectMetadata;
  requirements: EngineeringRequirement[];
  constraints: EngineeringConstraint[];
  assumptions: EngineeringAssumption[];
  targets: EngineeringTarget[];
  designCases: DesignCase[];
  scenarios: DesignScenario[];
  validationItems: ValidationItem[];
  manufacturerData: ManufacturerPlaceholder[];
  measurements: MeasurementPlaceholder[];
  notes: EngineeringNote[];
  revisions: ProjectRevision[];
  iterations: DesignIteration[];
  activeCaseId?: string;
}

export type AiProviderType = 'gemini' | 'openai' | 'anthropic' | 'ollama' | 'offline';

export interface AiConfig {
  provider: AiProviderType;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  isEnabled: boolean;
}

export type AiReviewAction = 'explain' | 'critique' | 'test-plan' | 'review-synthesis';

export interface AiReviewResult {
  id: string;
  action: AiReviewAction;
  timestamp: string;
  title: string;
  content: string;
  providerUsed: string;
  offlineFallback: boolean;
  targetName?: string;
}

