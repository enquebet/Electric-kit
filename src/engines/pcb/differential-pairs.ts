/**
 * PCB Differential Pair Impedance & Length Matching Engine
 * 
 * Implements:
 * - Differential pair microstrip & stripline impedance:
 *   Z_diff = 2·Z₀·[ 1 − 0.48·exp(−0.96·S/H) ] (Microstrip)
 *   Z_diff = 2·Z₀·[ 1 − 0.347·exp(−2.9·S/H) ] (Stripline)
 * - Odd-mode, even-mode, and common-mode impedances:
 *   Z_odd = Z_diff / 2 | Z_comm = Z_even / 2
 * - Differential trace width synthesizer for standard targets (90 Ω, 100 Ω, 85 Ω)
 * - Intra-pair length mismatch skew: Δt = ΔL · τ_pd
 * - High-speed interface protocol skew limits (USB 2.0/3.0, PCIe, HDMI, Ethernet, LVDS)
 * 
 * Engineering Classification: THEORETICAL / QUASI-STATIC APPROXIMATION
 */

import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { calculateMicrostripImpedance, calculateStriplineImpedance } from './transmission-lines';

export type DiffPairType = 'microstrip' | 'stripline';

export interface DiffPairProtocolTarget {
  id: string;
  name: string;
  targetZdiffOhms: number;
  maxIntraPairSkewPs: number;
  targetType: 'specification_limit' | 'nominal_design_target' | 'typical_routing_budget';
  description: string;
}

export const PROTOCOL_TARGETS: DiffPairProtocolTarget[] = [
  { id: 'usb2_high_speed', name: 'USB 2.0 (High-Speed)', targetZdiffOhms: 90, maxIntraPairSkewPs: 50, targetType: 'nominal_design_target', description: '480 Mbps differential D+/D- bus (90Ω nominal target; typical 50 ps skew budget).' },
  { id: 'usb3_superspeed', name: 'USB 3.x (SuperSpeed / SuperSpeed+)', targetZdiffOhms: 90, maxIntraPairSkewPs: 5, targetType: 'typical_routing_budget', description: '5–10 Gbps TX/RX differential links (typical 5 ps layout routing skew budget).' },
  { id: 'pcie_gen1', name: 'PCIe Gen 1 (2.5 GT/s)', targetZdiffOhms: 100, maxIntraPairSkewPs: 20, targetType: 'typical_routing_budget', description: '2.5 GT/s serial lanes (100Ω target per CEM 1.1; 20 ps typical layout skew budget).' },
  { id: 'pcie_gen2', name: 'PCIe Gen 2 (5.0 GT/s)', targetZdiffOhms: 100, maxIntraPairSkewPs: 10, targetType: 'typical_routing_budget', description: '5.0 GT/s serial lanes (100Ω target; 10 ps typical layout skew budget).' },
  { id: 'pcie_gen3', name: 'PCIe Gen 3 (8.0 GT/s)', targetZdiffOhms: 85, maxIntraPairSkewPs: 5, targetType: 'typical_routing_budget', description: '8.0 GT/s serial lanes (85Ω target per PCIe 3.0+ CEM specification; 5 ps typical skew budget).' },
  { id: 'pcie_gen4', name: 'PCIe Gen 4 (16.0 GT/s)', targetZdiffOhms: 85, maxIntraPairSkewPs: 3, targetType: 'typical_routing_budget', description: '16.0 GT/s serial lanes (85Ω nominal; 3 ps tight layout skew budget).' },
  { id: 'pcie_gen5', name: 'PCIe Gen 5 (32.0 GT/s)', targetZdiffOhms: 85, maxIntraPairSkewPs: 1.5, targetType: 'typical_routing_budget', description: '32.0 GT/s serial lanes (85Ω nominal; 1.5 ps ultra-tight layout skew target).' },
  { id: 'pcie_gen1_2', name: 'PCIe Gen 1 / 2 (Legacy Profile)', targetZdiffOhms: 100, maxIntraPairSkewPs: 20, targetType: 'typical_routing_budget', description: '2.5 / 5.0 GT/s serial lanes legacy target.' },
  { id: 'ethernet_1000base_t', name: '1000BASE-T (Gigabit Ethernet)', targetZdiffOhms: 100, maxIntraPairSkewPs: 25, targetType: 'nominal_design_target', description: 'Standard Category 5e/6 balanced 100Ω differential pairs (25 ps intra-pair skew limit).' },
  { id: 'hdmi_tmds', name: 'HDMI 1.4 / 2.0 TMDS', targetZdiffOhms: 100, maxIntraPairSkewPs: 10, targetType: 'specification_limit', description: 'Transition-minimized differential clock/data lanes (100Ω nominal, 10 ps intra-pair skew allowance).' },
  { id: 'lvds', name: 'LVDS (Low-Voltage Differential Signaling)', targetZdiffOhms: 100, maxIntraPairSkewPs: 15, targetType: 'nominal_design_target', description: 'High-speed serialized display/sensor data streams (100Ω nominal, 15 ps skew budget).' },
];

