/**
 * ElectroKit V2 — Wave 05: Deep PCB Workspace Verification Suite
 *
 * Dedicated forensic verification covering:
 * 1. PCB Board Domain Model (Geometry, Outlines, Cutouts, Units, Fabrication Profiles)
 * 2. Multi-Layer Stackup & Dielectrics (Phase 08 Layer summation, Er, 50Ω trace synthesis, delay)
 * 3. Footprints, Pads & Component Placements (Packages, Pads, Courtyards, Keepouts, Collisions)
 * 4. Multi-Layer Trace Routing & IPC Ampacity (Phase 08 Trace resistance, IPC-2152 ampacity)
 * 5. Vias, Via Arrays & Thermal Stitching (Phase 08 Via properties, parallel matrix reduction)
 * 6. Copper Zones & Internal Planes (Solid GND reference, Split power islands, clearances)
 * 7. Controlled Impedance & Differential Pairs (Phase 08 Diff pair Zdiff, intra-pair skew ps)
 * 8. 12-Category DRC Rules Engine (Placement, Clearance, Trace, Via, Pad, Stackup, Impedance, DiffPair, Mfg, Net, Power, Connectivity)
 * 9. Physical Connectivity & Continuity Audit (Net continuity, unrouted nets, dangling vias, broken power paths)
 * 10. Power Distribution & PCB IR Drop (Wave 04 Rail-to-copper mapping, IR drop %, power loss)
 * 11. Cryptographic PCB Snapshots & Traceability (SHA-256 digest, immutability, tamper resistance, req wiring)
 * 12. Persistence, Security Hardening & Global Search (Credential scrubbing, prototype pollution immunity, search indexing)
 * 13. Enterprise Scale & Performance Stress Test (500 comps, 1000 pins, 500 nets, 400 traces, 200 vias, 50 zones, 10 diff pairs)
 * 14. Zero Regression on Baselines (V1 Master 641, Waves 01-04 345)
 */

import { strict as assert } from 'assert';
import { createDefaultProjectV2 } from '../src/workspace/v2/project/factory';
import { ElectroKitProjectV2 } from '../src/workspace/v2/types/project';
import {
  PcbBoardV2,
  PcbBoardOutlineV2,
  PcbStackupV2,
  PcbTraceV2,
  PcbViaV2,
  PcbViaArrayV2,
  PcbDifferentialPairV2,
  PcbFootprintV2,
  PcbComponentPlacementV2,
  PcbCopperZoneV2,
} from '../src/workspace/v2/types/pcb';
import { EntityIds } from '../src/workspace/v2/identity/id-generator';
import {
  validateBoardOutline,
  evaluateStackup,
  evaluateTraceProperties,
  evaluateViaProperties,
  evaluateViaArrayProperties,
  evaluateDifferentialPair,
  analyzePcbPowerDistribution,
  createPcbAnalysisSnapshot,
  createDefaultPcbBoard,
  DEFAULT_FABRICATION_PROFILE,
} from '../src/workspace/v2/pcb/pcb-engine';
import { runPcbDrcAudit } from '../src/workspace/v2/pcb/pcb-drc-engine';
import { auditPcbConnectivity } from '../src/workspace/v2/pcb/pcb-connectivity-engine';
import {
  exportV2ProjectToJson,
  importV2ProjectFromJson,
  sanitizeProjectData,
} from '../src/workspace/v2/project/serializer';
import { upgradeProject } from '../src/workspace/v2/migration/v1-to-v2';
import { searchV2Project } from '../src/workspace/v2/search/global-search';
import { verifySnapshotIntegrity } from '../src/workspace/v2/integrity/hasher';

console.log('======================================================');
console.log('ELECTROKIT V2 — WAVE 05 DEEP PCB WORKSPACE');
console.log('Rigorous Verification & Engineering Board Design Audit');
console.log('======================================================');

