import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { checkVoltageSafety, checkCurrentSafety } from '../../lib/safety/disclaimers';

export interface TransformerRatioInputs {
  primaryVoltageV: number;
  secondaryVoltageV: number;
  primaryTurns?: number;
  secondaryTurns?: number;
  secondaryCurrentA?: number;
}

export function calculateTransformerRatio(inputs: TransformerRatioInputs): CalculationResult {
  const { primaryVoltageV: V1, secondaryVoltageV: V2, primaryTurns: N1, secondaryTurns: N2 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (V1 <= 0 || V2 <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Zero or Negative Winding Voltage',
      message: 'Primary and secondary voltages must be positive non-zero values.',
    });
  }

  const safeV1 = Math.max(V1, 1e-6);
  const safeV2 = Math.max(V2, 1e-6);
  const turnsRatio = safeV1 / safeV2; // a = N1 / N2 = V1 / V2

  let n1Calc = N1;
  let n2Calc = N2;

  if (N1 !== undefined && N2 === undefined) {
    n2Calc = Math.round(N1 / turnsRatio);
  } else if (N2 !== undefined && N1 === undefined) {
    n1Calc = Math.round(N2 * turnsRatio);
  }

  const isStepDown = safeV1 > safeV2;
  const typeStr = isStepDown ? 'Step-Down' : safeV1 < safeV2 ? 'Step-Up' : '1:1 Isolation';

  steps.push({
    stepNumber: 1,
    title: 'Calculate Transformer Voltage & Turns Transformation Ratio',
    formula: 'a = N₁ / N₂ = V₁ / V₂',
    substitution: `${safeV1} V / ${safeV2} V`,
    result: `Ratio a = ${turnsRatio.toFixed(3)} : 1 (${typeStr})`,
  });

  if (n1Calc && n2Calc) {
    steps.push({
      stepNumber: 2,
      title: 'Winding Turns Verification',
      formula: 'N₂ = N₁ / a',
      substitution: `${n1Calc} turns / ${turnsRatio.toFixed(3)}`,
      result: `N₁ = ${n1Calc} turns, N₂ = ${n2Calc} turns`,
    });
  }

  const vWarn1 = checkVoltageSafety(V1, true);
  if (vWarn1) warnings.push(vWarn1);
  const vWarn2 = checkVoltageSafety(V2, true);
  if (vWarn2) warnings.push(vWarn2);

  return {
    primaryValue: turnsRatio,
    formattedValue: `${turnsRatio.toFixed(3)} : 1`,
    unit: 'ratio',
    label: 'Turns Ratio (a = N1/N2)',
    classification: 'THEORETICAL',
    standardsContext: 'Assumes ideal magnetic coupling (k = 1) with negligible leakage flux and zero winding resistance under no-load conditions.',
    warnings,
    steps,
    additionalOutputs: {
      type: { label: 'Transformer Type', value: typeStr },
      primaryVoltage: { label: 'Primary Voltage (V1)', value: `${safeV1} V` },
      secondaryVoltage: { label: 'Secondary Voltage (V2)', value: `${safeV2} V` },
      turnsRatioInv: { label: 'Inverse Ratio (N2/N1)', value: `${(1 / turnsRatio).toFixed(4)}` },
      ...(n1Calc ? { primaryTurns: { label: 'Primary Turns (N1)', value: `${n1Calc}` } } : {}),
      ...(n2Calc ? { secondaryTurns: { label: 'Secondary Turns (N2)', value: `${n2Calc}` } } : {}),
    },
    visualData: {
      V1: safeV1,
      V2: safeV2,
      turnsRatio,
      typeStr,
    },
  };
}

export interface TransformerCurrentInputs {
  primaryVoltageV: number;
  secondaryVoltageV: number;
  loadCurrentSecondaryA: number;
  apparentPowerVa?: number;
}

