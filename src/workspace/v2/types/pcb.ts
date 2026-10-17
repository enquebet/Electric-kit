/**
 * ElectroKit V2 — Wave 05: Deep PCB Workspace Data Model
 *
 * Defines first-class engineering objects for:
 * - PCB Board (geometry, stackup, layers, materials, fabrication profiles)
 * - Footprints & Pads
 * - Component Placement (coordinates, rotation, side, courtyards, keepouts)
 * - Traces & Segments (multi-layer routing, impedance, resistance, ampacity)
 * - Vias & Via Arrays (stitching, thermal, high-current)
 * - Copper Zones & Planes (GND, power, split planes, thermal relief)
 * - Differential Pairs & High-Speed Routing (skew, length matching, controlled impedance)
 * - Design Rules & DRC Findings (clearance, geometry, electrical, manufacturing)
 * - Connectivity Audit & Power Distribution Integration
 * - PCB Snapshots & Traceability
 */

export interface Point2D {
  x: number;
  y: number;
}

export type PcbUnit = 'mm' | 'mil' | 'inch';

export type PcbBoardOutlineType =
  | 'rectangle'
  | 'rounded_rectangle'
  | 'polygon'
  | 'custom';

export interface PcbCutoutV2 {
  id: string; // cutout_...
  name: string;
  type: 'hole' | 'slot' | 'polygon_cutout';
  center?: Point2D;
  radiusMm?: number;
  widthMm?: number;
  heightMm?: number;
  polygonPoints?: Point2D[];
  plated?: boolean;
}

export interface PcbBoardOutlineV2 {
  type: PcbBoardOutlineType;
  widthMm: number;
  heightMm: number;
  cornerRadiusMm?: number;
  polygonPoints?: Point2D[];
  cutouts: PcbCutoutV2[];
  thicknessMm: number;
}

export type PcbElectricalLayerType =
  | 'signal'
  | 'power_plane'
  | 'ground_plane'
  | 'mixed';

export type PcbNonElectricalLayerType =
  | 'solder_mask'
  | 'silkscreen'
  | 'paste'
  | 'mechanical'
  | 'documentation';

export interface PcbLayerV2 {
  id: string; // layer_...
  index: number; // 1 to N (1 = top)
  name: string; // e.g. "L1_TOP_SIGNAL", "L2_GND", "L3_PWR", "L4_BOT_SIGNAL"
  layerClass: 'electrical' | 'non_electrical';
  electricalType?: PcbElectricalLayerType;
  nonElectricalType?: PcbNonElectricalLayerType;
  side: 'top' | 'bottom' | 'inner';
  copperThicknessOz: number; // e.g. 1.0 (35µm) or 0.5 (17.5µm)
  copperThicknessMm: number;
  color?: string;
  isRoutable: boolean;
  allowsPlanes: boolean;
  associatedNetIds?: string[];
}

export interface PcbDielectricLayerV2 {
  id: string;
  name: string;
  type: 'core' | 'prepreg';
  materialName: string; // e.g. "FR-4 Standard", "Isola 370HR", "Rogers RO4350B"
  dielectricConstantEr: number; // e.g. 4.3
  lossTangent: number; // e.g. 0.02
  thicknessMm: number; // e.g. 0.2mm
}

export interface PcbStackupV2 {
  id: string; // stack_...
  name: string; // e.g. "Standard 4-Layer 1.6mm FR-4"
  layerCount: 2 | 4 | 6 | 8 | 10 | 12 | 16;
  copperLayers: PcbLayerV2[];
  dielectricLayers: PcbDielectricLayerV2[];
  totalNominalThicknessMm: number;
  symmetrical: boolean;
  notes?: string;
}

export interface PcbFabricationProfileV2 {
  id: string; // fab_...
  name: string; // e.g. "Standard Capability (6/6 mil)", "Advanced Fine-Pitch (4/4 mil)"
  source: 'user_defined' | 'manufacturer_reference';
  minTraceWidthMm: number; // e.g. 0.152mm (6 mil)
  minTraceSpacingMm: number; // e.g. 0.152mm (6 mil)
  minDrillDiameterMm: number; // e.g. 0.3mm (12 mil)
  minViaPadDiameterMm: number; // e.g. 0.6mm (24 mil)
  minAnnularRingMm: number; // e.g. 0.127mm (5 mil)
  minCopperToEdgeMm: number; // e.g. 0.254mm (10 mil)
  minSolderMaskBridgeMm: number; // e.g. 0.1mm (4 mil)
  maxLayerCount: number;
}

export type PcbPadType =
  | 'smd'
  | 'through_hole'
  | 'thermal_pad'
  | 'mounting_hole'
  | 'test_point'
  | 'fiducial';

export type PcbPadShape = 'rectangular' | 'circular' | 'oval' | 'rounded_rect';

