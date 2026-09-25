/**
 * PCB Transmission Lines & Controlled Impedance Engine
 * 
 * Implements:
 * - Surface Microstrip Characteristic Impedance (Z0) & Trace Width Synthesis
 *   (Hammerstad & Jensen / Wheeler quasi-static analytical formulation + IPC-2141 comparison)
 * - Symmetric Stripline Characteristic Impedance & Trace Width Synthesis (IPC-2141 / Cohn)
 * - Grounded Coplanar Waveguide (GCPW / CPWG) Conformal Mapping Model
 * - Consolidated Controlled Impedance Workflow
 * 
 * Engineering Classification:
 * - Microstrip & Stripline: THEORETICAL / QUASI-STATIC EM CONFORMAL MODEL (analytical approximation)
 */

import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { SPEED_OF_LIGHT } from '../../lib/constants';

export type TransmissionLineTopology = 'microstrip' | 'stripline' | 'coplanar_waveguide';

export interface MicrostripInputs {
  traceWidthMeters: number;      // W
  dielectricHeightMeters: number; // H
  copperThicknessMeters: number; // T
  relativePermittivityEr: number; // εr
}

export interface MicrostripOutputs {
  impedanceOhms: number;
  ipc2141ImpedanceOhms: number;
  effectivePermittivity: number;
  propagationVelocityMetersPerSec: number;
  delayPsPerMm: number;
  delayPsPerInch: number;
  wOverH: number;
}

/**
 * Calculates Characteristic Impedance (Z0) of a Surface Microstrip
 * using the industry-standard Hammerstad & Jensen formulation.
 */
export function calculateMicrostripImpedance(inputs: MicrostripInputs): CalculationResult & { outputs: MicrostripOutputs } {
  const {
    traceWidthMeters: W,
    dielectricHeightMeters: H,
    copperThicknessMeters: T,
    relativePermittivityEr: Er,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeW = Math.max(1e-6, W);
  const safeH = Math.max(1e-6, H);
  const safeT = Math.max(0, T);
  const safeEr = Math.max(1.0, Er);

  // Thickness correction to effective width:
  // ΔW = (T / π) * [ 1 + ln( 2H / T ) ] (for T > 0)
  let weff = safeW;
  if (safeT > 0 && safeT < safeH / 2) {
    const deltaW = (safeT / Math.PI) * (1 + Math.log((2 * safeH) / safeT));
    weff = safeW + deltaW;
  }

  const u = weff / safeH;

  // Hammerstad & Jensen effective dielectric constant:
  const epsEff = (safeEr + 1) / 2 + ((safeEr - 1) / 2) * Math.pow(1 + 12 / u, -0.5);

  // Characteristic impedance:
  let z0: number;
  const eta0 = 376.730313; // Free-space wave impedance (120*pi)

  if (u <= 1.0) {
    // Narrow trace formula (u <= 1)
    z0 = (eta0 / (2 * Math.PI * Math.sqrt(epsEff))) * Math.log(8 / u + 0.25 * u);
  } else {
    // Wide trace formula (u > 1)
    z0 = (eta0 / Math.sqrt(epsEff)) / (u + 1.393 + 0.667 * Math.log(u + 1.444));
  }

  // Simplified IPC-2141 empirical equation for comparison:
  // Z0_IPC = (87 / √(Er + 1.41)) * ln( 5.98*H / (0.8*W + T) )
  const denomIPC = 0.8 * safeW + safeT;
  const ipcZ0 = (87 / Math.sqrt(safeEr + 1.41)) * Math.log((5.98 * safeH) / Math.max(1e-7, denomIPC));

  const velocity = SPEED_OF_LIGHT / Math.sqrt(epsEff);
  const delayPsPerMm = (1 / velocity) * 1e12 * 1e-3;
  const delayPsPerInch = delayPsPerMm * 25.4;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Effective Width & Geometry Ratio (W/H)',
    formula: 'u = W_eff / H',
    substitution: `u = ${(weff * 1e3).toFixed(3)} mm / ${(safeH * 1e3).toFixed(3)} mm`,
    result: `W/H = ${u.toFixed(3)}`,
    annotation: safeT > 0 ? `Includes copper thickness correction ΔW = ${((weff - safeW) * 1e6).toFixed(1)} µm.` : 'Zero copper thickness assumption.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Microstrip Effective Permittivity (ε_eff)',
    formula: 'ε_eff = (ε_r + 1)/2 + [(ε_r − 1)/2] × [1 + 12/(W/H)]^(-0.5)',
    substitution: `ε_eff = (${safeEr} + 1)/2 + [(${safeEr} − 1)/2] × [1 + 12 / ${u.toFixed(3)}]^(-0.5)`,
    result: `ε_eff = ${epsEff.toFixed(3)}`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Evaluate Hammerstad & Jensen Characteristic Impedance (Z₀)',
    formula: u <= 1 ? 'Z₀ = (η₀ / 2π√ε_eff) × ln(8/u + u/4)' : 'Z₀ = (η₀ / √ε_eff) / [u + 1.393 + 0.667·ln(u + 1.444)]',
    substitution: `Z₀ = (${eta0.toFixed(1)} / √${epsEff.toFixed(3)}) / ...`,
    result: `${z0.toFixed(2)} Ω (IPC-2141 reference: ${ipcZ0.toFixed(2)} Ω)`,
  });

  if (u < 0.1 || u > 10.0) {
    warnings.push({
      severity: 'warning',
      title: 'Geometry Ratio Out of Standard Range',
      message: `W/H ratio (${u.toFixed(2)}) is outside the recommended 0.1 to 10 range. Conformal quasi-static approximations have higher fringing error.`,
    });
  }

  const formattedZ0 = `${z0.toFixed(2)} Ω`;

  return {
    label: 'Microstrip Characteristic Impedance',
    primaryValue: z0,
    primaryUnit: 'Ω',
    formattedValue: formattedZ0,
    formattedResult: formattedZ0,
    steps,
    warnings,
    equationUsed: 'Hammerstad & Jensen Microstrip Formulation (IEEE Trans. MTT)',
    engineeringModel: 'THEORETICAL',
    standardsContext: 'IPC-2141 Controlled Impedance Guidelines & Wheeler/Hammerstad quasi-TEM formulation.',
    additionalOutputs: {
      impedance: { label: 'Characteristic Impedance (Z₀)', value: `${z0.toFixed(2)} Ω` },
      ipcComparison: { label: 'IPC-2141 Estimate', value: `${ipcZ0.toFixed(2)} Ω` },
      effectivePermittivity: { label: 'Effective Permittivity', value: epsEff.toFixed(3) },
      propagationSpeed: { label: 'Propagation Velocity', value: `${(velocity / 1e6).toFixed(1)} × 10⁶ m/s` },
      delayPerInch: { label: 'Propagation Delay', value: `${delayPsPerInch.toFixed(1)} ps/inch (${delayPsPerMm.toFixed(2)} ps/mm)` },
      wOverH: { label: 'Width to Height Ratio (W/H)', value: u.toFixed(3) },
    },
    outputs: {
      impedanceOhms: z0,
      ipc2141ImpedanceOhms: ipcZ0,
      effectivePermittivity: epsEff,
      propagationVelocityMetersPerSec: velocity,
      delayPsPerMm,
      delayPsPerInch,
      wOverH: u,
    },
  };
}

