/**
 * ElectroKit — Battery & Energy Storage Subsystem
 * Module F: Performance, Degradation & Sizing (Tools 51 - 60)
 *
 * Implements:
 * 51. Peukert Runtime Calculator (t = H · (C / (I · H))^k with chemistry warning)
 * 52. Peukert Exponent Calculator (k derived from dual discharge test points)
 * 53. Battery Internal Resistance Aging (SEI growth & impedance rise)
 * 54. Capacity Degradation Model (Square-root-of-time & cycle power law)
 * 55. Cycle-Life Estimate (DoD power law life curve: N(DoD) = N_80 · (80% / DoD)^1.5)
 * 56. Calendar-Life Estimate (Arrhenius & SOC storage degradation)
 * 57. Temperature Derating (Low-temp capacity loss & freezing charge lockout)
 * 58. Battery Thermal Power Estimate (I²R Joule loss + reversible entropic heating)
 * 59. Energy-Storage Sizing (Autonomy days, system efficiency, DoD & aging factors)
 * 60. Battery Safety Margin / Design Margin (Capacity, current, voltage, temperature design margins)
 */

export interface PeukertRuntimeInput {
  ratedCapacityAh: number;
  ratedDischargeHours?: number; // H, typically 20 hours for lead-acid, 1 hour or 5 hours for Li-ion
  peukertExponent: number; // k, 1.05 to 1.15 for Li-ion, 1.15 to 1.35 for Lead-Acid
  dischargeCurrentAmps: number;
  chemistry?: 'lead-acid' | 'li-ion' | 'lifepo4' | 'nimh';
}

export interface PeukertRuntimeResult {
  runtimeHours: number;
  runtimeMinutes: number;
  effectiveCapacityAh: number;
  idealRuntimeHours: number;
  capacityLossDueToRatePercent: number;
  applicabilityNote: string;
  formula: string;
}

/** 51. Peukert Runtime Calculator: t = H · (C / (I · H))^k */
export function calculatePeukertRuntime(input: PeukertRuntimeInput): PeukertRuntimeResult {
  const { ratedCapacityAh: c, peukertExponent: k, dischargeCurrentAmps: i } = input;
  const h = input.ratedDischargeHours ?? 20.0;
  const chem = input.chemistry ?? 'lead-acid';

  if (c <= 0 || k <= 0 || i <= 0 || h <= 0) {
    throw new Error('Capacity, Peukert exponent, current, and rated hours must be strictly positive.');
  }

  // Peukert Equation: t = H · (C / (I · H))^k
  const baseRatio = c / (i * h);
  const runtimeHours = h * Math.pow(baseRatio, k);
  const idealHours = c / i;
  const effectiveCapacityAh = i * runtimeHours;
  const lossPct = idealHours > 0 ? Math.max(0, ((idealHours - runtimeHours) / idealHours) * 100) : 0;

  let note = 'Peukert equation applies primarily to Lead-Acid chemistries with mass transport limitations.';
  if (chem === 'li-ion' || chem === 'lifepo4') {
    note = 'Lithium cells exhibit minimal Peukert loss (k ≈ 1.02–1.08). At high C-rates, thermal and IR losses dominate.';
  }

  return {
    runtimeHours: Number(runtimeHours.toFixed(3)),
    runtimeMinutes: Number((runtimeHours * 60).toFixed(1)),
    effectiveCapacityAh: Number(effectiveCapacityAh.toFixed(3)),
    idealRuntimeHours: Number(idealHours.toFixed(3)),
    capacityLossDueToRatePercent: Number(lossPct.toFixed(2)),
    applicabilityNote: note,
    formula: 't = H · \\left(\\frac{C}{I · H}\\right)^k | C_{eff} = I · t',
  };
}

