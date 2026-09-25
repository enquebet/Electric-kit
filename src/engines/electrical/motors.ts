import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { getInstallationContextWarning } from '../../lib/standards/standards-profile';

export interface MotorSpeedSlipInputs {
  frequencyHz: number;
  poles: number; // 2, 4, 6, 8, etc.
  rotorSpeedRpm?: number;
}

export function calculateMotorSpeedSlip(inputs: MotorSpeedSlipInputs): CalculationResult {
  const { frequencyHz, poles, rotorSpeedRpm } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (poles <= 0 || poles % 2 !== 0) {
    warnings.push({
      severity: 'danger',
      title: 'Invalid Number of Magnetic Poles',
      message: 'Induction motor poles must be an even positive integer (2, 4, 6, 8, etc.).',
    });
  }

  const safePoles = Math.max(Math.round(poles / 2) * 2, 2);
  // Synchronous speed Ns = 120 * f / poles
  const syncSpeedRpm = (120 * frequencyHz) / safePoles;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Stator Rotating Magnetic Field Synchronous Speed (N_s)',
    formula: 'N_s = (120 × f) / Poles',
    substitution: `(120 × ${frequencyHz} Hz) / ${safePoles}`,
    result: `N_s = ${syncSpeedRpm.toFixed(0)} RPM`,
  });

  let slipPercent = 0;
  let rotorFreqHz = 0;
  const actualRotorRpm = rotorSpeedRpm !== undefined ? rotorSpeedRpm : syncSpeedRpm * 0.96; // default 4% slip

  if (actualRotorRpm > syncSpeedRpm) {
    warnings.push({
      severity: 'warning',
      title: 'Induction Generator Operation',
      message: `Rotor speed (${actualRotorRpm} RPM) exceeds synchronous speed (${syncSpeedRpm} RPM). The machine is acting as an induction generator and pushing power back into the grid.`,
    });
  }

  // Slip s = (Ns - Nr) / Ns * 100%
  slipPercent = ((syncSpeedRpm - actualRotorRpm) / syncSpeedRpm) * 100;
  rotorFreqHz = (Math.abs(slipPercent) / 100) * frequencyHz;

  steps.push({
    stepNumber: 2,
    title: 'Calculate Induction Rotor Slip Percentage & Induced Frequency',
    formula: 's = [(N_s - N_r) / N_s] × 100%;   f_rotor = s × f_grid',
    substitution: `[(${syncSpeedRpm.toFixed(0)} - ${actualRotorRpm.toFixed(0)}) / ${syncSpeedRpm.toFixed(0)}] × 100%`,
    result: `Slip s = ${slipPercent.toFixed(2)}%,  Rotor Induced Frequency = ${rotorFreqHz.toFixed(2)} Hz`,
  });

  return {
    primaryValue: syncSpeedRpm,
    formattedValue: `${syncSpeedRpm.toFixed(0)} RPM`,
    unit: 'rpm',
    label: 'Synchronous Stator Speed (N_s)',
    classification: 'THEORETICAL',
    standardsContext: 'Fundamental synchronous speed equation for AC induction and synchronous machinery (IEC 60034 / NEMA MG 1).',
    warnings,
    steps,
    additionalOutputs: {
      syncSpeed: { label: 'Synchronous Speed (N_s)', value: `${syncSpeedRpm.toFixed(0)} RPM` },
      rotorSpeed: { label: 'Rated Rotor Speed (N_r)', value: `${actualRotorRpm.toFixed(0)} RPM` },
      slipPercent: { label: 'Slip Percentage (s)', value: `${slipPercent.toFixed(2)}%` },
      rotorFrequency: { label: 'Rotor Induced Frequency (f_r)', value: `${rotorFreqHz.toFixed(2)} Hz` },
      angularVelocity: { label: 'Rotor Angular Velocity (ω)', value: `${((actualRotorRpm * 2 * Math.PI) / 60).toFixed(1)} rad/s` },
    },
    visualData: {
      syncSpeedRpm,
      actualRotorRpm,
      slipPercent,
      frequencyHz,
      poles: safePoles,
    },
  };
}

