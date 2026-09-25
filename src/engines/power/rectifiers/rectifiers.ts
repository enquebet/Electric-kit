import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export interface HalfWaveRectifierInputs {
  inputRmsVoltageV: number;
  inputFrequencyHz: number;
  loadResistanceOhms: number;
  diodeForwardDropV?: number;
}

export function calculateHalfWaveRectifier(inputs: HalfWaveRectifierInputs): CalculationResult {
  const {
    inputRmsVoltageV: Vrms,
    inputFrequencyHz: fIn,
    loadResistanceOhms: Rload,
    diodeForwardDropV: Vd = 0.7,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const vPeak = Vrms * Math.SQRT2;
  const vPeakEffective = Math.max(vPeak - Vd, 0);

  if (vPeak <= Vd) {
    warnings.push({
      severity: 'warning',
      title: 'Insufficient Input Potential',
      message: `Peak input voltage (${vPeak.toFixed(2)} V) does not overcome diode forward barrier drop (${Vd} V).`,
    });
  }

  // In half-wave:
  // V_avg = V_peak,eff / π
  // V_rms = V_peak,eff / 2
  // f_ripple = f_in
  // PIV = V_peak
  const vAvg = vPeakEffective / Math.PI;
  const vRmsOut = vPeakEffective / 2;
  const rippleFreqHz = fIn;
  const safeR = Math.max(Rload, 0.01);
  const iAvg = vAvg / safeR;
  const iPeak = vPeakEffective / safeR;
  const piv = vPeak;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Secondary Peak Voltage & Forward Diode Drop',
    formula: 'V_peak = √2 × V_rms;  V_peak,eff = V_peak - V_D',
    substitution: `√2 × ${Vrms} V - ${Vd} V = ${vPeak.toFixed(2)} V - ${Vd} V`,
    result: `Effective Peak = ${vPeakEffective.toFixed(2)} V`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Unfiltered Average (DC) & RMS Output Voltages',
    formula: 'V_avg = V_peak,eff / π;  V_rms = V_peak,eff / 2',
    substitution: `${vPeakEffective.toFixed(2)} V / π  and  ${vPeakEffective.toFixed(2)} V / 2`,
    result: `V_dc(avg) = ${vAvg.toFixed(2)} V,  V_rms = ${vRmsOut.toFixed(2)} V`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Determine Ripple Fundamental Frequency & Diode PIV Stress',
    formula: 'f_ripple = f_in;  PIV = V_peak',
    substitution: `f_ripple = ${fIn} Hz;  PIV = ${vPeak.toFixed(2)} V`,
    result: `Ripple Freq = ${rippleFreqHz} Hz,  Diode PIV = ${piv.toFixed(2)} V`,
  });

  return {
    primaryValue: vAvg,
    formattedValue: `${vAvg.toFixed(2)} V DC`,
    unit: 'V',
    label: 'Average Output Voltage (V_avg)',
    classification: 'THEORETICAL',
    standardsContext: 'Ideal half-wave sinusoidal single-phase rectification model without output smoothing filter.',
    warnings,
    steps,
    additionalOutputs: {
      averageOutputVoltage: { label: 'Average DC Output (V_avg)', value: `${vAvg.toFixed(2)} V` },
      rmsOutputVoltage: { label: 'RMS Output Voltage (V_rms)', value: `${vRmsOut.toFixed(2)} V` },
      rippleFrequency: { label: 'Output Ripple Frequency', value: `${rippleFreqHz} Hz` },
      peakInverseVoltage: { label: 'Diode Peak Inverse Voltage (PIV)', value: `${piv.toFixed(2)} V` },
      averageDiodeCurrent: { label: 'Average Diode Current (I_avg)', value: `${iAvg.toFixed(3)} A` },
      peakDiodeCurrent: { label: 'Peak Diode Current (I_peak)', value: `${iPeak.toFixed(3)} A` },
      formFactor: { label: 'Form Factor (V_rms / V_avg)', value: `${(vRmsOut / Math.max(vAvg, 1e-4)).toFixed(3)} (Ideal = 1.57)` },
    },
    visualData: {
      vAvg,
      vRmsOut,
      vPeak,
      rippleFreqHz,
      piv,
    },
  };
}

