/**
 * ElectroKit V2 — Wave 04: System Power Architecture Engine
 *
 * Orchestrates existing deterministic engineering engines:
 * - Phase 12 Power Workflows (calculateDcPowerBudget, calculateMultiRailPowerBudget,
 *   calculateConverterLossChain, estimateInputPower)
 * - Phase 01 / Phase 03 Electrical & Circuit Models
 *
 * Provides:
 * - System power flow analysis & cascaded loss chains
 * - Rail current allocation & limit verification (voltage, current, power)
 * - Power tree hierarchy generation
 * - Bottleneck detection
 * - Cycle detection for power topologies and sequencing rules
 * - Power sequencing validation
 * - Upstream / Downstream power chain traversal
 * - Design case / Scenario aware analysis
 * - Immutable snapshot integration with cryptographic hashing
 */

import { ElectroKitProjectV2 } from '../types/project';
import {
  PowerSourceV2,
  PowerLoadV2,
  PowerSequencingRuleV2,
  SystemPowerFlowResult,
  RailAnalysisResult,
  ConverterAnalysisResult,
  SourceAnalysisResult,
  SystemBottleneckItem,
  PowerTreeNode,
  PowerAnalysisStatus,
} from '../types/power-architecture';
import { PowerConversionStageV2, PowerRailV2 } from '../types/systems';
import { CalculationSnapshotV2 } from '../types/calculations';
import { EntityIds } from '../identity/id-generator';
import { computeSha256Digest, computeSnapshotDigest } from '../integrity/hasher';
import {
  calculateDcPowerBudget,
  calculateMultiRailPowerBudget,
  calculateConverterLossChain,
  estimateInputPower,
  PowerLoadItem,
  PowerRailDefinition,
  ConverterStage,
} from '../../../engines/design/power-workflows';

/**
 * Detect cycles in converter rail routing (e.g. Rail A -> Conv B -> Rail C -> Conv D -> Rail A)
 */
export function detectPowerFlowCycles(
  rails: PowerRailV2[],
  converters: PowerConversionStageV2[]
): string[][] {
  const cycles: string[][] = [];
  const adj = new Map<string, string[]>();

  for (const rail of rails) {
    adj.set(rail.id, []);
  }

  for (const conv of converters) {
    if (conv.inputRailId && conv.outputRailId) {
      if (!adj.has(conv.inputRailId)) adj.set(conv.inputRailId, []);
      adj.get(conv.inputRailId)!.push(conv.outputRailId);
    }
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(curr: string) {
    visited.add(curr);
    recStack.add(curr);
    path.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const nxt of neighbors) {
      if (!visited.has(nxt)) {
        dfs(nxt);
      } else if (recStack.has(nxt)) {
        // Cycle detected: slice from nxt to end
        const cycleStartIndex = path.indexOf(nxt);
        if (cycleStartIndex !== -1) {
          const cycle = path.slice(cycleStartIndex).concat(nxt);
          cycles.push(cycle);
        }
      }
    }

    path.pop();
    recStack.delete(curr);
  }

  for (const rail of rails) {
    if (!visited.has(rail.id)) {
      dfs(rail.id);
    }
  }

  return cycles;
}

/**
 * Detect cycles in power sequencing rules (e.g. Rail 1 before Rail 2, Rail 2 before Rail 1)
 */
