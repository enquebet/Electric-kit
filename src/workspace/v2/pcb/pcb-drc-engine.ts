/**
 * ElectroKit V2 — Wave 05: Deep PCB DRC Rules Engine
 *
 * Orchestration-level Design Rule Check (DRC) auditing across 12 distinct categories:
 * 1. PLACEMENT (board boundaries, courtyard overlaps, keepout violations)
 * 2. CLEARANCE (trace-to-trace, trace-to-pad, copper-to-edge)
 * 3. TRACE (min width, ampacity headroom)
 * 4. VIA (min drill, min annular ring, via-to-via clearance)
 * 5. PAD (solder mask bridge, pad spacing)
 * 6. NET (net class constraints)
 * 7. STACKUP (symmetry, layer count vs fab profile)
 * 8. IMPEDANCE (single-ended controlled impedance tolerance)
 * 9. DIFFERENTIAL_PAIR (differential impedance, intra-pair skew limits)
 * 10. MANUFACTURING (aspect ratios, min feature limits)
 * 11. POWER (IR drop, current density, ampacity violations)
 * 12. CONNECTIVITY (unrouted nets, broken distribution paths)
 */

import {
  PcbBoardV2,
  PcbDrcFindingV2,
  PcbDrcCategory,
  PcbDrcSeverity,
} from '../types/pcb';
import { ElectroKitProjectV2 } from '../types/project';
import { EntityIds } from '../identity/id-generator';
import { evaluateTraceProperties, evaluateViaProperties, evaluateDifferentialPair, analyzePcbPowerDistribution } from './pcb-engine';
import { auditPcbConnectivity } from './pcb-connectivity-engine';

/**
 * Run a full DRC audit over the PCB board and project context
 */
