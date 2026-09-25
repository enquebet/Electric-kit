import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { snapToStandardE24 } from '../../lib/standards/e-series';
import { checkVoltageSafety, checkCurrentSafety } from '../../lib/safety/disclaimers';

export interface DiodeSeriesResistorInputs {
  supplyVoltage: number;    // Vs (V)
  forwardVoltage: number;   // Vf per diode (V)
  targetCurrent: number;    // If (A)
  diodeCount?: number;      // N series diodes (default 1)
}

export function calculateDiodeSeriesResistor(inputs: DiodeSeriesResistorInputs): CalculationResult {
  const { supplyVoltage, forwardVoltage, targetCurrent, diodeCount = 1 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const Vs = Number.isFinite(supplyVoltage) ? supplyVoltage : 5.0;
  const Vf = Number.isFinite(forwardVoltage) && forwardVoltage > 0 ? forwardVoltage : 0.7;
  const If = Number.isFinite(targetCurrent) && targetCurrent > 0 ? targetCurrent : 0.02;
  const N = Math.max(1, Math.floor(diodeCount));

  const totalVf = N * Vf;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Total Diode String Drop',
    formula: 'V_string = N × V_f',
    substitution: `V_string = ${N} × ${formatQuantity(Vf, 'voltage')}`,
    result: formatQuantity(totalVf, 'voltage'),
  });

  if (Vs <= totalVf) {
    warnings.push({
      severity: 'danger',
      title: 'Insufficient Supply Voltage',
      message: `Supply voltage (${formatQuantity(Vs, 'voltage')}) is less than or equal to the required string forward drop (${formatQuantity(totalVf, 'voltage')}). Diodes will not conduct.`,
    });

    return {
      primaryValue: 0,
      formattedValue: '0 Ω (Supply < Vf)',
      unit: 'Ω',
      label: 'Series Resistor (R)',
      warnings,
      steps,
      additionalOutputs: {
        status: { label: 'Conduction State', value: 'Non-conducting / Cut-off' },
      },
      visualData: { Vs, Vf, totalVf, If, N, R: 0, efficiency: 0 },
    };
  }

  const vDropResistor = Vs - totalVf;
  const R_calc = vDropResistor / If;
  const pResistor = If * If * R_calc;
  const pDiodes = totalVf * If;
  const pTotal = Vs * If;
  const efficiency = (pDiodes / pTotal) * 100;

  steps.push({
    stepNumber: 2,
    title: 'Calculate Required Ballast Resistance',
    formula: 'R = (V_supply - N × V_f) / I_f',
    substitution: `R = (${formatQuantity(Vs, 'voltage')} - ${formatQuantity(totalVf, 'voltage')}) / ${formatQuantity(If, 'current')}`,
    result: formatQuantity(R_calc, 'resistance'),
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Power Budget & Luminous / Electrical Efficiency',
    formula: 'P_R = I² × R ;   P_diodes = V_string × I ;   η = (P_diodes / P_total) × 100%',
    substitution: `P_R = ${formatQuantity(pResistor, 'power')} ;   P_diodes = ${formatQuantity(pDiodes, 'power')} ;   P_total = ${formatQuantity(pTotal, 'power')}`,
    result: `Efficiency = ${efficiency.toFixed(1)}% (${formatQuantity(pResistor, 'power')} wasted as heat)`,
  });

  const e24 = snapToStandardE24(R_calc);

  if (efficiency < 30) {
    warnings.push({
      severity: 'warning',
      title: 'Low Ballast Efficiency',
      message: `Over ${(100 - efficiency).toFixed(0)}% of input power (${formatQuantity(pResistor, 'power')}) is dissipated as heat in the series resistor. Consider a switching constant-current buck driver.`,
    });
  }

  return {
    primaryValue: R_calc,
    formattedValue: formatQuantity(R_calc, 'resistance'),
    unit: 'Ω',
    label: 'Calculated Series Resistor (R)',
    standardValue: e24,
    powerDissipation: {
      watts: pResistor,
      formatted: formatQuantity(pResistor, 'power'),
      suggestedRating: `${formatQuantity(pResistor * 2, 'power')} (2.0× safety headroom)`,
    },
    warnings,
    steps,
    additionalOutputs: {
      voltageAcrossR: {
        label: 'Resistor Voltage Drop',
        value: formatQuantity(vDropResistor, 'voltage'),
        unit: 'V',
      },
      diodePower: {
        label: 'Total Diode Power',
        value: formatQuantity(pDiodes, 'power'),
        unit: 'W',
      },
      circuitEfficiency: {
        label: 'Electrical Efficiency (P_diode / P_total)',
        value: `${efficiency.toFixed(1)}%`,
      },
      recommendedResistor: {
        label: 'Recommended Standard E24',
        value: e24 ? `${e24.formattedRecommended} (Dev: ${e24.deviationPercent > 0 ? '+' : ''}${e24.deviationPercent.toFixed(1)}%)` : 'N/A',
      },
    },
    visualData: {
      Vs,
      Vf,
      totalVf,
      If,
      N,
      R: R_calc,
      pResistor,
      pDiodes,
      pTotal,
      efficiency,
    },
  };
}