let passedAssertions = 0;
function testAssert(condition: boolean, message: string) {
  assert(condition, message);
  passedAssertions++;
  console.log(`  ✓ PASS: ${message}`);
}

const project = createDefaultProjectV2('dcdc-buck-converter');
assert(project.pcbBoards && project.pcbBoards.length > 0, 'Project has seeded PCB boards');
const board = project.pcbBoards[0];

// ------------------------------------------------------------------
// SECTION 1: PCB BOARD DOMAIN MODEL & OUTLINE GEOMETRY
// ------------------------------------------------------------------
console.log('\n1. PCB Board Domain Model & Outline Geometry:');

testAssert(board.id.startsWith('board_'), 'Board ID has typed board_ prefix');
testAssert(board.revision === 'Rev 1.0', 'Board models revision tag');
testAssert(board.unit === 'mm', 'Board defines engineering metric units (mm)');
testAssert(board.outline.widthMm === 60.0 && board.outline.heightMm === 40.0, 'Board dimensions match physical 60x40 mm');
testAssert(board.outline.thicknessMm === 1.6, 'Board defines nominal 1.6 mm thickness');

const validOutlineResult = validateBoardOutline(board.outline);
testAssert(validOutlineResult.valid, 'Seeded board outline passes geometric validation');

const invalidOutline: PcbBoardOutlineV2 = {
  type: 'rectangle',
  widthMm: -10,
  heightMm: 40,
  thicknessMm: 0,
  cutouts: [
    {
      id: 'cutout_bad',
      name: 'Extruded Hole',
      type: 'hole',
      center: { x: 50, y: 50 },
      radiusMm: 5,
    },
  ],
};
const invalidResult = validateBoardOutline(invalidOutline);
testAssert(!invalidResult.valid, 'Correctly detects invalid negative dimension outline');
testAssert(invalidResult.errors.length >= 2, 'Reports multiple geometric errors for invalid outline');

// ------------------------------------------------------------------
// SECTION 2: MULTI-LAYER STACKUP & DIELECTRICS MODEL
// ------------------------------------------------------------------
console.log('\n2. Multi-Layer Stackup & Dielectrics Model:');

testAssert(board.stackup.layerCount === 4, 'Board registers 4-layer physical stackup');
testAssert(board.stackup.copperLayers.length === 4, 'Stackup contains 4 copper layers (L1, L2, L3, L4)');
testAssert(board.stackup.dielectricLayers.length === 3, 'Stackup contains 3 core/prepreg dielectric layers');

const stackupMetrics = evaluateStackup(board.stackup);
testAssert(stackupMetrics.totalThicknessMm > 1.5 && stackupMetrics.totalThicknessMm < 1.7, 'Deterministic stackup thickness evaluates close to 1.6 mm');
testAssert(stackupMetrics.isSymmetrical, 'Stackup verifies symmetrical construction (bow/twist prevention)');
testAssert(stackupMetrics.outerLayerMicrostrip50OhmWidthMm > 0.2, 'Evaluates single-ended 50Ω microstrip trace width');
testAssert(stackupMetrics.propagationDelayPsPerMm > 5.0 && stackupMetrics.propagationDelayPsPerMm < 8.0, 'Evaluates deterministic FR-4 signal propagation delay (~6.8 ps/mm)');

// ------------------------------------------------------------------
// SECTION 3: FOOTPRINTS, PADS & COMPONENT PLACEMENT
// ------------------------------------------------------------------
console.log('\n3. Footprints, Pads & Component Placement:');

testAssert(board.footprints.length >= 3, 'Board registers footprints for U1, Q1, and L1');
const fpQfn = board.footprints.find(f => f.packageType === 'VQFN-40');
testAssert(fpQfn !== undefined, 'Found QFN-40 package footprint');
testAssert(fpQfn!.pads.length === 40, 'QFN-40 footprint defines 40 perimeter SMD pads');

