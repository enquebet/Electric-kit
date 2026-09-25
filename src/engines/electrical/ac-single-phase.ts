import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { checkVoltageSafety, checkCurrentSafety } from '../../lib/safety/disclaimers';

export interface SinglePhaseCurrentInputs {
  mode: 'real-power' | 'apparent-power';
  voltageRms: number; // Volts RMS
  powerValue: number; // Watts if real-power mode, VA if apparent-power mode
  powerFactor?: number; // 0.0 to 1.0 (used if real-power mode)
}

export function calculateSinglePhaseCurrent(inputs: SinglePhaseCurrentInputs): CalculationResult {
  const { mode, voltageRms: V, powerValue, powerFactor = 1.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (V <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Zero or Negative RMS Voltage',
      message: 'AC RMS voltage must be greater than zero.',
    });
  }

  const safeV = Math.max(V, 1e-6);
  const pf = Math.min(Math.max(powerFactor, 0.01), 1.0);

  let currentA = 0;
  let apparentPowerVa = 0;
  let activePowerW = 0;

  if (mode === 'apparent-power') {
    apparentPowerVa = powerValue;
    activePowerW = powerValue * pf;
    currentA = apparentPowerVa / safeV;

    steps.push({
      stepNumber: 1,
      title: 'Calculate AC Current from Apparent Power',
      formula: 'I = S / V',
      substitution: `${powerValue} VA / ${V} V`,
      result: `${currentA.toFixed(3)} A`,
    });
  } else {
    activePowerW = powerValue;
    apparentPowerVa = activePowerW / pf;
    currentA = activePowerW / (safeV * pf);

    steps.push({
      stepNumber: 1,
      title: 'Calculate AC Line Current with Power Factor',
      formula: 'I = P / (V × PF)',
      substitution: `${activePowerW} W / (${V} V × ${pf.toFixed(3)})`,
      result: `${currentA.toFixed(3)} A`,
    });
  }

  const vWarn = checkVoltageSafety(V, true);
  if (vWarn) warnings.push(vWarn);
  const iWarn = checkCurrentSafety(currentA);
  if (iWarn) warnings.push(iWarn);

  return {
    primaryValue: currentA,
    formattedValue: `${currentA.toFixed(2)} A`,
    unit: 'A',
    label: 'Single-Phase AC Current (I_rms)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      activePower: { label: 'Real Active Power (P)', value: formatQuantity(activePowerW, 'power') },
      apparentPower: { label: 'Apparent Power (S)', value: formatQuantity(apparentPowerVa, 'apparent_power') },
      powerFactor: { label: 'Power Factor', value: pf.toFixed(3) },
      voltage: { label: 'Nominal RMS Voltage', value: `${V} V` },
    },
  };
}

export interface PowerTriangleInputs {
  activePowerW: number;
  apparentPowerVa?: number;
  reactivePowerVar?: number;
  powerFactor?: number;
  pfType: 'lagging' | 'leading';
}

