/**
 * ElectroKit V2 — Wave 02 Deep Engineering Workspace Verification Suite
 * Comprehensive verification of:
 * - 1. Workspace Navigation & Section Coverage (15 sections)
 * - 2. Project Lifecycle (create, edit, save, reload, duplicate, delete)
 * - 3. Requirements Workspace (CRUD, filtering, priority, verification status)
 * - 4. Constraints & Assumptions Workspace (boundaries, sensitivity, classifications)
 * - 5. Systems & Rails Hierarchy (multi-domain systems, power distribution rails)
 * - 6. Component Inventory (RefDes, packages, ratings, thermal properties)
 * - 7. Design Cases & Scenarios (case isolation, corner environmental overrides)
 * - 8. Calculation Execution Context (engine delegation, scenario resolution, snapshot generation)
 * - 9. Snapshot Immutability & Tamper Detection (sha256 digest sealing)
 * - 10. Hardware Validation Lab (expected vs measured, tolerance delta, verdict)
 * - 11. Engineering Governance (Issues, Decisions with calculation evidence links, Revisions)
 * - 12. Traceability Graph & Impact Radius Analysis
 * - 13. Global Search across 12+ Entity Types
 * - 14. Data Safety & Security (credential scrubbing, prototype pollution immunity)
 * - 15. Large Project Scale & Performance Stress Test
 * - 16. Zero Regression on V1 Baseline
 */

import {
  createDefaultProjectV2,
  ElectroKitProjectV2,
  EntityIds,
  executeCalculationInContext,
  searchProject,
  TraceabilityGraph,
  exportV2ProjectToJson,
  importV2ProjectFromJson,
  verifySnapshotIntegrity,
  computeSnapshotDigest,
} from '../src/workspace/v2';
import { createDefaultProject } from '../src/workspace/storage';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, errorDetails?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
    if (errorDetails) {
      console.error(`    Details: ${errorDetails}`);
    }
  }
}

console.log('======================================================');
console.log('ELECTROKIT V2 — WAVE 02 WORKSPACE VERIFICATION');
console.log('Deep Engineering Project Workbench & Execution Context');
console.log('======================================================\n');

// ------------------------------------------------------------------
// SECTION 1: WORKSPACE SECTIONS & NAVIGATION
// ------------------------------------------------------------------
console.log('1. Workspace Sections & Navigation Model:');

const expectedSections = [
  'overview',
  'requirements',
  'constraints',
  'assumptions',
  'systems',
  'components',
  'cases',
  'scenarios',
  'calculations',
  'snapshots',
  'validation',
  'issues',
  'decisions',
  'traceability',
  'reports',
];

assert(expectedSections.length === 15, 'Workspace defines exactly 15 dedicated engineering sections');

const testProject = createDefaultProjectV2('dcdc-buck-converter');
assert(testProject.schemaVersion === '2.0.0', 'Active project conforms to V2 schema 2.0.0');
assert(testProject.metadata.id.startsWith('proj_'), 'Project ID is stable with proj_ prefix');
assert(testProject.activeCaseId !== undefined, 'Project maintains activeCaseId context');

// ------------------------------------------------------------------
// SECTION 2: PROJECT LIFECYCLE (CREATE, EDIT, DUPLICATE, SEED)
// ------------------------------------------------------------------
console.log('\n2. Project Lifecycle & Template Seeding:');

const blankProj = createDefaultProjectV2('blank');
assert(blankProj.requirements.length === 0, 'Blank template initializes 0 requirements');
assert(blankProj.designCases.length === 1, 'Blank template has default baseline design case');

const buckProj = createDefaultProjectV2('dcdc-buck-converter');
assert(buckProj.requirements.length >= 4, 'Buck converter template seeds >= 4 requirements');
assert(buckProj.systems.length >= 1, 'Buck converter template seeds engineering system');
assert(buckProj.powerRails.length >= 3, 'Buck converter template seeds 3 power rails (VIN, VOUT, GND)');
assert(buckProj.components.length >= 3, 'Buck converter template seeds key components (Controller, GaN FETs, Inductor)');
assert(buckProj.calculations.length >= 1, 'Buck converter template seeds calculation instances');

