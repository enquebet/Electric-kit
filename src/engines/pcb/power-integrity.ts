/**
 * PCB Power Integrity (PI) & Power Plane Analysis Engine
 * 
 * Implements:
 * - Decoupling capacitor charge sizing: C = I_step · Δt / ΔV_droop
 * - Capacitor ESR Joule loss: P_esr = I_rms² · ESR
 * - Total capacitor ripple voltage: ΔV = I_peak·ESR + (I_peak·Δt)/C
 * - Decoupling capacitor energy: E = 0.5·C·V² (reusing calculateCapacitorEnergy)
 * - PDN Target Impedance: Z_target = ΔV_allowed / ΔI_transient
 * - Multi-stage parallel decoupling network & self-resonant frequency (SRF)
 * - Continuous copper plane sheet resistance, voltage drop, power loss, and current density
 * 
 * Engineering Classification: THEORETICAL / FIRST-ORDER PDN MODEL
 */

import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { COPPER_RESISTIVITY_20C, COPPER_TEMP_COEFF_20C } from '../../lib/constants';
import { calculateCapacitorEnergy } from '../circuit/energy';
import { calculateParallelCapacitors } from '../circuit/series-parallel-c';

export interface DecouplingCapInputs {
  transientCurrentAmps: number;  // ΔI step (e.g. 2.0 A)
  transientDurationSec: number;  // Δt response time (e.g. 50 ns or regulator transient 1 µs)
  allowedDroopVolts: number;     // ΔV max droop (e.g. 50 mV = 0.05 V)
  capacitorEsrOhms?: number;     // e.g. 5 mΩ = 0.005 Ω
  railVoltageVolts?: number;     // e.g. 3.3 V or 1.2 V core
}

export interface DecouplingCapOutputs {
  minimumCapacitanceFarads: number;
  minimumCapacitanceUf: number;
  esrVoltageDropVolts?: number;
  capacitiveVoltageDroopVolts: number;
  totalDroopVolts: number;
  esrPowerLossWatts?: number;
  storedEnergyJoules?: number;
}

/**
 * Sizes the minimum required decoupling capacitance to supply charge during a fast transient step.
 */
