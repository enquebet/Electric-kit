/**
 * ElectroKit — Battery & Energy Storage Subsystem
 * Module C: Discharge & Load Analysis (Tools 21 - 30)
 *
 * Implements:
 * 21. Constant-Current Discharge (Linear discharge time & energy)
 * 22. Constant-Power Discharge (Current rises as voltage drops, cutoff detection)
 * 23. Battery Runtime Under Variable Load (Duty cycle / piecewise mission)
 * 24. Load Profile Energy Calculator (Multi-step load profile integration)
 * 25. Average Load Calculator (Weighted current & power averages)
 * 26. Peak Load Calculator (C-rate peak analysis vs continuous rating)
 * 27. Battery Voltage Sag (V_term = V_oc - I · R_int)
 * 28. Internal Resistance Calculator (DC pulse / load step ΔV/ΔI)
 * 29. Available Power Under Voltage Sag (Maximum power transfer & cutoff bounds)
 * 30. Discharge Energy Efficiency (Joule I²R internal loss vs load delivery)
 */

export interface ConstantCurrentDischargeInput {
  nominalCapacityAh: number;
  dischargeCurrentAmps: number;
  nominalVoltage: number;
  cutoffVoltage?: number;
  dischargeDepthFraction?: number; // e.g. 0.80 for 80% DoD
}

export interface ConstantCurrentDischargeResult {
  runtimeHours: number;
  runtimeMinutes: number;
  ampHoursRemoved: number;
  energyDeliveredWh: number;
  cRate: number;
  formula: string;
}

/** 21. Constant-Current Discharge */
export function calculateConstantCurrentDischarge(
  input: ConstantCurrentDischargeInput
): ConstantCurrentDischargeResult {
  const { nominalCapacityAh: cNom, dischargeCurrentAmps: iLoad, nominalVoltage: vNom } = input;
  const dod = input.dischargeDepthFraction ?? 1.0;

  if (cNom <= 0 || iLoad <= 0 || vNom <= 0) {
    throw new Error('Capacity, discharge current, and nominal voltage must be strictly positive.');
  }
  if (dod <= 0 || dod > 1.0) throw new Error('DoD fraction must be between 0 and 1.0.');

  const usableAh = cNom * dod;
  const runtimeH = usableAh / iLoad;
  const energyWh = usableAh * vNom;
  const cRate = iLoad / cNom;

  return {
    runtimeHours: Number(runtimeH.toFixed(4)),
    runtimeMinutes: Number((runtimeH * 60).toFixed(2)),
    ampHoursRemoved: Number(usableAh.toFixed(3)),
    energyDeliveredWh: Number(energyWh.toFixed(2)),
    cRate: Number(cRate.toFixed(3)),
    formula: 't = (C_{nom} · DoD) / I_{load} | E_{delivered} = C_{usable} · V_{nom}',
  };
}

export interface ConstantPowerDischargeInput {
  nominalCapacityAh: number;
  nominalVoltage: number;
  cutoffVoltage: number;
  loadPowerWatts: number;
  internalResistanceOhms?: number;
  converterEfficiencyPercent?: number; // e.g. 92% DC-DC converter efficiency
  dischargeDepthFraction?: number;
}

export interface ConstantPowerDischargeResult {
  estimatedRuntimeHours: number;
  estimatedRuntimeMinutes: number;
  initialCurrentAmps: number;
  finalCurrentAtCutoffAmps: number;
  averageCurrentAmps: number;
  deliveredEnergyWh: number;
  isCutoffViolatedEarly: boolean;
  formula: string;
}

