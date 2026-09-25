/**
 * ElectroKit — Battery & Energy Storage Subsystem
 * Module B: Battery Pack Configuration & Cell Scaling (Tools 11 - 20)
 *
 * Implements:
 * 11. Cells in Series Calculator (S-count calculation)
 * 12. Cells in Parallel Calculator (P-count calculation)
 * 13. Series Battery Pack Voltage (Nominal, Charge, Cutoff)
 * 14. Parallel Battery Pack Capacity (Ah & mAh scaling)
 * 15. Battery Pack Energy (Total gross Wh & kWh)
 * 16. Battery Pack Current Capability (Continuous & peak discharge limits)
 * 17. Battery Pack C-Rate (Pack-level C-rate mapping)
 * 18. Battery Pack Configuration Designer (S/P optimization)
 * 19. Cell-to-Pack Scaling (Gravimetric & volumetric density, pack factor)
 * 20. Pack Capacity / Energy Verification (Mismatch, interconnect, BMS overhead derating)
 */

export interface CellSpecification {
  id: string;
  name: string;
  chemistry: 'li-ion' | 'lifepo4' | 'lto' | 'lead-acid' | 'nimh';
  nominalVoltage: number;
  maxChargeVoltage: number;
  cutoffVoltage: number;
  nominalCapacityAh: number;
  maxContinuousDischargeCurrentAmps: number;
  peakDischargeCurrentAmps: number;
  internalResistanceMOhm: number;
  weightGrams: number;
  dimensionsMm?: { diameterOrWidth: number; heightOrLength: number; thicknessDepth?: number };
}

export const POPULAR_CELL_PRESETS: Record<string, CellSpecification> = {
  samsung_30q_18650: {
    id: 'samsung_30q_18650',
    name: 'Samsung 30Q 18650 (Li-ion 3000mAh 15A)',
    chemistry: 'li-ion',
    nominalVoltage: 3.6,
    maxChargeVoltage: 4.2,
    cutoffVoltage: 2.5,
    nominalCapacityAh: 3.0,
    maxContinuousDischargeCurrentAmps: 15.0,
    peakDischargeCurrentAmps: 20.0,
    internalResistanceMOhm: 20,
    weightGrams: 48,
    dimensionsMm: { diameterOrWidth: 18.5, heightOrLength: 65.2 },
  },
  molicel_p42a_21700: {
    id: 'molicel_p42a_21700',
    name: 'Molicel P42A 21700 (Li-ion 4200mAh 45A)',
    chemistry: 'li-ion',
    nominalVoltage: 3.6,
    maxChargeVoltage: 4.2,
    cutoffVoltage: 2.5,
    nominalCapacityAh: 4.2,
    maxContinuousDischargeCurrentAmps: 45.0,
    peakDischargeCurrentAmps: 60.0,
    internalResistanceMOhm: 12,
    weightGrams: 70,
    dimensionsMm: { diameterOrWidth: 21.7, heightOrLength: 70.2 },
  },
  eve_280ah_lifepo4: {
    id: 'eve_280ah_lifepo4',
    name: 'EVE LF280K Prismatic (LiFePO4 280Ah 1C)',
    chemistry: 'lifepo4',
    nominalVoltage: 3.2,
    maxChargeVoltage: 3.65,
    cutoffVoltage: 2.5,
    nominalCapacityAh: 280.0,
    maxContinuousDischargeCurrentAmps: 280.0,
    peakDischargeCurrentAmps: 560.0,
    internalResistanceMOhm: 0.25,
    weightGrams: 5420,
    dimensionsMm: { diameterOrWidth: 173.6, heightOrLength: 207.2, thicknessDepth: 71.5 },
  },
  a123_26650_lifepo4: {
    id: 'a123_26650_lifepo4',
    name: 'A123 ANR26650M1-B (LiFePO4 2500mAh 50A)',
    chemistry: 'lifepo4',
    nominalVoltage: 3.3,
    maxChargeVoltage: 3.6,
    cutoffVoltage: 2.0,
    nominalCapacityAh: 2.5,
    maxContinuousDischargeCurrentAmps: 50.0,
    peakDischargeCurrentAmps: 100.0,
    internalResistanceMOhm: 10,
    weightGrams: 76,
    dimensionsMm: { diameterOrWidth: 26.2, heightOrLength: 65.2 },
  },
  panasonic_ncr18650b: {
    id: 'panasonic_ncr18650b',
    name: 'Panasonic NCR18650B (Li-ion 3400mAh 6.8A)',
    chemistry: 'li-ion',
    nominalVoltage: 3.6,
    maxChargeVoltage: 4.2,
    cutoffVoltage: 2.5,
    nominalCapacityAh: 3.4,
    maxContinuousDischargeCurrentAmps: 6.8,
    peakDischargeCurrentAmps: 10.0,
    internalResistanceMOhm: 35,
    weightGrams: 47.5,
    dimensionsMm: { diameterOrWidth: 18.5, heightOrLength: 65.3 },
  },
};

