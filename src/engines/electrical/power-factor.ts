import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';

export interface PowerFactorInputs {
  activePowerW?: number;
  reactivePowerVar?: number;
  apparentPowerVa?: number;
  phaseAngleDeg?: number;
}

export function calculatePowerFactorRelations(inputs: PowerFactorInputs): CalculationResult {
  const { activePowerW: P, reactivePowerVar: Q, apparentPowerVa: S, phaseAngleDeg: theta } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let p = P;
  let q = Q;
  let s = S;
  let th = theta;

  if (p !== undefined && s !== undefined) {
    if (s < p) {
      warnings.push({
        severity: 'danger',
        title: 'Physical Inconsistency: S < P',
        message: 'Apparent power S cannot be less than real active power P.',
      });
      s = p;
    }
    q = Math.sqrt(Math.max(s * s - p * p, 0));
    th = (Math.acos(s > 0 ? p / s : 1) * 180) / Math.PI;
  } else if (p !== undefined && q !== undefined) {
    s = Math.sqrt(p * p + q * q);
    th = (Math.atan2(q, p) * 180) / Math.PI;
  } else if (p !== undefined && th !== undefined) {
    const rad = (th * Math.PI) / 180;
    const pf = Math.cos(rad);
    s = pf !== 0 ? p / Math.abs(pf) : p;
    q = s * Math.sin(rad);
  } else if (q !== undefined && s !== undefined) {
    p = Math.sqrt(Math.max(s * s - q * q, 0));
    th = (Math.asin(s > 0 ? q / s : 0) * 180) / Math.PI;
  } else {
    warnings.push({
      severity: 'warning',
      title: 'Insufficient Data',
      message: 'Please provide at least two parameters among P, Q, S, or phase angle θ.',
    });
    p = 1000;
    s = 1250;
    q = 750;
    th = 36.87;
  }

  const pSafe = p ?? 0;
  const sSafe = s ?? 1;
  const qSafe = q ?? 0;
  const pf = sSafe > 0 ? pSafe / sSafe : 1.0;
  const thSafe = th ?? 0;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Power Factor & Phase Displacement',
    formula: 'PF = cos(θ) = P / S',
    substitution: `${formatQuantity(pSafe, 'power')} / ${formatQuantity(sSafe, 'apparent_power')}`,
    result: `PF = ${pf.toFixed(3)},  Phase Angle θ = ${thSafe.toFixed(2)}°`,
  });

  return {
    primaryValue: pf,
    formattedValue: pf.toFixed(3),
    unit: '',
    label: 'Power Factor (cos θ)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      activePower: { label: 'Active Power (P)', value: formatQuantity(pSafe, 'power') },
      apparentPower: { label: 'Apparent Power (S)', value: formatQuantity(sSafe, 'apparent_power') },
      reactivePower: { label: 'Reactive Power (Q)', value: formatQuantity(qSafe, 'reactive_power') },
      phaseAngle: { label: 'Phase Angle (θ)', value: `${thSafe.toFixed(2)}°` },
    },
    visualData: {
      P: pSafe,
      Q: qSafe,
      S: sSafe,
      pf,
      theta: thSafe,
    },
  };
}

export const calculatePowerFactor = calculatePowerFactorRelations;

export interface PfcCapacitorInputs {
  activePowerW: number;
  initialPf: number;
  targetPf: number;
  voltageV: number;
  frequencyHz?: number;
  circuitType?: 'single-phase' | 'three-phase';
}

