import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { findStandardValueMatch, recommendResistorPowerRating } from '../../lib/standards/e-series';
import { formatQuantity } from '../../lib/units/formatter';
import { checkCurrentSafety, checkPowerDissipationSafety, checkVoltageSafety } from '../../lib/safety/disclaimers';

export interface OhmsLawInputs {
  voltage?: number; // Volts
  current?: number; // Amperes
  resistance?: number; // Ohms
  power?: number; // Watts
}

export function calculateOhmsLaw(inputs: OhmsLawInputs): CalculationResult {
  const { voltage: V, current: I, resistance: R, power: P } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let calcV = V;
  let calcI = I;
  let calcR = R;
  let calcP = P;

  let primaryLabel = 'Result';
  let primaryValue = 0;
  let primaryUnit = '';

  // Determine mode based on which 2 variables are provided
  if (V !== undefined && I !== undefined && V !== null && I !== null) {
    // V & I known
    calcV = V;
    calcI = I;
    if (V < 0 || I < 0) {
      warnings.push({
        severity: 'warning',
        title: 'Negative Polarity Input',
        message: 'DC potential or current has negative polarity. Evaluated as absolute magnitude for passive resistance calculation.',
      });
    }
    if (I === 0) {
      calcR = Infinity;
      calcP = 0;
      warnings.push({
        severity: 'info',
        title: 'Open Circuit Detected',
        message: 'With zero current flowing through a potential difference, equivalent resistance is infinite (open circuit).',
      });
    } else {
      calcR = Math.abs(V / I);
      calcP = Math.abs(V * I);
    }
    primaryLabel = 'Resistance (R)';
    primaryValue = calcR;
    primaryUnit = 'Ω';

    steps.push({
      stepNumber: 1,
      title: 'Calculate Resistance via Ohm\'s Law',
      formula: 'R = V / I',
      substitution: `R = ${V} V / ${I} A`,
      result: Number.isFinite(calcR) ? `${formatQuantity(calcR, 'resistance')}` : '∞ Ω (Open circuit)',
    });
    steps.push({
      stepNumber: 2,
      title: 'Calculate Power Dissipation',
      formula: 'P = V × I',
      substitution: `P = ${V} V × ${I} A`,
      result: `${formatQuantity(calcP, 'power')}`,
    });
  } else if (V !== undefined && R !== undefined && V !== null && R !== null) {
    // V & R known
    calcV = V;
    calcR = R;
    if (R < 0) {
      warnings.push({
        severity: 'danger',
        title: 'Negative Resistance Not Permitted',
        message: 'Passive linear DC components cannot have negative resistance. Calculations use magnitude.',
      });
      calcR = Math.abs(R);
    }

    if (calcR === 0) {
      if (V === 0) {
        calcI = 0;
        calcP = 0;
      } else {
        calcI = Infinity;
        calcP = Infinity;
        warnings.push({
          severity: 'danger',
          title: 'Zero Resistance Short Circuit',
          message: 'Zero resistance across a non-zero voltage source causes infinite short-circuit current (I = ∞), leading to instantaneous conductor fuse failure or thermal runaway.',
        });
      }
    } else {
      calcI = V / calcR;
      calcP = (V * V) / calcR;
    }
    primaryLabel = 'Current (I)';
    primaryValue = calcI;
    primaryUnit = 'A';

    steps.push({
      stepNumber: 1,
      title: 'Calculate Current via Ohm\'s Law',
      formula: 'I = V / R',
      substitution: `I = ${V} V / ${calcR} Ω`,
      result: Number.isFinite(calcI) ? `${formatQuantity(calcI, 'current')}` : '∞ A (Short Circuit)',
    });
    steps.push({
      stepNumber: 2,
      title: 'Calculate Power Dissipation',
      formula: 'P = V² / R',
      substitution: `P = (${V} V)² / ${calcR} Ω`,
      result: Number.isFinite(calcP) ? `${formatQuantity(calcP, 'power')}` : '∞ W',
    });
  } else if (I !== undefined && R !== undefined && I !== null && R !== null) {
    // I & R known
    calcI = I;
    calcR = R;
    if (R < 0) {
      warnings.push({
        severity: 'danger',
        title: 'Negative Resistance Not Permitted',
        message: 'Passive linear DC components cannot have negative resistance. Calculations use magnitude.',
      });
      calcR = Math.abs(R);
    }
    calcV = I * calcR;
    calcP = I * I * calcR;
    primaryLabel = 'Voltage (V)';
    primaryValue = calcV;
    primaryUnit = 'V';

    steps.push({
      stepNumber: 1,
      title: 'Calculate Potential Difference via Ohm\'s Law',
      formula: 'V = I × R',
      substitution: `V = ${I} A × ${calcR} Ω`,
      result: `${formatQuantity(calcV, 'voltage')}`,
    });
    steps.push({
      stepNumber: 2,
      title: 'Calculate Power Dissipation',
      formula: 'P = I² × R',
      substitution: `P = (${I} A)² × ${calcR} Ω`,
      result: `${formatQuantity(calcP, 'power')}`,
    });
  } else if (P !== undefined && V !== undefined && P !== null && V !== null) {
    // P & V known
    calcP = P;
    calcV = V;
    if (P < 0) {
      warnings.push({
        severity: 'warning',
        title: 'Negative Power In DC Circuit',
        message: 'Power in a passive DC component cannot be negative. Calculation evaluated as absolute dissipative load.',
      });
      calcP = Math.abs(P);
    }

    if (V === 0) {
      calcI = 0;
      calcR = 0;
    } else if (calcP === 0) {
      calcI = 0;
      calcR = Infinity;
    } else {
      calcI = calcP / V;
      calcR = (V * V) / calcP;
    }
    primaryLabel = 'Current (I)';
    primaryValue = calcI;
    primaryUnit = 'A';

    steps.push({
      stepNumber: 1,
      title: 'Calculate Current from Power & Voltage',
      formula: 'I = P / V',
      substitution: `I = ${calcP} W / ${V} V`,
      result: `${formatQuantity(calcI, 'current')}`,
    });
    steps.push({
      stepNumber: 2,
      title: 'Calculate Resistance',
      formula: 'R = V² / P',
      substitution: `R = (${V} V)² / ${calcP} W`,
      result: Number.isFinite(calcR) ? `${formatQuantity(calcR, 'resistance')}` : '∞ Ω (Open circuit)',
    });
  } else if (P !== undefined && I !== undefined && P !== null && I !== null) {
    // P & I known
    calcP = P;
    calcI = I;
    if (P < 0) {
      warnings.push({
        severity: 'warning',
        title: 'Negative Power In DC Circuit',
        message: 'Power in a passive DC component cannot be negative. Calculation evaluated as absolute dissipative load.',
      });
      calcP = Math.abs(P);
    }

    if (I === 0) {
      calcV = 0;
      calcR = calcP === 0 ? Infinity : 0;
    } else {
      calcV = calcP / I;
      calcR = calcP / (I * I);
    }
    primaryLabel = 'Voltage (V)';
    primaryValue = calcV;
    primaryUnit = 'V';

    steps.push({
      stepNumber: 1,
      title: 'Calculate Voltage from Power & Current',
      formula: 'V = P / I',
      substitution: `V = ${calcP} W / ${I} A`,
      result: `${formatQuantity(calcV, 'voltage')}`,
    });
    steps.push({
      stepNumber: 2,
      title: 'Calculate Resistance',
      formula: 'R = P / I²',
      substitution: `R = ${calcP} W / (${I} A)²`,
      result: Number.isFinite(calcR) ? `${formatQuantity(calcR, 'resistance')}` : '∞ Ω',
    });
  } else if (P !== undefined && R !== undefined && P !== null && R !== null) {
    // P & R known
    calcP = P;
    calcR = R;
    if (P < 0 || R < 0) {
      warnings.push({
        severity: 'danger',
        title: 'Negative Power or Resistance',
        message: 'Cannot compute square root of negative power or resistance. Magnitudes used.',
      });
      calcP = Math.abs(P);
      calcR = Math.abs(R);
    }

    if (calcR === 0) {
      calcV = 0;
      calcI = calcP > 0 ? Infinity : 0;
    } else {
      calcV = Math.sqrt(calcP * calcR);
      calcI = Math.sqrt(calcP / calcR);
    }
    primaryLabel = 'Voltage (V)';
    primaryValue = calcV;
    primaryUnit = 'V';

    steps.push({
      stepNumber: 1,
      title: 'Calculate Voltage from Power & Resistance',
      formula: 'V = √(P × R)',
      substitution: `V = √(${calcP} W × ${calcR} Ω)`,
      result: `${formatQuantity(calcV, 'voltage')}`,
    });
    steps.push({
      stepNumber: 2,
      title: 'Calculate Current',
      formula: 'I = √(P / R)',
      substitution: `I = √(${calcP} W / ${calcR} Ω)`,
      result: Number.isFinite(calcI) ? `${formatQuantity(calcI, 'current')}` : '∞ A (Short Circuit)',
    });
  }

  // Safety evaluations
  if (calcV !== undefined) {
    const vWarn = checkVoltageSafety(calcV, false);
    if (vWarn) warnings.push(vWarn);
  }
  if (calcI !== undefined) {
    const iWarn = checkCurrentSafety(calcI);
    if (iWarn) warnings.push(iWarn);
  }
  if (calcP !== undefined) {
    const pWarn = checkPowerDissipationSafety(calcP);
    if (pWarn) warnings.push(pWarn);
  }

  const standardResistor =
    calcR !== undefined && calcR > 0 && Number.isFinite(calcR)
      ? findStandardValueMatch(calcR, 'E24')
      : undefined;

  const powerRecommendation =
    calcP !== undefined && calcP > 0 && Number.isFinite(calcP)
      ? recommendResistorPowerRating(calcP)
      : undefined;

  return {
    primaryValue,
    formattedValue:
      primaryUnit === 'Ω'
        ? formatQuantity(primaryValue, 'resistance')
        : primaryUnit === 'A'
        ? formatQuantity(primaryValue, 'current')
        : formatQuantity(primaryValue, 'voltage'),
    unit: primaryUnit,
    label: primaryLabel,
    standardValue: standardResistor,
    powerDissipation: powerRecommendation
      ? {
          watts: powerRecommendation.watts,
          formatted: powerRecommendation.formatted,
          suggestedRating: powerRecommendation.suggestedRating,
          warning: powerRecommendation.note,
        }
      : undefined,
    warnings,
    steps,
    additionalOutputs: {
      voltage: {
        label: 'Voltage (V)',
        value: calcV !== undefined ? formatQuantity(calcV, 'voltage') : '—',
      },
      current: {
        label: 'Current (I)',
        value: calcI !== undefined ? (Number.isFinite(calcI) ? formatQuantity(calcI, 'current') : '∞ A (Short circuit)') : '—',
      },
      resistance: {
        label: 'Resistance (R)',
        value: calcR !== undefined ? (Number.isFinite(calcR) ? formatQuantity(calcR, 'resistance') : '∞ Ω (Open circuit)') : '—',
      },
      power: {
        label: 'Power (P)',
        value: calcP !== undefined ? formatQuantity(calcP, 'power') : '—',
      },
    },
    visualData: {
      voltage: calcV || 0,
      current: calcI || 0,
      resistance: calcR || 0,
      power: calcP || 0,
    },
  };
}