export interface CenterTappedRectifierInputs {
  secondaryRmsPerLegVoltageV: number; // RMS per half winding
  inputFrequencyHz: number;
  loadResistanceOhms: number;
  diodeForwardDropV?: number;
}

export function calculateFullWaveCenterTappedRectifier(inputs: CenterTappedRectifierInputs): CalculationResult {
  const {
    secondaryRmsPerLegVoltageV: VrmsHalf,
    inputFrequencyHz: fIn,
    loadResistanceOhms: Rload,
    diodeForwardDropV: Vd = 0.7,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const vPeakHalf = VrmsHalf * Math.SQRT2;
  const vPeakEffective = Math.max(vPeakHalf - Vd, 0);

  // Full-wave center tapped:
  // V_avg = 2 * (V_peak - V_D) / π
  // V_rms = (V_peak - V_D) / √2
  // f_ripple = 2 * f_in
  // Diode PIV = 2 * V_peak ! (Because non-conducting diode sees full secondary winding)
  const vAvg = (2 * vPeakEffective) / Math.PI;
  const vRmsOut = vPeakEffective / Math.SQRT2;
  const rippleFreqHz = 2 * fIn;
  const piv = 2 * vPeakHalf;
  const safeR = Math.max(Rload, 0.01);
  const iLoadAvg = vAvg / safeR;
  const iDiodeAvg = iLoadAvg / 2; // Each diode conducts half the cycles

  warnings.push({
    severity: 'warning',
    title: 'High Diode Voltage Stress (PIV = 2 × V_peak)',
    message: `Center-tapped topology subjects each diode to the entire secondary winding voltage during non-conduction: PIV = 2 × V_peak = ${piv.toFixed(1)} V.`,
  });

  steps.push({
    stepNumber: 1,
    title: 'Calculate Effective Peak Voltage per Center-Tapped Leg',
    formula: 'V_peak = √2 × V_rms,half;  V_peak,eff = V_peak - V_D',
    substitution: `√2 × ${VrmsHalf} V - ${Vd} V`,
    result: `V_peak,eff = ${vPeakEffective.toFixed(2)} V`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Full-Wave Average DC & RMS Output Voltages',
    formula: 'V_avg = 2 × V_peak,eff / π;  V_rms = V_peak,eff / √2',
    substitution: `2 × ${vPeakEffective.toFixed(2)} V / π  and  ${vPeakEffective.toFixed(2)} V / √2`,
    result: `V_avg = ${vAvg.toFixed(2)} V,  V_rms = ${vRmsOut.toFixed(2)} V`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Determine Full-Wave Ripple Frequency & Center-Tap Diode PIV',
    formula: 'f_ripple = 2 × f_in;  PIV = 2 × V_peak',
    substitution: `2 × ${fIn} Hz = ${rippleFreqHz} Hz;  2 × ${vPeakHalf.toFixed(2)} V`,
    result: `Ripple Frequency = ${rippleFreqHz} Hz,  Diode PIV = ${piv.toFixed(2)} V`,
  });

  return {
    primaryValue: vAvg,
    formattedValue: `${vAvg.toFixed(2)} V DC`,
    unit: 'V',
    label: 'Average Output Voltage (V_avg)',
    classification: 'THEORETICAL',
    standardsContext: 'Center-tapped secondary full-wave rectifier theoretical model without reservoir capacitor.',
    warnings,
    steps,
    additionalOutputs: {
      averageOutputVoltage: { label: 'Average DC Output', value: `${vAvg.toFixed(2)} V` },
      rmsOutputVoltage: { label: 'RMS Output Voltage', value: `${vRmsOut.toFixed(2)} V` },
      rippleFrequency: { label: 'Ripple Frequency (2× f_in)', value: `${rippleFreqHz} Hz` },
      peakInverseVoltage: { label: 'Diode Peak Inverse Voltage (2× V_peak)', value: `${piv.toFixed(2)} V` },
      diodeAverageCurrent: { label: 'Average Current per Diode (I_load / 2)', value: `${iDiodeAvg.toFixed(3)} A` },
      formFactor: { label: 'Form Factor (V_rms / V_avg)', value: `${(vRmsOut / Math.max(vAvg, 1e-4)).toFixed(3)} (Ideal = 1.11)` },
    },
    visualData: {
      vAvg,
      vRmsOut,
      rippleFreqHz,
      piv,
      iDiodeAvg,
    },
  };
}

export interface BridgeRectifierAdvancedInputs {
  acRmsVoltageV: number;
  inputFrequencyHz: number;
  loadCurrentA: number;
  diodeForwardDropV?: number;
}

export function calculateBridgeRectifierAdvanced(inputs: BridgeRectifierAdvancedInputs): CalculationResult {
  const {
    acRmsVoltageV: Vrms,
    inputFrequencyHz: fIn,
    loadCurrentA: Iload,
    diodeForwardDropV: Vd = 0.7,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const vPeak = Vrms * Math.SQRT2;
  // In bridge, current always traverses TWO forward-biased series diodes
  const vPeakDc = Math.max(vPeak - 2 * Vd, 0);

  // Unfiltered bridge:
  // V_avg = 2 * (V_peak - 2*V_D) / π
  // V_rms = (V_peak - 2*V_D) / √2
  // f_ripple = 2 * f_in
  // Diode PIV = V_peak - V_D ≈ V_peak
  // Conduction power loss = 2 * V_D * I_load
  const vAvg = (2 * vPeakDc) / Math.PI;
  const vRmsOut = vPeakDc / Math.SQRT2;
  const rippleFreqHz = 2 * fIn;
  const piv = vPeak - Vd;
  const diodePowerLossWatts = 2 * Vd * Iload;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Peak AC Voltage & Dual-Diode Forward Voltage Drop',
    formula: 'V_peak = √2 × V_rms;  V_peak,dc = V_peak - 2 × V_D',
    substitution: `√2 × ${Vrms} V - 2 × ${Vd} V = ${vPeak.toFixed(2)} V - ${(2 * Vd).toFixed(2)} V`,
    result: `V_peak,dc = ${vPeakDc.toFixed(2)} V`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Unfiltered DC Average & RMS Voltages',
    formula: 'V_avg = 2 × V_peak,dc / π;  V_rms = V_peak,dc / √2',
    substitution: `2 × ${vPeakDc.toFixed(2)} V / π  and  ${vPeakDc.toFixed(2)} V / √2`,
    result: `V_avg = ${vAvg.toFixed(2)} V,  V_rms = ${vRmsOut.toFixed(2)} V`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Diode Conduction Losses & PIV Stress',
    formula: 'P_loss = 2 × V_D × I_load;  PIV = V_peak - V_D',
    substitution: `2 × ${Vd} V × ${Iload} A;  ${vPeak.toFixed(2)} V - ${Vd} V`,
    result: `Bridge Conduction Loss = ${diodePowerLossWatts.toFixed(2)} W,  Diode PIV = ${piv.toFixed(1)} V`,
  });

  return {
    primaryValue: vAvg,
    formattedValue: `${vAvg.toFixed(2)} V DC`,
    unit: 'V',
    label: 'Bridge Rectifier Average Output',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Single-phase full-wave bridge rectifier (Graetz bridge) model with diode forward conduction loss.',
    warnings,
    steps,
    additionalOutputs: {
      averageOutputVoltage: { label: 'Average Output (V_avg)', value: `${vAvg.toFixed(2)} V` },
      peakDcVoltage: { label: 'Peak Rectified Voltage (V_peak,dc)', value: `${vPeakDc.toFixed(2)} V` },
      rmsOutputVoltage: { label: 'RMS Output Voltage (V_rms)', value: `${vRmsOut.toFixed(2)} V` },
      rippleFrequency: { label: 'Output Ripple Frequency (2× f_in)', value: `${rippleFreqHz} Hz` },
      diodePiv: { label: 'Diode PIV Stress', value: `${piv.toFixed(1)} V` },
      totalDiodeConductionLoss: { label: 'Total Diode Conduction Loss', value: `${diodePowerLossWatts.toFixed(2)} W` },
    },
    visualData: {
      vAvg,
      vPeakDc,
      vPeak,
      rippleFreqHz,
      piv,
      diodePowerLossWatts,
    },
  };
}