export interface DiffPairInputs {
  type: DiffPairType;
  traceWidthMeters: number;       // W
  traceSpacingMeters: number;     // S (edge-to-edge gap)
  dielectricHeightMeters: number; // H (to reference ground)
  copperThicknessMeters: number;  // T
  relativePermittivityEr: number; // εr
  positiveTraceLengthMeters?: number; // L+
  negativeTraceLengthMeters?: number; // L-
}

export interface DiffPairOutputs {
  singleEndedZ0: number;
  diffImpedanceZdiff: number;
  oddModeZodd: number;
  evenModeZeven: number;
  commonModeZcomm: number;
  couplingCoefficient: number;
  propagationDelayPsPerMm: number;
  lengthDifferenceMeters?: number;
  lengthDifferenceMm?: number;
  lengthDifferenceMils?: number;
  skewDelayPs?: number;
}

/**
 * Calculates Differential and Common-Mode Impedances, Coupling Coefficient,
 * and Intra-Pair Length Mismatch Skew.
 */
export function calculateDifferentialPair(inputs: DiffPairInputs): CalculationResult & { outputs: DiffPairOutputs } {
  const {
    type = 'microstrip',
    traceWidthMeters: W,
    traceSpacingMeters: S,
    dielectricHeightMeters: H,
    copperThicknessMeters: T,
    relativePermittivityEr: Er,
    positiveTraceLengthMeters: Lpos,
    negativeTraceLengthMeters: Lneg,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeW = Math.max(1e-6, W);
  const safeS = Math.max(1e-6, S);
  const safeH = Math.max(1e-6, H);
  const safeT = Math.max(0, T);
  const safeEr = Math.max(1.0, Er);

  let z0: number;
  let delayPsPerMm: number;

  if (type === 'microstrip') {
    const single = calculateMicrostripImpedance({
      traceWidthMeters: safeW,
      dielectricHeightMeters: safeH,
      copperThicknessMeters: safeT,
      relativePermittivityEr: safeEr,
    });
    z0 = single.primaryValue;
    delayPsPerMm = single.outputs.delayPsPerMm;
  } else {
    // Stripline: total spacing b between planes ≈ 2H + T
    const b = 2 * safeH + safeT;
    const single = calculateStriplineImpedance({
      traceWidthMeters: safeW,
      groundPlaneSpacingMeters: b,
      copperThicknessMeters: safeT,
      relativePermittivityEr: safeEr,
    });
    z0 = single.primaryValue;
    delayPsPerMm = single.outputs.delayPsPerMm;
  }

  // Edge-coupled differential impedance model:
  const sOverH = safeS / safeH;
  let zdiff: number;

  if (type === 'microstrip') {
    // Zdiff = 2*Z0 * [ 1 - 0.48 * exp(-0.96 * S/H) ]
    zdiff = 2 * z0 * (1 - 0.48 * Math.exp(-0.96 * sOverH));
  } else {
    // Zdiff = 2*Z0 * [ 1 - 0.347 * exp(-2.9 * S/H) ]
    zdiff = 2 * z0 * (1 - 0.347 * Math.exp(-2.9 * sOverH));
  }

  const zodd = zdiff / 2;
  // Symmetric line coupling relationship: Z0^2 = Z_odd * Z_even => Z_even = 2*Z0^2 / Z_diff
  const zeven = (2 * z0 * z0) / zdiff;
  const zcomm = zeven / 2;
  const couplingFactor = (zeven - zodd) / (zeven + zodd);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Isolated Single-Ended Trace Impedance (Z₀)',
    formula: type === 'microstrip' ? 'Z₀ (Microstrip Model)' : 'Z₀ (Stripline Model)',
    substitution: `W = ${(safeW * 1e3).toFixed(3)} mm, H = ${(safeH * 1e3).toFixed(3)} mm, ε_r = ${safeEr}`,
    result: `Z₀ = ${z0.toFixed(2)} Ω`,
  });

  steps.push({
    stepNumber: 2,
    title: `Evaluate Differential Pair Impedance (Z_diff) (${type.toUpperCase()})`,
    formula: type === 'microstrip'
      ? 'Z_diff = 2·Z₀ × [ 1 − 0.48·exp(−0.96·S/H) ]'
      : 'Z_diff = 2·Z₀ × [ 1 − 0.347·exp(−2.9·S/H) ]',
    substitution: `Z_diff = 2 × ${z0.toFixed(2)} Ω × [ 1 − ... × exp(−... × ${(safeS * 1e3).toFixed(2)}/${(safeH * 1e3).toFixed(2)}) ]`,
    result: `Z_diff = ${zdiff.toFixed(2)} Ω (Z_odd = ${zodd.toFixed(2)} Ω, Z_comm = ${zcomm.toFixed(2)} Ω)`,
    annotation: `Electromagnetic coupling factor k_c = ${(couplingFactor * 100).toFixed(1)}%.`,
  });

  let deltaLM: number | undefined;
  let deltaLMm: number | undefined;
  let deltaLMils: number | undefined;
  let skewPs: number | undefined;

  if (Lpos !== undefined && Lneg !== undefined) {
    deltaLM = Math.abs(Lpos - Lneg);
    deltaLMm = deltaLM * 1e3;
    deltaLMils = deltaLM / 0.0000254;
    skewPs = deltaLMm * delayPsPerMm;

    steps.push({
      stepNumber: 3,
      title: 'Calculate Intra-Pair Physical Length Mismatch & Propagation Skew',
      formula: 'ΔL = |L⁺ − L⁻| | Skew(Δt) = ΔL × τ_pd',
      substitution: `ΔL = |${(Lpos * 1e3).toFixed(2)} mm − ${(Lneg * 1e3).toFixed(2)} mm| = ${deltaLMm.toFixed(2)} mm × ${delayPsPerMm.toFixed(2)} ps/mm`,
      result: `Length Skew = ${deltaLMm.toFixed(2)} mm (${deltaLMils.toFixed(1)} mil) → Propagation Skew = ${skewPs.toFixed(1)} ps`,
    });

    if (skewPs > 10.0) {
      warnings.push({
        severity: 'warning',
        title: 'Significant Intra-Pair Skew',
        message: `Intra-pair skew (${skewPs.toFixed(1)} ps / ${deltaLMm.toFixed(2)} mm) exceeds tight budgets for PCIe Gen3+ and USB 3.x (≤5 ps). Add serpentine phase-matching accordion bends at the point of discontinuity.`,
      });
    }
  }

  const formatted = `${zdiff.toFixed(2)} Ω`;

  return {
    label: 'Differential Pair Impedance',
    primaryValue: zdiff,
    primaryUnit: 'Ω',
    formattedValue: formatted,
    formattedResult: formatted,
    steps,
    warnings,
    equationUsed: 'Z_diff = 2·Z₀·(1 − k_coupling) | Δt_skew = ΔL·τ_pd',
    engineeringModel: 'THEORETICAL',
    standardsContext: 'IPC-2141 Edge-Coupled Differential Microstrip / Stripline Impedance Models.',
    additionalOutputs: {
      diffImpedance: { label: 'Differential Impedance (Z_diff)', value: `${zdiff.toFixed(2)} Ω` },
      singleEndedZ0: { label: 'Single-Ended Z₀', value: `${z0.toFixed(2)} Ω` },
      oddModeZodd: { label: 'Odd-Mode Impedance (Z_odd)', value: `${zodd.toFixed(2)} Ω` },
      commonModeZcomm: { label: 'Common-Mode Impedance (Z_comm)', value: `${zcomm.toFixed(2)} Ω` },
      couplingPercent: { label: 'Differential Coupling', value: `${(couplingFactor * 100).toFixed(1)}%` },
      ...(skewPs !== undefined ? { skewDelay: { label: 'Intra-Pair Skew', value: `${skewPs.toFixed(1)} ps (${deltaLMm?.toFixed(2)} mm)` } } : {}),
    },
    outputs: {
      singleEndedZ0: z0,
      diffImpedanceZdiff: zdiff,
      oddModeZodd: zodd,
      evenModeZeven: zeven,
      commonModeZcomm: zcomm,
      couplingCoefficient: couplingFactor,
      propagationDelayPsPerMm: delayPsPerMm,
      lengthDifferenceMeters: deltaLM,
      lengthDifferenceMm: deltaLMm,
      lengthDifferenceMils: deltaLMils,
      skewDelayPs: skewPs,
    },
  };
}