/** 11. Cells in Series Calculator: S = TargetVoltage / CellVoltage */
export function calculateCellsInSeries(
  targetPackVoltage: number,
  cellNominalVoltage: number,
  roundingMode: 'nearest' | 'ceil' | 'floor' = 'nearest'
): { seriesCount: number; actualNominalVoltage: number; voltageDelta: number; formula: string } {
  if (targetPackVoltage <= 0 || cellNominalVoltage <= 0) {
    throw new Error('Target pack voltage and cell voltage must be strictly positive.');
  }

  const exactS = targetPackVoltage / cellNominalVoltage;
  let s = Math.round(exactS);
  if (roundingMode === 'ceil') s = Math.ceil(exactS);
  if (roundingMode === 'floor') s = Math.floor(exactS);
  s = Math.max(1, s);

  const actualVoltage = s * cellNominalVoltage;
  const delta = actualVoltage - targetPackVoltage;

  return {
    seriesCount: s,
    actualNominalVoltage: Number(actualVoltage.toFixed(3)),
    voltageDelta: Number(delta.toFixed(3)),
    formula: 'S = \\lceil V_{target} / V_{cell} \\rfloor | V_{actual} = S · V_{cell}',
  };
}

/** 12. Cells in Parallel Calculator: P = TargetCapacity / CellCapacity */
export function calculateCellsInParallel(
  targetCapacityAh: number,
  cellCapacityAh: number,
  roundingMode: 'nearest' | 'ceil' | 'floor' = 'ceil'
): { parallelCount: number; actualPackCapacityAh: number; capacityDeltaAh: number; formula: string } {
  if (targetCapacityAh <= 0 || cellCapacityAh <= 0) {
    throw new Error('Target capacity and cell capacity must be strictly positive.');
  }

  const exactP = targetCapacityAh / cellCapacityAh;
  let p = Math.ceil(exactP);
  if (roundingMode === 'nearest') p = Math.round(exactP);
  if (roundingMode === 'floor') p = Math.floor(exactP);
  p = Math.max(1, p);

  const actualCapacity = p * cellCapacityAh;
  const delta = actualCapacity - targetCapacityAh;

  return {
    parallelCount: p,
    actualPackCapacityAh: Number(actualCapacity.toFixed(3)),
    capacityDeltaAh: Number(delta.toFixed(3)),
    formula: 'P = \\lceil C_{target} / C_{cell} \\rceil | C_{actual} = P · C_{cell}',
  };
}

export interface SeriesPackVoltageResult {
  nominalVoltage: number;
  maxChargeVoltage: number;
  cutoffDischargeVoltage: number;
  seriesCount: number;
  formula: string;
}

/** 13. Series Battery Pack Voltage */
export function calculateSeriesPackVoltage(
  seriesCount: number,
  cellNominalVoltage: number,
  cellMaxChargeVoltage: number,
  cellCutoffVoltage: number
): SeriesPackVoltageResult {
  if (seriesCount <= 0 || cellNominalVoltage <= 0 || cellMaxChargeVoltage <= 0 || cellCutoffVoltage <= 0) {
    throw new Error('Series count and cell voltages must be strictly positive.');
  }
  if (cellCutoffVoltage >= cellNominalVoltage || cellNominalVoltage >= cellMaxChargeVoltage) {
    throw new Error('Voltage hierarchy must obey: Cutoff < Nominal < Max Charge.');
  }

  return {
    nominalVoltage: Number((seriesCount * cellNominalVoltage).toFixed(3)),
    maxChargeVoltage: Number((seriesCount * cellMaxChargeVoltage).toFixed(3)),
    cutoffDischargeVoltage: Number((seriesCount * cellCutoffVoltage).toFixed(3)),
    seriesCount,
    formula: 'V_{pack,nom} = S · V_{cell,nom} | V_{pack,max} = S · V_{cell,max} | V_{pack,min} = S · V_{cell,min}',
  };
}