export interface ZenerResistorInputs {
  supplyVoltageMin: number; // Vs,min (V)
  supplyVoltageMax: number; // Vs,max (V)
  zenerVoltage: number;     // Vz (V)
  zenerCurrentMin?: number; // Iz,min keep-alive current (A, default 5mA)
  loadCurrentMin?: number;  // Iload,min (A, default 0)
  loadCurrentMax: number;   // Iload,max (A)
}

export function calculateZenerResistor(inputs: ZenerResistorInputs): CalculationResult {
  const {
    supplyVoltageMin,
    supplyVoltageMax,
    zenerVoltage,
    zenerCurrentMin = 0.005,
    loadCurrentMin = 0,
    loadCurrentMax,
  } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const VsMin = Number.isFinite(supplyVoltageMin) ? supplyVoltageMin : 12.0;
  const VsMax = Number.isFinite(supplyVoltageMax) ? supplyVoltageMax : 15.0;
  const Vz = Number.isFinite(zenerVoltage) && zenerVoltage > 0 ? zenerVoltage : 5.1;
  const IzMin = Number.isFinite(zenerCurrentMin) && zenerCurrentMin > 0 ? zenerCurrentMin : 0.005;
  const IloadMax = Number.isFinite(loadCurrentMax) && loadCurrentMax >= 0 ? loadCurrentMax : 0.02;
  const IloadMin = Number.isFinite(loadCurrentMin) && loadCurrentMin >= 0 ? loadCurrentMin : 0;

  if (VsMin <= Vz) {
    warnings.push({
      severity: 'danger',
      title: 'Supply Drops Below Zener Voltage',
      message: `Minimum supply (${formatQuantity(VsMin, 'voltage')}) is less than Zener breakdown (${formatQuantity(Vz, 'voltage')}). Regulation will drop out.`,
    });
  }

  // To guarantee regulation at worst-case (Vs,min and Iload,max):
  // Rs <= (Vs,min - Vz) / (Iload,max + Iz,min)
  const totalWorstCurrent = IloadMax + IzMin;
  const Rs_max = (VsMin - Vz) / totalWorstCurrent;
  const Rs = Math.max(0.1, Rs_max);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Maximum Allowable Series Resistor',
    formula: 'R_s ≤ (V_s,min - V_z) / (I_load,max + I_z,min)',
    substitution: `R_s ≤ (${formatQuantity(VsMin, 'voltage')} - ${formatQuantity(Vz, 'voltage')}) / (${formatQuantity(IloadMax, 'current')} + ${formatQuantity(IzMin, 'current')})`,
    result: formatQuantity(Rs, 'resistance'),
    annotation: 'Ensures the Zener maintains its minimum knee current (Iz,min) even at lowest input voltage and maximum load current.',
  });

  // Worst-case Zener dissipation occurs at Vs,max and Iload,min (no load):
  // Iz,max = (Vs,max - Vz) / Rs - Iload,min
  const Iz_max = Math.max(0, (VsMax - Vz) / Rs - IloadMin);
  const Pz_max = Vz * Iz_max;

  // Worst-case Resistor dissipation occurs at Vs,max:
  const Pr_max = Math.pow(VsMax - Vz, 2) / Rs;

  steps.push({
    stepNumber: 2,
    title: 'Calculate Maximum Zener & Resistor Thermal Dissipation',
    formula: 'I_z,max = (V_s,max - V_z)/R_s - I_load,min ;   P_z,max = V_z × I_z,max ;   P_R,max = (V_s,max - V_z)² / R_s',
    substitution: `I_z,max = (${formatQuantity(VsMax, 'voltage')} - ${formatQuantity(Vz, 'voltage')}) / ${formatQuantity(Rs, 'resistance')} = ${formatQuantity(Iz_max, 'current')}`,
    result: `P_z,max = ${formatQuantity(Pz_max, 'power')} ;   P_R,max = ${formatQuantity(Pr_max, 'power')}`,
  });

  const e24 = snapToStandardE24(Rs);

  if (Pz_max > 0.5) {
    warnings.push({
      severity: 'warning',
      title: 'High Zener Power Dissipation',
      message: `Zener peak dissipation reaches ${formatQuantity(Pz_max, 'power')} under no-load condition. Verify diode power rating (e.g. 1W, 5W) and PCB thermal relief.`,
    });
  }

  return {
    primaryValue: Rs,
    formattedValue: formatQuantity(Rs, 'resistance'),
    unit: 'Ω',
    label: 'Calculated Series Resistor (R_s)',
    standardValue: e24,
    powerDissipation: {
      watts: Pr_max,
      formatted: formatQuantity(Pr_max, 'power'),
      suggestedRating: `${formatQuantity(Pr_max * 2, 'power')} (2.0× safety headroom)`,
    },
    warnings,
    steps,
    additionalOutputs: {
      zenerMaxCurrent: {
        label: 'Worst-Case Zener Current (No-Load)',
        value: formatQuantity(Iz_max, 'current'),
        unit: 'A',
      },
      zenerMaxPower: {
        label: 'Worst-Case Zener Dissipation',
        value: formatQuantity(Pz_max, 'power'),
        unit: 'W',
      },
      resistorMaxPower: {
        label: 'Worst-Case Resistor Dissipation',
        value: formatQuantity(Pr_max, 'power'),
        unit: 'W',
      },
      loadRange: {
        label: 'Supported Load Range',
        value: `${formatQuantity(IloadMin, 'current')} to ${formatQuantity(IloadMax, 'current')}`,
      },
    },
    visualData: {
      VsMin,
      VsMax,
      Vz,
      Rs,
      IzMin,
      Iz_max,
      Pz_max,
      Pr_max,
      IloadMax,
    },
  };
}

