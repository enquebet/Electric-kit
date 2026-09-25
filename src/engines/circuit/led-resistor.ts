import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { findStandardValueMatch, recommendResistorPowerRating } from '../../lib/standards/e-series';
import { formatQuantity } from '../../lib/units/formatter';
import { checkPowerDissipationSafety, checkVoltageSafety } from '../../lib/safety/disclaimers';

export interface LedResistorInputs {
  supplyVoltage: number; // Volts
  ledForwardVoltage: number; // Volts
  ledCurrent: number; // Amperes (e.g. 0.02 for 20mA)
  seriesCount?: number; // Number of series LEDs (default 1)
}

export const COMMON_LED_PRESETS = [
  { name: 'Standard Red', vf: 2.0, defaultIf: 0.02, color: '#ef4444' },
  { name: 'Standard Green', vf: 2.2, defaultIf: 0.02, color: '#22c55e' },
  { name: 'High-Efficiency Green', vf: 3.2, defaultIf: 0.02, color: '#10b981' },
  { name: 'Yellow / Amber', vf: 2.1, defaultIf: 0.02, color: '#f59e0b' },
  { name: 'Blue (InGaN)', vf: 3.2, defaultIf: 0.02, color: '#3b82f6' },
  { name: 'Pure White (Phosphor)', vf: 3.2, defaultIf: 0.02, color: '#f8fafc' },
  { name: 'Ultra-Violet (UV 395nm)', vf: 3.6, defaultIf: 0.02, color: '#a855f7' },
  { name: 'Infrared (IR 940nm)', vf: 1.3, defaultIf: 0.05, color: '#991b1b' },
];

