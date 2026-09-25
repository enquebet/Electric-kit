/**
 * ElectroKit — Thermal Engineering Subsystem
 * Module F: Transient Thermal & Reliability Analysis (Tools 51 - 60)
 *
 * Implements:
 * 51. Thermal Capacitance / Heat Capacity (C_th = m · c_p = ρ · V · c_p)
 * 52. Thermal Time Constant (τ = R_th · C_th)
 * 53. Transient Temperature Rise (Single Pulse ΔT(t) response)
 * 54. Repetitive Pulse Thermal Response (Duty cycle D, peak/valley steady-state)
 * 55. Thermal Impedance Zth(t) Foster / Cauer RC Model
 * 56. Arrhenius Equation (Failure rate thermal acceleration factor AF)
 * 57. Thermal Cycling Fatigue (Coffin-Manson model for solder joints)
 * 58. MTBF / Failure Rate Derating with Temperature (FIT and MTBF)
 * 59. 10°C Rule (Arrhenius rule-of-thumb lifetime doubling/halving)
 * 60. Thermal Margin & Operating Safety Analysis (Safe Operating Area boundary)
 */

export const BOLTZMANN_CONSTANT_EV = 8.617333262e-5; // eV/K

export interface ThermalCapacitanceInput {
  massKg?: number;
  volumeM3?: number;
  densityKgM3?: number;
  specificHeatJkgK: number;
}

export interface ThermalCapacitanceResult {
  massKg: number;
  specificHeatJkgK: number;
  thermalCapacitanceJK: number; // J/K
  thermalCapacitanceMJK: number; // mJ/K
  formula: string;
}

/** 51. Thermal Capacitance / Heat Capacity: C_th = m · c_p = ρ · V · c_p */
export function calculateThermalCapacitance(input: ThermalCapacitanceInput): ThermalCapacitanceResult {
  const { specificHeatJkgK: cp } = input;
  let mass = input.massKg;

  if (mass === undefined) {
    const vol = input.volumeM3 ?? 0;
    const rho = input.densityKgM3 ?? 0;
    if (vol <= 0 || rho <= 0) throw new Error('Either mass or volume and density must be positive.');
    mass = vol * rho;
  }

  if (mass <= 0 || cp <= 0) throw new Error('Mass and specific heat capacity must be positive.');

  const c_th = mass * cp;

  return {
    massKg: Number(mass.toFixed(6)),
    specificHeatJkgK: cp,
    thermalCapacitanceJK: Number(c_th.toFixed(4)),
    thermalCapacitanceMJK: Number((c_th * 1000).toFixed(2)),
    formula: 'C_{th} = m · c_p = ρ · V · c_p',
  };
}

export interface TimeConstantResult {
  resistanceKW: number;
  capacitanceJK: number;
  timeConstantSeconds: number; // τ = R · C
  timeConstantMilliseconds: number;
  timeTo95PercentRiseSeconds: number; // 3 · τ
  timeTo99PercentRiseSeconds: number; // 5 · τ
  cutoffThermalFrequencyHz: number; // f_c = 1 / (2π · τ)
  formula: string;
}

/** 52. Thermal Time Constant: τ = Rth · Cth */
export function calculateThermalTimeConstant(rthKW: number, cthJK: number): TimeConstantResult {
  if (rthKW <= 0 || cthJK <= 0) throw new Error('Thermal resistance and capacitance must be strictly positive.');

  const tau = rthKW * cthJK; // seconds
  const t95 = 3 * tau;
  const t99 = 5 * tau;
  const fc = 1 / (2 * Math.PI * tau);

  return {
    resistanceKW: rthKW,
    capacitanceJK: cthJK,
    timeConstantSeconds: Number(tau.toFixed(4)),
    timeConstantMilliseconds: Number((tau * 1000).toFixed(2)),
    timeTo95PercentRiseSeconds: Number(t95.toFixed(4)),
    timeTo99PercentRiseSeconds: Number(t99.toFixed(4)),
    cutoffThermalFrequencyHz: Number(fc.toFixed(5)),
    formula: 'τ = R_{th} · C_{th} | t_{95\\%} = 3τ | t_{99\\%} = 5τ',
  };
}

export interface SinglePulseResponseInput {
  pulsePowerWatts: number;
  pulseDurationSeconds: number;
  thermalResistanceKW: number;
  timeConstantSeconds: number;
  initialTempC: number;
  evaluationTimeSeconds?: number;
}

