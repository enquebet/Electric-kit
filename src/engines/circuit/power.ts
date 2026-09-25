import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity, formatSignificantFigures } from '../../lib/units/formatter';
import { checkCurrentSafety, checkPowerDissipationSafety, checkVoltageSafety } from '../../lib/safety/disclaimers';
import { recommendResistorPowerRating } from '../../lib/standards/e-series';

export interface PowerCalculationInputs {
  voltage?: number;
  current?: number;
  resistance?: number;
  timeHours?: number;
}

export function calculateElectricalPower(inputs: PowerCalculationInputs): CalculationResult {
  const { voltage: V, current: I, resistance: R, timeHours = 1 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let powerWatts = 0;
  let calcV = V;
  let calcI = I;
  let calcR = R;

  if (timeHours < 0) {
    warnings.push({
      severity: 'warning',
      title: 'Negative Time Duration',
      message: 'Time duration cannot be negative. Calculation evaluated using absolute duration.',
    });
  }
  const safeTimeHours = Math.abs(timeHours);

  if (V !== undefined && I !== undefined) {
    powerWatts = Math.abs(V * I);
    calcR = I !== 0 ? Math.abs(V / I) : Infinity;
    steps.push({
      stepNumber: 1,
      title: 'Calculate Active Power from Voltage and Current',
      formula: 'P = V × I',
      substitution: `P = ${V} V × ${I} A`,
      result: `${formatQuantity(powerWatts, 'power')}`,
    });
  } else if (I !== undefined && R !== undefined) {
    if (R < 0) {
      warnings.push({
        severity: 'danger',
        title: 'Negative Resistance',
        message: 'Passive linear resistors cannot have negative resistance. Magnitude used.',
      });
    }
    const absR = Math.abs(R);
    powerWatts = I * I * absR;
    calcV = Math.abs(I * absR);
    calcR = absR;
    steps.push({
      stepNumber: 1,
      title: 'Calculate Joule Heating / I²R Dissipation',
      formula: 'P = I² × R',
      substitution: `P = (${I} A)² × ${absR} Ω`,
      result: `${formatQuantity(powerWatts, 'power')}`,
    });
  } else if (V !== undefined && R !== undefined) {
    if (R < 0) {
      warnings.push({
        severity: 'danger',
        title: 'Negative Resistance',
        message: 'Passive linear resistors cannot have negative resistance. Magnitude used.',
      });
    }
    const absR = Math.abs(R);
    if (absR === 0) {
      if (V === 0) {
        powerWatts = 0;
        calcI = 0;
      } else {
        powerWatts = Infinity;
        calcI = Infinity;
        warnings.push({
          severity: 'danger',
          title: 'Zero Resistance Short Circuit',
          message: 'Applying voltage directly across zero resistance causes infinite current and instantaneous power dissipation.',
        });
      }
    } else {
      powerWatts = (V * V) / absR;
      calcI = Math.abs(V / absR);
      calcR = absR;
      steps.push({
        stepNumber: 1,
        title: 'Calculate Power Dissipation from Voltage and Resistance',
        formula: 'P = V² / R',
        substitution: `P = (${V} V)² / ${absR} Ω`,
        result: `${formatQuantity(powerWatts, 'power')}`,
      });
    }
  }

  // Energy consumed: E = P * t
  const energyJoules = Number.isFinite(powerWatts) ? powerWatts * (safeTimeHours * 3600) : Infinity;
  const energyWattHours = Number.isFinite(powerWatts) ? powerWatts * safeTimeHours : Infinity;
  const energyKwh = energyWattHours / 1000;

  steps.push({
    stepNumber: 2,
    title: 'Calculate Energy Consumed over Time',
    formula: 'E = P × t',
    substitution: `E = ${formatQuantity(powerWatts, 'power')} × ${safeTimeHours} hr`,
    result: Number.isFinite(energyWattHours) ? `${formatQuantity(energyWattHours, 'energy', 'Wh')} (${energyKwh.toFixed(4)} kWh)` : '∞ Wh',
  });

  if (calcV && Number.isFinite(calcV)) {
    const vWarn = checkVoltageSafety(calcV);
    if (vWarn) warnings.push(vWarn);
  }
  if (calcI && Number.isFinite(calcI)) {
    const iWarn = checkCurrentSafety(calcI);
    if (iWarn) warnings.push(iWarn);
  }
  if (Number.isFinite(powerWatts)) {
    const pWarn = checkPowerDissipationSafety(powerWatts);
    if (pWarn) warnings.push(pWarn);
  }

  const powerRecommendation = Number.isFinite(powerWatts) ? recommendResistorPowerRating(powerWatts) : { suggestedRating: 'N/A (Short circuit)', note: 'Infinite dissipation', watts: Infinity, formatted: '∞ W' };

  return {
    primaryValue: powerWatts,
    formattedValue: formatQuantity(powerWatts, 'power'),
    unit: 'W',
    label: 'Dissipated Power (P)',
    powerDissipation: {
      watts: powerWatts,
      formatted: formatQuantity(powerWatts, 'power'),
      suggestedRating: powerRecommendation.suggestedRating,
      warning: powerRecommendation.note,
    },
    warnings,
    steps,
    additionalOutputs: {
      joules: {
        label: 'Energy (Joules)',
        value: Number.isFinite(energyJoules) ? formatQuantity(energyJoules, 'energy', 'J') : '∞ J',
      },
      wattHours: {
        label: 'Energy (Wh)',
        value: Number.isFinite(energyWattHours) ? `${formatSignificantFigures(energyWattHours, 4)} Wh` : '∞ Wh',
      },
      kilowattHours: {
        label: 'Energy (kWh)',
        value: Number.isFinite(energyKwh) ? `${formatSignificantFigures(energyKwh, 4)} kWh` : '∞ kWh',
      },
      voltage: {
        label: 'Voltage (V)',
        value: calcV !== undefined ? formatQuantity(calcV, 'voltage') : '—',
      },
      current: {
        label: 'Current (I)',
        value: calcI !== undefined ? (Number.isFinite(calcI) ? formatQuantity(calcI, 'current') : '∞ A (Short circuit)') : '—',
      },
      equivalentResistance: {
        label: 'Calculated Resistance (R)',
        value: calcR !== undefined ? (Number.isFinite(calcR) ? formatQuantity(calcR, 'resistance') : '∞ Ω (Open circuit)') : '—',
      },
    },
    visualData: {
      powerWatts: Number.isFinite(powerWatts) ? powerWatts : 9999,
      calcV: calcV || 0,
      calcI: calcI || 0,
      timeHours: safeTimeHours,
      energyWattHours: Number.isFinite(energyWattHours) ? energyWattHours : 0,
      energyKwh: Number.isFinite(energyKwh) ? energyKwh : 0,
    },
  };
}