export function calculateTransformerCurrent(inputs: TransformerCurrentInputs): CalculationResult {
  const { primaryVoltageV: V1, secondaryVoltageV: V2, loadCurrentSecondaryA: I2 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeV1 = Math.max(V1, 1e-6);
  const safeV2 = Math.max(V2, 1e-6);
  const safeI2 = Math.max(I2, 0);

  // Ideal transformer: V1 * I1 = V2 * I2  =>  I1 = I2 * (V2 / V1)
  const I1 = safeI2 * (safeV2 / safeV1);
  const totalVa = safeV2 * safeI2;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Reflected Primary Current (Conservation of Power S₁ ≈ S₂)',
    formula: 'I₁ = I₂ × (V₂ / V₁)',
    substitution: `${safeI2} A × (${safeV2} V / ${safeV1} V)`,
    result: `I₁ = ${I1.toFixed(3)} A`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Operating Apparent Power VA',
    formula: 'S = V₂ × I₂ = V₁ × I₁',
    substitution: `${safeV2} V × ${safeI2} A`,
    result: `${formatQuantity(totalVa, 'apparent_power')} (${(totalVa / 1000).toFixed(2)} kVA)`,
  });

  const vWarn = checkVoltageSafety(V1, true);
  if (vWarn) warnings.push(vWarn);
  const iWarn1 = checkCurrentSafety(I1);
  if (iWarn1) warnings.push(iWarn1);
  const iWarn2 = checkCurrentSafety(I2);
  if (iWarn2) warnings.push(iWarn2);

  return {
    primaryValue: I1,
    formattedValue: `${I1.toFixed(2)} A`,
    unit: 'A',
    label: 'Primary Current (I1)',
    classification: 'THEORETICAL',
    standardsContext: 'Ideal transformer conservation model (S1 = S2). Does not account for no-load magnetizing excitation current (typically 1–3% of full load) or core losses.',
    warnings,
    steps,
    additionalOutputs: {
      primaryCurrent: { label: 'Primary Current (I1)', value: `${I1.toFixed(3)} A` },
      secondaryCurrent: { label: 'Secondary Current (I2)', value: `${safeI2.toFixed(3)} A` },
      apparentPower: { label: 'Apparent Power (S)', value: `${(totalVa / 1000).toFixed(3)} kVA` },
      currentRatio: { label: 'Current Ratio (I2 / I1)', value: (I1 > 0 ? (safeI2 / I1).toFixed(3) : '0') },
    },
  };
}

export interface TransformerLossInputs {
  ratedKva: number;
  coreLossWatts: number; // No-load iron losses
  fullLoadCopperLossWatts: number; // I²R winding losses at full load
  loadFraction: number; // 0.0 to 1.25 (e.g. 1.0 = 100% full load, 0.5 = 50%)
  powerFactor: number; // Load PF
}

export function calculateTransformerLosses(inputs: TransformerLossInputs): CalculationResult {
  const { ratedKva, coreLossWatts: P_core, fullLoadCopperLossWatts: P_cu_fl, loadFraction, powerFactor } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const k = Math.min(Math.max(loadFraction, 0), 2.0);
  const pf = Math.min(Math.max(powerFactor, 0.1), 1.0);

  // Copper loss scales with square of load: P_cu = k^2 * P_cu_fl
  const pCuActual = k * k * P_cu_fl;
  const totalLossesW = P_core + pCuActual;

  // Useful output power P_out = k * S_rated * PF
  const pOutWatts = k * ratedKva * 1000 * pf;
  const pInWatts = pOutWatts + totalLossesW;
  const efficiency = pInWatts > 0 ? (pOutWatts / pInWatts) * 100 : 0;

  // Maximum efficiency condition occurs when P_cu = P_core: k_max_eff = sqrt(P_core / P_cu_fl)
  const kMaxEff = P_cu_fl > 0 ? Math.sqrt(P_core / P_cu_fl) : 1.0;
  const pctLoadMaxEff = kMaxEff * 100;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Actual Copper Winding Loss (I²R Loss Scaling)',
    formula: 'P_cu = k² × P_cu(fl)',
    substitution: `(${k.toFixed(2)})² × ${P_cu_fl} W`,
    result: `${pCuActual.toFixed(1)} W`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Total Transformer Dissipation',
    formula: 'P_loss = P_core + P_cu',
    substitution: `${P_core} W (Core) + ${pCuActual.toFixed(1)} W (Copper)`,
    result: `${totalLossesW.toFixed(1)} W total heat dissipation`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Transformer Operating Efficiency',
    formula: 'η = P_out / (P_out + P_loss) × 100%',
    substitution: `${(pOutWatts / 1000).toFixed(2)} kW / (${(pOutWatts / 1000).toFixed(2)} kW + ${(totalLossesW / 1000).toFixed(3)} kW)`,
    result: `${efficiency.toFixed(2)}%`,
  });

  return {
    primaryValue: efficiency,
    formattedValue: `${efficiency.toFixed(2)}%`,
    unit: '%',
    label: 'Transformer Efficiency (η)',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Loss model based on standard open-circuit and short-circuit test parameters (IEC 60076 / IEEE C57). Core loss assumed invariant with load current.',
    warnings,
    steps,
    additionalOutputs: {
      totalLoss: { label: 'Total Losses', value: `${totalLossesW.toFixed(1)} W` },
      coreLoss: { label: 'Core / Iron Loss (Fixed)', value: `${P_core.toFixed(1)} W` },
      copperLoss: { label: 'Copper / Winding Loss (Variable)', value: `${pCuActual.toFixed(1)} W` },
      outputPower: { label: 'Useful Output Power', value: `${(pOutWatts / 1000).toFixed(2)} kW` },
      optimumEfficiencyLoad: { label: 'Max Efficiency Point', value: `${pctLoadMaxEff.toFixed(1)}% of rated load` },
    },
  };
}

