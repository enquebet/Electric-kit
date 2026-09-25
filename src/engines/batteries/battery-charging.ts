/**
 * ElectroKit — Battery & Energy Storage Subsystem
 * Module E: Charging Models & Efficiency (Tools 41 - 50)
 *
 * Implements:
 * 41. Constant-Current Charging (CC duration, charge transfer)
 * 42. Constant-Voltage Charging (CV exponential current taper)
 * 43. CC/CV Charging Time Estimate (Combined CC + CV two-stage profile)
 * 44. Charge Energy Calculator (Energy integral E_in = ∫ V(t)·I(t) dt)
 * 45. Charge Efficiency (Round-trip energy efficiency η_Wh)
 * 46. Coulombic Efficiency (Charge retention / Faradaic efficiency η_Ah)
 * 47. Charging Power (P_chg = V_term · I_chg)
 * 48. Charging Current (C-rate and thermal/power limit sizing)
 * 49. Charge Loss Calculator (Joule heating + electrochemical overpotential losses)
 * 50. Charge Heat Generation Estimate (Internal heat generation rate & temperature rise)
 *
 * NOTE: Engineering calculation models only — not for hardware/firmware control.
 */

export interface CcChargingInput {
  capacityAh: number;
  initialSocPercent: number;
  targetSocPercent: number; // typically 80% for CC cutoff
  chargeCurrentAmps: number;
  coulombicEfficiencyPercent?: number; // e.g. 99% for Li-ion
}

export interface CcChargingResult {
  chargeTimeHours: number;
  chargeTimeMinutes: number;
  ampHoursSupplied: number;
  ampHoursStored: number;
  effectiveCRate: number;
  formula: string;
}

/** 41. Constant-Current (CC) Charging */
export function calculateCcCharging(input: CcChargingInput): CcChargingResult {
  const { capacityAh, initialSocPercent, targetSocPercent, chargeCurrentAmps } = input;
  const eta = (input.coulombicEfficiencyPercent ?? 99) / 100;

  if (capacityAh <= 0 || chargeCurrentAmps <= 0) {
    throw new Error('Capacity and charge current must be strictly positive.');
  }
  if (targetSocPercent <= initialSocPercent) {
    throw new Error('Target SOC must be strictly greater than initial SOC.');
  }
  if (initialSocPercent < 0 || targetSocPercent > 100) {
    throw new Error('SOC values must be within 0% to 100%.');
  }

  const deltaSocFrac = (targetSocPercent - initialSocPercent) / 100;
  const ahNeeded = capacityAh * deltaSocFrac;
  const ahSupplied = ahNeeded / eta;
  const hours = ahSupplied / chargeCurrentAmps;
  const cRate = chargeCurrentAmps / capacityAh;

  return {
    chargeTimeHours: Number(hours.toFixed(4)),
    chargeTimeMinutes: Number((hours * 60).toFixed(2)),
    ampHoursSupplied: Number(ahSupplied.toFixed(4)),
    ampHoursStored: Number(ahNeeded.toFixed(4)),
    effectiveCRate: Number(cRate.toFixed(3)),
    formula: 't_{CC} = \\frac{(SOC_{target} - SOC_{init}) · Q_{nom}}{I_{charge} · η_{coulomb}}',
  };
}

export interface CvChargingInput {
  cvStartCurrentAmps: number; // Current at transition from CC to CV
  cutoffCurrentAmps: number; // Cutoff threshold, typically 0.05C or 0.02C
  tauDecayMinutes?: number; // Time constant of exponential current taper (typically 30-60 mins)
}

export interface CvChargingResult {
  cvTimeMinutes: number;
  cvTimeHours: number;
  averageCvCurrentAmps: number;
  estimatedAhAdded: number;
  formula: string;
}

