import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export type ConverterTopology = 'buck' | 'boost' | 'buck-boost' | 'flyback';

export interface MosfetVoltageStressInputs {
  topology?: ConverterTopology;
  maxInputVoltageV?: number;
  outputVoltageV?: number;
  peakOperatingVoltageV?: number;
  reflectedVoltageVorV?: number; // for flyback
  safetyMarginMultiplier?: number; // default 1.25 to 1.5
  safetyMarginPercent?: number; // e.g. 30 for 30%
}

export function calculateMosfetVoltageStress(inputs: MosfetVoltageStressInputs): CalculationResult {
  const {
    topology = 'buck',
    maxInputVoltageV: VinMax = 24,
    outputVoltageV: Vout = 12,
    peakOperatingVoltageV,
    reflectedVoltageVorV: Vor = 80,
    safetyMarginMultiplier,
    safetyMarginPercent,
  } = inputs;

  const margin = safetyMarginMultiplier ?? (safetyMarginPercent !== undefined ? 1 + safetyMarginPercent / 100 : 1.3);

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let vDsIdeal = 0;
  let formulaStr = '';
  let subStr = '';

  if (peakOperatingVoltageV !== undefined) {
    vDsIdeal = peakOperatingVoltageV;
    formulaStr = 'V_ds,ideal = V_peak';
    subStr = `${peakOperatingVoltageV} V`;
  } else {
    switch (topology) {
      case 'buck':
        vDsIdeal = VinMax;
        formulaStr = 'V_ds,ideal = V_in,max';
        subStr = `${VinMax} V`;
        break;
      case 'boost':
        vDsIdeal = Vout;
        formulaStr = 'V_ds,ideal = V_out';
        subStr = `${Vout} V`;
        break;
      case 'buck-boost':
        vDsIdeal = VinMax + Math.abs(Vout);
        formulaStr = 'V_ds,ideal = V_in,max + |V_out|';
        subStr = `${VinMax} V + ${Math.abs(Vout)} V`;
        break;
      case 'flyback':
        vDsIdeal = VinMax + Vor;
        formulaStr = 'V_ds,ideal = V_in,max + V_OR';
        subStr = `${VinMax} V + ${Vor} V`;
        break;
    }
  }

  const vDsRecommended = vDsIdeal * margin;

  warnings.push({
    severity: 'info',
    title: 'Parasitic Inductive Spikes',
    message: 'PCB trace loop inductance and device package parasitic inductances generate high dV/dt overshoot voltage spikes above theoretical steady-state levels.',
  });

  steps.push({
    stepNumber: 1,
    title: `Calculate Ideal Off-State V_ds Peak (${topology.toUpperCase()})`,
    formula: formulaStr,
    substitution: subStr,
    result: `Ideal V_ds,pk = ${vDsIdeal.toFixed(1)} V`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Apply Engineering De-rating & Safety Margin',
    formula: 'V_ds,rating ≥ Margin × V_ds,ideal',
    substitution: `${margin.toFixed(2)} × ${vDsIdeal.toFixed(1)} V`,
    result: `Recommended Rating ≥ ${vDsRecommended.toFixed(0)} V`,
  });

  return {
    primaryValue: vDsRecommended,
    formattedValue: `${vDsRecommended.toFixed(1)} V`,
    unit: 'V',
    label: 'Recommended MOSFET Rating (V_ds,rating)',
    classification: 'TOPOLOGY / DESIGN DEPENDENT',
    standardsContext: 'Topology-dependent switch voltage blocking requirement. Recommended 20-30% margin ensures survival against inductive kickback.',
    warnings,
    steps,
    additionalOutputs: {
      idealVoltageStress: { label: 'Ideal Peak V_ds', value: `${vDsIdeal.toFixed(1)} V` },
      recommendedRating: { label: 'Recommended Minimum Rating', value: `≥ ${vDsRecommended.toFixed(0)} V` },
      safetyMarginApplied: { label: 'Safety Factor', value: `${margin.toFixed(2)}×` },
      topologyType: { label: 'Converter Topology', value: topology.toUpperCase() },
    },
    visualData: {
      vDsIdeal,
      vDsRecommended,
      margin,
      topology,
    },
  };
}

export interface MosfetCurrentStressInputs {
  topology: ConverterTopology;
  dutyCycle: number;
  averageInductorCurrentA: number;
  rippleCurrentDeltaIA: number;
}

