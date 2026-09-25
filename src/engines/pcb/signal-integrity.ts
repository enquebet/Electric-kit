/**
 * PCB High-Speed Signal Integrity & Transmission Line Analysis Engine
 * 
 * Implements:
 * - Rise time to knee frequency / bandwidth: BW_knee ≈ 0.35 / t_r
 * - Critical transmission line length (lumped vs. distributed regime):
 *   l_crit = t_r / (6 · τ_pd) (Howard Johnson standard rule)
 * - Voltage reflection coefficient: Γ = (Z_L − Z₀) / (Z_L + Z₀)
 * - Return loss: RL = −20·log₁₀|Γ| (dB)
 * - Voltage Standing Wave Ratio: VSWR = (1 + |Γ|) / (1 − |Γ|)
 * - Mismatch transmission loss: M_loss = −10·log₁₀(1 − |Γ|²) (dB)
 * 
 * Engineering Classification: THEORETICAL TRANSMISSION-LINE MODEL
 */

import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';

export interface SignalIntegrityInputs {
  riseTimeNs: number;            // 10%-90% signal edge rise time (e.g. 1.0 ns)
  characteristicZ0Ohms: number;  // e.g. 50 Ω
  loadImpedanceZlOhms: number;   // e.g. 100 Ω or 1 MΩ (Hi-Z receiver)
  delayPsPerInch?: number;       // e.g. 150 ps/in (typical microstrip on FR-4)
  actualTraceLengthInches?: number;
}

export interface SignalIntegrityOutputs {
  kneeFrequencyGhz: number;
  criticalLengthInches: number;
  criticalLengthMm: number;
  reflectionCoefficient: number;
  returnLossDb: number;
  vswr: number;
  reflectedPowerPercent: number;
  transmittedPowerPercent: number;
  mismatchLossDb: number;
  isTransmissionLineRegime?: boolean;
}

/**
 * Calculates high-speed spectral knee bandwidth, critical transmission line boundary,
 * reflection coefficient, return loss, and VSWR.
 */
