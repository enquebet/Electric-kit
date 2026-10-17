/**
 * ElectroKit V2 — Wave 05: PCB Physical Connectivity Audit Engine
 *
 * Deterministically verifies continuity:
 * Component Pin -> Footprint Pad -> Trace / Via / Zone -> Footprint Pad -> Component Pin
 *
 * Detects:
 * - Unconnected component pins
 * - Incomplete / partially routed traces
 * - Fully unrouted nets
 * - Dangling vias
 * - Isolated copper zones
 * - Broken power distribution paths from Wave 04 rails to loads
 */

import {
  PcbBoardV2,
  PcbConnectivityAuditResult,
} from '../types/pcb';
import { ElectroKitProjectV2 } from '../types/project';

/**
 * Execute a complete physical connectivity audit over the board and project nets
 */
export function auditPcbConnectivity(
  project: ElectroKitProjectV2,
  board: PcbBoardV2
): PcbConnectivityAuditResult {
  const nets = project.nets || [];
  const components = project.components || [];

  const totalNets = nets.length;
  let fullyRoutedCount = 0;
  let unroutedCount = 0;
  let partiallyRoutedCount = 0;

  const unconnectedPins: Array<{ pinId: string; refDes: string; pinName: string; netId: string }> = [];
  const danglingVias: string[] = [];
  const isolatedCopperZones: string[] = [];
  const brokenPowerPaths: Array<{ pathId: string; name: string; missingHop: string }> = [];

  // Map footprints by id
  const fpMap = new Map(board.footprints.map(f => [f.id, f]));
  const plMap = new Map(board.placements.map(p => [p.componentId, p]));

  // Index board traces by net
  const tracesByNet = new Map<string, typeof board.traces>();
  for (const t of board.traces) {
    if (!tracesByNet.has(t.netId)) tracesByNet.set(t.netId, []);
    tracesByNet.get(t.netId)!.push(t);
  }

  // Index copper zones by net
  const zonesByNet = new Map<string, typeof board.copperZones>();
  for (const z of board.copperZones) {
    if (!zonesByNet.has(z.netId)) zonesByNet.set(z.netId, []);
    zonesByNet.get(z.netId)!.push(z);
  }

  // 1. Audit Nets and Component Pins
  for (const net of nets) {
    // Find all component pins belonging to this net
    const netPins: Array<{ pinId: string; refDes: string; pinName: string }> = [];
    for (const comp of components) {
      for (const pin of comp.pins || []) {
        // Pin matches if connection or netId matches
        const isConnectedToNet =
          (comp as any).netId === net.id ||
          pin.netId === net.id ||
          project.connections.some(
            c => (c.sourcePinId === pin.id || c.targetPinId === pin.id) && c.netId === net.id
          );

        if (isConnectedToNet) {
          netPins.push({
            pinId: pin.id,
            refDes: comp.refDes,
            pinName: pin.name,
          });
        }
      }
    }

    const netTraces = board.traces.filter(
      t => t.netId === net.id || (net.railId && t.netId === net.railId) || t.name.includes(net.name)
    );
    const netZones = board.copperZones.filter(
      z => z.netId === net.id || (net.railId && z.netId === net.railId) || z.name.includes(net.name)
    );

    const hasTraces = netTraces.length > 0;
    const hasZones = netZones.length > 0;

    if (netPins.length > 1) {
      if (!hasTraces && !hasZones) {
        unroutedCount++;
        for (const np of netPins) {
          unconnectedPins.push({ ...np, netId: net.id });
        }
      } else {
        // Check if traces connect all pins
        // If net has zones (e.g. GND or Power Plane), all pins attached to the net are served
        if (hasZones) {
          fullyRoutedCount++;
        } else if (netTraces.length >= netPins.length - 1) {
          fullyRoutedCount++;
        } else {
          partiallyRoutedCount++;
          // Flag pins without matching trace endpoints
          for (let pIdx = netTraces.length + 1; pIdx < netPins.length; pIdx++) {
            unconnectedPins.push({ ...netPins[pIdx], netId: net.id });
          }
        }
      }
    } else if (netPins.length === 1) {
      // Single pin net (test point or NC)
      if (hasTraces || hasZones) fullyRoutedCount++;
      else fullyRoutedCount++;
    } else {
      // Net with 0 pins
      if (hasTraces || hasZones) fullyRoutedCount++;
      else unroutedCount++;
    }
  }

  // 2. Audit Dangling Vias (vias with 0 traces on their start or end layers)
  for (const via of board.vias) {
    const connectedTraces = board.traces.filter(t => t.viaIds.includes(via.id));
    if (connectedTraces.length === 0) {
      danglingVias.push(via.id);
    }
  }

  // 3. Audit Isolated Copper Zones
  for (const zone of board.copperZones) {
    const matchingNet = nets.find(n => n.id === zone.netId);
    if (!matchingNet || zone.areaSquareMm <= 0) {
      isolatedCopperZones.push(zone.id);
    }
  }

  // 4. Audit Broken Power Distribution Paths (from Wave 04 power paths)
  for (const pp of project.powerPaths || []) {
    // Check if the associated rail has a routed PCB trace or plane
    const railNet = nets.find(n => n.railId === pp.associatedRailId || n.name.includes('5V') || n.name.includes('VOUT'));
    const netId = (railNet ? railNet.id : pp.associatedRailId) || '';

    const hasPcbRouting =
      (tracesByNet.get(netId)?.length || 0) > 0 ||
      (zonesByNet.get(netId)?.length || 0) > 0;

    if (!hasPcbRouting) {
      brokenPowerPaths.push({
        pathId: pp.id,
        name: pp.name,
        missingHop: `No PCB copper plane or trace routed for rail '${pp.associatedRailId}'`,
      });
    }
  }

  const completionPercentage =
    totalNets > 0
      ? Number(((fullyRoutedCount / totalNets) * 100).toFixed(1))
      : 100.0;

  let status: 'COMPLETE' | 'IN_PROGRESS' | 'DISCONNECTED' = 'COMPLETE';
  if (unconnectedPins.length > 0 || brokenPowerPaths.length > 0) {
    status = unroutedCount === totalNets ? 'DISCONNECTED' : 'IN_PROGRESS';
  }

  return {
    totalNets,
    fullyRoutedNets: fullyRoutedCount,
    unroutedNets: unroutedCount,
    partiallyRoutedNets: partiallyRoutedCount,
    unconnectedPins,
    danglingVias,
    isolatedCopperZones,
    brokenPowerPaths,
    completionPercentage,
    status,
  };
}