/** 52. Peukert Exponent Calculator: k = log(t2/t1) / log(I1/I2) */
export function calculatePeukertExponent(
  test1CurrentAmps: number,
  test1TimeHours: number,
  test2CurrentAmps: number,
  test2TimeHours: number
): { peukertExponent: number; formula: string } {
  if (test1CurrentAmps <= 0 || test1TimeHours <= 0 || test2CurrentAmps <= 0 || test2TimeHours <= 0) {
    throw new Error('All currents and times must be strictly positive.');
  }
  if (test1CurrentAmps === test2CurrentAmps) {
    throw new Error('The two test currents must be different to establish a Peukert slope.');
  }

  // From I1^k · t1 = I2^k · t2 => (I1 / I2)^k = t2 / t1 => k · ln(I1/I2) = ln(t2/t1)
  const logI = Math.log(test1CurrentAmps / test2CurrentAmps);
  const logT = Math.log(test2TimeHours / test1TimeHours);
  const k = logT / logI;

  return {
    peukertExponent: Number(k.toFixed(4)),
    formula: 'k = \\frac{\\ln(t_2 / t_1)}{\\ln(I_1 / I_2)}',
  };
}

/** 53. Battery Internal Resistance Aging */
export function calculateInternalResistanceAging(
  initialResistanceOhms: number,
  cycleCount: number,
  calendarDays: number,
  cycleGrowthCoefficient: number = 0.005, // Resistance rises with sqrt(cycles)
  calendarGrowthCoefficient: number = 0.0002
): {
  agedResistanceOhms: number;
  resistanceIncreasePercent: number;
  cycleContributionOhms: number;
  calendarContributionOhms: number;
  formula: string;
} {
  if (initialResistanceOhms <= 0 || cycleCount < 0 || calendarDays < 0) {
    throw new Error('Initial resistance > 0, cycles and days >= 0 required.');
  }

  const dRCycle = initialResistanceOhms * cycleGrowthCoefficient * Math.sqrt(cycleCount);
  const dRCalendar = initialResistanceOhms * calendarGrowthCoefficient * Math.sqrt(calendarDays);
  const agedR = initialResistanceOhms + dRCycle + dRCalendar;
  const incPct = ((agedR - initialResistanceOhms) / initialResistanceOhms) * 100;

  return {
    agedResistanceOhms: Number(agedR.toFixed(6)),
    resistanceIncreasePercent: Number(incPct.toFixed(2)),
    cycleContributionOhms: Number(dRCycle.toFixed(6)),
    calendarContributionOhms: Number(dRCalendar.toFixed(6)),
    formula: 'R(N, t) = R_0 · [1 + α_{cyc} · \\sqrt{N} + α_{cal} · \\sqrt{t}]',
  };
}

/** 54. Capacity Degradation Model (Cycle + Calendar Aging) */
export function calculateCapacityDegradation(
  ratedCapacityAh: number,
  cycleCount: number,
  calendarDays: number,
  cycleFadeRateZ: number = 0.55, // typically z = 0.5 to 0.75
  cycleCoefficientA: number = 0.0025,
  calendarCoefficientB: number = 0.0015
): {
  remainingCapacityAh: number;
  capacityRetentionPercent: number;
  cycleLossAh: number;
  calendarLossAh: number;
  totalLossAh: number;
  formula: string;
} {
  if (ratedCapacityAh <= 0 || cycleCount < 0 || calendarDays < 0) {
    throw new Error('Rated capacity must be positive, cycles and days non-negative.');
  }

  const cycleLoss = ratedCapacityAh * cycleCoefficientA * Math.pow(cycleCount, cycleFadeRateZ);
  const calendarLoss = ratedCapacityAh * calendarCoefficientB * Math.sqrt(calendarDays);
  const totalLoss = Math.min(ratedCapacityAh, cycleLoss + calendarLoss);
  const remCap = Math.max(0, ratedCapacityAh - totalLoss);
  const retPct = (remCap / ratedCapacityAh) * 100;

  return {
    remainingCapacityAh: Number(remCap.toFixed(4)),
    capacityRetentionPercent: Number(retPct.toFixed(2)),
    cycleLossAh: Number(cycleLoss.toFixed(4)),
    calendarLossAh: Number(calendarLoss.toFixed(4)),
    totalLossAh: Number(totalLoss.toFixed(4)),
    formula: 'Q_{rem} = Q_{nom} - (A · N^z + B · \\sqrt{t}) · Q_{nom}',
  };
}

