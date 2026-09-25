import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity, formatSignificantFigures } from '../../lib/units/formatter';
import { SPEED_OF_LIGHT, DIPOLE_GAIN_DBI } from '../../lib/constants';

export interface AntennaGeometryInputs {
  frequencyHz: number;
  velocityFactor?: number; // default 0.95 for wire in air
}

export interface AntennaGeometryResult {
  frequencyHz: number;
  wavelengthMeters: number;
  quarterWaveMeters: number;
  quarterWaveInches: number;
  quarterWaveCm: number;
  halfWaveIdealMeters: number;
  halfWaveDipoleMeters: number; // 0.95 end-effect factor
  halfWaveMeters: number;
  halfWaveDipoleInches: number;
  halfWaveDipoleCm: number;
  dipoleEachLegMeters: number; // half of the dipole
  dipoleEachLegInches: number;
  fiveEighthsWaveMeters: number;
  fiveEighthsWaveInches: number;
  fiveEighthsWaveCm: number;
}

export function calculateAntennaDimensions(inputs: AntennaGeometryInputs): AntennaGeometryResult {
  const { frequencyHz, velocityFactor = 0.95 } = inputs;
  const f = Math.max(1, frequencyHz);
  const vf = Math.min(Math.max(velocityFactor, 0.01), 1.0);

  const lambda = SPEED_OF_LIGHT / f;

  const quarterWaveMeters = (lambda / 4) * vf;
  const halfWaveIdealMeters = (lambda / 2) * vf;
  const halfWaveDipoleMeters = (lambda / 2) * vf * 0.95; // wire dipole end-effect
  const dipoleEachLegMeters = halfWaveDipoleMeters / 2;
  const fiveEighthsWaveMeters = (5 / 8) * lambda * vf;

  return {
    frequencyHz: f,
    wavelengthMeters: lambda,
    quarterWaveMeters,
    quarterWaveInches: quarterWaveMeters * 39.3701,
    quarterWaveCm: quarterWaveMeters * 100,
    halfWaveIdealMeters,
    halfWaveDipoleMeters,
    halfWaveMeters: halfWaveDipoleMeters,
    halfWaveDipoleInches: halfWaveDipoleMeters * 39.3701,
    halfWaveDipoleCm: halfWaveDipoleMeters * 100,
    dipoleEachLegMeters,
    dipoleEachLegInches: dipoleEachLegMeters * 39.3701,
    fiveEighthsWaveMeters,
    fiveEighthsWaveInches: fiveEighthsWaveMeters * 39.3701,
    fiveEighthsWaveCm: fiveEighthsWaveMeters * 100,
  };
}

// -------------------------------------------------------------
// Antenna Gain, Directivity & Radiation Efficiency
// -------------------------------------------------------------
export interface AntennaGainInputs {
  directivityDbi: number;
  efficiencyPercent?: number; // 1 to 100%
  radiationEfficiencyPercent?: number;
}

export interface AntennaGainResult {
  directivityDbi: number;
  efficiencyPercent: number;
  efficiencyLinear: number;
  realizedGainDbi: number;
  realizedGainDbd: number;
  gainDbd: number;
  realizedGainLinear: number;
  gainLinear: number;
  efficiencyLossDb: number;
}

/**
 * Calculates realized antenna gain from theoretical directivity and radiation efficiency.
 * G = η * D  =>  G_dBi = D_dBi + 10·log10(η)
 * G_dBd = G_dBi - 2.15 dB
 */
export function calculateAntennaGain(inputs: AntennaGainInputs): AntennaGainResult {
  const { directivityDbi } = inputs;
  const rawEff = inputs.radiationEfficiencyPercent ?? inputs.efficiencyPercent ?? 100;
  const eff = Math.min(Math.max(rawEff, 0.1), 100) / 100;

  const efficiencyLossDb = 10 * Math.log10(eff);
  const realizedGainDbi = directivityDbi + efficiencyLossDb;
  const realizedGainDbd = realizedGainDbi - DIPOLE_GAIN_DBI;
  const realizedGainLinear = Math.pow(10, realizedGainDbi / 10);

  return {
    directivityDbi,
    efficiencyPercent: rawEff,
    efficiencyLinear: eff,
    realizedGainDbi,
    realizedGainDbd,
    gainDbd: realizedGainDbd,
    realizedGainLinear,
    gainLinear: realizedGainLinear,
    efficiencyLossDb,
  };
}

