/**
 * ElectroKit V2 — Architecture & Engineering Data Model
 * Governance: Revisions, Engineering Decisions, and Issues / Risks
 */

export interface RevisionChangeV2 {
  entityType: 'requirement' | 'constraint' | 'component' | 'system' | 'case' | 'calculation';
  entityId: string;
  changeType: 'added' | 'modified' | 'removed';
  fieldModified?: string;
  previousValue?: any;
  newValue?: any;
  rationale?: string;
}

export interface ProjectRevisionV2 {
  id: string; // rev_...
  revisionNumber: number;
  tag: string; // e.g. "Rev A.0", "Rev B.1"
  timestamp: string;
  author: string;
  summary: string;
  changes: RevisionChangeV2[];
  snapshotDigest: string; // cryptographic hash of project state at this revision
  signoffStatus: 'draft' | 'pending_review' | 'approved' | 'rejected';
  approver?: string;
  approvedAt?: string;
}

export type IssueSeverity = 'blocker' | 'critical' | 'moderate' | 'minor' | 'advisory';

export type IssueStatus =
  | 'open'
  | 'investigating'
  | 'mitigated'
  | 'resolved'
  | 'accepted_risk';

export interface EngineeringIssueV2 {
  id: string; // issue_...
  title: string;
  description: string;
  severity: IssueSeverity;
  category: 'electrical' | 'thermal' | 'power' | 'battery' | 'emc' | 'procurement' | 'reliability';
  status: IssueStatus;
  discoveredAt: string;
  discoveredBy: string;
  impactedEntityIds: string[];
  rootCause?: string;
  resolutionPlan?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  associatedDecisionId?: string;
}

export interface DecisionOptionV2 {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedCostImpactUsd?: number;
  estimatedScheduleImpactDays?: number;
}

export interface EngineeringDecisionV2 {
  id: string; // dec_...
  title: string;
  statement: string; // "We decided to use GaN switches instead of Silicon MOSFETs..."
  context: string;
  optionsConsidered: DecisionOptionV2[];
  chosenOptionId: string;
  tradeoffsSummary: string;
  evidenceSnapshotIds: string[]; // references to CalculationSnapshotV2
  decisionMaker: string;
  decidedAt: string;
  status: 'proposed' | 'approved' | 'superseded';
  supersededByDecisionId?: string;
  notes?: string;
}
