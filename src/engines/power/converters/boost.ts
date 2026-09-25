import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export interface IdealBoostInputs {
  inputVoltageV: number;
  outputVoltageV: number;
  outputCurrentA?: number;
  switchingFrequencyHz?: number;
}

export function calculateIdealBoost(inputs: IdealBoostInputs): CalculationResult {
  const { inputVoltageV: Vin, outputVoltageV: Vout } = inputs;
  const Iout = inputs.outputCurrentA ?? 1.0;
  const fs = inputs.switchingFrequencyHz ?? 100000;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (Vin <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Invalid Input Voltage',
      message: 'Input voltage must be strictly greater than zero.',
    });
  }

  // Reject physically impossible conditions for boost topology (Vout <= Vin)
  if (Vout <= Vin && Vin > 0) {
    warnings.push({
      severity: 'danger',
      title: 'Physically Impossible Condition (Vout ≤ Vin)',
      message: `A boost converter cannot step down or operate at equality (Vout must be strictly > Vin). Input = ${Vin} V, Output requested = ${Vout} V. At Vout ≤ Vin, the boost diode is forward-biased continuously, losing regulation.`,
    });
  }

  const safeVout = Math.max(Vout, Vin + 0.001);
  const dutyCycle = Math.max(0, Math.min(1 - Vin / safeVout, 0.98));
  const pOutWatts = Vout * Iout;
  // Lossless: Pin = Pout -> Iin = Iout / (1 - D)
  const iInIdealA = (1 - dutyCycle) > 0 ? Iout / (1 - dutyCycle) : 0;
  const periodUs = fs > 0 ? (1 / fs) * 1e6 : 0;
  const tOnUs = periodUs * dutyCycle;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Ideal Boost Duty Cycle (D)',
    formula: 'D = 1 - (V_in / V_out)',
    substitution: `1 - (${Vin} V / ${Vout} V)`,
    result: `D = ${dutyCycle.toFixed(4)} (${(dutyCycle * 100).toFixed(2)}%)`,
    annotation: 'Continuous Conduction Mode (CCM) volt-second balance under ideal lossless switch/diode assumption.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Ideal Input Current & Power',
    formula: 'P_out = V_out × I_out;  I_in(avg) = I_out / (1 - D)',
    substitution: `${Vout} V × ${Iout} A = ${formatQuantity(pOutWatts, 'power')};  ${Iout} A / (1 - ${dutyCycle.toFixed(3)})`,
    result: `I_in(avg) = ${iInIdealA.toFixed(3)} A`,
  });

  return {
    primaryValue: dutyCycle,
    formattedValue: `${(dutyCycle * 100).toFixed(2)}%`,
    unit: '%',
    label: 'Ideal Duty Cycle (D)',
    classification: 'THEORETICAL',
    standardsContext: 'Continuous Conduction Mode (CCM) steady-state volt-second balance equation for ideal step-up converter.',
    warnings,
    steps,
    additionalOutputs: {
      dutyRatio: { label: 'Duty Cycle (D)', value: dutyCycle.toFixed(4) },
      inputCurrent: { label: 'Average Input Current (I_in)', value: `${iInIdealA.toFixed(3)} A` },
      outputPower: { label: 'Output Power (P_out)', value: formatQuantity(pOutWatts, 'power') },
      idealEfficiency: { label: 'Ideal Efficiency', value: '100.0%' },
      voltageGain: { label: 'Voltage Conversion Ratio (M)', value: `${(1 / (1 - dutyCycle)).toFixed(2)}×` },
      onTime: { label: 'Switch On-Time (t_on)', value: `${tOnUs.toFixed(2)} µs` },
    },
    visualData: {
      dutyCycle,
      Vin,
      Vout,
      Iout,
      iInIdealA,
      pOutWatts,
    },
  };
}

export interface BoostInductorInputs {
  inputVoltageV: number;
  outputVoltageV: number;
  outputCurrentA: number;
  switchingFrequencyHz: number;
  rippleRatioPercent: number; // e.g. 30% of average inductor current
}