export interface MotorPowerTorqueInputs {
  powerWatts?: number;
  torqueNm?: number;
  speedRpm: number;
}

export function calculateMotorPowerTorque(inputs: MotorPowerTorqueInputs): CalculationResult {
  const { powerWatts: P, torqueNm: T, speedRpm: N } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeN = Math.max(N, 1e-3);
  const omega = (2 * Math.PI * safeN) / 60; // rad/s

  let pCalc = P ?? 0;
  let tCalc = T ?? 0;

  if (P !== undefined) {
    // Torque T = P / omega
    tCalc = P / omega;
    steps.push({
      stepNumber: 1,
      title: 'Calculate Angular Velocity from Shaft Speed',
      formula: 'ω = (2π × N) / 60',
      substitution: `(2π × ${safeN} RPM) / 60`,
      result: `ω = ${omega.toFixed(2)} rad/s`,
    });
    steps.push({
      stepNumber: 2,
      title: 'Calculate Shaft Mechanical Output Torque',
      formula: 'T = P / ω = (60 × P) / (2π × N) ≈ 9.549 × (P / N)',
      substitution: `${P} W / ${omega.toFixed(2)} rad/s`,
      result: `T = ${tCalc.toFixed(2)} N·m (${(tCalc * 0.737562).toFixed(2)} lb·ft)`,
    });
  } else if (T !== undefined) {
    pCalc = T * omega;
    steps.push({
      stepNumber: 1,
      title: 'Calculate Shaft Mechanical Output Power',
      formula: 'P = T × ω = T × [(2π × N) / 60]',
      substitution: `${T} N·m × ${omega.toFixed(2)} rad/s`,
      result: `P = ${formatQuantity(pCalc, 'power')} (${(pCalc / 745.699872).toFixed(2)} HP)`,
    });
  } else {
    warnings.push({
      severity: 'warning',
      title: 'Missing Parameter',
      message: 'Provide either Power or Torque along with shaft RPM.',
    });
  }

  const hp = pCalc / 745.699872;

  return {
    primaryValue: P !== undefined ? tCalc : pCalc,
    formattedValue: P !== undefined ? `${tCalc.toFixed(2)} N·m` : formatQuantity(pCalc, 'power'),
    unit: P !== undefined ? 'N·m' : 'W',
    label: P !== undefined ? 'Motor Output Torque (T)' : 'Motor Output Power (P)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      powerKw: { label: 'Mechanical Power (kW)', value: `${(pCalc / 1000).toFixed(3)} kW` },
      powerHp: { label: 'Mechanical Power (Horsepower)', value: `${hp.toFixed(2)} HP` },
      torqueNm: { label: 'Shaft Torque (N·m)', value: `${tCalc.toFixed(2)} N·m` },
      torqueLbFt: { label: 'Shaft Torque (lb-ft)', value: `${(tCalc * 0.737562).toFixed(2)} lb·ft` },
      shaftSpeed: { label: 'Shaft Speed', value: `${safeN} RPM` },
      angularSpeed: { label: 'Angular Speed', value: `${omega.toFixed(2)} rad/s` },
    },
    visualData: {
      powerWatts: pCalc,
      torqueNm: tCalc,
      speedRpm: safeN,
      omega,
    },
  };
}

export interface MotorCurrentInputs {
  circuitType: 'single-phase' | 'three-phase';
  mechanicalPowerWatts: number; // Shaft power (P_mech)
  voltageV: number; // V_rms for 1-phase, V_LL for 3-phase
  efficiencyPercent: number; // e.g. 88%
  powerFactor: number; // e.g. 0.85
}

