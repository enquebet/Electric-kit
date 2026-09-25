import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity, formatSignificantFigures } from '../../lib/units/formatter';
import { SPEED_OF_LIGHT, DIPOLE_GAIN_DBI } from '../../lib/constants';
import { dbmToMilliwatts } from './decibels-power';

export interface FsplInputs {
  distance: number;
  distanceUnit: 'km' | 'm' | 'miles' | 'nmi';
  frequency: number;
  frequencyUnit: 'MHz' | 'GHz' | 'kHz' | 'Hz';
}

export interface FsplResult {
  fsplDb: number;
  distanceMeters: number;
  frequencyHz: number;
  wavelengthMeters: number;
}

/**
 * Calculates Free-Space Path Loss (FSPL) using exact electromagnetic wave equation:
 * FSPL = (4 * π * d / λ)²
 * FSPL(dB) = 20·log10(d) + 20·log10(f) + 20·log10(4π/c)
 */
export function calculateFspl(inputs: FsplInputs): FsplResult {
  const { distance, distanceUnit, frequency, frequencyUnit } = inputs;

  // Convert distance to meters
  let distanceMeters = Math.max(0.001, distance);
  if (distanceUnit === 'km') distanceMeters = distance * 1000;
  else if (distanceUnit === 'miles') distanceMeters = distance * 1609.344;
  else if (distanceUnit === 'nmi') distanceMeters = distance * 1852;

  // Convert frequency to Hz
  let frequencyHz = Math.max(1, frequency);
  if (frequencyUnit === 'kHz') frequencyHz = frequency * 1e3;
  else if (frequencyUnit === 'MHz') frequencyHz = frequency * 1e6;
  else if (frequencyUnit === 'GHz') frequencyHz = frequency * 1e9;

  const wavelengthMeters = SPEED_OF_LIGHT / frequencyHz;
  const fsplLinear = Math.pow((4 * Math.PI * distanceMeters) / wavelengthMeters, 2);
  const fsplDb = 10 * Math.log10(fsplLinear);

  return {
    fsplDb,
    distanceMeters,
    frequencyHz,
    wavelengthMeters,
  };
}

// -------------------------------------------------------------
// EIRP & ERP Calculation
// -------------------------------------------------------------
export interface EirpInputs {
  txPowerDbm: number;
  txCableLossDb: number;
  txAntennaGainDbi: number;
}

export interface EirpResult {
  eirpDbm: number;
  eirpDbw: number;
  eirpWatts: number;
  erpDbm: number;
  erpDbw: number;
  erpWatts: number;
}

/**
 * EIRP (Equivalent Isotropically Radiated Power) is referenced to an isotropic radiator (dBi).
 * ERP (Effective Radiated Power) is referenced to an ideal half-wave dipole (dBd).
 * ERP = EIRP - 2.15 dB (since dipole has 2.15 dBi directivity gain).
 */
export function calculateEirp(inputs: EirpInputs): EirpResult {
  const { txPowerDbm, txCableLossDb, txAntennaGainDbi } = inputs;

  const eirpDbm = txPowerDbm - txCableLossDb + txAntennaGainDbi;
  const eirpDbw = eirpDbm - 30;
  const eirpWatts = dbmToMilliwatts(eirpDbm) * 1e-3;

  const erpDbm = eirpDbm - DIPOLE_GAIN_DBI; // -2.15 dB
  const erpDbw = erpDbm - 30;
  const erpWatts = dbmToMilliwatts(erpDbm) * 1e-3;

  return {
    eirpDbm,
    eirpDbw,
    eirpWatts,
    erpDbm,
    erpDbw,
    erpWatts,
  };
}

// -------------------------------------------------------------
// Complete RF Link Budget & Fade Margin
// -------------------------------------------------------------
export interface LinkBudgetInputs {
  // Transmitter
  txPowerDbm: number;
  txCableLossDb: number;
  txAntennaGainDbi: number;
  // Propagation Path
  distanceKm: number;
  frequencyMhz: number;
  miscLossDb?: number; // Atmospheric, foliage, polarization mismatch, connectors
  // Receiver
  rxAntennaGainDbi: number;
  rxCableLossDb: number;
  rxSensitivityDbm: number; // Receiver threshold
}

export interface LinkBudgetRow {
  parameter: string;
  valueDb: number;
  subtotalDbm: number;
  unit: string;
  type: 'source' | 'gain' | 'loss' | 'summary';
  annotation: string;
}

export interface LinkBudgetResult {
  eirp: EirpResult;
  fsplDb: number;
  rxPowerDbm: number;
  rxPowerWatts: number;
  fadeMarginDb: number;
  linkStatus: 'strong' | 'acceptable' | 'marginal' | 'unviable';
  rows: LinkBudgetRow[];
  recommendations: string[];
}

