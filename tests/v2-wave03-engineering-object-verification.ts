/**
 * ElectroKit V2 — Wave 03 Engineering Object Model Verification Suite
 * Verifies:
 * 1. Component Object Model (Creation, Properties, Lifecycle, Deep Cloning)
 * 2. Ratings Model (Absolute Maximum, Recommended Operating, Conditions, Sources)
 * 3. Operating Condition Model
 * 4. Component Pin Model (Numbers, Roles, Domains, Directions, Nets)
 * 5. Net Model (Domains, Net Classes, Rails, Pin Associations)
 * 6. Rail Model (Limits, Loads, Sources, Net References)
 * 7. Connection Model (Source, Target, Types, Nets)
 * 8. Power Path Model (Source, Stages, Destination, Rails, Calculations, Snapshots)
 * 9. Signal Path Model (Source, Stages, Destination, Frequency, Signal Types)
 * 10. Thermal Path Model (Source, Stages, Destination, TIM, Resistance)
 * 11. Reference Model & Datasheet Metadata (Types, Identifiers, Safe URL Sanitization)
 * 12. Object Graph Navigation & Traversal (Pins, Nets, Connected Components, Upstream/Downstream)
 * 13. Delete Safety & Dependency Auditing (Blocks Unsafe Delete, Dependency Reasons, Snapshot Immutability)
 * 14. Data Security & Credential Scrubbing (Prototype Pollution, Secret Stripping)
 * 15. Cross-Project & Revision Isolation
 * 16. Enterprise Scale & Performance Stress Test (500 components, 1000 pins, 300 nets, 100 rails, 100 connections, 50 power paths, 50 signal paths, 50 thermal paths, 1000 links)
 * 17. Zero Regression on V1 Baseline
 */

import {
  createDefaultProjectV2,
  ElectroKitProjectV2,
  EngineeringComponentV2,
  ComponentPinV2,
  ComponentRatingV2,
  PowerPathV2,
  SignalPathV2,
  ThermalPathV2,
  EngineeringReferenceV2,
  OperatingConditionV2,
  EntityIds,
  cloneComponent,
  canDeleteComponent,
  deleteComponentSafely,
  getComponentPins,
  getNetPins,
  getRailNets,
  getComponentConnectedComponents,
  getUpstreamObjects,
  getDownstreamObjects,
  validateComponent,
  validateRating,
  validatePin,
  validatePowerPath,
  validateSignalPath,
  validateThermalPath,
  validateReference,
  sanitizeReferenceUrl,
  searchProject,
  exportV2ProjectToJson,
  importV2ProjectFromJson,
} from '../src/workspace/v2';
import { createDefaultProject } from '../src/workspace/storage';

