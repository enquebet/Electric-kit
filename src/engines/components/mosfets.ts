import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { snapToStandardE24 } from '../../lib/standards/e-series';

export interface MosfetGateResistorInputs {
  gateCharge: number;        // Total gate charge Qg (Coulombs, e.g. 50nC = 50e-9)
  driverVoltage: number;     // Vdrv (V, e.g. 10V or 12V)
  desiredSwitchingTime: number; // t_sw (seconds, e.g. 50ns = 50e-9)
  driverInternalResistance?: number; // Rdrv (Ohms, default 2.0)
  switchingFreq?: number;    // fsw (Hz, optional for gate driver power)
}

export function calculateMosfetGateResistor(inputs: MosfetGateResistorInputs): CalculationResult {
  const {
    gateCharge,
    driverVoltage,
    desiredSwitchingTime,
    driverInternalResistance = 2.0,
    switchingFreq = 100000,
  } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const Qg = Number.isFinite(gateCharge) && gateCharge > 0 ? gateCharge : 30e-9;
  const Vdrv = Number.isFinite(driverVoltage) && driverVoltage > 0 ? driverVoltage : 10.0;
  const tSw = Number.isFinite(desiredSwitchingTime) && desiredSwitchingTime > 0 ? desiredSwitchingTime : 50e-9;
  const Rdrv = Number.isFinite(driverInternalResistance) && driverInternalResistance >= 0 ? driverInternalResistance : 2.0;
  const fsw = Number.isFinite(switchingFreq) && switchingFreq >= 0 ? switchingFreq : 100000;

  // Average charging current: I_gate_avg = Q_g / t_sw
  const iGateAvg = Qg / tSw;

  // Approximate loop resistance required: R_total ≈ Vdrv / I_gate_avg
  const rTotal = Vdrv / iGateAvg;
  const rgExternal = Math.max(0, rTotal - Rdrv);

  // Peak current drawn from driver at start of transition:
  const iPeak = (rgExternal + Rdrv) > 0 ? Vdrv / (rgExternal + Rdrv) : 0;

  // Gate driver power loss: P_gate = Qg * Vdrv * fsw
  const pGate = Qg * Vdrv * fsw;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Average Gate Charging Current',
    formula: 'I_gate,avg = Q_g / t_sw',
    substitution: `I_gate,avg = ${(Qg * 1e9).toFixed(1)} nC / ${(tSw * 1e9).toFixed(1)} ns`,
    result: formatQuantity(iGateAvg, 'current'),
  });

  steps.push({
    stepNumber: 2,
    title: 'Determine External Series Gate Resistor',
    formula: 'R_total = V_drv / I_gate,avg ;   R_g,ext = max(0, R_total - R_driver)',
    substitution: `R_total = ${formatQuantity(Vdrv, 'voltage')} / ${formatQuantity(iGateAvg, 'current')} = ${formatQuantity(rTotal, 'resistance')} ;   R_g = ${formatQuantity(rTotal, 'resistance')} - ${formatQuantity(Rdrv, 'resistance')}`,
    result: formatQuantity(rgExternal, 'resistance'),
    annotation: 'Simplified first-order RC/charge integration estimate. In real power circuits, Miller plateau duration (Qgd) and parasitic gate-loop inductance determine ringing damping.',
  });

  const e24 = snapToStandardE24(rgExternal);

  warnings.push({
    severity: 'info',
    title: 'Simplified Estimation Model Note',
    message: 'This tool provides a first-order gate resistor sizing guideline. True power MOSFET gate driver design must account for the Miller capacitance plateau (C_gd), parasitic PCB trace inductance (L_gate ringing damping where Rg > 2√(L/C)), and separate turn-on/turn-off diodes.',
  });

  if (iPeak > 2.0) {
    warnings.push({
      severity: 'warning',
      title: 'High Peak Gate Current',
      message: `Peak drive current (${formatQuantity(iPeak, 'current')}) requires a dedicated high-current gate driver IC (e.g. TC4420, UCC27517) rather than direct microcontroller GPIO pins.`,
    });
  }

  return {
    primaryValue: rgExternal,
    formattedValue: formatQuantity(rgExternal, 'resistance'),
    unit: 'Ω',
    label: 'Estimated External Gate Resistor (R_g)',
    standardValue: e24,
    powerDissipation: {
      watts: pGate,
      formatted: formatQuantity(pGate, 'power'),
      suggestedRating: `${formatQuantity(pGate * 2, 'power')} total gate loop drive power at ${formatQuantity(fsw, 'frequency')}`,
    },
    warnings,
    steps,
    additionalOutputs: {
      peakGateCurrent: {
        label: 'Peak Gate Drive Current',
        value: formatQuantity(iPeak, 'current'),
        unit: 'A',
      },
      averageGateCurrent: {
        label: 'Average Transition Current',
        value: formatQuantity(iGateAvg, 'current'),
        unit: 'A',
      },
      gateDrivePower: {
        label: `Gate Drive Power (at ${formatQuantity(fsw, 'frequency')})`,
        value: formatQuantity(pGate, 'power'),
        unit: 'W',
      },
      loopResistance: {
        label: 'Total Gate Loop Resistance',
        value: formatQuantity(rTotal, 'resistance'),
        unit: 'Ω',
      },
    },
    visualData: {
      Qg,
      Vdrv,
      tSw,
      Rdrv,
      rgExternal,
      iGateAvg,
      iPeak,
      pGate,
      fsw,
    },
  };
}