/** 42. Constant-Voltage (CV) Charging: I(t) = I_0 · e^(-t / τ) */
export function calculateCvCharging(input: CvChargingInput): CvChargingResult {
  const { cvStartCurrentAmps: i0, cutoffCurrentAmps: iCutoff } = input;
  const tauMins = input.tauDecayMinutes ?? 45.0;

  if (i0 <= 0 || iCutoff <= 0 || tauMins <= 0) {
    throw new Error('Currents and time constant must be strictly positive.');
  }
  if (iCutoff >= i0) {
    throw new Error('Cutoff current must be strictly less than initial CV transition current.');
  }

  // I(t) = I_0 · e^(-t/tau) => t = -tau · ln(I_cutoff / I_0)
  const tMins = -tauMins * Math.log(iCutoff / i0);
  const tHours = tMins / 60;

  // Charge transferred Q = ∫ I(t) dt = I_0 · tau · (1 - e^(-t/tau)) = tau · (I_0 - I_cutoff)
  const tauHours = tauMins / 60;
  const ahAdded = tauHours * (i0 - iCutoff);
  const avgCurrent = tHours > 0 ? ahAdded / tHours : 0;

  return {
    cvTimeMinutes: Number(tMins.toFixed(2)),
    cvTimeHours: Number(tHours.toFixed(4)),
    averageCvCurrentAmps: Number(avgCurrent.toFixed(3)),
    estimatedAhAdded: Number(ahAdded.toFixed(4)),
    formula: 't_{CV} = -\\tau \\cdot \\ln\\left(\\frac{I_{cutoff}}{I_0}\\right) | Q_{CV} = \\tau \\cdot (I_0 - I_{cutoff})',
  };
}

export interface CcCvEstimateInput {
  nominalCapacityAh: number;
  initialSocPercent?: number; // e.g. 10%
  ccChargeCurrentAmps: number; // e.g. 0.5C or 1C
  ccCutoffSocPercent?: number; // typically 80%
  cvCutoffCurrentAmps?: number; // e.g. 0.05C
  tauDecayMinutes?: number;
}

export interface CcCvEstimateResult {
  totalChargeTimeMinutes: number;
  totalChargeTimeHours: number;
  ccStageMinutes: number;
  cvStageMinutes: number;
  ccStagePercentageOfTime: number;
  cvStagePercentageOfTime: number;
  totalAhDelivered: number;
  formula: string;
}

/** 43. CC/CV Charging Time Estimate */
export function estimateCcCvChargingTime(input: CcCvEstimateInput): CcCvEstimateResult {
  const { nominalCapacityAh: cNom, ccChargeCurrentAmps: iCc } = input;
  const initSoc = input.initialSocPercent ?? 0;
  const ccCutoffSoc = input.ccCutoffSocPercent ?? 80;
  const iCutoff = input.cvCutoffCurrentAmps ?? 0.05 * cNom;
  const tau = input.tauDecayMinutes ?? 45.0;

  if (cNom <= 0 || iCc <= 0) throw new Error('Capacity and CC current must be positive.');

  // CC stage
  const ccRes = calculateCcCharging({
    capacityAh: cNom,
    initialSocPercent: initSoc,
    targetSocPercent: ccCutoffSoc,
    chargeCurrentAmps: iCc,
  });

  // CV stage
  const cvRes = calculateCvCharging({
    cvStartCurrentAmps: iCc,
    cutoffCurrentAmps: iCutoff,
    tauDecayMinutes: tau,
  });

  const totalMins = ccRes.chargeTimeMinutes + cvRes.cvTimeMinutes;
  const totalHours = totalMins / 60;
  const totalAh = ccRes.ampHoursSupplied + cvRes.estimatedAhAdded;

  return {
    totalChargeTimeMinutes: Number(totalMins.toFixed(1)),
    totalChargeTimeHours: Number(totalHours.toFixed(3)),
    ccStageMinutes: Number(ccRes.chargeTimeMinutes.toFixed(1)),
    cvStageMinutes: Number(cvRes.cvTimeMinutes.toFixed(1)),
    ccStagePercentageOfTime: Number(((ccRes.chargeTimeMinutes / totalMins) * 100).toFixed(1)),
    cvStagePercentageOfTime: Number(((cvRes.cvTimeMinutes / totalMins) * 100).toFixed(1)),
    totalAhDelivered: Number(totalAh.toFixed(3)),
    formula: 't_{total} = t_{CC} + t_{CV} | \\text{CC: 0 to 80\\% SOC}, \\text{CV: 80 to 100\\% SOC with current taper}',
  };
}

