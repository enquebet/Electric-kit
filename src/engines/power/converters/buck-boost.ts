import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export interface InvertingBuckBoostInputs {
  inputVoltageV: number;
  outputVoltageMagnitudeV: number;
  outputCurrentA: number;
  switchingFrequencyHz: number;
  inductanceH?: number;
}

export function calculateInvertingBuckBoost(inputs: InvertingBuckBoostInputs): CalculationResult {
  const {
    inputVoltageV: Vin,
    outputVoltageMagnitudeV: absVout,
    outputCurrentA: Iout,
    switchingFrequencyHz: fs,
    inductanceH: L = 100e-6,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (Vin <= 0 || absVout <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Invalid Voltage Magnitudes',
      message: 'Both input voltage and output voltage magnitude must be greater than zero.',
    });
  }

  // Emphasize negative polarity inversion
  warnings.push({
    severity: 'info',
    title: 'Output Polarity Inversion',
    message: `Classical buck-boost produces a negative potential (-${absVout} V) relative to input ground. The output capacitor and load cathode connect to the switch/diode node.`,
  });

  const safeVin = Math.max(Vin, 0.1);
  const safeVout = Math.max(absVout, 0.1);

  // D = |Vout| / (|Vout| + Vin)
  const dutyCycle = safeVout / (safeVout + safeVin);
  const pOutWatts = safeVout * Iout;

  // Inverting buck-boost ideal current relationship: Iin = Iout * (D / (1 - D))
  const iInIdealA = Iout * (dutyCycle / (1 - dutyCycle));
  // Inductor carries sum of input and output average currents during whole cycle in CCM
  const iLAvgA = iInIdealA + Iout; // = Iout / (1 - D)

  // Inductor ripple: deltaIL = (Vin * D) / (fs * L)
  const safeFs = Math.max(fs, 100);
  const deltaIlA = (safeVin * dutyCycle) / (safeFs * Math.max(L, 1e-7));
  const iPeakA = iLAvgA + deltaIlA / 2;

  // Voltage stress on switch and diode: V_stress = Vin + |Vout|
  const vSemiconductorStress = safeVin + safeVout;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Inverting Buck-Boost Duty Cycle (D)',
    formula: 'D = |V_out| / ( |V_out| + V_in )',
    substitution: `${safeVout} V / ( ${safeVout} V + ${safeVin} V )`,
    result: `D = ${dutyCycle.toFixed(4)} (${(dutyCycle * 100).toFixed(2)}%)`,
    annotation: 'Notice D < 0.5 acts as step-down; D > 0.5 acts as step-up; D = 0.5 yields 1:1 inversion.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Average Input & Inductor Currents',
    formula: 'I_in = I_out × [ D / (1 - D) ];  I_L,avg = I_in + I_out = I_out / (1 - D)',
    substitution: `${Iout} A × [ ${dutyCycle.toFixed(3)} / (1 - ${dutyCycle.toFixed(3)}) ]`,
    result: `I_in = ${iInIdealA.toFixed(3)} A,  I_L,avg = ${iLAvgA.toFixed(3)} A`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Semiconductor Peak Voltage Stress',
    formula: 'V_switch,peak = V_diode,peak = V_in + |V_out|',
    substitution: `${safeVin} V + ${safeVout} V`,
    result: `Peak Stress = ${vSemiconductorStress.toFixed(1)} V`,
    annotation: 'Both main switch and diode must withstand total rail-to-rail voltage sum!',
  });

  return {
    primaryValue: dutyCycle,
    formattedValue: `${(dutyCycle * 100).toFixed(2)}%`,
    unit: '%',
    label: 'Inverting Duty Cycle (D)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      dutyRatio: { label: 'Duty Cycle Ratio (D)', value: dutyCycle.toFixed(4) },
      nominalOutputVoltage: { label: 'True Output Potential', value: `-${safeVout.toFixed(1)} V (Inverted)` },
      averageInductorCurrent: { label: 'Average Inductor Current', value: `${iLAvgA.toFixed(3)} A` },
      peakInductorCurrent: { label: 'Peak Inductor Current (I_peak)', value: `${iPeakA.toFixed(3)} A` },
      inputCurrent: { label: 'Average Input Current (I_in)', value: `${iInIdealA.toFixed(3)} A` },
      switchVoltageStress: { label: 'Switch & Diode Voltage Stress', value: `${vSemiconductorStress.toFixed(1)} V` },
      outputPower: { label: 'Output Power (P_out)', value: formatQuantity(pOutWatts, 'power') },
    },
    visualData: {
      dutyCycle,
      Vin: safeVin,
      absVout: safeVout,
      iLAvgA,
      vSemiconductorStress,
      iInIdealA,
      Iout,
    },
  };
}

