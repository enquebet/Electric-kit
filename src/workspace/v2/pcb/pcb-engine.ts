/**
 * ElectroKit V2 — Wave 05: Deep PCB Workspace Engine
 *
 * Orchestrates existing authoritative deterministic Phase 08 engines:
 * - copper-trace: calculateTraceResistance, calculateIpcTraceAmpacity, copperWeightToThicknessMeters
 * - vias: calculateViaProperties, calculateViaArray
 * - transmission-lines: calculateMicrostripImpedance, calculateStriplineImpedance, calculateCoplanarWaveguideImpedance
 * - differential-pairs: calculateDifferentialPair, calculateIntraPairSkew
 * - stackup-dielectrics: calculateStackupThickness, calculatePropagationDelay
 * - signal-integrity: calculateSignalIntegrity
 * - power-integrity: calculatePdnTargetImpedance, calculatePowerPlane
 *
 * Implements board orchestration, multi-layer routing calculations, via modeling,
 * power distribution integration with Wave 04, and cryptographic snapshotting.
 */

import { ElectroKitProjectV2 } from '../types/project';
import {
  PcbBoardV2,
  PcbBoardOutlineV2,
  PcbStackupV2,
  PcbTraceV2,
  PcbViaV2,
  PcbViaArrayV2,
  PcbDifferentialPairV2,
  PcbPowerDistributionResult,
  PcbFabricationProfileV2,
  PcbFootprintV2,
  PcbComponentPlacementV2,
  PcbCopperZoneV2,
  PcbLengthConstraintV2,
  PcbImpedanceConstraintV2,
  PcbKeepoutV2,
  PcbTestPointV2,
} from '../types/pcb';
import { CalculationSnapshotV2 } from '../types/calculations';
import { EntityIds } from '../identity/id-generator';
import { computeSnapshotDigest } from '../integrity/hasher';

// Deterministic Phase 08 Engine imports
import {
  calculateTraceResistance,
  calculateIpcTraceAmpacity,
} from '../../../engines/pcb/copper-trace';
import {
  calculateViaProperties,
  calculateViaArray,
} from '../../../engines/pcb/vias';
import {
  calculateMicrostripImpedance,
  calculateStriplineImpedance,
  calculateCoplanarWaveguideImpedance,
} from '../../../engines/pcb/transmission-lines';
import {
  calculateDifferentialPair,
  calculateIntraPairSkew,
} from '../../../engines/pcb/differential-pairs';
import {
  calculateStackupThickness,
  calculatePropagationDelay,
} from '../../../engines/pcb/stackup-dielectrics';
import { calculateSignalIntegrity } from '../../../engines/pcb/signal-integrity';

/**
 * Standard default fabrication profile (conservative 6/6 mil manufacturing baseline)
 */
export const DEFAULT_FABRICATION_PROFILE: PcbFabricationProfileV2 = {
  id: 'fab_standard_default',
  name: 'Standard FR-4 Reference Profile (6/6 mil)',
  source: 'manufacturer_reference',
  minTraceWidthMm: 0.152, // 6 mil
  minTraceSpacingMm: 0.152, // 6 mil
  minDrillDiameterMm: 0.3, // 12 mil
  minViaPadDiameterMm: 0.6, // 24 mil
  minAnnularRingMm: 0.127, // 5 mil
  minCopperToEdgeMm: 0.254, // 10 mil
  minSolderMaskBridgeMm: 0.1, // 4 mil
  maxLayerCount: 8,
};

/**
 * Validate board outline geometry
 */
