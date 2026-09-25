import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';

export type ResistorColor =
  | 'black'
  | 'brown'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'violet'
  | 'gray'
  | 'white'
  | 'gold'
  | 'silver';

export interface ResistorBandInfo {
  name: string;
  color: ResistorColor;
  hex: string;
  textColor: string;
  digit?: number;
  multiplier?: number;
  tolerance?: number;
  tempco?: number; // ppm/K
}

export const RESISTOR_COLORS: Record<ResistorColor, ResistorBandInfo> = {
  black: { name: 'Black', color: 'black', hex: '#18181b', textColor: '#ffffff', digit: 0, multiplier: 1 },
  brown: { name: 'Brown', color: 'brown', hex: '#854d0e', textColor: '#ffffff', digit: 1, multiplier: 10, tolerance: 1, tempco: 100 },
  red: { name: 'Red', color: 'red', hex: '#dc2626', textColor: '#ffffff', digit: 2, multiplier: 100, tolerance: 2, tempco: 50 },
  orange: { name: 'Orange', color: 'orange', hex: '#ea580c', textColor: '#ffffff', digit: 3, multiplier: 1000, tempco: 15 },
  yellow: { name: 'Yellow', color: 'yellow', hex: '#eab308', textColor: '#000000', digit: 4, multiplier: 10000, tempco: 25 },
  green: { name: 'Green', color: 'green', hex: '#16a34a', textColor: '#ffffff', digit: 5, multiplier: 100000, tolerance: 0.5 },
  blue: { name: 'Blue', color: 'blue', hex: '#2563eb', textColor: '#ffffff', digit: 6, multiplier: 1000000, tolerance: 0.25, tempco: 10 },
  violet: { name: 'Violet', color: 'violet', hex: '#9333ea', textColor: '#ffffff', digit: 7, multiplier: 10000000, tolerance: 0.1, tempco: 5 },
  gray: { name: 'Gray', color: 'gray', hex: '#64748b', textColor: '#ffffff', digit: 8, multiplier: 100000000, tolerance: 0.05 },
  white: { name: 'White', color: 'white', hex: '#f8fafc', textColor: '#0f172a', digit: 9, multiplier: 1000000000 },
  gold: { name: 'Gold', color: 'gold', hex: '#d97706', textColor: '#000000', multiplier: 0.1, tolerance: 5 },
  silver: { name: 'Silver', color: 'silver', hex: '#94a3b8', textColor: '#000000', multiplier: 0.01, tolerance: 10 },
};

export interface ResistorColorInputs {
  bandCount: 4 | 5 | 6;
  band1: ResistorColor;
  band2: ResistorColor;
  band3: ResistorColor; // In 4-band: multiplier. In 5/6-band: 3rd digit.
  band4: ResistorColor; // In 4-band: tolerance. In 5/6-band: multiplier.
  band5?: ResistorColor; // In 5/6-band: tolerance.
  band6?: ResistorColor; // In 6-band: temp coefficient.
}