export function calculatePfcCapacitor(inputs: PfcCapacitorInputs): CalculationResult {
  const {
    activePowerW,
    initialPf,
    targetPf,
    voltageV,
    frequencyHz = 50,
    circuitType = 'three-phase',
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const P_kW = activePowerW / 1000;
  const pf1 = Math.min(Math.max(initialPf, 0.1), 0.999);
  const pf2 = Math.min(Math.max(targetPf, pf1), 1.0);

  const theta1 = Math.acos(pf1);
  const theta2 = Math.acos(pf2);

  // Q_c = P * (tan(theta1) - tan(theta2))
  const qcVar = Math.max(activePowerW * (Math.tan(theta1) - Math.tan(theta2)), 0);
  const qcKvar = qcVar / 1000;

  const is3P = circuitType === 'three-phase';
  const omega = 2 * Math.PI * frequencyHz;
  const safeV = Math.max(voltageV, 1);

  // Capacitance in microfarads
  // For 3-phase delta bank: C_delta = Q_c / (3 * omega * V_LL^2)
  // For 1-phase: C = Q_c / (omega * V^2)
  const capFarads = is3P
    ? qcVar / (3 * omega * safeV * safeV)
    : qcVar / (omega * safeV * safeV);
  const capMicroFarads = capFarads * 1e6;

  const S1_kVA = P_kW / pf1;
  const S2_kVA = P_kW / pf2;

  const I1 = is3P
    ? activePowerW / (Math.sqrt(3) * safeV * pf1)
    : activePowerW / (safeV * pf1);
  const I2 = is3P
    ? activePowerW / (Math.sqrt(3) * safeV * pf2)
    : activePowerW / (safeV * pf2);
  const currentReliefA = Math.max(I1 - I2, 0);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Reactive Power Compensation (Q_c)',
    formula: 'Q_c = P × [tan(θ₁) - tan(θ₂)]',
    substitution: `${P_kW.toFixed(1)} kW × [tan(arccos(${pf1.toFixed(2)})) - tan(arccos(${pf2.toFixed(2)}))]`,
    result: `Q_c = ${qcKvar.toFixed(2)} kVAR`,
  });

  return {
    primaryValue: qcKvar,
    formattedValue: `${qcKvar.toFixed(2)} kVAR`,
    unit: 'kVAR',
    label: 'Required Capacitor Bank (Q_c)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      requiredKvar: { label: 'Capacitor Rating', value: `${qcKvar.toFixed(2)} kVAR` },
      requiredCapacitance: { label: 'Per-Phase Capacitance', value: `${capMicroFarads.toFixed(1)} µF` },
      initialApparentPower: { label: 'Before Correction Demand', value: `${S1_kVA.toFixed(1)} kVA` },
      targetApparentPower: { label: 'After Correction Demand', value: `${S2_kVA.toFixed(1)} kVA` },
      currentReduction: { label: 'Line Current Relief', value: `${currentReliefA.toFixed(1)} A (${((currentReliefA / I1) * 100).toFixed(1)}%)` },
    },
    visualData: {
      qcKvar,
      capMicroFarads,
      S1_kVA,
      S2_kVA,
    },
  };
}

export interface PfcSavingsInputs {
  loadPowerKw?: number;
  activePowerW?: number;
  initialPf: number;
  targetPf: number;
  voltageV?: number;
  systemVoltageV?: number;
  isThreePhase?: boolean;
  circuitType?: 'single-phase' | 'three-phase';
  feederResistanceOhms?: number;
  operatingHoursPerYear?: number;
  electricityTariffPerKwh?: number;
  tariffPerKwh?: number;
  penaltyPerMonth?: number;
}