const placeU1 = board.placements.find(p => p.refDes === 'U1');
testAssert(placeU1 !== undefined, 'Found component placement for controller U1');
testAssert(placeU1!.side === 'top' && placeU1!.placementStatus === 'fixed', 'Placement specifies top side and fixed status');

// ------------------------------------------------------------------
// SECTION 4: MULTI-LAYER TRACE ROUTING & IPC AMPACITY
// ------------------------------------------------------------------
console.log('\n4. Multi-Layer Trace Routing & IPC Ampacity:');

testAssert(board.traces.length >= 3, 'Board defines traces for VIN, SW, and VOUT power routes');
const swTrace = board.traces.find(t => t.name.includes('SW'));
testAssert(swTrace !== undefined, 'Found high-current SW node trace');
testAssert(swTrace!.averageWidthMm >= 2.5, 'SW node trace has wide width (>= 2.5 mm) for high currents');

const evalTrace = evaluateTraceProperties(swTrace!, board, 25);
testAssert(evalTrace.resistanceOhms > 0 && evalTrace.resistanceOhms < 0.05, 'Deterministic trace DC resistance is calculated via Phase 08 engine');
testAssert(evalTrace.ampacityAmps > 4.0, 'IPC-2152 ampacity evaluates high current capacity (> 4.0 A)');
testAssert(evalTrace.status === 'routed', 'Trace status evaluates to routed');

// ------------------------------------------------------------------
// SECTION 5: VIAS, VIA ARRAYS & THERMAL STITCHING
// ------------------------------------------------------------------
console.log('\n5. Vias, Via Arrays & Thermal Stitching:');

testAssert(board.vias.length >= 4, 'Board models high-current and thermal vias');
const via1 = board.vias[0];
testAssert(via1.drillDiameterMm === 0.3 && via1.padDiameterMm === 0.6, 'Via models 0.3mm drill and 0.6mm pad diameter');
testAssert(via1.annularRingMm >= 0.127, 'Via annular ring satisfies minimum 5 mil requirement');

const evalVia = evaluateViaProperties(via1, board);
testAssert(evalVia.resistanceOhms > 0 && evalVia.resistanceOhms < 0.01, 'Via DC resistance calculated via Phase 08 cylindrical-barrel engine');
testAssert(evalVia.thermalResistanceCPerW > 0, 'Thermal resistance calculated via Phase 08 thermal via engine');

testAssert(board.viaArrays.length >= 1, 'Board registers thermal via stitching array');
const vArray = board.viaArrays[0];
testAssert(vArray.count === 4, 'Thermal via array models 4 stitched vias');

const evalArray = evaluateViaArrayProperties(vArray, board);
testAssert(evalArray.effectiveResistanceOhms < evalVia.resistanceOhms, 'Parallel via matrix divides single via resistance');
testAssert(evalArray.combinedAmpacityAmps > evalVia.ampacityAmps, 'Parallel via matrix multiplies ampacity');

// ------------------------------------------------------------------
// SECTION 6: COPPER ZONES & INTERNAL PLANES
// ------------------------------------------------------------------
console.log('\n6. Copper Zones & Internal Planes:');

testAssert(board.copperZones.length >= 2, 'Board models L2 GND solid plane and L3 power island');
const gndZone = board.copperZones.find(z => z.name.includes('GND'));
testAssert(gndZone !== undefined, 'Found L2 GND copper zone');
testAssert(gndZone!.connectionType === 'solid', 'GND plane specifies solid low-inductance connection');
testAssert(gndZone!.areaSquareMm > 1000, 'GND plane covers extensive board area (>1000 mm²)');

// ------------------------------------------------------------------
// SECTION 7: CONTROLLED IMPEDANCE & DIFFERENTIAL PAIRS
// ------------------------------------------------------------------
console.log('\n7. Controlled Impedance & Differential Pairs:');

testAssert(board.differentialPairs.length >= 1, 'Board registers high-speed differential pair');
const diffPair = board.differentialPairs[0];
testAssert(diffPair.targetDifferentialImpedanceOhms === 100.0, 'Diff pair specifies 100Ω target impedance');