export const calculateTransformerEfficiency = calculateTransformerLosses;

export interface TransformerLoadingInputs {
  ratedKva: number;
  secondaryVoltageV: number;
  loadCurrentA: number;
  circuitType?: 'single-phase' | 'three-phase';
}

export function calculateTransformerLoading(inputs: TransformerLoadingInputs): CalculationResult {
  const { ratedKva, secondaryVoltageV, loadCurrentA, circuitType = 'three-phase' } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const is3P = circuitType === 'three-phase';
  const operatingVa = is3P
    ? Math.sqrt(3) * secondaryVoltageV * loadCurrentA
    : secondaryVoltageV * loadCurrentA;

  const operatingKva = operatingVa / 1000;
  const loadingPct = ratedKva > 0 ? (operatingKva / ratedKva) * 100 : 0;

  const ratedCurrentA = is3P
    ? (ratedKva * 1000) / (Math.sqrt(3) * secondaryVoltageV)
    : (ratedKva * 1000) / secondaryVoltageV;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Transformer Apparent Operating Demand',
    formula: is3P ? 'S = √3 × V_L × I_L' : 'S = V × I',
    substitution: is3P
      ? `√3 × ${secondaryVoltageV} V × ${loadCurrentA} A`
      : `${secondaryVoltageV} V × ${loadCurrentA} A`,
    result: `${operatingKva.toFixed(2)} kVA demand`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Percentage Loading Utilization',
    formula: '%Load = (S_operating / S_rated) × 100%',
    substitution: `(${operatingKva.toFixed(2)} kVA / ${ratedKva} kVA) × 100%`,
    result: `${loadingPct.toFixed(1)}% loading`,
  });

  if (loadingPct > 100) {
    warnings.push({
      severity: 'danger',
      title: 'Transformer Overload Detected',
      message: `Operating load (${loadingPct.toFixed(1)}%) exceeds rated continuous nameplate capacity (${ratedKva} kVA). Severe thermal degradation and insulation aging risk.`,
    });
  }

  return {
    primaryValue: loadingPct,
    formattedValue: `${loadingPct.toFixed(1)}%`,
    unit: '%',
    label: 'Transformer Loading',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      operatingKva: { label: 'Operating Load S', value: `${operatingKva.toFixed(2)} kVA` },
      ratedKva: { label: 'Nameplate Rating', value: `${ratedKva} kVA` },
      ratedCurrentA: { label: 'Rated Secondary Current', value: `${ratedCurrentA.toFixed(1)} A` },
      operatingCurrentA: { label: 'Operating Load Current', value: `${loadCurrentA.toFixed(1)} A` },
    },
    visualData: {
      loadingPct,
      operatingKva,
      ratedKva,
    },
  };
}

export interface TransformerRegulationInputs {
  secondaryRatedVoltageV?: number;
  secondaryRatedCurrentA?: number;
  equivalentResistanceOhms?: number; // R_eq referred to secondary
  equivalentReactanceOhms?: number; // X_eq referred to secondary
  powerFactor?: number;
  pfType?: 'lagging' | 'leading';
  vNoLoad?: number;
  vFullLoad?: number;
}

