import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export interface FlybackFundamentalsInputs {
  inputVoltageV: number;
  outputVoltageV: number;
  outputCurrentA: number;
  switchingFrequencyHz: number;
  primaryToSecondaryTurnsRatioNpNs?: number;
  estimatedEfficiencyPercent?: number;
  diodeForwardDropV?: number;
}

export function calculateFlybackFundamentals(inputs: FlybackFundamentalsInputs): CalculationResult {
  const {
    inputVoltageV: Vin,
    outputVoltageV: Vout,
    outputCurrentA: Iout,
    switchingFrequencyHz: fs,
    primaryToSecondaryTurnsRatioNpNs: n = 1.0,
    estimatedEfficiencyPercent: effPct = 85,
    diodeForwardDropV: Vd = 0.7,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeVin = Math.max(Vin, 0.1);
  const safeVout = Math.max(Vout, 0.1);
  const safeFs = Math.max(fs, 100);
  const safeIout = Math.max(Iout, 0.01);
  const safeN = Math.max(n, 0.01);
  const eta = Math.max(0.2, Math.min(effPct / 100, 1.0));

  const pOutWatts = safeVout * safeIout;
  const pInWatts = pOutWatts / eta;
  const energyPerCycleJ = pInWatts / safeFs;

  // Flyback CCM ideal relationship:
  // (Vout + Vd) / Vin = (Ns / Np) * (D / (1 - D)) = (1 / n) * (D / (1 - D))
  // n * (Vout + Vd) / Vin = D / (1 - D)
  // Let k = n * (Vout + Vd) / Vin
  // D = k / (1 + k)
  const k = (safeN * (safeVout + Vd)) / safeVin;
  const dutyCycle = k / (1 + k);

  // Reflected secondary voltage back to primary:
  // V_OR = n * (Vout + Vd)
  const vOR = safeN * (safeVout + Vd);
  // Ideal primary switch voltage stress:
  const vSwitchIdeal = safeVin + vOR;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Ideal Flyback Operating Duty Cycle (D)',
    formula: 'D = [ n × (V_out + V_D) ] / [ V_in + n × (V_out + V_D) ]',
    substitution: `[ ${safeN.toFixed(2)} × (${safeVout} V + ${Vd} V) ] / [ ${safeVin} V + ${vOR.toFixed(1)} V ]`,
    result: `D = ${dutyCycle.toFixed(4)} (${(dutyCycle * 100).toFixed(2)}%)`,
    annotation: 'Reflected secondary voltage V_OR = n × (Vout + Vd) appears across primary when main switch turns off.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Power & Energy Transferred per Switching Cycle',
    formula: 'P_out = V_out × I_out;  P_in = P_out / η;  E_cycle = P_in / f_s',
    substitution: `${safeVout} V × ${safeIout} A = ${pOutWatts.toFixed(1)} W;  ${pInWatts.toFixed(1)} W / ${safeFs} Hz`,
    result: `P_in = ${pInWatts.toFixed(1)} W,  E_cycle = ${(energyPerCycleJ * 1e6).toFixed(1)} µJ`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Ideal Primary Switch Voltage Stress (V_ds,pk)',
    formula: 'V_ds,pk = V_in + V_OR',
    substitution: `${safeVin} V + ${vOR.toFixed(1)} V`,
    result: `Ideal V_ds,pk = ${vSwitchIdeal.toFixed(1)} V`,
    annotation: 'In practical hardware, transformer leakage inductance produces high-voltage ringing spikes that require an RCD snubber.',
  });

  return {
    primaryValue: dutyCycle,
    formattedValue: `${(dutyCycle * 100).toFixed(2)}%`,
    unit: '%',
    label: 'Flyback Operating Duty Cycle (D)',
    classification: 'THEORETICAL',
    standardsContext: 'Ideal coupled-inductor flyback converter volt-second balance under CCM steady-state. Does not model leakage inductance or core losses.',
    warnings,
    steps,
    additionalOutputs: {
      dutyCycle: { label: 'Operating Duty Ratio', value: dutyCycle.toFixed(4) },
      reflectedVoltageVOR: { label: 'Reflected Voltage (V_OR)', value: `${vOR.toFixed(1)} V` },
      primarySwitchStress: { label: 'Ideal Switch Stress (V_in + V_OR)', value: `${vSwitchIdeal.toFixed(1)} V` },
      energyPerCycle: { label: 'Energy Transferred per Cycle', value: `${(energyPerCycleJ * 1e6).toFixed(2)} µJ` },
      inputPower: { label: 'Estimated Input Power', value: `${pInWatts.toFixed(1)} W` },
      outputPower: { label: 'Output Power (P_out)', value: formatQuantity(pOutWatts, 'power') },
    },
    visualData: {
      dutyCycle,
      vOR,
      vSwitchIdeal,
      pInWatts,
      pOutWatts,
      energyPerCycleJ,
    },
  };
}