export interface HighSpeedSkewLimit {
  protocol: string;
  bitRate: string;
  targetZdiffOhms: number;
  maxSkewPs: number;
  maxDeltaMm: number;
  budgetType: 'specification_limit' | 'typical_routing_budget';
  description: string;
}

export const HIGH_SPEED_SKEW_LIMITS: HighSpeedSkewLimit[] = [
  { protocol: 'USB 2.0 (High-Speed)', bitRate: '480 Mbps', targetZdiffOhms: 90, maxSkewPs: 50, maxDeltaMm: 8.5, budgetType: 'specification_limit', description: 'D+/D- differential data lines (90Ω nominal)' },
  { protocol: 'USB 3.x SuperSpeed / SuperSpeed+', bitRate: '5–10 Gbps', targetZdiffOhms: 90, maxSkewPs: 5, maxDeltaMm: 0.85, budgetType: 'typical_routing_budget', description: 'SuperSpeed TX/RX SSTX/SSRX lanes (90Ω nominal)' },
  { protocol: 'PCIe Gen 1', bitRate: '2.5 GT/s', targetZdiffOhms: 100, maxSkewPs: 20, maxDeltaMm: 3.4, budgetType: 'typical_routing_budget', description: 'PCIe 1.1 CEM differential lanes (100Ω nominal)' },
  { protocol: 'PCIe Gen 2', bitRate: '5.0 GT/s', targetZdiffOhms: 100, maxSkewPs: 10, maxDeltaMm: 1.7, budgetType: 'typical_routing_budget', description: 'PCIe 2.0 high-speed serial lanes (100Ω nominal)' },
  { protocol: 'PCIe Gen 3', bitRate: '8.0 GT/s', targetZdiffOhms: 85, maxSkewPs: 5, maxDeltaMm: 0.85, budgetType: 'typical_routing_budget', description: 'PCIe 3.0 CEM spec lanes (85Ω nominal)' },
  { protocol: 'PCIe Gen 4', bitRate: '16.0 GT/s', targetZdiffOhms: 85, maxSkewPs: 3, maxDeltaMm: 0.51, budgetType: 'typical_routing_budget', description: 'PCIe 4.0 ultra-high-speed lanes (85Ω nominal)' },
  { protocol: 'PCIe Gen 5', bitRate: '32.0 GT/s', targetZdiffOhms: 85, maxSkewPs: 1.5, maxDeltaMm: 0.25, budgetType: 'typical_routing_budget', description: 'PCIe 5.0 server/accelerator interconnect (85Ω nominal)' },
  { protocol: '1000BASE-T (Gigabit Ethernet)', bitRate: '1 Gbps', targetZdiffOhms: 100, maxSkewPs: 25, maxDeltaMm: 4.2, budgetType: 'specification_limit', description: 'Category 5e/6 UTP balanced pairs (100Ω nominal)' },
  { protocol: 'HDMI 1.4 / 2.0 TMDS', bitRate: '3.4–6.0 Gbps / ch', targetZdiffOhms: 100, maxSkewPs: 10, maxDeltaMm: 1.7, budgetType: 'specification_limit', description: 'TMDS clock-to-data and intra-pair lanes (100Ω nominal)' },
  { protocol: 'LVDS High-Speed Display', bitRate: '100–1500 Mbps', targetZdiffOhms: 100, maxSkewPs: 15, maxDeltaMm: 2.5, budgetType: 'typical_routing_budget', description: 'Serial flat panel display interconnect (100Ω nominal)' },
];

