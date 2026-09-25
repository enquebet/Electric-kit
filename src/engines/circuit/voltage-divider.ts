import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { findStandardValueMatch, recommendResistorPowerRating } from '../../lib/standards/e-series';
import { formatQuantity } from '../../lib/units/formatter';
import { checkPowerDissipationSafety, checkVoltageSafety } from '../../lib/safety/disclaimers';

export interface VoltageDividerInputs {
  vin: number; // Volts
  r1: number; // Ohms
  r2: number; // Ohms
  loadResistance?: number; // Ohms (optional)
}

export function calculateVoltageDivider(inputs: VoltageDividerInputs): CalculationResult {
  const { vin, r1, r2, loadResistance: rLoad } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeR1 = Math.max(r1, 0);
  const safeR2 = Math.max(r2, 0);

  if (r1 <= 0 || r2 <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Zero or Negative Resistor Value',
      message: 'Both R1 and R2 must be positive non-zero resistances for linear division.',
    });
  }

  // Unloaded calculation
  const totalR_unloaded = safeR1 + safeR2;
  const ratio = totalR_unloaded > 0 ? safeR2 / totalR_unloaded : 0;
  const vout_unloaded = totalR_unloaded > 0 ? vin * ratio : 0;
  const current_unloaded = totalR_unloaded > 0 ? vin / totalR_unloaded : 0;
  const p_r1 = current_unloaded * current_unloaded * safeR1;
  const p_r2 = current_unloaded * current_unloaded * safeR2;
  const theveninR = totalR_unloaded > 0 ? (safeR1 * safeR2) / totalR_unloaded : 0;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Unloaded Divider Ratio & Output Voltage',
    formula: 'V_out = V_in × [ R₂ / (R₁ + R₂) ]',
    substitution: `V_out = ${vin} V × [ ${safeR2} Ω / (${safeR1} Ω + ${safeR2} Ω) ] = ${vin} V × ${ratio.toFixed(4)}`,
    result: `${formatQuantity(vout_unloaded, 'voltage')}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Determine Quiescent Current & Resistor Dissipations',
    formula: 'I_q = V_in / (R₁ + R₂);  P(R₁) = I_q² × R₁;  P(R₂) = I_q² × R₂',
    substitution: `I_q = ${vin} V / ${formatQuantity(totalR_unloaded, 'resistance')} = ${formatQuantity(current_unloaded, 'current')}`,
    result: `P(R₁) = ${formatQuantity(p_r1, 'power')}, P(R₂) = ${formatQuantity(p_r2, 'power')}`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Thévenin Equivalent Source Resistance',
    formula: 'R_th = R₁ ∥ R₂ = (R₁ × R₂) / (R₁ + R₂)',
    substitution: `R_th = (${safeR1} Ω × ${safeR2} Ω) / (${safeR1} Ω + ${safeR2} Ω)`,
    result: `${formatQuantity(theveninR, 'resistance')}`,
  });

  // Loaded calculation if RL is present
  let vout_loaded: number | undefined;
  let loadCurrent: number | undefined;
  let voltageSagPercent: number | undefined;

  if (rLoad !== undefined && rLoad >= 0) {
    if (rLoad === 0) {
      vout_loaded = 0;
      loadCurrent = safeR1 > 0 ? vin / safeR1 : Infinity;
      voltageSagPercent = vout_unloaded !== 0 ? 100 : 0;
      warnings.push({
        severity: 'danger',
        title: 'Output Node Direct Short Circuit',
        message: 'Load resistance is 0 Ω (direct ground fault). Output voltage collapses to 0 V; all current flows through R1.',
      });
    } else {
      const r2_effective = (safeR2 * rLoad) / (safeR2 + rLoad);
      const totalR_loaded = safeR1 + r2_effective;
      vout_loaded = totalR_loaded > 0 ? vin * (r2_effective / totalR_loaded) : 0;
      loadCurrent = vout_loaded / rLoad;
      voltageSagPercent = vout_unloaded !== 0 ? Math.max(((vout_unloaded - vout_loaded) / vout_unloaded) * 100, 0) : 0;

      steps.push({
        stepNumber: 4,
        title: 'Calculate Loaded Output Voltage (accounting for R_load)',
        formula: 'R₂_eff = (R₂ ∥ R_L); V_out(loaded) = V_in × [ R₂_eff / (R₁ + R₂_eff) ]',
        substitution: `R₂_eff = ${formatQuantity(r2_effective, 'resistance')}; V_out(loaded) = ${vin} V × (${formatQuantity(r2_effective, 'resistance')} / ${formatQuantity(totalR_loaded, 'resistance')})`,
        result: `${formatQuantity(vout_loaded, 'voltage')} (Voltage droop: ${voltageSagPercent.toFixed(1)}%)`,
      });

      if (voltageSagPercent > 5) {
        warnings.push({
          severity: 'warning',
          title: 'Significant Output Loading Sag',
          message: `Connecting R_load (${formatQuantity(rLoad, 'resistance')}) pulls the output down by ${voltageSagPercent.toFixed(1)}% (from ${formatQuantity(vout_unloaded, 'voltage')} to ${formatQuantity(vout_loaded, 'voltage')}). Consider using an op-amp unity-gain voltage follower (buffer) or lower divider resistances.`,
        });
      }
    }
  }

  // Safety checks
  const vInWarn = checkVoltageSafety(vin);
  if (vInWarn) warnings.push(vInWarn);
  const p1Warn = checkPowerDissipationSafety(p_r1);
  if (p1Warn) warnings.push({ ...p1Warn, title: `R1 ${p1Warn.title}` });
  const p2Warn = checkPowerDissipationSafety(p_r2);
  if (p2Warn) warnings.push({ ...p2Warn, title: `R2 ${p2Warn.title}` });

  const r1Standard = findStandardValueMatch(r1, 'E24');
  const r2Standard = findStandardValueMatch(r2, 'E24');
  const maxResistorPower = Math.max(p_r1, p_r2);
  const powerRec = recommendResistorPowerRating(maxResistorPower);

  return {
    primaryValue: vout_loaded ?? vout_unloaded,
    formattedValue: formatQuantity(vout_loaded ?? vout_unloaded, 'voltage'),
    unit: 'V',
    label: vout_loaded ? 'Loaded Output Voltage (V_out)' : 'Output Voltage (V_out)',
    standardValue: r1Standard,
    powerDissipation: {
      watts: maxResistorPower,
      formatted: formatQuantity(maxResistorPower, 'power'),
      suggestedRating: powerRec.suggestedRating,
      warning: powerRec.note,
    },
    warnings,
    steps,
    additionalOutputs: {
      ratio: {
        label: 'Transfer Ratio (V_out / V_in)',
        value: `${(ratio * 100).toFixed(2)}%`,
        note: `Factor: ${ratio.toFixed(4)}`,
      },
      thevenin: {
        label: 'Thévenin Resistance (R_th)',
        value: formatQuantity(theveninR, 'resistance'),
        note: 'Effective impedance seen by load',
      },
      quiescentCurrent: {
        label: 'Quiescent Current (I_q)',
        value: formatQuantity(current_unloaded, 'current'),
      },
      powerR1: {
        label: 'R1 Power Dissipation',
        value: formatQuantity(p_r1, 'power'),
        note: `Suggested: ${recommendResistorPowerRating(p_r1).suggestedRating}`,
      },
      powerR2: {
        label: 'R2 Power Dissipation',
        value: formatQuantity(p_r2, 'power'),
        note: `Suggested: ${recommendResistorPowerRating(p_r2).suggestedRating}`,
      },
      ...(vout_loaded !== undefined
        ? {
            voutUnloaded: {
              label: 'Unloaded V_out',
              value: formatQuantity(vout_unloaded, 'voltage'),
            },
            voltageDrop: {
              label: 'Load Sag Drop',
              value: `${voltageSagPercent?.toFixed(2)}%`,
            },
          }
        : {}),
    },
    visualData: {
      vin,
      r1,
      r2,
      vout: vout_loaded ?? vout_unloaded,
      vout_unloaded,
      rLoad,
      theveninR,
      r1Standard,
      r2Standard,
    },
  };
}
