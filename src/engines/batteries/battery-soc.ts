/**
 * ElectroKit — Battery & Energy Storage Subsystem
 * Module D: State Estimation & Health Monitoring (Tools 31 - 40)
 *
 * Implements:
 * 31. State of Charge (SOC = Q_remaining / Q_nominal · 100%)
 * 32. SOC from Remaining Capacity (Ah & mAh relative tracking)
 * 33. SOC from Voltage — Reference Estimate (Piecewise OCV curves for 5 chemistries; labeled chemistry-dependent)
 * 34. Depth of Discharge (DoD = 100% - SOC)
 * 35. State of Health (SOH = Q_max_current / Q_rated_original · 100% and resistance indicator)
 * 36. Capacity Fade Calculator (Lost Ah and percentage capacity degradation)
 * 37. Cycle Count / Equivalent Full Cycles (EFC = ∑ Ah_throughput / (2 · Q_nominal))
 * 38. Coulomb Counting (Discrete SOC step tracking with explicit positive = discharge sign convention)
 * 39. Remaining Energy Estimate (E_rem = SOC · E_nominal · voltage_correction)
 * 40. Remaining Runtime Estimate (t_rem = Q_rem / I_load or E_rem / P_load)
 */

export interface SocInput {
  remainingCapacityAh: number;
  nominalCapacityAh: number;
}

/** 31. State of Charge (SOC): SOC = Q_remaining / Q_nominal · 100% */
export function calculateSoc(input: SocInput): {
  socPercent: number;
  dodPercent: number;
  remainingCapacityAh: number;
  nominalCapacityAh: number;
  formula: string;
} {
  const { remainingCapacityAh, nominalCapacityAh } = input;
  if (nominalCapacityAh <= 0) throw new Error('Nominal capacity must be strictly positive.');
  if (remainingCapacityAh < 0) throw new Error('Remaining capacity cannot be negative.');

  const soc = Math.min(100, Math.max(0, (remainingCapacityAh / nominalCapacityAh) * 100));
  const dod = 100 - soc;

  return {
    socPercent: Number(soc.toFixed(2)),
    dodPercent: Number(dod.toFixed(2)),
    remainingCapacityAh,
    nominalCapacityAh,
    formula: 'SOC = (Q_{rem} / Q_{nom}) · 100% | DoD = 100% - SOC',
  };
}

/** 32. SOC from Remaining Capacity */
export function calculateSocFromCapacity(
  remainingCapacityAh: number,
  ratedCapacityAh: number
): { socFraction: number; socPercent: number; dodFraction: number; dodPercent: number } {
  if (ratedCapacityAh <= 0 || remainingCapacityAh < 0) {
    throw new Error('Rated capacity must be positive and remaining capacity non-negative.');
  }
  const frac = Math.min(1.0, Math.max(0.0, remainingCapacityAh / ratedCapacityAh));
  return {
    socFraction: Number(frac.toFixed(4)),
    socPercent: Number((frac * 100).toFixed(2)),
    dodFraction: Number((1.0 - frac).toFixed(4)),
    dodPercent: Number(((1.0 - frac) * 100).toFixed(2)),
  };
}

export type BatteryChemistryType = 'li-ion' | 'lifepo4' | 'lead-acid' | 'nimh' | 'lto';

/** Reference OCV lookup point (Relaxed open-circuit voltage at 25°C) */
interface OcvSocPoint {
  soc: number; // 0 to 100
  voltage: number; // Volts per cell
}

