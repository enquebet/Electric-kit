import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { checkVoltageSafety, checkCurrentSafety } from '../../lib/safety/disclaimers';

export interface ThreePhasePowerInputs {
  lineVoltageV: number; // V_LL (Line-to-Line)
  lineCurrentA: number; // I_L
  powerFactor: number; // 0.0 to 1.0
  pfType: 'lagging' | 'leading';
  frequencyHz?: number;
}

export function calculateThreePhasePower(inputs: ThreePhasePowerInputs): CalculationResult {
  const { lineVoltageV: V_L, lineCurrentA: I_L, powerFactor, pfType, frequencyHz = 50 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (V_L <= 0 || I_L <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Zero or Negative Line Voltage / Current',
      message: 'Three-phase line-to-line voltage and line current must be positive non-zero values.',
    });
  }

  const safeV = Math.max(V_L, 1e-6);
  const safeI = Math.max(I_L, 0);
  const pf = Math.min(Math.max(powerFactor, 0.0), 1.0);

  // Apparent Power S = sqrt(3) * V_L * I_L
  const S_VA = Math.sqrt(3) * safeV * safeI;

  // Active Power P = S * PF
  const P_W = S_VA * pf;

  // Phase angle & Reactive Power Q = sqrt(S^2 - P^2)
  const phiRad = Math.acos(pf);
  const phiDeg = (phiRad * 180) / Math.PI;
  const Q_VAR = S_VA * Math.sin(phiRad);

  steps.push({
    stepNumber: 1,
    title: 'Calculate 3-Phase Apparent Power (S = √3 × V_L × I_L)',
    formula: 'S = √3 × V_L × I_L',
    substitution: `1.73205 × ${safeV} V × ${safeI} A`,
    result: `${formatQuantity(S_VA, 'apparent_power')} (${(S_VA / 1000).toFixed(2)} kVA)`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate 3-Phase Active Power (Real Work)',
    formula: 'P = √3 × V_L × I_L × cos(φ) = S × PF',
    substitution: `${formatQuantity(S_VA, 'apparent_power')} × ${pf.toFixed(3)}`,
    result: `${formatQuantity(P_W, 'power')} (${(P_W / 1000).toFixed(2)} kW)`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate 3-Phase Reactive Power (Magnetizing Field)',
    formula: 'Q = √(S² - P²) = S × sin(φ)',
    substitution: `√[(${S_VA.toFixed(0)} VA)² - (${P_W.toFixed(0)} W)²]`,
    result: `${formatQuantity(Q_VAR, 'reactive_power')} (${(Q_VAR / 1000).toFixed(2)} kVAR ${pfType})`,
  });

  const vWarn = checkVoltageSafety(V_L, true);
  if (vWarn) warnings.push(vWarn);
  const iWarn = checkCurrentSafety(I_L);
  if (iWarn) warnings.push(iWarn);

  return {
    primaryValue: P_W,
    formattedValue: formatQuantity(P_W, 'power'),
    unit: 'W',
    label: '3-Phase Active Power (P)',
    classification: 'THEORETICAL',
    standardsContext: 'Assumes balanced 3-phase positive sequence (ABC) sinusoidal voltages and balanced linear loads.',
    warnings,
    steps,
    additionalOutputs: {
      apparentPower: { label: 'Apparent Power (S)', value: `${(S_VA / 1000).toFixed(2)} kVA` },
      reactivePower: { label: 'Reactive Power (Q)', value: `${(Q_VAR / 1000).toFixed(2)} kVAR (${pfType})` },
      powerFactor: { label: 'Power Factor', value: `${pf.toFixed(3)} (${pfType})` },
      phaseAngle: { label: 'Phase Angle (φ)', value: `${phiDeg.toFixed(2)}°` },
      vPhase: { label: 'Phase Voltage (Star Equivalent V_LN)', value: `${(safeV / Math.sqrt(3)).toFixed(1)} V` },
      currentPerPhase: { label: 'Line Current (I_L)', value: `${safeI.toFixed(2)} A` },
    },
    visualData: {
      V_L: safeV,
      I_L: safeI,
      P_W,
      S_VA,
      Q_VAR,
      pf,
      phiDeg,
      frequencyHz,
    },
  };
}

export interface StarDeltaInputs {
  mode: 'star' | 'delta';
  lineVoltageV: number;
  phaseVoltageV?: number;
  lineCurrentA: number;
  phaseCurrentA?: number;
}

