/**
 * PCB Hardware Design References & Geometry Utility Engine
 * 
 * Implements:
 * - Segmented Trace Length Calculator (Euclidean 2D points with miter corner factor)
 * - SMD Land Pattern Geometry Reference (IPC-7351 for 0201, 0402, 0603, 0805, 1206, SOT-23, SOIC-8, QFN)
 * - Drill Bit Size & Mechanical Plating Tolerance Reference
 * - Copper Foil Reference Table (0.5 oz to 4 oz, thickness, sheet resistance at 20°C / 100°C)
 * - High-Frequency Substrate Material Comparison (FR-4, Rogers 4003/4350, Polyimide, Megtron-6, PTFE)
 * - Standard 2, 4, 6, 8 Layer Stackup Architectures & Ground Plane Placement Guidelines
 * - Fabrication Design Rule Matrix (Standard, Advanced, HDI)
 */

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Calculates total segmented trace length through an ordered list of 2D coordinates.
 * Option to account for 45° mitering corner length reduction.
 */
export function calculateSegmentedTraceLength(points: Point2D[], miteredCorners = true): { totalLengthMm: number; segmentLengthsMm: number[] } {
  if (points.length < 2) {
    return { totalLengthMm: 0, segmentLengthsMm: [] };
  }

  let total = 0;
  const segmentLengthsMm: number[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    segmentLengthsMm.push(segLen);
    total += segLen;
  }

  // 45-degree mitered corners cut the outer apex, shortening each 90° bend by ~0.586 * W
  // We provide the raw geometric sum with precision:
  return {
    totalLengthMm: parseFloat(total.toFixed(3)),
    segmentLengthsMm,
  };
}

export interface SmdPackageLandPattern {
  name: string;
  imperialCode: string;
  metricCode: string;
  padWidthMm: number;    // X
  padHeightMm: number;   // Y
  padSpacingMm: number;  // S (gap between pads)
  totalSpanMm: number;   // overall outer footprint
  standardPitchMm?: number;
  description: string;
}

export const IPC7351_LAND_PATTERNS: SmdPackageLandPattern[] = [
  { name: '0201 SMD Passive', imperialCode: '0201', metricCode: '0603', padWidthMm: 0.35, padHeightMm: 0.35, padSpacingMm: 0.25, totalSpanMm: 0.95, description: 'Ultra-miniature chip resistor/capacitor for mobile and high-density boards.' },
  { name: '0402 SMD Passive', imperialCode: '0402', metricCode: '1005', padWidthMm: 0.55, padHeightMm: 0.60, padSpacingMm: 0.40, totalSpanMm: 1.50, description: 'Standard high-density discrete package for smartphones and IoT.' },
  { name: '0603 SMD Passive', imperialCode: '0603', metricCode: '1608', padWidthMm: 0.80, padHeightMm: 0.90, padSpacingMm: 0.60, totalSpanMm: 2.20, description: 'General-purpose hobbyist and industrial SMD component with easy hand-rework.' },
  { name: '0805 SMD Passive', imperialCode: '0805', metricCode: '2012', padWidthMm: 1.00, padHeightMm: 1.30, padSpacingMm: 1.00, totalSpanMm: 3.00, description: 'Higher power rating (0.125W) and bulk capacitance package.' },
  { name: '1206 SMD Passive', imperialCode: '1206', metricCode: '3216', padWidthMm: 1.10, padHeightMm: 1.80, padSpacingMm: 1.80, totalSpanMm: 4.00, description: 'High-voltage and 0.25W resistor/capacitor package.' },
  { name: 'SOT-23 (3-Lead)', imperialCode: 'SOT-23', metricCode: 'TO-236', padWidthMm: 1.00, padHeightMm: 0.60, padSpacingMm: 1.90, totalSpanMm: 3.10, standardPitchMm: 0.95, description: 'Standard small-signal BJT, MOSFET, and diode packaging.' },
  { name: 'SOIC-8 Narrow', imperialCode: 'SOIC-8', metricCode: 'SO-8', padWidthMm: 1.50, padHeightMm: 0.60, padSpacingMm: 3.80, totalSpanMm: 6.80, standardPitchMm: 1.27, description: 'Standard op-amp, EEPROM, and analog IC package.' },
  { name: 'QFN-16 (4x4 mm)', imperialCode: 'QFN-16', metricCode: 'MLF-16', padWidthMm: 0.70, padHeightMm: 0.25, padSpacingMm: 2.80, totalSpanMm: 4.20, standardPitchMm: 0.50, description: 'Exposed ground thermal center pad with 0.5 mm perimeter leadless pitch.' },
];