/**
 * Convenience wrapper for surface microstrip differential pair
 */
export function calculateDifferentialMicrostrip(inputs: {
  traceWidthMeters: number;
  pairSpacingMeters: number;
  dielectricHeightMeters: number;
  copperThicknessMeters: number;
  relativePermittivityEr: number;
}) {
  return calculateDifferentialPair({
    type: 'microstrip',
    traceWidthMeters: inputs.traceWidthMeters,
    traceSpacingMeters: inputs.pairSpacingMeters,
    dielectricHeightMeters: inputs.dielectricHeightMeters,
    copperThicknessMeters: inputs.copperThicknessMeters,
    relativePermittivityEr: inputs.relativePermittivityEr,
  });
}

export interface IntraPairSkewInputs {
  lengthPPositiveMm?: number;
  lengthNNegativeMm?: number;
  positiveTraceLengthMm?: number;
  negativeTraceLengthMm?: number;
  propagationDelayPsPerMm?: number;
  delayPsPerInch?: number;
  busStandardId?: string;
}

export function calculateIntraPairSkew(inputs: IntraPairSkewInputs): CalculationResult & {
  deltaLengthMm: number;
  skewPicoseconds: number;
  isCompliant?: boolean;
} {
  const lenP = inputs.lengthPPositiveMm ?? inputs.positiveTraceLengthMm ?? 0;
  const lenN = inputs.lengthNNegativeMm ?? inputs.negativeTraceLengthMm ?? 0;
  const deltaLengthMm = Math.abs(lenP - lenN);
  const delayPsPerMm = inputs.propagationDelayPsPerMm ?? (inputs.delayPsPerInch ? inputs.delayPsPerInch / 25.4 : 6.0);
  const skewPicoseconds = deltaLengthMm * delayPsPerMm;

  let isCompliant: boolean | undefined;
  let targetProtocolName: string | undefined;

  if (inputs.busStandardId) {
    const rawId = inputs.busStandardId.toLowerCase();
    const norm = rawId.replace(/[^a-z0-9]/g, '');
    const target = PROTOCOL_TARGETS.find(p => {
      if (p.id === inputs.busStandardId || p.id === rawId) return true;
      const pNorm = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const idNorm = p.id.replace(/[^a-z0-9]/g, '');
      return pNorm.includes(norm) || norm.includes(pNorm) || idNorm.includes(norm) || norm.includes(idNorm);
    });
    if (target) {
      targetProtocolName = target.name;
      isCompliant = skewPicoseconds <= target.maxIntraPairSkewPs;
    }
  }

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Calculate Intra-Pair Physical Length Delta',
      formula: 'ΔL = |L₊ − L₋|',
      substitution: `ΔL = |${lenP.toFixed(3)} mm − ${lenN.toFixed(3)} mm|`,
      result: `${deltaLengthMm.toFixed(3)} mm (${(deltaLengthMm / 0.0254).toFixed(1)} mil)`,
    },
    {
      stepNumber: 2,
      title: 'Calculate Intra-Pair Time Skew',
      formula: 'Δt = ΔL × τ_pd',
      substitution: `Δt = ${deltaLengthMm.toFixed(3)} mm × ${delayPsPerMm.toFixed(2)} ps/mm`,
      result: `${skewPicoseconds.toFixed(2)} ps`,
    },
  ];

  if (isCompliant === false) {
    warnings.push({
      severity: 'danger',
      title: 'Intra-Pair Skew Exceeds Standard Budget',
      message: `Calculated skew (${skewPicoseconds.toFixed(1)} ps) exceeds allowable budget for ${targetProtocolName || 'standard'}. Add serpentine phase-matching accordion bends at source.`,
    });
  }

  return {
    primaryValue: skewPicoseconds,
    formattedValue: `${skewPicoseconds.toFixed(2)} ps`,
    unit: 'ps',
    label: 'Intra-Pair Skew Delay',
    classification: 'PROTOCOL/TIMING MODEL',
    warnings,
    steps,
    additionalOutputs: {
      deltaLength: { label: 'Length Delta (ΔL)', value: `${deltaLengthMm.toFixed(3)} mm (${(deltaLengthMm / 0.0254).toFixed(1)} mil)` },
      propagationDelay: { label: 'Propagation Delay Rate', value: `${delayPsPerMm.toFixed(2)} ps/mm (${(delayPsPerMm * 25.4).toFixed(1)} ps/in)` },
      ...(isCompliant !== undefined ? { complianceStatus: { label: 'Compliance Status', value: isCompliant ? 'PASS' : 'FAIL' } } : {}),
    },
    deltaLengthMm,
    skewPicoseconds,
    isCompliant,
  };
}

