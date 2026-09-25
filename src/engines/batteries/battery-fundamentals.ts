/**
 * ElectroKit — Battery & Energy Storage Subsystem
 * Module A: Battery Fundamentals (Tools 1 - 10)
 *
 * Implements:
 * 1. Battery Capacity Calculator (Ah, mAh, Coulombs Q = I · t)
 * 2. Battery Energy Calculator (Wh = V_nom · Ah, kWh, Joules)
 * 3. Watt-hour ↔ Amp-hour Converter (Wh ↔ Ah given nominal voltage)
 * 4. Battery Runtime Calculator (t = Capacity / Current, hours, minutes, days)
 * 5. Battery Current Calculator (I = Capacity / t or I = Power / V)
 * 6. Battery Power Calculator (P = V · I)
 * 7. Battery Voltage Calculator (V = P / I or V = E / Q)
 * 8. Battery C-Rate Calculator (C-rate = I / C_rated, and I = C-rate · C_rated)
 * 9. Battery Charge / Discharge Time (t = C / (C-rate · C_rated) with efficiency)
 * 10. Battery Energy Efficiency (η_energy = E_out / E_in · 100%)
 */

export interface BatteryCapacityInput {
  currentAmps: number;
  timeHours: number;
}

export interface BatteryCapacityResult {
  capacityAh: number;
  capacityMah: number;
  chargeCoulombs: number;
  formula: string;
}

/** 1. Battery Capacity Calculator: Q = I · t */
export function calculateBatteryCapacity(input: BatteryCapacityInput): BatteryCapacityResult {
  const { currentAmps, timeHours } = input;
  if (currentAmps < 0 || timeHours < 0) {
    throw new Error('Current and time must be non-negative.');
  }
  const ah = currentAmps * timeHours;
  const mah = ah * 1000;
  const coulombs = ah * 3600; // 1 Ah = 3600 Coulombs (A·s)

  return {
    capacityAh: Number(ah.toFixed(4)),
    capacityMah: Number(mah.toFixed(1)),
    chargeCoulombs: Number(coulombs.toFixed(1)),
    formula: 'Q = I · t | Q_{Coulombs} = Q_{Ah} · 3600 s/h',
  };
}

export interface BatteryEnergyInput {
  nominalVoltage: number;
  capacityAh: number;
}

export interface BatteryEnergyResult {
  energyWh: number;
  energyKwh: number;
  energyJoules: number;
  formula: string;
}

/** 2. Battery Energy Calculator: E = V_nominal · Q_Ah */
export function calculateBatteryEnergy(input: BatteryEnergyInput): BatteryEnergyResult {
  const { nominalVoltage, capacityAh } = input;
  if (nominalVoltage <= 0 || capacityAh <= 0) {
    throw new Error('Nominal voltage and capacity must be strictly positive.');
  }
  const wh = nominalVoltage * capacityAh;
  const kwh = wh / 1000;
  const joules = wh * 3600; // 1 Wh = 3600 Joules (W·s)

  return {
    energyWh: Number(wh.toFixed(3)),
    energyKwh: Number(kwh.toFixed(6)),
    energyJoules: Number(joules.toFixed(1)),
    formula: 'E = V_{nominal} · Q_{Ah} | E_{Joules} = E_{Wh} · 3600',
  };
}

export interface WhAhConversionInput {
  value: number;
  fromUnit: 'Wh' | 'Ah' | 'kWh' | 'mAh';
  nominalVoltage: number;
}

export interface WhAhConversionResult {
  wattHours: number;
  kiloWattHours: number;
  ampHours: number;
  milliAmpHours: number;
  nominalVoltage: number;
  voltageAssumption: string;
  formula: string;
}

/** 3. Watt-hour ↔ Amp-hour Converter */
export function convertWhAndAh(input: WhAhConversionInput): WhAhConversionResult {
  const { value, fromUnit, nominalVoltage } = input;
  if (value < 0 || nominalVoltage <= 0) {
    throw new Error('Value must be non-negative and nominal voltage must be strictly positive.');
  }

  let wh = 0;
  let ah = 0;

  switch (fromUnit) {
    case 'Wh':
      wh = value;
      ah = wh / nominalVoltage;
      break;
    case 'kWh':
      wh = value * 1000;
      ah = wh / nominalVoltage;
      break;
    case 'Ah':
      ah = value;
      wh = ah * nominalVoltage;
      break;
    case 'mAh':
      ah = value / 1000;
      wh = ah * nominalVoltage;
      break;
  }

  return {
    wattHours: Number(wh.toFixed(4)),
    kiloWattHours: Number((wh / 1000).toFixed(6)),
    ampHours: Number(ah.toFixed(4)),
    milliAmpHours: Number((ah * 1000).toFixed(1)),
    nominalVoltage,
    voltageAssumption: 'Assumes constant nominal midpoint voltage V_nom over entire discharge curve; actual delivered energy equals integral of dynamic terminal voltage V_term(t) dt.',
    formula: 'Wh = Ah · V_{nom} ↔ Ah = Wh / V_{nom}',
  };
}