/** 14. Parallel Battery Pack Capacity */
export function calculateParallelPackCapacity(
  parallelCount: number,
  cellCapacityAh: number
): { packCapacityAh: number; packCapacityMah: number; parallelCount: number; formula: string } {
  if (parallelCount <= 0 || cellCapacityAh <= 0) {
    throw new Error('Parallel count and cell capacity must be positive.');
  }
  const capAh = parallelCount * cellCapacityAh;
  return {
    packCapacityAh: Number(capAh.toFixed(3)),
    packCapacityMah: Number((capAh * 1000).toFixed(1)),
    parallelCount,
    formula: 'C_{pack} = P · C_{cell}',
  };
}

/** 15. Battery Pack Energy: E = S · P · E_cell */
export function calculatePackEnergy(
  seriesCount: number,
  parallelCount: number,
  cellNominalVoltage: number,
  cellCapacityAh: number
): {
  totalCells: number;
  nominalPackVoltage: number;
  packCapacityAh: number;
  packEnergyWh: number;
  packEnergyKwh: number;
  formula: string;
} {
  if (seriesCount <= 0 || parallelCount <= 0 || cellNominalVoltage <= 0 || cellCapacityAh <= 0) {
    throw new Error('All series, parallel, voltage, and capacity inputs must be strictly positive.');
  }
  const totalCells = seriesCount * parallelCount;
  const vPack = seriesCount * cellNominalVoltage;
  const cPack = parallelCount * cellCapacityAh;
  const wh = vPack * cPack;

  return {
    totalCells,
    nominalPackVoltage: Number(vPack.toFixed(2)),
    packCapacityAh: Number(cPack.toFixed(3)),
    packEnergyWh: Number(wh.toFixed(2)),
    packEnergyKwh: Number((wh / 1000).toFixed(5)),
    formula: 'E_{pack} = (S · V_{cell}) · (P · C_{cell}) = S · P · E_{cell}',
  };
}

/** 16. Battery Pack Current Capability */
export function calculatePackCurrentCapability(
  parallelCount: number,
  cellMaxContinuousAmps: number,
  cellPeakAmps: number
): {
  continuousDischargeAmps: number;
  peakDischargeAmps: number;
  continuousPowerWattsAtNominal: (vNom: number) => number;
  peakPowerWattsAtNominal: (vNom: number) => number;
  formula: string;
} {
  if (parallelCount <= 0 || cellMaxContinuousAmps <= 0 || cellPeakAmps <= 0) {
    throw new Error('Parallel count and cell current limits must be strictly positive.');
  }

  const contAmps = parallelCount * cellMaxContinuousAmps;
  const peakAmps = parallelCount * cellPeakAmps;

  return {
    continuousDischargeAmps: Number(contAmps.toFixed(2)),
    peakDischargeAmps: Number(peakAmps.toFixed(2)),
    continuousPowerWattsAtNominal: (vNom: number) => Number((contAmps * vNom).toFixed(1)),
    peakPowerWattsAtNominal: (vNom: number) => Number((peakAmps * vNom).toFixed(1)),
    formula: 'I_{pack,cont} = P · I_{cell,cont} | I_{pack,peak} = P · I_{cell,peak}',
  };
}

/** 17. Battery Pack C-Rate: C_rate = I_pack / C_pack */
export function calculatePackCRate(
  packDischargeCurrentAmps: number,
  packCapacityAh: number
): { packCRate: number; equivalentCellCurrentAmps: (pCount: number) => number; formula: string } {
  if (packCapacityAh <= 0 || packDischargeCurrentAmps < 0) {
    throw new Error('Pack capacity must be positive, current must be non-negative.');
  }
  const cRate = packDischargeCurrentAmps / packCapacityAh;

  return {
    packCRate: Number(cRate.toFixed(4)),
    equivalentCellCurrentAmps: (pCount: number) => (pCount > 0 ? Number((packDischargeCurrentAmps / pCount).toFixed(4)) : 0),
    formula: 'C_{rate,pack} = I_{pack} / C_{pack} = I_{cell} / C_{cell}',
  };
}

export interface PackDesignerInput {
  targetVoltage: number;
  targetEnergyWh?: number;
  targetCapacityAh?: number;
  targetContinuousCurrentAmps?: number;
  cell: CellSpecification;
}

export interface PackDesignerResult {
  seriesCount: number;
  parallelCount: number;
  totalCellCount: number;
  configurationString: string; // e.g. "14S4P"
  actualNominalVoltage: number;
  actualMaxVoltage: number;
  actualCutoffVoltage: number;
  actualCapacityAh: number;
  actualEnergyWh: number;
  actualEnergyKwh: number;
  maxContinuousDischargeAmps: number;
  peakDischargeAmps: number;
  totalCellWeightKg: number;
  packInternalResistanceMOhm: number;
  formula: string;
}

