import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity, formatEngineeringNotation } from '../../lib/units/formatter';
import { snapToStandardE24 } from '../../lib/standards/e-series';
import { checkVoltageSafety, checkCurrentSafety } from '../../lib/safety/disclaimers';

export interface SeriesResistorInputs {
  resistors: number[]; // Base Ohms
  voltage?: number;    // Supply voltage (V)
  current?: number;    // Or total current (A)
}

export function calculateSeriesResistors(inputs: SeriesResistorInputs): CalculationResult {
  const { resistors, voltage, current } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const validResistors = (resistors.length > 0 ? resistors : [1000, 1000])
    .map(r => (Number.isFinite(r) && r >= 0 ? r : 0));

  // R_total = sum(R_i)
  const totalResistance = validResistors.reduce((sum, r) => sum + r, 0);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Equivalent Series Resistance',
    formula: 'R_total = R₁ + R₂ + ... + R_n',
    substitution: `R_total = ${validResistors.map(r => formatQuantity(r, 'resistance')).join(' + ')}`,
    result: formatQuantity(totalResistance, 'resistance'),
    annotation: 'In series circuits, current passes through each resistor sequentially, adding opposition directly.',
  });

  // Calculate current & voltage drops
  let I = 0;
  let V = 0;
  if (voltage !== undefined && Number.isFinite(voltage) && voltage > 0) {
    V = voltage;
    I = totalResistance > 0 ? V / totalResistance : Infinity;
  } else if (current !== undefined && Number.isFinite(current) && current > 0) {
    I = current;
    V = I * totalResistance;
  }

  const vSafety = checkVoltageSafety(V);
  if (vSafety) warnings.push(vSafety);
  const iSafety = checkCurrentSafety(I);
  if (iSafety) warnings.push(iSafety);

  if (totalResistance === 0 && V > 0) {
    warnings.push({
      severity: 'danger',
      title: 'Zero Resistance Dead Short',
      message: 'Total series resistance is 0 Ω across a voltage source, producing theoretical infinite current.',
    });
  }

  // Branch data
  const resistorBreakdown = validResistors.map((r, idx) => {
    const vDrop = I * r;
    const pDiss = Number.isFinite(I) ? I * I * r : 0;
    return {
      index: idx + 1,
      resistance: r,
      voltageDrop: vDrop,
      power: pDiss,
    };
  });

  const totalPower = Number.isFinite(I) ? I * I * totalResistance : 0;

  if (I > 0 && Number.isFinite(I)) {
    steps.push({
      stepNumber: 2,
      title: 'Calculate Loop Current',
      formula: 'I = V_supply / R_total',
      substitution: `I = ${formatQuantity(V, 'voltage')} / ${formatQuantity(totalResistance, 'resistance')}`,
      result: formatQuantity(I, 'current'),
    });

    steps.push({
      stepNumber: 3,
      title: 'Calculate Total Power Dissipation',
      formula: 'P_total = I² × R_total = V × I',
      substitution: `P_total = (${formatQuantity(I, 'current')})² × ${formatQuantity(totalResistance, 'resistance')}`,
      result: formatQuantity(totalPower, 'power'),
    });
  }

  const e24 = totalResistance > 0 && Number.isFinite(totalResistance)
    ? snapToStandardE24(totalResistance)
    : undefined;

  return {
    primaryValue: totalResistance,
    formattedValue: formatQuantity(totalResistance, 'resistance'),
    unit: 'Ω',
    label: 'Total Series Resistance (R_total)',
    standardValue: e24,
    powerDissipation: totalPower > 0 ? {
      watts: totalPower,
      formatted: formatQuantity(totalPower, 'power'),
      suggestedRating: `${formatQuantity(totalPower * 2, 'power')} (2.0× safety headroom)`,
    } : undefined,
    warnings,
    steps,
    additionalOutputs: {
      totalCurrent: {
        label: 'Loop Current',
        value: Number.isFinite(I) ? formatQuantity(I, 'current') : 'Infinity',
        unit: 'A',
      },
      totalVoltage: {
        label: 'Total Voltage Drop',
        value: formatQuantity(V, 'voltage'),
        unit: 'V',
      },
      totalPower: {
        label: 'Total Active Power',
        value: formatQuantity(totalPower, 'power'),
        unit: 'W',
      },
      resistorCount: {
        label: 'Resistors in Series',
        value: validResistors.length.toString(),
      },
    },
    visualData: {
      resistors: validResistors,
      totalResistance,
      voltage: V,
      current: I,
      totalPower,
      breakdown: resistorBreakdown,
    },
  };
}