export function calculateStarDeltaRelationships(inputs: StarDeltaInputs): CalculationResult {
  const { mode, lineVoltageV, lineCurrentA } = inputs;
  const steps: CalculationStep[] = [];
  const warnings: EngineeringWarning[] = [];

  const sqrt3 = Math.sqrt(3);

  if (mode === 'star') {
    // Star (Wye): V_L = sqrt(3) * V_ph, I_L = I_ph
    const vPhase = lineVoltageV / sqrt3;
    const iPhase = lineCurrentA;

    steps.push({
      stepNumber: 1,
      title: 'Star (Wye) Voltage Relationship: V_L = √3 × V_ph',
      formula: 'V_ph = V_L / √3',
      substitution: `${lineVoltageV} V / 1.73205`,
      result: `V_ph = ${vPhase.toFixed(2)} V (Line-to-Neutral)`,
    });

    steps.push({
      stepNumber: 2,
      title: 'Star (Wye) Current Relationship: I_L = I_ph',
      formula: 'I_ph = I_L',
      substitution: `${lineCurrentA} A`,
      result: `I_ph = ${iPhase.toFixed(2)} A`,
    });

    return {
      primaryValue: vPhase,
      formattedValue: `${vPhase.toFixed(1)} V`,
      unit: 'V',
      label: 'Phase Voltage (V_phase / V_LN)',
      classification: 'THEORETICAL',
      standardsContext: 'Applicable to balanced symmetrical 3-phase 4-wire or 3-wire Star (Y) installations.',
      warnings,
      steps,
      additionalOutputs: {
        lineVoltage: { label: 'Line Voltage (V_LL)', value: `${lineVoltageV.toFixed(1)} V` },
        phaseVoltage: { label: 'Phase Voltage (V_LN)', value: `${vPhase.toFixed(1)} V` },
        lineCurrent: { label: 'Line Current (I_L)', value: `${lineCurrentA.toFixed(2)} A` },
        phaseCurrent: { label: 'Phase Winding Current (I_ph)', value: `${iPhase.toFixed(2)} A` },
        neutralCurrent: { label: 'Neutral Current (Balanced)', value: '0.00 A' },
      },
    };
  } else {
    // Delta: V_L = V_ph, I_L = sqrt(3) * I_ph
    const vPhase = lineVoltageV;
    const iPhase = lineCurrentA / sqrt3;

    steps.push({
      stepNumber: 1,
      title: 'Delta (Δ) Voltage Relationship: V_L = V_ph',
      formula: 'V_ph = V_L',
      substitution: `${lineVoltageV} V`,
      result: `V_ph = ${vPhase.toFixed(2)} V (Across each winding)`,
    });

    steps.push({
      stepNumber: 2,
      title: 'Delta (Δ) Current Relationship: I_L = √3 × I_ph',
      formula: 'I_ph = I_L / √3',
      substitution: `${lineCurrentA} A / 1.73205`,
      result: `I_ph = ${iPhase.toFixed(2)} A (Inside Delta winding)`,
    });

    return {
      primaryValue: iPhase,
      formattedValue: `${iPhase.toFixed(2)} A`,
      unit: 'A',
      label: 'Phase Current (I_phase in Δ winding)',
      classification: 'THEORETICAL',
      standardsContext: 'Applicable to balanced symmetrical 3-phase 3-wire Delta (Δ) installations.',
      warnings,
      steps,
      additionalOutputs: {
        lineVoltage: { label: 'Line Voltage (V_LL)', value: `${lineVoltageV.toFixed(1)} V` },
        phaseVoltage: { label: 'Phase Winding Voltage', value: `${vPhase.toFixed(1)} V` },
        lineCurrent: { label: 'Line Current (I_L)', value: `${lineCurrentA.toFixed(2)} A` },
        phaseCurrent: { label: 'Phase Current (I_ph)', value: `${iPhase.toFixed(2)} A` },
      },
    };
  }
}

export interface ThreePhasePfcInputs {
  activePowerKw: number;
  initialPf: number;
  targetPf: number;
  lineVoltageV: number;
  frequencyHz: number;
}

