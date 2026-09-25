import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity, formatSignificantFigures } from '../../lib/units/formatter';
import { SPEED_OF_LIGHT } from '../../lib/constants';

export { SPEED_OF_LIGHT };

export interface FreqWavelengthInputs {
  mode: 'freq_to_lambda' | 'lambda_to_freq';
  frequencyHz?: number;
  wavelengthMeters?: number;
  velocityFactor?: number; // 0.01 to 1.0 (default 1.0 for free space)
}

export interface MediumPreset {
  name: string;
  vf: number;
  dielectricConstant?: number;
  description: string;
}

export const RF_MEDIUM_PRESETS: MediumPreset[] = [
  { name: 'Vacuum / Free Space (Air)', vf: 1.0, dielectricConstant: 1.0, description: 'c = 299,792,458 m/s' },
  { name: 'RG-58 / RG-213 Solid PE Coax', vf: 0.66, dielectricConstant: 2.3, description: 'Solid Polyethylene insulation' },
  { name: 'RG-6 / RG-11 Foamed PE Coax', vf: 0.82, dielectricConstant: 1.5, description: 'Foam Polyethylene core' },
  { name: 'Teflon / PTFE Dielectric', vf: 0.70, dielectricConstant: 2.1, description: 'Low-loss microwave coaxial' },
  { name: 'FR-4 PCB Microstrip (Effective)', vf: 0.50, dielectricConstant: 4.4, description: 'Standard PCB traces (ε_eff ≈ 3.2 - 4.0)' },
  { name: 'Rogers RO4350B PCB Substrate', vf: 0.53, dielectricConstant: 3.66, description: 'High-frequency hydrocarbon/ceramic' },
  { name: 'Alumina Ceramic Substrate (Al2O3)', vf: 0.32, dielectricConstant: 9.8, description: 'Thin-film hybrid microwave circuits' },
];

export const VELOCITY_FACTOR_PRESETS = RF_MEDIUM_PRESETS.map((p) => ({
  medium: p.name,
  vf: p.vf,
}));

export interface RfBandInfo {
  band: string;
  name: string;
  freqRange: string;
  frequencyRange: string;
  wavelengthRange: string;
  applications: string;
  description: string;
  propagationMode: string;
}

export const RF_BANDS_DATABASE: RfBandInfo[] = [
  { band: 'ELF', name: 'Extremely Low Frequency', freqRange: '3 Hz – 30 Hz', frequencyRange: '3 Hz – 30 Hz', wavelengthRange: '100,000 km – 10,000 km', applications: 'Submarine communications, geophysical earth monitoring', description: 'Extremely Low Frequency', propagationMode: 'Earth-ionosphere waveguide' },
  { band: 'SLF', name: 'Super Low Frequency', freqRange: '30 Hz – 300 Hz', frequencyRange: '30 Hz – 300 Hz', wavelengthRange: '10,000 km – 1,000 km', applications: 'AC electrical power grid (50/60 Hz), military communications', description: 'Super Low Frequency', propagationMode: 'Earth-ionosphere waveguide' },
  { band: 'ULF', name: 'Ultra Low Frequency', freqRange: '300 Hz – 3 kHz', frequencyRange: '300 Hz – 3 kHz', wavelengthRange: '1,000 km – 100 km', applications: 'Mine shaft communications, seismic activity sensing', description: 'Ultra Low Frequency', propagationMode: 'Ground conduction' },
  { band: 'VLF', name: 'Very Low Frequency', freqRange: '3 kHz – 30 kHz', frequencyRange: '3 kHz – 30 kHz', wavelengthRange: '100 km – 10 km', applications: 'Submarine military command, VLF navigation (Alpha), time signals', description: 'Very Low Frequency', propagationMode: 'Ionospheric reflection' },
  { band: 'LF', name: 'Low Frequency', freqRange: '30 kHz – 300 kHz', frequencyRange: '30 kHz – 300 kHz', wavelengthRange: '10 km – 1 km', applications: 'AM Longwave broadcast, RFID (125/134 kHz), WWVB time sync', description: 'Low Frequency', propagationMode: 'Ground wave' },
  { band: 'MF', name: 'Medium Frequency', freqRange: '300 kHz – 3 MHz', frequencyRange: '300 kHz – 3 MHz', wavelengthRange: '1 km – 100 m', applications: 'AM Medium Wave radio (530–1700 kHz), maritime beacon, avalanche beacons', description: 'Medium Frequency', propagationMode: 'Ground wave by day, skywave at night' },
  { band: 'HF', name: 'High Frequency (Shortwave)', freqRange: '3 MHz – 30 MHz', frequencyRange: '3 MHz – 30 MHz', wavelengthRange: '100 m – 10 m', applications: 'Over-the-horizon amateur radio, international shortwave, aviation ATC', description: 'High Frequency (Shortwave)', propagationMode: 'Ionospheric refraction (Skywave)' },
  { band: 'VHF', name: 'Very High Frequency', freqRange: '30 MHz – 300 MHz', frequencyRange: '30 MHz – 300 MHz', wavelengthRange: '10 m – 1 m', applications: 'FM broadcast (87.5–108 MHz), VHF TV, marine VHF, aviation comms (118–137 MHz)', description: 'Very High Frequency', propagationMode: 'Line of sight, knife-edge diffraction' },
  { band: 'UHF', name: 'Ultra High Frequency', freqRange: '300 MHz – 3 GHz', frequencyRange: '300 MHz – 3 GHz', wavelengthRange: '1 m – 10 cm', applications: 'Wi-Fi (2.4 GHz), Bluetooth, Cellular LTE/5G, GPS (1.575 GHz), UHF TV', description: 'Ultra High Frequency', propagationMode: 'Line of sight, obstacle penetration' },
  { band: 'SHF', name: 'Super High Frequency (Microwave)', freqRange: '3 GHz – 30 GHz', frequencyRange: '3 GHz – 30 GHz', wavelengthRange: '10 cm – 1 cm', applications: '5 GHz Wi-Fi, Satellite TV, radar, Ku/Ka satellite uplink', description: 'Super High Frequency (Microwave)', propagationMode: 'Strict line of sight' },
  { band: 'EHF', name: 'Extremely High Frequency (mmWave)', freqRange: '30 GHz – 300 GHz', frequencyRange: '30 GHz – 300 GHz', wavelengthRange: '10 mm – 1 mm', applications: 'Automotive radar (77 GHz), mmWave 5G, airport body scanners, radio astronomy', description: 'Extremely High Frequency (mmWave)', propagationMode: 'Line of sight with high atmospheric O2/H2O absorption' },
  { band: 'THF', name: 'Tremendously High Frequency (Terahertz)', freqRange: '300 GHz – 3 THz', frequencyRange: '300 GHz – 3 THz', wavelengthRange: '1 mm – 0.1 mm', applications: 'Sub-millimeter spectroscopy, experimental 6G research', description: 'Tremendously High Frequency (Terahertz)', propagationMode: 'Severe atmospheric attenuation' },
];