// -------------------------------------------------------------
// Effective Aperture Calculator
// -------------------------------------------------------------
export interface EffectiveApertureInputs {
  gainDbi: number;
  frequencyHz: number;
  incidentPowerDensityWattsPerM2?: number; // optional, e.g. 1 W/m^2
  powerDensityWattsPerM2?: number;
}

export interface EffectiveApertureResult {
  gainDbi: number;
  gainLinear: number;
  frequencyHz: number;
  wavelengthMeters: number;
  effectiveApertureM2: number;
  effectiveApertureCm2: number;
  receivedPowerWatts?: number;
  receivedPowerDbm?: number;
}

/**
 * Calculates effective electrical collecting aperture of an antenna:
 * Ae = (G_linear * λ²) / (4 * π)
 */
export function calculateEffectiveAperture(inputs: EffectiveApertureInputs): EffectiveApertureResult {
  const { gainDbi, frequencyHz } = inputs;
  const pDensity = inputs.incidentPowerDensityWattsPerM2 ?? inputs.powerDensityWattsPerM2;
  const f = Math.max(1, frequencyHz);
  const lambda = SPEED_OF_LIGHT / f;
  const gainLinear = Math.pow(10, gainDbi / 10);

  const effectiveApertureM2 = (gainLinear * Math.pow(lambda, 2)) / (4 * Math.PI);
  const effectiveApertureCm2 = effectiveApertureM2 * 10000;

  let receivedPowerWatts: number | undefined;
  let receivedPowerDbm: number | undefined;

  if (pDensity !== undefined && pDensity > 0) {
    receivedPowerWatts = pDensity * effectiveApertureM2;
    receivedPowerDbm = 10 * Math.log10(receivedPowerWatts * 1000);
  }

  return {
    gainDbi,
    gainLinear,
    frequencyHz: f,
    wavelengthMeters: lambda,
    effectiveApertureM2,
    effectiveApertureCm2,
    receivedPowerWatts,
    receivedPowerDbm,
  };
}

// -------------------------------------------------------------
// Antenna Beamwidth Estimate (HPBW)
// -------------------------------------------------------------
export interface BeamwidthEstimateInputs {
  frequencyHz: number;
  dishDiameterMeters?: number;
  diameterMeters?: number;
  apertureEfficiencyPercent?: number;
  illuminationTaperFactor?: number; // k-factor: 70 for typical parabolic, 58 for uniform aperture
}

export interface BeamwidthEstimateResult {
  halfPowerBeamwidthDeg: number;
  beamwidthDeg: number;
  firstNullBeamwidthDeg: number;
  diameterMeters: number;
  wavelengthMeters: number;
  apertureRatio: number; // D / lambda
  theoreticalMaxGainDbi: number;
  estimatedGainDbi: number;
}

/**
 * Approximate half-power beamwidth (HPBW) model for aperture antennas (e.g. parabolic dishes):
 * θ_3dB ≈ k * (λ / D) degrees
 * NOTE: This equation applies strictly to circular aperture antennas and is NOT valid for wire dipoles or yagis.
 */
export function estimateDishBeamwidth(inputs: BeamwidthEstimateInputs): BeamwidthEstimateResult {
  const { frequencyHz, illuminationTaperFactor = 70 } = inputs;
  const dishD = inputs.dishDiameterMeters ?? inputs.diameterMeters ?? 1.0;
  const f = Math.max(1, frequencyHz);
  const D = Math.max(0.01, dishD);
  const lambda = SPEED_OF_LIGHT / f;

  const apertureRatio = D / lambda;
  const hpbwDeg = illuminationTaperFactor * (lambda / D);
  const fnbwDeg = hpbwDeg * 2.4; // First null beamwidth approximation

  // Theoretical aperture gain with aperture efficiency (default 55%)
  const eff = (inputs.apertureEfficiencyPercent ?? 55) / 100;
  const theoreticalGainLinear = Math.pow((Math.PI * D) / lambda, 2) * eff;
  const theoreticalMaxGainDbi = 10 * Math.log10(theoreticalGainLinear);

  return {
    halfPowerBeamwidthDeg: hpbwDeg,
    beamwidthDeg: hpbwDeg,
    firstNullBeamwidthDeg: fnbwDeg,
    diameterMeters: D,
    wavelengthMeters: lambda,
    apertureRatio,
    theoreticalMaxGainDbi,
    estimatedGainDbi: theoreticalMaxGainDbi,
  };
}

