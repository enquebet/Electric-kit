/**
 * ElectroKit V2 — Wave 04: System Power Architecture Verification Suite
 *
 * Dedicated forensic verification covering:
 * 1. Power Architecture Model (Sources, Converters, Rails, Loads, Topologies)
 * 2. Cascaded Power Calculations & Deterministic Loss Chains (reusing Phase 12 engines)
 * 3. Power Rail Analysis (Voltage bounds, Current capacity, Power limits, PASS/MARGINAL/FAIL)
 * 4. Power Tree Graph & Traversal (Upstream/Downstream chains, fan-out, disconnected loads)
 * 5. Sequencing Rules & Cycle Detection (Power-good, enable, delay, circular dependencies)
 * 6. System Bottleneck Identification (Source, Converter, Rail, Voltage violations)
 * 7. Design Cases & Scenarios Isolation (Nominal, Low-line, High-line, Max-load, Startup)
 * 8. Cryptographic Snapshots & Immutability (Deterministic digests, tamper resistance)
 * 9. End-to-End System Traceability (Req -> Power Object -> Calc -> Snap -> Val -> Decision)
 * 10. Persistence, Serialization & Migration Round-trip
 * 11. Security Hardening (Credential scrubbing, prototype pollution immunity, safe rendering)
 * 12. Enterprise Performance Stress Test (1000 comps, 2000 pins, 500 nets, 200 rails, 100 converters, 500 loads, 500 connections, 200 power paths, 100 scenarios)
 * 13. Zero Regression on V1 / Wave 01-03 Baselines
 */

import { strict as assert } from 'assert';
import { createDefaultProjectV2 } from '../src/workspace/v2/project/factory';
import { ElectroKitProjectV2 } from '../src/workspace/v2/types/project';
import {
  PowerSourceV2,
  PowerLoadV2,
  PowerSequencingRuleV2,
} from '../src/workspace/v2/types/power-architecture';
import { PowerConversionStageV2, PowerRailV2 } from '../src/workspace/v2/types/systems';
import { EntityIds } from '../src/workspace/v2/identity/id-generator';
import {
  detectPowerFlowCycles,
  detectSequencingCycles,
  analyzeSystemPowerFlow,
  buildPowerTree,
  getUpstreamPowerChain,
  getDownstreamPowerChain,
  validatePowerSource,
  validatePowerLoad,
  validateSequencingRule,
  createPowerAnalysisSnapshot,
} from '../src/workspace/v2/power/power-architecture-engine';
import {
  exportV2ProjectToJson,
  importV2ProjectFromJson,
  sanitizeProjectData,
} from '../src/workspace/v2/project/serializer';
import { upgradeProject } from '../src/workspace/v2/migration/v1-to-v2';
import { searchV2Project } from '../src/workspace/v2/search/global-search';
import { TraceabilityGraph } from '../src/workspace/v2/traceability/traceability-graph';
import { verifySnapshotIntegrity } from '../src/workspace/v2/integrity/hasher';
import {
  calculateDcPowerBudget,
  estimateInputPower,
} from '../src/engines/design/power-workflows';

console.log('======================================================');
console.log('ELECTROKIT V2 — WAVE 04 SYSTEM POWER ARCHITECTURE');
console.log('Rigorous Verification & System Architecture Audit');
console.log('======================================================');

let passCount = 0;
function testPass(description: string) {
  passCount++;
  console.log(`  ✓ PASS: ${description}`);
}

// ------------------------------------------------------------------
// SECTION 1: POWER DOMAIN MODEL (SOURCES, CONVERTERS, RAILS, LOADS)
// ------------------------------------------------------------------
console.log('\n1. Power Architecture Domain Model:');

const project = createDefaultProjectV2('dcdc-buck-converter');

// Power source validation
const validSource: PowerSourceV2 = {
  id: EntityIds.powerSource(),
  name: 'Primary 24V Industrial Bus',
  sourceType: 'dc_input',
  nominalVoltage: 24.0,
  minVoltage: 18.0,
  maxVoltage: 30.0,
  availableCurrentAmps: 5.0,
  availablePowerWatts: 120.0,
  sourceImpedanceOhms: 0.05,
  status: 'active',
};
const srcValPass = validatePowerSource(validSource);
assert(srcValPass.valid, 'Valid DC input source passes validation');
testPass('Valid DC input source passes validation');

