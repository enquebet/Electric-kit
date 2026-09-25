import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export interface SwitchingFrequencyInputs {
  periodSeconds?: number;
  frequencyHz?: number;
  dutyCyclePercent?: number; // e.g. 50%
}

export function calculateSwitchingFrequency(inputs: SwitchingFrequencyInputs): CalculationResult {
  const { periodSeconds: T, frequencyHz: fIn, dutyCyclePercent: dPct = 50 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let safeT = 1e-6;
  let frequencyHz = 1000000;

  if (fIn !== undefined && fIn > 0) {
    frequencyHz = fIn;
    safeT = 1 / fIn;
  } else if (T !== undefined && T > 0) {
    safeT = T;
    frequencyHz = 1 / T;
  } else {
    warnings.push({
      severity: 'danger',
      title: 'Invalid Parameters',
      message: 'Period or frequency must be strictly positive.',
    });
  }

  const D = Math.max(0, Math.min(dPct / 100, 1.0));
  const tOnSeconds = D * safeT;
  const tOffSeconds = (1 - D) * safeT;

  const isFrequencyInput = fIn !== undefined && fIn > 0;
  const primaryVal = isFrequencyInput ? safeT : frequencyHz;
  const primaryUnit = isFrequencyInput ? 's' : 'Hz';
  const primaryLabel = isFrequencyInput ? 'Switching Period (T)' : 'Switching Frequency (f_s)';
  const primaryFmt = isFrequencyInput
    ? (safeT >= 1e-6 ? `${(safeT * 1e6).toFixed(3)} µs` : `${(safeT * 1e9).toFixed(1)} ns`)
    : formatQuantity(frequencyHz, 'frequency');

  steps.push({
    stepNumber: 1,
    title: isFrequencyInput ? 'Calculate Switching Period (T)' : 'Calculate Fundamental Switching Frequency (f_s)',
    formula: isFrequencyInput ? 'T = 1 / f_s' : 'f_s = 1 / T',
    substitution: isFrequencyInput ? `1 / ${formatQuantity(frequencyHz, 'frequency')}` : `1 / ${(safeT * 1e6).toFixed(3)} µs`,
    result: isFrequencyInput ? `T = ${primaryFmt}` : `f_s = ${primaryFmt}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Partition Period into Switch On-Time and Off-Time',
    formula: 't_on = D × T;  t_off = (1 - D) × T',
    substitution: `${(D * 100).toFixed(1)}% × ${safeT >= 1e-6 ? (safeT * 1e6).toFixed(3) + ' µs' : safeT.toExponential(3) + ' s'}`,
    result: `t_on = ${(tOnSeconds * 1e6).toFixed(3)} µs,  t_off = ${(tOffSeconds * 1e6).toFixed(3)} µs`,
  });

  return {
    primaryValue: primaryVal,
    formattedValue: primaryFmt,
    unit: primaryUnit,
    label: primaryLabel,
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      frequencyKhz: { label: 'Frequency (kHz)', value: `${(frequencyHz / 1e3).toFixed(2)} kHz` },
      periodMicroseconds: { label: 'Period (T)', value: `${(safeT * 1e6).toFixed(3)} µs` },
      onTimeUs: { label: 'On-Time (t_on)', value: `${(tOnSeconds * 1e6).toFixed(3)} µs` },
      offTimeUs: { label: 'Off-Time (t_off)', value: `${(tOffSeconds * 1e6).toFixed(3)} µs` },
      dutyCycle: { label: 'Duty Cycle (D)', value: `${(D * 100).toFixed(1)}%` },
    },
    visualData: {
      frequencyHz,
      T: safeT,
      tOnSeconds,
      tOffSeconds,
      D,
    },
  };
}

export interface SwitchingPeriodInputs {
  frequencyHz: number;
}

export function calculateSwitchingPeriod(inputs: SwitchingPeriodInputs): CalculationResult {
  const { frequencyHz: f } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (f <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Invalid Frequency',
      message: 'Switching frequency must be strictly positive.',
    });
  }

  const safeF = Math.max(f, 0.001);
  const periodSeconds = 1 / safeF;
  const periodUs = periodSeconds * 1e6;
  const periodNs = periodSeconds * 1e9;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Period Duration from Frequency',
    formula: 'T = 1 / f_s',
    substitution: `1 / ${formatQuantity(safeF, 'frequency')}`,
    result: `T = ${periodUs >= 1 ? periodUs.toFixed(3) + ' µs' : periodNs.toFixed(2) + ' ns'}`,
  });

  return {
    primaryValue: periodSeconds,
    formattedValue: periodUs >= 1 ? `${periodUs.toFixed(3)} µs` : `${periodNs.toFixed(1)} ns`,
    unit: 's',
    label: 'Switching Period (T)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      periodSeconds: { label: 'Period (Seconds)', value: periodSeconds.toExponential(3) + ' s' },
      periodMicroseconds: { label: 'Period (µs)', value: `${periodUs.toFixed(3)} µs` },
      periodNanoseconds: { label: 'Period (ns)', value: `${periodNs.toFixed(1)} ns` },
      frequencyHz: { label: 'Operating Frequency', value: formatQuantity(safeF, 'frequency') },
    },
    visualData: {
      periodSeconds,
      periodUs,
      safeF,
    },
  };
}

export interface PwmPowerConverterInputs {
  inputVoltageV?: number;
  outputVoltageV?: number;
  outputCurrentA?: number;
  loadResistanceOhms?: number;
  switchingFrequencyHz: number;
  dutyCyclePercent?: number;
  estimatedEfficiencyPercent?: number;
}

export function calculatePwmPowerConverter(inputs: PwmPowerConverterInputs): CalculationResult {
  const {
    inputVoltageV: Vin,
    outputVoltageV: Vout,
    outputCurrentA,
    loadResistanceOhms,
    switchingFrequencyHz: fs,
    dutyCyclePercent: dPct,
    estimatedEfficiencyPercent: effPct = 90,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];
  const safeFs = Math.max(fs, 1);

  if (dPct !== undefined && (Vin === undefined || Vout === undefined)) {
    const D = Math.max(0, Math.min(dPct / 100, 1.0));
    const safeT = 1 / safeFs;
    const tOnSeconds = D * safeT;
    const tOffSeconds = (1 - D) * safeT;

    steps.push({
      stepNumber: 1,
      title: 'Calculate PWM Switch On-Time and Off-Time',
      formula: 't_on = D / f_s;  t_off = (1 - D) / f_s',
      substitution: `${(D * 100).toFixed(1)}% / ${formatQuantity(safeFs, 'frequency')}`,
      result: `t_on = ${(tOnSeconds * 1e6).toFixed(3)} µs,  t_off = ${(tOffSeconds * 1e6).toFixed(3)} µs`,
    });

    return {
      primaryValue: tOnSeconds,
      formattedValue: `${(tOnSeconds * 1e6).toFixed(3)} µs`,
      unit: 's',
      label: 'Switch On-Time (t_on)',
      classification: 'THEORETICAL',
      warnings,
      steps,
      additionalOutputs: {
        onTimeUs: { label: 'On-Time (t_on)', value: `${(tOnSeconds * 1e6).toFixed(3)} µs` },
        offTimeUs: { label: 'Off-Time (t_off)', value: `${(tOffSeconds * 1e6).toFixed(3)} µs` },
        periodMicroseconds: { label: 'Total Period (T)', value: `${(safeT * 1e6).toFixed(3)} µs` },
        dutyCycle: { label: 'Duty Cycle', value: `${(D * 100).toFixed(1)}%` },
        frequency: { label: 'Switching Frequency', value: formatQuantity(safeFs, 'frequency') },
      },
      visualData: {
        tOnSeconds,
        tOffSeconds,
        safeT,
        D,
        safeFs,
      },
    };
  }

  const safeVin = Math.max(Vin ?? 12, 0.01);
  const safeVout = Math.max(Vout ?? 5, 0.01);
  const eta = Math.max(0.1, Math.min(effPct / 100, 1.0));

  let iOut = 0;
  let rLoad = 0;

  if (outputCurrentA !== undefined && outputCurrentA > 0) {
    iOut = outputCurrentA;
    rLoad = safeVout / iOut;
  } else if (loadResistanceOhms !== undefined && loadResistanceOhms > 0) {
    rLoad = loadResistanceOhms;
    iOut = safeVout / rLoad;
  } else {
    iOut = 1.0;
    rLoad = safeVout / iOut;
  }

  const pOutWatts = safeVout * iOut;
  const pInWatts = pOutWatts / eta;
  const iInAvgA = pInWatts / safeVin;
  const periodUs = (1 / safeFs) * 1e6;

  // Generic conversion ratio
  const voltageGain = safeVout / safeVin;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Active Load Parameters & Output Power',
    formula: 'P_out = V_out × I_out;  R_load = V_out / I_out',
    substitution: `${safeVout} V × ${iOut.toFixed(3)} A`,
    result: `P_out = ${formatQuantity(pOutWatts, 'power')},  R_load = ${rLoad.toFixed(2)} Ω`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Input Power and DC Line Current via Efficiency',
    formula: 'P_in = P_out / η;  I_in(avg) = P_in / V_in',
    substitution: `${pOutWatts.toFixed(2)} W / ${(eta * 100).toFixed(0)}% = ${pInWatts.toFixed(2)} W;  ${pInWatts.toFixed(2)} W / ${safeVin} V`,
    result: `P_in = ${formatQuantity(pInWatts, 'power')},  I_in(avg) = ${iInAvgA.toFixed(3)} A`,
  });

  return {
    primaryValue: pOutWatts,
    formattedValue: formatQuantity(pOutWatts, 'power'),
    unit: 'W',
    label: 'Converter Output Power (P_out)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      outputPower: { label: 'Output Power (P_out)', value: formatQuantity(pOutWatts, 'power') },
      inputPower: { label: 'Required Input Power (P_in)', value: formatQuantity(pInWatts, 'power') },
      inputCurrent: { label: 'Average Input Current (I_in)', value: `${iInAvgA.toFixed(3)} A` },
      loadCurrent: { label: 'Load Current (I_out)', value: `${iOut.toFixed(3)} A` },
      voltageGainRatio: { label: 'Voltage Gain (V_out / V_in)', value: `${voltageGain.toFixed(3)}×` },
      switchingPeriod: { label: 'Switching Period (T)', value: `${periodUs.toFixed(3)} µs` },
      assumedEfficiency: { label: 'Assumed Efficiency', value: `${(eta * 100).toFixed(1)}%` },
    },
    visualData: {
      pOutWatts,
      pInWatts,
      iInAvgA,
      iOut,
      voltageGain,
      periodUs,
    },
  };
}