export function calculateMotorCurrent(inputs: MotorCurrentInputs): CalculationResult {
  const {
    circuitType,
    mechanicalPowerWatts: P_mech,
    voltageV: V,
    efficiencyPercent: etaPct,
    powerFactor: pf,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const eta = Math.min(Math.max(etaPct / 100, 0.1), 1.0);
  const cosPhi = Math.min(Math.max(pf, 0.1), 1.0);

  // Electrical input power Pin = P_mech / eta
  const pInElectricalW = P_mech / eta;

  let currentA = 0;
  if (circuitType === 'three-phase') {
    // 3-Phase: I = P_mech / (sqrt(3) * V_L * PF * eta) = P_in / (sqrt(3) * V_L * PF)
    currentA = pInElectricalW / (Math.sqrt(3) * V * cosPhi);
    steps.push({
      stepNumber: 1,
      title: 'Calculate 3-Phase Motor Full-Load Electrical Current (FLA)',
      formula: 'I_FLA = P_mech / (√3 × V_L × PF × η)',
      substitution: `${P_mech} W / (1.732 × ${V} V × ${cosPhi.toFixed(2)} × ${eta.toFixed(2)})`,
      result: `I_FLA = ${currentA.toFixed(2)} A`,
    });
  } else {
    // Single Phase: I = P_mech / (V * PF * eta)
    currentA = pInElectricalW / (V * cosPhi);
    steps.push({
      stepNumber: 1,
      title: 'Calculate Single-Phase Motor Full-Load Current (FLA)',
      formula: 'I_FLA = P_mech / (V × PF × η)',
      substitution: `${P_mech} W / (${V} V × ${cosPhi.toFixed(2)} × ${eta.toFixed(2)})`,
      result: `I_FLA = ${currentA.toFixed(2)} A`,
    });
  }

  // Estimated Direct-On-Line (DOL) starting inrush: ~6x full load
  const startingCurrentDolA = currentA * 6.0;

  steps.push({
    stepNumber: 2,
    title: 'Estimate Direct-On-Line (DOL) Starting Inrush Current',
    formula: 'I_start ≈ 6 × I_FLA',
    substitution: `6 × ${currentA.toFixed(2)} A`,
    result: `I_start ≈ ${startingCurrentDolA.toFixed(1)} A inrush`,
  });

  warnings.push(getInstallationContextWarning('Motor Electrical Sizing', [
    'motor thermal overload relay setting (typically set to 1.0 × FLA or 1.15 × FLA depending on service factor SF)',
    'branch circuit short-circuit and ground-fault protective device (NEC Article 430 Part IV / IEC 60947-4-1)',
    'starting inrush voltage drop impact on neighboring equipment',
    'soft-starter or VFD harmonics if variable speed drive is utilized',
  ]));

  return {
    primaryValue: currentA,
    formattedValue: `${currentA.toFixed(2)} A`,
    unit: 'A',
    label: 'Full-Load Motor Current (I_FLA)',
    classification: 'STANDARDS-DEPENDENT',
    standardsContext: 'Calculated full-load amperes (FLA) based on nameplate mechanical rating, efficiency class (IE1/IE2/IE3/IE4), and operating power factor. Consult motor nameplate and NEC Table 430.250 / IEC 60034-1 for branch circuit conductor sizing.',
    warnings,
    steps,
    additionalOutputs: {
      fullLoadCurrent: { label: 'Full Load Current (FLA)', value: `${currentA.toFixed(2)} A` },
      electricalInputPower: { label: 'Electrical Input Power (P_in)', value: `${(pInElectricalW / 1000).toFixed(2)} kW` },
      mechanicalOutputPower: { label: 'Shaft Output Power (P_out)', value: `${(P_mech / 1000).toFixed(2)} kW (${(P_mech / 745.7).toFixed(1)} HP)` },
      estimatedInrushCurrent: { label: 'Estimated DOL Inrush (LRA)', value: `${startingCurrentDolA.toFixed(0)} A (~6× FLA)` },
      thermalLosses: { label: 'Motor Heat Dissipation', value: `${((pInElectricalW - P_mech) / 1000).toFixed(2)} kW` },
    },
    visualData: {
      currentA,
      startingCurrentDolA,
      pInElectricalW,
      P_mech,
      circuitType,
    },
  };
}

export function calculateMotorFla(inputs: {
  ratedPowerKw: number;
  voltageV: number;
  powerFactor: number;
  efficiencyPercent: number;
  phases?: number;
}): CalculationResult {
  const { ratedPowerKw, voltageV, powerFactor, efficiencyPercent, phases = 3 } = inputs;
  return calculateMotorCurrent({
    circuitType: phases === 1 ? 'single-phase' : 'three-phase',
    mechanicalPowerWatts: ratedPowerKw * 1000,
    voltageV,
    efficiencyPercent,
    powerFactor,
  });
}

export function calculateMotorSlip(inputs: {
  supplyFrequencyHz: number;
  polePairs: number;
  measuredRpm: number;
}): CalculationResult {
  const { supplyFrequencyHz, polePairs, measuredRpm } = inputs;
  const poles = polePairs * 2;
  const syncSpeedRpm = (120 * supplyFrequencyHz) / poles;
  const slipPercent = ((syncSpeedRpm - measuredRpm) / syncSpeedRpm) * 100;
  const rotorFreq = (slipPercent / 100) * supplyFrequencyHz;

  return {
    primaryValue: slipPercent,
    formattedValue: `${slipPercent.toFixed(2)}%`,
    unit: '%',
    label: 'Induction Motor Slip (s)',
    classification: 'THEORETICAL',
    warnings: [],
    steps: [
      {
        stepNumber: 1,
        title: 'Calculate Synchronous Speed',
        formula: 'N_s = (120 × f) / Poles',
        substitution: `(120 × ${supplyFrequencyHz} Hz) / ${poles}`,
        result: `N_s = ${syncSpeedRpm.toFixed(0)} RPM`,
      },
      {
        stepNumber: 2,
        title: 'Calculate Slip Percentage',
        formula: 's = [(N_s - N_r) / N_s] × 100%',
        substitution: `[(${syncSpeedRpm.toFixed(0)} - ${measuredRpm}) / ${syncSpeedRpm.toFixed(0)}] × 100%`,
        result: `s = ${slipPercent.toFixed(2)}%`,
      },
    ],
    additionalOutputs: {
      syncSpeed: { label: 'Synchronous Speed', value: `${syncSpeedRpm.toFixed(0)} RPM` },
      slipPercent: { label: 'Slip Percentage', value: `${slipPercent.toFixed(2)}%` },
      rotorFrequency: { label: 'Rotor Frequency', value: `${rotorFreq.toFixed(2)} Hz` },
    },
  };
}

export function calculateMotorShaftTorque(inputs: {
  ratedPowerKw: number;
  ratedSpeedRpm: number;
}): CalculationResult {
  const { ratedPowerKw, ratedSpeedRpm } = inputs;
  return calculateMotorPowerTorque({
    powerWatts: ratedPowerKw * 1000,
    speedRpm: ratedSpeedRpm,
  });
}

export function calculateMotorStartingCurrent(inputs: {
  flaAmperes: number;
  startingMethod?: 'direct-on-line' | 'star-delta' | 'soft-starter' | 'vfd';
}): CalculationResult {
  const { flaAmperes, startingMethod = 'direct-on-line' } = inputs;
  let multiplier = 6.0;
  if (startingMethod === 'star-delta') multiplier = 2.0;
  if (startingMethod === 'soft-starter') multiplier = 3.0;
  if (startingMethod === 'vfd') multiplier = 1.1;

  const inrushCurrentA = flaAmperes * multiplier;

  return {
    primaryValue: inrushCurrentA,
    formattedValue: `${inrushCurrentA.toFixed(1)} A`,
    unit: 'A',
    label: 'Locked Rotor Inrush Current',
    classification: 'ENGINEERING ESTIMATE',
    warnings: [],
    steps: [
      {
        stepNumber: 1,
        title: 'Apply Inrush Starting Multiplier',
        formula: 'I_start = I_FLA × k_start',
        substitution: `${flaAmperes.toFixed(1)} A × ${multiplier} (${startingMethod})`,
        result: `I_start = ${inrushCurrentA.toFixed(1)} A`,
      },
    ],
    additionalOutputs: {
      startingAmperes: { label: 'Starting Current', value: `${inrushCurrentA.toFixed(1)} A` },
      inrushRatio: { label: 'Inrush Ratio', value: `${multiplier.toFixed(1)} × FLA` },
    },
  };
}
