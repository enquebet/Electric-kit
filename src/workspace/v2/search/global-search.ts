/**
 * ElectroKit V2 — Global Project Search Engine
 * High-performance search across all structured engineering entities
 */

import { ElectroKitProjectV2 } from '../types/project';

export type WorkspaceSectionKey =
  | 'overview'
  | 'requirements'
  | 'constraints'
  | 'assumptions'
  | 'systems'
  | 'components'
  | 'pcb'
  | 'cases'
  | 'scenarios'
  | 'calculations'
  | 'snapshots'
  | 'validation'
  | 'issues'
  | 'decisions'
  | 'traceability'
  | 'reports';

export interface SearchResultItem {
  id: string;
  entityType: string;
  title: string;
  category?: string;
  snippet: string;
  matchedField: string;
  targetSection: WorkspaceSectionKey;
}

export function searchProject(project: ElectroKitProjectV2, query: string): SearchResultItem[] {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [];
  }

  const q = query.trim().toLowerCase();
  const results: SearchResultItem[] = [];

  const match = (val: any): boolean => {
    if (val === null || val === undefined) return false;
    return String(val).toLowerCase().includes(q);
  };

  // 1. Requirements
  for (const r of project.requirements) {
    if (match(r.id) || match(r.name) || match(r.description) || match(r.category) || match(r.unit) || match(r.source)) {
      results.push({
        id: r.id,
        entityType: 'Requirement',
        title: `${r.name} (${r.id})`,
        category: r.category,
        snippet: r.description || `Target: ${r.nominalValue ?? ''} ${r.unit}`,
        matchedField: match(r.name) ? 'name' : match(r.id) ? 'id' : 'description',
        targetSection: 'requirements',
      });
    }
  }

  // 2. Constraints
  for (const c of project.constraints) {
    if (match(c.id) || match(c.name) || match(c.category) || match(c.value) || match(c.notes) || match(c.governingStandard)) {
      results.push({
        id: c.id,
        entityType: 'Constraint',
        title: `${c.name} (${c.id})`,
        category: c.category,
        snippet: `Limit: ${c.limitType} ${c.value} ${c.unit}. ${c.notes || ''}`,
        matchedField: match(c.name) ? 'name' : 'value',
        targetSection: 'constraints',
      });
    }
  }

  // 3. Assumptions
  for (const a of project.assumptions) {
    if (match(a.id) || match(a.parameter) || match(a.description) || match(a.classification) || match(a.applicableWorkflow)) {
      results.push({
        id: a.id,
        entityType: 'Assumption',
        title: `${a.parameter} (${a.id})`,
        category: a.classification,
        snippet: `${a.description} (${a.value} ${a.unit})`,
        matchedField: match(a.parameter) ? 'parameter' : 'description',
        targetSection: 'assumptions',
      });
    }
  }

  // 4. Systems & Subsystems
  for (const s of project.systems) {
    if (match(s.id) || match(s.name) || match(s.description) || match(s.primaryDomain)) {
      results.push({
        id: s.id,
        entityType: 'System',
        title: s.name,
        category: s.primaryDomain,
        snippet: s.description,
        matchedField: match(s.name) ? 'name' : 'description',
        targetSection: 'systems',
      });
    }
    for (const sub of s.subsystems) {
      if (match(sub.id) || match(sub.name) || match(sub.description) || match(sub.domain)) {
        results.push({
          id: sub.id,
          entityType: 'Subsystem',
          title: `${sub.name} (under ${s.name})`,
          category: sub.domain,
          snippet: sub.description,
          matchedField: match(sub.name) ? 'name' : 'description',
          targetSection: 'systems',
        });
      }
    }
  }

  // 5. Components & Pins
  for (const comp of project.components) {
    if (
      match(comp.id) ||
      match(comp.refDes) ||
      match(comp.name) ||
      match(comp.manufacturer) ||
      match(comp.partNumber) ||
      match(comp.manufacturerPartNumber) ||
      match(comp.packageType) ||
      match(comp.package) ||
      match(comp.category) ||
      match(comp.description) ||
      match(comp.notes)
    ) {
      results.push({
        id: comp.id,
        entityType: 'Component',
        title: `${comp.refDes} - ${comp.name}`,
        category: comp.category,
        snippet: `${comp.manufacturer || ''} ${comp.partNumber || comp.manufacturerPartNumber || ''} [${comp.packageType || comp.package || ''}]`,
        matchedField: match(comp.refDes) ? 'refDes' : match(comp.partNumber) ? 'partNumber' : 'name',
        targetSection: 'components',
      });
    }

    // Component Pins
    for (const pin of comp.pins || []) {
      if (
        match(pin.name) ||
        match(pin.pinNumber) ||
        match(pin.electricalRole) ||
        match(pin.domain) ||
        match(pin.description)
      ) {
        results.push({
          id: pin.id,
          entityType: 'Pin',
          title: `${comp.refDes}.${pin.name} (Pin ${pin.pinNumber})`,
          category: pin.type,
          snippet: `${pin.electricalRole || pin.type} on ${comp.refDes} (${comp.name})`,
          matchedField: match(pin.name) ? 'name' : 'pinNumber',
          targetSection: 'components',
        });
      }
    }
  }

  // 6. Power Rails & Nets
  for (const rail of project.powerRails) {
    if (match(rail.id) || match(rail.name) || match(rail.type) || match(rail.nominalVoltage)) {
      results.push({
        id: rail.id,
        entityType: 'Power Rail',
        title: `${rail.name} (${rail.nominalVoltage}V)`,
        category: rail.type,
        snippet: `Max current: ${rail.maxCurrentAmps}A. ${rail.notes || ''}`,
        matchedField: match(rail.name) ? 'name' : 'voltage',
        targetSection: 'systems',
      });
    }
  }

  for (const net of project.nets) {
    if (match(net.id) || match(net.name) || match(net.netClass)) {
      results.push({
        id: net.id,
        entityType: 'Net',
        title: `${net.name} [${net.netClass}]`,
        category: net.netClass,
        snippet: `Nominal: ${net.nominalVoltage ?? '-'}V`,
        matchedField: 'name',
        targetSection: 'systems',
      });
    }
  }

  // 7. Design Cases
  for (const dc of project.designCases) {
    if (match(dc.id) || match(dc.name) || match(dc.description)) {
      results.push({
        id: dc.id,
        entityType: 'Design Case',
        title: dc.name,
        snippet: dc.description || `${dc.scenarios.length} scenarios, ${dc.associatedCalculationIds.length} calculations`,
        matchedField: match(dc.name) ? 'name' : 'description',
        targetSection: 'cases',
      });
    }
    // Scenarios
    for (const scen of dc.scenarios) {
      if (match(scen.id) || match(scen.name) || match(scen.description) || match(scen.type)) {
        results.push({
          id: scen.id,
          entityType: 'Scenario',
          title: `${scen.name} (${dc.name})`,
          category: scen.type,
          snippet: scen.description || `Overrides: ${Object.keys(scen.parameterOverrides).length}`,
          matchedField: 'name',
          targetSection: 'scenarios',
        });
      }
    }
  }

  // 8. Calculations
  for (const calc of project.calculations) {
    if (match(calc.id) || match(calc.name) || match(calc.toolSlug) || match(calc.engineId) || match(calc.category)) {
      results.push({
        id: calc.id,
        entityType: 'Calculation',
        title: calc.name,
        category: calc.category,
        snippet: `Engine: ${calc.engineId}. Status: ${calc.status}. Evaluated: ${calc.lastCalculatedAt || 'never'}`,
        matchedField: match(calc.name) ? 'name' : 'engineId',
        targetSection: 'calculations',
      });
    }
  }

  // 9. Snapshots
  for (const snap of project.calculationSnapshots) {
    if (match(snap.id) || match(snap.calculationId) || match(snap.integrityDigest) || match(snap.formulaSnippet)) {
      results.push({
        id: snap.id,
        entityType: 'Snapshot',
        title: `Snapshot ${snap.id}`,
        category: snap.validationStatus,
        snippet: `Digest: ${snap.integrityDigest.substring(0, 16)}... Timestamp: ${snap.timestamp}`,
        matchedField: match(snap.id) ? 'id' : 'digest',
        targetSection: 'snapshots',
      });
    }
  }

  // 10. Validation & Measurements
  for (const meas of project.measurements) {
    if (match(meas.id) || match(meas.testPoint) || match(meas.parameter) || match(meas.instrument)) {
      results.push({
        id: meas.id,
        entityType: 'Measurement',
        title: `${meas.testPoint} - ${meas.parameter}`,
        category: meas.verdict,
        snippet: `Measured: ${meas.measuredValue} ${meas.unit} (Expected: ${meas.nominalExpected} ${meas.unit})`,
        matchedField: match(meas.testPoint) ? 'testPoint' : 'parameter',
        targetSection: 'validation',
      });
    }
  }

  // 11. Issues
  for (const issue of project.issues) {
    if (match(issue.id) || match(issue.title) || match(issue.description) || match(issue.severity) || match(issue.status)) {
      results.push({
        id: issue.id,
        entityType: 'Issue',
        title: `[${issue.severity.toUpperCase()}] ${issue.title}`,
        category: issue.status,
        snippet: issue.description,
        matchedField: match(issue.title) ? 'title' : 'description',
        targetSection: 'issues',
      });
    }
  }

  // 12. Decisions
  for (const dec of project.decisions) {
    if (match(dec.id) || match(dec.title) || match(dec.statement) || match(dec.context) || match(dec.decisionMaker)) {
      results.push({
        id: dec.id,
        entityType: 'Decision',
        title: dec.title,
        category: dec.status,
        snippet: dec.statement,
        matchedField: match(dec.title) ? 'title' : 'statement',
        targetSection: 'decisions',
      });
    }
  }

  // 13. Power Paths, Signal Paths, Thermal Paths
  if (project.powerPaths) {
    for (const pp of project.powerPaths) {
      if (match(pp.id) || match(pp.name) || match(pp.description)) {
        results.push({
          id: pp.id,
          entityType: 'PowerPath',
          title: pp.name,
          category: 'power',
          snippet: pp.description || `Power path with ${pp.stageComponentIds.length} stages`,
          matchedField: match(pp.name) ? 'name' : 'description',
          targetSection: 'systems',
        });
      }
    }
  }

  if (project.signalPaths) {
    for (const sp of project.signalPaths) {
      if (match(sp.id) || match(sp.name) || match(sp.description) || match(sp.signalType)) {
        results.push({
          id: sp.id,
          entityType: 'SignalPath',
          title: sp.name,
          category: sp.signalType,
          snippet: sp.description || `Signal path with ${sp.stageComponentIds.length} stages`,
          matchedField: match(sp.name) ? 'name' : 'description',
          targetSection: 'systems',
        });
      }
    }
  }

  if (project.thermalPaths) {
    for (const tp of project.thermalPaths) {
      if (match(tp.id) || match(tp.name) || match(tp.description) || match(tp.thermalInterfaceMaterial)) {
        results.push({
          id: tp.id,
          entityType: 'ThermalPath',
          title: tp.name,
          category: 'thermal',
          snippet: tp.description || `TIM: ${tp.thermalInterfaceMaterial || 'Unspecified'} (${tp.totalResistanceCPerW ?? '-'} °C/W)`,
          matchedField: match(tp.name) ? 'name' : 'description',
          targetSection: 'systems',
        });
      }
    }
  }

  // 14. References
  if (project.references) {
    for (const ref of project.references) {
      if (
        match(ref.id) ||
        match(ref.title) ||
        match(ref.publisher) ||
        match(ref.identifier) ||
        match(ref.manufacturerPartNumber) ||
        match(ref.notes)
      ) {
        results.push({
          id: ref.id,
          entityType: 'Reference',
          title: `${ref.title} [${ref.identifier || ref.type}]`,
          category: ref.type,
          snippet: `${ref.publisher || ''} ${ref.revision || ''} - ${ref.notes || ''}`,
          matchedField: match(ref.title) ? 'title' : match(ref.identifier) ? 'identifier' : 'publisher',
          targetSection: 'overview',
        });
      }
    }
  }

  // 15. Power Sources
  if (project.powerSources) {
    for (const src of project.powerSources) {
      if (match(src.id) || match(src.name) || match(src.sourceType) || match(src.notes)) {
        results.push({
          id: src.id,
          entityType: 'PowerSource',
          title: `${src.name} (${src.nominalVoltage}V / ${src.availablePowerWatts}W)`,
          category: src.sourceType,
          snippet: `${src.sourceType} supply, status: ${src.status}`,
          matchedField: match(src.name) ? 'name' : 'sourceType',
          targetSection: 'systems',
        });
      }
    }
  }

  // 16. Power Loads
  if (project.powerLoads) {
    for (const ld of project.powerLoads) {
      if (match(ld.id) || match(ld.name) || match(ld.priority) || match(ld.notes)) {
        results.push({
          id: ld.id,
          entityType: 'PowerLoad',
          title: `${ld.name} (${ld.nominalCurrentAmps}A / ${ld.nominalPowerWatts}W)`,
          category: ld.priority,
          snippet: `Priority: ${ld.priority}, State: ${ld.operatingState || 'nominal'}`,
          matchedField: match(ld.name) ? 'name' : 'priority',
          targetSection: 'systems',
        });
      }
    }
  }

  // 17. Power Sequencing Rules
  if (project.powerSequencingRules) {
    for (const rule of project.powerSequencingRules) {
      if (match(rule.id) || match(rule.name) || match(rule.dependencyType) || match(rule.notes)) {
        results.push({
          id: rule.id,
          entityType: 'SequencingRule',
          title: rule.name,
          category: rule.dependencyType,
          snippet: `Dependency: ${rule.dependencyType}, Delay: ${rule.delayMilliSeconds ?? 0}ms`,
          matchedField: match(rule.name) ? 'name' : 'dependencyType',
          targetSection: 'systems',
        });
      }
    }
  }

  // 18. Power Conversion Stages
  for (const sys of project.systems) {
    if (sys.powerArchitecture?.conversionStages) {
      for (const conv of sys.powerArchitecture.conversionStages) {
        if (match(conv.id) || match(conv.name) || match(conv.topology)) {
          results.push({
            id: conv.id,
            entityType: 'ConverterStage',
            title: `${conv.name} [${conv.topology.toUpperCase()}]`,
            category: conv.topology,
            snippet: `Eff: ${conv.expectedEfficiencyPercent}%, Max I: ${conv.maxOutputCurrentAmps}A`,
            matchedField: match(conv.name) ? 'name' : 'topology',
            targetSection: 'systems',
          });
        }
      }
    }
  }

  // 19. PCB Boards & Layout Objects
  if (project.pcbBoards) {
    for (const board of project.pcbBoards) {
      if (match(board.id) || match(board.name) || match(board.revision) || match(board.notes)) {
        results.push({
          id: board.id,
          entityType: 'PcbBoard',
          title: `${board.name} (${board.revision})`,
          category: `${board.stackup.layerCount}-Layer`,
          snippet: `${board.outline.widthMm}x${board.outline.heightMm} mm, ${board.placements.length} comps placed, ${board.traces.length} traces`,
          matchedField: match(board.name) ? 'name' : 'revision',
          targetSection: 'pcb',
        });
      }

      // PCB Traces
      for (const tr of board.traces) {
        if (match(tr.id) || match(tr.name) || match(tr.impedanceClass)) {
          results.push({
            id: tr.id,
            entityType: 'PcbTrace',
            title: tr.name,
            category: tr.impedanceClass || 'trace',
            snippet: `Length: ${tr.totalLengthMm}mm, Width: ${tr.averageWidthMm}mm, Status: ${tr.status}`,
            matchedField: match(tr.name) ? 'name' : 'impedanceClass',
            targetSection: 'pcb',
          });
        }
      }

      // PCB Vias & Arrays
      for (const va of board.viaArrays) {
        if (match(va.id) || match(va.name) || match(va.purpose)) {
          results.push({
            id: va.id,
            entityType: 'PcbViaArray',
            title: va.name,
            category: va.purpose,
            snippet: `${va.count} vias, pitch: ${va.pitchMm}mm (${va.rows}x${va.columns})`,
            matchedField: match(va.name) ? 'name' : 'purpose',
            targetSection: 'pcb',
          });
        }
      }

      // Copper Zones
      for (const zone of board.copperZones) {
        if (match(zone.id) || match(zone.name) || match(zone.connectionType)) {
          results.push({
            id: zone.id,
            entityType: 'PcbCopperZone',
            title: zone.name,
            category: zone.connectionType,
            snippet: `Area: ${zone.areaSquareMm} mm², Net: ${zone.netId}`,
            matchedField: match(zone.name) ? 'name' : 'connectionType',
            targetSection: 'pcb',
          });
        }
      }

      // Differential Pairs
      for (const dp of board.differentialPairs) {
        if (match(dp.id) || match(dp.name) || match(dp.targetDifferentialImpedanceOhms)) {
          results.push({
            id: dp.id,
            entityType: 'PcbDifferentialPair',
            title: `${dp.name} (${dp.targetDifferentialImpedanceOhms}Ω)`,
            category: dp.status,
            snippet: `Width: ${dp.traceWidthMm}mm, Space: ${dp.traceSpacingMm}mm, Skew: ${dp.skewLengthMm}mm`,
            matchedField: match(dp.name) ? 'name' : 'targetDifferentialImpedanceOhms',
            targetSection: 'pcb',
          });
        }
      }

      // DRC Findings
      for (const drc of board.drcFindings) {
        if (match(drc.id) || match(drc.description) || match(drc.ruleName) || match(drc.category)) {
          results.push({
            id: drc.id,
            entityType: 'PcbDrcFinding',
            title: `DRC ${drc.severity}: ${drc.ruleName}`,
            category: drc.category,
            snippet: drc.description,
            matchedField: match(drc.ruleName) ? 'ruleName' : 'category',
            targetSection: 'pcb',
          });
        }
      }
    }
  }

  // Limit to top 50 matches for performance
  return results.slice(0, 50);
}

export const searchV2Project = searchProject;