/** 44. Charge Energy Calculator */
export function calculateChargeEnergy(
  averageChargingVoltage: number,
  chargeCurrentAmps: number,
  chargeDurationHours: number
): { energySuppliedWh: number; energySuppliedKwh: number; formula: string } {
  if (averageChargingVoltage <= 0 || chargeCurrentAmps < 0 || chargeDurationHours < 0) {
    throw new Error('Voltage must be positive, current and duration non-negative.');
  }
  const wh = averageChargingVoltage * chargeCurrentAmps * chargeDurationHours;
  return {
    energySuppliedWh: Number(wh.toFixed(2)),
    energySuppliedKwh: Number((wh / 1000).toFixed(5)),
    formula: 'E_{charge} = \\bar{V}_{chg} · I_{chg} · t_{chg}',
  };
}

/** 45. Charge Energy Efficiency (Watt-hour Round-Trip Efficiency) */
export function calculateRoundTripEnergyEfficiency(
  energyDischargedWh: number,
  energyChargedWh: number
): { energyEfficiencyPercent: number; energyLossWh: number; formula: string } {
  if (energyChargedWh <= 0 || energyDischargedWh < 0) {
    throw new Error('Charged energy must be positive, discharged energy non-negative.');
  }
  if (energyDischargedWh > energyChargedWh) {
    throw new Error('Discharge energy cannot exceed charge energy.');
  }
  const eff = (energyDischargedWh / energyChargedWh) * 100;
  return {
    energyEfficiencyPercent: Number(eff.toFixed(2)),
    energyLossWh: Number((energyChargedWh - energyDischargedWh).toFixed(2)),
    formula: 'η_{Wh} = \\frac{E_{discharge}}{E_{charge}} · 100\\%',
  };
}

/** 46. Coulombic Efficiency (Faradaic / Amp-Hour Efficiency) */
export function calculateCoulombicEfficiency(
  ahDischarged: number,
  ahCharged: number
): { coulombicEfficiencyPercent: number; lostCapacityAh: number; formula: string } {
  if (ahCharged <= 0 || ahDischarged < 0) {
    throw new Error('Charged Ah must be positive, discharged Ah non-negative.');
  }
  if (ahDischarged > ahCharged) {
    throw new Error('Discharged Ah cannot exceed charged Ah in passive battery chemistry.');
  }
  const eff = (ahDischarged / ahCharged) * 100;
  return {
    coulombicEfficiencyPercent: Number(eff.toFixed(2)),
    lostCapacityAh: Number((ahCharged - ahDischarged).toFixed(4)),
    formula: 'η_{Ah} = \\frac{Q_{discharge}}{Q_{charge}} · 100\\%',
  };
}

export interface ChargingPowerInput {
  openCircuitVoltage: number;
  chargeCurrentAmps: number;
  internalResistanceOhms: number;
}

export interface ChargingPowerResult {
  terminalChargingVoltage: number;
  totalChargingPowerWatts: number;
  internalJouleLossWatts: number;
  netElectrochemicalPowerWatts: number;
  formula: string;
}

/** 47. Charging Power: P_chg = V_term · I_chg = (Voc + I · R_int) · I */
export function calculateChargingPower(input: ChargingPowerInput): ChargingPowerResult {
  const { openCircuitVoltage: voc, chargeCurrentAmps: iChg, internalResistanceOhms: rInt } = input;
  if (voc <= 0 || iChg < 0 || rInt < 0) {
    throw new Error('Voc must be positive, current and resistance non-negative.');
  }

  // When charging, current is forced into battery: V_term = Voc + I · R_int
  const vTerm = voc + iChg * rInt;
  const pTotal = vTerm * iChg;
  const pLoss = iChg * iChg * rInt;
  const pElectro = voc * iChg;

  return {
    terminalChargingVoltage: Number(vTerm.toFixed(4)),
    totalChargingPowerWatts: Number(pTotal.toFixed(3)),
    internalJouleLossWatts: Number(pLoss.toFixed(3)),
    netElectrochemicalPowerWatts: Number(pElectro.toFixed(3)),
    formula: 'V_{term} = V_{oc} + I · R_{int} | P_{total} = V_{term} · I = V_{oc} · I + I^2 · R_{int}',
  };
}

