import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export interface IdealBuckInputs {
  inputVoltageV: number;
  outputVoltageV: number;
  outputCurrentA?: number;
  switchingFrequencyHz?: number;
}

export function calculateIdealBuck(inputs: IdealBuckInputs): CalculationResult {
  const { inputVoltageV: Vin, outputVoltageV: Vout } = inputs;
  const Iout = inputs.outputCurrentA ?? 1.0;
  const fs = inputs.switchingFrequencyHz ?? 100000;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (Vin <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Invalid Input Voltage',
      message: 'Input voltage must be strictly greater than zero for buck operation.',
    });
  }

  if (Vout >= Vin && Vin > 0) {
    warnings.push({
      severity: 'danger',
      title: 'Invalid Step-Down Ratio (Vout ≥ Vin)',
      message: `A buck converter can only step down voltage (Vout < Vin). Requested Vout (${Vout}V) is ≥ Vin (${Vin}V).`,
    });
  }

  if (Iout < 0) {
    warnings.push({
      severity: 'warning',
      title: 'Negative Output Current',
      message: 'Output current should be non-negative for standard unipolar buck converters.',
    });
  }

  const safeVin = Math.max(Vin, 1e-3);
  const dutyCycle = Math.min(Math.max(Vout / safeVin, 0), 1.0);
  const pOutWatts = Vout * Iout;
  // Ideal lossless converter: Pin = Pout -> Iin = D * Iout
  const iInIdealA = dutyCycle * Iout;
  const pInIdealWatts = Vin * iInIdealA;
  const periodUs = fs > 0 ? (1 / fs) * 1e6 : 0;
  const tOnUs = periodUs * dutyCycle;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Ideal Buck Duty Cycle (D)',
    formula: 'D = V_out / V_in',
    substitution: `${Vout} V / ${Vin} V`,
    result: `D = ${dutyCycle.toFixed(4)} (${(dutyCycle * 100).toFixed(2)}%)`,
    annotation: 'Assumes zero switch forward drop, zero diode/synchronous FET drop, and CCM steady-state.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Ideal Output & Input Power',
    formula: 'P_out = V_out × I_out;  P_in(ideal) = P_out (100% Efficiency)',
    substitution: `${Vout} V × ${Iout} A`,
    result: `P_out = ${formatQuantity(pOutWatts, 'power')}`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Average Ideal Input Current',
    formula: 'I_in(avg) = D × I_out = P_out / V_in',
    substitution: `${dutyCycle.toFixed(4)} × ${Iout} A`,
    result: `I_in(avg) = ${iInIdealA.toFixed(3)} A`,
  });

  return {
    primaryValue: dutyCycle,
    formattedValue: `${(dutyCycle * 100).toFixed(2)}%`,
    unit: '%',
    label: 'Ideal Duty Cycle (D)',
    classification: 'THEORETICAL',
    standardsContext: 'Ideal first-order volt-second balance model under Continuous Conduction Mode (CCM). Disregards conduction, switching, and magnetic losses.',
    warnings,
    steps,
    additionalOutputs: {
      dutyCycleRatio: { label: 'Duty Ratio (D)', value: dutyCycle.toFixed(4) },
      outputPower: { label: 'Output Power (P_out)', value: formatQuantity(pOutWatts, 'power') },
      inputCurrent: { label: 'Average Input Current (I_in)', value: `${iInIdealA.toFixed(3)} A` },
      idealEfficiency: { label: 'Ideal Theoretical Efficiency', value: '100.0%' },
      switchingPeriod: { label: 'Switching Period (T)', value: `${periodUs.toFixed(2)} µs` },
      onTime: { label: 'Switch On-Time (t_on)', value: `${tOnUs.toFixed(2)} µs` },
    },
    visualData: {
      dutyCycle,
      Vin,
      Vout,
      Iout,
      pOutWatts,
      iInIdealA,
      fs,
    },
  };
}

export interface BuckInductorInputs {
  inputVoltageV: number;
  outputVoltageV: number;
  outputCurrentA: number;
  switchingFrequencyHz: number;
  rippleRatioPercent: number; // e.g. 30% or 40% (ΔIL / Iout)
}

