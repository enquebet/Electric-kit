import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { checkCurrentSafety } from '../../lib/safety/disclaimers';

export interface SeriesInductorInputs {
  inductors: number[]; // Base Henries
  current?: number;    // Loop current (A)
}

export function calculateSeriesInductors(inputs: SeriesInductorInputs): CalculationResult {
  const { inductors, current = 0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const validInductors = (inductors.length > 0 ? inductors : [10e-3, 10e-3])
    .filter(l => Number.isFinite(l) && l >= 0);

  if (validInductors.length === 0) {
    validInductors.push(10e-3, 10e-3);
  }

  // L_eq = sum(L_i)
  const totalInductance = validInductors.reduce((sum, l) => sum + l, 0);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Equivalent Series Inductance',
    formula: 'L_eq = L₁ + L₂ + ... + L_n   (Assuming Mutual Coupling M = 0)',
    substitution: `L_eq = ${validInductors.map(l => formatQuantity(l, 'inductance')).join(' + ')}`,
    result: formatQuantity(totalInductance, 'inductance'),
    annotation: 'Inductances in series sum directly when uncoupled. If magnetic flux links coils, mutual inductance terms (±2M) apply.',
  });

  const I = Number.isFinite(current) && current >= 0 ? current : 0;
  const iSafety = checkCurrentSafety(I);
  if (iSafety) warnings.push(iSafety);

  const totalEnergy = 0.5 * totalInductance * I * I; // Joules

  if (I > 0) {
    steps.push({
      stepNumber: 2,
      title: 'Calculate Magnetic Stored Energy',
      formula: 'E_total = ½ L_eq × I²',
      substitution: `E_total = ½ × ${formatQuantity(totalInductance, 'inductance')} × (${formatQuantity(I, 'current')})²`,
      result: totalEnergy >= 1 ? `${totalEnergy.toFixed(3)} J` : `${(totalEnergy * 1000).toFixed(3)} mJ`,
    });
  }

  const breakdown = validInductors.map((l, idx) => {
    const e = 0.5 * l * I * I;
    return {
      index: idx + 1,
      inductance: l,
      current: I,
      energyJoules: e,
    };
  });

  return {
    primaryValue: totalInductance,
    formattedValue: formatQuantity(totalInductance, 'inductance'),
    unit: 'H',
    label: 'Total Series Inductance (L_eq)',
    warnings,
    steps,
    additionalOutputs: {
      totalEnergy: {
        label: 'Stored Magnetic Energy',
        value: totalEnergy >= 1 ? `${totalEnergy.toFixed(3)} J` : `${(totalEnergy * 1000).toFixed(3)} mJ`,
        unit: 'J',
      },
      loopCurrent: {
        label: 'Loop Current',
        value: formatQuantity(I, 'current'),
        unit: 'A',
      },
      inductorCount: {
        label: 'Inductors in Series',
        value: validInductors.length.toString(),
      },
    },
    visualData: {
      inductors: validInductors,
      equivalentInductance: totalInductance,
      current: I,
      totalEnergy,
      breakdown,
    },
  };
}

export interface ParallelInductorInputs {
  inductors: number[]; // Base Henries
  current?: number;    // Total supply current (A)
}

export function calculateParallelInductors(inputs: ParallelInductorInputs): CalculationResult {
  const { inductors, current = 0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const validInductors = (inductors.length > 0 ? inductors : [10e-3, 10e-3])
    .filter(l => Number.isFinite(l) && l > 0);

  if (validInductors.length === 0) {
    validInductors.push(10e-3, 10e-3);
  }

  // 1 / L_eq = sum(1 / L_i)
  const sumReciprocals = validInductors.reduce((sum, l) => sum + (1 / l), 0);
  const eqInductance = sumReciprocals > 0 ? 1 / sumReciprocals : 0;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Equivalent Parallel Inductance',
    formula: '1 / L_eq = 1/L₁ + 1/L₂ + ... + 1/L_n   (Assuming M = 0)',
    substitution: `1 / L_eq = ${validInductors.map(l => `1/${formatQuantity(l, 'inductance')}`).join(' + ')}`,
    result: formatQuantity(eqInductance, 'inductance'),
    annotation: 'Parallel inductors provide alternative magnetic flux paths; total inductance is smaller than the smallest branch.',
  });

  const I = Number.isFinite(current) && current >= 0 ? current : 0;
  const iSafety = checkCurrentSafety(I);
  if (iSafety) warnings.push(iSafety);

  const totalEnergy = 0.5 * eqInductance * I * I;

  if (I > 0) {
    steps.push({
      stepNumber: 2,
      title: 'Calculate Total Magnetic Stored Energy',
      formula: 'E_total = ½ L_eq × I_total²',
      substitution: `E_total = ½ × ${formatQuantity(eqInductance, 'inductance')} × (${formatQuantity(I, 'current')})²`,
      result: totalEnergy >= 1 ? `${totalEnergy.toFixed(3)} J` : `${(totalEnergy * 1000).toFixed(3)} mJ`,
    });
  }

  // Current splits inversely with inductance: I_i = I_total * (L_eq / L_i)
  const breakdown = validInductors.map((l, idx) => {
    const iBranch = eqInductance > 0 && l > 0 ? I * (eqInductance / l) : 0;
    const e = 0.5 * l * iBranch * iBranch;
    return {
      index: idx + 1,
      inductance: l,
      current: iBranch,
      energyJoules: e,
    };
  });

  return {
    primaryValue: eqInductance,
    formattedValue: formatQuantity(eqInductance, 'inductance'),
    unit: 'H',
    label: 'Equivalent Parallel Inductance (L_eq)',
    warnings,
    steps,
    additionalOutputs: {
      totalEnergy: {
        label: 'Stored Magnetic Energy',
        value: totalEnergy >= 1 ? `${totalEnergy.toFixed(3)} J` : `${(totalEnergy * 1000).toFixed(3)} mJ`,
        unit: 'J',
      },
      totalCurrent: {
        label: 'Total Current',
        value: formatQuantity(I, 'current'),
        unit: 'A',
      },
      inductorCount: {
        label: 'Parallel Inductors',
        value: validInductors.length.toString(),
      },
    },
    visualData: {
      inductors: validInductors,
      equivalentInductance: eqInductance,
      totalCurrent: I,
      totalEnergy,
      breakdown,
    },
  };
}