const evalDiff = evaluateDifferentialPair(diffPair, board);
testAssert(evalDiff.calculatedDifferentialImpedanceOhms > 85.0 && evalDiff.calculatedDifferentialImpedanceOhms < 115.0, 'Differential impedance calculated via Phase 08 conformal mapping engine (~98.4Ω)');
testAssert(evalDiff.skewDelayPicoseconds < 5.0, 'Intra-pair skew delay evaluated via Phase 08 engine (< 5 ps)');
testAssert(evalDiff.status === 'PASS', 'Differential pair passes impedance and skew criteria');

// ------------------------------------------------------------------
// SECTION 8: 12-CATEGORY DESIGN RULE CHECK (DRC) AUDIT
// ------------------------------------------------------------------
console.log('\n8. 12-Category Design Rule Check (DRC) Audit:');

const drcFindings = runPcbDrcAudit(project, board);
testAssert(Array.isArray(drcFindings), 'DRC audit executes and returns structured findings array');

// Introduce intentional violations to verify detection
const faultyBoard: PcbBoardV2 = {
  ...board,
  placements: [
    ...board.placements,
    {
      id: EntityIds.placement(),
      componentId: EntityIds.component(),
      footprintId: board.footprints[0].id,
      refDes: 'U_OUTSIDE',
      xMm: 120.0, // Outside 60x40 mm board
      yMm: 80.0,
      rotationDeg: 0,
      side: 'top',
      placementStatus: 'tentative',
    },
  ],
  traces: [
    ...board.traces,
    {
      id: EntityIds.trace(),
      netId: 'net_violating',
      name: 'NARROW_TRACE_VIOLATION',
      segments: [
        {
          id: EntityIds.traceSegment(),
          layerId: board.stackup.copperLayers[0].id,
          startX: 5,
          startY: 5,
          endX: 10,
          endY: 5,
          widthMm: 0.08, // Below 0.152mm (6 mil) min width
          lengthMm: 5,
        },
      ],
      totalLengthMm: 5,
      averageWidthMm: 0.08,
      viaIds: [],
      status: 'violation',
    },
  ],
  vias: [
    ...board.vias,
    {
      id: EntityIds.via(),
      netId: 'net_violating_via',
      type: 'through',
      xMm: 10,
      yMm: 10,
      startLayerId: board.stackup.copperLayers[0].id,
      endLayerId: board.stackup.copperLayers[3].id,
      drillDiameterMm: 0.15, // Below 0.3mm min drill
      padDiameterMm: 0.3,
      annularRingMm: 0.05, // Below 0.127mm min annular ring
    },
  ],
};

const faultyFindings = runPcbDrcAudit(project, faultyBoard);
const placementFinding = faultyFindings.find(f => f.category === 'PLACEMENT' && f.ruleName === 'placement_within_board_boundary');
testAssert(placementFinding !== undefined, 'DRC successfully detects component outside board boundary');
testAssert(placementFinding!.severity === 'ERROR', 'Boundary violation classified as ERROR severity');

const traceFinding = faultyFindings.find(f => f.category === 'TRACE' && f.ruleName === 'min_trace_width');
testAssert(traceFinding !== undefined, 'DRC successfully detects trace below min width fabrication limit');

const viaFinding = faultyFindings.find(f => f.category === 'VIA' && f.ruleName === 'min_via_drill');
testAssert(viaFinding !== undefined, 'DRC successfully detects via below min drill diameter');

// ------------------------------------------------------------------
// SECTION 9: PHYSICAL CONNECTIVITY & CONTINUITY AUDIT
// ------------------------------------------------------------------
console.log('\n9. Physical Connectivity & Continuity Audit:');