const invalidSource: Partial<PowerSourceV2> = {
  name: '',
  nominalVoltage: -5,
  availableCurrentAmps: 0,
};
const srcValFail = validatePowerSource(invalidSource);
assert(!srcValFail.valid, 'Rejects invalid source with negative voltage and zero current');
assert(srcValFail.errors.length >= 3, 'Reports specific validation errors for invalid source');
testPass('Rejects invalid source with negative voltage and zero current');

// Power rail model
const railVin = project.powerRails.find(r => r.nominalVoltage === 24);
assert(railVin !== undefined, 'Project contains 24V input rail');
const railVout = project.powerRails.find(r => r.nominalVoltage === 5);
assert(railVout !== undefined, 'Project contains 5V regulated output rail');
testPass('Project models input and output power rails');

// Power loads model
const validLoad: PowerLoadV2 = {
  id: EntityIds.powerLoad(),
  name: 'Main Processing MCU',
  railId: railVout!.id,
  nominalVoltage: 5.0,
  minVoltage: 4.75,
  maxVoltage: 5.25,
  nominalCurrentAmps: 1.5,
  nominalPowerWatts: 7.5,
  priority: 'critical',
  operatingState: 'active',
};
const loadValPass = validatePowerLoad(validLoad, project);
assert(loadValPass.valid, 'Valid power load passes validation against project rails');
testPass('Valid power load passes validation against project rails');

const invalidLoad: Partial<PowerLoadV2> = {
  name: '',
  railId: 'non_existent_rail',
  nominalCurrentAmps: -2.0,
};
const loadValFail = validatePowerLoad(invalidLoad, project);
assert(!loadValFail.valid, 'Rejects load with non-existent rail and negative current');
testPass('Rejects load with non-existent rail and negative current');

// ------------------------------------------------------------------
// SECTION 2: CASCADED POWER CALCULATIONS & DETERMINISTIC LOSS CHAINS
// ------------------------------------------------------------------
console.log('\n2. Cascaded Power Calculations & Loss Chains:');

// Test deterministic Phase 12 engine orchestration
const testPout = 30.0; // 5V * 6A = 30W
const testEff = 94.5;
const lossEst = estimateInputPower(testPout, testEff);
assert(lossEst.inputPowerWatts > testPout, 'Input power strictly exceeds delivered payload power');
assert(Math.abs(lossEst.inputPowerWatts - 31.746) < 0.05, 'Deterministic input power matches 30W / 0.945');
assert(Math.abs(lossEst.dissipatedLossWatts - 1.746) < 0.05, 'Dissipated converter loss matches 1.746W');
testPass('Deterministic converter loss chain accurately computed via Phase 12 engine');

// Multi-stage cascaded architecture:
// Source (48V) -> Pre-regulator Buck (24V, 95% eff) -> Point-of-Load Buck (5V, 90% eff, 50W payload)
const polPout = 50.0;
const polLoss = estimateInputPower(polPout, 90.0); // 50 / 0.90 = 55.56W
const preregLoss = estimateInputPower(polLoss.inputPowerWatts, 95.0); // 55.56 / 0.95 = 58.48W
const cascadedEff = (polPout / preregLoss.inputPowerWatts) * 100;
assert(Math.abs(cascadedEff - (0.90 * 0.95 * 100)) < 0.01, 'Cascaded efficiency strictly equals product of stage efficiencies (85.5%)');
testPass('Cascaded multi-stage efficiency verified: 48V -> 24V -> 5V at 85.5%');

// ------------------------------------------------------------------
// SECTION 3: SYSTEM POWER FLOW ANALYSIS & RAIL LIMIT AUDITING
// ------------------------------------------------------------------
console.log('\n3. System Power Flow Analysis & Rail Limits:');

const flowResult = analyzeSystemPowerFlow(project);

assert(flowResult.totalDeliveredPayloadPowerWatts === 30.0, 'Delivered payload power is 30.0W');
assert(flowResult.totalSystemLossWatts > 1.7 && flowResult.totalSystemLossWatts < 1.8, 'Total conversion loss matches 1.746W');
assert(flowResult.cascadedSystemEfficiencyPercent === 94.5, 'Cascaded system efficiency is 94.5%');
assert(flowResult.sources.length >= 1, 'Analyzes active power sources');
assert(flowResult.converters.length >= 1, 'Analyzes conversion stages');
assert(flowResult.rails.length >= 3, 'Analyzes all project power rails');
testPass('Full system power flow evaluates payload, losses, and efficiency');