export interface MosfetConductionInputs {
  currentRms: number;           // Continuous / RMS Drain current (A)
  rdsOn25: number;              // Rds(on) at 25°C (Ohms, e.g. 0.02 for 20mΩ)
  operatingTempJunction?: number; // Tj (°C, default 100°C)
  tempCoeffPercentPerC?: number;// Temperature coefficient (%/°C, typical +0.4% to +0.8%/°C, default 0.6)
}

export function calculateMosfetConductionLoss(inputs: MosfetConductionInputs): CalculationResult {
  const { currentRms, rdsOn25, operatingTempJunction = 100, tempCoeffPercentPerC = 0.6 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const Irms = Number.isFinite(currentRms) && currentRms >= 0 ? currentRms : 10.0;
  const Rds25 = Number.isFinite(rdsOn25) && rdsOn25 > 0 ? rdsOn25 : 0.025;
  const Tj = Number.isFinite(operatingTempJunction) ? operatingTempJunction : 100;
  const alphaPct = Number.isFinite(tempCoeffPercentPerC) && tempCoeffPercentPerC >= 0 ? tempCoeffPercentPerC : 0.6;

  // Temperature adjustment: Rds(Tj) = Rds(25) * [1 + (alpha / 100) * (Tj - 25)]
  const tempFactor = 1 + (alphaPct / 100) * (Tj - 25);
  const rdsHot = Math.max(Rds25 * 0.5, Rds25 * tempFactor);

  // Conduction power: P_cond = Irms^2 * Rds(Tj)
  const pCond = Irms * Irms * rdsHot;
  const vDrop = Irms * rdsHot;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Temperature-Adjusted On-State Resistance',
    formula: 'R_ds(on)(T_j) = R_ds(on)(25°C) × [ 1 + α × (T_j - 25°C) ]',
    substitution: `R_ds(${Tj.toFixed(0)}°C) = ${formatQuantity(Rds25, 'resistance')} × [ 1 + (${alphaPct}%/°C) × (${Tj.toFixed(0)} - 25) ] = ${tempFactor.toFixed(2)}×`,
    result: formatQuantity(rdsHot, 'resistance'),
    annotation: 'Silicon and GaN/SiC MOSFETs have a positive temperature coefficient of resistance (PTC), increasing losses at elevated temperatures.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Static Conduction Power Loss',
    formula: 'P_cond = I_rms² × R_ds(on)(T_j)',
    substitution: `P_cond = (${formatQuantity(Irms, 'current')})² × ${formatQuantity(rdsHot, 'resistance')}`,
    result: formatQuantity(pCond, 'power'),
  });

  if (pCond > 5.0) {
    warnings.push({
      severity: 'warning',
      title: 'High Conduction Loss (>5W)',
      message: `MOSFET dissipates ${formatQuantity(pCond, 'power')}. Extensive PCB thermal vias or an external aluminum heatsink will be required.`,
    });
  }

  return {
    primaryValue: pCond,
    formattedValue: formatQuantity(pCond, 'power'),
    unit: 'W',
    label: 'MOSFET Conduction Loss (P_cond)',
    warnings,
    steps,
    additionalOutputs: {
      hotResistance: {
        label: `R_ds(on) at ${Tj.toFixed(0)}°C`,
        value: formatQuantity(rdsHot, 'resistance'),
        unit: 'Ω',
      },
      coldResistance: {
        label: 'R_ds(on) at 25°C Datasheet',
        value: formatQuantity(Rds25, 'resistance'),
        unit: 'Ω',
      },
      channelVoltageDrop: {
        label: 'Channel On-State Voltage Drop',
        value: formatQuantity(vDrop, 'voltage'),
        unit: 'V',
      },
      tempMultiplier: {
        label: 'Temperature Resistance Factor',
        value: `${tempFactor.toFixed(2)}× (+${((tempFactor - 1) * 100).toFixed(1)}%)`,
      },
    },
    visualData: {
      Irms,
      Rds25,
      rdsHot,
      Tj,
      tempFactor,
      pCond,
      vDrop,
    },
  };
}