/** 22. Constant-Power Discharge: I(t) = P / V(t) */
export function calculateConstantPowerDischarge(
  input: ConstantPowerDischargeInput
): ConstantPowerDischargeResult {
  const { nominalCapacityAh: cNom, nominalVoltage: vNom, cutoffVoltage: vCutoff, loadPowerWatts: pLoad } = input;
  const rInt = input.internalResistanceOhms ?? 0.05;
  const eta = (input.converterEfficiencyPercent ?? 100) / 100;
  const dod = input.dischargeDepthFraction ?? 1.0;

  if (cNom <= 0 || vNom <= 0 || vCutoff <= 0 || pLoad <= 0) {
    throw new Error('Capacity, voltages, and load power must be positive.');
  }
  if (vCutoff >= vNom) throw new Error('Cutoff voltage must be strictly less than nominal voltage.');
  if (eta <= 0 || eta > 1.0) throw new Error('Efficiency must be between 0 and 100%.');

  const pGross = pLoad / eta; // Power drawn from battery terminals

  // Initial terminal current at nominal full voltage
  const iInitial = pGross / vNom;

  // At cutoff, terminal voltage V_cutoff = V_cell_oc - I * rInt => V_term = vCutoff
  const iFinal = pGross / vCutoff;

  // Average current approximation across voltage discharge profile
  const vAvg = (vNom + vCutoff) / 2;
  const iAvg = pGross / vAvg;

  const usableCapacityAh = cNom * dod;
  const runtimeH = usableCapacityAh / iAvg;
  const energyWh = usableCapacityAh * vAvg;

  // Check if initial or final current causes terminal voltage drop below cutoff immediately
  // or if requested power exceeds Jacobi maximum power transfer limit Voc^2 / (4 * Rint)
  const maxAllowableCurrent = (vNom - vCutoff) / Math.max(1e-4, rInt);
  const maxTheoreticalPower = (vNom * vNom) / (4 * Math.max(1e-4, rInt));
  const isCutoffViolated = iInitial > maxAllowableCurrent || pGross > maxTheoreticalPower;

  return {
    estimatedRuntimeHours: Number(runtimeH.toFixed(3)),
    estimatedRuntimeMinutes: Number((runtimeH * 60).toFixed(1)),
    initialCurrentAmps: Number(iInitial.toFixed(3)),
    finalCurrentAtCutoffAmps: Number(iFinal.toFixed(3)),
    averageCurrentAmps: Number(iAvg.toFixed(3)),
    deliveredEnergyWh: Number(energyWh.toFixed(2)),
    isCutoffViolatedEarly: isCutoffViolated,
    formula: 'I(t) = P_{load} / (η · V_{term}(t)) | t ≈ (C_{nom} · DoD) / I_{avg}',
  };
}

export interface LoadProfileSegment {
  id: string;
  name: string;
  durationMinutes: number;
  currentAmps?: number;
  powerWatts?: number;
}

export interface VariableLoadResult {
  totalCycleDurationMinutes: number;
  totalCycleDurationHours: number;
  cycleAhConsumed: number;
  cycleWhConsumed: number;
  averageCurrentAmps: number;
  averagePowerWatts: number;
  peakCurrentAmps: number;
  peakPowerWatts: number;
  estimatedCyclesUntilEmpty: number;
  totalRuntimeHours: number;
  formula: string;
}

/** 23. Battery Runtime Under Variable Load */
export function calculateVariableLoadRuntime(
  batteryCapacityAh: number,
  nominalVoltage: number,
  segments: LoadProfileSegment[],
  dischargeDepthFraction: number = 0.85
): VariableLoadResult {
  if (batteryCapacityAh <= 0 || nominalVoltage <= 0) {
    throw new Error('Battery capacity and nominal voltage must be positive.');
  }
  if (segments.length === 0) throw new Error('At least one load profile segment is required.');

  let totalMins = 0;
  let totalAh = 0;
  let totalWh = 0;
  let peakI = 0;
  let peakP = 0;

  segments.forEach((seg) => {
    if (seg.durationMinutes <= 0) throw new Error('Segment duration must be strictly positive.');
    const dtHours = seg.durationMinutes / 60;
    totalMins += seg.durationMinutes;

    let segI = 0;
    let segP = 0;

    if (seg.currentAmps !== undefined) {
      segI = seg.currentAmps;
      segP = segI * nominalVoltage;
    } else if (seg.powerWatts !== undefined) {
      segP = seg.powerWatts;
      segI = segP / nominalVoltage;
    } else {
      throw new Error('Either currentAmps or powerWatts must be specified for each segment.');
    }

    if (segI < 0 || segP < 0) throw new Error('Segment current and power must be non-negative.');

    totalAh += segI * dtHours;
    totalWh += segP * dtHours;

    if (segI > peakI) peakI = segI;
    if (segP > peakP) peakP = segP;
  });

  const totalHours = totalMins / 60;
  const avgI = totalHours > 0 ? totalAh / totalHours : 0;
  const avgP = totalHours > 0 ? totalWh / totalHours : 0;

  const usableAh = batteryCapacityAh * Math.min(1.0, Math.max(0.05, dischargeDepthFraction));
  const cycles = totalAh > 0 ? usableAh / totalAh : Infinity;
  const totalRuntimeH = cycles * totalHours;

  return {
    totalCycleDurationMinutes: Number(totalMins.toFixed(1)),
    totalCycleDurationHours: Number(totalHours.toFixed(3)),
    cycleAhConsumed: Number(totalAh.toFixed(4)),
    cycleWhConsumed: Number(totalWh.toFixed(3)),
    averageCurrentAmps: Number(avgI.toFixed(3)),
    averagePowerWatts: Number(avgP.toFixed(2)),
    peakCurrentAmps: Number(peakI.toFixed(3)),
    peakPowerWatts: Number(peakP.toFixed(2)),
    estimatedCyclesUntilEmpty: Number(cycles.toFixed(2)),
    totalRuntimeHours: Number(totalRuntimeH.toFixed(2)),
    formula: 'Q_{cycle} = \\sum (I_i · \\Delta t_i) | Runtime = (C_{usable} / Q_{cycle}) · T_{cycle}',
  };
}