export interface ZenerPowerInputs {
  zenerVoltage: number;    // Vz (V)
  zenerCurrent: number;    // Iz (A)
  ratedPower?: number;     // Rated device wattage (e.g. 0.5W, 1W)
}

export function calculateZenerPower(inputs: ZenerPowerInputs): CalculationResult {
  const { zenerVoltage, zenerCurrent, ratedPower = 0.5 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const Vz = Number.isFinite(zenerVoltage) && zenerVoltage > 0 ? zenerVoltage : 5.1;
  const Iz = Number.isFinite(zenerCurrent) && zenerCurrent >= 0 ? zenerCurrent : 0.02;
  const P_rated = Number.isFinite(ratedPower) && ratedPower > 0 ? ratedPower : 0.5;

  // Pz = Vz * Iz
  const Pz = Vz * Iz;
  const utilization = (Pz / P_rated) * 100;
  const iMaxSafe = P_rated / Vz;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Zener Active Power Dissipation',
    formula: 'P_z = V_z × I_z',
    substitution: `P_z = ${formatQuantity(Vz, 'voltage')} × ${formatQuantity(Iz, 'current')}`,
    result: formatQuantity(Pz, 'power'),
    annotation: 'Active electrical power converted into thermal junction heat within the silicon depletion region.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Evaluate Thermal Headroom & Maximum Safe Current',
    formula: 'Utilization = (P_z / P_rated) × 100% ;   I_z,max = P_rated / V_z',
    substitution: `Utilization = (${formatQuantity(Pz, 'power')} / ${formatQuantity(P_rated, 'power')}) × 100%`,
    result: `${utilization.toFixed(1)}% of ${formatQuantity(P_rated, 'power')} rating (I_max = ${formatQuantity(iMaxSafe, 'current')})`,
  });

  if (Pz > P_rated) {
    warnings.push({
      severity: 'danger',
      title: 'Power Rating Exceeded (Thermal Overload)',
      message: `Calculated dissipation (${formatQuantity(Pz, 'power')}) exceeds rated package limit (${formatQuantity(P_rated, 'power')}) by ${(utilization - 100).toFixed(0)}%. Catastrophic thermal destruction will occur.`,
    });
  } else if (utilization > 70) {
    warnings.push({
      severity: 'warning',
      title: 'High Thermal Stress (>70% rating)',
      message: `Operating at ${utilization.toFixed(0)}% of rated power. In enclosed spaces or elevated ambient temperatures (>25°C), package thermal derating (e.g. -4 mW/°C) must be applied.`,
    });
  }

  // Explicit safety guideline note required by engineering specification:
  warnings.push({
    severity: 'info',
    title: 'Thermal Engineering Guidance',
    message: 'Safe operation depends on ambient temperature, airflow, and PCB copper thermal relief. Calculation provides steady-state electrical power only and does not replace junction-to-ambient thermal resistance (RθJA) analysis.',
  });

  return {
    primaryValue: Pz,
    formattedValue: formatQuantity(Pz, 'power'),
    unit: 'W',
    label: 'Zener Power Dissipation (P_z)',
    warnings,
    steps,
    additionalOutputs: {
      ratingUtilization: {
        label: 'Power Rating Utilization',
        value: `${utilization.toFixed(1)}% of ${formatQuantity(P_rated, 'power')}`,
      },
      maxSafeCurrent: {
        label: 'Max Safe Continuous Current',
        value: formatQuantity(iMaxSafe, 'current'),
        unit: 'A',
      },
      zenerVoltage: {
        label: 'Breakdown Voltage (V_z)',
        value: formatQuantity(Vz, 'voltage'),
        unit: 'V',
      },
      operatingCurrent: {
        label: 'Operating Current (I_z)',
        value: formatQuantity(Iz, 'current'),
        unit: 'A',
      },
    },
    visualData: {
      Vz,
      Iz,
      Pz,
      P_rated,
      utilization,
      iMaxSafe,
    },
  };
}