export function calculateResistorFromColor(inputs: ResistorColorInputs): CalculationResult {
  const { bandCount, band1, band2, band3, band4, band5, band6 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let resistanceOhms = 0;
  let tolerancePercent = 5;
  let tempcoPpm: number | undefined = undefined;

  const b1 = RESISTOR_COLORS[band1];
  const b2 = RESISTOR_COLORS[band2];

  if (bandCount === 4) {
    const digit1 = b1.digit ?? 0;
    const digit2 = b2.digit ?? 0;
    const b3Mult = RESISTOR_COLORS[band3].multiplier ?? 1;
    const b4Tol = RESISTOR_COLORS[band4].tolerance ?? 5;

    if (b1.digit === undefined || b2.digit === undefined) {
      warnings.push({
        severity: 'warning',
        title: 'Non-Digit Color in Significant Band',
        message: 'Gold and silver are reserved for multipliers/tolerances and are not standard digit bands under IEC 60062.',
      });
    }

    const baseDigits = digit1 * 10 + digit2;
    resistanceOhms = parseFloat((baseDigits * b3Mult).toPrecision(12));
    tolerancePercent = b4Tol;

    steps.push({
      stepNumber: 1,
      title: 'Decode Significant Digits',
      formula: 'Significant Digits = (Band 1 × 10) + Band 2',
      substitution: `(${digit1} × 10) + ${digit2} = ${baseDigits}`,
      result: `${baseDigits}`,
    });

    steps.push({
      stepNumber: 2,
      title: 'Apply Decade Multiplier',
      formula: 'R = Significant Digits × Multiplier',
      substitution: `${baseDigits} × ${b3Mult} = ${resistanceOhms} Ω`,
      result: `${formatQuantity(resistanceOhms, 'resistance')}`,
    });
  } else {
    // 5 or 6 bands
    const digit1 = b1.digit ?? 0;
    const digit2 = b2.digit ?? 0;
    const digit3 = RESISTOR_COLORS[band3].digit ?? 0;
    const b4Mult = RESISTOR_COLORS[band4].multiplier ?? 1;
    const b5Tol = band5 ? RESISTOR_COLORS[band5].tolerance ?? 1 : 1;

    if (b1.digit === undefined || b2.digit === undefined || RESISTOR_COLORS[band3].digit === undefined) {
      warnings.push({
        severity: 'warning',
        title: 'Non-Digit Color in Significant Band',
        message: 'Gold and silver are reserved for multipliers/tolerances and are not standard digit bands under IEC 60062.',
      });
    }

    const baseDigits = digit1 * 100 + digit2 * 10 + digit3;
    resistanceOhms = parseFloat((baseDigits * b4Mult).toPrecision(12));
    tolerancePercent = b5Tol;

    if (bandCount === 6 && band6) {
      tempcoPpm = RESISTOR_COLORS[band6].tempco;
    }

    steps.push({
      stepNumber: 1,
      title: 'Decode 3 Significant Digits (Precision E96 Resistor)',
      formula: 'Significant Digits = (Band 1 × 100) + (Band 2 × 10) + Band 3',
      substitution: `(${digit1} × 100) + (${digit2} × 10) + ${digit3} = ${baseDigits}`,
      result: `${baseDigits}`,
    });

    steps.push({
      stepNumber: 2,
      title: 'Apply Decade Multiplier',
      formula: 'R = Significant Digits × Multiplier',
      substitution: `${baseDigits} × ${b4Mult} = ${resistanceOhms} Ω`,
      result: `${formatQuantity(resistanceOhms, 'resistance')}`,
    });
  }

  const toleranceMargin = resistanceOhms * (tolerancePercent / 100);
  const minR = resistanceOhms - toleranceMargin;
  const maxR = resistanceOhms + toleranceMargin;

  steps.push({
    stepNumber: 3,
    title: 'Calculate Tolerance Range Limits',
    formula: 'R_min = R × (1 - Tol);  R_max = R × (1 + Tol)',
    substitution: `${formatQuantity(resistanceOhms, 'resistance')} ± ${tolerancePercent}% (Δ = ${formatQuantity(toleranceMargin, 'resistance')})`,
    result: `[ ${formatQuantity(minR, 'resistance')} ... ${formatQuantity(maxR, 'resistance')} ]`,
  });

  return {
    primaryValue: resistanceOhms,
    formattedValue: formatQuantity(resistanceOhms, 'resistance'),
    unit: 'Ω',
    label: 'Nominal Resistance',
    warnings,
    steps,
    additionalOutputs: {
      tolerance: {
        label: 'Tolerance',
        value: `±${tolerancePercent}%`,
        note: `Guaranteed range: ${formatQuantity(minR, 'resistance')} to ${formatQuantity(maxR, 'resistance')}`,
      },
      minVal: {
        label: 'Minimum Resistance',
        value: formatQuantity(minR, 'resistance'),
      },
      maxVal: {
        label: 'Maximum Resistance',
        value: formatQuantity(maxR, 'resistance'),
      },
      ...(tempcoPpm !== undefined
        ? {
            tempco: {
              label: 'Temperature Coefficient (TCR)',
              value: `${tempcoPpm} ppm/°C`,
              note: 'Thermal drift rate per degree Celsius',
            },
          }
        : {}),
    },
    visualData: {
      bandCount,
      bands: [
        RESISTOR_COLORS[band1],
        RESISTOR_COLORS[band2],
        RESISTOR_COLORS[band3],
        RESISTOR_COLORS[band4],
        ...(band5 ? [RESISTOR_COLORS[band5]] : []),
        ...(band6 ? [RESISTOR_COLORS[band6]] : []),
      ],
      resistanceOhms,
      tolerancePercent,
      tempcoPpm,
      minR,
      maxR,
    },
  };
}