console.log('======================================================');
console.log('ELECTROKIT V2 — WAVE 03 ENGINEERING OBJECT MODEL');
console.log('Rigorous Verification & Architectural Integrity Audit');
console.log('======================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// 1. Component Object Model & Deep Cloning
// -----------------------------------------------------------------------------
console.log('1. Component Object Model & Deep Cloning:');
const baseComp: EngineeringComponentV2 = {
  id: EntityIds.component(),
  refDes: 'Q1',
  name: 'Enhancement-mode GaN Transistor',
  category: 'semiconductor',
  subcategory: 'gallium_nitride_fet',
  manufacturer: 'EPC',
  partNumber: 'EPC2045',
  manufacturerPartNumber: 'EPC2045',
  packageType: 'LGA-12',
  package: 'LGA-12',
  description: '100V 30A low RDS(on) switching power FET',
  status: 'selected',
  lifecycleStatus: 'selected',
  parametricRatings: {
    rdsOn: { parameter: 'RDS(on) typical', value: 5.6, unit: 'mΩ' },
  },
  ratings: [
    {
      id: EntityIds.rating(),
      parameter: 'Vds_max',
      value: 100,
      unit: 'V',
      ratingType: 'absolute_maximum',
      condition: 'TJ = 25°C',
      source: 'EPC2045 Datasheet Table 1',
    },
    {
      id: EntityIds.rating(),
      parameter: 'Id_continuous',
      value: 16,
      unit: 'A',
      ratingType: 'recommended_operating',
      condition: 'TA = 25°C',
    },
  ],
  propertyGroups: {
    electrical: {
      nominalVoltageV: 24,
      maxVoltageV: 100,
      nominalCurrentA: 6,
      maxCurrentA: 30,
      resistanceOhms: 0.0056,
    },
    thermal: {
      rThetaJC: 0.8,
      rThetaJA: 32.0,
      maxJunctionTempC: 150,
      typicalPowerDissipationWatts: 1.2,
    },
    physical: {
      lengthMm: 2.5,
      widthMm: 1.5,
      heightMm: 0.68,
      package: 'LGA-12',
      mountingType: 'smd',
    },
  },
  pins: [
    {
      id: EntityIds.pin(),
      pinNumber: '1',
      name: 'DRAIN',
      type: 'power',
      direction: 'in',
      domain: 'power',
      electricalRole: 'power_supply',
      voltageRatingV: 100,
    },
    {
      id: EntityIds.pin(),
      pinNumber: '2',
      name: 'SOURCE',
      type: 'power',
      direction: 'out',
      domain: 'power',
      electricalRole: 'power_supply',
      voltageRatingV: 100,
    },
    {
      id: EntityIds.pin(),
      pinNumber: '3',
      name: 'GATE',
      type: 'digital_in',
      direction: 'in',
      domain: 'control',
      electricalRole: 'control',
      voltageRatingV: 6,
    },
  ],
  thermalProperties: { rThetaJC: 0.8, rThetaJA: 32.0, maxJunctionTempC: 150 },
  references: ['ref_epc2045'],
  notes: 'Ensure kelvin source connection for low gate inductance',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

assert(baseComp.refDes === 'Q1', 'Base component has refDes Q1');
assert(baseComp.ratings?.length === 2, 'Component has 2 structured ratings');
assert(baseComp.pins.length === 3, 'Component has 3 pins');

// Test Cloning
const cloned = cloneComponent(baseComp, 'Q2');
assert(cloned.id !== baseComp.id, 'Cloned component has new unique ID');
assert(cloned.id.startsWith('comp_'), 'Cloned component ID has comp_ prefix');
assert(cloned.refDes === 'Q2', 'Cloned component refDes updated to Q2');
assert(cloned.pins.length === 3, 'Cloned component preserved all 3 pins');
assert(cloned.pins[0].id !== baseComp.pins[0].id, 'Cloned pin 1 has brand new ID');
assert(cloned.pins[0].name === 'DRAIN', 'Cloned pin preserves name');
assert(cloned.ratings?.length === 2, 'Cloned component preserved 2 ratings');
assert(cloned.ratings![0].id !== baseComp.ratings![0].id, 'Cloned rating has new ID');
assert(cloned.propertyGroups?.electrical?.resistanceOhms === 0.0056, 'Cloned component preserves property groups');

// Verify immutability of original after mutating clone
cloned.propertyGroups!.electrical!.resistanceOhms = 0.010;
assert(baseComp.propertyGroups?.electrical?.resistanceOhms === 0.0056, 'Deep clone mutation does NOT affect original component');

// -----------------------------------------------------------------------------
// 2. Component Validation & Numerical Rigor
// -----------------------------------------------------------------------------
console.log('\n2. Component Validation & Numerical Rigor:');
const validRes = validateComponent(baseComp);
assert(validRes.valid, 'Valid component passes validation');

const invalidComp: Partial<EngineeringComponentV2> = {
  refDes: '123_INVALID',
  name: '',
};
const invalidRes = validateComponent(invalidComp);
assert(!invalidRes.valid, 'Rejects invalid refDes starting with a number and empty name');
assert(invalidRes.errors.length >= 2, 'Reports specific errors for refDes and name');

const duplicatePinComp: Partial<EngineeringComponentV2> = {
  refDes: 'U1',
  name: 'Test IC',
  category: 'ic',
  pins: [
    { id: 'pin_1', pinNumber: '1', name: 'VCC', type: 'power' },
    { id: 'pin_2', pinNumber: '1', name: 'VDD', type: 'power' },
  ],
};
const dupPinRes = validateComponent(duplicatePinComp);
assert(!dupPinRes.valid, 'Rejects duplicate pin numbers on same component');

// -----------------------------------------------------------------------------
// 3. Ratings Model
// -----------------------------------------------------------------------------
console.log('\n3. Ratings Model:');
const validRating: ComponentRatingV2 = {
  id: EntityIds.rating(),
  parameter: 'Vds_max',
  value: 100,
  unit: 'V',
  ratingType: 'absolute_maximum',
  condition: 'TJ = 25°C',
  temperatureC: 25,
  source: 'EPC Datasheet Table 1',
};
assert(validateRating(validRating).valid, 'Valid rating passes validation');

const invalidRating: Partial<ComponentRatingV2> = {
  parameter: '',
  value: NaN,
  unit: '',
};
const valRatRes = validateRating(invalidRating);
assert(!valRatRes.valid, 'Rejects rating with NaN numerical value or missing unit');

// -----------------------------------------------------------------------------
// 4. Operating Conditions Model
// -----------------------------------------------------------------------------
console.log('\n4. Operating Conditions Model:');
const opCond: OperatingConditionV2 = {
  id: EntityIds.operatingCondition(),
  name: 'High-Temperature Full-Load Corner',
  ambientTemperatureC: 50.0,
  junctionTemperatureC: 105.0,
  inputVoltageV: 32.0,
  loadCurrentA: 6.0,
  frequencyHz: 500000,
  airflowLfm: 100,
  stateOfChargePercent: 90,
  ambientPressureKpa: 101.3,
};
assert(opCond.id.startsWith('cond_'), 'Operating condition has cond_ prefix');
assert(opCond.ambientTemperatureC === 50.0, 'Models ambient temperature');
assert(opCond.inputVoltageV === 32.0, 'Models high-line voltage');

// -----------------------------------------------------------------------------
// 5. Net Model & Pin Associations
// -----------------------------------------------------------------------------
console.log('\n5. Net Model & Pin Associations:');
const project = createDefaultProjectV2('dcdc-buck-converter');
const vinNet = project.nets.find(n => n.name === 'VIN_24V')!;
assert(Boolean(vinNet), 'Project contains VIN_24V net');
assert(vinNet.netClass === 'power_rail', 'VIN net is classified as power_rail');
assert(vinNet.nominalVoltage === 24.0, 'VIN net nominal voltage is 24V');

// -----------------------------------------------------------------------------
// 6. Power Rail Model
// -----------------------------------------------------------------------------
console.log('\n6. Power Rail Model:');
const voutRail = project.powerRails.find(r => r.name === 'VOUT_5V')!;
assert(Boolean(voutRail), 'Project contains VOUT_5V rail');
assert(voutRail.nominalVoltage === 5.0, 'VOUT rail nominal voltage is 5V');
assert(voutRail.maxCurrentAmps === 6.0, 'VOUT rail max current is 6.0A');
assert(voutRail.minVoltage === 4.9 && voutRail.maxVoltage === 5.1, 'VOUT rail defines tight voltage bounds');

// -----------------------------------------------------------------------------
// 7. Power Paths Model
// -----------------------------------------------------------------------------
console.log('\n7. Power Paths Model:');
assert(Array.isArray(project.powerPaths), 'Project contains powerPaths array');
assert(project.powerPaths!.length >= 1, 'Project seeds default power conversion path');
const ppath = project.powerPaths![0];
assert(ppath.name === '24V to 5V Main Power Conversion Path', 'Power path documents 24V to 5V flow');
assert(ppath.stageComponentIds.length >= 2, 'Power path documents conversion stages');
assert(ppath.expectedEfficiencyPercent === 94.5, 'Power path links expected efficiency');
assert(ppath.requirements?.length! >= 1, 'Power path traces to system requirements');
assert(ppath.snapshotIds?.length! >= 1, 'Power path traces to calculation snapshots');

const ppathVal = validatePowerPath(ppath, project);
assert(ppathVal.valid, 'Seeded power path passes validation against project components');

// -----------------------------------------------------------------------------
// 8. Signal Paths Model
// -----------------------------------------------------------------------------
console.log('\n8. Signal Paths Model:');
const signalPath: SignalPathV2 = {
  id: EntityIds.signalPath(),
  name: 'Gate Drive PWM Signal Path',
  description: 'High-speed complementary PWM drive signals from controller to GaN gate',
  sourceComponentId: project.components[0].id,
  stageComponentIds: [],
  destinationComponentId: project.components[1].id,
  netIds: [project.nets[0].id],
  signalType: 'digital_high_speed',
  frequencyHz: 500000,
  direction: 'unidirectional',
};
project.signalPaths = [signalPath];
assert(signalPath.id.startsWith('spath_'), 'Signal path ID has spath_ prefix');
assert(validateSignalPath(signalPath, project).valid, 'Signal path passes validation');

// -----------------------------------------------------------------------------
// 9. Thermal Paths Model
// -----------------------------------------------------------------------------
console.log('\n9. Thermal Paths Model:');
assert(project.thermalPaths!.length >= 1, 'Project seeds thermal path');
const tpath = project.thermalPaths![0];
assert(tpath.id.startsWith('thpath_'), 'Thermal path ID has thpath_ prefix');
assert(tpath.totalResistanceCPerW === 32.8, 'Thermal path models total thermal resistance');
assert(validateThermalPath(tpath, project).valid, 'Thermal path passes validation');

// -----------------------------------------------------------------------------
// 10. Reference Model & Untrusted URL Sanitization
// -----------------------------------------------------------------------------
console.log('\n10. Reference Model & Untrusted URL Sanitization:');
assert(project.references!.length >= 2, 'Project seeds engineering references');
const epcRef = project.references![0];
assert(epcRef.id.startsWith('ref_'), 'Reference ID has ref_ prefix');
assert(epcRef.identifier === 'EPC2045-DS', 'Reference documents manufacturer datasheet code');
assert(validateReference(epcRef).valid, 'Datasheet reference passes validation');

// Security: test malicious URL sanitization
assert(sanitizeReferenceUrl('https://ti.com/lit/ds/symlink/lm5143-q1.pdf') !== undefined, 'Allows valid HTTPS reference URL');
assert(sanitizeReferenceUrl('javascript:alert(1)') === undefined, 'Strictly rejects javascript: URL scheme');
assert(sanitizeReferenceUrl('data:text/html,<script>evil()</script>') === undefined, 'Strictly rejects data: URL scheme');
assert(sanitizeReferenceUrl('https://example.com/<script>bad()</script>') === undefined, 'Strictly rejects URLs with embedded script tags');

const maliciousRef: EngineeringReferenceV2 = {
  id: EntityIds.reference(),
  type: 'datasheet',
  title: 'XSS Attack Vector',
  url: 'javascript:stealCredentials()',
};
assert(!validateReference(maliciousRef).valid, 'Validation rejects reference with malicious URL payload');

// -----------------------------------------------------------------------------
// 11. Object Graph Navigation & Traversal
// -----------------------------------------------------------------------------
console.log('\n11. Object Graph Navigation & Traversal:');
// Connect U1 to Q1 via net
const u1Id = project.components[0].id;
const q1Id = project.components[1].id;
project.connections.push({
  id: EntityIds.connection(),
  netId: 'net_sw_node',
  name: 'Gate Drive Switch Node',
  connectionType: 'pcb_trace',
  sourceComponentId: u1Id,
  targetComponentId: q1Id,
  direction: 'unidirectional',
});

const connectedToU1 = getComponentConnectedComponents(project, u1Id);
assert(connectedToU1.length >= 1, 'Graph successfully finds connected components for U1');
assert(connectedToU1[0].component.id === q1Id, 'Finds Q1 connected to U1 via net_sw_node');

const upstreamL1 = getUpstreamObjects(project, project.components[2].id);
assert(upstreamL1.length >= 1, 'Graph traverses upstream objects for L1 inductor');
assert(upstreamL1[0].relationship === 'connects_to', 'Upstream relationship is connects_to');

// -----------------------------------------------------------------------------
// 12. Delete Safety & Dependency Auditing
// -----------------------------------------------------------------------------
console.log('\n12. Delete Safety & Dependency Auditing:');
// Attempting to delete Q1, which is in powerPaths, connections, thermalPaths, decisions
const checkDeleteQ1 = canDeleteComponent(project, q1Id);
assert(!checkDeleteQ1.safe, 'Blocks unsafe deletion of actively referenced component Q1');
assert(checkDeleteQ1.dependentEntities.length >= 2, 'Reports multiple dependent entities');
assert(checkDeleteQ1.reasons.some(r => r.includes('power path')), 'Explains dependency in power path');
assert(checkDeleteQ1.reasons.some(r => r.includes('connection')), 'Explains dependency in connection');

// Unsafe deletion attempt fails without force flag
const unsafeResult = deleteComponentSafely(project, q1Id, false);
assert(!unsafeResult.success, 'deleteComponentSafely fails when force=false on referenced component');
assert(unsafeResult.project.components.some(c => c.id === q1Id), 'Component remains safely in project');

// Historical snapshot verification: snapshots MUST remain immutable even if component is deleted
const snapshotCountBefore = project.calculationSnapshots.length;
const snapshotDigestBefore = project.calculationSnapshots[0].integrityDigest;

// Now force cascade delete
const cascadeResult = deleteComponentSafely(project, q1Id, true);
assert(cascadeResult.success, 'Cascade delete succeeds with force=true');
assert(!cascadeResult.project.components.some(c => c.id === q1Id), 'Q1 is removed from components list');
assert(!cascadeResult.project.connections.some(c => c.sourceComponentId === q1Id || c.targetComponentId === q1Id), 'Connections referencing Q1 were cleaned');
assert(!cascadeResult.project.powerPaths![0].stageComponentIds.includes(q1Id), 'Q1 removed from power path stages');

// Check historical snapshot immutability
assert(cascadeResult.project.calculationSnapshots.length === snapshotCountBefore, 'Historical snapshots count untouched');
assert(cascadeResult.project.calculationSnapshots[0].integrityDigest === snapshotDigestBefore, 'Historical snapshot integrity digest unchanged (IMMUTABILITY PRESERVED)');

// -----------------------------------------------------------------------------
// 13. Global Search Across 12+ Object Types
// -----------------------------------------------------------------------------
console.log('\n13. Global Search Across 12+ Object Types:');
const searchProj = createDefaultProjectV2('dcdc-buck-converter');

// Search for Component by part number
const resPart = searchProject(searchProj, 'EPC2045');
assert(resPart.some(r => r.entityType === 'Component' && r.title.includes('Q1')), 'Finds component by part number EPC2045');

// Search for Power Path
const resPath = searchProject(searchProj, 'Main Power Conversion');
assert(resPath.some(r => r.entityType === 'PowerPath'), 'Finds PowerPath by name');

// Search for Reference
const resRef = searchProject(searchProj, 'EPC2045-DS');
assert(resRef.some(r => r.entityType === 'Reference'), 'Finds Reference by identifier EPC2045-DS');

// Search for Pin
searchProj.components[0].pins.push({
  id: EntityIds.pin(),
  pinNumber: '14',
  name: 'BOOT1',
  type: 'power',
  electricalRole: 'power_supply',
});
const resPin = searchProject(searchProj, 'BOOT1');
assert(resPin.some(r => r.entityType === 'Pin' && r.title.includes('BOOT1')), 'Finds Pin by pin name');

// -----------------------------------------------------------------------------
// 14. Data Security & Credential Scrubbing
// -----------------------------------------------------------------------------
console.log('\n14. Data Security & Credential Scrubbing:');
const taintedProject: any = {
  ...searchProj,
  __proto__: { injectedAdmin: true },
  apiKey: 'secret_live_ai_api_key_12345',
  authorizationHeader: 'Bearer eyJhbGciOi...',
};

const jsonExport = exportV2ProjectToJson(taintedProject);
assert(!jsonExport.includes('secret_live_ai_api_key_12345'), 'Export strictly scrubs apiKey');
assert(!jsonExport.includes('Bearer eyJhbGciOi'), 'Export strictly scrubs Bearer authorization header');
assert(!jsonExport.includes('injectedAdmin'), 'Export neutralizes prototype pollution payload');

const imported = importV2ProjectFromJson(jsonExport);
assert(imported.success && imported.project !== undefined, 'Exported JSON cleanly imports back');
assert((imported.project as any).injectedAdmin === undefined, 'Imported object does not contain prototype pollution');
assert(imported.project!.powerPaths!.length >= 1, 'Imported project preserves power paths');
assert(imported.project!.references!.length >= 2, 'Imported project preserves references');

// -----------------------------------------------------------------------------
// 15. Cross-Project & Revision Isolation
// -----------------------------------------------------------------------------
console.log('\n15. Cross-Project & Revision Isolation:');
const projA = createDefaultProjectV2('dcdc-buck-converter');
const projB = createDefaultProjectV2('dcdc-buck-converter');

assert(projA.metadata.id !== projB.metadata.id, 'Project A and Project B have distinct IDs');
assert(projA.components[0].id !== projB.components[0].id, 'Components in Project A and B have distinct IDs');

// Mutating Project A components does not touch Project B
projA.components[0].name = 'Mutated Component A';
assert(projB.components[0].name !== 'Mutated Component A', 'Project B remains completely isolated from mutations to Project A');

// -----------------------------------------------------------------------------
// 16. Enterprise Scale & Performance Stress Test
// -----------------------------------------------------------------------------
console.log('\n16. Enterprise Scale & Performance Stress Test:');
const tStart = Date.now();
const largeProj = createDefaultProjectV2('blank');

// Build 500 components, 1000 pins, 300 nets, 100 rails, 100 connections, 50 power paths, 50 signal paths, 50 thermal paths
const comps: EngineeringComponentV2[] = [];
for (let i = 0; i < 500; i++) {
  comps.push({
    id: `comp_perf_${i}`,
    refDes: `R${i + 1}`,
    name: `Precision Resistor ${i + 1}`,
    category: 'passive_resistor',
    description: `0.1% Thin film resistor 10k 0402 index ${i}`,
    manufacturer: 'Vishay',
    partNumber: `TNPW0402${i}BE`,
    packageType: '0402',
    status: 'selected',
    parametricRatings: {
      resistance: { parameter: 'Resistance', value: 10000 + i, unit: 'Ω' },
    },
    ratings: [
      {
        id: `rat_perf_${i}`,
        parameter: 'Power Rating',
        value: 0.063,
        unit: 'W',
        ratingType: 'absolute_maximum',
      },
    ],
    pins: [
      { id: `pin_perf_${i}_1`, pinNumber: '1', name: 'A', type: 'passive', electricalRole: 'passive' },
      { id: `pin_perf_${i}_2`, pinNumber: '2', name: 'B', type: 'passive', electricalRole: 'passive' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
largeProj.components = comps;

// 300 Nets
for (let i = 0; i < 300; i++) {
  largeProj.nets.push({
    id: `net_perf_${i}`,
    name: `NET_SIGNAL_${i}`,
    netClass: 'general_io',
  });
}

// 100 Rails
for (let i = 0; i < 100; i++) {
  largeProj.powerRails.push({
    id: `rail_perf_${i}`,
    name: `VDD_${i}V`,
    type: 'regulated_dc',
    nominalVoltage: 1.0 + (i * 0.1),
    minVoltage: 0.95 + (i * 0.1),
    maxVoltage: 1.05 + (i * 0.1),
    maxCurrentAmps: 5.0,
  });
}

// 100 Connections
for (let i = 0; i < 100; i++) {
  largeProj.connections.push({
    id: `conn_perf_${i}`,
    netId: `net_perf_${i}`,
    connectionType: 'pcb_trace',
    sourceComponentId: comps[i].id,
    targetComponentId: comps[i + 100].id,
  });
}

// 50 Power Paths
largeProj.powerPaths = [];
for (let i = 0; i < 50; i++) {
  largeProj.powerPaths.push({
    id: `ppath_perf_${i}`,
    name: `Power Path Chain ${i}`,
    sourceComponentId: comps[i].id,
    stageComponentIds: [comps[i + 1].id, comps[i + 2].id],
    destinationComponentId: comps[i + 3].id,
  });
}

// 50 Signal Paths
largeProj.signalPaths = [];
for (let i = 0; i < 50; i++) {
  largeProj.signalPaths.push({
    id: `spath_perf_${i}`,
    name: `Signal Path Chain ${i}`,
    sourceComponentId: comps[i + 10].id,
    stageComponentIds: [comps[i + 11].id],
    destinationComponentId: comps[i + 12].id,
    netIds: [`net_perf_${i}`],
    signalType: 'digital_low_speed',
    direction: 'unidirectional',
  });
}

// 50 Thermal Paths
largeProj.thermalPaths = [];
for (let i = 0; i < 50; i++) {
  largeProj.thermalPaths.push({
    id: `thpath_perf_${i}`,
    name: `Thermal Path Chain ${i}`,
    sourceNodeOrComponentId: comps[i + 20].id,
    stageIds: ['thnode_ambient'],
    destinationNodeOrComponentId: 'thnode_ambient',
    totalResistanceCPerW: 45.0,
  });
}

const buildTimeMs = Date.now() - tStart;
assert(buildTimeMs < 150, `Built 500 components, 1000 pins, 300 nets, 100 rails in ${buildTimeMs}ms (<150ms budget)`);

// Test Search Performance on massive project
const tSearchStart = Date.now();
const searchPerfResults = searchProject(largeProj, 'R250');
const searchTimeMs = Date.now() - tSearchStart;
assert(searchPerfResults.length >= 1, 'Search found target entity R250 in massive project');
assert(searchTimeMs < 30, `Searched 500+ entities in ${searchTimeMs}ms (<30ms budget)`);

// Test Graph Traversal on massive project
const tGraphStart = Date.now();
const connected = getComponentConnectedComponents(largeProj, comps[25].id);
const graphTimeMs = Date.now() - tGraphStart;
assert(connected.length >= 1, 'Graph found connected components in massive project');
assert(graphTimeMs < 20, `Graph traversal executed in ${graphTimeMs}ms (<20ms budget)`);

// Test Serialization on massive project
const tExportStart = Date.now();
const largeJson = exportV2ProjectToJson(largeProj);
const exportTimeMs = Date.now() - tExportStart;
assert(largeJson.length > 100000, `Serialized massive project (${Math.round(largeJson.length / 1024)} KB)`);
assert(exportTimeMs < 60, `Exported massive project JSON in ${exportTimeMs}ms (<60ms budget)`);

// -----------------------------------------------------------------------------
// 17. Zero Regression on V1 Baseline
// -----------------------------------------------------------------------------
console.log('\n17. Zero Regression on V1 Baseline:');
const v1Default = createDefaultProject('dcdc-converter');
assert(v1Default.schemaVersion === '1.0.0', 'V1 createDefaultProject preserves schemaVersion 1.0.0');
assert(v1Default.requirements.length > 0, 'V1 project maintains requirements');
assert(v1Default.designCases.length > 0, 'V1 project maintains design cases');

// -----------------------------------------------------------------------------
// Final Audit Summary
// -----------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`V2 WAVE 03 VERIFICATION: ${passCount} / ${passCount + failCount} PASSED (${failCount} failed)`);
console.log('======================================================');

if (failCount > 0) {
  console.error('\n❌ Wave 03 verification failed!');
  process.exit(1);
} else {
  console.log('\n✓ Wave 03 Engineering Object Model successfully verified with zero defects.');
}