export const REFERENCE_OCV_CURVES: Record<BatteryChemistryType, { name: string; nominalV: number; curve: OcvSocPoint[] }> = {
  'li-ion': {
    name: 'Lithium-Ion / NMC (3.6V-3.7V Nom)',
    nominalV: 3.7,
    curve: [
      { soc: 0, voltage: 3.00 },
      { soc: 10, voltage: 3.52 },
      { soc: 20, voltage: 3.64 },
      { soc: 30, voltage: 3.70 },
      { soc: 40, voltage: 3.74 },
      { soc: 50, voltage: 3.80 },
      { soc: 60, voltage: 3.86 },
      { soc: 70, voltage: 3.93 },
      { soc: 80, voltage: 4.02 },
      { soc: 90, voltage: 4.11 },
      { soc: 100, voltage: 4.20 },
    ],
  },
  lifepo4: {
    name: 'Lithium Iron Phosphate / LiFePO4 (3.2V Nom)',
    nominalV: 3.2,
    curve: [
      { soc: 0, voltage: 2.50 },
      { soc: 10, voltage: 3.15 },
      { soc: 20, voltage: 3.25 },
      { soc: 30, voltage: 3.28 },
      { soc: 50, voltage: 3.29 },
      { soc: 70, voltage: 3.30 },
      { soc: 80, voltage: 3.32 },
      { soc: 90, voltage: 3.35 },
      { soc: 98, voltage: 3.40 },
      { soc: 100, voltage: 3.60 },
    ],
  },
  'lead-acid': {
    name: 'Sealed Lead-Acid / AGM (12V Nom / 2.0V per cell)',
    nominalV: 2.0,
    curve: [
      { soc: 0, voltage: 1.75 },
      { soc: 10, voltage: 1.88 },
      { soc: 25, voltage: 1.95 },
      { soc: 50, voltage: 2.01 },
      { soc: 75, voltage: 2.08 },
      { soc: 90, voltage: 2.12 },
      { soc: 100, voltage: 2.15 },
    ],
  },
  nimh: {
    name: 'Nickel-Metal Hydride / NiMH (1.2V Nom)',
    nominalV: 1.2,
    curve: [
      { soc: 0, voltage: 1.00 },
      { soc: 10, voltage: 1.18 },
      { soc: 20, voltage: 1.23 },
      { soc: 50, voltage: 1.25 },
      { soc: 80, voltage: 1.28 },
      { soc: 90, voltage: 1.33 },
      { soc: 100, voltage: 1.42 },
    ],
  },
  lto: {
    name: 'Lithium Titanate / LTO (2.3V-2.4V Nom)',
    nominalV: 2.3,
    curve: [
      { soc: 0, voltage: 1.80 },
      { soc: 10, voltage: 2.15 },
      { soc: 30, voltage: 2.25 },
      { soc: 50, voltage: 2.30 },
      { soc: 70, voltage: 2.38 },
      { soc: 90, voltage: 2.55 },
      { soc: 100, voltage: 2.70 },
    ],
  },
};

export interface SocFromVoltageResult {
  estimatedSocPercent: number;
  chemistryName: string;
  perCellOpenCircuitVoltage: number;
  statusText: string;
  warningNote: string;
  formula: string;
}

/** 33. SOC from Voltage — Reference Estimate (Piecewise interpolation with chemistry disclaimer) */
export function estimateSocFromVoltage(
  cellOpenCircuitVoltage: number,
  chemistry: BatteryChemistryType
): SocFromVoltageResult {
  const preset = REFERENCE_OCV_CURVES[chemistry] || REFERENCE_OCV_CURVES['li-ion'];
  const curve = preset.curve;

  if (cellOpenCircuitVoltage <= 0) throw new Error('Cell voltage must be strictly positive.');

  const minV = curve[0].voltage;
  const maxV = curve[curve.length - 1].voltage;

  let soc = 0;
  if (cellOpenCircuitVoltage <= minV) {
    soc = 0;
  } else if (cellOpenCircuitVoltage >= maxV) {
    soc = 100;
  } else {
    // Piecewise linear interpolation between curve points
    for (let i = 0; i < curve.length - 1; i++) {
      const p1 = curve[i];
      const p2 = curve[i + 1];
      if (cellOpenCircuitVoltage >= p1.voltage && cellOpenCircuitVoltage <= p2.voltage) {
        const spanV = p2.voltage - p1.voltage;
        const frac = spanV > 0 ? (cellOpenCircuitVoltage - p1.voltage) / spanV : 0;
        soc = p1.soc + frac * (p2.soc - p1.soc);
        break;
      }
    }
  }

  return {
    estimatedSocPercent: Number(soc.toFixed(1)),
    chemistryName: preset.name,
    perCellOpenCircuitVoltage: cellOpenCircuitVoltage,
    statusText: 'Reference estimate — chemistry dependent, OCV relaxed at 25°C',
    warningNote:
      'Open-circuit voltage mapping requires a fully rested, unloaded cell (>30-60 min relaxation). Under load, IR drop and hysteresis corrupt voltage-to-SOC estimation.',
    formula: 'SOC(V) \\approx \\text{PiecewiseLinearInterpolation}(V_{oc}, \\text{ChemistryCurve})',
  };
}

