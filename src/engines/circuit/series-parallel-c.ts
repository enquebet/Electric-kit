import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { checkVoltageSafety } from '../../lib/safety/disclaimers';

export interface SeriesCapacitorInputs {
  capacitors: number[]; // Base Farads
  voltage?: number;     // Total applied voltage (V)
}

export function calculateSeriesCapacitors(inputs: SeriesCapacitorInputs): CalculationResult {
  const { capacitors, voltage = 0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const validCaps = (capacitors.length > 0 ? capacitors : [10e-6, 10e-6])
    .filter(c => Number.isFinite(c) && c > 0);

  if (validCaps.length === 0) {
    validCaps.push(10e-6, 10e-6);
  }

  // 1 / C_eq = sum(1 / C_i)
  const sumReciprocals = validCaps.reduce((sum, c) => sum + (1 / c), 0);
  const eqCapacitance = sumReciprocals > 0 ? 1 / sumReciprocals : 0;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Equivalent Series Capacitance',
    formula: '1 / C_eq = 1/C₁ + 1/C₂ + ... + 1/C_n',
    substitution: `1 / C_eq = ${validCaps.map(c => `1/${formatQuantity(c, 'capacitance')}`).join(' + ')}`,
    result: formatQuantity(eqCapacitance, 'capacitance'),
    annotation: 'Capacitors in series divide voltage; equivalent capacitance is always less than the smallest capacitor.',
  });

  const V = Number.isFinite(voltage) && voltage >= 0 ? voltage : 0;
  const vSafety = checkVoltageSafety(V);
  if (vSafety) warnings.push(vSafety);

  // In series, identical charge Q flows onto each plate
  const totalCharge = eqCapacitance * V; // Coulombs
  const totalEnergy = 0.5 * eqCapacitance * V * V; // Joules

  if (V > 0) {
    steps.push({
      stepNumber: 2,
      title: 'Calculate Conserved Series Charge',
      formula: 'Q_total = C_eq × V_total',
      substitution: `Q_total = ${formatQuantity(eqCapacitance, 'capacitance')} × ${formatQuantity(V, 'voltage')}`,
      result: `${(totalCharge * 1e6).toFixed(3)} µC (${totalCharge.toExponential(3)} C)`,
    });
  }

  const breakdown = validCaps.map((c, idx) => {
    const vDrop = eqCapacitance > 0 && c > 0 ? (totalCharge / c) : 0;
    const energy = 0.5 * c * vDrop * vDrop;
    return {
      index: idx + 1,
      capacitance: c,
      voltageDrop: vDrop,
      charge: totalCharge,
      energyJoules: energy,
    };
  });

  // Voltage stress warning: if one capacitor has significantly smaller value, it sees disproportionate voltage
  if (validCaps.length > 1 && V > 0) {
    const maxDrop = Math.max(...breakdown.map(b => b.voltageDrop));
    if (maxDrop > 0.8 * V && validCaps.length > 1) {
      warnings.push({
        severity: 'warning',
        title: 'Asymmetric Voltage Stress',
        message: `The smallest capacitor in the series string withstands ${(maxDrop / V * 100).toFixed(0)}% (${formatQuantity(maxDrop, 'voltage')}) of the total applied voltage. Ensure rated breakdown voltage exceeds this value.`,
      });
    }
  }

  return {
    primaryValue: eqCapacitance,
    formattedValue: formatQuantity(eqCapacitance, 'capacitance'),
    unit: 'F',
    label: 'Equivalent Series Capacitance (C_eq)',
    warnings,
    steps,
    additionalOutputs: {
      totalCharge: {
        label: 'Conserved Charge (Q)',
        value: `${(totalCharge * 1e6).toFixed(3)} µC`,
        unit: 'C',
      },
      totalEnergy: {
        label: 'Total Stored Energy',
        value: totalEnergy >= 1 ? `${totalEnergy.toFixed(3)} J` : `${(totalEnergy * 1000).toFixed(3)} mJ`,
        unit: 'J',
      },
      capacitorCount: {
        label: 'Capacitors in Series',
        value: validCaps.length.toString(),
      },
    },
    visualData: {
      capacitors: validCaps,
      equivalentCapacitance: eqCapacitance,
      voltage: V,
      totalCharge,
      totalEnergy,
      breakdown,
    },
  };
}

export interface ParallelCapacitorInputs {
  capacitors: number[]; // Base Farads
  voltage?: number;     // Supply voltage (V)
}

export function calculateParallelCapacitors(inputs: ParallelCapacitorInputs): CalculationResult {
  const { capacitors, voltage = 0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const validCaps = (capacitors.length > 0 ? capacitors : [10e-6, 10e-6])
    .filter(c => Number.isFinite(c) && c >= 0);

  if (validCaps.length === 0) {
    validCaps.push(10e-6, 10e-6);
  }

  // C_eq = sum(C_i)
  const totalCapacitance = validCaps.reduce((sum, c) => sum + c, 0);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Equivalent Parallel Capacitance',
    formula: 'C_eq = C₁ + C₂ + ... + C_n',
    substitution: `C_eq = ${validCaps.map(c => formatQuantity(c, 'capacitance')).join(' + ')}`,
    result: formatQuantity(totalCapacitance, 'capacitance'),
    annotation: 'Capacitors in parallel share the same potential and their plate areas add directly.',
  });

  const V = Number.isFinite(voltage) && voltage >= 0 ? voltage : 0;
  const vSafety = checkVoltageSafety(V);
  if (vSafety) warnings.push(vSafety);

  const totalCharge = totalCapacitance * V;
  const totalEnergy = 0.5 * totalCapacitance * V * V;

  if (V > 0) {
    steps.push({
      stepNumber: 2,
      title: 'Calculate Total Stored Charge & Energy',
      formula: 'Q_total = C_eq × V ;   E_total = ½ C_eq × V²',
      substitution: `E = ½ × ${formatQuantity(totalCapacitance, 'capacitance')} × (${formatQuantity(V, 'voltage')})²`,
      result: `${totalEnergy >= 1 ? totalEnergy.toFixed(3) + ' J' : (totalEnergy * 1000).toFixed(3) + ' mJ'} (${(totalCharge * 1e6).toFixed(3)} µC)`,
    });
  }

  const breakdown = validCaps.map((c, idx) => {
    const q = c * V;
    const e = 0.5 * c * V * V;
    return {
      index: idx + 1,
      capacitance: c,
      voltage: V,
      charge: q,
      energyJoules: e,
    };
  });

  return {
    primaryValue: totalCapacitance,
    formattedValue: formatQuantity(totalCapacitance, 'capacitance'),
    unit: 'F',
    label: 'Total Parallel Capacitance (C_eq)',
    warnings,
    steps,
    additionalOutputs: {
      totalCharge: {
        label: 'Total Charge (Q_total)',
        value: `${(totalCharge * 1e6).toFixed(3)} µC`,
        unit: 'C',
      },
      totalEnergy: {
        label: 'Total Stored Energy',
        value: totalEnergy >= 1 ? `${totalEnergy.toFixed(3)} J` : `${(totalEnergy * 1000).toFixed(3)} mJ`,
        unit: 'J',
      },
      capacitorCount: {
        label: 'Parallel Capacitors',
        value: validCaps.length.toString(),
      },
    },
    visualData: {
      capacitors: validCaps,
      equivalentCapacitance: totalCapacitance,
      voltage: V,
      totalCharge,
      totalEnergy,
      breakdown,
    },
  };
}