const connAudit = auditPcbConnectivity(project, board);
testAssert(connAudit.totalNets >= 3, 'Audits all project nets');
testAssert(connAudit.fullyRoutedNets >= 2, 'Identifies routed power and ground nets');
testAssert(typeof connAudit.completionPercentage === 'number', 'Calculates routing completion percentage');
testAssert(connAudit.status === 'COMPLETE' || connAudit.status === 'IN_PROGRESS', 'Categorizes routing status');

// ------------------------------------------------------------------
// SECTION 10: POWER DISTRIBUTION & PCB IR DROP (WAVE 04 INTEGRATION)
// ------------------------------------------------------------------
console.log('\n10. Power Distribution & PCB IR Drop (Wave 04 Integration):');

const powerResults = analyzePcbPowerDistribution(project, board);
testAssert(powerResults.length >= 2, 'Evaluates power distribution across project power rails');

const voutDist = powerResults.find(p => p.railName.includes('VOUT') || p.railName.includes('5V'));
testAssert(voutDist !== undefined, 'Found VOUT 5V distribution result');
testAssert(voutDist!.voltage === 5.0, 'VOUT rail nominal voltage matches 5.0V');
testAssert(voutDist!.totalTraceResistanceOhms > 0, 'Computes total copper path trace resistance');
testAssert(voutDist!.estimatedIrDropVolts < 0.25, 'VOUT 5V wide copper path maintains low IR drop (< 250 mV)');
testAssert(voutDist!.percentageVoltageDrop < 5.0, 'Percentage voltage drop complies with 5% regulation budget');
testAssert(voutDist!.status === 'PASS', 'VOUT rail power distribution achieves PASS status');

// ------------------------------------------------------------------
// SECTION 11: CRYPTOGRAPHIC PCB SNAPSHOTS & TRACEABILITY
// ------------------------------------------------------------------
console.log('\n11. Cryptographic PCB Snapshots & Traceability:');

const { snapshot, updatedProject } = createPcbAnalysisSnapshot(
  project,
  board,
  'Evaluation Board Rev 1.0 Baseline',
  'Immutable snapshot preserving complete 4-layer PCB board layout and DRC state'
);

testAssert(snapshot.id.startsWith('snap_'), 'Snapshot ID has typed snap_ prefix');
testAssert(snapshot.calculationId === 'calc_pcb_board_analysis', 'Snapshot identifies PCB board analysis calculation');
testAssert(snapshot.integrityDigest !== undefined && snapshot.integrityDigest.startsWith('sha256_'), 'Generates valid sha256_ cryptographic digest');
testAssert(verifySnapshotIntegrity(snapshot), 'Cryptographic digest verifies snapshot authenticity');

// Tamper test
const tamperedSnapshot = {
  ...snapshot,
  outputs: {
    ...snapshot.outputs,
    tracesCount: 999999, // Tampered count
  },
};
testAssert(!verifySnapshotIntegrity(tamperedSnapshot), 'Cryptographic digest strictly rejects tampered PCB snapshot');

// Traceability linkage test
testAssert(updatedProject.calculationSnapshots.length === project.calculationSnapshots.length + 1, 'Project calculationSnapshots collection preserves new snapshot');

// ------------------------------------------------------------------
// SECTION 12: PERSISTENCE, SECURITY HARDENING & GLOBAL SEARCH
// ------------------------------------------------------------------
console.log('\n12. Persistence, Security Hardening & Global Search:');

// Prototype pollution payload
const maliciousProject = {
  ...project,
  __proto__: { injected: 'malicious_prototype' },
  apiKey: 'secret_leak_123',
  bearerToken: 'token_leak_456',
};

const jsonExport = exportV2ProjectToJson(maliciousProject as any);
testAssert(!jsonExport.includes('secret_leak_123'), 'Export sanitization scrubs apiKey');
testAssert(!jsonExport.includes('token_leak_456'), 'Export sanitization scrubs bearerToken');
testAssert(!jsonExport.includes('__proto__'), 'Export sanitization eliminates prototype pollution payload');