export interface ParallelResistorInputs {
  resistors: number[]; // Base Ohms
  voltage?: number;    // Supply voltage (V)
  current?: number;    // Or total current (A)
}

export function calculateParallelResistors(inputs: ParallelResistorInputs): CalculationResult {
  const { resistors, voltage, current } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const validResistors = (resistors.length > 0 ? resistors : [1000, 1000])
    .map(r => (Number.isFinite(r) && r >= 0 ? r : 0));

  const hasShort = validResistors.some(r => r === 0);
  let totalResistance = 0;

  if (hasShort) {
    totalResistance = 0;
    warnings.push({
      severity: 'danger',
      title: 'Short Circuit Branch Detected',
      message: 'One of the parallel branches has 0 Ω resistance. Equivalent parallel resistance collapses to 0 Ω.',
    });
  } else {
    const sumReciprocals = validResistors.reduce((sum, r) => sum + (1 / r), 0);
    totalResistance = sumReciprocals > 0 ? 1 / sumReciprocals : 0;
  }

  steps.push({
    stepNumber: 1,
    title: 'Calculate Equivalent Parallel Resistance',
    formula: '1 / R_eq = 1/R₁ + 1/R₂ + ... + 1/R_n',
    substitution: `1 / R_eq = ${validResistors.map(r => `1/${formatQuantity(r, 'resistance')}`).join(' + ')}`,
    result: formatQuantity(totalResistance, 'resistance'),
    annotation: 'Adding parallel paths always lowers total equivalent resistance below that of the smallest individual resistor.',
  });

  let V = 0;
  let I_total = 0;
  if (voltage !== undefined && Number.isFinite(voltage) && voltage > 0) {
    V = voltage;
    I_total = totalResistance > 0 ? V / totalResistance : (hasShort ? Infinity : 0);
  } else if (current !== undefined && Number.isFinite(current) && current > 0) {
    I_total = current;
    V = I_total * totalResistance;
  }

  const vSafety = checkVoltageSafety(V);
  if (vSafety) warnings.push(vSafety);
  const iSafety = checkCurrentSafety(I_total);
  if (iSafety) warnings.push(iSafety);

  const branchBreakdown = validResistors.map((r, idx) => {
    const iBranch = r > 0 ? V / r : (V > 0 ? Infinity : 0);
    const pBranch = r > 0 ? (V * V) / r : 0;
    return {
      index: idx + 1,
      resistance: r,
      current: iBranch,
      power: pBranch,
    };
  });

  const totalPower = V > 0 && Number.isFinite(I_total) ? V * I_total : 0;

  if (V > 0) {
    steps.push({
      stepNumber: 2,
      title: 'Calculate Total Current (Kirchhoff\'s Current Law)',
      formula: 'I_total = V / R_eq = ∑ I_branch',
      substitution: `I_total = ${formatQuantity(V, 'voltage')} / ${formatQuantity(totalResistance, 'resistance')}`,
      result: Number.isFinite(I_total) ? formatQuantity(I_total, 'current') : 'Infinity',
    });
  }

  const e24 = totalResistance > 0 && Number.isFinite(totalResistance)
    ? snapToStandardE24(totalResistance)
    : undefined;

  return {
    primaryValue: totalResistance,
    formattedValue: formatQuantity(totalResistance, 'resistance'),
    unit: 'Ω',
    label: 'Equivalent Parallel Resistance (R_eq)',
    standardValue: e24,
    powerDissipation: totalPower > 0 ? {
      watts: totalPower,
      formatted: formatQuantity(totalPower, 'power'),
      suggestedRating: `${formatQuantity(totalPower * 2, 'power')} (2.0× safety headroom)`,
    } : undefined,
    warnings,
    steps,
    additionalOutputs: {
      totalCurrent: {
        label: 'Total Supply Current',
        value: Number.isFinite(I_total) ? formatQuantity(I_total, 'current') : 'Infinity',
        unit: 'A',
      },
      supplyVoltage: {
        label: 'Bus Voltage',
        value: formatQuantity(V, 'voltage'),
        unit: 'V',
      },
      totalPower: {
        label: 'Total Power Dissipation',
        value: formatQuantity(totalPower, 'power'),
        unit: 'W',
      },
      resistorCount: {
        label: 'Parallel Branches',
        value: validResistors.length.toString(),
      },
    },
    visualData: {
      resistors: validResistors,
      equivalentResistance: totalResistance,
      voltage: V,
      totalCurrent: I_total,
      totalPower,
      breakdown: branchBreakdown,
    },
  };
}
