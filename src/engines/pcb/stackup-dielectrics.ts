/**
 * PCB Dielectrics, Stackup & Signal Propagation Engine
 * 
 * Implements:
 * - Multi-layer PCB stackup model & thickness summation
 * - Substrate dielectric material database (FR-4, Rogers, Polyimide, PTFE, etc.)
 * - Effective dielectric constant (ε_eff) for microstrip and stripline
 * - Phase propagation velocity: v = c / √ε_eff
 * - Signal propagation delay: t_pd = L / v
 * - Delay per unit length in ps/mm, ps/in, ns/m
 * 
 * Engineering Classification:
 * - Stackup summation: GEOMETRIC CALCULATION
 * - Permittivity & Propagation: IDEAL TRANSMISSION-LINE MODEL
 */

import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { SPEED_OF_LIGHT } from '../../lib/constants';

export interface DielectricMaterial {
  id: string;
  name: string;
  category: 'standard' | 'high_speed' | 'rf_microwave' | 'flexible' | 'ceramic';
  relativePermittivityEr: number; // at 1 GHz
  lossTangent: number;            // tan δ at 1 GHz
  glassTransitionTempC?: number;  // Tg
  typicalDielectricStrengthKvPerMm: number;
  description: string;
}

export const DIELECTRIC_MATERIALS: DielectricMaterial[] = [
  {
    id: 'fr4_standard',
    name: 'FR-4 Standard (Difunctional)',
    category: 'standard',
    relativePermittivityEr: 4.40,
    lossTangent: 0.020,
    glassTransitionTempC: 135,
    typicalDielectricStrengthKvPerMm: 30,
    description: 'General-purpose woven fiberglass reinforced epoxy. Cost-effective standard for digital and analog below 1 GHz.',
  },
  {
    id: 'fr4_hightg',
    name: 'FR-4 High-Tg (Lead-Free Compatible)',
    category: 'standard',
    relativePermittivityEr: 4.20,
    lossTangent: 0.016,
    glassTransitionTempC: 175,
    typicalDielectricStrengthKvPerMm: 35,
    description: 'Higher thermal threshold preventing delamination during 260°C lead-free SAC305 reflow profiles.',
  },
  {
    id: 'rogers_ro4003c',
    name: 'Rogers RO4003C (Hydrocarbon / Ceramic)',
    category: 'rf_microwave',
    relativePermittivityEr: 3.55,
    lossTangent: 0.0027,
    glassTransitionTempC: 280,
    typicalDielectricStrengthKvPerMm: 31,
    description: 'Low loss RF laminate processed using standard FR-4 fabrication procedures. Stable Er up to 40 GHz.',
  },
  {
    id: 'rogers_ro4350b',
    name: 'Rogers RO4350B (Hydrocarbon / Ceramic)',
    category: 'rf_microwave',
    relativePermittivityEr: 3.66,
    lossTangent: 0.0037,
    glassTransitionTempC: 280,
    typicalDielectricStrengthKvPerMm: 32,
    description: 'Flame-retardant (UL 94V-0) RF grade substrate for automotive radar, 5G base stations, and satellite links.',
  },
  {
    id: 'polyimide_flex',
    name: 'Polyimide (Kapton / Flexible PCB)',
    category: 'flexible',
    relativePermittivityEr: 3.40,
    lossTangent: 0.0080,
    glassTransitionTempC: 260,
    typicalDielectricStrengthKvPerMm: 45,
    description: 'Ductile high-temperature polymer core for flex and rigid-flex interconnects.',
  },
  {
    id: 'ptfe_teflon',
    name: 'PTFE (Teflon / Woven Glass)',
    category: 'rf_microwave',
    relativePermittivityEr: 2.10,
    lossTangent: 0.0004,
    glassTransitionTempC: 315,
    typicalDielectricStrengthKvPerMm: 40,
    description: 'Ultra-low dielectric loss material for military radar, aerospace, and millimeter-wave RF.',
  },
  {
    id: 'alumina_ceramic',
    name: 'Alumina 96% (Al₂O₃ Thick Film)',
    category: 'ceramic',
    relativePermittivityEr: 9.80,
    lossTangent: 0.0006,
    typicalDielectricStrengthKvPerMm: 17,
    description: 'High thermal conductivity ceramic substrate for hybrid power modules and high-power RF.',
  },
  {
    id: 'megtron6',
    name: 'Panasonic Megtron 6',
    category: 'high_speed',
    relativePermittivityEr: 3.70,
    lossTangent: 0.0020,
    glassTransitionTempC: 185,
    typicalDielectricStrengthKvPerMm: 35,
    description: 'Ultra-low transmission loss, high heat resistance laminate for high-speed telecom routers and computing servers (PCIe 4/5/6).',
  },
  {
    id: 'isola_370hr',
    name: 'Isola 370HR High-Perf FR-4',
    category: 'standard',
    relativePermittivityEr: 4.04,
    lossTangent: 0.021,
    glassTransitionTempC: 180,
    typicalDielectricStrengthKvPerMm: 35,
    description: 'High-reliability FR-4 system featuring high Tg (180°C), superior CAF resistance, and low Z-axis CTE.',
  },
];