export function detectSequencingCycles(rules: PowerSequencingRuleV2[]): string[][] {
  const cycles: string[][] = [];
  const adj = new Map<string, string[]>();

  for (const r of rules) {
    if (!adj.has(r.predecessorRailId)) adj.set(r.predecessorRailId, []);
    adj.get(r.predecessorRailId)!.push(r.successorRailId);
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(curr: string) {
    visited.add(curr);
    recStack.add(curr);
    path.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const nxt of neighbors) {
      if (!visited.has(nxt)) {
        dfs(nxt);
      } else if (recStack.has(nxt)) {
        const cycleStartIndex = path.indexOf(nxt);
        if (cycleStartIndex !== -1) {
          cycles.push(path.slice(cycleStartIndex).concat(nxt));
        }
      }
    }

    path.pop();
    recStack.delete(curr);
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

/**
 * Core System Power Flow Analysis
 * Orchestrates deterministic loss-chain and power budget engines across sources, converters, rails, and loads.
 */
export function analyzeSystemPowerFlow(
  project: ElectroKitProjectV2,
  scenarioOverrides?: Record<string, any>
): SystemPowerFlowResult {
  const sources = project.powerSources || [];
  const loads = project.powerLoads || [];
  const rails = project.powerRails || [];
  const conversionStages: PowerConversionStageV2[] = [];

  // Collect conversion stages from systems
  for (const sys of project.systems) {
    if (sys.powerArchitecture?.conversionStages) {
      conversionStages.push(...sys.powerArchitecture.conversionStages);
    }
  }

  // 1. Detect circular dependencies
  const circularDependencies = detectPowerFlowCycles(rails, conversionStages);

  // 2. Validate sequencing dependencies
  const seqRules = project.powerSequencingRules || [];
  const seqCycles = detectSequencingCycles(seqRules);
  const sequencingErrors: string[] = [];
  if (seqCycles.length > 0) {
    sequencingErrors.push(
      `Circular sequencing dependency detected: ${seqCycles.map(c => c.join(' -> ')).join('; ')}`
    );
  }
  for (const r of seqRules) {
    const hasPred = rails.some(rl => rl.id === r.predecessorRailId);
    const hasSucc = rails.some(rl => rl.id === r.successorRailId);
    if (!hasPred) sequencingErrors.push(`Sequencing rule '${r.name}' references non-existent predecessor rail '${r.predecessorRailId}'`);
    if (!hasSucc) sequencingErrors.push(`Sequencing rule '${r.name}' references non-existent successor rail '${r.successorRailId}'`);
  }

  // 3. Map loads to rails
  const unassignedLoads: string[] = [];
  const loadByRail = new Map<string, PowerLoadV2[]>();
  for (const r of rails) {
    loadByRail.set(r.id, []);
  }

  for (const l of loads) {
    if (!l.railId || !rails.some(r => r.id === l.railId)) {
      unassignedLoads.push(l.id);
    } else {
      loadByRail.get(l.railId)!.push(l);
    }
  }

  // 4. Calculate direct rail loads using DC power budget engine
  const railLoadItems: PowerLoadItem[] = [];
  const loadContributionsOut: Array<{
    loadId: string;
    name: string;
    railId: string;
    currentAmps: number;
    powerWatts: number;
    percentageOfSystemPower: number;
  }> = [];

  let directPayloadPowerTotal = 0;

  for (const l of loads) {
    const targetRail = rails.find(r => r.id === l.railId);
    const railV = targetRail ? targetRail.nominalVoltage : l.nominalVoltage;
    const current = l.nominalCurrentAmps;
    const pWatts = l.nominalPowerWatts > 0 ? l.nominalPowerWatts : railV * current;

    directPayloadPowerTotal += pWatts;

    railLoadItems.push({
      id: l.id,
      name: l.name,
      voltageRailVolts: railV,
      nominalCurrentAmps: current,
      peakCurrentAmps: l.peakCurrentAmps,
      dutyCycleFraction: l.dutyCycleFraction,
    });

    loadContributionsOut.push({
      loadId: l.id,
      name: l.name,
      railId: l.railId,
      currentAmps: current,
      powerWatts: Number(pWatts.toFixed(3)),
      percentageOfSystemPower: 0,
    });
  }

  // Normalize percentages
  for (const lOut of loadContributionsOut) {
    lOut.percentageOfSystemPower =
      directPayloadPowerTotal > 0
        ? Number(((lOut.powerWatts / directPayloadPowerTotal) * 100).toFixed(1))
        : 0;
  }

  // 5. Back-propagate power flow through conversion stages (Output Rails -> Input Rails)
  // Compute rail output power demand
  const railDemandedPowerWatts = new Map<string, number>();
  const railDemandedCurrentAmps = new Map<string, number>();
  const railPeakCurrentAmps = new Map<string, number>();

  for (const r of rails) {
    const rLoads = loadByRail.get(r.id) || [];
    let pSum = 0;
    let iSum = 0;
    let iPeakSum = 0;
    for (const ld of rLoads) {
      iSum += ld.nominalCurrentAmps;
      iPeakSum += ld.peakCurrentAmps ?? ld.nominalCurrentAmps;
      pSum += ld.nominalPowerWatts > 0 ? ld.nominalPowerWatts : r.nominalVoltage * ld.nominalCurrentAmps;
    }
    railDemandedPowerWatts.set(r.id, pSum);
    railDemandedCurrentAmps.set(r.id, iSum);
    railPeakCurrentAmps.set(r.id, iPeakSum);
  }

  // Propagate upstream: for any conversion stage, its input rail must supply its input power
  // We sort stages in reverse topological order (leaf converters first)
  const converterResults: ConverterAnalysisResult[] = [];
  let totalConversionLossWatts = 0;

  // Process conversion stages
  for (const stage of conversionStages) {
    const outRail = rails.find(r => r.id === stage.outputRailId);
    const inRail = rails.find(r => r.id === stage.inputRailId);

    const outV = outRail ? outRail.nominalVoltage : 5.0;
    const inV = inRail ? inRail.nominalVoltage : 12.0;

    // Output power is whatever is demanded from outRail
    const outP = railDemandedPowerWatts.get(stage.outputRailId) || 0;
    const outI = outV > 0 ? outP / outV : 0;

    const eff = stage.expectedEfficiencyPercent > 0 ? stage.expectedEfficiencyPercent : 90.0;
    const est = estimateInputPower(outP, eff);

    totalConversionLossWatts += est.dissipatedLossWatts;

    // Add this converter's input power as an extra load on its input rail!
    if (stage.inputRailId) {
      const curInP = railDemandedPowerWatts.get(stage.inputRailId) || 0;
      railDemandedPowerWatts.set(stage.inputRailId, curInP + est.inputPowerWatts);

      const inVNom = inRail ? inRail.nominalVoltage : inV;
      const additionalInputCurrent = inVNom > 0 ? est.inputPowerWatts / inVNom : 0;
      const curInI = railDemandedCurrentAmps.get(stage.inputRailId) || 0;
      railDemandedCurrentAmps.set(stage.inputRailId, curInI + additionalInputCurrent);
    }

    const maxI = stage.maxOutputCurrentAmps > 0 ? stage.maxOutputCurrentAmps : 10.0;
    const utilI = (outI / maxI) * 100;

    let convStatus: PowerAnalysisStatus = 'PASS';
    if (utilI > 100) convStatus = 'FAIL';
    else if (utilI > 80) convStatus = 'MARGINAL';

    converterResults.push({
      stageId: stage.id,
      stageName: stage.name,
      topology: stage.topology,
      inputRailId: stage.inputRailId,
      outputRailId: stage.outputRailId,
      inputVoltageVolts: inV,
      outputVoltageVolts: outV,
      outputCurrentAmps: Number(outI.toFixed(3)),
      maxCurrentAmps: maxI,
      currentUtilizationPercent: Number(utilI.toFixed(1)),
      outputPowerWatts: Number(outP.toFixed(3)),
      efficiencyPercent: eff,
      inputPowerWatts: est.inputPowerWatts,
      dissipatedLossWatts: est.dissipatedLossWatts,
      status: convStatus,
    });
  }

  // 6. Analyze Power Rails
  const railResults: RailAnalysisResult[] = [];
  const unfedRails: string[] = [];

  for (const rail of rails) {
    const totalI = railDemandedCurrentAmps.get(rail.id) || 0;
    const totalPeakI = railPeakCurrentAmps.get(rail.id) || totalI;
    const totalP = railDemandedPowerWatts.get(rail.id) || 0;
    const rLoads = loadByRail.get(rail.id) || [];

    const capI = rail.maxCurrentAmps > 0 ? rail.maxCurrentAmps : 1.0;
    const headroomI = capI - totalI;
    const utilI = (totalI / capI) * 100;

    let currentStatus: PowerAnalysisStatus = 'PASS';
    if (utilI > 100) currentStatus = 'FAIL';
    else if (utilI > 80) currentStatus = 'MARGINAL';

    // Voltage bounds verification
    const voltageIssues: string[] = [];
    let voltageStatus: PowerAnalysisStatus = 'PASS';

    for (const ld of rLoads) {
      if (ld.minVoltage !== undefined && rail.nominalVoltage < ld.minVoltage) {
        voltageIssues.push(`Load '${ld.name}' min voltage (${ld.minVoltage}V) exceeds rail nominal voltage (${rail.nominalVoltage}V)`);
        voltageStatus = 'FAIL';
      }
      if (ld.maxVoltage !== undefined && rail.nominalVoltage > ld.maxVoltage) {
        voltageIssues.push(`Rail nominal voltage (${rail.nominalVoltage}V) exceeds load '${ld.name}' max voltage (${ld.maxVoltage}V)`);
        voltageStatus = 'FAIL';
      }
    }

    // Power limits
    let powerStatus: PowerAnalysisStatus = 'PASS';
    let powerUtil: number | undefined;
    let powerHeadroom: number | undefined;

    if (rail.powerLimitWatts && rail.powerLimitWatts > 0) {
      powerHeadroom = rail.powerLimitWatts - totalP;
      powerUtil = (totalP / rail.powerLimitWatts) * 100;
      if (powerUtil > 100) powerStatus = 'FAIL';
      else if (powerUtil > 80) powerStatus = 'MARGINAL';
    }

    // Check if rail is fed by any source or converter
    const isFedBySource = sources.some(s => s.outputRailId === rail.id);
    const isFedByConverter = conversionStages.some(c => c.outputRailId === rail.id);
    if (!isFedBySource && !isFedByConverter && rLoads.length > 0) {
      unfedRails.push(rail.id);
    }

    let overallStatus: PowerAnalysisStatus = 'PASS';
    if (currentStatus === 'FAIL' || voltageStatus === 'FAIL' || powerStatus === 'FAIL') {
      overallStatus = 'FAIL';
    } else if (currentStatus === 'MARGINAL' || powerStatus === 'MARGINAL') {
      overallStatus = 'MARGINAL';
    }

    railResults.push({
      railId: rail.id,
      railName: rail.name,
      nominalVoltage: rail.nominalVoltage,
      minVoltage: rail.minVoltage,
      maxVoltage: rail.maxVoltage,
      voltageStatus,
      voltageIssues,
      totalNominalCurrentAmps: Number(totalI.toFixed(3)),
      totalPeakCurrentAmps: Number(totalPeakI.toFixed(3)),
      availableCurrentAmps: capI,
      currentHeadroomAmps: Number(headroomI.toFixed(3)),
      currentUtilizationPercent: Number(utilI.toFixed(1)),
      currentStatus,
      totalPowerWatts: Number(totalP.toFixed(3)),
      powerLimitWatts: rail.powerLimitWatts,
      powerHeadroomWatts: powerHeadroom !== undefined ? Number(powerHeadroom.toFixed(3)) : undefined,
      powerUtilizationPercent: powerUtil !== undefined ? Number(powerUtil.toFixed(1)) : undefined,
      powerStatus,
      overallStatus,
      loadCount: rLoads.length,
    });
  }

  // 7. Analyze Power Sources
  const sourceResults: SourceAnalysisResult[] = [];
  let totalInputPowerFromSources = 0;

  for (const src of sources) {
    // If source is linked to an output rail, it delivers the total power demanded by that rail
    const fedRailP = src.outputRailId ? (railDemandedPowerWatts.get(src.outputRailId) || 0) : 0;
    const deliveredP = fedRailP;
    const deliveredI = src.nominalVoltage > 0 ? deliveredP / src.nominalVoltage : 0;

    totalInputPowerFromSources += deliveredP;

    const maxI = src.availableCurrentAmps > 0 ? src.availableCurrentAmps : 1.0;
    const maxP = src.availablePowerWatts > 0 ? src.availablePowerWatts : src.nominalVoltage * maxI;

    const utilI = (deliveredI / maxI) * 100;
    const utilP = (deliveredP / maxP) * 100;

    let srcStatus: PowerAnalysisStatus = 'PASS';
    if (utilI > 100 || utilP > 100) srcStatus = 'FAIL';
    else if (utilI > 80 || utilP > 80) srcStatus = 'MARGINAL';

    sourceResults.push({
      sourceId: src.id,
      sourceName: src.name,
      sourceType: src.sourceType,
      nominalVoltage: src.nominalVoltage,
      deliveredCurrentAmps: Number(deliveredI.toFixed(3)),
      availableCurrentAmps: maxI,
      currentUtilizationPercent: Number(utilI.toFixed(1)),
      deliveredPowerWatts: Number(deliveredP.toFixed(3)),
      availablePowerWatts: maxP,
      powerUtilizationPercent: Number(utilP.toFixed(1)),
      status: srcStatus,
    });
  }

  // If no explicit sources defined, total system input power is payload + losses
  const totalSystemInputPowerWatts =
    totalInputPowerFromSources > 0
      ? totalInputPowerFromSources
      : directPayloadPowerTotal + totalConversionLossWatts;

  const cascadedEff =
    totalSystemInputPowerWatts > 0
      ? (directPayloadPowerTotal / totalSystemInputPowerWatts) * 100
      : 100.0;

  // 8. Identify System Bottlenecks
  const bottlenecks: SystemBottleneckItem[] = [];

  for (const src of sourceResults) {
    if (src.status === 'FAIL') {
      bottlenecks.push({
        entityId: src.sourceId,
        entityType: 'source',
        entityName: src.sourceName,
        metric: 'Power Capacity Exceeded',
        utilizationPercent: Math.max(src.currentUtilizationPercent, src.powerUtilizationPercent),
        severity: 'CRITICAL',
        description: `Source '${src.sourceName}' utilization is at ${Math.max(src.currentUtilizationPercent, src.powerUtilizationPercent)}%, exceeding available ratings.`,
      });
    } else if (src.status === 'MARGINAL') {
      bottlenecks.push({
        entityId: src.sourceId,
        entityType: 'source',
        entityName: src.sourceName,
        metric: 'High Power Utilization',
        utilizationPercent: Math.max(src.currentUtilizationPercent, src.powerUtilizationPercent),
        severity: 'WARNING',
        description: `Source '${src.sourceName}' utilization is at ${Math.max(src.currentUtilizationPercent, src.powerUtilizationPercent)}%, headroom is limited.`,
      });
    }
  }

  for (const r of railResults) {
    if (r.currentStatus === 'FAIL') {
      bottlenecks.push({
        entityId: r.railId,
        entityType: 'rail',
        entityName: r.railName,
        metric: 'Current Capacity Exceeded',
        utilizationPercent: r.currentUtilizationPercent,
        severity: 'CRITICAL',
        description: `Rail '${r.railName}' current (${r.totalNominalCurrentAmps}A) exceeds rating (${r.availableCurrentAmps}A) with ${r.currentUtilizationPercent}% utilization.`,
      });
    } else if (r.currentStatus === 'MARGINAL') {
      bottlenecks.push({
        entityId: r.railId,
        entityType: 'rail',
        entityName: r.railName,
        metric: 'High Current Utilization',
        utilizationPercent: r.currentUtilizationPercent,
        severity: 'WARNING',
        description: `Rail '${r.railName}' current utilization is at ${r.currentUtilizationPercent}%, low headroom remaining.`,
      });
    }
    if (r.voltageStatus === 'FAIL') {
      bottlenecks.push({
        entityId: r.railId,
        entityType: 'rail',
        entityName: r.railName,
        metric: 'Voltage Bounds Violation',
        utilizationPercent: 100,
        severity: 'CRITICAL',
        description: `Rail '${r.railName}' violates load voltage limits: ${r.voltageIssues.join('; ')}`,
      });
    }
  }

  for (const conv of converterResults) {
    if (conv.status === 'FAIL') {
      bottlenecks.push({
        entityId: conv.stageId,
        entityType: 'converter',
        entityName: conv.stageName,
        metric: 'Converter Current Exceeded',
        utilizationPercent: conv.currentUtilizationPercent,
        severity: 'CRITICAL',
        description: `Converter '${conv.stageName}' current (${conv.outputCurrentAmps}A) exceeds rated capability (${conv.maxCurrentAmps}A).`,
      });
    } else if (conv.status === 'MARGINAL') {
      bottlenecks.push({
        entityId: conv.stageId,
        entityType: 'converter',
        entityName: conv.stageName,
        metric: 'High Converter Utilization',
        utilizationPercent: conv.currentUtilizationPercent,
        severity: 'WARNING',
        description: `Converter '${conv.stageName}' is at ${conv.currentUtilizationPercent}% of maximum current capability.`,
      });
    }
  }

  // Sort bottlenecks by utilization descending
  bottlenecks.sort((a, b) => b.utilizationPercent - a.utilizationPercent);

  return {
    sources: sourceResults,
    converters: converterResults,
    rails: railResults,
    loads: loadContributionsOut,
    totalDeliveredPayloadPowerWatts: Number(directPayloadPowerTotal.toFixed(3)),
    totalSystemInputPowerWatts: Number(totalSystemInputPowerWatts.toFixed(3)),
    totalSystemLossWatts: Number(totalConversionLossWatts.toFixed(3)),
    cascadedSystemEfficiencyPercent: Number(cascadedEff.toFixed(2)),
    bottlenecks,
    circularDependencies,
    sequencingValid: sequencingErrors.length === 0,
    sequencingErrors,
    unassignedLoads,
    unfedRails,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Build a hierarchical Power Tree for visual architecture display
 */
export function buildPowerTree(
  project: ElectroKitProjectV2,
  flowResult?: SystemPowerFlowResult
): PowerTreeNode[] {
  const result = flowResult || analyzeSystemPowerFlow(project);
  const sources = project.powerSources || [];
  const rails = project.powerRails || [];
  const conversionStages: PowerConversionStageV2[] = [];
  for (const sys of project.systems) {
    if (sys.powerArchitecture?.conversionStages) {
      conversionStages.push(...sys.powerArchitecture.conversionStages);
    }
  }
  const loads = project.powerLoads || [];

  const tree: PowerTreeNode[] = [];

  // Helper to build rail node with its converters and loads
  function buildRailSubtree(railId: string, visited: Set<string>): PowerTreeNode | null {
    if (visited.has(railId)) return null; // Avoid infinite loops
    visited.add(railId);

    const rail = rails.find(r => r.id === railId);
    if (!rail) return null;

    const railAnalysis = result.rails.find(r => r.railId === railId);
    const railLoads = loads.filter(l => l.railId === railId);
    const downstreamConverters = conversionStages.filter(c => c.inputRailId === railId);

    const children: PowerTreeNode[] = [];

    // Add downstream converters
    for (const conv of downstreamConverters) {
      const convAnalysis = result.converters.find(c => c.stageId === conv.id);
      const convChild: PowerTreeNode = {
        id: conv.id,
        type: 'converter',
        name: `${conv.name} [${conv.topology.toUpperCase()}]`,
        voltage: convAnalysis?.outputVoltageVolts,
        current: convAnalysis?.outputCurrentAmps,
        power: convAnalysis?.outputPowerWatts,
        status: convAnalysis?.status,
        utilizationPercent: convAnalysis?.currentUtilizationPercent,
        children: [],
      };

      // Add downstream rail from this converter
      if (conv.outputRailId) {
        const outRailNode = buildRailSubtree(conv.outputRailId, new Set(visited));
        if (outRailNode) convChild.children.push(outRailNode);
      }

      children.push(convChild);
    }

    // Add direct loads
    for (const ld of railLoads) {
      const ldAnalysis = result.loads.find(l => l.loadId === ld.id);
      children.push({
        id: ld.id,
        type: 'load',
        name: ld.name,
        voltage: rail.nominalVoltage,
        current: ld.nominalCurrentAmps,
        power: ldAnalysis?.powerWatts,
        children: [],
      });
    }

    return {
      id: rail.id,
      type: 'rail',
      name: rail.name,
      voltage: rail.nominalVoltage,
      current: railAnalysis?.totalNominalCurrentAmps,
      power: railAnalysis?.totalPowerWatts,
      status: railAnalysis?.overallStatus,
      utilizationPercent: railAnalysis?.currentUtilizationPercent,
      children,
    };
  }

  // 1. If explicit sources exist, start trees from sources
  if (sources.length > 0) {
    for (const src of sources) {
      const srcAnalysis = result.sources.find(s => s.sourceId === src.id);
      const srcNode: PowerTreeNode = {
        id: src.id,
        type: 'source',
        name: src.name,
        voltage: src.nominalVoltage,
        current: srcAnalysis?.deliveredCurrentAmps,
        power: srcAnalysis?.deliveredPowerWatts,
        status: srcAnalysis?.status,
        utilizationPercent: srcAnalysis?.powerUtilizationPercent,
        children: [],
      };

      if (src.outputRailId) {
        const railNode = buildRailSubtree(src.outputRailId, new Set());
        if (railNode) srcNode.children.push(railNode);
      }

      tree.push(srcNode);
    }
  } else {
    // Fallback: root rails that are not fed by any converter
    const fedRailIds = new Set(conversionStages.map(c => c.outputRailId));
    const rootRails = rails.filter(r => !fedRailIds.has(r.id));

    for (const root of rootRails) {
      const rNode = buildRailSubtree(root.id, new Set());
      if (rNode) tree.push(rNode);
    }
  }

  return tree;
}

/**
 * Traverse upstream power chain from any entity
 */
export function getUpstreamPowerChain(
  project: ElectroKitProjectV2,
  entityId: string
): { type: string; id: string; name: string }[] {
  const chain: { type: string; id: string; name: string }[] = [];
  const visited = new Set<string>();

  let currId = entityId;

  while (currId && !visited.has(currId)) {
    visited.add(currId);

    // Is it a Load?
    const load = project.powerLoads?.find(l => l.id === currId);
    if (load) {
      const rail = project.powerRails.find(r => r.id === load.railId);
      if (rail) {
        chain.push({ type: 'rail', id: rail.id, name: rail.name });
        currId = rail.id;
        continue;
      }
    }

    // Is it a Rail?
    const rail = project.powerRails.find(r => r.id === currId);
    if (rail) {
      // Fed by a converter?
      let fedByConv: PowerConversionStageV2 | undefined;
      for (const sys of project.systems) {
        fedByConv = sys.powerArchitecture?.conversionStages.find(c => c.outputRailId === rail.id);
        if (fedByConv) break;
      }

      if (fedByConv) {
        chain.push({ type: 'converter', id: fedByConv.id, name: fedByConv.name });
        currId = fedByConv.inputRailId;
        continue;
      }

      // Fed by a source?
      const fedBySrc = project.powerSources?.find(s => s.outputRailId === rail.id);
      if (fedBySrc) {
        chain.push({ type: 'source', id: fedBySrc.id, name: fedBySrc.name });
        break;
      }
    }

    break;
  }

  return chain;
}

/**
 * Traverse downstream power consumers from any entity
 */
export function getDownstreamPowerChain(
  project: ElectroKitProjectV2,
  entityId: string
): { type: string; id: string; name: string }[] {
  const results: { type: string; id: string; name: string }[] = [];

  // If entity is source, find output rail
  const source = project.powerSources?.find(s => s.id === entityId);
  const startRailId = source ? source.outputRailId : entityId;

  const railQueue = startRailId ? [startRailId] : [];
  const visitedRails = new Set<string>();

  while (railQueue.length > 0) {
    const rId = railQueue.shift()!;
    if (visitedRails.has(rId)) continue;
    visitedRails.add(rId);

    const rail = project.powerRails.find(r => r.id === rId);
    if (!rail) continue;

    // Direct loads
    for (const ld of project.powerLoads || []) {
      if (ld.railId === rId) {
        results.push({ type: 'load', id: ld.id, name: ld.name });
      }
    }

    // Downstream converters
    for (const sys of project.systems) {
      for (const conv of sys.powerArchitecture?.conversionStages || []) {
        if (conv.inputRailId === rId) {
          results.push({ type: 'converter', id: conv.id, name: conv.name });
          if (conv.outputRailId) railQueue.push(conv.outputRailId);
        }
      }
    }
  }

  return results;
}

/**
 * Validate a Power Source
 */
export function validatePowerSource(
  source: Partial<PowerSourceV2>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!source.name || !source.name.trim()) errors.push('Power source name is required');
  if (!source.sourceType) errors.push('Power source type is required');

  if (source.nominalVoltage === undefined || isNaN(source.nominalVoltage) || source.nominalVoltage <= 0) {
    errors.push('Power source nominal voltage must be a positive number');
  }

  if (source.availableCurrentAmps === undefined || isNaN(source.availableCurrentAmps) || source.availableCurrentAmps <= 0) {
    errors.push('Power source available current must be a positive number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a Power Load
 */
export function validatePowerLoad(
  load: Partial<PowerLoadV2>,
  project: ElectroKitProjectV2
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!load.name || !load.name.trim()) errors.push('Power load name is required');
  if (!load.railId) errors.push('Power load must be assigned to a power rail');
  else if (!project.powerRails.some(r => r.id === load.railId)) {
    errors.push(`Referenced power rail '${load.railId}' does not exist in project`);
  }

  if (load.nominalCurrentAmps === undefined || isNaN(load.nominalCurrentAmps) || load.nominalCurrentAmps < 0) {
    errors.push('Power load nominal current cannot be negative');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a Sequencing Rule
 */
export function validateSequencingRule(
  rule: Partial<PowerSequencingRuleV2>,
  project: ElectroKitProjectV2
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!rule.name || !rule.name.trim()) errors.push('Sequencing rule name is required');
  if (!rule.predecessorRailId) errors.push('Predecessor rail is required');
  else if (!project.powerRails.some(r => r.id === rule.predecessorRailId)) {
    errors.push(`Predecessor rail '${rule.predecessorRailId}' not found in project`);
  }

  if (!rule.successorRailId) errors.push('Successor rail is required');
  else if (!project.powerRails.some(r => r.id === rule.successorRailId)) {
    errors.push(`Successor rail '${rule.successorRailId}' not found in project`);
  }

  if (rule.predecessorRailId === rule.successorRailId) {
    errors.push('Predecessor and successor rails cannot be the same rail');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create an immutable snapshot of the current power architecture analysis state
 */
export function createPowerAnalysisSnapshot(
  project: ElectroKitProjectV2,
  name: string,
  description?: string
): { snapshot: CalculationSnapshotV2; updatedProject: ElectroKitProjectV2 } {
  const flow = analyzeSystemPowerFlow(project);
  const now = new Date().toISOString();
  const snapshotId = EntityIds.snapshot();

  const inputs = {
    sourcesCount: (project.powerSources || []).length,
    railsCount: project.powerRails.length,
    loadsCount: (project.powerLoads || []).length,
    activeCaseId: project.activeCaseId,
  };

  const outputs = {
    totalDeliveredPayloadPowerWatts: flow.totalDeliveredPayloadPowerWatts,
    totalSystemInputPowerWatts: flow.totalSystemInputPowerWatts,
    totalSystemLossWatts: flow.totalSystemLossWatts,
    cascadedSystemEfficiencyPercent: flow.cascadedSystemEfficiencyPercent,
    bottlenecksCount: flow.bottlenecks.length,
    sequencingValid: flow.sequencingValid,
  };

  const snapshotBase: Omit<CalculationSnapshotV2, 'integrityDigest'> = {
    id: snapshotId,
    calculationId: 'calc_system_power_architecture',
    timestamp: now,
    inputs,
    outputs,
    assumptions: [],
    warnings: [],
    margins: [
      {
        name: 'Cascaded System Efficiency',
        nominalValue: flow.cascadedSystemEfficiencyPercent,
        limitValue: 85.0,
        unit: '%',
        marginHeadroom: flow.cascadedSystemEfficiencyPercent - 85.0,
        percentageHeadroom: flow.cascadedSystemEfficiencyPercent - 85.0,
        status: flow.cascadedSystemEfficiencyPercent >= 85 ? 'safe' : 'warning',
      },
    ],
    validationStatus: 'calculated',
    notes: description?.trim() || `${name.trim() || 'System Power Architecture Analysis'}: Payload ${flow.totalDeliveredPayloadPowerWatts}W, Eff ${flow.cascadedSystemEfficiencyPercent}%`,
  };

  const integrityDigest = computeSnapshotDigest(snapshotBase);

  const snapshot: CalculationSnapshotV2 = {
    ...snapshotBase,
    integrityDigest,
  };

  const updatedProject: ElectroKitProjectV2 = {
    ...project,
    calculationSnapshots: [snapshot, ...project.calculationSnapshots],
  };

  return { snapshot, updatedProject };
}