export function calculateBoostInductor(inputs: BoostInductorInputs): CalculationResult {
  const {
    inputVoltageV: Vin,
    outputVoltageV: Vout,
    outputCurrentA: Iout,
    switchingFrequencyHz: fs,
    rippleRatioPercent: rPct,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (Vout <= Vin) {
    warnings.push({
      severity: 'danger',
      title: 'Invalid Boost Ratio',
      message: 'Vout must be greater than Vin for boost inductor sizing.',
    });
  }

  const safeVout = Math.max(Vout, Vin + 0.1);
  const D = Math.max(0.01, Math.min(1 - Vin / safeVout, 0.95));
  const safeFs = Math.max(fs, 100);

  // In boost, average inductor current = average input current = Iout / (1 - D)
  const iLAvgAmperes = Iout / (1 - D);
  const r = Math.max(rPct / 100, 0.05);
  const deltaIlAmperes = r * iLAvgAmperes;

  // L = Vin * D / (fs * deltaIl)
  const requiredInductanceH = (Vin * D) / (safeFs * deltaIlAmperes);
  const iPeakAmperes = iLAvgAmperes + deltaIlAmperes / 2;
  const iMinAmperes = iLAvgAmperes - deltaIlAmperes / 2;

  if (iMinAmperes < 0) {
    warnings.push({
      severity: 'warning',
      title: 'Discontinuous Operation Warning',
      message: 'Inductor ripple exceeds 2× average current, indicating converter enters DCM at this operating point.',
    });
  }

  steps.push({
    stepNumber: 1,
    title: 'Calculate Average Inductor Current (I_L,avg)',
    formula: 'I_L,avg = I_in = I_out / (1 - D)',
    substitution: `${Iout} A / (1 - ${D.toFixed(3)})`,
    result: `I_L,avg = ${iLAvgAmperes.toFixed(3)} A`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Inductor Peak-to-Peak Ripple Current (ΔI_L)',
    formula: 'ΔI_L = r × I_L,avg',
    substitution: `${(r * 100).toFixed(0)}% × ${iLAvgAmperes.toFixed(3)} A`,
    result: `ΔI_L = ${deltaIlAmperes.toFixed(3)} A`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Size Boost Inductance (L) for CCM',
    formula: 'L = (V_in × D) / (f_s × ΔI_L)',
    substitution: `(${Vin} V × ${D.toFixed(3)}) / (${safeFs} Hz × ${deltaIlAmperes.toFixed(3)} A)`,
    result: `L = ${formatQuantity(requiredInductanceH, 'inductance')}`,
  });

  steps.push({
    stepNumber: 4,
    title: 'Calculate Peak Inductor Current Stress (I_peak)',
    formula: 'I_peak = I_L,avg + (ΔI_L / 2)',
    substitution: `${iLAvgAmperes.toFixed(3)} A + (${deltaIlAmperes.toFixed(3)} A / 2)`,
    result: `I_peak = ${iPeakAmperes.toFixed(3)} A`,
    annotation: 'Choose inductor with saturation current I_sat ≥ 1.3 × I_peak to prevent core saturation.',
  });

  return {
    primaryValue: requiredInductanceH,
    formattedValue: formatQuantity(requiredInductanceH, 'inductance'),
    unit: 'H',
    label: 'Required Boost Inductance (L)',
    classification: 'ENGINEERING ESTIMATE',
    warnings,
    steps,
    additionalOutputs: {
      inductanceMicroHenries: { label: 'Inductance (µH)', value: `${(requiredInductanceH * 1e6).toFixed(2)} µH` },
      averageInductorCurrent: { label: 'Average Inductor Current (I_L,avg)', value: `${iLAvgAmperes.toFixed(3)} A` },
      rippleCurrent: { label: 'Ripple Current (ΔI_L)', value: `${deltaIlAmperes.toFixed(3)} A` },
      peakCurrent: { label: 'Peak Inductor Current (I_peak)', value: `${iPeakAmperes.toFixed(3)} A` },
      valleyCurrent: { label: 'Valley Inductor Current (I_min)', value: `${iMinAmperes.toFixed(3)} A` },
    },
    visualData: {
      requiredInductanceH,
      iLAvgAmperes,
      deltaIlAmperes,
      iPeakAmperes,
      iMinAmperes,
      D,
    },
  };
}

export interface BoostOutputCapacitorInputs {
  outputVoltageV?: number;
  outputCurrentA: number;
  dutyCycle: number;
  switchingFrequencyHz: number;
  desiredRippleVoltageV?: number;
  allowableRippleVoltageV?: number;
  capacitorEsrOhms?: number;
}

export function calculateBoostOutputCapacitor(inputs: BoostOutputCapacitorInputs): CalculationResult {
  const {
    outputVoltageV: Vout = 12,
    outputCurrentA: Iout,
    dutyCycle: D,
    switchingFrequencyHz: fs,
    desiredRippleVoltageV,
    allowableRippleVoltageV,
    capacitorEsrOhms: esr = 0,
  } = inputs;

  const targetDeltaV = allowableRippleVoltageV ?? desiredRippleVoltageV ?? 0.05;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeFs = Math.max(fs, 100);
  const safeD = Math.max(0.01, Math.min(D, 0.95));
  const safeTargetV = Math.max(targetDeltaV, 1e-4);

  // In boost, the output capacitor alone sustains the entire load during switch ON time:
  // Q_dis = Iout * t_on = Iout * (D / fs)
  // Capacitive voltage ripple: deltaV_c = (Iout * D) / (fs * C)
  // ESR ripple: during switch turn-off, secondary diode conducts peak inductor current
  // deltaV_esr ≈ I_peak * ESR ≈ (Iout / (1 - D)) * ESR
  const approxPeakDiodeCurrent = Iout / (1 - safeD);
  const esrRippleV = approxPeakDiodeCurrent * esr;

  if (esrRippleV >= safeTargetV) {
    warnings.push({
      severity: 'danger',
      title: 'ESR Exceeds Voltage Ripple Target',
      message: `ESR step voltage (${(esrRippleV * 1000).toFixed(1)} mV) caused by diode pulsed current exceeds total ripple limit (${(safeTargetV * 1000).toFixed(1)} mV). Low-ESR ceramic caps in parallel are strongly required.`,
    });
  }

  const allowedCapacitiveDeltaV = Math.max(safeTargetV - esrRippleV, safeTargetV * 0.2);
  const requiredCapacitanceF = (Iout * safeD) / (safeFs * allowedCapacitiveDeltaV);

  // Output capacitor RMS ripple current in boost CCM:
  // I_C,rms = Iout * sqrt( D / (1 - D) )
  const capRmsCurrentA = Iout * Math.sqrt(safeD / (1 - safeD));

  steps.push({
    stepNumber: 1,
    title: 'Calculate Pulsed Load Charge Transfer During Switch On-Time',
    formula: 'Q_discharge = I_out × t_on = (I_out × D) / f_s',
    substitution: `(${Iout} A × ${safeD.toFixed(3)}) / ${safeFs} Hz`,
    result: `Charge = ${((Iout * safeD / safeFs) * 1e6).toFixed(2)} µC`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Size Boost Output Capacitance (C_out)',
    formula: 'C_out = (I_out × D) / (f_s × ΔV_C)',
    substitution: `(${Iout} A × ${safeD.toFixed(3)}) / (${safeFs} Hz × ${allowedCapacitiveDeltaV.toFixed(3)} V)`,
    result: `C_out = ${formatQuantity(requiredCapacitanceF, 'capacitance')}`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Capacitor High-RMS Ripple Current Rating',
    formula: 'I_C,rms = I_out × √[ D / (1 - D) ]',
    substitution: `${Iout} A × √[ ${safeD.toFixed(3)} / (1 - ${safeD.toFixed(3)}) ]`,
    result: `I_C,rms = ${capRmsCurrentA.toFixed(3)} A`,
    annotation: 'Boost output capacitors endure much higher pulsed RMS ripple current than buck output capacitors!',
  });

  return {
    primaryValue: requiredCapacitanceF,
    formattedValue: formatQuantity(requiredCapacitanceF, 'capacitance'),
    unit: 'F',
    label: 'Required Boost Output Capacitance',
    classification: 'ENGINEERING ESTIMATE',
    warnings,
    steps,
    additionalOutputs: {
      capacitanceMicroFarads: { label: 'Capacitance (µF)', value: `${(requiredCapacitanceF * 1e6).toFixed(2)} µF` },
      esrRippleVoltage: { label: 'Estimated ESR Spike', value: `${(esrRippleV * 1000).toFixed(1)} mV` },
      capacitiveRipple: { label: 'Capacitive Droop', value: `${(allowedCapacitiveDeltaV * 1000).toFixed(1)} mV` },
      rmsRippleCurrent: { label: 'Capacitor RMS Ripple Current', value: `${capRmsCurrentA.toFixed(3)} A` },
    },
    visualData: {
      requiredCapacitanceF,
      capRmsCurrentA,
      esrRippleV,
      allowedCapacitiveDeltaV,
    },
  };
}

export interface BoostCcmDcmInputs {
  inputVoltageV: number;
  outputVoltageV: number;
  inductanceH: number;
  switchingFrequencyHz: number;
  actualOutputCurrentA: number;
}

export function calculateBoostCcmDcmBoundary(inputs: BoostCcmDcmInputs): CalculationResult {
  const {
    inputVoltageV: Vin,
    outputVoltageV: Vout,
    inductanceH: L,
    switchingFrequencyHz: fs,
    actualOutputCurrentA: Iout,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeVout = Math.max(Vout, Vin + 0.01);
  const D = Math.max(0.01, Math.min(1 - Vin / safeVout, 0.99));
  const safeL = Math.max(L, 1e-9);
  const safeFs = Math.max(fs, 10);

  // In Boost: I_out,crit = [ Vin * D * (1 - D)^2 ] / (2 * L * fs)
  const iOutCritA = (Vin * D * Math.pow(1 - D, 2)) / (2 * safeL * safeFs);
  const isCcm = Iout >= iOutCritA;
  const criticalInductanceH = (Vin * D * Math.pow(1 - D, 2)) / (2 * Math.max(Iout, 1e-4) * safeFs);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Boost CCM/DCM Boundary Critical Output Current',
    formula: 'I_out,crit = [ V_in × D × (1 - D)² ] / (2 × L × f_s)',
    substitution: `[ ${Vin} V × ${D.toFixed(3)} × (1 - ${D.toFixed(3)})² ] / (2 × ${(safeL * 1e6).toFixed(1)} µH × ${safeFs} Hz)`,
    result: `I_out,crit = ${iOutCritA.toFixed(3)} A`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Assess Operating Mode',
    formula: 'I_out Condition',
    substitution: `I_out (${Iout.toFixed(3)} A) ${isCcm ? '≥' : '<'} I_out,crit (${iOutCritA.toFixed(3)} A)`,
    result: isCcm ? 'Continuous Conduction Mode (CCM)' : 'Discontinuous Conduction Mode (DCM)',
  });

  return {
    primaryValue: iOutCritA,
    formattedValue: `${iOutCritA.toFixed(3)} A`,
    unit: 'A',
    label: 'Critical Load Current (I_out,crit)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      operatingMode: { label: 'Conduction Mode', value: isCcm ? 'CCM (Continuous)' : 'DCM (Discontinuous)' },
      criticalBoundaryCurrent: { label: 'Critical Boundary Current', value: `${iOutCritA.toFixed(3)} A` },
      actualCurrent: { label: 'Actual Operating Current', value: `${Iout.toFixed(3)} A` },
      criticalInductance: { label: 'Minimum Inductance for CCM (L_crit)', value: formatQuantity(criticalInductanceH, 'inductance') },
    },
    visualData: {
      iOutCritA,
      Iout,
      isCcm,
      D,
    },
  };
}