export function calculateMosfetCurrentStress(inputs: MosfetCurrentStressInputs): CalculationResult {
  const {
    topology,
    dutyCycle: D,
    averageInductorCurrentA: iLAvg,
    rippleCurrentDeltaIA: deltaI,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeD = Math.max(0.001, Math.min(D, 0.999));
  const safeIL = Math.max(iLAvg, 0.001);
  const safeDeltaI = Math.max(deltaI, 0);

  // Peak current:
  const iPeak = safeIL + safeDeltaI / 2;
  // Average switch current during entire period:
  const iAvg = safeD * safeIL;
  // RMS switch current:
  // I_rms = sqrt( D * [ I_L,avg^2 + (ΔI_L^2 / 12) ] )
  const iRms = Math.sqrt(safeD * (Math.pow(safeIL, 2) + Math.pow(safeDeltaI, 2) / 12));

  steps.push({
    stepNumber: 1,
    title: 'Calculate Peak Switch Turn-Off Current (I_peak)',
    formula: 'I_peak = I_L,avg + (ΔI_L / 2)',
    substitution: `${safeIL.toFixed(3)} A + (${safeDeltaI.toFixed(3)} A / 2)`,
    result: `I_peak = ${iPeak.toFixed(3)} A`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Switch Conduction RMS Current (I_sw,rms)',
    formula: 'I_sw,rms = √[ D × ( I_L,avg² + ΔI_L² / 12 ) ]',
    substitution: `√[ ${safeD.toFixed(3)} × ( (${safeIL.toFixed(3)} A)² + (${safeDeltaI.toFixed(3)} A)² / 12 ) ]`,
    result: `I_sw,rms = ${iRms.toFixed(3)} A`,
    annotation: 'Conduction I²R heating is strictly determined by this RMS value, not average current!',
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Average Switch Current (I_sw,avg)',
    formula: 'I_sw,avg = D × I_L,avg',
    substitution: `${safeD.toFixed(3)} × ${safeIL.toFixed(3)} A`,
    result: `I_sw,avg = ${iAvg.toFixed(3)} A`,
  });

  return {
    primaryValue: iRms,
    formattedValue: `${iRms.toFixed(3)} A RMS`,
    unit: 'A',
    label: 'MOSFET Conduction RMS Current',
    classification: 'TOPOLOGY / DESIGN DEPENDENT',
    warnings,
    steps,
    additionalOutputs: {
      rmsCurrent: { label: 'Conduction RMS Current (I_rms)', value: `${iRms.toFixed(3)} A` },
      peakCurrent: { label: 'Peak Switch Current (I_peak)', value: `${iPeak.toFixed(3)} A` },
      averageCurrent: { label: 'Average Switch Current (I_avg)', value: `${iAvg.toFixed(3)} A` },
      dutyCycle: { label: 'Duty Cycle', value: `${(safeD * 100).toFixed(1)}%` },
    },
    visualData: {
      iRms,
      iPeak,
      iAvg,
      safeD,
    },
  };
}

export interface MosfetConductionLossInputs {
  rmsCurrentA: number;
  rdsOnAt25mOhms: number; // mΩ
  junctionTemperatureC?: number;
  thermalCoefficientPercentPerC?: number; // e.g. 0.4% per °C
}

export function calculateMosfetConductionLoss(inputs: MosfetConductionLossInputs): CalculationResult {
  const {
    rmsCurrentA: iRms,
    rdsOnAt25mOhms: rds25mOhm,
    junctionTemperatureC: Tj = 100,
    thermalCoefficientPercentPerC: alphaPct = 0.4,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const rds25Ohms = rds25mOhm / 1000;
  // Elevated temperature Rds(on):
  // Rds(Tj) = Rds(25) * [ 1 + alpha * (Tj - 25) ]
  const deltaT = Math.max(Tj - 25, 0);
  const tempMultiplier = 1 + (alphaPct / 100) * deltaT;
  const rdsHotOhms = rds25Ohms * tempMultiplier;

  // P_cond = I_rms^2 * R_ds(hot)
  const pCondWatts = Math.pow(iRms, 2) * rdsHotOhms;

  if (Tj > 125) {
    warnings.push({
      severity: 'warning',
      title: 'High Junction Temperature',
      message: `Junction temperature (${Tj}°C) is close to silicon limit (150°C - 175°C). Rds(on) has increased by ${((tempMultiplier - 1) * 100).toFixed(0)}%.`,
    });
  }

  steps.push({
    stepNumber: 1,
    title: 'Calculate Temperature-Adjusted R_ds(on)',
    formula: 'R_ds(T_j) = R_ds(25°C) × [ 1 + α × (T_j - 25°C) ]',
    substitution: `${rds25mOhm} mΩ × [ 1 + ${(alphaPct / 100).toFixed(4)} × (${Tj}°C - 25°C) ] = ${rds25mOhm} mΩ × ${tempMultiplier.toFixed(2)}`,
    result: `R_ds(${Tj}°C) = ${(rdsHotOhms * 1000).toFixed(2)} mΩ`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Conduction Power Dissipation',
    formula: 'P_cond = I_rms² × R_ds(T_j)',
    substitution: `(${iRms.toFixed(3)} A)² × ${(rdsHotOhms * 1000).toFixed(2)} mΩ`,
    result: `P_cond = ${pCondWatts.toFixed(3)} W`,
  });

  return {
    primaryValue: pCondWatts,
    formattedValue: `${pCondWatts.toFixed(3)} W`,
    unit: 'W',
    label: 'MOSFET Conduction Loss (P_cond)',
    classification: 'COMPONENT-DATA DEPENDENT',
    warnings,
    steps,
    additionalOutputs: {
      conductionLoss: { label: 'Conduction Loss (P_cond)', value: `${pCondWatts.toFixed(3)} W` },
      hotRdsOn: { label: `R_ds(on) at ${Tj}°C`, value: `${(rdsHotOhms * 1000).toFixed(2)} mΩ` },
      ambientRdsOn: { label: 'R_ds(on) at 25°C', value: `${rds25mOhm.toFixed(2)} mΩ` },
      thermalDeratingFactor: { label: 'Resistance Multiplier', value: `${tempMultiplier.toFixed(2)}×` },
    },
    visualData: {
      pCondWatts,
      rdsHotOhms,
      tempMultiplier,
      iRms,
    },
  };
}

export interface MosfetSwitchingLossInputs {
  drainSourceVoltageV: number;
  drainCurrentA: number;
  riseTimeNs: number;
  fallTimeNs: number;
  switchingFrequencyHz: number;
}

export function calculateMosfetSwitchingLoss(inputs: MosfetSwitchingLossInputs): CalculationResult {
  const {
    drainSourceVoltageV: Vds,
    drainCurrentA: Id,
    riseTimeNs: trNs,
    fallTimeNs: tfNs,
    switchingFrequencyHz: fs,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const tr = Math.max(trNs, 0.1) * 1e-9;
  const tf = Math.max(tfNs, 0.1) * 1e-9;
  const safeFs = Math.max(fs, 100);

  // Linear overlap switching loss approximation:
  // P_sw,on ≈ 0.5 * Vds * Id * tr * fs
  // P_sw,off ≈ 0.5 * Vds * Id * tf * fs
  // Total P_sw ≈ 0.5 * Vds * Id * (tr + tf) * fs
  const pSwOn = 0.5 * Vds * Id * tr * safeFs;
  const pSwOff = 0.5 * Vds * Id * tf * safeFs;
  const pSwTotal = pSwOn + pSwOff;

  warnings.push({
    severity: 'info',
    title: 'Linear Overlap Approximation',
    message: 'Switching loss equation assumes linear simultaneous voltage fall/current rise. Actual loss depends strongly on parasitic Coss energy discharge (0.5 Coss V² fs) and gate drive impedance.',
  });

  steps.push({
    stepNumber: 1,
    title: 'Calculate Turn-On & Turn-Off Overlap Switching Energy',
    formula: 'E_on ≈ ½ × V_ds × I_d × t_r;  E_off ≈ ½ × V_ds × I_d × t_f',
    substitution: `½ × ${Vds} V × ${Id} A × ${trNs} ns  and  ½ × ${Vds} V × ${Id} A × ${tfNs} ns`,
    result: `E_on = ${(pSwOn / safeFs * 1e6).toFixed(2)} µJ,  E_off = ${(pSwOff / safeFs * 1e6).toFixed(2)} µJ`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Average Switching Power Loss',
    formula: 'P_sw = ½ × V_ds × I_d × (t_r + t_f) × f_s',
    substitution: `½ × ${Vds} V × ${Id} A × (${trNs + tfNs} ns) × ${safeFs} Hz`,
    result: `P_sw = ${pSwTotal.toFixed(3)} W`,
  });

  return {
    primaryValue: pSwTotal,
    formattedValue: `${pSwTotal.toFixed(3)} W`,
    unit: 'W',
    label: 'MOSFET Switching Loss (P_sw)',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Simplified hard-switching triangular V-I overlap approximation. Disregards output capacitance discharge (C_oss) and reverse recovery current spikes.',
    warnings,
    steps,
    additionalOutputs: {
      totalSwitchingLoss: { label: 'Total Switching Loss', value: `${pSwTotal.toFixed(3)} W` },
      turnOnLoss: { label: 'Turn-On Loss (P_sw,on)', value: `${pSwOn.toFixed(3)} W` },
      turnOffLoss: { label: 'Turn-Off Loss (P_sw,off)', value: `${pSwOff.toFixed(3)} W` },
      energyPerCycle: { label: 'Total Switching Energy', value: `${((pSwTotal / safeFs) * 1e6).toFixed(2)} µJ` },
    },
    visualData: {
      pSwTotal,
      pSwOn,
      pSwOff,
      trNs,
      tfNs,
    },
  };
}

export interface DiodeConductionLossInputs {
  averageCurrentA: number;
  forwardVoltageDropV: number;
}

export function calculateDiodeConductionLoss(inputs: DiodeConductionLossInputs): CalculationResult {
  const { averageCurrentA: Iavg, forwardVoltageDropV: Vf } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const pLossWatts = Iavg * Vf;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Diode Forward Conduction Power Loss',
    formula: 'P_cond = V_F × I_avg',
    substitution: `${Vf} V × ${Iavg.toFixed(3)} A`,
    result: `P_cond = ${pLossWatts.toFixed(3)} W`,
  });

  return {
    primaryValue: pLossWatts,
    formattedValue: `${pLossWatts.toFixed(3)} W`,
    unit: 'W',
    label: 'Diode Conduction Loss',
    classification: 'COMPONENT-DATA DEPENDENT',
    warnings,
    steps,
    additionalOutputs: {
      conductionLoss: { label: 'Conduction Loss (P_cond)', value: `${pLossWatts.toFixed(3)} W` },
      forwardDrop: { label: 'Forward Voltage (V_F)', value: `${Vf.toFixed(2)} V` },
      averageCurrent: { label: 'Average Forward Current', value: `${Iavg.toFixed(3)} A` },
    },
    visualData: {
      pLossWatts,
      Iavg,
      Vf,
    },
  };
}

export interface DiodeRecoveryLossInputs {
  reverseRecoveryChargeQrrNC?: number; // nanoCoulombs
  reverseRecoveryChargeQrrCoulombs?: number; // Coulombs
  reverseVoltageV: number;
  switchingFrequencyHz: number;
}

export function calculateDiodeRecoveryLoss(inputs: DiodeRecoveryLossInputs): CalculationResult {
  const {
    reverseRecoveryChargeQrrNC,
    reverseRecoveryChargeQrrCoulombs,
    reverseVoltageV: Vr,
    switchingFrequencyHz: fs,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const qrrNC = reverseRecoveryChargeQrrNC ?? (reverseRecoveryChargeQrrCoulombs !== undefined ? reverseRecoveryChargeQrrCoulombs * 1e9 : 50);
  const qrrCoulombs = Math.max(qrrNC, 0) * 1e-9;
  const safeFs = Math.max(fs, 100);

  // Approximate reverse recovery power loss:
  // P_rr ≈ Q_rr * V_R * f_s
  const pRrWatts = qrrCoulombs * Vr * safeFs;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Diode Reverse Recovery Loss (P_rr)',
    formula: 'P_rr = Q_rr × V_R × f_s',
    substitution: `${qrrNC} nC × ${Vr} V × ${safeFs} Hz`,
    result: `P_rr = ${pRrWatts.toFixed(3)} W`,
    annotation: 'Schottky barrier diodes have Q_rr ≈ 0 (majority carrier), virtually eliminating this loss compared to standard silicon diodes.',
  });

  return {
    primaryValue: pRrWatts,
    formattedValue: `${pRrWatts.toFixed(3)} W`,
    unit: 'W',
    label: 'Diode Reverse Recovery Loss (P_rr)',
    classification: 'COMPONENT-DATA DEPENDENT',
    warnings,
    steps,
    additionalOutputs: {
      recoveryLoss: { label: 'Reverse Recovery Loss', value: `${pRrWatts.toFixed(3)} W` },
      qrrValue: { label: 'Reverse Recovery Charge (Q_rr)', value: `${qrrNC.toFixed(1)} nC` },
      reverseVoltage: { label: 'Applied Reverse Voltage', value: `${Vr.toFixed(1)} V` },
    },
    visualData: {
      pRrWatts,
      qrrNC,
      Vr,
    },
  };
}