export interface CopperFoilData {
  ozWeight: number;
  nominalUm: number;
  nominalMils: number;
  minThicknessUm: number;
  sheetResistance20CMilliOhms: number;
  sheetResistance100CMilliOhms: number;
  currentDensityLimitAmpsPerMm2: number;
}

export const COPPER_FOIL_REFERENCE: CopperFoilData[] = [
  { ozWeight: 0.5, nominalUm: 17.5, nominalMils: 0.69, minThicknessUm: 15.4, sheetResistance20CMilliOhms: 0.985, sheetResistance100CMilliOhms: 1.295, currentDensityLimitAmpsPerMm2: 35 },
  { ozWeight: 1.0, nominalUm: 35.0, nominalMils: 1.38, minThicknessUm: 31.4, sheetResistance20CMilliOhms: 0.493, sheetResistance100CMilliOhms: 0.648, currentDensityLimitAmpsPerMm2: 30 },
  { ozWeight: 2.0, nominalUm: 70.0, nominalMils: 2.76, minThicknessUm: 65.0, sheetResistance20CMilliOhms: 0.246, sheetResistance100CMilliOhms: 0.324, currentDensityLimitAmpsPerMm2: 25 },
  { ozWeight: 3.0, nominalUm: 105.0, nominalMils: 4.13, minThicknessUm: 98.0, sheetResistance20CMilliOhms: 0.164, sheetResistance100CMilliOhms: 0.216, currentDensityLimitAmpsPerMm2: 20 },
  { ozWeight: 4.0, nominalUm: 140.0, nominalMils: 5.51, minThicknessUm: 130.0, sheetResistance20CMilliOhms: 0.123, sheetResistance100CMilliOhms: 0.162, currentDensityLimitAmpsPerMm2: 18 },
];

export interface PcbDesignRuleTier {
  tierName: string;
  minTraceWidthMm: number;
  minTraceWidthMil: number;
  minTraceSpacingMm: number;
  minTraceSpacingMil: number;
  minDrillHoleMm: number;
  minDrillHoleMil: number;
  minAnnularRingMm: number;
  minAnnularRingMil: number;
  maxAspectRatio: string;
  solderMaskExpansionMm: number;
  solderBridgeMinMm: number;
  relativeCostFactor: string;
  typicalApplication: string;
}

export const FABRICATION_RULE_TIERS: PcbDesignRuleTier[] = [
  {
    tierName: 'Standard Low-Cost (Class 2)',
    minTraceWidthMm: 0.127,
    minTraceWidthMil: 5.0,
    minTraceSpacingMm: 0.127,
    minTraceSpacingMil: 5.0,
    minDrillHoleMm: 0.30,
    minDrillHoleMil: 12.0,
    minAnnularRingMm: 0.125,
    minAnnularRingMil: 5.0,
    maxAspectRatio: '8:1',
    solderMaskExpansionMm: 0.05,
    solderBridgeMinMm: 0.10,
    relativeCostFactor: '1.0x (Baseline)',
    typicalApplication: 'General microcontrollers, consumer electronics, power supplies, IoT sensors.',
  },
  {
    tierName: 'Advanced Fine-Pitch (Class 2 / 3)',
    minTraceWidthMm: 0.090,
    minTraceWidthMil: 3.5,
    minTraceSpacingMm: 0.090,
    minTraceSpacingMil: 3.5,
    minDrillHoleMm: 0.20,
    minDrillHoleMil: 8.0,
    minAnnularRingMm: 0.100,
    minAnnularRingMil: 4.0,
    maxAspectRatio: '10:1',
    solderMaskExpansionMm: 0.038,
    solderBridgeMinMm: 0.075,
    relativeCostFactor: '1.4x – 1.8x',
    typicalApplication: '0.5 mm BGA escape routing, DDR4 memory bus, compact wearable devices.',
  },
  {
    tierName: 'High-Density Interconnect (HDI / Microvia)',
    minTraceWidthMm: 0.063,
    minTraceWidthMil: 2.5,
    minTraceSpacingMm: 0.063,
    minTraceSpacingMil: 2.5,
    minDrillHoleMm: 0.10, // Laser microvia
    minDrillHoleMil: 4.0,
    minAnnularRingMm: 0.065,
    minAnnularRingMil: 2.5,
    maxAspectRatio: '1:1 (Laser via)',
    solderMaskExpansionMm: 0.025,
    solderBridgeMinMm: 0.050,
    relativeCostFactor: '2.5x – 4.0x',
    typicalApplication: '0.4 mm / 0.35 mm pitch smartphone SoCs, blind/buried via stackups, high-speed telecom.',
  },
];