export interface FlybackTurnsRatioInputs {
  minInputVoltageV?: number;
  maxInputVoltageV?: number;
  nominalInputVoltageV?: number;
  outputVoltageV: number;
  targetMaxDutyCycle?: number; // e.g. 0.45 or 0.50
  targetNominalDutyCycle?: number;
  diodeForwardDropV?: number;
  estimatedLeakageSpikeV?: number;
}

export function calculateFlybackTurnsRatio(inputs: FlybackTurnsRatioInputs): CalculationResult {
  const {
    minInputVoltageV,
    maxInputVoltageV,
    nominalInputVoltageV,
    outputVoltageV: Vout,
    targetMaxDutyCycle,
    targetNominalDutyCycle,
    diodeForwardDropV: Vd = 0.7,
    estimatedLeakageSpikeV: Vspike = 50,
  } = inputs;

  const VinMin = minInputVoltageV ?? nominalInputVoltageV ?? 36;
  const VinMax = maxInputVoltageV ?? nominalInputVoltageV ?? (VinMin * 1.5);
  const Dmax = targetMaxDutyCycle ?? targetNominalDutyCycle ?? 0.45;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeVinMin = Math.max(VinMin, 1);
  const safeVinMax = Math.max(VinMax, safeVinMin);
  const safeVout = Math.max(Vout, 0.1);
  const safeDmax = Math.max(0.1, Math.min(Dmax, 0.6));

  // At minimum input voltage VinMin, converter operates at maximum duty cycle Dmax:
  // V_OR = VinMin * [ Dmax / (1 - Dmax) ]
  const vOR = safeVinMin * (safeDmax / (1 - safeDmax));

  // Turns ratio n = Np / Ns = V_OR / (Vout + Vd)
  const turnsRatioN = vOR / (safeVout + Vd);

  // Peak switch voltage at VinMax:
  // V_ds,max = VinMax + V_OR + V_spike
  const vDsMax = safeVinMax + vOR + Vspike;

  // Secondary diode reverse voltage stress at VinMax:
  // V_D,rev = Vout + (VinMax / n)
  const vDiodeRev = safeVout + safeVinMax / turnsRatioN;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Reflected Secondary Voltage (V_OR)',
    formula: 'V_OR = V_in,min × [ D_max / (1 - D_max) ]',
    substitution: `${safeVinMin} V × [ ${safeDmax.toFixed(2)} / (1 - ${safeDmax.toFixed(2)}) ]`,
    result: `V_OR = ${vOR.toFixed(1)} V`,
    annotation: 'Targeting Dmax ≤ 0.45-0.50 prevents right-half-plane zero (RHPZ) instability and simplifies transformer reset.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Primary-to-Secondary Turns Ratio (n = N_p / N_s)',
    formula: 'n = N_p / N_s = V_OR / (V_out + V_D)',
    substitution: `${vOR.toFixed(1)} V / (${safeVout} V + ${Vd} V)`,
    result: `n = ${turnsRatioN.toFixed(2)} (Primary : Secondary = ${turnsRatioN.toFixed(2)} : 1)`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Estimate Maximum Primary Switch Voltage Stress at High Line (V_in,max)',
    formula: 'V_ds,max = V_in,max + V_OR + V_spike',
    substitution: `${safeVinMax} V + ${vOR.toFixed(1)} V + ${Vspike} V`,
    result: `V_ds,max = ${vDsMax.toFixed(1)} V`,
    annotation: 'MOSFET voltage rating should be chosen with at least 20% margin above this value (e.g. 600V or 650V for universal mains).',
  });

  return {
    primaryValue: turnsRatioN,
    formattedValue: `${turnsRatioN.toFixed(2)} : 1`,
    unit: 'ratio',
    label: 'Primary : Secondary Turns Ratio (n)',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Simplified preliminary flyback transformer winding ratio approximation based on low-line duty cycle optimization.',
    warnings,
    steps,
    additionalOutputs: {
      turnsRatio: { label: 'Turns Ratio (N_p / N_s)', value: `${turnsRatioN.toFixed(2)} : 1` },
      reflectedVoltage: { label: 'Reflected Output Voltage (V_OR)', value: `${vOR.toFixed(1)} V` },
      peakMosfetVoltage: { label: 'Estimated Peak V_ds Stress', value: `${vDsMax.toFixed(1)} V` },
      secondaryDiodeStress: { label: 'Secondary Diode PIV', value: `${vDiodeRev.toFixed(1)} V` },
      recommendedMosfetRating: { label: 'Suggested MOSFET Rating', value: `≥ ${(vDsMax * 1.2).toFixed(0)} V` },
    },
    visualData: {
      turnsRatioN,
      vOR,
      vDsMax,
      vDiodeRev,
      safeVinMin,
      safeVinMax,
    },
  };
}