export interface NonInvertingBuckBoostInputs {
  inputVoltageV: number;
  outputVoltageV: number;
  outputCurrentA?: number;
  switchingFrequencyHz?: number;
  controlArchitecture?: 'four-switch-synchronous' | 'cascaded-two-switch';
}

export function calculateNonInvertingBuckBoost(inputs: NonInvertingBuckBoostInputs): CalculationResult {
  const {
    inputVoltageV: Vin,
    outputVoltageV: Vout,
    controlArchitecture = 'four-switch-synchronous',
  } = inputs;
  const Iout = inputs.outputCurrentA ?? 1.0;
  const fs = inputs.switchingFrequencyHz ?? 100000;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeVin = Math.max(Vin, 0.1);
  const safeVout = Math.max(Vout, 0.1);
  const safeFs = Math.max(fs, 100);

  let activeMode: 'Buck Mode' | 'Boost Mode' | 'Buck-Boost Transfer';
  let primaryDuty = 0;
  let explanation = '';

  if (controlArchitecture === 'four-switch-synchronous') {
    // 4-switch synchronous buck-boost:
    // When Vin > Vout: Buck leg modulates (D_buck = Vout / Vin), Boost leg switch 100% ON (bottom FET OFF)
    // When Vin < Vout: Buck leg switch 100% ON, Boost leg modulates (D_boost = 1 - Vin / Vout)
    if (safeVin > safeVout * 1.05) {
      activeMode = 'Buck Mode';
      primaryDuty = safeVout / safeVin;
      explanation = 'Vin > Vout: Boost switch is held closed; only buck bridge switches with D = Vout / Vin.';
    } else if (safeVin < safeVout * 0.95) {
      activeMode = 'Boost Mode';
      primaryDuty = 1 - safeVin / safeVout;
      explanation = 'Vin < Vout: Buck switch is held closed; only boost bridge switches with D = 1 - Vin / Vout.';
    } else {
      activeMode = 'Buck-Boost Transfer';
      primaryDuty = 0.5;
      explanation = 'Vin ≈ Vout: 4-switch transitions through narrow 4-switch interleaving or dual-leg control to maintain stability.';
    }
  } else {
    // Cascaded 2-switch or single PWM unified ratio: Vout = Vin * [ D / (1 - D) ]
    activeMode = 'Buck-Boost Transfer';
    primaryDuty = safeVout / (safeVout + safeVin);
    explanation = 'Unified 2-switch non-inverting cascaded mode with D = Vout / (Vout + Vin).';
  }

  const pOutWatts = safeVout * Iout;
  const estimatedInputCurrentA = pOutWatts / safeVin;

  steps.push({
    stepNumber: 1,
    title: `Identify Operating Regime (${controlArchitecture})`,
    formula: 'Operating State: Buck vs Boost Leg Transition',
    substitution: `V_in = ${safeVin} V, V_out = ${safeVout} V`,
    result: `${activeMode}: ${explanation}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Active Operating Duty Cycle',
    formula: activeMode === 'Buck Mode' ? 'D_buck = V_out / V_in' : activeMode === 'Boost Mode' ? 'D_boost = 1 - (V_in / V_out)' : 'D = V_out / (V_out + V_in)',
    substitution: `${safeVout} V vs ${safeVin} V`,
    result: `D = ${primaryDuty.toFixed(4)} (${(primaryDuty * 100).toFixed(1)}%)`,
  });

  return {
    primaryValue: primaryDuty,
    formattedValue: `${(primaryDuty * 100).toFixed(1)}% (${activeMode})`,
    unit: '%',
    label: 'Operating Duty Cycle (D)',
    classification: 'TOPOLOGY / DESIGN DEPENDENT',
    standardsContext: 'Topology-dependent non-inverting architecture (4-switch H-bridge buck-boost vs cascaded non-inverting).',
    warnings,
    steps,
    additionalOutputs: {
      operatingRegime: { label: 'Active Mode', value: activeMode },
      architecture: { label: 'Assumed Topology', value: controlArchitecture },
      outputPolarity: { label: 'Output Polarity', value: '+ Positive (Non-Inverting Common Ground)' },
      dutyCycle: { label: 'Active Duty Cycle', value: `${(primaryDuty * 100).toFixed(2)}%` },
      estimatedInputCurrent: { label: 'Estimated Input Current', value: `${estimatedInputCurrentA.toFixed(3)} A` },
      outputPower: { label: 'Output Power', value: formatQuantity(pOutWatts, 'power') },
    },
    visualData: {
      primaryDuty,
      activeMode,
      Vin: safeVin,
      Vout: safeVout,
      Iout,
    },
  };
}