export function calculateDecouplingCapacitor(inputs: DecouplingCapInputs): CalculationResult & { outputs: DecouplingCapOutputs } {
  const {
    transientCurrentAmps: dI,
    transientDurationSec: dt,
    allowedDroopVolts: dV,
    capacitorEsrOhms: esr = 0.005, // 5 mΩ default for ceramic MLCC
    railVoltageVolts: vRail = 3.3,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeDI = Math.max(0.01, dI);
  const safeDt = Math.max(1e-10, dt);
  const safeDV = Math.max(0.001, dV);

  // Resistive step droop across ESR:
  const vEsr = safeDI * esr;
  const remainingAllowedDroop = safeDV - vEsr;

  let effectiveDroopBudget = remainingAllowedDroop;
  if (remainingAllowedDroop <= 0) {
    effectiveDroopBudget = safeDV * 0.5; // fallback
    warnings.push({
      severity: 'danger',
      title: 'ESR Exceeds Total Droop Budget',
      message: `The resistive drop across the capacitor ESR alone (${(vEsr * 1e3).toFixed(1)} mV) exceeds the allowed voltage droop (${(safeDV * 1e3).toFixed(1)} mV). You must use parallel capacitors with much lower equivalent ESR.`,
    });
  }

  // C = ΔI * Δt / ΔV_capacitive
  const minC = (safeDI * safeDt) / effectiveDroopBudget;
  const minCUf = minC * 1e6;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Resistive ESR Step Voltage Drop',
    formula: 'ΔV_ESR = ΔI × ESR',
    substitution: `ΔV_ESR = ${safeDI} A × ${(esr * 1e3).toFixed(2)} mΩ`,
    result: `${(vEsr * 1e3).toFixed(2)} mV`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Required Charge Reservoir Capacitance',
    formula: 'C = (ΔI × Δt) / (ΔV_allowed − ΔV_ESR)',
    substitution: `C = (${safeDI} A × ${(safeDt * 1e9).toFixed(1)} ns) / (${(safeDV * 1e3).toFixed(1)} mV − ${(vEsr * 1e3).toFixed(1)} mV)`,
    result: `${minCUf >= 1 ? minCUf.toFixed(2) + ' µF' : (minCUf * 1e3).toFixed(1) + ' nF'} (${minC.toExponential(3)} F)`,
  });

  // Reusing existing capacitor energy engine:
  const energyResult = calculateCapacitorEnergy({
    capacitance: minC,
    voltage: vRail,
  });

  const storedEnergy = energyResult.primaryValue;

  steps.push({
    stepNumber: 3,
    title: 'Calculate Stored Electrostatic Energy (Reusing Circuit Energy Engine)',
    formula: 'E = ½ × C × V_rail²',
    substitution: `E = ½ × ${minCUf.toFixed(2)} µF × (${vRail} V)²`,
    result: `${(storedEnergy * 1e6).toFixed(2)} µJ`,
  });

  const esrLoss = safeDI * safeDI * esr;

  const formattedC = `${minCUf >= 1 ? minCUf.toFixed(2) + ' µF' : (minCUf * 1e3).toFixed(1) + ' nF'}`;

  return {
    label: 'Decoupling Capacitance',
    primaryValue: minCUf,
    primaryUnit: 'µF',
    formattedValue: formattedC,
    formattedResult: formattedC,
    steps,
    warnings,
    equationUsed: 'C = ΔI·Δt / ΔV_droop | ΔV_total = ΔI·ESR + ΔI·Δt/C | E = ½CV²',
    engineeringModel: 'THEORETICAL',
    standardsContext: 'Power Delivery Network (PDN) First-Order Transient Sizing Guidelines.',
    additionalOutputs: {
      requiredCapacitance: { label: 'Min Required Capacitance', value: `${minCUf >= 1 ? minCUf.toFixed(2) + ' µF' : (minCUf * 1e3).toFixed(1) + ' nF'}` },
      esrDroop: { label: 'ESR Step Droop', value: `${(vEsr * 1e3).toFixed(2)} mV` },
      capacitiveDroop: { label: 'Capacitive Ramp Droop', value: `${(effectiveDroopBudget * 1e3).toFixed(2)} mV` },
      totalDroop: { label: 'Total Expected Droop', value: `${((vEsr + effectiveDroopBudget) * 1e3).toFixed(2)} mV` },
      storedEnergy: { label: 'Stored Energy at Rail Voltage', value: `${(storedEnergy * 1e6).toFixed(2)} µJ` },
      esrPowerDissipation: { label: 'Peak ESR Power Loss', value: `${(esrLoss * 1e3).toFixed(2)} mW` },
    },
    outputs: {
      minimumCapacitanceFarads: minC,
      minimumCapacitanceUf: minCUf,
      esrVoltageDropVolts: vEsr,
      capacitiveVoltageDroopVolts: effectiveDroopBudget,
      totalDroopVolts: vEsr + effectiveDroopBudget,
      esrPowerLossWatts: esrLoss,
      storedEnergyJoules: storedEnergy,
    },
  };
}

export interface PdnTargetImpedanceInputs {
  railVoltageVolts: number;       // e.g. 1.2 V
  allowedRipplePercent: number;   // e.g. 3% (0.036 V)
  transientCurrentAmps: number;   // e.g. 4.0 A
}

/**
 * Calculates PDN Target Impedance: Z_target = ΔV_allowed / ΔI_transient
 */