export function calculatePowerTriangle(inputs: PowerTriangleInputs): CalculationResult {
  const { activePowerW: P, apparentPowerVa: Sin, reactivePowerVar: Qin, powerFactor: PFin, pfType } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let P_val = Math.max(P, 0);
  let S_val = 0;
  let Q_val = 0;
  let pf = 1.0;
  let phiDeg = 0;

  if (Sin !== undefined && Sin >= P_val) {
    S_val = Sin;
    pf = S_val > 0 ? P_val / S_val : 1.0;
    Q_val = Math.sqrt(Math.max(S_val * S_val - P_val * P_val, 0));
    phiDeg = (Math.acos(Math.min(pf, 1.0)) * 180) / Math.PI;
  } else if (Qin !== undefined) {
    Q_val = Math.abs(Qin);
    S_val = Math.sqrt(P_val * P_val + Q_val * Q_val);
    pf = S_val > 0 ? P_val / S_val : 1.0;
    phiDeg = (Math.atan2(Q_val, P_val) * 180) / Math.PI;
  } else if (PFin !== undefined) {
    pf = Math.min(Math.max(PFin, 0.01), 1.0);
    S_val = P_val / pf;
    phiDeg = (Math.acos(pf) * 180) / Math.PI;
    Q_val = S_val * Math.sin((phiDeg * Math.PI) / 180);
  } else {
    // Default unity PF
    S_val = P_val;
    Q_val = 0;
    pf = 1.0;
    phiDeg = 0;
  }

  steps.push({
    stepNumber: 1,
    title: 'Calculate Apparent Power Hypotenuse (S = √(P² + Q²))',
    formula: 'S = √(P² + Q²)',
    substitution: `√[(${P_val} W)² + (${Q_val.toFixed(1)} VAR)²]`,
    result: `${formatQuantity(S_val, 'apparent_power')}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Power Factor & Phase Angle (φ)',
    formula: 'PF = cos(φ) = P / S;   φ = arccos(P / S)',
    substitution: `${P_val} W / ${formatQuantity(S_val, 'apparent_power')}`,
    result: `PF = ${pf.toFixed(3)} (${pfType}),  φ = ${phiDeg.toFixed(2)}°`,
  });

  return {
    primaryValue: S_val,
    formattedValue: formatQuantity(S_val, 'apparent_power'),
    unit: 'VA',
    label: 'Apparent Power (S)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      activePower: { label: 'Active Power (P)', value: formatQuantity(P_val, 'power'), note: 'Real work performed' },
      reactivePower: { label: 'Reactive Power (Q)', value: formatQuantity(Q_val, 'reactive_power'), note: `${pfType.toUpperCase()} (field exchange)` },
      powerFactor: { label: 'Power Factor (cos φ)', value: `${pf.toFixed(3)} (${pfType})` },
      phaseAngle: { label: 'Phase Angle (φ)', value: `${phiDeg.toFixed(2)}°` },
    },
    visualData: {
      P: P_val,
      Q: pfType === 'leading' ? -Q_val : Q_val,
      S: S_val,
      pf,
      phiDeg,
      pfType,
    },
  };
}

export interface AcLoadItem {
  id: string;
  name: string;
  voltage: number;
  powerWatts: number;
  powerFactor: number;
  pfType: 'lagging' | 'leading';
  quantity: number;
  hoursPerDay: number;
}

export function calculateAcLoadSchedule(loads: AcLoadItem[], systemVoltage: number = 230): CalculationResult {
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let sumActiveWatts = 0;
  let sumReactiveVar = 0;
  let totalDailyKwh = 0;

  loads.forEach((item, idx) => {
    const qty = Math.max(item.quantity, 1);
    const pSub = item.powerWatts * qty;
    const pfClamped = Math.min(Math.max(item.powerFactor, 0.1), 1.0);
    const phi = Math.acos(pfClamped);
    const qMagnitude = pSub * Math.tan(phi);
    const qSigned = item.pfType === 'lagging' ? qMagnitude : -qMagnitude;

    sumActiveWatts += pSub;
    sumReactiveVar += qSigned;

    const dailyKwh = (pSub * Math.min(Math.max(item.hoursPerDay, 0), 24)) / 1000;
    totalDailyKwh += dailyKwh;

    steps.push({
      stepNumber: idx + 1,
      title: `Branch ${idx + 1}: ${item.name || 'AC Load'}`,
      formula: 'P = Qty × P_unit;   Q = P × tan(arccos(PF))',
      substitution: `${qty} × ${item.powerWatts} W = ${pSub} W;  Q = ${pSub} × tan(${((phi * 180) / Math.PI).toFixed(1)}°) = ${qMagnitude.toFixed(1)} VAR (${item.pfType})`,
      result: `P = ${pSub} W, Q = ${qMagnitude.toFixed(1)} VAR`,
    });
  });

  // Vector Apparent Power S = sqrt(sumP^2 + sumQ^2)
  const totalApparentVa = Math.sqrt(sumActiveWatts * sumActiveWatts + sumReactiveVar * sumReactiveVar);
  const netPf = totalApparentVa > 0 ? sumActiveWatts / totalApparentVa : 1.0;
  const netPfType = sumReactiveVar >= 0 ? 'lagging' : 'leading';
  const totalCurrentA = systemVoltage > 0 ? totalApparentVa / systemVoltage : 0;

  steps.push({
    stepNumber: loads.length + 1,
    title: 'Vector Aggregation of AC Loads (Pythagorean Active & Reactive Sum)',
    formula: 'S_total = √[(∑P)² + (∑Q)²];   PF_net = ∑P / S_total;   I_total = S_total / V',
    substitution: `√[(${sumActiveWatts.toFixed(0)} W)² + (${sumReactiveVar.toFixed(0)} VAR)²]`,
    result: `S = ${formatQuantity(totalApparentVa, 'apparent_power')}, PF = ${netPf.toFixed(3)} (${netPfType}), I = ${totalCurrentA.toFixed(2)} A`,
  });

  return {
    primaryValue: sumActiveWatts,
    formattedValue: `${(sumActiveWatts / 1000).toFixed(2)} kW`,
    unit: 'kW',
    label: 'Total Active Load (P_total)',
    classification: 'THEORETICAL',
    standardsContext: 'Loads are summed as independent linear sinusoidal phasors under common voltage supply. Does not include harmonic distortion or diversity/coincidence factors.',
    warnings,
    steps,
    additionalOutputs: {
      totalApparentPower: { label: 'Total Apparent Power (S)', value: `${(totalApparentVa / 1000).toFixed(2)} kVA` },
      totalReactivePower: { label: 'Net Reactive Power (Q)', value: `${(Math.abs(sumReactiveVar) / 1000).toFixed(2)} kVAR (${netPfType})` },
      systemPowerFactor: { label: 'Combined Power Factor', value: `${netPf.toFixed(3)} (${netPfType})` },
      totalMainsCurrent: { label: 'Estimated Mains Current', value: `${totalCurrentA.toFixed(2)} A at ${systemVoltage} V` },
      dailyEnergy: { label: 'Daily Energy Consumption', value: `${totalDailyKwh.toFixed(2)} kWh/day` },
      monthlyEnergy: { label: 'Monthly Energy Consumption', value: `${(totalDailyKwh * 30).toFixed(1)} kWh/month` },
    },
    visualData: {
      sumActiveWatts,
      sumReactiveVar,
      totalApparentVa,
      netPf,
      totalCurrentA,
      systemVoltage,
    },
  };
}