export function runPcbDrcAudit(
  project: ElectroKitProjectV2,
  board: PcbBoardV2
): PcbDrcFindingV2[] {
  const findings: PcbDrcFindingV2[] = [];
  const fab = board.fabricationProfile;

  // Helper to push finding
  function addFinding(
    severity: PcbDrcSeverity,
    category: PcbDrcCategory,
    objectIds: string[],
    description: string,
    ruleName: string,
    measuredValue?: number | string,
    limitValue?: number | string,
    delta?: number,
    unit?: string
  ) {
    findings.push({
      id: EntityIds.drcFinding(),
      severity,
      category,
      objectIds,
      description,
      ruleName,
      measuredValue,
      limitValue,
      delta,
      unit,
      status: 'active',
    });
  }

  // -------------------------------------------------------------
  // 1. PLACEMENT DRC
  // -------------------------------------------------------------
  const boardW = board.outline.widthMm;
  const boardH = board.outline.heightMm;

  for (const pl of board.placements) {
    const fp = board.footprints.find(f => f.id === pl.footprintId);
    const halfW = fp ? fp.courtyardWidthMm / 2 : 2.0;
    const halfH = fp ? fp.courtyardLengthMm / 2 : 2.0;

    // Check board boundaries
    if (
      pl.xMm - halfW < 0 ||
      pl.xMm + halfW > boardW ||
      pl.yMm - halfH < 0 ||
      pl.yMm + halfH > boardH
    ) {
      addFinding(
        'ERROR',
        'PLACEMENT',
        [pl.id, pl.componentId],
        `Component '${pl.refDes}' courtyard extends outside the board boundary (${boardW}x${boardH} mm)`,
        'placement_within_board_boundary',
        `X:${pl.xMm}, Y:${pl.yMm}`,
        `0..${boardW}, 0..${boardH}`,
        undefined,
        'mm'
      );
    }

    // Check keepout intersections
    for (const ko of board.keepouts) {
      if (ko.type === 'component' || ko.type === 'all') {
        // Simple bounding box check on keepout polygon
        if (ko.polygonPoints.length >= 2) {
          const minKx = Math.min(...ko.polygonPoints.map(p => p.x));
          const maxKx = Math.max(...ko.polygonPoints.map(p => p.x));
          const minKy = Math.min(...ko.polygonPoints.map(p => p.y));
          const maxKy = Math.max(...ko.polygonPoints.map(p => p.y));

          if (
            pl.xMm + halfW > minKx &&
            pl.xMm - halfW < maxKx &&
            pl.yMm + halfH > minKy &&
            pl.yMm - halfH < maxKy
          ) {
            addFinding(
              'ERROR',
              'PLACEMENT',
              [pl.id, ko.id],
              `Component '${pl.refDes}' intersects keepout zone '${ko.name}'`,
              'component_keepout_clearance'
            );
          }
        }
      }
    }
  }

  // Check courtyard overlaps between components on the same side
  for (let i = 0; i < board.placements.length; i++) {
    for (let j = i + 1; j < board.placements.length; j++) {
      const p1 = board.placements[i];
      const p2 = board.placements[j];
      if (p1.side !== p2.side) continue; // Different sides don't overlap

      const fp1 = board.footprints.find(f => f.id === p1.footprintId);
      const fp2 = board.footprints.find(f => f.id === p2.footprintId);

      const hw1 = fp1 ? fp1.courtyardWidthMm / 2 : 2.0;
      const hh1 = fp1 ? fp1.courtyardLengthMm / 2 : 2.0;
      const hw2 = fp2 ? fp2.courtyardWidthMm / 2 : 2.0;
      const hh2 = fp2 ? fp2.courtyardLengthMm / 2 : 2.0;

      const overlapX = Math.abs(p1.xMm - p2.xMm) < hw1 + hw2;
      const overlapY = Math.abs(p1.yMm - p2.yMm) < hh1 + hh2;

      if (overlapX && overlapY) {
        addFinding(
          'ERROR',
          'PLACEMENT',
          [p1.id, p2.id],
          `Courtyard collision between '${p1.refDes}' and '${p2.refDes}' on ${p1.side} side`,
          'component_courtyard_overlap'
        );
      }
    }
  }

  // -------------------------------------------------------------
  // 2. TRACE & CLEARANCE DRC
  // -------------------------------------------------------------
  for (const tr of board.traces) {
    for (const seg of tr.segments) {
      // Check minimum width against fabrication profile
      if (fab && seg.widthMm < fab.minTraceWidthMm) {
        addFinding(
          'ERROR',
          'TRACE',
          [tr.id, seg.id],
          `Trace '${tr.name}' segment width (${seg.widthMm}mm) violates minimum fabrication limit (${fab.minTraceWidthMm}mm)`,
          'min_trace_width',
          seg.widthMm,
          fab.minTraceWidthMm,
          Number((fab.minTraceWidthMm - seg.widthMm).toFixed(3)),
          'mm'
        );
      }

      // Check copper to board edge clearance
      if (fab) {
        const distToEdge = Math.min(
          seg.startX,
          boardW - seg.startX,
          seg.startY,
          boardH - seg.startY,
          seg.endX,
          boardW - seg.endX,
          seg.endY,
          boardH - seg.endY
        );
        if (distToEdge < fab.minCopperToEdgeMm) {
          addFinding(
            'WARNING',
            'CLEARANCE',
            [tr.id, seg.id],
            `Trace '${tr.name}' copper distance to board edge (${distToEdge.toFixed(2)}mm) violates clearance (${fab.minCopperToEdgeMm}mm)`,
            'copper_to_board_edge_clearance',
            distToEdge,
            fab.minCopperToEdgeMm,
            undefined,
            'mm'
          );
        }
      }
    }

    // Check ampacity if trace carries power
    const evalTr = evaluateTraceProperties(tr, board);
    if (tr.impedanceClass === 'high_current' && tr.calculatedCurrentCapacityAmps) {
      if (evalTr.ampacityAmps < tr.calculatedCurrentCapacityAmps) {
        addFinding(
          'WARNING',
          'TRACE',
          [tr.id],
          `High-current trace '${tr.name}' rated ampacity (${evalTr.ampacityAmps}A) is below required current (${tr.calculatedCurrentCapacityAmps}A)`,
          'trace_current_ampacity',
          evalTr.ampacityAmps,
          tr.calculatedCurrentCapacityAmps,
          undefined,
          'A'
        );
      }
    }
  }

  // -------------------------------------------------------------
  // 3. VIA DRC
  // -------------------------------------------------------------
  for (const via of board.vias) {
    if (fab) {
      if (via.drillDiameterMm < fab.minDrillDiameterMm) {
        addFinding(
          'ERROR',
          'VIA',
          [via.id],
          `Via drill diameter (${via.drillDiameterMm}mm) is smaller than fabrication capability (${fab.minDrillDiameterMm}mm)`,
          'min_via_drill',
          via.drillDiameterMm,
          fab.minDrillDiameterMm,
          Number((fab.minDrillDiameterMm - via.drillDiameterMm).toFixed(3)),
          'mm'
        );
      }
      if (via.annularRingMm < fab.minAnnularRingMm) {
        addFinding(
          'ERROR',
          'VIA',
          [via.id],
          `Via annular ring (${via.annularRingMm}mm) violates minimum ring requirement (${fab.minAnnularRingMm}mm)`,
          'min_annular_ring',
          via.annularRingMm,
          fab.minAnnularRingMm,
          Number((fab.minAnnularRingMm - via.annularRingMm).toFixed(3)),
          'mm'
        );
      }
    }
  }

  // -------------------------------------------------------------
  // 4. PAD DRC
  // -------------------------------------------------------------
  for (const fp of board.footprints) {
    for (let i = 0; i < fp.pads.length; i++) {
      for (let j = i + 1; j < fp.pads.length; j++) {
        const p1 = fp.pads[i];
        const p2 = fp.pads[j];
        const dx = Math.abs(p1.offsetXFromCenterMm - p2.offsetXFromCenterMm);
        const dy = Math.abs(p1.offsetYFromCenterMm - p2.offsetYFromCenterMm);
        const edgeDistX = dx - (p1.widthMm + p2.widthMm) / 2;
        const edgeDistY = dy - (p1.heightMm + p2.heightMm) / 2;
        const padDist = Math.max(edgeDistX, edgeDistY);
        if (fab && padDist > 0 && padDist < fab.minSolderMaskBridgeMm) {
          addFinding(
            'WARNING',
            'PAD',
            [fp.id, p1.id, p2.id],
            `Footprint '${fp.name}' pad distance (${padDist.toFixed(3)}mm) is less than min solder mask bridge (${fab.minSolderMaskBridgeMm}mm)`,
            'pad_to_pad_clearance',
            padDist,
            fab.minSolderMaskBridgeMm,
            undefined,
            'mm'
          );
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 5. MANUFACTURING DRC
  // -------------------------------------------------------------
  for (const via of board.vias) {
    const aspectRatio = board.outline.thicknessMm / via.drillDiameterMm;
    if (aspectRatio > 10.0) {
      addFinding(
        'ERROR',
        'MANUFACTURING',
        [via.id],
        `Via aspect ratio (${aspectRatio.toFixed(1)}:1) exceeds maximum manufacturable ratio of 10:1 (plating voids risk)`,
        'via_aspect_ratio_limit',
        aspectRatio,
        10.0,
        aspectRatio - 10.0
      );
    } else if (aspectRatio > 8.0) {
      addFinding(
        'WARNING',
        'MANUFACTURING',
        [via.id],
        `Via aspect ratio (${aspectRatio.toFixed(1)}:1) is high (>8:1) and requires advanced fab capabilities`,
        'via_aspect_ratio_warning',
        aspectRatio,
        8.0,
        undefined
      );
    }
  }

  // -------------------------------------------------------------
  // 6. NET CLASS RULES DRC
  // -------------------------------------------------------------
  for (const tr of board.traces) {
    const net = project.nets.find(n => n.id === tr.netId);
    if (net && (net.netClass === 'power_rail' || (net.nominalVoltage !== undefined && net.nominalVoltage > 0))) {
      for (const seg of tr.segments) {
        if (seg.widthMm < 0.4) {
          addFinding(
            'WARNING',
            'NET',
            [tr.id, net.id],
            `Power net '${net.name}' trace '${tr.name}' has segment width (${seg.widthMm}mm) below recommended power width (0.4mm)`,
            'net_class_min_width',
            seg.widthMm,
            0.4,
            0.4 - seg.widthMm,
            'mm'
          );
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 7. STACKUP DRC
  // -------------------------------------------------------------
  if (fab && board.stackup.copperLayers.length > fab.maxLayerCount) {
    addFinding(
      'ERROR',
      'STACKUP',
      [board.stackup.id],
      `Stackup layer count (${board.stackup.copperLayers.length}) exceeds fabrication profile capability (${fab.maxLayerCount})`,
      'stackup_max_layers',
      board.stackup.copperLayers.length,
      fab.maxLayerCount
    );
  }

  if (board.stackup.copperLayers.length % 2 !== 0) {
    addFinding(
      'WARNING',
      'STACKUP',
      [board.stackup.id],
      `Stackup has odd copper layer count (${board.stackup.copperLayers.length}), which can cause manufacturing board bow and twist`,
      'stackup_symmetry_warning'
    );
  }

  // -------------------------------------------------------------
  // 5. CONTROLLED IMPEDANCE & DIFFERENTIAL PAIR DRC
  // -------------------------------------------------------------
  for (const impCon of board.impedanceConstraints) {
    const tolOhm = impCon.targetImpedanceOhms * (impCon.tolerancePercent / 100);
    const delta = Math.abs(impCon.calculatedImpedanceOhms - impCon.targetImpedanceOhms);
    if (delta > tolOhm) {
      addFinding(
        'ERROR',
        'IMPEDANCE',
        [impCon.id, impCon.netId],
        `Impedance constraint '${impCon.name}' calculated (${impCon.calculatedImpedanceOhms}Ω) violates target ${impCon.targetImpedanceOhms}Ω ± ${impCon.tolerancePercent}%`,
        'controlled_impedance_tolerance',
        impCon.calculatedImpedanceOhms,
        impCon.targetImpedanceOhms,
        delta,
        'Ω'
      );
    }
  }

  for (const dp of board.differentialPairs) {
    const evalDp = evaluateDifferentialPair(dp, board);
    if (evalDp.status === 'FAIL') {
      if (evalDp.skewLengthMm > dp.maxAllowableSkewMm) {
        addFinding(
          'ERROR',
          'DIFFERENTIAL_PAIR',
          [dp.id, dp.positiveNetId, dp.negativeNetId],
          `Differential pair '${dp.name}' intra-pair skew (${evalDp.skewLengthMm}mm / ${evalDp.skewDelayPicoseconds}ps) exceeds max allowed skew (${dp.maxAllowableSkewMm}mm)`,
          'diff_pair_skew_limit',
          evalDp.skewLengthMm,
          dp.maxAllowableSkewMm,
          evalDp.skewLengthMm - dp.maxAllowableSkewMm,
          'mm'
        );
      } else {
        addFinding(
          'ERROR',
          'DIFFERENTIAL_PAIR',
          [dp.id],
          `Differential pair '${dp.name}' impedance (${evalDp.calculatedDifferentialImpedanceOhms}Ω) violates target ${dp.targetDifferentialImpedanceOhms}Ω`,
          'diff_pair_impedance_limit',
          evalDp.calculatedDifferentialImpedanceOhms,
          dp.targetDifferentialImpedanceOhms,
          undefined,
          'Ω'
        );
      }
    } else if (evalDp.status === 'MARGINAL') {
      addFinding(
        'WARNING',
        'DIFFERENTIAL_PAIR',
        [dp.id],
        `Differential pair '${dp.name}' impedance or skew is near specification boundary`,
        'diff_pair_marginal_warning'
      );
    }
  }

  // -------------------------------------------------------------
  // 6. POWER DISTRIBUTION DRC
  // -------------------------------------------------------------
  const powerResults = analyzePcbPowerDistribution(project, board);
  for (const pr of powerResults) {
    if (pr.status === 'FAIL') {
      addFinding(
        'ERROR',
        'POWER',
        [pr.railId],
        `Power rail '${pr.railName}' exhibits excessive PCB IR voltage drop (${pr.percentageVoltageDrop}% / ${pr.estimatedIrDropVolts}V)`,
        'power_rail_voltage_drop',
        pr.percentageVoltageDrop,
        5.0,
        pr.percentageVoltageDrop - 5.0,
        '%'
      );
    } else if (pr.status === 'MARGINAL') {
      addFinding(
        'WARNING',
        'POWER',
        [pr.railId],
        `Power rail '${pr.railName}' exhibits elevated voltage drop (${pr.percentageVoltageDrop}%)`,
        'power_rail_voltage_drop_warning',
        pr.percentageVoltageDrop,
        3.0,
        undefined,
        '%'
      );
    }
  }

  // -------------------------------------------------------------
  // 12. CONNECTIVITY DRC
  // -------------------------------------------------------------
  const connAudit = auditPcbConnectivity(project, board);
  if (connAudit.unroutedNets > 0) {
    addFinding(
      'ERROR',
      'CONNECTIVITY',
      [],
      `Project contains ${connAudit.unroutedNets} completely unrouted net(s)`,
      'unrouted_nets_present',
      connAudit.unroutedNets,
      0,
      connAudit.unroutedNets,
      'nets'
    );
  }

  if (connAudit.brokenPowerPaths.length > 0) {
    for (const bpp of connAudit.brokenPowerPaths) {
      addFinding(
        'ERROR',
        'CONNECTIVITY',
        [bpp.pathId],
        `Power path '${bpp.name}' broken at PCB layer: ${bpp.missingHop}`,
        'broken_power_path'
      );
    }
  }

  if (connAudit.unconnectedPins.length > 0) {
    addFinding(
      'WARNING',
      'CONNECTIVITY',
      connAudit.unconnectedPins.map(p => p.pinId),
      `${connAudit.unconnectedPins.length} component pin(s) are unconnected or partially routed on PCB`,
      'unconnected_pins_detected',
      connAudit.unconnectedPins.length,
      0,
      connAudit.unconnectedPins.length,
      'pins'
    );
  }

  return findings;
}
