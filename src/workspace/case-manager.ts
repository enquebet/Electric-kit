/**
 * ElectroKit — Phase 13 Engineering Workspace
 * Design Case & Multi-Scenario Manager
 */

import {
  ElectroKitProject,
  DesignCase,
  DesignScenario,
  ScenarioType,
  ProjectRevision,
  EngineeringMargin,
} from './types';

export interface CaseComparisonMetric {
  metricName: string;
  category: 'electrical' | 'power' | 'thermal' | 'battery' | 'pcb';
  unit: string;
  values: Record<string, number | string>;
  deltasVsBaseline?: Record<string, number>;
  higherIsBetter?: boolean;
}

export interface CaseComparisonMargin {
  marginName: string;
  unit: string;
  values: Record<
    string,
    {
      required: number;
      actual: number;
      marginValue: number;
      isSatisfied: boolean;
      status: string;
    }
  >;
  deltasVsBaseline?: Record<string, number>;
}

export interface CaseComparisonResult {
  cases: { id: string; name: string; isBaseline: boolean }[];
  baselineCaseId: string;
  metrics: CaseComparisonMetric[];
  margins: CaseComparisonMargin[];
  improvedMarginsCount: Record<string, number>;
  degradedMarginsCount: Record<string, number>;
  newViolationsCount: Record<string, number>;
  verdict: Record<string, 'IMPROVED' | 'DEGRADED' | 'MIXED' | 'EQUAL'>;
  summaryRemarks: string[];
}