export function calculateTransformerRegulation(inputs: TransformerRegulationInputs): CalculationResult {
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // Direct V_NL and V_FL mode
  if (inputs.vNoLoad !== undefined && inputs.vFullLoad !== undefined) {
    const vNL = inputs.vNoLoad;
    const vFL = Math.max(inputs.vFullLoad, 1e-6);
    const deltaV = vNL - vFL;
    const vrPercent = (deltaV / vFL) * 100;

    steps.push({
      stepNumber: 1,
      title: 'Calculate Transformer Voltage Regulation',
      formula: '%VR = (V_NL - V_FL) / V_FL × 100%',
      substitution: `(${vNL} V - ${vFL} V) / ${vFL} V × 100%`,
      result: `%VR = ${vrPercent.toFixed(2)}%`,
    });

    return {
      primaryValue: vrPercent,
      formattedValue: `${vrPercent.toFixed(2)}%`,
      unit: '%',
      label: 'Voltage Regulation (%VR)',
      classification: 'THEORETICAL',
      warnings,
      steps,
      additionalOutputs: {
        noLoadVoltage: { label: 'No-Load Voltage (V_NL)', value: `${vNL.toFixed(1)} V` },
        fullLoadVoltage: { label: 'Full-Load Voltage (V_FL)', value: `${vFL.toFixed(1)} V` },
        voltageDrop: { label: 'Winding Drop (ΔV)', value: `${deltaV.toFixed(2)} V` },
      },
    };
  }

  const V2 = inputs.secondaryRatedVoltageV ?? 230;
  const I2 = inputs.secondaryRatedCurrentA ?? 10;
  const Req = inputs.equivalentResistanceOhms ?? 0.1;
  const Xeq = inputs.equivalentReactanceOhms ?? 0.3;
  const powerFactor = inputs.powerFactor ?? 0.85;
  const pfType = inputs.pfType ?? 'lagging';

  const pf = Math.min(Math.max(powerFactor, 0.1), 1.0);
  const sinPhi = Math.sin(Math.acos(pf));
  const sign = pfType === 'lagging' ? +1 : -1;

  // Approximate voltage drop in winding: deltaV = I2 * (Req * cosPhi + sign * Xeq * sinPhi)
  const deltaV = I2 * (Req * pf + sign * Xeq * sinPhi);
  const vNoLoad = V2 + deltaV;
  const vrPercent = (deltaV / V2) * 100;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Approximate Winding Internal Voltage Drop',
    formula: 'ΔV ≈ I₂ × (R_eq × cos φ ± X_eq × sin φ)',
    substitution: `${I2} A × (${Req} Ω × ${pf.toFixed(2)} ${sign > 0 ? '+' : '-'} ${Xeq} Ω × ${sinPhi.toFixed(2)})`,
    result: `ΔV = ${deltaV.toFixed(2)} V`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Transformer Voltage Regulation Percentage',
    formula: '%VR = (V_no_load - V_full_load) / V_full_load × 100%',
    substitution: `(${vNoLoad.toFixed(1)} V - ${V2} V) / ${V2} V × 100%`,
    result: `%VR = ${vrPercent.toFixed(2)}%`,
  });

  return {
    primaryValue: vrPercent,
    formattedValue: `${vrPercent.toFixed(2)}%`,
    unit: '%',
    label: 'Voltage Regulation (%VR)',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Simplified Kapp-Kapp equivalent impedance model for single-phase transformers. For precise standards compliance, consult test certificate data per IEEE C57.12 / IEC 60076.',
    warnings,
    steps,
    additionalOutputs: {
      fullLoadVoltage: { label: 'Full Load Secondary Voltage (V_FL)', value: `${V2.toFixed(1)} V` },
      noLoadVoltage: { label: 'No Load Secondary Voltage (V_NL)', value: `${vNoLoad.toFixed(1)} V` },
      internalVoltageDrop: { label: 'Internal Voltage Drop (ΔV)', value: `${deltaV.toFixed(2)} V` },
      powerFactorNote: { label: 'Load Condition', value: `${pf.toFixed(2)} (${pfType.toUpperCase()})` },
    },
  };
}