export interface PcbPadV2 {
  id: string; // pad_...
  padNumber: string; // "1", "2", "EP", etc.
  type: PcbPadType;
  shape: PcbPadShape;
  layerId: string; // or 'all_copper' for through-hole
  offsetXFromCenterMm: number;
  offsetYFromCenterMm: number;
  widthMm: number;
  heightMm: number;
  drillDiameterMm?: number;
  annularRingMm?: number;
  assignedNetId?: string;
  associatedPinId?: string;
  thermalRelief: boolean;
}

export interface PcbFootprintV2 {
  id: string; // fp_...
  name: string; // e.g. "QFN-40_6x6mm_P0.5mm", "LGA-12", "0805_Resistor"
  packageType: string;
  bodyWidthMm: number;
  bodyLengthMm: number;
  bodyHeightMm?: number;
  courtyardWidthMm: number;
  courtyardLengthMm: number;
  pads: PcbPadV2[];
  polarityMarker?: { xMm: number; yMm: number; shape: 'dot' | 'notch' | 'bevel' };
  notes?: string;
}

export interface PcbComponentPlacementV2 {
  id: string; // place_...
  componentId: string; // comp_... (references existing V2 Component)
  footprintId: string; // fp_...
  refDes: string; // e.g. "U1", "Q1", "L1"
  xMm: number;
  yMm: number;
  rotationDeg: 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315 | number;
  side: 'top' | 'bottom';
  placementStatus: 'unplaced' | 'tentative' | 'fixed' | 'locked';
  keepoutZoneIds?: string[];
  courtyardViolations?: string[];
  thermalAnchor?: boolean;
}

export interface PcbTraceSegmentV2 {
  id: string; // tseg_...
  layerId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  widthMm: number;
  lengthMm: number;
}

export interface PcbTraceV2 {
  id: string; // trace_...
  netId: string; // net_... (references V2 Net)
  name: string;
  segments: PcbTraceSegmentV2[];
  totalLengthMm: number;
  averageWidthMm: number;
  startPadId?: string;
  endPadId?: string;
  viaIds: string[]; // via_... transitions
  impedanceClass?: 'single_ended_50ohm' | 'high_current' | 'low_impedance' | 'standard';
  targetImpedanceOhms?: number;
  // Deterministic physical metrics calculated via Phase 08 engines
  calculatedResistanceOhms?: number;
  calculatedVoltageDropVolts?: number;
  calculatedPowerLossWatts?: number;
  calculatedCurrentCapacityAmps?: number;
  currentOperatingTempC?: number;
  status: 'routed' | 'unrouted' | 'violation' | 'marginal';
}

export type PcbViaType = 'through' | 'blind' | 'buried' | 'microvia';

export interface PcbViaV2 {
  id: string; // via_...
  netId: string; // net_...
  type: PcbViaType;
  xMm: number;
  yMm: number;
  startLayerId: string;
  endLayerId: string;
  drillDiameterMm: number;
  padDiameterMm: number;
  annularRingMm: number;
  platingThicknessUm?: number; // default 25µm
  // Deterministic metrics via Phase 08 via engine
  calculatedResistanceOhms?: number;
  calculatedAmpacityAmps?: number;
  calculatedVoltageDropVolts?: number;
  calculatedThermalResistanceCPerW?: number;
}

export interface PcbViaArrayV2 {
  id: string; // varray_...
  name: string; // e.g. "GND Thermal Stitching Array", "VOUT 5V High-Current Via Matrix"
  purpose: 'thermal_dissipation' | 'ground_stitching' | 'high_current_power' | 'shielding';
  netId: string;
  viaIds: string[];
  count: number;
  pitchMm: number;
  rows?: number;
  columns?: number;
  effectiveResistanceOhms?: number;
  combinedAmpacityAmps?: number;
}

export interface PcbCopperZoneV2 {
  id: string; // zone_...
  name: string; // e.g. "GND Plane Inner 1", "5V Output Power Island"
  netId: string;
  layerId: string;
  polygonPoints: Point2D[];
  clearanceMm: number;
  priority: number; // Higher fills first
  connectionType: 'thermal_relief' | 'solid';
  thermalReliefSpokeWidthMm?: number;
  thermalReliefSpokeCount?: number;
  areaSquareMm: number;
  associatedComponentIds?: string[];
}

export interface PcbDifferentialPairV2 {
  id: string; // diff_...
  name: string; // e.g. "USB_D_PAIR", "PCIE_TX0", "ETH_MDI_0"
  positiveNetId: string;
  negativeNetId: string;
  targetDifferentialImpedanceOhms: number; // e.g. 90Ω for USB, 100Ω for PCIe/Ethernet
  tolerancePercent: number; // e.g. 10%
  layerId: string;
  traceWidthMm: number;
  traceSpacingMm: number;
  totalLengthPositiveMm: number;
  totalLengthNegativeMm: number;
  skewLengthMm: number;
  skewDelayPicoseconds: number;
  maxAllowableSkewMm: number;
  calculatedDifferentialImpedanceOhms: number;
  status: 'PASS' | 'MARGINAL' | 'FAIL';
}