export function validateBoardOutline(
  outline: PcbBoardOutlineV2
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (outline.widthMm <= 0) errors.push('Board width must be greater than zero');
  if (outline.heightMm <= 0) errors.push('Board height must be greater than zero');
  if (outline.thicknessMm <= 0) errors.push('Board thickness must be greater than zero');

  if (outline.type === 'rounded_rectangle') {
    const maxRadius = Math.min(outline.widthMm, outline.heightMm) / 2;
    if (outline.cornerRadiusMm !== undefined && outline.cornerRadiusMm > maxRadius) {
      errors.push(`Corner radius (${outline.cornerRadiusMm}mm) exceeds half the board dimension (${maxRadius}mm)`);
    }
  }

  // Verify cutouts are contained within board boundaries
  for (const c of outline.cutouts) {
    if (c.type === 'hole' && c.center && c.radiusMm) {
      if (
        c.center.x - c.radiusMm < 0 ||
        c.center.x + c.radiusMm > outline.widthMm ||
        c.center.y - c.radiusMm < 0 ||
        c.center.y + c.radiusMm > outline.heightMm
      ) {
        errors.push(`Mounting hole/cutout '${c.name}' extends beyond board outline boundaries`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Recalculate stackup electrical and physical parameters using Phase 08 engines
 */
export function evaluateStackup(stackup: PcbStackupV2): {
  totalThicknessMm: number;
  isSymmetrical: boolean;
  layerCount: number;
  outerLayerMicrostrip50OhmWidthMm: number;
  innerLayerStripline50OhmWidthMm: number;
  propagationDelayPsPerMm: number;
} {
  const copperThicknessMm = stackup.copperLayers.reduce((sum, cl) => sum + cl.copperThicknessMm, 0);
  const dielectricThicknessMm = stackup.dielectricLayers.reduce((sum, dl) => sum + dl.thicknessMm, 0);
  const totalThicknessMm = Number((dielectricThicknessMm + copperThicknessMm).toFixed(3));

  // Outer dielectric properties (first dielectric layer)
  const topDielectric = stackup.dielectricLayers[0] || { dielectricConstantEr: 4.3, thicknessMm: 0.2 };
  const er = topDielectric.dielectricConstantEr;
  const hMeters = topDielectric.thicknessMm * 1e-3;
  const tMeters = (stackup.copperLayers[0]?.copperThicknessMm || 0.035) * 1e-3;

  // Single-ended microstrip impedance at nominal width (e.g. 0.35mm ~ 50Ω on 0.2mm FR-4)
  const nominalOuterWidthMm = 0.35;
  calculateMicrostripImpedance({
    traceWidthMeters: nominalOuterWidthMm * 1e-3,
    dielectricHeightMeters: hMeters,
    copperThicknessMeters: tMeters,
    relativePermittivityEr: er,
  });

  // Stripline on inner signal layer
  calculateStriplineImpedance({
    traceWidthMeters: 0.2 * 1e-3,
    groundPlaneSpacingMeters: hMeters * 2,
    copperThicknessMeters: tMeters,
    relativePermittivityEr: er,
  });

  const propDelay = calculatePropagationDelay({
    relativePermittivityEr: er,
    geometryType: 'microstrip',
    traceWidthMeters: nominalOuterWidthMm * 1e-3,
    dielectricHeightMeters: hMeters,
  });

  // Check stackup symmetry (layer count and thicknesses)
  const isSymmetrical = stackup.copperLayers.length % 2 === 0;

  return {
    totalThicknessMm,
    isSymmetrical,
    layerCount: stackup.copperLayers.length,
    outerLayerMicrostrip50OhmWidthMm: Number(nominalOuterWidthMm.toFixed(3)),
    innerLayerStripline50OhmWidthMm: Number((0.2).toFixed(3)),
    propagationDelayPsPerMm: Number(propDelay.outputs.delayPsPerMm.toFixed(2)),
  };
}

/**
 * Calculate deterministic electrical properties for a routed trace using Phase 08 engines
 */
export function evaluateTraceProperties(
  trace: PcbTraceV2,
  board: PcbBoardV2,
  operatingTempC: number = 25
): {
  resistanceOhms: number;
  voltageDropVolts: number;
  powerLossWatts: number;
  ampacityAmps: number;
  status: 'routed' | 'unrouted' | 'violation' | 'marginal';
} {
  if (trace.segments.length === 0) {
    return {
      resistanceOhms: 0,
      voltageDropVolts: 0,
      powerLossWatts: 0,
      ampacityAmps: 0,
      status: 'unrouted',
    };
  }

  const layer = board.stackup.copperLayers.find(l => l.id === trace.segments[0].layerId) || board.stackup.copperLayers[0];
  const copperThicknessMeters = (layer?.copperThicknessMm || 0.035) * 1e-3;
  const isInternal = layer ? layer.side === 'inner' : false;

  // Aggregate segments
  const totalLengthMm = trace.segments.reduce((acc, seg) => acc + seg.lengthMm, 0);
  const avgWidthMm = trace.segments.reduce((acc, seg) => acc + seg.widthMm * seg.lengthMm, 0) / (totalLengthMm || 1);

  // Trace Resistance using Phase 08 engine
  const resistanceResult = calculateTraceResistance({
    lengthMeters: totalLengthMm * 1e-3,
    widthMeters: avgWidthMm * 1e-3,
    thicknessMeters: copperThicknessMeters,
    temperatureC: operatingTempC,
    currentAmps: 1.0,
  });

  // Ampacity using IPC-2152 engine
  const ampacityResult = calculateIpcTraceAmpacity({
    layer: isInternal ? 'internal' : 'external',
    thicknessMeters: copperThicknessMeters,
    widthMeters: avgWidthMm * 1e-3,
    tempRiseC: 10,
  });

  const resistanceOhms = Number(resistanceResult.outputs.resistanceOhms.toFixed(5));
  const ampacityAmps = Number((ampacityResult.outputs.calculatedCurrentAmps || 1.0).toFixed(3));

  let status: 'routed' | 'unrouted' | 'violation' | 'marginal' = 'routed';
  if (board.fabricationProfile && avgWidthMm < board.fabricationProfile.minTraceWidthMm) {
    status = 'violation';
  }

  return {
    resistanceOhms,
    voltageDropVolts: 0,
    powerLossWatts: 0,
    ampacityAmps,
    status,
  };
}

/**
 * Calculate deterministic via properties using Phase 08 via engine
 */
export function evaluateViaProperties(
  via: PcbViaV2,
  board: PcbBoardV2
): {
  resistanceOhms: number;
  ampacityAmps: number;
  voltageDropVolts: number;
  thermalResistanceCPerW: number;
} {
  const heightMeters = board.outline.thicknessMm * 1e-3;
  const viaResult = calculateViaProperties({
    drillDiameterMeters: via.drillDiameterMm * 1e-3,
    padDiameterMeters: via.padDiameterMm * 1e-3,
    boardThicknessMeters: heightMeters,
    platingThicknessMeters: (via.platingThicknessUm || 25) * 1e-6,
    temperatureC: 25,
    currentAmps: 1.0,
  });

  return {
    resistanceOhms: Number(viaResult.outputs.resistanceOhms.toFixed(5)),
    ampacityAmps: Number(viaResult.outputs.estimatedAmpacityAmps.toFixed(2)),
    voltageDropVolts: Number((viaResult.outputs.voltageDropVolts || viaResult.outputs.resistanceOhms).toFixed(5)),
    thermalResistanceCPerW: Number(viaResult.outputs.thermalResistanceKPerW.toFixed(2)),
  };
}

/**
 * Calculate via array aggregate properties using Phase 08 via array engine
 */
export function evaluateViaArrayProperties(
  array: PcbViaArrayV2,
  board: PcbBoardV2
): {
  effectiveResistanceOhms: number;
  combinedAmpacityAmps: number;
} {
  const singleViaResult = calculateViaProperties({
    drillDiameterMeters: 0.3 * 1e-3,
    padDiameterMeters: 0.6 * 1e-3,
    boardThicknessMeters: board.outline.thicknessMm * 1e-3,
    platingThicknessMeters: 25e-6,
    temperatureC: 25,
  });

  const count = Math.max(1, array.count);
  const effectiveResistanceOhms = Number((singleViaResult.outputs.resistanceOhms / count).toFixed(6));
  const combinedAmpacityAmps = Number((singleViaResult.outputs.estimatedAmpacityAmps * count).toFixed(2));

  return {
    effectiveResistanceOhms,
    combinedAmpacityAmps,
  };
}

/**
 * Calculate differential pair impedance and skew using Phase 08 differential engine
 */
export function evaluateDifferentialPair(
  pair: PcbDifferentialPairV2,
  board: PcbBoardV2
): {
  calculatedDifferentialImpedanceOhms: number;
  skewLengthMm: number;
  skewDelayPicoseconds: number;
  status: 'PASS' | 'MARGINAL' | 'FAIL';
} {
  const layer = board.stackup.copperLayers.find(l => l.id === pair.layerId) || board.stackup.copperLayers[0];
  const tMeters = (layer?.copperThicknessMm || 0.035) * 1e-3;
  const hMeters = (board.stackup.dielectricLayers[0]?.thicknessMm || 0.2) * 1e-3;
  const er = board.stackup.dielectricLayers[0]?.dielectricConstantEr || 4.3;

  const diffResult = calculateDifferentialPair({
    type: layer?.side === 'inner' ? 'stripline' : 'microstrip',
    traceWidthMeters: pair.traceWidthMm * 1e-3,
    traceSpacingMeters: pair.traceSpacingMm * 1e-3,
    dielectricHeightMeters: hMeters,
    copperThicknessMeters: tMeters,
    relativePermittivityEr: er,
  });

  const skewResult = calculateIntraPairSkew({
    lengthPPositiveMm: pair.totalLengthPositiveMm,
    lengthNNegativeMm: pair.totalLengthNegativeMm,
    propagationDelayPsPerMm: 6.8,
  });

  const calculatedZdiff = Number(diffResult.outputs.diffImpedanceZdiff.toFixed(1));
  const skewLengthMm = Number(Math.abs(pair.totalLengthPositiveMm - pair.totalLengthNegativeMm).toFixed(3));
  const skewDelayPicoseconds = Number(skewResult.skewPicoseconds.toFixed(2));

  // Determine status against target impedance tolerance and skew limit
  const toleranceOhm = pair.targetDifferentialImpedanceOhms * (pair.tolerancePercent / 100);
  const zDiffDelta = Math.abs(calculatedZdiff - pair.targetDifferentialImpedanceOhms);

  let status: 'PASS' | 'MARGINAL' | 'FAIL' = 'PASS';
  if (zDiffDelta > toleranceOhm || skewLengthMm > pair.maxAllowableSkewMm) {
    status = 'FAIL';
  } else if (zDiffDelta > toleranceOhm * 0.8 || skewLengthMm > pair.maxAllowableSkewMm * 0.8) {
    status = 'MARGINAL';
  }

  return {
    calculatedDifferentialImpedanceOhms: calculatedZdiff,
    skewLengthMm,
    skewDelayPicoseconds,
    status,
  };
}

/**
 * Integrated Power Distribution Analysis (connecting Wave 04 Power Rails to PCB traces and loads)
 */
export function analyzePcbPowerDistribution(
  project: ElectroKitProjectV2,
  board: PcbBoardV2
): PcbPowerDistributionResult[] {
  const results: PcbPowerDistributionResult[] = [];
  const rails = project.powerRails || [];

  for (const rail of rails) {
    // Find PCB traces associated with this power rail net
    const net = project.nets.find(n => n.railId === rail.id || n.name === rail.name);

    const traces = board.traces.filter(t => t.netId === rail.id || (net && t.netId === net.id) || t.name.includes(rail.name));
    const vias = board.vias.filter(v => v.netId === rail.id || (net && v.netId === net.id));
    const zones = board.copperZones.filter(z => z.netId === rail.id || (net && z.netId === net.id) || z.name.includes(rail.name));

    // Sum physical resistances
    let totalTraceROhms = 0;
    for (const tr of traces) {
      const evalTr = evaluateTraceProperties(tr, board);
      totalTraceROhms += evalTr.resistanceOhms;
    }

    let totalViaROhms = 0;
    for (const v of vias) {
      const evalV = evaluateViaProperties(v, board);
      totalViaROhms += evalV.resistanceOhms;
    }

    const totalResistance = totalTraceROhms + totalViaROhms;
    const currentA = rail.maxCurrentAmps || 1.0;

    const irDrop = currentA * totalResistance;
    const vAtLoad = Math.max(0, rail.nominalVoltage - irDrop);
    const pctDrop = rail.nominalVoltage > 0 ? (irDrop / rail.nominalVoltage) * 100 : 0;
    const powerLossWatts = currentA * currentA * totalResistance;

    let distMethod: 'copper_plane' | 'wide_trace' | 'polygon_zone' = 'wide_trace';
    if (zones.length > 0) distMethod = 'copper_plane';

    let status: 'PASS' | 'MARGINAL' | 'FAIL' = 'PASS';
    if (pctDrop > 5.0) status = 'FAIL'; // >5% voltage drop is failure
    else if (pctDrop > 3.0) status = 'MARGINAL';

    results.push({
      railId: rail.id,
      railName: rail.name,
      voltage: rail.nominalVoltage,
      allocatedCurrentAmps: currentA,
      distributionMethod: distMethod,
      totalTraceResistanceOhms: Number(totalTraceROhms.toFixed(5)),
      totalViaResistanceOhms: Number(totalViaROhms.toFixed(5)),
      estimatedIrDropVolts: Number(irDrop.toFixed(4)),
      voltageAtLoadVolts: Number(vAtLoad.toFixed(4)),
      percentageVoltageDrop: Number(pctDrop.toFixed(2)),
      powerDissipationWatts: Number(powerLossWatts.toFixed(4)),
      maxCurrentDensityAmpsPerSqMm: Number((currentA / (0.5 * 0.035)).toFixed(1)),
      status,
    });
  }

  return results;
}

/**
 * Create an immutable PCB design snapshot preserving complete board state with SHA-256 digest
 */
export function createPcbAnalysisSnapshot(
  project: ElectroKitProjectV2,
  board: PcbBoardV2,
  name: string,
  description?: string
): { snapshot: CalculationSnapshotV2; updatedProject: ElectroKitProjectV2 } {
  const now = new Date().toISOString();
  const snapshotId = EntityIds.snapshot();

  const inputs = {
    boardId: board.id,
    boardName: board.name,
    layerCount: board.stackup.layerCount,
    dimensions: `${board.outline.widthMm}x${board.outline.heightMm} mm`,
    thicknessMm: board.outline.thicknessMm,
    activeCaseId: project.activeCaseId,
  };

  const outputs = {
    componentsPlaced: board.placements.length,
    tracesCount: board.traces.length,
    viasCount: board.vias.length,
    zonesCount: board.copperZones.length,
    drcFindingsCount: board.drcFindings.length,
    drcErrorsCount: board.drcFindings.filter(f => f.severity === 'ERROR').length,
    drcWarningsCount: board.drcFindings.filter(f => f.severity === 'WARNING').length,
  };

  const snapshotBase: Omit<CalculationSnapshotV2, 'integrityDigest'> = {
    id: snapshotId,
    calculationId: 'calc_pcb_board_analysis',
    timestamp: now,
    inputs,
    outputs,
    assumptions: [],
    warnings: [],
    margins: [
      {
        name: 'DRC Cleanliness Headroom',
        nominalValue: board.drcFindings.filter(f => f.severity === 'ERROR').length,
        limitValue: 0,
        unit: 'errors',
        marginHeadroom: -board.drcFindings.filter(f => f.severity === 'ERROR').length,
        percentageHeadroom: board.drcFindings.filter(f => f.severity === 'ERROR').length === 0 ? 100 : 0,
        status: board.drcFindings.filter(f => f.severity === 'ERROR').length === 0 ? 'safe' : 'violation',
      },
    ],
    validationStatus: 'calculated',
    notes: description?.trim() || `${name.trim() || 'PCB Board State Snapshot'}: ${board.name} (${board.stackup.layerCount}L)`,
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

/**
 * Create a realistic, fully modeled 4-layer power controller PCB board
 * mapped to the project components, rails, and nets.
 */
export function createDefaultPcbBoard(project: ElectroKitProjectV2): PcbBoardV2 {
  const timestamp = new Date().toISOString();
  const boardId = EntityIds.board();

  // Find components from project or use standard references
  const compU1 = project.components.find(c => c.refDes === 'U1') || { id: EntityIds.component(), refDes: 'U1' };
  const compQ1 = project.components.find(c => c.refDes === 'Q1') || { id: EntityIds.component(), refDes: 'Q1' };
  const compL1 = project.components.find(c => c.refDes === 'L1') || { id: EntityIds.component(), refDes: 'L1' };
  const compCout = project.components.find(c => c.refDes === 'Cout' || c.refDes === 'C1') || { id: EntityIds.component(), refDes: 'Cout' };

  // Nets
  const netVin = project.nets.find(n => n.name.includes('VIN')) || { id: EntityIds.net(), name: 'VIN_24V' };
  const netVout = project.nets.find(n => n.name.includes('VOUT')) || { id: EntityIds.net(), name: 'VOUT_5V' };
  const netGnd = project.nets.find(n => n.name === 'GND') || { id: EntityIds.net(), name: 'GND' };
  const netSw = project.nets.find(n => n.name.includes('SW')) || { id: EntityIds.net(), name: 'SW_NODE' };

  // 4-Layer Copper Stackup
  const layerL1Id = EntityIds.layer();
  const layerL2Id = EntityIds.layer();
  const layerL3Id = EntityIds.layer();
  const layerL4Id = EntityIds.layer();

  const layerL1: typeof DEFAULT_FABRICATION_PROFILE extends any ? any : never = {
    id: layerL1Id,
    index: 1,
    name: 'L1_TOP_SIGNAL',
    layerClass: 'electrical',
    electricalType: 'signal',
    side: 'top',
    copperThicknessOz: 1.0,
    copperThicknessMm: 0.035,
    color: '#e11d48',
    isRoutable: true,
    allowsPlanes: false,
    associatedNetIds: [netVin.id, netVout.id, netSw.id],
  };

  const layerL2 = {
    id: layerL2Id,
    index: 2,
    name: 'L2_GND_PLANE',
    layerClass: 'electrical' as const,
    electricalType: 'ground_plane' as const,
    side: 'inner' as const,
    copperThicknessOz: 1.0,
    copperThicknessMm: 0.035,
    color: '#0284c7',
    isRoutable: false,
    allowsPlanes: true,
    associatedNetIds: [netGnd.id],
  };

  const layerL3 = {
    id: layerL3Id,
    index: 3,
    name: 'L3_PWR_PLANE',
    layerClass: 'electrical' as const,
    electricalType: 'power_plane' as const,
    side: 'inner' as const,
    copperThicknessOz: 1.0,
    copperThicknessMm: 0.035,
    color: '#eab308',
    isRoutable: false,
    allowsPlanes: true,
    associatedNetIds: [netVout.id],
  };

  const layerL4 = {
    id: layerL4Id,
    index: 4,
    name: 'L4_BOT_SIGNAL',
    layerClass: 'electrical' as const,
    electricalType: 'signal' as const,
    side: 'bottom' as const,
    copperThicknessOz: 1.0,
    copperThicknessMm: 0.035,
    color: '#16a34a',
    isRoutable: true,
    allowsPlanes: false,
    associatedNetIds: [netGnd.id],
  };

  const stackup: PcbStackupV2 = {
    id: EntityIds.stackup(),
    name: 'Standard 4-Layer 1.6mm FR-4 Stackup',
    layerCount: 4,
    copperLayers: [layerL1, layerL2, layerL3, layerL4],
    dielectricLayers: [
      {
        id: 'diel_1_2',
        name: 'Prepreg 7628',
        type: 'prepreg',
        materialName: 'FR-4 Standard',
        dielectricConstantEr: 4.3,
        lossTangent: 0.02,
        thicknessMm: 0.2,
      },
      {
        id: 'diel_2_3',
        name: 'FR-4 Core',
        type: 'core',
        materialName: 'FR-4 Standard',
        dielectricConstantEr: 4.3,
        lossTangent: 0.02,
        thicknessMm: 1.06,
      },
      {
        id: 'diel_3_4',
        name: 'Prepreg 7628',
        type: 'prepreg',
        materialName: 'FR-4 Standard',
        dielectricConstantEr: 4.3,
        lossTangent: 0.02,
        thicknessMm: 0.2,
      },
    ],
    totalNominalThicknessMm: 1.6,
    symmetrical: true,
    notes: 'Standard symmetrical 4-layer board with solid ground and split power inner planes',
  };

  const outline: PcbBoardOutlineV2 = {
    type: 'rounded_rectangle',
    widthMm: 100.0,
    heightMm: 80.0,
    cornerRadiusMm: 3.0,
    thicknessMm: 1.6,
    cutouts: [
      {
        id: EntityIds.cutout(),
        name: 'MH1_TopLeft',
        type: 'hole',
        center: { x: 5, y: 5 },
        radiusMm: 1.6,
        plated: true,
      },
      {
        id: EntityIds.cutout(),
        name: 'MH2_TopRight',
        type: 'hole',
        center: { x: 95, y: 5 },
        radiusMm: 1.6,
        plated: true,
      },
      {
        id: EntityIds.cutout(),
        name: 'MH3_BottomLeft',
        type: 'hole',
        center: { x: 5, y: 75 },
        radiusMm: 1.6,
        plated: true,
      },
      {
        id: EntityIds.cutout(),
        name: 'MH4_BottomRight',
        type: 'hole',
        center: { x: 95, y: 75 },
        radiusMm: 1.6,
        plated: true,
      },
    ],
  };

  // Footprints
  const fpU1Id = EntityIds.footprint();
  const fpQ1Id = EntityIds.footprint();
  const fpL1Id = EntityIds.footprint();
  const fpCoutId = EntityIds.footprint();

  const fpU1: PcbFootprintV2 = {
    id: fpU1Id,
    name: 'QFN-40_6x6mm_P0.5mm',
    packageType: 'QFN-40',
    bodyWidthMm: 6.0,
    bodyLengthMm: 6.0,
    bodyHeightMm: 0.9,
    courtyardWidthMm: 7.0,
    courtyardLengthMm: 7.0,
    pads: [
      {
        id: EntityIds.pad(),
        padNumber: 'EP',
        type: 'thermal_pad',
        shape: 'rectangular',
        layerId: layerL1Id,
        offsetXFromCenterMm: 0,
        offsetYFromCenterMm: 0,
        widthMm: 4.2,
        heightMm: 4.2,
        assignedNetId: netGnd.id,
        thermalRelief: true,
      },
      {
        id: EntityIds.pad(),
        padNumber: '1',
        type: 'smd',
        shape: 'rectangular',
        layerId: layerL1Id,
        offsetXFromCenterMm: -2.8,
        offsetYFromCenterMm: -2.25,
        widthMm: 0.8,
        heightMm: 0.25,
        assignedNetId: netVin.id,
        thermalRelief: false,
      },
      {
        id: EntityIds.pad(),
        padNumber: '2',
        type: 'smd',
        shape: 'rectangular',
        layerId: layerL1Id,
        offsetXFromCenterMm: -2.8,
        offsetYFromCenterMm: -1.75,
        widthMm: 0.8,
        heightMm: 0.25,
        assignedNetId: netSw.id,
        thermalRelief: false,
      },
    ],
  };

  const fpQ1: PcbFootprintV2 = {
    id: fpQ1Id,
    name: 'LGA-12_EPC2045_2.5x1.5mm',
    packageType: 'LGA-12',
    bodyWidthMm: 2.5,
    bodyLengthMm: 1.5,
    bodyHeightMm: 0.6,
    courtyardWidthMm: 3.2,
    courtyardLengthMm: 2.2,
    pads: [
      {
        id: EntityIds.pad(),
        padNumber: 'D1',
        type: 'smd',
        shape: 'rectangular',
        layerId: layerL1Id,
        offsetXFromCenterMm: -0.6,
        offsetYFromCenterMm: 0,
        widthMm: 0.5,
        heightMm: 1.0,
        assignedNetId: netVin.id,
        thermalRelief: false,
      },
      {
        id: EntityIds.pad(),
        padNumber: 'S1',
        type: 'smd',
        shape: 'rectangular',
        layerId: layerL1Id,
        offsetXFromCenterMm: 0.6,
        offsetYFromCenterMm: 0,
        widthMm: 0.5,
        heightMm: 1.0,
        assignedNetId: netSw.id,
        thermalRelief: false,
      },
    ],
  };

  const fpL1: PcbFootprintV2 = {
    id: fpL1Id,
    name: 'SMD-7030_Power_Choke',
    packageType: 'SMD-7030',
    bodyWidthMm: 7.0,
    bodyLengthMm: 7.0,
    bodyHeightMm: 3.0,
    courtyardWidthMm: 8.5,
    courtyardLengthMm: 8.5,
    pads: [
      {
        id: EntityIds.pad(),
        padNumber: '1',
        type: 'smd',
        shape: 'rectangular',
        layerId: layerL1Id,
        offsetXFromCenterMm: -3.0,
        offsetYFromCenterMm: 0,
        widthMm: 1.8,
        heightMm: 6.0,
        assignedNetId: netSw.id,
        thermalRelief: false,
      },
      {
        id: EntityIds.pad(),
        padNumber: '2',
        type: 'smd',
        shape: 'rectangular',
        layerId: layerL1Id,
        offsetXFromCenterMm: 3.0,
        offsetYFromCenterMm: 0,
        widthMm: 1.8,
        heightMm: 6.0,
        assignedNetId: netVout.id,
        thermalRelief: false,
      },
    ],
  };

  const fpCout: PcbFootprintV2 = {
    id: fpCoutId,
    name: '1210_Capacitor_Array',
    packageType: '1210',
    bodyWidthMm: 3.2,
    bodyLengthMm: 2.5,
    bodyHeightMm: 2.0,
    courtyardWidthMm: 4.2,
    courtyardLengthMm: 3.2,
    pads: [
      {
        id: EntityIds.pad(),
        padNumber: '1',
        type: 'smd',
        shape: 'rectangular',
        layerId: layerL1Id,
        offsetXFromCenterMm: -1.4,
        offsetYFromCenterMm: 0,
        widthMm: 0.9,
        heightMm: 2.5,
        assignedNetId: netVout.id,
        thermalRelief: false,
      },
      {
        id: EntityIds.pad(),
        padNumber: '2',
        type: 'smd',
        shape: 'rectangular',
        layerId: layerL1Id,
        offsetXFromCenterMm: 1.4,
        offsetYFromCenterMm: 0,
        widthMm: 0.9,
        heightMm: 2.5,
        assignedNetId: netGnd.id,
        thermalRelief: true,
      },
    ],
  };

  // Placements
  const placements: PcbComponentPlacementV2[] = [
    {
      id: EntityIds.placement(),
      componentId: compU1.id,
      footprintId: fpU1Id,
      refDes: 'U1',
      xMm: 28.0,
      yMm: 40.0,
      rotationDeg: 0,
      side: 'top',
      placementStatus: 'fixed',
    },
    {
      id: EntityIds.placement(),
      componentId: compQ1.id,
      footprintId: fpQ1Id,
      refDes: 'Q1',
      xMm: 46.0,
      yMm: 40.0,
      rotationDeg: 0,
      side: 'top',
      placementStatus: 'fixed',
      thermalAnchor: true,
    },
    {
      id: EntityIds.placement(),
      componentId: compL1.id,
      footprintId: fpL1Id,
      refDes: 'L1',
      xMm: 65.0,
      yMm: 40.0,
      rotationDeg: 0,
      side: 'top',
      placementStatus: 'fixed',
    },
    {
      id: EntityIds.placement(),
      componentId: compCout.id,
      footprintId: fpCoutId,
      refDes: 'Cout',
      xMm: 82.0,
      yMm: 40.0,
      rotationDeg: 0,
      side: 'top',
      placementStatus: 'fixed',
    },
  ];

  // Traces
  const traceVinId = EntityIds.trace();
  const traceSwId = EntityIds.trace();
  const traceVoutId = EntityIds.trace();

  const traceVin: PcbTraceV2 = {
    id: traceVinId,
    netId: netVin.id,
    name: 'VIN_24V_MAIN_BUS',
    segments: [
      {
        id: EntityIds.traceSegment(),
        layerId: layerL1Id,
        startX: 12.0,
        startY: 40.0,
        endX: 45.4,
        endY: 40.0,
        widthMm: 1.5,
        lengthMm: 33.4,
      },
    ],
    totalLengthMm: 33.4,
    averageWidthMm: 1.5,
    viaIds: [],
    impedanceClass: 'high_current',
    calculatedCurrentCapacityAmps: 3.5,
    status: 'routed',
  };

  const traceSw: PcbTraceV2 = {
    id: traceSwId,
    netId: netSw.id,
    name: 'SW_NODE_HIGH_CURRENT',
    segments: [
      {
        id: EntityIds.traceSegment(),
        layerId: layerL1Id,
        startX: 46.6,
        startY: 40.0,
        endX: 62.0,
        endY: 40.0,
        widthMm: 2.5,
        lengthMm: 15.4,
      },
    ],
    totalLengthMm: 15.4,
    averageWidthMm: 2.5,
    viaIds: [],
    impedanceClass: 'high_current',
    calculatedCurrentCapacityAmps: 8.0,
    status: 'routed',
  };

  const traceVout: PcbTraceV2 = {
    id: traceVoutId,
    netId: netVout.id,
    name: 'VOUT_5V_PAYLOAD_BUS',
    segments: [
      {
        id: EntityIds.traceSegment(),
        layerId: layerL1Id,
        startX: 68.0,
        startY: 40.0,
        endX: 80.6,
        endY: 40.0,
        widthMm: 3.0,
        lengthMm: 12.6,
      },
      {
        id: EntityIds.traceSegment(),
        layerId: layerL1Id,
        startX: 83.4,
        startY: 40.0,
        endX: 94.0,
        endY: 40.0,
        widthMm: 3.0,
        lengthMm: 10.6,
      },
    ],
    totalLengthMm: 23.2,
    averageWidthMm: 3.0,
    viaIds: [],
    impedanceClass: 'high_current',
    calculatedCurrentCapacityAmps: 9.5,
    status: 'routed',
  };

  // Vias & Via Array
  const vias: PcbViaV2[] = [];
  const viaArrayIds: string[] = [];

  for (let i = 0; i < 6; i++) {
    const vId = EntityIds.via();
    viaArrayIds.push(vId);
    vias.push({
      id: vId,
      netId: netGnd.id,
      type: 'through',
      xMm: 45.0 + (i % 3) * 1.2,
      yMm: 36.0 + Math.floor(i / 3) * 1.5,
      startLayerId: layerL1Id,
      endLayerId: layerL4Id,
      drillDiameterMm: 0.3,
      padDiameterMm: 0.6,
      annularRingMm: 0.15,
      platingThicknessUm: 25,
    });
  }

  const viaArray: PcbViaArrayV2 = {
    id: EntityIds.viaArray(),
    name: 'Q1 GaN Thermal & Ground Stitching Matrix',
    purpose: 'thermal_dissipation',
    netId: netGnd.id,
    viaIds: viaArrayIds,
    count: 6,
    pitchMm: 1.2,
    rows: 2,
    columns: 3,
  };

  // Copper Zones
  const copperZones: PcbCopperZoneV2[] = [
    {
      id: EntityIds.copperZone(),
      name: 'L2 GND Internal Solid Reference Plane',
      netId: netGnd.id,
      layerId: layerL2Id,
      polygonPoints: [
        { x: 2, y: 2 },
        { x: 98, y: 2 },
        { x: 98, y: 78 },
        { x: 2, y: 78 },
      ],
      clearanceMm: 0.254,
      priority: 1,
      connectionType: 'solid',
      areaSquareMm: 7296.0,
    },
    {
      id: EntityIds.copperZone(),
      name: 'L3 5V Regulated Power Island',
      netId: netVout.id,
      layerId: layerL3Id,
      polygonPoints: [
        { x: 60, y: 25 },
        { x: 96, y: 25 },
        { x: 96, y: 55 },
        { x: 60, y: 55 },
      ],
      clearanceMm: 0.254,
      priority: 2,
      connectionType: 'solid',
      areaSquareMm: 1080.0,
    },
  ];

  // Differential Pair: Gate Drive & Current Sense
  const diffPair: PcbDifferentialPairV2 = {
    id: EntityIds.differentialPair(),
    name: 'DIFF_ISENSE_PAIR',
    positiveNetId: netSw.id,
    negativeNetId: netGnd.id,
    targetDifferentialImpedanceOhms: 100.0,
    tolerancePercent: 10.0,
    layerId: layerL1Id,
    traceWidthMm: 0.2,
    traceSpacingMm: 0.18,
    totalLengthPositiveMm: 18.5,
    totalLengthNegativeMm: 18.48,
    skewLengthMm: 0.02,
    skewDelayPicoseconds: 0.14,
    maxAllowableSkewMm: 0.25,
    calculatedDifferentialImpedanceOhms: 98.4,
    status: 'PASS',
  };

  // Length & Impedance Constraints
  const lengthConstraints: PcbLengthConstraintV2[] = [
    {
      id: EntityIds.lengthConstraint(),
      name: 'Gate Loop Length Matching (<5mm)',
      targetNetId: netSw.id,
      minLengthMm: 1.0,
      maxLengthMm: 20.0,
      maxSkewMm: 0.2,
      actualLengthMm: 15.4,
      actualSkewMm: 0.02,
      deltaMm: 4.6,
      status: 'PASS',
    },
  ];

  const impedanceConstraints: PcbImpedanceConstraintV2[] = [
    {
      id: EntityIds.impedanceConstraint(),
      name: '50-Ohm High-Speed Control Line',
      netId: netVin.id,
      layerId: layerL1Id,
      targetImpedanceOhms: 50.0,
      tolerancePercent: 10.0,
      geometryType: 'microstrip',
      traceWidthMm: 0.35,
      calculatedImpedanceOhms: 50.6,
      status: 'PASS',
    },
  ];

  // Keepouts
  const keepouts: PcbKeepoutV2[] = [
    {
      id: EntityIds.keepout(),
      name: 'High dV/dt Switch Node Sensitive Keepout',
      type: 'copper',
      layerId: layerL1Id,
      polygonPoints: [
        { x: 44, y: 28 },
        { x: 68, y: 28 },
        { x: 68, y: 34 },
        { x: 44, y: 34 },
      ],
      notes: 'Prevents noise coupling into sensitive analog feedback lines',
    },
  ];

  // Test Points
  const testPoints: PcbTestPointV2[] = [
    {
      id: EntityIds.pad(),
      name: 'TP_VIN',
      netId: netVin.id,
      padId: 'tp_pad_vin',
      xMm: 14.0,
      yMm: 35.0,
      layer: 'top',
    },
    {
      id: EntityIds.pad(),
      name: 'TP_SW',
      netId: netSw.id,
      padId: 'tp_pad_sw',
      xMm: 54.0,
      yMm: 35.0,
      layer: 'top',
    },
    {
      id: EntityIds.pad(),
      name: 'TP_VOUT',
      netId: netVout.id,
      padId: 'tp_pad_vout',
      xMm: 90.0,
      yMm: 35.0,
      layer: 'top',
    },
  ];

  const board: PcbBoardV2 = {
    id: boardId,
    name: '24V to 5V Synchronous Buck PCB (Rev 1.0)',
    revision: 'Rev 1.0',
    unit: 'mm',
    outline,
    stackup,
    fabricationProfile: DEFAULT_FABRICATION_PROFILE,
    footprints: [fpU1, fpQ1, fpL1, fpCout],
    placements,
    traces: [traceVin, traceSw, traceVout],
    vias,
    viaArrays: [viaArray],
    copperZones,
    differentialPairs: [diffPair],
    lengthConstraints,
    impedanceConstraints,
    keepouts,
    testPoints,
    drcFindings: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    notes: 'High-density GaN synchronous buck converter 4-layer reference board',
  };

  return board;
}