/** 34. Depth of Discharge (DoD): DoD = 100% - SOC */
export function calculateDoD(socPercent: number): { dodPercent: number; dodFraction: number; formula: string } {
  if (socPercent < 0 || socPercent > 100) {
    throw new Error('SOC percentage must be between 0% and 100%.');
  }
  const dod = 100 - socPercent;
  return {
    dodPercent: Number(dod.toFixed(2)),
    dodFraction: Number((dod / 100).toFixed(4)),
    formula: 'DoD = 100\\% - SOC',
  };
}

export interface SohInput {
  currentMaxUsableCapacityAh: number;
  originalRatedCapacityAh: number;
  currentInternalResistanceOhms?: number;
  initialNewInternalResistanceOhms?: number;
}

export interface SohResult {
  capacitySohPercent: number;
  isEndOfLife: boolean; // Typically SOH <= 80% marks automotive/industrial battery EOL
  resistanceHealthIndicatorRatio: number | null;
  statusText: string;
  formula: string;
}

/** 35. State of Health (SOH) */
export function calculateSoh(input: SohInput): SohResult {
  const { currentMaxUsableCapacityAh, originalRatedCapacityAh } = input;
  if (originalRatedCapacityAh <= 0 || currentMaxUsableCapacityAh < 0) {
    throw new Error('Original capacity must be positive and current capacity non-negative.');
  }

  const capSoh = (currentMaxUsableCapacityAh / originalRatedCapacityAh) * 100;
  const isEol = capSoh <= 80.0;

  let rRatio: number | null = null;
  if (input.currentInternalResistanceOhms && input.initialNewInternalResistanceOhms) {
    if (input.initialNewInternalResistanceOhms > 0) {
      rRatio = input.currentInternalResistanceOhms / input.initialNewInternalResistanceOhms;
    }
  }

  let status = 'HEALTHY';
  if (capSoh > 95) status = 'NEAR_PRISTINE';
  else if (capSoh > 80) status = 'NORMAL_OPERATIONAL';
  else if (capSoh > 70) status = 'END_OF_LIFE_RECOMMENDED_REPLACEMENT';
  else status = 'SEVERELY_DEGRADED';

  return {
    capacitySohPercent: Number(capSoh.toFixed(2)),
    isEndOfLife: isEol,
    resistanceHealthIndicatorRatio: rRatio !== null ? Number(rRatio.toFixed(3)) : null,
    statusText: status,
    formula: 'SOH_{capacity} = (Q_{curr} / Q_{orig}) · 100% | R_{ratio} = R_{int,curr} / R_{int,new}',
  };
}

/** 36. Capacity Fade Calculator */
export function calculateCapacityFade(
  originalCapacityAh: number,
  currentCapacityAh: number
): { fadeAh: number; fadePercent: number; remainingCapacityPercent: number; formula: string } {
  if (originalCapacityAh <= 0 || currentCapacityAh < 0) {
    throw new Error('Capacities must be positive / non-negative.');
  }
  const fadeAh = Math.max(0, originalCapacityAh - currentCapacityAh);
  const fadePct = (fadeAh / originalCapacityAh) * 100;

  return {
    fadeAh: Number(fadeAh.toFixed(4)),
    fadePercent: Number(fadePct.toFixed(2)),
    remainingCapacityPercent: Number(((currentCapacityAh / originalCapacityAh) * 100).toFixed(2)),
    formula: 'Fade_{Ah} = Q_{orig} - Q_{curr} | Fade_{\\%} = (Fade_{Ah} / Q_{orig}) · 100%',
  };
}

/** 37. Cycle Count / Equivalent Full Cycles (EFC) */
export function calculateEquivalentFullCycles(
  totalCumulativeThroughputAh: number,
  nominalCapacityAh: number
): { equivalentFullCycles: number; formula: string } {
  if (nominalCapacityAh <= 0 || totalCumulativeThroughputAh < 0) {
    throw new Error('Capacity must be positive and throughput non-negative.');
  }
  // 1 full cycle = 1 full charge + 1 full discharge = 2 · Q_nom throughput
  const efc = totalCumulativeThroughputAh / (2 * nominalCapacityAh);
  return {
    equivalentFullCycles: Number(efc.toFixed(2)),
    formula: 'EFC = \\frac{\\sum |Ah_{throughput}|}{2 · Q_{nominal}}',
  };
}