export function calculatePdnTargetImpedance(inputs: PdnTargetImpedanceInputs): CalculationResult & { outputs: { targetImpedanceOhms: number; allowedRippleVolts: number } } {
  const { railVoltageVolts: V, allowedRipplePercent: ripplePct, transientCurrentAmps: dI } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeV = Math.max(0.1, V);
  const safeRipple = Math.max(0.1, ripplePct);
  const safeDI = Math.max(0.01, dI);

  const deltaV = safeV * (safeRipple / 100);
  const zTarget = deltaV / safeDI;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Maximum Allowable Rail Voltage Deviation',
    formula: 'ΔV_allowed = V_rail × (Ripple% / 100)',
    substitution: `ΔV = ${safeV} V × (${safeRipple}% / 100)`,
    result: `${(deltaV * 1e3).toFixed(2)} mV`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Target PDN Impedance',
    formula: 'Z_target = ΔV_allowed / ΔI_transient',
    substitution: `Z_target = ${(deltaV * 1e3).toFixed(2)} mV / ${safeDI} A`,
    result: `${(zTarget * 1e3).toFixed(2)} mΩ (${zTarget.toFixed(4)} Ω)`,
    annotation: 'The entire power distribution network impedance must remain below Z_target from DC up to the knee frequency.',
  });

  if (zTarget < 0.010) {
    warnings.push({
      severity: 'info',
      title: 'Ultra-Low Target Impedance (<10 mΩ)',
      message: `Low target impedance (${(zTarget * 1e3).toFixed(1)} mΩ) typically required for modern multi-gigahertz FPGAs/SoCs. Requires tight inter-plane capacitance (thin dielectric < 50 µm between PWR and GND planes) and multi-terminal MLCC arrays.`,
    });
  }

  const formattedZ = `${(zTarget * 1e3).toFixed(2)} mΩ`;

  return {
    label: 'Target PDN Impedance',
    primaryValue: zTarget,
    primaryUnit: 'Ω',
    formattedValue: formattedZ,
    formattedResult: formattedZ,
    steps,
    warnings,
    equationUsed: 'Z_target = (V_rail × Ripple%) / ΔI_transient',
    engineeringModel: 'THEORETICAL',
    standardsContext: 'Smith / Bogatin Power Distribution Network Target Impedance Concept.',
    additionalOutputs: {
      targetImpedance: { label: 'Target Impedance (Z_target)', value: `${(zTarget * 1e3).toFixed(2)} mΩ` },
      allowedDroop: { label: 'Allowed Ripple Droop (ΔV)', value: `${(deltaV * 1e3).toFixed(2)} mV` },
    },
    outputs: {
      targetImpedanceOhms: zTarget,
      allowedRippleVolts: deltaV,
    },
  };
}

export interface PowerPlaneInputs {
  lengthMeters: number;
  widthMeters: number;
  copperThicknessMeters: number;
  currentAmps?: number;
  temperatureC?: number;
}

export interface PowerPlaneOutputs {
  sheetResistanceMilliOhmsPerSquare: number;
  totalResistanceOhms: number;
  aspectRatioSquares: number;
  crossSectionAreaMm2: number;
  voltageDropVolts?: number;
  powerLossWatts?: number;
  currentDensityAmpsPerMm2?: number;
}

/**
 * Calculates continuous copper power plane DC resistance, voltage drop, and sheet resistance.
 */