export const RF_BANDS_TABLE = RF_BANDS_DATABASE;

export function getRfBand(freqHz: number): { band: string; name: string; applications: string } {
  if (freqHz <= 0) return { band: 'DC / Sub-audio', name: 'Zero / Direct Current', applications: 'Steady electric/magnetic field' };
  if (freqHz < 30) return { band: 'ELF', name: 'Extremely Low Frequency', applications: 'Submarine communications, power grid' };
  if (freqHz < 300) return { band: 'SLF', name: 'Super Low Frequency', applications: 'AC power transmission, geophysical signals' };
  if (freqHz < 3e3) return { band: 'ULF', name: 'Ultra Low Frequency', applications: 'Mine shaft communications' };
  if (freqHz < 30e3) return { band: 'VLF', name: 'Very Low Frequency', applications: 'Military submarine comms, navigation beacons' };
  if (freqHz < 300e3) return { band: 'LF', name: 'Low Frequency', applications: 'AM longwave broadcasting, RFID, time signals (WWVB)' };
  if (freqHz < 3e6) return { band: 'MF', name: 'Medium Frequency', applications: 'AM medium wave radio (530-1700 kHz), marine radio' };
  if (freqHz < 30e6) return { band: 'HF', name: 'High Frequency (Shortwave)', applications: 'Amateur radio, international broadcasting, aviation' };
  if (freqHz < 300e6) return { band: 'VHF', name: 'Very High Frequency', applications: 'FM radio (88-108 MHz), air traffic control, VHF TV' };
  if (freqHz < 3e9) return { band: 'UHF', name: 'Ultra High Frequency', applications: 'Wi-Fi (2.4 GHz), Bluetooth, GPS, 4G/5G Cellular, UHF TV' };
  if (freqHz < 30e9) return { band: 'SHF', name: 'Super High Frequency (Microwave)', applications: '5 GHz Wi-Fi, satellite TV, modern radar, Ku/Ka band' };
  if (freqHz < 300e9) return { band: 'EHF', name: 'Extremely High Frequency (mmWave)', applications: 'Automotive radar (77 GHz), mmWave 5G, radio astronomy' };
  return { band: 'THF', name: 'Terahertz Radiation', applications: 'Spectroscopy, medical imaging, 6G experimental' };
}

