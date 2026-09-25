import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export interface CukInputs {
  inputVoltageV: number;
  outputVoltageMagnitudeV: number;
  outputCurrentA: number;
  switchingFrequencyHz: number;
  desiredInputRippleA?: number;
  desiredOutputRippleV?: number;
}

export function calculateCukConverter(inputs: CukInputs): CalculationResult {
  const {
    inputVoltageV: Vin,
    outputVoltageMagnitudeV: absVout,
    outputCurrentA: Iout,
    switchingFrequencyHz: fs,
    desiredInputRippleA: targetDeltaIL1,
    desiredOutputRippleV: targetDeltaVout = 0.02,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeVin = Math.max(Vin, 0.1);
  const safeVout = Math.max(absVout, 0.1);
  const safeFs = Math.max(fs, 100);
  const safeIout = Math.max(Iout, 0.01);

  warnings.push({
    severity: 'info',
    title: 'Inverted Output Polarity',
    message: `The Ćuk converter inherently generates an inverted negative output potential (-${safeVout} V) relative to common input ground.`,
  });

  // Ideal duty cycle in CCM:
  // |Vout| / Vin = D / (1 - D) -> D = |Vout| / (Vin + |Vout|)
  const D = safeVout / (safeVin + safeVout);
  const conversionRatio = -D / (1 - D);
  const pOutWatts = safeVout * safeIout;

  // Average currents:
  // I_L1,avg = I_in = I_out * (D / (1 - D))
  // I_L2,avg = I_out
  const iInAvgA = safeIout * (D / (1 - D));

  // Inductors L1 and L2 provide continuous current at both input AND output!
  const deltaIL1 = targetDeltaIL1 && targetDeltaIL1 > 0 ? targetDeltaIL1 : iInAvgA * 0.3;
  const l1H = (safeVin * D) / (safeFs * Math.max(deltaIL1, 1e-4));

  // Output inductor L2: deltaIL2 = (Vin * D) / (fs * L2) = (|Vout| * (1 - D)) / (fs * L2)
  const deltaIL2 = safeIout * 0.3;
  const l2H = (safeVin * D) / (safeFs * Math.max(deltaIL2, 1e-4));

  // Energy transfer coupling capacitor C1:
  // Steady-state voltage across C1: V_C1 = Vin + |Vout|
  // ΔV_C1 = (I_in * (1 - D)) / (fs * C1) = (I_out * D) / (fs * C1)
  // Target coupling cap voltage ripple <= 5% of (Vin + |Vout|)
  const targetDeltaVC1 = Math.max((safeVin + safeVout) * 0.05, 0.05);
  const c1Farads = (safeIout * D) / (safeFs * targetDeltaVC1);

  // Output filter capacitor C2:
  // Output inductor L2 gives triangular ripple into C2, like a buck output:
  // ΔV_out = ΔI_L2 / (8 * fs * C2) -> C2 = ΔI_L2 / (8 * fs * ΔV_out)
  const c2Farads = deltaIL2 / (8 * safeFs * Math.max(targetDeltaVout, 1e-3));

  // Switch and diode voltage stress: V_stress = Vin + |Vout|
  const vStress = safeVin + safeVout;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Ćuk Voltage Conversion Ratio & Duty Cycle (D)',
    formula: 'V_out / V_in = -D / (1 - D);  D = |V_out| / (V_in + |V_out|)',
    substitution: `${safeVout} V / (${safeVin} V + ${safeVout} V)`,
    result: `D = ${D.toFixed(4)} (${(D * 100).toFixed(2)}%), Gain M = ${conversionRatio.toFixed(3)}×`,
    annotation: 'Continuous Conduction Mode (CCM) volt-second balance under ideal switch and capacitor assumptions.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Size Input (L1) and Output (L2) Continuous Current Chokes',
    formula: 'L₁ = (V_in × D) / (f_s × ΔI_L1);  L₂ = (V_in × D) / (f_s × ΔI_L2)',
    substitution: `(${safeVin} V × ${D.toFixed(3)}) / (${safeFs} Hz × ripple)`,
    result: `L₁ = ${formatQuantity(l1H, 'inductance')},  L₂ = ${formatQuantity(l2H, 'inductance')}`,
    annotation: 'Both input and output exhibit continuous, low-EMI ripple current.',
  });

  steps.push({
    stepNumber: 3,
    title: 'Size Intermediate Energy Transfer Capacitor (C1)',
    formula: 'V_C1 = V_in + |V_out|;  C₁ = (I_out × D) / (f_s × ΔV_C1)',
    substitution: `(${safeIout} A × ${D.toFixed(3)}) / (${safeFs} Hz × ${targetDeltaVC1.toFixed(2)} V)`,
    result: `C₁ ≥ ${formatQuantity(c1Farads, 'capacitance')} (Rated for ≥ ${vStress.toFixed(1)} V)`,
  });

  steps.push({
    stepNumber: 4,
    title: 'Size Output Filter Capacitor (C2)',
    formula: 'C₂ = ΔI_L2 / (8 × f_s × ΔV_out)',
    substitution: `${deltaIL2.toFixed(3)} A / (8 × ${safeFs} Hz × ${targetDeltaVout.toFixed(3)} V)`,
    result: `C₂ ≥ ${formatQuantity(c2Farads, 'capacitance')}`,
  });

  return {
    primaryValue: D,
    formattedValue: `${(D * 100).toFixed(2)}%`,
    unit: '%',
    label: 'Ćuk Duty Cycle (D)',
    classification: 'TOPOLOGY / DESIGN DEPENDENT',
    standardsContext: 'Ideal continuous-conduction Ćuk converter model utilizing capacitive energy transfer and dual inductive chokes.',
    warnings,
    steps,
    additionalOutputs: {
      dutyCycle: { label: 'Duty Cycle (D)', value: D.toFixed(4) },
      voltageGain: { label: 'Voltage Ratio (V_out/V_in)', value: `${conversionRatio.toFixed(3)}×` },
      primaryInductanceL1: { label: 'Input Inductance (L₁)', value: formatQuantity(l1H, 'inductance') },
      secondaryInductanceL2: { label: 'Output Inductance (L₂)', value: formatQuantity(l2H, 'inductance') },
      transferCapacitorC1: { label: 'Transfer Capacitor (C₁)', value: formatQuantity(c1Farads, 'capacitance') },
      outputCapacitorC2: { label: 'Output Filter Cap (C₂)', value: formatQuantity(c2Farads, 'capacitance') },
      transferCapVoltage: { label: 'Capacitor C₁ DC Bias', value: `${vStress.toFixed(1)} V` },
      switchStress: { label: 'Switch & Diode Voltage Stress', value: `${vStress.toFixed(1)} V` },
      inputCurrentAvg: { label: 'Average Input Current (I_in)', value: `${iInAvgA.toFixed(3)} A` },
      outputPower: { label: 'Output Power (P_out)', value: formatQuantity(pOutWatts, 'power') },
    },
    visualData: {
      D,
      Vin: safeVin,
      absVout: safeVout,
      l1H,
      l2H,
      c1Farads,
      c2Farads,
      vStress,
    },
  };
}