export interface SinglePulseResponseResult {
  peakTempRiseKelvin: number;
  tempRiseAtEvaluationKelvin: number;
  tempAtEvaluationC: number;
  transientThermalImpedanceZthKW: number;
  coolingTimeConstantSeconds: number;
  trajectoryPoints: Array<{ timeSeconds: number; tempRiseK: number; tempC: number }>;
  formula: string;
}

/** 53. Transient Temperature Rise (Single Pulse): ΔT(t) = P · Rth · (1 - e^(-t/τ)) */
export function calculateSinglePulseResponse(input: SinglePulseResponseInput): SinglePulseResponseResult {
  const { pulsePowerWatts: p, pulseDurationSeconds: tp, thermalResistanceKW: rth, timeConstantSeconds: tau, initialTempC: t0 } = input;
  const tEval = input.evaluationTimeSeconds ?? tp;

  if (p < 0 || tp <= 0 || rth <= 0 || tau <= 0) {
    throw new Error('Power must be non-negative; duration, resistance, and tau must be positive.');
  }

  // Peak temperature at end of pulse tp
  const peakRise = p * rth * (1 - Math.exp(-tp / tau));
  const zth_tp = peakRise / p;

  // Temperature at evaluation time
  let evalRise = 0;
  if (tEval <= tp) {
    evalRise = p * rth * (1 - Math.exp(-tEval / tau));
  } else {
    // Cooling phase
    evalRise = peakRise * Math.exp(-(tEval - tp) / tau);
  }

  // Sample trajectory points
  const points: Array<{ timeSeconds: number; tempRiseK: number; tempC: number }> = [];
  const tMax = Math.max(tp * 3, tau * 5);
  const steps = 25;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tMax;
    let rise = 0;
    if (t <= tp) {
      rise = p * rth * (1 - Math.exp(-t / tau));
    } else {
      rise = peakRise * Math.exp(-(t - tp) / tau);
    }
    points.push({
      timeSeconds: Number(t.toFixed(4)),
      tempRiseK: Number(rise.toFixed(3)),
      tempC: Number((t0 + rise).toFixed(3)),
    });
  }

  return {
    peakTempRiseKelvin: Number(peakRise.toFixed(3)),
    tempRiseAtEvaluationKelvin: Number(evalRise.toFixed(3)),
    tempAtEvaluationC: Number((t0 + evalRise).toFixed(3)),
    transientThermalImpedanceZthKW: Number(zth_tp.toFixed(4)),
    coolingTimeConstantSeconds: tau,
    trajectoryPoints: points,
    formula: 'ΔT(t) = P · R_{th} · [1 - e^{-t/τ}] (pulse) | ΔT(t) = ΔT_{pk} · e^{-(t - t_p)/τ} (cooling)',
  };
}

export interface RepetitivePulseInput {
  peakPowerWatts: number;
  pulseWidthSeconds: number;
  periodSeconds: number;
  thermalResistanceKW: number;
  timeConstantSeconds: number;
  ambientTempC: number;
}

export interface RepetitivePulseResult {
  dutyCycle: number;
  averagePowerWatts: number;
  averageTempRiseKelvin: number;
  peakSteadyStateRiseKelvin: number;
  valleySteadyStateRiseKelvin: number;
  peakJunctionTempC: number;
  valleyJunctionTempC: number;
  rippleAmplitudeKelvin: number;
  effectiveZthKW: number;
  formula: string;
}