export function calculateSignalIntegrity(inputs: SignalIntegrityInputs): CalculationResult & { outputs: SignalIntegrityOutputs } {
  const {
    riseTimeNs: tr,
    characteristicZ0Ohms: Z0,
    loadImpedanceZlOhms: ZL,
    delayPsPerInch = 150,
    actualTraceLengthInches: Ltrace,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeTrNs = Math.max(0.01, tr);
  const safeZ0 = Math.max(0.1, Z0);
  const safeZL = Math.max(0, ZL);

  // 1. Knee frequency (Howard Johnson / Bogatin model):
  // F_knee ≈ 0.35 / t_r
  const kneeFreqGhz = 0.35 / safeTrNs;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Spectral Knee Frequency / Bandwidth from Rise Time',
    formula: 'F_knee ≈ 0.35 / t_r',
    substitution: `F_knee = 0.35 / (${safeTrNs.toFixed(3)} ns)`,
    result: `${kneeFreqGhz >= 1 ? kneeFreqGhz.toFixed(2) + ' GHz' : (kneeFreqGhz * 1e3).toFixed(1) + ' MHz'}`,
    annotation: 'Represents the frequency boundary above which spectral energy falls off faster than 40 dB/decade.',
  });

  // 2. Critical transmission line trace length:
  // When propagation delay t_pd >= t_r / 6, line must be treated as distributed.
  // l_crit = (t_r / 6) / delay_per_inch
  const trPs = safeTrNs * 1000;
  const criticalLengthIn = (trPs / 6) / delayPsPerInch;
  const criticalLengthMm = criticalLengthIn * 25.4;

  steps.push({
    stepNumber: 2,
    title: 'Calculate Critical Transmission Line Length (Lumped vs. Distributed Threshold)',
    formula: 'l_crit = (t_r / 6) / τ_pd',
    substitution: `l_crit = (${trPs.toFixed(0)} ps / 6) / (${delayPsPerInch.toFixed(1)} ps/inch)`,
    result: `${criticalLengthIn.toFixed(2)} inches (${criticalLengthMm.toFixed(1)} mm)`,
    annotation: 'Traces longer than l_crit exhibit significant transmission line reflections and require controlled impedance & termination.',
  });

  // 3. Reflection Coefficient:
  // Γ = (ZL - Z0) / (ZL + Z0)
  const gamma = (safeZL - safeZ0) / (safeZL + safeZ0);
  const absGamma = Math.abs(gamma);

  steps.push({
    stepNumber: 3,
    title: 'Calculate Voltage Reflection Coefficient (Γ)',
    formula: 'Γ = (Z_L − Z₀) / (Z_L + Z₀)',
    substitution: `Γ = (${safeZL.toFixed(1)} Ω − ${safeZ0.toFixed(1)} Ω) / (${safeZL.toFixed(1)} Ω + ${safeZ0.toFixed(1)} Ω)`,
    result: `Γ = ${gamma >= 0 ? '+' : ''}${gamma.toFixed(3)} (|Γ| = ${absGamma.toFixed(3)})`,
    annotation: absGamma === 0 ? 'Perfect match: zero reflection.' : absGamma === 1 ? 'Total reflection (open or short circuit).' : 'Partial reflection at load interface.',
  });

  // 4. Return Loss: RL = -20 * log10(|Γ|)
  let returnLossDb: number;
  if (absGamma < 1e-6) {
    returnLossDb = 99.9; // effectively infinite
  } else {
    returnLossDb = -20 * Math.log10(absGamma);
  }

  // 5. VSWR: (1 + |Γ|) / (1 - |Γ|)
  let vswr: number;
  if (absGamma >= 0.9999) {
    vswr = 99.9; // effectively infinite
  } else {
    vswr = (1 + absGamma) / (1 - absGamma);
  }

  // 6. Reflected & Transmitted Power
  const reflPowerFraction = absGamma * absGamma;
  const transPowerFraction = Math.max(0, 1 - reflPowerFraction);
  const mismatchLossDb = transPowerFraction > 1e-6 ? -10 * Math.log10(transPowerFraction) : 99.9;

  steps.push({
    stepNumber: 4,
    title: 'Calculate Return Loss, VSWR & Power Reflection',
    formula: 'RL = −20·log₁₀|Γ| | VSWR = (1 + |Γ|) / (1 − |Γ|) | %P_refl = |Γ|² × 100%',
    substitution: `RL = −20·log₁₀(${absGamma.toFixed(3)}) | VSWR = (1 + ${absGamma.toFixed(3)}) / (1 − ${absGamma.toFixed(3)})`,
    result: `RL = ${returnLossDb.toFixed(2)} dB | VSWR = ${vswr.toFixed(2)}:1 | Reflected Power = ${(reflPowerFraction * 100).toFixed(1)}%`,
  });

  let isDistributed: boolean | undefined;
  if (Ltrace !== undefined && Ltrace > 0) {
    isDistributed = Ltrace >= criticalLengthIn;

    if (isDistributed && absGamma > 0.1) {
      warnings.push({
        severity: 'danger',
        title: 'Severe High-Speed Reflection Hazard',
        message: `Trace length (${Ltrace.toFixed(1)}" / ${(Ltrace * 25.4).toFixed(0)} mm) exceeds critical threshold (${criticalLengthIn.toFixed(2)}" / ${criticalLengthMm.toFixed(0)} mm) with reflection |Γ| = ${absGamma.toFixed(2)}. Ringing, overshoot, and false clock triggering will occur without series or parallel termination.`,
      });
    } else if (isDistributed) {
      warnings.push({
        severity: 'info',
        title: 'Distributed Transmission Line Regime',
        message: `Trace length exceeds critical length. Line behaves as a transmission line with well-matched termination (|Γ| = ${absGamma.toFixed(2)}).`,
      });
    }
  }

  const formattedResult = `Γ = ${gamma >= 0 ? '+' : ''}${gamma.toFixed(3)} (RL = ${returnLossDb.toFixed(1)} dB)`;

  return {
    label: 'Reflection Coefficient & Signal Integrity',
    primaryValue: gamma,
    primaryUnit: '',
    formattedValue: formattedResult,
    formattedResult,
    steps,
    warnings,
    equationUsed: 'F_knee = 0.35/t_r | l_crit = t_r/(6·τ_pd) | Γ = (Z_L − Z₀)/(Z_L + Z₀)',
    engineeringModel: 'THEORETICAL',
    standardsContext: 'High-Speed Digital System Design & Transmission Line Matching Principles.',
    additionalOutputs: {
      reflectionCoeff: { label: 'Reflection Coefficient (Γ)', value: `${gamma >= 0 ? '+' : ''}${gamma.toFixed(3)}` },
      returnLoss: { label: 'Return Loss', value: `${returnLossDb.toFixed(2)} dB` },
      vswr: { label: 'VSWR', value: `${vswr.toFixed(2)}:1` },
      kneeBandwidth: { label: 'Knee Bandwidth (F_knee)', value: `${kneeFreqGhz >= 1 ? kneeFreqGhz.toFixed(2) + ' GHz' : (kneeFreqGhz * 1e3).toFixed(1) + ' MHz'}` },
      criticalLength: { label: 'Critical Trace Length', value: `${criticalLengthIn.toFixed(2)} in (${criticalLengthMm.toFixed(1)} mm)` },
      reflectedPower: { label: 'Reflected Power', value: `${(reflPowerFraction * 100).toFixed(1)}%` },
      mismatchLoss: { label: 'Mismatch Loss', value: `${mismatchLossDb.toFixed(2)} dB` },
    },
    outputs: {
      kneeFrequencyGhz: kneeFreqGhz,
      criticalLengthInches: criticalLengthIn,
      criticalLengthMm: criticalLengthMm,
      reflectionCoefficient: gamma,
      returnLossDb,
      vswr,
      reflectedPowerPercent: reflPowerFraction * 100,
      transmittedPowerPercent: transPowerFraction * 100,
      mismatchLossDb,
      isTransmissionLineRegime: isDistributed,
    },
  };
}

export function calculateSeriesTermination(
  targetZ0Ohms: number,
  driverOutputImpedanceOhms: number
): { requiredSeriesResistorOhms: number; idealTotalSourceZ: number } {
  const rs = Math.max(0, targetZ0Ohms - driverOutputImpedanceOhms);
  return {
    requiredSeriesResistorOhms: rs,
    idealTotalSourceZ: rs + driverOutputImpedanceOhms,
  };
}