export interface RectifierInputs {
  topology: 'half-wave' | 'full-wave-ct' | 'bridge';
  acRmsVoltage: number;    // Vac,rms (V)
  acFrequency?: number;    // Frequency (Hz, default 50/60)
  diodeDrop?: number;      // Forward drop Vf per diode (V, default 0.7 for Si, 0.35 for Schottky, 0 for ideal)
  filterCapacitor?: number;// Filter capacitance (F, optional)
  loadResistance?: number; // Load resistance (Ohms, optional)
  loadCurrent?: number;    // Or DC load current (A, optional)
}

export function calculateRectifier(inputs: RectifierInputs): CalculationResult {
  const {
    topology,
    acRmsVoltage,
    acFrequency = 60,
    diodeDrop = 0.7,
    filterCapacitor = 0,
    loadResistance = 100,
    loadCurrent,
  } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const Vrms = Number.isFinite(acRmsVoltage) && acRmsVoltage > 0 ? acRmsVoltage : 12.0;
  const f = Number.isFinite(acFrequency) && acFrequency > 0 ? acFrequency : 60;
  const Vf = Number.isFinite(diodeDrop) && diodeDrop >= 0 ? diodeDrop : 0.7;
  const C = Number.isFinite(filterCapacitor) && filterCapacitor >= 0 ? filterCapacitor : 0;
  const RL = Number.isFinite(loadResistance) && loadResistance > 0 ? loadResistance : 100;

  // Peak AC voltage: V_peak = sqrt(2) * Vrms
  const VpeakAc = Math.SQRT2 * Vrms;

  // Number of conducting diodes in series per conduction interval:
  // Half-Wave: 1 diode drop
  // Full-Wave Center Tapped: 1 diode drop
  // Full-Wave Bridge: 2 diode drops in series
  const conductingDiodes = topology === 'bridge' ? 2 : 1;
  const totalDiodeDrop = conductingDiodes * Vf;
  const VpeakDc = Math.max(0, VpeakAc - totalDiodeDrop);

  // Ripple frequency:
  // Half-wave: fripple = f
  // Full-wave & Bridge: fripple = 2 * f
  const fRipple = topology === 'half-wave' ? f : 2 * f;

  // Unfiltered theoretical average DC output:
  // Half-wave: Vdc = Vpeak / pi ≈ 0.318 * Vpeak
  // Full-wave & Bridge: Vdc = 2 * Vpeak / pi ≈ 0.637 * Vpeak
  const vDcUnfiltered = topology === 'half-wave'
    ? VpeakDc / Math.PI
    : (2 * VpeakDc) / Math.PI;

  // Peak Inverse Voltage (PIV):
  // Half-Wave with cap: 2 * VpeakAc
  // Center-tapped full-wave: 2 * VpeakAc
  // Bridge rectifier: 1 * VpeakAc
  const piv = topology === 'bridge' ? VpeakAc : 2 * VpeakAc;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Peak AC & Rectified DC Voltage',
    formula: 'V_peak,AC = √2 × V_rms ;   V_peak,DC = V_peak,AC - (N_diodes × V_f)',
    substitution: `V_peak,AC = √2 × ${formatQuantity(Vrms, 'voltage')} = ${formatQuantity(VpeakAc, 'voltage')} ;   Diode Drop = ${conductingDiodes} × ${formatQuantity(Vf, 'voltage')}`,
    result: `V_peak,DC = ${formatQuantity(VpeakDc, 'voltage')}`,
    annotation: Vf === 0 ? 'Assumes Ideal Diode Model (Zero forward drop).' : `Practical Silicon Model (${conductingDiodes} × ${Vf}V drop).`,
  });

  let vDc = vDcUnfiltered;
  let vRipplePkPk = 0;
  let idc = loadCurrent && loadCurrent > 0 ? loadCurrent : (RL > 0 ? vDc / RL : 0);

  if (C > 0) {
    // With smoothing filter capacitor:
    // Vr(p-p) ≈ Idc / (f_ripple * C)
    // Vdc ≈ Vpeak,dc - Vr(p-p) / 2
    idc = loadCurrent && loadCurrent > 0 ? loadCurrent : (RL > 0 ? VpeakDc / RL : 0);
    vRipplePkPk = (fRipple * C > 0) ? idc / (fRipple * C) : 0;
    // Cap ripple cannot exceed peak
    vRipplePkPk = Math.min(VpeakDc, vRipplePkPk);
    vDc = Math.max(0, VpeakDc - vRipplePkPk / 2);

    steps.push({
      stepNumber: 2,
      title: 'Calculate Filter Capacitor Ripple & Smoothed DC Output',
      formula: 'V_ripple(p-p) ≈ I_dc / (f_ripple × C) ;   V_dc = V_peak,DC - V_ripple / 2',
      substitution: `V_ripple = ${formatQuantity(idc, 'current')} / (${fRipple} Hz × ${formatQuantity(C, 'capacitance')})`,
      result: `V_dc = ${formatQuantity(vDc, 'voltage')} (Ripple = ${formatQuantity(vRipplePkPk, 'voltage')} pk-pk)`,
    });
  } else {
    steps.push({
      stepNumber: 2,
      title: 'Calculate Unfiltered Average DC Output',
      formula: topology === 'half-wave' ? 'V_dc = V_peak,DC / π' : 'V_dc = 2 × V_peak,DC / π',
      substitution: `${topology === 'half-wave' ? '1/π' : '2/π'} × ${formatQuantity(VpeakDc, 'voltage')}`,
      result: `V_dc = ${formatQuantity(vDc, 'voltage')}`,
    });
  }

  // Diode power dissipation
  const pDiodesTotal = idc * totalDiodeDrop;

  return {
    primaryValue: vDc,
    formattedValue: formatQuantity(vDc, 'voltage'),
    unit: 'V',
    label: 'Average DC Output Voltage (V_dc)',
    warnings,
    steps,
    additionalOutputs: {
      peakDcVoltage: {
        label: 'Peak DC Voltage (V_peak)',
        value: formatQuantity(VpeakDc, 'voltage'),
        unit: 'V',
      },
      pivRating: {
        label: 'Minimum Diode PIV Rating',
        value: formatQuantity(piv, 'voltage'),
        unit: 'V',
      },
      rippleFrequency: {
        label: 'Ripple Frequency',
        value: `${fRipple} Hz`,
        unit: 'Hz',
      },
      rippleVoltage: {
        label: 'Ripple Voltage (pk-pk)',
        value: C > 0 ? formatQuantity(vRipplePkPk, 'voltage') : '100% (Unfiltered)',
      },
      loadCurrent: {
        label: 'DC Load Current',
        value: formatQuantity(idc, 'current'),
        unit: 'A',
      },
      diodeLosses: {
        label: 'Total Diode Conduction Loss',
        value: formatQuantity(pDiodesTotal, 'power'),
        unit: 'W',
      },
      modelAssumptions: {
        label: 'Diode Model',
        value: Vf === 0 ? 'Ideal Diode (0V drop)' : `Practical (${conductingDiodes} diode drop = ${totalDiodeDrop.toFixed(2)}V)`,
      },
    },
    visualData: {
      topology,
      Vrms,
      VpeakAc,
      VpeakDc,
      vDc,
      vRipplePkPk,
      fRipple,
      piv,
      C,
      RL,
      idc,
      pDiodesTotal,
    },
  };
}