/** 54. Repetitive Pulse Thermal Response (Duty cycle D) */
export function calculateRepetitivePulseResponse(input: RepetitivePulseInput): RepetitivePulseResult {
  const { peakPowerWatts: pPk, pulseWidthSeconds: tOn, periodSeconds: tPeriod, thermalResistanceKW: rth, timeConstantSeconds: tau, ambientTempC: ta } = input;

  if (pPk < 0 || tOn <= 0 || tPeriod <= tOn || rth <= 0 || tau <= 0) {
    throw new Error('Peak power must be non-negative; period must be strictly greater than pulse width.');
  }

  const d = tOn / tPeriod;
  const pAvg = pPk * d;
  const dtAvg = pAvg * rth;

  // Exact periodic steady-state solution for single RC:
  // ΔT_peak = P_pk · Rth · [ D + (1 - D) · (1 - e^(-ton/τ)) / (1 - e^(-T/τ)) ]
  const expOn = Math.exp(-tOn / tau);
  const expPeriod = Math.exp(-tPeriod / tau);
  const factor = (1 - expOn) / (1 - expPeriod);

  const dtPeak = pPk * rth * (d + (1 - d) * factor);
  const dtValley = dtPeak - pPk * rth * (1 - expOn);
  const ripple = dtPeak - dtValley;
  const zthEff = dtPeak / pPk;

  return {
    dutyCycle: Number(d.toFixed(4)),
    averagePowerWatts: Number(pAvg.toFixed(3)),
    averageTempRiseKelvin: Number(dtAvg.toFixed(3)),
    peakSteadyStateRiseKelvin: Number(dtPeak.toFixed(3)),
    valleySteadyStateRiseKelvin: Number(dtValley.toFixed(3)),
    peakJunctionTempC: Number((ta + dtPeak).toFixed(3)),
    valleyJunctionTempC: Number((ta + dtValley).toFixed(3)),
    rippleAmplitudeKelvin: Number(ripple.toFixed(3)),
    effectiveZthKW: Number(zthEff.toFixed(4)),
    formula: 'ΔT_{pk} = P_{pk} · R_{th} · [D + (1 - D) · (1 - e^{-t_{on}/τ}) / (1 - e^{-T/τ})]',
  };
}

export interface FosterStage {
  id: string;
  name: string;
  rKW: number;
  tauSeconds: number;
}

export interface FosterModelResult {
  totalSteadyStateRthKW: number;
  zthAtTimeKW: number;
  stagesContribution: Array<{ name: string; rKW: number; tauSeconds: number; currentRiseKW: number; pctContribution: number }>;
  curvePoints: Array<{ timeSeconds: number; zthKW: number }>;
}

/** 55. Thermal Impedance Zth(t) Foster / Cauer Model: Zth(t) = ∑ R_i · (1 - e^(-t/τ_i)) */
export function calculateFosterZth(stages: FosterStage[], evaluationTimeSeconds: number): FosterModelResult {
  if (stages.length === 0) throw new Error('At least one Foster stage required.');
  if (evaluationTimeSeconds <= 0) throw new Error('Evaluation time must be positive.');

  let totalR = 0;
  stages.forEach((s) => {
    if (s.rKW <= 0 || s.tauSeconds <= 0) throw new Error('Stage resistance and tau must be positive.');
    totalR += s.rKW;
  });

  let sumZth = 0;
  const contribs = stages.map((s) => {
    const rise = s.rKW * (1 - Math.exp(-evaluationTimeSeconds / s.tauSeconds));
    sumZth += rise;
    return {
      name: s.name,
      rKW: s.rKW,
      tauSeconds: s.tauSeconds,
      currentRiseKW: rise,
      pctContribution: 0,
    };
  });

  contribs.forEach((c) => {
    c.pctContribution = sumZth > 0 ? Number(((c.currentRiseKW / sumZth) * 100).toFixed(1)) : 0;
  });

  // Generate log-spaced curve points from 100 us to 100 s
  const points: Array<{ timeSeconds: number; zthKW: number }> = [];
  const minLog = -4; // 1e-4 s = 100 us
  const maxLog = 2; // 1e2 s = 100 s
  const steps = 30;

  for (let i = 0; i <= steps; i++) {
    const logT = minLog + (i / steps) * (maxLog - minLog);
    const t = Math.pow(10, logT);
    let z = 0;
    for (const s of stages) {
      z += s.rKW * (1 - Math.exp(-t / s.tauSeconds));
    }
    points.push({
      timeSeconds: Number(t.toExponential(3)),
      zthKW: Number(z.toFixed(5)),
    });
  }

  return {
    totalSteadyStateRthKW: Number(totalR.toFixed(4)),
    zthAtTimeKW: Number(sumZth.toFixed(4)),
    stagesContribution: contribs,
    curvePoints: points,
  };
}

export interface ArrheniusInput {
  operatingTempC: number;
  stressTempC: number;
  activationEnergyEv: number; // e.g. 0.7 eV
}

export interface ArrheniusResult {
  accelerationFactor: number;
  operatingTempK: number;
  stressTempK: number;
  activationEnergyEv: number;
  formula: string;
}