/** 48. Charging Current Sizing */
export function sizeChargingCurrent(
  nominalCapacityAh: number,
  recommendedCRate: number = 0.5,
  maxAllowedPowerWatts?: number,
  packVoltage?: number
): { recommendedCurrentAmps: number; isPowerConstrained: boolean; formula: string } {
  if (nominalCapacityAh <= 0 || recommendedCRate <= 0) {
    throw new Error('Capacity and C-rate must be strictly positive.');
  }
  let current = recommendedCRate * nominalCapacityAh;
  let powerConstrained = false;

  if (maxAllowedPowerWatts && packVoltage && packVoltage > 0) {
    const maxCurrentFromPower = maxAllowedPowerWatts / packVoltage;
    if (maxCurrentFromPower < current) {
      current = maxCurrentFromPower;
      powerConstrained = true;
    }
  }

  return {
    recommendedCurrentAmps: Number(current.toFixed(3)),
    isPowerConstrained: powerConstrained,
    formula: 'I_{chg} = \\min(C_{rate} · Q_{nom}, P_{max} / V_{pack})',
  };
}

/** 49. Charge Loss Calculator */
export function calculateChargeLoss(
  energySuppliedWh: number,
  energyStoredElectrochemicalWh: number
): { energyLossWh: number; lossFractionPercent: number; formula: string } {
  if (energySuppliedWh <= 0 || energyStoredElectrochemicalWh < 0) {
    throw new Error('Supplied energy must be positive, stored energy non-negative.');
  }
  const lossWh = Math.max(0, energySuppliedWh - energyStoredElectrochemicalWh);
  const lossPct = (lossWh / energySuppliedWh) * 100;

  return {
    energyLossWh: Number(lossWh.toFixed(3)),
    lossFractionPercent: Number(lossPct.toFixed(2)),
    formula: 'E_{loss} = E_{supplied} - E_{stored} | \\text{Loss}_{\\%} = (E_{loss} / E_{supplied}) · 100\\%',
  };
}

export interface ChargeHeatInput {
  chargeCurrentAmps: number;
  internalResistanceOhms: number;
  batteryMassKg: number;
  specificHeatCapacityJkgK?: number; // typically 900 J/(kg·K) for Li-ion
  durationSeconds: number;
}

export interface ChargeHeatResult {
  heatGenerationRateWatts: number;
  totalHeatEnergyJoules: number;
  totalHeatEnergyWh: number;
  adiabaticTemperatureRiseKelvin: number;
  formula: string;
}

/** 50. Charge Heat Generation Estimate */
export function estimateChargeHeatGeneration(input: ChargeHeatInput): ChargeHeatResult {
  const { chargeCurrentAmps: iChg, internalResistanceOhms: rInt, batteryMassKg: mass, durationSeconds: tSec } = input;
  const cp = input.specificHeatCapacityJkgK ?? 900;

  if (mass <= 0 || tSec < 0 || rInt < 0 || iChg < 0) {
    throw new Error('Mass > 0, duration >= 0, resistance and current non-negative.');
  }

  const pHeat = iChg * iChg * rInt;
  const qJoules = pHeat * tSec;
  const qWh = qJoules / 3600;

  // Adiabatic temperature rise ΔT = Q / (m · c_p)
  const cTh = mass * cp;
  const deltaT = cTh > 0 ? qJoules / cTh : 0;

  return {
    heatGenerationRateWatts: Number(pHeat.toFixed(3)),
    totalHeatEnergyJoules: Number(qJoules.toFixed(1)),
    totalHeatEnergyWh: Number(qWh.toFixed(3)),
    adiabaticTemperatureRiseKelvin: Number(deltaT.toFixed(3)),
    formula: 'P_{heat} = I_{chg}^2 · R_{int} | Q_{heat} = P_{heat} · t | \\Delta T_{adiabatic} = Q / (m · c_p)',
  };
}
