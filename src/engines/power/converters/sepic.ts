import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export interface SepicInputs {
  inputVoltageV: number;
  outputVoltageV: number;
  outputCurrentA: number;
  switchingFrequencyHz: number;
  diodeForwardDropV?: number;
  inductorRipplePercent?: number; // e.g. 40%
  desiredOutputRippleV?: number;
}

export function calculateSepicConverter(inputs: SepicInputs): CalculationResult {
  const {
    inputVoltageV: Vin,
    outputVoltageV: Vout,
    outputCurrentA: Iout,
    switchingFrequencyHz: fs,
    diodeForwardDropV: Vd = 0.5,
    inductorRipplePercent: ripPct = 40,
    desiredOutputRippleV: vRipTarget = 0.05,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeVin = Math.max(Vin, 0.1);
  const safeVout = Math.max(Vout, 0.1);
  const safeFs = Math.max(fs, 100);
  const safeIout = Math.max(Iout, 0.01);

  // SEPIC duty cycle accounting for diode drop:
  // D = (Vout + Vd) / (Vin + Vout + Vd)
  const D = (safeVout + Vd) / (safeVin + safeVout + Vd);
  const pOutWatts = safeVout * safeIout;

  // Average input current: Iin = Iout * (D / (1 - D))
  const iInAvgA = safeIout * (D / (1 - D));

  // In SEPIC, average currents through L1 and L2:
  // I_L1,avg = Iin
  // I_L2,avg = Iout
  const ripRatio = ripPct / 100;
  const deltaIL1 = iInAvgA * ripRatio;
  const deltaIL2 = safeIout * ripRatio;

  // Inductor values:
  // L1 = (Vin * D) / (fs * deltaIL1)
  // L2 = (Vin * D) / (fs * deltaIL2)
  // If coupled inductors are used on a common core, L1 = L2 can be halved
  const l1H = (safeVin * D) / (safeFs * Math.max(deltaIL1, 1e-4));
  const l2H = (safeVin * D) / (safeFs * Math.max(deltaIL2, 1e-4));

  // Coupling capacitor Cs voltage stress: average voltage across Cs = Vin
  // Cs capacitance requirement: deltaV_Cs ≈ (Iout * D) / (fs * Cs), typically target < 5% Vin
  const targetDeltaVCs = Math.max(safeVin * 0.05, 0.1);
  const csFarads = (safeIout * D) / (safeFs * targetDeltaVCs);

  // Output capacitor: Cout delivers load current during switch ON time
  const coutFarads = (safeIout * D) / (safeFs * Math.max(vRipTarget, 1e-3));

  // Switch and diode voltage stress: V_stress = Vin + Vout + Vd
  const vSwitchStress = safeVin + safeVout + Vd;

  steps.push({
    stepNumber: 1,
    title: 'Calculate SEPIC Duty Cycle (D)',
    formula: 'D = (V_out + V_D) / (V_in + V_out + V_D)',
    substitution: `(${safeVout} V + ${Vd} V) / (${safeVin} V + ${safeVout} V + ${Vd} V)`,
    result: `D = ${D.toFixed(4)} (${(D * 100).toFixed(2)}%)`,
    annotation: 'SEPIC provides non-inverting step-up and step-down capability with capacitive DC isolation between input and output.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Size Primary (L1) and Secondary (L2) Inductors',
    formula: 'L₁ = (V_in × D) / (f_s × ΔI_L1);  L₂ = (V_in × D) / (f_s × ΔI_L2)',
    substitution: `(${safeVin} V × ${D.toFixed(3)}) / (${safeFs} Hz × ripple)`,
    result: `L₁ = ${formatQuantity(l1H, 'inductance')},  L₂ = ${formatQuantity(l2H, 'inductance')}`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Size AC Coupling Capacitor (C_s) & Output Filter (C_out)',
    formula: 'C_s = (I_out × D) / (f_s × ΔV_Cs);  C_out = (I_out × D) / (f_s × ΔV_out)',
    substitution: `(${safeIout} A × ${D.toFixed(3)}) / (${safeFs} Hz × ripple)`,
    result: `C_s ≥ ${formatQuantity(csFarads, 'capacitance')},  C_out ≥ ${formatQuantity(coutFarads, 'capacitance')}`,
  });

  steps.push({
    stepNumber: 4,
    title: 'Calculate Peak Switch & Diode Reverse Voltage Stress',
    formula: 'V_switch,pk = V_diode,pk = V_in + V_out + V_D',
    substitution: `${safeVin} V + ${safeVout} V + ${Vd} V`,
    result: `Peak Stress = ${vSwitchStress.toFixed(1)} V`,
    annotation: 'Semiconductor ratings must accommodate Vin + Vout plus parasitic ringing spikes.',
  });

  return {
    primaryValue: D,
    formattedValue: `${(D * 100).toFixed(2)}%`,
    unit: '%',
    label: 'SEPIC Duty Cycle (D)',
    classification: 'TOPOLOGY / DESIGN DEPENDENT',
    standardsContext: 'Single-Ended Primary-Inductor Converter (SEPIC) in CCM. Assumes separate uncoupled inductors or equal coupled winding topology.',
    warnings,
    steps,
    additionalOutputs: {
      dutyCycle: { label: 'Operating Duty Ratio', value: D.toFixed(4) },
      inputInductanceL1: { label: 'Primary Inductance (L₁)', value: formatQuantity(l1H, 'inductance') },
      secondaryInductanceL2: { label: 'Secondary Inductance (L₂)', value: formatQuantity(l2H, 'inductance') },
      couplingCapacitorCs: { label: 'Series Coupling Cap (C_s)', value: formatQuantity(csFarads, 'capacitance') },
      outputCapacitorCout: { label: 'Output Filter Cap (C_out)', value: formatQuantity(coutFarads, 'capacitance') },
      switchVoltageStress: { label: 'Switch & Diode Voltage Stress', value: `${vSwitchStress.toFixed(1)} V` },
      inputCurrentAvg: { label: 'Average Input Current (I_in)', value: `${iInAvgA.toFixed(3)} A` },
      outputPower: { label: 'Output Power (P_out)', value: formatQuantity(pOutWatts, 'power') },
    },
    visualData: {
      D,
      Vin: safeVin,
      Vout: safeVout,
      l1H,
      l2H,
      csFarads,
      coutFarads,
      vSwitchStress,
    },
  };
}
