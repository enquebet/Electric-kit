/**
 * ElectroKit V2 — Architecture & Engineering Data Model
 * Traceability Graph & Relationship Model
 */

export type TraceableEntityType =
  | 'requirement'
  | 'constraint'
  | 'assumption'
  | 'system'
  | 'subsystem'
  | 'component'
  | 'rail'
  | 'net'
  | 'pin'
  | 'power_path'
  | 'signal_path'
  | 'thermal_path'
  | 'reference'
  | 'power_source'
  | 'power_load'
  | 'converter_stage'
  | 'sequencing_rule'
  | 'calculation'
  | 'snapshot'
  | 'measurement'
  | 'validation'
  | 'decision'
  | 'issue'
  | 'revision';

export type TraceabilityRelationshipType =
  | 'satisfies' // calculation/measurement -> requirement
  | 'derives_from' // subsystem/requirement -> requirement
  | 'constrains' // constraint -> system/component/rail
  | 'calculates' // calculation -> rail/thermal/battery/rf/pcb
  | 'validates' // measurement -> calculation/requirement
  | 'powers' // rail -> component
  | 'connects_to' // connection -> pin
  | 'mitigates' // decision -> issue
  | 'cites_as_evidence' // decision -> snapshot
  | 'routes_through' // net/power path -> component
  | 'references_spec' // component/system -> reference
  | 'thermal_contact' // component -> heatsink/interface
  | 'signals_to' // component -> component
  | 'feeds' // power source -> rail / converter
  | 'sequences_before' // rail -> rail
  | 'loads'; // load -> rail

export interface TraceabilityLinkV2 {
  id: string; // tlink_...
  sourceId: string;
  sourceType: TraceableEntityType;
  targetId: string;
  targetType: TraceableEntityType;
  relationship: TraceabilityRelationshipType;
  rationale?: string;
  createdAt: string;
}

export interface TraceabilityCoverageReport {
  totalRequirements: number;
  satisfiedRequirements: number;
  unmetRequirements: number;
  coveragePercent: number;
  unlinkedComponents: string[];
  unverifiedCalculations: string[];
  openIssuesCount: number;
}
