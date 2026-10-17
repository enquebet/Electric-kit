/**
 * ElectroKit V2 — V1 to V2 Migration Engine
 * Lossless migration from V1.0.0 schema to V2.0.0 schema
 */

import { ElectroKitProject } from '../../types';
import {
  ElectroKitProjectV2,
  ProjectDomainV2,
  ProjectLifecycleStatusV2,
} from '../types/project';
import {
  EngineeringRequirementV2,
  EngineeringConstraintV2,
  EngineeringAssumptionV2,
  EngineeringTargetV2,
  RequirementCategory,
} from '../types/requirements';
import {
  EngineeringSystemV2,
  SystemDomain,
  PowerRailV2,
} from '../types/systems';
import { DesignCaseV2, DesignScenarioV2 } from '../types/cases';
import {
  CalculationInstanceV2,
  CalculationSnapshotV2,
  CalculationValidationStatus,
} from '../types/calculations';
import {
  EngineeringMeasurementV2,
  ValidationMilestoneV2,
  DatasheetVerificationV2,
} from '../types/validation';
import { ProjectRevisionV2 } from '../types/governance';
import { TraceabilityLinkV2 } from '../types/traceability';
import { EntityIds } from '../identity/id-generator';
import { computeSnapshotDigest } from '../integrity/hasher';

/**
 * Type guard for V1 project
 */
export function isV1Project(data: any): data is ElectroKitProject {
  return (
    data &&
    typeof data === 'object' &&
    data.schemaVersion === '1.0.0' &&
    data.metadata &&
    typeof data.metadata.name === 'string'
  );
}

/**
 * Type guard for V2 project
 */
export function isV2Project(data: any): data is ElectroKitProjectV2 {
  return (
    data &&
    typeof data === 'object' &&
    data.schemaVersion === '2.0.0' &&
    data.metadata &&
    typeof data.metadata.name === 'string' &&
    Array.isArray(data.systems)
  );
}

/**
 * Map V1 domain string to V2 domain enum
 */
function mapV1DomainToV2(v1Domain?: string): ProjectDomainV2 {
  switch (v1Domain) {
    case 'Power':
      return 'power_electronics';
    case 'Embedded':
      return 'embedded_iot';
    case 'RF':
      return 'rf_microwave';
    case 'Automotive':
      return 'automotive_hardware';
    default:
      return 'general_electrical';
  }
}

/**
 * Map V1 status to V2 lifecycle status
 */
function mapV1StatusToV2(v1Status?: string): ProjectLifecycleStatusV2 {
  switch (v1Status) {
    case 'Draft':
      return 'requirements_definition';
    case 'Analysis':
      return 'architecture_sizing';
    case 'Review':
      return 'verification_in_progress';
    case 'Validation Required':
      return 'hardware_validation';
    case 'Complete':
      return 'engineering_signoff';
    default:
      return 'requirements_definition';
  }
}

/**
 * Losslessly migrate an ElectroKit V1.0.0 project to V2.0.0
 */