export interface PcbLayer {
  id: string;
  name: string;
  type: 'copper' | 'prepreg' | 'core' | 'soldermask';
  role?: 'signal' | 'ground_plane' | 'power_plane' | 'dielectric';
  thicknessMeters: number;
  dielectricConstant?: number;
  copperWeightOz?: number;
}

export interface PcbStackupPreset {
  id: string;
  name: string;
  layerCount: number;
  totalThicknessMm: number;
  description: string;
  layers: PcbLayer[];
}

export const STANDARD_STACKUP_PRESETS: PcbStackupPreset[] = [
  {
    id: '2layer_standard',
    name: 'Standard 2-Layer Board (1.6 mm / 1 oz)',
    layerCount: 2,
    totalThicknessMm: 1.6,
    description: 'Top signal/power, bottom ground return, 1.5 mm FR-4 core with solder mask.',
    layers: [
      { id: 'sm_top', name: 'Top Solder Mask', type: 'soldermask', thicknessMeters: 12.7e-6, dielectricConstant: 3.8 },
      { id: 'l1_top', name: 'L1: Top Copper', type: 'copper', role: 'signal', thicknessMeters: 35e-6, copperWeightOz: 1.0 },
      { id: 'core', name: 'FR-4 Core Dielectric', type: 'core', role: 'dielectric', thicknessMeters: 1.5e-3, dielectricConstant: 4.4 },
      { id: 'l2_bot', name: 'L2: Bottom Copper', type: 'copper', role: 'ground_plane', thicknessMeters: 35e-6, copperWeightOz: 1.0 },
      { id: 'sm_bot', name: 'Bottom Solder Mask', type: 'soldermask', thicknessMeters: 12.7e-6, dielectricConstant: 3.8 },
    ],
  },
  {
    id: '4layer_standard',
    name: 'Standard 4-Layer Board (1.6 mm / Sig-GND-PWR-Sig)',
    layerCount: 4,
    totalThicknessMm: 1.6,
    description: 'High-speed standard: L1 Top Signal, L2 Solid Ground Plane, L3 Power Plane, L4 Bottom Signal.',
    layers: [
      { id: 'sm_top', name: 'Top Solder Mask', type: 'soldermask', thicknessMeters: 12.7e-6, dielectricConstant: 3.8 },
      { id: 'l1', name: 'L1: Top Signal (Microstrip)', type: 'copper', role: 'signal', thicknessMeters: 35e-6, copperWeightOz: 1.0 },
      { id: 'pp1', name: 'Prepreg (e.g. 2x 2116)', type: 'prepreg', role: 'dielectric', thicknessMeters: 0.20e-3, dielectricConstant: 4.2 },
      { id: 'l2', name: 'L2: Ground Plane (Solid)', type: 'copper', role: 'ground_plane', thicknessMeters: 35e-6, copperWeightOz: 1.0 },
      { id: 'core', name: 'FR-4 Core', type: 'core', role: 'dielectric', thicknessMeters: 1.06e-3, dielectricConstant: 4.4 },
      { id: 'l3', name: 'L3: Power Plane (VCC)', type: 'copper', role: 'power_plane', thicknessMeters: 35e-6, copperWeightOz: 1.0 },
      { id: 'pp2', name: 'Prepreg (e.g. 2x 2116)', type: 'prepreg', role: 'dielectric', thicknessMeters: 0.20e-3, dielectricConstant: 4.2 },
      { id: 'l4', name: 'L4: Bottom Signal (Microstrip)', type: 'copper', role: 'signal', thicknessMeters: 35e-6, copperWeightOz: 1.0 },
      { id: 'sm_bot', name: 'Bottom Solder Mask', type: 'soldermask', thicknessMeters: 12.7e-6, dielectricConstant: 3.8 },
    ],
  },
  {
    id: '6layer_standard',
    name: 'Standard 6-Layer Board (1.6 mm / Dual Stripline)',
    layerCount: 6,
    totalThicknessMm: 1.6,
    description: 'Sig1 / GND / Sig2 (Stripline) / PWR / GND / Sig3 with embedded stripline routing.',
    layers: [
      { id: 'sm_top', name: 'Top Solder Mask', type: 'soldermask', thicknessMeters: 12.7e-6, dielectricConstant: 3.8 },
      { id: 'l1', name: 'L1: Top Signal', type: 'copper', role: 'signal', thicknessMeters: 35e-6, copperWeightOz: 1.0 },
      { id: 'pp1', name: 'Prepreg 1', type: 'prepreg', role: 'dielectric', thicknessMeters: 0.15e-3, dielectricConstant: 4.2 },
      { id: 'l2', name: 'L2: Ground Plane 1', type: 'copper', role: 'ground_plane', thicknessMeters: 17.5e-6, copperWeightOz: 0.5 },
      { id: 'core1', name: 'Core 1 (Dielectric)', type: 'core', role: 'dielectric', thicknessMeters: 0.35e-3, dielectricConstant: 4.4 },
      { id: 'l3', name: 'L3: Internal Signal (Stripline)', type: 'copper', role: 'signal', thicknessMeters: 17.5e-6, copperWeightOz: 0.5 },
      { id: 'pp2', name: 'Prepreg 2 (Center)', type: 'prepreg', role: 'dielectric', thicknessMeters: 0.35e-3, dielectricConstant: 4.2 },
      { id: 'l4', name: 'L4: Power Plane (VCC)', type: 'copper', role: 'power_plane', thicknessMeters: 17.5e-6, copperWeightOz: 0.5 },
      { id: 'core2', name: 'Core 2 (Dielectric)', type: 'core', role: 'dielectric', thicknessMeters: 0.35e-3, dielectricConstant: 4.4 },
      { id: 'l5', name: 'L5: Ground Plane 2', type: 'copper', role: 'ground_plane', thicknessMeters: 17.5e-6, copperWeightOz: 0.5 },
      { id: 'pp3', name: 'Prepreg 3', type: 'prepreg', role: 'dielectric', thicknessMeters: 0.15e-3, dielectricConstant: 4.2 },
      { id: 'l6', name: 'L6: Bottom Signal', type: 'copper', role: 'signal', thicknessMeters: 35e-6, copperWeightOz: 1.0 },
      { id: 'sm_bot', name: 'Bottom Solder Mask', type: 'soldermask', thicknessMeters: 12.7e-6, dielectricConstant: 3.8 },
    ],
  },
];

