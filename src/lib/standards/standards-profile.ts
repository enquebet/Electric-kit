import { EngineeringWarning } from '../../types/tool';

export type StandardsFrameworkId = 'IEC_60364' | 'NEC_NFPA70' | 'GENERIC_INTERNATIONAL';

export interface ConductorMaterial {
  id: 'copper' | 'aluminium';
  name: string;
  resistivity20C: number; // Ohm * m
  tempCoefficient20C: number; // 1 / °C
  standardDensityGramsPerCm3: number;
}

export const CONDUCTOR_MATERIALS: Record<'copper' | 'aluminium', ConductorMaterial> = {
  copper: {
    id: 'copper',
    name: 'Annealed Electrolytic Copper (Cu)',
    resistivity20C: 1.724e-8, // 0.01724 Ohm*mm²/m at 20°C (IACS 100%)
    tempCoefficient20C: 0.00393,
    standardDensityGramsPerCm3: 8.89,
  },
  aluminium: {
    id: 'aluminium',
    name: 'Electrical Grade Aluminium (Al EC-1350)',
    resistivity20C: 2.824e-8, // 0.02824 Ohm*mm²/m at 20°C (approx 61% IACS)
    tempCoefficient20C: 0.00403,
    standardDensityGramsPerCm3: 2.70,
  },
};

export interface StandardsProfile {
  id: StandardsFrameworkId;
  name: string;
  region: string;
  referenceCode: string;
  defaultFrequencyHz: number;
  nominalSinglePhaseV: number;
  nominalThreePhaseV: number;
  recommendedMaxBranchVoltageDropPercent: number;
  recommendedMaxTotalVoltageDropPercent: number;
  conductorStandard: 'metric' | 'awg';
}

export const STANDARDS_PROFILES: Record<StandardsFrameworkId, StandardsProfile> = {
  IEC_60364: {
    id: 'IEC_60364',
    name: 'IEC 60364 International Framework',
    region: 'Europe, Asia, International (50 Hz)',
    referenceCode: 'IEC 60364-5-52 / IEC 60909 / IEC 60076',
    defaultFrequencyHz: 50,
    nominalSinglePhaseV: 230,
    nominalThreePhaseV: 400,
    recommendedMaxBranchVoltageDropPercent: 3.0,
    recommendedMaxTotalVoltageDropPercent: 5.0,
    conductorStandard: 'metric',
  },
  NEC_NFPA70: {
    id: 'NEC_NFPA70',
    name: 'NEC / NFPA 70 North America',
    region: 'United States, North America (60 Hz)',
    referenceCode: 'NEC NFPA 70 Articles 210, 215, 310, 430',
    defaultFrequencyHz: 60,
    nominalSinglePhaseV: 120,
    nominalThreePhaseV: 208,
    recommendedMaxBranchVoltageDropPercent: 3.0,
    recommendedMaxTotalVoltageDropPercent: 5.0,
    conductorStandard: 'awg',
  },
  GENERIC_INTERNATIONAL: {
    id: 'GENERIC_INTERNATIONAL',
    name: 'General Electrical Engineering Physics',
    region: 'Educational / Theoretical Baseline',
    referenceCode: 'Fundamental Circuit Theorems & Maxwell Equations',
    defaultFrequencyHz: 50,
    nominalSinglePhaseV: 230,
    nominalThreePhaseV: 400,
    recommendedMaxBranchVoltageDropPercent: 3.0,
    recommendedMaxTotalVoltageDropPercent: 5.0,
    conductorStandard: 'metric',
  },
};

/**
 * Standard IEC Metric Cable Cross-Sectional Areas (mm²)
 */
export const IEC_STANDARD_METRIC_AREAS_MM2: number[] = [
  0.75, 1.0, 1.5, 2.5, 4.0, 6.0, 10.0, 16.0, 25.0, 35.0, 50.0, 70.0, 95.0, 120.0, 150.0, 185.0, 240.0, 300.0, 400.0, 500.0,
];

/**
 * Standard AWG Sizes with mm² conversions and nominal resistance for Cu at 75°C
 */
export interface AwgEntry {
  awg: string;
  areaMm2: number;
  resistanceOhmPerKm75C: number;
}

export const AWG_STANDARD_SIZES: AwgEntry[] = [
  { awg: '14 AWG', areaMm2: 2.08, resistanceOhmPerKm75C: 10.1 },
  { awg: '12 AWG', areaMm2: 3.31, resistanceOhmPerKm75C: 6.36 },
  { awg: '10 AWG', areaMm2: 5.26, resistanceOhmPerKm75C: 3.99 },
  { awg: '8 AWG', areaMm2: 8.37, resistanceOhmPerKm75C: 2.52 },
  { awg: '6 AWG', areaMm2: 13.3, resistanceOhmPerKm75C: 1.59 },
  { awg: '4 AWG', areaMm2: 21.2, resistanceOhmPerKm75C: 1.00 },
  { awg: '3 AWG', areaMm2: 26.7, resistanceOhmPerKm75C: 0.79 },
  { awg: '2 AWG', areaMm2: 33.6, resistanceOhmPerKm75C: 0.63 },
  { awg: '1 AWG', areaMm2: 42.4, resistanceOhmPerKm75C: 0.50 },
  { awg: '1/0 AWG', areaMm2: 53.5, resistanceOhmPerKm75C: 0.39 },
  { awg: '2/0 AWG', areaMm2: 67.4, resistanceOhmPerKm75C: 0.31 },
  { awg: '3/0 AWG', areaMm2: 85.0, resistanceOhmPerKm75C: 0.25 },
  { awg: '4/0 AWG', areaMm2: 107.0, resistanceOhmPerKm75C: 0.20 },
  { awg: '250 kcmil', areaMm2: 127.0, resistanceOhmPerKm75C: 0.17 },
  { awg: '300 kcmil', areaMm2: 152.0, resistanceOhmPerKm75C: 0.14 },
  { awg: '350 kcmil', areaMm2: 177.0, resistanceOhmPerKm75C: 0.12 },
  { awg: '500 kcmil', areaMm2: 253.0, resistanceOhmPerKm75C: 0.085 },
];

/**
 * Generates an engineering contextual safety disclaimer for real installations.
 */
export function getInstallationContextWarning(topic: string, specificFactors?: string[]): EngineeringWarning {
  const factorsList = specificFactors && specificFactors.length > 0
    ? specificFactors.join(', ')
    : 'installation method, conduit thermal grouping, terminal temperature limits (60°C/75°C/90°C), soil thermal resistivity, prospective short-circuit withstand, and local utility regulations';

  return {
    severity: 'warning',
    title: `Engineering Notice: ${topic} Practical Application`,
    message: `This tool calculates theoretical physics and preliminary engineering estimates. Real-world electrical installations require verification against ${factorsList}, as mandated by jurisdictional electrical codes (e.g. IEC 60364, NEC NFPA 70) and sealed design by a licensed Professional Engineer (PE) or master electrician.`,
  };
}