export interface FlybackMagneticsInputs {
  inputVoltageMinV: number;
  outputPowerWatts: number;
  switchingFrequencyHz: number;
  maxDutyCycle?: number;
  currentRippleRatioKrf?: number; // Krf = deltaIp / (2 * Ip,avg), e.g. 0.5 for CCM, 1.0 for BCM/DCM
  estimatedEfficiencyPercent?: number;
}

export function calculateFlybackMagnetizingInductance(inputs: FlybackMagneticsInputs): CalculationResult {
  const {
    inputVoltageMinV: VinMin,
    outputPowerWatts: Pout,
    switchingFrequencyHz: fs,
    maxDutyCycle: Dmax = 0.45,
    currentRippleRatioKrf: Krf = 0.5,
    estimatedEfficiencyPercent: effPct = 85,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeVin = Math.max(VinMin, 1);
  const safePout = Math.max(Pout, 0.1);
  const safeFs = Math.max(fs, 100);
  const safeDmax = Math.max(0.1, Math.min(Dmax, 0.6));
  const eta = Math.max(0.2, Math.min(effPct / 100, 1.0));
  const safeKrf = Math.max(0.1, Math.min(Krf, 1.0));

  const pInWatts = safePout / eta;
  // Average primary current during switch on-time:
  // Ip,avg = Pin / (VinMin * Dmax)
  const ipAvgA = pInWatts / (safeVin * safeDmax);
  // Ripple current deltaIp = 2 * Krf * Ip,avg
  const deltaIpA = 2 * safeKrf * ipAvgA;

  // Magnetizing inductance Lm = (VinMin * Dmax) / (fs * deltaIp)
  const lmH = (safeVin * safeDmax) / (safeFs * deltaIpA);

  // Peak primary switch current:
  const iPeakPrimaryA = ipAvgA + deltaIpA / 2;

  // Stored magnetic energy in primary core per cycle:
  // Em = 0.5 * Lm * Ipeak^2
  const storedEnergyJ = 0.5 * lmH * iPeakPrimaryA * iPeakPrimaryA;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Average Primary Conduction Current (I_p,avg)',
    formula: 'I_p,avg = P_in / (V_in,min × D_max)',
    substitution: `${pInWatts.toFixed(1)} W / (${safeVin} V × ${safeDmax.toFixed(2)})`,
    result: `I_p,avg = ${ipAvgA.toFixed(3)} A`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Required Primary Magnetizing Inductance (L_m)',
    formula: 'L_m = (V_in,min × D_max)² / (2 × P_in × f_s × K_rf)',
    substitution: `(${safeVin} V × ${safeDmax.toFixed(2)}) / (${safeFs} Hz × ${deltaIpA.toFixed(3)} A)`,
    result: `L_m = ${formatQuantity(lmH, 'inductance')}`,
    annotation: 'Engineering preliminary estimate for core sizing and air-gap calculation. Real transformer design requires core geometry (Ae, le, Al).',
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Peak Primary Switch Current (I_pk,p)',
    formula: 'I_pk,p = I_p,avg + (ΔI_p / 2)',
    substitution: `${ipAvgA.toFixed(3)} A + (${deltaIpA.toFixed(3)} A / 2)`,
    result: `I_pk,p = ${iPeakPrimaryA.toFixed(3)} A`,
  });

  return {
    primaryValue: lmH,
    formattedValue: formatQuantity(lmH, 'inductance'),
    unit: 'H',
    label: 'Primary Magnetizing Inductance (L_m)',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Preliminary flyback transformer core magnetizing inductance estimate. Does not replace complete core geometry, B-H saturation, and thermal copper-fill design.',
    warnings,
    steps,
    additionalOutputs: {
      inductanceMicroHenries: { label: 'Inductance (µH)', value: `${(lmH * 1e6).toFixed(1)} µH` },
      peakPrimaryCurrent: { label: 'Peak Switch Current (I_pk,p)', value: `${iPeakPrimaryA.toFixed(3)} A` },
      primaryRippleCurrent: { label: 'Primary Current Ripple (ΔI_p)', value: `${deltaIpA.toFixed(3)} A` },
      storedCoreEnergy: { label: 'Stored Energy (½ L_m I_pk²)', value: `${(storedEnergyJ * 1e6).toFixed(1)} µJ` },
      modeOfOperation: { label: 'Conduction Mode Profile', value: safeKrf < 1.0 ? 'CCM (Continuous)' : 'DCM / BCM (Boundary)' },
    },
    visualData: {
      lmH,
      iPeakPrimaryA,
      deltaIpA,
      storedEnergyJ,
    },
  };
}