export function calculateLedResistor(inputs: LedResistorInputs): CalculationResult {
  const { supplyVoltage: Vs, ledForwardVoltage: Vf, ledCurrent: If, seriesCount = 1 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const totalLedVf = Vf * seriesCount;
  const vDropAcrossResistor = Vs - totalLedVf;

  if (vDropAcrossResistor <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Insufficient Supply Voltage',
      message: `Supply voltage (${Vs} V) is less than or equal to the total LED forward drop (${totalLedVf.toFixed(2)} V for ${seriesCount} LED${seriesCount > 1 ? 's' : ''}). The LEDs will not illuminate or forward bias. Increase supply voltage or reduce series count.`,
    });
  }

  if (If <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Invalid LED Current',
      message: 'LED target current must be positive and non-zero.',
    });
  }

  let idealResistance = vDropAcrossResistor > 0 && If > 0 ? vDropAcrossResistor / If : 0;
  if (!Number.isFinite(idealResistance)) idealResistance = 0;

  // Standard resistor recommendation
  const standardMatch = idealResistance > 0 ? findStandardValueMatch(idealResistance, 'E24') : undefined;
  const chosenResistor = standardMatch ? standardMatch.recommendedValue : idealResistance;

  // Actual current with recommended standard resistor: if supply < total forward drop, diode blocks (0 A)
  const actualCurrent = (vDropAcrossResistor > 0 && chosenResistor > 0) ? vDropAcrossResistor / chosenResistor : 0;
  const resistorPowerWatts = actualCurrent * actualCurrent * chosenResistor;
  const powerRec = recommendResistorPowerRating(resistorPowerWatts);

  // Efficiency
  const totalPower = Vs * actualCurrent;
  const usefulLedPower = totalLedVf * actualCurrent;
  const efficiencyPercent = totalPower > 0 ? (usefulLedPower / totalPower) * 100 : 0;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Voltage Drop Across Limiting Resistor',
    formula: 'V_R = V_supply - (N × V_forward)',
    substitution: `V_R = ${Vs} V - (${seriesCount} × ${Vf} V) = ${Vs} V - ${totalLedVf.toFixed(2)} V`,
    result: `${formatQuantity(Math.max(vDropAcrossResistor, 0), 'voltage')}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Ideal Ballast Resistance',
    formula: 'R_calc = V_R / I_target',
    substitution: `R_calc = ${formatQuantity(Math.max(vDropAcrossResistor, 0), 'voltage')} / ${formatQuantity(If, 'current')}`,
    result: `${formatQuantity(idealResistance, 'resistance')}`,
  });

  if (standardMatch) {
    steps.push({
      stepNumber: 3,
      title: 'Match with Standard E24 Resistor & Evaluate Actual Current',
      formula: 'I_actual = V_R / R_standard',
      substitution: `I_actual = ${formatQuantity(vDropAcrossResistor, 'voltage')} / ${standardMatch.formattedRecommended} (E24)`,
      result: `${formatQuantity(actualCurrent, 'current')} (Δ = ${If > 0 ? (((actualCurrent - If) / If) * 100).toFixed(1) : 0}%)`,
    });
  }

  steps.push({
    stepNumber: 4,
    title: 'Calculate Resistor Thermal Dissipation & Rating',
    formula: 'P_R = I_actual² × R_standard',
    substitution: `P_R = (${formatQuantity(actualCurrent, 'current')})² × ${formatQuantity(chosenResistor, 'resistance')}`,
    result: `${formatQuantity(resistorPowerWatts, 'power')} (Recommended: ${powerRec.suggestedRating})`,
  });

  // Safety checks
  const vWarn = checkVoltageSafety(Vs);
  if (vWarn) warnings.push(vWarn);
  const pWarn = checkPowerDissipationSafety(resistorPowerWatts);
  if (pWarn) warnings.push(pWarn);

  if (actualCurrent > 0.035) {
    warnings.push({
      severity: 'warning',
      title: 'High Continuous LED Current',
      message: `Operating current is ${formatQuantity(actualCurrent, 'current')}. Most standard 3mm/5mm through-hole and indicator SMD LEDs are rated for 20mA–30mA maximum continuous current. Exceeding this causes lumen depreciation and thermal failure.`,
    });
  }

  if (efficiencyPercent < 40 && vDropAcrossResistor > 0) {
    warnings.push({
      severity: 'info',
      title: 'Low Ballast Efficiency',
      message: `Efficiency is ${efficiencyPercent.toFixed(1)}% because ${formatQuantity(resistorPowerWatts, 'power')} is burned as pure heat in the resistor. For high-power LED strings, consider a switching buck constant-current LED driver IC.`,
    });
  }

  return {
    primaryValue: chosenResistor,
    formattedValue: formatQuantity(chosenResistor, 'resistance'),
    unit: 'Ω',
    label: 'Recommended Standard Resistor (E24)',
    standardValue: standardMatch,
    powerDissipation: {
      watts: resistorPowerWatts,
      formatted: formatQuantity(resistorPowerWatts, 'power'),
      suggestedRating: powerRec.suggestedRating,
      warning: powerRec.note,
    },
    warnings,
    steps,
    additionalOutputs: {
      calculatedExactR: {
        label: 'Exact Calculated Resistance',
        value: formatQuantity(idealResistance, 'resistance'),
      },
      recommendedResistor: {
        label: 'Recommended E24 Resistor',
        value: standardMatch ? standardMatch.formattedRecommended : formatQuantity(chosenResistor, 'resistance'),
        note: standardMatch ? `Deviation: ${standardMatch.deviationPercent > 0 ? '+' : ''}${standardMatch.deviationPercent}%` : '',
      },
      actualCurrent: {
        label: 'Actual Operating Current',
        value: formatQuantity(actualCurrent, 'current'),
      },
      resistorPower: {
        label: 'Resistor Dissipation',
        value: formatQuantity(resistorPowerWatts, 'power'),
        note: `Rating: ≥ ${powerRec.suggestedRating}`,
      },
      efficiency: {
        label: 'LDO/Ballast Efficiency',
        value: `${efficiencyPercent.toFixed(1)}%`,
        note: `${formatQuantity(usefulLedPower, 'power')} LED / ${formatQuantity(totalPower, 'power')} total`,
      },
    },
    visualData: {
      Vs,
      Vf,
      seriesCount,
      totalLedVf,
      vDropAcrossResistor,
      chosenResistor,
      actualCurrent,
      resistorPowerWatts,
    },
  };
}