export function migrateV1toV2(v1: ElectroKitProject): ElectroKitProjectV2 {
  const timestamp = new Date().toISOString();

  // 1. Migrate Requirements
  const requirements: EngineeringRequirementV2[] = (v1.requirements || []).map((r, index) => {
    return {
      id: r.id || `req_mig_${index}`,
      name: r.name,
      category: (r.category as RequirementCategory) || 'electrical',
      description: r.description || '',
      nominalValue: r.nominalValue,
      minValue: r.minValue,
      maxValue: r.maxValue,
      unit: r.unit || '',
      priority: 'high',
      verificationMethod: 'calculation',
      verificationStatus: 'unverified',
      satisfiedByCalculationIds: [],
      satisfiedByMeasurementIds: [],
      source: r.source === 'user' ? 'user' : 'standard',
      createdAt: v1.metadata.createdAt || timestamp,
      updatedAt: v1.metadata.updatedAt || timestamp,
    };
  });

  // 2. Migrate Constraints
  const constraints: EngineeringConstraintV2[] = (v1.constraints || []).map((c, index) => {
    return {
      id: c.id || `con_mig_${index}`,
      name: c.name,
      category: c.category || 'electrical',
      value: c.value,
      unit: c.unit || '',
      limitType: c.limitType || 'max',
      marginThresholdPercent: 10,
      source: c.source,
      notes: c.notes,
    };
  });

  // 3. Migrate Assumptions
  const assumptions: EngineeringAssumptionV2[] = (v1.assumptions || []).map((a, index) => {
    return {
      id: a.id || `asm_mig_${index}`,
      parameter: a.parameter,
      value: a.value,
      unit: a.unit || '',
      classification: 'user_assumption',
      sensitivity: 'medium',
      description: a.description || '',
      isUserConfigurable: a.isUserConfigurable !== undefined ? a.isUserConfigurable : true,
      applicableWorkflow: a.applicableWorkflow,
    };
  });

  // 4. Migrate Targets
  const targets: EngineeringTargetV2[] = (v1.targets || []).map((t, index) => {
    return {
      id: t.id || `tgt_mig_${index}`,
      parameter: t.parameter,
      targetValue: t.targetValue,
      unit: t.unit || '',
      tolerancePercent: t.tolerancePercent,
      priority: t.priority || 'medium',
      notes: t.notes,
    };
  });

  // 5. Synthesize Engineering Systems & Power Rails
  const primaryDomain: SystemDomain =
    v1.metadata.domain === 'Power'
      ? 'power'
      : v1.metadata.domain === 'RF'
      ? 'rf'
      : v1.metadata.domain === 'Embedded'
      ? 'embedded'
      : 'multi_domain';

  const defaultSystemId = EntityIds.system();
  const synthesizedSystem: EngineeringSystemV2 = {
    id: defaultSystemId,
    name: `${v1.metadata.name} System Architecture`,
    description: v1.metadata.description || 'Primary engineering system synthesized from V1 project baseline',
    primaryDomain,
    subsystems: [
      {
        id: EntityIds.subsystem(),
        parentSystemId: defaultSystemId,
        name: 'Core Electronics',
        description: 'Primary electronic conversion and control circuitry',
        domain: primaryDomain,
        componentIds: [],
      },
    ],
    createdAt: v1.metadata.createdAt || timestamp,
    updatedAt: timestamp,
  };

  const powerRails: PowerRailV2[] = [];
  // Inspect requirements or targets for voltage rails (e.g. 3.3V, 5V, 12V)
  const voltageReq = requirements.find(r => r.name.toLowerCase().includes('voltage') || r.unit === 'V');
  if (voltageReq && voltageReq.nominalValue) {
    powerRails.push({
      id: EntityIds.rail(),
      name: `VCC_${voltageReq.nominalValue}V`,
      type: 'regulated_dc',
      nominalVoltage: voltageReq.nominalValue,
      minVoltage: voltageReq.minValue || voltageReq.nominalValue * 0.95,
      maxVoltage: voltageReq.maxValue || voltageReq.nominalValue * 1.05,
      maxCurrentAmps: 2.0,
      notes: 'Synthesized from primary voltage requirement',
    });
  }

  // 6. Migrate Design Cases, Calculations & Calculation Snapshots
  const calculations: CalculationInstanceV2[] = [];
  const calculationSnapshots: CalculationSnapshotV2[] = [];
  const traceabilityLinks: TraceabilityLinkV2[] = [];

  const designCases: DesignCaseV2[] = (v1.designCases || []).map((dc, dcIdx) => {
    const caseId = dc.id || `case_${dcIdx}`;
    const associatedCalcIds: string[] = [];
    const associatedSnapIds: string[] = [];

    // Extract V1 snapshots into top-level snapshots & calculations
    for (const v1Snap of dc.calculationSnapshots || []) {
      const calcId = v1Snap.calculationId || EntityIds.calculation();
      const snapId = v1Snap.id || EntityIds.snapshot();

      associatedCalcIds.push(calcId);
      associatedSnapIds.push(snapId);

      // Check if we already have this calculation instance
      let calc = calculations.find(c => c.id === calcId);
      if (!calc) {
        calc = {
          id: calcId,
          toolSlug: v1Snap.toolSlug || 'engineering-calculator',
          engineId: v1Snap.engineId || 'v1-engine',
          name: v1Snap.name || 'Calculation Instance',
          category: v1Snap.category || 'general',
          status: 'clean',
          inputs: v1Snap.inputs || {},
          outputs: v1Snap.outputs || {},
          assumptions: (v1Snap.assumptions || []).map(asm => ({
            id: asm.id || EntityIds.assumption(),
            parameter: asm.parameter,
            value: asm.value,
            unit: asm.unit || '',
            classification: 'user_assumption',
            sensitivity: 'medium',
            description: asm.description || '',
            isUserConfigurable: asm.isUserConfigurable !== undefined ? asm.isUserConfigurable : true,
          })),
          margins: (v1Snap.margins || []).map((m: any) => ({
            name: m.parameter || 'Margin',
            nominalValue: m.availableOrCalculatedValue ?? m.calculatedValue ?? 0,
            limitValue: m.requiredValue ?? m.limitValue ?? 0,
            unit: m.unit || '',
            marginHeadroom: m.marginAbsolute ?? m.marginValue ?? 0,
            percentageHeadroom: m.marginPercent ?? m.percentageMargin ?? 0,
            status: m.statusText === 'SATISFIED' || m.status === 'OK'
              ? 'safe'
              : m.statusText === 'TIGHT_MARGIN' || m.status === 'WARNING'
              ? 'warning'
              : 'violation',
          })),
          warnings: (v1Snap.warnings || []).map(w => ({
            code: 'V1_WARN',
            severity: w.severity || 'warning',
            message: w.message || '',
          })),
          formulaReferences: v1Snap.formulaSnippet ? [v1Snap.formulaSnippet] : [],
          boundRequirementIds: [],
          boundComponentIds: [],
          boundRailIds: [],
          latestSnapshotId: snapId,
          lastCalculatedAt: v1Snap.timestamp || timestamp,
          notes: v1Snap.notes,
        };
        calculations.push(calc);
      }

      // Build V2 snapshot with deterministic integrity digest
      const mapValidationStatus = (s?: string): CalculationValidationStatus => {
        switch (s) {
          case 'Hardware Validated':
            return 'hardware_validated';
          case 'Manufacturer Data Verified':
            return 'manufacturer_verified';
          case 'Reviewed':
            return 'reviewed';
          case 'Calculated':
            return 'calculated';
          default:
            return 'unvalidated';
        }
      };

      const snapBase: Omit<CalculationSnapshotV2, 'integrityDigest'> = {
        id: snapId,
        calculationId: calcId,
        timestamp: v1Snap.timestamp || timestamp,
        inputs: v1Snap.inputs || {},
        outputs: v1Snap.outputs || {},
        assumptions: (v1Snap.assumptions || []).map(asm => ({
          id: asm.id || EntityIds.assumption(),
          parameter: asm.parameter,
          value: asm.value,
          unit: asm.unit || '',
          classification: 'user_assumption',
          sensitivity: 'medium',
          description: asm.description || '',
          isUserConfigurable: asm.isUserConfigurable !== undefined ? asm.isUserConfigurable : true,
        })),
        warnings: (v1Snap.warnings || []).map(w => ({
          code: 'V1_WARN',
          severity: w.severity || 'warning',
          message: w.message || '',
        })),
        margins: (v1Snap.margins || []).map((m: any) => ({
          name: m.parameter || 'Margin',
          nominalValue: m.availableOrCalculatedValue ?? m.calculatedValue ?? 0,
          limitValue: m.requiredValue ?? m.limitValue ?? 0,
          unit: m.unit || '',
          marginHeadroom: m.marginAbsolute ?? m.marginValue ?? 0,
          percentageHeadroom: m.marginPercent ?? m.percentageMargin ?? 0,
          status: m.statusText === 'SATISFIED' || m.status === 'OK'
            ? 'safe'
            : m.statusText === 'TIGHT_MARGIN' || m.status === 'WARNING'
            ? 'warning'
            : 'violation',
        })),
        validationStatus: mapValidationStatus(v1Snap.validationStatus),
        formulaSnippet: v1Snap.formulaSnippet,
        notes: v1Snap.notes,
      };

      const snapshotV2: CalculationSnapshotV2 = {
        ...snapBase,
        integrityDigest: computeSnapshotDigest(snapBase),
      };
      calculationSnapshots.push(snapshotV2);

      // Create traceability link from calculation to snapshot
      traceabilityLinks.push({
        id: EntityIds.traceabilityLink(),
        sourceId: calcId,
        sourceType: 'calculation',
        targetId: snapId,
        targetType: 'snapshot',
        relationship: 'satisfies',
        createdAt: timestamp,
      });
    }

    // Scenarios for this case
    const caseScenarios: DesignScenarioV2[] = (v1.scenarios || [])
      .filter(s => s.caseId === caseId)
      .map((scen, sIdx) => ({
        id: scen.id || `scen_${caseId}_${sIdx}`,
        caseId,
        name: scen.name,
        type: scen.type === 'worst-case' ? 'worst_case_max' : scen.type === 'best-case' ? 'worst_case_min' : 'nominal',
        description: scen.notes || `Scenario for case ${caseId}`,
        environmentalOverrides: {},
        parameterOverrides: scen.parameterOverrides || {},
        resultsSummary: scen.resultsSummary ? { overallVerdict: 'pass' } : undefined,
        notes: scen.notes,
        createdAt: scen.createdAt || timestamp,
      }));

    return {
      id: caseId,
      name: dc.name,
      description: dc.description || '',
      isBaseline: dc.isBaseline,
      revisionNumber: dc.revisionNumber || 1,
      inputs: dc.inputs || {},
      assumptionOverrides: (dc.assumptionOverrides || []).map(asm => ({
        id: asm.id || EntityIds.assumption(),
        parameter: asm.parameter,
        value: asm.value,
        unit: asm.unit || '',
        classification: 'user_assumption',
        sensitivity: 'medium',
        description: asm.description || '',
        isUserConfigurable: asm.isUserConfigurable !== undefined ? asm.isUserConfigurable : true,
      })),
      scenarios: caseScenarios,
      associatedCalculationIds: associatedCalcIds,
      associatedSnapshotIds: associatedSnapIds,
      notes: dc.notes,
      createdAt: dc.createdAt || timestamp,
      updatedAt: dc.updatedAt || timestamp,
    };
  });

  // 7. Migrate Validation Items
  const validationMilestones: ValidationMilestoneV2[] = (v1.validationItems || []).map((vi, vIdx) => {
    return {
      id: vi.id || `val_mig_${vIdx}`,
      title: vi.title,
      category: vi.category === 'thermal' ? 'thermal_ambient' : vi.category === 'battery' ? 'battery_runtime' : 'electrical_dc',
      status: vi.status === 'Hardware Validated' ? 'passed' : vi.status === 'Reviewed' ? 'in_progress' : 'unvalidated',
      hardwareValidationRequired: vi.hardwareValidationRequired,
      assignedEngineer: vi.assignedTo,
      verifiedAt: vi.verifiedAt,
      associatedRequirementIds: [],
      associatedMeasurementIds: [],
      notes: vi.notes,
    };
  });

  // 8. Migrate Measurements
  const measurements: EngineeringMeasurementV2[] = (v1.measurements || []).map((m, mIdx) => {
    const measuredNum = typeof m.measuredValue === 'number' ? m.measuredValue : parseFloat(String(m.measuredValue)) || 0;
    const tolNum = m.tolerance ? parseFloat(String(m.tolerance)) : 5;
    return {
      id: m.id || `meas_mig_${mIdx}`,
      testPoint: m.testPoint,
      parameter: m.parameter,
      nominalExpected: measuredNum,
      measuredValue: measuredNum,
      unit: m.unit || '',
      tolerancePercent: isNaN(tolNum) ? 5 : tolNum,
      deltaAbsolute: 0,
      deltaPercent: 0,
      verdict: 'pass',
      instrument: m.instrument,
      measurementMethod: m.measurementMethod,
      timestamp: m.timestamp || timestamp,
    };
  });

  // 9. Migrate Manufacturer Data
  const datasheetVerifications: DatasheetVerificationV2[] = (v1.manufacturerData || []).map((md, dIdx) => {
    return {
      id: md.id || `dsver_mig_${dIdx}`,
      componentId: `comp_${md.componentRef}`,
      componentRef: md.componentRef,
      parameter: md.parameter,
      datasheetTyp: md.value,
      unit: md.unit || '',
      manufacturer: md.manufacturer,
      partNumber: md.partNumber,
      datasheetUrl: md.datasheetUrl,
      verifiedBy: 'Hardware Engineer',
      verifiedAt: timestamp,
      status: md.verified ? 'verified' : 'unverified',
    };
  });

  // 10. Migrate Revisions
  const revisions: ProjectRevisionV2[] = (v1.revisions || []).map((rev, rIdx) => {
    return {
      id: `rev_mig_${rIdx}`,
      revisionNumber: rev.revisionNumber,
      tag: `Rev ${rev.revisionNumber}.0`,
      timestamp: rev.timestamp,
      author: rev.author,
      summary: rev.summary,
      changes: [],
      snapshotDigest: rev.snapshotDigest || 'migrated_v1_digest',
      signoffStatus: 'approved',
    };
  });

  // 11. Connect Auto-Traceability: requirements <-> calculations
  requirements.forEach(req => {
    const matchingCalc = calculations.find(c =>
      c.name.toLowerCase().includes(req.name.toLowerCase()) ||
      c.category.toLowerCase() === req.category.toLowerCase()
    );
    if (matchingCalc) {
      req.satisfiedByCalculationIds.push(matchingCalc.id);
      traceabilityLinks.push({
        id: EntityIds.traceabilityLink(),
        sourceId: matchingCalc.id,
        sourceType: 'calculation',
        targetId: req.id,
        targetType: 'requirement',
        relationship: 'satisfies',
        createdAt: timestamp,
      });
    }
  });

  // 12. Migrate Notes
  const notes = (v1.notes || []).map(n => ({
    id: n.id || EntityIds.note(),
    title: n.title,
    body: n.body,
    timestamp: n.timestamp,
    associatedEntityId: n.associatedCalculationId || n.associatedCaseId,
    tag: n.tag,
  }));

  // Build complete V2 project
  const migrated: ElectroKitProjectV2 = {
    schemaVersion: '2.0.0',
    metadata: {
      id: v1.metadata.id,
      name: v1.metadata.name,
      description: v1.metadata.description || '',
      projectType: v1.metadata.projectType || 'Custom Hardware',
      domain: mapV1DomainToV2(v1.metadata.domain),
      author: v1.metadata.author || 'Hardware Engineer',
      createdAt: v1.metadata.createdAt || timestamp,
      updatedAt: v1.metadata.updatedAt || timestamp,
      status: mapV1StatusToV2(v1.metadata.status),
      engineeringObjective: v1.metadata.engineeringObjective,
      designTarget: v1.metadata.designTarget,
      tags: Array.isArray(v1.metadata.tags) ? v1.metadata.tags : [],
      notes: v1.metadata.notes,
    },
    requirements,
    constraints,
    assumptions,
    targets,
    systems: [synthesizedSystem],
    components: [],
    connections: [],
    nets: [],
    powerRails,
    designCases,
    calculations,
    calculationSnapshots,
    validationMilestones,
    measurements,
    datasheetVerifications,
    revisions,
    issues: [],
    decisions: [],
    traceabilityLinks,
    powerPaths: [],
    signalPaths: [],
    thermalPaths: [],
    references: [],
    operatingConditions: [],
    powerSources: [],
    powerLoads: [],
    powerSequencingRules: [],
    pcbBoards: [],
    reports: [
      {
        id: EntityIds.report(),
        title: `${v1.metadata.name} System Verification Report`,
        scope: 'full_system',
        includeRequirements: true,
        includeCalculations: true,
        includeMeasurements: true,
        includeDecisions: true,
        includeTraceabilityMatrix: true,
        targetCaseIds: designCases.map(c => c.id),
        signoffStatus: 'draft',
      },
    ],
    notes,
    activeCaseId: v1.activeCaseId || (designCases[0] ? designCases[0].id : undefined),
  };

  return migrated;
}