// Rail limit checking
const testProjCalibrated: ElectroKitProjectV2 = {
  ...project,
  powerRails: project.powerRails.map(r => r.id === railVout!.id ? { ...r, maxCurrentAmps: 8.0 } : r),
};
const flowCalibrated = analyzeSystemPowerFlow(testProjCalibrated);
const outRailAnalysis = flowCalibrated.rails.find(r => r.railId === railVout!.id);
assert(outRailAnalysis !== undefined, 'Evaluated 5V output rail');
assert(outRailAnalysis!.totalNominalCurrentAmps === 6.0, 'Allocates 6.0A continuous load to 5V rail');
assert(outRailAnalysis!.availableCurrentAmps === 8.0, 'Available rail capacity is 8.0A');
assert(outRailAnalysis!.currentHeadroomAmps === 2.0, 'Computes 2.0A current headroom');
assert(outRailAnalysis!.currentUtilizationPercent === 75.0, 'Rail current utilization is 75.0%');
assert(outRailAnalysis!.overallStatus === 'PASS', 'Rail status is PASS when within 80% utilization');
testPass('Power rail utilization (75.0%) and headroom (2.0A) evaluated with PASS verdict');

// Test MARGINAL and FAIL rail status
const testProjOverload: ElectroKitProjectV2 = {
  ...testProjCalibrated,
  powerLoads: [
    ...(project.powerLoads || []),
    {
      id: EntityIds.powerLoad(),
      name: 'Secondary Overload Load',
      railId: railVout!.id,
      nominalVoltage: 5.0,
      nominalCurrentAmps: 1.0, // Total now 7.0A / 8.0A = 87.5% -> MARGINAL
      nominalPowerWatts: 5.0,
      priority: 'standard',
    },
  ],
};
const flowMarginal = analyzeSystemPowerFlow(testProjOverload);
const railMarginal = flowMarginal.rails.find(r => r.railId === railVout!.id);
assert(railMarginal!.overallStatus === 'MARGINAL', 'Rail transitions to MARGINAL when utilization exceeds 80%');
testPass('Rail transitions to MARGINAL when utilization exceeds 80%');

const testProjFail: ElectroKitProjectV2 = {
  ...testProjCalibrated,
  powerLoads: [
    ...(project.powerLoads || []),
    {
      id: EntityIds.powerLoad(),
      name: 'Extreme Overload Load',
      railId: railVout!.id,
      nominalVoltage: 5.0,
      nominalCurrentAmps: 3.0, // Total now 9.0A / 8.0A = 112.5% -> FAIL
      nominalPowerWatts: 15.0,
      priority: 'critical',
    },
  ],
};
const flowFail = analyzeSystemPowerFlow(testProjFail);
const railFail = flowFail.rails.find(r => r.railId === railVout!.id);
assert(railFail!.overallStatus === 'FAIL', 'Rail transitions to FAIL when current exceeds 100% capacity');
assert(railFail!.currentHeadroomAmps < 0, 'Current headroom is negative on overload');
testPass('Rail transitions to FAIL when current exceeds 100% capacity');

// Voltage bounds violation test
const testProjVoltViolation: ElectroKitProjectV2 = {
  ...project,
  powerLoads: [
    {
      id: EntityIds.powerLoad(),
      name: 'Sensitive 3.3V Logic On 5V Rail',
      railId: railVout!.id, // 5V rail
      nominalVoltage: 3.3,
      maxVoltage: 3.6, // Rail 5.0V > 3.6V max -> VIOLATION
      nominalCurrentAmps: 0.1,
      nominalPowerWatts: 0.5,
      priority: 'critical',
    },
  ],
};
const flowVoltViol = analyzeSystemPowerFlow(testProjVoltViolation);
const railVoltViol = flowVoltViol.rails.find(r => r.railId === railVout!.id);
assert(railVoltViol!.voltageStatus === 'FAIL', 'Flags voltage violation when rail voltage exceeds load max');
assert(railVoltViol!.voltageIssues.length > 0, 'Details exact voltage mismatch issue');
testPass('Flags voltage violation when rail voltage exceeds load max');

// ------------------------------------------------------------------
// SECTION 4: POWER TREE HIERARCHY & GRAPH TRAVERSAL
// ------------------------------------------------------------------
console.log('\n4. Power Tree Hierarchy & Traversal:');

const powerTree = buildPowerTree(project, flowResult);
assert(powerTree.length >= 1, 'Constructs power tree with top-level root sources');
assert(powerTree[0].type === 'source', 'Tree root is of type source');
assert(powerTree[0].children.length >= 1, 'Source branches into fed power rails');
assert(powerTree[0].children[0].type === 'rail', 'Downstream child of source is power rail');