export function calculateBuckInductor(inputs: BuckInductorInputs): CalculationResult {
  const {
    inputVoltageV: Vin,
    outputVoltageV: Vout,
    outputCurrentA: Iout,
    switchingFrequencyHz: fs,
    rippleRatioPercent: rPct,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeVin = Math.max(Vin, 1e-3);
  const D = Math.min(Math.max(Vout / safeVin, 0.01), 0.99);
  const r = Math.max(rPct / 100, 0.05);

  const deltaIlAmperes = r * Math.max(Iout, 0.01);
  const safeFs = Math.max(fs, 100);

  // L = (Vin - Vout) * D / (fs * deltaIl) = Vout * (1 - D) / (fs * deltaIl)
  const requiredInductanceH = (Vout * (1 - D)) / (safeFs * deltaIlAmperes);
  const iPeakAmperes = Iout + deltaIlAmperes / 2;
  const iMinAmperes = Iout - deltaIlAmperes / 2;

  if (iMinAmperes < 0) {
    warnings.push({
      severity: 'warning',
      title: 'Discontinuous Conduction Mode (DCM) Condition',
      message: `Minimum inductor current is negative (${iMinAmperes.toFixed(2)} A). For diode-rectified bucks, current will clamp at 0 A and enter DCM. For synchronous bucks, reverse current will occur.`,
    });
  }

  if (r > 0.5) {
    warnings.push({
      severity: 'warning',
      title: 'High Current Ripple Ratio',
      message: `Inductor ripple ratio (${(r * 100).toFixed(0)}%) exceeds recommended 30-40% design rule, causing higher core losses and peak switch stress.`,
    });
  }

  steps.push({
    stepNumber: 1,
    title: 'Calculate Inductor Peak-to-Peak Ripple Current (ΔI_L)',
    formula: 'ΔI_L = r × I_out',
    substitution: `${(r * 100).toFixed(1)}% × ${Iout} A`,
    result: `ΔI_L = ${deltaIlAmperes.toFixed(3)} A`,
    annotation: 'Assuming Continuous Conduction Mode (CCM) with triangular inductor ripple current.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Required Inductance (L)',
    formula: 'L = [ V_out × (1 - D) ] / (f_s × ΔI_L)',
    substitution: `[ ${Vout} V × (1 - ${D.toFixed(3)}) ] / (${safeFs} Hz × ${deltaIlAmperes.toFixed(3)} A)`,
    result: `L = ${formatQuantity(requiredInductanceH, 'inductance')}`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Peak & Valley Inductor Currents',
    formula: 'I_peak = I_out + (ΔI_L / 2);  I_min = I_out - (ΔI_L / 2)',
    substitution: `${Iout} A ± (${deltaIlAmperes.toFixed(3)} A / 2)`,
    result: `I_peak = ${iPeakAmperes.toFixed(3)} A,  I_min = ${iMinAmperes.toFixed(3)} A`,
    annotation: 'Inductor saturation rating (I_sat) MUST exceed I_peak with at least 20-30% engineering margin.',
  });

  return {
    primaryValue: requiredInductanceH,
    formattedValue: formatQuantity(requiredInductanceH, 'inductance'),
    unit: 'H',
    label: 'Required Buck Inductance (L)',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Continuous Conduction Mode (CCM) design approximation targeting standard 20% to 40% ripple ratio.',
    warnings,
    steps,
    additionalOutputs: {
      inductanceMicroHenries: { label: 'Inductance (µH)', value: `${(requiredInductanceH * 1e6).toFixed(2)} µH` },
      rippleCurrent: { label: 'Inductor Ripple Current (ΔI_L)', value: `${deltaIlAmperes.toFixed(3)} A` },
      peakCurrent: { label: 'Peak Inductor Current (I_peak)', value: `${iPeakAmperes.toFixed(3)} A` },
      valleyCurrent: { label: 'Valley Inductor Current (I_min)', value: `${iMinAmperes.toFixed(3)} A` },
      conductionMode: { label: 'Conduction Mode', value: iMinAmperes >= 0 ? 'CCM (Continuous)' : 'DCM at light load' },
    },
    visualData: {
      requiredInductanceH,
      deltaIlAmperes,
      iPeakAmperes,
      iMinAmperes,
      Iout,
      D,
    },
  };
}

export interface BuckOutputCapacitorInputs {
  outputVoltageV?: number;
  outputCurrentA?: number;
  switchingFrequencyHz: number;
  inductorRippleCurrentA: number;
  desiredRippleVoltageV?: number;
  allowableRippleVoltageV?: number;
  capacitorEsrOhms?: number;
}

export function calculateBuckOutputCapacitor(inputs: BuckOutputCapacitorInputs): CalculationResult {
  const {
    outputVoltageV: Vout = 5.0,
    switchingFrequencyHz: fs,
    inductorRippleCurrentA: deltaIl,
    desiredRippleVoltageV,
    allowableRippleVoltageV,
    capacitorEsrOhms: esr = 0,
  } = inputs;

  const targetDeltaV = allowableRippleVoltageV ?? desiredRippleVoltageV ?? 0.05;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeFs = Math.max(fs || 100, 100);
  const safeDeltaIl = Math.max(deltaIl || 1e-4, 1e-4);
  const safeTargetV = Math.max(targetDeltaV, 1e-4);

  // Pure capacitive ripple: deltaV_c = deltaIl / (8 * fs * C)
  // ESR ripple: deltaV_esr = deltaIl * ESR
  const esrRippleV = safeDeltaIl * esr;

  if (esrRippleV >= safeTargetV) {
    warnings.push({
      severity: 'danger',
      title: 'ESR Exceeds Total Ripple Budget',
      message: `The capacitor ESR (${(esr * 1000).toFixed(1)} mΩ) alone creates ${esrRippleV.toFixed(3)} V ripple, which meets or exceeds your allowable ripple (${safeTargetV.toFixed(3)} V). Use lower-ESR ceramic caps or parallel capacitors.`,
    });
  }

  // Allocate remaining ripple budget to capacitance
  const allowedCapacitiveDeltaV = Math.max(safeTargetV - esrRippleV, safeTargetV * 0.2);
  // C = deltaIl / (8 * fs * deltaV_c)
  const requiredCapacitanceF = safeDeltaIl / (8 * safeFs * allowedCapacitiveDeltaV);
  // Capacitor RMS ripple current in CCM buck: Irms = deltaIl / sqrt(12)
  const capRmsCurrentA = safeDeltaIl / Math.sqrt(12);

  steps.push({
    stepNumber: 1,
    title: 'Analyze ESR and Capacitive Voltage Ripple Breakdown',
    formula: 'ΔV_ESR = ΔI_L × ESR;  ΔV_C = ΔV_total - ΔV_ESR',
    substitution: `${safeDeltaIl.toFixed(3)} A × ${(esr * 1000).toFixed(1)} mΩ = ${esrRippleV.toFixed(3)} V ESR ripple`,
    result: `Capacitive budget ΔV_C = ${allowedCapacitiveDeltaV.toFixed(3)} V`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Minimum Output Capacitance (C_out)',
    formula: 'C_out = ΔI_L / (8 × f_s × ΔV_C)',
    substitution: `${safeDeltaIl.toFixed(3)} A / (8 × ${safeFs} Hz × ${allowedCapacitiveDeltaV.toFixed(3)} V)`,
    result: `C_out = ${formatQuantity(requiredCapacitanceF, 'capacitance')}`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Output Capacitor RMS Ripple Current Rating',
    formula: 'I_C,rms = ΔI_L / √12 ≈ 0.289 × ΔI_L',
    substitution: `${safeDeltaIl.toFixed(3)} A / √12`,
    result: `I_C,rms = ${capRmsCurrentA.toFixed(3)} A`,
    annotation: 'Ensure selected capacitor ripple current rating at operating temperature exceeds this value.',
  });

  return {
    primaryValue: requiredCapacitanceF,
    formattedValue: formatQuantity(requiredCapacitanceF, 'capacitance'),
    unit: 'F',
    label: 'Required Output Capacitance (C_out)',
    classification: 'ENGINEERING ESTIMATE',
    warnings,
    steps,
    additionalOutputs: {
      capacitanceMicroFarads: { label: 'Capacitance (µF)', value: `${(requiredCapacitanceF * 1e6).toFixed(2)} µF` },
      esrRippleVoltage: { label: 'ESR Ripple Voltage', value: `${(esrRippleV * 1000).toFixed(2)} mV` },
      capacitiveRippleVoltage: { label: 'Capacitive Ripple Voltage', value: `${(allowedCapacitiveDeltaV * 1000).toFixed(2)} mV` },
      totalEstimatedRipple: { label: 'Total Output Ripple (Peak-to-Peak)', value: `${((esrRippleV + allowedCapacitiveDeltaV) * 1000).toFixed(2)} mV` },
      capacitorRmsCurrent: { label: 'Capacitor RMS Ripple Current', value: `${capRmsCurrentA.toFixed(3)} A` },
    },
    visualData: {
      requiredCapacitanceF,
      capRmsCurrentA,
      esrRippleV,
      totalRippleV: esrRippleV + allowedCapacitiveDeltaV,
    },
  };
}

export interface BuckCcmDcmInputs {
  inputVoltageV: number;
  outputVoltageV: number;
  inductanceH: number;
  switchingFrequencyHz: number;
  actualOutputCurrentA?: number;
  actualLoadCurrentA?: number;
}

export function calculateBuckCcmDcmBoundary(inputs: BuckCcmDcmInputs): CalculationResult {
  const {
    inputVoltageV: Vin,
    outputVoltageV: Vout,
    inductanceH: L,
    switchingFrequencyHz: fs,
    actualOutputCurrentA,
    actualLoadCurrentA,
  } = inputs;

  const Iout = actualOutputCurrentA ?? actualLoadCurrentA ?? 1.0;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeVin = Math.max(Vin, 1e-3);
  const D = Math.min(Math.max(Vout / safeVin, 0.001), 0.999);
  const safeL = Math.max(L, 1e-9);
  const safeFs = Math.max(fs, 10);

  // Critical load current: I_crit = (Vout * (1 - D)) / (2 * L * fs)
  const iCritA = (Vout * (1 - D)) / (2 * safeL * safeFs);
  const isCcm = Iout >= iCritA;
  const criticalInductanceH = (Vout * (1 - D)) / (2 * Math.max(Iout, 1e-4) * safeFs);

  steps.push({
    stepNumber: 1,
    title: 'Calculate CCM / DCM Critical Boundary Current (I_crit)',
    formula: 'I_crit = [ V_out × (1 - D) ] / (2 × L × f_s) = ΔI_L / 2',
    substitution: `[ ${Vout} V × (1 - ${D.toFixed(3)}) ] / (2 × ${(safeL * 1e6).toFixed(1)} µH × ${safeFs} Hz)`,
    result: `I_crit = ${iCritA.toFixed(3)} A`,
    annotation: 'If actual load current I_out > I_crit, operation is in CCM. If I_out < I_crit, operation is in DCM.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Evaluate Operating Conduction Regime',
    formula: 'Operating Mode Condition',
    substitution: `I_out (${Iout.toFixed(3)} A) ${isCcm ? '≥' : '<'} I_crit (${iCritA.toFixed(3)} A)`,
    result: isCcm ? 'Continuous Conduction Mode (CCM)' : 'Discontinuous Conduction Mode (DCM)',
    annotation: isCcm
      ? 'Inductor current does not reach zero during the cycle.'
      : 'Inductor current reaches zero before the end of the period. Voltage conversion ratio becomes load-dependent.',
  });

  return {
    primaryValue: iCritA,
    formattedValue: `${iCritA.toFixed(3)} A`,
    unit: 'A',
    label: 'Critical Boundary Current (I_crit)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      operatingMode: { label: 'Conduction Mode', value: isCcm ? 'CCM (Continuous)' : 'DCM (Discontinuous)' },
      criticalCurrent: { label: 'Boundary Load Current (I_crit)', value: `${iCritA.toFixed(3)} A` },
      actualLoadCurrent: { label: 'Actual Operating Load (I_out)', value: `${Iout.toFixed(3)} A` },
      criticalInductance: { label: 'Critical Boundary Inductance (L_crit)', value: formatQuantity(criticalInductanceH, 'inductance') },
      marginRatio: { label: 'Current Margin Ratio (I_out / I_crit)', value: `${(Iout / Math.max(iCritA, 1e-6)).toFixed(2)}×` },
    },
    visualData: {
      iCritA,
      Iout,
      isCcm,
      D,
    },
  };
}
