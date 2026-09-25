import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';

export interface ResistorImpedanceInputs {
  resistance: number; // Base Ohms
  frequency?: number; // Optional frequency (Hz)
}

export function calculateResistorImpedance(inputs: ResistorImpedanceInputs): CalculationResult {
  const { resistance, frequency = 1000 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const R = Number.isFinite(resistance) && resistance >= 0 ? resistance : 100;
  const f = Number.isFinite(frequency) && frequency >= 0 ? frequency : 1000;

  // For ideal resistor, Z = R + j0, magnitude = R, phase = 0 deg
  const magnitude = R;
  const phaseDeg = 0;
  const conductance = R > 0 ? 1 / R : Infinity;

  steps.push({
    stepNumber: 1,
    title: 'Determine Ideal Resistor AC Impedance',
    formula: 'Z = R + j0 = R ∠ 0°',
    substitution: `Z = ${formatQuantity(R, 'resistance')} + j0 Ω = ${formatQuantity(R, 'resistance')} ∠ 0.0°`,
    result: `${formatQuantity(R, 'resistance')} ∠ 0.0°`,
    annotation: 'In an ideal resistor, current and voltage are perfectly in-phase (0° phase shift). Power factor is 1.0 (unity).',
  });

  return {
    primaryValue: magnitude,
    formattedValue: `${formatQuantity(magnitude, 'resistance')} ∠ 0.0°`,
    unit: 'Ω',
    label: 'Resistor Complex Impedance (Z)',
    warnings,
    steps,
    additionalOutputs: {
      magnitude: {
        label: 'Impedance Magnitude (|Z|)',
        value: formatQuantity(magnitude, 'resistance'),
        unit: 'Ω',
      },
      phase: {
        label: 'Phase Angle (θ)',
        value: '0.00° (0 rad)',
      },
      rectangular: {
        label: 'Rectangular Form (R + jX)',
        value: `${formatQuantity(R, 'resistance')} + j0.00 Ω`,
      },
      polar: {
        label: 'Polar Form (|Z| ∠ θ)',
        value: `${formatQuantity(magnitude, 'resistance')} ∠ 0.00°`,
      },
      admittance: {
        label: 'Complex Admittance (Y = 1/Z)',
        value: Number.isFinite(conductance) ? `${(conductance * 1000).toFixed(3)} mS + j0` : 'Infinity',
        unit: 'S',
      },
      powerFactor: {
        label: 'Power Factor (cos θ)',
        value: '1.000 (Unity)',
      },
    },
    visualData: {
      resistance: R,
      frequency: f,
      real: R,
      imag: 0,
      magnitude,
      phaseDeg,
    },
  };
}

export interface CapacitorImpedanceInputs {
  capacitance: number; // Base Farads
  frequency: number;   // Base Hertz
}

export function calculateCapacitorImpedance(inputs: CapacitorImpedanceInputs): CalculationResult {
  const { capacitance, frequency } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const C = Number.isFinite(capacitance) && capacitance > 0 ? capacitance : 1e-6;
  const f = Number.isFinite(frequency) && frequency >= 0 ? frequency : 1000;

  if (f === 0) {
    warnings.push({
      severity: 'info',
      title: 'DC Static Condition (f = 0 Hz)',
      message: 'Capacitors act as an open-circuit to DC steady-state (|Z_C| = ∞).',
    });
  }

  const omega = 2 * Math.PI * f;
  const xc = f > 0 ? 1 / (omega * C) : Infinity; // Magnitude of reactance
  const magnitude = xc;
  const phaseDeg = -90; // Current leads voltage by 90 deg -> voltage lags current by -90 deg
  const susceptance = f > 0 ? omega * C : 0; // Y = j * omega * C

  steps.push({
    stepNumber: 1,
    title: 'Calculate Angular Frequency & Capacitive Reactance',
    formula: 'ω = 2πf ;   X_C = 1 / (ω × C)',
    substitution: `ω = 2π × ${formatQuantity(f, 'frequency')} = ${omega.toFixed(1)} rad/s ;   X_C = 1 / (${omega.toFixed(1)} × ${formatQuantity(C, 'capacitance')})`,
    result: `X_C = ${Number.isFinite(xc) ? formatQuantity(xc, 'resistance') : 'Infinity'}`,
    annotation: 'Capacitive reactance decreases inversely with increasing frequency, shunting high frequencies.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Express in Rectangular & Polar Forms',
    formula: 'Z_C = 0 - j × X_C = |X_C| ∠ -90°',
    substitution: `Z_C = 0 - j(${Number.isFinite(xc) ? formatQuantity(xc, 'resistance') : '∞'}) = ${Number.isFinite(xc) ? formatQuantity(xc, 'resistance') : '∞'} ∠ -90°`,
    result: `${Number.isFinite(xc) ? formatQuantity(xc, 'resistance') : 'Infinity'} ∠ -90.0°`,
  });

  return {
    primaryValue: Number.isFinite(magnitude) ? magnitude : 0,
    formattedValue: Number.isFinite(magnitude) ? `${formatQuantity(magnitude, 'resistance')} ∠ -90.0°` : '∞ ∠ -90°',
    unit: 'Ω',
    label: 'Capacitor Complex Impedance (Z_C)',
    warnings,
    steps,
    additionalOutputs: {
      magnitude: {
        label: 'Impedance Magnitude (|Z_C|)',
        value: Number.isFinite(magnitude) ? formatQuantity(magnitude, 'resistance') : 'Infinity',
        unit: 'Ω',
      },
      phase: {
        label: 'Phase Angle (θ)',
        value: '-90.00° (-π/2 rad)',
      },
      rectangular: {
        label: 'Rectangular Form (R + jX)',
        value: Number.isFinite(xc) ? `0.00 - j ${formatQuantity(xc, 'resistance')}` : '0 - j ∞',
      },
      polar: {
        label: 'Polar Form (|Z| ∠ θ)',
        value: Number.isFinite(magnitude) ? `${formatQuantity(magnitude, 'resistance')} ∠ -90.00°` : '∞ ∠ -90°',
      },
      admittance: {
        label: 'Admittance (Y = jωC)',
        value: `+j ${(susceptance * 1000).toFixed(4)} mS`,
        unit: 'S',
      },
      leadLag: {
        label: 'Phase Relationship',
        value: 'Purely Capacitive (Current leads by 90°)',
      },
    },
    visualData: {
      capacitance: C,
      frequency: f,
      real: 0,
      imag: -xc,
      magnitude,
      phaseDeg,
    },
  };
}

export interface InductorImpedanceInputs {
  inductance: number; // Base Henries
  frequency: number;  // Base Hertz
}

export function calculateInductorImpedance(inputs: InductorImpedanceInputs): CalculationResult {
  const { inductance, frequency } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const L = Number.isFinite(inductance) && inductance >= 0 ? inductance : 10e-3;
  const f = Number.isFinite(frequency) && frequency >= 0 ? frequency : 1000;

  if (f === 0) {
    warnings.push({
      severity: 'info',
      title: 'DC Static Condition (f = 0 Hz)',
      message: 'Ideal inductors act as a short-circuit to DC steady-state (|Z_L| = 0 Ω).',
    });
  }

  const omega = 2 * Math.PI * f;
  const xl = omega * L; // Reactance in Ohms
  const magnitude = xl;
  const phaseDeg = 90; // Voltage leads current by +90 deg
  const susceptance = xl > 0 ? -1 / xl : -Infinity; // Y = -j / (omega * L)

  steps.push({
    stepNumber: 1,
    title: 'Calculate Angular Frequency & Inductive Reactance',
    formula: 'ω = 2πf ;   X_L = ω × L = 2πfL',
    substitution: `X_L = 2π × ${formatQuantity(f, 'frequency')} × ${formatQuantity(L, 'inductance')}`,
    result: `X_L = ${formatQuantity(xl, 'resistance')}`,
    annotation: 'Inductive reactance scales directly with frequency, blocking higher frequency components.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Express in Rectangular & Polar Forms',
    formula: 'Z_L = 0 + j × X_L = |X_L| ∠ +90°',
    substitution: `Z_L = 0 + j(${formatQuantity(xl, 'resistance')}) = ${formatQuantity(xl, 'resistance')} ∠ +90°`,
    result: `${formatQuantity(xl, 'resistance')} ∠ +90.0°`,
  });

  return {
    primaryValue: magnitude,
    formattedValue: `${formatQuantity(magnitude, 'resistance')} ∠ +90.0°`,
    unit: 'Ω',
    label: 'Inductor Complex Impedance (Z_L)',
    warnings,
    steps,
    additionalOutputs: {
      magnitude: {
        label: 'Impedance Magnitude (|Z_L|)',
        value: formatQuantity(magnitude, 'resistance'),
        unit: 'Ω',
      },
      phase: {
        label: 'Phase Angle (θ)',
        value: '+90.00° (+π/2 rad)',
      },
      rectangular: {
        label: 'Rectangular Form (R + jX)',
        value: `0.00 + j ${formatQuantity(xl, 'resistance')}`,
      },
      polar: {
        label: 'Polar Form (|Z| ∠ θ)',
        value: `${formatQuantity(magnitude, 'resistance')} ∠ +90.00°`,
      },
      admittance: {
        label: 'Admittance (Y = -j / ωL)',
        value: Number.isFinite(susceptance) ? `-j ${(Math.abs(susceptance) * 1000).toFixed(4)} mS` : 'Infinity',
        unit: 'S',
      },
      leadLag: {
        label: 'Phase Relationship',
        value: 'Purely Inductive (Voltage leads by 90°)',
      },
    },
    visualData: {
      inductance: L,
      frequency: f,
      real: 0,
      imag: xl,
      magnitude,
      phaseDeg,
    },
  };
}

export interface RlcImpedanceInputs {
  resistance: number;  // Base Ohms
  inductance: number;  // Base Henries
  capacitance: number; // Base Farads
  frequency: number;   // Base Hertz
  topology?: 'series' | 'parallel';
}

export function calculateRlcImpedance(inputs: RlcImpedanceInputs): CalculationResult {
  const { resistance, inductance, capacitance, frequency, topology = 'series' } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const R = Number.isFinite(resistance) && resistance >= 0 ? resistance : 100;
  const L = Number.isFinite(inductance) && inductance > 0 ? inductance : 10e-3;
  const C = Number.isFinite(capacitance) && capacitance > 0 ? capacitance : 1e-6;
  const f = Number.isFinite(frequency) && frequency > 0 ? frequency : 1000;

  const omega = 2 * Math.PI * f;
  const xl = omega * L;
  const xc = 1 / (omega * C);

  let realZ = 0;
  let imagZ = 0;
  let magnitude = 0;
  let phaseDeg = 0;
  let realY = 0;
  let imagY = 0;

  if (topology === 'series') {
    // Series RLC: Z = R + j(XL - XC)
    realZ = R;
    imagZ = xl - xc;
    magnitude = Math.sqrt(realZ * realZ + imagZ * imagZ);
    phaseDeg = Math.atan2(imagZ, realZ) * (180 / Math.PI);

    // Admittance Y = 1 / Z
    if (magnitude > 0) {
      realY = realZ / (magnitude * magnitude);
      imagY = -imagZ / (magnitude * magnitude);
    }

    steps.push({
      stepNumber: 1,
      title: 'Calculate Individual Reactances',
      formula: 'X_L = 2πfL ;   X_C = 1 / (2πfC)',
      substitution: `X_L = ${formatQuantity(xl, 'resistance')} ;   X_C = ${formatQuantity(xc, 'resistance')}`,
      result: `Net Series Reactance X = X_L - X_C = ${formatQuantity(imagZ, 'resistance')}`,
    });

    steps.push({
      stepNumber: 2,
      title: 'Calculate Total Series Impedance & Phase',
      formula: '|Z| = √[ R² + (X_L - X_C)² ] ;   θ = arctan[(X_L - X_C) / R]',
      substitution: `|Z| = √[ (${formatQuantity(R, 'resistance')})² + (${formatQuantity(imagZ, 'resistance')})² ]`,
      result: `|Z| = ${formatQuantity(magnitude, 'resistance')} ∠ ${phaseDeg.toFixed(2)}°`,
    });
  } else {
    // Parallel RLC:
    // Admittance Y = 1/R + j(1/XC - 1/XL) = G + j(BC - BL) where BC = omega C, BL = 1/(omega L)
    realY = R > 0 ? 1 / R : 0;
    imagY = (omega * C) - (1 / (omega * L));
    const magY = Math.sqrt(realY * realY + imagY * imagY);

    if (magY > 0) {
      magnitude = 1 / magY;
      // Z = 1 / Y -> phase(Z) = -phase(Y)
      const phaseYDeg = Math.atan2(imagY, realY) * (180 / Math.PI);
      phaseDeg = -phaseYDeg;
      realZ = magnitude * Math.cos(phaseDeg * Math.PI / 180);
      imagZ = magnitude * Math.sin(phaseDeg * Math.PI / 180);
    }

    steps.push({
      stepNumber: 1,
      title: 'Calculate Branch Admittances (Y = 1/Z)',
      formula: 'Y = G + j(B_C - B_L) = 1/R + j(ωC - 1/ωL)',
      substitution: `G = ${( (1/R) * 1000).toFixed(3)} mS ;   B_C = ${(omega * C * 1000).toFixed(3)} mS ;   B_L = ${( (1 / (omega * L)) * 1000).toFixed(3)} mS`,
      result: `|Y| = ${(magY * 1000).toFixed(3)} mS`,
    });

    steps.push({
      stepNumber: 2,
      title: 'Invert Admittance to Obtain Equivalent Impedance',
      formula: 'Z_eq = 1 / Y_total',
      substitution: `Z_eq = 1 / ${(magY * 1000).toFixed(3)} mS`,
      result: `|Z| = ${formatQuantity(magnitude, 'resistance')} ∠ ${phaseDeg.toFixed(2)}°`,
    });
  }

  const pf = Math.cos(phaseDeg * Math.PI / 180);
  const nature = Math.abs(imagZ) < 1e-4
    ? 'Resonant (Purely Resistive)'
    : imagZ > 0
    ? 'Inductive (Current lags Voltage)'
    : 'Capacitive (Current leads Voltage)';

  return {
    primaryValue: magnitude,
    formattedValue: `${formatQuantity(magnitude, 'resistance')} ∠ ${phaseDeg.toFixed(1)}°`,
    unit: 'Ω',
    label: `${topology === 'series' ? 'Series' : 'Parallel'} RLC Impedance (Z)`,
    warnings,
    steps,
    additionalOutputs: {
      magnitude: {
        label: 'Total Impedance Magnitude (|Z|)',
        value: formatQuantity(magnitude, 'resistance'),
        unit: 'Ω',
      },
      phase: {
        label: 'Phase Angle (θ)',
        value: `${phaseDeg.toFixed(2)}° (${(phaseDeg * Math.PI / 180).toFixed(3)} rad)`,
      },
      realPart: {
        label: 'Real Resistance (R)',
        value: formatQuantity(realZ, 'resistance'),
        unit: 'Ω',
      },
      imagPart: {
        label: 'Net Reactance (X)',
        value: `${imagZ >= 0 ? '+' : ''}${formatQuantity(imagZ, 'resistance')}`,
        unit: 'Ω',
      },
      admittanceMag: {
        label: 'Admittance (|Y| = 1/|Z|)',
        value: `${(1 / magnitude * 1000).toFixed(4)} mS`,
        unit: 'S',
      },
      powerFactor: {
        label: 'Power Factor (cos θ)',
        value: `${Math.abs(pf).toFixed(4)} (${pf >= 0 ? 'Lagging/Lead' : 'Negative'})`,
      },
      circuitCharacter: {
        label: 'Circuit Characteristic',
        value: nature,
      },
    },
    visualData: {
      topology,
      R,
      L,
      C,
      frequency: f,
      xl,
      xc,
      realZ,
      imagZ,
      magnitude,
      phaseDeg,
      powerFactor: pf,
    },
  };
}