export interface MosfetSwitchingInputs {
  busVoltage: number;       // Vds (V, e.g. 48V or 400V)
  loadCurrent: number;      // Id (A, e.g. 10A)
  riseTime: number;         // tr (seconds, e.g. 20ns = 20e-9)
  fallTime: number;         // tf (seconds, e.g. 25ns = 25e-9)
  switchingFreq: number;    // fsw (Hz, e.g. 100kHz = 100e3)
  rdsOnHot?: number;        // Optional Rds(on) to compute total loss
}

export function calculateMosfetSwitchingLoss(inputs: MosfetSwitchingInputs): CalculationResult {
  const { busVoltage, loadCurrent, riseTime, fallTime, switchingFreq, rdsOnHot } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const Vds = Number.isFinite(busVoltage) && busVoltage >= 0 ? busVoltage : 48.0;
  const Id = Number.isFinite(loadCurrent) && loadCurrent >= 0 ? loadCurrent : 10.0;
  const tr = Number.isFinite(riseTime) && riseTime > 0 ? riseTime : 20e-9;
  const tf = Number.isFinite(fallTime) && fallTime > 0 ? fallTime : 25e-9;
  const fsw = Number.isFinite(switchingFreq) && switchingFreq >= 0 ? switchingFreq : 100000;

  // Simplified linear overlap estimation model:
  // E_on ≈ 0.5 * Vds * Id * tr
  // E_off ≈ 0.5 * Vds * Id * tf
  // P_sw = (E_on + E_off) * f_sw = 0.5 * Vds * Id * (tr + tf) * f_sw
  const eOn = 0.5 * Vds * Id * tr;
  const eOff = 0.5 * Vds * Id * tf;
  const pSwOn = eOn * fsw;
  const pSwOff = eOff * fsw;
  const pSwTotal = pSwOn + pSwOff;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Turn-On & Turn-Off Switching Energies',
    formula: 'E_on ≈ ½ V_ds × I_d × t_r ;   E_off ≈ ½ V_ds × I_d × t_f',
    substitution: `E_on = ½ × ${formatQuantity(Vds, 'voltage')} × ${formatQuantity(Id, 'current')} × ${(tr * 1e9).toFixed(1)} ns = ${(eOn * 1e6).toFixed(2)} µJ ;   E_off = ${(eOff * 1e6).toFixed(2)} µJ`,
    result: `Total per-cycle energy E_sw = ${((eOn + eOff) * 1e6).toFixed(2)} µJ`,
    annotation: 'Simplified triangular V-I overlap model. Actual waveforms include diode reverse recovery (Qrr) and Coss output capacitance charging.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Average Dynamic Switching Power Dissipation',
    formula: 'P_sw = (E_on + E_off) × f_sw = ½ V_ds × I_d × (t_r + t_f) × f_sw',
    substitution: `P_sw = ${((eOn + eOff) * 1e6).toFixed(2)} µJ × ${formatQuantity(fsw, 'frequency')}`,
    result: formatQuantity(pSwTotal, 'power'),
  });

  let pCond = 0;
  if (rdsOnHot && rdsOnHot > 0) {
    pCond = Id * Id * rdsOnHot;
  }
  const pTotalCombined = pSwTotal + pCond;

  warnings.push({
    severity: 'info',
    title: 'First-Order Estimation Model Notice',
    message: 'This estimation uses the classic piecewise-linear V-I overlap approximation. High-voltage switching circuits also experience significant body-diode reverse recovery losses (P_rr = Q_rr × V_ds × f_sw) and Coss capacitive dumping losses.',
  });

  return {
    primaryValue: pSwTotal,
    formattedValue: formatQuantity(pSwTotal, 'power'),
    unit: 'W',
    label: 'MOSFET Switching Power Loss (P_sw)',
    warnings,
    steps,
    additionalOutputs: {
      turnOnPower: {
        label: 'Turn-On Loss (P_on)',
        value: formatQuantity(pSwOn, 'power'),
        unit: 'W',
      },
      turnOffPower: {
        label: 'Turn-Off Loss (P_off)',
        value: formatQuantity(pSwOff, 'power'),
        unit: 'W',
      },
      energyPerCycle: {
        label: 'Total Energy Lost Per Cycle',
        value: `${((eOn + eOff) * 1e6).toFixed(2)} µJ`,
      },
      combinedTotalLoss: {
        label: 'Total Loss (P_sw + P_cond)',
        value: formatQuantity(pTotalCombined, 'power'),
        unit: 'W',
      },
    },
    visualData: {
      Vds,
      Id,
      tr,
      tf,
      fsw,
      eOn,
      eOff,
      pSwOn,
      pSwOff,
      pSwTotal,
      pCond,
      pTotalCombined,
    },
  };
}