export function calculatePowerPlane(inputs: PowerPlaneInputs): CalculationResult & { outputs: PowerPlaneOutputs } {
  const {
    lengthMeters: L,
    widthMeters: W,
    copperThicknessMeters: T,
    currentAmps: I,
    temperatureC = 25,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeL = Math.max(1e-4, L);
  const safeW = Math.max(1e-4, W);
  const safeT = Math.max(1e-7, T);

  const rhoT = COPPER_RESISTIVITY_20C * (1 + COPPER_TEMP_COEFF_20C * (temperatureC - 20));

  // Sheet resistance: R_square = rho / T
  const rSquareOhms = rhoT / safeT;
  const rSquareMilliOhms = rSquareOhms * 1000;

  // Number of squares: N = L / W
  const squares = safeL / safeW;
  const totalResistance = rSquareOhms * squares;

  const areaMm2 = (safeW * 1e3) * (safeT * 1e3);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Copper Foil Sheet Resistance (R_□)',
    formula: 'R_□ = ρ(T) / Thickness',
    substitution: `R_□ = ${rhoT.toExponential(4)} Ω·m / ${(safeT * 1e6).toFixed(1)} µm`,
    result: `${rSquareMilliOhms.toFixed(3)} mΩ/□`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Power Plane Total DC Resistance',
    formula: 'R_plane = R_□ × (Length / Width)',
    substitution: `R = ${rSquareMilliOhms.toFixed(3)} mΩ/□ × (${(safeL * 1e3).toFixed(1)} mm / ${(safeW * 1e3).toFixed(1)} mm)`,
    result: `${(totalResistance * 1e3).toFixed(3)} mΩ (${squares.toFixed(2)} squares)`,
  });

  let vDrop: number | undefined;
  let pLoss: number | undefined;
  let currentDensity: number | undefined;

  if (I !== undefined && I > 0) {
    vDrop = I * totalResistance;
    pLoss = I * I * totalResistance;
    currentDensity = I / areaMm2;

    steps.push({
      stepNumber: 3,
      title: 'Calculate Plane Voltage Drop & Dissipated Joule Loss',
      formula: 'V_drop = I × R_plane | P = I² × R_plane',
      substitution: `V = ${I} A × ${(totalResistance * 1e3).toFixed(3)} mΩ | P = (${I} A)² × ${(totalResistance * 1e3).toFixed(3)} mΩ`,
      result: `V_drop = ${(vDrop * 1e3).toFixed(3)} mV | P = ${(pLoss * 1e3).toFixed(2)} mW`,
    });
  }

  const formattedPlane = `${(totalResistance * 1e3).toFixed(3)} mΩ`;

  return {
    label: 'Power Plane Resistance',
    primaryValue: totalResistance,
    primaryUnit: 'Ω',
    formattedValue: formattedPlane,
    formattedResult: formattedPlane,
    steps,
    warnings,
    equationUsed: 'R_□ = ρ/T | R_plane = R_□·(L/W) | V_drop = I·R_plane',
    engineeringModel: 'THEORETICAL',
    standardsContext: 'Copper sheet resistance and plane uniform current conduction.',
    additionalOutputs: {
      sheetResistance: { label: 'Sheet Resistance (R_□)', value: `${rSquareMilliOhms.toFixed(3)} mΩ/□` },
      planeResistance: { label: 'Plane Resistance', value: `${(totalResistance * 1e3).toFixed(3)} mΩ` },
      squaresCount: { label: 'Aspect Ratio (Squares)', value: `${squares.toFixed(2)} squares` },
      ...(vDrop ? { voltageDrop: { label: 'DC Voltage Drop', value: `${(vDrop * 1e3).toFixed(3)} mV` } } : {}),
      ...(pLoss ? { powerLoss: { label: 'Power Loss', value: `${(pLoss * 1e3).toFixed(2)} mW` } } : {}),
      ...(currentDensity ? { currentDensity: { label: 'Current Density (J)', value: `${currentDensity.toFixed(2)} A/mm²` } } : {}),
    },
    outputs: {
      sheetResistanceMilliOhmsPerSquare: rSquareMilliOhms,
      totalResistanceOhms: totalResistance,
      aspectRatioSquares: squares,
      crossSectionAreaMm2: areaMm2,
      voltageDropVolts: vDrop,
      powerLossWatts: pLoss,
      currentDensityAmpsPerMm2: currentDensity,
    },
  };
}

export interface DecouplingCapacitorStage {
  capacitanceFarads: number;
  count: number;
  esrOhms?: number;
  packageDescription?: string;
}

export interface ParallelDecouplingInputs {
  stages: DecouplingCapacitorStage[];
  targetCapacitanceFarads?: number;
  railVoltageVolts?: number;
}

export interface ParallelDecouplingOutputs {
  totalCapacitanceFarads: number;
  totalCapacitanceUf: number;
  totalCapacitorCount: number;
  effectiveEsrOhms?: number;
  targetCapacitanceFarads?: number;
  isCompliantWithTarget?: boolean;
  storedEnergyJoules?: number;
}

/**
 * Evaluates a multi-stage parallel decoupling capacitor network.
 * Sums total capacitance (reusing calculateParallelCapacitors) and equivalent ESR.
 * Handles zero capacitors, one capacitor, multiple stages, and invalid inputs gracefully.
 */
