import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';

export interface CapacitorEnergyInputs {
  capacitance: number; // Farads
  voltage: number;     // Volts
}

export function calculateCapacitorEnergy(inputs: CapacitorEnergyInputs): CalculationResult {
  const { capacitance, voltage } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const C = Number.isFinite(capacitance) && capacitance > 0 ? capacitance : 100e-6;
  const V = Number.isFinite(voltage) ? voltage : 50;

  // E = 0.5 * C * V^2
  const energyJoules = 0.5 * C * V * V;
  // Charge Q = C * V
  const chargeCoulombs = C * Math.abs(V);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Stored Electrostatic Energy',
    formula: 'E = ½ × C × V²',
    substitution: `E = ½ × ${formatQuantity(C, 'capacitance')} × (${formatQuantity(V, 'voltage')})²`,
    result: `${energyJoules >= 1 ? energyJoules.toFixed(4) + ' J' : (energyJoules * 1000).toFixed(3) + ' mJ'}`,
    annotation: 'Energy stored in the electric field established across the dielectric medium.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Accumulated Electric Charge',
    formula: 'Q = C × V',
    substitution: `Q = ${formatQuantity(C, 'capacitance')} × ${formatQuantity(V, 'voltage')}`,
    result: `${(chargeCoulombs * 1e3).toFixed(3)} mC (${chargeCoulombs.toExponential(3)} Coulombs)`,
  });

  if (energyJoules > 10) {
    warnings.push({
      severity: 'danger',
      title: 'High Energy Discharge Shock / Arc Flash Hazard',
      message: `Stored electrostatic energy (${energyJoules.toFixed(1)} Joules) exceeds the 10-J lethal ventricular fibrillation safety threshold. Implement bleeder discharge resistors and lock-out ground sticks.`,
    });
  }

  return {
    primaryValue: energyJoules,
    formattedValue: energyJoules >= 1 ? `${energyJoules.toFixed(3)} J` : `${(energyJoules * 1000).toFixed(3)} mJ`,
    unit: 'J',
    label: 'Capacitor Stored Energy (E)',
    warnings,
    steps,
    additionalOutputs: {
      charge: {
        label: 'Accumulated Charge (Q)',
        value: `${(chargeCoulombs * 1000).toFixed(3)} mC`,
        unit: 'C',
      },
      wattHours: {
        label: 'Watt-Hours (Wh)',
        value: `${(energyJoules / 3600).toExponential(4)} Wh`,
        unit: 'Wh',
      },
      capacitance: {
        label: 'Capacitance (C)',
        value: formatQuantity(C, 'capacitance'),
        unit: 'F',
      },
      terminalVoltage: {
        label: 'Terminal Voltage (V)',
        value: formatQuantity(V, 'voltage'),
        unit: 'V',
      },
    },
    visualData: {
      C,
      V,
      energyJoules,
      chargeCoulombs,
    },
  };
}

export interface InductorEnergyInputs {
  inductance: number; // Henries
  current: number;    // Amperes
}

export function calculateInductorEnergy(inputs: InductorEnergyInputs): CalculationResult {
  const { inductance, current } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const L = Number.isFinite(inductance) && inductance > 0 ? inductance : 10e-3;
  const I = Number.isFinite(current) ? current : 2.0;

  // E = 0.5 * L * I^2
  const energyJoules = 0.5 * L * I * I;
  // Magnetic flux linkage: lambda = L * I (Weber-turns)
  const fluxLinkage = L * Math.abs(I);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Stored Magnetic Energy',
    formula: 'E = ½ × L × I²',
    substitution: `E = ½ × ${formatQuantity(L, 'inductance')} × (${formatQuantity(I, 'current')})²`,
    result: `${energyJoules >= 1 ? energyJoules.toFixed(4) + ' J' : (energyJoules * 1000).toFixed(3) + ' mJ'}`,
    annotation: 'Energy stored within the magnetic core and air-gap magnetic flux lines.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Magnetic Flux Linkage (λ)',
    formula: 'λ = L × I',
    substitution: `λ = ${formatQuantity(L, 'inductance')} × ${formatQuantity(I, 'current')}`,
    result: `${(fluxLinkage * 1000).toFixed(3)} mWb-turns`,
  });

  if (energyJoules > 1.0) {
    warnings.push({
      severity: 'warning',
      title: 'High Inductive Flyback Energy',
      message: `Abruptly opening this inductor loop will release ${energyJoules.toFixed(2)} J of inductive kickback energy. A freewheeling flyback diode, snubber, or TVS diode is required to prevent contact arcing or switch avalanche breakdown.`,
    });
  }

  return {
    primaryValue: energyJoules,
    formattedValue: energyJoules >= 1 ? `${energyJoules.toFixed(3)} J` : `${(energyJoules * 1000).toFixed(3)} mJ`,
    unit: 'J',
    label: 'Inductor Stored Energy (E)',
    warnings,
    steps,
    additionalOutputs: {
      fluxLinkage: {
        label: 'Flux Linkage (λ)',
        value: `${(fluxLinkage * 1000).toFixed(3)} mWb`,
        unit: 'Wb',
      },
      inductance: {
        label: 'Inductance (L)',
        value: formatQuantity(L, 'inductance'),
        unit: 'H',
      },
      current: {
        label: 'Operating Current (I)',
        value: formatQuantity(I, 'current'),
        unit: 'A',
      },
    },
    visualData: {
      L,
      I,
      energyJoules,
      fluxLinkage,
    },
  };
}