/** 24. Load Profile Energy Calculator */
export function calculateProfileEnergy(
  segments: Array<{ powerWatts: number; durationHours: number }>
): { totalEnergyWh: number; totalEnergyJoules: number; totalHours: number; formula: string } {
  let wh = 0;
  let totalH = 0;

  segments.forEach((s) => {
    if (s.powerWatts < 0 || s.durationHours < 0) throw new Error('Power and duration must be non-negative.');
    wh += s.powerWatts * s.durationHours;
    totalH += s.durationHours;
  });

  return {
    totalEnergyWh: Number(wh.toFixed(3)),
    totalEnergyJoules: Number((wh * 3600).toFixed(1)),
    totalHours: Number(totalH.toFixed(3)),
    formula: 'E_{total} = \\sum_{i} (P_i · t_i)',
  };
}

/** 25. Average Load Calculator: I_avg = ∑ (I_i · t_i) / T_total */
export function calculateAverageLoad(
  segments: Array<{ currentAmps: number; durationSeconds: number }>
): { averageCurrentAmps: number; totalDurationSeconds: number; totalCoulombs: number; formula: string } {
  let totalQ = 0;
  let totalT = 0;

  segments.forEach((s) => {
    if (s.currentAmps < 0 || s.durationSeconds <= 0) throw new Error('Current >= 0 and duration > 0 required.');
    totalQ += s.currentAmps * s.durationSeconds;
    totalT += s.durationSeconds;
  });

  const avgI = totalT > 0 ? totalQ / totalT : 0;

  return {
    averageCurrentAmps: Number(avgI.toFixed(4)),
    totalDurationSeconds: totalT,
    totalCoulombs: Number(totalQ.toFixed(2)),
    formula: 'I_{avg} = \\frac{1}{T} \\int I(t) dt = \\frac{\\sum I_i \\Delta t_i}{\\sum \\Delta t_i}',
  };
}

export interface PeakLoadAnalysisInput {
  continuousRatingAmps: number;
  peakRatingAmps: number;
  measuredPeakLoadAmps: number;
  peakDurationSeconds: number;
  maxAllowedPeakDurationSeconds?: number;
}

/** 26. Peak Load Calculator & Rating Check */
export function analyzePeakLoad(input: PeakLoadAnalysisInput): {
  isWithinContinuous: boolean;
  isWithinPeak: boolean;
  peakDurationSafe: boolean;
  peakToContinuousRatio: number;
  status: 'SAFE_CONTINUOUS' | 'SAFE_PEAK_PULSE' | 'OVER_CURRENT_FAULT' | 'DURATION_EXCEEDED';
  formula: string;
} {
  const { continuousRatingAmps: iCont, peakRatingAmps: iPeak, measuredPeakLoadAmps: iLoad, peakDurationSeconds: tPeak } = input;
  const tMaxPeak = input.maxAllowedPeakDurationSeconds ?? 10.0;

  if (iCont <= 0 || iPeak <= 0 || iLoad < 0 || tPeak < 0) {
    throw new Error('Ratings must be positive, load and duration non-negative.');
  }

  const ratio = iLoad / iCont;
  const isWithinCont = iLoad <= iCont;
  const isWithinPeak = iLoad <= iPeak;
  const isDurationSafe = tPeak <= tMaxPeak;

  let status: 'SAFE_CONTINUOUS' | 'SAFE_PEAK_PULSE' | 'OVER_CURRENT_FAULT' | 'DURATION_EXCEEDED' = 'SAFE_CONTINUOUS';

  if (!isWithinPeak) {
    status = 'OVER_CURRENT_FAULT';
  } else if (!isWithinCont) {
    status = isDurationSafe ? 'SAFE_PEAK_PULSE' : 'DURATION_EXCEEDED';
  }

  return {
    isWithinContinuous: isWithinCont,
    isWithinPeak,
    peakDurationSafe: isDurationSafe,
    peakToContinuousRatio: Number(ratio.toFixed(2)),
    status,
    formula: 'Ratio = I_{peak} / I_{continuous} | Check: I_{load} \\le I_{peak,rated} \\land t_{pulse} \\le t_{rated}',
  };
}