/** 55. Cycle-Life Estimate (DoD Power-Law Curve) */
export function estimateCycleLife(
  nominalCyclesAt80DoD: number,
  operatingDepthOfDischargePercent: number,
  powerLawExponent: number = 1.5
): { estimatedCyclesToEol: number; cycleMultiplierVs80DoD: number; formula: string } {
  if (nominalCyclesAt80DoD <= 0 || operatingDepthOfDischargePercent <= 0) {
    throw new Error('Cycles and DoD must be strictly positive.');
  }

  // N(DoD) = N_80 · (80 / DoD)^p
  const ratio = 80 / Math.min(100, operatingDepthOfDischargePercent);
  const mult = Math.pow(ratio, powerLawExponent);
  const cycles = Math.round(nominalCyclesAt80DoD * mult);

  return {
    estimatedCyclesToEol: cycles,
    cycleMultiplierVs80DoD: Number(mult.toFixed(3)),
    formula: 'N(DoD) = N_{80} · \\left(\\frac{80\\%}{DoD}\\right)^p',
  };
}

/** 56. Calendar-Life Estimate */
export function estimateCalendarLife(
  storageTempCelsius: number,
  storageSocPercent: number,
  baselineLifeYearsAt25C50Soc: number = 10.0
): { estimatedShelfLifeYears: number; temperatureAccelerationFactor: number; formula: string } {
  if (baselineLifeYearsAt25C50Soc <= 0) throw new Error('Baseline life must be positive.');
  if (storageSocPercent < 0 || storageSocPercent > 100) throw new Error('SOC must be 0-100%.');

  // Arrhenius temperature factor: ~2x aging per 10°C rise
  const deltaT = storageTempCelsius - 25;
  const tempAf = Math.pow(2, deltaT / 10);

  // High SOC accelerates calendar degradation: e.g. 100% SOC ages ~1.5x faster than 50%
  const socAf = 0.8 + 0.4 * (storageSocPercent / 50);

  const totalAf = tempAf * socAf;
  const lifeYears = baselineLifeYearsAt25C50Soc / Math.max(0.1, totalAf);

  return {
    estimatedShelfLifeYears: Number(lifeYears.toFixed(1)),
    temperatureAccelerationFactor: Number(totalAf.toFixed(3)),
    formula: 'Life = Life_{ref} / (AF_T · AF_{SOC}) | AF_T = 2^{(T - 25)/10}',
  };
}

export interface TemperatureDeratingResult {
  usableCapacityFraction: number;
  usableCapacityPercent: number;
  maxRecommendedDischargeCRate: number;
  isChargeAllowed: boolean;
  warningNote: string;
  formula: string;
}

/** 57. Temperature Derating */
export function calculateTemperatureDerating(
  tempCelsius: number,
  chemistry: 'li-ion' | 'lifepo4' | 'lead-acid'
): TemperatureDeratingResult {
  let capFrac = 1.0;
  let maxC = 1.0;
  let chargeAllowed = true;
  let note = 'Normal operating range.';

  if (tempCelsius < 0) {
    chargeAllowed = false;
    note = 'CRITICAL WARNING: Lithium plating hazard! Do NOT charge below 0°C without internal heating.';
  }

  if (tempCelsius >= 25) {
    capFrac = Math.min(1.05, 1.0 + (tempCelsius - 25) * 0.001);
    maxC = chemistry === 'lifepo4' ? 2.0 : 1.5;
  } else if (tempCelsius >= 0) {
    // 0°C to 25°C: modest capacity loss (~0.8% per °C)
    capFrac = 1.0 - (25 - tempCelsius) * 0.008;
    maxC = 0.5;
  } else if (tempCelsius >= -20) {
    // Sub-zero: significant capacity loss
    capFrac = 0.80 - (0 - tempCelsius) * 0.02;
    maxC = 0.2;
  } else {
    capFrac = Math.max(0.1, 0.40 - (-20 - tempCelsius) * 0.015);
    maxC = 0.05;
    note = 'Extreme low temperature: electrolyte viscosity high, severe capacity reduction.';
  }

  return {
    usableCapacityFraction: Number(capFrac.toFixed(3)),
    usableCapacityPercent: Number((capFrac * 100).toFixed(1)),
    maxRecommendedDischargeCRate: maxC,
    isChargeAllowed: chargeAllowed,
    warningNote: note,
    formula: 'C(T) = C_{25°C} · f(T_{cell}) | \\text{Charge locked at } T < 0°C',
  };
}