/** 18. Battery Pack Configuration Designer */
export function designBatteryPack(input: PackDesignerInput): PackDesignerResult {
  const { targetVoltage, cell } = input;
  if (targetVoltage <= 0) throw new Error('Target voltage must be positive.');

  // Series count based on target voltage
  const s = Math.max(1, Math.round(targetVoltage / cell.nominalVoltage));

  // Determine required parallel count from capacity, energy, or current
  let pFromCap = 1;
  let pFromEnergy = 1;
  let pFromCurrent = 1;

  if (input.targetCapacityAh && input.targetCapacityAh > 0) {
    pFromCap = Math.ceil(input.targetCapacityAh / cell.nominalCapacityAh);
  }

  if (input.targetEnergyWh && input.targetEnergyWh > 0) {
    const energyPerSeriesStringWh = s * cell.nominalVoltage * cell.nominalCapacityAh;
    pFromEnergy = Math.ceil(input.targetEnergyWh / energyPerSeriesStringWh);
  }

  if (input.targetContinuousCurrentAmps && input.targetContinuousCurrentAmps > 0) {
    pFromCurrent = Math.ceil(input.targetContinuousCurrentAmps / cell.maxContinuousDischargeCurrentAmps);
  }

  const p = Math.max(1, pFromCap, pFromEnergy, pFromCurrent);
  const totalCells = s * p;

  const actualVNom = s * cell.nominalVoltage;
  const actualVMax = s * cell.maxChargeVoltage;
  const actualVCutoff = s * cell.cutoffVoltage;
  const actualCap = p * cell.nominalCapacityAh;
  const actualWh = actualVNom * actualCap;
  const contAmps = p * cell.maxContinuousDischargeCurrentAmps;
  const peakAmps = p * cell.peakDischargeCurrentAmps;
  const cellWeightKg = (totalCells * cell.weightGrams) / 1000;

  // Pack resistance: R_pack = S · (R_cell / P)
  const rPackMOhm = s * (cell.internalResistanceMOhm / p);

  return {
    seriesCount: s,
    parallelCount: p,
    totalCellCount: totalCells,
    configurationString: `${s}S${p}P`,
    actualNominalVoltage: Number(actualVNom.toFixed(2)),
    actualMaxVoltage: Number(actualVMax.toFixed(2)),
    actualCutoffVoltage: Number(actualVCutoff.toFixed(2)),
    actualCapacityAh: Number(actualCap.toFixed(2)),
    actualEnergyWh: Number(actualWh.toFixed(2)),
    actualEnergyKwh: Number((actualWh / 1000).toFixed(4)),
    maxContinuousDischargeAmps: Number(contAmps.toFixed(2)),
    peakDischargeAmps: Number(peakAmps.toFixed(2)),
    totalCellWeightKg: Number(cellWeightKg.toFixed(3)),
    packInternalResistanceMOhm: Number(rPackMOhm.toFixed(2)),
    formula: 'Config = S · P | R_{pack} = (S / P) · R_{cell}',
  };
}

export interface CellToPackScalingInput {
  cellEnergyWh: number;
  cellWeightKg: number;
  cellVolumeLiters: number;
  totalCellCount: number;
  structuralOverheadMassFraction?: number; // e.g. 0.20 for 20% mass overhead (enclosure, BMS, busbars)
  volumetricPackingFactor?: number; // e.g. 0.70 (cylindrical cells have packaging void fraction)
}

export interface CellToPackScalingResult {
  cellGravimetricDensityWhKg: number;
  cellVolumetricDensityWhL: number;
  packTotalMassKg: number;
  packTotalVolumeLiters: number;
  packGravimetricDensityWhKg: number;
  packVolumetricDensityWhL: number;
  massPackagingEfficiencyPercent: number;
  packagingAssumption: string;
  formula: string;
}