export interface FundamentalRuntimeInput {
  capacityAh: number;
  loadValue: number;
  loadType: 'current' | 'power';
  nominalVoltage?: number;
  dischargeDepthFraction?: number; // e.g. 0.8 for 80% DoD
}

export interface FundamentalRuntimeResult {
  runtimeHours: number;
  runtimeMinutes: number;
  runtimeDays: number;
  usableCapacityAh: number;
  loadCurrentAmps: number;
  loadPowerWatts: number;
  formula: string;
}

/** 4. Battery Runtime Calculator: t = C_usable / I */
export function calculateFundamentalRuntime(input: FundamentalRuntimeInput): FundamentalRuntimeResult {
  const { capacityAh, loadValue, loadType } = input;
  const dod = input.dischargeDepthFraction ?? 1.0;
  const vNom = input.nominalVoltage ?? 3.7;

  if (capacityAh <= 0) throw new Error('Battery capacity must be strictly positive.');
  if (loadValue <= 0) throw new Error('Load value must be strictly positive.');
  if (dod <= 0 || dod > 1.0) throw new Error('Depth of discharge fraction must be between 0 and 1.0.');
  if (vNom <= 0) throw new Error('Nominal voltage must be strictly positive.');

  const usableAh = capacityAh * dod;
  let loadCurrent = 0;
  let loadPower = 0;

  if (loadType === 'current') {
    loadCurrent = loadValue;
    loadPower = loadCurrent * vNom;
  } else {
    loadPower = loadValue;
    loadCurrent = loadPower / vNom;
  }

  const hours = usableAh / loadCurrent;

  return {
    runtimeHours: Number(hours.toFixed(3)),
    runtimeMinutes: Number((hours * 60).toFixed(1)),
    runtimeDays: Number((hours / 24).toFixed(3)),
    usableCapacityAh: Number(usableAh.toFixed(3)),
    loadCurrentAmps: Number(loadCurrent.toFixed(4)),
    loadPowerWatts: Number(loadPower.toFixed(2)),
    formula: 't = (C_{nom} · DoD) / I_{load} = E_{usable} / P_{load}',
  };
}

export interface BatteryCurrentInput {
  mode: 'from_capacity_time' | 'from_power_voltage';
  capacityAh?: number;
  timeHours?: number;
  powerWatts?: number;
  voltageVolts?: number;
}

/** 5. Battery Current Calculator: I = Q / t or I = P / V */
export function calculateBatteryCurrent(input: BatteryCurrentInput): { currentAmps: number; currentMilliamps: number; formula: string } {
  let current = 0;
  let formula = '';

  if (input.mode === 'from_capacity_time') {
    const c = input.capacityAh ?? 0;
    const t = input.timeHours ?? 0;
    if (c <= 0 || t <= 0) throw new Error('Capacity and time must be strictly positive.');
    current = c / t;
    formula = 'I = Q_{Ah} / t_{hours}';
  } else {
    const p = input.powerWatts ?? 0;
    const v = input.voltageVolts ?? 0;
    if (p < 0 || v <= 0) throw new Error('Power must be non-negative and voltage must be positive.');
    current = p / v;
    formula = 'I = P / V';
  }

  return {
    currentAmps: Number(current.toFixed(4)),
    currentMilliamps: Number((current * 1000).toFixed(1)),
    formula,
  };
}

/** 6. Battery Power Calculator: P = V · I */
export function calculateBatteryPower(voltageVolts: number, currentAmps: number): { powerWatts: number; powerKilowatts: number; formula: string } {
  if (voltageVolts < 0 || currentAmps < 0) {
    throw new Error('Voltage and current must be non-negative.');
  }
  const p = voltageVolts * currentAmps;
  return {
    powerWatts: Number(p.toFixed(3)),
    powerKilowatts: Number((p / 1000).toFixed(6)),
    formula: 'P = V · I',
  };
}