export interface BatteryThermalPowerInput {
  currentAmps: number;
  internalResistanceOhms: number;
  cellTemperatureCelsius?: number; // T
  entropyCoefficientVoltsPerKelvin?: number; // dU/dT (reversible entropic heat)
}

/** 58. Battery Thermal Power Estimate: P_thermal = I² · R_int + I · T · (dU/dT) */
export function calculateBatteryThermalPower(input: BatteryThermalPowerInput): {
  jouleHeatingWatts: number;
  entropicHeatingWatts: number;
  totalThermalPowerWatts: number;
  formula: string;
} {
  const { currentAmps: i, internalResistanceOhms: rInt } = input;
  const tC = input.cellTemperatureCelsius ?? 25;
  const tK = tC + 273.15;
  const dUdT = input.entropyCoefficientVoltsPerKelvin ?? -0.0002; // typically -0.2 mV/K for Li-ion discharge

  if (i < 0 || rInt < 0) throw new Error('Current and internal resistance must be non-negative.');

  const pJoule = i * i * rInt;
  // Entropic heat Q_rev = - I · T · (dU/dT). For discharge (I > 0) with negative dU/dT, it adds heat
  const pEntropic = -i * tK * dUdT;
  const pTotal = pJoule + pEntropic;

  return {
    jouleHeatingWatts: Number(pJoule.toFixed(3)),
    entropicHeatingWatts: Number(pEntropic.toFixed(3)),
    totalThermalPowerWatts: Number(pTotal.toFixed(3)),
    formula: 'P_{thermal} = I^2 · R_{int} - I · T · \\frac{dU}{dT}',
  };
}

export interface EnergyStorageSizingInput {
  dailyEnergyConsumptionWh: number;
  desiredAutonomyDays: number;
  maxAllowedDepthOfDischargePercent?: number; // e.g. 80% for LiFePO4, 50% for Lead-Acid
  systemInverterEfficiencyPercent?: number; // e.g. 90%
  temperatureDeratingFraction?: number; // e.g. 0.90 for cold winter days
  agingReserveMarginFraction?: number; // e.g. 0.80 (20% aging allowance over lifetime)
  systemNominalVoltage: number;
}

export interface EnergyStorageSizingResult {
  totalUsableEnergyRequiredWh: number;
  nominalNameplateEnergyRequiredWh: number;
  nominalNameplateEnergyRequiredKwh: number;
  requiredBatteryCapacityAh: number;
  formula: string;
}

/** 59. Energy-Storage Sizing */
export function sizeEnergyStorage(input: EnergyStorageSizingInput): EnergyStorageSizingResult {
  const { dailyEnergyConsumptionWh: eDaily, desiredAutonomyDays: days, systemNominalVoltage: vSys } = input;
  const dod = (input.maxAllowedDepthOfDischargePercent ?? 80) / 100;
  const etaSys = (input.systemInverterEfficiencyPercent ?? 90) / 100;
  const tDerating = input.temperatureDeratingFraction ?? 0.95;
  const agingFactor = input.agingReserveMarginFraction ?? 0.85;

  if (eDaily <= 0 || days <= 0 || vSys <= 0) {
    throw new Error('Daily energy, autonomy days, and system voltage must be strictly positive.');
  }

  const usableEnergyNeededWh = (eDaily * days) / etaSys;
  // Account for DoD limit, worst-case temperature, and end-of-life aging margin
  const nominalEnergyNeededWh = usableEnergyNeededWh / (dod * tDerating * agingFactor);
  const capacityAh = nominalEnergyNeededWh / vSys;

  return {
    totalUsableEnergyRequiredWh: Number(usableEnergyNeededWh.toFixed(2)),
    nominalNameplateEnergyRequiredWh: Number(nominalEnergyNeededWh.toFixed(2)),
    nominalNameplateEnergyRequiredKwh: Number((nominalEnergyNeededWh / 1000).toFixed(3)),
    requiredBatteryCapacityAh: Number(capacityAh.toFixed(2)),
    formula: 'E_{nom} = \\frac{E_{daily} · \\text{Days}}{η_{sys} · DoD · f_T · f_{aging}} | C_{Ah} = \\frac{E_{nom}}{V_{sys}}',
  };
}