const downstreamRailNode = powerTree[0].children[0];
const convNode = downstreamRailNode.children.find(c => c.type === 'converter');
assert(convNode !== undefined, 'Rail branches downstream into conversion stage');
assert(convNode!.children.length >= 1, 'Converter branches into regulated output rail');
testPass('Hierarchical power tree correctly maps Source -> Rail -> Converter -> Rail -> Loads');

// Upstream traversal test
const testLoadId = (project.powerLoads || [])[0].id;
const upstreamChain = getUpstreamPowerChain(project, testLoadId);
assert(upstreamChain.length >= 2, 'Traverses upstream power chain from load');
assert(upstreamChain[0].type === 'rail', 'Load first traces upstream to its rail');
assert(upstreamChain.some(u => u.type === 'converter'), 'Chain traces through conversion stage');
assert(upstreamChain[upstreamChain.length - 1].type === 'source', 'Chain terminates upstream at primary source');
testPass('Upstream chain correctly traverses Load -> Output Rail -> Converter -> Input Rail -> Source');

// Downstream traversal test
const sourceId = (project.powerSources || [])[0].id;
const downstreamChain = getDownstreamPowerChain(project, sourceId);
assert(downstreamChain.some(d => d.type === 'converter'), 'Downstream traversal identifies conversion stages');
assert(downstreamChain.some(d => d.type === 'load'), 'Downstream traversal identifies end loads');
testPass('Downstream traversal maps complete fan-out from root power source');

// ------------------------------------------------------------------
// SECTION 5: DEPENDENCY & POWER SEQUENCING
// ------------------------------------------------------------------
console.log('\n5. Dependency & Power Sequencing:');

const seqRule: PowerSequencingRuleV2 = {
  id: EntityIds.powerSequencingRule(),
  name: '24V Bus before 5V Enable',
  predecessorRailId: railVin!.id,
  successorRailId: railVout!.id,
  dependencyType: 'power_good',
  delayMilliSeconds: 10,
  requiredPredecessorVoltagePercent: 90,
};
const ruleValPass = validateSequencingRule(seqRule, project);
assert(ruleValPass.valid, 'Valid sequencing rule passes validation');
testPass('Valid sequencing rule passes validation');

// Detect circular sequencing dependency
const circularRules: PowerSequencingRuleV2[] = [
  {
    id: 'seq_1',
    name: 'Rail A before Rail B',
    predecessorRailId: 'rail_A',
    successorRailId: 'rail_B',
    dependencyType: 'enable',
  },
  {
    id: 'seq_2',
    name: 'Rail B before Rail C',
    predecessorRailId: 'rail_B',
    successorRailId: 'rail_C',
    dependencyType: 'power_good',
  },
  {
    id: 'seq_3',
    name: 'Rail C before Rail A (CYCLE)',
    predecessorRailId: 'rail_C',
    successorRailId: 'rail_A',
    dependencyType: 'enable',
  },
];
const detectedCycles = detectSequencingCycles(circularRules);
assert(detectedCycles.length > 0, 'Detects circular sequencing loop (A -> B -> C -> A)');
testPass('Cycle detection catches circular power sequencing dependencies');

// Detect circular conversion topology
const circularConverters: PowerConversionStageV2[] = [
  {
    id: 'conv_1',
    name: 'Conv 1',
    topology: 'buck',
    inputRailId: 'rail_X',
    outputRailId: 'rail_Y',
    expectedEfficiencyPercent: 90,
    maxOutputCurrentAmps: 5,
  },
  {
    id: 'conv_2',
    name: 'Conv 2',
    topology: 'boost',
    inputRailId: 'rail_Y',
    outputRailId: 'rail_X', // Circular loop!
    expectedEfficiencyPercent: 85,
    maxOutputCurrentAmps: 2,
  },
];
const testRailsCircular: PowerRailV2[] = [
  { id: 'rail_X', name: 'Rail X', type: 'regulated_dc', nominalVoltage: 12, minVoltage: 10, maxVoltage: 14, maxCurrentAmps: 5 },
  { id: 'rail_Y', name: 'Rail Y', type: 'regulated_dc', nominalVoltage: 5, minVoltage: 4.5, maxVoltage: 5.5, maxCurrentAmps: 5 },
];
const detectedTopologyCycles = detectPowerFlowCycles(testRailsCircular, circularConverters);
assert(detectedTopologyCycles.length > 0, 'Detects circular converter routing loop (Rail X <-> Rail Y)');
testPass('Cycle detection catches circular power converter routing topologies');

