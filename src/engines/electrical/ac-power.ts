import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { checkCurrentSafety, checkVoltageSafety } from '../../lib/safety/disclaimers';

export interface AcPowerInputs {
  systemType: 'single-phase' | 'three-phase-wye' | 'three-phase-delta';
  voltageRms: number; // Volts RMS (Line-to-Neutral for 1-phase, Line-to-Line for 3-phase)
  currentRms: number; // Amperes RMS (Line current)
  powerFactor: number; // 0.0 to 1.0
  pfType: 'lagging' | 'leading'; // Lagging = Inductive, Leading = Capacitive
  frequencyHz?: number; // default 50 or 60 Hz
  targetPowerFactor?: number; // e.g. 0.95
}

export function calculateAcPower(inputs: AcPowerInputs): CalculationResult {
  const {
    systemType,
    voltageRms: V,
    currentRms: I,
    powerFactor: pf,
    pfType,
    frequencyHz = 60,
    targetPowerFactor = 0.95,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (V <= 0 || I <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Zero or Negative Voltage/Current',
      message: 'RMS voltage and line current must be positive non-zero values.',
    });
  }
  const safeV = Math.max(V, 0);
  const safeI = Math.max(I, 0);

  const isThreePhase = systemType !== 'single-phase';
  const multiplier = isThreePhase ? Math.sqrt(3) : 1.0;

  // Apparent Power S (VA)
  const apparentPowerVa = multiplier * safeV * safeI;

  // Active Power P (W)
  const clampedPf = Math.min(Math.max(pf, 0.0), 1.0);
  const activePowerW = apparentPowerVa * clampedPf;

  // Phase angle phi in radians and degrees
  const phiRad = Math.acos(clampedPf);
  const phiDeg = (phiRad * 180) / Math.PI;

  // Reactive Power Q (VAR)
  const sinPhi = Math.sin(phiRad);
  const reactivePowerVar = apparentPowerVa * sinPhi;

  // Power factor correction calculation to reach target PF (e.g. 0.95)
  let qCapacitorVar = 0;
  let capacitanceCorrectionFarads = 0;
  let capacitanceDeltaFarads = 0;

  if (clampedPf < targetPowerFactor && pfType === 'lagging' && safeV > 0 && frequencyHz > 0) {
    const targetPhiRad = Math.acos(Math.min(targetPowerFactor, 0.999));
    const targetQ = activePowerW * Math.tan(targetPhiRad);
    qCapacitorVar = Math.max(reactivePowerVar - targetQ, 0);

    const omega = 2 * Math.PI * frequencyHz;
    if (isThreePhase) {
      // 3-Phase: C_wye per phase = Q_c / (omega * V_LL^2)
      // C_delta per phase = Q_c / (3 * omega * V_LL^2)
      capacitanceCorrectionFarads = qCapacitorVar / (omega * safeV * safeV);
      capacitanceDeltaFarads = qCapacitorVar / (3 * omega * safeV * safeV);
    } else {
      capacitanceCorrectionFarads = qCapacitorVar / (omega * safeV * safeV);
    }
  }

  steps.push({
    stepNumber: 1,
    title: `Calculate Apparent Power S (${isThreePhase ? '3-Phase: S = √3 × V_L × I_L' : 'Single-Phase: S = V × I'})`,
    formula: isThreePhase ? 'S = √3 × V_L × I_L' : 'S = V × I',
    substitution: isThreePhase
      ? `√3 × ${V} V × ${I} A = 1.732 × ${V} × ${I}`
      : `${V} V × ${I} A`,
    result: `${formatQuantity(apparentPowerVa, 'apparent_power')}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Active Power (Real Work Done)',
    formula: 'P = S × cos(φ) = S × PF',
    substitution: `${formatQuantity(apparentPowerVa, 'apparent_power')} × ${clampedPf.toFixed(3)}`,
    result: `${formatQuantity(activePowerW, 'power')} (${(activePowerW / 1000).toFixed(3)} kW)`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Reactive Power & Phase Angle',
    formula: 'Q = S × sin(φ) = √(S² - P²);  φ = arccos(PF)',
    substitution: `${formatQuantity(apparentPowerVa, 'apparent_power')} × sin(${phiDeg.toFixed(1)}°)`,
    result: `${formatQuantity(reactivePowerVar, 'reactive_power')} (${pfType.toUpperCase()})`,
  });

  if (qCapacitorVar > 0) {
    steps.push({
      stepNumber: 4,
      title: `Power Factor Correction Capacitor Bank (Target PF: ${targetPowerFactor})`,
      formula: 'Q_c = P × [ tan(φ₁) - tan(φ₂) ];  C = Q_c / (2π × f × V²)',
      substitution: `Correction required: ${formatQuantity(qCapacitorVar, 'reactive_power')} at ${frequencyHz} Hz`,
      result: `${formatQuantity(capacitanceCorrectionFarads, 'capacitance')} total bank`,
    });
  }

  // Safety checks
  const vWarn = checkVoltageSafety(V, true);
  if (vWarn) warnings.push(vWarn);
  const iWarn = checkCurrentSafety(I);
  if (iWarn) warnings.push(iWarn);

  if (clampedPf < 0.85) {
    warnings.push({
      severity: 'warning',
      title: 'Poor Power Factor Penalty Risk',
      message: `Power factor is ${clampedPf.toFixed(2)} (${pfType}). Utilities frequently impose substantial tariff surcharges for power factor below 0.85–0.90 due to excessive line current distribution losses. Adding power factor correction capacitors is strongly advised.`,
    });
  }

  return {
    primaryValue: activePowerW,
    formattedValue: formatQuantity(activePowerW, 'power'),
    unit: 'W',
    label: 'Real Active Power (P)',
    warnings,
    steps,
    additionalOutputs: {
      apparentPower: {
        label: 'Apparent Power (S)',
        value: formatQuantity(apparentPowerVa, 'apparent_power'),
        note: `${(apparentPowerVa / 1000).toFixed(2)} kVA`,
      },
      reactivePower: {
        label: 'Reactive Power (Q)',
        value: formatQuantity(reactivePowerVar, 'reactive_power'),
        note: `${pfType.toUpperCase()} (${(reactivePowerVar / 1000).toFixed(2)} kVAR)`,
      },
      phaseAngle: {
        label: 'Phase Angle (φ)',
        value: `${phiDeg.toFixed(1)}°`,
        note: `${(phiRad).toFixed(3)} radians`,
      },
      powerFactor: {
        label: 'Power Factor (cos φ)',
        value: `${clampedPf.toFixed(3)} (${pfType})`,
      },
      ...(qCapacitorVar > 0
        ? {
            pfcCapacitor: {
              label: isThreePhase ? `PFC Capacitor (Wye per phase)` : `Correction Capacitor to ${targetPowerFactor} PF`,
              value: formatQuantity(capacitanceCorrectionFarads, 'capacitance'),
              note: isThreePhase ? `Delta config: ${formatQuantity(capacitanceDeltaFarads, 'capacitance')}/phase` : `Reactive relief: ${formatQuantity(qCapacitorVar, 'reactive_power')}`,
            },
          }
        : {}),
    },
    visualData: {
      systemType,
      V,
      I,
      pf: clampedPf,
      pfType,
      activePowerW,
      apparentPowerVa,
      reactivePowerVar,
      phiDeg,
      qCapacitorVar,
      capacitanceCorrectionFarads,
    },
  };
}