export interface VoltageSagInput {
  openCircuitVoltage: number;
  loadCurrentAmps: number;
  internalResistanceOhms: number;
  wiringResistanceOhms?: number;
}

export interface VoltageSagResult {
  terminalVoltage: number;
  voltageSagVolts: number;
  sagPercentage: number;
  internalJouleLossWatts: number;
  wiringJouleLossWatts: number;
  totalLossWatts: number;
  deliveredPowerWatts: number;
  formula: string;
}

/** 27. Battery Voltage Sag: V_terminal = V_oc - I · (R_int + R_wire) */
export function calculateVoltageSag(input: VoltageSagInput): VoltageSagResult {
  const { openCircuitVoltage: voc, loadCurrentAmps: iLoad, internalResistanceOhms: rInt } = input;
  const rWire = input.wiringResistanceOhms ?? 0;

  if (voc <= 0 || iLoad < 0 || rInt < 0 || rWire < 0) {
    throw new Error('Voc must be positive, current and resistances non-negative.');
  }

  const rTotal = rInt + rWire;
  const vSag = iLoad * rTotal;
  const vTerm = Math.max(0, voc - vSag);
  const sagPct = (vSag / voc) * 100;

  const pInt = iLoad * iLoad * rInt;
  const pWire = iLoad * iLoad * rWire;
  const pDelivered = vTerm * iLoad;

  return {
    terminalVoltage: Number(vTerm.toFixed(4)),
    voltageSagVolts: Number(vSag.toFixed(4)),
    sagPercentage: Number(sagPct.toFixed(2)),
    internalJouleLossWatts: Number(pInt.toFixed(3)),
    wiringJouleLossWatts: Number(pWire.toFixed(3)),
    totalLossWatts: Number((pInt + pWire).toFixed(3)),
    deliveredPowerWatts: Number(pDelivered.toFixed(3)),
    formula: 'V_{term} = V_{oc} - I · (R_{int} + R_{wire}) | \\Delta V_{sag} = I · R_{tot}',
  };
}

/** 28. Internal Resistance Calculator: R_int = (V_oc - V_load) / I_load or ΔV / ΔI */
export function calculateInternalResistance(
  mode: 'single_step' | 'two_step_pulse',
  v1: number, // Voc or V_step1
  v2: number, // V_load or V_step2
  i1: number, // I_load or I_step1
  i2?: number // I_step2
): { internalResistanceOhms: number; internalResistanceMilliohms: number; assumptions: string; formula: string } {
  if (v1 <= 0 || v2 <= 0) throw new Error('Voltages must be strictly positive.');

  let r = 0;
  let formula = '';

  if (mode === 'single_step') {
    if (i1 <= 0) throw new Error('Load current must be strictly positive.');
    if (v2 > v1) throw new Error('Loaded voltage cannot exceed open-circuit voltage in a discharging battery.');
    r = (v1 - v2) / i1;
    formula = 'R_{int} = (V_{oc} - V_{load}) / I_{load}';
  } else {
    if (i1 < 0 || (i2 !== undefined && i2 < 0)) {
      throw new Error('Test currents must be non-negative.');
    }
    const currentStep = (i2 ?? 0) - i1;
    const voltageStep = v1 - v2;
    if (Math.abs(currentStep) < 1e-6) throw new Error('Current step ΔI must be non-zero.');
    r = Math.abs(voltageStep / currentStep);
    formula = 'R_{int} = |\\Delta V| / |\\Delta I| = |V_1 - V_2| / |I_2 - I_1|';
  }

  return {
    internalResistanceOhms: Number(r.toFixed(6)),
    internalResistanceMilliohms: Number((r * 1000).toFixed(2)),
    assumptions: 'Lumped DC internal resistance (ohmic electrolyte + polarization overpotentials). Assumes constant SOC and temperature across measurement steps.',
    formula,
  };
}