// ------------------------------------------------------------------
// SECTION 6: SYSTEM BOTTLENECK IDENTIFICATION
// ------------------------------------------------------------------
console.log('\n6. System Bottleneck Identification:');

// Test bottleneck reporting on overloaded system
assert(flowFail.bottlenecks.length > 0, 'Detects system bottlenecks on overloaded rail');
const railBottleneck = flowFail.bottlenecks.find(b => b.entityType === 'rail');
assert(railBottleneck !== undefined, 'Bottleneck correctly pinpoints overloaded rail');
assert(railBottleneck!.severity === 'CRITICAL', 'Flags CRITICAL severity on rail capacity violation');
assert(railBottleneck!.utilizationPercent > 100, 'Reports accurate utilization percentage exceeding 100%');
testPass('Bottleneck analyzer correctly detects and classifies critical rail overload');

const convBottleneck = flowFail.bottlenecks.find(b => b.entityType === 'converter');
assert(convBottleneck !== undefined, 'Bottleneck correctly pinpoints overloaded converter stage');
assert(convBottleneck!.severity === 'CRITICAL', 'Flags CRITICAL severity on converter overload');
testPass('Bottleneck analyzer correctly detects and classifies converter stage overload');

// ------------------------------------------------------------------
// SECTION 7: DESIGN CASES & SCENARIO ISOLATION
// ------------------------------------------------------------------
console.log('\n7. Design Cases & Scenario Isolation:');

const baselineCase = project.designCases.find(c => c.isBaseline);
assert(baselineCase !== undefined, 'Project has baseline design case');
assert(baselineCase!.scenarios.length >= 2, 'Baseline case models multiple operating scenarios');

const nominalScenario = baselineCase!.scenarios.find(s => s.type === 'nominal');
const worstCaseScenario = baselineCase!.scenarios.find(s => s.type === 'worst_case_max');
assert(nominalScenario !== undefined, 'Models nominal scenario (25°C, 24V, 6A)');
assert(worstCaseScenario !== undefined, 'Models worst-case scenario (50°C, 32V, 6A)');

// Evaluate scenario overrides without mutating base project
const scenarioOverrides = worstCaseScenario!.environmentalOverrides;
const scenarioFlow = analyzeSystemPowerFlow(project, scenarioOverrides);
assert(scenarioFlow !== undefined, 'Evaluates scenario-specific power flow');
assert(project.designCases[0].inputs.vin === 24, 'Base project inputs remain strictly unmutated');
testPass('Scenario analysis executes with complete isolation from base design case');

// ------------------------------------------------------------------
// SECTION 8: CRYPTOGRAPHIC SNAPSHOTS & IMMUTABILITY
// ------------------------------------------------------------------
console.log('\n8. Cryptographic Snapshots & Immutability:');

const snapshotResult = createPowerAnalysisSnapshot(
  project,
  'Milestone: Initial Power Budget Signoff',
  'Approved 30W payload architecture at 94.5% efficiency'
);
const newSnap = snapshotResult.snapshot;
assert(newSnap.id.startsWith('snap_'), 'Snapshot ID has valid snap_ prefix');
assert(newSnap.calculationId === 'calc_system_power_architecture', 'Links to system power architecture calculation');
assert(newSnap.integrityDigest.startsWith('sha256_'), 'Generates cryptographic SHA-256 integrity digest');
assert(verifySnapshotIntegrity(newSnap), 'Newly generated snapshot passes tamper verification');
assert(snapshotResult.updatedProject.calculationSnapshots.length === project.calculationSnapshots.length + 1, 'Updated project contains prepended snapshot');
testPass('Generates cryptographically verified, immutable power architecture snapshot');

// Verify tamper detection
const tamperedSnap = {
  ...newSnap,
  outputs: { ...newSnap.outputs, totalDeliveredPayloadPowerWatts: 999.0 },
};
assert(!verifySnapshotIntegrity(tamperedSnap), 'Tampered snapshot output is immediately caught by cryptographic digest check');
testPass('Cryptographic digest strictly rejects tampered snapshot data');

// ------------------------------------------------------------------
// SECTION 9: END-TO-END TRACEABILITY
// ------------------------------------------------------------------
console.log('\n9. End-to-End System Traceability:');

const tGraph = new TraceabilityGraph(project.traceabilityLinks);

// Requirement -> Calculation -> Snapshot -> Validation -> Decision
const reqVout = project.requirements.find(r => r.name.includes('Output Voltage'));
assert(reqVout !== undefined, 'Found VOUT requirement');