export interface CoulombCountingInput {
  initialSocPercent: number;
  nominalCapacityAh: number;
  currentAmps: number; // Convention: POSITIVE = Discharge, NEGATIVE = Charge
  timeDurationSeconds: number;
  coulombicEfficiencyFraction?: number; // e.g. 0.99 (applied during charging)
}

/** 38. Coulomb Counting (Discrete SOC step tracking) */
export function stepCoulombCounting(input: CoulombCountingInput): {
  nextSocPercent: number;
  deltaAh: number;
  coulombsTransferred: number;
  direction: 'discharge' | 'charge' | 'idle';
  formula: string;
} {
  const { initialSocPercent, nominalCapacityAh, currentAmps, timeDurationSeconds } = input;
  const eta = input.coulombicEfficiencyFraction ?? 0.99;

  if (nominalCapacityAh <= 0 || timeDurationSeconds < 0) {
    throw new Error('Nominal capacity must be positive, time non-negative.');
  }
  if (initialSocPercent < 0 || initialSocPercent > 100) {
    throw new Error('Initial SOC must be between 0% and 100%.');
  }

  // Convention: I > 0 is discharge (removes charge), I < 0 is charge (adds charge)
  const dtHours = timeDurationSeconds / 3600;
  let deltaAh = 0;
  let dir: 'discharge' | 'charge' | 'idle' = 'idle';

  if (currentAmps > 0) {
    // Discharge
    deltaAh = currentAmps * dtHours;
    dir = 'discharge';
  } else if (currentAmps < 0) {
    // Charge with coulombic efficiency
    deltaAh = currentAmps * dtHours * eta; // negative value
    dir = 'charge';
  }

  // deltaSOC = - (deltaAh / Q_nom) * 100%
  const deltaSocPct = -(deltaAh / nominalCapacityAh) * 100;
  const nextSoc = Math.min(100, Math.max(0, initialSocPercent + deltaSocPct));

  return {
    nextSocPercent: Number(nextSoc.toFixed(4)),
    deltaAh: Number(Math.abs(deltaAh).toFixed(6)),
    coulombsTransferred: Number((Math.abs(currentAmps) * timeDurationSeconds).toFixed(2)),
    direction: dir,
    formula: 'SOC(t) = SOC_0 - \\left(\\frac{I \\cdot \\Delta t}{Q_{nom}}\\right) · 100\\% (I > 0 \\text{ for discharge})',
  };
}

/** 39. Remaining Energy Estimate */
export function estimateRemainingEnergy(
  socPercent: number,
  nominalCapacityAh: number,
  nominalVoltage: number
): { remainingEnergyWh: number; remainingCapacityAh: number; formula: string } {
  if (socPercent < 0 || socPercent > 100 || nominalCapacityAh <= 0 || nominalVoltage <= 0) {
    throw new Error('SOC must be 0-100%, capacity and voltage strictly positive.');
  }
  const socFrac = socPercent / 100;
  const remAh = nominalCapacityAh * socFrac;
  const remWh = remAh * nominalVoltage;

  return {
    remainingEnergyWh: Number(remWh.toFixed(2)),
    remainingCapacityAh: Number(remAh.toFixed(4)),
    formula: 'E_{rem} = \\left(\\frac{SOC}{100}\\right) · Q_{nom} · V_{nom}',
  };
}

/** 40. Remaining Runtime Estimate */
export function calculateRemainingRuntime(
  remainingCapacityAh: number,
  loadCurrentAmps: number
): { runtimeHours: number; runtimeMinutes: number; formula: string } {
  if (remainingCapacityAh < 0 || loadCurrentAmps <= 0) {
    throw new Error('Remaining capacity must be non-negative and load current strictly positive.');
  }
  const hrs = remainingCapacityAh / loadCurrentAmps;
  return {
    runtimeHours: Number(hrs.toFixed(3)),
    runtimeMinutes: Number((hrs * 60).toFixed(1)),
    formula: 't_{rem} = Q_{rem} / I_{load}',
  };
}