export interface RectifierCapacitorFilterInputs {
  loadCurrentA: number;
  capacitanceFarads: number;
  inputFrequencyHz: number;
  rectifierTopology: 'half-wave' | 'full-wave';
  inputPeakVoltageV: number;
}

export function calculateRectifierCapacitorFilter(inputs: RectifierCapacitorFilterInputs): CalculationResult {
  const {
    loadCurrentA: Iload,
    capacitanceFarads: C,
    inputFrequencyHz: fIn,
    rectifierTopology: topology,
    inputPeakVoltageV: Vpeak,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // Ripple frequency:
  // Half-wave: f_ripple = f_in
  // Full-wave: f_ripple = 2 * f_in
  const fRipple = topology === 'half-wave' ? fIn : 2 * fIn;

  const safeC = Math.max(C, 1e-9);
  const safeFRipple = Math.max(fRipple, 1);

  // Peak-to-peak ripple voltage approximation:
  // ΔV_ripple ≈ I_load / (f_ripple × C)
  const deltaVpp = Iload / (safeFRipple * safeC);

  // Approximate DC average voltage under load:
  // V_dc ≈ V_peak - (ΔV_ripple / 2)
  const vDc = Math.max(Vpeak - deltaVpp / 2, 0);

  // Ripple factor: γ = V_ripple,rms / V_dc ≈ ΔV_pp / (2√3 × V_dc)
  const vRippleRms = deltaVpp / (2 * Math.sqrt(3));
  const rippleFactor = vDc > 0 ? (vRippleRms / vDc) * 100 : 100;

  if (deltaVpp > Vpeak * 0.3) {
    warnings.push({
      severity: 'warning',
      title: 'Excessive Voltage Ripple (>30%)',
      message: `Output ripple (${deltaVpp.toFixed(2)} V pk-pk) exceeds 30% of peak DC voltage. Increase reservoir capacitance or reduce load.`,
    });
  }

  steps.push({
    stepNumber: 1,
    title: `Determine Ripple Frequency for ${topology === 'half-wave' ? 'Half-Wave (f_in)' : 'Full-Wave (2 × f_in)'}`,
    formula: topology === 'half-wave' ? 'f_ripple = f_in' : 'f_ripple = 2 × f_in',
    substitution: topology === 'half-wave' ? `${fIn} Hz` : `2 × ${fIn} Hz`,
    result: `f_ripple = ${fRipple} Hz`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Peak-to-Peak Ripple Voltage (ΔV_ripple)',
    formula: 'ΔV_ripple ≈ I_load / (f_ripple × C)',
    substitution: `${Iload} A / (${fRipple} Hz × ${formatQuantity(safeC, 'capacitance')})`,
    result: `ΔV_ripple ≈ ${deltaVpp.toFixed(3)} V (${(deltaVpp * 1000).toFixed(1)} mV)`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Estimate Filtered DC Average Output Voltage',
    formula: 'V_dc ≈ V_peak - (ΔV_ripple / 2)',
    substitution: `${Vpeak} V - (${deltaVpp.toFixed(3)} V / 2)`,
    result: `V_dc ≈ ${vDc.toFixed(2)} V (Ripple Factor γ = ${rippleFactor.toFixed(2)}%)`,
  });

  return {
    primaryValue: deltaVpp,
    formattedValue: `${deltaVpp.toFixed(3)} V pk-pk`,
    unit: 'V',
    label: 'Capacitor-Filtered Output Ripple',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Simplified linear discharge approximation ΔV ≈ I/(f·C) valid for small ripple ratios (ΔV << V_peak).',
    warnings,
    steps,
    additionalOutputs: {
      peakToPeakRipple: { label: 'Peak-to-Peak Ripple Voltage', value: `${deltaVpp.toFixed(3)} V` },
      filteredDcVoltage: { label: 'Average DC Output (V_dc)', value: `${vDc.toFixed(2)} V` },
      rippleFrequency: { label: 'Effective Ripple Frequency', value: `${fRipple} Hz` },
      rippleFactorPercent: { label: 'Ripple Factor (γ)', value: `${rippleFactor.toFixed(2)}%` },
      capacitanceValue: { label: 'Filter Capacitance (C)', value: formatQuantity(safeC, 'capacitance') },
    },
    visualData: {
      deltaVpp,
      vDc,
      fRipple,
      rippleFactor,
      Vpeak,
    },
  };
}

export interface DiodeStressInputs {
  averageCurrentA: number;
  peakCurrentA: number;
  peakReverseVoltageV: number;
  forwardVoltageDropV?: number;
}

export function calculateRectifierDiodeStress(inputs: DiodeStressInputs): CalculationResult {
  const {
    averageCurrentA: Iavg,
    peakCurrentA: Ipk,
    peakReverseVoltageV: Vr,
    forwardVoltageDropV: Vf = 0.8,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const powerLossWatts = Iavg * Vf;
  // Recommended datasheet margins:
  // VRRM >= 1.5 * Vr
  // IF(AV) >= 1.5 * Iavg
  // IFSM >= 1.5 * Ipk
  const recommendedVrrm = Vr * 1.5;
  const recommendedIfAv = Iavg * 1.5;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Diode Continuous Forward Conduction Loss',
    formula: 'P_loss = V_F × I_F(AV)',
    substitution: `${Vf} V × ${Iavg.toFixed(3)} A`,
    result: `P_loss = ${powerLossWatts.toFixed(2)} W`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Apply Engineering De-rating Margins (Safety Factor ≥ 1.5×)',
    formula: 'V_RRM,req ≥ 1.5 × V_R,pk;  I_F(AV),req ≥ 1.5 × I_avg',
    substitution: `1.5 × ${Vr.toFixed(1)} V  and  1.5 × ${Iavg.toFixed(3)} A`,
    result: `Recommended Ratings: V_RRM ≥ ${recommendedVrrm.toFixed(0)} V, I_F(AV) ≥ ${recommendedIfAv.toFixed(2)} A`,
    annotation: 'Actual diode choice requires inspecting thermal junction-to-ambient resistance and manufacturer datasheets.',
  });

  return {
    primaryValue: powerLossWatts,
    formattedValue: `${powerLossWatts.toFixed(2)} W`,
    unit: 'W',
    label: 'Diode Conduction Dissipation',
    classification: 'COMPONENT-DATA DEPENDENT',
    warnings,
    steps,
    additionalOutputs: {
      conductionPowerLoss: { label: 'Diode Forward Loss', value: `${powerLossWatts.toFixed(2)} W` },
      peakReverseVoltage: { label: 'Operating Reverse Stress', value: `${Vr.toFixed(1)} V` },
      recommendedVrrm: { label: 'Minimum Recommended V_RRM', value: `${recommendedVrrm.toFixed(0)} V` },
      recommendedIfAv: { label: 'Minimum Continuous I_F(AV)', value: `${recommendedIfAv.toFixed(2)} A` },
      peakCurrentRepetitive: { label: 'Peak Repetitive Current (I_FRM)', value: `${Ipk.toFixed(2)} A` },
    },
    visualData: {
      powerLossWatts,
      Vr,
      recommendedVrrm,
      Iavg,
    },
  };
}