/** 7. Battery Voltage Calculator: V = P / I or V = E / Q */
export function calculateBatteryVoltage(
  mode: 'power_current' | 'energy_capacity',
  val1: number, // Power in Watts or Energy in Wh
  val2: number  // Current in Amps or Capacity in Ah
): { voltageVolts: number; formula: string } {
  if (val1 < 0 || val2 <= 0) throw new Error('First argument must be non-negative, second must be strictly positive.');
  const v = val1 / val2;
  return {
    voltageVolts: Number(v.toFixed(4)),
    formula: mode === 'power_current' ? 'V = P / I' : 'V = E_{Wh} / Q_{Ah}',
  };
}

/** 8. Battery C-Rate Calculator: C_rate = I / C_nom, I = C_rate · C_nom */
export function calculateCRate(
  mode: 'current_to_crate' | 'crate_to_current',
  capacityAh: number,
  value: number // Current in Amps or C-rate (multiplier)
): { cRate: number; currentAmps: number; currentMilliamps: number; formula: string } {
  if (capacityAh <= 0 || value < 0) throw new Error('Capacity must be positive, value must be non-negative.');

  let cRate = 0;
  let currentAmps = 0;

  if (mode === 'current_to_crate') {
    currentAmps = value;
    cRate = currentAmps / capacityAh;
  } else {
    cRate = value;
    currentAmps = cRate * capacityAh;
  }

  return {
    cRate: Number(cRate.toFixed(4)),
    currentAmps: Number(currentAmps.toFixed(4)),
    currentMilliamps: Number((currentAmps * 1000).toFixed(1)),
    formula: 'C_{rate} = I / C_{nom} ↔ I = C_{rate} · C_{nom}',
  };
}

export interface ChargeDischargeTimeInput {
  capacityAh: number;
  cRate: number;
  coulombicEfficiencyPercent?: number; // e.g. 98% for Li-ion, 85% for Lead-Acid
  mode: 'charge' | 'discharge';
}

/** 9. Battery Charge / Discharge Time: t = 1 / C-rate with efficiency */
export function calculateChargeDischargeTime(input: ChargeDischargeTimeInput): {
  timeHours: number;
  timeMinutes: number;
  timeSeconds: number;
  currentAmps: number;
  formula: string;
} {
  const { capacityAh, cRate, mode } = input;
  const eta = (input.coulombicEfficiencyPercent ?? 99) / 100;

  if (capacityAh <= 0 || cRate <= 0) throw new Error('Capacity and C-rate must be strictly positive.');
  if (eta <= 0 || eta > 1.0) throw new Error('Efficiency must be between 0 and 100%.');

  const current = cRate * capacityAh;
  let hours = 0;

  if (mode === 'discharge') {
    // Ideal discharge time
    hours = 1 / cRate;
  } else {
    // Charge requires more Coulombs: Q_in = Q_nom / eta
    hours = (1 / cRate) / eta;
  }

  return {
    timeHours: Number(hours.toFixed(4)),
    timeMinutes: Number((hours * 60).toFixed(2)),
    timeSeconds: Math.round(hours * 3600),
    currentAmps: Number(current.toFixed(4)),
    formula: mode === 'discharge' ? 't_{dis} = 1 / C_{rate} = Q / I' : 't_{chg} = (1 / C_{rate}) / η_{coulomb}',
  };
}

/** 10. Battery Energy Efficiency: η_energy = E_out / E_in · 100% */
export function calculateBatteryEnergyEfficiency(
  energyDischargedWh: number,
  energyChargedWh: number
): { efficiencyPercent: number; energyLossWh: number; lossPercentage: number; formula: string } {
  if (energyDischargedWh < 0 || energyChargedWh <= 0) {
    throw new Error('Discharged energy must be non-negative, charged energy must be strictly positive.');
  }
  if (energyDischargedWh > energyChargedWh) {
    throw new Error('Discharged energy cannot exceed charged energy in an unassisted battery system (over-unity violation).');
  }

  const eff = (energyDischargedWh / energyChargedWh) * 100;
  const loss = energyChargedWh - energyDischargedWh;
  const lossPct = 100 - eff;

  return {
    efficiencyPercent: Number(eff.toFixed(2)),
    energyLossWh: Number(loss.toFixed(3)),
    lossPercentage: Number(lossPct.toFixed(2)),
    formula: 'η_{energy} = (E_{out} / E_{in}) · 100% | E_{loss} = E_{in} - E_{out}',
  };
}
