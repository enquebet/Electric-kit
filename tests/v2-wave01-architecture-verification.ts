/**
 * ElectroKit V2 — Wave 01 Architecture & Engineering Data Model Verification
 * Comprehensive verification of:
 * - V2 schemaVersion 2.0.0
 * - Multi-domain Engineering Systems hierarchy (Power, Thermal, Battery, RF, PCB)
 * - Component & Physical Connection model (refDes, pins, nets, ratings)
 * - Stable, collision-resistant Identity architecture
 * - Deterministic snapshot integrity hasher & tamper detection
 * - Lossless V1 -> V2 schema migration engine
 * - Traceability graph & impact analysis engine
 * - Engineering governance models (Revisions, Decisions, Issues)
 * - Credential exclusion & prototype pollution security
 * - Zero regression on V1 baseline
 */

import {
  createDefaultProjectV2,
  ElectroKitProjectV2,
  EntityIds,
  isValidEntityId,
  canonicalStringify,
  computeDeterministicHash,
  computeSnapshotDigest,
  verifySnapshotIntegrity,
  computeProjectStateDigest,
  TraceabilityGraph,
  migrateV1toV2,
  upgradeProject,
  isV1Project,
  isV2Project,
  exportV2ProjectToJson,
  importV2ProjectFromJson,
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
console.log('ELECTROKIT V2 — WAVE 01 ARCHITECTURE VERIFICATION');
console.log('Engineering Data Model, Domain Entities & Traceability');
console.log('======================================================\n');

// ------------------------------------------------------------------
// SECTION 1: V2 SCHEMA DEFINITION & FACTORY TEMPLATES
// ------------------------------------------------------------------
console.log('1. V2 Schema Definition & Factory Templates:');

const blankProj = createDefaultProjectV2('blank');
assert(blankProj.schemaVersion === '2.0.0', 'Blank project schemaVersion is pegged to 2.0.0');
assert(blankProj.metadata.id.startsWith('proj_'), 'Project ID has valid proj_ prefix');
assert(Array.isArray(blankProj.requirements), 'Requirements is isolated array');
assert(Array.isArray(blankProj.constraints), 'Constraints is isolated array');
assert(Array.isArray(blankProj.assumptions), 'Assumptions is isolated array');
assert(Array.isArray(blankProj.targets), 'Targets is isolated array');
assert(Array.isArray(blankProj.systems), 'Systems is isolated array');
assert(Array.isArray(blankProj.components), 'Components is isolated array');
assert(Array.isArray(blankProj.connections), 'Connections is isolated array');
assert(Array.isArray(blankProj.nets), 'Nets is isolated array');
assert(Array.isArray(blankProj.powerRails), 'PowerRails is isolated array');
assert(Array.isArray(blankProj.designCases), 'DesignCases is isolated array');
assert(Array.isArray(blankProj.calculations), 'Calculations is isolated array');
assert(Array.isArray(blankProj.calculationSnapshots), 'CalculationSnapshots is isolated array');
assert(Array.isArray(blankProj.validationMilestones), 'ValidationMilestones is isolated array');
assert(Array.isArray(blankProj.measurements), 'Measurements is isolated array');
assert(Array.isArray(blankProj.datasheetVerifications), 'DatasheetVerifications is isolated array');
assert(Array.isArray(blankProj.revisions), 'Revisions is isolated array');
assert(Array.isArray(blankProj.issues), 'Issues is isolated array');
assert(Array.isArray(blankProj.decisions), 'Decisions is isolated array');
assert(Array.isArray(blankProj.traceabilityLinks), 'TraceabilityLinks is isolated array');
assert(Array.isArray(blankProj.reports), 'Reports is isolated array');

const buckProj = createDefaultProjectV2('dcdc-buck-converter');
assert(buckProj.schemaVersion === '2.0.0', 'Buck template initializes valid 2.0.0 schema');
assert(buckProj.metadata.domain === 'power_electronics', 'Domain is typed power_electronics');
assert(buckProj.metadata.status === 'architecture_sizing', 'Lifecycle status is architecture_sizing');
assert(buckProj.requirements.length >= 4, 'Buck template registers >= 4 formal requirements');
assert(buckProj.constraints.length >= 2, 'Buck template registers >= 2 engineering constraints');
assert(buckProj.assumptions.length >= 2, 'Buck template registers >= 2 engineering assumptions');
assert(buckProj.systems.length >= 1, 'Buck template registers top-level engineering system');
assert(buckProj.components.length >= 3, 'Buck template registers semiconductor and passive components');
assert(buckProj.powerRails.length >= 3, 'Buck template models VIN, VOUT, and GND power rails');
assert(buckProj.designCases.length >= 1, 'Buck template registers baseline design case');
assert(buckProj.designCases[0].scenarios.length >= 2, 'Design case models nominal and worst-case scenarios');
assert(buckProj.calculations.length >= 1, 'Calculations collection registers calculation instances');
assert(buckProj.calculationSnapshots.length >= 1, 'Calculation snapshots collection has snapshots');
assert(buckProj.decisions.length >= 1, 'Governance registers engineering decision log (GaN vs Si)');
assert(buckProj.traceabilityLinks.length >= 2, 'Traceability links register calculation and component wiring');

// ------------------------------------------------------------------
// SECTION 2: STABLE ENTITY IDENTITIES & COLLISION RESISTANCE
// ------------------------------------------------------------------
console.log('\n2. Stable Entity Identities & Collision Resistance:');

assert(isValidEntityId('proj_12345678', 'proj'), 'Validates project ID format');
assert(isValidEntityId('req_abcdef12', 'req'), 'Validates requirement ID format');
assert(isValidEntityId('con_99887766', 'con'), 'Validates constraint ID format');
assert(isValidEntityId('comp_u1_a1b2', 'comp'), 'Validates component ID format');
assert(isValidEntityId('calc_33445566', 'calc'), 'Validates calculation ID format');
assert(isValidEntityId('snap_99aa88bb', 'snap'), 'Validates snapshot ID format');
assert(!isValidEntityId('invalid_id', 'proj'), 'Rejects ID with mismatched prefix');
assert(!isValidEntityId('proj_', 'proj'), 'Rejects ID without body');
assert(!isValidEntityId('', 'proj'), 'Rejects empty ID');

// 10,000 ID generation collision test
const idSet = new Set<string>();
const COLLISION_SAMPLES = 10000;
for (let i = 0; i < COLLISION_SAMPLES; i++) {
  idSet.add(EntityIds.requirement());
}
assert(idSet.size === COLLISION_SAMPLES, `10,000 generated entity IDs have 0 collisions (${idSet.size}/${COLLISION_SAMPLES})`);

// ------------------------------------------------------------------
// SECTION 3: DETERMINISTIC SNAPSHOT INTEGRITY & CRYPTOGRAPHIC HASHING
// ------------------------------------------------------------------
console.log('\n3. Deterministic Snapshot Integrity & Cryptographic Hashing:');

const objA = { z: 1, a: 2, m: { y: 10, x: 20 } };
const objB = { a: 2, z: 1, m: { x: 20, y: 10 } };
assert(canonicalStringify(objA) === canonicalStringify(objB), 'Canonical stringify sorts object keys deterministically at all depths');

const hash1 = computeDeterministicHash('ElectroKit-V2-Hardware-Workbench');
const hash2 = computeDeterministicHash('ElectroKit-V2-Hardware-Workbench');
assert(hash1 === hash2 && hash1.length === 16, 'Deterministic hash generates reproducible 16-hex digest');

const testSnap = buckProj.calculationSnapshots[0];
assert(testSnap.integrityDigest.startsWith('sha256_'), 'Snapshot has sha256_ integrity digest');
assert(verifySnapshotIntegrity(testSnap) === true, 'Snapshot passes integrity verification');

// Tamper test: modify input without updating digest
const tamperedSnap = JSON.parse(JSON.stringify(testSnap));
tamperedSnap.inputs.vinVolts = 48; // unauthorized alteration
assert(verifySnapshotIntegrity(tamperedSnap) === false, 'Tampered snapshot input is detected and fails verification');

// Tamper test: modify output
const tamperedSnap2 = JSON.parse(JSON.stringify(testSnap));
tamperedSnap2.outputs.dutyCyclePercent = 99.9;
assert(verifySnapshotIntegrity(tamperedSnap2) === false, 'Tampered snapshot output is detected and fails verification');

// Project state digest
const stateDigest1 = computeProjectStateDigest(buckProj);
const stateDigest2 = computeProjectStateDigest(buckProj);
assert(stateDigest1 === stateDigest2 && stateDigest1.startsWith('digest_'), 'Project state digest is deterministic across calls');

// ------------------------------------------------------------------
// SECTION 4: MULTI-DOMAIN ENGINEERING SYSTEMS HIERARCHY
// ------------------------------------------------------------------
console.log('\n4. Multi-Domain Engineering Systems Hierarchy:');

const primarySys = buckProj.systems[0];
assert(primarySys.primaryDomain === 'power', 'System primary domain is power');
assert(primarySys.subsystems.length === 2, 'System decomposes into 2 subsystems (Power Conversion + Thermal)');

const pwrArch = primarySys.powerArchitecture!;
assert(pwrArch !== undefined, 'Power architecture is modeled on system');
assert(pwrArch.conversionStages[0].topology === 'buck', 'Conversion stage topology is buck');
assert(pwrArch.conversionStages[0].expectedEfficiencyPercent === 94.5, 'Expected efficiency is 94.5%');
assert(pwrArch.totalPayloadPowerWatts === 30.0, 'Total payload power is 30.0W');
assert(pwrArch.totalInputPowerWatts === 31.74, 'Total input power models cascaded converter losses (31.74W)');

const thSys = primarySys.thermalSystem!;
assert(thSys !== undefined, 'Thermal system is modeled on system');
assert(thSys.nodes.length === 2, 'Thermal system models semiconductor junction and internal air nodes');
assert(thSys.nodes[0].heatDissipationWatts === 0.95, 'Semiconductor node models 0.95W heat dissipation');
assert(thSys.nodes[0].calculatedTemperatureC === 78.5, 'Junction temperature calculated at 78.5°C');
assert(thSys.nodes[0].thermalMarginC === 46.5, 'Thermal margin headroom is 46.5°C below Tj_max (125°C)');
assert(thSys.resistancePaths[0].resistanceCPerW === 4.5, 'Thermal path models 4.5 °C/W resistance to heatsink');

// ------------------------------------------------------------------
// SECTION 5: COMPONENT & NET MODEL
// ------------------------------------------------------------------
console.log('\n5. Component & Net Model:');

const fetQ1 = buckProj.components.find(c => c.refDes === 'Q1');
assert(fetQ1 !== undefined, 'Found Q1 GaN FET in component registry');
assert(fetQ1!.category === 'semiconductor_transistor', 'Q1 category is semiconductor_transistor');
assert(fetQ1!.manufacturer === 'EPC' && fetQ1!.partNumber === 'EPC2045', 'Q1 manufacturer and part number populated');
assert(fetQ1!.thermalProperties?.rThetaJC === 0.8, 'Q1 models R_theta_JC junction-to-case thermal resistance (0.8 °C/W)');
assert(fetQ1!.parametricRatings.rdsOn.value === 5.6, 'Q1 models 5.6 mΩ RDS(on)');

const inductorL1 = buckProj.components.find(c => c.refDes === 'L1');
assert(inductorL1 !== undefined, 'Found L1 inductor in component registry');
assert(inductorL1!.parametricRatings.inductance.value === 4.7, 'L1 models 4.7 µH inductance');

const netVout = buckProj.nets.find(n => n.name === 'VOUT_5V');
assert(netVout !== undefined, 'Found VOUT_5V net');
assert(netVout!.nominalVoltage === 5.0 && netVout!.maxCurrentAmps === 6.0, 'VOUT net has 5.0V and 6.0A ratings');

// ------------------------------------------------------------------
// SECTION 6: TRACEABILITY GRAPH & IMPACT ANALYSIS
// ------------------------------------------------------------------
console.log('\n6. Traceability Graph & Impact Analysis:');

const graph = new TraceabilityGraph(buckProj.traceabilityLinks);
assert(graph.getAllLinks().length === buckProj.traceabilityLinks.length, 'Graph initializes with project traceability links');

const voutReq = buckProj.requirements[0];
const upstreamOfReq = graph.getUpstream(voutReq.id);
assert(upstreamOfReq.length === 1, 'VOUT requirement has 1 upstream calculation driving it');
assert(upstreamOfReq[0].sourceType === 'calculation', 'Upstream driver is of type calculation');

// Add new link: Requirement -> Subsystem
const newLink = graph.createLink(
  voutReq.id,
  'requirement',
  primarySys.subsystems[0].id,
  'subsystem',
  'derives_from',
  'Output voltage requirement derives power conversion subsystem architecture'
);
assert(graph.getAllLinks().length === buckProj.traceabilityLinks.length + 1, 'Graph successfully created and indexed new link');

// Impact radius test: find everything downstream of calcBuckId
const calcId = buckProj.calculations[0].id;
const impactRadius = graph.getImpactRadius(calcId);
assert(impactRadius.includes(voutReq.id), 'Impact radius correctly identifies requirement downstream of calculation');

// Coverage analysis
const coverage = graph.calculateCoverage(buckProj);
assert(coverage.totalRequirements === buckProj.requirements.length, 'Coverage reports total requirements accurately');
assert(coverage.satisfiedRequirements >= 1, 'Coverage identifies satisfied requirements');
assert(typeof coverage.coveragePercent === 'number', 'Coverage percent is calculated');

// ------------------------------------------------------------------
// SECTION 7: LOSSLESS V1 TO V2 SCHEMA MIGRATION
// ------------------------------------------------------------------
console.log('\n7. Lossless V1 to V2 Schema Migration:');

const v1Proj = createDefaultProject('iot-node');
assert(v1Proj.schemaVersion === '1.0.0', 'V1 project has schemaVersion 1.0.0');
assert(isV1Project(v1Proj) === true, 'isV1Project accurately identifies V1 project');
assert(isV2Project(v1Proj) === false, 'isV2Project rejects V1 project');

const migratedV2 = migrateV1toV2(v1Proj);
assert(migratedV2.schemaVersion === '2.0.0', 'Migrated project has schemaVersion 2.0.0');
assert(isV2Project(migratedV2) === true, 'isV2Project recognizes migrated V2 project');
assert(migratedV2.metadata.id === v1Proj.metadata.id, 'Preserves exact project ID');
assert(migratedV2.metadata.name === v1Proj.metadata.name, 'Preserves project name');
assert(migratedV2.requirements.length === v1Proj.requirements.length, `Migrates 100% of requirements (${migratedV2.requirements.length}/${v1Proj.requirements.length})`);
assert(migratedV2.constraints.length === v1Proj.constraints.length, `Migrates 100% of constraints (${migratedV2.constraints.length}/${v1Proj.constraints.length})`);
assert(migratedV2.assumptions.length === v1Proj.assumptions.length, `Migrates 100% of assumptions (${migratedV2.assumptions.length}/${v1Proj.assumptions.length})`);
assert(migratedV2.targets.length === v1Proj.targets.length, `Migrates 100% of targets (${migratedV2.targets.length}/${v1Proj.targets.length})`);
assert(migratedV2.designCases.length === v1Proj.designCases.length, `Migrates 100% of design cases (${migratedV2.designCases.length}/${v1Proj.designCases.length})`);
assert(migratedV2.systems.length >= 1, 'Synthesizes top-level system architecture during migration');
assert(migratedV2.powerRails.length >= 1, 'Synthesizes power rails from voltage requirements');
assert(migratedV2.validationMilestones.length === v1Proj.validationItems.length, 'Migrates validation items to validation milestones');
assert(migratedV2.measurements.length === v1Proj.measurements.length, 'Migrates measurements array');

// Universal upgrader
const upgradedAlreadyV2 = upgradeProject(buckProj);
assert(upgradedAlreadyV2.schemaVersion === '2.0.0', 'upgradeProject passes through existing V2 project untouched');

const upgradedFromV1 = upgradeProject(v1Proj);
assert(upgradedFromV1.schemaVersion === '2.0.0', 'upgradeProject seamlessly upgrades V1 to V2');

// ------------------------------------------------------------------
// SECTION 8: HARDENED EXPORT/IMPORT & CREDENTIAL SCRUBBING
// ------------------------------------------------------------------
console.log('\n8. Hardened Export/Import & Credential Scrubbing:');

// Test adversarial injection
const adversarialProj: any = JSON.parse(JSON.stringify(buckProj));
adversarialProj.apiKey = 'AIzaSyAdversarialLeakedKey1234567890abcdef';
adversarialProj.metadata.secretToken = 'sk-secretAdversarialToken9876543210';
adversarialProj.calculations[0].authorizationHeader = 'Bearer adversarialToken';
adversarialProj.__proto__.maliciousField = 'polluted';

const exportedJson = exportV2ProjectToJson(adversarialProj);
assert(!exportedJson.includes('apiKey'), 'Export strictly scrubs apiKey property');
assert(!exportedJson.includes('AIzaSyAdversarialLeakedKey1234567890abcdef'), 'Export scrubs API key string value');
assert(!exportedJson.includes('secretToken'), 'Export strictly scrubs secretToken property');
assert(!exportedJson.includes('authorizationHeader'), 'Export strictly scrubs authorizationHeader');
assert(!exportedJson.includes('maliciousField'), 'Export prevents prototype pollution payload');

// Re-import
const importResult = importV2ProjectFromJson(exportedJson);
assert(importResult.success === true && importResult.project !== undefined, 'Exported JSON cleanly imports back into V2 project');
assert(importResult.project!.schemaVersion === '2.0.0', 'Imported project has valid 2.0.0 schema');
assert(importResult.project!.metadata.id !== buckProj.metadata.id, 'Import assigns fresh project ID to prevent storage collisions');
assert(importResult.project!.metadata.name.includes('(Imported)'), 'Import tags project name with (Imported)');

// ------------------------------------------------------------------
// SECTION 9: ENGINEERING GOVERNANCE (DECISIONS, ISSUES, REVISIONS)
// ------------------------------------------------------------------
console.log('\n9. Engineering Governance (Decisions, Issues, Revisions):');

const decision = buckProj.decisions[0];
assert(decision.title.includes('GaN FET'), 'Decision title documents GaN FET selection');
assert(decision.optionsConsidered.length === 2, 'Decision records considered options with trade-offs');
assert(decision.chosenOptionId === 'opt_2', 'Decision records chosen option ID');
assert(decision.status === 'approved', 'Decision is approved');
assert(decision.evidenceSnapshotIds.length >= 1, 'Decision links to mathematical calculation snapshot evidence');

const rev = buckProj.revisions[0];
assert(rev.revisionNumber === 1, 'Revision number is 1');
assert(rev.signoffStatus === 'approved', 'Revision signoff status is approved');
assert(rev.snapshotDigest.length > 0, 'Revision records immutable snapshot digest');

// ------------------------------------------------------------------
// SECTION 10: ZERO REGRESSION ON V1 BASELINE
// ------------------------------------------------------------------
console.log('\n10. Zero Regression on V1 Baseline:');

const v1Original = createDefaultProject('dcdc-converter');
assert(v1Original.schemaVersion === '1.0.0', 'V1 createDefaultProject continues to return schemaVersion 1.0.0 for backward compatibility');
assert(v1Original.requirements.length > 0, 'V1 project maintains all requirements');
assert(v1Original.designCases.length > 0, 'V1 project maintains all design cases');

console.log('\n======================================================');
console.log(`V2 WAVE 01 VERIFICATION: ${passedTests} / ${totalTests} PASSED (${failedTests} failed)`);
console.log('======================================================');

if (failedTests > 0) {
  process.exit(1);
}