export interface AvailablePowerResult {
  theoreticalMaxPowerWatts: number; // Jacobi Maximum Power Transfer (matched impedance)
  currentAtTheoreticalMaxAmps: number;
  terminalVoltageAtTheoreticalMax: number;
  usablePowerAtCutoffWatts: number;
  currentAtCutoffAmps: number;
  formula: string;
}

/** 29. Available Power Under Voltage Sag */
export function calculateAvailablePower(
  openCircuitVoltage: number,
  internalResistanceOhms: number,
  cutoffVoltage: number
): AvailablePowerResult {
  if (openCircuitVoltage <= 0 || internalResistanceOhms <= 0 || cutoffVoltage <= 0) {
    throw new Error('Voc, internal resistance, and cutoff voltage must be positive.');
  }
  if (cutoffVoltage >= openCircuitVoltage) {
    throw new Error('Cutoff voltage must be strictly less than open-circuit voltage.');
  }

  // Maximum Power Transfer Theorem: R_load = R_int => V_term = Voc / 2
  // P_max = Voc² / (4 · R_int)
  const pTheor = (openCircuitVoltage * openCircuitVoltage) / (4 * internalResistanceOhms);
  const iAtTheor = openCircuitVoltage / (2 * internalResistanceOhms);
  const vAtTheor = openCircuitVoltage / 2;

  // Safe usable power limited by Cutoff Voltage
  // V_cutoff = Voc - I · R_int => I_cutoff = (Voc - V_cutoff) / R_int
  const iCutoff = (openCircuitVoltage - cutoffVoltage) / internalResistanceOhms;
  const pCutoff = cutoffVoltage * iCutoff;

  return {
    theoreticalMaxPowerWatts: Number(pTheor.toFixed(2)),
    currentAtTheoreticalMaxAmps: Number(iAtTheor.toFixed(2)),
    terminalVoltageAtTheoreticalMax: Number(vAtTheor.toFixed(2)),
    usablePowerAtCutoffWatts: Number(pCutoff.toFixed(2)),
    currentAtCutoffAmps: Number(iCutoff.toFixed(2)),
    formula: 'P_{max,theor} = V_{oc}^2 / (4 · R_{int}) | P_{usable,cutoff} = V_{cutoff} · (V_{oc} - V_{cutoff}) / R_{int}',
  };
}

/** 30. Discharge Energy Efficiency */
export function calculateDischargeEfficiency(
  openCircuitVoltage: number,
  loadCurrentAmps: number,
  internalResistanceOhms: number
): {
  efficiencyPercent: number;
  jouleLossWatts: number;
  deliveredPowerWatts: number;
  totalChemicalPowerWatts: number;
  formula: string;
} {
  if (openCircuitVoltage <= 0 || loadCurrentAmps < 0 || internalResistanceOhms < 0) {
    throw new Error('Voc > 0, current >= 0, resistance >= 0 required.');
  }

  const vSag = loadCurrentAmps * internalResistanceOhms;
  const vTerm = Math.max(0, openCircuitVoltage - vSag);

  const pChemical = openCircuitVoltage * loadCurrentAmps;
  const pLoss = loadCurrentAmps * loadCurrentAmps * internalResistanceOhms;
  const pDelivered = vTerm * loadCurrentAmps;

  const eff = pChemical > 0 ? (pDelivered / pChemical) * 100 : 100;

  return {
    efficiencyPercent: Number(eff.toFixed(2)),
    jouleLossWatts: Number(pLoss.toFixed(3)),
    deliveredPowerWatts: Number(pDelivered.toFixed(3)),
    totalChemicalPowerWatts: Number(pChemical.toFixed(3)),
    formula: 'η_{dis} = \\frac{V_{term}}{V_{oc}} = 1 - \\frac{I \\cdot R_{int}}{V_{oc}}',
  };
}