export interface ResistorEnergyInputs {
  resistance: number; // Ohms
  voltage?: number;   // Volts (optional if current given)
  current?: number;   // Amperes (optional if voltage given)
  durationSeconds: number; // Time in seconds
}

export function calculateResistorEnergy(inputs: ResistorEnergyInputs): CalculationResult {
  const { resistance, voltage, current, durationSeconds } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const R = Number.isFinite(resistance) && resistance > 0 ? resistance : 100;
  const t = Number.isFinite(durationSeconds) && durationSeconds >= 0 ? durationSeconds : 60;

  let V = 0;
  let I = 0;
  let P = 0;

  if (voltage !== undefined && Number.isFinite(voltage)) {
    V = voltage;
    I = V / R;
    P = (V * V) / R;
  } else if (current !== undefined && Number.isFinite(current)) {
    I = current;
    V = I * R;
    P = I * I * R;
  } else {
    V = 5.0;
    I = 5.0 / R;
    P = 25.0 / R;
  }

  // Energy E = P * t (Joules)
  const energyJoules = P * t;
  const calories = energyJoules / 4.184; // Thermochemical calories
  const wattHours = energyJoules / 3600;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Steady-State Power Dissipation',
    formula: 'P = V² / R = I² × R',
    substitution: `P = (${formatQuantity(V, 'voltage')})² / ${formatQuantity(R, 'resistance')}`,
    result: formatQuantity(P, 'power'),
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Integrated Thermal Heat Dissipation (Energy)',
    formula: 'E = P × t',
    substitution: `E = ${formatQuantity(P, 'power')} × ${t.toFixed(1)} s`,
    result: `${energyJoules >= 1000 ? (energyJoules / 1000).toFixed(3) + ' kJ' : energyJoules.toFixed(3) + ' J'} (${calories.toFixed(1)} cal)`,
  });

  if (P > 2.0) {
    warnings.push({
      severity: 'warning',
      title: 'High Thermal Power Dissipation',
      message: `Continuous thermal dissipation is ${formatQuantity(P, 'power')}. Standard 0.25W / 0.5W through-hole or SMD resistors will burn out; use a chassis-mount wirewound power resistor.`,
    });
  }

  return {
    primaryValue: energyJoules,
    formattedValue: energyJoules >= 1000 ? `${(energyJoules / 1000).toFixed(3)} kJ` : `${energyJoules.toFixed(2)} J`,
    unit: 'J',
    label: 'Resistor Thermal Energy (Heat)',
    warnings,
    steps,
    additionalOutputs: {
      powerWatts: {
        label: 'Continuous Dissipation Rate (P)',
        value: formatQuantity(P, 'power'),
        unit: 'W',
      },
      wattHours: {
        label: 'Energy (Watt-Hours)',
        value: `${wattHours.toFixed(4)} Wh`,
        unit: 'Wh',
      },
      heatCalories: {
        label: 'Thermal Calories',
        value: `${calories.toFixed(1)} cal`,
      },
      duration: {
        label: 'Duration (t)',
        value: `${t.toFixed(1)} s`,
        unit: 's',
      },
    },
    visualData: {
      R,
      V,
      I,
      P,
      t,
      energyJoules,
      calories,
    },
  };
}