/** 56. Arrhenius Equation (Failure rate thermal acceleration): AF = exp[ (Ea/kB) · (1/T_use - 1/T_stress) ] */
export function calculateArrheniusAcceleration(input: ArrheniusInput): ArrheniusResult {
  const { operatingTempC: tUse, stressTempC: tStress, activationEnergyEv: ea } = input;
  if (ea <= 0) throw new Error('Activation energy must be strictly positive.');

  const tUseK = tUse + 273.15;
  const tStressK = tStress + 273.15;
  if (tUseK <= 0 || tStressK <= 0) throw new Error('Temperatures cannot be below absolute zero.');

  // AF = exp[ (Ea / kB) · (1/T_use - 1/T_stress) ]
  const exponent = (ea / BOLTZMANN_CONSTANT_EV) * (1 / tUseK - 1 / tStressK);
  const af = Math.exp(exponent);

  return {
    accelerationFactor: Number(af.toFixed(3)),
    operatingTempK: Number(tUseK.toFixed(2)),
    stressTempK: Number(tStressK.toFixed(2)),
    activationEnergyEv: ea,
    formula: 'AF = \\exp\\left[ \\frac{E_a}{k_B} \\cdot \\left(\\frac{1}{T_{use}} - \\frac{1}{T_{stress}}\\right) \\right]',
  };
}

export interface CoffinMansonInput {
  deltaTUseKelvin: number;
  deltaTStressKelvin: number;
  cyclingFrequencyUseCyclesPerDay?: number;
  cyclingFrequencyStressCyclesPerDay?: number;
  coffinMansonExponentM?: number; // typically 1.9 to 2.5 for SAC305 solder
  frequencyExponentN?: number; // typically 0.33
}

export interface CoffinMansonResult {
  temperatureAccelerationFactor: number;
  frequencyAccelerationFactor: number;
  totalAccelerationFactor: number;
  estimatedCyclesToFailureAtUse: (cyclesObservedInStress: number) => number;
  formula: string;
}

/** 57. Thermal Cycling Fatigue (Coffin-Manson Model for solder joints) */
export function calculateCoffinManson(input: CoffinMansonInput): CoffinMansonResult {
  const { deltaTUseKelvin: dtUse, deltaTStressKelvin: dtStress } = input;
  const m = input.coffinMansonExponentM ?? 2.1;
  const n = input.frequencyExponentN ?? 0.33;
  const fUse = input.cyclingFrequencyUseCyclesPerDay ?? 1;
  const fStress = input.cyclingFrequencyStressCyclesPerDay ?? 24;

  if (dtUse <= 0 || dtStress <= 0 || fUse <= 0 || fStress <= 0) {
    throw new Error('Temperature swings and cycling frequencies must be positive.');
  }

  // AF_thermal = (ΔT_stress / ΔT_use)^m
  const afTemp = Math.pow(dtStress / dtUse, m);
  // AF_freq = (f_use / f_stress)^n (Norris-Landzberg modification)
  const afFreq = Math.pow(fUse / fStress, n);
  const afTot = afTemp * afFreq;

  return {
    temperatureAccelerationFactor: Number(afTemp.toFixed(3)),
    frequencyAccelerationFactor: Number(afFreq.toFixed(3)),
    totalAccelerationFactor: Number(afTot.toFixed(3)),
    estimatedCyclesToFailureAtUse: (nStress: number) => Math.round(nStress * afTot),
    formula: 'AF = \\left(\\frac{\\Delta T_{stress}}{\\Delta T_{use}}\\right)^m \\cdot \\left(\\frac{f_{use}}{f_{stress}}\\right)^n',
  };
}

export interface MtbfDeratingInput {
  baselineFit: number; // Failures in Time per 10^9 hours
  baselineTempC: number; // e.g. 25°C or 55°C
  operatingTempC: number;
  activationEnergyEv?: number; // e.g. 0.7 eV
}

export interface MtbfDeratingResult {
  baselineFit: number;
  baselineMtbfHours: number;
  deratedFit: number;
  deratedMtbfHours: number;
  deratedMtbfYears: number;
  accelerationFactor: number;
  formula: string;
}

/** 58. MTBF / Failure Rate Derating with Temperature: FIT(T) = FIT_0 · AF(T) */
export function calculateMtbfDerating(input: MtbfDeratingInput): MtbfDeratingResult {
  const { baselineFit: fit0, baselineTempC: t0, operatingTempC: top } = input;
  const ea = input.activationEnergyEv ?? 0.7;

  if (fit0 <= 0) throw new Error('Baseline FIT must be positive.');

  const afRes = calculateArrheniusAcceleration({
    operatingTempC: t0,
    stressTempC: top,
    activationEnergyEv: ea,
  });

  const af = afRes.accelerationFactor;
  const fitOp = fit0 * af;
  const mtbf0 = 1e9 / fit0;
  const mtbfOp = 1e9 / fitOp;
  const mtbfYears = mtbfOp / 8760;

  return {
    baselineFit: fit0,
    baselineMtbfHours: Math.round(mtbf0),
    deratedFit: Number(fitOp.toFixed(2)),
    deratedMtbfHours: Math.round(mtbfOp),
    deratedMtbfYears: Number(mtbfYears.toFixed(2)),
    accelerationFactor: Number(af.toFixed(3)),
    formula: 'FIT(T) = FIT_0 · AF_{Arrhenius}(T) | MTBF = 10^9 / FIT',
  };
}