export interface DiffSynthInputs {
  targetZdiffOhms?: number;
  targetDifferentialZOhms?: number;
  pairSpacingMeters?: number;
  spacingMeters?: number;
  dielectricHeightMeters?: number;
  substrateHeightMeters?: number;
  copperThicknessMeters?: number;
  relativePermittivityEr?: number;
  type?: 'microstrip' | 'stripline';
  toleranceOhms?: number;
  maxIterations?: number;
}

export interface DiffSynthResult {
  synthesizedWidthMeters: number;
  synthesizedWidthMm: number;
  synthesizedWidthMils: number;
  achievedZdiffOhms: number;
  achievedZ0Ohms: number;
  iterations: number;
  converged: boolean;
}

/**
 * Numerically synthesizes conductor width W for a target differential impedance Z_diff
 * using bounded monotonic bisection.
 */
export function synthesizeDifferentialPairWidth(inputs: DiffSynthInputs): DiffSynthResult {
  const targetZdiff = inputs.targetZdiffOhms ?? inputs.targetDifferentialZOhms ?? 100.0;
  const S = inputs.pairSpacingMeters ?? inputs.spacingMeters ?? 0.15e-3;
  const H = inputs.dielectricHeightMeters ?? inputs.substrateHeightMeters ?? 0.15e-3;
  const T = inputs.copperThicknessMeters ?? 35e-6;
  const Er = inputs.relativePermittivityEr ?? 4.2;
  const type = inputs.type ?? 'microstrip';
  const toleranceOhms = inputs.toleranceOhms ?? 0.05;
  const maxIterations = inputs.maxIterations ?? 50;

  let lowW = 0.02e-3; // 0.02 mm (~0.8 mil)
  let highW = 5.0e-3; // 5.0 mm (~200 mil)
  let midW = (lowW + highW) / 2;
  let iterations = 0;
  let converged = false;
  let currentZdiff = 0;
  let currentZ0 = 0;

  for (let i = 0; i < maxIterations; i++) {
    iterations++;
    midW = (lowW + highW) / 2;

    const evalResult = calculateDifferentialPair({
      type,
      traceWidthMeters: midW,
      traceSpacingMeters: S,
      dielectricHeightMeters: H,
      copperThicknessMeters: T,
      relativePermittivityEr: Er,
    });

    currentZdiff = evalResult.outputs.diffImpedanceZdiff;
    currentZ0 = evalResult.outputs.singleEndedZ0;

    const error = currentZdiff - targetZdiff;

    if (Math.abs(error) <= toleranceOhms) {
      converged = true;
      break;
    }

    // Since width is inversely proportional to impedance:
    // If currentZdiff > target, width is too small -> increase lowW
    if (currentZdiff > targetZdiff) {
      lowW = midW;
    } else {
      highW = midW;
    }
  }

  return {
    synthesizedWidthMeters: midW,
    synthesizedWidthMm: midW * 1e3,
    synthesizedWidthMils: (midW * 1e3) / 0.0254,
    achievedZdiffOhms: currentZdiff,
    achievedZ0Ohms: currentZ0,
    iterations,
    converged,
  };
}