export function calculateParallelDecouplingNetwork(
  inputs: ParallelDecouplingInputs
): CalculationResult & { outputs: ParallelDecouplingOutputs } {
  const { stages, targetCapacitanceFarads, railVoltageVolts = 3.3 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // Filter valid stages:
  const validStages = (stages || []).filter(
    s => Number.isFinite(s.capacitanceFarads) && s.capacitanceFarads > 0 && Number.isFinite(s.count) && s.count > 0
  );

  let totalC = 0;
  let totalCount = 0;
  let invEsrSum = 0;
  let hasValidEsr = false;

  const flatCapacitorsList: number[] = [];

  for (const stage of validStages) {
    const stageCount = Math.floor(stage.count);
    totalCount += stageCount;
    for (let i = 0; i < stageCount; i++) {
      flatCapacitorsList.push(stage.capacitanceFarads);
    }

    if (stage.esrOhms !== undefined && stage.esrOhms > 0) {
      hasValidEsr = true;
      invEsrSum += stageCount / stage.esrOhms;
    }
  }

  if (flatCapacitorsList.length > 0) {
    // Reuse existing parallel capacitors engine:
    const baseParallel = calculateParallelCapacitors({
      capacitors: flatCapacitorsList,
      voltage: railVoltageVolts,
    });
    totalC = baseParallel.primaryValue;
  } else {
    totalC = 0;
    warnings.push({
      severity: 'warning',
      title: 'No Active Decoupling Capacitors',
      message: 'Network contains zero valid capacitor stages. Total decoupling capacitance is 0 µF.',
    });
  }

  const effectiveEsr = hasValidEsr && invEsrSum > 0 ? 1 / invEsrSum : undefined;
  const totalUf = totalC * 1e6;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Total Parallel Decoupling Capacitance',
    formula: 'C_total = Σ (C_i × N_i)',
    substitution: validStages.length > 0
      ? validStages.map(s => `${s.count}×(${(s.capacitanceFarads * 1e6).toFixed(2)} µF)`).join(' + ')
      : '0 stages',
    result: `${totalUf >= 1 ? totalUf.toFixed(2) + ' µF' : (totalUf * 1e3).toFixed(1) + ' nF'}`,
  });

  if (effectiveEsr !== undefined) {
    steps.push({
      stepNumber: 2,
      title: 'Calculate Equivalent Parallel ESR',
      formula: '1 / ESR_eff = Σ (N_i / ESR_i)',
      substitution: validStages
        .filter(s => s.esrOhms && s.esrOhms > 0)
        .map(s => `${s.count} / ${(s.esrOhms! * 1e3).toFixed(1)} mΩ`)
        .join(' + '),
      result: `${(effectiveEsr * 1e3).toFixed(2)} mΩ`,
    });
  }

  let isCompliant: boolean | undefined;
  if (targetCapacitanceFarads !== undefined && targetCapacitanceFarads > 0) {
    isCompliant = totalC >= targetCapacitanceFarads;
    if (!isCompliant) {
      warnings.push({
        severity: 'danger',
        title: 'Decoupling Budget Deficit',
        message: `Total network capacitance (${totalUf.toFixed(2)} µF) falls below target requirement (${(targetCapacitanceFarads * 1e6).toFixed(2)} µF).`,
      });
    }
  }

  const storedEnergy = totalC > 0 ? 0.5 * totalC * railVoltageVolts * railVoltageVolts : 0;

  const formattedBank = `${totalUf >= 1 ? totalUf.toFixed(2) + ' µF' : (totalUf * 1e3).toFixed(1) + ' nF'} (${totalCount} caps)`;

  return {
    label: 'Decoupling Bank Total Capacitance',
    primaryValue: totalUf,
    primaryUnit: 'µF',
    formattedValue: formattedBank,
    formattedResult: formattedBank,
    steps,
    warnings,
    equationUsed: 'C_total = Σ C_i | 1/ESR_eff = Σ (1/ESR_i)',
    engineeringModel: 'THEORETICAL',
    standardsContext: 'Multi-stage PDN high-frequency decoupling capacitor bank aggregation.',
    additionalOutputs: {
      totalCapacitance: { label: 'Total Capacitance', value: `${totalUf.toFixed(2)} µF` },
      totalComponents: { label: 'Component Count', value: `${totalCount} capacitors` },
      ...(effectiveEsr ? { effectiveEsr: { label: 'Effective Parallel ESR', value: `${(effectiveEsr * 1e3).toFixed(2)} mΩ` } } : {}),
      ...(isCompliant !== undefined ? { targetCompliance: { label: 'Target Compliance', value: isCompliant ? 'PASS' : 'FAIL' } } : {}),
      ...(totalC > 0 ? { storedEnergy: { label: 'Total Stored Energy', value: `${(storedEnergy * 1e6).toFixed(2)} µJ` } } : {}),
    },
    outputs: {
      totalCapacitanceFarads: totalC,
      totalCapacitanceUf: totalUf,
      totalCapacitorCount: totalCount,
      effectiveEsrOhms: effectiveEsr,
      targetCapacitanceFarads,
      isCompliantWithTarget: isCompliant,
      storedEnergyJoules: storedEnergy,
    },
  };
}