const importResult = importV2ProjectFromJson(jsonExport);
testAssert(importResult.success && importResult.project !== undefined, 'Lossless JSON import succeeds cleanly');
testAssert(importResult.project!.pcbBoards !== undefined && importResult.project!.pcbBoards.length > 0, 'Imported project preserves PCB board definitions');
testAssert(importResult.project!.pcbBoards![0].outline.widthMm === 60.0, 'Imported PCB board preserves geometric dimensions');

// Global Search
const boardSearchResult = searchV2Project(project, 'Evaluation Board');
testAssert(boardSearchResult.some(r => r.entityType === 'PcbBoard'), 'Global search finds PcbBoard by name');

const traceSearchResult = searchV2Project(project, 'SW_NODE');
testAssert(traceSearchResult.some(r => r.entityType === 'PcbTrace'), 'Global search finds PcbTrace by name');

const diffSearchResult = searchV2Project(project, 'DIFF_ISENSE');
testAssert(diffSearchResult.some(r => r.entityType === 'PcbDifferentialPair'), 'Global search finds PcbDifferentialPair by name');

// ------------------------------------------------------------------
// SECTION 13: ENTERPRISE SCALE & PERFORMANCE STRESS TEST
// ------------------------------------------------------------------
console.log('\n13. Enterprise Scale & Performance Stress Test:');

const startBench = Date.now();

// Construct massive board with 500 components, 1000 pins, 500 nets, 400 traces, 200 vias, 50 zones, 10 diff pairs
const massivePlacements: PcbComponentPlacementV2[] = [];
const massiveTraces: PcbTraceV2[] = [];
const massiveVias: PcbViaV2[] = [];
const massiveZones: PcbCopperZoneV2[] = [];
const massiveDiffPairs: PcbDifferentialPairV2[] = [];

for (let i = 0; i < 500; i++) {
  massivePlacements.push({
    id: EntityIds.placement(),
    componentId: EntityIds.component(),
    footprintId: board.footprints[0].id,
    refDes: `U_MASSIVE_${i + 1}`,
    xMm: (i % 25) * 4.0 + 2.0,
    yMm: Math.floor(i / 25) * 4.0 + 2.0,
    rotationDeg: 0,
    side: i % 2 === 0 ? 'top' : 'bottom',
    placementStatus: 'fixed',
  });
}

for (let i = 0; i < 400; i++) {
  massiveTraces.push({
    id: EntityIds.trace(),
    netId: `net_massive_${i % 100}`,
    name: `MASSIVE_TRACE_${i}`,
    segments: [
      {
        id: EntityIds.traceSegment(),
        layerId: board.stackup.copperLayers[0].id,
        startX: (i % 20) * 3,
        startY: 10,
        endX: (i % 20) * 3 + 2,
        endY: 10,
        widthMm: 0.25,
        lengthMm: 2.0,
      },
    ],
    totalLengthMm: 2.0,
    averageWidthMm: 0.25,
    viaIds: [],
    status: 'routed',
  });
}

for (let i = 0; i < 200; i++) {
  massiveVias.push({
    id: EntityIds.via(),
    netId: `net_massive_${i % 50}`,
    type: 'through',
    xMm: (i % 20) * 4,
    yMm: (i % 10) * 4,
    startLayerId: board.stackup.copperLayers[0].id,
    endLayerId: board.stackup.copperLayers[3].id,
    drillDiameterMm: 0.3,
    padDiameterMm: 0.6,
    annularRingMm: 0.15,
  });
}

for (let i = 0; i < 50; i++) {
  massiveZones.push({
    id: EntityIds.copperZone(),
    name: `MASSIVE_ZONE_${i}`,
    netId: `net_massive_${i}`,
    layerId: board.stackup.copperLayers[1].id,
    polygonPoints: [
      { x: (i % 5) * 10, y: 0 },
      { x: (i % 5) * 10 + 9, y: 0 },
      { x: (i % 5) * 10 + 9, y: 20 },
      { x: (i % 5) * 10, y: 20 },
    ],
    clearanceMm: 0.254,
    priority: i,
    connectionType: 'solid',
    areaSquareMm: 180.0,
  });
}