export function calculateLinkBudget(inputs: LinkBudgetInputs): LinkBudgetResult {
  const {
    txPowerDbm,
    txCableLossDb,
    txAntennaGainDbi,
    distanceKm,
    frequencyMhz,
    miscLossDb = 0,
    rxAntennaGainDbi,
    rxCableLossDb,
    rxSensitivityDbm,
  } = inputs;

  const eirp = calculateEirp({
    txPowerDbm,
    txCableLossDb,
    txAntennaGainDbi,
  });

  const fspl = calculateFspl({
    distance: distanceKm,
    distanceUnit: 'km',
    frequency: frequencyMhz,
    frequencyUnit: 'MHz',
  });

  // Total received power at receiver detector:
  // Prx = EIRP - FSPL - L_misc + Grx - L_rx
  const rxPowerDbm = eirp.eirpDbm - fspl.fsplDb - miscLossDb + rxAntennaGainDbi - rxCableLossDb;
  const rxPowerWatts = dbmToMilliwatts(rxPowerDbm) * 1e-3;

  // Fade Margin: Prx - Sensitivity
  const fadeMarginDb = rxPowerDbm - rxSensitivityDbm;

  let linkStatus: LinkBudgetResult['linkStatus'] = 'acceptable';
  if (fadeMarginDb >= 20) linkStatus = 'strong';
  else if (fadeMarginDb >= 10) linkStatus = 'acceptable';
  else if (fadeMarginDb >= 0) linkStatus = 'marginal';
  else linkStatus = 'unviable';

  const rows: LinkBudgetRow[] = [
    {
      parameter: 'Transmitter Output Power (P_tx)',
      valueDb: txPowerDbm,
      subtotalDbm: txPowerDbm,
      unit: 'dBm',
      type: 'source',
      annotation: `${(dbmToMilliwatts(txPowerDbm) * 1e-3).toFixed(3)} W`,
    },
    {
      parameter: 'TX Cable & Connector Loss (-L_tx)',
      valueDb: -txCableLossDb,
      subtotalDbm: txPowerDbm - txCableLossDb,
      unit: 'dB',
      type: 'loss',
      annotation: 'Coaxial run & insertion loss',
    },
    {
      parameter: 'TX Antenna Gain (+G_tx)',
      valueDb: txAntennaGainDbi,
      subtotalDbm: eirp.eirpDbm,
      unit: 'dBi',
      type: 'gain',
      annotation: `EIRP = ${eirp.eirpDbm.toFixed(2)} dBm (${eirp.eirpWatts.toFixed(2)} W)`,
    },
    {
      parameter: 'Free-Space Path Loss (-FSPL)',
      valueDb: -fspl.fsplDb,
      subtotalDbm: eirp.eirpDbm - fspl.fsplDb,
      unit: 'dB',
      type: 'loss',
      annotation: `d = ${distanceKm} km, f = ${frequencyMhz} MHz (Friis LOS)`,
    },
    {
      parameter: 'Misc / Atmospheric / Polarization Loss (-L_misc)',
      valueDb: -miscLossDb,
      subtotalDbm: eirp.eirpDbm - fspl.fsplDb - miscLossDb,
      unit: 'dB',
      type: 'loss',
      annotation: 'Rain, tree foliage, misalignment',
    },
    {
      parameter: 'RX Antenna Gain (+G_rx)',
      valueDb: rxAntennaGainDbi,
      subtotalDbm: eirp.eirpDbm - fspl.fsplDb - miscLossDb + rxAntennaGainDbi,
      unit: 'dBi',
      type: 'gain',
      annotation: 'Receiver antenna aperture gain',
    },
    {
      parameter: 'RX Cable & Connector Loss (-L_rx)',
      valueDb: -rxCableLossDb,
      subtotalDbm: rxPowerDbm,
      unit: 'dB',
      type: 'loss',
      annotation: 'Downlead coaxial line loss',
    },
    {
      parameter: 'Net Received Power (P_rx)',
      valueDb: rxPowerDbm,
      subtotalDbm: rxPowerDbm,
      unit: 'dBm',
      type: 'summary',
      annotation: `${(rxPowerWatts * 1e9).toFixed(2)} nW (${(rxPowerWatts * 1e12).toFixed(2)} pW)`,
    },
    {
      parameter: 'Receiver Sensitivity Threshold (S_rx)',
      valueDb: rxSensitivityDbm,
      subtotalDbm: rxSensitivityDbm,
      unit: 'dBm',
      type: 'source',
      annotation: 'Minimum signal for target BER / SNR',
    },
    {
      parameter: 'Link Fade Margin',
      valueDb: fadeMarginDb,
      subtotalDbm: fadeMarginDb,
      unit: 'dB',
      type: 'summary',
      annotation: fadeMarginDb >= 0 ? `+${fadeMarginDb.toFixed(2)} dB above threshold` : `${fadeMarginDb.toFixed(2)} dB BELOW threshold`,
    },
  ];

  const recommendations: string[] = [];
  if (fadeMarginDb < 0) {
    recommendations.push('CRITICAL: Link is unviable. Received signal level is below receiver threshold. Increase TX power, increase antenna gain, or shorten distance.');
  } else if (fadeMarginDb < 10) {
    recommendations.push('WARNING: Fade margin < 10 dB provides high vulnerability to weather events, multipath fading, and seasonal foliage changes.');
  } else if (fadeMarginDb < 20) {
    recommendations.push('Acceptable for non-critical line-of-sight links (~99% link availability). For mission-critical communications, target 20 to 30 dB fade margin.');
  } else {
    recommendations.push('Excellent link margin (≥ 20 dB). Suitable for high-availability carrier-grade telemetry, microwave backhaul, and satellite links.');
  }

  return {
    eirp,
    fsplDb: fspl.fsplDb,
    rxPowerDbm,
    rxPowerWatts,
    fadeMarginDb,
    linkStatus,
    rows,
    recommendations,
  };
}
