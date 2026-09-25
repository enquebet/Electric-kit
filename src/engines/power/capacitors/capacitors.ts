import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export type CapacitorApplication = 'buck-output' | 'boost-output' | 'buck-input';

export interface ConverterCapacitorInputs {
  application: CapacitorApplication;
  dutyCycle: number;
  outputCurrentA: number;
  inductorRippleCurrentA: number;
  switchingFrequencyHz: number;
  allowableRippleVoltageV: number;
  capacitorEsrOhms?: number;
}

export function calculateConverterOutputCapacitor(inputs: ConverterCapacitorInputs): CalculationResult {
  const {
    application,
    dutyCycle: D,
    outputCurrentA: Iout,
    inductorRippleCurrentA: deltaIL,
    switchingFrequencyHz: fs,
    allowableRippleVoltageV: targetDeltaV,
    capacitorEsrOhms: esr = 0,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeFs = Math.max(fs, 100);
  const safeD = Math.max(0.01, Math.min(D, 0.99));
  const safeDeltaV = Math.max(targetDeltaV, 1e-4);

  let requiredCapacitanceF = 0;
  let rmsRippleCurrentA = 0;
  let esrDropV = 0;
  let formulaStr = '';

  if (application === 'buck-output') {
    // Triangular inductor ripple directly into output capacitor:
    // deltaV_c = deltaIL / (8 * fs * C)
    esrDropV = deltaIL * esr;
    const allowedCapV = Math.max(safeDeltaV - esrDropV, safeDeltaV * 0.2);
    requiredCapacitanceF = deltaIL / (8 * safeFs * allowedCapV);
    rmsRippleCurrentA = deltaIL / Math.sqrt(12);
    formulaStr = 'C_out = ΔI_L / (8 × f_s × ΔV_C)';
  } else if (application === 'boost-output') {
    // Pulsed diode current during switch off-time:
    esrDropV = (Iout / (1 - safeD)) * esr;
    const allowedCapV = Math.max(safeDeltaV - esrDropV, safeDeltaV * 0.2);
    requiredCapacitanceF = (Iout * safeD) / (safeFs * allowedCapV);
    rmsRippleCurrentA = Iout * Math.sqrt(safeD / (1 - safeD));
    formulaStr = 'C_out = (I_out × D) / (f_s × ΔV_C)';
  } else {
    // Buck input capacitor: discontinuous chopping current
    // I_rms = Iout * sqrt( D * (1 - D) )
    esrDropV = Iout * esr;
    const allowedCapV = Math.max(safeDeltaV - esrDropV, safeDeltaV * 0.2);
    requiredCapacitanceF = (Iout * safeD * (1 - safeD)) / (safeFs * allowedCapV);
    rmsRippleCurrentA = Iout * Math.sqrt(safeD * (1 - safeD));
    formulaStr = 'C_in = [ I_out × D × (1 - D) ] / (f_s × ΔV_C)';
  }

  steps.push({
    stepNumber: 1,
    title: `Determine Sizing Formula for Application: ${application.toUpperCase()}`,
    formula: formulaStr,
    substitution: `f_s = ${safeFs} Hz, D = ${safeD.toFixed(3)}, ΔV_target = ${(safeDeltaV * 1000).toFixed(1)} mV`,
    result: `Required C ≥ ${formatQuantity(requiredCapacitanceF, 'capacitance')}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Capacitor RMS Ripple Current Endurance Rating',
    formula: application === 'buck-output' ? 'I_C,rms = ΔI_L / √12' : application === 'boost-output' ? 'I_C,rms = I_out × √[ D / (1 - D) ]' : 'I_Cin,rms = I_out × √[ D × (1 - D) ]',
    substitution: `Load = ${Iout.toFixed(2)} A`,
    result: `I_C,rms = ${rmsRippleCurrentA.toFixed(3)} A`,
    annotation: 'Capacitor lifespan degrades exponentially if operating RMS ripple current exceeds rated endurance limit.',
  });

  return {
    primaryValue: requiredCapacitanceF,
    formattedValue: formatQuantity(requiredCapacitanceF, 'capacitance'),
    unit: 'F',
    label: 'Required Capacitance',
    classification: 'TOPOLOGY / DESIGN DEPENDENT',
    warnings,
    steps,
    additionalOutputs: {
      capacitanceMicrofarads: { label: 'Capacitance (µF)', value: `${(requiredCapacitanceF * 1e6).toFixed(2)} µF` },
      rmsRippleCurrent: { label: 'Capacitor RMS Current Rating', value: `${rmsRippleCurrentA.toFixed(3)} A` },
      esrDrop: { label: 'Estimated ESR Voltage Drop', value: `${(esrDropV * 1000).toFixed(1)} mV` },
      applicationType: { label: 'Capacitor Position', value: application },
    },
    visualData: {
      requiredCapacitanceF,
      rmsRippleCurrentA,
      esrDropV,
      application,
    },
  };
}

export interface CapacitorEsrRippleInputs {
  rippleCurrentPeakToPeakA: number;
  esrOhms: number;
}

export function calculateCapacitorEsrRipple(inputs: CapacitorEsrRippleInputs): CalculationResult {
  const { rippleCurrentPeakToPeakA: deltaI, esrOhms: esr } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const vEsrDrop = deltaI * esr;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Ohmic Step ESR Voltage Drop',
    formula: 'ΔV_ESR = ΔI_ripple × ESR',
    substitution: `${deltaI.toFixed(3)} A × ${(esr * 1000).toFixed(2)} mΩ`,
    result: `ΔV_ESR = ${vEsrDrop.toFixed(3)} V (${(vEsrDrop * 1000).toFixed(1)} mV)`,
  });

  return {
    primaryValue: vEsrDrop,
    formattedValue: `${(vEsrDrop * 1000).toFixed(2)} mV`,
    unit: 'V',
    label: 'Capacitor ESR Voltage Drop',
    classification: 'COMPONENT-DATA DEPENDENT',
    warnings,
    steps,
    additionalOutputs: {
      esrVoltageDropMv: { label: 'ESR Voltage Ripple (mV)', value: `${(vEsrDrop * 1000).toFixed(2)} mV` },
      rippleCurrent: { label: 'Peak-to-Peak Ripple Current', value: `${deltaI.toFixed(3)} A` },
      esrMilliOhms: { label: 'Capacitor ESR', value: `${(esr * 1000).toFixed(2)} mΩ` },
    },
    visualData: {
      vEsrDrop,
      deltaI,
      esr,
    },
  };
}

export interface CapacitorRmsCurrentInputs {
  application: CapacitorApplication;
  dutyCycle: number;
  outputCurrentA: number;
  inductorRippleCurrentA: number;
}

export function calculateCapacitorRmsCurrent(inputs: CapacitorRmsCurrentInputs): CalculationResult {
  const {
    application,
    dutyCycle: D,
    outputCurrentA: Iout,
    inductorRippleCurrentA: deltaIL,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeD = Math.max(0.001, Math.min(D, 0.999));
  let iRms = 0;
  let formulaStr = '';

  switch (application) {
    case 'buck-output':
      iRms = deltaIL / Math.sqrt(12);
      formulaStr = 'I_C,rms = ΔI_L / √12 ≈ 0.289 × ΔI_L';
      break;
    case 'boost-output':
      iRms = Iout * Math.sqrt(safeD / (1 - safeD));
      formulaStr = 'I_C,rms = I_out × √[ D / (1 - D) ]';
      break;
    case 'buck-input':
      iRms = Iout * Math.sqrt(safeD * (1 - safeD));
      formulaStr = 'I_Cin,rms = I_out × √[ D × (1 - D) ]';
      break;
  }

  steps.push({
    stepNumber: 1,
    title: `Calculate AC Ripple RMS Current (${application})`,
    formula: formulaStr,
    substitution: `D = ${safeD.toFixed(3)}, I_out = ${Iout} A, ΔI_L = ${deltaIL} A`,
    result: `I_C,rms = ${iRms.toFixed(3)} A`,
  });

  return {
    primaryValue: iRms,
    formattedValue: `${iRms.toFixed(3)} A RMS`,
    unit: 'A',
    label: 'Capacitor RMS Ripple Current',
    classification: 'TOPOLOGY / DESIGN DEPENDENT',
    warnings,
    steps,
    additionalOutputs: {
      rmsCurrent: { label: 'RMS Ripple Current', value: `${iRms.toFixed(3)} A` },
      application: { label: 'Topology Location', value: application },
    },
    visualData: {
      iRms,
      application,
      safeD,
      Iout,
    },
  };
}

export interface CapacitorEnergyInputs {
  capacitanceFarads: number;
  voltageV: number;
}

export function calculateCapacitorStoredEnergy(inputs: CapacitorEnergyInputs): CalculationResult {
  const { capacitanceFarads: C, voltageV: V } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeC = Math.max(C, 0);
  const energyJoules = 0.5 * safeC * Math.pow(V, 2);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Electrostatic Stored Energy',
    formula: 'E_C = ½ × C × V²',
    substitution: `½ × ${formatQuantity(safeC, 'capacitance')} × (${V.toFixed(2)} V)²`,
    result: `E_C = ${energyJoules >= 1 ? energyJoules.toFixed(4) + ' J' : (energyJoules * 1e3).toFixed(2) + ' mJ'}`,
  });

  return {
    primaryValue: energyJoules,
    formattedValue: energyJoules >= 1 ? `${energyJoules.toFixed(3)} J` : `${(energyJoules * 1e3).toFixed(2)} mJ`,
    unit: 'J',
    label: 'Capacitor Stored Energy (E_C)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      energyJoules: { label: 'Energy (Joules)', value: `${energyJoules.toFixed(4)} J` },
      energyMilliJoules: { label: 'Energy (mJ)', value: `${(energyJoules * 1e3).toFixed(2)} mJ` },
      capacitance: { label: 'Capacitance (C)', value: formatQuantity(safeC, 'capacitance') },
      voltage: { label: 'Working Voltage (V)', value: `${V.toFixed(2)} V` },
    },
    visualData: {
      energyJoules,
      C: safeC,
      V,
    },
  };
}