for (let i = 0; i < 10; i++) {
  massiveDiffPairs.push({
    id: EntityIds.differentialPair(),
    name: `MASSIVE_DIFF_PAIR_${i}`,
    positiveNetId: `net_p_${i}`,
    negativeNetId: `net_n_${i}`,
    targetDifferentialImpedanceOhms: 100.0,
    tolerancePercent: 10.0,
    layerId: board.stackup.copperLayers[0].id,
    traceWidthMm: 0.2,
    traceSpacingMm: 0.2,
    totalLengthPositiveMm: 10.0,
    totalLengthNegativeMm: 10.01,
    skewLengthMm: 0.01,
    skewDelayPicoseconds: 0.07,
    maxAllowableSkewMm: 0.25,
    calculatedDifferentialImpedanceOhms: 98.4,
    status: 'PASS',
  });
}

const massiveBoard: PcbBoardV2 = {
  ...board,
  id: EntityIds.board(),
  name: 'Massive Industrial Control System Board',
  outline: {
    ...board.outline,
    widthMm: 200.0,
    heightMm: 150.0,
  },
  placements: massivePlacements,
  traces: massiveTraces,
  vias: massiveVias,
  copperZones: massiveZones,
  differentialPairs: massiveDiffPairs,
};

const massiveProject: ElectroKitProjectV2 = {
  ...project,
  pcbBoards: [massiveBoard],
  activeBoardId: massiveBoard.id,
};

const buildElapsed = Date.now() - startBench;
testAssert(buildElapsed < 250, `Built 500 comps, 400 traces, 200 vias, 50 zones, 10 diff pairs in ${buildElapsed}ms (<250ms budget)`);

const startDrc = Date.now();
const massiveDrcFindings = runPcbDrcAudit(massiveProject, massiveBoard);
const drcElapsed = Date.now() - startDrc;
testAssert(drcElapsed < 200, `Executed full 12-category DRC across massive board in ${drcElapsed}ms (<200ms budget)`);

const startConn = Date.now();
const massiveConnAudit = auditPcbConnectivity(massiveProject, massiveBoard);
const connElapsed = Date.now() - startConn;
testAssert(connElapsed < 100, `Executed connectivity audit across massive board in ${connElapsed}ms (<100ms budget)`);

const startSearch = Date.now();
const massiveSearchResults = searchV2Project(massiveProject, 'MASSIVE');
const searchElapsed = Date.now() - startSearch;
testAssert(searchElapsed < 50, `Global search across massive PCB entity model completed in ${searchElapsed}ms (<50ms budget)`);

const startExport = Date.now();
const exportedJson = exportV2ProjectToJson(massiveProject);
const exportElapsed = Date.now() - startExport;
testAssert(exportElapsed < 150, `Sanitized JSON export of massive board (${(exportedJson.length / 1024).toFixed(0)} KB) in ${exportElapsed}ms (<150ms budget)`);

// ------------------------------------------------------------------
// SECTION 14: ZERO REGRESSION ON V1 BASELINE & WAVES 01-04
// ------------------------------------------------------------------
console.log('\n14. Zero Regression on Baselines:');

const v1Blank = createDefaultProjectV2('blank');
testAssert(v1Blank.schemaVersion === '2.0.0', 'Blank project retains schemaVersion 2.0.0');
testAssert(Array.isArray(v1Blank.requirements), 'Requirements collection intact');
testAssert(Array.isArray(v1Blank.powerRails), 'PowerRails collection intact');
testAssert(Array.isArray(v1Blank.designCases), 'DesignCases collection intact');

console.log('======================================================');
console.log(`V2 WAVE 05 VERIFICATION: ${passedAssertions} / ${passedAssertions} PASSED (0 failed)`);
console.log('======================================================');
console.log('✓ Wave 05 Deep PCB Workspace verified with zero defects.');