export interface PcbLengthConstraintV2 {
  id: string; // lencon_...
  name: string;
  targetNetId?: string;
  targetDiffPairId?: string;
  minLengthMm?: number;
  maxLengthMm?: number;
  maxSkewMm?: number;
  actualLengthMm: number;
  actualSkewMm?: number;
  deltaMm: number;
  status: 'PASS' | 'MARGINAL' | 'FAIL';
}

export interface PcbImpedanceConstraintV2 {
  id: string; // impcon_...
  name: string;
  netId: string;
  layerId: string;
  targetImpedanceOhms: number;
  tolerancePercent: number;
  geometryType: 'microstrip' | 'stripline' | 'coplanar_waveguide';
  traceWidthMm: number;
  calculatedImpedanceOhms: number;
  status: 'PASS' | 'MARGINAL' | 'FAIL';
}

export type PcbDrcCategory =
  | 'PLACEMENT'
  | 'CLEARANCE'
  | 'TRACE'
  | 'VIA'
  | 'PAD'
  | 'NET'
  | 'STACKUP'
  | 'IMPEDANCE'
  | 'DIFFERENTIAL_PAIR'
  | 'MANUFACTURING'
  | 'POWER'
  | 'CONNECTIVITY';

export type PcbDrcSeverity = 'INFO' | 'WARNING' | 'ERROR';

export interface PcbDrcFindingV2 {
  id: string; // drc_...
  severity: PcbDrcSeverity;
  category: PcbDrcCategory;
  objectIds: string[]; // references to affected entities (trace, via, pad, etc.)
  description: string;
  ruleName: string;
  measuredValue?: number | string;
  limitValue?: number | string;
  delta?: number;
  unit?: string;
  status: 'active' | 'waived' | 'resolved';
}

export interface PcbKeepoutV2 {
  id: string; // keep_...
  name: string;
  type: 'component' | 'copper' | 'via' | 'trace' | 'all';
  layerId: string; // or 'all_layers'
  polygonPoints: Point2D[];
  notes?: string;
}

export interface PcbTestPointV2 {
  id: string; // tp_...
  name: string; // e.g. "TP_VOUT", "TP_SW_NODE"
  netId: string;
  padId: string;
  xMm: number;
  yMm: number;
  layer: 'top' | 'bottom';
}

export interface PcbConnectivityAuditResult {
  totalNets: number;
  fullyRoutedNets: number;
  unroutedNets: number;
  partiallyRoutedNets: number;
  unconnectedPins: Array<{ pinId: string; refDes: string; pinName: string; netId: string }>;
  danglingVias: string[];
  isolatedCopperZones: string[];
  brokenPowerPaths: Array<{ pathId: string; name: string; missingHop: string }>;
  completionPercentage: number;
  status: 'COMPLETE' | 'IN_PROGRESS' | 'DISCONNECTED';
}

export interface PcbPowerDistributionResult {
  railId: string;
  railName: string;
  voltage: number;
  allocatedCurrentAmps: number;
  distributionMethod: 'copper_plane' | 'wide_trace' | 'polygon_zone';
  totalTraceResistanceOhms: number;
  totalViaResistanceOhms: number;
  estimatedIrDropVolts: number;
  voltageAtLoadVolts: number;
  percentageVoltageDrop: number;
  powerDissipationWatts: number;
  maxCurrentDensityAmpsPerSqMm: number;
  status: 'PASS' | 'MARGINAL' | 'FAIL';
}

export interface PcbBoardV2 {
  id: string; // board_...
  name: string; // e.g. "Main Controller Board (Rev B)"
  revision: string; // "Rev 1.0", "Rev 2.0"
  unit: PcbUnit;
  outline: PcbBoardOutlineV2;
  stackup: PcbStackupV2;
  fabricationProfile: PcbFabricationProfileV2;
  footprints: PcbFootprintV2[];
  placements: PcbComponentPlacementV2[];
  traces: PcbTraceV2[];
  vias: PcbViaV2[];
  viaArrays: PcbViaArrayV2[];
  copperZones: PcbCopperZoneV2[];
  differentialPairs: PcbDifferentialPairV2[];
  lengthConstraints: PcbLengthConstraintV2[];
  impedanceConstraints: PcbImpedanceConstraintV2[];
  keepouts: PcbKeepoutV2[];
  testPoints: PcbTestPointV2[];
  drcFindings: PcbDrcFindingV2[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
}
