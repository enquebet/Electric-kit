import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export interface ConverterEfficiencyInputs {
  outputPowerWatts: number;
  inputPowerWatts: number;
}

export function calculateConverterEfficiency(inputs: ConverterEfficiencyInputs): CalculationResult {
  const { outputPowerWatts: Pout, inputPowerWatts: Pin } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (Pin <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Invalid Input Power',
      message: 'Input power must be strictly greater than zero.',
    });
  }

  if (Pout > Pin && Pin > 0) {
    warnings.push({
      severity: 'danger',
      title: 'Thermodynamically Impossible (P_out > P_in)',
      message: `Output power (${Pout} W) exceeds input power (${Pin} W). Efficiency cannot exceed 100%.`,
    });
  }

  const safePin = Math.max(Pin, 1e-6);
  const efficiencyRatio = Math.min(Math.max(Pout / safePin, 0), 1.0);
  const efficiencyPercent = efficiencyRatio * 100;
  const powerLossWatts = Math.max(Pin - Pout, 0);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Power Conversion Efficiency (η)',
    formula: 'η = (P_out / P_in) × 100%',
    substitution: `(${Pout.toFixed(2)} W / ${Pin.toFixed(2)} W) × 100%`,
    result: `η = ${efficiencyPercent.toFixed(2)}%`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Net Power Loss Dissipation (P_loss)',
    formula: 'P_loss = P_in - P_out',
    substitution: `${Pin.toFixed(2)} W - ${Pout.toFixed(2)} W`,
    result: `P_loss = ${powerLossWatts.toFixed(2)} W`,
  });

  return {
    primaryValue: efficiencyPercent,
    formattedValue: `${efficiencyPercent.toFixed(2)}%`,
    unit: '%',
    label: 'Converter Efficiency (η)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      efficiencyPercent: { label: 'Efficiency (η)', value: `${efficiencyPercent.toFixed(2)}%` },
      totalLossWatts: { label: 'Total Power Dissipated (P_loss)', value: `${powerLossWatts.toFixed(2)} W` },
      inputPower: { label: 'Input Power (P_in)', value: formatQuantity(Pin, 'power') },
      outputPower: { label: 'Output Power (P_out)', value: formatQuantity(Pout, 'power') },
    },
    visualData: {
      efficiencyPercent,
      powerLossWatts,
      Pin,
      Pout,
    },
  };
}

export interface LossBudgetInputs {
  outputPowerWatts: number;
  mosfetConductionLossW?: number;
  mosfetSwitchingLossW?: number;
  diodeConductionLossW?: number;
  diodeRecoveryLossW?: number;
  inductorDcrLossW?: number;
  inductorCoreLossW?: number;
  capacitorEsrLossW?: number;
  icQuiescentLossW?: number;
  otherLossesW?: number;
}

export function calculateConverterLossBudget(inputs: LossBudgetInputs): CalculationResult {
  const {
    outputPowerWatts: Pout,
    mosfetConductionLossW: pMosCond = 0,
    mosfetSwitchingLossW: pMosSw = 0,
    diodeConductionLossW: pDiodeCond = 0,
    diodeRecoveryLossW: pDiodeRec = 0,
    inductorDcrLossW: pIndDcr = 0,
    inductorCoreLossW: pIndCore = 0,
    capacitorEsrLossW: pCapEsr = 0,
    icQuiescentLossW: pIcq = 0,
    otherLossesW: pOther = 0,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const totalLossWatts =
    pMosCond +
    pMosSw +
    pDiodeCond +
    pDiodeRec +
    pIndDcr +
    pIndCore +
    pCapEsr +
    pIcq +
    pOther;

  const totalInputPowerWatts = Pout + totalLossWatts;
  const efficiencyPercent = totalInputPowerWatts > 0 ? (Pout / totalInputPowerWatts) * 100 : 0;

  // Breakdown percentages of total loss:
  const breakdown = [
    { category: 'MOSFET Conduction', lossWatts: pMosCond },
    { category: 'MOSFET Switching', lossWatts: pMosSw },
    { category: 'Diode Conduction', lossWatts: pDiodeCond },
    { category: 'Diode Recovery', lossWatts: pDiodeRec },
    { category: 'Inductor DCR (Copper)', lossWatts: pIndDcr },
    { category: 'Inductor Core', lossWatts: pIndCore },
    { category: 'Capacitor ESR', lossWatts: pCapEsr },
    { category: 'IC Quiescent / Gate Drive', lossWatts: pIcq },
    { category: 'Other Stray Losses', lossWatts: pOther },
  ].filter((item) => item.lossWatts > 0);

  steps.push({
    stepNumber: 1,
    title: 'Sum Constituent Dissipative Power Losses',
    formula: 'P_loss,total = ∑ P_i',
    substitution: `${pMosCond.toFixed(2)} W + ${pMosSw.toFixed(2)} W + ${pDiodeCond.toFixed(2)} W + ${pIndDcr.toFixed(2)} W + ...`,
    result: `P_loss,total = ${totalLossWatts.toFixed(2)} W`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Predicted Operating Efficiency',
    formula: 'η = [ P_out / (P_out + P_loss,total) ] × 100%',
    substitution: `[ ${Pout.toFixed(2)} W / (${Pout.toFixed(2)} W + ${totalLossWatts.toFixed(2)} W) ] × 100%`,
    result: `η = ${efficiencyPercent.toFixed(2)}%`,
  });

  return {
    primaryValue: totalLossWatts,
    formattedValue: `${totalLossWatts.toFixed(2)} W (Loss)`,
    unit: 'W',
    label: 'Total Power Losses',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Bottom-up power stage loss budget estimation combining conduction, switching, magnetic, and dielectric losses.',
    warnings,
    steps,
    additionalOutputs: {
      predictedEfficiency: { label: 'Predicted Efficiency', value: `${efficiencyPercent.toFixed(2)}%` },
      totalLosses: { label: 'Total Dissipated Power', value: `${totalLossWatts.toFixed(2)} W` },
      outputPower: { label: 'Output Power (P_out)', value: formatQuantity(Pout, 'power') },
      inputPower: { label: 'Input Power (P_in)', value: formatQuantity(totalInputPowerWatts, 'power') },
    },
    visualData: {
      totalLossWatts,
      efficiencyPercent,
      breakdown,
      Pout,
      totalInputPowerWatts,
    },
  };
}