export const estimateApertureBeamwidth = estimateDishBeamwidth;

// -------------------------------------------------------------
// Antenna Polarization Reference & Mismatch
// -------------------------------------------------------------
export interface PolarizationPairInfo {
  txPolarization: string;
  tx: string;
  rxPolarization: string;
  rx: string;
  theoreticalLossDb: number;
  lossDb: number;
  practicalIsolationDb: string;
  description: string;
  notes: string;
}

export const POLARIZATION_REFERENCE_DATA: PolarizationPairInfo[] = [
  { txPolarization: 'Linear (Vertical)', tx: 'Linear (Vertical)', rxPolarization: 'Linear (Vertical)', rx: 'Linear (Vertical)', theoreticalLossDb: 0, lossDb: 0, practicalIsolationDb: '0 dB', description: 'Optimal matched linear polarization.', notes: 'Optimal matched linear polarization.' },
  { txPolarization: 'Linear (Horizontal)', tx: 'Linear (Horizontal)', rxPolarization: 'Linear (Horizontal)', rx: 'Linear (Horizontal)', theoreticalLossDb: 0, lossDb: 0, practicalIsolationDb: '0 dB', description: 'Optimal matched horizontal polarization.', notes: 'Optimal matched horizontal polarization.' },
  { txPolarization: 'Linear (Vertical)', tx: 'Linear (Vertical)', rxPolarization: 'Linear (Horizontal)', rx: 'Linear (Horizontal)', theoreticalLossDb: Infinity, lossDb: Infinity, practicalIsolationDb: '20 to 35 dB', description: 'Orthogonal polarization. Theoretical complete cancellation; practical cross-polarization isolation limit.', notes: 'Orthogonal linear polarizations. 20–35 dB isolation in practical antennas.' },
  { txPolarization: 'Linear (Any)', tx: 'Linear (Any)', rxPolarization: 'Circular (RHCP or LHCP)', rx: 'Circular (RHCP or LHCP)', theoreticalLossDb: 3.0, lossDb: 3.0, practicalIsolationDb: '3.0 dB', description: 'Linear wave decomposes into two orthogonal circular components. Exactly 50% power is captured (-3.0 dB).', notes: 'Linear wave decomposes into two orthogonal circular components (-3 dB loss).' },
  { txPolarization: 'Circular (RHCP)', tx: 'Circular (RHCP)', rxPolarization: 'Circular (RHCP)', rx: 'Circular (RHCP)', theoreticalLossDb: 0, lossDb: 0, practicalIsolationDb: '0 dB', description: 'Optimal matched right-hand circular polarization (used in GPS, satellite).', notes: 'Optimal matched circular polarization.' },
  { txPolarization: 'Circular (LHCP)', tx: 'Circular (LHCP)', rxPolarization: 'Circular (LHCP)', rx: 'Circular (LHCP)', theoreticalLossDb: 0, lossDb: 0, practicalIsolationDb: '0 dB', description: 'Optimal matched left-hand circular polarization.', notes: 'Optimal matched circular polarization.' },
  { txPolarization: 'Circular (RHCP)', tx: 'Circular (RHCP)', rxPolarization: 'Circular (LHCP)', rx: 'Circular (LHCP)', theoreticalLossDb: Infinity, lossDb: Infinity, practicalIsolationDb: '15 to 25 dB', description: 'Opposite handedness. Theoretical null; real-world reflection reverse handedness.', notes: 'Opposite handedness. Ground reflections reverse circular polarization handedness.' },
];

export function calculatePolarizationLoss(mismatchAngleDeg: number): number {
  const rad = (mismatchAngleDeg * Math.PI) / 180;
  const cosVal = Math.cos(rad);
  if (Math.abs(cosVal) < 1e-12) return Infinity;
  return -10 * Math.log10(Math.pow(cosVal, 2));
}

export const POLARIZATION_MISMATCH_TABLE = POLARIZATION_REFERENCE_DATA;