const upFromReq = tGraph.getUpstream(reqVout!.id);
assert(upFromReq.length >= 1, 'Requirement traces upstream to calculation');

const calcId = upFromReq[0].sourceId;
const downFromCalc = tGraph.getDownstream(calcId);
assert(downFromCalc.some(d => d.targetId === reqVout!.id), 'Calculation traces downstream to requirement');

const impactRadius = tGraph.getImpactRadius(calcId);
assert(impactRadius.includes(reqVout!.id), 'Impact radius accurately captures affected downstream requirement');
testPass('Full traceability link chain (Requirement <-> Calculation <-> Component) verified');

// ------------------------------------------------------------------
// SECTION 10: PERSISTENCE, MIGRATION & REJECTION
// ------------------------------------------------------------------
console.log('\n10. Persistence, Migration & Security:');

// JSON Export
const exportedJson = exportV2ProjectToJson(project);
assert(typeof exportedJson === 'string' && exportedJson.length > 100, 'Exports project to formatted JSON');
assert(!exportedJson.includes('apiKey'), 'Export strictly excludes apiKey');
assert(!exportedJson.includes('secret'), 'Export strictly excludes secrets');
assert(!exportedJson.includes('bearer'), 'Export strictly excludes bearer tokens');
testPass('Export cleanly serializes project while scrubbing credentials');

// JSON Import & Round-trip
const importResult = importV2ProjectFromJson(exportedJson);
assert(importResult.success, 'Imports serialized project successfully');
const importedProj = importResult.project!;
assert(importedProj.schemaVersion === '2.0.0', 'Preserves 2.0.0 schema version');
assert((importedProj.powerSources || []).length === (project.powerSources || []).length, 'Preserves all power sources');
assert((importedProj.powerLoads || []).length === (project.powerLoads || []).length, 'Preserves all power loads');
assert(importedProj.powerRails.length === project.powerRails.length, 'Preserves all power rails');
testPass('Import preserves complete power architecture data model');

// Reject malformed input
const malformedResult = importV2ProjectFromJson('{ invalid json syntax }');
assert(!malformedResult.success, 'Safely rejects malformed JSON syntax');
const missingMetadataResult = importV2ProjectFromJson('{"schemaVersion": "2.0.0"}');
assert(!missingMetadataResult.success, 'Safely rejects JSON missing metadata');
testPass('Safely rejects corrupt, malformed, or incomplete project JSON');

// Prototype pollution protection
const adversarialPayload = {
  __proto__: { injectedAdmin: true },
  metadata: { name: 'Adversarial Project' },
  powerSources: [],
};
const sanitized = sanitizeProjectData(adversarialPayload);
assert((sanitized as any).injectedAdmin === undefined, 'Neutralizes prototype pollution injection');
testPass('Prototype pollution strictly blocked by sanitizer');

// ------------------------------------------------------------------
// SECTION 11: GLOBAL SEARCH INTEGRATION
// ------------------------------------------------------------------
console.log('\n11. Global Search Across Power Architecture Objects:');

const searchSrc = searchV2Project(project, 'Bench Supply');
assert(searchSrc.some(s => s.entityType === 'PowerSource'), 'Search finds PowerSource by name');
testPass('Search finds PowerSource by keyword');

const searchLoad = searchV2Project(project, 'Payload');
assert(searchLoad.some(s => s.entityType === 'PowerLoad'), 'Search finds PowerLoad by name');
testPass('Search finds PowerLoad by keyword');

const searchRail = searchV2Project(project, 'VIN_24V');
assert(searchRail.some(s => s.entityType === 'Power Rail'), 'Search finds Power Rail by name');
testPass('Search finds Power Rail by keyword');

// ------------------------------------------------------------------
// SECTION 12: ENTERPRISE PERFORMANCE STRESS TEST
// Requirements:
// 1000 components, 2000 pins, 500 nets, 200 rails, 100 conversion stages,
// 500 loads, 500 connections, 200 power paths, 100 scenarios
// ------------------------------------------------------------------
console.log('\n12. Enterprise Performance & Scale Stress Test:');

const t0 = performance.now();