export function calculatePfcSavings(inputs: PfcSavingsInputs): CalculationResult {
  const loadPowerKw = inputs.loadPowerKw ?? (inputs.activePowerW ? inputs.activePowerW / 1000 : 50);
  const initialPf = inputs.initialPf;
  const targetPf = inputs.targetPf;
  const systemVoltageV = inputs.voltageV ?? inputs.systemVoltageV ?? 400;
  const isThreePhase = inputs.isThreePhase ?? (inputs.circuitType === 'three-phase' || !inputs.circuitType);
  const cableR = inputs.feederResistanceOhms ?? 0.05;
  const hoursPerYear = inputs.operatingHoursPerYear ?? 3500;
  const tariff = inputs.electricityTariffPerKwh ?? inputs.tariffPerKwh ?? 0.16;
  const penaltyPerMonth = inputs.penaltyPerMonth ?? 0;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const P_W = loadPowerKw * 1000;
  const pf1 = Math.min(Math.max(initialPf, 0.1), 0.999);
  const pf2 = Math.min(Math.max(targetPf, pf1), 1.0);

  const denom1 = isThreePhase ? Math.sqrt(3) * systemVoltageV * pf1 : systemVoltageV * pf1;
  const denom2 = isThreePhase ? Math.sqrt(3) * systemVoltageV * pf2 : systemVoltageV * pf2;

  const I1 = denom1 > 0 ? P_W / denom1 : 0;
  const I2 = denom2 > 0 ? P_W / denom2 : 0;

  const currentReductionA = Math.max(I1 - I2, 0);
  const currentReductionPct = I1 > 0 ? (currentReductionA / I1) * 100 : 0;

  // I^2*R loss reduction on feeder cables: (I2/I1)^2
  const cableLossReductionPct = (1 - Math.pow(I2 / Math.max(I1, 1e-6), 2)) * 100;

  // Thermal loss difference in Watts = (multiplier) * (I1^2 - I2^2) * R
  const multiplier = isThreePhase ? 3 : 2;
  const lossDeltaWatts = multiplier * Math.max(I1 * I1 - I2 * I2, 0) * cableR;
  const annualEnergySavedKwh = (lossDeltaWatts * hoursPerYear) / 1000;
  const annualBillSavings = annualEnergySavedKwh * tariff;

  // Apparent power reduction
  const S1_kVA = loadPowerKw / pf1;
  const S2_kVA = loadPowerKw / pf2;
  const releasedKva = S1_kVA - S2_kVA;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Feeder Line Current Reduction',
    formula: isThreePhase ? 'I = P / (√3 × V × PF)' : 'I = P / (V × PF)',
    substitution: `Initial I₁ = ${I1.toFixed(1)} A (PF ${pf1.toFixed(2)}) → Corrected I₂ = ${I2.toFixed(1)} A (PF ${pf2.toFixed(2)})`,
    result: `ΔI = ${currentReductionA.toFixed(1)} A current relief (${currentReductionPct.toFixed(1)}% reduction)`,
  });

  return {
    primaryValue: annualBillSavings,
    formattedValue: `$${annualBillSavings.toFixed(2)} / yr`,
    unit: '$/yr',
    label: 'Annual Feeder Thermal Savings',
    classification: 'THEORETICAL',
    standardsContext: 'Real work (active kWh) billed on basic flat tariffs does not automatically decrease when PF improves, because equipment still consumes the same mechanical/thermal wattage. However, improving PF removes low-PF penalty surcharges, recovers substation kVA head-room, and reduces I²R cable heating.',
    warnings,
    steps,
    additionalOutputs: {
      initialCurrent: { label: 'Initial Feeder Current', value: `${I1.toFixed(1)} A` },
      improvedCurrent: { label: 'Compensated Feeder Current', value: `${I2.toFixed(1)} A` },
      currentReductionPercent: { label: 'Current Reduction', value: `${currentReductionPct.toFixed(1)}%` },
      cableLossReductionPercent: { label: 'Feeder I²R Loss Reduction', value: `${cableLossReductionPct.toFixed(1)}%` },
      kvaCapacityReleased: { label: 'Released Upstream Capacity', value: `${releasedKva.toFixed(1)} kVA` },
      annualEnergySavedKwh: { label: 'Annual Energy Saved', value: `${annualEnergySavedKwh.toFixed(1)} kWh` },
      annualFinancialSavings: { label: 'Annual Cable Thermal Savings', value: `$${annualBillSavings.toFixed(2)}/yr` },
    },
    visualData: {
      I1,
      I2,
      S1_kVA,
      S2_kVA,
      releasedKva,
      currentReductionPct,
    },
  };
}