/** 19. Cell-to-Pack Scaling */
export function calculateCellToPackScaling(input: CellToPackScalingInput): CellToPackScalingResult {
  const { cellEnergyWh, cellWeightKg, cellVolumeLiters, totalCellCount } = input;
  const massOverhead = input.structuralOverheadMassFraction ?? 0.20;
  const packFactor = input.volumetricPackingFactor ?? 0.70;

  if (cellEnergyWh <= 0 || cellWeightKg <= 0 || cellVolumeLiters <= 0 || totalCellCount <= 0) {
    throw new Error('Cell specs and counts must be strictly positive.');
  }
  if (massOverhead < 0 || massOverhead >= 0.95) {
    throw new Error('Structural overhead mass fraction must be between 0 and 0.95.');
  }
  if (packFactor <= 0 || packFactor > 1.0) {
    throw new Error('Volumetric packing factor must be between 0 (exclusive) and 1.0 (inclusive).');
  }

  const cellGrav = cellEnergyWh / cellWeightKg;
  const cellVol = cellEnergyWh / cellVolumeLiters;

  const totalCellMassKg = totalCellCount * cellWeightKg;
  const packMassKg = totalCellMassKg / (1 - massOverhead); // e.g. 80% cells, 20% housing

  const totalCellVolLiters = totalCellCount * cellVolumeLiters;
  const packVolLiters = totalCellVolLiters / packFactor; // e.g. packaging voids + enclosure

  const totalEnergyWh = totalCellCount * cellEnergyWh;
  const packGrav = totalEnergyWh / packMassKg;
  const packVol = totalEnergyWh / packVolLiters;

  return {
    cellGravimetricDensityWhKg: Number(cellGrav.toFixed(2)),
    cellVolumetricDensityWhL: Number(cellVol.toFixed(2)),
    packTotalMassKg: Number(packMassKg.toFixed(2)),
    packTotalVolumeLiters: Number(packVolLiters.toFixed(2)),
    packGravimetricDensityWhKg: Number(packGrav.toFixed(2)),
    packVolumetricDensityWhL: Number(packVol.toFixed(2)),
    massPackagingEfficiencyPercent: Number(((1 - massOverhead) * 100).toFixed(1)),
    packagingAssumption: 'Representative engineering assumption: mass overhead (default 20%) accounts for module enclosure, busbars, and BMS; packing factor (default 0.70) accounts for inter-cell voids and cooling channels.',
    formula: 'Density_{pack} = E_{tot} / M_{pack} | Vol_{pack} = Vol_{cells} / η_{pack}',
  };
}

export interface PackVerificationInput {
  theoreticalPackEnergyWh: number;
  cellCapacityMismatchPercent?: number; // e.g. 2% capacity variation between series groups
  busbarInterconnectLossPercent?: number; // e.g. 1.5% I²R drop in busbars & nickel strips
  bmsParasiticConsumptionWatts?: number; // e.g. 1.2W standby / active balancing consumption
  nominalMissionHours?: number; // e.g. 5 hours runtime
}

export interface PackVerificationResult {
  theoreticalEnergyWh: number;
  deratedPackEnergyWh: number;
  usableFractionPercent: number;
  mismatchLossWh: number;
  interconnectLossWh: number;
  bmsLossWh: number;
  formula: string;
}

/** 20. Pack Capacity / Energy Verification */
export function verifyPackCapacityAndEnergy(input: PackVerificationInput): PackVerificationResult {
  const { theoreticalPackEnergyWh } = input;
  const mismatchPct = input.cellCapacityMismatchPercent ?? 2.0;
  const busbarPct = input.busbarInterconnectLossPercent ?? 1.5;
  const bmsW = input.bmsParasiticConsumptionWatts ?? 1.0;
  const hours = input.nominalMissionHours ?? 5.0;

  if (theoreticalPackEnergyWh <= 0) throw new Error('Theoretical energy must be strictly positive.');

  // The weakest series group limits pack usable capacity
  const mismatchLoss = theoreticalPackEnergyWh * (mismatchPct / 100);
  const interconnectLoss = theoreticalPackEnergyWh * (busbarPct / 100);
  const bmsLoss = bmsW * hours;

  const totalLoss = mismatchLoss + interconnectLoss + bmsLoss;
  const usableWh = Math.max(0, theoreticalPackEnergyWh - totalLoss);
  const usablePct = (usableWh / theoreticalPackEnergyWh) * 100;

  return {
    theoreticalEnergyWh: Number(theoreticalPackEnergyWh.toFixed(2)),
    deratedPackEnergyWh: Number(usableWh.toFixed(2)),
    usableFractionPercent: Number(usablePct.toFixed(2)),
    mismatchLossWh: Number(mismatchLoss.toFixed(2)),
    interconnectLossWh: Number(interconnectLoss.toFixed(2)),
    bmsLossWh: Number(bmsLoss.toFixed(2)),
    formula: 'E_{usable} = E_{theor} - (L_{mismatch} + L_{busbars} + P_{bms} · t)',
  };
}
