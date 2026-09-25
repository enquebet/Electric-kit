import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export type HBridgeSwitchState = 'forward' | 'reverse' | 'freewheel-low' | 'freewheel-high' | 'shoot-through';

export interface HBridgeInputs {
  dcBusVoltageV: number;
  selectedState: HBridgeSwitchState;
  deadTimeNs?: number;
}

export function calculateHBridgeFundamentals(inputs: HBridgeInputs): CalculationResult {
  const { dcBusVoltageV: Vbus, selectedState, deadTimeNs = 250 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let vOutV = 0;
  let stateDescription = '';

  switch (selectedState) {
    case 'forward':
      vOutV = Vbus;
      stateDescription = 'Q1 (High-Side Left) and Q4 (Low-Side Right) Closed -> Output = +V_bus';
      break;
    case 'reverse':
      vOutV = -Vbus;
      stateDescription = 'Q2 (High-Side Right) and Q3 (Low-Side Left) Closed -> Output = -V_bus';
      break;
    case 'freewheel-low':
      vOutV = 0;
      stateDescription = 'Q3 and Q4 Closed (Both Low-Side) -> Output = 0 V (Recirculating loop)';
      break;
    case 'freewheel-high':
      vOutV = 0;
      stateDescription = 'Q1 and Q2 Closed (Both High-Side) -> Output = 0 V (Recirculating loop)';
      break;
    case 'shoot-through':
      vOutV = 0;
      stateDescription = 'HAZARD: Q1 + Q3 or Q2 + Q4 Closed Simultaneously! Dead short circuit across DC bus!';
      break;
  }

  if (selectedState === 'shoot-through') {
    warnings.push({
      severity: 'danger',
      title: 'CATASTROPHIC SHOOT-THROUGH HAZARD',
      message: 'Both high-side and low-side switches on the same phase leg are active simultaneously, shorting the DC bus! This causes immediate semiconductor vaporization. Hardware interlocks and dead-time insertion are mandatory.',
    });
  } else {
    warnings.push({
      severity: 'info',
      title: 'Dead-Time Insertion Requirement',
      message: `A minimum dead-time (currently configured to ${deadTimeNs} ns) must separate complementary gate turn-off and turn-on commands to account for device turn-off delay (t_off) and prevent cross-conduction.`,
    });
  }

  steps.push({
    stepNumber: 1,
    title: 'Analyze Bridge Leg Switching Combination',
    formula: 'V_out = V_left_leg - V_right_leg',
    substitution: `State: ${selectedState.toUpperCase()}`,
    result: `V_out = ${vOutV >= 0 ? '+' : ''}${vOutV.toFixed(1)} V`,
    annotation: stateDescription,
  });

  return {
    primaryValue: vOutV,
    formattedValue: `${vOutV >= 0 ? '+' : ''}${vOutV.toFixed(1)} V`,
    unit: 'V',
    label: 'H-Bridge Differential Output',
    classification: 'THEORETICAL',
    standardsContext: 'Single-phase full H-bridge inverter switching topology state analysis.',
    warnings,
    steps,
    additionalOutputs: {
      outputPotential: { label: 'Output Differential Voltage', value: `${vOutV >= 0 ? '+' : ''}${vOutV.toFixed(1)} V` },
      activeState: { label: 'Switch State', value: selectedState },
      configuredDeadTime: { label: 'Recommended Dead-Time', value: `${deadTimeNs} ns` },
      busVoltage: { label: 'DC Bus Voltage (V_bus)', value: `${Vbus.toFixed(1)} V` },
    },
    visualData: {
      vOutV,
      Vbus,
      selectedState,
      deadTimeNs,
    },
  };
}

export interface SpwmInputs {
  dcBusVoltageV: number;
  modulationIndexMa: number; // ma = Vcontrol / Vcarrier
  carrierFrequencyHz: number;
  fundamentalFrequencyHz: number;
  inverterTopology?: 'full-bridge' | 'half-bridge';
}

export function calculateSpwmFundamentals(inputs: SpwmInputs): CalculationResult {
  const {
    dcBusVoltageV: Vbus,
    modulationIndexMa: ma,
    carrierFrequencyHz: fsw,
    fundamentalFrequencyHz: fFund,
    inverterTopology = 'full-bridge',
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeMa = Math.max(ma, 0);
  const safeFund = Math.max(fFund, 0.1);
  const safeCarrier = Math.max(fsw, 100);

  // Frequency modulation ratio: mf = f_carrier / f_fundamental
  const mf = safeCarrier / safeFund;

  // Full-bridge peak fundamental: V1,pk = ma * Vbus (in linear region ma <= 1.0)
  // Half-bridge peak fundamental: V1,pk = ma * Vbus / 2
  const peakMultiplier = inverterTopology === 'full-bridge' ? 1.0 : 0.5;
  const v1PeakLinear = safeMa * Vbus * peakMultiplier;
  const v1RmsLinear = v1PeakLinear / Math.SQRT2;

  if (safeMa > 1.0) {
    warnings.push({
      severity: 'warning',
      title: 'Overmodulation Region (m_a > 1.0)',
      message: `Modulation index m_a = ${safeMa.toFixed(2)} operates in overmodulation. Linear relationship between m_a and fundamental voltage no longer holds; lower-order harmonics (3rd, 5th, 7th) will appear in output spectrum.`,
    });
  }

  steps.push({
    stepNumber: 1,
    title: 'Calculate Frequency Modulation Index (m_f)',
    formula: 'm_f = f_carrier / f_fundamental',
    substitution: `${safeCarrier} Hz / ${safeFund} Hz`,
    result: `m_f = ${mf.toFixed(1)}`,
    annotation: 'Integer multiple and odd odd-symmetry m_f cancels even harmonics and half-wave asymmetry.',
  });

  steps.push({
    stepNumber: 2,
    title: `Calculate Fundamental Peak & RMS Output Voltage (${inverterTopology})`,
    formula: inverterTopology === 'full-bridge' ? 'V₁,pk = m_a × V_bus;  V₁,rms = V₁,pk / √2' : 'V₁,pk = ½ × m_a × V_bus;  V₁,rms = V₁,pk / √2',
    substitution: `${safeMa.toFixed(3)} × ${Vbus} V × ${peakMultiplier}`,
    result: `V₁,pk = ${v1PeakLinear.toFixed(1)} V,  V₁,rms = ${v1RmsLinear.toFixed(1)} V AC`,
  });

  return {
    primaryValue: v1RmsLinear,
    formattedValue: `${v1RmsLinear.toFixed(1)} V RMS`,
    unit: 'V',
    label: 'Fundamental RMS Voltage (V₁,rms)',
    classification: 'THEORETICAL',
    standardsContext: 'Sinusoidal Pulse-Width Modulation (SPWM) Fourier decomposition under linear modulation index (m_a ≤ 1.0).',
    warnings,
    steps,
    additionalOutputs: {
      fundamentalRmsVoltage: { label: 'Fundamental Output (V₁,rms)', value: `${v1RmsLinear.toFixed(1)} V RMS` },
      fundamentalPeakVoltage: { label: 'Fundamental Peak (V₁,pk)', value: `${v1PeakLinear.toFixed(1)} V` },
      amplitudeModulationIndex: { label: 'Modulation Index (m_a)', value: safeMa.toFixed(3) },
      frequencyModulationIndex: { label: 'Frequency Ratio (m_f)', value: mf.toFixed(1) },
      modulationRegime: { label: 'Operating Region', value: safeMa <= 1.0 ? 'Linear Modulation' : 'Overmodulation / Quasi-Square' },
    },
    visualData: {
      v1RmsLinear,
      v1PeakLinear,
      safeMa,
      mf,
      Vbus,
    },
  };
}

export interface InverterRmsInputs {
  dcBusVoltageV: number;
  waveformType: 'pure-sine-spwm' | 'square-wave' | 'modified-sine';
  modulationIndexMa?: number; // for SPWM
  pulseWidthDutyCycle?: number; // for modified sine wave (typically 0.5 to 0.7)
}

export function calculateInverterRmsOutput(inputs: InverterRmsInputs): CalculationResult {
  const {
    dcBusVoltageV: Vbus,
    waveformType,
    modulationIndexMa: ma = 0.9,
    pulseWidthDutyCycle: Dpulse = 0.5,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let vRms = 0;
  let formulaStr = '';
  let subStr = '';

  switch (waveformType) {
    case 'pure-sine-spwm':
      // Vrms = (ma * Vbus) / sqrt(2)
      vRms = (ma * Vbus) / Math.SQRT2;
      formulaStr = 'V_rms = (m_a × V_bus) / √2';
      subStr = `(${ma.toFixed(2)} × ${Vbus} V) / √2`;
      break;
    case 'square-wave':
      // Ideal square wave switching between +Vbus and -Vbus:
      vRms = Vbus;
      formulaStr = 'V_rms = V_bus';
      subStr = `${Vbus} V`;
      break;
    case 'modified-sine':
      // Quasi-square 3-level (+Vbus, 0, -Vbus): Vrms = Vbus * sqrt(D_pulse)
      vRms = Vbus * Math.sqrt(Math.min(Math.max(Dpulse, 0.01), 1.0));
      formulaStr = 'V_rms = V_bus × √D_pulse';
      subStr = `${Vbus} V × √(${Dpulse.toFixed(2)})`;
      break;
  }

  steps.push({
    stepNumber: 1,
    title: `Calculate True RMS Output Voltage: ${waveformType.toUpperCase()}`,
    formula: formulaStr,
    substitution: subStr,
    result: `V_rms = ${vRms.toFixed(2)} V`,
  });

  return {
    primaryValue: vRms,
    formattedValue: `${vRms.toFixed(2)} V RMS`,
    unit: 'V',
    label: 'Inverter Output RMS Voltage',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      rmsVoltage: { label: 'Output RMS Voltage', value: `${vRms.toFixed(2)} V` },
      waveformTopology: { label: 'Output Waveform Profile', value: waveformType },
      dcBusVoltage: { label: 'DC Link Voltage', value: `${Vbus.toFixed(1)} V` },
    },
    visualData: {
      vRms,
      Vbus,
      waveformType,
    },
  };
}

export interface InverterPowerInputs {
  outputRmsVoltageV: number;
  outputRmsCurrentA: number;
  powerFactor: number; // cos(phi), e.g. 0.8 to 1.0
  inverterEfficiencyPercent?: number; // e.g. 92%
  dcBusVoltageV: number;
}

export function calculateInverterPower(inputs: InverterPowerInputs): CalculationResult {
  const {
    outputRmsVoltageV: Vrms,
    outputRmsCurrentA: Irms,
    powerFactor: pf,
    inverterEfficiencyPercent: effPct = 90,
    dcBusVoltageV: Vdc,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safePf = Math.max(0.1, Math.min(Math.abs(pf), 1.0));
  const eta = Math.max(0.1, Math.min(effPct / 100, 1.0));
  const safeVdc = Math.max(Vdc, 0.1);

  // Apparent power S = Vrms * Irms (VA)
  const apparentPowerVa = Vrms * Irms;
  // Active real power P = S * cos(phi) (Watts)
  const activePowerWatts = apparentPowerVa * safePf;
  // Reactive power Q = sqrt(S^2 - P^2) (VAR)
  const reactivePowerVar = Math.sqrt(Math.max(Math.pow(apparentPowerVa, 2) - Math.pow(activePowerWatts, 2), 0));

  // Required DC input power:
  const pDcInWatts = activePowerWatts / eta;
  // Required average DC current from battery/bus:
  const iDcInAvgA = pDcInWatts / safeVdc;

  steps.push({
    stepNumber: 1,
    title: 'Calculate AC Apparent (S) and Active Real Power (P)',
    formula: 'S = V_rms × I_rms;  P = S × cos(φ)',
    substitution: `${Vrms} V × ${Irms} A = ${apparentPowerVa.toFixed(1)} VA;  ${apparentPowerVa.toFixed(1)} VA × ${safePf.toFixed(2)}`,
    result: `P = ${formatQuantity(activePowerWatts, 'power')},  S = ${apparentPowerVa.toFixed(1)} VA`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate DC Bus Source Input Power and Current Demand',
    formula: 'P_dc = P_ac / η;  I_dc(avg) = P_dc / V_dc',
    substitution: `${activePowerWatts.toFixed(1)} W / ${(eta * 100).toFixed(0)}% = ${pDcInWatts.toFixed(1)} W;  ${pDcInWatts.toFixed(1)} W / ${safeVdc} V`,
    result: `P_dc = ${formatQuantity(pDcInWatts, 'power')},  I_dc(avg) = ${iDcInAvgA.toFixed(2)} A`,
  });

  return {
    primaryValue: activePowerWatts,
    formattedValue: formatQuantity(activePowerWatts, 'power'),
    unit: 'W',
    label: 'Inverter Active Output Power (P)',
    classification: 'ENGINEERING ESTIMATE',
    warnings,
    steps,
    additionalOutputs: {
      activePower: { label: 'Active Real Power (P)', value: formatQuantity(activePowerWatts, 'power') },
      apparentPower: { label: 'Apparent Power (S)', value: `${apparentPowerVa.toFixed(1)} VA` },
      reactivePower: { label: 'Reactive Power (Q)', value: `${reactivePowerVar.toFixed(1)} VAR` },
      dcInputPower: { label: 'DC Input Power (P_dc)', value: formatQuantity(pDcInWatts, 'power') },
      dcBusCurrent: { label: 'Average DC Bus Current (I_dc)', value: `${iDcInAvgA.toFixed(2)} A` },
      efficiency: { label: 'Assumed Inverter Efficiency', value: `${(eta * 100).toFixed(1)}%` },
    },
    visualData: {
      activePowerWatts,
      apparentPowerVa,
      reactivePowerVar,
      pDcInWatts,
      iDcInAvgA,
      safePf,
    },
  };
}