/**
 * Numerical Synthesizer: Given target Z0, finds required Microstrip Trace Width (W)
 */
export function synthesizeMicrostripWidth(
  targetZ0: number,
  dielectricHeightMeters: number,
  copperThicknessMeters: number,
  relativePermittivityEr: number
): { widthMeters: number; widthMm: number; widthMils: number; achievedZ0: number } {
  // Binary search over W from 0.02 mm to 10.0 mm
  let low = 0.02e-3;
  let high = 10.0e-3;
  let mid = (low + high) / 2;

  for (let iter = 0; iter < 40; iter++) {
    mid = (low + high) / 2;
    const calc = calculateMicrostripImpedance({
      traceWidthMeters: mid,
      dielectricHeightMeters,
      copperThicknessMeters,
      relativePermittivityEr,
    });

    if (Math.abs(calc.primaryValue - targetZ0) < 0.005) {
      break;
    }

    // Since Z0 decreases as W increases:
    if (calc.primaryValue > targetZ0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const finalCalc = calculateMicrostripImpedance({
    traceWidthMeters: mid,
    dielectricHeightMeters,
    copperThicknessMeters,
    relativePermittivityEr,
  });

  return {
    widthMeters: mid,
    widthMm: mid * 1e3,
    widthMils: mid / 0.0000254,
    achievedZ0: finalCalc.primaryValue,
  };
}

export interface StriplineInputs {
  traceWidthMeters: number;      // W
  groundPlaneSpacingMeters: number; // b (total dielectric spacing between planes)
  copperThicknessMeters: number; // T
  relativePermittivityEr: number; // εr
}

export interface StriplineOutputs {
  impedanceOhms: number;
  effectivePermittivity: number;
  propagationVelocityMetersPerSec: number;
  delayPsPerMm: number;
  delayPsPerInch: number;
}

/**
 * Calculates Characteristic Impedance of a Centered Symmetric Stripline
 * using IPC-2141 / Cohn formulation.
 */
export function calculateStriplineImpedance(inputs: StriplineInputs): CalculationResult & { outputs: StriplineOutputs } {
  const {
    traceWidthMeters: W,
    groundPlaneSpacingMeters: b,
    copperThicknessMeters: T,
    relativePermittivityEr: Er,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeW = Math.max(1e-6, W);
  const safeB = Math.max(safeW, b);
  const safeT = Math.max(0, T);
  const safeEr = Math.max(1.0, Er);

  // In symmetric stripline, dielectric is completely uniform:
  const epsEff = safeEr;

  // IPC-2141 Symmetric Stripline Equation:
  // Z0 = (60 / √Er) * ln( 1.9 * b / (0.8 * W + T) )
  const denom = 0.8 * safeW + safeT;
  const z0 = (60 / Math.sqrt(safeEr)) * Math.log((1.9 * safeB) / Math.max(1e-7, denom));

  const velocity = SPEED_OF_LIGHT / Math.sqrt(epsEff);
  const delayPsPerMm = (1 / velocity) * 1e12 * 1e-3;
  const delayPsPerInch = delayPsPerMm * 25.4;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Symmetric Stripline Characteristic Impedance (IPC-2141)',
    formula: 'Z₀ = (60 / √ε_r) × ln[ 1.9·b / (0.8·W + T) ]',
    substitution: `Z₀ = (60 / √${safeEr}) × ln[ 1.9 × ${(safeB * 1e3).toFixed(2)} mm / (0.8 × ${(safeW * 1e3).toFixed(3)} mm + ${(safeT * 1e6).toFixed(1)} µm) ]`,
    result: `${z0.toFixed(2)} Ω`,
    annotation: 'Trace is symmetrically embedded equidistant between top and bottom ground planes.',
  });

  const formattedStripline = `${z0.toFixed(2)} Ω`;

  return {
    label: 'Stripline Characteristic Impedance',
    primaryValue: z0,
    primaryUnit: 'Ω',
    formattedValue: formattedStripline,
    formattedResult: formattedStripline,
    steps,
    warnings,
    equationUsed: 'Z₀ = (60 / √ε_r) · ln[ 1.9b / (0.8W + T) ] (IPC-2141)',
    engineeringModel: 'THEORETICAL',
    standardsContext: 'IPC-2141 Controlled Impedance Circuit Boards.',
    additionalOutputs: {
      impedance: { label: 'Characteristic Impedance (Z₀)', value: `${z0.toFixed(2)} Ω` },
      effectivePermittivity: { label: 'Effective Permittivity', value: epsEff.toFixed(2) },
      propagationSpeed: { label: 'Propagation Velocity', value: `${(velocity / 1e6).toFixed(1)} × 10⁶ m/s` },
      delayPerInch: { label: 'Propagation Delay', value: `${delayPsPerInch.toFixed(1)} ps/inch (${delayPsPerMm.toFixed(2)} ps/mm)` },
    },
    outputs: {
      impedanceOhms: z0,
      effectivePermittivity: epsEff,
      propagationVelocityMetersPerSec: velocity,
      delayPsPerMm,
      delayPsPerInch,
    },
  };
}

/**
 * Numerical Synthesizer: Given target Z0, finds required Stripline Trace Width (W)
 */
export function synthesizeStriplineWidth(
  targetZ0: number,
  groundPlaneSpacingMeters: number,
  copperThicknessMeters: number,
  relativePermittivityEr: number
): { widthMeters: number; widthMm: number; widthMils: number; achievedZ0: number } {
  // Analytical inversion of IPC-2141:
  // Z0 = (60 / √Er) * ln( 1.9*b / (0.8*W + T) )
  // exp( Z0 * √Er / 60 ) = 1.9*b / (0.8*W + T)
  // 0.8*W + T = 1.9*b / exp( Z0 * √Er / 60 )
  // W = [ (1.9*b / exp( Z0 * √Er / 60 )) - T ] / 0.8
  const factor = Math.exp((targetZ0 * Math.sqrt(relativePermittivityEr)) / 60);
  const rawW = ((1.9 * groundPlaneSpacingMeters) / factor - copperThicknessMeters) / 0.8;
  const safeW = Math.max(0.02e-3, rawW);

  const calc = calculateStriplineImpedance({
    traceWidthMeters: safeW,
    groundPlaneSpacingMeters,
    copperThicknessMeters,
    relativePermittivityEr,
  });

  return {
    widthMeters: safeW,
    widthMm: safeW * 1e3,
    widthMils: safeW / 0.0000254,
    achievedZ0: calc.primaryValue,
  };
}

export interface CoplanarWaveguideInputs {
  traceWidthMeters: number;       // W
  gapMeters: number;              // S (clearance to side ground coplanar pour)
  dielectricHeightMeters: number; // H (substrate height to bottom ground)
  copperThicknessMeters: number;  // T
  relativePermittivityEr: number; // εr
}

/**
 * Approximates complete elliptic ratio K(k) / K'(k) using Hilberg's formula
 */
function hilbergEllipticRatio(k: number): number {
  if (k <= 0 || k >= 1) return 1;
  const kp = Math.sqrt(1 - k * k);
  if (k >= 1 / Math.SQRT2) {
    return (1 / Math.PI) * Math.log(2 * (1 + Math.sqrt(k)) / (1 - Math.sqrt(k)));
  } else {
    return Math.PI / Math.log(2 * (1 + Math.sqrt(kp)) / (1 - Math.sqrt(kp)));
  }
}

/**
 * Grounded Coplanar Waveguide (GCPW / CPWG) Conformal Mapping Impedance Model
 */
export function calculateCoplanarWaveguideImpedance(inputs: CoplanarWaveguideInputs): CalculationResult & { outputs: { impedanceOhms: number; effectivePermittivity: number } } {
  const {
    traceWidthMeters: W,
    gapMeters: S,
    dielectricHeightMeters: H,
    relativePermittivityEr: Er,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeW = Math.max(1e-6, W);
  const safeS = Math.max(1e-6, S);
  const safeH = Math.max(1e-6, H);
  const safeEr = Math.max(1.0, Er);

  // Modulus parameters
  const k1 = safeW / (safeW + 2 * safeS);
  const ratio1 = hilbergEllipticRatio(k1);

  // Ground plane below substrate correction
  const k2 = Math.tanh((Math.PI * safeW) / (4 * safeH)) / Math.tanh((Math.PI * (safeW + 2 * safeS)) / (4 * safeH));
  const ratio2 = hilbergEllipticRatio(k2);

  // Effective dielectric constant
  const epsEff = 1 + ((safeEr - 1) / 2) * (ratio2 / (ratio1 + 1e-12));

  // Z0 = (60 * pi / √ε_eff) / (ratio1 + ratio2)
  const z0 = (60 * Math.PI) / (Math.sqrt(epsEff) * (ratio1 + ratio2));

  steps.push({
    stepNumber: 1,
    title: 'Calculate Conformal Moduli for CPWG Top Gap & Bottom Ground',
    formula: 'k₁ = W / (W + 2S) | k₂ = tanh(πW / 4H) / tanh(π(W+2S) / 4H)',
    substitution: `k₁ = ${(safeW * 1e3).toFixed(3)} / (${(safeW * 1e3).toFixed(3)} + 2×${(safeS * 1e3).toFixed(3)}) = ${k1.toFixed(4)}`,
    result: `k₁ = ${k1.toFixed(3)}, k₂ = ${k2.toFixed(3)}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Evaluate GCPW Characteristic Impedance via Elliptic Conformal Mapping',
    formula: 'Z₀ = (60π / √ε_eff) / [ K(k₁)/K\'(k₁) + K(k₂)/K\'(k₂) ]',
    substitution: `Z₀ = (188.5 / √${epsEff.toFixed(3)}) / (${ratio1.toFixed(3)} + ${ratio2.toFixed(3)})`,
    result: `${z0.toFixed(2)} Ω`,
    annotation: 'GCPW isolates signals effectively from adjacent board traces while reducing radiation loss at RF.',
  });

  const formattedGcpw = `${z0.toFixed(2)} Ω`;

  return {
    label: 'GCPW Characteristic Impedance',
    primaryValue: z0,
    primaryUnit: 'Ω',
    formattedValue: formattedGcpw,
    formattedResult: formattedGcpw,
    steps,
    warnings,
    equationUsed: 'Grounded CPW Conformal Elliptic Mapping (Ghiaasiaan / Gupta)',
    engineeringModel: 'THEORETICAL',
    standardsContext: 'Microwave Integrated Circuit Coplanar Waveguide Transmission Line Analysis.',
    additionalOutputs: {
      impedance: { label: 'Characteristic Impedance (Z₀)', value: `${z0.toFixed(2)} Ω` },
      effectivePermittivity: { label: 'Effective Permittivity (ε_eff)', value: epsEff.toFixed(3) },
      k1Modulus: { label: 'Gap Modulus k1', value: k1.toFixed(3) },
    },
    outputs: {
      impedanceOhms: z0,
      effectivePermittivity: epsEff,
    },
  };
}