export function calculateStackupThickness(layers: PcbLayer[]): {
  totalThicknessMeters: number;
  totalThicknessMm: number;
  copperLayerCount: number;
  dielectricLayerCount: number;
} {
  let totalMeters = 0;
  let copperCount = 0;
  let dielectricCount = 0;
  for (const layer of layers) {
    totalMeters += layer.thicknessMeters;
    if (layer.type === 'copper') copperCount++;
    if (layer.type === 'prepreg' || layer.type === 'core') dielectricCount++;
  }
  return {
    totalThicknessMeters: totalMeters,
    totalThicknessMm: totalMeters * 1e3,
    copperLayerCount: copperCount,
    dielectricLayerCount: dielectricCount,
  };
}


export interface PropagationDelayInputs {
  relativePermittivityEr: number;
  geometryType: 'microstrip' | 'stripline';
  traceWidthMeters?: number;
  dielectricHeightMeters?: number;
  traceLengthMeters?: number;
}

export interface PropagationDelayOutputs {
  effectivePermittivity: number;
  velocityMetersPerSec: number;
  velocityPercentOfC: number;
  delayPerMeterSec: number;
  delayPsPerMm: number;
  delayPsPerInch: number;
  delayNsPerMeter: number;
  totalDelaySec?: number;
  totalDelayPs?: number;
}

/**
 * Calculates effective permittivity (ε_eff), propagation velocity,
 * and propagation delay per unit length for microstrip or stripline PCB traces.
 */
