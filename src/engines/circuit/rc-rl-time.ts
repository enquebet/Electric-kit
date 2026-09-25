import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity, formatEngineeringNotation } from '../../lib/units/formatter';

export interface RcTimeConstantInputs {
  resistance: number;  // Base Ohms
  capacitance: number; // Base Farads
  supplyVoltage?: number; // V_in (Volts, default 5V)
}

export function calculateRcTimeConstant(inputs: RcTimeConstantInputs): CalculationResult {
  const { resistance, capacitance, supplyVoltage = 5.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const R = Number.isFinite(resistance) && resistance > 0 ? resistance : 1000;
  const C = Number.isFinite(capacitance) && capacitance > 0 ? capacitance : 1e-6;
  const V0 = Number.isFinite(supplyVoltage) && supplyVoltage >= 0 ? supplyVoltage : 5.0;

  // tau = R * C
  const tau = R * C; // seconds

  steps.push({
    stepNumber: 1,
    title: 'Calculate RC Time Constant (τ)',
    formula: 'τ = R × C',
    substitution: `τ = ${formatQuantity(R, 'resistance')} × ${formatQuantity(C, 'capacitance')}`,
    result: `${tau < 1e-3 ? (tau * 1e6).toFixed(2) + ' µs' : tau < 1 ? (tau * 1000).toFixed(2) + ' ms' : tau.toFixed(4) + ' s'}`,
    annotation: 'Tau represents the elapsed time required for the capacitor to charge to 63.2% of supply voltage, or discharge down to 36.8%.',
  });

  // Critical settling thresholds
  const t50 = tau * 0.693147; // ln(2)
  const t63 = tau * 1.0;
  const t90 = tau * 2.302585; // ln(10)
  const t95 = tau * 2.995732; // ln(20)
  const t99 = tau * 4.605170; // ln(100)
  const t5tau = tau * 5.0;    // 99.3% standard engineering steady-state

  steps.push({
    stepNumber: 2,
    title: 'Exponential Step Settling Durations',
    formula: 't_percent = -τ × ln(1 - %/100)',
    substitution: `50% = 0.693τ, 63.2% = 1.0τ, 90% = 2.30τ, 95% = 3.00τ, 99% = 4.61τ`,
    result: `5τ steady-state: ${t5tau < 1 ? (t5tau * 1000).toFixed(2) + ' ms' : t5tau.toFixed(4) + ' s'}`,
  });

  // Generate 50 curve points for interactive chart: t = 0 to 5.5 tau
  const curvePoints: Array<{ t: number; tRel: number; vCharge: number; vDischarge: number; pctCharge: number }> = [];
  const numPoints = 50;
  for (let i = 0; i <= numPoints; i++) {
    const tRel = (i / numPoints) * 5.5; // in units of tau
    const t = tRel * tau;
    const expFactor = Math.exp(-tRel);
    const vCharge = V0 * (1 - expFactor);
    const vDischarge = V0 * expFactor;
    curvePoints.push({
      t,
      tRel,
      vCharge,
      vDischarge,
      pctCharge: (1 - expFactor) * 100,
    });
  }

  // Energy transferred & dissipated
  const storedEnergy = 0.5 * C * V0 * V0;
  const totalDrawnEnergy = C * V0 * V0; // 50% dissipated as heat in R regardless of R value!
  const heatEnergy = totalDrawnEnergy - storedEnergy;

  if (tau < 1e-9) {
    warnings.push({
      severity: 'warning',
      title: 'Ultra-fast Nanosecond Transient',
      message: 'Time constant is sub-nanosecond; PCB parasitic inductance, trace capacitance, and component ESR/ESL will dominate real physical response.',
    });
  } else if (tau > 60) {
    warnings.push({
      severity: 'info',
      title: 'Long Settling Duration',
      message: `Full charge time (${(t5tau / 60).toFixed(1)} minutes) will be subject to capacitor dielectric leakage and board contamination.`,
    });
  }

  return {
    primaryValue: tau,
    formattedValue: `${tau < 1e-3 ? (tau * 1e6).toFixed(2) + ' µs' : tau < 1 ? (tau * 1000).toFixed(2) + ' ms' : tau.toFixed(4) + ' s'}`,
    unit: 's',
    label: 'RC Time Constant (τ)',
    warnings,
    steps,
    additionalOutputs: {
      t63: {
        label: '63.2% Voltage Time (1τ)',
        value: `${t63 < 1 ? (t63 * 1000).toFixed(3) + ' ms' : t63.toFixed(4) + ' s'}`,
        unit: 's',
      },
      t90: {
        label: '90% Voltage Time (2.3τ)',
        value: `${t90 < 1 ? (t90 * 1000).toFixed(3) + ' ms' : t90.toFixed(4) + ' s'}`,
        unit: 's',
      },
      t95: {
        label: '95% Voltage Time (3.0τ)',
        value: `${t95 < 1 ? (t95 * 1000).toFixed(3) + ' ms' : t95.toFixed(4) + ' s'}`,
        unit: 's',
      },
      t99: {
        label: '99% Voltage Time (4.6τ)',
        value: `${t99 < 1 ? (t99 * 1000).toFixed(3) + ' ms' : t99.toFixed(4) + ' s'}`,
        unit: 's',
      },
      tSteady: {
        label: 'Practical Steady-State (5τ, 99.3%)',
        value: `${t5tau < 1 ? (t5tau * 1000).toFixed(3) + ' ms' : t5tau.toFixed(4) + ' s'}`,
        unit: 's',
      },
      cutoffFreq: {
        label: 'Equivalent -3dB Cutoff Frequency',
        value: formatQuantity(1 / (2 * Math.PI * tau), 'frequency'),
        unit: 'Hz',
      },
      storedEnergy: {
        label: 'Capacitor Stored Energy',
        value: storedEnergy >= 1 ? `${storedEnergy.toFixed(3)} J` : `${(storedEnergy * 1000).toFixed(3)} mJ`,
        unit: 'J',
      },
    },
    visualData: {
      tau,
      supplyVoltage: V0,
      resistance: R,
      capacitance: C,
      curvePoints,
      markers: {
        t50: { t: t50, v: V0 * 0.50, label: '50% (0.69τ)' },
        t63: { t: t63, v: V0 * 0.632, label: '63.2% (1.0τ)' },
        t90: { t: t90, v: V0 * 0.90, label: '90% (2.3τ)' },
        t95: { t: t95, v: V0 * 0.95, label: '95% (3.0τ)' },
        t99: { t: t99, v: V0 * 0.99, label: '99% (4.6τ)' },
        t5tau: { t: t5tau, v: V0 * 0.993, label: '5τ Full Charge' },
      },
    },
  };
}

export interface RlTimeConstantInputs {
  inductance: number;  // Base Henries
  resistance: number;  // Base Ohms
  stepVoltage?: number; // Step voltage (V, default 5V)
}

export function calculateRlTimeConstant(inputs: RlTimeConstantInputs): CalculationResult {
  const { inductance, resistance, stepVoltage = 5.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const L = Number.isFinite(inductance) && inductance > 0 ? inductance : 10e-3;
  const R = Number.isFinite(resistance) && resistance > 0 ? resistance : 100;
  const V0 = Number.isFinite(stepVoltage) && stepVoltage >= 0 ? stepVoltage : 5.0;

  // tau = L / R
  const tau = L / R; // seconds
  const iMax = R > 0 ? V0 / R : 0; // Maximum steady-state current

  steps.push({
    stepNumber: 1,
    title: 'Calculate RL Time Constant (τ)',
    formula: 'τ = L / R',
    substitution: `τ = ${formatQuantity(L, 'inductance')} / ${formatQuantity(R, 'resistance')}`,
    result: `${tau < 1e-3 ? (tau * 1e6).toFixed(2) + ' µs' : tau < 1 ? (tau * 1000).toFixed(2) + ' ms' : tau.toFixed(4) + ' s'}`,
    annotation: 'Tau is the elapsed time for current to reach 63.2% of its maximum Ohm\'s Law steady state (I_max = V / R).',
  });

  const t63 = tau * 1.0;
  const t90 = tau * 2.302585;
  const t95 = tau * 2.995732;
  const t99 = tau * 4.605170;
  const t5tau = tau * 5.0;

  steps.push({
    stepNumber: 2,
    title: 'Calculate Steady-State Current & Settling Times',
    formula: 'I_max = V / R ;   i(t) = I_max × (1 - e^(-t / τ))',
    substitution: `I_max = ${formatQuantity(V0, 'voltage')} / ${formatQuantity(R, 'resistance')}`,
    result: `I_max = ${formatQuantity(iMax, 'current')} (Steady-state at 5τ = ${t5tau < 1 ? (t5tau * 1000).toFixed(2) + ' ms' : t5tau.toFixed(4) + ' s'})`,
  });

  // Curve points
  const curvePoints: Array<{ t: number; tRel: number; iGrowth: number; iDecay: number; pctGrowth: number }> = [];
  const numPoints = 50;
  for (let i = 0; i <= numPoints; i++) {
    const tRel = (i / numPoints) * 5.5;
    const t = tRel * tau;
    const expFactor = Math.exp(-tRel);
    const iGrowth = iMax * (1 - expFactor);
    const iDecay = iMax * expFactor;
    curvePoints.push({
      t,
      tRel,
      iGrowth,
      iDecay,
      pctGrowth: (1 - expFactor) * 100,
    });
  }

  const storedEnergy = 0.5 * L * iMax * iMax;

  if (iMax > 1.0) {
    warnings.push({
      severity: 'warning',
      title: 'High Steady-State Inductor Current',
      message: `Continuous current reaches ${formatQuantity(iMax, 'current')}. Verify inductor saturation current rating (I_sat) and thermal rating (I_rms).`,
    });
  }

  return {
    primaryValue: tau,
    formattedValue: `${tau < 1e-3 ? (tau * 1e6).toFixed(2) + ' µs' : tau < 1 ? (tau * 1000).toFixed(2) + ' ms' : tau.toFixed(4) + ' s'}`,
    unit: 's',
    label: 'RL Time Constant (τ)',
    warnings,
    steps,
    additionalOutputs: {
      iMax: {
        label: 'Maximum Steady-State Current',
        value: formatQuantity(iMax, 'current'),
        unit: 'A',
      },
      t63: {
        label: '63.2% Current Growth Time',
        value: `${t63 < 1 ? (t63 * 1000).toFixed(3) + ' ms' : t63.toFixed(4) + ' s'}`,
        unit: 's',
      },
      t90: {
        label: '90% Current Growth Time',
        value: `${t90 < 1 ? (t90 * 1000).toFixed(3) + ' ms' : t90.toFixed(4) + ' s'}`,
        unit: 's',
      },
      t95: {
        label: '95% Current Growth Time',
        value: `${t95 < 1 ? (t95 * 1000).toFixed(3) + ' ms' : t95.toFixed(4) + ' s'}`,
        unit: 's',
      },
      t99: {
        label: '99% Current Growth Time',
        value: `${t99 < 1 ? (t99 * 1000).toFixed(3) + ' ms' : t99.toFixed(4) + ' s'}`,
        unit: 's',
      },
      storedEnergy: {
        label: 'Maximum Magnetic Energy',
        value: storedEnergy >= 1 ? `${storedEnergy.toFixed(3)} J` : `${(storedEnergy * 1000).toFixed(3)} mJ`,
        unit: 'J',
      },
    },
    visualData: {
      tau,
      stepVoltage: V0,
      resistance: R,
      inductance: L,
      iMax,
      curvePoints,
      markers: {
        t63: { t: t63, i: iMax * 0.632, label: '63.2% (1.0τ)' },
        t90: { t: t90, i: iMax * 0.90, label: '90% (2.3τ)' },
        t95: { t: t95, i: iMax * 0.95, label: '95% (3.0τ)' },
        t99: { t: t99, i: iMax * 0.99, label: '99% (4.6τ)' },
        t5tau: { t: t5tau, i: iMax * 0.993, label: '5τ Steady Current' },
      },
    },
  };
}