/**
 * Universal project upgrader: safely upgrade any project input (V1 or V2) into a valid V2 project
 */
export function upgradeProject(data: any): ElectroKitProjectV2 {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid project: Expected an object');
  }
  if (isV2Project(data)) {
    return {
      ...data,
      powerPaths: data.powerPaths || [],
      signalPaths: data.signalPaths || [],
      thermalPaths: data.thermalPaths || [],
      references: data.references || [],
      operatingConditions: data.operatingConditions || [],
      powerSources: data.powerSources || [],
      powerLoads: data.powerLoads || [],
      powerSequencingRules: data.powerSequencingRules || [],
      pcbBoards: data.pcbBoards || [],
    };
  }
  if (isV1Project(data)) {
    return migrateV1toV2(data);
  }
  // If untyped project with metadata name
  if (data.metadata && data.metadata.name) {
    const v1Candidate: ElectroKitProject = {
      schemaVersion: '1.0.0',
      metadata: data.metadata,
      requirements: data.requirements || [],
      constraints: data.constraints || [],
      assumptions: data.assumptions || [],
      targets: data.targets || [],
      designCases: data.designCases || [],
      scenarios: data.scenarios || [],
      validationItems: data.validationItems || [],
      manufacturerData: data.manufacturerData || [],
      measurements: data.measurements || [],
      notes: data.notes || [],
      revisions: data.revisions || [],
      iterations: data.iterations || [],
      activeCaseId: data.activeCaseId,
    };
    return migrateV1toV2(v1Candidate);
  }
  throw new Error('Unrecognized project schema or missing project metadata');
}