export function calculateThreePhasePfc(inputs: ThreePhasePfcInputs): CalculationResult {
  const { activePowerKw, initialPf, targetPf, lineVoltageV, frequencyHz } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const P_W = activePowerKw * 1000;
  const pf1 = Math.min(Math.max(initialPf, 0.1), 0.999);
  const pf2 = Math.min(Math.max(targetPf, pf1), 1.0);

  const phi1 = Math.acos(pf1);
  const phi2 = Math.acos(pf2);

  const tanPhi1 = Math.tan(phi1);
  const tanPhi2 = Math.tan(phi2);

  // Qc = P * (tan phi1 - tan phi2)
  const Qc_VAR = Math.max(P_W * (tanPhi1 - tanPhi2), 0);
  const omega = 2 * Math.PI * frequencyHz;

  // Delta Bank: C_delta = Qc / (3 * omega * V_L^2)
  const C_delta_Farads = Qc_VAR / (3 * omega * lineVoltageV * lineVoltageV);
  const C_delta_uF = C_delta_Farads * 1e6;

  // Star Bank: C_wye = Qc / (omega * V_L^2) = 3 * C_delta
  const C_wye_Farads = Qc_VAR / (omega * lineVoltageV * lineVoltageV);
  const C_wye_uF = C_wye_Farads * 1e6;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Required Reactive Compensation (Q_c)',
    formula: 'Q_c = P × [ tan(φ₁) - tan(φ₂) ]',
    substitution: `${activePowerKw} kW × [ tan(${((phi1 * 180) / Math.PI).toFixed(1)}°) - tan(${((phi2 * 180) / Math.PI).toFixed(1)}°) ]`,
    result: `${(Qc_VAR / 1000).toFixed(2)} kVAR reactive compensation`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Size Delta-Connected Capacitor Bank (Industrial Standard)',
    formula: 'C_Δ = Q_c / (3 × 2π × f × V_L²)',
    substitution: `${Qc_VAR.toFixed(0)} VAR / (3 × 2π × ${frequencyHz} × (${lineVoltageV} V)²)`,
    result: `${C_delta_uF.toFixed(1)} µF per phase (Rated for ${lineVoltageV} V_rms)`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Size Star (Wye)-Connected Capacitor Bank',
    formula: 'C_Y = Q_c / (2π × f × V_L²) = 3 × C_Δ',
    substitution: `${Qc_VAR.toFixed(0)} VAR / (2π × ${frequencyHz} × (${lineVoltageV} V)²)`,
    result: `${C_wye_uF.toFixed(1)} µF per phase (Rated for ${(lineVoltageV / Math.sqrt(3)).toFixed(0)} V_LN)`,
  });

  return {
    primaryValue: Qc_VAR / 1000,
    formattedValue: `${(Qc_VAR / 1000).toFixed(2)} kVAR`,
    unit: 'kVAR',
    label: 'Required 3-Phase Reactive Compensation (Q_c)',
    classification: 'THEORETICAL',
    standardsContext: 'Capacitor bank sizing at fundamental grid frequency. Real capacitor banks require detuning reactors (typically 5.67% or 7% series choke) if harmonic currents (5th, 7th) exceed THD-V limits.',
    warnings,
    steps,
    additionalOutputs: {
      compensationKvar: { label: 'Total Bank Rating', value: `${(Qc_VAR / 1000).toFixed(2)} kVAR` },
      deltaCapPerPhase: { label: 'Delta Bank Capacitance / Phase', value: `${C_delta_uF.toFixed(1)} µF (${lineVoltageV} V rating)` },
      wyeCapPerPhase: { label: 'Wye Bank Capacitance / Phase', value: `${C_wye_uF.toFixed(1)} µF (${(lineVoltageV / Math.sqrt(3)).toFixed(0)} V rating)` },
      initialCurrent: { label: 'Initial Mains Current', value: `${(P_W / (Math.sqrt(3) * lineVoltageV * pf1)).toFixed(1)} A` },
      improvedCurrent: { label: 'Compensated Mains Current', value: `${(P_W / (Math.sqrt(3) * lineVoltageV * pf2)).toFixed(1)} A` },
      currentReductionPercent: { label: 'Feeder Current Reduction', value: `${(((1 / pf1 - 1 / pf2) / (1 / pf1)) * 100).toFixed(1)}%` },
    },
    visualData: {
      Qc_kVAR: Qc_VAR / 1000,
      C_delta_uF,
      C_wye_uF,
      initialPf: pf1,
      targetPf: pf2,
      lineVoltageV,
      frequencyHz,
    },
  };
}