/** 59. 10°C Rule (Electrolytic / Semiconductor Half-Life: L = L0 · 2^((T0 - T)/10)) */
export function calculateTenDegreeRule(
  baselineLifeHours: number,
  ratedTempC: number,
  operatingTempC: number
): {
  operatingLifeHours: number;
  operatingLifeYears: number;
  lifeMultiplier: number;
  tempDeltaC: number;
  formula: string;
} {
  if (baselineLifeHours <= 0) throw new Error('Baseline life must be positive.');
  const dt = ratedTempC - operatingTempC;
  // L = L0 · 2^(ΔT / 10)
  const multiplier = Math.pow(2, dt / 10);
  const lifeHours = baselineLifeHours * multiplier;
  const lifeYears = lifeHours / 8760;

  return {
    operatingLifeHours: Math.round(lifeHours),
    operatingLifeYears: Number(lifeYears.toFixed(2)),
    lifeMultiplier: Number(multiplier.toFixed(3)),
    tempDeltaC: dt,
    formula: 'L = L_0 · 2^{(T_{rated} - T_{op}) / 10}',
  };
}

export interface ThermalMarginInput {
  junctionTempC: number;
  maxJunctionTempC: number;
  ambientTempC: number;
  recommendedDeratedMaxTempC?: number; // e.g. 105°C instead of 150°C for high reliability
}

export interface ThermalMarginResult {
  absoluteMarginC: number;
  thermalBudgetUsedPct: number;
  deratedMarginC: number;
  safetyTier: 'OPTIMAL_RELIABILITY' | 'ACCEPTABLE_COMMERCIAL' | 'MARGINAL_HOT' | 'CRITICAL_VIOLATION';
  statusText: string;
  recommendedAction: string;
}

/** 60. Thermal Margin & Operating Safety Analysis */
export function calculateThermalMargin(input: ThermalMarginInput): ThermalMarginResult {
  const { junctionTempC: tj, maxJunctionTempC: tjMax, ambientTempC: ta } = input;
  const tDerated = input.recommendedDeratedMaxTempC ?? tjMax - 25;

  const marginAbs = tjMax - tj;
  const marginDerated = tDerated - tj;
  const totalBudget = tjMax - ta;
  const budgetUsed = totalBudget > 0 ? ((tj - ta) / totalBudget) * 100 : 100;

  let tier: 'OPTIMAL_RELIABILITY' | 'ACCEPTABLE_COMMERCIAL' | 'MARGINAL_HOT' | 'CRITICAL_VIOLATION' = 'ACCEPTABLE_COMMERCIAL';
  let status = 'Temperature within acceptable commercial operating limits.';
  let action = 'No immediate redesign required; maintain airflow path.';

  if (marginAbs < 0) {
    tier = 'CRITICAL_VIOLATION';
    status = 'EXCEEDED ABSOLUTE MAXIMUM RATINGS. Catastrophic thermal failure or shutdown imminent.';
    action = 'Immediate action required: increase heatsink surface, add active fan cooling, or reduce power.';
  } else if (marginAbs < 15 || marginDerated < 0) {
    tier = 'MARGINAL_HOT';
    status = 'MARGINAL THERMAL ENVELOPE. Exceeds standard derating guideline.';
    action = 'Improve TIM interface thermal conductivity or increase heatsink size to restore >25°C margin.';
  } else if (marginAbs >= 40) {
    tier = 'OPTIMAL_RELIABILITY';
    status = 'OPTIMAL THERMAL DESIGN. Excellent MTBF and long-term lifespan achieved.';
    action = 'Design verified for industrial and aerospace mission reliability.';
  }

  return {
    absoluteMarginC: Number(marginAbs.toFixed(2)),
    thermalBudgetUsedPct: Number(budgetUsed.toFixed(1)),
    deratedMarginC: Number(marginDerated.toFixed(2)),
    safetyTier: tier,
    statusText: status,
    recommendedAction: action,
  };
}