export interface SafetyMarginInput {
  ratedContinuousCurrentAmps: number;
  operatingContinuousCurrentAmps: number;
  ratedPeakCurrentAmps: number;
  operatingPeakCurrentAmps: number;
  maxChargeVoltage: number;
  operatingChargeVoltage: number;
  maxOperatingTempCelsius: number;
  operatingTempCelsius: number;
}

export interface SafetyMarginResult {
  continuousCurrentMarginPercent: number;
  peakCurrentMarginPercent: number;
  voltageHeadroomVolts: number;
  temperatureHeadroomCelsius: number;
  overallStatus: 'EXCELLENT_MARGIN' | 'ACCEPTABLE_DESIGN' | 'TIGHT_MARGIN' | 'LIMIT_EXCEEDED';
  disclaimer: string;
  formula: string;
}

/** 60. Battery Safety Margin / Design Margin (Design Calculation) */
export function calculateDesignMargins(input: SafetyMarginInput): SafetyMarginResult {
  const {
    ratedContinuousCurrentAmps: iContRated,
    operatingContinuousCurrentAmps: iContOp,
    ratedPeakCurrentAmps: iPeakRated,
    operatingPeakCurrentAmps: iPeakOp,
    maxChargeVoltage: vMax,
    operatingChargeVoltage: vOp,
    maxOperatingTempCelsius: tMax,
    operatingTempCelsius: tOp,
  } = input;

  if (iContRated <= 0 || iPeakRated <= 0) {
    throw new Error('Rated current limits must be strictly positive.');
  }
  if (vMax <= 0 || tMax < -273.15) {
    throw new Error('Max charge voltage must be positive and temperature must be above absolute zero.');
  }

  const contMargin = ((iContRated - iContOp) / iContRated) * 100;
  const peakMargin = ((iPeakRated - iPeakOp) / iPeakRated) * 100;
  const vHeadroom = vMax - vOp;
  const tHeadroom = tMax - tOp;

  let status: 'EXCELLENT_MARGIN' | 'ACCEPTABLE_DESIGN' | 'TIGHT_MARGIN' | 'LIMIT_EXCEEDED' = 'ACCEPTABLE_DESIGN';

  if (contMargin < 0 || peakMargin < 0 || vHeadroom < 0 || tHeadroom < 0) {
    status = 'LIMIT_EXCEEDED';
  } else if (contMargin < 15 || peakMargin < 10 || tHeadroom < 10) {
    status = 'TIGHT_MARGIN';
  } else if (contMargin >= 30 && peakMargin >= 25 && tHeadroom >= 20) {
    status = 'EXCELLENT_MARGIN';
  }

  return {
    continuousCurrentMarginPercent: Number(contMargin.toFixed(1)),
    peakCurrentMarginPercent: Number(peakMargin.toFixed(1)),
    voltageHeadroomVolts: Number(vHeadroom.toFixed(3)),
    temperatureHeadroomCelsius: Number(tHeadroom.toFixed(1)),
    overallStatus: status,
    disclaimer: 'Engineering design margins only — does NOT certify safety compliance (e.g. UL 1642, UL 1973, IEC 62133) or guarantee failure-free operation.',
    formula: 'Margin_{\\%} = \\frac{\\text{Rated} - \\text{Operating}}{\\text{Rated}} · 100\\%',
  };
}