export function calculatePropagationDelay(inputs: PropagationDelayInputs): CalculationResult & { outputs: PropagationDelayOutputs } {
  const {
    relativePermittivityEr: Er,
    geometryType,
    traceWidthMeters: W = 0.3e-3,
    dielectricHeightMeters: H = 0.2e-3,
    traceLengthMeters: L,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeEr = Math.max(1.0, Er);
  let epsEff: number;

  if (geometryType === 'stripline') {
    // In stripline, the trace is fully encapsulated in uniform dielectric
    epsEff = safeEr;
    steps.push({
      stepNumber: 1,
      title: 'Determine Effective Dielectric Constant for Stripline',
      formula: 'ε_eff = ε_r (Homogeneous Embedded Conductor)',
      substitution: `ε_eff = ${safeEr.toFixed(2)}`,
      result: `${epsEff.toFixed(3)}`,
      annotation: 'Because the conductor is completely immersed between two continuous ground planes in the same dielectric, no air fringing occurs.',
    });
  } else {
    // Surface Microstrip (Air above, Dielectric below)
    // Hammerstad-Jensen approximation:
    const safeW = Math.max(1e-6, W);
    const safeH = Math.max(1e-6, H);
    const wOverH = safeW / safeH;

    epsEff = (safeEr + 1) / 2 + ((safeEr - 1) / 2) * (1 / Math.sqrt(1 + 12 / wOverH));

    steps.push({
      stepNumber: 1,
      title: 'Calculate Effective Dielectric Constant (Hammerstad & Jensen Microstrip Model)',
      formula: 'ε_eff = (ε_r + 1)/2 + [(ε_r − 1)/2] × [1 + 12·(H/W)]^(-0.5)',
      substitution: `ε_eff = (${safeEr} + 1)/2 + [(${safeEr} − 1)/2] × [1 + 12 × (${(safeH * 1e3).toFixed(2)} / ${(safeW * 1e3).toFixed(2)})]^(-0.5)`,
      result: `ε_eff = ${epsEff.toFixed(3)}`,
      annotation: `Mixed dielectric boundary: Some E-field lines traverse air (εr=1), while others traverse substrate (εr=${safeEr}).`,
    });
  }

  // Phase velocity: v = c / √ε_eff
  const velocity = SPEED_OF_LIGHT / Math.sqrt(epsEff);
  const velocityPercentC = (velocity / SPEED_OF_LIGHT) * 100;

  steps.push({
    stepNumber: 2,
    title: 'Calculate Phase Propagation Velocity',
    formula: 'v = c / √ε_eff',
    substitution: `v = 299,792,458 m/s / √${epsEff.toFixed(3)}`,
    result: `${(velocity / 1e6).toFixed(2)} × 10⁶ m/s (${velocityPercentC.toFixed(1)}% speed of light)`,
  });

  // Delay per unit length: τ = 1 / v = √ε_eff / c
  const delaySecPerM = 1 / velocity;
  const delayPsPerMm = delaySecPerM * 1e12 * 1e-3;   // ps/mm
  const delayPsPerInch = delayPsPerMm * 25.4;        // ps/inch
  const delayNsPerM = delaySecPerM * 1e9;            // ns/m

  steps.push({
    stepNumber: 3,
    title: 'Calculate Propagation Delay per Unit Length',
    formula: 'τ_pd = √ε_eff / c',
    substitution: `τ_pd = √${epsEff.toFixed(3)} / 299,792,458 m/s`,
    result: `${delayPsPerMm.toFixed(2)} ps/mm (${delayPsPerInch.toFixed(1)} ps/inch | ${delayNsPerM.toFixed(2)} ns/m)`,
  });

  let totalDelaySec: number | undefined;
  let totalDelayPs: number | undefined;

  if (L !== undefined && L > 0) {
    totalDelaySec = L * delaySecPerM;
    totalDelayPs = totalDelaySec * 1e12;

    steps.push({
      stepNumber: 4,
      title: 'Calculate Total Trace Propagation Delay',
      formula: 't_pd = Length × τ_pd',
      substitution: `t_pd = ${(L * 1e3).toFixed(1)} mm × ${delayPsPerMm.toFixed(2)} ps/mm`,
      result: `${totalDelayPs.toFixed(1)} ps (${(totalDelaySec * 1e9).toFixed(3)} ns)`,
    });
  }

  const formattedProp = `${delayPsPerInch.toFixed(1)} ps/inch (${delayPsPerMm.toFixed(2)} ps/mm)`;

  return {
    label: 'Propagation Delay',
    primaryValue: delayPsPerInch,
    primaryUnit: 'ps/inch',
    formattedValue: formattedProp,
    formattedResult: formattedProp,
    steps,
    warnings,
    equationUsed: 'v = c / √ε_eff | τ_pd = √ε_eff / c | t_pd = L / v',
    engineeringModel: 'IDEAL TRANSMISSION-LINE MODEL',
    standardsContext: 'IPC-2141 Controlled Impedance Circuit Boards and High-Speed Properties.',
    additionalOutputs: {
      effectivePermittivity: { label: 'Effective Permittivity (ε_eff)', value: epsEff.toFixed(3) },
      propagationSpeed: { label: 'Propagation Velocity', value: `${(velocity / 1e6).toFixed(1)} × 10⁶ m/s (${velocityPercentC.toFixed(1)}% c)` },
      delayPerMm: { label: 'Delay / mm', value: `${delayPsPerMm.toFixed(2)} ps/mm` },
      delayPerInch: { label: 'Delay / inch', value: `${delayPsPerInch.toFixed(1)} ps/inch` },
      ...(totalDelayPs ? { totalDelay: { label: 'Total Trace Delay', value: `${totalDelayPs.toFixed(1)} ps` } } : {}),
    },
    outputs: {
      effectivePermittivity: epsEff,
      velocityMetersPerSec: velocity,
      velocityPercentOfC: velocityPercentC,
      delayPerMeterSec: delaySecPerM,
      delayPsPerMm: delayPsPerMm,
      delayPsPerInch: delayPsPerInch,
      delayNsPerMeter: delayNsPerM,
      totalDelaySec,
      totalDelayPs,
    },
  };
}