export function calculateFreqWavelength(inputs: FreqWavelengthInputs): CalculationResult {
  const { mode, velocityFactor = 1.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let freqHz = inputs.frequencyHz || 0;
  let lambdaMeters = inputs.wavelengthMeters || 0;

  const vf = Math.min(Math.max(velocityFactor, 0.01), 1.0);
  const effectiveSpeed = SPEED_OF_LIGHT * vf;

  if (mode === 'freq_to_lambda') {
    if (freqHz <= 0) {
      warnings.push({
        severity: 'danger',
        title: 'Zero or Negative Frequency',
        message: 'Frequency must be strictly positive to propagate as an electromagnetic wave.',
      });
      lambdaMeters = 0;
    } else {
      lambdaMeters = effectiveSpeed / freqHz;
      steps.push({
        stepNumber: 1,
        title: 'Calculate Wavelength in Propagation Medium',
        formula: 'λ = (v_f × c) / f',
        substitution: `λ = (${vf} × 299,792,458 m/s) / ${formatQuantity(freqHz, 'frequency')}`,
        result: `${formatQuantity(lambdaMeters, 'wavelength')}`,
        annotation: vf < 1.0 ? `Wave velocity slowed to ${(effectiveSpeed / 1e6).toFixed(2)} Mm/s by medium dielectric.` : 'Wave propagating in vacuum/air at c.',
      });
    }
  } else {
    if (lambdaMeters <= 0) {
      warnings.push({
        severity: 'danger',
        title: 'Zero or Negative Wavelength',
        message: 'Wavelength must be strictly positive and greater than zero.',
      });
      freqHz = 0;
    } else {
      freqHz = effectiveSpeed / lambdaMeters;
      steps.push({
        stepNumber: 1,
        title: 'Calculate Frequency from Wavelength',
        formula: 'f = (v_f × c) / λ',
        substitution: `f = (${vf} × 299,792,458 m/s) / ${formatQuantity(lambdaMeters, 'wavelength')}`,
        result: `${formatQuantity(freqHz, 'frequency')}`,
      });
    }
  }

  // Antenna dimensions calculations based on effective wavelength in medium (λ = λ₀ · vf)
  const quarterWaveMeters = lambdaMeters > 0 ? lambdaMeters / 4 : 0;
  const halfWaveIdealMeters = lambdaMeters > 0 ? lambdaMeters / 2 : 0;
  const halfWaveDipoleMeters = lambdaMeters > 0 ? (lambdaMeters / 2) * 0.95 : 0; // 0.95 end-effect factor for wire dipoles
  const fiveEighthsWaveMeters = lambdaMeters > 0 ? (5 / 8) * lambdaMeters : 0;

  const periodSeconds = freqHz > 0 ? 1 / freqHz : Infinity;
  const angularFreq = 2 * Math.PI * freqHz;
  const rfBand = getRfBand(freqHz);

  // Measurements in inches and cm
  const quarterWaveInches = quarterWaveMeters * 39.3701;
  const halfWaveInches = halfWaveDipoleMeters * 39.3701;
  const fiveEighthsInches = fiveEighthsWaveMeters * 39.3701;

  if (lambdaMeters > 0) {
    steps.push({
      stepNumber: 2,
      title: 'Calculate Resonant Antenna Dimensions (λ/4, λ/2 Dipole, 5/8λ)',
      formula: 'L(λ/4) = λ / 4 ;  L(dipole) = (λ / 2) × 0.95 ;  L(5/8λ) = (5/8) × λ   [where λ = (c × vf) / f]',
      substitution: `λ_medium = ${formatQuantity(lambdaMeters, 'wavelength')} ;  vf = ${vf}`,
      result: `λ/4: ${formatQuantity(quarterWaveMeters, 'wavelength')} (${quarterWaveInches.toFixed(2)} in) | Dipole: ${formatQuantity(halfWaveDipoleMeters, 'wavelength')} (${halfWaveInches.toFixed(2)} in) | 5/8λ: ${formatQuantity(fiveEighthsWaveMeters, 'wavelength')} (${fiveEighthsInches.toFixed(2)} in)`,
      annotation: 'Dipole includes 0.95 end-effect factor. 5/8λ monopole provides approximately 3 dBd horizon gain but requires an inductive matching coil at base.',
    });
  }

  return {
    primaryValue: mode === 'freq_to_lambda' ? lambdaMeters : freqHz,
    formattedValue:
      mode === 'freq_to_lambda'
        ? (lambdaMeters > 0 ? formatQuantity(lambdaMeters, 'wavelength') : '0 m')
        : (freqHz > 0 ? formatQuantity(freqHz, 'frequency') : '0 Hz'),
    unit: mode === 'freq_to_lambda' ? 'm' : 'Hz',
    label: mode === 'freq_to_lambda' ? 'Wavelength (λ)' : 'Frequency (f)',
    warnings,
    steps,
    additionalOutputs: {
      band: {
        label: 'ITU RF Band Designation',
        value: `${rfBand.band} (${rfBand.name})`,
        note: rfBand.applications,
      },
      quarterWave: {
        label: 'Quarter-Wave Monopole (λ/4)',
        value: quarterWaveMeters > 0 ? `${formatQuantity(quarterWaveMeters, 'wavelength')}` : '—',
        note: quarterWaveMeters > 0 ? `${quarterWaveInches.toFixed(2)} in (${(quarterWaveMeters * 100).toFixed(2)} cm)` : '',
      },
      halfWaveIdeal: {
        label: 'Ideal Half-Wave (λ/2)',
        value: halfWaveIdealMeters > 0 ? `${formatQuantity(halfWaveIdealMeters, 'wavelength')}` : '—',
        note: halfWaveIdealMeters > 0 ? `${(halfWaveIdealMeters * 39.3701).toFixed(2)} in (${(halfWaveIdealMeters * 100).toFixed(2)} cm)` : '',
      },
      halfWaveDipole: {
        label: 'Half-Wave Wire Dipole (0.95 × λ/2)',
        value: halfWaveDipoleMeters > 0 ? `${formatQuantity(halfWaveDipoleMeters, 'wavelength')}` : '—',
        note: halfWaveDipoleMeters > 0 ? `${halfWaveInches.toFixed(2)} in (End-effect factor 0.95 applied)` : '',
      },
      fiveEighthsWave: {
        label: 'Five-Eighths Wave (5/8 λ)',
        value: fiveEighthsWaveMeters > 0 ? `${formatQuantity(fiveEighthsWaveMeters, 'wavelength')}` : '—',
        note: fiveEighthsWaveMeters > 0 ? `${fiveEighthsInches.toFixed(2)} in (~3 dBd horizon gain)` : '',
      },
      period: {
        label: 'Wave Period (T = 1/f)',
        value: Number.isFinite(periodSeconds) ? formatQuantity(periodSeconds, 'time') : '∞ s',
      },
      omega: {
        label: 'Angular Frequency (ω = 2πf)',
        value: `${formatSignificantFigures(angularFreq, 4)} rad/s`,
      },
      velocityFactor: {
        label: 'Velocity Factor (v_f)',
        value: `${(vf * 100).toFixed(1)}% (v = ${(effectiveSpeed / 1e6).toFixed(1)} Mm/s)`,
      },
    },
    visualData: {
      freqHz,
      lambdaMeters,
      quarterWaveMeters,
      halfWaveIdealMeters,
      halfWaveDipoleMeters,
      fiveEighthsWaveMeters,
      rfBand,
      vf,
      periodSeconds,
      angularFreq,
    },
  };
}

export function calculateWavelength(inputs: { frequencyHz: number; velocityFactor?: number }): CalculationResult {
  return calculateFreqWavelength({
    mode: 'freq_to_lambda',
    frequencyHz: inputs.frequencyHz,
    velocityFactor: inputs.velocityFactor,
  });
}

export function calculateFrequency(inputs: { wavelengthMeters: number; velocityFactor?: number }): CalculationResult {
  return calculateFreqWavelength({
    mode: 'lambda_to_freq',
    wavelengthMeters: inputs.wavelengthMeters,
    velocityFactor: inputs.velocityFactor,
  });
}

// -------------------------------------------------------------
// Direct Period ↔ Frequency & Angular Frequency Conversions
// -------------------------------------------------------------
export function convertPeriodToFrequency(periodSeconds: number): { freqHz: number; omegaRadS: number } {
  if (periodSeconds <= 0) return { freqHz: 0, omegaRadS: 0 };
  const freqHz = 1 / periodSeconds;
  return {
    freqHz,
    omegaRadS: 2 * Math.PI * freqHz,
  };
}

export function convertFrequencyToPeriod(freqHz: number): { periodSeconds: number; omegaRadS: number } {
  if (freqHz <= 0) return { periodSeconds: Infinity, omegaRadS: 0 };
  return {
    periodSeconds: 1 / freqHz,
    omegaRadS: 2 * Math.PI * freqHz,
  };
}

export function convertAngularFrequency(omegaRadS: number): { freqHz: number; periodSeconds: number } {
  if (omegaRadS <= 0) return { freqHz: 0, periodSeconds: Infinity };
  const freqHz = omegaRadS / (2 * Math.PI);
  return {
    freqHz,
    periodSeconds: 1 / freqHz,
  };
}