export function addDesignCase(
  project: ElectroKitProject,
  name: string,
  description: string,
  cloneFromCaseId?: string
): DesignCase {
  const timestamp = new Date().toISOString();
  const newCaseId = 'case_' + Math.random().toString(36).substring(2, 8);

  let initialInputs: Record<string, any> = {};
  let initialSnapshots: any[] = [];

  if (cloneFromCaseId) {
    const srcCase = project.designCases.find((c) => c.id === cloneFromCaseId);
    if (srcCase) {
      initialInputs = JSON.parse(JSON.stringify(srcCase.inputs || {}));
      initialSnapshots = JSON.parse(JSON.stringify(srcCase.calculationSnapshots || []));
    }
  }

  const newCase: DesignCase = {
    id: newCaseId,
    name,
    description,
    isBaseline: project.designCases.length === 0,
    inputs: initialInputs,
    calculationSnapshots: initialSnapshots,
    assumptionOverrides: [],
    warnings: [],
    revisionNumber: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  project.designCases.push(newCase);
  project.activeCaseId = newCaseId;
  return newCase;
}

export function updateDesignCase(
  project: ElectroKitProject,
  caseId: string,
  updates: Partial<Omit<DesignCase, 'id' | 'createdAt'>>
): boolean {
  const c = project.designCases.find((item) => item.id === caseId);
  if (!c) return false;
  Object.assign(c, updates);
  c.updatedAt = new Date().toISOString();
  return true;
}

export function deleteDesignCase(project: ElectroKitProject, caseId: string): boolean {
  if (project.designCases.length <= 1) {
    return false; // Cannot delete only remaining case
  }
  const idx = project.designCases.findIndex((c) => c.id === caseId);
  if (idx < 0) return false;

  const wasBaseline = project.designCases[idx].isBaseline;
  project.designCases.splice(idx, 1);

  if (wasBaseline && project.designCases.length > 0) {
    project.designCases[0].isBaseline = true;
  }

  if (project.activeCaseId === caseId) {
    project.activeCaseId = project.designCases[0].id;
  }
  return true;
}

export function setBaselineCase(project: ElectroKitProject, caseId: string): boolean {
  const target = project.designCases.find((c) => c.id === caseId);
  if (!target) return false;
  project.designCases.forEach((c) => {
    c.isBaseline = c.id === caseId;
  });
  return true;
}

export function addScenario(
  project: ElectroKitProject,
  caseId: string,
  name: string,
  type: ScenarioType,
  parameterOverrides: Record<string, any>,
  notes?: string
): DesignScenario {
  const scenario: DesignScenario = {
    id: 'scen_' + Math.random().toString(36).substring(2, 8),
    caseId,
    name,
    type,
    parameterOverrides,
    notes,
    createdAt: new Date().toISOString(),
  };
  project.scenarios.push(scenario);
  return scenario;
}

export function deleteScenario(project: ElectroKitProject, scenarioId: string): boolean {
  const idx = project.scenarios.findIndex((s) => s.id === scenarioId);
  if (idx < 0) return false;
  project.scenarios.splice(idx, 1);
  return true;
}

export function createProjectRevision(
  project: ElectroKitProject,
  summary: string,
  author: string
): ProjectRevision {
  const nextRevNumber = (project.revisions?.length || 0) + 1;
  const timestamp = new Date().toISOString();
  const digest = `rev_${nextRevNumber}_${Date.now()}`;

  const rev: ProjectRevision = {
    revisionNumber: nextRevNumber,
    timestamp,
    author: author || project.metadata.author,
    summary,
    snapshotDigest: digest,
  };

  if (!project.revisions) project.revisions = [];
  project.revisions.unshift(rev);
  return rev;
}

export function compareDesignCases(
  project: ElectroKitProject,
  caseIds?: string[]
): CaseComparisonResult {
  const allCases = project.designCases;
  const targetCases = caseIds && caseIds.length > 0
    ? allCases.filter((c) => caseIds.includes(c.id))
    : allCases;

  const baseline = targetCases.find((c) => c.isBaseline) || targetCases[0] || allCases[0];
  const baselineId = baseline ? baseline.id : '';

  const casesHeader = targetCases.map((c) => ({
    id: c.id,
    name: c.name,
    isBaseline: c.id === baselineId,
  }));

  const metrics: CaseComparisonMetric[] = [];
  const marginsMap: Map<string, CaseComparisonMargin> = new Map();

  // Aggregate margins across snapshots
  for (const c of targetCases) {
    for (const snap of c.calculationSnapshots || []) {
      for (const m of snap.margins || []) {
        const paramName = m.parameter || 'Unknown Margin';
        if (!marginsMap.has(paramName)) {
          marginsMap.set(paramName, {
            marginName: paramName,
            unit: m.unit,
            values: {},
            deltasVsBaseline: {},
          });
        }
        const entry = marginsMap.get(paramName)!;
        entry.values[c.id] = {
          required: m.requiredValue,
          actual: m.availableOrCalculatedValue,
          marginValue: m.marginAbsolute,
          isSatisfied: m.isSatisfied,
          status: m.statusText,
        };
      }
    }
  }

  // Compute margin deltas vs baseline
  const marginsList = Array.from(marginsMap.values());
  const improvedCount: Record<string, number> = {};
  const degradedCount: Record<string, number> = {};
  const newViolationsCount: Record<string, number> = {};
  const verdicts: Record<string, 'IMPROVED' | 'DEGRADED' | 'MIXED' | 'EQUAL'> = {};

  for (const c of targetCases) {
    if (c.id === baselineId) continue;
    let imp = 0;
    let deg = 0;
    let viol = 0;

    for (const m of marginsList) {
      const baseVal = m.values[baselineId];
      const targetVal = m.values[c.id];
      if (baseVal && targetVal) {
        const delta = targetVal.marginValue - baseVal.marginValue;
        if (!m.deltasVsBaseline) m.deltasVsBaseline = {};
        m.deltasVsBaseline[c.id] = delta;

        if (delta > 0.001) imp++;
        else if (delta < -0.001) deg++;

        if (baseVal.isSatisfied && !targetVal.isSatisfied) {
          viol++;
        }
      }
    }

    improvedCount[c.id] = imp;
    degradedCount[c.id] = deg;
    newViolationsCount[c.id] = viol;

    if (viol > 0 || (deg > 0 && imp === 0)) {
      verdicts[c.id] = 'DEGRADED';
    } else if (imp > 0 && deg === 0) {
      verdicts[c.id] = 'IMPROVED';
    } else if (imp > 0 && deg > 0) {
      verdicts[c.id] = 'MIXED';
    } else {
      verdicts[c.id] = 'EQUAL';
    }
  }

  const remarks: string[] = [];
  remarks.push(`Evaluated ${targetCases.length} design case(s) against baseline: "${baseline?.name || 'N/A'}".`);
  remarks.push(`Total tracked engineering margins across cases: ${marginsList.length}.`);

  for (const c of targetCases) {
    if (c.id === baselineId) continue;
    const v = verdicts[c.id];
    const imp = improvedCount[c.id] || 0;
    const deg = degradedCount[c.id] || 0;
    const viol = newViolationsCount[c.id] || 0;
    remarks.push(
      `Case "${c.name}": Verdict ${v} (${imp} improved, ${deg} degraded, ${viol} new violations vs baseline).`
    );
  }

  return {
    cases: casesHeader,
    baselineCaseId: baselineId,
    metrics,
    margins: marginsList,
    improvedMarginsCount: improvedCount,
    degradedMarginsCount: degradedCount,
    newViolationsCount,
    verdict: verdicts,
    summaryRemarks: remarks,
  };
}