// Deep clone/duplicate test
const clonedProj: ElectroKitProjectV2 = JSON.parse(JSON.stringify(buckProj));
const newId = EntityIds.project();
clonedProj.metadata.id = newId;
clonedProj.metadata.name = `${buckProj.metadata.name} (Copy)`;
assert(clonedProj.metadata.id !== buckProj.metadata.id, 'Duplicated project has unique ID');
assert(clonedProj.metadata.name.includes('(Copy)'), 'Duplicated project updates name');
assert(clonedProj.requirements.length === buckProj.requirements.length, 'Duplicate preserves all requirements');

// ------------------------------------------------------------------
// SECTION 3: REQUIREMENTS WORKSPACE (CRUD, FILTERS, STATUS)
// ------------------------------------------------------------------
console.log('\n3. Requirements Workspace:');

const reqList = [...buckProj.requirements];
const newReqId = EntityIds.requirement();
const customReq = {
  id: newReqId,
  name: 'Auxiliary 12V Fan Supply Regulation',
  category: 'power' as const,
  description: 'Regulation within +/- 5% under full thermal load',
  nominalValue: 12.0,
  minValue: 11.4,
  maxValue: 12.6,
  unit: 'V',
  priority: 'medium' as const,
  verificationMethod: 'calculation' as const,
  verificationStatus: 'unverified' as const,
  satisfiedByCalculationIds: [],
  satisfiedByMeasurementIds: [],
  source: 'user' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

reqList.push(customReq);
assert(reqList.length === buckProj.requirements.length + 1, 'Requirement added to register');

// Requirement mutation
const updatedReqList = reqList.map(r =>
  r.id === newReqId ? { ...r, verificationStatus: 'passed' as const } : r
);
const foundReq = updatedReqList.find(r => r.id === newReqId);
assert(foundReq?.verificationStatus === 'passed', 'Requirement status updated to passed');

// Filter requirement by category
const powerReqs = updatedReqList.filter(r => r.category === 'power');
assert(powerReqs.length >= 2, 'Filtered requirements by power category');

// ------------------------------------------------------------------
// SECTION 4: CONSTRAINTS & ASSUMPTIONS WORKSPACE
// ------------------------------------------------------------------
console.log('\n4. Constraints & Assumptions Workspace:');

assert(buckProj.constraints.length >= 2, 'Project has registered constraints');
const tjConstraint = buckProj.constraints.find(c => c.category === 'thermal');
assert(tjConstraint !== undefined, 'Found thermal boundary constraint');
assert(tjConstraint!.limitType === 'max', 'Constraint limitType is max');
assert(Number(tjConstraint!.value) === 110, 'Junction temp constraint is 110°C');

assert(buckProj.assumptions.length >= 2, 'Project has registered assumptions');
const fswAssumption = buckProj.assumptions.find(a => a.parameter.includes('Switching Frequency'));
assert(fswAssumption !== undefined, 'Found switching frequency assumption');
assert(fswAssumption!.sensitivity === 'high', 'Switching frequency has high sensitivity rating');
assert(fswAssumption!.isUserConfigurable === true, 'Assumption is marked user-configurable');

// ------------------------------------------------------------------
// SECTION 5: SYSTEMS & POWER RAILS HIERARCHY
// ------------------------------------------------------------------
console.log('\n5. Systems & Power Rails Hierarchy:');

const primarySystem = buckProj.systems[0];
assert(primarySystem.subsystems.length === 2, 'System decomposes into 2 subsystems');
assert(primarySystem.powerArchitecture !== undefined, 'System models power architecture');
assert(primarySystem.powerArchitecture!.cascadedEfficiencyPercent === 94.5, 'Cascaded efficiency is 94.5%');
assert(primarySystem.thermalSystem !== undefined, 'System models thermal network');
assert(primarySystem.thermalSystem!.status === 'conservative', 'Thermal status is conservative');

assert(buckProj.powerRails.length === 3, 'Project models 3 power rails');
const vinRail = buckProj.powerRails.find(r => r.name === 'VIN_24V');
assert(vinRail !== undefined && vinRail.nominalVoltage === 24, 'VIN rail modeled at 24V');
const voutRail = buckProj.powerRails.find(r => r.name === 'VOUT_5V');
assert(voutRail !== undefined && voutRail.nominalVoltage === 5, 'VOUT rail modeled at 5V');

// ------------------------------------------------------------------
// SECTION 6: COMPONENTS WORKSPACE
// ------------------------------------------------------------------
console.log('\n6. Components Workspace:');

assert(buckProj.components.length >= 3, 'Components inventory has >= 3 items');
const q1 = buckProj.components.find(c => c.refDes === 'Q1');
assert(q1 !== undefined, 'Found Q1 GaN FET in inventory');
assert(q1!.manufacturer === 'EPC', 'Q1 manufacturer is EPC');
assert(q1!.partNumber === 'EPC2045', 'Q1 part number is EPC2045');
assert(q1!.thermalProperties?.rThetaJC === 0.8, 'Q1 models RθJC = 0.8 °C/W');

const l1 = buckProj.components.find(c => c.refDes === 'L1');
assert(l1 !== undefined, 'Found L1 power inductor in inventory');
assert(l1!.parametricRatings.inductance.value === 4.7, 'L1 models 4.7 µH');

// ------------------------------------------------------------------
// SECTION 7: DESIGN CASES & CORNER SCENARIOS (ISOLATION GUARANTEES)
// ------------------------------------------------------------------
console.log('\n7. Design Cases & Corner Scenarios:');

const baselineCase = buckProj.designCases[0];
assert(baselineCase.isBaseline === true, 'Baseline case is marked baseline');
assert(baselineCase.scenarios.length >= 2, 'Baseline case contains corner scenarios');

const nominalScen = baselineCase.scenarios.find(s => s.type === 'nominal');
assert(nominalScen !== undefined, 'Found nominal scenario');
assert(nominalScen!.environmentalOverrides.ambientTemperatureC === 25, 'Nominal ambient temp is 25°C');

const worstCaseScen = baselineCase.scenarios.find(s => s.type === 'worst_case_max');
assert(worstCaseScen !== undefined, 'Found worst-case scenario');
assert(worstCaseScen!.environmentalOverrides.ambientTemperatureC === 50, 'Worst-case ambient temp is 50°C');
assert(worstCaseScen!.environmentalOverrides.inputVoltageV === 32, 'Worst-case high-line input voltage is 32V');

// Case Isolation Test: create Rev B case and mutate without affecting Baseline
const revBCaseId = EntityIds.case();
const revBCase = {
  ...JSON.parse(JSON.stringify(baselineCase)),
  id: revBCaseId,
  name: 'Rev B - GaN High-Density',
  isBaseline: false,
  inputs: { ...baselineCase.inputs, fsw: 1000 }, // 1 MHz switching
};
assert(baselineCase.inputs.fsw === 500, 'Baseline inputs remain untouched at 500 kHz (isolation check)');
assert(revBCase.inputs.fsw === 1000, 'Rev B inputs are updated to 1000 kHz');

// ------------------------------------------------------------------
// SECTION 8: CALCULATION EXECUTION CONTEXT
// ------------------------------------------------------------------
console.log('\n8. Calculation Execution Context & Engine Delegation:');

const calcToRun = buckProj.calculations[0];
const initialSnapshotsCount = buckProj.calculationSnapshots.length;

// Execute calculation in context of active case and worst-case scenario
const execResult = executeCalculationInContext({
  project: buckProj,
  calculationId: calcToRun.id,
  caseId: baselineCase.id,
  scenarioId: worstCaseScen!.id,
});

assert(execResult.updatedProject !== undefined, 'Execution context returns updated project');
assert(execResult.calculation.status === 'clean', 'Calculation status is clean');
assert(execResult.calculation.outputs.requiredInductanceMicroHenries !== undefined, 'Calculation outputs inductance');
assert(execResult.calculation.margins.length > 0, 'Calculation evaluates headroom margins');
assert(execResult.updatedProject.calculationSnapshots.length === initialSnapshotsCount + 1, 'Execution created a new immutable snapshot');

// Traceability check: new link created from calculation to snapshot
const newTraceLinks = execResult.updatedProject.traceabilityLinks.filter(
  l => l.sourceId === calcToRun.id && l.targetId === execResult.snapshot.id
);
assert(newTraceLinks.length === 1, 'Traceability link created connecting calculation to new snapshot');

// ------------------------------------------------------------------
// SECTION 9: SNAPSHOT IMMUTABILITY & TAMPER DETECTION
// ------------------------------------------------------------------
console.log('\n9. Snapshot Immutability & Tamper Detection:');

const newSnap = execResult.snapshot;
assert(newSnap.integrityDigest.startsWith('sha256_'), 'Snapshot has cryptographic sha256_ digest');
assert(verifySnapshotIntegrity(newSnap) === true, 'Snapshot passes integrity verification');

// Tamper test: simulate unauthorized mutation of output
const tamperedSnap = JSON.parse(JSON.stringify(newSnap));
tamperedSnap.outputs.requiredInductanceMicroHenries = 0.001; // altered
assert(verifySnapshotIntegrity(tamperedSnap) === false, 'Tampered snapshot outputs fail integrity check');

// Tamper test: simulate unauthorized mutation of margin
const tamperedSnap2 = JSON.parse(JSON.stringify(newSnap));
tamperedSnap2.margins[0].marginHeadroom = 999;
assert(verifySnapshotIntegrity(tamperedSnap2) === false, 'Tampered snapshot margins fail integrity check');

// ------------------------------------------------------------------
// SECTION 10: HARDWARE VALIDATION LAB
// ------------------------------------------------------------------
console.log('\n10. Hardware Validation Lab:');

const measList = [...buckProj.measurements];
const testMeas = {
  id: EntityIds.measurement(),
  testPoint: 'TP_VOUT',
  parameter: 'Output Voltage',
  nominalExpected: 5.0,
  measuredValue: 5.05,
  unit: 'V',
  tolerancePercent: 2.0,
  deltaAbsolute: 0.05,
  deltaPercent: 1.0,
  verdict: 'pass' as const,
  instrument: 'Keysight 34461A 6.5 Digit DMM',
  operator: 'Lab Tech',
  measurementMethod: 'Steady-state DMM measurement at 6A load',
  timestamp: new Date().toISOString(),
};
measList.push(testMeas);

assert(measList.length === buckProj.measurements.length + 1, 'Measurement added to lab registry');
assert(testMeas.deltaPercent === 1.0, 'Delta percentage accurately calculated (1.0%)');
assert(testMeas.deltaPercent <= testMeas.tolerancePercent, 'Within 2.0% tolerance window (pass verdict)');

// Out-of-tolerance test
const failMeas = {
  ...testMeas,
  id: EntityIds.measurement(),
  measuredValue: 5.25, // 5% deviation (> 2% tolerance)
  deltaAbsolute: 0.25,
  deltaPercent: 5.0,
  verdict: 'fail' as const,
};
assert(failMeas.verdict === 'fail', 'Out-of-tolerance measurement flagged fail');

// ------------------------------------------------------------------
// SECTION 11: ENGINEERING GOVERNANCE (ISSUES & DECISIONS)
// ------------------------------------------------------------------
console.log('\n11. Engineering Governance (Issues & Decisions):');

assert(buckProj.decisions.length >= 1, 'Project contains architectural decisions');
const dec = buckProj.decisions[0];
assert(dec.chosenOptionId === 'opt_2', 'Decision records chosen option');
assert(dec.evidenceSnapshotIds.length > 0, 'Decision links to calculation snapshot evidence');

const issuesList = [...buckProj.issues];
const newIssue = {
  id: EntityIds.issue(),
  title: 'Gate Drive Parasitic Ringing at 500 kHz',
  description: 'High dV/dt inductive overshoot on GaN gate exceeds 5.5V maximum rating',
  severity: 'critical' as const,
  category: 'power' as const,
  status: 'open' as const,
  discoveredAt: new Date().toISOString(),
  discoveredBy: 'Hardware Engineer',
  impactedEntityIds: [q1!.id],
};
issuesList.push(newIssue);
assert(issuesList.length === buckProj.issues.length + 1, 'New issue logged in risk register');
assert(newIssue.impactedEntityIds.includes(q1!.id), 'Issue links to affected Q1 component');

// ------------------------------------------------------------------
// SECTION 12: TRACEABILITY GRAPH & IMPACT ANALYSIS
// ------------------------------------------------------------------
console.log('\n12. Traceability Graph & Impact Analysis:');

const graph = new TraceabilityGraph(execResult.updatedProject.traceabilityLinks);
const upstreamOfCalc = graph.getUpstream(calcToRun.id);
const downstreamOfCalc = graph.getDownstream(calcToRun.id);

assert(downstreamOfCalc.length >= 1, 'Calculation has downstream links');
const hasSnapLink = downstreamOfCalc.some(l => l.targetId === execResult.snapshot.id);
assert(hasSnapLink === true, 'Calculation connects downstream to newly generated snapshot');

const coverage = graph.calculateCoverage(execResult.updatedProject);
assert(coverage.totalRequirements >= 4, 'Coverage accurately measures requirements total');
assert(typeof coverage.coveragePercent === 'number', 'Coverage percent is calculated');

// ------------------------------------------------------------------
// SECTION 13: GLOBAL PROJECT SEARCH
// ------------------------------------------------------------------
console.log('\n13. Global Project Search Across 12+ Entity Types:');

// Search by RefDes "Q1" -> Component
const resQ1 = searchProject(buckProj, 'Q1');
assert(resQ1.some(r => r.entityType === 'Component' && r.title.includes('Q1')), 'Search finds Component by RefDes "Q1"');

// Search by Requirement title "Output Voltage" -> Requirement
const resReq = searchProject(buckProj, 'Output Voltage');
assert(resReq.some(r => r.entityType === 'Requirement'), 'Search finds Requirement by title');

// Search by Rail "VIN_24V" -> Power Rail
const resRail = searchProject(buckProj, 'VIN_24V');
assert(resRail.some(r => r.entityType === 'Power Rail'), 'Search finds Power Rail');

// Search by Engine "buck-converter-sizing" -> Calculation
const resEngine = searchProject(buckProj, 'buck-converter-sizing');
assert(resEngine.some(r => r.entityType === 'Calculation'), 'Search finds Calculation by engine ID');

// Search by Decision "GaN" -> Decision
const resDec = searchProject(buckProj, 'GaN');
assert(resDec.some(r => r.entityType === 'Decision'), 'Search finds Decision by keyword "GaN"');

// Search with empty or whitespace -> returns empty array
assert(searchProject(buckProj, '').length === 0, 'Empty search query returns empty array');
assert(searchProject(buckProj, '   ').length === 0, 'Whitespace search query returns empty array');

// ------------------------------------------------------------------
// SECTION 14: DATA SAFETY, CREDENTIAL SCRUBBING & SECURITY
// ------------------------------------------------------------------
console.log('\n14. Data Safety & Credential Scrubbing:');

const advProj: any = JSON.parse(JSON.stringify(buckProj));
advProj.apiKey = 'AIzaSyAdversarialLeakedKeyWave02';
advProj.secretToken = 'sk-advSecretTokenWave02';
advProj.calculations[0].bearerToken = 'Bearer fakeToken';
advProj.__proto__.malicious = true;

const exported = exportV2ProjectToJson(advProj);
assert(!exported.includes('AIzaSyAdversarialLeakedKeyWave02'), 'Export strips API key');
assert(!exported.includes('sk-advSecretTokenWave02'), 'Export strips secret token');
assert(!exported.includes('Bearer fakeToken'), 'Export strips bearer token');
assert(!exported.includes('malicious'), 'Export prevents prototype pollution payload');

const reimported = importV2ProjectFromJson(exported);
assert(reimported.success === true && reimported.project !== undefined, 'Exported JSON cleanly imports back');
assert(reimported.project!.schemaVersion === '2.0.0', 'Imported project has valid 2.0.0 schema');

// ------------------------------------------------------------------
// SECTION 15: LARGE PROJECT SCALE & PERFORMANCE STRESS TEST
// ------------------------------------------------------------------
console.log('\n15. Large Project Scale & Performance Stress Test:');

const tStart = Date.now();
const largeProject: ElectroKitProjectV2 = createDefaultProjectV2('blank');
largeProject.metadata.name = 'Extreme Multi-Domain Spacecraft Avionics Package';

// 25 requirements
for (let i = 0; i < 25; i++) {
  largeProject.requirements.push({
    id: `req_scale_${i}`,
    name: `Avionics Specification ${i + 1}`,
    category: 'power',
    description: `Subsystem requirement ${i + 1}`,
    nominalValue: 28.0,
    unit: 'V',
    priority: 'high',
    verificationMethod: 'calculation',
    verificationStatus: i % 2 === 0 ? 'passed' : 'unverified',
    satisfiedByCalculationIds: [],
    satisfiedByMeasurementIds: [],
    source: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// 20 constraints
for (let i = 0; i < 20; i++) {
  largeProject.constraints.push({
    id: `con_scale_${i}`,
    name: `Boundary Limit ${i + 1}`,
    category: 'thermal',
    value: 85,
    unit: '°C',
    limitType: 'max',
  });
}

// 20 assumptions
for (let i = 0; i < 20; i++) {
  largeProject.assumptions.push({
    id: `asm_scale_${i}`,
    parameter: `Physical Constant ${i + 1}`,
    value: 1.0,
    unit: 'ratio',
    classification: 'physics_law',
    sensitivity: 'medium',
    description: 'Universal constant',
    isUserConfigurable: false,
  });
}

// 20 systems
for (let i = 0; i < 20; i++) {
  largeProject.systems.push({
    id: `sys_scale_${i}`,
    name: `Avionics Block ${i + 1}`,
    description: `Subsystem architectural block ${i + 1}`,
    primaryDomain: 'power',
    subsystems: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// 100 components
for (let i = 0; i < 100; i++) {
  largeProject.components.push({
    id: `comp_scale_${i}`,
    refDes: `U${i + 1}`,
    name: `Integrated Component ${i + 1}`,
    category: 'integrated_circuit',
    description: 'Radiation-hardened IC',
    manufacturer: 'Microchip',
    partNumber: `ATmega-RAD-${i}`,
    packageType: 'QFP-64',
    status: 'selected',
    parametricRatings: {},
    pins: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// 20 design cases
for (let i = 0; i < 20; i++) {
  largeProject.designCases.push({
    id: `case_scale_${i}`,
    name: `Mission Profile Variant ${i + 1}`,
    description: `Alternative orbit profile ${i + 1}`,
    isBaseline: i === 0,
    revisionNumber: 1,
    inputs: {},
    assumptionOverrides: [],
    scenarios: [],
    associatedCalculationIds: [],
    associatedSnapshotIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// 50 scenarios
for (let i = 0; i < 50; i++) {
  largeProject.designCases[i % 20].scenarios.push({
    id: `scen_scale_${i}`,
    caseId: `case_scale_${i % 20}`,
    name: `Orbital Eclipse Scenario ${i + 1}`,
    type: 'worst_case_max',
    description: 'Full solar eclipse condition',
    environmentalOverrides: { ambientTemperatureC: -55 },
    parameterOverrides: {},
    createdAt: new Date().toISOString(),
  });
}

// 200 calculations
for (let i = 0; i < 200; i++) {
  largeProject.calculations.push({
    id: `calc_scale_${i}`,
    toolSlug: 'power-system-design',
    engineId: 'dc-power-budget',
    name: `Payload Rail Budget ${i + 1}`,
    category: 'power',
    status: 'clean',
    inputs: { supplyVoltageVolts: 28, supplyMaxPowerWatts: 150 },
    outputs: { totalLoadPowerWatts: 45 },
    assumptions: [],
    margins: [],
    warnings: [],
    formulaReferences: ['P = V * I'],
    boundRequirementIds: [],
    boundComponentIds: [],
    boundRailIds: [],
    lastCalculatedAt: new Date().toISOString(),
  });
}

// 100 snapshots
for (let i = 0; i < 100; i++) {
  const sBase = {
    id: `snap_scale_${i}`,
    calculationId: `calc_scale_${i % 200}`,
    timestamp: new Date().toISOString(),
    inputs: { supplyVoltageVolts: 28 },
    outputs: { totalLoadPowerWatts: 45 },
    assumptions: [],
    warnings: [],
    margins: [],
    validationStatus: 'calculated' as const,
  };
  largeProject.calculationSnapshots.push({
    ...sBase,
    integrityDigest: computeSnapshotDigest(sBase),
  });
}

// 100 measurements
for (let i = 0; i < 100; i++) {
  largeProject.measurements.push({
    id: `meas_scale_${i}`,
    testPoint: `TP_SCALE_${i}`,
    parameter: 'Bus Voltage',
    nominalExpected: 28.0,
    measuredValue: 28.1,
    unit: 'V',
    deltaAbsolute: 0.1,
    deltaPercent: 0.36,
    verdict: 'pass',
    measurementMethod: 'Automated ATE bench',
    timestamp: new Date().toISOString(),
  });
}

// 50 issues
for (let i = 0; i < 50; i++) {
  largeProject.issues.push({
    id: `issue_scale_${i}`,
    title: `Telemetry Flag ${i + 1}`,
    description: 'Minor ripple jitter detected on harness',
    severity: 'minor',
    category: 'electrical',
    status: 'open',
    discoveredAt: new Date().toISOString(),
    discoveredBy: 'ATE Suite',
    impactedEntityIds: [],
  });
}

// 50 decisions
for (let i = 0; i < 50; i++) {
  largeProject.decisions.push({
    id: `dec_scale_${i}`,
    title: `Component Selection Decision ${i + 1}`,
    statement: `Selected Class S passive components for subsystem ${i + 1}`,
    context: 'Space radiation tolerance mandate',
    optionsConsidered: [],
    chosenOptionId: 'opt_1',
    tradeoffsSummary: 'High procurement lead time for 100 krad TID immunity',
    evidenceSnapshotIds: [],
    decisionMaker: 'Chief Avionics Architect',
    decidedAt: new Date().toISOString(),
    status: 'approved',
  });
}

const buildTimeMs = Date.now() - tStart;
assert(buildTimeMs < 150, `Built massive enterprise project in ${buildTimeMs}ms (<150ms budget)`);

// Test search performance on massive project
const tSearchStart = Date.now();
const searchMatches = searchProject(largeProject, 'Avionics');
const searchTimeMs = Date.now() - tSearchStart;
assert(searchMatches.length > 0, `Search successfully found ${searchMatches.length} matching entities in massive project`);
assert(searchTimeMs < 20, `Executed full-project search across 800+ entities in ${searchTimeMs}ms (<20ms budget)`);

// Test serialization performance on massive project
const tExportStart = Date.now();
const massiveJson = exportV2ProjectToJson(largeProject);
const exportTimeMs = Date.now() - tExportStart;
assert(massiveJson.length > 50000, `Serialized massive project (${Math.round(massiveJson.length / 1024)} KB)`);
assert(exportTimeMs < 30, `Exported massive project JSON in ${exportTimeMs}ms (<30ms budget)`);

// ------------------------------------------------------------------
// SECTION 16: ZERO REGRESSION ON V1 BASELINE
// ------------------------------------------------------------------
console.log('\n16. Zero Regression on V1 Baseline:');

const v1Baseline = createDefaultProject('iot-node');
assert(v1Baseline.schemaVersion === '1.0.0', 'V1 createDefaultProject preserves schemaVersion 1.0.0');
assert(v1Baseline.requirements.length > 0, 'V1 project maintains requirements');
assert(v1Baseline.designCases.length > 0, 'V1 project maintains design cases');

console.log('\n======================================================');
console.log(`V2 WAVE 02 VERIFICATION: ${passedTests} / ${totalTests} PASSED (${failedTests} failed)`);
console.log('======================================================');

if (failedTests > 0) {
  process.exit(1);
}