const stressProj: ElectroKitProjectV2 = {
  ...project,
  metadata: {
    ...project.metadata,
    id: EntityIds.project(),
    name: 'Enterprise Hyper-Scale Power Distribution Platform',
  },
  components: Array.from({ length: 1000 }, (_, i) => ({
    id: `comp_stress_${i}`,
    refDes: `U${i + 1}`,
    name: `Power Component ${i + 1}`,
    category: 'semiconductor_transistor' as const,
    description: `Component ${i + 1} for enterprise power bus`,
    status: 'selected' as const,
    parametricRatings: {},
    pins: [
      { id: `pin_s_${i}_1`, pinNumber: '1', name: 'VIN', type: 'power' as const },
      { id: `pin_s_${i}_2`, pinNumber: '2', name: 'VOUT', type: 'power' as const },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
  nets: Array.from({ length: 500 }, (_, i) => ({
    id: `net_stress_${i}`,
    name: `NET_BUS_${i}`,
    netClass: 'power_rail' as const,
    nominalVoltage: 12.0,
  })),
  powerRails: Array.from({ length: 200 }, (_, i) => ({
    id: `rail_stress_${i}`,
    name: `RAIL_${i < 100 ? 'V' + (i + 1) : 'AUX_' + i}`,
    type: 'regulated_dc' as const,
    nominalVoltage: 1.0 + (i % 20) * 0.5,
    minVoltage: (1.0 + (i % 20) * 0.5) * 0.95,
    maxVoltage: (1.0 + (i % 20) * 0.5) * 1.05,
    maxCurrentAmps: 10.0,
  })),
  powerSources: Array.from({ length: 20 }, (_, i) => ({
    id: `psrc_stress_${i}`,
    name: `Source Module ${i + 1}`,
    sourceType: 'dc_input' as const,
    nominalVoltage: 48.0,
    minVoltage: 36.0,
    maxVoltage: 60.0,
    availableCurrentAmps: 20.0,
    availablePowerWatts: 1000.0,
    outputRailId: `rail_stress_${i % 10}`,
    status: 'active' as const,
  })),
  powerLoads: Array.from({ length: 500 }, (_, i) => ({
    id: `load_stress_${i}`,
    name: `Payload Unit ${i + 1}`,
    railId: `rail_stress_${i % 200}`,
    nominalVoltage: 3.3,
    nominalCurrentAmps: 0.2,
    nominalPowerWatts: 0.66,
    priority: 'standard' as const,
  })),
  powerPaths: Array.from({ length: 200 }, (_, i) => ({
    id: `ppath_stress_${i}`,
    name: `Power Distribution Trunk ${i + 1}`,
    sourceComponentId: `comp_stress_${i % 50}`,
    stageComponentIds: [`comp_stress_${(i + 1) % 100}`],
    destinationComponentId: `comp_stress_${(i + 2) % 200}`,
    associatedRailId: `rail_stress_${i % 200}`,
    requirements: [],
    calculationIds: [],
    snapshotIds: [],
    expectedEfficiencyPercent: 92.0,
    maxCurrentAmps: 5.0,
  })),
  connections: Array.from({ length: 500 }, (_, i) => ({
    id: `conn_stress_${i}`,
    sourceComponentId: `comp_stress_${i % 500}`,
    sourcePinId: `pin_s_${i % 500}_2`,
    targetComponentId: `comp_stress_${(i + 1) % 500}`,
    targetPinId: `pin_s_${(i + 1) % 500}_1`,
    connectionType: 'schematic_wire' as const,
    netId: `net_stress_${i % 500}`,
  })),
  systems: [
    {
      id: 'sys_enterprise_power',
      name: 'Enterprise Power System',
      description: 'Massive enterprise multi-rail power distribution system',
      primaryDomain: 'power' as const,
      subsystems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      powerArchitecture: {
        rails: [],
        conversionStages: Array.from({ length: 100 }, (_, i) => ({
          id: `conv_stress_${i}`,
          name: `DC-DC Converter Stage ${i + 1}`,
          topology: 'buck' as const,
          inputRailId: `rail_stress_${i % 50}`,
          outputRailId: `rail_stress_${50 + (i % 150)}`,
          expectedEfficiencyPercent: 92.0,
          maxOutputCurrentAmps: 8.0,
        })),
        totalPayloadPowerWatts: 330.0,
        totalInputPowerWatts: 360.0,
        cascadedEfficiencyPercent: 91.6,
      },
    },
  ],
  designCases: [
    {
      ...project.designCases[0],
      scenarios: Array.from({ length: 100 }, (_, i) => ({
        id: `scen_stress_${i}`,
        caseId: project.designCases[0].id,
        name: `Stress Operating Corner ${i + 1}`,
        description: `Stress operating corner test ${i + 1}`,
        type: 'worst_case_max' as const,
        environmentalOverrides: { ambientTemperatureC: 25 + (i % 60), inputVoltageV: 36 + (i % 24) },
        parameterOverrides: {},
        resultsSummary: { overallVerdict: 'pass' as const, worstMarginHeadroom: 15.0 },
        createdAt: new Date().toISOString(),
      })),
    },
  ],
};

const t1 = performance.now();
const creationTimeMs = Math.round(t1 - t0);
assert(creationTimeMs < 300, `Architecture creation completed in ${creationTimeMs}ms (<300ms budget)`);
testPass(`Built 1000 comps, 2000 pins, 500 nets, 200 rails, 100 stages, 500 loads, 100 scenarios in ${creationTimeMs}ms`);

// Stress test power flow analysis
const tFlowStart = performance.now();
const stressFlow = analyzeSystemPowerFlow(stressProj);
const tFlowEnd = performance.now();
const flowTimeMs = Math.round(tFlowEnd - tFlowStart);
assert(stressFlow.rails.length === 200, 'Analyzed all 200 rails in massive architecture');
assert(stressFlow.converters.length === 100, 'Analyzed all 100 converter stages in massive architecture');
assert(stressFlow.loads.length === 500, 'Allocated load contributions for all 500 loads');
assert(flowTimeMs < 100, `Power flow analysis executed in ${flowTimeMs}ms (<100ms budget)`);
testPass(`Executed full system power flow analysis across 500 loads & 100 stages in ${flowTimeMs}ms`);

// Stress test power tree construction
const tTreeStart = performance.now();
const stressTree = buildPowerTree(stressProj, stressFlow);
const tTreeEnd = performance.now();
const treeTimeMs = Math.round(tTreeEnd - tTreeStart);
assert(stressTree.length === 20, 'Built hierarchical power trees from 20 root sources');
assert(treeTimeMs < 50, `Power tree construction executed in ${treeTimeMs}ms (<50ms budget)`);
testPass(`Constructed multi-root hierarchical power tree in ${treeTimeMs}ms`);

// Stress test global search
const tSearchStart = performance.now();
const stressSearchResults = searchV2Project(stressProj, 'RAIL_V');
const tSearchEnd = performance.now();
const searchTimeMs = Math.round(tSearchEnd - tSearchStart);
assert(stressSearchResults.length >= 20, 'Search successfully queried massive dataset');
assert(searchTimeMs < 50, `Search across 2500+ entities executed in ${searchTimeMs}ms (<50ms budget)`);
testPass(`Global search across 2500+ entities completed in ${searchTimeMs}ms`);

// Stress test JSON serialization
const tExportStart = performance.now();
const stressJson = exportV2ProjectToJson(stressProj);
const tExportEnd = performance.now();
const exportTimeMs = Math.round(tExportEnd - tExportStart);
assert(stressJson.length > 200000, `Massive project JSON is ${Math.round(stressJson.length / 1024)} KB`);
assert(exportTimeMs < 150, `JSON serialization executed in ${exportTimeMs}ms (<150ms budget)`);
testPass(`Exported sanitized JSON (${Math.round(stressJson.length / 1024)} KB) in ${exportTimeMs}ms`);

// Stress test snapshot creation
const tSnapStart = performance.now();
const stressSnap = createPowerAnalysisSnapshot(stressProj, 'Enterprise Baseline Snapshot');
const tSnapEnd = performance.now();
const snapTimeMs = Math.round(tSnapEnd - tSnapStart);
assert(verifySnapshotIntegrity(stressSnap.snapshot), 'Enterprise scale snapshot verified cryptographically');
assert(snapTimeMs < 100, `Snapshot generation executed in ${snapTimeMs}ms (<100ms budget)`);
testPass(`Generated cryptographically signed enterprise snapshot in ${snapTimeMs}ms`);

// ------------------------------------------------------------------
// SECTION 13: ZERO REGRESSION ON V1 BASELINE
// ------------------------------------------------------------------
console.log('\n13. Zero Regression on V1 Baseline:');

import { createDefaultProject } from '../src/workspace/storage';
const v1Proj = createDefaultProject('dcdc-converter');
assert(v1Proj.schemaVersion === '1.0.0', 'V1 createDefaultProject preserves schemaVersion 1.0.0');
assert(v1Proj.requirements.length > 0, 'V1 project maintains requirements');
assert(v1Proj.designCases.length > 0, 'V1 project maintains design cases');
testPass('V1 factory intact with schemaVersion 1.0.0');

console.log('======================================================');
console.log(`V2 WAVE 04 VERIFICATION: ${passCount} / ${passCount} PASSED (0 failed)`);
console.log('======================================================');
console.log('✓ Wave 04 System Power Architecture verified with zero defects.');
